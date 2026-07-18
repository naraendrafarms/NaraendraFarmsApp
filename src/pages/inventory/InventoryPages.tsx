import React, { useState, useMemo, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { inr, fmtDate, today } from '@/lib/utils'
import { useAuth, can } from '@/lib/auth'
import { parseFile, downloadXlsxTemplate } from '@/lib/parseFile'
import {
  Card, SectionHeader, Spinner, Table, Th, Td, Button, Input, Select, Modal,
  Badge, StatCard, EmptyState, DateInput, SearchableSelect,
} from '@/components/ui'
import {
  Boxes, Package, SlidersHorizontal,
  ListTree, Plus, Pencil, Trash2, Download, Upload, AlertTriangle, Search, BarChart3,
} from 'lucide-react'
import * as XLSX from 'xlsx'
import toast from 'react-hot-toast'
import { useConfigValues, useConfigOptions } from '@/hooks/useConfigOptions'

// ── constants ──────────────────────────────────────────────────────
const CATEGORIES_DEFAULT = ['Feed Ingredient', 'Medicine', 'Vaccine', 'Packaging', 'Equipment', 'Spares', 'Chemical', 'Other']
// ── DB-backed masters ──
function useCategoryList() {
  const opts = useConfigOptions('item_category')
  return opts.length ? opts.map(o => o.value) : CATEGORIES_DEFAULT
}
function useUnitList() {
  const opts = useConfigOptions('unit')
  return opts.length ? opts.map(o => o.value) : ['kg','Ltr','Nos','Dose','Box','Bag']
}
function useAdjTypeList() {
  const opts = useConfigOptions('adjustment_type')
  return opts.length ? opts.map(o => o.value) : ['Opening Stock','Wastage','Damage','Correction','Found','Transfer Out','Transfer In']
}

// Discrete/count units round to whole numbers fine (you can't have 8.3
// bottles) — but weight/volume units (kg, Ltr, Gms, ml, etc.) are
// routinely used in small fractional amounts (e.g. 90g = 0.09 kg,
// 8.115 kg). Rounding those to the nearest integer previously showed
// 8.115 kg as "8" and 0.09 kg as "0" — silently hiding real usage for
// exactly the low-dose medicines/vaccines this matters most for.
const DISCRETE_UNITS = new Set(['nos', 'dose', 'box', 'bag', 'bags', 'pcs', 'pieces', 'units'])
const formatQty = (n: number, unit?: string) => {
  const isDiscrete = DISCRETE_UNITS.has((unit ?? '').trim().toLowerCase())
  return isDiscrete
    ? Math.round(n).toLocaleString('en-IN')
    : n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 3 })
}
const roundQty = (n: number, unit?: string) => {
  const isDiscrete = DISCRETE_UNITS.has((unit ?? '').trim().toLowerCase())
  return isDiscrete ? Math.round(n) : Math.round(n * 1000) / 1000
}

const norm = (s?: string | null) => (s ?? '').trim().toLowerCase()
const cleanNum = (v: any): number | null => {
  if (v == null || v === '') return null
  const n = parseFloat(String(v).replace(/[₹?,\s]/g, '').trim())
  return isNaN(n) ? null : n
}

type Tab = 'Stock Balance' | 'Adjustments' | 'Stock Ledger' | 'Closing Stock Report' | 'Consumption Report'

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
  const [tab, setTab] = useState<Tab>('Stock Balance')
  const TABS: { id: Tab; icon: any }[] = [
    { id: 'Stock Balance',        icon: <Boxes size={14}/> },
    { id: 'Adjustments',          icon: <SlidersHorizontal size={14}/> },
    { id: 'Stock Ledger',         icon: <ListTree size={14}/> },
    { id: 'Closing Stock Report', icon: <BarChart3 size={14}/> },
    { id: 'Consumption Report',   icon: <BarChart3 size={14}/> },
  ]
  return (
    <div className="space-y-5">
      <SectionHeader title="Inventory" subtitle="Stock balance per item — pulled from Items Master. All receipts (GRN), usage (Feed/Medicine), and adjustments are reflected automatically." />
      <div className="flex gap-1 border-b border-gray-200 overflow-x-auto">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors
              ${tab === t.id ? 'border-brand-600 text-brand-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t.icon}{t.id}
          </button>
        ))}
      </div>
      {tab === 'Stock Balance'        && <StockStatusTab />}
      {tab === 'Adjustments'          && <AdjustmentsTab />}
      {tab === 'Stock Ledger'         && <LedgerTab />}
      {tab === 'Closing Stock Report' && <ClosingStockReportTab />}
      {tab === 'Consumption Report'   && <ConsumptionReportTab />}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════
