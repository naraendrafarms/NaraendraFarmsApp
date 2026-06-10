import React, { useState, useMemo, useRef, useCallback } from 'react'
import * as XLSX from 'xlsx'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { inr, fmtDate } from '@/lib/utils'
import { useAuth, can } from '@/lib/auth'
import {
  Card, SectionHeader, Spinner, Table, Th, Td,
  Button, Input, Modal, Badge, StatCard, EmptyState
} from '@/components/ui'
import {
  ShoppingCart, Clock, CheckCircle, AlertCircle, Plus, Pencil, Trash2,
  Building2, Landmark, CreditCard, TrendingUp, TrendingDown, AlertTriangle,
  Download, PackageCheck, User, BarChart3, Lock, Upload, LineChart
} from 'lucide-react'
import {
  LineChart as ReLineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import toast from 'react-hot-toast'

// ── constants ─────────────────────────────────────────────────────
const PAY_STATUS   = ['Paid', 'Pending', 'Not Paid', 'HOLD']
const MAT_STATUS   = ['Received', 'Pending']
const MAT_TYPES    = ['Feed Raw Material','Medicine','Oral Medicine','Feed Medicine','Vaccine','Larvender','Feedmill Transport','Other']
const ACCT_TYPES   = ['Online','Cash','NEFT','RTGS','IMPS','Cheque']
const TXN_CATS     = ['Payment to Vendor','Sales Receipt','Salary','Electricity','Other Income','Other Expense']
const FY_OPTIONS   = [{ value:'2024-25',label:'FY 2024-25'},{ value:'2025-26',label:'FY 2025-26'},{ value:'2026-27',label:'FY 2026-27'}]

const STATUS_CLS: Record<string,string> = {
  Received: 'bg-green-100 text-green-700', Pending: 'bg-yellow-100 text-yellow-700',
  HOLD: 'bg-red-100 text-red-700', Paid: 'bg-blue-100 text-blue-700', 'Not Paid': 'bg-orange-100 text-orange-700',
}

const today = () => new Date().toISOString().slice(0,10)

// ── small helpers ─────────────────────────────────────────────────
const Sel = ({ label, value, onChange, options, className = '' }: any) => (
  <div className={className}>
    {label && <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>}
    <select value={value} onChange={onChange}
      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
      {options.map((o: any) => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}
    </select>
  </div>
)

const RowCls = (p: any) => {
  if (p.payment_status === 'Paid') return 'hover:bg-gray-50'
  const due = p.pay_before_date
  if (!due) return 'hover:bg-gray-50'
  const diff = Math.ceil((new Date(due).getTime() - Date.now()) / 86400000)
  if (diff < 0)  return 'bg-red-50 hover:bg-red-100'
  if (diff <= 7) return 'bg-yellow-50 hover:bg-yellow-100'
  return 'hover:bg-gray-50'
}
// simple flat CSV for rate analysis
const exportFlatCSV = (filename: string, headers: string[], rows: (string|number|null|undefined)[][]) => {
  const csv = [headers, ...rows].map(r => r.map(v => `"${(v??'').toString().replace(/"/g,'""')}"`).join(',')).join('\n')
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv],{type:'text/csv'})); a.download = filename; a.click()
}

// ── export CSV helper ──────────────────────────────────────────────
// ── export CSV helper ─────────────────────────────────────────────
const exportCSV = (filename: string, rows: any[], cols: { key: string; label: string }[]) => {
  const header = cols.map(c => c.label).join(',')
  const body = rows.map(r => cols.map(c => {
    const v = c.key.split('.').reduce((o, k) => o?.[k], r) ?? ''
    return `"${String(v).replace(/"/g,'""')}"`
  }).join(',')).join('\n')
  const blob = new Blob([header + '\n' + body], { type: 'text/csv' })
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
  a.download = filename; a.click()
}

// ── TABS ──────────────────────────────────────────────────────────
type Tab = 'Purchase Orders' | 'Payments' | 'Aging Report' | 'Vendor Statement' | 'Vendor Banks' | 'Bank Ledger' | 'Rate Analysis'

