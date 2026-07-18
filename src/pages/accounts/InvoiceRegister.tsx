import React, { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { inr, fmtDate, today, fyRange, FY_OPTIONS } from '@/lib/utils'
import {
  Card, CardHeader, Button, Input, Select, Badge,
  SectionHeader, Spinner, Table, Th, Td, StatCard
, DateInput, usePagination, PageSizeControl } from '@/components/ui'
import { Plus, Download, Upload, Edit2, Trash2, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import * as XLSX from 'xlsx'

const SOURCE_TYPES = [
  { value: 'chick',       label: 'Chick Supply' },
  { value: 'grn',         label: 'Feed / GRN' },
  { value: 'medicine',    label: 'Medicine' },
  { value: 'electricity', label: 'Electricity' },
  { value: 'labour',      label: 'Labour / Contractor' },
  { value: 'other',       label: 'Other' },
]

// cash_book.payment_mode allows 'cash' | 'upi' | 'cheque' | 'neft' | 'rtgs' | 'imps' | 'bank_transfer'.
const toCbMode = (mode: string) => {
  const m = (mode || '').toLowerCase()
  if (m === 'bank transfer') return 'bank_transfer'
  return ['cash', 'upi', 'neft', 'rtgs', 'imps'].includes(m) ? m : 'cheque'
}

const STATUS_COLOR: Record<string, string> = {
  unpaid:  'red',
  partial: 'yellow',
  paid:    'green',
}

const EMPTY = {
  invoice_no: '', invoice_date: today(), supplier_name: '',
  party_id: '', source_type: 'other', flock_id: '', grn_id: '',
  farm_id: '', basic_amount: '', gst_pct: '0', gst_amount: '',
  total_amount: '', payment_status: 'unpaid', paid_amount: '0',
  due_date: '', remarks: '',
}

const CB: React.FC<{ checked: boolean; indeterminate?: boolean; onChange: () => void }> = ({ checked, indeterminate, onChange }) => {
  const ref = React.useRef<HTMLInputElement>(null)
  React.useEffect(() => { if (ref.current) ref.current.indeterminate = !!indeterminate }, [indeterminate])
  return <input ref={ref} type="checkbox" checked={checked} onChange={onChange} className="rounded border-gray-300 text-brand-600 cursor-pointer" />
}

export const InvoiceRegister: React.FC = () => {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string|null>(null)
  // The pending_payments row this invoice is mirrored to is keyed by
  // (vendor_name, invoice_no) — if either changes on edit, the upsert below
  // targets a NEW key and the old mirrored row is orphaned unless deleted.
  const [editOrigKey, setEditOrigKey] = useState<{ vendor_name: string; invoice_no: string } | null>(null)
  const [form, setForm] = useState({ ...EMPTY })
  const [filterType, setFilterType] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [sel, setSel] = useState<Set<string>>(new Set())
  const [bulkConfirm, setBulkConfirm] = useState(false)
  const importRef = useRef<HTMLInputElement>(null)
  const [filterFrom, setFilterFrom] = useState('')
  const [filterTo, setFilterTo] = useState('')
  const [filterFy, setFilterFy] = useState('')
  const [markPayId, setMarkPayId] = useState<string|null>(null)
  const [payAmt, setPayAmt] = useState('')
  const [payMode, setPayMode] = useState('Cash')
  const [payDate, setPayDate] = useState(today())
  const [payBankId, setPayBankId] = useState('')
  const [delId, setDelId] = useState<string|null>(null)

  const s = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const applyFy = (v: string) => {
    setFilterFy(v)
    if (v) { const r = fyRange(v); setFilterFrom(r.start); setFilterTo(r.end) }
  }

  const { data: invoices, isLoading } = useQuery({
    queryKey: ['supplier_invoices'],
    queryFn: async () => {
      const { data } = await supabase
        .from('supplier_invoices')
        .select('*,party:parties(name),flock:flocks(flock_no),farm:farms(name)')
        .order('invoice_date', { ascending: false })
      return data ?? []
    }
  })

  const { data: parties } = useQuery({
    queryKey: ['parties_list'],
    queryFn: async () => {
      const { data } = await supabase.from('parties').select('id,name,type').order('name')
      return data ?? []
    }
  })

  const { data: bankAccounts } = useQuery({
    queryKey: ['bank_accounts_list'],
    queryFn: async () => {
      const { data } = await supabase.from('bank_accounts').select('id,account_name,bank_name').eq('is_active', true).order('bank_name')
      return data ?? []
    }
  })

  const { data: flocks } = useQuery({
    queryKey: ['flocks_all'],
    queryFn: async () => {
      const { data } = await supabase.from('flocks').select('id,flock_no,status').order('flock_no')
      return data ?? []
    }
  })

  const { data: farms } = useQuery({
    queryKey: ['farms_list'],
    queryFn: async () => {
      const { data } = await supabase.from('farms').select('id,name').order('name')
      return data ?? []
    }
  })

  const saveMut = useMutation({
    mutationFn: async () => {
      if (!form.invoice_no) throw new Error('Invoice No is required')
      if (!form.invoice_date) throw new Error('Invoice Date is required')
      if (!form.total_amount) throw new Error('Total Amount is required')
      const total = parseFloat(form.total_amount)
      const paidAmt = parseFloat(form.paid_amount) || 0
      const payStatus = paidAmt >= total ? 'paid' : paidAmt > 0 ? 'partial' : form.payment_status
      const payload = {
        invoice_no:     form.invoice_no.trim(),
        invoice_date:   form.invoice_date,
        supplier_name:  form.supplier_name || null,
        party_id:       form.party_id || null,
        source_type:    form.source_type,
        flock_id:       form.flock_id || null,
        farm_id:        form.farm_id || null,
        basic_amount:   parseFloat(form.basic_amount) || null,
        gst_pct:        parseFloat(form.gst_pct) || 0,
        gst_amount:     parseFloat(form.gst_amount) || null,
        total_amount:   total,
        payment_status: payStatus,
        paid_amount:    paidAmt,
        due_date:       form.due_date || null,
        remarks:        form.remarks || null,
      }
      if (editId) {
        const { error } = await supabase.from('supplier_invoices').update(payload).eq('id', editId)
        if (error) throw error
      } else {
        const { error } = await supabase.from('supplier_invoices').insert(payload)
        if (error) throw error
      }

      // Sync to pending_payments so this invoice appears in payment planning
      const vendorName = form.supplier_name || (parties ?? []).find((p: any) => p.id === form.party_id)?.name || ''
      // If editing and the vendor name or invoice number changed, the upsert
      // below targets a different (vendor_name, invoice_no) key — clean up
      // the old mirrored row first so it doesn't linger as a duplicate.
      if (editId && editOrigKey && (editOrigKey.vendor_name !== vendorName || editOrigKey.invoice_no !== form.invoice_no.trim())) {
        if (editOrigKey.vendor_name && editOrigKey.invoice_no) {
          await supabase.from('pending_payments').delete()
            .eq('vendor_name', editOrigKey.vendor_name).eq('invoice_no', editOrigKey.invoice_no)
        }
      }
      if (vendorName) {
        const ppStatus = payStatus === 'paid' ? 'Paid' : 'Pending'
        const ppPayload = {
          vendor_name:    vendorName,
          party_id:       form.party_id || null,
          invoice_no:     form.invoice_no.trim(),
          invoice_date:   form.invoice_date,
          basic_amount:   parseFloat(form.basic_amount) || null,
          gst_pct:        parseFloat(form.gst_pct) || 0,
          gst_amount:     parseFloat(form.gst_amount) || null,
          invoice_amount: total,
          paid_amount:    paidAmt,
          net_payable:    total - paidAmt,
          payment_status: ppStatus,
          paid_date:      ppStatus === 'Paid' ? form.due_date || form.invoice_date : null,
          pay_before_date: form.due_date || null,
          category:       form.source_type,
        }
        await supabase.from('pending_payments')
          .upsert(ppPayload, { onConflict: 'vendor_name,invoice_no', ignoreDuplicates: false })
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['supplier_invoices'] })
      qc.invalidateQueries({ queryKey: ['pending_payments'] })
      setForm({ ...EMPTY }); setEditId(null); setEditOrigKey(null); setShowForm(false)
      toast.success(editId ? 'Invoice updated' : 'Invoice saved')
    },
    onError: (e: any) => toast.error(e.message)
  })

  const markPaidMut = useMutation({
    mutationFn: async ({ id, amount, total, mode, date, bankAccountId }: { id: string; amount: number; total: number; mode: string; date: string; bankAccountId: string }) => {
      if (mode.toLowerCase() !== 'cash' && amount > 0 && !bankAccountId) {
        throw new Error('Select which bank account this is paid from, or it won\'t be recorded in any ledger')
      }
      const inv = (invoices ?? []).find((i: any) => i.id === id)
      const status = amount >= total ? 'paid' : amount > 0 ? 'partial' : 'unpaid'
      const { error } = await supabase.from('supplier_invoices')
        .update({ paid_amount: amount, payment_status: status }).eq('id', id)
      if (error) throw error
      // Mirror to pending_payments AND actually post to Cash Book/Bank
      // Ledger — this used to only flip pending_payments.payment_status to
      // 'Paid' with no ledger entry at all, which also meant the bill could
      // never be paid again from PendingPaymentsPage (it already looked Paid).
      if (inv?.invoice_no) {
        const vendorName = inv.party?.name ?? inv.supplier_name ?? ''
        if (vendorName) {
          const { data: pp } = await supabase.from('pending_payments')
            .update({
              paid_amount: amount,
              payment_status: status === 'paid' ? 'Paid' : 'Pending',
              paid_date: status === 'paid' ? date : null,
              account_type: status === 'paid' ? mode : null,
              bank_account_id: status === 'paid' && mode.toLowerCase() !== 'cash' ? bankAccountId : null,
            })
            .eq('vendor_name', vendorName).eq('invoice_no', inv.invoice_no)
            .select('id,party_id').maybeSingle()
          if (status === 'paid' && pp?.id) {
            await supabase.from('cash_book').delete().eq('pending_payment_id', pp.id)
            await supabase.from('bank_transactions').delete().eq('linked_payment_id', pp.id)
            const isCash = mode.toLowerCase() === 'cash'
            await supabase.from('cash_book').insert({
              txn_date: date, txn_type: 'payment', category: 'purchase_payment',
              description: `Payment to ${vendorName} — Inv ${inv.invoice_no}`,
              party_name: vendorName, amount_in: 0, amount_out: amount,
              payment_mode: toCbMode(mode),
              pending_payment_id: pp.id,
            })
            if (!isCash && bankAccountId) {
              await supabase.from('bank_transactions').insert({
                bank_account_id: bankAccountId, txn_date: date, txn_type: 'Debit', category: 'Vendor Payment',
                description: `Payment to ${vendorName} — Inv ${inv.invoice_no}`,
                amount, party_id: (pp as any).party_id || null, linked_payment_id: pp.id,
              })
            }
          }
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['supplier_invoices'] })
      qc.invalidateQueries({ queryKey: ['pending_payments'] })
      qc.invalidateQueries({ queryKey: ['cash_book'] })
      qc.invalidateQueries({ queryKey: ['bank_transactions'] })
      setMarkPayId(null); setPayAmt(''); setPayMode('Cash'); setPayDate(today()); setPayBankId('')
      toast.success('Payment updated')
    },
    onError: (e: any) => toast.error(e.message)
  })

  const delMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('supplier_invoices').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['supplier_invoices'] })
      setDelId(null); toast.success('Deleted')
    },
    onError: (e: any) => toast.error(e.message)
  })

  const bulkDelMut = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from('supplier_invoices').delete().in('id', ids)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['supplier_invoices'] })
      setSel(new Set()); setBulkConfirm(false); toast.success('Deleted')
    },
    onError: (e: any) => toast.error(e.message)
  })

  const openEdit = (inv: any) => {
    setForm({
      invoice_no:     inv.invoice_no ?? '',
      invoice_date:   inv.invoice_date ?? '',
      supplier_name:  inv.supplier_name ?? '',
      party_id:       inv.party_id ?? '',
      source_type:    inv.source_type ?? 'other',
      flock_id:       inv.flock_id ?? '',
      grn_id:         inv.grn_id ?? '',
      farm_id:        inv.farm_id ?? '',
      basic_amount:   inv.basic_amount?.toString() ?? '',
      gst_pct:        inv.gst_pct?.toString() ?? '0',
      gst_amount:     inv.gst_amount?.toString() ?? '',
      total_amount:   inv.total_amount?.toString() ?? '',
      payment_status: inv.payment_status ?? 'unpaid',
      paid_amount:    inv.paid_amount?.toString() ?? '0',
      due_date:       inv.due_date ?? '',
      remarks:        inv.remarks ?? '',
    })
    setEditId(inv.id)
    setEditOrigKey({ vendor_name: inv.supplier_name || inv.party?.name || '', invoice_no: inv.invoice_no ?? '' })
    setShowForm(true)
  }

  // Auto-compute GST amount when basic_amount or gst_pct changes
  const autoGst = () => {
    const basic = parseFloat(form.basic_amount) || 0
    const pct   = parseFloat(form.gst_pct) || 0
    const gst   = parseFloat(((basic * pct) / 100).toFixed(2))
    setForm(f => ({ ...f, gst_amount: gst.toString(), total_amount: (basic + gst).toString() }))
  }

  const filtered = (invoices ?? []).filter((inv: any) => {
    if (filterType   && inv.source_type    !== filterType)   return false
    if (filterStatus && inv.payment_status !== filterStatus) return false
    if (filterFrom   && inv.invoice_date   <  filterFrom)    return false
    if (filterTo     && inv.invoice_date   >  filterTo)      return false
    return true
  })

  const totalAmt    = filtered.reduce((s: number, i: any) => s + (i.total_amount ?? 0), 0)
  const totalPaid   = filtered.reduce((s: number, i: any) => s + (i.paid_amount  ?? 0), 0)
  const totalUnpaid = totalAmt - totalPaid
  const unpaidCount = filtered.filter((i: any) => i.payment_status !== 'paid').length
  const { page, setPage, pageSize, setPageSize, totalPages, from, to } = usePagination(filtered.length, filtered.length)
  const visibleRows = filtered.slice(from, to)

  const exportExcel = () => {
    const rows = filtered.map((i: any) => ({
      'Invoice No':     i.invoice_no,
      'Date':           i.invoice_date,
      'Supplier':       i.party?.name ?? i.supplier_name ?? '',
      'Type':           SOURCE_TYPES.find(t => t.value === i.source_type)?.label ?? i.source_type,
      'Flock':          i.flock ? `Flock ${i.flock.flock_no}` : '',
      'Farm':           i.farm?.name ?? '',
      'Basic Amt':      i.basic_amount ?? '',
      'GST%':           i.gst_pct ?? 0,
      'GST Amt':        i.gst_amount ?? '',
      'Total':          i.total_amount,
      'Paid':           i.paid_amount ?? 0,
      'Balance':        (i.total_amount ?? 0) - (i.paid_amount ?? 0),
      'Status':         i.payment_status,
      'Due Date':       i.due_date ?? '',
      'Remarks':        i.remarks ?? '',
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Invoices')
    XLSX.writeFile(wb, `invoice_register_${today()}.xlsx`)
  }

  const downloadTemplate = () => {
    const headers = ['invoice_no','invoice_date','supplier_name','source_type','flock_no','farm_name','basic_amount','gst_pct','payment_status','paid_amount','due_date','remarks']
    const example = ['INV-2024-001','2024-06-01','Venkateshwara Hatcheries','chick','F21','Kethereddypally','500000','5','25000','525000','unpaid','0','2024-06-15','']
    const ws = XLSX.utils.aoa_to_sheet([headers, example])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Template')
    XLSX.writeFile(wb, 'invoice_register_template.xlsx')
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = async (ev) => {
      try {
        const wb = XLSX.read(ev.target?.result, { type: 'binary', cellDates: true })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const rows: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' })
        if (!rows.length) { toast.error('No data found in file'); return }

        // Build flock_no → id map
        const { data: flockData } = await supabase.from('flocks').select('id,flock_no')
        const flockMap: Record<string, string> = {}
        for (const f of flockData ?? []) flockMap[String(f.flock_no).trim()] = f.id

        // Build farm name → id map
        const { data: farmData } = await supabase.from('farms').select('id,name')
        const farmMap: Record<string, string> = {}
        for (const f of farmData ?? []) farmMap[f.name.trim().toLowerCase()] = f.id

        let saved = 0, skipped = 0
        for (const r of rows) {
          const invNo = String(r.invoice_no ?? '').trim()
          const invDate = r.invoice_date ? (r.invoice_date instanceof Date ? r.invoice_date.toISOString().split('T')[0] : String(r.invoice_date).trim()) : null
          const basic = parseFloat(r.basic_amount) || 0
          const gstPct = parseFloat(r.gst_pct) || 0
          const gstAmt = +(basic * gstPct / 100).toFixed(2)
          const total = +(basic + gstAmt).toFixed(2)
          if (!invNo || !invDate || !total) { skipped++; continue }

          const flockNo = String(r.flock_no ?? '').trim()
          const farmName = String(r.farm_name ?? '').trim().toLowerCase()
          const srcType = String(r.source_type ?? 'other').trim().toLowerCase()

          const payload: any = {
            invoice_no:     invNo,
            invoice_date:   invDate,
            supplier_name:  String(r.supplier_name ?? '').trim() || null,
            source_type:    ['chick','grn','medicine','electricity','labour','other'].includes(srcType) ? srcType : 'other',
            flock_id:       flockNo && flockMap[flockNo] ? flockMap[flockNo] : null,
            farm_id:        farmName && farmMap[farmName] ? farmMap[farmName] : null,
            basic_amount:   basic || null,
            gst_pct:        gstPct,
            gst_amount:     gstAmt || null,
            total_amount:   total,
            payment_status: ['unpaid','partial','paid'].includes(String(r.payment_status)) ? r.payment_status : 'unpaid',
            paid_amount:    parseFloat(r.paid_amount) || 0,
            due_date:       r.due_date ? (r.due_date instanceof Date ? r.due_date.toISOString().split('T')[0] : String(r.due_date).trim()) : null,
            remarks:        String(r.remarks ?? '').trim() || null,
          }
          const { error } = await supabase.from('supplier_invoices').insert(payload)
          if (error) { skipped++; console.error(error) } else { saved++ }
        }
        qc.invalidateQueries({ queryKey: ['supplier_invoices'] })
        toast.success(`Imported ${saved} invoices${skipped ? `, skipped ${skipped}` : ''}`)
      } catch (err: any) {
        toast.error('Import failed: ' + err.message)
      }
    }
    reader.readAsBinaryString(file)
    e.target.value = ''
  }

  if (isLoading) return <Spinner />

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Invoice Register"
        subtitle="All supplier invoices — chick supply, feed, medicines and more"
        action={
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" icon={<Download size={14}/>} onClick={downloadTemplate}>Template</Button>
            <Button variant="outline" size="sm" icon={<Upload size={14}/>} onClick={() => importRef.current?.click()}>Import</Button>
            <Button variant="outline" size="sm" icon={<Download size={14}/>} onClick={exportExcel}>Export</Button>
            <Button size="sm" icon={<Plus size={14}/>} onClick={() => { setForm({ ...EMPTY }); setEditId(null); setEditOrigKey(null); setShowForm(true) }}>Add Invoice</Button>
            <input ref={importRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImport} />
          </div>
        }
      />

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Invoices" value={filtered.length.toString()} />
        <StatCard title="Total Value" value={inr(totalAmt)} />
        <StatCard title="Amount Paid" value={inr(totalPaid)} />
        <StatCard title="Pending Payment" value={inr(totalUnpaid)} subtitle={`${unpaidCount} invoices unpaid`} />
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-wrap gap-3 items-end">
          <div className="w-40">
            <Select label="Type" placeholder="All Types"
              options={SOURCE_TYPES}
              value={filterType} onChange={e => setFilterType(e.target.value)} />
          </div>
          <div className="w-36">
            <Select label="Status" placeholder="All"
              options={['unpaid','partial','paid'].map(v => ({ value: v, label: v.charAt(0).toUpperCase()+v.slice(1) }))}
              value={filterStatus} onChange={e => setFilterStatus(e.target.value)} />
          </div>
          <div className="w-36">
            <Select label="Financial Year" placeholder="— FY —"
              options={FY_OPTIONS.map(f => ({ value: f, label: `FY ${f}` }))}
              value={filterFy} onChange={e => applyFy(e.target.value)} />
          </div>
          <DateInput label="From" value={filterFrom} onChange={e => { setFilterFrom(e.target.value); setFilterFy('') }} />
          <DateInput label="To" value={filterTo} onChange={e => { setFilterTo(e.target.value); setFilterFy('') }} />
          {(filterType || filterStatus || filterFrom || filterTo || filterFy) && (
            <Button variant="outline" size="sm" onClick={() => { setFilterType(''); setFilterStatus(''); setFilterFrom(''); setFilterTo(''); setFilterFy('') }}>
              Clear
            </Button>
          )}
        </div>
      </Card>

      {/* Add / Edit Form */}
      {showForm && (
        <Card>
          <CardHeader title={editId ? 'Edit Invoice' : 'Record Invoice'} />
          <div className="space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              <Input label="Invoice No" required value={form.invoice_no}
                onChange={e => s('invoice_no', e.target.value)} />
              <DateInput label="Invoice Date" required value={form.invoice_date}
                onChange={e => s('invoice_date', e.target.value)} />
              <Select label="Invoice Type" required
                options={SOURCE_TYPES}
                value={form.source_type} onChange={e => s('source_type', e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Select label="Supplier (Party Master)" placeholder="— Select or type below —"
                options={(parties ?? []).map((p: any) => ({ value: p.id, label: p.name }))}
                value={form.party_id} onChange={e => s('party_id', e.target.value)} />
              <Input label="Supplier Name (free text)" placeholder="If not in party master"
                value={form.supplier_name} onChange={e => s('supplier_name', e.target.value)} />
            </div>

            {/* Contextual linking */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {(form.source_type === 'chick') && (
                <Select label="Link to Flock" placeholder="— Select flock —"
                  options={(flocks ?? []).map((f: any) => ({ value: f.id, label: `Flock ${f.flock_no} (${f.status})` }))}
                  value={form.flock_id} onChange={e => s('flock_id', e.target.value)} />
              )}
              <Select label="Farm" placeholder="— Select farm —"
                options={(farms ?? []).map((f: any) => ({ value: f.id, label: f.name }))}
                value={form.farm_id} onChange={e => s('farm_id', e.target.value)} />
              <DateInput label="Due Date" value={form.due_date}
                onChange={e => s('due_date', e.target.value)} />
            </div>

            {/* Amounts */}
            <div className="p-3 bg-gray-50 rounded-lg space-y-3">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Amount Details</p>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <Input label="Basic Amount" type="number" step="0.01"
                  value={form.basic_amount} onChange={e => s('basic_amount', e.target.value)}
                  onBlur={autoGst} />
                <Input label="GST %" type="number" step="0.01"
                  value={form.gst_pct} onChange={e => s('gst_pct', e.target.value)}
                  onBlur={autoGst} />
                <Input label="GST Amount" type="number" step="0.01"
                  value={form.gst_amount} onChange={e => s('gst_amount', e.target.value)} />
                <Input label="Total Amount" type="number" step="0.01" required
                  value={form.total_amount} onChange={e => s('total_amount', e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              <Select label="Payment Status"
                options={[
                  { value: 'unpaid',  label: 'Unpaid' },
                  { value: 'partial', label: 'Partial' },
                  { value: 'paid',    label: 'Paid' },
                ]}
                value={form.payment_status} onChange={e => s('payment_status', e.target.value)} />
              {form.payment_status !== 'unpaid' && (
                <Input label="Amount Paid" type="number" step="0.01"
                  value={form.paid_amount} onChange={e => s('paid_amount', e.target.value)} />
              )}
              <Input label="Remarks"
                value={form.remarks} onChange={e => s('remarks', e.target.value)} />
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" size="sm" onClick={() => { setShowForm(false); setEditId(null); setEditOrigKey(null) }}>Cancel</Button>
              <Button size="sm" loading={saveMut.isPending} onClick={() => saveMut.mutate()}>
                {editId ? 'Update Invoice' : 'Save Invoice'}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Invoice table */}
      {filtered.length === 0 ? (
        <Card>
          <div className="text-center py-10 text-gray-400 text-sm">
            No invoices found. Click "Add Invoice" to record your first invoice.
          </div>
        </Card>
      ) : (
        <Card>
          {sel.size > 0 && (
            <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-2 mb-3">
              <span className="text-sm font-medium text-red-700">{sel.size} selected</span>
              <button onClick={() => setSel(new Set())} className="text-xs text-gray-500 hover:text-gray-700 underline">Clear</button>
              <div className="ml-auto">
                <Button variant="danger" size="sm" icon={<Trash2 size={14}/>} onClick={() => setBulkConfirm(true)}>
                  Delete {sel.size}
                </Button>
              </div>
            </div>
          )}
          <div className="overflow-x-auto">
            <Table>
              <thead>
                <tr>
                  <Th>
                    <CB
                      checked={filtered.length > 0 && sel.size === filtered.length}
                      indeterminate={sel.size > 0 && sel.size < filtered.length}
                      onChange={() => { if (sel.size === filtered.length) setSel(new Set()); else setSel(new Set(filtered.map((i: any) => i.id))) }}
                    />
                  </Th>
                  <Th>Invoice No</Th>
                  <Th>Date</Th>
                  <Th>Type</Th>
                  <Th>Supplier</Th>
                  <Th>Linked To</Th>
                  <Th right>Total</Th>
                  <Th right>Paid</Th>
                  <Th right>Balance</Th>
                  <Th>Status</Th>
                  <Th>Due</Th>
                  <Th></Th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((inv: any) => {
                  const balance = (inv.total_amount ?? 0) - (inv.paid_amount ?? 0)
                  const isOverdue = inv.payment_status !== 'paid' && inv.due_date && inv.due_date < today()
                  return (
                    <tr key={inv.id} className={`border-b border-gray-50 hover:bg-gray-50 ${sel.has(inv.id) ? 'bg-red-50' : isOverdue ? 'bg-red-50/40' : ''}`}>
                      <Td><CB checked={sel.has(inv.id)} onChange={() => setSel(prev => { const n = new Set(prev); n.has(inv.id) ? n.delete(inv.id) : n.add(inv.id); return n })} /></Td>
                      <Td>
                        <span className="font-medium text-gray-900">{inv.invoice_no}</span>
                      </Td>
                      <Td className="text-sm">{fmtDate(inv.invoice_date)}</Td>
                      <Td>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                          {SOURCE_TYPES.find(t => t.value === inv.source_type)?.label ?? inv.source_type}
                        </span>
                      </Td>
                      <Td className="text-sm">{inv.party?.name ?? inv.supplier_name ?? <span className="text-gray-300">—</span>}</Td>
                      <Td className="text-xs text-gray-500">
                        {inv.flock ? `Flock ${inv.flock.flock_no}` : ''}
                        {inv.farm?.name ? (inv.flock ? ` · ${inv.farm.name}` : inv.farm.name) : ''}
                        {!inv.flock && !inv.farm ? '—' : ''}
                      </Td>
                      <Td right className="font-medium">{inr(inv.total_amount)}</Td>
                      <Td right className="text-green-600">{inr(inv.paid_amount)}</Td>
                      <Td right className={balance > 0 ? 'text-red-600 font-medium' : 'text-gray-400'}>{inr(balance)}</Td>
                      <Td>
                        <Badge color={STATUS_COLOR[inv.payment_status] as any}>
                          {inv.payment_status}
                        </Badge>
                        {isOverdue && <span className="ml-1 text-xs text-red-500">Overdue</span>}
                      </Td>
                      <Td className="text-xs text-gray-400">{inv.due_date ? fmtDate(inv.due_date) : '—'}</Td>
                      <Td>
                        <div className="flex gap-2 items-center justify-end">
                          {inv.payment_status !== 'paid' && (
                            <button
                              onClick={() => { setMarkPayId(inv.id); setPayAmt(inv.total_amount?.toString() ?? ''); setPayMode('Cash'); setPayDate(today()); setPayBankId('') }}
                              className="text-xs text-green-600 hover:underline whitespace-nowrap"
                              title="Mark payment"
                            >
                              <CheckCircle size={14} className="inline mr-0.5" />Pay
                            </button>
                          )}
                          <button onClick={() => openEdit(inv)} className="text-xs text-blue-600 hover:underline"><Edit2 size={13}/></button>
                          <button onClick={() => setDelId(inv.id)} className="text-xs text-red-500 hover:underline"><Trash2 size={13}/></button>
                        </div>
                      </Td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50 font-semibold text-sm">
                  <td colSpan={6} className="px-3 py-2 text-gray-600">Total ({filtered.length} invoices)</td>
                  <td className="px-3 py-2 text-right">{inr(totalAmt)}</td>
                  <td className="px-3 py-2 text-right text-green-600">{inr(totalPaid)}</td>
                  <td className="px-3 py-2 text-right text-red-600">{inr(totalUnpaid)}</td>
                  <td colSpan={3}></td>
                </tr>
              </tfoot>
            </Table>
          </div>
          <PageSizeControl page={page} setPage={setPage} pageSize={pageSize} setPageSize={setPageSize}
            totalPages={totalPages} totalItems={filtered.length} className="border-t border-gray-100" />
        </Card>
      )}

      {/* Mark Payment Modal */}
      {markPayId && (() => {
        const inv = (invoices ?? []).find((i: any) => i.id === markPayId)
        if (!inv) return null
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-xl shadow-xl p-6 w-96">
              <p className="font-semibold text-gray-900 mb-1">Record Payment</p>
              <p className="text-sm text-gray-500 mb-1">Invoice: <strong>{inv.invoice_no}</strong></p>
              <p className="text-sm text-gray-500 mb-4">Total: <strong>{inr(inv.total_amount)}</strong></p>
              <Input label="Amount Paid" type="number" step="0.01"
                value={payAmt} onChange={e => setPayAmt(e.target.value)} />
              <div className="mt-3">
                <DateInput label="Payment Date" value={payDate} onChange={e => setPayDate(e.target.value)} />
              </div>
              <div className="mt-3">
                <Select label="Payment Mode" value={payMode} onChange={e => setPayMode(e.target.value)}
                  options={['Cash','NEFT','RTGS','Bank Transfer','UPI','Cheque'].map(m => ({ value: m, label: m }))} />
              </div>
              {payMode.toLowerCase() !== 'cash' && (
                <div className="mt-3">
                  <Select label="Paid From Bank Account" value={payBankId} onChange={e => setPayBankId(e.target.value)}
                    options={[{ value: '', label: '— Select account —' }, ...(bankAccounts ?? []).map((b: any) => ({ value: b.id, label: `${b.account_name ? b.account_name + ' — ' : ''}${b.bank_name}` }))]} />
                </div>
              )}
              <div className="flex gap-3 justify-end mt-4">
                <Button variant="outline" size="sm" onClick={() => setMarkPayId(null)}>Cancel</Button>
                <Button size="sm" loading={markPaidMut.isPending}
                  onClick={() => markPaidMut.mutate({ id: markPayId, amount: parseFloat(payAmt)||0, total: inv.total_amount, mode: payMode, date: payDate, bankAccountId: payBankId })}>
                  Save Payment
                </Button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Bulk Delete Confirm */}
      {bulkConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-6 w-80">
            <p className="font-semibold text-gray-900 mb-2">Delete {sel.size} invoices?</p>
            <p className="text-sm text-gray-500 mb-5">This cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" size="sm" onClick={() => setBulkConfirm(false)}>Cancel</Button>
              <Button variant="danger" size="sm" loading={bulkDelMut.isPending} onClick={() => bulkDelMut.mutate([...sel])}>Delete</Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {delId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-6 w-80">
            <p className="font-semibold text-gray-900 mb-2">Delete invoice?</p>
            <p className="text-sm text-gray-500 mb-5">This cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" size="sm" onClick={() => setDelId(null)}>Cancel</Button>
              <Button variant="danger" size="sm" loading={delMut.isPending} onClick={() => delMut.mutate(delId)}>Delete</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
