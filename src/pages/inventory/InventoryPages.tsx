import React, { useState, useMemo, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { inr, fmtDate, today } from '@/lib/utils'
import { useAuth, can } from '@/lib/auth'
import { parseFile, downloadXlsxTemplate } from '@/lib/parseFile'
import {
  Card, SectionHeader, Spinner, Table, Th, Td, Button, Input, Select, Modal,
  Badge, StatCard, EmptyState, DateInput,
} from '@/components/ui'
import {
  Boxes, Package, ArrowDownCircle, ArrowUpCircle, SlidersHorizontal,
  ListTree, Plus, Pencil, Trash2, Download, Upload, AlertTriangle, Search, BarChart3,
} from 'lucide-react'
import * as XLSX from 'xlsx'
import toast from 'react-hot-toast'

// ── constants ──────────────────────────────────────────────────────
const CATEGORIES_DEFAULT = ['Feed', 'Medicine', 'Vaccine', 'Packaging', 'Chemical', 'Spares', 'Other']
const ADJ_TYPES  = ['Wastage', 'Damage', 'Correction', 'Found', 'Transfer Out', 'Transfer In']
const UNITS_DEFAULT      = ['kg','MT','Quintal','Ltr','ML','Gms','Dose','Nos','Box','Mtrs','Bag']

// ── DB-backed masters (fall back to defaults if tables not yet seeded) ──
function useCategoryList() {
  const { data } = useQuery({
    queryKey: ['categories_master'],
    queryFn: async () => {
      const { data } = await supabase.from('categories_master').select('name').order('sort_order').order('name')
      return (data ?? []).map((r: any) => r.name as string)
    },
    staleTime: 5 * 60 * 1000,
  })
  return data?.length ? data : CATEGORIES_DEFAULT
}
function useUnitList() {
  const { data } = useQuery({
    queryKey: ['units_master'],
    queryFn: async () => {
      const { data } = await supabase.from('units_master').select('name').order('sort_order').order('name')
      return (data ?? []).map((r: any) => r.name as string)
    },
    staleTime: 5 * 60 * 1000,
  })
  return data?.length ? data : UNITS_DEFAULT
}

const norm = (s?: string | null) => (s ?? '').trim().toLowerCase()
const cleanNum = (v: any): number | null => {
  if (v == null || v === '') return null
  const n = parseFloat(String(v).replace(/[₹?,\s]/g, '').trim())
  return isNaN(n) ? null : n
}

type Tab = 'Stock Status' | 'Opening Stock' | 'Adjustments' | 'Item Categories' | 'Stock Ledger' | 'Closing Stock Report'

// ════════════════════════════════════════════════════════════════════
// SHARED DATA HOOKS
// ════════════════════════════════════════════════════════════════════
function useGrn() {
  return useQuery({
    queryKey: ['inv_grn'],
    queryFn: async () => {
      let all: any[] = [], from = 0
      while (true) {
        const { data } = await supabase.from('grn')
          .select('item_name,qty,unit,grn_date,price_per_unit')
          .order('grn_date', { ascending: true }).range(from, from + 999)
        if (!data || !data.length) break
        all = all.concat(data); if (data.length < 1000) break; from += 1000
      }
      return all
    },
  })
}
function useProductionUsage() {
  return useQuery({
    queryKey: ['inv_prod_usage'],
    queryFn: async () => {
      const { data } = await supabase.from('feed_production_ingredients')
        .select('ingredient_name,quantity_kg,feed_production_log(production_date)')
        .limit(50000)
      return (data ?? []).map((r: any) => ({
        item_name: r.ingredient_name,
        qty: Number(r.quantity_kg ?? 0),
        date: r.feed_production_log?.production_date ?? null,
      }))
    },
  })
}
function useAdjustments() {
  return useQuery({
    queryKey: ['inv_adjustments'],
    queryFn: async () => {
      const { data } = await supabase.from('feed_stock_adjustments').select('*')
        .order('adjustment_date', { ascending: false })
      return data ?? []
    },
  })
}
function useItemMeta() {
  return useQuery({
    queryKey: ['inv_item_meta'],
    queryFn: async () => {
      const { data } = await supabase.from('stock_item_meta').select('*').order('item_name')
      return data ?? []
    },
  })
}

// ════════════════════════════════════════════════════════════════════
// MAIN
// ════════════════════════════════════════════════════════════════════
export const InventoryPage: React.FC = () => {
  const [tab, setTab] = useState<Tab>('Stock Status')
  const TABS: { id: Tab; icon: any }[] = [
    { id: 'Stock Status',        icon: <Boxes size={14}/> },
    { id: 'Opening Stock',       icon: <ArrowDownCircle size={14}/> },
    { id: 'Adjustments',         icon: <SlidersHorizontal size={14}/> },
    { id: 'Item Categories',     icon: <ListTree size={14}/> },
    { id: 'Stock Ledger',        icon: <ListTree size={14}/> },
    { id: 'Closing Stock Report',icon: <BarChart3 size={14}/> },
  ]
  return (
    <div className="space-y-5">
      <SectionHeader title="All Items Inventory" subtitle="Every GRN item across all categories — Feed, Medicine, Vaccine, Packaging, Spares, Other. Use Category filter to narrow down." />
      <div className="flex gap-1 border-b border-gray-200 overflow-x-auto">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors
              ${tab === t.id ? 'border-brand-600 text-brand-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t.icon}{t.id}
          </button>
        ))}
      </div>
      {tab === 'Stock Status'         && <StockStatusTab />}
      {tab === 'Opening Stock'        && <MovementTab kind="Opening" />}
      {tab === 'Adjustments'          && <MovementTab kind="Adjustment" />}
      {tab === 'Item Categories'      && <CategoriesTab />}
      {tab === 'Stock Ledger'         && <LedgerTab />}
      {tab === 'Closing Stock Report' && <ClosingStockReportTab />}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════
// SHARED: compute per-item stock as-on a date
// ════════════════════════════════════════════════════════════════════
function useStockRows(asOf: string) {
  const grn = useGrn()
  const prod = useProductionUsage()
  const adj = useAdjustments()
  const meta = useItemMeta()

  const rows = useMemo(() => {
    const m: Record<string, any> = {}
    const ensure = (name: string) => {
      const k = norm(name)
      if (!m[k]) m[k] = { key: k, item_name: name, opening: 0, received: 0, used: 0, adjusted: 0, rate: 0, lastDate: '', unit: '' }
      return m[k]
    }
    const within = (d?: string | null) => !d || !asOf || d <= asOf

    for (const g of grn.data ?? []) {
      if (!g.item_name) continue
      const r = ensure(g.item_name)
      if (within(g.grn_date)) {
        r.received += Number(g.qty ?? 0)
        if (g.grn_date >= r.lastDate) { r.rate = Number(g.price_per_unit ?? 0); r.lastDate = g.grn_date; if (g.unit) r.unit = g.unit }
      }
    }
    for (const u of prod.data ?? []) {
      if (!u.item_name) continue
      const r = ensure(u.item_name)
      if (within(u.date)) r.used += Number(u.qty ?? 0)
    }
    for (const a of adj.data ?? []) {
      if (!a.ingredient_name) continue
      const r = ensure(a.ingredient_name)
      if (within(a.adjustment_date)) {
        if (a.adjustment_type === 'Opening') r.opening += Number(a.adjustment_kg ?? 0)
        else r.adjusted += Number(a.adjustment_kg ?? 0)
        if (a.unit && !r.unit) r.unit = a.unit
      }
    }
    const metaMap: Record<string, any> = {}
    for (const mm of meta.data ?? []) metaMap[mm.item_key] = mm

    return Object.values(m).map((r: any) => {
      const meta = metaMap[r.key]
      const closing = r.opening + r.received + r.adjusted - r.used
      return {
        ...r,
        category: meta?.category ?? '',
        unit: meta?.unit || r.unit || 'kg',
        reorder_level: Number(meta?.reorder_level ?? 0),
        closing,
        value: closing * (r.rate || 0),
      }
    }).sort((a, b) => a.item_name.localeCompare(b.item_name))
  }, [grn.data, prod.data, adj.data, meta.data, asOf])

  return { rows, isLoading: grn.isLoading || prod.isLoading || adj.isLoading || meta.isLoading }
}

// ════════════════════════════════════════════════════════════════════
// TAB 1: STOCK STATUS (automatic, computed)
// ════════════════════════════════════════════════════════════════════
const StockStatusTab: React.FC = () => {
  const CATEGORIES = useCategoryList()
  const [asOf, setAsOf] = useState(today())
  const [cat, setCat] = useState('')
  const [q, setQ] = useState('')
  const [onlyLow, setOnlyLow] = useState(false)
  const { rows, isLoading } = useStockRows(asOf)

  const filtered = useMemo(() => rows.filter(r => {
    if (cat && r.category !== cat) return false
    if (q && !r.item_name.toLowerCase().includes(q.toLowerCase())) return false
    if (onlyLow && !(r.reorder_level > 0 && r.closing <= r.reorder_level)) return false
    return true
  }), [rows, cat, q, onlyLow])

  const totalValue = filtered.reduce((s, r) => s + (r.value > 0 ? r.value : 0), 0)
  const lowCount = rows.filter(r => r.reorder_level > 0 && r.closing <= r.reorder_level).length

  const exportCsv = () => {
    const headers = ['item_name','category','unit','opening','received','used','adjusted','closing','rate','value']
    const csv = [headers, ...filtered.map(r => [r.item_name, r.category, r.unit,
      Math.round(r.opening), Math.round(r.received), Math.round(r.used), Math.round(r.adjusted),
      Math.round(r.closing), r.rate, Math.round(r.value)])]
      .map(row => row.map(v => `"${String(v ?? '').replace(/"/g,'""')}"`).join(',')).join('\n')
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], {type:'text/csv'}))
    a.download = `stock_status_${asOf}.csv`; a.click()
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard title="Items Tracked" value={String(filtered.length)} icon={<Package size={18}/>} />
        <StatCard title="In Stock" value={String(filtered.filter(r => r.closing > 0).length)} icon={<Boxes size={18}/>} color="text-green-600" />
        <StatCard title="Low / Reorder" value={String(lowCount)} icon={<AlertTriangle size={18}/>} color="text-red-600" />
        <StatCard title="Stock Value" value={inr(totalValue)} icon={<Package size={18}/>} color="text-blue-600" />
      </div>

      <Card>
        <div className="flex flex-wrap gap-3 items-end">
          <DateInput label="Stock as on" value={asOf} onChange={e => setAsOf(e.target.value)} className="w-40" />
          <Select label="Category" value={cat} onChange={e => setCat(e.target.value)}
            options={[{value:'',label:'All categories'}, ...CATEGORIES.map(c => ({value:c,label:c}))]} className="w-44" />
          <div className="flex-1 min-w-[180px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Search item</label>
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={q} onChange={e => setQ(e.target.value)} placeholder="Item name…"
                className="w-full border border-gray-300 rounded-lg pl-8 pr-3 py-2 text-sm focus:ring-1 focus:ring-brand-500 focus:border-brand-500" />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-600 pb-2">
            <input type="checkbox" checked={onlyLow} onChange={e => setOnlyLow(e.target.checked)} /> Only low stock
          </label>
          <Button size="sm" variant="outline" icon={<Download size={14}/>} onClick={exportCsv}>Export</Button>
        </div>
      </Card>

      <Card padding={false}>
        {isLoading ? <Spinner /> : filtered.length === 0 ? <EmptyState icon={<Boxes size={28}/>} title="No stock items" subtitle="Import GRN or add opening stock to populate inventory" /> : (
          <div className="overflow-x-auto">
            <Table>
              <thead><tr>
                <Th>Item</Th><Th>Category</Th><Th>Unit</Th>
                <Th right>Opening</Th><Th right>Received</Th><Th right>Used</Th><Th right>Adjust</Th>
                <Th right>Closing</Th><Th right>Rate</Th><Th right>Value</Th>
              </tr></thead>
              <tbody>
                {filtered.map(r => {
                  const low = r.reorder_level > 0 && r.closing <= r.reorder_level
                  return (
                    <tr key={r.key} className={`text-sm ${low ? 'bg-red-50' : 'hover:bg-gray-50'}`}>
                      <Td className="font-medium max-w-[260px] truncate" >{r.item_name}</Td>
                      <Td>{r.category ? <Badge color="blue">{r.category}</Badge> : <span className="text-gray-300 text-xs">unset</span>}</Td>
                      <Td className="text-xs">{r.unit}</Td>
                      <Td right className="text-xs text-gray-500">{Math.round(r.opening).toLocaleString('en-IN')}</Td>
                      <Td right className="text-xs text-green-600">{Math.round(r.received).toLocaleString('en-IN')}</Td>
                      <Td right className="text-xs text-orange-600">{Math.round(r.used).toLocaleString('en-IN')}</Td>
                      <Td right className="text-xs text-gray-500">{r.adjusted ? Math.round(r.adjusted).toLocaleString('en-IN') : '—'}</Td>
                      <Td right>
                        <Badge color={r.closing > 0 ? (low ? 'yellow' : 'green') : 'red'}>{Math.round(r.closing).toLocaleString('en-IN')}</Badge>
                      </Td>
                      <Td right className="text-xs">{r.rate > 0 ? r.rate.toFixed(2) : '—'}</Td>
                      <Td right className="font-medium text-xs">{r.value > 0 ? inr(r.value) : '—'}</Td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot><tr className="bg-gray-50 font-semibold"><Td colSpan={9}>TOTAL STOCK VALUE</Td><Td right>{inr(totalValue)}</Td></tr></tfoot>
            </Table>
          </div>
        )}
      </Card>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════
// TAB 2 & 3: OPENING STOCK + ADJUSTMENTS (manual CRUD, share one table)
// ════════════════════════════════════════════════════════════════════
const MovementTab: React.FC<{ kind: 'Opening' | 'Adjustment' }> = ({ kind }) => {
  const UNITS = useUnitList()
  const qc = useQueryClient()
  const { profile } = useAuth()
  const role = profile?.role
  const canEdit = can.enterData(role)
  const canDel = can.delete(role)
  const importRef = useRef<HTMLInputElement>(null)

  const isOpening = kind === 'Opening'
  const { data: rows = [], isLoading } = useAdjustments()
  const list = useMemo(() => rows.filter((r: any) => isOpening ? r.adjustment_type === 'Opening' : r.adjustment_type !== 'Opening'), [rows, isOpening])

  const [q, setQ] = useState('')
  const filtered = useMemo(() => list.filter((r: any) => !q || r.ingredient_name?.toLowerCase().includes(q.toLowerCase())), [list, q])

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const blank = { adjustment_date: today(), ingredient_name: '', adjustment_kg: '', adjustment_type: isOpening ? 'Opening' : 'Wastage', unit: 'kg', rate: '', remarks: '' }
  const [form, setForm] = useState<any>(blank)
  const s = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }))

  const [sel, setSel] = useState<Set<string>>(new Set())
  const [delId, setDelId] = useState<string | null>(null)
  const [bulkDel, setBulkDel] = useState(false)

  const save = useMutation({
    mutationFn: async () => {
      if (!form.ingredient_name.trim()) throw new Error('Item name required')
      const payload = {
        adjustment_date: form.adjustment_date,
        ingredient_name: form.ingredient_name.trim(),
        adjustment_kg: cleanNum(form.adjustment_kg) ?? 0,
        adjustment_type: form.adjustment_type,
        unit: form.unit || null,
        rate: cleanNum(form.rate),
        remarks: form.remarks || null,
      }
      if (editing) { const { error } = await supabase.from('feed_stock_adjustments').update(payload).eq('id', editing.id); if (error) throw error }
      else { const { error } = await supabase.from('feed_stock_adjustments').insert(payload); if (error) throw error }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['inv_adjustments'] }); setOpen(false); toast.success('Saved') },
    onError: (e: any) => toast.error(e.message),
  })

  const del = useMutation({
    mutationFn: async (ids: string[]) => { const { error } = await supabase.from('feed_stock_adjustments').delete().in('id', ids); if (error) throw error },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['inv_adjustments'] }); setSel(new Set()); setDelId(null); setBulkDel(false); toast.success('Deleted') },
    onError: (e: any) => toast.error(e.message),
  })

  const openAdd = () => { setEditing(null); setForm(blank); setOpen(true) }
  const openEdit = (r: any) => {
    setEditing(r)
    setForm({ adjustment_date: r.adjustment_date ?? today(), ingredient_name: r.ingredient_name ?? '', adjustment_kg: String(r.adjustment_kg ?? ''), adjustment_type: r.adjustment_type ?? (isOpening ? 'Opening' : 'Wastage'), unit: r.unit ?? 'kg', rate: r.rate != null ? String(r.rate) : '', remarks: r.remarks ?? '' })
    setOpen(true)
  }

  const toggle = (id: string) => setSel(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  const allSel = filtered.length > 0 && filtered.every((r: any) => sel.has(r.id))

  const downloadTemplate = () => downloadXlsxTemplate(
    isOpening ? 'opening_stock_template.xlsx' : 'stock_adjustments_template.xlsx',
    ['date','item_name','qty','type','unit','rate','remarks'],
    isOpening ? ['2026-04-01','Maize',50000,'Opening','kg',20.3,'opening balance']
              : ['2026-04-15','Maize',-500,'Wastage','kg',20.3,'spillage'])

  const handleImport = async (file: File) => {
    try {
      const { headers, rows } = await parseFile(file)
      const idx = (names: string[]) => headers.findIndex(h => names.includes(h))
      const ci = { date: idx(['date','adjustment_date']), name: idx(['item_name','ingredient_name','item','name']), qty: idx(['qty','quantity','adjustment_kg','kg']), type: idx(['type','adjustment_type']), unit: idx(['unit']), rate: idx(['rate','price']), remarks: idx(['remarks','notes']) }
      if (ci.name < 0 || ci.qty < 0) { toast.error('Need at least item_name and qty columns'); return }
      const payload = rows.filter(r => r[ci.name]?.trim()).map(r => ({
        adjustment_date: r[ci.date] || today(),
        ingredient_name: r[ci.name].trim(),
        adjustment_kg: cleanNum(r[ci.qty]) ?? 0,
        adjustment_type: ci.type >= 0 && r[ci.type] ? r[ci.type] : (isOpening ? 'Opening' : 'Correction'),
        unit: ci.unit >= 0 ? (r[ci.unit] || 'kg') : 'kg',
        rate: ci.rate >= 0 ? cleanNum(r[ci.rate]) : null,
        remarks: ci.remarks >= 0 ? (r[ci.remarks] || null) : null,
      }))
      if (!payload.length) { toast.error('No valid rows'); return }
      const { error } = await supabase.from('feed_stock_adjustments').insert(payload)
      if (error) throw error
      qc.invalidateQueries({ queryKey: ['inv_adjustments'] })
      toast.success(`Imported ${payload.length} rows`)
    } catch (e: any) { toast.error(e.message) }
    finally { if (importRef.current) importRef.current.value = '' }
  }

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-wrap gap-2 items-center">
          <p className="text-sm text-gray-500 flex-1">
            {isOpening ? 'One-time opening balances per item (counted as stock-in).' : 'Manual +/- corrections: wastage, damage, physical-count fixes, transfers. Use a negative qty to reduce stock.'}
          </p>
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search item…"
            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:ring-1 focus:ring-brand-500 w-48" />
          <Button size="sm" variant="outline" icon={<Download size={14}/>} onClick={downloadTemplate}>Template</Button>
          {canEdit && <Button size="sm" variant="outline" icon={<Upload size={14}/>} onClick={() => importRef.current?.click()}>Import</Button>}
          <input ref={importRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleImport(f) }} />
          {canEdit && <Button size="sm" icon={<Plus size={14}/>} onClick={openAdd}>Add {isOpening ? 'Opening' : 'Adjustment'}</Button>}
        </div>
      </Card>

      {sel.size > 0 && (
        <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
          <span className="text-sm font-medium text-blue-700">{sel.size} selected</span>
          {canDel && <button onClick={() => setBulkDel(true)} className="text-sm text-red-600 hover:underline font-medium">Delete selected</button>}
          <button onClick={() => setSel(new Set())} className="text-xs text-gray-500 hover:underline ml-auto">Clear</button>
        </div>
      )}

      <Card padding={false}>
        {isLoading ? <Spinner /> : filtered.length === 0 ? <EmptyState title={`No ${isOpening ? 'opening stock' : 'adjustments'} yet`} /> : (
          <div className="overflow-x-auto">
            <Table>
              <thead><tr>
                <Th><input type="checkbox" checked={allSel} onChange={() => setSel(allSel ? new Set() : new Set(filtered.map((r: any) => r.id)))} /></Th>
                <Th>Date</Th><Th>Item</Th><Th>Type</Th><Th right>Qty</Th><Th>Unit</Th><Th right>Rate</Th><Th>Remarks</Th><Th></Th>
              </tr></thead>
              <tbody>
                {filtered.map((r: any) => (
                  <tr key={r.id} className={`text-sm ${sel.has(r.id) ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
                    <Td><input type="checkbox" checked={sel.has(r.id)} onChange={() => toggle(r.id)} /></Td>
                    <Td className="text-xs">{fmtDate(r.adjustment_date)}</Td>
                    <Td className="font-medium max-w-[240px] truncate">{r.ingredient_name}</Td>
                    <Td><Badge color={r.adjustment_type === 'Opening' ? 'blue' : Number(r.adjustment_kg) < 0 ? 'red' : 'green'}>{r.adjustment_type}</Badge></Td>
                    <Td right className={Number(r.adjustment_kg) < 0 ? 'text-red-600' : ''}>{Number(r.adjustment_kg).toLocaleString('en-IN')}</Td>
                    <Td className="text-xs">{r.unit ?? '—'}</Td>
                    <Td right className="text-xs">{r.rate != null ? Number(r.rate).toFixed(2) : '—'}</Td>
                    <Td className="text-xs text-gray-400 max-w-[160px] truncate">{r.remarks ?? '—'}</Td>
                    <Td>
                      <div className="flex gap-1">
                        {canEdit && <button onClick={() => openEdit(r)} className="p-1 text-blue-400 hover:text-blue-600"><Pencil size={13}/></button>}
                        {canDel && <button onClick={() => setDelId(r.id)} className="p-1 text-red-400 hover:text-red-600"><Trash2 size={13}/></button>}
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title={`${editing ? 'Edit' : 'Add'} ${isOpening ? 'Opening Stock' : 'Adjustment'}`}
        footer={<div className="flex gap-2 justify-end"><Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={() => save.mutate()} loading={save.isPending}>Save</Button></div>}>
        <div className="grid grid-cols-2 gap-3">
          <DateInput label="Date" value={form.adjustment_date} onChange={e => s('adjustment_date', e.target.value)} />
          <Input label="Item Name" value={form.ingredient_name} onChange={e => s('ingredient_name', e.target.value)} />
          <Input label={isOpening ? 'Opening Qty' : 'Qty (− to reduce)'} value={form.adjustment_kg} onChange={e => s('adjustment_kg', e.target.value)} />
          {isOpening
            ? <Select label="Unit" value={form.unit} onChange={e => s('unit', e.target.value)} options={UNITS.map(u => ({ value: u, label: u }))} />
            : <Select label="Type" value={form.adjustment_type} onChange={e => s('adjustment_type', e.target.value)} options={ADJ_TYPES.map(t => ({ value: t, label: t }))} />}
          {!isOpening && <Select label="Unit" value={form.unit} onChange={e => s('unit', e.target.value)} options={UNITS.map(u => ({ value: u, label: u }))} />}
          <Input label="Rate (₹/unit)" value={form.rate} onChange={e => s('rate', e.target.value)} />
          <Input label="Remarks" value={form.remarks} onChange={e => s('remarks', e.target.value)} className="col-span-2" />
        </div>
      </Modal>

      <Modal open={!!delId} onClose={() => setDelId(null)} title="Delete row?"
        footer={<div className="flex gap-2 justify-end"><Button variant="secondary" onClick={() => setDelId(null)}>Cancel</Button><Button variant="danger" onClick={() => delId && del.mutate([delId])} loading={del.isPending}>Delete</Button></div>}>
        <p className="text-sm text-gray-600">This will permanently remove the row.</p>
      </Modal>
      <Modal open={bulkDel} onClose={() => setBulkDel(false)} title={`Delete ${sel.size} rows?`}
        footer={<div className="flex gap-2 justify-end"><Button variant="secondary" onClick={() => setBulkDel(false)}>Cancel</Button><Button variant="danger" onClick={() => del.mutate(Array.from(sel))} loading={del.isPending}>Delete {sel.size}</Button></div>}>
        <p className="text-sm text-gray-600">Permanently remove the selected rows.</p>
      </Modal>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════
// TAB 4: ITEM CATEGORIES (classify items, reorder levels)
// ════════════════════════════════════════════════════════════════════
const CategoriesTab: React.FC = () => {
  const CATEGORIES = useCategoryList()
  const UNITS = useUnitList()
  const qc = useQueryClient()
  const { profile } = useAuth()
  const role = profile?.role
  const canEdit = can.enterData(role)
  const canDel = can.delete(role)

  const { data: meta = [], isLoading } = useItemMeta()
  const grn = useGrn()
  const [q, setQ] = useState('')
  const [catFilter, setCatFilter] = useState('')

  // All distinct item names from GRN, for the "pull items" action
  const grnItems = useMemo(() => {
    const set = new Map<string, string>()
    for (const g of grn.data ?? []) if (g.item_name) set.set(norm(g.item_name), g.item_name)
    return set
  }, [grn.data])
  const metaKeys = useMemo(() => new Set(meta.map((m: any) => m.item_key)), [meta])
  const unclassified = useMemo(() => Array.from(grnItems.entries()).filter(([k]) => !metaKeys.has(k)), [grnItems, metaKeys])

  const filtered = useMemo(() => meta.filter((m: any) =>
    (!q || m.item_name?.toLowerCase().includes(q.toLowerCase())) && (!catFilter || m.category === catFilter)
  ), [meta, q, catFilter])

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const blank = { item_name: '', category: 'Other', unit: 'kg', reorder_level: '', is_active: true }
  const [form, setForm] = useState<any>(blank)
  const s = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }))
  const [delId, setDelId] = useState<string | null>(null)

  const save = useMutation({
    mutationFn: async () => {
      if (!form.item_name.trim()) throw new Error('Item name required')
      const payload = {
        item_key: norm(form.item_name),
        item_name: form.item_name.trim(),
        category: form.category,
        unit: form.unit || 'kg',
        reorder_level: cleanNum(form.reorder_level) ?? 0,
        is_active: form.is_active,
        updated_at: new Date().toISOString(),
      }
      const { error } = await supabase.from('stock_item_meta').upsert(payload, { onConflict: 'item_key' })
      if (error) throw error
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['inv_item_meta'] }); setOpen(false); toast.success('Saved') },
    onError: (e: any) => toast.error(e.message),
  })

  const pullItems = useMutation({
    mutationFn: async () => {
      const payload = unclassified.map(([key, name]) => ({ item_key: key, item_name: name, category: 'Other', unit: 'kg', reorder_level: 0, is_active: true }))
      if (!payload.length) throw new Error('No new items to add')
      const { error } = await supabase.from('stock_item_meta').upsert(payload, { onConflict: 'item_key' })
      if (error) throw error
      return payload.length
    },
    onSuccess: (n) => { qc.invalidateQueries({ queryKey: ['inv_item_meta'] }); toast.success(`Added ${n} items — now set their category`) },
    onError: (e: any) => toast.error(e.message),
  })

  const del = useMutation({
    mutationFn: async (key: string) => { const { error } = await supabase.from('stock_item_meta').delete().eq('item_key', key); if (error) throw error },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['inv_item_meta'] }); setDelId(null); toast.success('Deleted') },
    onError: (e: any) => toast.error(e.message),
  })

  const openAdd = () => { setEditing(null); setForm(blank); setOpen(true) }
  const openEdit = (m: any) => { setEditing(m); setForm({ item_name: m.item_name, category: m.category ?? 'Other', unit: m.unit ?? 'kg', reorder_level: String(m.reorder_level ?? ''), is_active: m.is_active ?? true }); setOpen(true) }

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-wrap gap-2 items-center">
          <p className="text-sm text-gray-500 flex-1">Classify every item and set a reorder level for low-stock alerts.</p>
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search item…"
            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:ring-1 focus:ring-brand-500 w-48" />
          <Select value={catFilter} onChange={e => setCatFilter(e.target.value)}
            options={[{value:'',label:'All categories'}, ...CATEGORIES.map(c => ({value:c,label:c}))]} />
          {canEdit && unclassified.length > 0 && (
            <Button size="sm" variant="outline" onClick={() => pullItems.mutate()} loading={pullItems.isPending}>
              Pull {unclassified.length} new item(s) from GRN
            </Button>
          )}
          {canEdit && <Button size="sm" icon={<Plus size={14}/>} onClick={openAdd}>Add Item</Button>}
        </div>
      </Card>

      <Card padding={false}>
        {isLoading ? <Spinner /> : filtered.length === 0 ? (
          <EmptyState icon={<ListTree size={28}/>} title="No classified items yet"
            subtitle={unclassified.length > 0 ? `Click "Pull ${unclassified.length} new item(s) from GRN" above to start` : 'Add items manually'} />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <thead><tr><Th>Item</Th><Th>Category</Th><Th>Unit</Th><Th right>Reorder Level</Th><Th>Active</Th><Th></Th></tr></thead>
              <tbody>
                {filtered.map((m: any) => (
                  <tr key={m.item_key} className="text-sm hover:bg-gray-50">
                    <Td className="font-medium max-w-[280px] truncate">{m.item_name}</Td>
                    <Td><Badge color="blue">{m.category}</Badge></Td>
                    <Td className="text-xs">{m.unit}</Td>
                    <Td right className="text-xs">{Number(m.reorder_level) > 0 ? Number(m.reorder_level).toLocaleString('en-IN') : '—'}</Td>
                    <Td>{m.is_active ? <Badge color="green">Yes</Badge> : <Badge color="red">No</Badge>}</Td>
                    <Td>
                      <div className="flex gap-1">
                        {canEdit && <button onClick={() => openEdit(m)} className="p-1 text-blue-400 hover:text-blue-600"><Pencil size={13}/></button>}
                        {canDel && <button onClick={() => setDelId(m.item_key)} className="p-1 text-red-400 hover:text-red-600"><Trash2 size={13}/></button>}
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Edit Item' : 'Add Item'}
        footer={<div className="flex gap-2 justify-end"><Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={() => save.mutate()} loading={save.isPending}>Save</Button></div>}>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Item Name" value={form.item_name} onChange={e => s('item_name', e.target.value)} className="col-span-2" disabled={!!editing} />
          <Select label="Category" value={form.category} onChange={e => s('category', e.target.value)} options={CATEGORIES.map(c => ({ value: c, label: c }))} />
          <Select label="Unit" value={form.unit} onChange={e => s('unit', e.target.value)} options={UNITS.map(u => ({ value: u, label: u }))} />
          <Input label="Reorder Level" value={form.reorder_level} onChange={e => s('reorder_level', e.target.value)} hint="Alert when stock ≤ this" />
          <Select label="Active" value={form.is_active ? 'yes' : 'no'} onChange={e => s('is_active', e.target.value === 'yes')} options={[{value:'yes',label:'Yes'},{value:'no',label:'No'}]} />
        </div>
      </Modal>

      <Modal open={!!delId} onClose={() => setDelId(null)} title="Delete item classification?"
        footer={<div className="flex gap-2 justify-end"><Button variant="secondary" onClick={() => setDelId(null)}>Cancel</Button><Button variant="danger" onClick={() => delId && del.mutate(delId)} loading={del.isPending}>Delete</Button></div>}>
        <p className="text-sm text-gray-600">Removes only the category/reorder info — stock movements are unaffected.</p>
      </Modal>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════
// TAB 5: STOCK LEDGER (per-item movement timeline)
// ════════════════════════════════════════════════════════════════════
const LedgerTab: React.FC = () => {
  const grn = useGrn()
  const prod = useProductionUsage()
  const adj = useAdjustments()
  const [item, setItem] = useState('')

  const items = useMemo(() => {
    const set = new Map<string, string>()
    for (const g of grn.data ?? []) if (g.item_name) set.set(norm(g.item_name), g.item_name)
    for (const a of adj.data ?? []) if (a.ingredient_name) set.set(norm(a.ingredient_name), a.ingredient_name)
    return Array.from(set.values()).sort()
  }, [grn.data, adj.data])

  const moves = useMemo(() => {
    if (!item) return []
    const k = norm(item)
    const out: any[] = []
    for (const g of grn.data ?? []) if (norm(g.item_name) === k) out.push({ date: g.grn_date, type: 'GRN Received', qty: Number(g.qty ?? 0), rate: g.price_per_unit })
    for (const u of prod.data ?? []) if (norm(u.item_name) === k) out.push({ date: u.date, type: 'Production Used', qty: -Number(u.qty ?? 0) })
    for (const a of adj.data ?? []) if (norm(a.ingredient_name) === k) out.push({ date: a.adjustment_date, type: a.adjustment_type, qty: Number(a.adjustment_kg ?? 0), rate: a.rate, remarks: a.remarks })
    out.sort((x, y) => (x.date ?? '').localeCompare(y.date ?? ''))
    let bal = 0
    return out.map(m => { bal += m.qty; return { ...m, balance: bal } })
  }, [item, grn.data, prod.data, adj.data])

  const loading = grn.isLoading || prod.isLoading || adj.isLoading

  return (
    <div className="space-y-4">
      <Card>
        <div className="max-w-md">
          <label className="block text-sm font-medium text-gray-700 mb-1">Select Item</label>
          <select value={item} onChange={e => setItem(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-brand-500">
            <option value="">— Select an item —</option>
            {items.map(i => <option key={i} value={i}>{i}</option>)}
          </select>
        </div>
      </Card>

      {item && (
        <Card padding={false}>
          {loading ? <Spinner /> : moves.length === 0 ? <EmptyState title="No movements for this item" /> : (
            <div className="overflow-x-auto">
              <Table>
                <thead><tr><Th>Date</Th><Th>Movement</Th><Th right>In/Out</Th><Th right>Running Balance</Th><Th right>Rate</Th><Th>Remarks</Th></tr></thead>
                <tbody>
                  {moves.map((m, i) => (
                    <tr key={i} className="text-sm hover:bg-gray-50">
                      <Td className="text-xs">{m.date ? fmtDate(m.date) : '—'}</Td>
                      <Td><Badge color={m.type === 'Opening' ? 'blue' : m.qty >= 0 ? 'green' : m.type === 'Production Used' ? 'yellow' : 'red'}>{m.type}</Badge></Td>
                      <Td right className={m.qty < 0 ? 'text-red-600' : 'text-green-700'}>{m.qty > 0 ? '+' : ''}{m.qty.toLocaleString('en-IN')}</Td>
                      <Td right className="font-semibold">{Math.round(m.balance).toLocaleString('en-IN')}</Td>
                      <Td right className="text-xs">{m.rate != null ? Number(m.rate).toFixed(2) : '—'}</Td>
                      <Td className="text-xs text-gray-400 max-w-[180px] truncate">{m.remarks ?? '—'}</Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card>
      )}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════
// TAB 6: CLOSING STOCK REPORT (period-end accountant report)
// ════════════════════════════════════════════════════════════════════
const PERIOD_OPTIONS = (() => {
  const opts: { value: string; label: string }[] = []
  const now = new Date()
  for (let y = 2023; y <= now.getFullYear() + 1; y++) {
    // FY quarters: Apr, Jun, Sep, Dec, Mar
    const fyStart = y
    for (const [m, label] of [[6,'Q1 (Jun)'],[9,'Q2 (Sep)'],[12,'Q3 (Dec)']] as [number,string][]) {
      const d = `${fyStart}-${String(m).padStart(2,'0')}-30`
      if (d <= now.toISOString().slice(0,10)) opts.push({ value: d, label: `FY${fyStart}-${String(fyStart+1).slice(2)} ${label}` })
    }
    const marEnd = `${fyStart+1}-03-31`
    if (marEnd <= now.toISOString().slice(0,10)) opts.push({ value: marEnd, label: `FY${fyStart}-${String(fyStart+1).slice(2)} Year End (Mar)` })
  }
  return opts.reverse()
})()

const ClosingStockReportTab: React.FC = () => {
  const CATEGORIES = useCategoryList()
  const defaultDate = today()
  const [asOf, setAsOf] = useState(defaultDate)
  const [cat, setCat] = useState('')
  const [q, setQ] = useState('')
  const { rows, isLoading } = useStockRows(asOf)

  const filtered = useMemo(() => rows.filter(r => {
    if (cat && r.category !== cat) return false
    if (q && !r.item_name.toLowerCase().includes(q.toLowerCase())) return false
    return r.closing !== 0 || r.received > 0 // only show items that have had activity
  }), [rows, cat, q])

  const totalOpeningValue  = filtered.reduce((s, r) => s + r.opening * (r.rate || 0), 0)
  const totalReceivedValue = filtered.reduce((s, r) => s + r.received * (r.rate || 0), 0)
  const totalClosingValue  = filtered.reduce((s, r) => s + (r.closing > 0 ? r.closing * (r.rate || 0) : 0), 0)

  const exportXlsx = () => {
    const data = [
      ['Item Name','Category','Unit','Opening Qty','Received','Used','Adjusted','Closing Qty','Rate (Rs)','Closing Value (Rs)'],
      ...filtered.map(r => [
        r.item_name, r.category || 'Other', r.unit,
        Math.round(r.opening), Math.round(r.received), Math.round(r.used),
        Math.round(r.adjusted), Math.round(r.closing), r.rate > 0 ? Number(r.rate.toFixed(2)) : '',
        r.closing > 0 && r.rate > 0 ? Math.round(r.closing * r.rate) : 0,
      ]),
      ['','','','','','','','TOTAL','', Math.round(totalClosingValue)],
    ]
    const ws = XLSX.utils.aoa_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, `Stock_${asOf}`)
    XLSX.writeFile(wb, `ClosingStock_${asOf}.xlsx`)
  }

  const byCategory = useMemo(() => {
    const m: Record<string, number> = {}
    for (const r of filtered) {
      if (r.closing <= 0) continue
      const cat = r.category || 'Other'
      m[cat] = (m[cat] ?? 0) + r.closing * (r.rate || 0)
    }
    return Object.entries(m).sort((a, b) => b[1] - a[1])
  }, [filtered])

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <div className="flex flex-wrap gap-3 items-end">
          <DateInput label="Stock as on (Period End)" value={asOf} onChange={e => setAsOf(e.target.value)} className="w-48" />
          <Select label="Category" value={cat} onChange={e => setCat(e.target.value)}
            options={[{value:'',label:'All Categories'}, ...CATEGORIES.map(c => ({value:c,label:c}))]} className="w-44" />
          <div className="flex-1 min-w-[180px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={q} onChange={e => setQ(e.target.value)} placeholder="Item name…"
                className="w-full border border-gray-300 rounded-lg pl-8 pr-3 py-2 text-sm focus:ring-1 focus:ring-brand-500" />
            </div>
          </div>
          <Button size="sm" variant="secondary" icon={<Download size={14}/>} onClick={exportXlsx}>Export Excel</Button>
        </div>
      </Card>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard title="Items in Report" value={String(filtered.length)} icon={<Package size={18}/>} />
        <StatCard title="Items with Stock" value={String(filtered.filter(r => r.closing > 0).length)} icon={<Boxes size={18}/>} color="text-green-600" />
        <StatCard title="Closing Stock Value" value={inr(totalClosingValue)} icon={<BarChart3 size={18}/>} color="text-blue-600" />
        <StatCard title="Categories" value={String(byCategory.length)} icon={<ListTree size={18}/>} />
      </div>

      {/* Category breakdown */}
      {byCategory.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {byCategory.map(([cat, val]) => (
            <Card key={cat} className="py-2">
              <p className="text-xs text-gray-500">{cat}</p>
              <p className="font-bold text-sm text-gray-800">{inr(val)}</p>
            </Card>
          ))}
        </div>
      )}

      {/* Main report table */}
      <Card padding={false}>
        {isLoading ? <Spinner /> : filtered.length === 0 ? (
          <EmptyState icon={<Boxes size={28}/>} title="No stock data" subtitle="Import GRN data and set opening stock to generate this report" />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <thead>
                <tr>
                  <Th>Item Name</Th><Th>Category</Th><Th>Unit</Th>
                  <Th right>Opening</Th><Th right>Received</Th><Th right>Used</Th><Th right>Adjusted</Th>
                  <Th right>Closing Qty</Th><Th right>Rate (Rs)</Th><Th right>Closing Value</Th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => (
                  <tr key={r.key} className={`text-sm ${r.closing <= 0 ? 'bg-red-50' : 'hover:bg-gray-50'}`}>
                    <Td className="font-medium max-w-[240px] truncate">{r.item_name}</Td>
                    <Td className="text-xs">{r.category ? <Badge color="blue">{r.category}</Badge> : <span className="text-gray-300">—</span>}</Td>
                    <Td className="text-xs">{r.unit}</Td>
                    <Td right className="text-xs text-gray-500">{Math.round(r.opening).toLocaleString('en-IN')}</Td>
                    <Td right className="text-xs text-green-700">{Math.round(r.received).toLocaleString('en-IN')}</Td>
                    <Td right className="text-xs text-orange-600">{Math.round(r.used).toLocaleString('en-IN')}</Td>
                    <Td right className="text-xs text-gray-500">{r.adjusted ? Math.round(r.adjusted).toLocaleString('en-IN') : '—'}</Td>
                    <Td right>
                      <Badge color={r.closing > 0 ? 'green' : 'red'}>{Math.round(r.closing).toLocaleString('en-IN')}</Badge>
                    </Td>
                    <Td right className="text-xs">{r.rate > 0 ? r.rate.toFixed(2) : '—'}</Td>
                    <Td right className="font-semibold text-blue-700">{r.closing > 0 && r.rate > 0 ? inr(r.closing * r.rate) : '—'}</Td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-blue-50 font-bold text-sm">
                  <Td colSpan={9} className="text-blue-800">TOTAL CLOSING STOCK VALUE (as on {fmtDate(asOf)})</Td>
                  <Td right className="text-blue-800 text-base">{inr(totalClosingValue)}</Td>
                </tr>
              </tfoot>
            </Table>
          </div>
        )}
      </Card>
    </div>
  )
}
