import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { fmtDate } from '@/lib/utils'
import { today } from '@/lib/utils'
import {
  Card, Button, Input, Select, FormRow, Table, Th, Td, Badge,
  SectionHeader, Spinner, EmptyState
, DateInput } from '@/components/ui'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

export const EggOpeningStockPage: React.FC = () => {
  const qc = useQueryClient()
  const [editing, setEditing] = useState<any | null>(null)
  const [showForm, setShowForm] = useState(false)

  const [form, setForm] = useState({
    flock_id: '', as_of_date: today(),
    he_grade_a: '0', he_grade_b: '0', he_grade_c: '0',
    je_eggs: '0', te_eggs: '0', be_eggs: '0', le_eggs: '0'
  })
  const s = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const { data: flocks } = useQuery({
    queryKey: ['flocks_all'],
    queryFn: async () => { const { data } = await supabase.from('flocks').select('id,flock_no,status').order('flock_no'); return data ?? [] }
  })

  const { data: stocks, isLoading } = useQuery({
    queryKey: ['egg_opening_stock'],
    queryFn: async () => {
      const { data } = await supabase.from('egg_opening_stock')
        .select('*, flocks(flock_no,status)')
        .order('as_of_date', { ascending: false })
      return data ?? []
    }
  })

  const openForm = (row?: any) => {
    if (row) {
      setEditing(row)
      setForm({
        flock_id: row.flock_id, as_of_date: row.as_of_date,
        he_grade_a: row.he_grade_a?.toString() ?? '0',
        he_grade_b: row.he_grade_b?.toString() ?? '0',
        he_grade_c: row.he_grade_c?.toString() ?? '0',
        je_eggs: row.je_eggs?.toString() ?? '0',
        te_eggs: row.te_eggs?.toString() ?? '0',
        be_eggs: row.be_eggs?.toString() ?? '0',
        le_eggs: row.le_eggs?.toString() ?? '0',
      })
    } else {
      setEditing(null)
      setForm({ flock_id: '', as_of_date: today(), he_grade_a: '0', he_grade_b: '0', he_grade_c: '0', je_eggs: '0', te_eggs: '0', be_eggs: '0', le_eggs: '0' })
    }
    setShowForm(true)
  }

  const mut = useMutation({
    mutationFn: async () => {
      if (!form.flock_id || !form.as_of_date) throw new Error('Flock and date required')
      const payload = {
        flock_id: form.flock_id, as_of_date: form.as_of_date,
        he_grade_a: parseInt(form.he_grade_a) || 0,
        he_grade_b: parseInt(form.he_grade_b) || 0,
        he_grade_c: parseInt(form.he_grade_c) || 0,
        je_eggs: parseInt(form.je_eggs) || 0,
        te_eggs: parseInt(form.te_eggs) || 0,
        be_eggs: parseInt(form.be_eggs) || 0,
        le_eggs: parseInt(form.le_eggs) || 0,
      }
      if (editing) {
        const { error } = await supabase.from('egg_opening_stock').update(payload).eq('id', editing.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('egg_opening_stock').upsert(payload, { onConflict: 'flock_id' })
        if (error) throw error
      }
    },
    onSuccess: () => {
      toast.success(editing ? 'Updated' : 'Opening stock saved')
      qc.invalidateQueries({ queryKey: ['egg_opening_stock'] })
      setShowForm(false); setEditing(null)
    },
    onError: (e: any) => toast.error(e.message)
  })

  const delMut = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('egg_opening_stock').delete().eq('id', id); if (error) throw error },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['egg_opening_stock'] }); toast.success('Deleted') },
    onError: (e: any) => toast.error(e.message)
  })

  const flockOptions = (flocks ?? []).map((f: any) => ({ value: f.id, label: `Flock ${f.flock_no} (${f.status})` }))
  const N = (v: any) => v > 0 ? v.toLocaleString('en-IN') : '—'

  return (
    <div className="space-y-5">
      <SectionHeader title="Egg Opening Stock"
        subtitle="One-time opening balance per flock — enter stock on hand from Week 19 Day 1 before daily entries begin"
        action={<Button icon={<Plus size={16}/>} onClick={() => openForm()}>Add Opening Stock</Button>}
      />

      <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
        Enter the egg stock balance for each flock as of the date production records start. This is used as the starting balance in the stock register running total.
      </div>

      {showForm && (
        <Card>
          <p className="font-semibold text-gray-700 mb-4">{editing ? 'Edit' : 'New'} Opening Stock Entry</p>
          <div className="space-y-4">
            <FormRow>
              <Select label="Flock" required placeholder="— Select Flock —" options={flockOptions}
                value={form.flock_id} onChange={e => s('flock_id', e.target.value)} />
              <DateInput label="As of Date" required value={form.as_of_date} onChange={e => s('as_of_date', e.target.value)} />
            </FormRow>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">HE Eggs (Hatching)</p>
            <div className="grid grid-cols-3 gap-3">
              <Input label="Grade A" type="number" value={form.he_grade_a} onChange={e => s('he_grade_a', e.target.value)} />
              <Input label="Grade B" type="number" value={form.he_grade_b} onChange={e => s('he_grade_b', e.target.value)} />
              <Input label="Grade C" type="number" value={form.he_grade_c} onChange={e => s('he_grade_c', e.target.value)} />
            </div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">NHE Eggs</p>
            <div className="grid grid-cols-4 gap-3">
              <Input label="Jumbo (JE)" type="number" value={form.je_eggs} onChange={e => s('je_eggs', e.target.value)} />
              <Input label="Table (TE)" type="number" value={form.te_eggs} onChange={e => s('te_eggs', e.target.value)} />
              <Input label="Broken (BE)" type="number" value={form.be_eggs} onChange={e => s('be_eggs', e.target.value)} />
              <Input label="Leached (LE)" type="number" value={form.le_eggs} onChange={e => s('le_eggs', e.target.value)} />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" onClick={() => { setShowForm(false); setEditing(null) }}>Cancel</Button>
              <Button loading={mut.isPending} onClick={() => mut.mutate()}>Save</Button>
            </div>
          </div>
        </Card>
      )}

      {isLoading ? <Spinner /> : (
        <Card padding={false}>
          <Table>
            <thead><tr>
              <Th>Flock</Th><Th>As of Date</Th>
              <Th right>HE Gr A</Th><Th right>HE Gr B</Th><Th right>HE Gr C</Th>
              <Th right>JE</Th><Th right>TE</Th><Th right>BE</Th><Th right>LE</Th>
              <Th right>Total HE</Th><Th></Th>
            </tr></thead>
            <tbody>
              {(stocks ?? []).map((r: any) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <Td><Badge color="green">F-{r.flocks?.flock_no}</Badge></Td>
                  <Td className="text-xs">{fmtDate(r.as_of_date)}</Td>
                  <Td right className="text-xs text-emerald-600">{N(r.he_grade_a)}</Td>
                  <Td right className="text-xs text-yellow-600">{N(r.he_grade_b)}</Td>
                  <Td right className="text-xs text-orange-600">{N(r.he_grade_c)}</Td>
                  <Td right className="text-xs">{N(r.je_eggs)}</Td>
                  <Td right className="text-xs">{N(r.te_eggs)}</Td>
                  <Td right className="text-xs">{N(r.be_eggs)}</Td>
                  <Td right className="text-xs">{N(r.le_eggs)}</Td>
                  <Td right className="text-xs font-semibold">{N((r.he_grade_a||0)+(r.he_grade_b||0)+(r.he_grade_c||0))}</Td>
                  <Td>
                    <div className="flex gap-1">
                      <button onClick={() => openForm(r)} className="p-1 text-gray-400 hover:text-brand-600"><Pencil size={13}/></button>
                      <button onClick={() => { if (confirm('Delete opening stock?')) delMut.mutate(r.id) }} className="p-1 text-gray-400 hover:text-red-600"><Trash2 size={13}/></button>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
          {(stocks ?? []).length === 0 && <EmptyState title="No opening stock entries" action={<Button icon={<Plus size={16}/>} onClick={() => openForm()}>Add Opening Stock</Button>} />}
        </Card>
      )}
    </div>
  )
}
