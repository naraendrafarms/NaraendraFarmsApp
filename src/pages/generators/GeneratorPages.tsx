import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { inr, exportCSV, today } from '@/lib/utils'
import {
  Card, Button, Input, Select, FormRow, Modal, Table, Th, Td, Badge,
  SectionHeader, Spinner, EmptyState, DateInput,
} from '@/components/ui'
import { Plus, Pencil, Trash2, Download, Zap } from 'lucide-react'
import toast from 'react-hot-toast'

const TABS = ['Usage Log', 'Diesel Purchases', 'Maintenance', 'Generators'] as const

export const GeneratorsPage: React.FC = () => {
  const [tab, setTab] = useState<typeof TABS[number]>('Usage Log')
  const qc = useQueryClient()

  const { data: farms = [] } = useQuery({
    queryKey: ['farms'],
    queryFn: async () => { const { data } = await supabase.from('farms').select('id,name,code').eq('is_active', true).order('name'); return data ?? [] }
  })
  const { data: generators = [] } = useQuery({
    queryKey: ['generators'],
    queryFn: async () => { const { data } = await supabase.from('generators').select('*, farms(name,code)').order('name'); return data ?? [] }
  })

  return (
    <div className="space-y-5">
      <SectionHeader title="Generators" subtitle="Per-site generator usage, diesel purchases, and maintenance" />
      <div className="flex gap-1 border-b border-gray-100 overflow-x-auto">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 -mb-px ${tab === t ? 'border-green-600 text-green-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t}
          </button>
        ))}
      </div>
      {tab === 'Generators' && <GeneratorsTab farms={farms} generators={generators} qc={qc} />}
      {tab === 'Usage Log' && <UsageLogTab generators={generators} />}
      {tab === 'Diesel Purchases' && <DieselPurchasesTab farms={farms} generators={generators} />}
      {tab === 'Maintenance' && <MaintenanceTab generators={generators} />}
    </div>
  )
}

// ── GENERATORS MASTER ────────────────────────────────────────────
const GeneratorsTab: React.FC<{ farms: any[]; generators: any[]; qc: any }> = ({ farms, generators, qc }) => {
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ farm_id: '', name: '', code: '', capacity_kva: '' })
  const s = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const saveMut = useMutation({
    mutationFn: async () => {
      const payload = { farm_id: form.farm_id || null, name: form.name, code: form.code || null, capacity_kva: parseFloat(form.capacity_kva) || null }
      if (editing) { const { error } = await supabase.from('generators').update(payload).eq('id', editing.id); if (error) throw error }
      else { const { error } = await supabase.from('generators').insert(payload); if (error) throw error }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['generators'] }); setShowForm(false); setEditing(null); toast.success('Saved') },
    onError: (e: any) => toast.error(e.message),
  })
  const delMut = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('generators').delete().eq('id', id); if (error) throw error },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['generators'] }); toast.success('Deleted') },
    onError: (e: any) => toast.error(e.message),
  })

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button icon={<Plus size={14} />} onClick={() => { setEditing(null); setForm({ farm_id: '', name: '', code: '', capacity_kva: '' }); setShowForm(true) }}>Add Generator</Button>
      </div>
      <Card padding={false}>
        <Table>
          <thead><tr><Th>Name</Th><Th>Code</Th><Th>Farm</Th><Th right>Capacity (KVA)</Th><Th right>Actions</Th></tr></thead>
          <tbody>
            {generators.map((g: any) => (
              <tr key={g.id} className="hover:bg-gray-50">
                <Td className="font-medium">{g.name}</Td>
                <Td>{g.code ?? '—'}</Td>
                <Td>{g.farms?.name ?? '—'}</Td>
                <Td right>{g.capacity_kva ?? '—'}</Td>
                <Td right>
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => { setEditing(g); setForm({ farm_id: g.farm_id ?? '', name: g.name, code: g.code ?? '', capacity_kva: g.capacity_kva?.toString() ?? '' }); setShowForm(true) }}><Pencil size={14} className="text-gray-400 hover:text-brand-600" /></button>
                    <button onClick={() => confirm('Delete this generator?') && delMut.mutate(g.id)}><Trash2 size={14} className="text-gray-400 hover:text-red-600" /></button>
                  </div>
                </Td>
              </tr>
            ))}
            {generators.length === 0 && <tr><Td colSpan={5}><EmptyState icon={<Zap size={28} />} title="No generators added yet" /></Td></tr>}
          </tbody>
        </Table>
      </Card>
      <Modal open={showForm} onClose={() => setShowForm(false)} title={editing ? 'Edit Generator' : 'Add Generator'}
        footer={<Button loading={saveMut.isPending} onClick={() => saveMut.mutate()}>Save</Button>}>
        <div className="space-y-3">
          <FormRow>
            <Select label="Farm" value={form.farm_id} onChange={e => s('farm_id', e.target.value)} placeholder="Select Farm"
              options={farms.map((f: any) => ({ value: f.id, label: f.name }))} />
            <Input label="Name *" value={form.name} onChange={e => s('name', e.target.value)} placeholder="e.g. Generator 1" />
          </FormRow>
          <FormRow>
            <Input label="Code" value={form.code} onChange={e => s('code', e.target.value)} />
            <Input label="Capacity (KVA)" type="number" value={form.capacity_kva} onChange={e => s('capacity_kva', e.target.value)} />
          </FormRow>
        </div>
      </Modal>
    </div>
  )
}

