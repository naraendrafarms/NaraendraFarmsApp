import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { inr, fmtDate, today } from '@/lib/utils'
import { useFarmScope } from '@/lib/useFarmScope'
import {
  Card, CardHeader, Button, Input, Select, FormRow, Modal, Divider,
  Table, Th, Td, Badge, SectionHeader, Spinner, EmptyState, StatCard
} from '@/components/ui'
import { Plus, Package, Edit2, Egg, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

// ── Bulk selection helpers ────────────────────────────────────────
const CB: React.FC<{ checked: boolean; indeterminate?: boolean; onChange: () => void }> = ({ checked, indeterminate, onChange }) => {
  const ref = React.useRef<HTMLInputElement>(null)
  React.useEffect(() => { if (ref.current) ref.current.indeterminate = !!indeterminate }, [indeterminate])
  return <input ref={ref} type="checkbox" checked={checked} onChange={onChange} className="rounded border-gray-300 text-brand-600 cursor-pointer" />
}

const BulkBar: React.FC<{ count: number; onDelete: () => void; onClear: () => void; loading?: boolean }> = ({ count, onDelete, onClear, loading }) => count === 0 ? null : (
  <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
    <span className="text-sm font-medium text-red-700">{count} selected</span>
    <button onClick={onClear} className="text-xs text-gray-500 hover:text-gray-700 underline">Clear</button>
    <div className="ml-auto">
      <Button variant="danger" size="sm" icon={<Trash2 size={14}/>} loading={loading} onClick={onDelete}>Delete {count} rows</Button>
    </div>
  </div>
)

const ConfirmBulkDelete: React.FC<{ label: string; onConfirm: () => void; onCancel: () => void }> = ({ label, onConfirm, onCancel }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
    <div className="bg-white rounded-xl shadow-xl p-6 w-80">
      <p className="font-semibold text-gray-900 mb-1">Delete records?</p>
      <p className="text-sm text-gray-500 mb-5">{label}</p>
      <div className="flex gap-3 justify-end">
        <Button variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
        <Button variant="danger" size="sm" onClick={onConfirm}>Delete</Button>
      </div>
    </div>
  </div>
)

// ── HE DISPATCH ──────────────────────────────────────────────────
export const HEDispatch: React.FC = () => {
  const qc = useQueryClient()
  const { applyFlockFarmFilter, farmId } = useFarmScope()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [flockFilter, setFlockFilter] = useState('')
  const [sel, setSel] = useState<Set<string>>(new Set())
  const [bulkConfirm, setBulkConfirm] = useState(false)

  const { data: flocks } = useQuery({
    queryKey: ['flocks_all', farmId],
    queryFn: async () => {
      let q = supabase.from('flocks').select('id,flock_no,status,laying_farm_id,rearing_farm_id').order('flock_no')
      q = applyFlockFarmFilter(q)
      const { data } = await q
      return data ?? []
    }
  })

  const { data: parties } = useQuery({
    queryKey: ['parties_buyers'],
    queryFn: async () => {
      const { data } = await supabase.from('parties').select('id,name')
        .in('type', ['buyer','both']).order('name')
      return data ?? []
    }
  })

  const { data: hatcheries } = useQuery({
    queryKey: ['hatcheries'],
    queryFn: async () => {
      const { data } = await supabase.from('hatcheries').select('id,name').order('name')
      return data ?? []
    }
  })

  const { data: dispatches, isLoading } = useQuery({
    queryKey: ['he_dispatch', flockFilter],
    queryFn: async () => {
      let q = supabase.from('he_dispatch')
        .select('*, flocks(flock_no), parties(name), hatcheries(name)')
        .order('dispatch_date', { ascending: false }).limit(200)
      if (flockFilter) q = q.eq('flock_id', flockFilter)
      const { data } = await q; return data ?? []
    }
  })

  const [form, setForm] = useState({
    flock_id: '', dispatch_date: today(), prod_date: today(),
    dc_no: '', party_id: '', hatchery_id: '',
    grade_a: '0', grade_b: '0', total_dispatched: '',
    free_eggs: '0', rate: '', amount: '',
    setting_date: '', hatch_date: '', chicks_sold: '', remarks: ''
  })
  const s = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  // Auto-compute amount = invoice_eggs × rate
  const invoiceEggs = (parseInt(form.total_dispatched)||0) - (parseInt(form.free_eggs)||0)
  const autoAmount = invoiceEggs * (parseFloat(form.rate)||0)

  const openForm = (row?: any) => {
    if (row) {
      setEditing(row)
      setForm({
        flock_id: row.flock_id, dispatch_date: row.dispatch_date, prod_date: row.prod_date ?? '',
        dc_no: row.dc_no?.toString() ?? '', party_id: row.party_id ?? '', hatchery_id: row.hatchery_id ?? '',
        grade_a: row.grade_a?.toString() ?? '0', grade_b: row.grade_b?.toString() ?? '0',
        total_dispatched: row.total_dispatched?.toString() ?? '',
        free_eggs: row.free_eggs?.toString() ?? '0', rate: row.rate?.toString() ?? '',
        amount: row.amount?.toString() ?? '', setting_date: row.setting_date ?? '',
        hatch_date: row.hatch_date ?? '', chicks_sold: row.chicks_sold?.toString() ?? '',
        remarks: row.remarks ?? ''
      })
    } else {
      setEditing(null)
      setForm({ flock_id: flockFilter, dispatch_date: today(), prod_date: today(),
        dc_no: '', party_id: '', hatchery_id: '', grade_a: '0', grade_b: '0',
        total_dispatched: '', free_eggs: '0', rate: '', amount: '',
        setting_date: '', hatch_date: '', chicks_sold: '', remarks: '' })
    }
    setShowForm(true)
  }

  const bulkDelMut = useMutation({
    mutationFn: async (ids: string[]) => { await supabase.from('he_dispatch').delete().in('id', ids) },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['he_dispatch'] }); setSel(new Set()); setBulkConfirm(false) }
  })

  const mut = useMutation({
    mutationFn: async () => {
      if (!form.flock_id || !form.dispatch_date || !form.total_dispatched)
        throw new Error('Flock, date and dispatch qty required')
      const inv = (parseInt(form.total_dispatched)||0) - (parseInt(form.free_eggs)||0)
      const payload = {
        flock_id: form.flock_id, dispatch_date: form.dispatch_date,
        prod_date: form.prod_date || null, dc_no: parseInt(form.dc_no) || null,
        party_id: form.party_id || null, hatchery_id: form.hatchery_id || null,
        grade_a: parseInt(form.grade_a) || 0, grade_b: parseInt(form.grade_b) || 0,
        total_dispatched: parseInt(form.total_dispatched),
        free_eggs: parseInt(form.free_eggs) || 0,
        invoice_eggs: inv, rate: parseFloat(form.rate) || null,
        amount: parseFloat(form.amount) || autoAmount || null,
        setting_date: form.setting_date || null, hatch_date: form.hatch_date || null,
        chicks_sold: parseInt(form.chicks_sold) || null, remarks: form.remarks || null
      }
      if (editing) { const { error } = await supabase.from('he_dispatch').update(payload).eq('id', editing.id); if (error) throw error }
      else { const { error } = await supabase.from('he_dispatch').insert(payload); if (error) throw error }
    },
    onSuccess: () => { toast.success('Saved!'); qc.invalidateQueries({ queryKey: ['he_dispatch'] }); setShowForm(false) },
    onError: (e: any) => toast.error(e.message)
  })

  const totalDisp = dispatches?.reduce((s: number, d: any) => s + d.total_dispatched, 0) ?? 0
  const totalAmt  = dispatches?.reduce((s: number, d: any) => s + (d.amount ?? 0), 0) ?? 0
  const totalFree = dispatches?.reduce((s: number, d: any) => s + (d.free_eggs ?? 0), 0) ?? 0

  const flockOptions = flocks?.map((f: any) => ({ value: f.id, label: `Flock ${f.flock_no}` })) ?? []
  const partyOptions = parties?.map((p: any) => ({ value: p.id, label: p.name })) ?? []
  const hatchOptions = hatcheries?.map((h: any) => ({ value: h.id, label: h.name })) ?? []

  const dispIds = (dispatches ?? []).map((d: any) => d.id)
  const allSel = dispIds.length > 0 && dispIds.every((id: string) => sel.has(id))
  const someSel = dispIds.some((id: string) => sel.has(id))
  const toggle = (id: string) => setSel(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  const toggleAll = () => setSel(s => { const n = new Set(s); allSel ? dispIds.forEach((id: string) => n.delete(id)) : dispIds.forEach((id: string) => n.add(id)); return n })

  return (
    <div className="space-y-5">
      <SectionHeader title="HE Dispatch & Sales"
        subtitle="Hatching egg dispatches to hatcheries"
        action={<Button icon={<Plus size={16}/>} onClick={() => openForm()}>Add Dispatch</Button>}
      />

      {/* Flock filter */}
      <div className="flex gap-3 flex-wrap">
        <Select label="" placeholder="All Flocks" options={flockOptions}
          value={flockFilter} onChange={e => setFlockFilter(e.target.value)} className="w-44" />
        {flockFilter && <Button variant="ghost" size="sm" onClick={() => setFlockFilter('')}>Clear</Button>}
      </div>

      {/* Summary */}
      {dispatches && dispatches.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <StatCard title="Total Dispatched" value={totalDisp.toLocaleString('en-IN')} icon={<Egg size={18}/>} color="text-brand-600" />
          <StatCard title="Free Eggs" value={totalFree.toLocaleString('en-IN')} icon={<Egg size={18}/>} color="text-yellow-600" />
          <StatCard title="Total Revenue" value={inr(totalAmt)} icon={<Package size={18}/>} color="text-green-600" />
        </div>
      )}

      <BulkBar count={sel.size} loading={bulkDelMut.isPending} onClear={() => setSel(new Set())} onDelete={() => setBulkConfirm(true)} />

      {isLoading ? <Spinner /> : (
        <Card padding={false}>
          <Table>
            <thead><tr>
              <Th><CB checked={allSel} indeterminate={someSel && !allSel} onChange={toggleAll}/></Th>
              <Th>Flock</Th><Th>Dispatch Date</Th><Th>Prod Date</Th>
              <Th right>DC No</Th><Th>Party</Th><Th>Hatchery</Th>
              <Th right>Dispatched</Th><Th right>Free</Th><Th right>Invoice</Th>
              <Th right>Rate</Th><Th right>Amount</Th><Th></Th>
            </tr></thead>
            <tbody>
              {dispatches?.map((d: any) => (
                <tr key={d.id} className={`hover:bg-gray-50 ${sel.has(d.id) ? 'bg-red-50' : ''}`}>
                  <Td><CB checked={sel.has(d.id)} onChange={() => toggle(d.id)}/></Td>
                  <Td><Badge color="green">F-{d.flocks?.flock_no}</Badge></Td>
                  <Td className="text-xs">{fmtDate(d.dispatch_date)}</Td>
                  <Td className="text-xs text-gray-400">{fmtDate(d.prod_date)}</Td>
                  <Td right className="text-xs">{d.dc_no ?? '—'}</Td>
                  <Td className="text-xs max-w-[120px] truncate">{d.parties?.name ?? '—'}</Td>
                  <Td className="text-xs text-gray-400 max-w-[100px] truncate">{d.hatcheries?.name ?? '—'}</Td>
                  <Td right className="font-medium">{d.total_dispatched?.toLocaleString('en-IN')}</Td>
                  <Td right className="text-xs text-orange-500">{d.free_eggs > 0 ? d.free_eggs : '—'}</Td>
                  <Td right className="text-xs">{d.invoice_eggs?.toLocaleString('en-IN') ?? '—'}</Td>
                  <Td right className="text-xs">{d.rate ? `Rs ${d.rate}` : '—'}</Td>
                  <Td right className="font-semibold text-green-700 text-xs">{d.amount ? inr(d.amount) : '—'}</Td>
                  <Td>
                    <button onClick={() => openForm(d)}
                      className="p-1.5 rounded hover:bg-brand-50 text-gray-400 hover:text-brand-600">
                      <Edit2 size={13}/>
                    </button>
                  </Td>
                </tr>
              ))}
            </tbody>
            {dispatches && dispatches.length > 0 && (
              <tfoot><tr className="bg-gray-50">
                <Td colSpan={7}><strong>TOTAL ({dispatches.length} records)</strong></Td>
                <Td right><strong>{totalDisp.toLocaleString('en-IN')}</strong></Td>
                <Td right><strong>{totalFree.toLocaleString('en-IN')}</strong></Td>
                <Td right><strong>{(totalDisp - totalFree).toLocaleString('en-IN')}</strong></Td>
                <Td right>—</Td>
                <Td right><strong className="text-green-700">{inr(totalAmt)}</strong></Td>
                <Td> </Td>
              </tr></tfoot>
            )}
          </Table>
          {dispatches?.length === 0 && (
            <EmptyState icon={<Egg size={32}/>} title="No dispatches yet"
              action={<Button onClick={() => openForm()} icon={<Plus size={16}/>}>Add Dispatch</Button>}
            />
          )}
        </Card>
      )}

      {bulkConfirm && (
        <ConfirmBulkDelete label={`Delete ${sel.size} HE dispatch records? This cannot be undone.`}
          onConfirm={() => bulkDelMut.mutate([...sel])} onCancel={() => setBulkConfirm(false)} />
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)}
        title={editing ? 'Edit HE Dispatch' : 'New HE Dispatch'} size="lg"
        footer={
          <><Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
          <Button loading={mut.isPending} onClick={() => mut.mutate()}>{editing ? 'Update' : 'Save'}</Button></>
        }>
        <div className="space-y-4">
          <FormRow>
            <Select label="Flock" required placeholder="— Select —" options={flockOptions}
              value={form.flock_id} onChange={e => s('flock_id', e.target.value)} />
            <Input label="DC No" type="number" value={form.dc_no} onChange={e => s('dc_no', e.target.value)} />
          </FormRow>
          <FormRow>
            <Input label="Dispatch Date" required type="date" value={form.dispatch_date} onChange={e => s('dispatch_date', e.target.value)} />
            <Input label="Production Date" type="date" value={form.prod_date} onChange={e => s('prod_date', e.target.value)} />
          </FormRow>
          <FormRow>
            <Select label="Party / Hatchery" placeholder="— Select —" options={partyOptions}
              value={form.party_id} onChange={e => s('party_id', e.target.value)} />
            <Select label="Hatchery" placeholder="— Select —" options={hatchOptions}
              value={form.hatchery_id} onChange={e => s('hatchery_id', e.target.value)} />
          </FormRow>
          <Divider label="Egg Counts" />
          <FormRow cols={4}>
            <Input label="Grade A" type="number" value={form.grade_a} onChange={e => s('grade_a', e.target.value)} />
            <Input label="Grade B" type="number" value={form.grade_b} onChange={e => s('grade_b', e.target.value)} />
            <Input label="Total Dispatched" required type="number" value={form.total_dispatched} onChange={e => s('total_dispatched', e.target.value)} />
            <Input label="Free Eggs (2%)" type="number" value={form.free_eggs} onChange={e => s('free_eggs', e.target.value)} />
          </FormRow>
          <div className="bg-blue-50 rounded-lg px-4 py-2 text-sm text-blue-700">
            Invoice Eggs: <strong>{invoiceEggs.toLocaleString('en-IN')}</strong>
            {form.rate && <span className="ml-4">Auto Amount: <strong>{inr(autoAmount)}</strong></span>}
          </div>
          <FormRow>
            <Input label="Rate (Rs/egg)" type="number" step="0.0001" value={form.rate} onChange={e => s('rate', e.target.value)} />
            <Input label="Amount (Rs)" type="number" step="0.01" value={form.amount}
              onChange={e => s('amount', e.target.value)}
              hint={autoAmount > 0 ? `Auto: ${inr(autoAmount)}` : undefined} />
          </FormRow>
          <Divider label="Setting & Hatch (optional)" />
          <FormRow cols={3}>
            <Input label="Setting Date" type="date" value={form.setting_date} onChange={e => s('setting_date', e.target.value)} />
            <Input label="Hatch Date" type="date" value={form.hatch_date} onChange={e => s('hatch_date', e.target.value)} />
            <Input label="Chicks Sold" type="number" value={form.chicks_sold} onChange={e => s('chicks_sold', e.target.value)} />
          </FormRow>
          <Input label="Remarks" value={form.remarks} onChange={e => s('remarks', e.target.value)} />
        </div>
      </Modal>
    </div>
  )
}

