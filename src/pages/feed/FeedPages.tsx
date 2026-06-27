import React, { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { inr, fmtDate, today } from '@/lib/utils'
import { parseFile } from '@/lib/parseFile'
import {
  Card, CardHeader, Button, Input, Select, FormRow, Modal, Divider,
  Table, Th, Td, Badge, SectionHeader, Spinner, EmptyState, StatCard
, DateInput } from '@/components/ui'
import { Plus, Factory, Package, ArrowRight, TrendingUp, Edit2, Trash2, Download, Upload, Printer } from 'lucide-react'
import { QuickAddParty, QuickAddIngredient } from '@/components/ui/QuickAdd'
import toast from 'react-hot-toast'
import { printGRN } from '@/lib/invoicePrint'
import { useConfigOptions } from '@/hooks/useConfigOptions'

// ── import value cleaners ─────────────────────────────────────────
// Strip ₹ / ? / commas / spaces from money & number cells before parsing.
function cleanNum(v: any): number | null {
  if (v == null || v === '') return null
  const n = parseFloat(String(v).replace(/[₹?,\s]/g, '').trim())
  return isNaN(n) ? null : n
}
const MONTHS: Record<string,string> = { jan:'01',feb:'02',mar:'03',apr:'04',may:'05',jun:'06',jul:'07',aug:'08',sep:'09',oct:'10',nov:'11',dec:'12' }
// Normalise DD-Mon-YY / DD-Mon-YYYY / DD-MM-YYYY → YYYY-MM-DD (keeps ISO as-is).
function cleanDate(v: any): string | null {
  if (!v) return null
  const s = String(v).trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s                       // already ISO
  let m = s.match(/^(\d{1,2})[-/]([A-Za-z]{3})[A-Za-z]*[-/](\d{2,4})$/) // 01-Apr-26
  if (m) {
    const mon = MONTHS[m[2].toLowerCase()]
    if (mon) { const y = m[3].length === 2 ? '20'+m[3] : m[3]; return `${y}-${mon}-${m[1].padStart(2,'0')}` }
  }
  m = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})$/)              // 01-04-2026
  if (m) { const y = m[3].length === 2 ? '20'+m[3] : m[3]; return `${y}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}` }
  return s
}

// Derive the three invoice amounts (Taxable + Tax = Total) from whatever the
// file provides. Any blank value is back-filled from the others.
export function deriveAmounts(opts: {
  qty: number|null; price: number|null; gstPct: number|null;
  taxable: number|null; tax: number|null; total: number|null;
}): { basic_amount: number|null; gst_amount: number|null; gst_pct: number; total_amount: number|null } {
  const r2 = (n: number) => +n.toFixed(2)
  let basic = opts.taxable ?? (opts.qty != null && opts.price != null ? r2(opts.qty * opts.price) : null)
  let tax   = opts.tax
  let total = opts.total
  let gst   = opts.gstPct

  if (tax == null) {
    if (total != null && basic != null) tax = r2(total - basic)          // Total − Taxable
    else if (basic != null && gst != null) tax = r2(basic * gst / 100)   // from %
  }
  if (total == null && basic != null) total = r2(basic + (tax ?? 0))     // Taxable + Tax
  if (gst == null) gst = basic && basic > 0 && tax != null ? r2(tax / basic * 100) : 0

  return { basic_amount: basic, gst_amount: tax, gst_pct: gst, total_amount: total }
}

// ── CSV helper ────────────────────────────────────────────────────
function exportCSV(filename: string, headers: string[], rows: (string|number|null|undefined)[][]) {
  const csv = [headers, ...rows].map(r => r.map(v => `"${(v??'').toString().replace(/"/g,'""')}"`).join(',')).join('\n')
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv],{type:'text/csv'})); a.download = filename; a.click()
}

