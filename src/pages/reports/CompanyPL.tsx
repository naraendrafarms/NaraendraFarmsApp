import React, { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { inr } from '@/lib/utils'
import {
  Card, Button, Select, SectionHeader, Spinner, Table, Th, Td
} from '@/components/ui'
import { Download } from 'lucide-react'
import * as XLSX from 'xlsx'

// ── FY helpers ────────────────────────────────────────────────────────────────
const FY_OPTIONS = [
  { value: '2022-23', label: 'FY 2022-23' },
  { value: '2023-24', label: 'FY 2023-24' },
  { value: '2024-25', label: 'FY 2024-25' },
  { value: '2025-26', label: 'FY 2025-26' },
  { value: '2026-27', label: 'FY 2026-27' },
]

function fyDates(fy: string): { start: string; end: string } {
  const [startYearStr] = fy.split('-')
  const startYear = parseInt(startYearStr)
  return {
    start: `${startYear}-04-01`,
    end: `${startYear + 1}-03-31`,
  }
}

function monthLabel(ym: string) {
  return new Date(ym + '-01').toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })
}

function fyMonths(fy: string): string[] {
  const startYear = parseInt(fy.split('-')[0])
  const months: string[] = []
  for (let m = 4; m <= 12; m++) months.push(`${startYear}-${String(m).padStart(2, '0')}`)
  for (let m = 1; m <= 3; m++) months.push(`${startYear + 1}-${String(m).padStart(2, '0')}`)
  return months
}

function toMonth(dateStr: string) {
  return dateStr?.slice(0, 7) ?? ''
}

// sum array of objects by month field
function sumByMonth(rows: any[], dateField: string, amtField: string): Record<string, number> {
  const map: Record<string, number> = {}
  for (const r of rows) {
    const m = toMonth(r[dateField] ?? '')
    if (!m) continue
    map[m] = (map[m] ?? 0) + (r[amtField] ?? 0)
  }
  return map
}