// ── USAGE LOG ────────────────────────────────────────────────────
const UsageLogTab: React.FC<{ generators: any[] }> = ({ generators }) => {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const blank = { generator_id: '', log_date: today(), hours_run: '', diesel_consumed_ltr: '', opening_reading: '', closing_reading: '', remarks: '' }
  const [form, setForm] = useState(blank)
  const s = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['generator_usage_log'],
    queryFn: async () => { const { data } = await supabase.from('generator_usage_log').select('*, generators(name,code,farms(name))').order('log_date', { ascending: false }).limit(200); return data ?? [] }
  })

  const saveMut = useMutation({
    mutationFn: async () => {
      const payload = {
        generator_id: form.generator_id, log_date: form.log_date,
        hours_run: parseFloat(form.hours_run) || null,
        diesel_consumed_ltr: parseFloat(form.diesel_consumed_ltr) || null,
        opening_reading: parseFloat(form.opening_reading) || null,
        closing_reading: parseFloat(form.closing_reading) || null,
        remarks: form.remarks || null,
      }
      if (!payload.generator_id) throw new Error('Pick a generator')
      if (editing) { const { error } = await supabase.from('generator_usage_log').update(payload).eq('id', editing.id); if (error) throw error }
      else { const { error } = await supabase.from('generator_usage_log').insert(payload); if (error) throw error }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['generator_usage_log'] }); setShowForm(false); setEditing(null); toast.success('Saved') },
    onError: (e: any) => toast.error(e.message),
  })
  const delMut = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('generator_usage_log').delete().eq('id', id); if (error) throw error },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['generator_usage_log'] }); toast.success('Deleted') },
  })

  const exportRows = () => exportCSV(`generator_usage_${today()}.csv`,
    ['Date', 'Generator', 'Farm', 'Hours Run', 'Diesel (Ltr)', 'Ltr/Hr', 'Opening', 'Closing', 'Remarks'],
    logs.map((l: any) => [l.log_date, l.generators?.name, l.generators?.farms?.name, l.hours_run, l.diesel_consumed_ltr,
      l.hours_run > 0 ? (l.diesel_consumed_ltr / l.hours_run).toFixed(2) : '', l.opening_reading, l.closing_reading, l.remarks]))

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
        <Button variant="outline" icon={<Download size={14} />} onClick={exportRows}>Export</Button>
        <Button icon={<Plus size={14} />} onClick={() => { setEditing(null); setForm(blank); setShowForm(true) }}>Add Entry</Button>
      </div>
      {isLoading ? <Spinner /> : (
        <Card padding={false}>
          <Table>
            <thead><tr><Th>Date</Th><Th>Generator</Th><Th>Farm</Th><Th right>Hours</Th><Th right>Diesel (Ltr)</Th><Th right>Ltr/Hr</Th><Th right>Actions</Th></tr></thead>
            <tbody>
              {logs.map((l: any) => (
                <tr key={l.id} className="hover:bg-gray-50">
                  <Td>{l.log_date}</Td>
                  <Td className="font-medium">{l.generators?.name}</Td>
                  <Td>{l.generators?.farms?.name ?? '—'}</Td>
                  <Td right>{l.hours_run ?? '—'}</Td>
                  <Td right>{l.diesel_consumed_ltr ?? '—'}</Td>
                  <Td right>{l.hours_run > 0 ? (l.diesel_consumed_ltr / l.hours_run).toFixed(2) : '—'}</Td>
                  <Td right>
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => { setEditing(l); setForm({ generator_id: l.generator_id, log_date: l.log_date, hours_run: l.hours_run?.toString() ?? '', diesel_consumed_ltr: l.diesel_consumed_ltr?.toString() ?? '', opening_reading: l.opening_reading?.toString() ?? '', closing_reading: l.closing_reading?.toString() ?? '', remarks: l.remarks ?? '' }); setShowForm(true) }}><Pencil size={14} className="text-gray-400 hover:text-brand-600" /></button>
                      <button onClick={() => confirm('Delete this entry?') && delMut.mutate(l.id)}><Trash2 size={14} className="text-gray-400 hover:text-red-600" /></button>
                    </div>
                  </Td>
                </tr>
              ))}
              {logs.length === 0 && <tr><Td colSpan={7}><EmptyState title="No usage entries yet" /></Td></tr>}
            </tbody>
          </Table>
        </Card>
      )}
      <Modal open={showForm} onClose={() => setShowForm(false)} title={editing ? 'Edit Usage Entry' : 'Add Usage Entry'}
        footer={<Button loading={saveMut.isPending} onClick={() => saveMut.mutate()}>Save</Button>}>
        <div className="space-y-3">
          <FormRow>
            <Select label="Generator *" value={form.generator_id} onChange={e => s('generator_id', e.target.value)} placeholder="Select Generator"
              options={generators.map((g: any) => ({ value: g.id, label: `${g.name}${g.farms?.name ? ` (${g.farms.name})` : ''}` }))} />
            <DateInput label="Date *" value={form.log_date} onChange={e => s('log_date', e.target.value)} />
          </FormRow>
          <FormRow>
            <Input label="Hours Run" type="number" step="0.1" value={form.hours_run} onChange={e => s('hours_run', e.target.value)} />
            <Input label="Diesel Consumed (Ltr)" type="number" step="0.1" value={form.diesel_consumed_ltr} onChange={e => s('diesel_consumed_ltr', e.target.value)} />
          </FormRow>
          <FormRow>
            <Input label="Opening Reading" type="number" value={form.opening_reading} onChange={e => s('opening_reading', e.target.value)} />
            <Input label="Closing Reading" type="number" value={form.closing_reading} onChange={e => s('closing_reading', e.target.value)} />
          </FormRow>
          <Input label="Remarks" value={form.remarks} onChange={e => s('remarks', e.target.value)} />
        </div>
      </Modal>
    </div>
  )
}

