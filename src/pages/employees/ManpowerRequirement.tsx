import React, { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import {
  Card, Button, Input, Select, Modal, SectionHeader, Spinner, EmptyState,
  SearchableSelect, Table, Th, Td, Badge
} from '@/components/ui'
import { Plus, Trash2, Pencil, Users } from 'lucide-react'
import toast from 'react-hot-toast'

// How many people each site is SUPPOSED to have, by designation and gender.
//
// Nothing in the app held this before: it knew how many helpers there are, never
// how many are needed, so "short by two" could not be asked. Actual is counted
// from the employee records themselves rather than typed a second time — one
// number to keep up to date, not two that can disagree.
export const ManpowerRequirement: React.FC = () => {
  const qc = useQueryClient()
  const [farmFilter, setFarmFilter] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const blank = { farm_id: '', designation: '', gender: '', required_count: '', remarks: '' }
  const [form, setForm] = useState(blank)
  const s = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const { data: farms = [] } = useQuery({
    queryKey: ['mr_farms'],
    queryFn: async () => {
      const { data } = await supabase.from('farms').select('id,name,code').eq('is_active', true).order('name')
      return data ?? []
    }
  })

  const { data: employees = [] } = useQuery({
    queryKey: ['mr_employees'],
    queryFn: async () => {
      const { data } = await supabase.from('employees')
        .select('id,designation,gender,farm_id').eq('is_active', true)
      return data ?? []
    }
  })

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['manpower_requirement'],
    queryFn: async () => {
      const { data } = await supabase.from('manpower_requirement').select('*').order('designation')
      return data ?? []
    }
  })

  // Designations already in use, so the master is filled from the words the
  // farm actually uses on its employee records rather than freshly typed ones
  // that would then match nothing.
  const designationOptions = useMemo(() => {
    const set = new Set<string>()
    for (const e of employees as any[]) if (e.designation) set.add(e.designation)
    return [...set].sort().map(d => ({ value: d, label: d }))
  }, [employees])

  // Actual headcount for a requirement row. Designation is matched
  // case-insensitively and gender only when the requirement names one — a
  // requirement with no gender counts everyone in that designation.
  const actualFor = (r: any) => (employees as any[]).filter((e: any) =>
    e.farm_id === r.farm_id &&
    (e.designation ?? '').toLowerCase() === (r.designation ?? '').toLowerCase() &&
    (!r.gender || (e.gender ?? '') === r.gender)
  ).length

  const shown = useMemo(() => (rows as any[])
    .filter((r: any) => !farmFilter || r.farm_id === farmFilter)
    .map((r: any) => {
      const actual = actualFor(r)
      return { ...r, actual, short: Math.max(0, (r.required_count ?? 0) - actual),
               over: Math.max(0, actual - (r.required_count ?? 0)) }
    }), [rows, employees, farmFilter])

  const farmName = (id: string) => (farms as any[]).find((f: any) => f.id === id)?.name ?? '—'

  const saveMut = useMutation({
    mutationFn: async () => {
      if (!form.farm_id) throw new Error('Pick a site')
      if (!form.designation.trim()) throw new Error('Pick or type a designation')
      const n = parseInt(form.required_count)
      if (!isFinite(n) || n < 0) throw new Error('Required count must be 0 or more')
      const row = {
        farm_id: form.farm_id, designation: form.designation.trim(),
        gender: form.gender || null, required_count: n,
        remarks: form.remarks || null,
      }
      // One requirement per site + designation + gender. A second row for the
      // same three would give two answers to "how many are required".
      const q = editingId
        ? await supabase.from('manpower_requirement').update(row).eq('id', editingId)
        : await supabase.from('manpower_requirement').upsert(row, { onConflict: 'farm_id,designation,gender' })
      if (q.error) throw q.error
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['manpower_requirement'] }); setShowForm(false); setEditingId(null); setForm(blank); toast.success('Saved') },
    onError: (e: any) => toast.error(e.message),
  })

  const delMut = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('manpower_requirement').delete().eq('id', id); if (error) throw error },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['manpower_requirement'] }); toast.success('Deleted') },
    onError: (e: any) => toast.error(e.message),
  })

  const totalRequired = shown.reduce((a: number, r: any) => a + (r.required_count ?? 0), 0)
  const totalActual = shown.reduce((a: number, r: any) => a + r.actual, 0)
  const totalShort = shown.reduce((a: number, r: any) => a + r.short, 0)

  return (
    <div className="space-y-5">
      <SectionHeader title="Manpower Requirement"
        subtitle="How many people each site should have, by designation and gender — actual is counted from the employee records"
        action={<Button icon={<Plus size={16} />} onClick={() => { setEditingId(null); setForm(blank); setShowForm(true) }}>Add Requirement</Button>}
      />

      <div className="flex gap-3 items-end flex-wrap">
        <SearchableSelect placeholder="All Sites"
          options={(farms as any[]).map((f: any) => ({ value: f.id, label: f.name }))}
          value={farmFilter} onChange={v => setFarmFilter(v)} className="w-56" />
        {farmFilter && <Button variant="ghost" size="sm" onClick={() => setFarmFilter('')}>Clear</Button>}
      </div>

      {shown.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border bg-gray-50 text-gray-700 border-gray-200">
            <Users size={12} /> Required: {totalRequired}
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border bg-green-50 text-green-700 border-green-200">
            Actual: {totalActual}
          </span>
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${totalShort > 0 ? 'bg-red-50 text-red-700 border-red-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
            Short: {totalShort}
          </span>
        </div>
      )}

      {isLoading ? <Spinner /> : shown.length === 0 ? (
        <Card><EmptyState title={rows.length ? 'No requirements for this site' : 'No requirements set yet — Add Requirement to start'} /></Card>
      ) : (
        <Card padding={false}>
          <Table>
            <thead><tr>
              <Th>Site</Th><Th>Designation</Th><Th>Gender</Th>
              <Th right>Required</Th><Th right>Actual</Th><Th right>Short / Over</Th>
              <Th>Remarks</Th><Th right>Actions</Th>
            </tr></thead>
            <tbody>
              {shown.map((r: any) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <Td className="font-medium">{farmName(r.farm_id)}</Td>
                  <Td>{r.designation}</Td>
                  <Td>{r.gender ? <Badge color={r.gender === 'Male' ? 'blue' : 'green'}>{r.gender}</Badge> : <span className="text-gray-400 text-xs">Any</span>}</Td>
                  <Td right className="font-semibold">{r.required_count}</Td>
                  <Td right>{r.actual}</Td>
                  <Td right className={r.short > 0 ? 'text-red-600 font-medium' : r.over > 0 ? 'text-amber-600' : 'text-gray-400'}>
                    {r.short > 0 ? `${r.short} short` : r.over > 0 ? `${r.over} over` : 'met'}
                  </Td>
                  <Td className="text-xs text-gray-500">{r.remarks ?? '—'}</Td>
                  <Td right>
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => { setEditingId(r.id); setForm({
                        farm_id: r.farm_id, designation: r.designation, gender: r.gender ?? '',
                        required_count: String(r.required_count ?? ''), remarks: r.remarks ?? '' }); setShowForm(true) }}>
                        <Pencil size={14} className="text-gray-400 hover:text-brand-600" /></button>
                      <button onClick={() => confirm(`Delete the requirement for ${r.designation} at ${farmName(r.farm_id)}?`) && delMut.mutate(r.id)}>
                        <Trash2 size={14} className="text-gray-400 hover:text-red-600" /></button>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
          <p className="text-xs text-gray-500 px-3 py-2">
            Actual is counted live from active employee records — designation matched ignoring case, and
            gender only where the requirement names one. A requirement with no gender counts everyone in
            that designation, so do not set Male, Female AND Any for the same role or the same people
            will be counted twice.
          </p>
        </Card>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)}
        title={editingId ? 'Edit Requirement' : 'Add Requirement'}
        footer={<Button loading={saveMut.isPending} onClick={() => saveMut.mutate()}>Save</Button>}>
        <div className="space-y-3">
          <SearchableSelect placeholder="Select site"
            options={(farms as any[]).map((f: any) => ({ value: f.id, label: f.name }))}
            value={form.farm_id} onChange={v => s('farm_id', v)} />
          <SearchableSelect placeholder="Select designation"
            options={designationOptions} value={form.designation} onChange={v => s('designation', v)} />
          <Input label="Or type a designation" value={form.designation} onChange={e => s('designation', e.target.value)}
            hint="Must match how it is written on the employee records, or the actual count will read zero" />
          <Select label="Gender" value={form.gender} onChange={e => s('gender', e.target.value)}
            options={[{ value: '', label: 'Any (count everyone in this role)' },
                      { value: 'Male', label: 'Male' }, { value: 'Female', label: 'Female' }]} />
          <Input label="Required count *" type="number" value={form.required_count} onChange={e => s('required_count', e.target.value)} />
          <Input label="Remarks" value={form.remarks} onChange={e => s('remarks', e.target.value)} />
        </div>
      </Modal>
    </div>
  )
}