// ── MAIN EXPORT ───────────────────────────────────────────────────
export const PurchaseOrdersPage: React.FC = () => {
  const { profile } = useAuth()
  const role = profile?.role
  const [tab, setTab] = useState<Tab>('Purchase Orders')

  const TABS: { id: Tab; icon: any; locked?: boolean }[] = [
    { id: 'Purchase Orders', icon: <ShoppingCart size={14}/> },
    { id: 'Payments',        icon: <Clock size={14}/> },
    { id: 'Aging Report',    icon: <BarChart3 size={14}/> },
    { id: 'Vendor Statement',icon: <User size={14}/> },
    { id: 'Vendor Banks',    icon: <Building2 size={14}/> },
    { id: 'Bank Ledger',     icon: <Landmark size={14}/>, locked: !can.viewBankLedger(role) },
    { id: 'Rate Analysis',   icon: <LineChart size={14}/> },
  ]

  return (
    <div className="space-y-4">
      <SectionHeader title="Purchase & Payments" subtitle="POs · Payments · Vendors · Bank Ledger" />
      <div className="flex gap-1 border-b border-gray-200 overflow-x-auto">
        {TABS.map(t => (
          <button key={t.id} onClick={() => !t.locked && setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap transition-colors
              ${tab===t.id ? 'border-brand-600 text-brand-700' : 'border-transparent text-gray-500 hover:text-gray-700'}
              ${t.locked ? 'opacity-40 cursor-not-allowed' : ''}`}>
            {t.icon}{t.id}{t.locked && <Lock size={11}/>}
          </button>
        ))}
      </div>
      {tab === 'Purchase Orders'  && <POTab />}
      {tab === 'Payments'         && <PaymentsTab />}
      {tab === 'Aging Report'     && <AgingReportTab />}
      {tab === 'Vendor Statement' && <VendorStatementTab />}
      {tab === 'Vendor Banks'     && <VendorBanksTab />}
      {tab === 'Bank Ledger'      && (can.viewBankLedger(role) ? <BankLedgerTab /> : (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
          <Lock size={32}/><p className="text-sm">Bank Ledger is restricted to Admin and Accounts roles.</p>
        </div>
      ))}
      {tab === 'Rate Analysis'    && <RateAnalysisTab />}
    </div>
  )
}

// keep old export working
export const PendingPaymentsPage = PurchaseOrdersPage

// ══════════════════════════════════════════════════════════════════
// PO TAB
// ══════════════════════════════════════════════════════════════════
const EMPTY_PO = {
  po_no:'', po_date:'', fiscal_year:'2025-26', vendor_name:'', item_name:'',
  material_type:'', quantity:'', unit:'', rate:'', gst_pct:'', total_amount:'',
  grn_no:'', grn_date:'', material_status:'Pending',
}

const POTab: React.FC = () => {
  const qc = useQueryClient()
  const { profile } = useAuth()
  const canEdit = can.editPurchase(profile?.role)
  const canDel  = can.delete(profile?.role)
  const [fy, setFy]       = useState('2025-26')
  const [typeF, setTypeF] = useState('')
  const [statusF, setStatusF] = useState('')
  const [search, setSearch]   = useState('')
  const [open, setOpen]       = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm]       = useState<any>(EMPTY_PO)
  const [delId, setDelId]     = useState<string|null>(null)
  const [receiptOpen, setReceiptOpen] = useState(false)
  const [receiptPO, setReceiptPO]     = useState<any>(null)
  const [receiptForm, setReceiptForm] = useState({ receipt_date: today(), qty_received: '', unit: '', condition: 'Good', vehicle_no: '', received_by: '', remarks: '' })
  const rf = (k: string) => (e: any) => setReceiptForm((p: any) => ({...p,[k]:e.target.value}))
  const f = (k: string) => (e: any) => setForm((p: any) => ({...p,[k]:e.target.value}))

  const { data: orders=[], isLoading } = useQuery({
    queryKey: ['purchase_orders', fy],
    queryFn: async () => {
      const { data } = await supabase.from('purchase_orders').select('*')
        .eq('fiscal_year', fy).order('po_date', { ascending: false })
      return data ?? []
    }
  })

  const saveMut = useMutation({
    mutationFn: async () => {
      const payload = {
        po_no: form.po_no, po_date: form.po_date || null, fiscal_year: form.fiscal_year,
        vendor_name: form.vendor_name, item_name: form.item_name || null,
        material_type: form.material_type || null,
        quantity: form.quantity ? Number(form.quantity) : null,
        unit: form.unit || null,
        rate: form.rate ? Number(form.rate) : null,
        gst_pct: form.gst_pct ? Number(form.gst_pct) : null,
        total_amount: form.total_amount ? Number(form.total_amount) : null,
        grn_no: form.grn_no || null, grn_date: form.grn_date || null,
        material_status: form.material_status,
      }
      if (editing) await supabase.from('purchase_orders').update(payload).eq('id', editing.id)
      else await supabase.from('purchase_orders').insert(payload)
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['purchase_orders'] }); setOpen(false); toast.success('Saved') },
    onError: (e: any) => toast.error(e.message),
  })

  const delMut = useMutation({
    mutationFn: async (id: string) => { await supabase.from('purchase_orders').delete().eq('id', id) },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['purchase_orders'] }); setDelId(null); toast.success('Deleted') },
  })

  const receiptMut = useMutation({
    mutationFn: async () => {
      if (!receiptPO) return
      const { error } = await supabase.from('po_receipts').insert({
        po_id: receiptPO.id,
        receipt_date: receiptForm.receipt_date,
        qty_received: receiptForm.qty_received ? Number(receiptForm.qty_received) : null,
        unit: receiptForm.unit || receiptPO.unit || null,
        condition: receiptForm.condition,
        vehicle_no: receiptForm.vehicle_no || null,
        received_by: receiptForm.received_by || null,
        remarks: receiptForm.remarks || null,
      })
      if (error) throw error
      // auto-update PO status to Received
      await supabase.from('purchase_orders').update({ material_status: 'Received', grn_date: receiptForm.receipt_date }).eq('id', receiptPO.id)
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['purchase_orders'] }); setReceiptOpen(false); toast.success('Stock receipt recorded & PO marked Received') },
    onError: (e: any) => toast.error(e.message),
  })

  const filtered = useMemo(() => orders.filter((o: any) => {
    if (typeF   && o.material_type !== typeF) return false
    if (statusF && o.material_status !== statusF) return false
    if (search) { const q = search.toLowerCase(); if (!o.vendor_name?.toLowerCase().includes(q) && !o.po_no?.toLowerCase().includes(q) && !o.item_name?.toLowerCase().includes(q)) return false }
    return true
  }), [orders, typeF, statusF, search])

  const grandTotal = filtered.reduce((s: number, o: any) => s + Number(o.total_amount ?? 0), 0)
  const received   = filtered.filter((o: any) => o.material_status === 'Received').length

  const openNew  = () => { setEditing(null); setForm({...EMPTY_PO, fiscal_year: fy}); setOpen(true) }
  const openEdit = (r: any) => { setEditing(r); setForm({...r, po_date:r.po_date??'', grn_date:r.grn_date??''}); setOpen(true) }

  if (isLoading) return <Spinner />

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard title="Total POs" value={String(filtered.length)} icon={<ShoppingCart size={18}/>} color="text-brand-600" />
        <StatCard title="Total Value" value={inr(grandTotal)} icon={<TrendingUp size={18}/>} color="text-green-600" />
        <StatCard title="Received" value={String(received)} icon={<CheckCircle size={18}/>} color="text-blue-600" />
        <StatCard title="Pending" value={String(filtered.length - received)} icon={<Clock size={18}/>} color="text-yellow-600" />
      </div>

      <div className="flex gap-2 flex-wrap items-end">
        <Sel value={fy} onChange={(e:any)=>setFy(e.target.value)} options={FY_OPTIONS} />
        <Sel value={typeF} onChange={(e:any)=>setTypeF(e.target.value)} options={[{value:'',label:'All Types'},...MAT_TYPES.map(t=>({value:t,label:t}))]} />
        <Sel value={statusF} onChange={(e:any)=>setStatusF(e.target.value)} options={[{value:'',label:'All Status'},...MAT_STATUS.map(s=>({value:s,label:s}))]} />
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search vendor / PO / item..."
          className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 w-56" />
        <div className="ml-auto flex gap-2">
          <Button size="sm" variant="outline" icon={<Download size={14}/>} onClick={() => exportCSV(`purchase_orders_${fy}.csv`, filtered, [
            {key:'po_no',label:'PO No'},{key:'po_date',label:'Date'},{key:'vendor_name',label:'Vendor'},{key:'item_name',label:'Item'},
            {key:'material_type',label:'Type'},{key:'quantity',label:'Qty'},{key:'unit',label:'Unit'},{key:'rate',label:'Rate'},
            {key:'gst_pct',label:'GST%'},{key:'total_amount',label:'Amount'},{key:'grn_no',label:'GRN No'},{key:'grn_date',label:'GRN Date'},{key:'material_status',label:'Status'}
          ])}>Export CSV</Button>
          {canEdit && <Button size="sm" onClick={openNew} icon={<Plus size={14}/>}>New PO</Button>}
        </div>
      </div>

      <Card padding={false}>
        <div className="overflow-x-auto">
          <Table>
            <thead><tr>
              <Th>PO No</Th><Th>Date</Th><Th>Vendor</Th><Th>Item</Th><Th>Type</Th>
              <Th right>Qty</Th><Th>Unit</Th><Th right>Rate</Th><Th right>GST%</Th>
              <Th right>Amount</Th><Th>GRN No</Th><Th>GRN Date</Th><Th>Status</Th><Th></Th>
            </tr></thead>
            <tbody>
              {filtered.map((o: any) => (
                <tr key={o.id} className="hover:bg-gray-50 text-sm">
                  <Td className="font-mono text-xs font-semibold text-brand-700">{o.po_no}</Td>
                  <Td className="text-xs">{o.po_date ? fmtDate(o.po_date) : '—'}</Td>
                  <Td className="max-w-[160px] truncate font-medium">{o.vendor_name}</Td>
                  <Td className="text-xs max-w-[140px] truncate">{o.item_name ?? '—'}</Td>
                  <Td><span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">{o.material_type ?? '—'}</span></Td>
                  <Td right className="text-xs">{o.quantity != null ? Number(o.quantity).toLocaleString('en-IN') : '—'}</Td>
                  <Td className="text-xs text-gray-500">{o.unit ?? '—'}</Td>
                  <Td right className="text-xs">{o.rate ? inr(o.rate) : '—'}</Td>
                  <Td right className="text-xs">{o.gst_pct != null ? `${o.gst_pct}%` : '—'}</Td>
                  <Td right className="font-semibold">{o.total_amount ? inr(o.total_amount) : '—'}</Td>
                  <Td className="text-xs text-gray-500">{o.grn_no ?? '—'}</Td>
                  <Td className="text-xs">{o.grn_date ? fmtDate(o.grn_date) : '—'}</Td>
                  <Td><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_CLS[o.material_status] ?? 'bg-gray-100 text-gray-500'}`}>{o.material_status ?? '—'}</span></Td>
                  <Td>
                    <div className="flex gap-1">
                      {canEdit && <button onClick={() => openEdit(o)} className="p-1 text-blue-400 hover:text-blue-600" title="Edit"><Pencil size={13}/></button>}
                      {canEdit && o.material_status !== 'Received' && (
                        <button onClick={() => { setReceiptPO(o); setReceiptForm(f => ({...f, unit: o.unit||'', qty_received: o.quantity||''})); setReceiptOpen(true) }}
                          className="p-1 text-green-500 hover:text-green-700" title="Record Stock Receipt"><PackageCheck size={13}/></button>
                      )}
                      {canDel && <button onClick={() => setDelId(o.id)} className="p-1 text-red-400 hover:text-red-600" title="Delete"><Trash2 size={13}/></button>}
                    </div>
                  </Td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={14} className="text-center py-8 text-gray-400 text-sm">No purchase orders found</td></tr>}
            </tbody>
          </Table>
        </div>
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Edit Purchase Order' : 'New Purchase Order'} size="lg"
        footer={<div className="flex gap-2 justify-end"><Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={() => saveMut.mutate()} loading={saveMut.isPending}>Save</Button></div>}>
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <Input label="PO No *" value={form.po_no} onChange={f('po_no')} required />
            <Input label="PO Date" type="date" value={form.po_date} onChange={f('po_date')} />
            <Sel label="Fiscal Year" value={form.fiscal_year} onChange={f('fiscal_year')} options={FY_OPTIONS} />
          </div>
          <Input label="Vendor Name *" value={form.vendor_name} onChange={f('vendor_name')} required />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Item Name" value={form.item_name} onChange={f('item_name')} />
            <Sel label="Material Type" value={form.material_type} onChange={f('material_type')} options={[{value:'',label:'Select type'},...MAT_TYPES.map(t=>({value:t,label:t}))]} />
          </div>
          <div className="grid grid-cols-4 gap-3">
            <Input label="Quantity" type="number" value={form.quantity} onChange={f('quantity')} />
            <Input label="Unit" value={form.unit} onChange={f('unit')} placeholder="KG/Tons/Ltrs" />
            <Input label="Rate (₹)" type="number" value={form.rate} onChange={f('rate')} />
            <Input label="GST %" type="number" value={form.gst_pct} onChange={f('gst_pct')} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Input label="Total Amount (₹)" type="number" value={form.total_amount} onChange={f('total_amount')} />
            <Input label="GRN No" value={form.grn_no} onChange={f('grn_no')} />
            <Input label="GRN Date" type="date" value={form.grn_date} onChange={f('grn_date')} />
          </div>
          <Sel label="Material Status" value={form.material_status} onChange={f('material_status')} options={MAT_STATUS.map(s=>({value:s,label:s}))} />
        </div>
      </Modal>

      <Modal open={!!delId} onClose={() => setDelId(null)} title="Delete Purchase Order"
        footer={<div className="flex gap-2 justify-end"><Button variant="secondary" onClick={() => setDelId(null)}>Cancel</Button><Button variant="danger" onClick={() => delId && delMut.mutate(delId)} loading={delMut.isPending}>Delete</Button></div>}>
        <p className="text-sm text-gray-600">Delete this purchase order? This cannot be undone.</p>
      </Modal>

      {/* Stock Receipt Modal */}
      <Modal open={receiptOpen} onClose={() => setReceiptOpen(false)} title={`Record Stock Receipt — PO ${receiptPO?.po_no}`}
        footer={<div className="flex gap-2 justify-end"><Button variant="secondary" onClick={() => setReceiptOpen(false)}>Cancel</Button><Button onClick={() => receiptMut.mutate()} loading={receiptMut.isPending}>Save Receipt</Button></div>}>
        {receiptPO && (
          <div className="space-y-3">
            <div className="bg-blue-50 rounded-lg px-3 py-2 text-xs text-blue-700">
              <strong>{receiptPO.vendor_name}</strong> · {receiptPO.item_name} · Ordered: {receiptPO.quantity} {receiptPO.unit}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Receipt Date *" type="date" value={receiptForm.receipt_date} onChange={rf('receipt_date')} />
              <Input label="Qty Received" type="number" value={receiptForm.qty_received} onChange={rf('qty_received')} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Unit" value={receiptForm.unit} onChange={rf('unit')} />
              <Sel label="Condition" value={receiptForm.condition} onChange={rf('condition')} options={['Good','Partial','Damaged'].map(c=>({value:c,label:c}))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Vehicle No" value={receiptForm.vehicle_no} onChange={rf('vehicle_no')} />
              <Input label="Received By" value={receiptForm.received_by} onChange={rf('received_by')} />
            </div>
            <Input label="Remarks" value={receiptForm.remarks} onChange={rf('remarks')} />
            <p className="text-xs text-green-600">✓ PO will be automatically marked as Received</p>
          </div>
        )}
      </Modal>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════
// PAYMENTS TAB
// ══════════════════════════════════════════════════════════════════
const EMPTY_PAY = {
  vendor_name:'', po_id:'', po_no:'', grn_no:'', grn_date:'', invoice_no:'',
  invoice_date:'', invoice_amount:'', payment_type:'', payment_status:'Pending',
  paid_date:'', credit_limit:'', pay_before_date:'', account_type:'Online',
  bank_account_id:'', utr_no:'', cheque_no:'', transaction_ref:'',
  po_raised_by:'', payment_approved_by:'', remarks:'',
}

const PaymentsTab: React.FC = () => {
  const qc = useQueryClient()
  const { profile } = useAuth()
  const canEdit = can.editPurchase(profile?.role)
  const canDel  = can.delete(profile?.role)
  const [statusF, setStatusF]   = useState('')
  const [typeF, setTypeF]       = useState('')
  const [monthF, setMonthF]     = useState('')
  const [alertF, setAlertF]     = useState('')
  const [search, setSearch]     = useState('')
  const [open, setOpen]         = useState(false)
  const [editing, setEditing]   = useState<any>(null)
  const [form, setForm]         = useState<any>(EMPTY_PAY)
  const [delId, setDelId]       = useState<string|null>(null)
  const f = (k: string) => (e: any) => setForm((p: any) => ({...p,[k]:e.target.value}))

  const { data: payments=[], isLoading } = useQuery({
    queryKey: ['pending_payments'],
    queryFn: async () => {
      let all: any[]=[], from=0
      while (true) {
        const { data } = await supabase.from('pending_payments').select('*').order('invoice_date',{ascending:false}).range(from,from+999)
        if (!data||data.length===0) break
        all = all.concat(data)
        if (data.length<1000) break
        from+=1000
      }
      return all
    }
  })

  const { data: orders=[] } = useQuery({
    queryKey: ['purchase_orders_all'],
    queryFn: async () => { const { data } = await supabase.from('purchase_orders').select('id,po_no,vendor_name,total_amount').order('po_date',{ascending:false}); return data ?? [] }
  })

  const { data: bankAccounts=[] } = useQuery({
    queryKey: ['bank_accounts'],
    queryFn: async () => { const { data } = await supabase.from('bank_accounts').select('*').eq('is_active',true).order('bank_name'); return data ?? [] }
  })

  // Credit limit warning
  const creditWarning = useMemo(() => {
    if (!form.invoice_date || !form.credit_limit) return null
    const due = new Date(form.invoice_date)
    due.setDate(due.getDate() + Number(form.credit_limit))
    const days = Math.ceil((due.getTime() - Date.now()) / 86400000)
    if (days < 0) return `⚠️ Credit limit exceeded by ${Math.abs(days)} days!`
    if (days <= 3) return `⚠️ Payment due in ${days} day(s) — within credit limit`
    return null
  }, [form.invoice_date, form.credit_limit])

  const saveMut = useMutation({
    mutationFn: async () => {
      // If PO selected, auto-fill vendor name
      let vendorName = form.vendor_name
      if (form.po_id) {
        const po = orders.find((o: any) => o.id === form.po_id)
        if (po) vendorName = po.vendor_name
      }
      const payload = {
        vendor_name: vendorName, po_id: form.po_id || null, po_no: form.po_no || null,
        grn_no: form.grn_no || null, grn_date: form.grn_date || null,
        invoice_no: form.invoice_no || null, invoice_date: form.invoice_date || null,
        invoice_amount: form.invoice_amount ? Number(form.invoice_amount) : null,
        payment_type: form.payment_type || null, payment_status: form.payment_status,
        paid_date: form.paid_date || null, credit_limit: form.credit_limit ? Number(form.credit_limit) : null,
        pay_before_date: form.pay_before_date || null, account_type: form.account_type || null,
        bank_account_id: form.bank_account_id || null,
        utr_no: form.utr_no || null, cheque_no: form.cheque_no || null,
        transaction_ref: form.transaction_ref || null,
        po_raised_by: form.po_raised_by || null, payment_approved_by: form.payment_approved_by || null,
        remarks: form.remarks || null,
      }
      if (editing) await supabase.from('pending_payments').update(payload).eq('id', editing.id)
      else await supabase.from('pending_payments').insert(payload)
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['pending_payments'] }); setOpen(false); toast.success('Saved') },
    onError: (e: any) => toast.error(e.message),
  })

  const delMut = useMutation({
    mutationFn: async (id: string) => { await supabase.from('pending_payments').delete().eq('id', id) },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['pending_payments'] }); setDelId(null); toast.success('Deleted') },
  })

  const types  = useMemo(() => Array.from(new Set(payments.map((p:any)=>p.payment_type).filter(Boolean))).sort() as string[], [payments])
  const months = useMemo(() => Array.from(new Set(payments.map((p:any)=>p.invoice_date?.substring(0,7)).filter(Boolean))).sort().reverse() as string[], [payments])

  const daysUntilDue = (p: any) => {
    if (!p.pay_before_date || p.payment_status === 'Paid') return null
    return Math.ceil((new Date(p.pay_before_date).getTime() - Date.now()) / 86400000)
  }

  const filtered = useMemo(() => payments.filter((p: any) => {
    if (statusF) { if (statusF==='Not Paid' ? p.payment_status==='Paid' : p.payment_status!==statusF) return false }
    if (typeF  && p.payment_type !== typeF)   return false
    if (monthF && !p.invoice_date?.startsWith(monthF)) return false
    if (alertF === 'overdue')   { const d = daysUntilDue(p); if (d === null || d >= 0) return false }
    if (alertF === 'due_soon')  { const d = daysUntilDue(p); if (d === null || d < 0 || d > 7) return false }
    if (search) { const q=search.toLowerCase(); if (!p.vendor_name?.toLowerCase().includes(q)&&!p.po_no?.toLowerCase().includes(q)&&!p.grn_no?.toLowerCase().includes(q)&&!p.invoice_no?.toLowerCase().includes(q)) return false }
    return true
  }), [payments, statusF, typeF, monthF, alertF, search])

  const summary = useMemo(() => {
    const tot = (arr:any[]) => arr.reduce((s,p)=>s+Number(p.invoice_amount??0),0)
    const overdue  = payments.filter((p:any) => { const d=daysUntilDue(p); return d!==null && d<0 })
    const dueSoon  = payments.filter((p:any) => { const d=daysUntilDue(p); return d!==null && d>=0 && d<=7 })
    return {
      paid:    { count: payments.filter((p:any)=>p.payment_status==='Paid').length,    total: tot(payments.filter((p:any)=>p.payment_status==='Paid')) },
      pending: { count: payments.filter((p:any)=>p.payment_status==='Pending').length, total: tot(payments.filter((p:any)=>p.payment_status==='Pending')) },
      hold:    { count: payments.filter((p:any)=>p.payment_status==='HOLD').length,    total: tot(payments.filter((p:any)=>p.payment_status==='HOLD')) },
      overdue: { count: overdue.length, total: tot(overdue) },
      dueSoon: { count: dueSoon.length, total: tot(dueSoon) },
    }
  }, [payments])

  const filteredTotal = filtered.reduce((s:number,p:any)=>s+Number(p.invoice_amount??0),0)

  const openNew  = () => { setEditing(null); setForm({...EMPTY_PAY}); setOpen(true) }
  const openEdit = (r: any) => {
    setEditing(r)
    setForm({...EMPTY_PAY,...r, po_id:r.po_id??'', grn_date:r.grn_date??'', invoice_date:r.invoice_date??'', paid_date:r.paid_date??'', pay_before_date:r.pay_before_date??''})
    setOpen(true)
  }

  // When PO is selected in form, auto-fill fields
  const handlePoSelect = (e: any) => {
    const poId = e.target.value
    const po = orders.find((o:any) => o.id === poId)
    if (po) setForm((p:any) => ({...p, po_id: poId, po_no: po.po_no, vendor_name: po.vendor_name, invoice_amount: po.total_amount ?? p.invoice_amount }))
    else setForm((p:any) => ({...p, po_id: poId}))
  }

  if (isLoading) return <Spinner />

  return (
    <div className="space-y-4">
      {/* Alert banners */}
      {summary.overdue.count > 0 && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 cursor-pointer" onClick={() => setAlertF(alertF==='overdue'?'':'overdue')}>
          <AlertTriangle size={18} className="text-red-600 shrink-0"/>
          <div className="flex-1">
            <span className="font-semibold text-red-700 text-sm">{summary.overdue.count} overdue payments</span>
            <span className="text-red-600 text-sm ml-2">· {inr(summary.overdue.total)} pending</span>
          </div>
          <span className="text-xs text-red-500">{alertF==='overdue' ? 'Clear filter' : 'View overdue'}</span>
        </div>
      )}
      {summary.dueSoon.count > 0 && (
        <div className="flex items-center gap-3 bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 cursor-pointer" onClick={() => setAlertF(alertF==='due_soon'?'':'due_soon')}>
          <Clock size={18} className="text-yellow-600 shrink-0"/>
          <div className="flex-1">
            <span className="font-semibold text-yellow-700 text-sm">{summary.dueSoon.count} payments due within 7 days</span>
            <span className="text-yellow-600 text-sm ml-2">· {inr(summary.dueSoon.total)}</span>
          </div>
          <span className="text-xs text-yellow-600">{alertF==='due_soon' ? 'Clear filter' : 'View due-soon'}</span>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {[
          { label:'Paid', val: summary.paid, cls:'text-blue-600', icon:<CheckCircle size={18}/>, filter:'Paid' },
          { label:'Pending', val: summary.pending, cls:'text-yellow-600', icon:<Clock size={18}/>, filter:'Pending' },
          { label:'HOLD', val: summary.hold, cls:'text-red-600', icon:<AlertCircle size={18}/>, filter:'HOLD' },
        ].map(({ label, val, cls, icon, filter }) => (
          <div key={label} onClick={() => setStatusF(statusF===filter?'':filter)}
            className={`bg-white border rounded-xl p-3 cursor-pointer hover:shadow-md transition-shadow ${statusF===filter?'ring-2 ring-brand-400':''}`}>
            <div className={`flex items-center gap-1 ${cls} text-xs font-medium mb-1`}>{icon}{label}</div>
            <div className="text-lg font-bold text-gray-800">{inr(val.total)}</div>
            <div className="text-xs text-gray-400">{val.count} invoices</div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 flex-wrap items-end">
        <Sel value={statusF} onChange={(e:any)=>setStatusF(e.target.value)} options={[{value:'',label:'All Status'},...PAY_STATUS.map(s=>({value:s,label:s}))]} />
        <Sel value={typeF}   onChange={(e:any)=>setTypeF(e.target.value)}   options={[{value:'',label:'All Types'},...types.map(t=>({value:t,label:t}))]} />
        <Sel value={monthF}  onChange={(e:any)=>setMonthF(e.target.value)}  options={[{value:'',label:'All Months'},...months.map(m=>({value:m,label:m}))]} />
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search vendor / PO / GRN / Invoice..."
          className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 w-64" />
        {(statusF||typeF||monthF||alertF||search) && <button onClick={()=>{setStatusF('');setTypeF('');setMonthF('');setAlertF('');setSearch('')}} className="text-xs text-brand-600 hover:underline">Clear all</button>}
        <div className="ml-auto flex items-center gap-2">
          <span className="text-sm text-gray-500">{filtered.length} records · {inr(filteredTotal)}</span>
          <Button size="sm" variant="outline" icon={<Download size={14}/>} onClick={() => exportCSV('payments.csv', filtered, [
            {key:'vendor_name',label:'Vendor'},{key:'invoice_no',label:'Invoice No'},{key:'invoice_date',label:'Invoice Date'},
            {key:'invoice_amount',label:'Amount'},{key:'payment_type',label:'Type'},{key:'pay_before_date',label:'Pay Before'},
            {key:'po_no',label:'PO No'},{key:'grn_no',label:'GRN No'},{key:'account_type',label:'Account Type'},
            {key:'utr_no',label:'UTR No'},{key:'cheque_no',label:'Cheque No'},{key:'payment_status',label:'Status'},{key:'paid_date',label:'Paid Date'},{key:'remarks',label:'Remarks'}
          ])}>Export</Button>
          {canEdit && <Button size="sm" onClick={openNew} icon={<Plus size={14}/>}>Add Payment</Button>}
        </div>
      </div>

      <Card padding={false}>
        <div className="overflow-x-auto">
          <Table>
            <thead><tr>
              <Th>Vendor</Th><Th>Invoice No</Th><Th>Invoice Date</Th>
              <Th right>Amount</Th><Th>Type</Th><Th>Pay Before</Th>
              <Th>Days Left</Th><Th>PO No</Th><Th>GRN No</Th>
              <Th>Account</Th><Th>UTR/Cheque</Th>
              <Th>Status</Th><Th>Paid Date</Th><Th></Th>
            </tr></thead>
            <tbody>
              {filtered.map((p: any) => {
                const days = daysUntilDue(p)
                const rowCls = RowCls(p)
                return (
                  <tr key={p.id} className={`text-sm ${rowCls}`}>
                    <Td className="max-w-[160px] truncate font-medium">{p.vendor_name}</Td>
                    <Td className="text-xs text-gray-500">{p.invoice_no ?? '—'}</Td>
                    <Td className="text-xs">{p.invoice_date ? fmtDate(p.invoice_date) : '—'}</Td>
                    <Td right className="font-semibold">{p.invoice_amount ? inr(p.invoice_amount) : '—'}</Td>
                    <Td><span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">{p.payment_type ?? '—'}</span></Td>
                    <Td className="text-xs">{p.pay_before_date ? fmtDate(p.pay_before_date) : '—'}</Td>
                    <Td className="text-center text-xs">
                      {days === null ? '—' : days < 0 ? <span className="text-red-600 font-bold">{days}d</span> : days <= 7 ? <span className="text-yellow-600 font-semibold">{days}d</span> : <span className="text-gray-500">{days}d</span>}
                    </Td>
                    <Td className="text-xs font-mono text-gray-500">{p.po_no ?? '—'}</Td>
                    <Td className="text-xs text-gray-500">{p.grn_no ?? '—'}</Td>
                    <Td className="text-xs">{p.account_type ?? '—'}</Td>
                    <Td className="text-xs text-gray-500">{p.utr_no ?? p.cheque_no ?? '—'}</Td>
                    <Td><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_CLS[p.payment_status]??'bg-gray-100 text-gray-500'}`}>{p.payment_status??'—'}</span></Td>
                    <Td className="text-xs">{p.paid_date ? fmtDate(p.paid_date) : '—'}</Td>
                    <Td>
                      <div className="flex gap-1">
                        {canEdit && <button onClick={() => openEdit(p)} className="p-1 text-blue-400 hover:text-blue-600"><Pencil size={13}/></button>}
                        {canDel  && <button onClick={() => setDelId(p.id)} className="p-1 text-red-400 hover:text-red-600"><Trash2 size={13}/></button>}
                      </div>
                    </Td>
                  </tr>
                )
              })}
              {filtered.length===0 && <tr><td colSpan={14} className="text-center py-8 text-gray-400 text-sm">No payment records found</td></tr>}
            </tbody>
          </Table>
        </div>
      </Card>

      {/* Add/Edit Modal */}
      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Edit Payment' : 'Add Payment'} size="lg"
        footer={<div className="flex gap-2 justify-end"><Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={() => saveMut.mutate()} loading={saveMut.isPending}>Save</Button></div>}>
        <div className="space-y-3">
          {/* Link to PO */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Link to Purchase Order (optional)</label>
            <select value={form.po_id} onChange={handlePoSelect}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
              <option value="">— No PO link —</option>
              {orders.map((o:any) => <option key={o.id} value={o.id}>{o.po_no} · {o.vendor_name} · {o.total_amount ? inr(o.total_amount) : ''}</option>)}
            </select>
          </div>
          <Input label="Vendor Name *" value={form.vendor_name} onChange={f('vendor_name')} required />
          <div className="grid grid-cols-3 gap-3">
            <Input label="PO No" value={form.po_no} onChange={f('po_no')} />
            <Input label="GRN No" value={form.grn_no} onChange={f('grn_no')} />
            <Input label="Invoice No" value={form.invoice_no} onChange={f('invoice_no')} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="GRN Date" type="date" value={form.grn_date} onChange={f('grn_date')} />
            <Input label="Invoice Date" type="date" value={form.invoice_date} onChange={f('invoice_date')} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Invoice Amount (₹)" type="number" value={form.invoice_amount} onChange={f('invoice_amount')} />
            <Sel label="Payment Type" value={form.payment_type} onChange={f('payment_type')} options={[{value:'',label:'Select type'},...MAT_TYPES.map(t=>({value:t,label:t}))]} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Input label="Credit Limit (days)" type="number" value={form.credit_limit} onChange={f('credit_limit')} />
            <Input label="Pay Before Date" type="date" value={form.pay_before_date} onChange={f('pay_before_date')} />
            <Sel label="Account Type" value={form.account_type} onChange={f('account_type')} options={[{value:'',label:'Select'},...ACCT_TYPES.map(a=>({value:a,label:a}))]} />
          </div>
          {creditWarning && <div className="bg-yellow-50 border border-yellow-200 rounded px-3 py-2 text-xs text-yellow-700">{creditWarning}</div>}
          {/* Bank account */}
          {bankAccounts.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Paying from Bank Account</label>
              <select value={form.bank_account_id} onChange={f('bank_account_id')}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                <option value="">— Select bank —</option>
                {bankAccounts.map((b:any) => <option key={b.id} value={b.id}>{b.bank_name} · {b.account_name} ({b.account_no})</option>)}
              </select>
            </div>
          )}
          <div className="grid grid-cols-3 gap-3">
            <Sel label="Payment Status" value={form.payment_status} onChange={f('payment_status')} options={PAY_STATUS.map(s=>({value:s,label:s}))} />
            <Input label="Paid Date" type="date" value={form.paid_date} onChange={f('paid_date')} />
            <Input label="UTR No" value={form.utr_no} onChange={f('utr_no')} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Cheque No" value={form.cheque_no} onChange={f('cheque_no')} />
            <Input label="Transaction Ref" value={form.transaction_ref} onChange={f('transaction_ref')} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Raised By" value={form.po_raised_by} onChange={f('po_raised_by')} />
            <Input label="Approved By" value={form.payment_approved_by} onChange={f('payment_approved_by')} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Remarks</label>
            <textarea value={form.remarks} onChange={f('remarks')} rows={2}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
        </div>
      </Modal>

      <Modal open={!!delId} onClose={() => setDelId(null)} title="Delete Payment"
        footer={<div className="flex gap-2 justify-end"><Button variant="secondary" onClick={() => setDelId(null)}>Cancel</Button><Button variant="danger" onClick={() => delId && delMut.mutate(delId)} loading={delMut.isPending}>Delete</Button></div>}>
        <p className="text-sm text-gray-600">Delete this payment record? This cannot be undone.</p>
      </Modal>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════
// AGING REPORT TAB
// ══════════════════════════════════════════════════════════════════
const AGING_BUCKETS = [
  { label: 'Current (not due)', min: 1,    max: Infinity },
  { label: '0–30 days overdue', min: 0,    max: 30 },
  { label: '31–60 days',        min: 31,   max: 60 },
  { label: '61–90 days',        min: 61,   max: 90 },
  { label: '90+ days',          min: 91,   max: Infinity },
]

const AgingReportTab: React.FC = () => {
  const { data: payments=[], isLoading } = useQuery({
    queryKey: ['pending_payments'],
    queryFn: async () => {
      let all: any[]=[], from=0
      while (true) {
        const { data } = await supabase.from('pending_payments').select('*').order('invoice_date',{ascending:false}).range(from,from+999)
        if (!data||data.length===0) break; all=all.concat(data); if(data.length<1000)break; from+=1000
      }
      return all
    }
  })

  const unpaid = payments.filter((p: any) => p.payment_status !== 'Paid')

  const buckets = useMemo(() => {
    const today = Date.now()
    return [
      {
        label: 'Not Yet Due',
        cls: 'bg-green-50 border-green-200',
        hdr: 'text-green-700',
        rows: unpaid.filter((p: any) => {
          if (!p.pay_before_date) return true
          return Math.ceil((new Date(p.pay_before_date).getTime() - today) / 86400000) > 0
        })
      },
      {
        label: '0–30 Days Overdue',
        cls: 'bg-yellow-50 border-yellow-200',
        hdr: 'text-yellow-700',
        rows: unpaid.filter((p: any) => {
          if (!p.pay_before_date) return false
          const d = Math.ceil((today - new Date(p.pay_before_date).getTime()) / 86400000)
          return d >= 0 && d <= 30
        })
      },
      {
        label: '31–60 Days Overdue',
        cls: 'bg-orange-50 border-orange-200',
        hdr: 'text-orange-700',
        rows: unpaid.filter((p: any) => {
          if (!p.pay_before_date) return false
          const d = Math.ceil((today - new Date(p.pay_before_date).getTime()) / 86400000)
          return d > 30 && d <= 60
        })
      },
      {
        label: '61–90 Days Overdue',
        cls: 'bg-red-50 border-red-200',
        hdr: 'text-red-600',
        rows: unpaid.filter((p: any) => {
          if (!p.pay_before_date) return false
          const d = Math.ceil((today - new Date(p.pay_before_date).getTime()) / 86400000)
          return d > 60 && d <= 90
        })
      },
      {
        label: '90+ Days Overdue',
        cls: 'bg-red-100 border-red-300',
        hdr: 'text-red-800',
        rows: unpaid.filter((p: any) => {
          if (!p.pay_before_date) return false
          const d = Math.ceil((today - new Date(p.pay_before_date).getTime()) / 86400000)
          return d > 90
        })
      },
    ]
  }, [unpaid])

  const totalUnpaid = unpaid.reduce((s: number, p: any) => s + Number(p.invoice_amount ?? 0), 0)

  if (isLoading) return <Spinner />

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-semibold text-gray-800">Payment Aging Report</h3>
          <p className="text-xs text-gray-500">Total outstanding: {inr(totalUnpaid)} across {unpaid.length} invoices</p>
        </div>
        <Button size="sm" variant="outline" icon={<Download size={14}/>} onClick={() => exportCSV('aging_report.csv', unpaid, [
          {key:'vendor_name',label:'Vendor'},{key:'invoice_no',label:'Invoice No'},{key:'invoice_date',label:'Invoice Date'},
          {key:'invoice_amount',label:'Amount'},{key:'pay_before_date',label:'Pay Before'},{key:'payment_status',label:'Status'},{key:'payment_type',label:'Type'}
        ])}>Export CSV</Button>
      </div>

      {/* Summary grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {buckets.map(b => (
          <div key={b.label} className={`border rounded-xl p-3 ${b.cls}`}>
            <p className={`text-xs font-semibold ${b.hdr}`}>{b.label}</p>
            <p className="text-base font-bold text-gray-800 mt-1">{inr(b.rows.reduce((s: number, p: any) => s + Number(p.invoice_amount ?? 0), 0))}</p>
            <p className="text-xs text-gray-500">{b.rows.length} invoices</p>
          </div>
        ))}
      </div>

      {/* Detail per bucket */}
      {buckets.filter(b => b.rows.length > 0).map(b => (
        <Card key={b.label} padding={false}>
          <div className={`px-4 py-2 ${b.cls} border-b`}>
            <span className={`text-sm font-semibold ${b.hdr}`}>{b.label} — {b.rows.length} invoices · {inr(b.rows.reduce((s: number, p: any) => s + Number(p.invoice_amount ?? 0), 0))}</span>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <thead><tr>
                <Th>Vendor</Th><Th>Invoice No</Th><Th>Invoice Date</Th>
                <Th right>Amount</Th><Th>Pay Before</Th><Th>Days</Th><Th>Type</Th><Th>Status</Th>
              </tr></thead>
              <tbody>
                {b.rows.map((p: any) => {
                  const days = p.pay_before_date ? Math.ceil((Date.now() - new Date(p.pay_before_date).getTime()) / 86400000) : null
                  return (
                    <tr key={p.id} className="text-sm hover:bg-gray-50">
                      <Td className="font-medium">{p.vendor_name}</Td>
                      <Td className="text-xs text-gray-500">{p.invoice_no ?? '—'}</Td>
                      <Td className="text-xs">{p.invoice_date ? fmtDate(p.invoice_date) : '—'}</Td>
                      <Td right className="font-semibold">{p.invoice_amount ? inr(p.invoice_amount) : '—'}</Td>
                      <Td className="text-xs">{p.pay_before_date ? fmtDate(p.pay_before_date) : '—'}</Td>
                      <Td className="text-xs text-center">{days !== null ? <span className={days > 0 ? 'text-red-600 font-bold' : 'text-green-600'}>{days > 0 ? `${days}d late` : 'on time'}</span> : '—'}</Td>
                      <Td className="text-xs text-gray-500">{p.payment_type ?? '—'}</Td>
                      <Td><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_CLS[p.payment_status] ?? 'bg-gray-100 text-gray-500'}`}>{p.payment_status}</span></Td>
                    </tr>
                  )
                })}
              </tbody>
            </Table>
          </div>
        </Card>
      ))}
      {unpaid.length === 0 && <EmptyState icon={<CheckCircle size={32}/>} title="All payments are up to date!" />}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════
// VENDOR STATEMENT TAB
// ══════════════════════════════════════════════════════════════════
const VendorStatementTab: React.FC = () => {
  const [vendor, setVendor] = useState('')

  const { data: payments=[], isLoading: payLoading } = useQuery({
    queryKey: ['pending_payments'],
    queryFn: async () => {
      let all: any[]=[], from=0
      while (true) {
        const { data } = await supabase.from('pending_payments').select('*').order('invoice_date',{ascending:false}).range(from,from+999)
        if (!data||data.length===0) break; all=all.concat(data); if(data.length<1000)break; from+=1000
      }
      return all
    }
  })

  const { data: orders=[], isLoading: poLoading } = useQuery({
    queryKey: ['purchase_orders_all'],
    queryFn: async () => { const { data } = await supabase.from('purchase_orders').select('*').order('po_date',{ascending:false}); return data ?? [] }
  })

  const vendors = useMemo(() => {
    const s = new Set<string>()
    payments.forEach((p: any) => p.vendor_name && s.add(p.vendor_name))
    orders.forEach((o: any) => o.vendor_name && s.add(o.vendor_name))
    return Array.from(s).sort()
  }, [payments, orders])

  const vendorPOs  = useMemo(() => vendor ? orders.filter((o: any) => o.vendor_name === vendor) : [], [orders, vendor])
  const vendorPays = useMemo(() => vendor ? payments.filter((p: any) => p.vendor_name === vendor) : [], [payments, vendor])

  const totalOrdered = vendorPOs.reduce((s: number, o: any) => s + Number(o.total_amount ?? 0), 0)
  const totalInvoiced = vendorPays.reduce((s: number, p: any) => s + Number(p.invoice_amount ?? 0), 0)
  const totalPaid  = vendorPays.filter((p: any) => p.payment_status === 'Paid').reduce((s: number, p: any) => s + Number(p.invoice_amount ?? 0), 0)
  const outstanding = totalInvoiced - totalPaid

  if (payLoading || poLoading) return <Spinner />

  return (
    <div className="space-y-4">
      <div className="flex gap-3 items-end">
        <div className="flex-1 max-w-sm">
          <label className="block text-xs font-medium text-gray-700 mb-1">Select Vendor</label>
          <select value={vendor} onChange={e => setVendor(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
            <option value="">— Select a vendor —</option>
            {vendors.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
        {vendor && (
          <Button size="sm" variant="outline" icon={<Download size={14}/>} onClick={() => {
            exportCSV(`vendor_statement_${vendor}.csv`, vendorPays, [
              {key:'invoice_no',label:'Invoice No'},{key:'invoice_date',label:'Invoice Date'},{key:'invoice_amount',label:'Amount'},
              {key:'payment_type',label:'Type'},{key:'pay_before_date',label:'Pay Before'},{key:'payment_status',label:'Status'},
              {key:'paid_date',label:'Paid Date'},{key:'utr_no',label:'UTR No'},{key:'cheque_no',label:'Cheque No'},{key:'remarks',label:'Remarks'}
            ])
          }}>Export Statement</Button>
        )}
      </div>

      {vendor && (
        <>
          {/* Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard title="Total POs" value={inr(totalOrdered)} icon={<ShoppingCart size={18}/>} color="text-brand-600" />
            <StatCard title="Total Invoiced" value={inr(totalInvoiced)} icon={<TrendingUp size={18}/>} color="text-blue-600" />
            <StatCard title="Total Paid" value={inr(totalPaid)} icon={<CheckCircle size={18}/>} color="text-green-600" />
            <StatCard title="Outstanding" value={inr(outstanding)} icon={<AlertCircle size={18}/>} color={outstanding > 0 ? 'text-red-600' : 'text-green-600'} />
          </div>

          {/* PO History */}
          {vendorPOs.length > 0 && (
            <Card padding={false}>
              <div className="px-4 py-2 bg-gray-50 border-b">
                <span className="text-sm font-semibold text-gray-700">Purchase Orders ({vendorPOs.length})</span>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <thead><tr><Th>PO No</Th><Th>Date</Th><Th>Item</Th><Th>Type</Th><Th right>Amount</Th><Th>GRN No</Th><Th>Status</Th></tr></thead>
                  <tbody>
                    {vendorPOs.map((o: any) => (
                      <tr key={o.id} className="text-sm hover:bg-gray-50">
                        <Td className="font-mono text-xs font-semibold text-brand-700">{o.po_no}</Td>
                        <Td className="text-xs">{o.po_date ? fmtDate(o.po_date) : '—'}</Td>
                        <Td className="text-xs">{o.item_name ?? '—'}</Td>
                        <Td className="text-xs text-gray-500">{o.material_type ?? '—'}</Td>
                        <Td right className="font-semibold">{o.total_amount ? inr(o.total_amount) : '—'}</Td>
                        <Td className="text-xs text-gray-500">{o.grn_no ?? '—'}</Td>
                        <Td><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_CLS[o.material_status] ?? 'bg-gray-100'}`}>{o.material_status ?? '—'}</span></Td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </Card>
          )}

          {/* Payment History */}
          {vendorPays.length > 0 && (
            <Card padding={false}>
              <div className="px-4 py-2 bg-gray-50 border-b">
                <span className="text-sm font-semibold text-gray-700">Payments ({vendorPays.length}) · Outstanding: <span className={outstanding > 0 ? 'text-red-600' : 'text-green-600'}>{inr(outstanding)}</span></span>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <thead><tr><Th>Invoice No</Th><Th>Invoice Date</Th><Th right>Amount</Th><Th>Pay Before</Th><Th>Status</Th><Th>Paid Date</Th><Th>UTR/Cheque</Th><Th>Remarks</Th></tr></thead>
                  <tbody>
                    {vendorPays.map((p: any) => (
                      <tr key={p.id} className={`text-sm ${RowCls(p)}`}>
                        <Td className="text-xs text-gray-500">{p.invoice_no ?? '—'}</Td>
                        <Td className="text-xs">{p.invoice_date ? fmtDate(p.invoice_date) : '—'}</Td>
                        <Td right className="font-semibold">{p.invoice_amount ? inr(p.invoice_amount) : '—'}</Td>
                        <Td className="text-xs">{p.pay_before_date ? fmtDate(p.pay_before_date) : '—'}</Td>
                        <Td><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_CLS[p.payment_status] ?? 'bg-gray-100'}`}>{p.payment_status}</span></Td>
                        <Td className="text-xs">{p.paid_date ? fmtDate(p.paid_date) : '—'}</Td>
                        <Td className="text-xs font-mono text-gray-500">{p.utr_no ?? p.cheque_no ?? '—'}</Td>
                        <Td className="text-xs text-gray-400 max-w-[160px] truncate">{p.remarks ?? '—'}</Td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </Card>
          )}

          {vendorPOs.length === 0 && vendorPays.length === 0 && (
            <EmptyState icon={<Building2 size={32}/>} title="No records found for this vendor" />
          )}
        </>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════
// VENDOR BANKS TAB
// ══════════════════════════════════════════════════════════════════
const EMPTY_VB = { vendor_name:'', bank_name:'', branch:'', ifsc:'', account_no:'' }

const VendorBanksTab: React.FC = () => {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [open, setOpen]     = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm]     = useState<any>(EMPTY_VB)
  const [delId, setDelId]   = useState<string|null>(null)
  const f = (k: string) => (e: any) => setForm((p: any) => ({...p,[k]:e.target.value}))

  const { data: banks=[], isLoading } = useQuery({
    queryKey: ['vendor_bank_details'],
    queryFn: async () => { const { data } = await supabase.from('vendor_bank_details').select('*').order('vendor_name'); return data ?? [] }
  })

  const saveMut = useMutation({
    mutationFn: async () => {
      const payload = { vendor_name: form.vendor_name, bank_name: form.bank_name||null, branch: form.branch||null, ifsc: form.ifsc||null, account_no: form.account_no||null }
      if (editing) await supabase.from('vendor_bank_details').update(payload).eq('id', editing.id)
      else await supabase.from('vendor_bank_details').insert(payload)
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['vendor_bank_details'] }); setOpen(false); toast.success('Saved') },
    onError: (e: any) => toast.error(e.message),
  })

  const delMut = useMutation({
    mutationFn: async (id: string) => { await supabase.from('vendor_bank_details').delete().eq('id', id) },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['vendor_bank_details'] }); setDelId(null); toast.success('Deleted') },
  })

  const filtered = useMemo(() => {
    if (!search) return banks
    const q = search.toLowerCase()
    return banks.filter((b:any) => b.vendor_name?.toLowerCase().includes(q) || b.bank_name?.toLowerCase().includes(q) || b.account_no?.includes(q) || b.ifsc?.toLowerCase().includes(q))
  }, [banks, search])

  const openNew  = () => { setEditing(null); setForm({...EMPTY_VB}); setOpen(true) }
  const openEdit = (r: any) => { setEditing(r); setForm({...EMPTY_VB,...r}); setOpen(true) }

  if (isLoading) return <Spinner />

  return (
    <div className="space-y-4">
      <div className="flex gap-2 items-center">
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search vendor / bank / IFSC..."
          className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 w-72" />
        <Button size="sm" onClick={openNew} icon={<Plus size={14}/>}>Add Vendor Bank</Button>
      </div>

      <Card padding={false}>
        <Table>
          <thead><tr>
            <Th>Vendor Name</Th><Th>Bank Name</Th><Th>Branch</Th>
            <Th>IFSC</Th><Th>Account No</Th><Th></Th>
          </tr></thead>
          <tbody>
            {filtered.map((b: any) => (
              <tr key={b.id} className="hover:bg-gray-50 text-sm">
                <Td className="font-medium">{b.vendor_name}</Td>
                <Td>{b.bank_name ?? '—'}</Td>
                <Td className="text-xs text-gray-500">{b.branch ?? '—'}</Td>
                <Td className="font-mono text-xs">{b.ifsc ?? '—'}</Td>
                <Td className="font-mono text-xs">{b.account_no ?? '—'}</Td>
                <Td>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(b)} className="p-1 text-blue-400 hover:text-blue-600"><Pencil size={13}/></button>
                    <button onClick={() => setDelId(b.id)} className="p-1 text-red-400 hover:text-red-600"><Trash2 size={13}/></button>
                  </div>
                </Td>
              </tr>
            ))}
            {filtered.length===0 && <tr><td colSpan={6}><EmptyState icon={<Building2 size={32}/>} title="No vendor bank details" /></td></tr>}
          </tbody>
        </Table>
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Edit Vendor Bank' : 'Add Vendor Bank'}
        footer={<div className="flex gap-2 justify-end"><Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={() => saveMut.mutate()} loading={saveMut.isPending}>Save</Button></div>}>
        <div className="space-y-3">
          <Input label="Vendor Name *" value={form.vendor_name} onChange={f('vendor_name')} required />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Bank Name" value={form.bank_name} onChange={f('bank_name')} />
            <Input label="Branch" value={form.branch} onChange={f('branch')} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="IFSC Code" value={form.ifsc} onChange={f('ifsc')} />
            <Input label="Account No" value={form.account_no} onChange={f('account_no')} />
          </div>
        </div>
      </Modal>

      <Modal open={!!delId} onClose={() => setDelId(null)} title="Delete Vendor Bank"
        footer={<div className="flex gap-2 justify-end"><Button variant="secondary" onClick={() => setDelId(null)}>Cancel</Button><Button variant="danger" onClick={() => delId && delMut.mutate(delId)} loading={delMut.isPending}>Delete</Button></div>}>
        <p className="text-sm text-gray-600">Delete this vendor bank record?</p>
      </Modal>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════
// BANK LEDGER TAB
// ══════════════════════════════════════════════════════════════════
const EMPTY_ACCT = { bank_name:'', account_name:'', account_no:'', ifsc:'', branch:'', opening_balance:'0' }
const EMPTY_TXN  = { bank_account_id:'', txn_date: today(), txn_type:'Debit', category:'', reference_no:'', description:'', amount:'', linked_payment_id:'' }

const BankLedgerTab: React.FC = () => {
  const qc = useQueryClient()
  const [selAcct, setSelAcct]     = useState('')
  const [acctOpen, setAcctOpen]   = useState(false)
  const [editAcct, setEditAcct]   = useState<any>(null)
  const [acctForm, setAcctForm]   = useState<any>(EMPTY_ACCT)
  const [txnOpen, setTxnOpen]     = useState(false)
  const [editTxn, setEditTxn]     = useState<any>(null)
  const [txnForm, setTxnForm]     = useState<any>(EMPTY_TXN)
  const [delAcct, setDelAcct]     = useState<string|null>(null)
  const [delTxn, setDelTxn]       = useState<string|null>(null)
  const fa = (k:string) => (e:any) => setAcctForm((p:any)=>({...p,[k]:e.target.value}))
  const ft = (k:string) => (e:any) => setTxnForm((p:any) =>({...p,[k]:e.target.value}))

  const { data: accounts=[], isLoading: acctLoading } = useQuery({
    queryKey: ['bank_accounts'],
    queryFn: async () => { const { data } = await supabase.from('bank_accounts').select('*').order('bank_name'); return data ?? [] }
  })

  const { data: transactions=[], isLoading: txnLoading } = useQuery({
    queryKey: ['bank_transactions', selAcct],
    enabled: !!selAcct,
    queryFn: async () => {
      const { data } = await supabase.from('bank_transactions').select('*, pending_payments(vendor_name,invoice_no)')
        .eq('bank_account_id', selAcct).order('txn_date', { ascending: true })
      return data ?? []
    }
  })

  const { data: payments=[] } = useQuery({
    queryKey: ['pending_payments_unpaid'],
    queryFn: async () => { const { data } = await supabase.from('pending_payments').select('id,vendor_name,invoice_no,invoice_amount').neq('payment_status','Paid').order('invoice_date',{ascending:false}); return data ?? [] }
  })

  const selectedAccount = useMemo(() => accounts.find((a:any) => a.id === selAcct), [accounts, selAcct])

  // Running balance
  const ledgerRows = useMemo(() => {
    if (!selectedAccount) return []
    let balance = Number(selectedAccount.opening_balance ?? 0)
    return transactions.map((t:any) => {
      if (t.txn_type === 'Credit') balance += Number(t.amount)
      else balance -= Number(t.amount)
      return { ...t, running_balance: balance }
    })
  }, [transactions, selectedAccount])

  const currentBalance = ledgerRows.length > 0 ? ledgerRows[ledgerRows.length-1].running_balance : Number(selectedAccount?.opening_balance ?? 0)
  const totalCredits = transactions.filter((t:any)=>t.txn_type==='Credit').reduce((s:number,t:any)=>s+Number(t.amount),0)
  const totalDebits  = transactions.filter((t:any)=>t.txn_type==='Debit').reduce((s:number,t:any)=>s+Number(t.amount),0)

  const saveAcctMut = useMutation({
    mutationFn: async () => {
      const p = { bank_name: acctForm.bank_name, account_name: acctForm.account_name||null, account_no: acctForm.account_no||null, ifsc: acctForm.ifsc||null, branch: acctForm.branch||null, opening_balance: Number(acctForm.opening_balance||0), is_active: true }
      if (editAcct) await supabase.from('bank_accounts').update(p).eq('id', editAcct.id)
      else await supabase.from('bank_accounts').insert(p)
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['bank_accounts'] }); setAcctOpen(false); toast.success('Account saved') },
    onError: (e:any) => toast.error(e.message),
  })

  const delAcctMut = useMutation({
    mutationFn: async (id:string) => { await supabase.from('bank_accounts').delete().eq('id',id) },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['bank_accounts'] }); if (selAcct===delAcct) setSelAcct(''); setDelAcct(null); toast.success('Deleted') },
  })

  const saveTxnMut = useMutation({
    mutationFn: async () => {
      const p = {
        bank_account_id: txnForm.bank_account_id || selAcct,
        txn_date: txnForm.txn_date, txn_type: txnForm.txn_type,
        category: txnForm.category||null, reference_no: txnForm.reference_no||null,
        description: txnForm.description||null, amount: Number(txnForm.amount),
        linked_payment_id: txnForm.linked_payment_id||null,
      }
      if (editTxn) await supabase.from('bank_transactions').update(p).eq('id', editTxn.id)
      else await supabase.from('bank_transactions').insert(p)
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['bank_transactions'] }); setTxnOpen(false); toast.success('Transaction saved') },
    onError: (e:any) => toast.error(e.message),
  })

  const delTxnMut = useMutation({
    mutationFn: async (id:string) => { await supabase.from('bank_transactions').delete().eq('id',id) },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['bank_transactions'] }); setDelTxn(null); toast.success('Deleted') },
  })

  const openNewAcct  = () => { setEditAcct(null); setAcctForm({...EMPTY_ACCT}); setAcctOpen(true) }
  const openEditAcct = (r:any) => { setEditAcct(r); setAcctForm({...EMPTY_ACCT,...r,opening_balance:String(r.opening_balance??0)}); setAcctOpen(true) }
  const openNewTxn   = () => { setEditTxn(null); setTxnForm({...EMPTY_TXN, bank_account_id: selAcct, txn_date: today()}); setTxnOpen(true) }
  const openEditTxn  = (r:any) => { setEditTxn(r); setTxnForm({...EMPTY_TXN,...r,linked_payment_id:r.linked_payment_id??''}); setTxnOpen(true) }

  return (
    <div className="space-y-4">
      {/* Bank accounts list */}
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-semibold text-gray-700">Bank Accounts</h3>
        <Button size="sm" variant="outline" onClick={openNewAcct} icon={<Plus size={14}/>}>Add Account</Button>
      </div>

      {acctLoading ? <Spinner /> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {accounts.map((a:any) => (
            <div key={a.id} onClick={() => setSelAcct(a.id===selAcct?'':a.id)}
              className={`bg-white border rounded-xl p-4 cursor-pointer transition-shadow hover:shadow-md ${a.id===selAcct?'ring-2 ring-brand-500 shadow-md':''}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Landmark size={18} className="text-brand-600"/>
                  <div>
                    <div className="font-semibold text-sm">{a.bank_name}</div>
                    <div className="text-xs text-gray-500">{a.account_name}</div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={e=>{e.stopPropagation();openEditAcct(a)}} className="p-1 text-gray-400 hover:text-blue-600"><Pencil size={12}/></button>
                  <button onClick={e=>{e.stopPropagation();setDelAcct(a.id)}} className="p-1 text-gray-400 hover:text-red-600"><Trash2 size={12}/></button>
                </div>
              </div>
              <div className="mt-2 font-mono text-xs text-gray-600">{a.account_no}</div>
              <div className="text-xs text-gray-400">{a.ifsc} · {a.branch}</div>
              <div className="mt-2 text-xs text-gray-500">Opening: {inr(a.opening_balance ?? 0)}</div>
            </div>
          ))}
          {accounts.length === 0 && <div className="col-span-3 text-sm text-gray-400 py-4">No bank accounts added yet.</div>}
        </div>
      )}

      {/* Ledger for selected account */}
      {selAcct && selectedAccount && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-800">Ledger — {selectedAccount.bank_name} ({selectedAccount.account_name})</h3>
            <Button size="sm" onClick={openNewTxn} icon={<Plus size={14}/>}>Add Transaction</Button>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <StatCard title="Current Balance" value={inr(currentBalance)} icon={<CreditCard size={18}/>} color={currentBalance >= 0 ? 'text-green-600' : 'text-red-600'} />
            <StatCard title="Total Credits" value={inr(totalCredits)} icon={<TrendingUp size={18}/>} color="text-blue-600" />
            <StatCard title="Total Debits" value={inr(totalDebits)} icon={<TrendingDown size={18}/>} color="text-red-600" />
          </div>

          {txnLoading ? <Spinner /> : (
            <Card padding={false}>
              <div className="overflow-x-auto">
                <Table>
                  <thead><tr>
                    <Th>Date</Th><Th>Type</Th><Th>Category</Th><Th>Description</Th>
                    <Th>Reference</Th><Th>Linked Payment</Th>
                    <Th right>Debit</Th><Th right>Credit</Th><Th right>Balance</Th><Th></Th>
                  </tr></thead>
                  <tbody>
                    {[...ledgerRows].reverse().map((t: any) => (
                      <tr key={t.id} className={`text-sm hover:bg-gray-50 ${t.txn_type==='Credit'?'':'bg-red-50/30'}`}>
                        <Td className="text-xs">{fmtDate(t.txn_date)}</Td>
                        <Td><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${t.txn_type==='Credit'?'bg-green-100 text-green-700':'bg-red-100 text-red-700'}`}>{t.txn_type}</span></Td>
                        <Td className="text-xs text-gray-500">{t.category ?? '—'}</Td>
                        <Td className="text-xs max-w-[200px] truncate">{t.description ?? '—'}</Td>
                        <Td className="font-mono text-xs text-gray-500">{t.reference_no ?? '—'}</Td>
                        <Td className="text-xs text-gray-500">{t.pending_payments?.vendor_name ?? '—'}</Td>
                        <Td right className="text-red-600 text-xs">{t.txn_type==='Debit' ? inr(t.amount) : '—'}</Td>
                        <Td right className="text-green-600 text-xs">{t.txn_type==='Credit' ? inr(t.amount) : '—'}</Td>
                        <Td right className={`font-semibold text-xs ${t.running_balance>=0?'text-gray-800':'text-red-600'}`}>{inr(t.running_balance)}</Td>
                        <Td>
                          <div className="flex gap-1">
                            <button onClick={() => openEditTxn(t)} className="p-1 text-blue-400 hover:text-blue-600"><Pencil size={12}/></button>
                            <button onClick={() => setDelTxn(t.id)} className="p-1 text-red-400 hover:text-red-600"><Trash2 size={12}/></button>
                          </div>
                        </Td>
                      </tr>
                    ))}
                    {ledgerRows.length === 0 && <tr><td colSpan={10}><EmptyState icon={<CreditCard size={32}/>} title="No transactions yet" subtitle="Add transactions to see the running balance" /></td></tr>}
                  </tbody>
                </Table>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Add/Edit Account Modal */}
      <Modal open={acctOpen} onClose={() => setAcctOpen(false)} title={editAcct ? 'Edit Bank Account' : 'Add Bank Account'}
        footer={<div className="flex gap-2 justify-end"><Button variant="secondary" onClick={() => setAcctOpen(false)}>Cancel</Button><Button onClick={() => saveAcctMut.mutate()} loading={saveAcctMut.isPending}>Save</Button></div>}>
        <div className="space-y-3">
          <Input label="Bank Name *" value={acctForm.bank_name} onChange={fa('bank_name')} required />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Account Name" value={acctForm.account_name} onChange={fa('account_name')} placeholder="e.g. Naraendra Farms Main" />
            <Input label="Account No" value={acctForm.account_no} onChange={fa('account_no')} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="IFSC" value={acctForm.ifsc} onChange={fa('ifsc')} />
            <Input label="Branch" value={acctForm.branch} onChange={fa('branch')} />
          </div>
          <Input label="Opening Balance (₹)" type="number" value={acctForm.opening_balance} onChange={fa('opening_balance')} />
        </div>
      </Modal>

      {/* Add/Edit Transaction Modal */}
      <Modal open={txnOpen} onClose={() => setTxnOpen(false)} title={editTxn ? 'Edit Transaction' : 'Add Transaction'}
        footer={<div className="flex gap-2 justify-end"><Button variant="secondary" onClick={() => setTxnOpen(false)}>Cancel</Button><Button onClick={() => saveTxnMut.mutate()} loading={saveTxnMut.isPending}>Save</Button></div>}>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Date *" type="date" value={txnForm.txn_date} onChange={ft('txn_date')} required />
            <Sel label="Type *" value={txnForm.txn_type} onChange={ft('txn_type')} options={[{value:'Debit',label:'Debit (Payment Out)'},{value:'Credit',label:'Credit (Money In)'}]} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Sel label="Category" value={txnForm.category} onChange={ft('category')} options={[{value:'',label:'Select category'},...TXN_CATS.map(c=>({value:c,label:c}))]} />
            <Input label="Amount (₹) *" type="number" value={txnForm.amount} onChange={ft('amount')} required />
          </div>
          <Input label="Reference No (UTR/Cheque/NEFT)" value={txnForm.reference_no} onChange={ft('reference_no')} />
          <Input label="Description" value={txnForm.description} onChange={ft('description')} />
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Link to Vendor Payment (optional)</label>
            <select value={txnForm.linked_payment_id} onChange={ft('linked_payment_id')}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
              <option value="">— No link —</option>
              {payments.map((p:any) => <option key={p.id} value={p.id}>{p.vendor_name} · {p.invoice_no ?? 'No inv'} · {p.invoice_amount ? inr(p.invoice_amount) : ''}</option>)}
            </select>
          </div>
        </div>
      </Modal>

      {/* Delete confirms */}
      <Modal open={!!delAcct} onClose={() => setDelAcct(null)} title="Delete Bank Account"
        footer={<div className="flex gap-2 justify-end"><Button variant="secondary" onClick={() => setDelAcct(null)}>Cancel</Button><Button variant="danger" onClick={() => delAcct && delAcctMut.mutate(delAcct)} loading={delAcctMut.isPending}>Delete</Button></div>}>
        <p className="text-sm text-gray-600">Delete this bank account and all its transactions?</p>
      </Modal>
      <Modal open={!!delTxn} onClose={() => setDelTxn(null)} title="Delete Transaction"
        footer={<div className="flex gap-2 justify-end"><Button variant="secondary" onClick={() => setDelTxn(null)}>Cancel</Button><Button variant="danger" onClick={() => delTxn && delTxnMut.mutate(delTxn)} loading={delTxnMut.isPending}>Delete</Button></div>}>
        <p className="text-sm text-gray-600">Delete this transaction? Running balance will be recalculated.</p>
      </Modal>
    </div>
  )
}

