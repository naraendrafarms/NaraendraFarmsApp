import React, { useState, useRef, useMemo } from 'react'
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

// ── Constants ─────────────────────────────────────────────────────────────────

const TXN_TYPES = [
  { value: 'receipt', label: 'Receipt' },
  { value: 'payment', label: 'Payment' },
  { value: 'contra',  label: 'Contra' },
]

const CATEGORIES = [
  { value: 'sales_collection', label: 'Sales Collection' },
  { value: 'expense',          label: 'Expense' },
  { value: 'salary',           label: 'Salary' },
  { value: 'advance',          label: 'Advance' },
  { value: 'transfer',         label: 'Transfer' },
  { value: 'other',            label: 'Other' },
]

const PAYMENT_MODES = [
  { value: 'cash',   label: 'Cash' },
  { value: 'upi',    label: 'UPI' },
  { value: 'cheque', label: 'Cheque' },
]

const TYPE_COLORS: Record<string, 'green' | 'red' | 'blue' | 'gray'> = {
  receipt: 'green',
  payment: 'red',
  contra:  'blue',
}

const TYPE_ROW_STYLE: Record<string, string> = {
  receipt: 'border-l-4 border-l-green-400',
  payment: 'border-l-4 border-l-red-400',
  contra:  'border-l-4 border-l-blue-400',
}

const OPENING_BALANCE_KEY = 'cash_opening_balance'

// ── Checkbox component ────────────────────────────────────────────────────────

