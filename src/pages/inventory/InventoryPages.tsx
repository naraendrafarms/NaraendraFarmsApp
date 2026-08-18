import React, { useState, useMemo, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { inr, fmtDate, today, fetchAllPages } from '@/lib/utils'
import { useAuth, can } from '@/lib/auth'
import { parseFile, downloadXlsxTemplate } from '@/lib/parseFile'
import {
  Card, SectionHeader, Spinner, Table, Th, Td, Button, Input, Select, Modal,
  Badge, StatCard, EmptyState, DateInput, SearchableSelect,
} from '@/components/ui'
import {
  Boxes, Package, SlidersHorizontal, ClipboardCheck, Check, RotateCcw,
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

type Tab = 'Stock Balance' | 'Physical Audit' | 'Adjustments' | 'Stock Ledger' | 'Closing Stock Report' | 'Consumption Report'

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
      // Was .limit(50000), which looks like "no limit" but is not — PostgREST
      // caps one response at 1,000 rows, so 1,359 of the 2,359 ingredient-usage
      // rows never arrived and production usage was understated by more than
      // half. Paged instead of asking for a big number and hoping.
      const data = await fetchAllPages<any>((from, to) => supabase.from('feed_production_ingredients')
        .select('ingredient_name,quantity_kg,feed_production_log(production_date)')
        .range(from, to), 'Production usage')
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
    { id: 'Physical Audit',       icon: <ClipboardCheck size={14}/> },
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
      {tab === 'Physical Audit'       && <PhysicalAuditTab />}
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

// `from` is optional. Without it the page behaves exactly as before: every
// movement up to asOf is counted, and `opening` holds only the rows explicitly
// typed 'opening'. With it, everything BEFORE that date collapses into opening
// and the received/used columns describe the period alone — so the row reads as
// a stock statement (opening + received + adjusted − used = closing) rather
// than a lifetime total with a date applied to part of it.
function useStockRows(asOf: string, from?: string) {
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
    queryKey: ['sl_all', asOf],   // `from` only re-buckets rows already fetched
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
        wQty: 0, wVal: 0,
      }
    }

    // A stock_ledger/production row with item_id = NULL (legacy entry never
    // linked to Items Master) used to fork its own name-keyed row even when
    // it really was the same item — norm() only lowercases+trims, so e.g.
    // "Toxfin 360 Dry" vs "Toxfin360 Dry" (a real case) never matched. This
    // stripped-to-alphanumeric key matches the item/alias regardless of
    // internal spacing/punctuation, folding the row into the real item.
    const looseKey = (s?: string | null) => String(s ?? '').toLowerCase().replace(/[^a-z0-9]/g, '')
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
          wQty: 0, wVal: 0,
        }
      }
      const row = m[key]
      const qty = Number(r.qty ?? 0)
      if (from && (r.txn_date ?? '') < from) {
        // Before the window: net it into opening, whatever kind of movement it
        // was. Its own in/out detail belongs to a period we are not showing.
        row.opening += OUT_TYPES.has(r.txn_type) ? -qty : qty
      } else if (OUT_TYPES.has(r.txn_type)) {
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
      // Weighted average of everything that came IN up to asOf — what the
      // Physical Stock Audit values a shortage at. The latest rate above can
      // be one odd purchase; a shortage built up over months is not worth
      // whatever the last lorry happened to cost.
      if (!OUT_TYPES.has(r.txn_type) && r.unit_price != null && qty > 0) {
        row.wQty += qty; row.wVal += qty * Number(r.unit_price)
      }
      // Prefer items master unit; fall back to ledger unit
      if (!row.unit && r.unit) row.unit = r.unit
    }

    const aliasMap: Record<string, string[]> = {}
    for (const a of aliases ?? []) (aliasMap[a.item_id] ??= []).push(a.alias)

    return Object.values(m).map((r: any) => {
      const closing = r.opening + r.received + r.adjusted - r.used
      const searchText = `${r.item_name} ${(aliasMap[r.key] ?? []).join(' ')}`.toLowerCase()
      // Falls back to the latest rate when nothing inward carried a price.
      const wavg = r.wQty > 0 ? r.wVal / r.wQty : (r.rate || 0)
      return { ...r, closing, wavg, value: closing * (r.rate || 0), searchText }
    }).sort((a, b) => (a.category || 'zzz').localeCompare(b.category || 'zzz') || a.item_name.localeCompare(b.item_name))
  }, [itemsMaster, slData, aliases, asOf, from])

  return { rows, isLoading: itemsLoading || slLoading }
}

