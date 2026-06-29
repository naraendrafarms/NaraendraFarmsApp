import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { fmtDate, today } from '@/lib/utils'
import {
  Card, SectionHeader, Button, Input, Select, Modal, FormRow,
  Table, Th, Td, Spinner, EmptyState, DateInput,
} from '@/components/ui'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

// Shed-to-shed transfer within a flock/site. Counts auto-adjust via DB trigger
// (from-shed transfer out, to-shed transfer in) and the daily chain keeps both correct.
export const ShedTransferPage: React.FC = () => {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [delId, setDelId] = useState<string | null>(null)
  const [sel, setSel] = useState<Set<string>>(new Set())
  const blank = { flock_id: '', from_shed_id: '', to_shed_id: '', transfer_date: today(), female: '', male: '', remarks: '' }
  const [form, setForm] = useState<any>(blank)
  const s = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }))

  const { data: flocks = [] } = useQuery({ queryKey: ['flocks_st'], queryFn: async () => { const { data } = await supabase.from('flocks').select('id,flock_no').order('flock_no'); return data ?? [] } })
  const { data: sheds = [] } = useQuery({ queryKey: ['sheds_st'], queryFn: async () => { const { data } = await supabase.from('sheds').select('id,shed_no,shed_name,farm_id,farms(name,code)').order('shed_no'); return data ?? [] } })
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['shed_transfers'],
    queryFn: async () => {
      const { data } = await supabase.from('shed_transfers')
        .select('*, flocks(flock_no), from_shed:sheds!from_shed_id(shed_no,shed_name), to_shed:sheds!to_shed_id(shed_no,shed_name)')
        .order('transfer_date', { ascending: false })
      return data ?? []
    }
  })

  const shedLabel = (sh: any) => sh ? `Shed ${sh.shed_no}${sh.shed_name ? ' (' + sh.shed_name + ')' : ''}` : '—'

  const save = useMutation({
    mutationFn: async () => {
      if (!form.flock_id || !form.from_shed_id || !form.to_shed_id) throw new Error('Flock, from-shed and to-shed required')
      if (form.from_shed_id === form.to_shed_id) throw new Error('From and To shed must be different')
      if (!(parseInt(form.female) || parseInt(form.male))) throw new Error('Enter female and/or male count')
      const payload = {
        flock_id: form.flock_id, from_shed_id: form.from_shed_id, to_shed_id: form.to_shed_id,
        transfer_date: form.transfer_date, female: parseInt(form.female) || 0, male: parseInt(form.male) || 0,
        remarks: form.remarks || null,
      }
      if (editing) { const { error } = await supabase.from('shed_transfers').update(payload).eq('id', editing.id); if (error) throw error }
      else { const { error } = await supabase.from('shed_transfers').insert(payload); if (error) throw error }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['shed_transfers'] }); setOpen(false); setEditing(null); toast.success('Saved') },
    onError: (e: any) => toast.error(e.message),
  })

  const del = useMutation({
    mutationFn: async (ids: string[]) => { const { error } = await supabase.from('shed_transfers').delete().in('id', ids); if (error) throw error },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['shed_transfers'] }); setSel(new Set()); setDelId(null); toast.success('Deleted') },
    onError: (e: any) => toast.error('Delete failed: ' + (e.message || e.details)),
  })

  const openAdd = () => { setEditing(null); setForm(blank); setOpen(true) }
  const openEdit = (r: any) => { setEditing(r); setForm({ flock_id: r.flock_id, from_shed_id: r.from_shed_id, to_shed_id: r.to_shed_id, transfer_date: r.transfer_date, female: String(r.female ?? ''), male: String(r.male ?? ''), remarks: r.remarks ?? '' }); setOpen(true) }
  const toggle = (id: string) => setSel(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n })
  const allSel = rows.length > 0 && (rows as any[]).every((r: any) => sel.has(r.id))

  return (
    <div className="space-y-4 p-4">
      <SectionHeader title="Shed Transfers" subtitle="Move birds shed-to-shed within a site. Counts adjust automatically."
        action={<Button icon={<Plus size={16} />} onClick={openAdd}>Add Transfer</Button>} />

      {sel.size > 0 && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-sm">
          <span>{sel.size} selected</span>
          <Button size="sm" variant="danger" loading={del.isPending} onClick={() => del.mutate(Array.from(sel))}>Delete selected</Button>
          <button className="text-xs text-gray-500" onClick={() => setSel(new Set())}>Clear</button>
        </div>
      )}

      {isLoading ? <Spinner /> : (
        <Card padding={false}>
          <Table>
            <thead><tr>
              <Th><input type="checkbox" checked={allSel} onChange={() => setSel(allSel ? new Set() : new Set((rows as any[]).map((r: any) => r.id)))} /></Th>
              <Th>Date</Th><Th>Flock</Th><Th>From</Th><Th>To</Th><Th right>Female</Th><Th right>Male</Th><Th>Remarks</Th><Th></Th>
            </tr></thead>
            <tbody>
              {(rows as any[]).map((r: any) => (
                <tr key={r.id} className={`hover:bg-gray-50 ${sel.has(r.id) ? 'bg-red-50' : ''}`}>
                  <Td><input type="checkbox" checked={sel.has(r.id)} onChange={() => toggle(r.id)} /></Td>
                  <Td className="text-xs">{fmtDate(r.transfer_date)}</Td>
                  <Td className="text-xs">F-{r.flocks?.flock_no ?? '?'}</Td>
                  <Td className="text-xs">{shedLabel(r.from_shed)}</Td>
                  <Td className="text-xs">{shedLabel(r.to_shed)}</Td>
                  <Td right className="text-xs">{r.female || '—'}</Td>
                  <Td right className="text-xs">{r.male || '—'}</Td>
                  <Td className="text-xs text-gray-500">{r.remarks ?? '—'}</Td>
                  <Td>
                    <div className="flex gap-1 justify-end">
                      <button onClick={() => openEdit(r)} className="p-1 text-gray-400 hover:text-brand-600"><Pencil size={13} /></button>
                      <button onClick={() => setDelId(r.id)} className="p-1 text-gray-400 hover:text-red-600"><Trash2 size={13} /></button>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
          {rows.length === 0 && <EmptyState title="No shed transfers yet" subtitle="Click Add Transfer to move birds between sheds." />}
        </Card>
      )}

      <Modal open={open} onClose={() => { setOpen(false); setEditing(null) }} title={editing ? 'Edit Shed Transfer' : 'Add Shed Transfer'} size="md"
        footer={<><Button variant="secondary" onClick={() => { setOpen(false); setEditing(null) }}>Cancel</Button><Button loading={save.isPending} onClick={() => save.mutate()}>Save</Button></>}>
        <div className="space-y-3">
          <Select label="Flock" required placeholder="Select flock" value={form.flock_id} onChange={e => s('flock_id', e.target.value)}
            options={(flocks as any[]).map((f: any) => ({ value: f.id, label: `Flock ${f.flock_no}` }))} />
          <FormRow>
            <Select label="From Shed" required placeholder="Select" value={form.from_shed_id} onChange={e => s('from_shed_id', e.target.value)}
              options={(sheds as any[]).map((sh: any) => ({ value: sh.id, label: `${sh.farms?.code ?? ''} · ${shedLabel(sh)}` }))} />
            <Select label="To Shed" required placeholder="Select" value={form.to_shed_id} onChange={e => s('to_shed_id', e.target.value)}
              options={(sheds as any[]).map((sh: any) => ({ value: sh.id, label: `${sh.farms?.code ?? ''} · ${shedLabel(sh)}` }))} />
          </FormRow>
          <FormRow>
            <DateInput label="Date" value={form.transfer_date} onChange={e => s('transfer_date', e.target.value)} />
            <div />
          </FormRow>
          <FormRow>
            <Input label="Female" type="number" value={form.female} onChange={e => s('female', e.target.value)} />
            <Input label="Male" type="number" value={form.male} onChange={e => s('male', e.target.value)} />
          </FormRow>
          <Input label="Remarks" value={form.remarks} onChange={e => s('remarks', e.target.value)} />
          <p className="text-xs text-gray-400">On save, the From shed's count goes down and the To shed's count goes up on this date, and following days re-chain automatically.</p>
        </div>
      </Modal>

      {delId && (
        <Modal open={!!delId} onClose={() => setDelId(null)} title="Delete transfer?" size="sm"
          footer={<><Button variant="secondary" onClick={() => setDelId(null)}>Cancel</Button><Button variant="danger" loading={del.isPending} onClick={() => del.mutate([delId])}>Delete</Button></>}>
          <p className="text-sm text-gray-600">This reverses the bird-count change on both sheds. Continue?</p>
        </Modal>
      )}
    </div>
  )
}