// SHARED: compute per-item stock as-on a date from stock_ledger
// ════════════════════════════════════════════════════════════════════
const OUT_TYPES = new Set(['production_out','medicine_out','adjustment_out','transfer_out','dispatch_out'])

function useStockRows(asOf: string) {
  // Item master is the source of truth for names, category, unit, reorder_level
  const { data: itemsMaster, isLoading: itemsLoading } = useQuery({
    queryKey: ['items_master_inv'],
    queryFn: async () => {
      const { data } = await supabase.from('items').select('id,name,code,category,unit,reorder_level,is_active').order('name')
      return data ?? []
    },
    staleTime: 5 * 60 * 1000,
  })

  // Every other name each item is known by (Intent/PO/GRN/Medicine wording)
  // — lets the search boxes below find an item by any of its names, not
  // just its canonical Items Master name.
  const { data: aliases } = useQuery({
    queryKey: ['item_aliases_all'],
    queryFn: async () => {
      const { data, error } = await supabase.from('item_aliases').select('item_id,alias')
      if (error) throw error
      return data ?? []
    },
    staleTime: 60 * 1000,
  })

  const { data: slData, isLoading: slLoading } = useQuery({
    queryKey: ['sl_all', asOf],
    queryFn: async () => {
      let all: any[] = [], from = 0
      while (true) {
        let q = supabase.from('stock_ledger')
          .select('item_id,item_name,txn_type,qty,unit,unit_price,txn_date')
          .order('txn_date').range(from, from + 999)
        if (asOf) q = q.lte('txn_date', asOf)
        const { data } = await q
        if (!data || !data.length) break
        all = all.concat(data); if (data.length < 1000) break; from += 1000
      }
      return all
    },
  })

  const rows = useMemo(() => {
    // Seed the map with ALL active items from Items Master (show even if balance=0)
    const m: Record<string, any> = {}
    for (const item of itemsMaster ?? []) {
      m[item.id] = {
        key: item.id,
        item_name: item.name,
        item_code: item.code ?? '',
        category: item.category ?? '',
        unit: item.unit ?? '',
        reorder_level: Number(item.reorder_level ?? 0),
        is_active: item.is_active,
        opening: 0, received: 0, used: 0, adjusted: 0, rate: 0, lastDate: '',
      }
    }

    // A stock_ledger/production row with item_id = NULL (legacy entry never
    // linked to Items Master) used to fork its own name-keyed row even when
    // it really was the same item — norm() only lowercases+trims, so e.g.
    // "Toxfin 360 Dry" vs "Toxfin360 Dry" (a real case) never matched. This
    // stripped-to-alphanumeric key matches the item/alias regardless of
    // internal spacing/punctuation, folding the row into the real item.
    const looseKey = (s?: string | null) => (s ?? '').toLowerCase().replace(/[^a-z0-9]/g, '')
    const looseNameToId: Record<string, string> = {}
    for (const item of itemsMaster ?? []) looseNameToId[looseKey(item.name)] = item.id
    for (const a of aliases ?? []) if (!looseNameToId[looseKey(a.alias)]) looseNameToId[looseKey(a.alias)] = a.item_id

    // Aggregate stock_ledger movements
    for (const r of slData ?? []) {
      const key = r.item_id ?? looseNameToId[looseKey(r.item_name)] ?? norm(r.item_name)
      if (!m[key]) {
        // Item exists in ledger but not in items master (legacy GRN)
        m[key] = {
          key, item_name: r.item_name, item_code: '', category: '',
          unit: r.unit ?? '', reorder_level: 0, is_active: true,
          opening: 0, received: 0, used: 0, adjusted: 0, rate: 0, lastDate: '',
        }
      }
      const row = m[key]
      const qty = Number(r.qty ?? 0)
      if (OUT_TYPES.has(r.txn_type)) {
        row.used += qty
      } else if (r.txn_type === 'opening') {
        row.opening += qty
      } else if (r.txn_type === 'adjustment_in') {
        row.adjusted += qty
      } else {
        row.received += qty
      }
      // Rate = latest dated unit_price from ANY inward txn (opening, GRN, adjustment),
      // so opening-stock rate/value shows even with no GRN purchase.
      if (!OUT_TYPES.has(r.txn_type) && r.unit_price != null && (r.txn_date ?? '') >= row.lastDate) {
        row.rate = Number(r.unit_price ?? 0); row.lastDate = r.txn_date ?? ''
      }
      // Prefer items master unit; fall back to ledger unit
      if (!row.unit && r.unit) row.unit = r.unit
    }

    const aliasMap: Record<string, string[]> = {}
    for (const a of aliases ?? []) (aliasMap[a.item_id] ??= []).push(a.alias)

    return Object.values(m).map((r: any) => {
      const closing = r.opening + r.received + r.adjusted - r.used
      const searchText = `${r.item_name} ${(aliasMap[r.key] ?? []).join(' ')}`.toLowerCase()
      return { ...r, closing, value: closing * (r.rate || 0), searchText }
    }).sort((a, b) => (a.category || 'zzz').localeCompare(b.category || 'zzz') || a.item_name.localeCompare(b.item_name))
  }, [itemsMaster, slData, aliases, asOf])

  return { rows, isLoading: itemsLoading || slLoading }
}

