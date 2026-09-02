import React, { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { friendlyDbError } from '@/lib/utils'
import {
  Card, Button, Input, Select, Modal, Table, Th, Td, Badge,
  Spinner, EmptyState, CardHeader,
} from '@/components/ui'
import { Plus, Edit2, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { moduleLevel } from '@/lib/auth'

// The physical rows of cages inside a shed, under side A/B/C/D. Loaded from
// the owner's line sheets (Kethireddypally as boxes per line, Agraharam as
// capacity birds per line); Bodjanampet-1 and -2 are deliberately not loaded
// yet -- one sheet did not reconcile and the other was reported as wrong.
//
// Access is gated by the 'line_master' module, NOT by 'masters': admin edits,
// shed supervisor / site manager / site incharge view. Read-only users get the
// same page with every control disabled. The database enforces the same rule
// through the shed_lines row policies (migration 1128), so hiding the buttons
// here is a convenience, not the protection.

const SIDES = ['A', 'B', 'C', 'D']

export const LineMaster: React.FC = () => {
  const qc = useQueryClient()
  const canEdit = moduleLevel('line_master') === 'full'

  const [farmFilter, setFarmFilter] = useState('')
  const [shedFilter, setShedFilter] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [deleteRow, setDeleteRow] = useState<any>(null)
  const [form, setForm] = useState({
    shed_id: '', side: 'A', line_no: '', boxes: '',
    capacity_female: '', capacity_male: '', is_provisional: true, remarks: '',
  })
  const s = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  const { data: farms } = useQuery({
    queryKey: ['farms_for_lines'],
    queryFn: async () => {
      const { data } = await supabase.from('farms').select('id,name').order('name')
      return data ?? []
    },
  })

  const { data: sheds } = useQuery({
    queryKey: ['sheds_for_lines', farmFilter],
    queryFn: async () => {
      let q = supabase.from('sheds').select('id,shed_no,shed_name,farm_id,total_boxes,farms(name)')
      if (farmFilter) q = q.eq('farm_id', farmFilter)
      const { data } = await q
      // shed_no is TEXT, so sort numerically rather than as strings, otherwise
      // shed 10 sorts before shed 2.
      return (data ?? []).sort((a: any, b: any) =>
        (parseInt(a.shed_no, 10) || 0) - (parseInt(b.shed_no, 10) || 0))
    },
  })

  const { data: lines, isLoading } = useQuery({
    queryKey: ['shed_lines', farmFilter, shedFilter],
    queryFn: async () => {
      let q = supabase.from('shed_lines')
        .select('*, sheds(shed_no,shed_name,farm_id,total_boxes,farms(name))')
      if (shedFilter) q = q.eq('shed_id', shedFilter)
      const { data } = await q
      let rows = data ?? []
      if (farmFilter && !shedFilter) rows = rows.filter((r: any) => r.sheds?.farm_id === farmFilter)
      return rows.sort((a: any, b: any) => {
        const fa = a.sheds?.farms?.name ?? '', fb = b.sheds?.farms?.name ?? ''
        if (fa !== fb) return fa < fb ? -1 : 1
        const sa = parseInt(a.sheds?.shed_no ?? '0', 10), sb = parseInt(b.sheds?.shed_no ?? '0', 10)
        if (sa !== sb) return sa - sb
        if (a.side !== b.side) return a.side < b.side ? -1 : 1
        return a.line_no - b.line_no
      })
    },
  })

  // Grouped by shed so each shed shows its own subtotal against the shed
  // master's total_boxes -- the check that caught nothing wrong on load and
  // should keep catching it after edits.
  const groups = useMemo(() => {
    const m: Record<string, any> = {}
    for (const l of (lines ?? [])) {
      const key = l.shed_id
      if (!m[key]) m[key] = {
        shed: l.sheds, rows: [], boxes: 0, capF: 0, capM: 0,
      }
      m[key].rows.push(l)
      m[key].boxes += l.boxes ?? 0
      m[key].capF += l.capacity_female ?? 0
      m[key].capM += l.capacity_male ?? 0
    }
    return Object.values(m)
  }, [lines])

  const open = (row?: any) => {
    setEditing(row ?? null)
    setForm(row ? {
      shed_id: row.shed_id, side: row.side, line_no: String(row.line_no),
      boxes: row.boxes?.toString() ?? '',
      capacity_female: row.capacity_female?.toString() ?? '',
      capacity_male: row.capacity_male?.toString() ?? '',
      is_provisional: row.is_provisional ?? true,
      remarks: row.remarks ?? '',
    } : {
      shed_id: shedFilter || '', side: 'A', line_no: '', boxes: '',
      capacity_female: '', capacity_male: '', is_provisional: true, remarks: '',
    })
    setShowForm(true)
  }

  const num = (v: string) => v.trim() === '' ? null : Number(v)

  const mut = useMutation({
    mutationFn: async () => {
      if (!form.shed_id) throw new Error('Pick a shed')
      const lineNo = parseInt(form.line_no, 10)
      if (!(lineNo > 0)) throw new Error('Line number must be greater than 0')
      const payload = {
        shed_id: form.shed_id,
        side: form.side,
        line_no: lineNo,
        boxes: num(form.boxes),
        capacity_female: num(form.capacity_female),
        capacity_male: num(form.capacity_male),
        is_provisional: form.is_provisional,
        remarks: form.remarks || null,
      }
      const { error } = editing
        ? await supabase.from('shed_lines').update(payload).eq('id', editing.id)
        : await supabase.from('shed_lines').insert(payload)
      if (error) throw new Error(friendlyDbError(error))
    },
    onSuccess: () => {
      toast.success(editing ? 'Line updated' : 'Line added')
      qc.invalidateQueries({ queryKey: ['shed_lines'] })
      setShowForm(false)
    },
    onError: (e: any) => toast.error(e.message),
  })

  // Deleting a line takes its production, mortality and feed history with it
  // (ON DELETE CASCADE), and is blocked outright once medicine is booked
  // against it. Marking a line inactive is the safe way to retire one.
  const delMut = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('shed_lines').delete().eq('id', deleteRow.id)
      if (error) throw new Error(friendlyDbError(error))
    },
    onSuccess: () => {
      toast.success('Line deleted')
      qc.invalidateQueries({ queryKey: ['shed_lines'] })
      setDeleteRow(null)
    },
    onError: (e: any) => toast.error(e.message),
  })

  return (
    <div className="space-y-4">
      <CardHeader
        title="Line Master"
        subtitle="The cage lines inside each shed — boxes and bird capacity per line, by side"
        action={canEdit
          ? <Button icon={<Plus size={16} />} onClick={() => open()}>Add Line</Button>
          : <Badge color="gray">View only</Badge>}
      />

      <Card>
        <div className="flex flex-wrap gap-3">
          <div className="w-56">
            <Select label="Site" value={farmFilter}
              onChange={e => { setFarmFilter((e.target as HTMLSelectElement).value); setShedFilter('') }}
              options={[{ value: '', label: 'All sites' },
                ...(farms ?? []).map((f: any) => ({ value: f.id, label: f.name }))]} />
          </div>
          <div className="w-56">
            <Select label="Shed" value={shedFilter}
              onChange={e => setShedFilter((e.target as HTMLSelectElement).value)}
              options={[{ value: '', label: 'All sheds' },
                ...(sheds ?? []).map((sh: any) => ({
                  value: sh.id,
                  label: `${sh.farms?.name ?? ''} — Shed ${sh.shed_no}`,
                }))]} />
          </div>
        </div>
      </Card>

      {isLoading ? <Spinner /> : groups.length === 0 ? (
        <EmptyState title="No lines recorded"
          subtitle="Kethireddypally and Agraharam Potlapally are loaded. Bodjanampet-1 and Bodjanampet-2 are not — one sheet did not reconcile and the other was reported as having a mistake." />
      ) : groups.map((g: any) => {
        // The shed master holds one total; the lines should add up to it.
        // Shown side by side rather than silently, so a wrong edit is visible.
        const masterTotal = g.shed?.total_boxes ?? null
        const agrees = masterTotal != null && g.boxes > 0 && masterTotal === g.boxes
        return (
          <Card key={g.shed?.shed_no + (g.shed?.farm_id ?? '')} padding={false}>
            <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-800 text-sm">
                {g.shed?.farms?.name} — Shed {g.shed?.shed_no}
                {g.shed?.shed_name ? ` (${g.shed.shed_name})` : ''}
                <span className="ml-2 font-normal text-gray-500">{g.rows.length} lines</span>
              </h3>
              <div className="text-xs text-gray-600">
                {g.boxes > 0 && <>Boxes <strong>{g.boxes.toLocaleString('en-IN')}</strong>
                  {masterTotal != null && (
                    <span className={agrees ? 'text-green-600 ml-1' : 'text-amber-600 ml-1'}>
                      {agrees ? '= shed master' : `≠ shed master ${masterTotal.toLocaleString('en-IN')}`}
                    </span>
                  )}
                </>}
                {(g.capF > 0 || g.capM > 0) && <span className="ml-3">
                  Capacity <strong>{g.capF.toLocaleString('en-IN')}</strong> F
                  {g.capM > 0 && <> / <strong>{g.capM.toLocaleString('en-IN')}</strong> M</>}
                </span>}
              </div>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <thead><tr>
                  <Th>Side</Th><Th>Line</Th><Th right>Boxes</Th>
                  <Th right>Capacity F</Th><Th right>Capacity M</Th>
                  <Th>Status</Th><Th>Remarks</Th>{canEdit && <Th></Th>}
                </tr></thead>
                <tbody>
                  {g.rows.map((l: any) => (
                    <tr key={l.id} className="hover:bg-gray-50">
                      <Td><Badge color="blue">{l.side}</Badge></Td>
                      <Td>{l.line_no}</Td>
                      <Td right>{l.boxes ?? '—'}</Td>
                      <Td right>{l.capacity_female ?? '—'}</Td>
                      <Td right>{l.capacity_male ?? '—'}</Td>
                      <Td>{l.is_provisional
                        ? <Badge color="orange">Provisional</Badge>
                        : <Badge color="green">Confirmed</Badge>}</Td>
                      <Td className="text-xs text-gray-500">{l.remarks ?? ''}</Td>
                      {canEdit && (
                        <Td>
                          <div className="flex gap-2">
                            <button onClick={() => open(l)} className="text-brand-600 hover:text-brand-800">
                              <Edit2 size={14} />
                            </button>
                            <button onClick={() => setDeleteRow(l)} className="text-red-500 hover:text-red-700">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </Td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </Card>
        )
      })}

      <Modal open={showForm} onClose={() => setShowForm(false)} title={editing ? 'Edit Line' : 'Add Line'}>
        <div className="space-y-4">
          <Select label="Shed" value={form.shed_id}
            onChange={e => s('shed_id', (e.target as HTMLSelectElement).value)}
            options={[{ value: '', label: '— Select —' },
              ...(sheds ?? []).map((sh: any) => ({
                value: sh.id, label: `${sh.farms?.name ?? ''} — Shed ${sh.shed_no}`,
              }))]} />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Side" value={form.side}
              onChange={e => s('side', (e.target as HTMLSelectElement).value)}
              options={SIDES.map(x => ({ value: x, label: x }))} />
            <Input label="Line No" type="number" value={form.line_no}
              onChange={e => s('line_no', e.target.value)} />
          </div>
          <Input label="Boxes (cages on this line)" type="number" value={form.boxes}
            onChange={e => s('boxes', e.target.value)} placeholder="leave blank if not known" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Capacity Female" type="number" value={form.capacity_female}
              onChange={e => s('capacity_female', e.target.value)} />
            <Input label="Capacity Male" type="number" value={form.capacity_male}
              onChange={e => s('capacity_male', e.target.value)} />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.is_provisional}
              onChange={e => s('is_provisional', e.target.checked)}
              className="rounded border-gray-300 text-brand-600" />
            Provisional — an estimate still to be confirmed
          </label>
          <Input label="Remarks" value={form.remarks} onChange={e => s('remarks', e.target.value)} />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button loading={mut.isPending} onClick={() => mut.mutate()}>Save</Button>
          </div>
        </div>
      </Modal>

      <Modal open={!!deleteRow} onClose={() => setDeleteRow(null)} title="Delete this line?">
        <div className="space-y-4">
          <p className="text-sm text-gray-700">
            Side {deleteRow?.side}, line {deleteRow?.line_no}.
          </p>
          <p className="text-sm text-amber-700">
            Deleting a line also deletes every production, mortality and feed record
            entered against it. If the line simply went out of use, edit it and untick
            Provisional or mark it inactive instead — that keeps the history.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setDeleteRow(null)}>Cancel</Button>
            <Button variant="danger" loading={delMut.isPending} onClick={() => delMut.mutate()}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