// ── NHE SALES ────────────────────────────────────────────────────
const NHE_TYPES = [
  { value: 'je',             label: 'Jumbo Eggs (JE)' },
  { value: 'te',             label: 'Table Eggs (TE)' },
  { value: 'be',             label: 'Broken/Crack Eggs (BE)' },
  { value: 'bird_cull',      label: 'Bird Sales — Cull' },
  { value: 'bird_lame',      label: 'Bird Sales — Lame' },
  { value: 'bird_weak',      label: 'Bird Sales — Weak' },
  { value: 'bird_sex_error', label: 'Bird Sales — Sex Error' },
  { value: 'gas',            label: 'Gas Cylinders (income)' },
  { value: 'manure',         label: 'Manure / Litter' },
  { value: 'other',          label: 'Other Income' },
]

export const NHESales: React.FC = () => {
  const qc = useQueryClient()
  const { applyFlockFarmFilter, farmId } = useFarmScope()
  const [showForm, setShowForm] = useState(false)
  const [flockFilter, setFlockFilter] = useState('')
  const [sel, setSel] = useState<Set<string>>(new Set())
  const [bulkConfirm, setBulkConfirm] = useState(false)

  const { data: flocks } = useQuery({
    queryKey: ['flocks_all', farmId],
    queryFn: async () => {
      let q = supabase.from('flocks').select('id,flock_no,laying_farm_id,rearing_farm_id').order('flock_no')
      q = applyFlockFarmFilter(q)
      const { data } = await q; return data ?? []
    }
  })
  const { data: parties } = useQuery({
    queryKey: ['parties_buyers'],
    queryFn: async () => { const { data } = await supabase.from('parties').select('id,name').in('type',['buyer','both']).order('name'); return data ?? [] }
  })
  const { data: sales, isLoading } = useQuery({
    queryKey: ['nhe_sales', flockFilter],
    queryFn: async () => {
      let q = supabase.from('nhe_sales').select('*, flocks(flock_no), parties(name)')
        .order('sale_date', { ascending: false }).limit(200)
      if (flockFilter) q = q.eq('flock_id', flockFilter)
      const { data } = await q; return data ?? []
    }
  })

  const [form, setForm] = useState({
    flock_id: '', sale_date: today(), sale_type: 'je',
    party_id: '', dc_no: '', quantity: '', unit: 'nos', rate: '', amount: '', remarks: ''
  })
  const s = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))
  const autoAmt = (parseFloat(form.quantity)||0) * (parseFloat(form.rate)||0)

  const bulkDelMutNHE = useMutation({
    mutationFn: async (ids: string[]) => { await supabase.from('nhe_sales').delete().in('id', ids) },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['nhe_sales'] }); setSel(new Set()); setBulkConfirm(false) }
  })

  const mut = useMutation({
    mutationFn: async () => {
      if (!form.flock_id || !form.sale_date || !form.amount) throw new Error('Flock, date and amount required')
      const { error } = await supabase.from('nhe_sales').insert({
        flock_id: form.flock_id, sale_date: form.sale_date, sale_type: form.sale_type,
        party_id: form.party_id || null, dc_no: form.dc_no || null,
        quantity: parseFloat(form.quantity) || null, unit: form.unit,
        rate: parseFloat(form.rate) || null,
        amount: parseFloat(form.amount) || autoAmt,
        remarks: form.remarks || null
      })
      if (error) throw error
    },
    onSuccess: () => { toast.success('Sale recorded!'); qc.invalidateQueries({ queryKey: ['nhe_sales'] }); setShowForm(false) },
    onError: (e: any) => toast.error(e.message)
  })

  const flockOptions = flocks?.map((f: any) => ({ value: f.id, label: `Flock ${f.flock_no}` })) ?? []
  const partyOptions = parties?.map((p: any) => ({ value: p.id, label: p.name })) ?? []

  const saleIds = (sales ?? []).map((s: any) => s.id)
  const allSelNHE = saleIds.length > 0 && saleIds.every((id: string) => sel.has(id))
  const someSelNHE = saleIds.some((id: string) => sel.has(id))
  const toggle = (id: string) => setSel(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  const toggleAll = () => setSel(s => { const n = new Set(s); allSelNHE ? saleIds.forEach((id: string) => n.delete(id)) : saleIds.forEach((id: string) => n.add(id)); return n })

  // Group by type for summary
  const byType = sales?.reduce((acc: any, s: any) => {
    acc[s.sale_type] = (acc[s.sale_type] ?? 0) + s.amount
    return acc
  }, {}) ?? {}

  return (
    <div className="space-y-5">
      <SectionHeader title="NHE & Bird Sales"
        subtitle="Non-hatching eggs, bird sales, gas, manure income"
        action={<Button icon={<Plus size={16}/>} onClick={() => { setShowForm(true); setForm(f => ({ ...f, flock_id: flockFilter })) }}>Add Sale</Button>}
      />
      <div className="flex gap-3">
        <Select label="" placeholder="All Flocks" options={flockOptions}
          value={flockFilter} onChange={e => setFlockFilter(e.target.value)} className="w-44" />
        {flockFilter && <Button variant="ghost" size="sm" onClick={() => setFlockFilter('')}>Clear</Button>}
      </div>

      {Object.keys(byType).length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Object.entries(byType).map(([type, amt]: any) => (
            <Card key={type} className="!p-3">
              <p className="text-xs text-gray-500">{NHE_TYPES.find(t => t.value === type)?.label ?? type}</p>
              <p className="text-sm font-bold text-gray-900 mt-1">{inr(amt)}</p>
            </Card>
          ))}
        </div>
      )}

      <BulkBar count={sel.size} loading={bulkDelMutNHE.isPending} onClear={() => setSel(new Set())} onDelete={() => setBulkConfirm(true)} />

      {isLoading ? <Spinner /> : (
        <Card padding={false}>
          <Table>
            <thead><tr>
              <Th><CB checked={allSelNHE} indeterminate={someSelNHE && !allSelNHE} onChange={toggleAll}/></Th>
              <Th>Flock</Th><Th>Date</Th><Th>Type</Th><Th>Party</Th>
              <Th right>Qty</Th><Th right>Rate</Th><Th right>Amount</Th><Th>Remarks</Th>
            </tr></thead>
            <tbody>
              {sales?.map((s: any) => (
                <tr key={s.id} className={`hover:bg-gray-50 ${sel.has(s.id) ? 'bg-red-50' : ''}`}>
                  <Td><CB checked={sel.has(s.id)} onChange={() => toggle(s.id)}/></Td>
                  <Td><Badge color="green">F-{s.flocks?.flock_no}</Badge></Td>
                  <Td className="text-xs">{fmtDate(s.sale_date)}</Td>
                  <Td className="text-xs">{NHE_TYPES.find(t => t.value === s.sale_type)?.label ?? s.sale_type}</Td>
                  <Td className="text-xs text-gray-400">{s.parties?.name ?? '—'}</Td>
                  <Td right className="text-xs">{s.quantity?.toLocaleString('en-IN') ?? '—'} {s.unit}</Td>
                  <Td right className="text-xs">{s.rate ? `Rs ${s.rate}` : '—'}</Td>
                  <Td right className="font-semibold text-green-700 text-xs">{inr(s.amount)}</Td>
                  <Td className="text-xs text-gray-400 max-w-xs truncate">{s.remarks ?? ''}</Td>
                </tr>
              ))}
            </tbody>
            {sales && sales.length > 0 && (
              <tfoot><tr className="bg-gray-50">
                <Td colSpan={7}><strong>TOTAL</strong></Td>
                <Td right><strong className="text-green-700">{inr(sales.reduce((sum: number, s: any) => sum + s.amount, 0))}</strong></Td>
                <Td> </Td>
              </tr></tfoot>
            )}
          </Table>
          {sales?.length === 0 && <EmptyState icon={<Egg size={32}/>} title="No sales yet" action={<Button onClick={() => setShowForm(true)} icon={<Plus size={16}/>}>Add</Button>} />}
        </Card>
      )}

      {bulkConfirm && (
        <ConfirmBulkDelete label={`Delete ${sel.size} NHE/bird sale records? This cannot be undone.`}
          onConfirm={() => bulkDelMutNHE.mutate([...sel])} onCancel={() => setBulkConfirm(false)} />
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Record NHE / Bird Sale" size="md"
        footer={<><Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
          <Button loading={mut.isPending} onClick={() => mut.mutate()}>Save</Button></>}>
        <div className="space-y-4">
          <FormRow>
            <Select label="Flock" required placeholder="— Select —" options={flockOptions}
              value={form.flock_id} onChange={e => s('flock_id', e.target.value)} />
            <Input label="Sale Date" required type="date" value={form.sale_date} onChange={e => s('sale_date', e.target.value)} />
          </FormRow>
          <FormRow>
            <Select label="Sale Type" required options={NHE_TYPES} value={form.sale_type} onChange={e => s('sale_type', e.target.value)} />
            <Select label="Party" placeholder="— Select —" options={partyOptions}
              value={form.party_id} onChange={e => s('party_id', e.target.value)} />
          </FormRow>
          <FormRow cols={4}>
            <Input label="Qty" type="number" value={form.quantity} onChange={e => s('quantity', e.target.value)} />
            <Input label="Unit" value={form.unit} onChange={e => s('unit', e.target.value)} />
            <Input label="Rate" type="number" step="0.01" value={form.rate} onChange={e => s('rate', e.target.value)} />
            <Input label="Amount" required type="number" step="0.01" value={form.amount}
              onChange={e => s('amount', e.target.value)}
              hint={autoAmt > 0 ? `Auto: ${inr(autoAmt)}` : undefined} />
          </FormRow>
          <FormRow>
            <Input label="DC No" value={form.dc_no} onChange={e => s('dc_no', e.target.value)} />
            <Input label="Remarks" value={form.remarks} onChange={e => s('remarks', e.target.value)} />
          </FormRow>
        </div>
      </Modal>
    </div>
  )
}

