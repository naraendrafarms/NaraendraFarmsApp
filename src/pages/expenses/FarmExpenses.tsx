import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { fmtDate, inr } from '@/lib/utils'
import { today } from '@/lib/utils'
import {
  Card, Button, Input, Select, FormRow, Modal, Table, Th, Td, Badge,
  SectionHeader, Spinner, EmptyState, StatCard
} from '@/components/ui'
import { Plus, Trash2, Download } from 'lucide-react'
import toast from 'react-hot-toast'
import * as XLSX from 'xlsx'

const CATEGORIES = [
  { value: 'maintenance',  label: 'Maintenance & Repairs' },
  { value: 'transport',    label: 'Transport / Logistics' },
  { value: 'water',        label: 'Water' },
  { value: 'fuel',         label: 'Fuel / Generator' },
  { value: 'insurance',    label: 'Insurance & Licenses' },
  { value: 'admin',        label: 'Administrative' },
  { value: 'veterinary',   label: 'Veterinary (non-medicine)' },
  { value: 'equipment',    label: 'Equipment / Tools' },
  { value: 'other',        label: 'Other' },
]

const CAT_COLORS: Record<string, any> = {
  maintenance: 'yellow', transport: 'blue', water: 'green', fuel: 'orange',
  insurance: 'gray', admin: 'gray', veterinary: 'green', equipment: 'blue', other: 'gray'
}

