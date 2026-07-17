import React, { useState, useRef, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { fmtDate, inr } from '@/lib/utils'
import { today, FY_OPTIONS, currentFY, fyRange } from '@/lib/utils'
import {
  Card, Button, Input, Select, FormRow, Modal, Table, Th, Td, Badge,
  SectionHeader, Spinner, EmptyState, StatCard
, DateInput, SearchableSelect } from '@/components/ui'
import { Plus, Trash2, Download, Upload, Pencil, ArrowLeftRight } from 'lucide-react'
import toast from 'react-hot-toast'
import * as XLSX from 'xlsx'
import { parseFile } from '@/lib/parseFile'
import { useConfigOptions } from '@/hooks/useConfigOptions'

// ── Fallback constants (used only if DB is empty) ─────────────────────────────

const TXN_TYPES_FB = [
  { value: 'receipt', label: 'Receipt' },
  { value: 'payment', label: 'Payment' },
  { value: 'contra',  label: 'Contra' },
]

const CATEGORIES_FB = [
  { value: 'sales_collection', label: 'Sales Collection (General)' },
  { value: 'he_sale',          label: 'HE Egg Sale' },
  { value: 'je_sale',          label: 'Jumbo Egg Sale (JE)' },
  { value: 'te_sale',          label: 'Table Egg Sale (TE)' },
  { value: 'be_sale',          label: 'Broken/Crack Egg Sale (BE)' },
  { value: 'bird_sale',        label: 'Bird Sale' },
  { value: 'litter_sale',      label: 'Litter / Manure Sale' },
  { value: 'bag_sale',         label: 'Empty Bag Sale' },
  { value: 'expense',          label: 'Expense' },
  { value: 'salary',           label: 'Salary' },
  { value: 'advance',          label: 'Advance' },
  { value: 'transfer',         label: 'Transfer' },
  { value: 'other',            label: 'Other' },
]

const PAYMENT_MODES_FB = [
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

// Opening balance is keyed by location: '' (all) → 'all', 'ho', or a farm UUID
const obKey = (loc: string) => loc || 'all'

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

  const TXN_TYPES    = useConfigOptions('txn_type', TXN_TYPES_FB)
  const CATEGORIES   = useConfigOptions('cashbook_category', CATEGORIES_FB)
  const PAYMENT_MODES = useConfigOptions('payment_method', PAYMENT_MODES_FB)

  // Financial year selector — drives opening balance + default date range
  const [fy, setFy] = useState(currentFY())

  // Date range filter — default to the selected FY range
  const fyDefault = fyRange(fy)
  const [filterFrom, setFilterFrom] = useState(fyDefault.start)
  const [filterTo,   setFilterTo]   = useState(fyDefault.end)

  // When the FY changes, reset the date range to that FY's range
  React.useEffect(() => {
    const r = fyRange(fy)
    setFilterFrom(r.start)
    setFilterTo(r.end)
  }, [fy])

  // Location filter: '' = all, 'ho' = Head Office (farm_id IS NULL), or a farm UUID
  const [filterLocation, setFilterLocation] = useState('')
  // Flock filter (DB-level via flock_id on cash_book)
  const [filterFlock, setFilterFlock] = useState('')
  // Mode filter: '' = all, 'cash' = payment_mode is cash, 'bank' = anything else (upi/cheque/transfer/etc.)
  const [filterMode, setFilterMode] = useState('')
  // Party name search (client-side text search)
  const [filterParty, setFilterParty] = useState('')

  // Opening balance (server-side, per-location) — see migration 135
  const [editingOB, setEditingOB] = useState(false)
  const [obInput, setObInput] = useState('')

  const { data: openingRows } = useQuery({
    queryKey: ['cash_book_opening'],
    queryFn: async () => {
      const { data } = await supabase.from('cash_book_opening').select('location_key,balance,fy')
      return data ?? []
    }
  })
  const openingBalance = useMemo(() => {
    const key = obKey(filterLocation)
    const rows = (openingRows ?? []).filter((r: any) => r.location_key === key)
    // Prefer the row matching the selected FY; else fall back to the legacy fy IS NULL row
    const row = rows.find((r: any) => r.fy === fy) ?? rows.find((r: any) => r.fy == null)
    return row ? Number(row.balance) : 0
  }, [openingRows, filterLocation, fy])

  // Internal Transfer modal
  const [showTransfer, setShowTransfer] = useState(false)
  const [xferForm, setXferForm] = useState({
    date: today(), amount: '', description: '', fromLocation: 'ho', toLocation: '',
  })
  const [xferSaving, setXferSaving] = useState(false)

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
    queryKey: ['cash_book', filterFrom, filterTo, filterLocation, filterFlock],
    queryFn: async () => {
      let q = supabase
        .from('cash_book')
        .select('*, farms(name,code), flocks(flock_no)')
        .order('txn_date', { ascending: true })
        .order('created_at', { ascending: true })
        .limit(2000)
      if (filterFrom) q = q.gte('txn_date', filterFrom)
      if (filterTo)   q = q.lte('txn_date', filterTo)
      if (filterLocation === 'ho') q = q.is('farm_id', null)
      else if (filterLocation) q = q.eq('farm_id', filterLocation)
      if (filterFlock) q = q.eq('flock_id', filterFlock)
      const { data } = await q
      return data ?? []
    }
  })

  // Net movement between FY start and the From-date, so the running balance is
  // still correct when the visible range is narrowed inside the FY.
  const fyStart = fyRange(fy).start
  const { data: preNet = 0 } = useQuery({
    queryKey: ['cash_book_prenet', fy, filterFrom, filterLocation, filterFlock],
    enabled: !!filterFrom && filterFrom > fyStart,
    queryFn: async () => {
      let q = supabase
        .from('cash_book')
        .select('amount_in,amount_out')
        .gte('txn_date', fyStart)
        .lt('txn_date', filterFrom)
        .limit(10000)
      if (filterLocation === 'ho') q = q.is('farm_id', null)
      else if (filterLocation) q = q.eq('farm_id', filterLocation)
      if (filterFlock) q = q.eq('flock_id', filterFlock)
      const { data } = await q
      return (data ?? []).reduce((s: number, t: any) => s + (t.amount_in ?? 0) - (t.amount_out ?? 0), 0)
    }
  })

  // ── Derived data ─────────────────────────────────────────────────────────

  const effectiveOpening = openingBalance + (filterFrom && filterFrom > fyStart ? preNet : 0)

  // Compute running balance (asc order for calculation)
  const rowsWithBalance = useMemo(() => {
    if (!txns) return []
    let balance = effectiveOpening
    return txns.map((t: any) => {
      balance += (t.amount_in ?? 0) - (t.amount_out ?? 0)
      return { ...t, runningBalance: balance }
    })
  }, [txns, effectiveOpening])

  // Display in reverse order (newest first), with optional party name search
  const displayRows = useMemo(() => {
    let reversed = [...rowsWithBalance].reverse()
    if (filterMode === 'cash') reversed = reversed.filter((t: any) => (t.payment_mode ?? 'cash').toLowerCase() === 'cash')
    else if (filterMode === 'bank') reversed = reversed.filter((t: any) => (t.payment_mode ?? 'cash').toLowerCase() !== 'cash')
    if (!filterParty.trim()) return reversed
    const q = filterParty.trim().toLowerCase()
    return reversed.filter((t: any) =>
      (t.party_name ?? '').toLowerCase().includes(q) ||
      (t.description ?? '').toLowerCase().includes(q)
    )
  }, [rowsWithBalance, filterParty, filterMode])

  // Totals reflect the currently filtered/visible rows (Excel-style subtotal).
  // displayRows already accounts for location, flock and party/description filters.
  const totalReceipts = useMemo(() =>
    displayRows.reduce((s: number, t: any) => s + (t.amount_in ?? 0), 0), [displayRows])
  const totalPayments = useMemo(() =>
    displayRows.reduce((s: number, t: any) => s + (t.amount_out ?? 0), 0), [displayRows])
  // Net of the filtered rows. Opening balance is only meaningful for the full
  // (unfiltered-by-party) ledger, so only add it when no party search is active.
  const isFiltered = !!filterParty.trim() || !!filterMode
  const closingBalance = isFiltered
    ? totalReceipts - totalPayments
    : effectiveOpening + totalReceipts - totalPayments

  const ids     = displayRows.map((r: any) => r.id)
  const allSel  = ids.length > 0 && ids.every((id: string) => sel.has(id))
  const someSel = ids.some((id: string) => sel.has(id)) && !allSel
  const toggle  = (id: string) => setSel(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  const toggleAll = () => setSel(allSel ? new Set() : new Set(ids))

  const farmOptions       = (farms  ?? []).map((f: any) => ({ value: f.id, label: `${f.name} (${f.code})` }))
  const flockOptions      = (flocks ?? []).map((f: any) => ({ value: f.id, label: `Flock ${f.flock_no}` }))
  const flockFilterOptions = [
    { value: '', label: 'All Flocks' },
    ...(flocks ?? []).map((f: any) => ({ value: f.id, label: `Flock ${f.flock_no}` })),
  ]
  const locationOptions = [
    { value: '', label: 'All Locations' },
    { value: 'ho', label: 'Head Office' },
    ...(farms ?? []).map((f: any) => ({ value: f.id, label: `${f.name} (Site)` })),
  ]
  const xferLocationOptions = [
    { value: 'ho', label: 'Head Office' },
    ...(farms ?? []).map((f: any) => ({ value: f.id, label: `${f.name} (Site)` })),
  ]

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

  const obMut = useMutation({
    mutationFn: async (v: number) => {
      const key = obKey(filterLocation)
      // Update the (location_key, fy) row if it exists, else insert a new one.
      const { data: existing } = await supabase.from('cash_book_opening')
        .select('id').eq('location_key', key).eq('fy', fy).maybeSingle()
      if (existing) {
        const { error } = await supabase.from('cash_book_opening')
          .update({ balance: v, updated_at: new Date().toISOString() })
          .eq('id', (existing as any).id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('cash_book_opening')
          .insert({ location_key: key, fy, balance: v, updated_at: new Date().toISOString() })
        if (error) throw error
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cash_book_opening'] })
      setEditingOB(false)
      toast.success('Opening balance saved')
    },
    onError: (e: any) => toast.error(e.message)
  })

  const saveOpeningBalance = () => {
    const v = parseFloat(obInput)
    if (isNaN(v)) { toast.error('Enter a valid number'); return }
    obMut.mutate(v)
  }

  const handleTransfer = async () => {
    const amt = parseFloat(xferForm.amount)
    if (!amt || amt <= 0) { toast.error('Enter a valid amount'); return }
    if (xferForm.fromLocation === xferForm.toLocation) { toast.error('From and To locations must differ'); return }
    if (!xferForm.description) { toast.error('Enter a description'); return }
    setXferSaving(true)
    try {
      const fromFarmId = xferForm.fromLocation === 'ho' ? null : xferForm.fromLocation
      const toFarmId   = xferForm.toLocation   === 'ho' ? null : xferForm.toLocation
      const desc = xferForm.description
      // Payment at source
      await supabase.from('cash_book').insert({
        txn_date: xferForm.date, txn_type: 'contra', category: 'transfer',
        description: desc, farm_id: fromFarmId,
        amount_in: 0, amount_out: amt, payment_mode: 'cash',
      })
      // Receipt at destination
      await supabase.from('cash_book').insert({
        txn_date: xferForm.date, txn_type: 'contra', category: 'transfer',
        description: desc, farm_id: toFarmId,
        amount_in: amt, amount_out: 0, payment_mode: 'cash',
      })
      toast.success('Internal transfer recorded')
      qc.invalidateQueries({ queryKey: ['cash_book'] })
      setShowTransfer(false)
      setXferForm({ date: today(), amount: '', description: '', fromLocation: 'ho', toLocation: '' })
    } catch (e: any) { toast.error(e.message) }
    setXferSaving(false)
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
        payment_mode: (['cash','upi','cheque','neft','rtgs','imps','bank_transfer'].includes(r.payment_mode) ? r.payment_mode : 'cash'),
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
            <Button variant="outline" size="sm" icon={<ArrowLeftRight size={14}/>} onClick={() => setShowTransfer(true)}>Transfer</Button>
            <Button icon={<Plus size={16}/>} onClick={() => openForm()}>Add Transaction</Button>
          </div>
        }
      />

      {/* Opening Balance */}
      <Card>
        <div className="flex items-center gap-4 flex-wrap">
          <div>
            <p className="text-xs text-gray-500 font-medium">
              Opening Balance {filterLocation === 'ho' ? '(Head Office)' : filterLocation ? `(${(farms ?? []).find((f: any) => f.id === filterLocation)?.name ?? 'Site'})` : '(All)'}
            </p>
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
            <p className="text-xs text-gray-400 mt-0.5">Saved on the server — shared across devices &amp; users</p>
          </div>
        </div>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard title="Opening Balance" value={inr(openingBalance)} color="text-gray-700" />
        <StatCard title={isFiltered ? 'Receipts (filtered)' : 'Total Receipts'} value={inr(totalReceipts)} color="text-green-600" />
        <StatCard title={isFiltered ? 'Payments (filtered)' : 'Total Payments'} value={inr(totalPayments)} color="text-red-600" />
        <StatCard title={isFiltered ? 'Net (filtered)' : 'Closing Balance'} value={inr(closingBalance)} color={closingBalance >= 0 ? 'text-blue-700' : 'text-red-700'} />
      </div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 items-end mb-3">
          <Select label="Financial Year"
            options={FY_OPTIONS.map(o => ({ value: o, label: `FY ${o}` }))}
            value={fy} onChange={e => setFy(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 items-end">
          <DateInput label="From Date" value={filterFrom} onChange={e => setFilterFrom(e.target.value)} />
          <DateInput label="To Date"   value={filterTo}   onChange={e => setFilterTo(e.target.value)} />
          <Select label="Location (Cash at)"
            options={locationOptions} value={filterLocation}
            onChange={e => setFilterLocation(e.target.value)} />
          <Select label="Flock"
            options={flockFilterOptions} value={filterFlock}
            onChange={e => setFilterFlock(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 items-end mt-3">
          <div className="md:col-span-2">
            <Input
              label="Party / Description search"
              placeholder="Search by party name or description…"
              value={filterParty}
              onChange={e => setFilterParty(e.target.value)}
            />
          </div>
          <Select label="Cash / Bank"
            options={[{ value: '', label: 'All' }, { value: 'cash', label: 'Cash only' }, { value: 'bank', label: 'Bank only' }]}
            value={filterMode}
            onChange={e => setFilterMode(e.target.value)} />
          <div className="flex gap-3 items-end pb-0.5">
            <button className="text-xs text-brand-600 hover:underline"
              onClick={() => { const r = currentMonthRange(); setFilterFrom(r.from); setFilterTo(r.to) }}>
              This Month
            </button>
            <button className="text-xs text-gray-500 hover:underline"
              onClick={() => { setFilterFrom(''); setFilterTo('') }}>
              All Time
            </button>
            {(filterLocation || filterFlock || filterParty || filterMode) && (
              <button className="text-xs text-red-500 hover:underline"
                onClick={() => { setFilterLocation(''); setFilterFlock(''); setFilterParty(''); setFilterMode('') }}>
                Clear Filters
              </button>
            )}
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
                <Th>Location</Th>
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
                  <Td className="text-xs text-gray-500">{t.farms?.name ?? <span className="text-purple-600 font-medium">HO</span>}</Td>
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
                  <Td colSpan={7}>TOTAL ({displayRows.length} transactions)</Td>
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
            <DateInput label="Date" required value={form.txn_date} onChange={e => sf('txn_date', e.target.value)} />
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
            <SearchableSelect label="Farm (optional)" placeholder="— Select Farm —" options={farmOptions} value={form.farm_id} onChange={v => sf('farm_id', v)} />
            <SearchableSelect label="Flock (optional)" placeholder="— Select Flock —" options={flockOptions} value={form.flock_id} onChange={v => sf('flock_id', v)} />
          </FormRow>
          <Input label="Remarks" placeholder="Optional notes" value={form.remarks} onChange={e => sf('remarks', e.target.value)} />
        </div>
      </Modal>

      {/* Internal Transfer Modal */}
      <Modal
        open={showTransfer}
        onClose={() => setShowTransfer(false)}
        title="Internal Cash Transfer"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowTransfer(false)}>Cancel</Button>
            <Button loading={xferSaving} onClick={handleTransfer}>Record Transfer</Button>
          </>
        }
      >
        <div className="space-y-4 text-sm text-gray-600 mb-2">
          Transfer cash between a farm site and Head Office. Two contra entries will be created automatically.
        </div>
        <div className="space-y-3">
          <FormRow>
            <DateInput label="Date" value={xferForm.date} onChange={e => setXferForm(f => ({ ...f, date: e.target.value }))} />
            <Input label="Amount (₹)" type="number" step="0.01" placeholder="0.00" value={xferForm.amount} onChange={e => setXferForm(f => ({ ...f, amount: e.target.value }))} />
          </FormRow>
          <FormRow>
            <Select label="From" options={xferLocationOptions} value={xferForm.fromLocation} onChange={e => setXferForm(f => ({ ...f, fromLocation: e.target.value }))} />
            <Select label="To" options={xferLocationOptions} value={xferForm.toLocation} onChange={e => setXferForm(f => ({ ...f, toLocation: e.target.value }))} />
          </FormRow>
          <Input label="Description" placeholder="e.g. Cash transfer from Kethireddypally to HO" value={xferForm.description} onChange={e => setXferForm(f => ({ ...f, description: e.target.value }))} />
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
