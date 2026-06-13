import React, { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { fmtDate, inr } from '@/lib/utils'
import { today } from '@/lib/utils'
import {
  Card, Button, Input, Select, FormRow, Modal, Table, Th, Td, Badge,
  SectionHeader, Spinner, EmptyState, StatCard
} from '@/components/ui'
import { Plus, Trash2, Download, Upload, Pencil } from 'lucide-react'
import toast from 'react-hot-toast'
import * as XLSX from 'xlsx'
import { parseFile } from '@/lib/parseFile'

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

const PAYMENT_MODES = [
  { value: 'cash',   label: 'Cash' },
  { value: 'bank',   label: 'Bank Transfer' },
  { value: 'credit', label: 'Credit/Pending' },
]

const CB: React.FC<{ checked: boolean; indeterminate?: boolean; onChange: () => void }> = ({ checked, indeterminate, onChange }) => {
  const ref = useRef<HTMLInputElement>(null)
  React.useEffect(() => { if (ref.current) ref.current.indeterminate = !!indeterminate }, [indeterminate])
  return <input ref={ref} type="checkbox" checked={checked} onChange={onChange} className="rounded border-gray-300 text-brand-600 cursor-pointer" />
}

const emptyForm = () => ({
  expense_date: today(), farm_id: '', flock_id: '',
  category: 'maintenance', description: '', vendor: '',
  amount: '', payment_mode: 'cash', reference_no: '', remarks: ''
})

export const FarmExpensesPage: React.FC = () => {
  const qc = useQueryClient()
  const importRef = useRef<HTMLInputElement>(null)

  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [filterFarm, setFilterFarm] = useState('')
  const [filterFlock, setFilterFlock] = useState('')
  const [filterCat, setFilterCat] = useState('')
  const [filterFrom, setFilterFrom] = useState('')
  const [filterTo, setFilterTo] = useState('')
  const [sel, setSel] = useState<Set<string>>(new Set())
  const [bulkConfirm, setBulkConfirm] = useState(false)
  const [importing, setImporting] = useState(false)

  const [form, setForm] = useState(emptyForm())
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

  const openForm = (row?: any) => {
    if (row) {
      setEditing(row)
      setForm({
        expense_date: row.expense_date ?? today(),
        farm_id:      row.farm_id ?? '',
        flock_id:     row.flock_id ?? '',
        category:     row.category ?? 'maintenance',
        description:  row.description ?? '',
        vendor:       row.vendor ?? '',
        amount:       row.amount?.toString() ?? '',
        payment_mode: row.payment_mode ?? 'cash',
        reference_no: row.reference_no ?? '',
        remarks:      row.remarks ?? '',
      })
    } else {
      setEditing(null)
      setForm(emptyForm())
    }
    setShowForm(true)
  }

  const mut = useMutation({
    mutationFn: async () => {
      if (!form.description || !form.amount) throw new Error('Description and amount required')
      const payload = {
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
      }
      if (editing) {
        const { error } = await supabase.from('farm_expenses').update(payload).eq('id', editing.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('farm_expenses').insert(payload)
        if (error) throw error
      }
    },
    onSuccess: () => {
      toast.success(editing ? 'Updated' : 'Expense recorded')
      qc.invalidateQueries({ queryKey: ['farm_expenses'] })
      setShowForm(false); setEditing(null)
    },
    onError: (e: any) => toast.error(e.message)
  })

  const delMut = useMutation({
    mutationFn: async (ids: string[]) => {
      for (const id of ids) {
        const { error } = await supabase.from('farm_expenses').delete().eq('id', id)
        if (error) throw error
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['farm_expenses'] })
      toast.success('Deleted')
      setSel(new Set())
      setBulkConfirm(false)
    },
    onError: (e: any) => toast.error(e.message)
  })

  const handleExport = () => {
    const rows = expenses ?? []
    if (!rows.length) return toast.error('No data to export')
    const ws = XLSX.utils.json_to_sheet(rows.map((e: any) => ({
      Date: e.expense_date,
      Site: e.farms?.name ?? '',
      Site_Code: e.farms?.code ?? '',
      Flock: e.flocks?.flock_no ?? '',
      Category: e.category,
      Description: e.description,
      Vendor: e.vendor ?? '',
      Amount: e.amount,
      Payment_Mode: e.payment_mode ?? '',
      Reference_No: e.reference_no ?? '',
      Remarks: e.remarks ?? '',
    })))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Farm Expenses')
    XLSX.writeFile(wb, `Farm_Expenses_${new Date().toISOString().slice(0,10)}.xlsx`)
  }

  const handleTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ['expense_date','farm_code','flock_no','category','description','vendor','amount','payment_mode','reference_no','remarks'],
      ['2025-06-01','AGR','19','maintenance','Shed roof repair','Kumar Contractor','15000','cash','BILL001',''],
      ['2025-06-02','KPALLY','','fuel','Generator fuel','','3500','cash','','Monthly fill'],
    ])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Template')
    XLSX.writeFile(wb, 'Farm_Expenses_Import_Template.xlsx')
  }

  const handleImport = async (file: File) => {
    setImporting(true)
    try {
      const { headers: hdrs, rows: rawRows } = await parseFile(file)
      const records = rawRows.map(vals => {
        const obj: any = {}; hdrs.forEach((h, i) => { obj[h] = vals[i] ?? '' }); return obj
      }).filter((r: any) => r.expense_date && r.description && r.amount)

      const farmMap: Record<string, string> = {}
      ;(farms ?? []).forEach((f: any) => {
        farmMap[f.code?.toLowerCase()] = f.id
        farmMap[f.name?.toLowerCase()] = f.id
      })
      const flockMap: Record<string, string> = {}
      ;(flocks ?? []).forEach((f: any) => { flockMap[String(f.flock_no)] = f.id })

      const toInsert = records.map((r: any) => ({
        expense_date:  r.expense_date,
        farm_id:       farmMap[r.farm_code?.toLowerCase()] ?? farmMap[r.farm_name?.toLowerCase()] ?? null,
        flock_id:      r.flock_no ? flockMap[String(r.flock_no)] ?? null : null,
        category:      r.category || 'other',
        description:   r.description,
        vendor:        r.vendor || null,
        amount:        parseFloat(r.amount) || 0,
        payment_mode:  r.payment_mode || null,
        reference_no:  r.reference_no || null,
        remarks:       r.remarks || null,
      }))

      if (!toInsert.length) { toast.error('No valid rows found'); return }
      const { error } = await supabase.from('farm_expenses').insert(toInsert)
      if (error) throw error
      toast.success(`Imported ${toInsert.length} expenses`)
      qc.invalidateQueries({ queryKey: ['farm_expenses'] })
    } catch (e: any) {
      toast.error('Import failed: ' + e.message)
    } finally {
      setImporting(false)
      if (importRef.current) importRef.current.value = ''
    }
  }

  const rows = expenses ?? []
  const ids  = rows.map((r: any) => r.id)
  const allSel  = ids.length > 0 && ids.every((id: string) => sel.has(id))
  const someSel = ids.some((id: string) => sel.has(id)) && !allSel
  const toggle  = (id: string) => setSel(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  const toggleAll = () => setSel(allSel ? new Set() : new Set(ids))

  const farmOptions  = (farms ?? []).map((f: any) => ({ value: f.id, label: `${f.name} (${f.code})` }))
  const flockOptions = (flocks ?? []).map((f: any) => ({ value: f.id, label: `Flock ${f.flock_no}` }))
  const catOptions   = CATEGORIES.map(c => ({ value: c.value, label: c.label }))

  const totalAmount = rows.reduce((s: number, e: any) => s + (e.amount ?? 0), 0)
  const byCat: Record<string, number> = {}
  rows.forEach((e: any) => { byCat[e.category] = (byCat[e.category] ?? 0) + (e.amount ?? 0) })
  const hasFilter = filterFarm || filterFlock || filterCat || filterFrom || filterTo

  return (
    <div className="space-y-5">
      <SectionHeader title="Farm Expenses"
        subtitle="Maintenance, transport, water, fuel, admin and other operational costs"
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" icon={<Download size={14}/>} onClick={handleTemplate}>Template</Button>
            <Button variant="outline" size="sm" icon={<Upload size={14}/>} loading={importing} onClick={() => importRef.current?.click()}>Import</Button>
            <input ref={importRef} type="file" accept=".xlsx,.xls,.csv" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleImport(f) }} />
            <Button variant="outline" size="sm" icon={<Download size={14}/>} onClick={handleExport}>Export</Button>
            <Button icon={<Plus size={16}/>} onClick={() => openForm()}>Add Expense</Button>
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
        {hasFilter && <button className="text-xs text-brand-600 hover:underline mt-2"
          onClick={() => { setFilterFarm(''); setFilterFlock(''); setFilterCat(''); setFilterFrom(''); setFilterTo('') }}>Clear filters</button>}
      </Card>

      {/* Summary stats */}
      {rows.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard title="Total Expenses" value={inr(totalAmount)} color="text-red-600" />
          <StatCard title="Records" value={rows.length.toString()} color="text-gray-600" />
          {Object.entries(byCat).sort(([,a],[,b])=>b-a).slice(0,2).map(([cat, amt]) => (
            <StatCard key={cat} title={CATEGORIES.find(c=>c.value===cat)?.label ?? cat} value={inr(amt as number)} color="text-orange-600" />
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
                  <div className="bg-red-400 h-2 rounded-full" style={{ width: totalAmount > 0 ? `${(amt as number)/totalAmount*100}%` : '0%' }}/>
                </div>
                <span className="text-xs font-semibold text-gray-700 w-24 text-right">{inr(amt as number)}</span>
                <span className="text-xs text-gray-400 w-10 text-right">{totalAmount > 0 ? ((amt as number)/totalAmount*100).toFixed(0)+'%' : ''}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Bulk bar */}
      {sel.size > 0 && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
          <span className="text-sm font-medium text-red-700">{sel.size} selected</span>
          <button onClick={() => setSel(new Set())} className="text-xs text-gray-500 hover:text-gray-700 underline">Clear</button>
          <div className="ml-auto">
            <Button size="sm" variant="danger" icon={<Trash2 size={14}/>} onClick={() => setBulkConfirm(true)}>
              Delete {sel.size} rows
            </Button>
          </div>
        </div>
      )}

      {isLoading ? <Spinner /> : (
        <Card padding={false}>
          <Table>
            <thead><tr>
              <Th><CB checked={allSel} indeterminate={someSel} onChange={toggleAll} /></Th>
              <Th>Date</Th><Th>Site</Th><Th>Flock</Th><Th>Category</Th>
              <Th>Description</Th><Th>Vendor</Th>
              <Th right>Amount</Th><Th>Payment</Th><Th>Ref</Th><Th></Th>
            </tr></thead>
            <tbody>
              {rows.map((e: any) => (
                <tr key={e.id} className={`hover:bg-gray-50 ${sel.has(e.id) ? 'bg-blue-50' : ''}`}>
                  <Td><CB checked={sel.has(e.id)} onChange={() => toggle(e.id)} /></Td>
                  <Td className="text-xs">{fmtDate(e.expense_date)}</Td>
                  <Td className="text-xs">{e.farms?.code ?? '—'}</Td>
                  <Td className="text-xs">{e.flocks?.flock_no ? <Badge color="green">F-{e.flocks.flock_no}</Badge> : <span className="text-gray-300">—</span>}</Td>
                  <Td><Badge color={CAT_COLORS[e.category] ?? 'gray'}>{CATEGORIES.find(c=>c.value===e.category)?.label ?? e.category}</Badge></Td>
                  <Td className="text-xs max-w-xs truncate">{e.description}</Td>
                  <Td className="text-xs text-gray-500">{e.vendor ?? '—'}</Td>
                  <Td right className="text-xs font-semibold text-red-600">{inr(e.amount)}</Td>
                  <Td className="text-xs text-gray-400">{e.payment_mode ?? '—'}</Td>
                  <Td className="text-xs font-mono text-gray-400">{e.reference_no ?? '—'}</Td>
                  <Td>
                    <div className="flex gap-1">
                      <button onClick={() => openForm(e)} className="p-1 text-gray-400 hover:text-brand-600"><Pencil size={13}/></button>
                      <button onClick={() => { if (confirm('Delete this expense?')) delMut.mutate([e.id]) }}
                        className="p-1 text-gray-400 hover:text-red-600"><Trash2 size={13}/></button>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
            {rows.length > 0 && (
              <tfoot><tr className="bg-gray-50 font-semibold">
                <Td colSpan={7}>TOTAL ({rows.length} records)</Td>
                <Td right>{inr(totalAmount)}</Td>
                <Td colSpan={3}></Td>
              </tr></tfoot>
            )}
          </Table>
          {rows.length === 0 && <EmptyState title="No expenses recorded" action={<Button icon={<Plus size={16}/>} onClick={() => openForm()}>Add First Expense</Button>} />}
        </Card>
      )}

      {/* Add / Edit modal */}
      <Modal open={showForm} onClose={() => { setShowForm(false); setEditing(null) }}
        title={editing ? 'Edit Expense' : 'Record Farm Expense'} size="md"
        footer={
          <><Button variant="secondary" onClick={() => { setShowForm(false); setEditing(null) }}>Cancel</Button>
          <Button loading={mut.isPending} onClick={() => mut.mutate()}>{editing ? 'Update' : 'Save'}</Button></>
        }>
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
            <Select label="Payment Mode" options={PAYMENT_MODES} value={form.payment_mode} onChange={e => s('payment_mode', e.target.value)} />
          </FormRow>
          <FormRow>
            <Input label="Vendor / Contractor" placeholder="Name" value={form.vendor} onChange={e => s('vendor', e.target.value)} />
            <Input label="Reference / Bill No" value={form.reference_no} onChange={e => s('reference_no', e.target.value)} />
          </FormRow>
          <Input label="Remarks" value={form.remarks} onChange={e => s('remarks', e.target.value)} />
        </div>
      </Modal>

      {/* Bulk delete confirm */}
      <Modal open={bulkConfirm} onClose={() => setBulkConfirm(false)} title="Confirm Delete" size="sm"
        footer={
          <><Button variant="secondary" onClick={() => setBulkConfirm(false)}>Cancel</Button>
          <Button variant="danger" loading={delMut.isPending} onClick={() => delMut.mutate([...sel])}>
            Delete {sel.size} expense{sel.size > 1 ? 's' : ''}
          </Button></>
        }>
        <p className="text-sm text-gray-700">Delete <strong>{sel.size} selected expense{sel.size > 1 ? 's' : ''}</strong>? This cannot be undone.</p>
      </Modal>
    </div>
  )
}