// ── MEDICINE ENTRY ───────────────────────────────────────────────
export const MedicineEntry: React.FC = () => {
  const qc = useQueryClient()
  const { applyFlockFarmFilter, farmId } = useFarmScope()
  const [showForm, setShowForm] = useState(false)
  const [flockFilter, setFlockFilter] = useState('')

  const { data: flocks } = useQuery({
    queryKey: ['flocks_all', farmId],
    queryFn: async () => {
      let q = supabase.from('flocks').select('id,flock_no,laying_farm_id,rearing_farm_id').order('flock_no')
      q = applyFlockFarmFilter(q)
      const { data } = await q; return data ?? []
    }
  })
  const { data: medicines } = useQuery({
    queryKey: ['medicines'],
    queryFn: async () => { const { data } = await supabase.from('medicines_master').select('id,name,unit,rate').eq('is_active',true).order('name'); return data ?? [] }
  })

  const { data: usage, isLoading } = useQuery({
    queryKey: ['medicine_usage', flockFilter],
    queryFn: async () => {
      let q = supabase.from('medicine_usage')
        .select('*, flocks(flock_no), medicines_master(name,unit)')
        .order('usage_date', { ascending: false }).limit(200)
      if (flockFilter) q = q.eq('flock_id', flockFilter)
      const { data } = await q; return data ?? []
    }
  })

  const { data: monthly } = useQuery({
    queryKey: ['medicine_monthly', flockFilter],
    queryFn: async () => {
      let q = supabase.from('medicine_monthly').select('*, flocks(flock_no)').order('month', { ascending: false }).limit(60)
      if (flockFilter) q = q.eq('flock_id', flockFilter)
      const { data } = await q; return data ?? []
    }
  })

  const [tab, setTab] = useState<'daily' | 'monthly'>('monthly')
  const [form, setForm] = useState({
    flock_id: '', usage_date: today(), medicine_id: '',
    quantity: '', unit: '', rate: '', amount: '', remarks: ''
  })
  const [monthlyForm, setMonthlyForm] = useState({ flock_id: '', month: '', total_amount: '', remarks: '' })
  const s = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))
  const sm = (k: string, v: string) => setMonthlyForm(f => ({ ...f, [k]: v }))

  const autoAmt = (parseFloat(form.quantity)||0) * (parseFloat(form.rate)||0)

  const mut = useMutation({
    mutationFn: async () => {
      if (tab === 'monthly') {
        if (!monthlyForm.flock_id || !monthlyForm.month || !monthlyForm.total_amount) throw new Error('All fields required')
        const { error } = await supabase.from('medicine_monthly').upsert({
          flock_id: monthlyForm.flock_id, month: monthlyForm.month + '-01',
          total_amount: parseFloat(monthlyForm.total_amount),
          remarks: monthlyForm.remarks || null
        }, { onConflict: 'flock_id,month' })
        if (error) throw error
      } else {
        if (!form.flock_id || !form.usage_date) throw new Error('Flock and date required')
        const { error } = await supabase.from('medicine_usage').insert({
          flock_id: form.flock_id, usage_date: form.usage_date,
          medicine_id: form.medicine_id || null,
          quantity: parseFloat(form.quantity) || null, unit: form.unit || null,
          rate: parseFloat(form.rate) || null,
          amount: parseFloat(form.amount) || autoAmt || null,
          remarks: form.remarks || null
        })
        if (error) throw error
      }
    },
    onSuccess: () => {
      toast.success('Saved!')
      qc.invalidateQueries({ queryKey: ['medicine_usage'] })
      qc.invalidateQueries({ queryKey: ['medicine_monthly'] })
      setShowForm(false)
    },
    onError: (e: any) => toast.error(e.message)
  })

  const flockOptions = flocks?.map((f: any) => ({ value: f.id, label: `Flock ${f.flock_no}` })) ?? []
  const medOptions = medicines?.map((m: any) => ({ value: m.id, label: `${m.name} (${m.unit})` })) ?? []

  return (
    <div className="space-y-5">
      <SectionHeader title="Medicine & Vaccine"
        subtitle="Record medicine usage and monthly totals"
        action={<Button icon={<Plus size={16}/>} onClick={() => setShowForm(true)}>Add Entry</Button>}
      />
      <div className="flex gap-3 flex-wrap">
        <Select label="" placeholder="All Flocks" options={flockOptions}
          value={flockFilter} onChange={e => setFlockFilter(e.target.value)} className="w-44" />
        {flockFilter && <Button variant="ghost" size="sm" onClick={() => setFlockFilter('')}>Clear</Button>}
        <div className="flex rounded-lg border border-gray-200 overflow-hidden ml-auto">
          {(['monthly','daily'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-1.5 text-sm font-medium capitalize transition-colors
                ${tab===t ? 'bg-brand-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? <Spinner /> : tab === 'monthly' ? (
        <Card padding={false}>
          <Table>
            <thead><tr><Th>Flock</Th><Th>Month</Th><Th right>Total Amount</Th><Th>Remarks</Th></tr></thead>
            <tbody>
              {monthly?.map((m: any) => (
                <tr key={m.id} className="hover:bg-gray-50">
                  <Td><Badge color="green">F-{m.flocks?.flock_no}</Badge></Td>
                  <Td className="text-xs">{fmtDate(m.month)}</Td>
                  <Td right className="font-semibold">{inr(m.total_amount)}</Td>
                  <Td className="text-xs text-gray-400">{m.remarks ?? ''}</Td>
                </tr>
              ))}
            </tbody>
            {monthly && monthly.length > 0 && (
              <tfoot><tr className="bg-gray-50">
                <Td colSpan={2}><strong>TOTAL</strong></Td>
                <Td right><strong>{inr(monthly.reduce((s: number, m: any) => s + m.total_amount, 0))}</strong></Td>
                <Td> </Td>
              </tr></tfoot>
            )}
          </Table>
          {monthly?.length === 0 && <EmptyState icon={<Package size={32}/>} title="No medicine data" action={<Button onClick={() => setShowForm(true)} icon={<Plus size={16}/>}>Add Monthly Total</Button>} />}
        </Card>
      ) : (
        <Card padding={false}>
          <Table>
            <thead><tr>
              <Th>Flock</Th><Th>Date</Th><Th>Medicine</Th>
              <Th right>Qty</Th><Th right>Rate</Th><Th right>Amount</Th>
            </tr></thead>
            <tbody>
              {usage?.map((u: any) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <Td><Badge color="green">F-{u.flocks?.flock_no}</Badge></Td>
                  <Td className="text-xs">{fmtDate(u.usage_date)}</Td>
                  <Td className="text-sm">{u.medicines_master?.name ?? '—'}</Td>
                  <Td right className="text-xs">{u.quantity ?? '—'} {u.unit}</Td>
                  <Td right className="text-xs">{u.rate ? `Rs ${u.rate}` : '—'}</Td>
                  <Td right className="font-semibold text-xs">{u.amount ? inr(u.amount) : '—'}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
          {usage?.length === 0 && <EmptyState icon={<Package size={32}/>} title="No usage records" />}
        </Card>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Add Medicine Entry" size="md"
        footer={<><Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
          <Button loading={mut.isPending} onClick={() => mut.mutate()}>Save</Button></>}>
        {/* Tab inside modal */}
        <div className="flex rounded-lg border border-gray-200 overflow-hidden mb-4">
          {(['monthly','daily'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2 text-sm font-medium capitalize ${tab===t?'bg-brand-600 text-white':'text-gray-600 hover:bg-gray-50'}`}>
              {t === 'monthly' ? 'Monthly Total' : 'Daily Usage'}
            </button>
          ))}
        </div>
        {tab === 'monthly' ? (
          <div className="space-y-4">
            <FormRow>
              <Select label="Flock" required placeholder="— Select —" options={flockOptions}
                value={monthlyForm.flock_id} onChange={e => sm('flock_id', e.target.value)} />
              <Input label="Month" required type="month" value={monthlyForm.month} onChange={e => sm('month', e.target.value)} />
            </FormRow>
            <Input label="Total Medicine Amount (Rs)" required type="number" step="0.01"
              value={monthlyForm.total_amount} onChange={e => sm('total_amount', e.target.value)} />
            <Input label="Remarks" value={monthlyForm.remarks} onChange={e => sm('remarks', e.target.value)} />
          </div>
        ) : (
          <div className="space-y-4">
            <FormRow>
              <Select label="Flock" required placeholder="— Select —" options={flockOptions}
                value={form.flock_id} onChange={e => s('flock_id', e.target.value)} />
              <Input label="Date" required type="date" value={form.usage_date} onChange={e => s('usage_date', e.target.value)} />
            </FormRow>
            <Select label="Medicine / Vaccine" placeholder="— Select —" options={medOptions}
              value={form.medicine_id} onChange={e => {
                s('medicine_id', e.target.value)
                const med = medicines?.find((m: any) => m.id === e.target.value)
                if (med) { s('unit', med.unit); s('rate', med.rate?.toString() ?? '') }
              }} />
            <FormRow cols={4}>
              <Input label="Qty" type="number" step="0.001" value={form.quantity} onChange={e => s('quantity', e.target.value)} />
              <Input label="Unit" value={form.unit} onChange={e => s('unit', e.target.value)} />
              <Input label="Rate" type="number" step="0.01" value={form.rate} onChange={e => s('rate', e.target.value)} />
              <Input label="Amount" type="number" step="0.01" value={form.amount}
                onChange={e => s('amount', e.target.value)}
                hint={autoAmt > 0 ? `Auto: ${inr(autoAmt)}` : undefined} />
            </FormRow>
            <Input label="Remarks" value={form.remarks} onChange={e => s('remarks', e.target.value)} />
          </div>
        )}
      </Modal>
    </div>
  )
}