// ── RATE ANALYSIS TAB ─────────────────────────────────────────────
const COLORS = ['#6366f1','#22c55e','#f59e0b','#ef4444','#3b82f6','#8b5cf6','#ec4899','#14b8a6','#f97316','#06b6d4']

// Expected Excel column names (case-insensitive, flexible matching)
const COL_MAP: Record<string, string[]> = {
  po_no:          ['po no','po_no','po number','order no','order number'],
  po_date:        ['po date','po_date','order date','date'],
  fiscal_year:    ['fiscal year','fiscal_year','fy','year','financial year'],
  vendor_name:    ['vendor','vendor name','vendor_name','supplier','company','party'],
  item_name:      ['item','item name','item_name','material','product','description'],
  material_type:  ['material type','material_type','type','category'],
  quantity:       ['qty','quantity','amount','volume'],
  unit:           ['unit','uom','unit of measure'],
  rate:           ['rate','price','unit price','unit rate','rate per unit','cost'],
  gst_pct:        ['gst%','gst pct','gst_pct','gst','tax%','tax'],
  total_amount:   ['total','total amount','total_amount','value','invoice value'],
  grn_no:         ['grn no','grn_no','grn number','receipt no'],
  grn_date:       ['grn date','grn_date','receipt date'],
  material_status:['status','material status','material_status','po status'],
}

