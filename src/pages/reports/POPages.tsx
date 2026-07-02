import React, { useState, useMemo, useRef, useCallback } from 'react'
import * as XLSX from 'xlsx'
import * as pdfjsLib from 'pdfjs-dist'
// Use CDN worker to avoid Vite bundling issues with dynamic import in production
if (typeof window !== 'undefined') pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs`
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { inr, fmtDate, currentFY } from '@/lib/utils'
import { useAuth, can } from '@/lib/auth'
import {
  Card, SectionHeader, Spinner, Table, Th, Td,
  Button, Input, Modal, Badge, StatCard, EmptyState
, DateInput, SearchableSelect } from '@/components/ui'
import {
  ShoppingCart, Clock, CheckCircle, AlertCircle, Plus, Pencil, Trash2,
  TrendingUp, Download, PackageCheck, BarChart3, Upload, LineChart,
  ChevronDown, ChevronUp
} from 'lucide-react'
import {
  LineChart as ReLineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import toast from 'react-hot-toast'
import { useConfigOptions, useConfigValues } from '@/hooks/useConfigOptions'

// ── constants ─────────────────────────────────────────────────────
const PAY_STATUS_FB  = ['Paid', 'Pending', 'Not Paid', 'HOLD']
const MAT_STATUS_FB  = ['Received', 'Pending']
const MAT_TYPES_FB   = ['Feed Raw Material','Medicine','Oral Medicine','Feed Medicine','Vaccine','Larvender','Feedmill Transport','Other']
const ACCT_TYPES_FB  = ['Online','Cash','NEFT','RTGS','IMPS','Cheque']
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
// Bills & GRN, Payments, Bank Ledger, Vendor Statement, Vendor Banks and Vendors
// Master used to be duplicate tabs here, each an independent (and diverging) UI
// over the same tables as the real standalone pages (Purchase > GRN, Accounts >
// Pending Payments, Accounts > Bank Ledger, Purchase > Vendor Statement, Purchase
// > Suppliers). Removed — this page now only owns the tabs with no equivalent
// elsewhere: Purchase Orders, Aging Report, Hatchery Advances, Rate Analysis.
type Tab = 'Purchase Orders' | 'Aging Report' | 'Hatchery Advances' | 'Rate Analysis'

// ── MAIN EXPORT ───────────────────────────────────────────────────
export const PurchaseOrdersPage: React.FC = () => {
  const [tab, setTab] = useState<Tab>('Purchase Orders')

  const TABS: { id: Tab; icon: any }[] = [
    { id: 'Purchase Orders', icon: <ShoppingCart size={14}/> },
    { id: 'Aging Report',    icon: <BarChart3 size={14}/> },
    { id: 'Hatchery Advances', icon: <PackageCheck size={14}/> },
    { id: 'Rate Analysis',   icon: <LineChart size={14}/> },
  ]

  return (
    <div className="space-y-4">
      <SectionHeader title="Purchase Orders" subtitle="Raise and track purchase orders, aging, hatchery advances and rate trends" />
      <div className="flex gap-1 border-b border-gray-200 overflow-x-auto">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap transition-colors
              ${tab===t.id ? 'border-brand-600 text-brand-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t.icon}{t.id}
          </button>
        ))}
      </div>
      {tab === 'Purchase Orders'  && <POTab />}
      {tab === 'Aging Report'     && <AgingReportTab />}
      {tab === 'Hatchery Advances' && <HatcheryAdvancesTab />}
      {tab === 'Rate Analysis'    && <RateAnalysisTab />}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════
// PO TAB
// ══════════════════════════════════════════════════════════════════
const EMPTY_PO = {
  po_no:'', po_date:'', fiscal_year:currentFY(), vendor_name:'', party_id:'', item_name:'',
  material_type:'', quantity:'', unit:'', rate:'', gst_pct:'', total_amount:'',
  grn_no:'', grn_date:'', material_status:'Pending', credit_limit_days:'',
}

const POTab: React.FC = () => {
  const qc = useQueryClient()
  const { profile } = useAuth()
  const canEdit = can.editPurchase(profile?.role)
  const canDel  = can.delete(profile?.role)
  const MAT_TYPES  = useConfigValues('material_type', MAT_TYPES_FB)
  const PAY_STATUS = useConfigValues('payment_status', PAY_STATUS_FB)
  const MAT_STATUS = useConfigValues('material_status', MAT_STATUS_FB)
  const ACCT_TYPES = useConfigValues('payment_method', ACCT_TYPES_FB)
  const [importOpen, setImportOpen] = useState(false)
  const [fy, setFy]           = useState(currentFY)
  const [typeF, setTypeF]     = useState('')
  const [statusF, setStatusF] = useState('')
  const [payStatusF, setPayStatusF] = useState('')
  const [search, setSearch]   = useState('')
  const [open, setOpen]       = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm]       = useState<any>(EMPTY_PO)
  const [delId, setDelId]     = useState<string|null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkDelOpen, setBulkDelOpen] = useState(false)
  const [bulkStatusOpen, setBulkStatusOpen] = useState(false)
  const [bulkStatusVal, setBulkStatusVal] = useState('Received')
  const [mergeOpen, setMergeOpen] = useState(false)
  const [viewMode, setViewMode] = useState<'flat'|'grouped'>('grouped')
  const [expandedPOs, setExpandedPOs] = useState<Set<string>>(new Set())
  const [receiptOpen, setReceiptOpen] = useState(false)
  const [receiptPO, setReceiptPO]     = useState<any>(null)
  const [receiptForm, setReceiptForm] = useState({ receipt_date: today(), qty_received: '', unit: '', condition: 'Good', vehicle_no: '', received_by: '', invoice_no: '', farm_id: '', remarks: '' })
  const { data: farms=[] } = useQuery({ queryKey: ['farms_po'], queryFn: async () => { const { data } = await supabase.from('farms').select('id,name,code').eq('is_active',true).order('name'); return data ?? [] } })
  const { data: parties=[] } = useQuery({
    queryKey: ['parties_supp'],
    queryFn: async () => { const { data } = await supabase.from('parties').select('id,name').in('type', ['supplier', 'both']).order('name'); return data ?? [] }
  })
  const partyOptions = parties.map((p: any) => ({ value: p.id, label: p.name }))
  const setVendorParty = (partyId: string) => {
    const p = parties.find((x: any) => x.id === partyId)
    setForm((f: any) => ({ ...f, party_id: partyId, vendor_name: p?.name ?? f.vendor_name }))
  }
  const rf = (k: string) => (e: any) => setReceiptForm((p: any) => ({...p,[k]:e.target.value}))
  const f = (k: string) => (e: any) => setForm((p: any) => ({...p,[k]:e.target.value}))

  // Multi-line items for New PO
  const emptyLine = () => ({ item_name:'', material_type:'', quantity:'', unit:'', rate:'', gst_pct:'', total_amount:'' })
  const [newLines, setNewLines] = useState<any[]>([emptyLine()])
  const setLine = (i: number, k: string, v: string) => setNewLines(ls => ls.map((l, idx) => idx === i ? { ...l, [k]: v } : l))
  const calcLineTotal = (i: number, k: string, v: string) => {
    setNewLines(ls => ls.map((l, idx) => {
      if (idx !== i) return l
      const next = { ...l, [k]: v }
      const qty = parseFloat(k==='quantity' ? v : next.quantity) || 0
      const rate = parseFloat(k==='rate' ? v : next.rate) || 0
      const gst = parseFloat(k==='gst_pct' ? v : next.gst_pct) || 0
      const basic = qty * rate
      next.total_amount = (basic + basic * gst / 100).toFixed(2)
      return next
    }))
  }

  const { data: orders=[], isLoading } = useQuery({
    queryKey: ['purchase_orders', fy],
    queryFn: async () => {
      const { data } = await supabase.from('purchase_orders').select('*')
        .eq('fiscal_year', fy).order('po_date', { ascending: false })
      return data ?? []
    }
  })

  const { data: poReceiptsSumRaw=[] } = useQuery({
    queryKey: ['po_receipts_sum'],
    queryFn: async () => {
      const { data } = await supabase.from('po_receipts').select('po_id,qty_received')
      return data ?? []
    }
  })
  const receivedByPO = useMemo(() => {
    const m: Record<string, number> = {}
    poReceiptsSumRaw.forEach((r: any) => { m[r.po_id] = (m[r.po_id] ?? 0) + (r.qty_received ?? 0) })
    return m
  }, [poReceiptsSumRaw])

  const saveMut = useMutation({
    mutationFn: async () => {
      if (!form.po_no) throw new Error('PO No is required')
      if (!form.vendor_name) throw new Error('Vendor Name is required')
      if (editing) {
        // Single-row edit
        const payload = {
          po_no: form.po_no, po_date: form.po_date || null, fiscal_year: form.fiscal_year,
          vendor_name: form.vendor_name, party_id: form.party_id || null, item_name: form.item_name || null,
          material_type: form.material_type || null,
          quantity: form.quantity ? Number(form.quantity) : null,
          unit: form.unit || null,
          rate: form.rate ? Number(form.rate) : null,
          gst_pct: form.gst_pct ? Number(form.gst_pct) : null,
          total_amount: form.total_amount ? Number(form.total_amount) : null,
          grn_no: form.grn_no || null, grn_date: form.grn_date || null,
          material_status: form.material_status,
          credit_limit_days: form.credit_limit_days ? Number(form.credit_limit_days) : null,
        }
        const { error } = await supabase.from('purchase_orders').update(payload).eq('id', editing.id)
        if (error) throw error
      } else {
        // Multi-line insert — one row per item in newLines
        const validLines = newLines.filter(l => l.item_name || l.total_amount)
        if (!validLines.length) throw new Error('Add at least one item')
        const rows = validLines.map(l => ({
          po_no: form.po_no, po_date: form.po_date || null, fiscal_year: form.fiscal_year,
          vendor_name: form.vendor_name, party_id: form.party_id || null,
          item_name: l.item_name || null,
          material_type: l.material_type || null,
          quantity: l.quantity ? Number(l.quantity) : null,
          unit: l.unit || null,
          rate: l.rate ? Number(l.rate) : null,
          gst_pct: l.gst_pct ? Number(l.gst_pct) : null,
          total_amount: l.total_amount ? Number(l.total_amount) : null,
          material_status: form.material_status,
          credit_limit_days: form.credit_limit_days ? Number(form.credit_limit_days) : null,
        }))
        const { error } = await supabase.from('purchase_orders').insert(rows)
        if (error) throw error
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['purchase_orders'] })
      qc.invalidateQueries({ queryKey: ['purchase_orders_all'] })
      setOpen(false)
      setNewLines([emptyLine()])
      toast.success('Saved')
    },
    onError: (e: any) => toast.error(e.message),
  })

  const delMut = useMutation({
    mutationFn: async (id: string) => { const{error}=await supabase.from('purchase_orders').delete().eq('id', id); if(error) throw error },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['purchase_orders'] }); qc.invalidateQueries({ queryKey: ['purchase_orders_all'] }); setDelId(null); toast.success('Deleted') },
    onError: (e: any) => toast.error(e.message),
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

      // Auto-update PO status to Received
      await supabase.from('purchase_orders').update({ material_status: 'Received', grn_date: receiptForm.receipt_date, payment_status: 'Pending' }).eq('id', receiptPO.id)

      // Auto-add vendor to parties master if not already present
      if (receiptPO.vendor_name) {
        const { data: existingParty } = await supabase.from('parties')
          .select('id').ilike('name', receiptPO.vendor_name.trim()).limit(1)
        if (!existingParty || existingParty.length === 0) {
          await supabase.from('parties').insert({
            name:        receiptPO.vendor_name.trim(),
            type:        'supplier',
            category:    receiptPO.material_type ?? 'Feed Raw Material',
            gstin:       receiptPO.vendor_gstin ?? null,
            address:     receiptPO.vendor_address ?? null,
            credit_days: receiptPO.credit_limit_days ?? 0,
            is_active:   true,
          })
        }
      }

      // Auto-add to feed_ingredients ONLY for Feed Raw Material type
      if (receiptPO.item_name && receiptPO.material_type === 'Feed Raw Material') {
        const { data: existingIngr } = await supabase.from('feed_ingredients')
          .select('id').ilike('name', receiptPO.item_name.trim()).limit(1)
        if (!existingIngr || existingIngr.length === 0) {
          await supabase.from('feed_ingredients').insert({
            name:      receiptPO.item_name.trim(),
            unit:      receiptPO.unit ?? 'kg',
            is_active: true,
          })
        }
      }

      // Auto-create GRN from PO receipt (eliminates double entry)
      if (receiptPO.item_name && receiptForm.qty_received) {
        const catMap: Record<string,string> = {
          'Feed Raw Material': 'Feed Ingredient', 'Medicine': 'Medicine',
          'Oral Medicine': 'Medicine', 'Feed Medicine': 'Medicine',
          'Vaccine': 'Vaccine', 'Larvender': 'Other',
          'Feedmill Transport': 'Other', 'Other': 'Other',
        }
        const grnCat = catMap[receiptPO.material_type ?? ''] ?? 'Other'

        // Look up party_id
        const { data: partyRows } = await supabase.from('parties')
          .select('id').ilike('name', receiptPO.vendor_name?.trim() ?? '').limit(1)
        const party_id = partyRows?.[0]?.id ?? null

        // Look up ingredient_id or medicine_id
        let ingredient_id = null, medicine_id = null
        if (grnCat === 'Feed Ingredient') {
          const { data: ir } = await supabase.from('feed_ingredients')
            .select('id').ilike('name', receiptPO.item_name.trim()).limit(1)
          ingredient_id = ir?.[0]?.id ?? null
        } else if (grnCat === 'Medicine' || grnCat === 'Vaccine') {
          const { data: mr } = await supabase.from('medicines_master')
            .select('id').ilike('name', receiptPO.item_name.trim()).limit(1)
          medicine_id = mr?.[0]?.id ?? null
        }

        const qty = Number(receiptForm.qty_received) || 0
        const rate = receiptPO.rate ? Number(receiptPO.rate) : 0
        const gst_pct = receiptPO.gst_pct ? Number(receiptPO.gst_pct) : 0
        const basic_amount = qty * rate
        const gst_amount   = basic_amount * gst_pct / 100
        const total_amount = basic_amount + gst_amount
        const grn_no = receiptPO.grn_no || `PO-${receiptPO.po_no}`
        const farm_id = receiptForm.farm_id || (farms[0]?.id ?? null)

        await supabase.from('grn').insert({
          grn_no, grn_date: receiptForm.receipt_date,
          farm_id, party_id, category: grnCat,
          ingredient_id, medicine_id,
          item_name: receiptPO.item_name,
          invoice_no: receiptForm.invoice_no || null,
          invoice_date: receiptForm.receipt_date,
          qty, unit: receiptForm.unit || receiptPO.unit || 'kg',
          price_per_unit: rate || null,
          basic_amount: basic_amount || null,
          gst_pct, gst_amount: gst_amount || null,
          total_amount: total_amount || null,
          vehicle_no: receiptForm.vehicle_no || null,
          remarks: receiptForm.remarks || null,
        })
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['purchase_orders'] })
      qc.invalidateQueries({ queryKey: ['purchase_orders_all'] })
      qc.invalidateQueries({ queryKey: ['po_receipts_sum'] })
      qc.invalidateQueries({ queryKey: ['parties'] })
      qc.invalidateQueries({ queryKey: ['feed_ingredients'] })
      qc.invalidateQueries({ queryKey: ['grns'] })
      qc.invalidateQueries({ queryKey: ['grn_stock'] })
      qc.invalidateQueries({ queryKey: ['v_medicine_stock'] })
      setReceiptOpen(false)
      toast.success('Stock receipt recorded & GRN auto-created. Now enter the invoice amount in Bills/GRN tab for payment tracking.')
    },
    onError: (e: any) => toast.error(e.message),
  })

  const bulkDelMut = useMutation({
    mutationFn: async (ids: string[]) => {
      for (let i = 0; i < ids.length; i += 50) {
        const { error } = await supabase.from('purchase_orders').delete().in('id', ids.slice(i, i + 50))
        if (error) throw error
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['purchase_orders'] }); qc.invalidateQueries({ queryKey: ['purchase_orders_all'] }); setSelected(new Set()); setBulkDelOpen(false); toast.success('Deleted selected POs') },
    onError: (e: any) => toast.error(e.message),
  })

  const bulkStatusMut = useMutation({
    mutationFn: async ({ ids, status }: { ids: string[]; status: string }) => {
      await supabase.from('purchase_orders').update({ material_status: status }).in('id', ids)
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['purchase_orders'] }); qc.invalidateQueries({ queryKey: ['purchase_orders_all'] }); setSelected(new Set()); setBulkStatusOpen(false); toast.success('Status updated') },
    onError: (e: any) => toast.error(e.message),
  })

  const filtered = useMemo(() => orders.filter((o: any) => {
    if (typeF      && o.material_type !== typeF) return false
    if (statusF    && o.material_status !== statusF) return false
    if (payStatusF && o.payment_status !== payStatusF) return false
    if (search) { const q = search.toLowerCase(); if (!o.vendor_name?.toLowerCase().includes(q) && !o.po_no?.toLowerCase().includes(q) && !o.item_name?.toLowerCase().includes(q)) return false }
    return true
  }), [orders, typeF, statusF, payStatusF, search])

  // checkbox helpers
  const allChecked = filtered.length > 0 && filtered.every((o: any) => selected.has(o.id))
  const someChecked = filtered.some((o: any) => selected.has(o.id))
  const toggleAll = () => {
    if (allChecked) setSelected(new Set())
    else setSelected(new Set(filtered.map((o: any) => o.id)))
  }
  const toggleOne = (id: string) => setSelected(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s })

  const grandTotal = filtered.reduce((s: number, o: any) => s + Number(o.total_amount ?? 0), 0)
  const received   = filtered.filter((o: any) => o.material_status === 'Received').length

  const groupedByPO = useMemo(() => {
    const m: Record<string, any[]> = {}
    filtered.forEach((o: any) => {
      const key = o.po_no?.trim() || o.id
      if (!m[key]) m[key] = []
      m[key].push(o)
    })
    return Object.entries(m).sort(([,a],[,b]) => {
      const da = a[0]?.po_date || ''
      const db = b[0]?.po_date || ''
      return db.localeCompare(da)
    })
  }, [filtered])

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
        <Sel value={statusF} onChange={(e:any)=>setStatusF(e.target.value)} options={[{value:'',label:'All Mat.Status'},...MAT_STATUS.map(s=>({value:s,label:s}))]} />
        <Sel value={payStatusF} onChange={(e:any)=>setPayStatusF(e.target.value)} options={[{value:'',label:'All Pay Status'},...PAY_STATUS.map(s=>({value:s,label:s}))]} />
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search vendor / PO / item..."
          className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 w-56" />
        <div className="ml-auto flex gap-2 items-center">
          <div className="flex border border-gray-300 rounded-md overflow-hidden">
            <button onClick={() => setViewMode('flat')} className={`px-3 py-1.5 text-xs font-medium ${viewMode==='flat' ? 'bg-brand-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>Flat List</button>
            <button onClick={() => setViewMode('grouped')} className={`px-3 py-1.5 text-xs font-medium ${viewMode==='grouped' ? 'bg-brand-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>By PO</button>
          </div>
          <Button size="sm" variant="outline" icon={<Download size={14}/>} onClick={() => exportCSV(`purchase_orders_${fy}.csv`, filtered, [
            {key:'po_no',label:'PO No'},{key:'po_date',label:'Date'},{key:'vendor_name',label:'Vendor'},{key:'item_name',label:'Item'},
            {key:'material_type',label:'Type'},{key:'quantity',label:'Qty'},{key:'unit',label:'Unit'},{key:'rate',label:'Rate'},
            {key:'gst_pct',label:'GST%'},{key:'total_amount',label:'Amount'},{key:'grn_no',label:'GRN No'},{key:'grn_date',label:'GRN Date'},{key:'material_status',label:'Status'}
          ])}>Export CSV</Button>
          {canEdit && <Button size="sm" variant="outline" icon={<Upload size={14}/>} onClick={()=>setImportOpen(true)}>Import PO</Button>}
          {canEdit && <Button size="sm" variant="outline" onClick={()=>setMergeOpen(true)}>Merge Vendors</Button>}
          {canEdit && <Button size="sm" onClick={openNew} icon={<Plus size={14}/>}>New PO</Button>}
        </div>
      </div>

      {/* Bulk action bar */}
      {someChecked && (
        <div className="flex items-center gap-3 bg-brand-50 border border-brand-200 rounded-lg px-4 py-2 text-sm">
          <span className="font-medium text-brand-700">{selected.size} selected</span>
          <Button size="sm" variant="outline" onClick={()=>setBulkStatusOpen(true)}>Mark Status</Button>
          {canDel && <Button size="sm" variant="danger" onClick={()=>setBulkDelOpen(true)}>Delete Selected</Button>}
          <button className="ml-auto text-gray-400 hover:text-gray-600 text-xs" onClick={()=>setSelected(new Set())}>Clear</button>
        </div>
      )}

      <POImportModal open={importOpen} onClose={()=>{ setImportOpen(false); qc.invalidateQueries({queryKey:['purchase_orders']}) }} />

      {viewMode === 'flat' ? (
      <Card padding={false}>
        <div className="overflow-x-auto">
          <Table>
            <thead><tr>
              <Th><input type="checkbox" checked={allChecked} ref={el => { if (el) el.indeterminate = someChecked && !allChecked }} onChange={toggleAll} className="rounded" /></Th>
              <Th>PO No</Th><Th>Date</Th><Th>Vendor</Th><Th>Item</Th><Th>Type</Th>
              <Th right>Qty</Th><Th>Unit</Th><Th right>Rate</Th><Th right>GST%</Th>
              <Th right>Amount</Th><Th>GRN No</Th><Th>GRN Date</Th><Th>Status</Th><Th></Th>
            </tr></thead>
            <tbody>
              {filtered.map((o: any) => (
                <tr key={o.id} className={`text-sm ${selected.has(o.id) ? 'bg-brand-50' : 'hover:bg-gray-50'}`}>
                  <Td><input type="checkbox" checked={selected.has(o.id)} onChange={()=>toggleOne(o.id)} className="rounded" /></Td>
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
                        <button onClick={() => { setReceiptPO(o); setReceiptForm({ receipt_date: today(), qty_received: String(o.quantity||''), unit: o.unit||'', condition: 'Good', vehicle_no: '', received_by: '', invoice_no: '', farm_id: '', remarks: '' }); setReceiptOpen(true) }}
                          className="p-1 text-green-500 hover:text-green-700" title="Record Stock Receipt"><PackageCheck size={13}/></button>
                      )}
                      {canDel && <button onClick={() => setDelId(o.id)} className="p-1 text-red-400 hover:text-red-600" title="Delete"><Trash2 size={13}/></button>}
                    </div>
                  </Td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={15} className="text-center py-8 text-gray-400 text-sm">No purchase orders found</td></tr>}
            </tbody>
          </Table>
        </div>
      </Card>
      ) : (
      <div className="space-y-3">
        {groupedByPO.length === 0 && <EmptyState title="No purchase orders found" />}
        {groupedByPO.map(([poKey, items]) => {
          const first = items[0]
          const isExpanded = expandedPOs.has(poKey)
          const groupTotal = items.reduce((s: number, o: any) => s + Number(o.total_amount ?? 0), 0)
          const groupOrdered = items.reduce((s: number, o: any) => s + Number(o.quantity ?? 0), 0)
          const groupReceived = items.reduce((s: number, o: any) => s + (receivedByPO[o.id] ?? 0), 0)
          const allItemsSelected = items.every((o: any) => selected.has(o.id))
          const toggleGroup = () => {
            const newSel = new Set(selected)
            if (allItemsSelected) items.forEach((o: any) => newSel.delete(o.id))
            else items.forEach((o: any) => newSel.add(o.id))
            setSelected(newSel)
          }
          const worstStatus = items.some((o: any) => o.material_status === 'Pending') ? 'Pending' : 'Received'
          return (
            <Card key={poKey} padding={false}>
              {/* Group header row */}
              <div className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 border-b border-gray-100"
                onClick={() => setExpandedPOs(prev => { const s = new Set(prev); s.has(poKey) ? s.delete(poKey) : s.add(poKey); return s })}>
                <input type="checkbox" checked={allItemsSelected} onChange={e => { e.stopPropagation(); toggleGroup() }} className="rounded" onClick={e => e.stopPropagation()} />
                <span className="font-mono text-sm font-bold text-brand-700 min-w-[100px]">{first.po_no || '(No PO)'}</span>
                <span className="text-xs text-gray-500">{first.po_date ? fmtDate(first.po_date) : '—'}</span>
                <span className="font-medium text-sm text-gray-800 flex-1 truncate">{first.vendor_name}</span>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{items.length} item{items.length !== 1 ? 's' : ''}</span>
                {groupOrdered > 0 && (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${groupReceived >= groupOrdered ? 'bg-green-100 text-green-700' : groupReceived > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-500'}`}>
                    {groupReceived}/{groupOrdered} {items[0]?.unit ?? ''}
                  </span>
                )}
                <span className="font-semibold text-sm text-gray-900">{inr(groupTotal)}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_CLS[worstStatus] ?? 'bg-gray-100 text-gray-500'}`}>{worstStatus}</span>
                <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                  {canEdit && <button onClick={() => openEdit(first)} className="p-1 text-blue-400 hover:text-blue-600" title="Edit PO"><Pencil size={13}/></button>}
                  {canEdit && <button onClick={() => { setEditing(null); setForm({...EMPTY_PO, fiscal_year: fy, po_no: first.po_no, vendor_name: first.vendor_name}); setOpen(true) }} className="p-1 text-green-500 hover:text-green-700" title="Add item to PO"><Plus size={13}/></button>}
                </div>
                {isExpanded ? <ChevronUp size={16} className="text-gray-400 shrink-0"/> : <ChevronDown size={16} className="text-gray-400 shrink-0"/>}
              </div>
              {/* Expanded line items */}
              {isExpanded && (
                <div className="overflow-x-auto">
                  <Table>
                    <thead><tr>
                      <Th></Th>
                      <Th>Item</Th><Th>Type</Th><Th right>Ordered</Th><Th right>Received</Th><Th>Unit</Th>
                      <Th right>Rate</Th><Th right>GST%</Th><Th right>Amount</Th>
                      <Th>GRN No</Th><Th>Status</Th><Th></Th>
                    </tr></thead>
                    <tbody>
                      {items.map((o: any) => (
                        <tr key={o.id} className={`text-sm ${selected.has(o.id) ? 'bg-brand-50' : 'hover:bg-gray-50'}`}>
                          <Td><input type="checkbox" checked={selected.has(o.id)} onChange={() => toggleOne(o.id)} className="rounded" /></Td>
                          <Td className="text-xs max-w-[160px] truncate">{o.item_name ?? '—'}</Td>
                          <Td><span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">{o.material_type ?? '—'}</span></Td>
                          <Td right className="text-xs">{o.quantity != null ? Number(o.quantity).toLocaleString('en-IN') : '—'}</Td>
                          <Td right className={`text-xs font-medium ${(receivedByPO[o.id] ?? 0) >= (o.quantity ?? 0) && o.quantity ? 'text-green-600' : (receivedByPO[o.id] ?? 0) > 0 ? 'text-yellow-600' : 'text-gray-400'}`}>{receivedByPO[o.id] ? Number(receivedByPO[o.id]).toLocaleString('en-IN') : '—'}</Td>
                          <Td className="text-xs text-gray-500">{o.unit ?? '—'}</Td>
                          <Td right className="text-xs">{o.rate ? inr(o.rate) : '—'}</Td>
                          <Td right className="text-xs">{o.gst_pct != null ? `${o.gst_pct}%` : '—'}</Td>
                          <Td right className="font-semibold">{o.total_amount ? inr(o.total_amount) : '—'}</Td>
                          <Td className="text-xs text-gray-500">{o.grn_no ?? '—'}</Td>
                          <Td><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_CLS[o.material_status] ?? 'bg-gray-100 text-gray-500'}`}>{o.material_status ?? '—'}</span></Td>
                          <Td>
                            <div className="flex gap-1">
                              {canEdit && <button onClick={() => openEdit(o)} className="p-1 text-blue-400 hover:text-blue-600" title="Edit"><Pencil size={13}/></button>}
                              {canEdit && o.material_status !== 'Received' && (
                                <button onClick={() => { setReceiptPO(o); setReceiptForm({ receipt_date: today(), qty_received: String(o.quantity||''), unit: o.unit||'', condition: 'Good', vehicle_no: '', received_by: '', invoice_no: '', farm_id: '', remarks: '' }); setReceiptOpen(true) }}
                                  className="p-1 text-green-500 hover:text-green-700" title="Record Stock Receipt"><PackageCheck size={13}/></button>
                              )}
                              {canDel && <button onClick={() => setDelId(o.id)} className="p-1 text-red-400 hover:text-red-600" title="Delete"><Trash2 size={13}/></button>}
                            </div>
                          </Td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </Card>
          )
        })}
      </div>
      )}

      <Modal open={open} onClose={() => { setOpen(false); setNewLines([emptyLine()]) }} title={editing ? 'Edit Purchase Order Line' : 'New Purchase Order'} size="lg"
        footer={<div className="flex gap-2 justify-end"><Button variant="secondary" onClick={() => { setOpen(false); setNewLines([emptyLine()]) }}>Cancel</Button><Button onClick={() => saveMut.mutate()} loading={saveMut.isPending}>Save</Button></div>}>
        <div className="space-y-3">
          {/* PO Header */}
          <div className="grid grid-cols-3 gap-3">
            <Input label="PO No *" value={form.po_no} onChange={f('po_no')} required />
            <DateInput label="PO Date" value={form.po_date} onChange={f('po_date')} />
            <Sel label="Fiscal Year" value={form.fiscal_year} onChange={f('fiscal_year')} options={FY_OPTIONS} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Sel label="Vendor (Supplier) *" value={form.party_id} onChange={(e: any) => setVendorParty(e.target.value)}
              options={[{ value: '', label: 'Select Supplier — add new ones in Purchase > Suppliers' }, ...partyOptions]} />
            <Input label="Credit Limit (days)" type="number" value={form.credit_limit_days} onChange={f('credit_limit_days')} placeholder="e.g. 30" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Sel label="Material Status" value={form.material_status} onChange={f('material_status')} options={MAT_STATUS.map(s=>({value:s,label:s}))} />
          </div>

          {editing ? (
            /* Single-line edit */
            <>
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
                <DateInput label="GRN Date" value={form.grn_date} onChange={f('grn_date')} />
              </div>
            </>
          ) : (
            /* Multi-line items for new PO */
            <div>
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Line Items</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="bg-gray-50">
                    <th className="text-left px-2 py-1 text-xs font-medium text-gray-600">Item</th>
                    <th className="text-left px-2 py-1 text-xs font-medium text-gray-600">Type</th>
                    <th className="px-2 py-1 text-xs font-medium text-gray-600">Qty</th>
                    <th className="px-2 py-1 text-xs font-medium text-gray-600">Unit</th>
                    <th className="px-2 py-1 text-xs font-medium text-gray-600">Rate</th>
                    <th className="px-2 py-1 text-xs font-medium text-gray-600">GST%</th>
                    <th className="px-2 py-1 text-xs font-medium text-gray-600">Total</th>
                    <th className="w-6"></th>
                  </tr></thead>
                  <tbody>
                    {newLines.map((l, i) => (
                      <tr key={i} className="border-b border-gray-100">
                        <td className="px-1 py-1"><input className="w-36 border border-gray-300 rounded px-2 py-1 text-xs" placeholder="Item name" value={l.item_name} onChange={e => setLine(i,'item_name',e.target.value)} /></td>
                        <td className="px-1 py-1">
                          <select className="border border-gray-300 rounded px-1 py-1 text-xs" value={l.material_type} onChange={e => setLine(i,'material_type',e.target.value)}>
                            <option value="">—</option>
                            {MAT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                        </td>
                        <td className="px-1 py-1"><input className="w-20 border border-gray-300 rounded px-2 py-1 text-xs text-right" type="number" placeholder="0" value={l.quantity} onChange={e => calcLineTotal(i,'quantity',e.target.value)} /></td>
                        <td className="px-1 py-1"><input className="w-16 border border-gray-300 rounded px-2 py-1 text-xs" placeholder="KG" value={l.unit} onChange={e => setLine(i,'unit',e.target.value)} /></td>
                        <td className="px-1 py-1"><input className="w-20 border border-gray-300 rounded px-2 py-1 text-xs text-right" type="number" placeholder="0" value={l.rate} onChange={e => calcLineTotal(i,'rate',e.target.value)} /></td>
                        <td className="px-1 py-1"><input className="w-16 border border-gray-300 rounded px-2 py-1 text-xs text-right" type="number" placeholder="0" value={l.gst_pct} onChange={e => calcLineTotal(i,'gst_pct',e.target.value)} /></td>
                        <td className="px-1 py-1"><input className="w-24 border border-gray-300 rounded px-2 py-1 text-xs text-right bg-gray-50" type="number" placeholder="0" value={l.total_amount} onChange={e => setLine(i,'total_amount',e.target.value)} /></td>
                        <td className="px-1 py-1">
                          {newLines.length > 1 && <button onClick={() => setNewLines(ls => ls.filter((_,idx)=>idx!==i))} className="text-red-400 hover:text-red-600 text-xs">✕</button>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button onClick={() => setNewLines(ls => [...ls, emptyLine()])}
                className="mt-2 text-xs text-brand-600 hover:underline font-medium">+ Add Line Item</button>
              {newLines.length > 0 && (
                <div className="mt-1 text-xs text-gray-500 text-right">
                  PO Total: <strong>{inr(newLines.reduce((s,l)=>s+(parseFloat(l.total_amount)||0),0))}</strong>
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>

      <Modal open={!!delId} onClose={() => setDelId(null)} title="Delete Purchase Order"
        footer={<div className="flex gap-2 justify-end"><Button variant="secondary" onClick={() => setDelId(null)}>Cancel</Button><Button variant="danger" onClick={() => delId && delMut.mutate(delId)} loading={delMut.isPending}>Delete</Button></div>}>
        <p className="text-sm text-gray-600">Delete this purchase order? This cannot be undone.</p>
      </Modal>

      {/* Bulk Delete Modal */}
      <Modal open={bulkDelOpen} onClose={() => setBulkDelOpen(false)} title={`Delete ${selected.size} Purchase Orders`}
        footer={<div className="flex gap-2 justify-end"><Button variant="secondary" onClick={() => setBulkDelOpen(false)}>Cancel</Button><Button variant="danger" onClick={() => bulkDelMut.mutate(Array.from(selected))} loading={bulkDelMut.isPending}>Delete All</Button></div>}>
        <p className="text-sm text-gray-600">This will permanently delete <strong>{selected.size}</strong> purchase order rows. This cannot be undone.</p>
      </Modal>

      {/* Bulk Status Modal */}
      <Modal open={bulkStatusOpen} onClose={() => setBulkStatusOpen(false)} title={`Update Status for ${selected.size} POs`}
        footer={<div className="flex gap-2 justify-end"><Button variant="secondary" onClick={() => setBulkStatusOpen(false)}>Cancel</Button><Button onClick={() => bulkStatusMut.mutate({ ids: Array.from(selected), status: bulkStatusVal })} loading={bulkStatusMut.isPending}>Apply</Button></div>}>
        <Sel label="New Material Status" value={bulkStatusVal} onChange={(e:any)=>setBulkStatusVal(e.target.value)} options={MAT_STATUS.map(s=>({value:s,label:s}))} />
      </Modal>

      {/* Vendor Merge Modal */}
      <VendorMergeModal open={mergeOpen} onClose={() => { setMergeOpen(false); qc.invalidateQueries({ queryKey: ['purchase_orders'] }) }} />

      {/* Stock Receipt Modal */}
      <Modal open={receiptOpen} onClose={() => setReceiptOpen(false)} title={`Record Stock Receipt — PO ${receiptPO?.po_no}`}
        footer={<div className="flex gap-2 justify-end"><Button variant="secondary" onClick={() => setReceiptOpen(false)}>Cancel</Button><Button onClick={() => receiptMut.mutate()} loading={receiptMut.isPending}>Save Receipt</Button></div>}>
        {receiptPO && (() => {
          // auto-compute pay_before when receipt date changes
          const onReceiptDateChange = (e: any) => {
            const d = e.target.value
            rf('receipt_date')(e)
            // update pay_before in pending_payment via receiptMut — just track locally for display
          }
          const creditDays = receiptPO.credit_limit_days ? Number(receiptPO.credit_limit_days) : 0
          const payBefore = (() => {
            if (!receiptForm.receipt_date || !creditDays) return null
            const d = new Date(receiptForm.receipt_date + 'T00:00:00')
            d.setDate(d.getDate() + creditDays)
            return d.toISOString().slice(0, 10)
          })()
          return (
            <div className="space-y-3">
              <div className="bg-blue-50 rounded-lg px-3 py-2 text-xs text-blue-700 space-y-0.5">
                <div><strong>{receiptPO.vendor_name}</strong> · {receiptPO.item_name} · Ordered: {receiptPO.quantity} {receiptPO.unit}</div>
                {receiptPO.grn_no && <div>GRN No: <strong>{receiptPO.grn_no}</strong> (auto-linked from PO)</div>}
                {receiptPO.po_no  && <div>PO No: <strong>{receiptPO.po_no}</strong></div>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <DateInput label="Receipt Date (today by default)" value={receiptForm.receipt_date} onChange={rf('receipt_date')} />
                <Input label="Qty Received" type="number" value={receiptForm.qty_received} onChange={rf('qty_received')} />
              </div>
              {payBefore && (
                <div className="bg-green-50 rounded px-3 py-2 text-xs text-green-700">
                  ✓ Pay Before Date will be set to <strong>{fmtDate(payBefore)}</strong> (GRN date + {creditDays} credit days)
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <Input label="Unit" value={receiptForm.unit} onChange={rf('unit')} />
                <Sel label="Condition" value={receiptForm.condition} onChange={rf('condition')} options={['Good','Partial','Damaged'].map(c=>({value:c,label:c}))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Supplier Invoice No" value={receiptForm.invoice_no} onChange={rf('invoice_no')} placeholder="Invoice no. on the bill" />
                <Input label="Vehicle No" value={receiptForm.vehicle_no} onChange={rf('vehicle_no')} />
              </div>
              <Sel label="Received At (Farm/Site)" value={receiptForm.farm_id} onChange={rf('farm_id')}
                options={[{value:'',label:'Select farm (or auto-pick first)'}, ...(farms as any[]).map((fm:any)=>({value:fm.id,label:`${fm.name} (${fm.code})`}))]} />
              <div className="grid grid-cols-2 gap-3">
                <Input label="Received By" value={receiptForm.received_by} onChange={rf('received_by')} />
                <Input label="Remarks" value={receiptForm.remarks} onChange={rf('remarks')} />
              </div>
              <p className="text-xs text-green-600">✓ PO status → Received · GRN auto-created in stock → Update GRN with invoice details in Bills/GRN tab</p>
            </div>
          )
        })()}
      </Modal>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════
// VENDOR MERGE MODAL
// ══════════════════════════════════════════════════════════════════
const VendorMergeModal: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const qc = useQueryClient()
  const [from, setFrom] = useState('')
  const [to, setTo]     = useState('')
  const [busy, setBusy] = useState(false)

  const { data: vendors=[] } = useQuery({
    queryKey: ['parties_vendors'],
    queryFn: async () => {
      const { data } = await supabase.from('parties').select('id,name').eq('type', 'supplier').order('name')
      return data ?? []
    },
    enabled: open,
  })

  const doMerge = async () => {
    if (!from || !to || from === to) { toast.error('Select two different vendors'); return }
    setBusy(true)
    try {
      // update purchase_orders vendor_name to target
      const target = vendors.find((v: any) => v.id === to)
      if (!target) throw new Error('Target not found')
      await supabase.from('purchase_orders').update({ vendor_name: target.name }).eq('vendor_name', vendors.find((v:any)=>v.id===from)?.name)
      // delete source party
      await supabase.from('parties').delete().eq('id', from)
      qc.invalidateQueries({ queryKey: ['parties_vendors'] })
      toast.success(`Merged into ${target.name}`)
      setFrom(''); setTo('')
    } catch (e: any) { toast.error(e.message) }
    finally { setBusy(false) }
  }

  return (
    <Modal open={open} onClose={onClose} title="Merge Duplicate Vendors"
      footer={<div className="flex gap-2 justify-end"><Button variant="secondary" onClick={onClose}>Close</Button><Button onClick={doMerge} loading={busy}>Merge</Button></div>}>
      <div className="space-y-4">
        <p className="text-xs text-gray-500">Select the duplicate vendor (From) and the canonical vendor (To). All PO records from the duplicate will be re-assigned to the canonical vendor and the duplicate will be deleted.</p>
        <Sel label="Merge FROM (duplicate — will be deleted)" value={from} onChange={(e:any)=>setFrom(e.target.value)}
          options={[{value:'',label:'Select vendor...'}, ...vendors.map((v:any)=>({value:v.id,label:v.name}))]} />
        <Sel label="Merge TO (keep this vendor)" value={to} onChange={(e:any)=>setTo(e.target.value)}
          options={[{value:'',label:'Select vendor...'}, ...vendors.filter((v:any)=>v.id!==from).map((v:any)=>({value:v.id,label:v.name}))]} />
        {from && to && from !== to && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-700">
            ⚠ All purchase orders from <strong>{vendors.find((v:any)=>v.id===from)?.name}</strong> will be moved to <strong>{vendors.find((v:any)=>v.id===to)?.name}</strong>, then the duplicate vendor will be removed.
          </div>
        )}
      </div>
    </Modal>
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
  const [search, setSearch] = useState('')
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

  const unpaid = payments.filter((p: any) => {
    if (p.payment_status === 'Paid') return false
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      if (!`${p.vendor_name ?? ''} ${p.invoice_no ?? ''} ${p.grn_no ?? ''}`.toLowerCase().includes(q)) return false
    }
    return true
  })

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
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h3 className="font-semibold text-gray-800">Payment Aging Report</h3>
          <p className="text-xs text-gray-500">Total outstanding: {inr(totalUnpaid)} across {unpaid.length} invoices</p>
        </div>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search vendor / invoice / GRN…"
          className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 w-64" />
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
  const [viewMode, setViewMode] = useState<'trend'|'vendor'|'table'|'grn'|'grn_trend'>('trend')
  const [grnItem, setGrnItem] = useState('')
  const [tableSearch, setTableSearch] = useState('')

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

  // GRN actual received rates vs PO ordered rates
  const { data: grnRates=[] } = useQuery({
    queryKey: ['v_po_grn_rate'],
    queryFn: async () => {
      const { data } = await supabase.from('v_po_grn_rate').select('*').order('grn_date', { ascending: false }).limit(500)
      return data ?? []
    }
  })
  // Default OFF — most GRNs here aren't linked to a PO, so "only mismatches"
  // (which requires a PO match) was hiding almost everything by default.
  const [onlyMismatch, setOnlyMismatch] = useState(false)
  const [grnSearch, setGrnSearch] = useState('')
  const grnFiltered = useMemo(() => (grnRates as any[]).filter((r: any) => {
    const itemName = r.grn_item_name ?? r.item_name ?? ''
    if (grnSearch && !(`${itemName} ${r.vendor_name ?? ''}`.toLowerCase().includes(grnSearch.toLowerCase()))) return false
    if (onlyMismatch && (r.po_rate == null || Math.abs(Number(r.rate_diff ?? 0)) < 0.005)) return false
    return true
  }), [grnRates, grnSearch, onlyMismatch])

  // ── GRN Rate Trend — pure GRN received-rate history, independent of any PO.
  // Landed rate = price_per_unit + other_charges/qty (transport etc.), matching
  // the same formula the Feed Mill ingredient rate uses (useFeedRates.ts).
  const { data: grnAll=[] } = useQuery({
    queryKey: ['grn_rate_trend'],
    queryFn: async () => {
      const { data } = await supabase.from('grn')
        .select('item_name,category,price_per_unit,other_charges,qty,grn_date,party_id,parties(name)')
        .not('price_per_unit', 'is', null)
        .order('grn_date', { ascending: true })
      return (data ?? []).map((g: any) => {
        const qty = Number(g.qty) || 0
        const landed = Number(g.price_per_unit) + (qty > 0 ? (Number(g.other_charges) || 0) / qty : 0)
        return {
          item_name: g.item_name, category: g.category, grn_date: g.grn_date,
          vendor_name: g.parties?.name ?? 'Unknown', rate: +landed.toFixed(2),
        }
      })
    }
  })
  const grnItems = useMemo(() => [...new Set(grnAll.map((g: any) => g.item_name).filter(Boolean))].sort(), [grnAll])
  // Month-wise average landed rate per vendor, for the selected item
  const grnTrendData = useMemo(() => {
    if (!grnItem) return []
    const filtered = grnAll.filter((g: any) => g.item_name === grnItem)
    const byMonth: Record<string, Record<string, {sum:number,cnt:number}>> = {}
    for (const g of filtered) {
      const month = g.grn_date ? String(g.grn_date).slice(0,7) : 'Unknown'
      const v = g.vendor_name
      if (!byMonth[month]) byMonth[month] = {}
      if (!byMonth[month][v]) byMonth[month][v] = { sum:0, cnt:0 }
      byMonth[month][v].sum += g.rate
      byMonth[month][v].cnt++
    }
    const allVendors = [...new Set(filtered.map((g: any) => g.vendor_name))]
    return Object.entries(byMonth).sort(([a],[b])=>a.localeCompare(b)).map(([month, vmap]) => {
      const row: any = { month }
      for (const v of allVendors) if (vmap[v]) row[v] = +(vmap[v].sum / vmap[v].cnt).toFixed(2)
      return row
    })
  }, [grnAll, grnItem])
  const grnTrendVendors = useMemo(() => {
    if (!grnItem) return []
    return [...new Set(grnAll.filter((g: any) => g.item_name === grnItem).map((g: any) => g.vendor_name))]
  }, [grnAll, grnItem])
  const grnVendorComp = useMemo(() => {
    if (!grnItem) return []
    const byVendor: Record<string, number[]> = {}
    for (const g of grnAll.filter((x: any) => x.item_name === grnItem)) {
      if (!byVendor[g.vendor_name]) byVendor[g.vendor_name] = []
      byVendor[g.vendor_name].push(g.rate)
    }
    return Object.entries(byVendor).map(([vendor, rates]) => ({
      vendor, avg: +(rates.reduce((s,r)=>s+r,0)/rates.length).toFixed(2),
      min: +Math.min(...rates).toFixed(2), max: +Math.max(...rates).toFixed(2), receipts: rates.length,
    })).sort((a,b)=>a.avg-b.avg)
  }, [grnAll, grnItem])

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
      const basic = rate && qty ? rate * qty : null
      const total = basic != null ? +(basic + basic * (gst ?? 0) / 100).toFixed(2) : null
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
    const headers = ['po_no','po_date','fiscal_year','vendor_name','item_name','material_type','quantity','unit','rate','gst_pct','grn_no','grn_date','material_status']
    const sample  = ['PO-2022-001','01-04-2022','2022-23','ABC Company','Maize','Feed Raw Material','100','Tons','18500','5','GRN001','05-04-2022','Received']
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
              {(['trend','vendor','table','grn','grn_trend'] as const).map(m=>(
                <button key={m} onClick={()=>setViewMode(m)}
                  className={`px-4 py-1.5 text-sm font-medium transition-colors whitespace-nowrap
                    ${viewMode===m?'bg-brand-600 text-white':'bg-white text-gray-600 hover:bg-gray-50'}`}>
                  {m==='trend'?'PO Yearly Trend':m==='vendor'?'PO Vendor Compare':m==='table'?'PO Rate Table':m==='grn'?'PO vs GRN':'GRN Rate Trend'}
                </button>
              ))}
            </div>
            {viewMode !== 'table' && viewMode !== 'grn' && viewMode !== 'grn_trend' && (
              <div className="flex-1 min-w-48">
                <SearchableSelect label="Select Item / Product" placeholder="— All Items — (type to search)"
                  options={items.map(i=>({value:i,label:i}))}
                  value={selectedItem} onChange={v=>setSelectedItem(v)} />
              </div>
            )}
            {viewMode === 'grn_trend' && (
              <div className="flex-1 min-w-48">
                <SearchableSelect label="Select Item (from actual GRN receipts)" placeholder="— Select an item — (type to search)"
                  options={grnItems.map((i: string)=>({value:i,label:i}))}
                  value={grnItem} onChange={v=>setGrnItem(v)} />
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

          {/* PO VS GRN RATE VIEW */}
          {viewMode === 'grn' && (
            <Card padding={false}>
              <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3 flex-wrap">
                <p className="font-semibold text-gray-800 flex-1">PO Rate vs GRN Received Rate</p>
                <input value={grnSearch} onChange={e => setGrnSearch(e.target.value)} placeholder="Search item / vendor…"
                  className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 w-52" />
                <label className="flex items-center gap-2 text-sm text-gray-600">
                  <input type="checkbox" checked={onlyMismatch} onChange={e => setOnlyMismatch(e.target.checked)} />
                  Only mismatches
                </label>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <thead><tr>
                    <Th>GRN No</Th><Th>PO No</Th><Th>Date</Th><Th>GRN Item</Th><Th>PO Item</Th><Th>Vendor</Th>
                    <Th right>PO Rate</Th><Th right>GRN Rate</Th><Th right>Diff</Th>
                  </tr></thead>
                  <tbody>
                    {grnFiltered.length === 0
                      ? <tr><td colSpan={9} className="text-center py-8 text-gray-400 text-sm">No rate differences found</td></tr>
                      : grnFiltered.map((r: any, i: number) => {
                        const diff = Number(r.rate_diff ?? 0)
                        const itemMismatch = r.po_item_name && r.po_item_name.toLowerCase().trim() !== (r.grn_item_name ?? r.item_name ?? '').toLowerCase().trim()
                        return (
                          <tr key={i} className="text-sm hover:bg-gray-50 border-t border-gray-100">
                            <Td className="text-xs font-mono">{r.grn_no}</Td>
                            <Td className="text-xs font-mono text-brand-700">{r.po_no ?? <span className="text-red-400">no PO</span>}</Td>
                            <Td className="text-xs">{r.grn_date ? fmtDate(r.grn_date) : '—'}</Td>
                            <Td className="font-medium text-xs">{r.grn_item_name ?? r.item_name}</Td>
                            <Td className={`text-xs ${itemMismatch ? 'text-orange-600 font-semibold' : 'text-gray-400'}`}>
                              {r.po_item_name ?? '—'}
                              {itemMismatch && <span className="ml-1 text-orange-400" title="Item name differs">⚠</span>}
                            </Td>
                            <Td className="text-xs text-gray-500">{r.vendor_name ?? '—'}</Td>
                            <Td right>{r.po_rate != null ? `₹${Number(r.po_rate).toLocaleString('en-IN')}` : <span className="text-red-400 text-xs">no PO</span>}</Td>
                            <Td right>{r.grn_rate != null ? `₹${Number(r.grn_rate).toLocaleString('en-IN')}` : '—'}</Td>
                            <Td right>
                              {r.po_rate == null ? '—' : (
                                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${Math.abs(diff) < 0.005 ? 'bg-green-100 text-green-700' : diff > 0 ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                                  {diff > 0 ? '+' : ''}{diff.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </span>
                              )}
                            </Td>
                          </tr>
                        )
                      })
                    }
                  </tbody>
                </Table>
              </div>
            </Card>
          )}

          {/* GRN RATE TREND VIEW — pure GRN landed-rate history, no PO needed */}
          {viewMode === 'grn_trend' && (
            <div className="space-y-4">
              {!grnItem ? (
                <Card><p className="text-sm text-gray-500 text-center py-8">Select an item above to see its actual received-rate trend from GRN entries</p></Card>
              ) : grnTrendData.length === 0 ? (
                <Card><p className="text-sm text-gray-400 text-center py-8">No GRN receipts found for {grnItem}</p></Card>
              ) : (
                <>
                  <Card>
                    <p className="font-semibold text-gray-800 mb-1">GRN Received Rate Trend — {grnItem}</p>
                    <p className="text-xs text-gray-400 mb-4">Month-wise average landed rate (price + transport/other charges per unit) actually paid on receipt, by vendor.</p>
                    <ResponsiveContainer width="100%" height={300}>
                      <ReLineChart data={grnTrendData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                        <XAxis dataKey="month" tick={{fontSize:12}}/>
                        <YAxis tick={{fontSize:12}} tickFormatter={v=>`₹${v}`}/>
                        <Tooltip formatter={(v:number)=>`₹${v.toLocaleString('en-IN')}`}/>
                        <Legend/>
                        {grnTrendVendors.map((v: string,i: number)=>(
                          <Line key={v} type="monotone" dataKey={v} stroke={COLORS[i%COLORS.length]}
                            strokeWidth={2} dot={{r:4}} name={v}/>
                        ))}
                      </ReLineChart>
                    </ResponsiveContainer>
                  </Card>
                  <Card padding={false}>
                    <div className="px-4 py-3 border-b border-gray-100"><p className="font-semibold text-gray-800">Vendor Comparison — {grnItem}</p></div>
                    <Table>
                      <thead><tr><Th>Vendor</Th><Th right>Avg Rate</Th><Th right>Min</Th><Th right>Max</Th><Th right>Receipts</Th></tr></thead>
                      <tbody>
                        {grnVendorComp.map((v: any) => (
                          <tr key={v.vendor} className="hover:bg-gray-50">
                            <Td className="font-medium">{v.vendor}</Td>
                            <Td right className="font-semibold">₹{v.avg.toLocaleString('en-IN')}</Td>
                            <Td right className="text-green-700">₹{v.min.toLocaleString('en-IN')}</Td>
                            <Td right className="text-red-600">₹{v.max.toLocaleString('en-IN')}</Td>
                            <Td right>{v.receipts}</Td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </Card>
                </>
              )}
            </div>
          )}

          {/* RATE TABLE VIEW */}
          {viewMode === 'table' && (() => {
            const rateTableFiltered = tableSearch.trim()
              ? rateTable.filter(r => r.item.toLowerCase().includes(tableSearch.trim().toLowerCase()))
              : rateTable
            return (
            <Card padding={false}>
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between gap-3 flex-wrap">
                <p className="font-semibold text-gray-800">All Items — Avg Rate by FY</p>
                <input value={tableSearch} onChange={e=>setTableSearch(e.target.value)} placeholder="Search item…"
                  className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 w-48" />
                <Button variant="outline" size="sm" icon={<Download size={14}/>} onClick={()=>{
                  exportFlatCSV('rate_analysis.csv',
                    ['Item',...fiscalYears.flatMap(fy=>[`${fy} Avg Rate`,`${fy} Cheapest Vendor`,`${fy} Cheapest Rate`])],
                    rateTableFiltered.map(r=>[r.item,...fiscalYears.flatMap(fy=>{
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
                    {rateTableFiltered.map(row=>(
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
                    {rateTableFiltered.length===0&&<tr><Td colSpan={fiscalYears.length*2+1} className="text-center text-gray-400 py-6">{tableSearch?'No items match your search.':'No rate data yet. Import your Excel file above.'}</Td></tr>}
                  </tbody>
                </Table>
              </div>
            </Card>
            )
          })()}
        </>
      )}
    </div>
  )
}

// ── PO IMPORT MODAL (Excel NBF format + PDF PO) ───────────────────

function fmtISODate(v: any): string | null {
  if (!v) return null
  if (v instanceof Date) {
    const y = v.getFullYear(), m = String(v.getMonth()+1).padStart(2,'0'), d = String(v.getDate()).padStart(2,'0')
    return `${y}-${m}-${d}`
  }
  const s = String(v).trim()
  // dd-Mon-yy or dd-Mon-yyyy  e.g. 10-Jun-26
  const mnames: Record<string,string> = {jan:'01',feb:'02',mar:'03',apr:'04',may:'05',jun:'06',jul:'07',aug:'08',sep:'09',oct:'10',nov:'11',dec:'12'}
  const m1 = s.match(/^(\d{1,2})[\/\-]([A-Za-z]{3})[\/\-](\d{2,4})$/)
  if (m1) {
    const mo = mnames[m1[2].toLowerCase()] ?? '01'
    const yr = m1[3].length===2 ? `20${m1[3]}` : m1[3]
    return `${yr}-${mo}-${m1[1].padStart(2,'0')}`
  }
  // dd/mm/yyyy or dd-mm-yyyy
  const m2 = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/)
  if (m2) {
    const yr = m2[3].length===2?`20${m2[3]}`:m2[3]
    return `${yr}-${m2[2].padStart(2,'0')}-${m2[1].padStart(2,'0')}`
  }
  // yyyy-mm-dd already
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
  return null
}

function fyFromDate(dateStr: string | null): string {
  if (!dateStr) return 'Unknown'
  const d = new Date(dateStr); if (isNaN(d.getTime())) return 'Unknown'
  const m = d.getMonth()+1, y = d.getFullYear()
  return m>=4 ? `${y}-${String(y+1).slice(2)}` : `${y-1}-${String(y).slice(2)}`
}

function normPct(v: any): number {
  if (v === null || v === undefined || v === '') return 0
  const n = parseFloat(String(v))
  if (isNaN(n)) return 0
  return n <= 1 ? +(n*100).toFixed(2) : n
}

// Parse Excel NBF Order file — all "Order Details" sheets
function parseNBFExcel(wb: any): any[] {
  const records: any[] = []
  for (const sname of wb.SheetNames as string[]) {
    if (!sname.toLowerCase().includes('order details')) continue
    const ws = wb.Sheets[sname]
    const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header:1, defval:null, raw:true })

    // Detect FY from sheet name e.g. "Aug22-Mar23" → "2022-23"
    const fyMatch = sname.match(/(\d{2,4})[-–].*?(\d{2,4})/)
    let sheetFY = 'Unknown'
    if (fyMatch) {
      const y1 = fyMatch[1].length===2?`20${fyMatch[1]}`:fyMatch[1]
      const y2 = fyMatch[2].length===2?`20${fyMatch[2]}`:fyMatch[2]
      sheetFY = `${y1}-${y2.slice(2)}`
    }

    // Find the actual column header row — look for the row that has "ITEM" (as in "NAME OF ITEM"
    // or "ITEM DESCRIPTION") together with "PRICE" and a PO/SUPPLIER column.
    // The title rows contain "INDENT" inside longer phrases like "ORDER DETAILS AS PER INDENT OF..."
    // and do NOT contain "ITEM" as a substring, so they are safely skipped.
    let headerRow = -1
    for (let i=0;i<25;i++) {
      const r = rows[i] ?? []
      const vals = r.map((v:any) => String(v??'').toUpperCase())
      const hasItem     = vals.some(v => v.includes('ITEM'))
      const hasPrice    = vals.some(v => v.includes('PRICE') || v.includes('RATE'))
      const hasSupplier = vals.some(v => v.includes('SUPPLIER') || v.includes('VENDOR') || v.includes('PO'))
      if (hasItem && hasPrice && hasSupplier) { headerRow = i; break }
    }
    if (headerRow<0) continue

    // Detect layout by checking column header positions
    const hdr = rows[headerRow] ?? []
    const isNewLayout = hdr.some((v:any)=>v&&String(v).toUpperCase().includes('PACK SIZE') &&
      (hdr.indexOf(v) < (hdr.findIndex((x:any)=>x&&String(x).toUpperCase().includes('UOM')))))

    // Col indices
    // Old: [1]=indent_date, [3]=item, [6]=uom, [7]=pack, [8]=qty, [10]=price, [11]=gst%, [12]=gst_chg, [13]=net, [15]=po_date, [17]=po_no, [19]=supplier
    // New: [1]=indent_date, [3]=item, [6]=pack, [7]=qty, [8]=uom, [10]=price, [11]=gst%, [12]=gst_chg, [13]=net, [15]=po_date, [17]=po_no, [19]=supplier
    const C = isNewLayout
      ? { date:1, item:3, pack:6, qty:7, uom:8, price:10, gstP:11, gstC:12, net:13, poDate:15, poNo:17, vendor:19 }
      : { date:1, item:3, uom:6, pack:7, qty:8, price:10, gstP:11, gstC:12, net:13, poDate:15, poNo:17, vendor:19 }

    for (let i=headerRow+2; i<rows.length; i++) {
      const r = rows[i]
      if (!r || !r.some(v=>v!==null)) continue
      const item = r[C.item] ? String(r[C.item]).trim() : null
      const poNo = r[C.poNo] ? String(r[C.poNo]).trim() : null
      const vendor = r[C.vendor] ? String(r[C.vendor]).trim() : null
      if (!item || !poNo || !vendor) continue
      if (poNo.endsWith('/') || poNo === 'PO / NBF /') continue // empty PO
      if (String(item).toLowerCase().includes('not required') || String(item).toLowerCase().includes('not issued')) continue

      const poDateStr = fmtISODate(r[C.poDate])
      const fy = poDateStr ? fyFromDate(poDateStr) : sheetFY

      const price = parseFloat(r[C.price]) || null
      const gstP  = normPct(r[C.gstP])
      const gstC  = parseFloat(r[C.gstC]) || 0
      const net   = parseFloat(r[C.net]) || null
      const qty   = parseFloat(r[C.qty]) || null

      records.push({
        po_no:          poNo.replace(/\s+/g,' ').trim(),
        po_date:        poDateStr,
        fiscal_year:    fy,
        vendor_name:    vendor,
        item_name:      item,
        unit:           r[C.uom] ? String(r[C.uom]).trim() : null,
        quantity:       qty,
        rate:           price,
        gst_pct:        gstP,
        total_amount:   net,
        material_status:'Pending',
      })
    }
  }
  return records
}

// Parse Account Details sheets → payment records
function parseNBFAccountDetails(wb: any): any[] {
  const records: any[] = []
  for (const sname of wb.SheetNames as string[]) {
    if (!sname.toLowerCase().includes('account details')) continue
    const ws = wb.Sheets[sname]
    const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header:1, defval:null, raw:true })

    let headerRow = -1
    for (let i=0;i<20;i++) {
      const r=rows[i]??[]
      if (r.some((v:any)=>v&&String(v).toUpperCase().includes('SUPPLIER'))) { headerRow=i; break }
    }
    if (headerRow<0) continue

    const hdr = rows[headerRow]??[]
    // Detect new layout (Apr25+): no 'NAME OF ITEM' col in old position
    // Old: [1]=po_date, [3]=supplier, [5]=item, [7]=uom, [8]=qty, [10]=po_no, [13]=payable, [15]=grn_date, [16]=grn_no, [17]=cr_limit, [20]=payment_amount, [19]=payment_date
    // New: [1]=po_date, [3]=supplier, [5]=item, [7]=qty, [8]=uom, [10]=po_no, [13]=payable, [15]=grn_date, [16]=grn_no, [17]=cr_limit, [20 or 21]=payment_amount, [19 or 20]=payment_date
    const isNew = hdr.findIndex((v:any)=>v&&String(v).toUpperCase().includes('GRN DATE')) >= 15

    for (let i=headerRow+2; i<rows.length; i++) {
      const r = rows[i]
      if (!r||!r.some(v=>v!==null)) continue
      const poNo  = r[10] ? String(r[10]).trim() : null
      const item  = r[5]  ? String(r[5]).trim()  : null
      const vendor= r[3]  ? String(r[3]).trim()  : null
      if (!poNo||!item||!vendor) continue
      if (poNo.endsWith('/')||poNo==='PO / NBF /') continue

      const payable = parseFloat(r[13]) || null
      const crLimit = r[17] !== null ? parseInt(String(r[17])||'0') : null
      const grnDate = fmtISODate(r[15])
      const grnNo   = r[16] ? String(r[16]).trim() : null
      const payDate = fmtISODate(r[isNew?20:19])
      const payAmt  = parseFloat(r[isNew?21:20]||'0') || null

      if (payable) records.push({
        po_no:      poNo.replace(/\s+/g,' ').trim(),
        vendor_name:vendor,
        item_name:  item,
        amount:     payable,
        credit_limit_days: crLimit,
        grn_date:   grnDate,
        grn_no:     grnNo,
        paid_date:  payDate,
        paid_amount:payAmt,
        status:     payDate ? 'Paid' : 'Pending',
      })
    }
  }
  return records
}

// Parse PDF PO text → PO records
async function parsePOPdf(file: File): Promise<{ records: any[]; isAmendment: boolean; poNo: string; summary: string }> {
  const buf = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise
  let fullText = ''
  let sellerText = ''  // right column only (vendor side)

  for (let p=1; p<=pdf.numPages; p++) {
    const page = await pdf.getPage(p)
    const vp = page.getViewport({ scale: 1 })
    const midX = vp.width / 2
    const tc = await page.getTextContent()
    // Full text for item/PO parsing
    fullText += tc.items.map((it:any) => it.str).join(' ') + '\n'
    // Right-column text for seller details (x > midpoint of page)
    sellerText += tc.items
      .filter((it:any) => it.transform && it.transform[4] > midX)
      .map((it:any) => it.str)
      .join(' ') + '\n'
  }

  console.log('=== PDF RAW TEXT ===\n' + fullText)
  console.log('=== SELLER COLUMN TEXT ===\n' + sellerText)

  const isAmendment = /AMENDMENT/i.test(fullText)

  // PO number: PO / NBF / DDMMYY / NNN
  const poMatch = fullText.match(/PO\s*\/\s*NBF\s*\/\s*[\d]+\s*\/\s*\d+/i)
  const poNo = poMatch ? poMatch[0].replace(/\s+/g,' ').trim() : ''

  // Order date — appears as "12-Jun-26" near "Order Date" label or as standalone date
  const dateMatch = fullText.match(/Order\s+Date[^\d]*(\d{1,2}[-\/][A-Za-z]{3}[-\/]\d{2,4})/i)
    ?? fullText.match(/(\d{1,2}[-\/][A-Za-z]{3}[-\/]\d{2,4})/)
  const poDate = fmtISODate(dateMatch?.[1] ?? null)

  // Vendor GSTIN: first GSTIN found in the seller (right) column
  const vendorGSTINMatch = sellerText.match(/\b(\d{2}[A-Z]{5}\d{4}[A-Z][A-Z\d]Z[A-Z\d])\b/)
  const vendorGSTIN = vendorGSTINMatch?.[1] ?? null

  // Vendor name extraction — seller column (right half) only to avoid mixing buyer text.
  // Strategy 1: "Seller :" label in right-column text — take words until first digit (address starts with digits)
  // Strategy 2: GSTIN anchor — text before GSTIN in right column
  // Strategy 3: company-suffix pattern in right column or full text
  function takeNameWords(text: string): string {
    const words = text.trim().split(/\s+/)
    const name: string[] = []
    for (const w of words) {
      if (/\d/.test(w)) break  // stop at first word containing a digit (house number etc.)
      if (/^(Seller|Vendor|Buyer|Consignee|Supplier):?$/i.test(w)) continue  // skip labels
      if (w === ':') continue
      name.push(w)
    }
    return name.join(' ').trim()
  }

  let vendor = 'Unknown'
  const sellerLabelM = sellerText.match(/\bSeller\s*:\s*(.+)/i)
  if (sellerLabelM) {
    const name = takeNameWords(sellerLabelM[1])
    if (name) vendor = name
  }
  if (vendor === 'Unknown' && vendorGSTIN) {
    const beforeGSTIN = sellerText.slice(0, sellerText.indexOf(vendorGSTIN)).replace(/\bSeller\s*:\s*/i, '')
    const name = takeNameWords(beforeGSTIN)
    if (name) vendor = name
  }
  if (vendor === 'Unknown') {
    const CO_SUFFIX = '(?:PVT\\.?\\s*LTD\\.?|LIMITED|SOLUTIONS|ENTERPRISES|TRADERS|INDUSTRIES|CHEMICALS|AGRO|BIO|PHARMA|SUPPLIERS|DISTRIBUTORS|CORPORATION|COMPANY|FOODS|FEEDS|AGENCIES|EXPORTS|IMPORTS|INTERNATIONAL|SERVICES|TECHNOLOGIES|LABS|LABORATORIES)'
    const coRx = new RegExp(`([A-Z][A-Z0-9\\s&\\.\\-]{2,60}${CO_SUFFIX})`, 'i')
    const m = sellerText.match(coRx) ?? fullText.match(coRx)
    if (m) vendor = m[1].replace(/\s+/g,' ').trim()
  }

  // Vendor address: seller column text between company name and GSTIN
  let vendorAddress: string | null = null
  if (vendor !== 'Unknown') {
    const idx = sellerText.indexOf(vendor)
    if (idx !== -1) {
      const afterVendor = sellerText.slice(idx + vendor.length)
      const addrMatch = afterVendor.match(/^\s*([\s\S]{5,300}?)(?:\bGSTIN\b|\d{2}[A-Z]{5}\d{4})/i)
      if (addrMatch) {
        vendorAddress = addrMatch[1]
          .replace(/\n+/g, ' ')
          .replace(/\s{2,}/g, ' ')
          .replace(/Telangana,?\s*State\s+Code[^,]*,?\s*INDIA\.?/gi, '')
          .replace(/\bSeller\s*:/gi, '')
          .trim() || null
      }
    }
  }

  // Credit limit days
  const clMatch = fullText.match(/Credit\s+Limit[^\d]*(\d+)\s*Days/i)
  const creditDays = clMatch ? parseInt(clMatch[1]) : null

  // Delivery date — "Delivery Within  15-Jun-26"
  const dlvMatch = fullText.match(/Delivery\s+(?:Within|By)[^\d]*(\d{1,2}[-\/][A-Za-z]{3}[-\/]\d{2,4}|\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i)
  const deliveryDate = fmtISODate(dlvMatch?.[1] ?? null)

  const fy = fyFromDate(poDate)
  const records: any[] = []

  // ── Strategy ──────────────────────────────────────────────────────────────
  // In this PDF layout pdfjs reads the numeric columns (left) separately from
  // the description column (right).  Item names therefore appear in a block
  // near "Description of Materials" while the numbers appear in one long run.
  //
  // Numeric item row format (all tokens on one line after joining with spaces):
  //   <serial>  <qty_packs>  <pack_size>  <order_qty>  <UOM>  <rate>  <amount>  <gst%>  <gst_charge|-|0>  <net_amount>
  // Example: "1   12   25   300   Kg   9750.00   117,000.0   0%   -   117,000"

  const UOM_RX = '(?:Kg|KG|Ltr|LTR|Dose|No|Nos|Pcs|Bag|Bags|MT|Quintal|Quintle|Litre|Litres|Gm|GM)'
  const numericRx = new RegExp(
    `\\b([1-9]\\d?)\\s+([\\d,]+)\\s+(\\d+)\\s+([\\d,]+)\\s+(${UOM_RX})\\s+([\\d,.]+)\\s+([\\d,.]+)\\s+([\\d.]+%|0%)\\s+(?:-|[\\d,.]+)\\s+([\\d,]+)`,
    'gi'
  )

  type NumItem = { serial: number; qtyPacks: number; packSize: number; qty: number; unit: string; rate: number; gst: number; total: number }
  const numericItems: NumItem[] = []
  let nm: RegExpExecArray | null
  while ((nm = numericRx.exec(fullText)) !== null) {
    const qtyPacks = parseInt(nm[2].replace(/,/g,''))    // number of bags/packs
    const packSize = parseFloat(nm[3])                    // kg/ltr per pack
    const ratePerPack = parseFloat(nm[6].replace(/,/g,''))
    // rate in PDF is per pack (bag); convert to per base UOM (Kg/Ltr)
    const ratePerUnit = packSize > 1 ? ratePerPack / packSize : ratePerPack
    numericItems.push({
      serial:   parseInt(nm[1]),
      qtyPacks,
      packSize,
      qty:      parseFloat(nm[4].replace(/,/g,'')),  // ORDER column = total Kg/Ltr
      unit:     nm[5],
      rate:     Math.round(ratePerUnit * 100) / 100,  // per Kg/Ltr
      gst:      parseFloat(nm[8].replace('%','')),
      total:    parseFloat(nm[9].replace(/,/g,'')),
    })
  }

  // Extract item names from description column block.
  // In the raw text they appear between "Authorized Signatory" and "Description of Materials"
  // (because pdfjs reads the right column after the left for that region).
  let itemNames: string[] = []
  const descBlock = fullText.match(/Authorized\s+Signatory\s+(.*?)\s+Description\s+of\s+Materials/is)?.[1] ?? ''
  if (descBlock) {
    itemNames = descBlock
      .split(/\s{2,}|\n+/)
      .map(s => s.trim())
      .filter(s => s.length > 2 && /^[A-Z(]/.test(s) && !/^previously/i.test(s))
  }

  // Pair numeric data with names
  numericItems.forEach((item, i) => {
    records.push({
      po_no:             poNo,
      po_date:           poDate,
      fiscal_year:       fy,
      vendor_name:       vendor,
      item_name:         itemNames[i] ?? `Item ${item.serial}`,
      quantity:          item.qty,       // total Kg / Ltr
      unit:              item.unit,
      qty_packs:         item.qtyPacks,  // number of bags/packs
      pack_size:         item.packSize,  // Kg per bag
      rate:              item.rate,      // rate per Kg / Ltr
      gst_pct:           item.gst,
      total_amount:      item.total,
      material_status:   'Pending',
      credit_limit_days: creditDays,
      delivery_date:     deliveryDate,
      is_amendment:      isAmendment,
      vendor_gstin:      vendorGSTIN,
      vendor_address:    vendorAddress,
    })
  })

  const summary = `PO: ${poNo} | Vendor: ${vendor} | Date: ${poDate} | Credit: ${creditDays} days | ${records.length} items${isAmendment?' | ⚠️ AMENDMENT':''}`
  return { records, isAmendment, poNo, summary }
}

export const POImportModal: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const qc = useQueryClient()
  const xlsxRef = useRef<HTMLInputElement>(null)
  const pdfRef  = useRef<HTMLInputElement>(null)
  const [step, setStep]       = useState<'idle'|'preview'>('idle')
  const [saving, setSaving]   = useState(false)
  const [preview, setPreview] = useState<{type:'excel'|'pdf'; rows: any[]; payRows?: any[]; summary: string; isAmendment?: boolean; poNo?: string} | null>(null)
  const [editableRows, setEditableRows] = useState<any[]>([])
  const [parsing, setParsing] = useState(false)

  const reset = () => { setStep('idle'); setPreview(null); setEditableRows([]); setParsing(false) }

  const handleExcel = async (file: File) => {
    setParsing(true)
    try {
      const buf = await file.arrayBuffer()
      const wb = XLSX.read(buf, { type:'array', cellDates:true })
      const rows = parseNBFExcel(wb)
      const payRows = parseNBFAccountDetails(wb)
      setPreview({ type:'excel', rows, payRows,
        summary: `${rows.length} PO line items from ${wb.SheetNames.filter((s:string)=>s.toLowerCase().includes('order details')).length} sheets · ${payRows.length} payment records` })
      setEditableRows(rows.map(r => ({...r})))
      setStep('preview')
    } catch(e:any) { toast.error('Excel parse error: ' + e.message) }
    setParsing(false)
  }

  const handlePDF = async (file: File) => {
    setParsing(true)
    try {
      const result = await parsePOPdf(file)
      if (result.records.length === 0) {
        toast.error('Could not extract items from PDF. Please check the file.')
        setParsing(false); return
      }
      setPreview({ type:'pdf', rows: result.records, summary: result.summary,
        isAmendment: result.isAmendment, poNo: result.poNo })
      setEditableRows(result.records.map((r:any) => ({...r})))
      setStep('preview')
    } catch(e:any) { toast.error('PDF parse error: ' + e.message) }
    setParsing(false)
  }

  const handleSave = async () => {
    if (!preview) return
    setSaving(true)
    const rows = editableRows.length ? editableRows : preview.rows
    try {
      if (preview.type === 'excel') {
        // Upsert PO lines — deduplicate by po_no+item_name first (Excel may have duplicate rows)
        if (rows.length > 0) {
          const seen = new Set<string>()
          const deduped = rows.filter((r: any) => {
            const key = `${r.po_no}||${r.item_name}`
            if (seen.has(key)) return false
            seen.add(key); return true
          })
          const chunks = []
          for (let i=0;i<deduped.length;i+=200) chunks.push(deduped.slice(i,i+200))
          for (const chunk of chunks) {
            const { error } = await supabase.from('purchase_orders').upsert(chunk, { onConflict:'po_no,item_name' })
            if (error) throw error
          }
        }
        // Upsert payment records — skip po_id FK lookup (too many POs for a single .in() query)
        // po_no text is already stored; po_id can be backfilled later if needed
        if (preview.payRows && preview.payRows.length > 0) {
          const payments = preview.payRows.filter((r:any)=>r.amount>0).map((r:any)=>({
            vendor_name: r.vendor_name, invoice_date: r.grn_date ?? r.paid_date ?? null,
            amount: r.amount, status: r.status ?? 'Pending',
            paid_date: r.paid_date ?? null, grn_no: r.grn_no ?? null,
            po_no: r.po_no ?? null,
            credit_limit_days: r.credit_limit_days ?? null,
          }))
          if (payments.length > 0) {
            // Chunk into 200 to avoid payload limits; use vendor_name+grn_no unique key
            for (let i=0;i<payments.length;i+=200) {
              const chunk = payments.slice(i,i+200)
              const { error } = await supabase.from('pending_payments').upsert(chunk, { onConflict:'vendor_name,grn_no', ignoreDuplicates:true })
              if (error) console.warn('Payment upsert warning:', error.message)
            }
          }
        }
        // Auto-create vendor parties from all imported PO rows (name only, no GST in Excel)
        const uniqueVendorNames = [...new Set(rows.map((r:any) => r.vendor_name?.trim()).filter(Boolean))]
        if (uniqueVendorNames.length > 0) {
          const vendorRecords = uniqueVendorNames.map(name => ({ name, type: 'supplier' }))
          await supabase.from('parties').upsert(vendorRecords, { onConflict: 'name,type', ignoreDuplicates: true })
        }
        // Auto-create items in unified items master from all imported PO rows
        const uniqueItemNames = [...new Set(rows.map((r:any) => r.item_name?.trim()).filter(Boolean))]
        if (uniqueItemNames.length > 0) {
          const { data: existing } = await supabase.from('items').select('name').in('name', uniqueItemNames)
          const existingNames = new Set((existing ?? []).map((i: any) => i.name.trim().toLowerCase()))
          const newItems = uniqueItemNames
            .filter((name: string) => !existingNames.has(name.toLowerCase()))
            .map((name: string) => ({ name, category: 'Feed Ingredient', unit: 'Kg' }))
          if (newItems.length > 0) await supabase.from('items').insert(newItems)
        }
        toast.success(`Imported ${rows.length} PO records · ${uniqueVendorNames.length} vendors · ${uniqueItemNames.length} items added to masters`)
      } else {
        // PDF import
        if (preview.isAmendment && preview.poNo) {
          // Update existing PO lines with amended data
          for (const rec of rows) {
            const { credit_limit_days, delivery_date, is_amendment, ...poFields } = rec
            const { data: existing } = await supabase.from('purchase_orders')
              .select('id').eq('po_no', rec.po_no).eq('item_name', rec.item_name).single()
            if (existing) {
              await supabase.from('purchase_orders').update({
                rate: poFields.rate, gst_pct: poFields.gst_pct,
                total_amount: poFields.total_amount, quantity: poFields.quantity,
              }).eq('id', existing.id)
            } else {
              await supabase.from('purchase_orders').insert(poFields)
            }
          }
          if (rows[0]?.credit_limit_days) {
            await supabase.from('pending_payments')
              .update({ credit_limit_days: rows[0].credit_limit_days })
              .eq('po_id', (await supabase.from('purchase_orders').select('id').eq('po_no', preview.poNo).limit(1).single())?.data?.id ?? '')
          }
          toast.success(`Amendment applied — ${rows.length} items updated`)
        } else {
          // New PO — insert
          const cleanRows = rows.map(({ credit_limit_days, delivery_date, is_amendment, ...r }: any) => r)
          const { error } = await supabase.from('purchase_orders').upsert(cleanRows, { onConflict:'po_no,item_name' })
          if (error) throw error
          // Auto-create vendor party with GST + address from PDF
          if (rows[0]?.vendor_name) {
            const { vendor_name, vendor_gstin, vendor_address } = rows[0]
            await supabase.from('parties').upsert(
              { name: vendor_name.trim(), type: 'supplier', gstin: vendor_gstin ?? null, address: vendor_address ?? null },
              { onConflict: 'name,type', ignoreDuplicates: false }
            )
          }
          // Auto-create items in unified items master from PDF PO rows
          const uniquePdfItems = [...new Set(rows.map((r:any) => r.item_name?.trim()).filter(Boolean))]
          if (uniquePdfItems.length > 0) {
            const { data: existingPdf } = await supabase.from('items').select('name').in('name', uniquePdfItems)
            const existingPdfNames = new Set((existingPdf ?? []).map((i: any) => i.name.trim().toLowerCase()))
            const newPdfItems = uniquePdfItems
              .filter((name: string) => !existingPdfNames.has(name.toLowerCase()))
              .map((name: string) => ({ name, category: 'Feed Ingredient', unit: 'Kg' }))
            if (newPdfItems.length > 0) await supabase.from('items').insert(newPdfItems)
          }
          toast.success(`PO imported — ${rows.length} items · vendor & items added to masters`)
        }
      }
      qc.invalidateQueries({ queryKey: ['purchase_orders'] })
      qc.invalidateQueries({ queryKey: ['po_rate_analysis'] })
      qc.invalidateQueries({ queryKey: ['parties'] })
      qc.invalidateQueries({ queryKey: ['ingredients'] })
      setSaving(false); reset(); onClose()
    } catch(e:any) { toast.error(e.message) } finally { setSaving(false) }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-900">Import Purchase Orders</h2>
            <p className="text-xs text-gray-500">Upload NBF Excel register or PDF purchase order</p>
          </div>
          <button onClick={()=>{reset();onClose()}} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {step === 'idle' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Excel upload */}
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-brand-400 transition-colors cursor-pointer"
                onClick={()=>xlsxRef.current?.click()}>
                <div className="text-3xl mb-2">📊</div>
                <p className="font-semibold text-gray-800 text-sm">NBF Order Register</p>
                <p className="text-xs text-gray-400 mt-1">Excel file with all FY sheets<br/>(NBF_ORDER_At_A_Glance.xlsx)</p>
                <p className="text-xs text-brand-600 mt-2">Imports all years at once</p>
                {parsing && <p className="text-xs text-orange-500 mt-2">Parsing...</p>}
                <input ref={xlsxRef} type="file" accept=".xlsx,.xls" className="hidden"
                  onChange={e=>{const f=e.target.files?.[0];if(f)handleExcel(f);e.target.value=''}}/>
              </div>
              {/* PDF upload */}
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-brand-400 transition-colors cursor-pointer"
                onClick={()=>pdfRef.current?.click()}>
                <div className="text-3xl mb-2">📄</div>
                <p className="font-semibold text-gray-800 text-sm">PDF Purchase Order</p>
                <p className="text-xs text-gray-400 mt-1">Individual PO PDF from vendor<br/>Works for both PO and Amendment</p>
                <p className="text-xs text-brand-600 mt-2">Auto-detects AMENDMENT</p>
                {parsing && <p className="text-xs text-orange-500 mt-2">Extracting text...</p>}
                <input ref={pdfRef} type="file" accept=".pdf" className="hidden"
                  onChange={e=>{const f=e.target.files?.[0];if(f)handlePDF(f);e.target.value=''}}/>
              </div>
            </div>
          )}

          {step === 'preview' && preview && (
            <div className="space-y-4">
              {/* Summary banner */}
              <div className={`rounded-lg px-4 py-3 text-sm font-medium ${preview.isAmendment ? 'bg-orange-50 border border-orange-200 text-orange-800' : 'bg-green-50 border border-green-200 text-green-800'}`}>
                {preview.isAmendment && <span className="mr-2 bg-orange-600 text-white text-xs px-2 py-0.5 rounded">AMENDMENT</span>}
                {preview.summary}
              </div>

              {/* PO items preview table */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase">PO Lines ({editableRows.length})</p>
                  {preview.type === 'pdf' && editableRows.some(r => /^Item \d+$/.test(r.item_name)) && (
                    <p className="text-xs text-orange-600 font-medium">⚠ Some item names were not detected — click the orange cells to correct them</p>
                  )}
                </div>
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                  <table className="text-xs w-full">
                    <thead className="bg-gray-50"><tr>
                      <th className="px-2 py-1.5 text-left text-gray-500">PO No</th>
                      <th className="px-2 py-1.5 text-left text-gray-500">Vendor</th>
                      <th className="px-2 py-1.5 text-left text-gray-500">Item {preview.type==='pdf' && <span className="text-brand-500">(editable)</span>}</th>
                      <th className="px-2 py-1.5 text-right text-gray-500">Qty</th>
                      <th className="px-2 py-1.5 text-left text-gray-500">UOM</th>
                      <th className="px-2 py-1.5 text-right text-gray-500">Rate</th>
                      <th className="px-2 py-1.5 text-right text-gray-500">GST%</th>
                      <th className="px-2 py-1.5 text-right text-gray-500">Net Amt</th>
                      <th className="px-2 py-1.5 text-left text-gray-500">FY</th>
                    </tr></thead>
                    <tbody>
                      {editableRows.slice(0,30).map((r,i)=>{
                        const isAutoName = /^Item \d+$/.test(r.item_name)
                        return (
                        <tr key={i} className="border-t border-gray-100 hover:bg-gray-50">
                          <td className="px-2 py-1 text-gray-600 whitespace-nowrap">{r.po_no}</td>
                          <td className="px-2 py-1 max-w-[140px] truncate text-gray-700">{r.vendor_name}</td>
                          <td className={`px-2 py-1 font-medium ${isAutoName ? 'bg-orange-50' : ''}`}>
                            {preview.type === 'pdf' ? (
                              <input
                                className={`w-full min-w-[120px] text-xs rounded px-1 py-0.5 border focus:outline-none focus:ring-1 focus:ring-brand-400 ${isAutoName ? 'border-orange-300 bg-orange-50 text-orange-700' : 'border-transparent bg-transparent hover:border-gray-300'}`}
                                value={r.item_name}
                                onChange={e => setEditableRows(prev => prev.map((row, idx) => idx===i ? {...row, item_name: e.target.value} : row))}
                              />
                            ) : <span className="max-w-[150px] truncate block">{r.item_name}</span>}
                          </td>
                          <td className="px-2 py-1 text-right text-gray-700">{r.quantity?.toLocaleString('en-IN')}</td>
                          <td className="px-2 py-1 text-gray-500">{r.unit}</td>
                          <td className="px-2 py-1 text-right font-medium">{r.rate ? `₹${r.rate.toLocaleString('en-IN')}` : '—'}</td>
                          <td className="px-2 py-1 text-right text-gray-500">{r.gst_pct ? `${r.gst_pct}%` : '—'}</td>
                          <td className="px-2 py-1 text-right text-green-700 font-semibold">{r.total_amount ? `₹${r.total_amount.toLocaleString('en-IN')}` : '—'}</td>
                          <td className="px-2 py-1 text-gray-400">{r.fiscal_year}</td>
                        </tr>
                      )})}
                      {editableRows.length > 30 && (
                        <tr><td colSpan={9} className="px-2 py-1 text-gray-400 text-center">…and {editableRows.length-30} more rows</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Payment records preview */}
              {preview.payRows && preview.payRows.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Payment Records ({preview.payRows.length})</p>
                  <div className="overflow-x-auto rounded-lg border border-gray-200">
                    <table className="text-xs w-full">
                      <thead className="bg-gray-50"><tr>
                        <th className="px-2 py-1.5 text-left text-gray-500">PO No</th>
                        <th className="px-2 py-1.5 text-left text-gray-500">Vendor</th>
                        <th className="px-2 py-1.5 text-left text-gray-500">Item</th>
                        <th className="px-2 py-1.5 text-right text-gray-500">Amount</th>
                        <th className="px-2 py-1.5 text-right text-gray-500">Credit Days</th>
                        <th className="px-2 py-1.5 text-left text-gray-500">Status</th>
                      </tr></thead>
                      <tbody>
                        {preview.payRows.slice(0,20).map((r:any,i:number)=>(
                          <tr key={i} className="border-t border-gray-100">
                            <td className="px-2 py-1 text-gray-600">{r.po_no}</td>
                            <td className="px-2 py-1 max-w-[120px] truncate">{r.vendor_name}</td>
                            <td className="px-2 py-1 max-w-[120px] truncate">{r.item_name}</td>
                            <td className="px-2 py-1 text-right font-medium text-green-700">₹{r.amount?.toLocaleString('en-IN')}</td>
                            <td className="px-2 py-1 text-right text-gray-500">{r.credit_limit_days ?? '—'}</td>
                            <td className="px-2 py-1"><span className={`px-1.5 py-0.5 rounded text-xs ${r.status==='Paid'?'bg-green-100 text-green-700':'bg-yellow-100 text-yellow-700'}`}>{r.status}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex justify-between items-center">
          <button onClick={reset} className="text-sm text-gray-500 hover:text-gray-700">
            {step==='preview' ? '← Back' : 'Cancel'}
          </button>
          {step === 'preview' && (
            <div className="flex gap-2">
              <Button variant="secondary" onClick={()=>{reset();onClose()}}>Cancel</Button>
              <Button loading={saving} onClick={handleSave}>
                {preview?.isAmendment ? 'Apply Amendment' : `Import ${preview?.rows.length} records`}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


// ── HATCHERY ADVANCES TAB ─────────────────────────────────────────
const HatcheryAdvancesTab: React.FC = () => {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [delId, setDelId] = useState<string|null>(null)

  const { data: flocks = [] } = useQuery({
    queryKey: ['flocks_adv'],
    queryFn: async () => { const { data } = await supabase.from('flocks').select('id,flock_no').order('flock_no',{ascending:false}); return data ?? [] }
  })
  const { data: parties = [] } = useQuery({
    queryKey: ['parties_supp'],
    queryFn: async () => { const { data } = await supabase.from('parties').select('id,name').in('type',['supplier','both']).order('name'); return data ?? [] }
  })
  const { data: advances = [], isLoading } = useQuery({
    queryKey: ['hatchery_advances'],
    queryFn: async () => {
      const { data } = await supabase.from('hatchery_advances')
        .select('*, flocks(flock_no), parties(name)')
        .order('advance_date', { ascending: false })
      return data ?? []
    }
  })

  const emptyAdv = () => ({
    advance_date: today(), flock_id: '', party_id: '', hatchery_name: '',
    amount: '', payment_mode: 'Online', reference_no: '', remarks: '', adjusted: false
  })
  const [form, setForm] = useState(emptyAdv())
  const sv = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  const mut = useMutation({
    mutationFn: async () => {
      if (!form.advance_date || !form.amount) throw new Error('Date and amount required')
      const { error } = await supabase.from('hatchery_advances').insert({
        advance_date: form.advance_date,
        flock_id: form.flock_id || null,
        party_id: form.party_id || null,
        hatchery_name: form.hatchery_name || null,
        amount: parseFloat(form.amount),
        payment_mode: form.payment_mode,
        reference_no: form.reference_no || null,
        remarks: form.remarks || null,
        adjusted: form.adjusted,
      })
      if (error) throw error
    },
    onSuccess: () => { toast.success('Advance recorded'); qc.invalidateQueries({queryKey:['hatchery_advances']}); setForm(emptyAdv()); setShowForm(false) },
    onError: (e: any) => toast.error(e.message)
  })

  const delMut = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('hatchery_advances').delete().eq('id', id); if (error) throw error },
    onSuccess: () => { toast.success('Deleted'); setDelId(null); qc.invalidateQueries({queryKey:['hatchery_advances']}) },
    onError: (e: any) => toast.error(e.message)
  })

  const totalAdv = (advances as any[]).reduce((s, a) => s + (a.amount ?? 0), 0)
  const pendingAdj = (advances as any[]).filter((a: any) => !a.adjusted).reduce((s, a) => s + (a.amount ?? 0), 0)

  return (
    <div className="space-y-4">
      <SectionHeader title="Hatchery Advances"
        subtitle="Advance payments made to hatcheries before chick arrival"
        action={<Button icon={<Plus size={16}/>} onClick={() => setShowForm(true)}>Add Advance</Button>}
      />
      <div className="grid grid-cols-2 gap-4">
        <StatCard title="Total Advances Paid" value={inr(totalAdv)} icon={<TrendingUp size={18}/>} color="text-blue-600" />
        <StatCard title="Pending Adjustment" value={inr(pendingAdj)} subtitle="Not yet matched to GRN invoice" icon={<AlertCircle size={18}/>} color="text-amber-600" />
      </div>
      {isLoading ? <Spinner /> : (
        <Card padding={false}>
          <Table>
            <thead><tr>
              <Th>Date</Th><Th>Flock</Th><Th>Hatchery / Party</Th>
              <Th right>Amount</Th><Th>Mode</Th><Th>Ref No</Th><Th>Status</Th><Th></Th>
            </tr></thead>
            <tbody>
              {(advances as any[]).map((a: any) => (
                <tr key={a.id} className="hover:bg-gray-50">
                  <Td className="text-xs">{fmtDate(a.advance_date)}</Td>
                  <Td className="text-xs font-medium">{a.flocks?.flock_no ? `Flock ${a.flocks.flock_no}` : '—'}</Td>
                  <Td className="text-xs">{a.parties?.name ?? a.hatchery_name ?? '—'}</Td>
                  <Td right className="font-semibold">{inr(a.amount)}</Td>
                  <Td className="text-xs">{a.payment_mode}</Td>
                  <Td className="text-xs text-gray-400">{a.reference_no ?? '—'}</Td>
                  <Td><span className={`px-2 py-0.5 rounded text-xs font-medium ${a.adjusted ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{a.adjusted ? 'Adjusted' : 'Pending'}</span></Td>
                  <Td><button onClick={() => setDelId(a.id)} className="p-1 text-gray-400 hover:text-red-500"><Trash2 size={13}/></button></Td>
                </tr>
              ))}
            </tbody>
          </Table>
          {(advances as any[]).length === 0 && <EmptyState title="No advance payments recorded" action={<Button onClick={() => setShowForm(true)} icon={<Plus size={16}/>}>Add Advance</Button>} />}
        </Card>
      )}
      <Modal open={showForm} onClose={() => setShowForm(false)} title="Record Hatchery Advance" size="md"
        footer={<><Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button><Button loading={mut.isPending} onClick={() => mut.mutate()}>Save</Button></>}>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <DateInput label="Payment Date" value={form.advance_date} onChange={e => sv('advance_date', e.target.value)} />
            <Sel label="For Flock" value={form.flock_id} onChange={(e: any) => sv('flock_id', e.target.value)}
              options={[{value:'',label:'— Optional —'}, ...(flocks as any[]).map((f: any) => ({value:f.id,label:`Flock ${f.flock_no}`}))]} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Sel label="Hatchery Party" value={form.party_id} onChange={(e: any) => sv('party_id', e.target.value)}
              options={[{value:'',label:'— Select —'}, ...(parties as any[]).map((p: any) => ({value:p.id,label:p.name}))]} />
            <Input label="Hatchery Name (free text)" value={form.hatchery_name} onChange={e => sv('hatchery_name', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Amount (₹)" type="number" step="0.01" required value={form.amount} onChange={e => sv('amount', e.target.value)} />
            <Sel label="Payment Mode" value={form.payment_mode} onChange={(e: any) => sv('payment_mode', e.target.value)}
              options={['Online','NEFT','RTGS','IMPS','Cheque','Cash'].map(v => ({value:v,label:v}))} />
          </div>
          <Input label="Reference / UTR No" value={form.reference_no} onChange={e => sv('reference_no', e.target.value)} />
          <Input label="Remarks" value={form.remarks} onChange={e => sv('remarks', e.target.value)} />
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" checked={form.adjusted} onChange={e => sv('adjusted', e.target.checked)} className="rounded text-brand-600" />
            Already adjusted against invoice / GRN
          </label>
        </div>
      </Modal>
      <Modal open={!!delId} onClose={() => setDelId(null)} title="Delete Advance"
        footer={<div className="flex gap-2 justify-end"><Button variant="secondary" onClick={() => setDelId(null)}>Cancel</Button><Button variant="danger" loading={delMut.isPending} onClick={() => delId && delMut.mutate(delId)}>Delete</Button></div>}>
        <p className="text-sm text-gray-600">Delete this advance record? Cannot be undone.</p>
      </Modal>
    </div>
  )
}