// ── DIESEL PURCHASES ─────────────────────────────────────────────
const DieselPurchasesTab: React.FC<{ farms: any[]; generators: any[] }> = ({ farms, generators }) => {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const blank = { generator_id: '', farm_id: '', purchase_date: today(), qty_ltr: '', rate: '', supplier: '', payment_mode: 'Cash', bank_account_id: '', remarks: '' }
  const [form, setForm] = useState(blank)
  const s = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const { data: purchases = [], isLoading } = useQuery({
    queryKey: ['generator_diesel_purchases'],
    queryFn: async () => { const { data } = await supabase.from('generator_diesel_purchases').select('*, generators(name), farms(name), bank_accounts(bank_name,account_name)').order('purchase_date', { ascending: false }).limit(200); return data ?? [] }
  })
  const { data: bankAccounts = [] } = useQuery({
    queryKey: ['bank_accounts'],
    queryFn: async () => { const { data } = await supabase.from('bank_accounts').select('id,bank_name,account_name').eq('is_active', true).order('bank_name'); return data ?? [] }
  })
  const { data: usageTotals } = useQuery({
    queryKey: ['generator_usage_totals'],
    queryFn: async () => { const { data } = await supabase.from('generator_usage_log').select('diesel_consumed_ltr'); return (data ?? []).reduce((s: number, r: any) => s + (Number(r.diesel_consumed_ltr) || 0), 0) }
  })

  const totalPurchased = purchases.reduce((s: number, r: any) => s + (Number(r.qty_ltr) || 0), 0)
  const totalConsumed = usageTotals ?? 0
  const balance = totalPurchased - totalConsumed

  const saveMut = useMutation({
    mutationFn: async () => {
      const qty = parseFloat(form.qty_ltr) || 0, rate = parseFloat(form.rate) || 0
      const amt = qty * rate
      if (form.payment_mode === 'Bank' && !form.bank_account_id) throw new Error('Pick a bank account')
      const { data: purchase, error } = await supabase.from('generator_diesel_purchases').insert({
        generator_id: form.generator_id || null, farm_id: form.farm_id || null, purchase_date: form.purchase_date,
        qty_ltr: qty, rate: rate || null, amount: amt || null, supplier: form.supplier || null,
        payment_mode: form.payment_mode, bank_account_id: form.payment_mode === 'Bank' ? form.bank_account_id : null,
        remarks: form.remarks || null,
      }).select('id').single()
      if (error) throw error
      // Real expense — post to Cash Book (Cash) or Bank Ledger (Bank), same
      // pattern as Bag Sales / NHE sales payments.
      const description = `Diesel purchase${form.supplier ? ` — ${form.supplier}` : ''} (${qty} Ltr)`
      if (amt > 0 && form.payment_mode === 'Cash') {
        const { error: cbErr } = await supabase.from('cash_book').insert({
          txn_date: form.purchase_date, txn_type: 'payment', category: 'expense',
          description, party_name: form.supplier || null, farm_id: form.farm_id || null,
          amount_in: 0, amount_out: amt, payment_mode: 'cash', diesel_purchase_id: purchase.id,
        })
        if (cbErr) throw new Error('Purchase saved, but Cash Book entry failed: ' + cbErr.message)
      } else if (amt > 0 && form.payment_mode === 'Bank' && form.bank_account_id) {
        const { error: btErr } = await supabase.from('bank_transactions').insert({
          bank_account_id: form.bank_account_id, txn_date: form.purchase_date, txn_type: 'Debit',
          category: 'Diesel Purchase', reference_no: null, description, amount: amt,
        })
        if (btErr) throw new Error('Purchase saved, but Bank Ledger entry failed: ' + btErr.message)
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['generator_diesel_purchases'] }); qc.invalidateQueries({ queryKey: ['cash_book'] }); qc.invalidateQueries({ queryKey: ['bank_transactions'] }); setShowForm(false); setForm(blank); toast.success('Saved') },
    onError: (e: any) => toast.error(e.message),
  })
  const delMut = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('generator_diesel_purchases').delete().eq('id', id); if (error) throw error },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['generator_diesel_purchases'] }); toast.success('Deleted') },
  })

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <Card className="!p-3 text-center"><p className="text-lg font-bold text-gray-700">{totalPurchased.toFixed(0)} Ltr</p><p className="text-xs text-gray-500">Purchased</p></Card>
        <Card className="!p-3 text-center"><p className="text-lg font-bold text-blue-600">{totalConsumed.toFixed(0)} Ltr</p><p className="text-xs text-gray-500">Consumed (usage log)</p></Card>
        <Card className="!p-3 text-center"><p className={`text-lg font-bold ${balance < 0 ? 'text-red-600' : 'text-green-600'}`}>{balance.toFixed(0)} Ltr</p><p className="text-xs text-gray-500">Balance in stock</p></Card>
      </div>
      <div className="flex justify-end"><Button icon={<Plus size={14} />} onClick={() => { setForm(blank); setShowForm(true) }}>Add Purchase</Button></div>
      {isLoading ? <Spinner /> : (
        <Card padding={false}>
          <Table>
            <thead><tr><Th>Date</Th><Th>Generator</Th><Th>Farm</Th><Th>Supplier</Th><Th right>Qty (Ltr)</Th><Th right>Rate</Th><Th right>Amount</Th><Th right>Actions</Th></tr></thead>
            <tbody>
              {purchases.map((p: any) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <Td>{p.purchase_date}</Td><Td>{p.generators?.name ?? '—'}</Td><Td>{p.farms?.name ?? '—'}</Td><Td>{p.supplier ?? '—'}</Td>
                  <Td right>{p.qty_ltr}</Td><Td right>{p.rate ? inr(p.rate) : '—'}</Td><Td right className="font-semibold">{p.amount ? inr(p.amount) : '—'}</Td>
                  <Td right><button onClick={() => confirm('Delete?') && delMut.mutate(p.id)}><Trash2 size={14} className="text-gray-400 hover:text-red-600" /></button></Td>
                </tr>
              ))}
              {purchases.length === 0 && <tr><Td colSpan={8}><EmptyState title="No diesel purchases yet" /></Td></tr>}
            </tbody>
          </Table>
        </Card>
      )}
      <Modal open={showForm} onClose={() => setShowForm(false)} title="Add Diesel Purchase"
        footer={<Button loading={saveMut.isPending} onClick={() => saveMut.mutate()}>Save</Button>}>
        <div className="space-y-3">
          <FormRow>
            <Select label="Farm" value={form.farm_id} onChange={e => s('farm_id', e.target.value)} placeholder="Select Farm" options={farms.map((f: any) => ({ value: f.id, label: f.name }))} />
            <Select label="Generator (optional)" value={form.generator_id} onChange={e => s('generator_id', e.target.value)} placeholder="Select Generator" options={generators.map((g: any) => ({ value: g.id, label: g.name }))} />
          </FormRow>
          <FormRow>
            <DateInput label="Date *" value={form.purchase_date} onChange={e => s('purchase_date', e.target.value)} />
            <Input label="Qty (Ltr) *" type="number" value={form.qty_ltr} onChange={e => s('qty_ltr', e.target.value)} />
          </FormRow>
          <FormRow>
            <Input label="Rate (₹/Ltr)" type="number" value={form.rate} onChange={e => s('rate', e.target.value)} />
            <Input label="Supplier" value={form.supplier} onChange={e => s('supplier', e.target.value)} />
          </FormRow>
          <FormRow>
            <Select label="Paid From" value={form.payment_mode} onChange={e => s('payment_mode', e.target.value)}
              options={[{ value: 'Cash', label: 'Cash' }, { value: 'Bank', label: 'Bank' }]} />
            {form.payment_mode === 'Bank' && (
              <Select label="Bank Account *" value={form.bank_account_id} onChange={e => s('bank_account_id', e.target.value)}
                placeholder="Select Bank" options={bankAccounts.map((b: any) => ({ value: b.id, label: `${b.bank_name}${b.account_name ? ' — ' + b.account_name : ''}` }))} />
            )}
          </FormRow>
          <Input label="Remarks" value={form.remarks} onChange={e => s('remarks', e.target.value)} />
        </div>
      </Modal>
    </div>
  )
}