// ── GRN ENTRY ────────────────────────────────────────────────────
export const GRNEntry: React.FC = () => {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [importing, setImporting] = useState(false)
  const importRef = useRef<HTMLInputElement>(null)
  const [sel, setSel] = useState<Set<string>>(new Set())
  const [bulkDelConfirm, setBulkDelConfirm] = useState(false)
  const [delId, setDelId] = useState<string|null>(null)
  const [bulkCat, setBulkCat] = useState('')
  const [bulkCatSaving, setBulkCatSaving] = useState(false)

  // PO alert state
  const [openPOs, setOpenPOs] = useState<any[]>([])
  const [poLoading, setPoLoading] = useState(false)

  // Filters
  const [fFarm,    setFFarm]    = useState('')
  const [fParties, setFParties] = useState<string[]>([])
  const [fCat,     setFCat]     = useState('')
  const [fItem,    setFItem]    = useState('')
  const [fFrom,    setFFrom]    = useState('')
  const [fTo,      setFTo]      = useState('')

  const { data: farms } = useQuery({ queryKey: ['farms'], queryFn: async () => { const { data } = await supabase.from('farms').select('id,name,code').eq('is_active',true).order('name'); return data ?? [] } })
  const { data: parties } = useQuery({ queryKey: ['parties_supp'], queryFn: async () => { const { data } = await supabase.from('parties').select('id,name').in('type',['supplier','both']).order('name'); return data ?? [] } })
  const { data: ingredients } = useQuery({ queryKey: ['ingredients'], queryFn: async () => { const { data } = await supabase.from('feed_ingredients').select('id,code,name').eq('is_active',true).order('name'); return data ?? [] } })
  const { data: medicines } = useQuery({ queryKey: ['medicines_master'], queryFn: async () => { const { data } = await supabase.from('medicines_master').select('id,name,type,unit').eq('is_active',true).order('name'); return data ?? [] } })
  const { data: allFlocks } = useQuery({ queryKey: ['flocks_all_grn'], queryFn: async () => { const { data } = await supabase.from('flocks').select('id,flock_no,status').order('flock_no',{ascending:false}); return data ?? [] } })

  const { data: allGrns, isLoading } = useQuery({
    queryKey: ['grns'],
    queryFn: async () => {
      const PAGE = 1000
      let all: any[] = []
      let from = 0
      while (true) {
        const { data } = await supabase.from('grn')
          .select('*, farms(name,code), parties(name), feed_ingredients(name,code)')
          .order('grn_date', { ascending: false })
          .range(from, from + PAGE - 1)
        if (!data || data.length === 0) break
        all = all.concat(data)
        if (data.length < PAGE) break
        from += PAGE
      }
      return all
    }
  })

  // Client-side filtering
  const grns = (allGrns ?? []).filter((g: any) => {
    if (fFarm && g.farm_id !== fFarm) return false
    if (fParties.length > 0 && !fParties.includes(g.party_id)) return false
    if (fCat && (g.category ?? 'Feed') !== fCat) return false
    if (fItem) {
      const name = (g.feed_ingredients?.name ?? g.item_name ?? '').toLowerCase()
      if (!name.includes(fItem.toLowerCase())) return false
    }
    if (fFrom && g.grn_date < fFrom) return false
    if (fTo   && g.grn_date > fTo)   return false
    return true
  })

  // Item-level stats (when item filter active)
  const itemStats = fItem ? (() => {
    const valid = grns.filter((g: any) => g.qty && g.price_per_unit)
    const avgRate = valid.length ? valid.reduce((s: number, g: any) => s + g.price_per_unit, 0) / valid.length : 0
    const minRate = valid.length ? Math.min(...valid.map((g: any) => g.price_per_unit)) : 0
    const maxRate = valid.length ? Math.max(...valid.map((g: any) => g.price_per_unit)) : 0
    return { avgRate, minRate, maxRate }
  })() : null

  const [form, setForm] = useState({
    grn_no: '', grn_date: today(), farm_id: '', party_id: '', invoice_no: '',
    invoice_date: today(), category: 'Feed', ingredient_id: '', medicine_id: '',
    flock_id: '',
    item_name: '', qty: '', unit: 'kg',
    bags: '', price_per_unit: '', basic_amount: '', gst_pct: '0', total_amount: '',
    batch_no: '', expiry_date: '', vehicle_no: '', remarks: ''
  })
  const s = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const basic  = (parseFloat(form.qty)||0) * (parseFloat(form.price_per_unit)||0)
  const gstAmt = basic * (parseFloat(form.gst_pct)||0) / 100
  const total  = basic + gstAmt

  const isFeed = form.category === 'Feed'
  const isMedOrVax = form.category === 'Medicine' || form.category === 'Vaccine'
  const isChick = form.category === 'Chicks'

  const payload = () => ({
    grn_no: form.grn_no, grn_date: form.grn_date,
    farm_id: form.farm_id, party_id: form.party_id || null,
    invoice_no: form.invoice_no || null, invoice_date: form.invoice_date || null,
    category: form.category,
    ingredient_id: isFeed ? (form.ingredient_id || null) : null,
    medicine_id: isMedOrVax ? (form.medicine_id || null) : null,
    item_name: form.item_name || null,
    qty: parseFloat(form.qty) || null, unit: form.unit,
    bags: parseInt(form.bags) || null,
    price_per_unit: parseFloat(form.price_per_unit) || null,
    basic_amount: parseFloat(form.basic_amount) || basic || null,
    gst_amount: gstAmt > 0 ? +gstAmt.toFixed(2) : null,
    gst_pct: parseFloat(form.gst_pct) || 0,
    total_amount: parseFloat(form.total_amount) || total || null,
    batch_no: isMedOrVax ? (form.batch_no || null) : null,
    expiry_date: isMedOrVax ? (form.expiry_date || null) : null,
    flock_id: isChick ? (form.flock_id || null) : null,
    vehicle_no: form.vehicle_no || null, remarks: form.remarks || null
  })

  const fetchOpenPOs = async (ingredientId: string) => {
    if (!ingredientId) { setOpenPOs([]); return }
    const ingr = ingredients?.find((i: any) => i.id === ingredientId)
    if (!ingr) { setOpenPOs([]); return }
    setPoLoading(true)
    try {
      const { data } = await supabase.from('purchase_orders')
        .select('id, po_no, po_date, vendor_name, item_name, quantity, material_status')
        .ilike('item_name', `%${ingr.name}%`)
        .eq('material_status', 'Pending')
        .order('po_date', { ascending: false })
      setOpenPOs(data ?? [])
    } catch { setOpenPOs([]) }
    finally { setPoLoading(false) }
  }

  const openAdd = () => {
    setEditing(null)
    setOpenPOs([])
    setForm({ grn_no:'', grn_date:today(), farm_id:'', party_id:'', invoice_no:'',
      invoice_date:today(), category:'Feed', ingredient_id:'', medicine_id:'',
      flock_id:'',
      item_name:'', qty:'', unit:'kg',
      bags:'', price_per_unit:'', basic_amount:'', gst_pct:'0', total_amount:'',
      batch_no:'', expiry_date:'', vehicle_no:'', remarks:'' })
    setShowForm(true)
  }

  const openEdit = (g: any) => {
    setOpenPOs([])
    setEditing(g)
    setForm({
      grn_no: g.grn_no ?? '', grn_date: g.grn_date ?? today(),
      farm_id: g.farm_id ?? '', party_id: g.party_id ?? '',
      invoice_no: g.invoice_no ?? '', invoice_date: g.invoice_date ?? today(),
      category: g.category ?? 'Feed',
      ingredient_id: g.ingredient_id ?? '', medicine_id: g.medicine_id ?? '',
      flock_id: g.flock_id ?? '',
      item_name: g.item_name ?? '',
      qty: g.qty?.toString() ?? '', unit: g.unit ?? 'kg',
      bags: g.bags?.toString() ?? '',
      price_per_unit: g.price_per_unit?.toString() ?? '',
      basic_amount: g.basic_amount?.toString() ?? '',
      gst_pct: g.gst_pct?.toString() ?? '0',
      total_amount: g.total_amount?.toString() ?? '',
      batch_no: g.batch_no ?? '', expiry_date: g.expiry_date ?? '',
      vehicle_no: g.vehicle_no ?? '', remarks: g.remarks ?? ''
    })
    setShowForm(true)
  }

  const mut = useMutation({
    mutationFn: async () => {
      if (!form.grn_no || !form.grn_date || !form.farm_id) throw new Error('GRN No, date and site required')
      if (isChick && !form.flock_id) throw new Error('Select the flock for this chick GRN')
      if (editing) {
        const { error } = await supabase.from('grn').update(payload()).eq('id', editing.id)
        if (error) throw error
        // If chick GRN edited, re-sync flock chick_rate
        if (isChick && form.flock_id) {
          const qty = parseFloat(form.qty) || 0
          const totalAmt = parseFloat(form.total_amount) || total
          const ratePerChick = qty > 0 ? +(totalAmt / qty).toFixed(2) : null
          if (ratePerChick) await supabase.from('flocks').update({ chick_rate: ratePerChick }).eq('id', form.flock_id)
        }
      } else {
        const { data: inserted, error } = await supabase.from('grn').insert(payload()).select('id').single()
        if (error) throw error
        // Auto-update flock chick_rate from this GRN
        if (isChick && form.flock_id && inserted) {
          const qty = parseFloat(form.qty) || 0
          const totalAmt = parseFloat(form.total_amount) || total
          const ratePerChick = qty > 0 ? +(totalAmt / qty).toFixed(2) : null
          if (ratePerChick) await supabase.from('flocks').update({ chick_rate: ratePerChick }).eq('id', form.flock_id)
        }
      }
    },
    onSuccess: () => {
      toast.success(editing ? 'GRN updated!' : isChick ? 'Chick GRN saved & flock rate updated!' : 'GRN saved!')
      qc.invalidateQueries({ queryKey: ['grns'] })
      qc.invalidateQueries({ queryKey: ['flocks'] })
      setShowForm(false)
    },
    onError: (e: any) => toast.error(e.message)
  })

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('grn').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => { toast.success('GRN deleted'); setDelId(null); qc.invalidateQueries({ queryKey: ['grns'] }) },
    onError: (e: any) => toast.error(e.message),
  })

  const bulkDeleteMut = useMutation({
    mutationFn: async (ids: string[]) => {
      const validIds = ids.filter((id): id is string => !!id && id !== 'undefined')
      for (let i = 0; i < validIds.length; i += 50) {
        const { error } = await supabase.from('grn').delete().in('id', validIds.slice(i, i + 50))
        if (error) throw error
      }
    },
    onSuccess: () => {
      toast.success('Deleted'); setSel(new Set()); setBulkDelConfirm(false)
      qc.invalidateQueries({ queryKey: ['grns'] })
    },
    onError: (e: any) => toast.error(e.message)
  })

  const farmOptions = farms?.map((f: any) => ({ value: f.id, label: `${f.name} (${f.code})` })) ?? []
  const partyOptions = parties?.map((p: any) => ({ value: p.id, label: p.name })) ?? []
  const ingrOptions = ingredients?.map((i: any) => ({ value: i.id, label: i.code ? `${i.code} — ${i.name}` : i.name })) ?? []
  const medOptions  = medicines?.map((m: any) => ({ value: m.id, label: `${m.name} (${m.type})` })) ?? []
  const categoryOptions = useConfigOptions('grn_category', [
    { value: 'Feed',      label: 'Feed / Raw Material' },
    { value: 'Chicks',    label: 'Chicks (Day-Old Birds)' },
    { value: 'Medicine',  label: 'Medicine / Oral' },
    { value: 'Vaccine',   label: 'Vaccine' },
    { value: 'Packaging', label: 'Packaging Material' },
    { value: 'Other',     label: 'Other' },
  ])
  const flockOptions = (allFlocks ?? []).map((f: any) => ({ value: f.id, label: `Flock ${f.flock_no}${f.status === 'closed' ? ' (closed)' : ''}` }))

  const totalQty = grns.reduce((s: number, g: any) => s + (g.qty ?? 0), 0)
  const totalVal = grns.reduce((s: number, g: any) => s + (g.total_amount ?? 0), 0)
  const hasFilter = fFarm || fParties.length > 0 || fCat || fItem || fFrom || fTo

  const handleExport = () => {
    exportCSV(`grn_export.csv`,
      ['grn_no','grn_date','site_code','party_name','invoice_no','invoice_date','item_name','qty','unit','bags','price_per_unit','taxable_amount','gst_pct','tax_amount','total_amount','vehicle_no','remarks'],
      grns.map((g: any) => [g.grn_no, g.grn_date, g.farms?.code, g.parties?.name, g.invoice_no, g.invoice_date, g.feed_ingredients?.name??g.item_name, g.qty, g.unit, g.bags, g.price_per_unit, g.basic_amount, g.gst_pct, g.gst_amount, g.total_amount, g.vehicle_no, g.remarks])
    )
  }

  const handleTemplate = () => {
    exportCSV('grn_template.csv',
      ['grn_no','grn_date','site_code','party_name','invoice_no','invoice_date','item_name','qty','unit','bags','price_per_unit','gst_pct','vehicle_no','remarks'],
      [['GRN001','2025-06-01','BPS','Supplier Name','INV001','2025-06-01','Maize',10000,'kg',200,22.5,5,'TN01AB1234','']]
    )
  }

  const handleImport = async (file: File) => {
    setImporting(true)
    try {
      const { headers: rawHeaders, rows } = await parseFile(file)
      const records = rows.map(vals => {
        const obj: Record<string,string> = {}
        rawHeaders.forEach((h,i) => { obj[h] = vals[i] ?? '' })
        return obj
      })
      const { data: allFarms } = await supabase.from('farms').select('id,code')
      const { data: allParties } = await supabase.from('parties').select('id,name')
      const { data: allIngr } = await supabase.from('feed_ingredients').select('id,name')
      const farmMap: Record<string,string> = {}
      const partyMap: Record<string,string> = {}
      const ingrMap: Record<string,string> = {}
      for (const f of (allFarms??[])) farmMap[f.code.toLowerCase()] = f.id
      for (const p of (allParties??[])) partyMap[p.name.toLowerCase()] = p.id
      for (const i of (allIngr??[])) ingrMap[i.name.toLowerCase()] = i.id
      const toInsert = records.filter(r => r.grn_no && r.grn_date).map(r => {
        const qty   = cleanNum(r.qty)
        const price = cleanNum(r.price_per_unit)
        // Derived amounts are computed from raw inputs (qty × price + gst_pct), not read from the file
        const amt = deriveAmounts({
          qty, price,
          gstPct:  cleanNum(r.gst_pct),
          taxable: null,
          tax:     null,
          total:   null,
        })
        return {
          grn_no: r.grn_no,
          grn_date: cleanDate(r.grn_date),
          farm_id: farmMap[r.site_code?.toLowerCase()] || null,
          party_id: partyMap[r.party_name?.toLowerCase()] || null,
          invoice_no: r.invoice_no || null,
          invoice_date: cleanDate(r.invoice_date),
          ingredient_id: ingrMap[r.item_name?.toLowerCase()] || null,
          item_name: r.item_name || null,
          qty,
          unit: r.unit || 'kg',
          bags: cleanNum(r.bags) || null,
          price_per_unit: price,
          basic_amount: amt.basic_amount,
          gst_pct: amt.gst_pct,
          gst_amount: amt.gst_amount,
          total_amount: amt.total_amount,
          vehicle_no: r.vehicle_no || null,
          remarks: r.remarks || null,
        }
      })
      if (!toInsert.length) { toast.error('No valid rows'); return }
      const { error } = await supabase.from('grn').insert(toInsert)
      if (error) throw error
      toast.success(`Imported ${toInsert.length} GRN records`)
      qc.invalidateQueries({ queryKey: ['grns'] })
    } catch (e: any) { toast.error(e.message) }
    finally { setImporting(false); if (importRef.current) importRef.current.value = '' }
  }

  const handleBulkCategory = async () => {
    if (!bulkCat || !sel.size) { toast.error('Select rows and a category'); return }
    setBulkCatSaving(true)
    const ids = Array.from(sel)
    for (let i = 0; i < ids.length; i += 50) {
      const { error } = await supabase.from('grn').update({ category: bulkCat }).in('id', ids.slice(i, i + 50))
      if (error) { toast.error(error.message); setBulkCatSaving(false); return }
    }
    toast.success(`Updated ${sel.size} GRN(s) to "${bulkCat}"`)
    setSel(new Set())
    setBulkCat('')
    qc.invalidateQueries({ queryKey: ['grns'] })
    setBulkCatSaving(false)
  }

  return (
    <div className="space-y-5">
      <SectionHeader title="GRN — Goods Received"
        subtitle={`${grns.length} of ${allGrns?.length ?? 0} records`}
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" icon={<Download size={14}/>} onClick={handleTemplate}>Template</Button>
            <Button variant="outline" size="sm" icon={<Upload size={14}/>} loading={importing} onClick={() => importRef.current?.click()}>Import</Button>
            <input ref={importRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleImport(f) }}/>
            <Button variant="outline" size="sm" icon={<Download size={14}/>} onClick={handleExport}>Export CSV</Button>
            <Button icon={<Plus size={16}/>} onClick={openAdd}>Add GRN</Button>
          </div>
        }
      />

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 items-end">
          <Select label="Site" placeholder="All Sites" options={farmOptions}
            value={fFarm} onChange={e => setFFarm(e.target.value)} />
          <Select label="Category" placeholder="All Categories"
            options={categoryOptions}
            value={fCat} onChange={e => setFCat(e.target.value)} />
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Supplier (multi-select)</label>
            <select multiple size={4}
              className="w-full border border-gray-200 rounded-lg text-xs p-1.5 focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              value={fParties}
              onChange={e => setFParties(Array.from(e.target.selectedOptions).map(o => o.value))}>
              {partyOptions.map((p: any) => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
            {fParties.length > 0 && <p className="text-xs text-brand-600 mt-0.5">{fParties.length} selected</p>}
          </div>
          <Input label="Item / Ingredient" placeholder="Search…" value={fItem}
            onChange={e => setFItem(e.target.value)} />
          <DateInput label="Date From" value={fFrom} onChange={e => setFFrom(e.target.value)} />
          <DateInput label="Date To"   value={fTo}   onChange={e => setFTo(e.target.value)} />
        </div>
        {hasFilter && (
          <button onClick={() => { setFFarm(''); setFParties([]); setFCat(''); setFItem(''); setFFrom(''); setFTo('') }}
            className="mt-2 text-xs text-brand-600 hover:underline">Clear filters</button>
        )}
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Records" value={grns.length.toLocaleString('en-IN')} icon={<Package size={18}/>} color="text-brand-600" />
        <StatCard title="Total Qty" value={`${(totalQty/1000).toFixed(1)} MT`} icon={<Package size={18}/>} color="text-blue-600" />
        <StatCard title="Purchase Value" value={inr(totalVal)} icon={<TrendingUp size={18}/>} color="text-green-600" />
        {itemStats ? (
          <StatCard title={`Avg Rate (${fItem})`} value={`₹${itemStats.avgRate.toFixed(2)}/unit`}
            subtitle={`Min ₹${itemStats.minRate.toFixed(2)} · Max ₹${itemStats.maxRate.toFixed(2)}`}
            icon={<TrendingUp size={18}/>} color="text-orange-600" />
        ) : (
          <StatCard title="Avg per Record" value={grns.length ? inr(totalVal/grns.length) : '—'} icon={<TrendingUp size={18}/>} color="text-orange-600" />
        )}
      </div>

      {sel.size > 0 && (
        <div className="flex flex-wrap items-center gap-3 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
          <span className="text-sm font-semibold text-blue-700">{sel.size} selected</span>
          <div className="flex items-center gap-2">
            <select value={bulkCat} onChange={e => setBulkCat(e.target.value)}
              className="border border-blue-300 rounded-lg px-2 py-1 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-400">
              <option value="">— Change Category —</option>
              {categoryOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <button onClick={handleBulkCategory} disabled={!bulkCat || bulkCatSaving}
              className="px-3 py-1 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-40">
              {bulkCatSaving ? 'Saving…' : 'Apply'}
            </button>
          </div>
          <div className="h-4 w-px bg-blue-300" />
          <button onClick={() => setBulkDelConfirm(true)} className="text-sm text-red-600 hover:underline font-medium">Delete selected</button>
          <button onClick={() => { setSel(new Set()); setBulkCat('') }} className="text-xs text-gray-500 hover:text-gray-700 underline ml-auto">Clear</button>
        </div>
      )}

      {isLoading ? <Spinner /> : (
        <Card padding={false}>
          <Table>
            <thead><tr>
              <Th><input type="checkbox" className="rounded border-gray-300 text-brand-600"
                checked={grns.length > 0 && grns.every((g: any) => sel.has(g.id))}
                onChange={e => {
                  const n = new Set(sel)
                  grns.forEach((g: any) => { if (g.id) { e.target.checked ? n.add(g.id) : n.delete(g.id) } })
                  setSel(n)
                }} /></Th>
              <Th>GRN No</Th><Th>Date</Th><Th>Site</Th><Th>Category</Th><Th>Party</Th>
              <Th>Item</Th><Th>Invoice No</Th>
              <Th right>Qty</Th><Th right>Unit Price</Th><Th right>Amount</Th><Th></Th>
            </tr></thead>
            <tbody>
              {grns.map((g: any) => (
                <tr key={g.id} className={`hover:bg-gray-50 ${sel.has(g.id) ? 'bg-blue-50' : ''}`}>
                  <Td><input type="checkbox" className="rounded border-gray-300 text-brand-600"
                    checked={sel.has(g.id)}
                    onChange={() => { const n = new Set(sel); n.has(g.id) ? n.delete(g.id) : n.add(g.id); setSel(n) }} /></Td>
                  <Td><span className="font-mono text-xs font-bold">{g.grn_no}</span></Td>
                  <Td className="text-xs">{fmtDate(g.grn_date)}</Td>
                  <Td className="text-xs">{g.farms?.name}</Td>
                  <Td className="text-xs">
                    <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                      g.category === 'Medicine' ? 'bg-blue-100 text-blue-700' :
                      g.category === 'Vaccine' ? 'bg-purple-100 text-purple-700' :
                      g.category === 'Packaging' ? 'bg-orange-100 text-orange-700' :
                      g.category === 'Other' ? 'bg-gray-100 text-gray-600' :
                      'bg-green-100 text-green-700'
                    }`}>{g.category ?? 'Feed'}</span>
                  </Td>
                  <Td className="text-xs max-w-[120px] truncate">{g.parties?.name ?? '—'}</Td>
                  <Td className="text-xs max-w-[120px] truncate">{g.feed_ingredients?.name ?? g.item_name ?? '—'}</Td>
                  <Td className="text-xs text-gray-400">{g.invoice_no ?? '—'}</Td>
                  <Td right className="text-xs">{g.qty?.toLocaleString('en-IN') ?? '—'} {g.unit}</Td>
                  <Td right className="text-xs">{g.price_per_unit ? `₹${g.price_per_unit}` : '—'}</Td>
                  <Td right className="font-semibold text-xs">{g.total_amount ? inr(g.total_amount) : '—'}</Td>
                  <Td>
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(g)} className="p-1.5 rounded hover:bg-brand-50 text-gray-400 hover:text-brand-600 transition-colors" title="Edit"><Edit2 size={13}/></button>
                      <button onClick={() => printGRN({
                        id: g.id, grn_date: g.grn_date, grn_no: g.grn_no, invoice_no: g.invoice_no,
                        invoice_date: g.invoice_date, party_name: g.parties?.name ?? '—',
                        item_name: g.feed_ingredients?.name ?? g.item_name ?? '—',
                        qty: g.qty, unit: g.unit, price_per_unit: g.price_per_unit,
                        basic_amount: g.basic_amount, gst_pct: g.gst_pct, gst_amount: g.gst_amount,
                        total_amount: g.total_amount, cgst_amount: g.cgst_amount,
                        sgst_amount: g.sgst_amount, igst_amount: g.igst_amount,
                        party_gstin: g.party_gstin, vehicle_no: g.vehicle_no,
                        farm_name: g.farms?.name, is_rcm: g.is_rcm
                      })} className="p-1.5 rounded hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors" title="Print GRN"><Printer size={13}/></button>
                      <button onClick={() => setDelId(g.id)} className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors" title="Delete"><Trash2 size={13}/></button>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
            {grns.length > 0 && (
              <tfoot><tr className="bg-gray-50 font-semibold">
                <Td colSpan={8}>TOTAL ({grns.length} records)</Td>
                <Td right>{totalQty.toLocaleString('en-IN')} kg</Td>
                <Td right>—</Td>
                <Td right>{inr(totalVal)}</Td>
                <Td></Td>
              </tr></tfoot>
            )}
          </Table>
          {grns.length === 0 && <EmptyState icon={<Package size={32}/>} title={hasFilter ? 'No records match filters' : 'No GRN records'} action={!hasFilter ? <Button onClick={openAdd} icon={<Plus size={16}/>}>Add GRN</Button> : undefined} />}
        </Card>
      )}

      <Modal open={!!delId} onClose={() => setDelId(null)} title="Delete GRN Record"
        footer={<div className="flex gap-2 justify-end"><Button variant="secondary" onClick={() => setDelId(null)}>Cancel</Button><Button variant="danger" onClick={() => delId && deleteMut.mutate(delId)} loading={deleteMut.isPending}>Delete</Button></div>}>
        <p className="text-sm text-gray-600">Delete this GRN record? This cannot be undone.</p>
      </Modal>
      <Modal open={bulkDelConfirm} onClose={() => setBulkDelConfirm(false)} title="Delete Selected GRN Records"
        footer={<div className="flex gap-2 justify-end"><Button variant="secondary" onClick={() => setBulkDelConfirm(false)}>Cancel</Button><Button variant="danger" onClick={() => bulkDeleteMut.mutate(Array.from(sel))} loading={bulkDeleteMut.isPending}>Delete {sel.size} records</Button></div>}>
        <p className="text-sm text-gray-600">Delete <strong>{sel.size}</strong> selected GRN records? This cannot be undone.</p>
      </Modal>

      <Modal open={showForm} onClose={() => setShowForm(false)} title={editing ? 'Edit GRN' : 'Add GRN'} size="lg"
        footer={<><Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
          <Button loading={mut.isPending} onClick={() => mut.mutate()}>{editing ? 'Update' : 'Save'}</Button></>}>
        <div className="space-y-4">
          <FormRow cols={4}>
            <Input label="GRN No" required value={form.grn_no} onChange={e => s('grn_no', e.target.value)} />
            <DateInput label="GRN Date" required value={form.grn_date} onChange={e => s('grn_date', e.target.value)} />
            <Select label="Received At" required placeholder="— Select Site —" options={farmOptions}
              value={form.farm_id} onChange={e => s('farm_id', e.target.value)} />
            <Select label="Category" required options={categoryOptions}
              value={form.category} onChange={e => s('category', e.target.value)} />
          </FormRow>
          <FormRow>
            <div className="relative">
              <div className="flex items-end gap-1">
                <div className="flex-1">
                  <Select label="Supplier / Party" placeholder="— Select —" options={partyOptions}
                    value={form.party_id} onChange={e => s('party_id', e.target.value)} />
                </div>
                <QuickAddParty defaultType="supplier" onCreated={p => s('party_id', p.id)} />
              </div>
            </div>
            <Input label="Invoice No" value={form.invoice_no} onChange={e => s('invoice_no', e.target.value)} />
          </FormRow>
          {isFeed ? (
            <FormRow>
              <div className="relative">
                <div className="flex items-end gap-1">
                  <div className="flex-1">
                    <Select label="Ingredient" placeholder="— Select from master —" options={ingrOptions}
                      value={form.ingredient_id} onChange={e => { s('ingredient_id', e.target.value); fetchOpenPOs(e.target.value) }} />
                  </div>
                  <QuickAddIngredient onCreated={i => { s('ingredient_id', i.id); fetchOpenPOs(i.id) }} />
                </div>
              </div>
              <Input label="Item Name (if not in master)" value={form.item_name}
                onChange={e => s('item_name', e.target.value)} hint="Use if ingredient not in master" />
            </FormRow>
          ) : isMedOrVax ? (
            <FormRow cols={3}>
              <Select label={form.category === 'Vaccine' ? 'Vaccine' : 'Medicine'} placeholder="— Select from master —" options={medOptions}
                value={form.medicine_id} onChange={e => {
                  s('medicine_id', e.target.value)
                  const med = medicines?.find((m: any) => m.id === e.target.value)
                  if (med) { s('item_name', med.name); s('unit', med.unit ?? 'ml') }
                }} />
              <Input label="Batch No" value={form.batch_no} onChange={e => s('batch_no', e.target.value)} />
              <DateInput label="Expiry Date" value={form.expiry_date} onChange={e => s('expiry_date', e.target.value)} />
            </FormRow>
          ) : isChick ? (
            <FormRow cols={3}>
              <Select label="Flock *" required placeholder="— Select Flock —"
                options={flockOptions}
                value={form.flock_id} onChange={e => s('flock_id', e.target.value)} />
              <Input label="Hatchery / Item Name" value={form.item_name} onChange={e => s('item_name', e.target.value)} placeholder="e.g. Day-old broiler chicks" />
              <Select label="Unit" value={form.unit} onChange={e => s('unit', e.target.value)}
                options={[{value:'nos',label:'Nos (birds)'},{value:'kg',label:'kg'}]} />
            </FormRow>
          ) : (
            <FormRow>
              <Input label="Item Name" value={form.item_name} onChange={e => s('item_name', e.target.value)} />
              <Input label="Item Code / Part No" value={form.remarks} onChange={e => s('remarks', e.target.value)} />
            </FormRow>
          )}
          {isChick && form.flock_id && (parseFloat(form.qty) > 0) && (parseFloat(form.price_per_unit) > 0) && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-sm text-amber-800">
              ✓ Rate per chick: <strong>₹{(+(parseFloat(form.price_per_unit)).toFixed(2)).toLocaleString('en-IN')}</strong> — will auto-update Flock chick rate on save
            </div>
          )}
          {/* PO Alert */}
          {poLoading && <p className="text-xs text-blue-500">Checking open POs…</p>}
          {!poLoading && openPOs.length > 0 && (() => {
            const totalOrdered = openPOs.reduce((s: number, po: any) => s + (po.quantity ?? 0), 0)
            const grnQty = parseFloat(form.qty) || 0
            const vendors = [...new Set(openPOs.map((po: any) => po.vendor_name).filter(Boolean))]
            const latestDate = openPOs[0]?.po_date ?? ''
            return (
              <div className="space-y-2">
                <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-sm text-blue-800">
                  📋 Open PO: <strong>{totalOrdered.toLocaleString('en-IN')} kg</strong> ordered (Pending) from{' '}
                  {vendors.join(', ')}{latestDate ? ` (PO date: ${latestDate})` : ''}
                </div>
                {grnQty > totalOrdered && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-sm text-amber-800">
                    ⚠ Quantity exceeds PO balance by <strong>{(grnQty - totalOrdered).toLocaleString('en-IN')} kg</strong>
                  </div>
                )}
              </div>
            )
          })()}
          <Divider label="Quantity & Price" />
          <FormRow cols={4}>
            <Input label="Qty" type="number" step="0.001" value={form.qty} onChange={e => s('qty', e.target.value)} />
            <Select label="Unit" value={form.unit} onChange={e => s('unit', e.target.value)}
              options={[{value:'',label:'Select unit'},{value:'kg',label:'kg'},{value:'MT',label:'MT'},{value:'Quintal',label:'Quintal'},{value:'Ltr',label:'Ltr'},{value:'ML',label:'ML'},{value:'Gms',label:'Gms'},{value:'Dose',label:'Dose'},{value:'Nos',label:'Nos'},{value:'Box',label:'Box'},{value:'Mtrs',label:'Mtrs'}]}
            />
            <Input label="Bags / Packs" type="number" value={form.bags} onChange={e => s('bags', e.target.value)} />
            <Input label="Price/Unit (₹)" type="number" step="0.001" value={form.price_per_unit}
              onChange={e => s('price_per_unit', e.target.value)} />
          </FormRow>
          <FormRow cols={3}>
            <Input label="Basic Amount" type="number" step="0.01" value={form.basic_amount}
              onChange={e => s('basic_amount', e.target.value)}
              hint={basic > 0 ? `Auto: ${inr(basic)}` : undefined} />
            <Input label="GST %" type="number" step="0.01" value={form.gst_pct} onChange={e => s('gst_pct', e.target.value)} />
            <Input label="Total Amount" type="number" step="0.01" value={form.total_amount}
              onChange={e => s('total_amount', e.target.value)}
              hint={total > 0 ? `Auto: ${inr(total)}` : undefined} />
          </FormRow>
          <FormRow>
            <Input label="Vehicle No" value={form.vehicle_no} onChange={e => s('vehicle_no', e.target.value)} />
            <DateInput label="Invoice Date" value={form.invoice_date} onChange={e => s('invoice_date', e.target.value)} />
          </FormRow>
          <Input label="Remarks" value={form.remarks} onChange={e => s('remarks', e.target.value)} />
        </div>
      </Modal>
    </div>
  )
}

// ── FEED PRODUCTION ───────────────────────────────────────────────
export const FeedProduction: React.FC = () => {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)

  const { data: feedTypes } = useQuery({ queryKey: ['feed_types'], queryFn: async () => { const { data } = await supabase.from('feed_types').select('id,code,name').eq('is_active',true).order('sort_order'); return data ?? [] } })

  const { data: productions, isLoading } = useQuery({
    queryKey: ['feed_production'],
    queryFn: async () => {
      const { data } = await supabase.from('feed_production').select('*, feed_types(code,name)')
        .order('production_date', { ascending: false }).limit(100)
      return data ?? []
    }
  })

  const [form, setForm] = useState({ production_date: today(), feed_type_id: '', batch_no: '', quantity_kg: '', remarks: '' })
  const s = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const mut = useMutation({
    mutationFn: async () => {
      if (!form.feed_type_id || !form.quantity_kg) throw new Error('Feed type and quantity required')
      const { error } = await supabase.from('feed_production').insert({
        production_date: form.production_date, feed_type_id: form.feed_type_id,
        batch_no: form.batch_no || null, quantity_kg: parseFloat(form.quantity_kg),
        remarks: form.remarks || null
      })
      if (error) throw error
    },
    onSuccess: () => { toast.success('Batch recorded!'); qc.invalidateQueries({ queryKey: ['feed_production'] }); setShowForm(false) },
    onError: (e: any) => toast.error(e.message)
  })

  const ftOptions = feedTypes?.map((f: any) => ({ value: f.id, label: `${f.code} — ${f.name}` })) ?? []

  // Group by type for summary
  const byType = productions?.reduce((acc: any, p: any) => {
    const k = p.feed_types?.code ?? 'Unknown'
    acc[k] = (acc[k] ?? 0) + p.quantity_kg
    return acc
  }, {}) ?? {}

  return (
    <div className="space-y-5">
      <SectionHeader title="Feed Production"
        subtitle="Daily feed mill production batches"
        action={<Button icon={<Plus size={16}/>} onClick={() => setShowForm(true)}>Add Batch</Button>}
      />
      {Object.keys(byType).length > 0 && (
        <div className="grid grid-cols-4 gap-3">
          {Object.entries(byType).map(([type, qty]: any) => (
            <Card key={type} className="!p-3">
              <p className="text-xs text-gray-500 font-medium">{type}</p>
              <p className="text-sm font-bold text-gray-900 mt-1">{(qty/1000).toFixed(1)} MT</p>
              <p className="text-xs text-gray-400">{qty.toLocaleString('en-IN')} kg</p>
            </Card>
          ))}
        </div>
      )}
      {isLoading ? <Spinner /> : (
        <Card padding={false}>
          <Table>
            <thead><tr>
              <Th>Date</Th><Th>Feed Type</Th><Th>Batch No</Th>
              <Th right>Quantity (kg)</Th><Th right>MT</Th><Th>Remarks</Th>
            </tr></thead>
            <tbody>
              {productions?.map((p: any) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <Td className="text-xs">{fmtDate(p.production_date)}</Td>
                  <Td><Badge color="blue">{p.feed_types?.code}</Badge></Td>
                  <Td className="text-xs text-gray-400">{p.batch_no ?? '—'}</Td>
                  <Td right className="font-semibold">{p.quantity_kg?.toLocaleString('en-IN')}</Td>
                  <Td right className="text-xs text-gray-400">{(p.quantity_kg/1000).toFixed(2)}</Td>
                  <Td className="text-xs text-gray-400">{p.remarks ?? ''}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
          {productions?.length === 0 && <EmptyState icon={<Factory size={32}/>} title="No production records" action={<Button onClick={() => setShowForm(true)} icon={<Plus size={16}/>}>Add Batch</Button>} />}
        </Card>
      )}
      <Modal open={showForm} onClose={() => setShowForm(false)} title="Record Production Batch" size="md"
        footer={<><Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
          <Button loading={mut.isPending} onClick={() => mut.mutate()}>Save</Button></>}>
        <div className="space-y-4">
          <FormRow>
            <DateInput label="Production Date" required value={form.production_date} onChange={e => s('production_date', e.target.value)} />
            <Select label="Feed Type" required placeholder="— Select —" options={ftOptions}
              value={form.feed_type_id} onChange={e => s('feed_type_id', e.target.value)} />
          </FormRow>
          <FormRow>
            <Input label="Batch No" value={form.batch_no} onChange={e => s('batch_no', e.target.value)} />
            <Input label="Quantity (kg)" required type="number" step="0.01" value={form.quantity_kg} onChange={e => s('quantity_kg', e.target.value)} />
          </FormRow>
          <Input label="Remarks" value={form.remarks} onChange={e => s('remarks', e.target.value)} />
        </div>
      </Modal>
    </div>
  )
}

// ── FEED TRANSFER ────────────────────────────────────────────────
export const FeedTransfer: React.FC = () => {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)

  const { data: farms } = useQuery({ queryKey: ['farms'], queryFn: async () => { const { data } = await supabase.from('farms').select('id,name,code').eq('is_active',true).order('name'); return data ?? [] } })
  const { data: feedTypes } = useQuery({ queryKey: ['feed_types'], queryFn: async () => { const { data } = await supabase.from('feed_types').select('id,code,name').eq('is_active',true).order('sort_order'); return data ?? [] } })
  const { data: flocks } = useQuery({ queryKey: ['flocks_all'], queryFn: async () => { const { data } = await supabase.from('flocks').select('id,flock_no').neq('status','closed').order('flock_no'); return data ?? [] } })

  const { data: transfers, isLoading } = useQuery({
    queryKey: ['feed_transfers'],
    queryFn: async () => {
      const { data } = await supabase.from('feed_transfers')
        .select('*, from_farm:farms!from_farm_id(name), to_farm:farms!to_farm_id(name), feed_types(code,name), flocks(flock_no)')
        .order('transfer_date', { ascending: false }).limit(100)
      return data ?? []
    }
  })

  const [form, setForm] = useState({
    transfer_date: today(), from_farm_id: '', to_farm_id: '',
    feed_type_id: '', flock_id: '', quantity_kg: '', vehicle_no: '', remarks: ''
  })
  const s = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const mut = useMutation({
    mutationFn: async () => {
      if (!form.from_farm_id || !form.to_farm_id || !form.quantity_kg) throw new Error('From, to farms and quantity required')
      const { error } = await supabase.from('feed_transfers').insert({
        transfer_date: form.transfer_date, from_farm_id: form.from_farm_id,
        to_farm_id: form.to_farm_id, feed_type_id: form.feed_type_id || null,
        flock_id: form.flock_id || null, quantity_kg: parseFloat(form.quantity_kg),
        vehicle_no: form.vehicle_no || null, remarks: form.remarks || null
      })
      if (error) throw error
    },
    onSuccess: () => { toast.success('Transfer recorded!'); qc.invalidateQueries({ queryKey: ['feed_transfers'] }); setShowForm(false) },
    onError: (e: any) => toast.error(e.message)
  })

  const farmOptions = farms?.map((f: any) => ({ value: f.id, label: `${f.name} (${f.code})` })) ?? []
  const ftOptions = feedTypes?.map((f: any) => ({ value: f.id, label: `${f.code} — ${f.name}` })) ?? []
  const flockOptions = flocks?.map((f: any) => ({ value: f.id, label: `Flock ${f.flock_no}` })) ?? []

  return (
    <div className="space-y-5">
      <SectionHeader title="Feed Transfers"
        subtitle="Feed mill → farm dispatches"
        action={<Button icon={<Plus size={16}/>} onClick={() => setShowForm(true)}>Add Transfer</Button>}
      />
      {isLoading ? <Spinner /> : (
        <Card padding={false}>
          <Table>
            <thead><tr>
              <Th>Date</Th><Th>From</Th><Th></Th><Th>To</Th>
              <Th>Feed Type</Th><Th>Flock</Th>
              <Th right>Quantity (kg)</Th><Th>Vehicle</Th>
            </tr></thead>
            <tbody>
              {transfers?.map((t: any) => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <Td className="text-xs">{fmtDate(t.transfer_date)}</Td>
                  <Td className="text-xs font-medium">{t.from_farm?.name}</Td>
                  <Td><ArrowRight size={14} className="text-gray-300"/></Td>
                  <Td className="text-xs font-medium">{t.to_farm?.name}</Td>
                  <Td><Badge color="blue">{t.feed_types?.code ?? '—'}</Badge></Td>
                  <Td className="text-xs">{t.flocks?.flock_no ? `F-${t.flocks.flock_no}` : '—'}</Td>
                  <Td right className="font-semibold">{t.quantity_kg?.toLocaleString('en-IN')}</Td>
                  <Td className="text-xs text-gray-400">{t.vehicle_no ?? '—'}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
          {transfers?.length === 0 && <EmptyState icon={<ArrowRight size={32}/>} title="No transfer records" action={<Button onClick={() => setShowForm(true)} icon={<Plus size={16}/>}>Add Transfer</Button>} />}
        </Card>
      )}
      <Modal open={showForm} onClose={() => setShowForm(false)} title="Record Feed Transfer" size="md"
        footer={<><Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
          <Button loading={mut.isPending} onClick={() => mut.mutate()}>Save</Button></>}>
        <div className="space-y-4">
          <DateInput label="Transfer Date" required value={form.transfer_date} onChange={e => s('transfer_date', e.target.value)} />
          <FormRow>
            <Select label="From (Feed Mill)" required placeholder="— Select —" options={farmOptions}
              value={form.from_farm_id} onChange={e => s('from_farm_id', e.target.value)} />
            <Select label="To (Farm Site)" required placeholder="— Select —" options={farmOptions}
              value={form.to_farm_id} onChange={e => s('to_farm_id', e.target.value)} />
          </FormRow>
          <FormRow>
            <Select label="Feed Type" placeholder="— Select —" options={ftOptions}
              value={form.feed_type_id} onChange={e => s('feed_type_id', e.target.value)} />
            <Select label="For Flock" placeholder="— Select —" options={flockOptions}
              value={form.flock_id} onChange={e => s('flock_id', e.target.value)} />
          </FormRow>
          <FormRow>
            <Input label="Quantity (kg)" required type="number" step="0.01" value={form.quantity_kg} onChange={e => s('quantity_kg', e.target.value)} />
            <Input label="Vehicle No" value={form.vehicle_no} onChange={e => s('vehicle_no', e.target.value)} />
          </FormRow>
          <Input label="Remarks" value={form.remarks} onChange={e => s('remarks', e.target.value)} />
        </div>
      </Modal>
    </div>
  )
}

// ── FEED DASHBOARD ────────────────────────────────────────────────
export const FeedDashboard: React.FC = () => {
  const { data: grns } = useQuery({ queryKey: ['grns'], queryFn: async () => { const { data } = await supabase.from('grn').select('qty,total_amount,grn_date,feed_ingredients(code)').eq('category','Feed').order('grn_date',{ascending:false}).limit(100); return data ?? [] } })
  const { data: prods } = useQuery({ queryKey: ['feed_production'], queryFn: async () => { const { data } = await supabase.from('feed_production').select('quantity_kg,production_date,feed_types(code)').order('production_date',{ascending:false}).limit(100); return data ?? [] } })
  const { data: transfers } = useQuery({ queryKey: ['feed_transfers'], queryFn: async () => { const { data } = await supabase.from('feed_transfers').select('quantity_kg,transfer_date').order('transfer_date',{ascending:false}).limit(100); return data ?? [] } })

  // Stock alerts: replicate StockPage logic
  const { data: allIngredients } = useQuery({ queryKey: ['ingredients'], queryFn: async () => { const { data } = await supabase.from('feed_ingredients').select('id,name,short_name,code,unit').eq('is_active',true).order('code'); return data ?? [] } })
  const { data: allGrnQty } = useQuery({ queryKey: ['grn_stock'], queryFn: async () => { const { data } = await supabase.from('grn').select('ingredient_id,qty').eq('category','Feed'); return data ?? [] } })
  const { data: allProdUsage } = useQuery({ queryKey: ['prod_usage_stock'], queryFn: async () => { const { data } = await supabase.from('feed_production_ingredients').select('ingredient_id,qty_used_kg'); return data ?? [] } })

  const LOW_STOCK_THRESHOLD = 500 // kg
  const stockAlerts = React.useMemo(() => {
    if (!allIngredients || !allGrnQty || !allProdUsage) return null
    const inMap: Record<string, number> = {}
    const outMap: Record<string, number> = {}
    for (const g of allGrnQty) { if (g.ingredient_id) inMap[g.ingredient_id] = (inMap[g.ingredient_id] ?? 0) + (g.qty ?? 0) }
    for (const u of allProdUsage) { if (u.ingredient_id) outMap[u.ingredient_id] = (outMap[u.ingredient_id] ?? 0) + (u.qty_used_kg ?? 0) }
    return allIngredients
      .map((ing: any) => ({ ...ing, balance: (inMap[ing.id] ?? 0) - (outMap[ing.id] ?? 0) }))
      .filter((ing: any) => ing.balance < LOW_STOCK_THRESHOLD)
  }, [allIngredients, allGrnQty, allProdUsage])

  return (
    <div className="space-y-5">
      <SectionHeader title="Feed Mill Dashboard" subtitle="Production, stock and transfer overview" />

      {/* Low Stock Alerts */}
      {stockAlerts != null && (
        stockAlerts.length === 0 ? (
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
            <span className="text-green-600 font-semibold text-sm">✓ All ingredient stocks are sufficient (≥500 kg)</span>
          </div>
        ) : (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            <p className="text-red-700 font-semibold text-sm mb-2">⚠ Low Stock Alerts — {stockAlerts.length} ingredient{stockAlerts.length !== 1 ? 's' : ''} below 500 kg threshold</p>
            <div className="flex flex-wrap gap-2">
              {stockAlerts.map((ing: any) => (
                <span key={ing.id} className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${ing.balance <= 0 ? 'bg-red-200 text-red-800' : 'bg-amber-100 text-amber-800'}`}>
                  {ing.short_name ?? ing.name}: {Math.round(ing.balance).toLocaleString('en-IN')} {ing.unit}
                </span>
              ))}
            </div>
          </div>
        )
      )}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard title="Total Purchased" value={inr(grns?.reduce((s:number,g:any)=>s+(g.total_amount??0),0)??0)} subtitle="All GRN value" icon={<Package size={18}/>} color="text-blue-600" />
        <StatCard title="Total Produced" value={`${((prods?.reduce((s:number,p:any)=>s+p.quantity_kg,0)??0)/1000).toFixed(1)} MT`} subtitle="All feed batches" icon={<Factory size={18}/>} color="text-brand-600" />
        <StatCard title="Total Transferred" value={`${((transfers?.reduce((s:number,t:any)=>s+t.quantity_kg,0)??0)/1000).toFixed(1)} MT`} subtitle="To farm sites" icon={<ArrowRight size={18}/>} color="text-green-600" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card>
          <CardHeader title="Recent GRN" action={<a href="/feed/grn" className="text-sm text-brand-600">View all</a>} />
          <div className="space-y-2">
            {grns?.slice(0,5).map((g:any,i:number) => (
              <div key={i} className="flex justify-between py-1.5 border-b border-gray-50 last:border-0 text-sm">
                <span className="text-gray-600">{g.feed_ingredients?.code ?? 'Item'} • {fmtDate(g.grn_date)}</span>
                <span className="font-medium">{g.qty?.toLocaleString('en-IN')} kg</span>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <CardHeader title="Recent Production" action={<a href="/feed/production" className="text-sm text-brand-600">View all</a>} />
          <div className="space-y-2">
            {prods?.slice(0,5).map((p:any,i:number) => (
              <div key={i} className="flex justify-between py-1.5 border-b border-gray-50 last:border-0 text-sm">
                <span className="text-gray-600">{p.feed_types?.code ?? '—'} • {fmtDate(p.production_date)}</span>
                <span className="font-medium">{p.quantity_kg?.toLocaleString('en-IN')} kg</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