const CB: React.FC<{ checked: boolean; indeterminate?: boolean; onChange: () => void }> = ({ checked, indeterminate, onChange }) => {
  const ref = useRef<HTMLInputElement>(null)
  React.useEffect(() => { if (ref.current) ref.current.indeterminate = !!indeterminate }, [indeterminate])
  return <input ref={ref} type="checkbox" checked={checked} onChange={onChange} className="rounded border-gray-300 text-brand-600 cursor-pointer" />
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function currentMonthRange() {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const lastDay = new Date(y, now.getMonth() + 1, 0).getDate()
  return {
    from: `${y}-${m}-01`,
    to:   `${y}-${m}-${String(lastDay).padStart(2, '0')}`,
  }
}

function emptyForm() {
  return {
    txn_date:     today(),
    txn_type:     'receipt',
    category:     'sales_collection',
    description:  '',
    party_name:   '',
    farm_id:      '',
    flock_id:     '',
    reference_no: '',
    amount_in:    '',
    amount_out:   '',
    payment_mode: 'cash',
    remarks:      '',
  }
}

// ── Main Component ────────────────────────────────────────────────────────────

export const CashBookPage: React.FC = () => {
  const qc = useQueryClient()
  const importRef = useRef<HTMLInputElement>(null)

  // Opening balance (localStorage)
  const [openingBalance, setOpeningBalance] = useState<number>(() => {
    const v = localStorage.getItem(OPENING_BALANCE_KEY)
    return v ? parseFloat(v) : 0
  })
  const [editingOB, setEditingOB] = useState(false)
  const [obInput, setObInput] = useState('')

  // Date range filter — default current month
  const defaultRange = currentMonthRange()
  const [filterFrom, setFilterFrom] = useState(defaultRange.from)
  const [filterTo,   setFilterTo]   = useState(defaultRange.to)

  // Form / modal state
  const [showForm,    setShowForm]    = useState(false)
  const [editing,     setEditing]     = useState<any>(null)
  const [form,        setForm]        = useState(emptyForm())
  const [bulkConfirm, setBulkConfirm] = useState(false)
  const [importing,   setImporting]   = useState(false)

  // Selection state
  const [sel, setSel] = useState<Set<string>>(new Set())

  const sf = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  // ── Queries ───────────────────────────────────────────────────────────────

  const { data: farms } = useQuery({
    queryKey: ['farms'],
    queryFn: async () => {
      const { data } = await supabase.from('farms').select('id,name,code').order('name')
      return data ?? []
    }
  })

  const { data: flocks } = useQuery({
    queryKey: ['flocks_active'],
    queryFn: async () => {
      const { data } = await supabase.from('flocks').select('id,flock_no').order('flock_no')
      return data ?? []
    }
  })

  const { data: txns, isLoading } = useQuery({
    queryKey: ['cash_book', filterFrom, filterTo],
    queryFn: async () => {
      let q = supabase
        .from('cash_book')
        .select('*, farms(name,code), flocks(flock_no)')
        .order('txn_date', { ascending: true })
        .order('created_at', { ascending: true })
        .limit(1000)
      if (filterFrom) q = q.gte('txn_date', filterFrom)
      if (filterTo)   q = q.lte('txn_date', filterTo)
      const { data } = await q
      return data ?? []
    }
  })

  // ── Derived data ─────────────────────────────────────────────────────────

  // Compute running balance (asc order for calculation)
  const rowsWithBalance = useMemo(() => {
    if (!txns) return []
    let balance = openingBalance
    return txns.map((t: any) => {
      balance += (t.amount_in ?? 0) - (t.amount_out ?? 0)
      return { ...t, runningBalance: balance }
    })
  }, [txns, openingBalance])

  // Display in reverse order (newest first)
  const displayRows = useMemo(() => [...rowsWithBalance].reverse(), [rowsWithBalance])

  const totalReceipts = useMemo(() =>
    (txns ?? []).reduce((s: number, t: any) => s + (t.amount_in ?? 0), 0), [txns])
  const totalPayments = useMemo(() =>
    (txns ?? []).reduce((s: number, t: any) => s + (t.amount_out ?? 0), 0), [txns])
  const closingBalance = openingBalance + totalReceipts - totalPayments

  const ids     = displayRows.map((r: any) => r.id)
  const allSel  = ids.length > 0 && ids.every((id: string) => sel.has(id))
  const someSel = ids.some((id: string) => sel.has(id)) && !allSel
  const toggle  = (id: string) => setSel(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  const toggleAll = () => setSel(allSel ? new Set() : new Set(ids))

  const farmOptions  = (farms ?? []).map((f: any) => ({ value: f.id, label: `${f.name} (${f.code})` }))
  const flockOptions = (flocks ?? []).map((f: any) => ({ value: f.id, label: `Flock ${f.flock_no}` }))

  // ── Mutations ─────────────────────────────────────────────────────────────

  const mut = useMutation({
    mutationFn: async () => {
      if (!form.description) throw new Error('Description is required')
      const amtIn  = parseFloat(form.amount_in)  || 0
      const amtOut = parseFloat(form.amount_out) || 0
      if (amtIn === 0 && amtOut === 0) throw new Error('Enter amount in or amount out')
      const payload = {
        txn_date:     form.txn_date,
        txn_type:     form.txn_type,
        category:     form.category || null,
        description:  form.description,
        party_name:   form.party_name  || null,
        farm_id:      form.farm_id     || null,
        flock_id:     form.flock_id    || null,
        reference_no: form.reference_no || null,
        amount_in:    amtIn,
        amount_out:   amtOut,
        payment_mode: form.payment_mode || 'cash',
        remarks:      form.remarks      || null,
      }
      if (editing) {
        const { error } = await supabase.from('cash_book').update(payload).eq('id', editing.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('cash_book').insert(payload)
        if (error) throw error
      }
    },
    onSuccess: () => {
      toast.success(editing ? 'Updated' : 'Transaction recorded')
      qc.invalidateQueries({ queryKey: ['cash_book'] })
      setShowForm(false)
      setEditing(null)
    },
    onError: (e: any) => toast.error(e.message)
  })

  const delMut = useMutation({
    mutationFn: async (ids: string[]) => {
      for (const id of ids) {
        const { error } = await supabase.from('cash_book').delete().eq('id', id)
        if (error) throw error
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cash_book'] })
      toast.success('Deleted')
      setSel(new Set())
      setBulkConfirm(false)
    },
    onError: (e: any) => toast.error(e.message)
  })

  // ── Handlers ──────────────────────────────────────────────────────────────

  const openForm = (row?: any) => {
    if (row) {
      setEditing(row)
      setForm({
        txn_date:     row.txn_date      ?? today(),
        txn_type:     row.txn_type      ?? 'receipt',
        category:     row.category      ?? 'other',
        description:  row.description   ?? '',
        party_name:   row.party_name    ?? '',
        farm_id:      row.farm_id       ?? '',
        flock_id:     row.flock_id      ?? '',
        reference_no: row.reference_no  ?? '',
        amount_in:    row.amount_in?.toString()  ?? '',
        amount_out:   row.amount_out?.toString() ?? '',
        payment_mode: row.payment_mode   ?? 'cash',
        remarks:      row.remarks        ?? '',
      })
    } else {
      setEditing(null)
      setForm(emptyForm())
    }
    setShowForm(true)
  }

  const saveOpeningBalance = () => {
    const v = parseFloat(obInput)
    if (isNaN(v)) { toast.error('Enter a valid number'); return }
    localStorage.setItem(OPENING_BALANCE_KEY, String(v))
    setOpeningBalance(v)
    setEditingOB(false)
    toast.success('Opening balance saved')
  }

  const handleExport = () => {
    if (!displayRows.length) { toast.error('No data to export'); return }
    const rows = [...rowsWithBalance].reverse().map((t: any) => ({
      Date:           t.txn_date,
      Type:           t.txn_type,
      Category:       t.category ?? '',
      Description:    t.description,
      Party:          t.party_name ?? '',
      Farm:           t.farms?.code ?? '',
      Flock:          t.flocks?.flock_no ?? '',
      Reference:      t.reference_no ?? '',
      Receipt_INR:    t.amount_in ?? 0,
      Payment_INR:    t.amount_out ?? 0,
      Balance_INR:    t.runningBalance,
      Payment_Mode:   t.payment_mode ?? '',
      Remarks:        t.remarks ?? '',
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Cash Book')
    XLSX.writeFile(wb, `Cash_Book_${filterFrom}_to_${filterTo}.xlsx`)
  }

  const handleTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ['txn_date','txn_type','category','description','party_name','amount_in','amount_out','payment_mode','reference_no','remarks'],
      ['2025-06-01','receipt','sales_collection','Egg sale collection','Ram Traders','50000','0','cash','INV001',''],
      ['2025-06-02','payment','expense','Feed purchase payment','Srinivasa Feeds','0','35000','cheque','CHQ0042',''],
    ])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Template')
    XLSX.writeFile(wb, 'Cash_Book_Import_Template.xlsx')
  }

  const handleImport = async (file: File) => {
    setImporting(true)
    try {
      const { headers: hdrs, rows: rawRows } = await parseFile(file)
      const records = rawRows.map(vals => {
        const obj: any = {}; hdrs.forEach((h, i) => { obj[h] = vals[i] ?? '' }); return obj
      }).filter((r: any) => r.txn_date && r.description)

      const toInsert = records.map((r: any) => ({
        txn_date:     r.txn_date,
        txn_type:     (['receipt','payment','contra'].includes(r.txn_type) ? r.txn_type : 'receipt'),
        category:     r.category || 'other',
        description:  r.description,
        party_name:   r.party_name  || null,
        reference_no: r.reference_no || null,
        amount_in:    parseFloat(r.amount_in)  || 0,
        amount_out:   parseFloat(r.amount_out) || 0,
        payment_mode: (['cash','upi','cheque'].includes(r.payment_mode) ? r.payment_mode : 'cash'),
        remarks:      r.remarks || null,
      }))

      if (!toInsert.length) { toast.error('No valid rows found'); return }
      const { error } = await supabase.from('cash_book').insert(toInsert)
      if (error) throw error
      toast.success(`Imported ${toInsert.length} transactions`)
      qc.invalidateQueries({ queryKey: ['cash_book'] })
    } catch (e: any) {
      toast.error('Import failed: ' + e.message)
    } finally {
      setImporting(false)
      if (importRef.current) importRef.current.value = ''
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Cash Book"
        subtitle="Daily cash receipts and payments with running balance"
        action={
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" icon={<Download size={14}/>} onClick={handleTemplate}>Template</Button>
            <Button variant="outline" size="sm" icon={<Upload size={14}/>} loading={importing} onClick={() => importRef.current?.click()}>Import</Button>
            <input ref={importRef} type="file" accept=".xlsx,.xls,.csv" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleImport(f) }} />
            <Button variant="outline" size="sm" icon={<Download size={14}/>} onClick={handleExport}>Export</Button>
            <Button icon={<Plus size={16}/>} onClick={() => openForm()}>Add Transaction</Button>
          </div>
        }
      />

      {/* Opening Balance */}
      <Card>
        <div className="flex items-center gap-4 flex-wrap">
          <div>
            <p className="text-xs text-gray-500 font-medium">Opening Balance</p>
            {editingOB ? (
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="number" step="0.01"
                  value={obInput}
                  onChange={e => setObInput(e.target.value)}
                  placeholder="Enter opening balance"
                  className="border rounded px-2 py-1 text-sm w-48 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  autoFocus
                  onKeyDown={e => { if (e.key === 'Enter') saveOpeningBalance(); if (e.key === 'Escape') setEditingOB(false) }}
                />
                <button onClick={saveOpeningBalance} className="text-xs text-brand-600 font-semibold hover:underline">Save</button>
                <button onClick={() => setEditingOB(false)} className="text-xs text-gray-400 hover:underline">Cancel</button>
              </div>
            ) : (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-lg font-bold text-gray-800">{inr(openingBalance)}</span>
                <button onClick={() => { setObInput(String(openingBalance)); setEditingOB(true) }}
                  className="text-xs text-brand-600 hover:underline">Edit</button>
              </div>
            )}
            <p className="text-xs text-gray-400 mt-0.5">Stored locally in your browser</p>
          </div>
        </div>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard title="Opening Balance" value={inr(openingBalance)} color="text-gray-700" />
        <StatCard title="Total Receipts" value={inr(totalReceipts)} color="text-green-600" />
        <StatCard title="Total Payments" value={inr(totalPayments)} color="text-red-600" />
        <StatCard title="Closing Balance" value={inr(closingBalance)} color={closingBalance >= 0 ? 'text-blue-700' : 'text-red-700'} />
      </div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 items-end">
          <Input label="From Date" type="date" value={filterFrom} onChange={e => setFilterFrom(e.target.value)} />
          <Input label="To Date"   type="date" value={filterTo}   onChange={e => setFilterTo(e.target.value)} />
          <div className="flex gap-2">
            <button className="text-xs text-brand-600 hover:underline mt-5"
              onClick={() => { const r = currentMonthRange(); setFilterFrom(r.from); setFilterTo(r.to) }}>
              This Month
            </button>
            <button className="text-xs text-gray-500 hover:underline mt-5"
              onClick={() => { setFilterFrom(''); setFilterTo('') }}>
              All Time
            </button>
          </div>
        </div>
      </Card>

      {/* Bulk delete bar */}
      {sel.size > 0 && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
          <span className="text-sm font-medium text-red-700">{sel.size} selected</span>
          <button onClick={() => setSel(new Set())} className="text-xs text-gray-500 hover:text-gray-700 underline">Clear</button>
          <div className="ml-auto">
            <Button size="sm" variant="danger" icon={<Trash2 size={14}/>} onClick={() => setBulkConfirm(true)}>
              Delete {sel.size} row{sel.size > 1 ? 's' : ''}
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      {isLoading ? <Spinner /> : (
        <Card padding={false}>
          <Table>
            <thead>
              <tr>
                <Th><CB checked={allSel} indeterminate={someSel} onChange={toggleAll} /></Th>
                <Th>Date</Th>
                <Th>Type</Th>
                <Th>Category</Th>
                <Th>Description</Th>
                <Th>Party</Th>
                <Th className="text-right">Receipt (₹)</Th>
                <Th className="text-right">Payment (₹)</Th>
                <Th className="text-right">Balance (₹)</Th>
                <Th>Mode</Th>
                <Th></Th>
              </tr>
            </thead>
            <tbody>
              {displayRows.map((t: any) => (
                <tr key={t.id} className={`hover:bg-gray-50 ${sel.has(t.id) ? 'bg-blue-50' : ''} ${TYPE_ROW_STYLE[t.txn_type] ?? ''}`}>
                  <Td><CB checked={sel.has(t.id)} onChange={() => toggle(t.id)} /></Td>
                  <Td className="text-xs whitespace-nowrap">{fmtDate(t.txn_date)}</Td>
                  <Td><Badge color={TYPE_COLORS[t.txn_type] ?? 'gray'}>{t.txn_type}</Badge></Td>
                  <Td className="text-xs text-gray-500">
                    {CATEGORIES.find(c => c.value === t.category)?.label ?? t.category ?? '—'}
                  </Td>
                  <Td className="text-xs max-w-xs truncate">{t.description}</Td>
                  <Td className="text-xs text-gray-500">{t.party_name ?? '—'}</Td>
                  <Td className="text-right text-sm font-semibold text-green-700">
                    {(t.amount_in ?? 0) > 0 ? inr(t.amount_in) : <span className="text-gray-300">—</span>}
                  </Td>
                  <Td className="text-right text-sm font-semibold text-red-700">
                    {(t.amount_out ?? 0) > 0 ? inr(t.amount_out) : <span className="text-gray-300">—</span>}
                  </Td>
                  <Td className={`text-right text-sm font-bold ${t.runningBalance >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
                    {inr(t.runningBalance)}
                  </Td>
                  <Td className="text-xs text-gray-400 capitalize">{t.payment_mode ?? '—'}</Td>
                  <Td>
                    <div className="flex gap-1">
                      <button onClick={() => openForm(t)} className="p-1 text-gray-400 hover:text-brand-600">
                        <Pencil size={13}/>
                      </button>
                      <button
                        onClick={() => { if (confirm('Delete this transaction?')) delMut.mutate([t.id]) }}
                        className="p-1 text-gray-400 hover:text-red-600">
                        <Trash2 size={13}/>
                      </button>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
            {displayRows.length > 0 && (
              <tfoot>
                <tr className="bg-gray-50 font-semibold">
                  <Td colSpan={6}>TOTAL ({displayRows.length} transactions)</Td>
                  <Td className="text-right text-green-700">{inr(totalReceipts)}</Td>
                  <Td className="text-right text-red-700">{inr(totalPayments)}</Td>
                  <Td className={`text-right ${closingBalance >= 0 ? 'text-blue-700' : 'text-red-700'}`}>{inr(closingBalance)}</Td>
                  <Td colSpan={2}></Td>
                </tr>
              </tfoot>
            )}
          </Table>
          {displayRows.length === 0 && (
            <EmptyState
              title="No transactions found"
              action={<Button icon={<Plus size={16}/>} onClick={() => openForm()}>Add First Transaction</Button>}
            />
          )}
        </Card>
      )}

      {/* Add / Edit Modal */}
      <Modal
        open={showForm}
        onClose={() => { setShowForm(false); setEditing(null) }}
        title={editing ? 'Edit Transaction' : 'Add Cash Transaction'}
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setShowForm(false); setEditing(null) }}>Cancel</Button>
            <Button loading={mut.isPending} onClick={() => mut.mutate()}>{editing ? 'Update' : 'Save'}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <FormRow>
            <Input label="Date" required type="date" value={form.txn_date} onChange={e => sf('txn_date', e.target.value)} />
            <Select label="Type" required options={TXN_TYPES} value={form.txn_type} onChange={e => {
              const t = e.target.value
              sf('txn_type', t)
              // Auto-set amount_in/out fields based on type
              if (t === 'receipt') sf('amount_out', '0')
              if (t === 'payment') sf('amount_in', '0')
            }} />
          </FormRow>
          <FormRow>
            <Select label="Category" options={CATEGORIES} value={form.category} onChange={e => sf('category', e.target.value)} />
            <Select label="Payment Mode" options={PAYMENT_MODES} value={form.payment_mode} onChange={e => sf('payment_mode', e.target.value)} />
          </FormRow>
          <Input
            label="Description"
            required
            placeholder="e.g. Egg sale collection from Ram Traders"
            value={form.description}
            onChange={e => sf('description', e.target.value)}
          />
          <FormRow>
            <Input
              label="Receipt Amount (₹)"
              type="number" step="0.01"
              placeholder="0.00"
              value={form.amount_in}
              onChange={e => sf('amount_in', e.target.value)}
            />
            <Input
              label="Payment Amount (₹)"
              type="number" step="0.01"
              placeholder="0.00"
              value={form.amount_out}
              onChange={e => sf('amount_out', e.target.value)}
            />
          </FormRow>
          <FormRow>
            <Input label="Party Name" placeholder="Vendor / Customer name" value={form.party_name} onChange={e => sf('party_name', e.target.value)} />
            <Input label="Reference / Cheque No" value={form.reference_no} onChange={e => sf('reference_no', e.target.value)} />
          </FormRow>
          <FormRow>
            <Select label="Farm (optional)" placeholder="— Select Farm —" options={farmOptions} value={form.farm_id} onChange={e => sf('farm_id', e.target.value)} />
            <Select label="Flock (optional)" placeholder="— Select Flock —" options={flockOptions} value={form.flock_id} onChange={e => sf('flock_id', e.target.value)} />
          </FormRow>
          <Input label="Remarks" placeholder="Optional notes" value={form.remarks} onChange={e => sf('remarks', e.target.value)} />
        </div>
      </Modal>

      {/* Bulk delete confirm */}
      <Modal
        open={bulkConfirm}
        onClose={() => setBulkConfirm(false)}
        title="Confirm Delete"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setBulkConfirm(false)}>Cancel</Button>
            <Button variant="danger" loading={delMut.isPending} onClick={() => delMut.mutate([...sel])}>
              Delete {sel.size} transaction{sel.size > 1 ? 's' : ''}
            </Button>
          </>
        }
      >
        <p className="text-sm text-gray-700">
          Delete <strong>{sel.size} selected transaction{sel.size > 1 ? 's' : ''}</strong>? This cannot be undone.
        </p>
      </Modal>
    </div>
  )
}
