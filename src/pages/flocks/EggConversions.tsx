import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { fmtDate, today } from '@/lib/utils'
import { useFarmScope } from '@/lib/useFarmScope'
import {
  Card, Button, Input, Select, FormRow, Modal, Table, Th, Td, Badge,
  SectionHeader, Spinner, EmptyState
} from '@/components/ui'
import { Plus, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'

const EGG_TYPES = [
  { value: 'he_grade_a', label: 'HE Grade A' },
  { value: 'he_grade_b', label: 'HE Grade B' },
  { value: 'he_grade_c', label: 'HE Grade C' },
  { value: 'je_eggs',    label: 'Jumbo Eggs (JE)' },
  { value: 'te_eggs',    label: 'Table Eggs (TE)' },
  { value: 'be_eggs',    label: 'Broken Eggs (BE)' },
  { value: 'le_eggs',    label: 'Leached Eggs (LE)' },
]

export const EggConversions: React.FC = () => {
  const qc = useQueryClient()
  const { applyFlockFarmFilter, farmId } = useFarmScope()
  const [showForm, setShowForm] = useState(false)
  const [flockFilter, setFlockFilter] = useState('')

  const { data: flocks } = useQuery({
    queryKey: ['flocks_all', farmId],
    queryFn: async () => {
      let q = supabase.from('flocks').select('id,flock_no').order('flock_no')
      q = applyFlockFarmFilter(q)
      const { data } = await q; return data ?? []
    }
  })

  const { data: conversions, isLoading } = useQuery({
    queryKey: ['egg_conversions', flockFilter],
    queryFn: async () => {
      let q = supabase.from('egg_conversions')
        .select('*, flocks(flock_no)')
        .order('conversion_date', { ascending: false })
        .limit(200)
      if (flockFilter) q = q.eq('flock_id', flockFilter)
      const { data } = await q; return data ?? []
    }
  })

  const [form, setForm] = useState({
    flock_id: '', conversion_date: today(),
    from_type: 'he_grade_c', from_qty: '',
    to_type: 'te_eggs', to_qty: '',
    reason: ''
  })
  const s = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const mut = useMutation({
    mutationFn: async () => {
      if (!form.flock_id || !form.from_qty || !form.to_qty)
        throw new Error('Flock, from qty and to qty required')
      if (form.from_type === form.to_type)
        throw new Error('From and To types cannot be the same')
      const { error } = await supabase.from('egg_conversions').insert({
        flock_id: form.flock_id,
        conversion_date: form.conversion_date,
        from_type: form.from_type,
        from_qty: parseInt(form.from_qty),
        to_type: form.to_type,
        to_qty: parseInt(form.to_qty),
        reason: form.reason || null
      })
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Conversion recorded')
      qc.invalidateQueries({ queryKey: ['egg_conversions'] })
      setShowForm(false)
      setForm({ flock_id: flockFilter, conversion_date: today(), from_type: 'he_grade_c', from_qty: '', to_type: 'te_eggs', to_qty: '', reason: '' })
    },
    onError: (e: any) => toast.error(e.message)
  })

  const flockOptions = flocks?.map((f: any) => ({ value: f.id, label: `Flock ${f.flock_no}` })) ?? []
  const typeLabel = (v: string) => EGG_TYPES.find(t => t.value === v)?.label ?? v

  return (
    <div className="space-y-5">
      <SectionHeader title="Egg Conversions"
        subtitle="Record HE↔NHE type conversions (e.g. Grade C → Table Eggs)"
        action={<Button icon={<Plus size={16}/>} onClick={() => setShowForm(true)}>Add Conversion</Button>}
      />

      <div className="flex gap-3 items-end">
        <Select label="" placeholder="All Flocks" options={flockOptions}
          value={flockFilter} onChange={e => setFlockFilter(e.target.value)} className="w-44" />
        {flockFilter && <Button variant="ghost" size="sm" onClick={() => setFlockFilter('')}>Clear</Button>}
      </div>

      {isLoading ? <Spinner /> : (
        <Card padding={false}>
          <Table>
            <thead><tr>
              <Th>Date</Th><Th>Flock</Th>
              <Th>From</Th><Th right>From Qty</Th>
              <Th></Th>
              <Th>To</Th><Th right>To Qty</Th>
              <Th>Reason</Th>
            </tr></thead>
            <tbody>
              {(conversions ?? []).map((c: any) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <Td className="text-sm">{fmtDate(c.conversion_date)}</Td>
                  <Td><Badge color="green">F-{c.flocks?.flock_no}</Badge></Td>
                  <Td><span className="px-2 py-0.5 bg-red-50 text-red-700 rounded text-xs font-medium">{typeLabel(c.from_type)}</span></Td>
                  <Td right className="font-medium text-red-600">{c.from_qty?.toLocaleString('en-IN')}</Td>
                  <Td><ArrowRight size={14} className="text-gray-400 mx-auto"/></Td>
                  <Td><span className="px-2 py-0.5 bg-green-50 text-green-700 rounded text-xs font-medium">{typeLabel(c.to_type)}</span></Td>
                  <Td right className="font-medium text-green-600">{c.to_qty?.toLocaleString('en-IN')}</Td>
                  <Td className="text-xs text-gray-400">{c.reason ?? '—'}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
          {(conversions ?? []).length === 0 && (
            <EmptyState icon={<ArrowRight size={32}/>} title="No conversions yet"
              action={<Button onClick={() => setShowForm(true)} icon={<Plus size={16}/>}>Add Conversion</Button>}
            />
          )}
        </Card>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Record Egg Conversion" size="md"
        footer={
          <><Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
          <Button loading={mut.isPending} onClick={() => mut.mutate()}>Save</Button></>
        }>
        <div className="space-y-4">
          <FormRow>
            <Select label="Flock" required placeholder="— Select —" options={flockOptions}
              value={form.flock_id} onChange={e => s('flock_id', e.target.value)} />
            <Input label="Date" required type="date" value={form.conversion_date}
              onChange={e => s('conversion_date', e.target.value)} />
          </FormRow>
          <div className="grid grid-cols-5 gap-3 items-end">
            <div className="col-span-2 space-y-3">
              <Select label="From Type" options={EGG_TYPES} value={form.from_type}
                onChange={e => s('from_type', e.target.value)} />
              <Input label="From Qty" required type="number" value={form.from_qty}
                onChange={e => s('from_qty', e.target.value)} />
            </div>
            <div className="flex items-center justify-center pb-2">
              <ArrowRight size={20} className="text-gray-400"/>
            </div>
            <div className="col-span-2 space-y-3">
              <Select label="To Type" options={EGG_TYPES} value={form.to_type}
                onChange={e => s('to_type', e.target.value)} />
              <Input label="To Qty" required type="number" value={form.to_qty}
                onChange={e => s('to_qty', e.target.value)} />
            </div>
          </div>
          <Input label="Reason" placeholder="e.g. Old stock — eggs too old for setting"
            value={form.reason} onChange={e => s('reason', e.target.value)} />
        </div>
      </Modal>
    </div>
  )
}