function matchCol(headers: string[], aliases: string[]): string | undefined {
  const lower = headers.map(h => h.toLowerCase().trim())
  for (const alias of aliases) {
    const idx = lower.indexOf(alias)
    if (idx !== -1) return headers[idx]
  }
  return undefined
}

function parseDateVal(v: any): string | null {
  if (!v) return null
  if (typeof v === 'number') {
    // Excel serial date
    const d = XLSX.SSF.parse_date_code(v)
    if (d) return `${d.y}-${String(d.m).padStart(2,'0')}-${String(d.d).padStart(2,'0')}`
  }
  const s = String(v).trim()
  if (!s) return null
  // Try dd-mm-yyyy, dd/mm/yyyy, yyyy-mm-dd
  const dmy = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/)
  if (dmy) {
    const [,d,m,y] = dmy
    const yr = y.length===2 ? `20${y}` : y
    return `${yr}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`
  }
  const iso = s.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/)
  if (iso) return `${iso[1]}-${iso[2].padStart(2,'0')}-${iso[3].padStart(2,'0')}`
  return null
}

function inferFY(dateStr: string | null): string {
  if (!dateStr) return 'Unknown'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return 'Unknown'
  const m = d.getMonth() + 1 // 1-12
  const y = d.getFullYear()
  return m >= 4 ? `${y}-${String(y+1).slice(2)}` : `${y-1}-${String(y).slice(2)}`
}