// ════════════════════════════════════════════════════════════════════
// TAB 1: STOCK BALANCE (from Items Master + Stock Ledger)
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
    if (q && !(r.searchText ?? r.item_name.toLowerCase()).includes(q.toLowerCase())) return false
    if (onlyLow && !(r.reorder_level > 0 && r.closing <= r.reorder_level)) return false
    return true
  }), [rows, cat, q, onlyLow])

  const totalValue = filtered.reduce((s, r) => s + (r.value > 0 ? r.value : 0), 0)
  const lowCount = rows.filter(r => r.reorder_level > 0 && r.closing <= r.reorder_level).length

  const exportCsv = () => {
    const headers = ['item_name','category','unit','opening','received','used','adjusted','closing','rate','value']
    const csv = [headers, ...filtered.map(r => [r.item_name, r.category, r.unit,
      roundQty(r.opening, r.unit), roundQty(r.received, r.unit), roundQty(r.used, r.unit), roundQty(r.adjusted, r.unit),
      roundQty(r.closing, r.unit), r.rate, Math.round(r.value)])]
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
        {isLoading ? <Spinner /> : filtered.length === 0 ? <EmptyState icon={<Boxes size={28}/>} title="No items found" subtitle="Add items in Purchase → Items Master first. Stock balance is computed automatically from GRN receipts and usage." /> : (
          <div className="overflow-x-auto">
            <Table>
              <thead><tr>
                <Th>Code</Th><Th>Item</Th><Th>Category</Th><Th>Unit</Th>
                <Th right>Opening</Th><Th right>Received</Th><Th right>Used</Th><Th right>Adjust</Th>
                <Th right>Closing</Th><Th right>Rate</Th><Th right>Value</Th>
              </tr></thead>
              <tbody>
                {filtered.map(r => {
                  const low = r.reorder_level > 0 && r.closing <= r.reorder_level
                  return (
                    <tr key={r.key} className={`text-sm ${low ? 'bg-red-50' : 'hover:bg-gray-50'}`}>
                      <Td className="text-xs text-gray-400">{r.item_code || '—'}</Td>
                      <Td className="font-medium max-w-[220px] truncate">{r.item_name}</Td>
                      <Td>{r.category ? <Badge color="blue">{r.category}</Badge> : <span className="text-gray-300 text-xs">—</span>}</Td>
                      <Td className="text-xs">{r.unit}</Td>
                      <Td right className="text-xs text-gray-500">{formatQty(r.opening, r.unit)}</Td>
                      <Td right className="text-xs text-green-600">{formatQty(r.received, r.unit)}</Td>
                      <Td right className="text-xs text-orange-600">{formatQty(r.used, r.unit)}</Td>
                      <Td right className="text-xs text-gray-500">{r.adjusted ? formatQty(r.adjusted, r.unit) : '—'}</Td>
                      <Td right>
                        <Badge color={r.closing > 0 ? (low ? 'yellow' : 'green') : 'red'}>{formatQty(r.closing, r.unit)}</Badge>
                      </Td>
                      <Td right className="text-xs">{r.rate > 0 ? r.rate.toFixed(2) : '—'}</Td>
                      <Td right className="font-medium text-xs">{r.value > 0 ? inr(r.value) : '—'}</Td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot><tr className="bg-gray-50 font-semibold"><Td colSpan={10}>TOTAL STOCK VALUE</Td><Td right>{inr(totalValue)}</Td></tr></tfoot>
            </Table>
          </div>
        )}
      </Card>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════
// TAB 2: ADJUSTMENTS (Opening Stock + manual corrections)
// ════════════════════════════════════════════════════════════════════
const AdjustmentsTab: React.FC = () => {
  const UNITS    = useUnitList()
  const ADJ_TYPES = useAdjTypeList()
  const qc = useQueryClient()
  const { profile } = useAuth()
  const role = profile?.role
  const canEdit = can.enterData(role)
  const canDel = can.delete(role)
  const importRef = useRef<HTMLInputElement>(null)

  const { data: rows = [], isLoading } = useAdjustments()
  // Items Master = source of item names for the picker
  const { data: itemsMaster = [] } = useQuery({
    queryKey: ['items_master_adj'],
    queryFn: async () => {
      const { data } = await supabase.from('items').select('name,unit,is_active').eq('is_active', true).order('name')
      return data ?? []
    }
  })
  const [typeFilter, setTypeFilter] = useState('')
  const [q, setQ] = useState('')
  const filtered = useMemo(() => (rows as any[]).filter((r: any) => {
    if (typeFilter && r.adjustment_type !== typeFilter) return false
    if (q && !r.ingredient_name?.toLowerCase().includes(q.toLowerCase())) return false
    return true
  }), [rows, typeFilter, q])

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const blank = { adjustment_date: today(), ingredient_name: '', adjustment_kg: '', adjustment_type: 'Opening Stock', unit: 'kg', rate: '', remarks: '' }
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
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['inv_adjustments'] }); qc.invalidateQueries({ queryKey: ['sl_all'] }); setOpen(false); toast.success('Saved') },
    onError: (e: any) => toast.error(e.message),
  })

  const del = useMutation({
    mutationFn: async (ids: string[]) => { const { error } = await supabase.from('feed_stock_adjustments').delete().in('id', ids); if (error) throw error },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['inv_adjustments'] }); qc.invalidateQueries({ queryKey: ['sl_all'] }); setSel(new Set()); setDelId(null); setBulkDel(false); toast.success('Deleted') },
    onError: (e: any) => toast.error(e.message),
  })

  const openAdd = () => { setEditing(null); setForm(blank); setOpen(true) }
  const openEdit = (r: any) => {
    setEditing(r)
    setForm({ adjustment_date: r.adjustment_date ?? today(), ingredient_name: r.ingredient_name ?? '', adjustment_kg: String(r.adjustment_kg ?? ''), adjustment_type: r.adjustment_type ?? 'Opening Stock', unit: r.unit ?? 'kg', rate: r.rate != null ? String(r.rate) : '', remarks: r.remarks ?? '' })
    setOpen(true)
  }

  const toggle = (id: string) => setSel(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  const allSel = filtered.length > 0 && filtered.every((r: any) => sel.has(r.id))

  const downloadTemplate = () => downloadXlsxTemplate('stock_adjustments_template.xlsx',
    ['date','item_name','qty','type','unit','rate','remarks'],
    ['2026-04-01','Maize',50000,'Opening Stock','kg',20.3,'opening balance'])

  const handleImport = async (file: File) => {
    try {
      const { headers, rows } = await parseFile(file)
      const idx = (names: string[]) => headers.findIndex(h => names.includes(h))
      const ci = { date: idx(['date','adjustment_date']), name: idx(['item_name','ingredient_name','item','name']), qty: idx(['qty','quantity','adjustment_kg','kg']), type: idx(['type','adjustment_type']), unit: idx(['unit']), rate: idx(['rate','price']), remarks: idx(['remarks','notes']) }
      if (ci.name < 0 || ci.qty < 0) { toast.error('Need at least item_name and qty columns'); return }
      const payload = (rows as any[]).filter(r => r[ci.name]?.trim()).map((r: any) => ({
        adjustment_date: r[ci.date] || today(),
        ingredient_name: r[ci.name].trim(),
        adjustment_kg: cleanNum(r[ci.qty]) ?? 0,
        adjustment_type: ci.type >= 0 && r[ci.type] ? r[ci.type] : 'Opening Stock',
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
          <p className="text-sm text-gray-500 flex-1">Opening stock entries and manual corrections (wastage, damage, found, transfers). Use "Opening Stock" type for initial balances.</p>
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:ring-1 focus:ring-brand-500">
            <option value="">All types</option>
            {ADJ_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search item…"
            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:ring-1 focus:ring-brand-500 w-48" />
          <Button size="sm" variant="outline" icon={<Download size={14}/>} onClick={downloadTemplate}>Template</Button>
          {canEdit && <Button size="sm" variant="outline" icon={<Upload size={14}/>} onClick={() => importRef.current?.click()}>Import</Button>}
          <input ref={importRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleImport(f) }} />
          {canEdit && <Button size="sm" icon={<Plus size={14}/>} onClick={openAdd}>Add Entry</Button>}
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
        {isLoading ? <Spinner /> : filtered.length === 0 ? <EmptyState title="No entries yet" subtitle="Add opening stock or manual adjustments here" /> : (
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
                    <Td><Badge color={r.adjustment_type === 'Opening Stock' || r.adjustment_type === 'Opening' ? 'blue' : Number(r.adjustment_kg) < 0 ? 'red' : 'green'}>{r.adjustment_type}</Badge></Td>
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

      <Modal open={open} onClose={() => setOpen(false)} title={`${editing ? 'Edit' : 'Add'} Stock Entry`}
        footer={<div className="flex gap-2 justify-end"><Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={() => save.mutate()} loading={save.isPending}>Save</Button></div>}>
        <div className="grid grid-cols-2 gap-3">
          <DateInput label="Date" value={form.adjustment_date} onChange={e => s('adjustment_date', e.target.value)} />
          <SearchableSelect label="Item Name" required placeholder="Search item from master…"
            options={(itemsMaster as any[]).map((it: any) => ({ value: it.name, label: it.name }))}
            value={form.ingredient_name}
            onChange={(v) => { const it = (itemsMaster as any[]).find((x: any) => x.name === v); setForm((p: any) => ({ ...p, ingredient_name: v, unit: it?.unit ?? p.unit })) }} />
          <Select label="Type" value={form.adjustment_type} onChange={e => s('adjustment_type', e.target.value)} options={ADJ_TYPES.map(t => ({ value: t, label: t }))} />
          <Select label="Unit" value={form.unit} onChange={e => s('unit', e.target.value)} options={UNITS.map(u => ({ value: u, label: u }))} />
          <Input label="Qty (negative to reduce)" value={form.adjustment_kg} onChange={e => s('adjustment_kg', e.target.value)} />
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
const TXN_LABEL: Record<string, string> = {
  grn_in:         'GRN Received',
  production_out: 'Production Used',
  medicine_out:   'Medicine Used',
  adjustment_in:  'Adjustment In',
  adjustment_out: 'Adjustment Out',
  transfer_in:    'Transfer In',
  transfer_out:   'Transfer Out',
  opening:        'Opening Stock',
  dispatch_out:   'Dispatch Used',
}
const TXN_IS_OUT = new Set(['production_out','medicine_out','adjustment_out','transfer_out','dispatch_out'])

const LedgerTab: React.FC = () => {
  const [search, setSearch] = useState('')
  const [selectedItem, setSelectedItem] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate]     = useState('')

  const { data: allItems, isLoading: loadingItems } = useQuery({
    queryKey: ['sl_items'],
    queryFn: async () => {
      const { data } = await supabase.from('stock_ledger').select('item_id,item_name').order('item_name')
      const seen = new Set<string>()
      const out: { id: string; name: string }[] = []
      for (const r of data ?? []) {
        const key = r.item_id ?? r.item_name
        if (!seen.has(key)) { seen.add(key); out.push({ id: r.item_id ?? r.item_name, name: r.item_name }) }
      }
      return out.sort((a,b) => a.name.localeCompare(b.name))
    },
    staleTime: 2 * 60 * 1000,
  })
  // Every other name each item is known by, so searching by an
  // Intent/PO/GRN/Medicine name finds its ledger here too.
  const { data: aliasesLedger } = useQuery({
    queryKey: ['item_aliases_all'],
    queryFn: async () => { const { data } = await supabase.from('item_aliases').select('item_id,alias'); return data ?? [] },
    staleTime: 60 * 1000,
  })

  const filtered = useMemo(() => {
    const aliasMap: Record<string, string[]> = {}
    for (const a of aliasesLedger ?? []) (aliasMap[a.item_id] ??= []).push(a.alias)
    if (!search) return allItems ?? []
    const s = search.toLowerCase()
    return (allItems ?? []).filter(i =>
      `${i.name} ${(aliasMap[i.id] ?? []).join(' ')}`.toLowerCase().includes(s))
  }, [allItems, aliasesLedger, search])

  const { data: moves, isLoading: loadingMoves } = useQuery({
    queryKey: ['sl_moves', selectedItem, fromDate, toDate],
    enabled: !!selectedItem,
    queryFn: async () => {
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(selectedItem)
      let q = supabase.from('stock_ledger')
        .select('txn_date,txn_type,qty,unit,unit_price,total_value,reference_no,remarks,flock_id')
        .order('txn_date').order('created_at')
      if (isUUID) {
        q = q.or(`item_id.eq.${selectedItem},item_name.eq.${selectedItem}`)
      } else {
        q = q.eq('item_name', selectedItem)
      }
      if (fromDate) q = q.gte('txn_date', fromDate)
      if (toDate)   q = q.lte('txn_date', toDate)
      const { data } = await q
      let bal = 0
      return (data ?? []).map(r => {
        const signed = TXN_IS_OUT.has(r.txn_type) ? -Number(r.qty) : Number(r.qty)
        bal += signed
        return { ...r, signed, balance: bal }
      })
    },
  })

  return (
    <div className="space-y-4">
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Search & Select Item</label>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Type to search…"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-1 focus:ring-1 focus:ring-brand-500" />
            <select size={4} value={selectedItem} onChange={e => setSelectedItem(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-2 py-1 text-sm focus:ring-1 focus:ring-brand-500">
              {loadingItems ? <option>Loading…</option> : filtered.map(i => (
                <option key={i.id} value={i.id}>{i.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
            <DateInput value={fromDate} onChange={e => setFromDate(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
            <DateInput value={toDate} onChange={e => setToDate(e.target.value)} />
          </div>
        </div>
      </Card>

      {selectedItem && (
        <Card padding={false}>
          {loadingMoves ? <Spinner /> : !moves?.length ? <EmptyState title="No movements found" /> : (
            <div className="overflow-x-auto">
              <Table>
                <thead><tr>
                  <Th>Date</Th><Th>Type</Th><Th>Ref</Th>
                  <Th right>In</Th><Th right>Out</Th><Th right>Balance</Th>
                  <Th right>Rate</Th><Th>Remarks</Th>
                </tr></thead>
                <tbody>
                  {moves.map((m, i) => (
                    <tr key={i} className="text-sm hover:bg-gray-50">
                      <Td className="text-xs">{m.txn_date ? fmtDate(m.txn_date) : '—'}</Td>
                      <Td><Badge color={m.signed > 0 ? 'green' : 'red'}>{TXN_LABEL[m.txn_type] ?? m.txn_type}</Badge></Td>
                      <Td className="text-xs text-gray-500">{m.reference_no ?? '—'}</Td>
                      <Td right className="text-green-700">{m.signed > 0 ? m.signed.toLocaleString('en-IN') : ''}</Td>
                      <Td right className="text-red-600">{m.signed < 0 ? (-m.signed).toLocaleString('en-IN') : ''}</Td>
                      <Td right className="font-semibold">{m.balance.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</Td>
                      <Td right className="text-xs">{m.unit_price != null ? Number(m.unit_price).toFixed(2) : '—'}</Td>
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
    if (q && !(r.searchText ?? r.item_name.toLowerCase()).includes(q.toLowerCase())) return false
    return r.closing !== 0 || r.received > 0 || r.opening > 0 || r.used > 0 || r.adjusted !== 0
  }), [rows, cat, q])

  const totalOpeningValue  = filtered.reduce((s, r) => s + r.opening * (r.rate || 0), 0)
  const totalReceivedValue = filtered.reduce((s, r) => s + r.received * (r.rate || 0), 0)
  const totalClosingValue  = filtered.reduce((s, r) => s + (r.closing > 0 ? r.closing * (r.rate || 0) : 0), 0)

  const exportXlsx = () => {
    const data = [
      ['Item Name','Category','Unit','Opening Qty','Received','Used','Adjusted','Closing Qty','Rate (Rs)','Closing Value (Rs)'],
      ...filtered.map(r => [
        r.item_name, r.category || 'Other', r.unit,
        roundQty(r.opening, r.unit), roundQty(r.received, r.unit), roundQty(r.used, r.unit),
        roundQty(r.adjusted, r.unit), roundQty(r.closing, r.unit), r.rate > 0 ? Number(r.rate.toFixed(2)) : '',
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
                    <Td right className="text-xs text-gray-500">{formatQty(r.opening, r.unit)}</Td>
                    <Td right className="text-xs text-green-700">{formatQty(r.received, r.unit)}</Td>
                    <Td right className="text-xs text-orange-600">{formatQty(r.used, r.unit)}</Td>
                    <Td right className="text-xs text-gray-500">{r.adjusted ? formatQty(r.adjusted, r.unit) : '—'}</Td>
                    <Td right>
                      <Badge color={r.closing > 0 ? 'green' : 'red'}>{formatQty(r.closing, r.unit)}</Badge>
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

// ════════════════════════════════════════════════════════════════════
// TAB 6: CONSUMPTION REPORT (day-wise / month-wise usage per item)
// ════════════════════════════════════════════════════════════════════
// Exported so the Feed Mill page can embed the same report pre-locked to
// category='Feed Ingredient' instead of duplicating the logic.
export const ConsumptionReportTab: React.FC<{ lockedCategory?: string }> = ({ lockedCategory }) => {
  const CATEGORIES = useCategoryList()
  const [groupBy, setGroupBy] = useState<'day' | 'month'>('month')
  const [category, setCategory] = useState(lockedCategory ?? '')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState(today())
  const [q, setQ] = useState('')

  const { data: itemsMaster } = useQuery({
    queryKey: ['items_master_cons'],
    queryFn: async () => {
      const { data } = await supabase.from('items').select('id,name,category,unit').order('name')
      return data ?? []
    },
    staleTime: 5 * 60 * 1000,
  })
  // Every other name each item is known by, so searching an Intent/PO/GRN/
  // Medicine name finds its consumption rows here too.
  const { data: aliasesCons } = useQuery({
    queryKey: ['item_aliases_all'],
    queryFn: async () => { const { data } = await supabase.from('item_aliases').select('item_id,alias'); return data ?? [] },
    staleTime: 60 * 1000,
  })

  const { data: slData, isLoading } = useQuery({
    queryKey: ['sl_consumption', fromDate, toDate],
    queryFn: async () => {
      let all: any[] = [], from = 0
      while (true) {
        let query = supabase.from('stock_ledger')
          .select('item_id,item_name,txn_type,qty,txn_date')
          .in('txn_type', ['production_out','medicine_out','adjustment_out','transfer_out','dispatch_out'])
          .order('txn_date').range(from, from + 999)
        if (fromDate) query = query.gte('txn_date', fromDate)
        if (toDate) query = query.lte('txn_date', toDate)
        const { data } = await query
        if (!data || !data.length) break
        all = all.concat(data); if (data.length < 1000) break; from += 1000
      }
      return all
    },
  })

  const itemMap = useMemo(() => {
    const m: Record<string, any> = {}
    for (const it of itemsMaster ?? []) m[it.id] = it
    return m
  }, [itemsMaster])

  const rows = useMemo(() => {
    const m: Record<string, any> = {}
    for (const r of slData ?? []) {
      const master = r.item_id ? itemMap[r.item_id] : null
      const itemName = master?.name ?? r.item_name ?? '(unlinked)'
      const itemCategory = master?.category ?? ''
      if (category && itemCategory !== category) continue
      const period = groupBy === 'month' ? (r.txn_date ?? '').slice(0, 7) : r.txn_date
      const key = `${itemName}__${period}`
      if (!m[key]) m[key] = { itemName, category: itemCategory, unit: master?.unit ?? '', period, qty: 0, itemId: r.item_id ?? null }
      m[key].qty += Number(r.qty ?? 0)
    }
    return Object.values(m).sort((a: any, b: any) =>
      b.period.localeCompare(a.period) || a.itemName.localeCompare(b.itemName))
  }, [slData, itemMap, category, groupBy])

  const aliasMapCons = useMemo(() => {
    const m: Record<string, string[]> = {}
    for (const a of aliasesCons ?? []) (m[a.item_id] ??= []).push(a.alias)
    return m
  }, [aliasesCons])

  const filtered = useMemo(() => {
    if (!q) return rows
    const s = q.toLowerCase()
    return rows.filter((r: any) =>
      `${r.itemName} ${(aliasMapCons[r.itemId] ?? []).join(' ')}`.toLowerCase().includes(s))
  }, [rows, q, aliasMapCons])

  const totalsByItem = useMemo(() => {
    const m: Record<string, number> = {}
    for (const r of filtered as any[]) m[r.itemName] = (m[r.itemName] ?? 0) + r.qty
    return Object.entries(m).sort((a, b) => b[1] - a[1])
  }, [filtered])

  return (
    <div className="space-y-5">
      <Card>
        <div className="p-4 flex flex-wrap gap-3 items-end">
          <div>
            <label className="text-xs text-gray-500 block mb-1">Group By</label>
            <Select value={groupBy} onChange={e => setGroupBy(e.target.value as any)}
              options={[{ value: 'day', label: 'Day-wise' }, { value: 'month', label: 'Month-wise' }]} />
          </div>
          {!lockedCategory && (
            <div>
              <label className="text-xs text-gray-500 block mb-1">Category</label>
              <Select value={category} onChange={e => setCategory(e.target.value)}
                options={[{ value: '', label: 'All Categories' }, ...CATEGORIES.map(c => ({ value: c, label: c }))]} />
            </div>
          )}
          <div>
            <label className="text-xs text-gray-500 block mb-1">From</label>
            <DateInput value={fromDate} onChange={e => setFromDate(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">To</label>
            <DateInput value={toDate} onChange={e => setToDate(e.target.value)} />
          </div>
          <div className="flex-1 min-w-[160px]">
            <label className="text-xs text-gray-500 block mb-1">Search item</label>
            <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Item name..." />
          </div>
        </div>
      </Card>

      <Card>
        <SectionHeader title={`Item Totals (${fromDate || 'start'} to ${toDate})`} />
        <div className="overflow-x-auto">
          <Table>
            <thead><tr><Th>Item</Th><Th right>Total Consumed</Th></tr></thead>
            <tbody>
              {totalsByItem.map(([name, qty]) => (
                <tr key={name} className="text-sm hover:bg-gray-50">
                  <Td className="font-medium">{name}</Td>
                  <Td right className="text-orange-600 font-semibold">{qty.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</Td>
                </tr>
              ))}
              {totalsByItem.length === 0 && !isLoading && (
                <tr><Td colSpan={2} className="text-center text-gray-400 py-6">No consumption in this range</Td></tr>
              )}
            </tbody>
            {totalsByItem.length > 0 && (
              <tfoot>
                <tr className="bg-gray-50 font-bold border-t-2 border-gray-200">
                  <Td>Total ({totalsByItem.length} items)</Td>
                  <Td right className="text-orange-700">{totalsByItem.reduce((s, [, qty]) => s + qty, 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</Td>
                </tr>
              </tfoot>
            )}
          </Table>
        </div>
      </Card>

      <Card>
        <SectionHeader title={groupBy === 'month' ? 'Month-wise Breakdown' : 'Day-wise Breakdown'} />
        {isLoading ? <Spinner /> : (
          <div className="overflow-x-auto">
            <Table>
              <thead>
                <tr><Th>{groupBy === 'month' ? 'Month' : 'Date'}</Th><Th>Item</Th><Th>Category</Th><Th>Unit</Th><Th right>Qty Used</Th></tr>
              </thead>
              <tbody>
                {(filtered as any[]).map((r, i) => (
                  <tr key={i} className="text-sm hover:bg-gray-50">
                    <Td className="text-xs">{groupBy === 'month' ? r.period : fmtDate(r.period)}</Td>
                    <Td className="font-medium">{r.itemName}</Td>
                    <Td className="text-xs">{r.category ? <Badge color="blue">{r.category}</Badge> : '—'}</Td>
                    <Td className="text-xs">{r.unit}</Td>
                    <Td right className="text-orange-600">{r.qty.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</Td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><Td colSpan={5} className="text-center text-gray-400 py-6">No consumption in this range</Td></tr>
                )}
              </tbody>
              {filtered.length > 0 && (
                <tfoot>
                  <tr className="bg-gray-50 font-bold border-t-2 border-gray-200">
                    <Td colSpan={4}>Total ({filtered.length} rows)</Td>
                    <Td right className="text-orange-700">{(filtered as any[]).reduce((s, r) => s + (r.qty ?? 0), 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</Td>
                  </tr>
                </tfoot>
              )}
            </Table>
          </div>
        )}
      </Card>
    </div>
  )
}