// ── COST BREAKDOWN ────────────────────────────────────────────────────────────
const CostBreakdown: React.FC<{ items: { label: string; value: number }[]; total: number }> = ({ items, total }) => {
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6']
  return (
    <Card>
      <h3 className="font-semibold text-gray-800 mb-4">Cost Breakdown</h3>
      <div className="space-y-2.5">
        {items.filter(i => i.value > 0).sort((a, b) => b.value - a.value).map((item, idx) => {
          const pct = total > 0 ? (item.value / total) * 100 : 0
          return (
            <div key={item.label}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-700">{item.label}</span>
                <span className="font-semibold">
                  {inr(item.value)} <span className="text-gray-400 text-xs">({pct.toFixed(1)}%)</span>
                </span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${pct}%`, backgroundColor: COLORS[idx % COLORS.length] }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

// ── MAIN PAGE ────────────────────────────────────────────────────────────────
export const CompanyPL: React.FC = () => {
  const [fy, setFy] = useState('2025-26')
  const [view, setView] = useState<'monthly' | 'annual'>('monthly')

  const { start, end } = fyDates(fy)
  const months = fyMonths(fy)

  // ── REVENUE QUERIES ───────────────────────────────────────────────────────
  const { data: heData, isLoading: heLoading } = useQuery({
    queryKey: ['cpl_he', fy],
    queryFn: async () => {
      const { data } = await supabase.from('he_dispatch')
        .select('dispatch_date,amount')
        .gte('dispatch_date', start).lte('dispatch_date', end)
      return data ?? []
    }
  })

  const { data: nheSalesEgg } = useQuery({
    queryKey: ['cpl_nhe_egg', fy],
    queryFn: async () => {
      const { data } = await supabase.from('nhe_sales')
        .select('sale_date,amount,sale_type')
        .in('sale_type', ['je', 'te', 'be', 'ne'])
        .gte('sale_date', start).lte('sale_date', end)
      return data ?? []
    }
  })

  const { data: hatchData } = useQuery({
    queryKey: ['cpl_hatch', fy],
    queryFn: async () => {
      const { data } = await supabase.from('hatch_batches')
        .select('hatch_date,chick_amount,chicks_sold,chick_rate')
        .gte('hatch_date', start).lte('hatch_date', end)
      return data ?? []
    }
  })

  const { data: cullData } = useQuery({
    queryKey: ['cpl_cull', fy],
    queryFn: async () => {
      const { data } = await supabase.from('nhe_sales')
        .select('sale_date,amount,sale_type')
        .in('sale_type', ['bird_cull', 'bird_lame', 'bird_weak', 'bird_sex_error'])
        .gte('sale_date', start).lte('sale_date', end)
      return data ?? []
    }
  })

  const { data: otherIncomeData } = useQuery({
    queryKey: ['cpl_other_income', fy],
    queryFn: async () => {
      const { data } = await supabase.from('nhe_sales')
        .select('sale_date,amount,sale_type')
        .in('sale_type', ['gas', 'manure', 'gunny_bags', 'maize_bags', 'plastic_bags', 'other'])
        .gte('sale_date', start).lte('sale_date', end)
      return data ?? []
    }
  })

  // ── COST QUERIES ──────────────────────────────────────────────────────────
  // Chick cost: flocks placed in this FY
  const { data: flocksData } = useQuery({
    queryKey: ['cpl_flocks', fy],
    queryFn: async () => {
      const { data } = await supabase.from('flocks')
        .select('placement_date,chick_cost')
        .gte('placement_date', start).lte('placement_date', end)
      return data ?? []
    }
  })

  // Feed cost: GRN total_amount by grn_date
  const { data: grnData } = useQuery({
    queryKey: ['cpl_grn', fy],
    queryFn: async () => {
      const { data } = await supabase.from('grn')
        .select('grn_date,total_amount,category')
        .gte('grn_date', start).lte('grn_date', end)
      // Medicine/Vaccine GRNs are excluded here — that spend is already counted
      // via the medicine_usage line, so including it would double-count.
      return (data ?? []).filter((r: any) => r.category !== 'Medicine' && r.category !== 'Vaccine')
    }
  })

  // Medicine
  const { data: medData } = useQuery({
    queryKey: ['cpl_med', fy],
    queryFn: async () => {
      const { data } = await supabase.from('medicine_usage')
        .select('usage_date,amount')
        .gte('usage_date', start).lte('usage_date', end)
      return data ?? []
    }
  })

  // Electricity
  const { data: elecData } = useQuery({
    queryKey: ['cpl_elec', fy],
    queryFn: async () => {
      const { data } = await supabase.from('electricity_bills')
        .select('bill_month,amount')
        .gte('bill_month', start).lte('bill_month', end)
      return data ?? []
    }
  })

  // Salary
  const { data: salaryData } = useQuery({
    queryKey: ['cpl_salary', fy],
    queryFn: async () => {
      const { data } = await supabase.from('salary_abstract')
        .select('month,net_salary')
        .gte('month', start).lte('month', end)
      return data ?? []
    }
  })

  // Farm expenses
  const { data: farmExpData } = useQuery({
    queryKey: ['cpl_farmexp', fy],
    queryFn: async () => {
      const { data } = await supabase.from('farm_expenses')
        .select('expense_date,amount')
        .gte('expense_date', start).lte('expense_date', end)
      return data ?? []
    }
  })

  // Closing stock: all-time GRN, production usage, adjustments (cumulative up to FY end)
  const { data: allGrnStock } = useQuery({
    queryKey: ['cpl_stock_grn'],
    queryFn: async () => {
      let all: any[] = [], from = 0
      while (true) {
        const { data } = await supabase.from('grn')
          .select('item_name,qty,price_per_unit,grn_date').order('grn_date', { ascending: true }).range(from, from + 999)
        if (!data || !data.length) break
        all = all.concat(data); if (data.length < 1000) break; from += 1000
      }
      return all
    },
  })
  const { data: allProdUsage } = useQuery({
    queryKey: ['cpl_stock_prod'],
    queryFn: async () => {
      const { data } = await supabase.from('feed_production_ingredients')
        .select('ingredient_name,quantity_kg,feed_production_log(production_date)').limit(50000)
      return (data ?? []).map((r: any) => ({
        item_name: r.ingredient_name,
        qty: Number(r.quantity_kg ?? 0),
        date: r.feed_production_log?.production_date ?? null,
      }))
    },
  })
  const { data: allAdjustments } = useQuery({
    queryKey: ['cpl_stock_adj'],
    queryFn: async () => {
      const { data } = await supabase.from('feed_stock_adjustments').select('ingredient_name,adjustment_kg,adjustment_type,adjustment_date,rate')
      return data ?? []
    },
  })

  // ── COMPUTE MONTHLY MAPS ──────────────────────────────────────────────────
  const heByMonth      = useMemo(() => sumByMonth(heData ?? [], 'dispatch_date', 'amount'), [heData])
  const nheEggByMonth  = useMemo(() => sumByMonth(nheSalesEgg ?? [], 'sale_date', 'amount'), [nheSalesEgg])
  const chickByMonth   = useMemo(() => {
    const map: Record<string, number> = {}
    for (const r of hatchData ?? []) {
      const m = toMonth(r.hatch_date ?? '')
      if (!m) continue
      map[m] = (map[m] ?? 0) + (r.chick_amount ?? (r.chicks_sold ?? 0) * (r.chick_rate ?? 0))
    }
    return map
  }, [hatchData])
  const cullByMonth     = useMemo(() => sumByMonth(cullData ?? [], 'sale_date', 'amount'), [cullData])
  const otherIncByMonth = useMemo(() => sumByMonth(otherIncomeData ?? [], 'sale_date', 'amount'), [otherIncomeData])

  // Chick cost by placement month
  const chickCostByMonth = useMemo(() => {
    const map: Record<string, number> = {}
    for (const f of flocksData ?? []) {
      const m = toMonth(f.placement_date ?? '')
      if (!m) continue
      map[m] = (map[m] ?? 0) + (f.chick_cost ?? 0)
    }
    return map
  }, [flocksData])
  const feedByMonth    = useMemo(() => sumByMonth(grnData ?? [], 'grn_date', 'total_amount'), [grnData])
  const medByMonth     = useMemo(() => sumByMonth(medData ?? [], 'usage_date', 'amount'), [medData])
  const elecByMonth    = useMemo(() => {
    // electricity_bills uses bill_month (YYYY-MM-DD), take first 7 chars
    const map: Record<string, number> = {}
    for (const r of elecData ?? []) {
      const m = toMonth(r.bill_month ?? '')
      if (!m) continue
      map[m] = (map[m] ?? 0) + (r.amount ?? 0)
    }
    return map
  }, [elecData])
  const salaryByMonth  = useMemo(() => {
    const map: Record<string, number> = {}
    for (const r of salaryData ?? []) {
      const m = toMonth(r.month ?? '')
      if (!m) continue
      map[m] = (map[m] ?? 0) + (r.net_salary ?? 0)
    }
    return map
  }, [salaryData])
  const farmExpByMonth = useMemo(() => sumByMonth(farmExpData ?? [], 'expense_date', 'amount'), [farmExpData])

  // Stock value as of a cutoff date (used for both FY-end closing and FY-start opening)
  const stockValueAsOf = useMemo(() => (cutoff: string) => {
    const m: Record<string, { received: number; used: number; opening: number; adjusted: number; rate: number; lastDate: string }> = {}
    const norm = (s?: string | null) => (s ?? '').trim().toLowerCase()
    const ensure = (name: string) => {
      const k = norm(name)
      if (!m[k]) m[k] = { received: 0, used: 0, opening: 0, adjusted: 0, rate: 0, lastDate: '' }
      return m[k]
    }
    for (const g of allGrnStock ?? []) {
      if (!g.item_name || g.grn_date > cutoff) continue
      const r = ensure(g.item_name)
      r.received += Number(g.qty ?? 0)
      if (g.grn_date >= r.lastDate) { r.rate = Number(g.price_per_unit ?? 0); r.lastDate = g.grn_date }
    }
    for (const u of allProdUsage ?? []) {
      if (!u.item_name || (u.date && u.date > cutoff)) continue
      ensure(u.item_name).used += Number(u.qty ?? 0)
    }
    for (const a of allAdjustments ?? []) {
      if (!a.ingredient_name || (a.adjustment_date && a.adjustment_date > cutoff)) continue
      const r = ensure(a.ingredient_name)
      if (a.adjustment_type === 'Opening') r.opening += Number(a.adjustment_kg ?? 0)
      else r.adjusted += Number(a.adjustment_kg ?? 0)
    }
    let total = 0
    for (const r of Object.values(m)) {
      const closing = r.opening + r.received + r.adjusted - r.used
      if (closing > 0 && r.rate > 0) total += closing * r.rate
    }
    return total
  }, [allGrnStock, allProdUsage, allAdjustments])

  // Closing stock value as of FY end date
  const closingStockValue = useMemo(() => stockValueAsOf(end), [stockValueAsOf, end])
  // Opening stock = stock value the day before the FY starts (prior FY's closing)
  const openingStockValue = useMemo(
    () => stockValueAsOf(`${start.slice(0, 4)}-03-31`), // day before FY start (start is always YYYY-04-01)
    [stockValueAsOf, start])

  // ── MONTHLY TABLE DATA ────────────────────────────────────────────────────
  const rows = useMemo(() => months.map(m => {
    const heAmt      = heByMonth[m] ?? 0
    const nheEgg     = nheEggByMonth[m] ?? 0
    const chickSale  = chickByMonth[m] ?? 0
    const cull       = cullByMonth[m] ?? 0
    const otherInc   = otherIncByMonth[m] ?? 0
    const totalRev   = heAmt + nheEgg + chickSale + cull + otherInc

    const chickCost  = chickCostByMonth[m] ?? 0
    const feed       = feedByMonth[m] ?? 0
    const med        = medByMonth[m] ?? 0
    const elec       = elecByMonth[m] ?? 0
    const salary     = salaryByMonth[m] ?? 0
    const farmExp    = farmExpByMonth[m] ?? 0
    const totalCost  = chickCost + feed + med + elec + salary + farmExp
    const net        = totalRev - totalCost

    return { m, label: monthLabel(m), heAmt, nheEgg, chickSale, cull, otherInc, totalRev, chickCost, feed, med, elec, salary, farmExp, totalCost, net, closingStock: 0 }
  }), [months, heByMonth, nheEggByMonth, chickByMonth, cullByMonth, otherIncByMonth, chickCostByMonth, feedByMonth, medByMonth, elecByMonth, salaryByMonth, farmExpByMonth])

  // ── ANNUAL TOTALS ─────────────────────────────────────────────────────────
  const totals = useMemo(() => {
    const base = rows.reduce((acc, r) => ({
      heAmt: acc.heAmt + r.heAmt,
      nheEgg: acc.nheEgg + r.nheEgg,
      chickSale: acc.chickSale + r.chickSale,
      cull: acc.cull + r.cull,
      otherInc: acc.otherInc + r.otherInc,
      totalRev: acc.totalRev + r.totalRev,
      chickCost: acc.chickCost + r.chickCost,
      feed: acc.feed + r.feed,
      med: acc.med + r.med,
      elec: acc.elec + r.elec,
      salary: acc.salary + r.salary,
      farmExp: acc.farmExp + r.farmExp,
      totalCost: acc.totalCost + r.totalCost,
      net: acc.net + r.net,
    }), { heAmt: 0, nheEgg: 0, chickSale: 0, cull: 0, otherInc: 0, totalRev: 0, chickCost: 0, feed: 0, med: 0, elec: 0, salary: 0, farmExp: 0, totalCost: 0, net: 0 })
    // Stock adjustment: add closing stock (asset) and deduct opening stock
    // (prior FY's closing) so profit reflects only this year's stock movement.
    return {
      ...base,
      closingStock: closingStockValue,
      openingStock: openingStockValue,
      netAfterStock: base.net + closingStockValue - openingStockValue,
    }
  }, [rows, closingStockValue, openingStockValue])

  const isLoading = heLoading

  // ── EXPORT ────────────────────────────────────────────────────────────────
  const exportCSV = () => {
    const lineItems = [
      { label: 'HE Egg Sales', ...Object.fromEntries(rows.map(r => [r.label, r.heAmt])) },
      { label: 'NHE Egg Sales', ...Object.fromEntries(rows.map(r => [r.label, r.nheEgg])) },
      { label: 'Chick Sales', ...Object.fromEntries(rows.map(r => [r.label, r.chickSale])) },
      { label: 'Cull/Bird Sales', ...Object.fromEntries(rows.map(r => [r.label, r.cull])) },
      { label: 'Other Income', ...Object.fromEntries(rows.map(r => [r.label, r.otherInc])) },
      { label: 'TOTAL REVENUE', ...Object.fromEntries(rows.map(r => [r.label, r.totalRev])) },
      { label: '---', ...Object.fromEntries(rows.map(r => [r.label, ''])) },
      { label: 'Chick Cost', ...Object.fromEntries(rows.map(r => [r.label, r.chickCost])) },
      { label: 'Feed Cost', ...Object.fromEntries(rows.map(r => [r.label, r.feed])) },
      { label: 'Medicine Cost', ...Object.fromEntries(rows.map(r => [r.label, r.med])) },
      { label: 'Electricity', ...Object.fromEntries(rows.map(r => [r.label, r.elec])) },
      { label: 'Salary', ...Object.fromEntries(rows.map(r => [r.label, r.salary])) },
      { label: 'Farm Expenses', ...Object.fromEntries(rows.map(r => [r.label, r.farmExp])) },
      { label: 'TOTAL COST', ...Object.fromEntries(rows.map(r => [r.label, r.totalCost])) },
      { label: 'NET PROFIT / LOSS', ...Object.fromEntries(rows.map(r => [r.label, r.net])) },
    ]
    const ws = XLSX.utils.json_to_sheet(lineItems)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, `PL_${fy}`)
    XLSX.writeFile(wb, `CompanyPL_${fy}.xlsx`)
  }

  // ── RENDER HELPERS ────────────────────────────────────────────────────────
  const displayCols = view === 'monthly' ? months : ['annual']

  type RowDef = {
    label: string
    key: keyof typeof totals
    style: 'revenue' | 'cost' | 'total-rev' | 'total-cost' | 'net' | 'stock'
    annualOnly?: boolean
  }

  const lineItemDefs: RowDef[] = [
    { label: 'HE Egg Sales',   key: 'heAmt',     style: 'revenue' },
    { label: 'NHE Egg Sales (JE/TE/BE)', key: 'nheEgg',   style: 'revenue' },
    { label: 'Chick Sales',    key: 'chickSale', style: 'revenue' },
    { label: 'Cull / Bird Sales', key: 'cull',  style: 'revenue' },
    { label: 'Other Income',   key: 'otherInc',  style: 'revenue' },
    { label: 'TOTAL REVENUE',  key: 'totalRev',  style: 'total-rev' },
    { label: 'Chick Cost',     key: 'chickCost', style: 'cost' },
    { label: 'Feed Cost (GRN)',key: 'feed',      style: 'cost' },
    { label: 'Medicine Cost',  key: 'med',       style: 'cost' },
    { label: 'Electricity',    key: 'elec',      style: 'cost' },
    { label: 'Salary',         key: 'salary',    style: 'cost' },
    { label: 'Farm Expenses',  key: 'farmExp',   style: 'cost' },
    { label: 'TOTAL COST',     key: 'totalCost', style: 'total-cost' },
    { label: 'Add: Closing Stock (Asset)', key: 'closingStock', style: 'stock', annualOnly: true },
    { label: 'Less: Opening Stock', key: 'openingStock', style: 'stock', annualOnly: true },
    { label: 'NET PROFIT / LOSS', key: 'net',   style: 'net' },
    { label: 'NET PROFIT (after stock adjustment)', key: 'netAfterStock', style: 'net', annualOnly: true },
  ]

  const getVal = (def: RowDef, col: string) => {
    if (col === 'annual') return totals[def.key]
    const row = rows.find(r => r.m === col)
    return row ? (row as any)[def.key] : 0
  }

  const cellClass = (style: RowDef['style'], val: number) => {
    switch (style) {
      case 'revenue':    return 'text-right text-green-700'
      case 'cost':       return 'text-right text-red-600'
      case 'total-rev':  return 'text-right font-bold text-green-800 bg-green-50'
      case 'total-cost': return 'text-right font-bold text-red-800 bg-red-50'
      case 'stock':      return 'text-right font-medium text-purple-700 bg-purple-50'
      case 'net':        return `text-right font-bold text-lg ${val >= 0 ? 'text-blue-700 bg-blue-50' : 'text-red-700 bg-red-50'}`
      default:           return 'text-right'
    }
  }

  const labelClass = (style: RowDef['style']) => {
    switch (style) {
      case 'total-rev':  return 'font-bold text-green-800 bg-green-50'
      case 'total-cost': return 'font-bold text-red-800 bg-red-50'
      case 'stock':      return 'font-medium text-purple-800 bg-purple-50 pl-2'
      case 'net':        return 'font-bold text-gray-900 bg-blue-50'
      case 'cost':       return 'text-gray-600 pl-2'
      case 'revenue':    return 'text-gray-600 pl-2'
      default:           return ''
    }
  }

  const isSeparator = (style: RowDef['style'], prev?: RowDef['style']) =>
    style === 'cost' && prev !== 'cost' && prev !== 'total-rev' // add spacing before cost section

  const margin = totals.totalRev > 0 ? (totals.net / totals.totalRev * 100).toFixed(1) : '0'

  const costItems = [
    { label: 'Chick Cost',      value: totals.chickCost },
    { label: 'Feed Cost',       value: totals.feed },
    { label: 'Medicine',        value: totals.med },
    { label: 'Electricity',     value: totals.elec },
    { label: 'Salary',          value: totals.salary },
    { label: 'Farm Expenses',   value: totals.farmExp },
    { label: 'Less: Closing Stock', value: -closingStockValue },
  ]

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Company-wide P&L"
        subtitle="All flocks combined — revenue vs cost summary"
        action={<Button variant="secondary" icon={<Download size={16}/>} onClick={exportCSV}>Export Excel</Button>}
      />

      {/* Controls */}
      <div className="flex gap-3 items-center flex-wrap">
        <Select label="Financial Year" options={FY_OPTIONS} value={fy} onChange={e => setFy(e.target.value)} className="w-44"/>
        <div className="flex gap-1 mt-5">
          <button onClick={() => setView('monthly')}
            className={`px-3 py-1.5 text-sm rounded-l border ${view === 'monthly' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}>
            Monthly
          </button>
          <button onClick={() => setView('annual')}
            className={`px-3 py-1.5 text-sm rounded-r border-t border-b border-r ${view === 'annual' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}>
            Annual
          </button>
        </div>
      </div>

      {isLoading ? <Spinner/> : (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <Card className="bg-green-50">
              <p className="text-xs text-gray-500 mb-1">Total Revenue</p>
              <p className="text-lg font-bold text-green-700">{inr(totals.totalRev)}</p>
            </Card>
            <Card className="bg-red-50">
              <p className="text-xs text-gray-500 mb-1">Total Cost</p>
              <p className="text-lg font-bold text-red-700">{inr(totals.totalCost)}</p>
            </Card>
            <Card className={totals.net >= 0 ? 'bg-blue-50' : 'bg-orange-50'}>
              <p className="text-xs text-gray-500 mb-1">Net Profit / Loss</p>
              <p className={`text-lg font-bold ${totals.net >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
                {inr(totals.net)}
              </p>
            </Card>
            <Card className="bg-purple-50">
              <p className="text-xs text-gray-500 mb-1">Closing Stock (Asset)</p>
              <p className="text-lg font-bold text-purple-700">{inr(closingStockValue)}</p>
            </Card>
            <Card className={totals.netAfterStock >= 0 ? 'bg-blue-50' : 'bg-orange-50'}>
              <p className="text-xs text-gray-500 mb-1">Net + Stock Adj.</p>
              <p className={`text-lg font-bold ${totals.netAfterStock >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
                {inr(totals.netAfterStock)}
              </p>
            </Card>
            <Card>
              <p className="text-xs text-gray-500 mb-1">Margin %</p>
              <p className={`text-lg font-bold ${parseFloat(margin) >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
                {margin}%
              </p>
            </Card>
          </div>

          {/* P&L Table */}
          <Card padding={false}>
            <div className="overflow-x-auto">
              <Table>
                <thead>
                  <tr>
                    <Th className="min-w-[180px]">Line Item</Th>
                    {view === 'monthly'
                      ? months.map(m => <Th key={m} className="text-right text-xs min-w-[90px]">{monthLabel(m)}</Th>)
                      : <Th className="text-right min-w-[130px]">FY {fy}</Th>
                    }
                    {view === 'monthly' && <Th className="text-right font-bold min-w-[110px]">Total</Th>}
                  </tr>
                </thead>
                <tbody>
                  {lineItemDefs.map((def, idx) => {
                    if (def.annualOnly && view === 'monthly') return null
                    const isTotalRev = def.style === 'total-rev'
                    const isTotalCost = def.style === 'total-cost'
                    const isNet = def.style === 'net'
                    const isStock = def.style === 'stock'
                    const annualVal = totals[def.key]

                    return (
                      <React.Fragment key={def.key}>
                        {(isTotalRev || isTotalCost || isNet || isStock) && (
                          <tr><td colSpan={view === 'monthly' ? months.length + 2 : 2} className="h-1 bg-white p-0"></td></tr>
                        )}
                        <tr className={`${isTotalRev || isTotalCost || isNet || isStock ? '' : 'hover:bg-gray-50'}`}>
                          <Td className={`sticky left-0 z-10 bg-white ${labelClass(def.style)}`}>
                            {def.label}
                          </Td>
                          {!def.annualOnly && displayCols.map(col => {
                            const val = getVal(def, col)
                            return (
                              <td key={col} className={`px-3 py-2 text-sm ${cellClass(def.style, val)}`}>
                                {val !== 0 ? inr(val) : <span className="text-gray-300">—</span>}
                              </td>
                            )
                          })}
                          {def.annualOnly && (
                            <td colSpan={view === 'annual' ? 1 : months.length + 1} className={`px-3 py-2 text-sm ${cellClass(def.style, annualVal)}`}>
                              {annualVal !== 0 ? inr(annualVal) : <span className="text-gray-300">—</span>}
                            </td>
                          )}
                          {!def.annualOnly && view === 'monthly' && (
                            <td className={`px-3 py-2 text-sm ${cellClass(def.style, annualVal)}`}>
                              {annualVal !== 0 ? inr(annualVal) : <span className="text-gray-300">—</span>}
                            </td>
                          )}
                        </tr>
                      </React.Fragment>
                    )
                  })}
                </tbody>
              </Table>
            </div>
          </Card>

          {/* Cost breakdown */}
          {totals.totalCost > 0 && (
            <CostBreakdown items={costItems} total={totals.totalCost} />
          )}
        </>
      )}
    </div>
  )
}

export default CompanyPL