const RateAnalysisTab: React.FC = () => {
  const qc = useQueryClient()
  const importRef = useRef<HTMLInputElement>(null)
  const [importing, setImporting] = useState(false)
  const [preview, setPreview] = useState<{rows:any[], mapped:Record<string,string>, headers:string[]} | null>(null)
  const [selectedItem, setSelectedItem] = useState('')
  const [selectedVendor, setSelectedVendor] = useState('')
  const [viewMode, setViewMode] = useState<'trend'|'vendor'|'table'>('trend')

  // All PO data for analysis
  const { data: pos, isLoading } = useQuery({
    queryKey: ['po_rate_analysis'],
    queryFn: async () => {
      const { data } = await supabase
        .from('purchase_orders')
        .select('po_no,po_date,fiscal_year,vendor_name,item_name,material_type,quantity,unit,rate,gst_pct,total_amount')
        .not('rate', 'is', null)
        .order('po_date', { ascending: true })
      return data ?? []
    }
  })

  const importMut = useMutation({
    mutationFn: async (rows: any[]) => {
      const chunks = []
      for (let i = 0; i < rows.length; i += 200) chunks.push(rows.slice(i, i+200))
      let inserted = 0
      for (const chunk of chunks) {
        const { error, count } = await supabase.from('purchase_orders')
          .upsert(chunk, { onConflict: 'po_no,item_name', ignoreDuplicates: false })
          .select('id')
        if (error) throw error
        inserted += count ?? chunk.length
      }
      return inserted
    },
    onSuccess: (n) => {
      toast.success(`Imported ${n} PO records`)
      qc.invalidateQueries({ queryKey: ['po_rate_analysis'] })
      qc.invalidateQueries({ queryKey: ['purchase_orders'] })
      setPreview(null)
    },
    onError: (e: any) => toast.error(e.message)
  })

  const handleFile = useCallback((file: File) => {
    setImporting(true)
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target?.result, { type: 'binary', cellDates: false })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const raw: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })
        if (raw.length < 2) { toast.error('Sheet is empty'); setImporting(false); return }
        const headers = raw[0].map((h: any) => String(h).trim())
        // Map columns
        const mapped: Record<string, string> = {}
        for (const [field, aliases] of Object.entries(COL_MAP)) {
          const match = matchCol(headers, aliases)
          if (match) mapped[field] = match
        }
        if (!mapped.vendor_name || !mapped.item_name) {
          toast.error('Could not find vendor or item columns. Check your Excel headers.')
          setImporting(false); return
        }
        const dataRows = raw.slice(1).filter(r => r.some((v:any) => v !== ''))
        setPreview({ rows: dataRows, mapped, headers })
      } catch (err: any) {
        toast.error('Failed to read file: ' + err.message)
      }
      setImporting(false)
    }
    reader.readAsBinaryString(file)
  }, [])

  const handleConfirmImport = () => {
    if (!preview) return
    const { rows, mapped, headers } = preview
    const getVal = (row: any[], field: string) => {
      const col = mapped[field]
      if (!col) return null
      return row[headers.indexOf(col)]
    }
    const records = rows.map(row => {
      const dateStr = parseDateVal(getVal(row, 'po_date'))
      const fy = getVal(row, 'fiscal_year') ? String(getVal(row, 'fiscal_year')).trim() : inferFY(dateStr)
      const poNo = getVal(row, 'po_no') ? String(getVal(row, 'po_no')).trim() : `IMP-${Date.now()}-${Math.random().toString(36).slice(2,6)}`
      const rate = parseFloat(String(getVal(row, 'rate'))) || null
      const qty  = parseFloat(String(getVal(row, 'quantity'))) || null
      const gst  = parseFloat(String(getVal(row, 'gst_pct'))) || null
      const total= parseFloat(String(getVal(row, 'total_amount'))) || (rate && qty ? rate * qty : null)
      return {
        po_no:           poNo,
        po_date:         dateStr,
        fiscal_year:     fy || 'Unknown',
        vendor_name:     String(getVal(row, 'vendor_name') ?? '').trim() || 'Unknown',
        item_name:       String(getVal(row, 'item_name') ?? '').trim() || 'Unknown',
        material_type:   String(getVal(row, 'material_type') ?? '').trim() || null,
        quantity:        qty,
        unit:            String(getVal(row, 'unit') ?? '').trim() || null,
        rate:            rate,
        gst_pct:         gst,
        total_amount:    total,
        grn_no:          getVal(row, 'grn_no') ? String(getVal(row, 'grn_no')).trim() : null,
        grn_date:        parseDateVal(getVal(row, 'grn_date')),
        material_status: getVal(row, 'material_status') ? String(getVal(row, 'material_status')).trim() : 'Received',
      }
    }).filter(r => r.vendor_name && r.item_name && r.vendor_name !== 'Unknown')
    importMut.mutate(records)
  }

  // Derived data for analysis
  const items   = useMemo(() => [...new Set((pos??[]).map(p => p.item_name).filter(Boolean))].sort(), [pos])
  const vendors = useMemo(() => [...new Set((pos??[]).map(p => p.vendor_name).filter(Boolean))].sort(), [pos])
  const fiscalYears = useMemo(() => [...new Set((pos??[]).map(p => p.fiscal_year).filter(Boolean))].sort(), [pos])

  // Trend data: for selected item, avg rate per FY per vendor
  const trendData = useMemo(() => {
    if (!selectedItem || !pos) return []
    const filtered = pos.filter(p => p.item_name === selectedItem && p.rate)
    // group by FY
    const byFY: Record<string, Record<string, {sum:number,cnt:number}>> = {}
    for (const p of filtered) {
      const fy = p.fiscal_year ?? 'Unknown'
      const v  = p.vendor_name ?? 'Unknown'
      if (!byFY[fy]) byFY[fy] = {}
      if (!byFY[fy][v]) byFY[fy][v] = {sum:0,cnt:0}
      byFY[fy][v].sum += p.rate!
      byFY[fy][v].cnt++
    }
    const allVendors = [...new Set(filtered.map(p=>p.vendor_name))]
    return Object.entries(byFY).sort(([a],[b])=>a.localeCompare(b)).map(([fy, vmap]) => {
      const row: any = { fy }
      for (const v of allVendors) {
        if (vmap[v]) row[v] = +(vmap[v].sum / vmap[v].cnt).toFixed(2)
      }
      return row
    })
  }, [pos, selectedItem])

  const trendVendors = useMemo(() => {
    if (!selectedItem || !pos) return []
    return [...new Set(pos.filter(p=>p.item_name===selectedItem).map(p=>p.vendor_name))].filter(Boolean)
  }, [pos, selectedItem])

  // Vendor comparison: for selected item, all vendors side by side with stats
  const vendorCompData = useMemo(() => {
    if (!selectedItem || !pos) return []
    const filtered = pos.filter(p => p.item_name === selectedItem && p.rate)
    const byVendor: Record<string, number[]> = {}
    for (const p of filtered) {
      const v = p.vendor_name ?? 'Unknown'
      if (!byVendor[v]) byVendor[v] = []
      byVendor[v].push(p.rate!)
    }
    return Object.entries(byVendor).map(([vendor, rates]) => ({
      vendor,
      avg: +(rates.reduce((s,r)=>s+r,0)/rates.length).toFixed(2),
      min: +Math.min(...rates).toFixed(2),
      max: +Math.max(...rates).toFixed(2),
      orders: rates.length,
    })).sort((a,b) => a.avg - b.avg)
  }, [pos, selectedItem])

  // Summary rate table: item × FY showing avg rate + cheapest vendor
  const rateTable = useMemo(() => {
    if (!pos) return []
    const byItem: Record<string, Record<string,{sum:number,cnt:number,vendors:Record<string,number>}>> = {}
    for (const p of pos) {
      if (!p.item_name || !p.rate) continue
      const fy = p.fiscal_year ?? 'Unknown'
      if (!byItem[p.item_name]) byItem[p.item_name] = {}
      if (!byItem[p.item_name][fy]) byItem[p.item_name][fy] = {sum:0,cnt:0,vendors:{}}
      byItem[p.item_name][fy].sum += p.rate
      byItem[p.item_name][fy].cnt++
      const v = p.vendor_name ?? 'Unknown'
      if (!byItem[p.item_name][fy].vendors[v]) byItem[p.item_name][fy].vendors[v] = 0
      byItem[p.item_name][fy].vendors[v] += p.rate / (byItem[p.item_name][fy].cnt || 1)
    }
    // Re-compute vendor avg properly
    const byItemVendorFY: Record<string, Record<string, Record<string,{sum:number,cnt:number}>>> = {}
    for (const p of pos) {
      if (!p.item_name || !p.rate) continue
      const fy = p.fiscal_year ?? 'Unknown'
      const v  = p.vendor_name ?? 'Unknown'
      if (!byItemVendorFY[p.item_name]) byItemVendorFY[p.item_name] = {}
      if (!byItemVendorFY[p.item_name][fy]) byItemVendorFY[p.item_name][fy] = {}
      if (!byItemVendorFY[p.item_name][fy][v]) byItemVendorFY[p.item_name][fy][v] = {sum:0,cnt:0}
      byItemVendorFY[p.item_name][fy][v].sum += p.rate
      byItemVendorFY[p.item_name][fy][v].cnt++
    }
    return Object.entries(byItem).map(([item, fyData]) => {
      const fys = Object.keys(fyData).sort()
      return {
        item,
        fys: fys.map(fy => {
          const d = fyData[fy]
          const avg = +(d.sum/d.cnt).toFixed(2)
          // cheapest vendor this FY
          const vmap = byItemVendorFY[item][fy]
          const cheapest = Object.entries(vmap).map(([v,x])=>({v,avg:x.sum/x.cnt})).sort((a,b)=>a.avg-b.avg)[0]
          return { fy, avg, cheapest: cheapest?.v ?? '—', cheapestRate: +cheapest?.avg.toFixed(2) }
        })
      }
    }).sort((a,b)=>a.item.localeCompare(b.item))
  }, [pos])

  const handleDownloadTemplate = () => {
    const headers = ['po_no','po_date','fiscal_year','vendor_name','item_name','material_type','quantity','unit','rate','gst_pct','total_amount','grn_no','grn_date','material_status']
    const sample  = ['PO-2022-001','01-04-2022','2022-23','ABC Company','Maize','Feed Raw Material','100','Tons','18500','5','1942500','GRN001','05-04-2022','Received']
    exportFlatCSV('po_import_template.csv', headers, [sample])
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Rate Analysis</h2>
          <p className="text-xs text-gray-500">Compare yearly rates and vendor prices across all products</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" icon={<Download size={14}/>} onClick={handleDownloadTemplate}>Download Template</Button>
          <Button variant="outline" size="sm" icon={<Upload size={14}/>} onClick={() => importRef.current?.click()} loading={importing}>
            Import Excel / CSV
          </Button>
          <input ref={importRef} type="file" accept=".xlsx,.xls,.csv" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if(f) handleFile(f); e.target.value='' }} />
        </div>
      </div>

      {/* Import preview */}
      {preview && (
        <Card>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="font-semibold text-gray-900">Import Preview</p>
              <p className="text-xs text-gray-500">{preview.rows.length} rows found · Mapped columns: {Object.keys(preview.mapped).join(', ')}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={()=>setPreview(null)}>Cancel</Button>
              <Button size="sm" loading={importMut.isPending} onClick={handleConfirmImport}>Confirm Import</Button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="text-xs w-full">
              <thead><tr className="bg-gray-50">
                {preview.headers.map(h=><th key={h} className="px-2 py-1 text-left text-gray-500 font-medium border-b">{h}</th>)}
              </tr></thead>
              <tbody>
                {preview.rows.slice(0,5).map((row,i)=>(
                  <tr key={i} className="border-b hover:bg-gray-50">
                    {row.map((cell:any,j:number)=><td key={j} className="px-2 py-1 text-gray-700">{String(cell)}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
            {preview.rows.length > 5 && <p className="text-xs text-gray-400 px-2 py-1">…and {preview.rows.length-5} more rows</p>}
          </div>
        </Card>
      )}

      {isLoading ? <Spinner/> : (
        <>
          {/* Summary stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card><div className="text-xs text-gray-500">Total PO Records</div><div className="text-xl font-bold text-gray-800 mt-1">{(pos??[]).length.toLocaleString('en-IN')}</div></Card>
            <Card><div className="text-xs text-gray-500">Unique Items</div><div className="text-xl font-bold text-brand-700 mt-1">{items.length}</div></Card>
            <Card><div className="text-xs text-gray-500">Unique Vendors</div><div className="text-xl font-bold text-gray-800 mt-1">{vendors.length}</div></Card>
            <Card><div className="text-xs text-gray-500">Years of Data</div><div className="text-xl font-bold text-gray-800 mt-1">{fiscalYears.length}</div></Card>
          </div>

          {/* View mode switcher + item selector */}
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex rounded-lg border border-gray-200 overflow-hidden">
              {(['trend','vendor','table'] as const).map(m=>(
                <button key={m} onClick={()=>setViewMode(m)}
                  className={`px-4 py-1.5 text-sm font-medium transition-colors capitalize
                    ${viewMode===m?'bg-brand-600 text-white':'bg-white text-gray-600 hover:bg-gray-50'}`}>
                  {m==='trend'?'Yearly Trend':m==='vendor'?'Vendor Compare':'Rate Table'}
                </button>
              ))}
            </div>
            {viewMode !== 'table' && (
              <div className="flex-1 min-w-48">
                <label className="block text-xs text-gray-500 mb-1">Select Item / Product</label>
                <select value={selectedItem} onChange={e=>setSelectedItem(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500">
                  <option value="">— All Items —</option>
                  {items.map(i=><option key={i} value={i}>{i}</option>)}
                </select>
              </div>
            )}
          </div>

          {/* YEARLY TREND VIEW */}
          {viewMode === 'trend' && (
            <div className="space-y-4">
              {!selectedItem ? (
                <Card>
                  <p className="text-sm text-gray-500 text-center py-8">Select a product above to see its yearly rate trend</p>
                </Card>
              ) : trendData.length === 0 ? (
                <Card><p className="text-sm text-gray-400 text-center py-8">No rate data for {selectedItem}</p></Card>
              ) : (
                <>
                  <Card>
                    <p className="font-semibold text-gray-800 mb-4">Yearly Rate Trend — {selectedItem}</p>
                    <ResponsiveContainer width="100%" height={300}>
                      <ReLineChart data={trendData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                        <XAxis dataKey="fy" tick={{fontSize:12}}/>
                        <YAxis tick={{fontSize:12}} tickFormatter={v=>`₹${(v/1000).toFixed(0)}K`}/>
                        <Tooltip formatter={(v:number)=>`₹${v.toLocaleString('en-IN')}`}/>
                        <Legend/>
                        {trendVendors.map((v,i)=>(
                          <Line key={v} type="monotone" dataKey={v} stroke={COLORS[i%COLORS.length]}
                            strokeWidth={2} dot={{r:4}} name={v}/>
                        ))}
                      </ReLineChart>
                    </ResponsiveContainer>
                  </Card>
                  <Card padding={false}>
                    <div className="px-4 py-3 border-b border-gray-100"><p className="font-semibold text-gray-800">Rate Data — {selectedItem}</p></div>
                    <Table>
                      <thead><tr>
                        <Th>FY</Th>
                        {trendVendors.map(v=><Th key={v} right>{v}</Th>)}
                      </tr></thead>
                      <tbody>
                        {trendData.map(row=>(
                          <tr key={row.fy} className="hover:bg-gray-50">
                            <Td className="font-medium">{row.fy}</Td>
                            {trendVendors.map(v=>{
                              const rate = row[v]
                              return <Td key={v} right className={rate?'text-gray-800':'text-gray-300'}>
                                {rate ? `₹${rate.toLocaleString('en-IN')}` : '—'}
                              </Td>
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </Card>
                </>
              )}
            </div>
          )}

          {/* VENDOR COMPARISON VIEW */}
          {viewMode === 'vendor' && (
            <div className="space-y-4">
              {!selectedItem ? (
                <Card><p className="text-sm text-gray-500 text-center py-8">Select a product above to compare vendors</p></Card>
              ) : vendorCompData.length === 0 ? (
                <Card><p className="text-sm text-gray-400 text-center py-8">No vendor data for {selectedItem}</p></Card>
              ) : (
                <>
                  <Card>
                    <p className="font-semibold text-gray-800 mb-4">Vendor Rate Comparison — {selectedItem}</p>
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={vendorCompData} layout="vertical" margin={{left:120}}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                        <XAxis type="number" tick={{fontSize:11}} tickFormatter={v=>`₹${(v/1000).toFixed(0)}K`}/>
                        <YAxis type="category" dataKey="vendor" tick={{fontSize:11}} width={120}/>
                        <Tooltip formatter={(v:number)=>`₹${v.toLocaleString('en-IN')}`}/>
                        <Bar dataKey="avg" name="Avg Rate" fill="#6366f1" radius={[0,4,4,0]}/>
                        <Bar dataKey="min" name="Min Rate" fill="#22c55e" radius={[0,4,4,0]}/>
                        <Bar dataKey="max" name="Max Rate" fill="#f59e0b" radius={[0,4,4,0]}/>
                      </BarChart>
                    </ResponsiveContainer>
                  </Card>
                  <Card padding={false}>
                    <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                      <p className="font-semibold text-gray-800">Vendor Summary — {selectedItem}</p>
                      <Badge color="green">Sorted cheapest first</Badge>
                    </div>
                    <Table>
                      <thead><tr>
                        <Th>#</Th><Th>Vendor</Th>
                        <Th right>Avg Rate</Th><Th right>Min Rate</Th><Th right>Max Rate</Th>
                        <Th right>Orders</Th><Th right>Saving vs Costliest</Th>
                      </tr></thead>
                      <tbody>
                        {vendorCompData.map((v,i)=>{
                          const maxAvg = vendorCompData[vendorCompData.length-1].avg
                          const saving = maxAvg - v.avg
                          return (
                            <tr key={v.vendor} className={`hover:bg-gray-50 ${i===0?'bg-green-50':''}`}>
                              <Td className="text-gray-400 text-xs">{i+1}</Td>
                              <Td><span className="font-medium">{v.vendor}</span>{i===0&&<Badge color="green">Cheapest</Badge>}</Td>
                              <Td right className="font-semibold">₹{v.avg.toLocaleString('en-IN')}</Td>
                              <Td right className="text-green-600">₹{v.min.toLocaleString('en-IN')}</Td>
                              <Td right className="text-red-500">₹{v.max.toLocaleString('en-IN')}</Td>
                              <Td right>{v.orders}</Td>
                              <Td right className={saving>0?'text-green-600 font-medium':'text-gray-400'}>
                                {saving>0?`₹${saving.toLocaleString('en-IN')} cheaper`:'—'}
                              </Td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </Table>
                  </Card>
                </>
              )}
            </div>
          )}

          {/* RATE TABLE VIEW */}
          {viewMode === 'table' && (
            <Card padding={false}>
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <p className="font-semibold text-gray-800">All Items — Avg Rate by FY</p>
                <Button variant="outline" size="sm" icon={<Download size={14}/>} onClick={()=>{
                  exportFlatCSV('rate_analysis.csv',
                    ['Item',...fiscalYears.flatMap(fy=>[`${fy} Avg Rate`,`${fy} Cheapest Vendor`,`${fy} Cheapest Rate`])],
                    rateTable.map(r=>[r.item,...fiscalYears.flatMap(fy=>{
                      const d=r.fys.find(f=>f.fy===fy)
                      return d?[d.avg,d.cheapest,d.cheapestRate]:['—','—','—']
                    })])
                  )
                }}>Export CSV</Button>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <thead><tr>
                    <Th>Item / Product</Th>
                    {fiscalYears.map(fy=>(
                      <React.Fragment key={fy}>
                        <Th right>{fy} Avg</Th>
                        <Th>{fy} Best Vendor</Th>
                      </React.Fragment>
                    ))}
                  </tr></thead>
                  <tbody>
                    {rateTable.map(row=>(
                      <tr key={row.item} className="hover:bg-gray-50">
                        <Td className="font-medium text-sm">{row.item}</Td>
                        {fiscalYears.map(fy=>{
                          const d = row.fys.find(f=>f.fy===fy)
                          // YoY change
                          const fyi = fiscalYears.indexOf(fy)
                          const prev = fyi>0 ? row.fys.find(f=>f.fy===fiscalYears[fyi-1]) : null
                          const chg = d && prev ? ((d.avg-prev.avg)/prev.avg*100) : null
                          return (
                            <React.Fragment key={fy}>
                              <Td right>
                                {d ? (
                                  <div>
                                    <span className="font-semibold">₹{d.avg.toLocaleString('en-IN')}</span>
                                    {chg !== null && (
                                      <span className={`text-xs ml-1 ${chg>0?'text-red-500':'text-green-600'}`}>
                                        {chg>0?'↑':'↓'}{Math.abs(chg).toFixed(1)}%
                                      </span>
                                    )}
                                  </div>
                                ) : <span className="text-gray-300">—</span>}
                              </Td>
                              <Td className="text-xs text-gray-500">
                                {d ? <span title={`₹${d.cheapestRate}`}>{d.cheapest}</span> : '—'}
                              </Td>
                            </React.Fragment>
                          )
                        })}
                      </tr>
                    ))}
                    {rateTable.length===0&&<tr><Td colSpan={fiscalYears.length*2+1} className="text-center text-gray-400 py-6">No rate data yet. Import your Excel file above.</Td></tr>}
                  </tbody>
                </Table>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