// ════════════════════════════════════════════════════════════════════
// TAB 1: STOCK BALANCE (from Items Master + Stock Ledger)
// ════════════════════════════════════════════════════════════════════
const StockStatusTab: React.FC = () => {
  const CATEGORIES = useCategoryList()
  const [asOf, setAsOf] = useState(today())
  const [fromDate, setFromDate] = useState('')
  const [cat, setCat] = useState('')
  const [q, setQ] = useState('')
  const [onlyLow, setOnlyLow] = useState(false)
  const { rows, isLoading } = useStockRows(asOf, fromDate || undefined)

  const filtered = useMemo(() => rows.filter(r => {
    if (cat && r.category !== cat) return false
    if (q && !(r.searchText ?? r.item_name.toLowerCase()).includes(q.toLowerCase())) return false
    if (onlyLow && !(r.reorder_level > 0 && r.closing <= r.reorder_level)) return false
    return true
  }), [rows, cat, q, onlyLow])

  const totalValue = filtered.reduce((s, r) => s + (r.value > 0 ? r.value : 0), 0)
  const ranged = !!fromDate
  const lowCount = rows.filter(r => r.reorder_level > 0 && r.closing <= r.reorder_level).length

  const exportCsv = () => {
    const headers = ['item_name','category','unit','opening','received','used','adjusted','closing','rate','value']
    const csv = [headers, ...filtered.map(r => [r.item_name, r.category, r.unit,
      roundQty(r.opening, r.unit), roundQty(r.received, r.unit), roundQty(r.used, r.unit), roundQty(r.adjusted, r.unit),
      roundQty(r.closing, r.unit), r.rate, Math.round(r.value)])]
      .map(row => row.map(v => `"${String(v ?? '').replace(/"/g,'""')}"`).join(',')).join('\n')
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], {type:'text/csv'}))
    a.download = `stock_status_${fromDate ? `${fromDate}_to_` : ''}${asOf}.csv`; a.click()
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
          <DateInput label="Movements from" value={fromDate} onChange={e => setFromDate(e.target.value)} className="w-40" />
          <DateInput label="Stock as on" value={asOf} onChange={e => setAsOf(e.target.value)} className="w-40" />
          {fromDate && (
            <Button variant="ghost" size="sm" className="self-end mb-0.5" onClick={() => setFromDate('')}>Clear from</Button>
          )}
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

      {ranged && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-800">
          Showing movements <strong>{fromDate} → {asOf}</strong>. <strong>Opening</strong> is everything before
          {' '}{fromDate} netted together, <strong>Received</strong> and <strong>Used</strong> are the period alone, and
          {' '}<strong>Closing</strong> is opening + received + adjusted − used. Leave “Movements from” blank to go back
          to the running totals.
        </div>
      )}

      <Card padding={false}>
        {isLoading ? <Spinner /> : filtered.length === 0 ? <EmptyState icon={<Boxes size={28}/>} title="No items found" subtitle="Add items in Purchase → Items Master first. Stock balance is computed automatically from GRN receipts and usage." /> : (
          <div className="overflow-x-auto">
            <Table>
              <thead><tr>
                <Th>Code</Th><Th>Item</Th><Th>Category</Th><Th>Unit</Th>
                <Th right>Opening</Th>
                <Th right>{ranged ? 'Received (period)' : 'Received'}</Th>
                <Th right>{ranged ? 'Used (period)' : 'Used'}</Th><Th right>Adjust</Th>
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
// TAB 2: PHYSICAL AUDIT (count the stock, post the difference)
// ════════════════════════════════════════════════════════════════════
//
// Adjustments (the next tab) asks for the DIFFERENCE, against today. That is
// the wrong question to put to somebody who has just walked the store with a
// weighing scale: they know what they COUNTED, on the day they counted it, and
// the book figure to compare it against is the one that stood on that date —
// not the one that stands now, after another fortnight of production.
//
// So this tab asks for the counted quantity, works the difference out itself
// against book stock as on the audit date, values it at the weighted average
// rate of everything that came in up to that date, and on posting carries a
// shortage onto the flocks in proportion to the feed each of them received
// during the period. Works for every category, not only feed ingredients.
const PhysicalAuditTab: React.FC = () => {
  const qc = useQueryClient()
  const { profile } = useAuth()
  const canEdit = can.enterData(profile?.role)
  const canDel  = can.delete(profile?.role)
  const CATEGORIES = useCategoryList()

  const [openId, setOpenId] = useState<string | null>(null)
  const [showNew, setShowNew] = useState(false)
  const blank = { audit_date: today(), period_from: '', category: '', title: '', remarks: '' }
  const [form, setForm] = useState(blank)
  const s = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))
  const [counts, setCounts] = useState<Record<string, string>>({})
  const [search, setSearch] = useState('')
  const [onlyCounted, setOnlyCounted] = useState(false)

  const { data: audits = [], isLoading } = useQuery({
    queryKey: ['stock_audits'],
    queryFn: async () => {
      const { data, error } = await supabase.from('stock_audits').select('*').order('audit_date', { ascending: false })
      if (error) throw error
      return data ?? []
    },
  })

  const openAudit: any = (audits as any[]).find((a: any) => a.id === openId) ?? null
  const posted = openAudit?.status === 'posted'

  const { data: lines = [] } = useQuery({
    queryKey: ['stock_audit_lines', openId],
    enabled: !!openId,
    queryFn: async () => {
      const { data, error } = await supabase.from('stock_audit_lines').select('*').eq('audit_id', openId).order('item_name')
      if (error) throw error
      return data ?? []
    },
  })

  // Book stock as on the audit date — the whole point of the screen.
  const { rows: stockRows, isLoading: stockLoading } = useStockRows(openAudit?.audit_date ?? today())

  // Typed counts start from whatever was saved last time the audit was opened.
  React.useEffect(() => {
    const m: Record<string, string> = {}
    for (const l of lines as any[]) m[l.item_id ?? norm(l.item_name)] = String(l.counted_qty ?? '')
    setCounts(m)
  }, [openId, lines])

  // A posted audit shows what was saved, not a fresh calculation: the book
  // figure it was posted against must not move afterwards or the record stops
  // agreeing with the correction it produced.
  const gridRows = useMemo(() => {
    if (posted) {
      return (lines as any[]).map((l: any) => ({
        key: l.item_id ?? norm(l.item_name), item_name: l.item_name, category: l.category ?? '',
        unit: l.unit ?? '', book: Number(l.book_qty ?? 0), counted: Number(l.counted_qty ?? 0),
        diff: Number(l.diff_qty ?? 0), rate: Number(l.rate ?? 0), value: Number(l.diff_value ?? 0),
        counted_entered: true,
      }))
    }
    const cat = openAudit?.category
    return (stockRows as any[])
      .filter((r: any) => !cat || r.category === cat)
      .filter((r: any) => r.is_active !== false)
      .map((r: any) => {
        const raw = counts[r.key]
        const entered = raw !== undefined && raw !== ''
        const counted = entered ? Number(raw) : 0
        const book = Number(r.closing ?? 0)
        const diff = entered ? counted - book : 0
        const rate = Number(r.wavg ?? 0)
        return { key: r.key, item_name: r.item_name, category: r.category, unit: r.unit,
                 book, counted, diff, rate, value: diff * rate, counted_entered: entered,
                 searchText: r.searchText }
      })
  }, [posted, lines, stockRows, counts, openAudit])

  const shownRows = useMemo(() => gridRows
    .filter((r: any) => !onlyCounted || r.counted_entered)
    .filter((r: any) => !search || (r.searchText ?? r.item_name.toLowerCase()).includes(search.toLowerCase())),
    [gridRows, onlyCounted, search])

  const shortValue  = gridRows.filter((r: any) => r.diff < 0).reduce((a: number, r: any) => a - r.value, 0)
  const excessValue = gridRows.filter((r: any) => r.diff > 0).reduce((a: number, r: any) => a + r.value, 0)
  const diffCount   = gridRows.filter((r: any) => r.counted_entered && r.diff !== 0).length

  const createMut = useMutation({
    mutationFn: async () => {
      if (!form.audit_date) throw new Error('Pick the date the stock was counted')
      const { data, error } = await supabase.from('stock_audits').insert({
        audit_date: form.audit_date,
        period_from: form.period_from || null,
        category: form.category || null,
        title: form.title || null,
        remarks: form.remarks || null,
      }).select('id').single()
      if (error) throw error
      return data.id as string
    },
    onSuccess: (id) => { qc.invalidateQueries({ queryKey: ['stock_audits'] }); setShowNew(false); setForm(blank); setOpenId(id); toast.success('Audit started — now enter what you counted') },
    onError: (e: any) => toast.error(e.message),
  })

  // Saved as a replace, not a merge: an item whose count was cleared must lose
  // its line, or the audit keeps claiming a difference nobody counted.
  const saveMut = useMutation({
    mutationFn: async () => {
      if (!openAudit) return
      const payload = gridRows.filter((r: any) => r.counted_entered).map((r: any) => ({
        audit_id: openAudit.id,
        item_id: /^[0-9a-f-]{36}$/i.test(r.key) ? r.key : null,
        item_name: r.item_name, category: r.category || null, unit: r.unit || null,
        book_qty: r.book, counted_qty: r.counted, diff_qty: r.diff,
        rate: r.rate, diff_value: r.value,
      }))
      const del = await supabase.from('stock_audit_lines').delete().eq('audit_id', openAudit.id)
      if (del.error) throw del.error
      if (payload.length) {
        const ins = await supabase.from('stock_audit_lines').insert(payload)
        if (ins.error) throw ins.error
      }
      const upd = await supabase.from('stock_audits').update({ short_value: shortValue, excess_value: excessValue }).eq('id', openAudit.id)
      if (upd.error) throw upd.error
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['stock_audit_lines', openId] }); qc.invalidateQueries({ queryKey: ['stock_audits'] }); toast.success('Count saved') },
    onError: (e: any) => toast.error(e.message),
  })

  const postMut = useMutation({
    mutationFn: async () => {
      if (!openAudit) throw new Error('No audit open')
      // Post from the saved lines, never from what is on screen — the count on
      // screen may have been typed and not saved.
      const { data: saved, error: le } = await supabase.from('stock_audit_lines').select('*').eq('audit_id', openAudit.id)
      if (le) throw le
      const diffs = (saved ?? []).filter((l: any) => Number(l.diff_qty ?? 0) !== 0)
      if (!diffs.length) throw new Error('Nothing to post — no counted item differs from book stock')

      // 1. Stock correction. trg_adj_stock_ledger turns each of these into an
      //    adjustment_in / adjustment_out in the stock ledger on the audit date.
      for (const l of diffs) {
        const { data: adj, error } = await supabase.from('feed_stock_adjustments').insert({
          adjustment_date: openAudit.audit_date,
          ingredient_name: l.item_name,
          adjustment_kg: Number(l.diff_qty),
          adjustment_type: 'Audit Correction',
          unit: l.unit, rate: l.rate, category: l.category,
          remarks: `Physical stock audit ${fmtDate(openAudit.audit_date)} — counted ${l.counted_qty} against book ${l.book_qty}`,
        }).select('id').single()
        if (error) throw error
        const u = await supabase.from('stock_audit_lines').update({ adj_id: adj.id }).eq('id', l.id)
        if (u.error) throw u.error
      }

      // 2. Shortage value onto the flocks, shared by the feed each received in
      //    the audit period. Excess is left as a stock correction only — it is
      //    not an expense, and writing a negative one would flatter the flock.
      const shortage = diffs.filter((l: any) => Number(l.diff_qty) < 0)
        .reduce((a: number, l: any) => a - Number(l.diff_value ?? 0), 0)
      if (shortage > 0) {
        let q = supabase.from('feed_transfers').select('flock_id,to_farm_id,quantity_kg,transfer_date')
          .lte('transfer_date', openAudit.audit_date).not('flock_id', 'is', null)
        if (openAudit.period_from) q = q.gte('transfer_date', openAudit.period_from)
        const { data: tr, error: te } = await q
        if (te) throw te
        const byFlock: Record<string, { kg: number; farm_id: string | null }> = {}
        for (const t of tr ?? []) {
          const e = (byFlock[t.flock_id] ??= { kg: 0, farm_id: t.to_farm_id ?? null })
          e.kg += Number(t.quantity_kg ?? 0)
        }
        const totalKg = Object.values(byFlock).reduce((a, e) => a + e.kg, 0)
        const desc = `Physical stock audit shortage — ${fmtDate(openAudit.audit_date)}`
        const rows: any[] = totalKg > 0
          ? Object.entries(byFlock).map(([flock_id, e]) => ({
              expense_date: openAudit.audit_date, farm_id: e.farm_id, flock_id,
              category: 'other', description: desc, amount: Math.round(shortage * e.kg / totalKg * 100) / 100,
              stock_audit_id: openAudit.id,
              remarks: `Share of ${inr(shortage)} by feed received (${Math.round(e.kg).toLocaleString('en-IN')} kg of ${Math.round(totalKg).toLocaleString('en-IN')} kg)`,
            })).filter(r => r.amount > 0)
          // No feed moved in the period, so there is no share to work from —
          // the shortage stays at farm level rather than being guessed onto a flock.
          : [{ expense_date: openAudit.audit_date, farm_id: openAudit.farm_id ?? null, flock_id: null,
               category: 'other', description: desc, amount: shortage, stock_audit_id: openAudit.id,
               remarks: 'No feed transfers in the audit period — held at farm level, not allocated to a flock' }]
        const { error: ee } = await supabase.from('farm_expenses').insert(rows)
        if (ee) throw ee
      }

      const { error: he } = await supabase.from('stock_audits').update({
        status: 'posted', posted_at: new Date().toISOString(),
        short_value: shortage,
        excess_value: diffs.filter((l: any) => Number(l.diff_qty) > 0).reduce((a: number, l: any) => a + Number(l.diff_value ?? 0), 0),
      }).eq('id', openAudit.id)
      if (he) throw he
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['stock_audits'] }); qc.invalidateQueries({ queryKey: ['stock_audit_lines', openId] })
      qc.invalidateQueries({ queryKey: ['sl_all'] }); qc.invalidateQueries({ queryKey: ['inv_adjustments'] })
      toast.success('Posted — stock corrected and the shortage charged to the flocks')
    },
    onError: (e: any) => toast.error(e.message),
  })

  const unpostMut = useMutation({
    mutationFn: async () => {
      if (!openAudit) return
      const { data: saved } = await supabase.from('stock_audit_lines').select('id,adj_id').eq('audit_id', openAudit.id)
      const adjIds = (saved ?? []).map((l: any) => l.adj_id).filter(Boolean)
      if (adjIds.length) {
        const { error } = await supabase.from('feed_stock_adjustments').delete().in('id', adjIds)
        if (error) throw error
      }
      const e1 = await supabase.from('farm_expenses').delete().eq('stock_audit_id', openAudit.id)
      if (e1.error) throw e1.error
      const e2 = await supabase.from('stock_audit_lines').update({ adj_id: null }).eq('audit_id', openAudit.id)
      if (e2.error) throw e2.error
      const e3 = await supabase.from('stock_audits').update({ status: 'draft', posted_at: null }).eq('id', openAudit.id)
      if (e3.error) throw e3.error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['stock_audits'] }); qc.invalidateQueries({ queryKey: ['stock_audit_lines', openId] })
      qc.invalidateQueries({ queryKey: ['sl_all'] }); qc.invalidateQueries({ queryKey: ['inv_adjustments'] })
      toast.success('Unposted — corrections and expenses removed')
    },
    onError: (e: any) => toast.error(e.message),
  })

  const delMut = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('stock_audits').delete().eq('id', id); if (error) throw error },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['stock_audits'] }); setOpenId(null); qc.invalidateQueries({ queryKey: ['sl_all'] }); toast.success('Audit deleted') },
    onError: (e: any) => toast.error(e.message),
  })

  const exportCount = () => {
    const ws = XLSX.utils.json_to_sheet(shownRows.map((r: any) => ({
      Item: r.item_name, Category: r.category, Unit: r.unit,
      'Book Stock': r.book, 'Counted': r.counted_entered ? r.counted : '',
      Difference: r.counted_entered ? r.diff : '', Rate: r.rate,
      Value: r.counted_entered ? r.value : '',
    })))
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Audit')
    XLSX.writeFile(wb, `stock_audit_${openAudit?.audit_date ?? today()}.xlsx`)
  }

  // ── list view ──
  if (!openAudit) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center gap-3 flex-wrap">
          <p className="text-sm text-gray-500">
            Count the stock, enter what you saw, and the app works out the difference against book stock
            <b> as on the date you counted</b> — valued at the weighted average rate. Posting corrects the
            stock ledger and charges any shortage to the flocks by feed share.
          </p>
          {canEdit && <Button icon={<Plus size={16} />} onClick={() => { setForm(blank); setShowNew(true) }}>New Audit</Button>}
        </div>
        {isLoading ? <Spinner /> : audits.length === 0 ? (
          <Card><EmptyState title="No stock audits yet" subtitle="Start one after your next physical count" /></Card>
        ) : (
          <Card padding={false}>
            <Table>
              <thead><tr>
                <Th>Audit Date</Th><Th>Period From</Th><Th>Category</Th><Th>Title</Th>
                <Th right>Shortage</Th><Th right>Excess</Th><Th>Status</Th><Th right>Actions</Th>
              </tr></thead>
              <tbody>
                {(audits as any[]).map((a: any) => (
                  <tr key={a.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setOpenId(a.id)}>
                    <Td className="font-medium">{fmtDate(a.audit_date)}</Td>
                    <Td className="text-xs">{a.period_from ? fmtDate(a.period_from) : 'All time'}</Td>
                    <Td className="text-xs">{a.category ? <Badge color="blue">{a.category}</Badge> : 'All categories'}</Td>
                    <Td className="text-xs text-gray-500">{a.title ?? '—'}</Td>
                    <Td right className="text-red-600">{a.short_value ? inr(a.short_value) : '—'}</Td>
                    <Td right className="text-green-600">{a.excess_value ? inr(a.excess_value) : '—'}</Td>
                    <Td><Badge color={a.status === 'posted' ? 'green' : 'yellow'}>{a.status === 'posted' ? 'Posted' : 'Draft'}</Badge></Td>
                    <Td right>
                      <div className="flex gap-2 justify-end" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                        <button onClick={() => setOpenId(a.id)}><Search size={14} className="text-gray-400 hover:text-brand-600" /></button>
                        {canDel && (
                          <button onClick={() => confirm(`Delete the audit of ${fmtDate(a.audit_date)}? Its stock corrections and expense entries are removed too.`) && delMut.mutate(a.id)}>
                            <Trash2 size={14} className="text-gray-400 hover:text-red-600" /></button>
                        )}
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card>
        )}

        <Modal open={showNew} onClose={() => setShowNew(false)} title="New Physical Stock Audit"
          footer={<Button loading={createMut.isPending} onClick={() => createMut.mutate()}>Start Audit</Button>}>
          <div className="space-y-3">
            <DateInput label="Date counted *" value={form.audit_date} onChange={v => s('audit_date', v)} />
            <DateInput label="Period from" value={form.period_from} onChange={v => s('period_from', v)} />
            <p className="text-xs text-gray-500 -mt-2">
              Period From decides which flocks share the shortage — feed sent between that date and the audit
              date. Leave it blank to share across every flock that has ever been fed.
            </p>
            <Select label="Category" value={form.category} onChange={e => s('category', e.target.value)}
              options={[{ value: '', label: 'All categories' }, ...CATEGORIES.map(c => ({ value: c, label: c }))]} />
            <Input label="Title" value={form.title} onChange={e => s('title', e.target.value)} placeholder="e.g. Half-yearly count — feed mill store" />
            <Input label="Remarks" value={form.remarks} onChange={e => s('remarks', e.target.value)} />
          </div>
        </Modal>
      </div>
    )
  }

  // ── one audit ──
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-start gap-3 flex-wrap">
        <div>
          <button className="text-xs text-brand-600 hover:underline" onClick={() => setOpenId(null)}>← All audits</button>
          <h3 className="text-lg font-semibold mt-1">
            {openAudit.title || 'Physical Stock Audit'} — {fmtDate(openAudit.audit_date)}
          </h3>
          <p className="text-xs text-gray-500">
            {openAudit.category ?? 'All categories'} · book stock as on {fmtDate(openAudit.audit_date)} ·
            rate = weighted average of everything received up to that date
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="secondary" size="sm" icon={<Download size={14} />} onClick={exportCount}>Excel</Button>
          {canEdit && !posted && <Button size="sm" loading={saveMut.isPending} onClick={() => saveMut.mutate()}>Save Count</Button>}
          {canEdit && !posted && (
            <Button size="sm" icon={<Check size={14} />} loading={postMut.isPending}
              onClick={() => confirm('Post this audit? Stock is corrected on the audit date and the shortage is charged to the flocks.') && postMut.mutate()}>
              Post
            </Button>
          )}
          {canEdit && posted && (
            <Button variant="secondary" size="sm" icon={<RotateCcw size={14} />} loading={unpostMut.isPending}
              onClick={() => confirm('Unpost this audit? Its stock corrections and expense entries are removed.') && unpostMut.mutate()}>
              Unpost
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard title="Items counted" value={String(gridRows.filter((r: any) => r.counted_entered).length)} color="text-gray-700" />
        <StatCard title="Items differing" value={String(diffCount)} color="text-orange-600" />
        <StatCard title="Shortage value" value={inr(shortValue)} color="text-red-600" />
        <StatCard title="Excess value" value={inr(excessValue)} color="text-green-600" />
      </div>

      {!posted && (
        <div className="flex gap-3 items-center flex-wrap">
          <Input placeholder="Search item…" value={search} onChange={e => setSearch(e.target.value)} className="w-64" />
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input type="checkbox" checked={onlyCounted} onChange={e => setOnlyCounted(e.target.checked)} />
            Only items I have counted
          </label>
          <span className="text-xs text-gray-400">Leave an item blank if you did not count it — blanks are ignored.</span>
        </div>
      )}

      {stockLoading && !posted ? <Spinner /> : (
        <Card padding={false}>
          <div className="overflow-x-auto">
            <Table>
              <thead><tr>
                <Th>Item</Th><Th>Category</Th><Th>Unit</Th>
                <Th right>Book Stock</Th><Th right>Counted</Th><Th right>Difference</Th>
                <Th right>Rate</Th><Th right>Value</Th>
              </tr></thead>
              <tbody>
                {shownRows.map((r: any) => (
                  <tr key={r.key} className={`hover:bg-gray-50 ${r.counted_entered && r.diff !== 0 ? 'bg-amber-50/40' : ''}`}>
                    <Td className="font-medium">{r.item_name}</Td>
                    <Td className="text-xs">{r.category ? <Badge color="blue">{r.category}</Badge> : '—'}</Td>
                    <Td className="text-xs">{r.unit}</Td>
                    <Td right>{formatQty(r.book, r.unit)}</Td>
                    <Td right>
                      {posted ? formatQty(r.counted, r.unit) : (
                        <input type="number" step="any" value={counts[r.key] ?? ''}
                          onChange={e => setCounts(c => ({ ...c, [r.key]: e.target.value }))}
                          disabled={!canEdit}
                          className="w-28 text-right border border-gray-300 rounded px-2 py-1 text-sm" />
                      )}
                    </Td>
                    <Td right className={!r.counted_entered ? 'text-gray-300' : r.diff < 0 ? 'text-red-600 font-medium' : r.diff > 0 ? 'text-green-600 font-medium' : 'text-gray-400'}>
                      {r.counted_entered ? formatQty(r.diff, r.unit) : '—'}
                    </Td>
                    <Td right className="text-xs text-gray-500">{r.rate ? r.rate.toLocaleString('en-IN', { maximumFractionDigits: 2 }) : '—'}</Td>
                    <Td right className={!r.counted_entered ? 'text-gray-300' : r.value < 0 ? 'text-red-600' : 'text-green-600'}>
                      {r.counted_entered ? inr(r.value) : '—'}
                    </Td>
                  </tr>
                ))}
                {shownRows.length === 0 && (
                  <tr><Td colSpan={8} className="text-center text-gray-400 py-6">No items match</Td></tr>
                )}
              </tbody>
            </Table>
          </div>
          <p className="text-xs text-gray-500 px-3 py-2">
            Posting writes one stock adjustment per differing item, dated {fmtDate(openAudit.audit_date)}, and
            raises a farm expense for the shortage — split across flocks in proportion to the feed each received
            {openAudit.period_from ? ` from ${fmtDate(openAudit.period_from)}` : ''} up to the audit date. Excess
            stock corrects the ledger only; it is not written back as a credit to any flock.
          </p>
        </Card>
      )}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════
// TAB 3: ADJUSTMENTS (Opening Stock + manual corrections)
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
  // The list had no date filter at all — every adjustment ever made, with no way
  // to ask what was adjusted last month when a stock figure looks wrong.
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const filtered = useMemo(() => (rows as any[]).filter((r: any) => {
    if (typeFilter && r.adjustment_type !== typeFilter) return false
    if (q && !String(r.ingredient_name ?? '').toLowerCase().includes(q.toLowerCase())) return false
    const d = String(r.adjustment_date ?? '')
    if (fromDate && d < fromDate) return false
    if (toDate && d > toDate) return false
    return true
  }), [rows, typeFilter, q, fromDate, toDate])

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
          <label className="flex items-center gap-1.5 text-sm text-gray-600">From
            <DateInput value={fromDate} onChange={e => setFromDate(e.target.value)} /></label>
          <label className="flex items-center gap-1.5 text-sm text-gray-600">To
            <DateInput value={toDate} onChange={e => setToDate(e.target.value)} /></label>
          {(fromDate || toDate) && (
            <Button size="sm" variant="ghost" onClick={() => { setFromDate(''); setToDate('') }}>Clear dates</Button>
          )}
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
  const [selectedItem, setSelectedItem] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate]     = useState('')

  const { data: ledgerItemRows, isLoading: loadingItems } = useQuery({
    queryKey: ['sl_items'],
    queryFn: async () => {
      // Paged. This builds the "Search & Select Item" list by reading every
      // ledger row and collecting the distinct items — so a bare select capped
      // at 1,000 rows silently dropped every item that only appears later in
      // the ledger. With 2,645 rows, items were simply missing from the
      // dropdown and could not be looked at at all.
      return await fetchAllPages<any>((from, to) => supabase
        .from('stock_ledger').select('item_id,item_name')
        .order('item_name').range(from, to), 'Ledger item list')
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
  const { data: itemsMasterLedger } = useQuery({
    queryKey: ['items_master_inv'],
    queryFn: async () => {
      const { data } = await supabase.from('items').select('id,name,code,category,unit,reorder_level,is_active').order('name')
      return data ?? []
    },
    staleTime: 5 * 60 * 1000,
  })

  // One item = one entry. The list used to key on item_id when a row had one
  // and on the NAME when it did not, so an item recorded both ways — Selvo BH
  // and Toxfin 360 Dry both are — appeared TWICE under the same wording, each
  // showing only half its movements. And where one item had been written two
  // ways, only the first spelling survived and the second could not be found
  // at all. Rows now fold onto the master item by id, or by name/alias ignoring
  // spacing and punctuation, exactly as the Stock Balance tab does.
  const itemIndex = useMemo(() => {
    const looseKey = (s?: string | null) => String(s ?? '').toLowerCase().replace(/[^a-z0-9]/g, '')
    const looseNameToId: Record<string, string> = {}
    for (const it of itemsMasterLedger ?? []) looseNameToId[looseKey(it.name)] = it.id
    for (const a of aliasesLedger ?? []) if (!looseNameToId[looseKey(a.alias)]) looseNameToId[looseKey(a.alias)] = a.item_id

    const idToName: Record<string, string> = {}
    for (const it of itemsMasterLedger ?? []) idToName[it.id] = it.name

    const entries: Record<string, { key: string; name: string; id: string | null; names: Set<string> }> = {}
    for (const r of ledgerItemRows ?? []) {
      const name = String(r.item_name ?? '')
      const id: string | null = r.item_id ?? looseNameToId[looseKey(name)] ?? null
      const key = id ?? norm(name)
      const e = (entries[key] ??= { key, name: idToName[id ?? ''] ?? name, id, names: new Set<string>() })
      if (name) e.names.add(name)
      if (!e.name) e.name = name
    }
    // Every name the item is known by, so a movement stored under an old
    // spelling is still found once the item is picked.
    for (const it of itemsMasterLedger ?? []) if (entries[it.id]) entries[it.id].names.add(it.name)
    for (const a of aliasesLedger ?? []) if (entries[a.item_id]) entries[a.item_id].names.add(a.alias)
    return entries
  }, [ledgerItemRows, itemsMasterLedger, aliasesLedger])

  const itemOptions = useMemo(() => Object.values(itemIndex)
    .filter(e => (e.name ?? '').trim() !== '')
    .map(e => ({ value: e.key, label: e.name, searchText: Array.from(e.names).join(' ') }))
    .sort((a, b) => a.label.localeCompare(b.label)), [itemIndex])

  const { data: moves, isLoading: loadingMoves } = useQuery({
    queryKey: ['sl_moves', selectedItem, fromDate, toDate],
    enabled: !!selectedItem,
    queryFn: async () => {
      const entry = itemIndex[selectedItem]
      const names = entry ? Array.from(entry.names) : [selectedItem]
      const cols = 'id,txn_date,txn_type,qty,unit,unit_price,total_value,reference_no,remarks,flock_id'
      const applyDates = (q: any) => {
        if (fromDate) q = q.gte('txn_date', fromDate)
        if (toDate)   q = q.lte('txn_date', toDate)
        return q
      }
      // Two plain queries rather than one `or(...)`: the item's own rows, and
      // rows recorded under any of its names but never linked to it. Merging
      // in the browser keeps names containing commas or brackets out of a
      // filter string that would misread them.
      const byId = entry?.id
        ? await applyDates(supabase.from('stock_ledger').select(cols).eq('item_id', entry.id))
        : { data: [], error: null }
      if (byId.error) throw byId.error
      const byName = names.length
        ? await applyDates(supabase.from('stock_ledger').select(cols).is('item_id', null).in('item_name', names))
        : { data: [], error: null }
      if (byName.error) throw byName.error

      const seenRow = new Set<string>()
      const merged = [...(byId.data ?? []), ...(byName.data ?? [])].filter((r: any) => {
        if (seenRow.has(r.id)) return false
        seenRow.add(r.id); return true
      }).sort((a: any, b: any) => String(a.txn_date).localeCompare(String(b.txn_date)))
      const data = merged
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
          {/* The search box and the list used to be two separate controls. On a
              phone, tapping a name after typing only moved focus into the list
              — it highlighted the row without registering a choice, so the
              ledger stayed blank until you tapped a second time. This is the
              same picker used everywhere else in the app: type, tap, done. */}
          <div className="md:col-span-2">
            <SearchableSelect label="Search & Select Item"
              placeholder={loadingItems ? 'Loading items…' : 'Type to search…'}
              options={itemOptions} value={selectedItem} onChange={v => setSelectedItem(v)} />
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