export const FarmExpensesPage: React.FC = () => {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [filterFarm, setFilterFarm] = useState('')
  const [filterFlock, setFilterFlock] = useState('')
  const [filterCat, setFilterCat] = useState('')
  const [filterFrom, setFilterFrom] = useState('')
  const [filterTo, setFilterTo] = useState('')

  const [form, setForm] = useState({
    expense_date: today(), farm_id: '', flock_id: '',
    category: 'maintenance', description: '', vendor: '',
    amount: '', payment_mode: 'cash', reference_no: '', remarks: ''
  })
  const s = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const { data: farms } = useQuery({
    queryKey: ['farms'],
    queryFn: async () => { const { data } = await supabase.from('farms').select('id,name,code').order('name'); return data ?? [] }
  })
  const { data: flocks } = useQuery({
    queryKey: ['flocks_active'],
    queryFn: async () => { const { data } = await supabase.from('flocks').select('id,flock_no').order('flock_no'); return data ?? [] }
  })

  const { data: expenses, isLoading } = useQuery({
    queryKey: ['farm_expenses', filterFarm, filterFlock, filterCat, filterFrom, filterTo],
    queryFn: async () => {
      let q = supabase.from('farm_expenses')
        .select('*, farms(name,code), flocks(flock_no)')
        .order('expense_date', { ascending: false })
        .limit(500)
      if (filterFarm)  q = q.eq('farm_id', filterFarm)
      if (filterFlock) q = q.eq('flock_id', filterFlock)
      if (filterCat)   q = q.eq('category', filterCat)
      if (filterFrom)  q = q.gte('expense_date', filterFrom)
      if (filterTo)    q = q.lte('expense_date', filterTo)
      const { data } = await q; return data ?? []
    }
  })

  const mut = useMutation({
    mutationFn: async () => {
      if (!form.description || !form.amount) throw new Error('Description and amount required')
      const { error } = await supabase.from('farm_expenses').insert({
        expense_date:  form.expense_date,
        farm_id:       form.farm_id || null,
        flock_id:      form.flock_id || null,
        category:      form.category,
        description:   form.description,
        vendor:        form.vendor || null,
        amount:        parseFloat(form.amount),
        payment_mode:  form.payment_mode || null,
        reference_no:  form.reference_no || null,
        remarks:       form.remarks || null,
      })
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Expense recorded')
      qc.invalidateQueries({ queryKey: ['farm_expenses'] })
      setShowForm(false)
      setForm({ expense_date: today(), farm_id: '', flock_id: '', category: 'maintenance', description: '', vendor: '', amount: '', payment_mode: 'cash', reference_no: '', remarks: '' })
    },
    onError: (e: any) => toast.error(e.message)
  })

  const delMut = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('farm_expenses').delete().eq('id', id); if (error) throw error },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['farm_expenses'] }); toast.success('Deleted') }
  })

  const farmOptions  = (farms ?? []).map((f: any) => ({ value: f.id, label: `${f.name} (${f.code})` }))
  const flockOptions = (flocks ?? []).map((f: any) => ({ value: f.id, label: `Flock ${f.flock_no}` }))
  const catOptions   = CATEGORIES.map(c => ({ value: c.value, label: c.label }))

  const totalAmount = (expenses ?? []).reduce((s: number, e: any) => s + (e.amount ?? 0), 0)

  // By-category breakdown
  const byCat: Record<string, number> = {}
  ;(expenses ?? []).forEach((e: any) => { byCat[e.category] = (byCat[e.category] ?? 0) + (e.amount ?? 0) })

  const handleExport = () => {
    if (!expenses?.length) return
    const ws = XLSX.utils.json_to_sheet((expenses ?? []).map((e: any) => ({
      Date: e.expense_date, Site: (e.farms as any)?.name ?? '', Flock: (e.flocks as any)?.flock_no ?? '',
      Category: e.category, Description: e.description, Vendor: e.vendor ?? '',
      Amount: e.amount, Payment: e.payment_mode ?? '', Ref: e.reference_no ?? '', Remarks: e.remarks ?? ''
    })))
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Farm Expenses')
    XLSX.writeFile(wb, `Farm_Expenses.xlsx`)
  }

  const hasFilter = filterFarm || filterFlock || filterCat || filterFrom || filterTo

  return (
    <div className="space-y-5">
      <SectionHeader title="Farm Expenses"
        subtitle="Maintenance, transport, water, fuel, admin and other operational costs"
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" icon={<Download size={14}/>} onClick={handleExport}>Export</Button>
            <Button icon={<Plus size={16}/>} onClick={() => setShowForm(true)}>Add Expense</Button>
          </div>
        }
      />

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 items-end">
          <Select label="Site" placeholder="All Sites" options={farmOptions} value={filterFarm} onChange={e => setFilterFarm(e.target.value)} />
          <Select label="Flock" placeholder="All Flocks" options={flockOptions} value={filterFlock} onChange={e => setFilterFlock(e.target.value)} />
          <Select label="Category" placeholder="All Categories" options={catOptions} value={filterCat} onChange={e => setFilterCat(e.target.value)} />
          <Input label="From" type="date" value={filterFrom} onChange={e => setFilterFrom(e.target.value)} />
          <Input label="To"   type="date" value={filterTo}   onChange={e => setFilterTo(e.target.value)} />
        </div>
        {hasFilter && <button className="text-xs text-brand-600 hover:underline mt-2" onClick={() => { setFilterFarm(''); setFilterFlock(''); setFilterCat(''); setFilterFrom(''); setFilterTo('') }}>Clear filters</button>}
      </Card>

      {/* Summary stats */}
      {(expenses ?? []).length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard title="Total Expenses" value={inr(totalAmount)} color="text-red-600" />
          <StatCard title="Records" value={(expenses ?? []).length.toString()} color="text-gray-600" />
          {Object.entries(byCat).sort(([,a],[,b])=>b-a).slice(0,2).map(([cat, amt]) => (
            <StatCard key={cat} title={CATEGORIES.find(c=>c.value===cat)?.label ?? cat} value={inr(amt)} color="text-orange-600" />
          ))}
        </div>
      )}

      {/* Category breakdown bar */}
      {Object.keys(byCat).length > 1 && (
        <Card>
          <p className="text-xs font-semibold text-gray-600 mb-3">By Category</p>
          <div className="space-y-2">
            {Object.entries(byCat).sort(([,a],[,b])=>b-a).map(([cat, amt]) => (
              <div key={cat} className="flex items-center gap-3">
                <span className="text-xs text-gray-500 w-40 truncate">{CATEGORIES.find(c=>c.value===cat)?.label ?? cat}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-2">
                  <div className="bg-red-400 h-2 rounded-full" style={{ width: totalAmount > 0 ? `${amt/totalAmount*100}%` : '0%' }}/>
                </div>
                <span className="text-xs font-semibold text-gray-700 w-24 text-right">{inr(amt)}</span>
                <span className="text-xs text-gray-400 w-10 text-right">{totalAmount > 0 ? (amt/totalAmount*100).toFixed(0)+'%' : ''}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {isLoading ? <Spinner /> : (
        <Card padding={false}>
          <Table>
            <thead><tr>
              <Th>Date</Th><Th>Site</Th><Th>Flock</Th><Th>Category</Th>
              <Th>Description</Th><Th>Vendor</Th>
              <Th right>Amount</Th><Th>Payment</Th><Th>Ref</Th><Th></Th>
            </tr></thead>
            <tbody>
              {(expenses ?? []).map((e: any) => (
                <tr key={e.id} className="hover:bg-gray-50">
                  <Td className="text-xs">{fmtDate(e.expense_date)}</Td>
                  <Td className="text-xs">{(e.farms as any)?.code ?? '—'}</Td>
                  <Td className="text-xs">{(e.flocks as any)?.flock_no ? <Badge color="green">F-{(e.flocks as any).flock_no}</Badge> : <span className="text-gray-300">—</span>}</Td>
                  <Td><Badge color={CAT_COLORS[e.category] ?? 'gray'}>{CATEGORIES.find(c=>c.value===e.category)?.label ?? e.category}</Badge></Td>
                  <Td className="text-xs max-w-xs truncate">{e.description}</Td>
                  <Td className="text-xs text-gray-500">{e.vendor ?? '—'}</Td>
                  <Td right className="text-xs font-semibold text-red-600">{inr(e.amount)}</Td>
                  <Td className="text-xs text-gray-400">{e.payment_mode ?? '—'}</Td>
                  <Td className="text-xs font-mono text-gray-400">{e.reference_no ?? '—'}</Td>
                  <Td>
                    <button onClick={() => { if (confirm('Delete this expense?')) delMut.mutate(e.id) }}
                      className="p-1 text-gray-400 hover:text-red-600"><Trash2 size={13}/></button>
                  </Td>
                </tr>
              ))}
            </tbody>
            {(expenses ?? []).length > 0 && (
              <tfoot><tr className="bg-gray-50 font-semibold">
                <Td colSpan={6}>TOTAL ({(expenses ?? []).length} records)</Td>
                <Td right>{inr(totalAmount)}</Td>
                <Td colSpan={3}></Td>
              </tr></tfoot>
            )}
          </Table>
          {(expenses ?? []).length === 0 && <EmptyState title="No expenses recorded" action={<Button icon={<Plus size={16}/>} onClick={() => setShowForm(true)}>Add First Expense</Button>} />}
        </Card>
      )}

      {/* Add form modal */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title="Record Farm Expense" size="md"
        footer={<><Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button><Button loading={mut.isPending} onClick={() => mut.mutate()}>Save</Button></>}>
        <div className="space-y-4">
          <FormRow>
            <Input label="Date" required type="date" value={form.expense_date} onChange={e => s('expense_date', e.target.value)} />
            <Select label="Category" required options={CATEGORIES} value={form.category} onChange={e => s('category', e.target.value)} />
          </FormRow>
          <FormRow>
            <Select label="Site" placeholder="— Optional —" options={farmOptions} value={form.farm_id} onChange={e => s('farm_id', e.target.value)} />
            <Select label="Flock" placeholder="— Optional —" options={flockOptions} value={form.flock_id} onChange={e => s('flock_id', e.target.value)} />
          </FormRow>
          <Input label="Description" required placeholder="e.g. Shed roof repair — Agraharam Shed 2" value={form.description} onChange={e => s('description', e.target.value)} />
          <FormRow>
            <Input label="Amount (₹)" required type="number" step="0.01" value={form.amount} onChange={e => s('amount', e.target.value)} />
            <Select label="Payment Mode" options={[{value:'cash',label:'Cash'},{value:'bank',label:'Bank Transfer'},{value:'credit',label:'Credit/Pending'}]} value={form.payment_mode} onChange={e => s('payment_mode', e.target.value)} />
          </FormRow>
          <FormRow>
            <Input label="Vendor / Contractor" placeholder="Name" value={form.vendor} onChange={e => s('vendor', e.target.value)} />
            <Input label="Reference / Bill No" value={form.reference_no} onChange={e => s('reference_no', e.target.value)} />
          </FormRow>
          <Input label="Remarks" value={form.remarks} onChange={e => s('remarks', e.target.value)} />
        </div>
      </Modal>
    </div>
  )
}