// ── MAINTENANCE ──────────────────────────────────────────────────
const MaintenanceTab: React.FC<{ generators: any[] }> = ({ generators }) => {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const blank = { generator_id: '', service_date: today(), work_done: '', cost: '', next_due_date: '', remarks: '' }
  const [form, setForm] = useState(blank)
  const s = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['generator_maintenance_log'],
    queryFn: async () => { const { data } = await supabase.from('generator_maintenance_log').select('*, generators(name,farms(name))').order('service_date', { ascending: false }); return data ?? [] }
  })

  const saveMut = useMutation({
    mutationFn: async () => {
      const payload = { generator_id: form.generator_id, service_date: form.service_date, work_done: form.work_done || null, cost: parseFloat(form.cost) || null, next_due_date: form.next_due_date || null, remarks: form.remarks || null }
      if (!payload.generator_id) throw new Error('Pick a generator')
      const { error } = await supabase.from('generator_maintenance_log').insert(payload)
      if (error) throw error
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['generator_maintenance_log'] }); setShowForm(false); setForm(blank); toast.success('Saved') },
    onError: (e: any) => toast.error(e.message),
  })
  const delMut = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('generator_maintenance_log').delete().eq('id', id); if (error) throw error },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['generator_maintenance_log'] }); toast.success('Deleted') },
  })

  const todayStr = today()
  const dueSoon = logs.filter((l: any) => l.next_due_date && l.next_due_date <= todayStr)

  return (
    <div className="space-y-4">
      {dueSoon.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
          <strong>{dueSoon.length} generator(s) due for service:</strong> {dueSoon.map((d: any) => d.generators?.name).join(', ')}
        </div>
      )}
      <div className="flex justify-end"><Button icon={<Plus size={14} />} onClick={() => { setForm(blank); setShowForm(true) }}>Add Service Record</Button></div>
      {isLoading ? <Spinner /> : (
        <Card padding={false}>
          <Table>
            <thead><tr><Th>Date</Th><Th>Generator</Th><Th>Work Done</Th><Th right>Cost</Th><Th>Next Due</Th><Th right>Actions</Th></tr></thead>
            <tbody>
              {logs.map((l: any) => (
                <tr key={l.id} className="hover:bg-gray-50">
                  <Td>{l.service_date}</Td><Td className="font-medium">{l.generators?.name}</Td><Td>{l.work_done ?? '—'}</Td>
                  <Td right>{l.cost ? inr(l.cost) : '—'}</Td>
                  <Td>{l.next_due_date ? <Badge color={l.next_due_date <= todayStr ? 'red' : 'gray'}>{l.next_due_date}</Badge> : '—'}</Td>
                  <Td right><button onClick={() => confirm('Delete?') && delMut.mutate(l.id)}><Trash2 size={14} className="text-gray-400 hover:text-red-600" /></button></Td>
                </tr>
              ))}
              {logs.length === 0 && <tr><Td colSpan={6}><EmptyState title="No maintenance records yet" /></Td></tr>}
            </tbody>
          </Table>
        </Card>
      )}
      <Modal open={showForm} onClose={() => setShowForm(false)} title="Add Service Record"
        footer={<Button loading={saveMut.isPending} onClick={() => saveMut.mutate()}>Save</Button>}>
        <div className="space-y-3">
          <Select label="Generator *" value={form.generator_id} onChange={e => s('generator_id', e.target.value)} placeholder="Select Generator" options={generators.map((g: any) => ({ value: g.id, label: g.name }))} />
          <FormRow>
            <DateInput label="Service Date *" value={form.service_date} onChange={e => s('service_date', e.target.value)} />
            <Input label="Cost" type="number" value={form.cost} onChange={e => s('cost', e.target.value)} />
          </FormRow>
          <Input label="Work Done" value={form.work_done} onChange={e => s('work_done', e.target.value)} />
          <DateInput label="Next Service Due" value={form.next_due_date} onChange={e => s('next_due_date', e.target.value)} />
          <Input label="Remarks" value={form.remarks} onChange={e => s('remarks', e.target.value)} />
        </div>
      </Modal>
    </div>
  )
}
