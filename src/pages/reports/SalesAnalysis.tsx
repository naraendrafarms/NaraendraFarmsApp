import React, { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import {
  inr, inrNum, fmtDate, fetchAllPages, exportCSV, fyRange, FY_OPTIONS,
} from '@/lib/utils'
import {
  Card, CardHeader, SectionHeader, Select, SearchableSelect, DateInput,
  Spinner, EmptyState, Table, Th, Td, Button, StatCard,
  usePagination, PageSizeControl,
} from '@/components/ui'
import { Download, IndianRupee, FileText, Egg } from 'lucide-react'
import toast from 'react-hot-toast'

// ── Sales Analysis ───────────────────────────────────────────────────────────
// EVERY sale in ONE report -- hatching eggs and non-hatching alike -- readable
// flock-wise, vendor-wise, grade-wise and type-wise without leaving the page.
//
// Until now those four dimensions were spread over four screens and no screen
// carried more than two: the Sales Invoice Register has flock, party and type
// but only invoiced rows and no quantity, rate or grade; Egg Stock Balance
// splits JE/TE/BE quantity but has no party and no money; the Bird / Cull Sales
// Report is bird types only; GST Reports is a tax return. Picking a vendor and
// asking "how many A grade, how many B grade, how many invoices, and what about
// the JE and TE" could not be answered anywhere.
//
// TWO RULES THIS REPORT OBEYS, both already established elsewhere in the app:
//
//  1. LINES WIN OVER THE HEADER. Both he_dispatch/he_dispatch_lines and
//     nhe_sales/nhe_sale_lines store the same figures in two places -- the
//     header mirrors its lines. Counting both double-counts (this is the same
//     trap nheEggsLeavingStock in lib/utils exists to prevent, where free eggs
//     would have been deducted twice). So: where lines exist they are the
//     truth, and the header is used only for a sale saved without lines.
//
//  2. FREE IS NOT BILLED BUT IT DID LEAVE. Free eggs are shown in their own
//     column and counted in quantity, never in amount.
//
// WHAT DELIBERATELY IS NOT HERE: money split by egg grade. A rate on
// he_dispatch_lines is per PRODUCTION DATE, not per grade -- A and B eggs on
// one line share one rate -- so a "grade A revenue" figure would have to be
// invented. Grade quantities are real and shown; grade money is not, and the
// footnote on the summary says so rather than leaving a plausible blank.

const HE = 'he'

const TYPE_LABEL: Record<string, string> = {
  he: 'HE (Hatching Eggs)',
  je: 'JE (Jumbo Eggs)',
  te: 'TE (Table Eggs)',
  be: 'BE (Broken / Crack)',
  bird_sale: 'Bird Sales',
  gas: 'Gas Cylinders',
  manure: 'Manure / Litter',
  other: 'Other Income',
}
// The four legacy bird types predate the single 'bird_sale' value and are still
// on historical rows, so they are folded in rather than shown as four types.
const LEGACY_BIRD = ['bird_cull', 'bird_lame', 'bird_weak', 'bird_sex_error']
const normType = (t: string) => (LEGACY_BIRD.includes(t) ? 'bird_sale' : t)
const typeLabel = (t: string) => TYPE_LABEL[normType(t)] ?? t

const TYPE_FILTER_OPTIONS = [
  { value: 'he', label: 'HE (Hatching Eggs)' },
  { value: 'je', label: 'JE (Jumbo Eggs)' },
  { value: 'te', label: 'TE (Table Eggs)' },
  { value: 'be', label: 'BE (Broken / Crack)' },
  { value: 'bird_sale', label: 'Bird Sales' },
  { value: 'gas', label: 'Gas Cylinders' },
  { value: 'manure', label: 'Manure / Litter' },
  { value: 'other', label: 'Other Income' },
]

const GROUP_OPTIONS = [
  { value: 'vendor', label: 'Vendor / Buyer' },
  { value: 'flock', label: 'Flock' },
  { value: 'type', label: 'Sale Type' },
  { value: 'month', label: 'Month' },
]

// One row of the report. A row is one SALE LINE, not one sale: an NHE sale that
// billed JE and TE together is two rows, so a type filter can never split an
// amount it does not own.
interface SaleRow {
  key: string
  sale_id: string          // the document, so invoices and sales can be counted distinctly
  date: string
  source: 'HE' | 'NHE'
  type: string
  invoice_no: string | null
  dc_no: string | null
  party: string
  party_id: string | null
  flock: string
  flock_id: string | null
  grade_a: number
  grade_b: number
  grade_c: number
  qty: number
  free: number
  rate: number | null
  amount: number
  gst_pct: number | null
  status: string | null
  employee_sale: boolean
}

const num = (v: any) => Number(v) || 0

export const SalesAnalysis: React.FC = () => {
  const [fy, setFy] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [partyId, setPartyId] = useState('')
  const [flockId, setFlockId] = useState('')
  const [saleType, setSaleType] = useState('')
  const [soldTo, setSoldTo] = useState('')      // '', 'buyer', 'employee'
  const [groupBy, setGroupBy] = useState('vendor')

  const applyFy = (v: string) => {
    setFy(v)
    if (v) { const r = fyRange(v); setFromDate(r.start); setToDate(r.end) }
  }

  const { data: flocks = [] } = useQuery({
    queryKey: ['flocks_sales_analysis'],
    queryFn: async () => {
      const { data } = await supabase.from('flocks').select('id,flock_no').order('flock_no')
      return data ?? []
    },
  })
  const { data: parties = [] } = useQuery({
    queryKey: ['parties_sales_analysis'],
    queryFn: async () => {
      const { data } = await supabase.from('parties').select('id,name')
        .in('type', ['buyer', 'both']).order('name')
      return data ?? []
    },
  })

  // ── HE dispatches ─────────────────────────────────────────────────────────
  // Money lives on the dispatch; the grade split lives on its lines. So a
  // dispatch is ONE row carrying the summed grades -- splitting the amount
  // across production dates would be an invention, and the per-date detail
  // already exists on the HE Dispatch screen.
  const { data: heRows = [], isLoading: heLoading } = useQuery({
    queryKey: ['sales_analysis_he'],
    queryFn: async () => {
      const data = await fetchAllPages<any>(
        (from, to) => supabase.from('he_dispatch')
          .select('id,dispatch_date,invoice_no,dc_no,amount,rate,grade_a,grade_b,grade_c,'
            + 'free_eggs,total_dispatched,payment_status,gst_pct,party_id,flock_id,'
            + 'parties(name),flocks(flock_no),he_dispatch_lines(grade_a,grade_b,grade_c,rate)')
          .order('dispatch_date', { ascending: false }).order('id').range(from, to),
        'HE dispatches', toast.error,
      )
      return data.map((r: any): SaleRow => {
        const lines = (r.he_dispatch_lines ?? []) as any[]
        const useLines = lines.length > 0
        const a = useLines ? lines.reduce((s, l) => s + num(l.grade_a), 0) : num(r.grade_a)
        const b = useLines ? lines.reduce((s, l) => s + num(l.grade_b), 0) : num(r.grade_b)
        const c = useLines ? lines.reduce((s, l) => s + num(l.grade_c), 0) : num(r.grade_c)
        // total_dispatched is the dispatch's own count and can legitimately
        // differ from A+B+C on older rows; the graded sum is preferred when it
        // is non-zero, and total_dispatched fills in when no grade was recorded.
        const graded = a + b + c
        return {
          key: 'he_' + r.id,
          sale_id: r.id,
          date: r.dispatch_date,
          source: 'HE',
          type: HE,
          invoice_no: r.invoice_no ?? null,
          dc_no: r.dc_no != null ? String(r.dc_no) : null,
          party: r.parties?.name ?? '—',
          party_id: r.party_id ?? null,
          flock: r.flocks?.flock_no ? `Flock ${r.flocks.flock_no}` : '—',
          flock_id: r.flock_id ?? null,
          grade_a: a, grade_b: b, grade_c: c,
          qty: graded > 0 ? graded : num(r.total_dispatched),
          free: num(r.free_eggs),
          rate: r.rate != null ? Number(r.rate) : null,
          amount: num(r.amount),
          gst_pct: r.gst_pct != null ? Number(r.gst_pct) : null,
          status: r.payment_status ?? null,
          employee_sale: false,
        }
      })
    },
  })

  // ── NHE sales ─────────────────────────────────────────────────────────────
  // A line carries its own type, quantity, rate AND amount, so a multi-type
  // sale becomes one row per type with real money on each -- nothing computed.
  const { data: nheRows = [], isLoading: nheLoading } = useQuery({
    queryKey: ['sales_analysis_nhe'],
    queryFn: async () => {
      const data = await fetchAllPages<any>(
        (from, to) => supabase.from('nhe_sales')
          .select('id,sale_date,invoice_no,dc_no,sale_type,quantity,free_qty,rate,amount,'
            + 'payment_status,gst_pct,party_id,flock_id,is_employee_sale,'
            + 'parties(name),flocks(flock_no),nhe_sale_lines(sale_type,quantity,free_qty,rate,amount)')
          .order('sale_date', { ascending: false }).order('id').range(from, to),
        'NHE sales', toast.error,
      )
      const out: SaleRow[] = []
      for (const r of data) {
        const base = {
          sale_id: r.id,
          date: r.sale_date,
          source: 'NHE' as const,
          invoice_no: r.invoice_no ?? null,
          dc_no: r.dc_no != null ? String(r.dc_no) : null,
          party: r.parties?.name ?? '—',
          party_id: r.party_id ?? null,
          flock: r.flocks?.flock_no ? `Flock ${r.flocks.flock_no}` : '—',
          flock_id: r.flock_id ?? null,
          grade_a: 0, grade_b: 0, grade_c: 0,   // grades are an HE concept only
          gst_pct: r.gst_pct != null ? Number(r.gst_pct) : null,
          status: r.payment_status ?? null,
          employee_sale: !!r.is_employee_sale,
        }
        const lines = (r.nhe_sale_lines ?? []) as any[]
        if (lines.length > 0) {
          lines.forEach((l, i) => out.push({
            ...base,
            key: `nhe_${r.id}_${i}`,
            type: normType(l.sale_type ?? ''),
            qty: num(l.quantity),
            free: num(l.free_qty),
            rate: l.rate != null ? Number(l.rate) : null,
            amount: num(l.amount),
          }))
        } else {
          out.push({
            ...base,
            key: 'nhe_' + r.id,
            type: normType(r.sale_type ?? ''),
            qty: num(r.quantity),
            free: num(r.free_qty),
            rate: r.rate != null ? Number(r.rate) : null,
            amount: num(r.amount),
          })
        }
      }
      return out
    },
  })

  const isLoading = heLoading || nheLoading

  const rows = useMemo(() => {
    const all = [...heRows, ...nheRows]
    return all
      .filter(r => {
        if (fromDate && r.date < fromDate) return false
        if (toDate && r.date > toDate) return false
        if (partyId && r.party_id !== partyId) return false
        if (flockId && r.flock_id !== flockId) return false
        if (saleType && r.type !== saleType) return false
        if (soldTo === 'buyer' && r.employee_sale) return false
        if (soldTo === 'employee' && !r.employee_sale) return false
        return true
      })
      .sort((a, b) => b.date.localeCompare(a.date))
  }, [heRows, nheRows, fromDate, toDate, partyId, flockId, saleType, soldTo])

  // ── Summary ───────────────────────────────────────────────────────────────
  // Invoices and sales are counted DISTINCTLY on the document, not on the row:
  // a sale billing JE and TE is two rows but one invoice, and counting rows
  // would report twice the invoices the buyer ever received.
  interface Group {
    label: string
    invoices: Set<string>
    sales: Set<string>
    grade_a: number; grade_b: number; grade_c: number
    byType: Record<string, number>
    qty: number; free: number; amount: number
  }
  const groups = useMemo(() => {
    const m = new Map<string, Group>()
    const keyOf = (r: SaleRow) =>
      groupBy === 'vendor' ? r.party
      : groupBy === 'flock' ? r.flock
      : groupBy === 'type' ? typeLabel(r.type)
      : String(r.date).slice(0, 7)
    for (const r of rows) {
      const k = keyOf(r)
      let g = m.get(k)
      if (!g) {
        g = { label: k, invoices: new Set(), sales: new Set(), grade_a: 0, grade_b: 0,
              grade_c: 0, byType: {}, qty: 0, free: 0, amount: 0 }
        m.set(k, g)
      }
      if (r.invoice_no) g.invoices.add(r.invoice_no)
      g.sales.add(r.sale_id)
      g.grade_a += r.grade_a; g.grade_b += r.grade_b; g.grade_c += r.grade_c
      g.byType[r.type] = (g.byType[r.type] ?? 0) + r.qty
      g.qty += r.qty; g.free += r.free; g.amount += r.amount
    }
    return [...m.values()].sort((a, b) => b.amount - a.amount)
  }, [rows, groupBy])

  const totals = useMemo(() => {
    const invoices = new Set<string>(), sales = new Set<string>()
    let a = 0, b = 0, c = 0, qty = 0, free = 0, amount = 0
    for (const r of rows) {
      if (r.invoice_no) invoices.add(r.invoice_no)
      sales.add(r.sale_id)
      a += r.grade_a; b += r.grade_b; c += r.grade_c
      qty += r.qty; free += r.free; amount += r.amount
    }
    return { invoices: invoices.size, sales: sales.size, a, b, c, qty, free, amount }
  }, [rows])

  const { page, setPage, pageSize, setPageSize, totalPages, from, to } =
    usePagination(rows.length, rows.length)
  const visible = rows.slice(from, to)

  const exportDetail = () => {
    exportCSV(
      `sales_analysis_detail_${fromDate || 'all'}_${toDate || 'all'}.csv`,
      ['Date', 'Source', 'Type', 'Invoice No', 'DC No', 'Vendor', 'Flock',
       'Grade A', 'Grade B', 'Grade C', 'Quantity', 'Free', 'Rate', 'Amount',
       'GST %', 'Payment Status', 'Employee Sale'],
      rows.map(r => [
        fmtDate(r.date), r.source, typeLabel(r.type), r.invoice_no ?? '', r.dc_no ?? '',
        r.party, r.flock, r.grade_a, r.grade_b, r.grade_c, r.qty, r.free,
        r.rate ?? '', r.amount, r.gst_pct ?? '', r.status ?? '', r.employee_sale ? 'Yes' : 'No',
      ]),
    )
  }

  const exportSummary = () => {
    const label = GROUP_OPTIONS.find(g => g.value === groupBy)?.label ?? 'Group'
    exportCSV(
      `sales_analysis_summary_by_${groupBy}_${fromDate || 'all'}_${toDate || 'all'}.csv`,
      [label, 'Invoices', 'Sales', 'Grade A', 'Grade B', 'Grade C',
       'HE', 'JE', 'TE', 'BE', 'Birds', 'Manure', 'Other',
       'Total Qty', 'Free', 'Amount'],
      groups.map(g => [
        g.label, g.invoices.size, g.sales.size, g.grade_a, g.grade_b, g.grade_c,
        g.byType[HE] ?? 0, g.byType.je ?? 0, g.byType.te ?? 0, g.byType.be ?? 0,
        g.byType.bird_sale ?? 0, g.byType.manure ?? 0,
        (g.byType.gas ?? 0) + (g.byType.other ?? 0),
        g.qty, g.free, g.amount,
      ]),
    )
  }

  const groupLabel = GROUP_OPTIONS.find(g => g.value === groupBy)?.label ?? 'Group'

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Sales Analysis"
        subtitle="Every sale — hatching and non-hatching — by vendor, flock, grade and type in one view"
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" icon={<Download size={14} />}
              onClick={exportSummary} disabled={!groups.length}>Export Summary</Button>
            <Button variant="outline" size="sm" icon={<Download size={14} />}
              onClick={exportDetail} disabled={!rows.length}>Export Detail</Button>
          </div>
        } />

      <Card className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          <SearchableSelect label="Vendor / Buyer" placeholder="All Vendors" value={partyId}
            onChange={setPartyId} options={parties.map((p: any) => ({ value: p.id, label: p.name }))} />
          <Select label="Flock" placeholder="All Flocks" value={flockId}
            onChange={e => setFlockId(e.target.value)}
            options={flocks.map((f: any) => ({ value: f.id, label: `Flock ${f.flock_no}` }))} />
          <Select label="Sale Type" placeholder="All Types" value={saleType}
            onChange={e => setSaleType(e.target.value)} options={TYPE_FILTER_OPTIONS} />
          <Select label="Sold To" placeholder="Everyone" value={soldTo}
            onChange={e => setSoldTo(e.target.value)}
            options={[{ value: 'buyer', label: 'Outside buyers only' },
                      { value: 'employee', label: 'Employee sales only' }]} />
          <Select label="Financial Year" placeholder="— FY —" value={fy}
            onChange={e => applyFy(e.target.value)}
            options={FY_OPTIONS.map(f => ({ value: f, label: f }))} />
          <div>
            <label className="text-sm font-medium text-gray-700">From</label>
            <DateInput value={fromDate} onChange={e => { setFromDate(e.target.value); setFy('') }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">To</label>
            <DateInput value={toDate} onChange={e => { setToDate(e.target.value); setFy('') }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1" />
          </div>
          <Select label="Group Summary By" value={groupBy}
            onChange={e => setGroupBy(e.target.value)} options={GROUP_OPTIONS} />
        </div>
      </Card>

      {isLoading ? <Spinner /> : rows.length === 0 ? (
        <EmptyState icon={<Egg size={32} />} title="No sales found"
          subtitle="Try widening the filters above." />
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Total Sales" value={inr(totals.amount)}
              icon={<IndianRupee size={18} />} subtitle={`${totals.sales} sales`} />
            <StatCard title="Invoices" value={totals.invoices}
              icon={<FileText size={18} />} subtitle="distinct invoice numbers" />
            <StatCard title="Grade A / B / C" value={`${inrNum(totals.a, 0)} / ${inrNum(totals.b, 0)} / ${inrNum(totals.c, 0)}`}
              icon={<Egg size={18} />} subtitle="hatching eggs by grade" />
            <StatCard title="Total Quantity" value={inrNum(totals.qty, 0)}
              subtitle={totals.free > 0 ? `plus ${inrNum(totals.free, 0)} free` : 'all sale types'} />
          </div>

          <Card padding={false}>
            <CardHeader title={`Summary by ${groupLabel}`}
              subtitle={`${groups.length} ${groupBy === 'vendor' ? 'vendors' : groupBy === 'flock' ? 'flocks' : groupBy === 'type' ? 'types' : 'months'} — Grade A/B/C are hatching eggs; JE, TE and BE are counted separately`} />
            <Table>
              <thead><tr>
                <Th>{groupLabel}</Th>
                <Th right>Invoices</Th><Th right>Sales</Th>
                <Th right>Grade A</Th><Th right>Grade B</Th><Th right>Grade C</Th>
                <Th right>HE</Th><Th right>JE</Th><Th right>TE</Th><Th right>BE</Th>
                <Th right>Birds</Th><Th right>Manure</Th><Th right>Other</Th>
                <Th right>Free</Th><Th right>Amount</Th>
              </tr></thead>
              <tbody>
                {groups.map(g => (
                  <tr key={g.label} className="text-sm hover:bg-gray-50">
                    <Td className="text-xs font-medium">{g.label}</Td>
                    <Td right className="text-xs">{g.invoices.size || '—'}</Td>
                    <Td right className="text-xs">{g.sales.size}</Td>
                    <Td right className="text-xs">{g.grade_a ? inrNum(g.grade_a, 0) : '—'}</Td>
                    <Td right className="text-xs">{g.grade_b ? inrNum(g.grade_b, 0) : '—'}</Td>
                    <Td right className="text-xs">{g.grade_c ? inrNum(g.grade_c, 0) : '—'}</Td>
                    <Td right className="text-xs">{g.byType[HE] ? inrNum(g.byType[HE], 0) : '—'}</Td>
                    <Td right className="text-xs">{g.byType.je ? inrNum(g.byType.je, 0) : '—'}</Td>
                    <Td right className="text-xs">{g.byType.te ? inrNum(g.byType.te, 0) : '—'}</Td>
                    <Td right className="text-xs">{g.byType.be ? inrNum(g.byType.be, 0) : '—'}</Td>
                    <Td right className="text-xs">{g.byType.bird_sale ? inrNum(g.byType.bird_sale, 0) : '—'}</Td>
                    <Td right className="text-xs">{g.byType.manure ? inrNum(g.byType.manure, 0) : '—'}</Td>
                    <Td right className="text-xs">
                      {(g.byType.gas ?? 0) + (g.byType.other ?? 0)
                        ? inrNum((g.byType.gas ?? 0) + (g.byType.other ?? 0), 0) : '—'}</Td>
                    <Td right className="text-xs">{g.free ? inrNum(g.free, 0) : '—'}</Td>
                    <Td right className="text-xs font-semibold">{inr(g.amount)}</Td>
                  </tr>
                ))}
                <tr className="text-sm bg-gray-50 font-semibold border-t-2 border-gray-200">
                  <Td className="text-xs">Total</Td>
                  <Td right className="text-xs">{totals.invoices}</Td>
                  <Td right className="text-xs">{totals.sales}</Td>
                  <Td right className="text-xs">{inrNum(totals.a, 0)}</Td>
                  <Td right className="text-xs">{inrNum(totals.b, 0)}</Td>
                  <Td right className="text-xs">{inrNum(totals.c, 0)}</Td>
                  <Td colSpan={7} />
                  <Td right className="text-xs">{inrNum(totals.free, 0)}</Td>
                  <Td right className="text-xs">{inr(totals.amount)}</Td>
                </tr>
              </tbody>
            </Table>
            <p className="text-xs text-gray-500 px-4 py-3">
              Amount is not split by grade: an HE rate is set per production date, so A and B
              eggs on the same line share one rate and no per-grade revenue figure exists in
              the data. Grade quantities above are real; grade revenue would be invented.
            </p>
          </Card>

          <Card padding={false}>
            <CardHeader title={`Detail — ${rows.length} sale lines`}
              subtitle="One row per sale line, so a sale billing JE and TE together appears as two rows" />
            <Table>
              <thead><tr>
                <Th>Date</Th><Th>Type</Th><Th>Invoice No</Th><Th>DC No</Th>
                <Th>Vendor</Th><Th>Flock</Th>
                <Th right>Grade A</Th><Th right>Grade B</Th><Th right>Grade C</Th>
                <Th right>Qty</Th><Th right>Free</Th><Th right>Rate</Th><Th right>Amount</Th>
                <Th>Status</Th>
              </tr></thead>
              <tbody>
                {visible.map(r => (
                  <tr key={r.key} className="text-sm hover:bg-gray-50">
                    <Td className="text-xs">{fmtDate(r.date)}</Td>
                    <Td className="text-xs">{typeLabel(r.type)}</Td>
                    <Td className="text-xs">{r.invoice_no ?? '—'}</Td>
                    <Td className="text-xs">{r.dc_no ?? '—'}</Td>
                    <Td className="text-xs">{r.party}{r.employee_sale ? ' (employee)' : ''}</Td>
                    <Td className="text-xs">{r.flock}</Td>
                    <Td right className="text-xs">{r.grade_a ? inrNum(r.grade_a, 0) : '—'}</Td>
                    <Td right className="text-xs">{r.grade_b ? inrNum(r.grade_b, 0) : '—'}</Td>
                    <Td right className="text-xs">{r.grade_c ? inrNum(r.grade_c, 0) : '—'}</Td>
                    <Td right className="text-xs font-medium">{inrNum(r.qty, 0)}</Td>
                    <Td right className="text-xs">{r.free ? inrNum(r.free, 0) : '—'}</Td>
                    <Td right className="text-xs">{r.rate != null ? inr(r.rate) : '—'}</Td>
                    <Td right className="text-xs font-semibold">{inr(r.amount)}</Td>
                    <Td className="text-xs">{r.status ?? '—'}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
            <PageSizeControl page={page} setPage={setPage} pageSize={pageSize}
              setPageSize={setPageSize} totalPages={totalPages} totalItems={rows.length} />
          </Card>
        </>
      )}
    </div>
  )
}
