import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { inr, fmtDate } from '@/lib/utils'
import {
  Card, Badge, Table, Th, Td, SectionHeader, Spinner
} from '@/components/ui'
import { Egg, DollarSign, BarChart2 } from 'lucide-react'

// ── helpers ────────────────────────────────────────────────────────────────────

type BadgeColor = 'green' | 'yellow' | 'gray'
function statusBadge(status: string): BadgeColor {
  if (status === 'laying')  return 'green'
  if (status === 'rearing') return 'yellow'
  return 'gray'
}

function n(v: number | null | undefined, decimals = 0): string {
  if (v == null || isNaN(v as number)) return '—'
  return (v as number).toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

function pctFmt(v: number | null | undefined, decimals = 1): string {
  if (v == null || isNaN(v as number)) return '—'
  return `${((v as number) * 100).toFixed(decimals)}%`
}

function mtFmt(kg: number | null | undefined): string {
  if (kg == null) return '—'
  return `${(kg / 1000).toFixed(2)} MT`
}

// Highlight the best cell in each metric row.
function bestIdx(values: (number | null)[], lowerBetter = false): number {
  const valid = values
    .map((v, i) => ({ v, i }))
    .filter(x => x.v != null) as { v: number; i: number }[]
  if (valid.length < 2) return -1
  return lowerBetter
    ? valid.reduce((a, b) => (b.v < a.v ? b : a)).i
    : valid.reduce((a, b) => (b.v > a.v ? b : a)).i
}

const BEST_BG = 'bg-green-50'

// ── types ──────────────────────────────────────────────────────────────────────

interface FlockRow {
  id: string
  flock_no: string | number
  breed: string | null
  placement_date: string | null
  paid_female: number | null
  paid_male: number | null
  free_female: number | null
  free_male: number | null
  chick_rate: number | null
  chick_cost: number | null
  status: string
  close_date: string | null
  total_placed_f: number | null
  total_placed_m: number | null
}

interface FlockAgg {
  totalMortF: number
  totalMortM: number
  peakBirds: number
  totalEggs: number
  avgHdPct: number | null
  totalHE: number
  avgHePct: number | null
  totalFeedF: number
  totalFeedM: number
}

interface HeAgg {
  totalDispatched: number
  totalRevenue: number
}

interface NheAgg {
  birdRevenue: number
  otherRevenue: number
}

// ── data fetch hooks ───────────────────────────────────────────────────────────

function useFlocks() {
  return useQuery({
    queryKey: ['compare_flocks'],
    queryFn: async () => {
      const { data } = await supabase
        .from('flocks')
        .select('id,flock_no,breed,placement_date,paid_female,paid_male,free_female,free_male,chick_rate,chick_cost,status,close_date,total_placed_f,total_placed_m')
        .order('flock_no', { ascending: true })
      return (data ?? []) as FlockRow[]
    }
  })
}

function useFlockDailyAgg(flockId: string) {
  return useQuery({
    queryKey: ['compare_daily', flockId],
    queryFn: async (): Promise<FlockAgg> => {
      const { data } = await supabase
        .from('daily_records')
        .select('mortality_female,mortality_male,closing_female,closing_male,feed_female_kg,feed_male_kg,total_eggs,he_eggs,hd_pct,he_pct')
        .eq('flock_id', flockId)
      const rows = (data ?? []) as any[]
      const totalMortF = rows.reduce((s, r) => s + (r.mortality_female ?? 0), 0)
      const totalMortM = rows.reduce((s, r) => s + (r.mortality_male ?? 0), 0)
      const peakBirds  = rows.reduce((peak, r) => {
        const birds = (r.closing_female ?? 0) + (r.closing_male ?? 0)
        return Math.max(peak, birds)
      }, 0)
      const totalEggs  = rows.reduce((s, r) => s + (r.total_eggs ?? 0), 0)
      const totalHE    = rows.reduce((s, r) => s + (r.he_eggs ?? 0), 0)
      const totalFeedF = rows.reduce((s, r) => s + (r.feed_female_kg ?? 0), 0)
      const totalFeedM = rows.reduce((s, r) => s + (r.feed_male_kg ?? 0), 0)
      const hdRows = rows.filter(r => r.hd_pct != null && (r.total_eggs ?? 0) > 0)
      const avgHdPct   = hdRows.length
        ? hdRows.reduce((s: number, r) => s + r.hd_pct, 0) / hdRows.length
        : null
      const heRows = rows.filter(r => r.he_pct != null && (r.total_eggs ?? 0) > 0)
      const avgHePct   = heRows.length
        ? heRows.reduce((s: number, r) => s + r.he_pct, 0) / heRows.length
        : null
      return { totalMortF, totalMortM, peakBirds, totalEggs, avgHdPct, totalHE, avgHePct, totalFeedF, totalFeedM }
    }
  })
}

function useFlockHeAgg(flockId: string) {
  return useQuery({
    queryKey: ['compare_he', flockId],
    queryFn: async (): Promise<HeAgg> => {
      const { data } = await supabase
        .from('he_dispatch')
        .select('total_dispatched,amount')
        .eq('flock_id', flockId)
      const rows = (data ?? []) as any[]
      return {
        totalDispatched: rows.reduce((s, r) => s + (r.total_dispatched ?? 0), 0),
        totalRevenue:    rows.reduce((s, r) => s + ((r.amount ?? 0) > 0 ? (r.amount ?? 0) : 0), 0),
      }
    }
  })
}

function useFlockNheAgg(flockId: string) {
  return useQuery({
    queryKey: ['compare_nhe', flockId],
    queryFn: async (): Promise<NheAgg> => {
      const { data } = await supabase
        .from('nhe_sales')
        .select('sale_type,amount')
        .eq('flock_id', flockId)
      const rows = (data ?? []) as any[]
      const birdRevenue  = rows.reduce((s, r) => {
        const t = (r.sale_type ?? '').toLowerCase()
        return s + (t.startsWith('bird') ? (r.amount ?? 0) : 0)
      }, 0)
      const otherRevenue = rows.reduce((s, r) => {
        const t = (r.sale_type ?? '').toLowerCase()
        return s + (!t.startsWith('bird') ? (r.amount ?? 0) : 0)
      }, 0)
      return { birdRevenue, otherRevenue }
    }
  })
}

// ── comparison row helper ──────────────────────────────────────────────────────

interface CompareRowProps {
  label: string
  values: (string | React.ReactNode)[]
  rawValues?: (number | null)[]
  lowerBetter?: boolean
}

const CompareRow: React.FC<CompareRowProps> = ({ label, values, rawValues, lowerBetter = false }) => {
  const best = rawValues ? bestIdx(rawValues, lowerBetter) : -1
  return (
    <tr className="hover:bg-gray-50/50">
      <Td className="font-medium text-gray-700 text-xs whitespace-nowrap">{label}</Td>
      {values.map((v, i) => (
        <Td
          key={i}
          right
          className={`text-xs font-medium ${best === i ? BEST_BG + ' text-green-800 font-semibold' : ''}`}
        >
          {v}
        </Td>
      ))}
    </tr>
  )
}

// ── inner component that loads all data ───────────────────────────────────────

interface AggData {
  flocks: FlockRow[]
}

const FlockComparisonInner: React.FC<AggData> = ({ flocks }) => {
  // Rules of hooks: call unconditionally. We call each hook 4 times
  // (maximum flocks we support) and slice to the actual count.
  // Since flocks is variable length, we instead use a child component per flock.
  // This component is only rendered once flocks is known.

  const d0 = useFlockDailyAgg(flocks[0]?.id ?? '')
  const d1 = useFlockDailyAgg(flocks[1]?.id ?? '')
  const d2 = useFlockDailyAgg(flocks[2]?.id ?? '')
  const d3 = useFlockDailyAgg(flocks[3]?.id ?? '')
  const d4 = useFlockDailyAgg(flocks[4]?.id ?? '')
  const d5 = useFlockDailyAgg(flocks[5]?.id ?? '')

  const h0 = useFlockHeAgg(flocks[0]?.id ?? '')
  const h1 = useFlockHeAgg(flocks[1]?.id ?? '')
  const h2 = useFlockHeAgg(flocks[2]?.id ?? '')
  const h3 = useFlockHeAgg(flocks[3]?.id ?? '')
  const h4 = useFlockHeAgg(flocks[4]?.id ?? '')
  const h5 = useFlockHeAgg(flocks[5]?.id ?? '')

  const n0 = useFlockNheAgg(flocks[0]?.id ?? '')
  const n1 = useFlockNheAgg(flocks[1]?.id ?? '')
  const n2 = useFlockNheAgg(flocks[2]?.id ?? '')
  const n3 = useFlockNheAgg(flocks[3]?.id ?? '')
  const n4 = useFlockNheAgg(flocks[4]?.id ?? '')
  const n5 = useFlockNheAgg(flocks[5]?.id ?? '')

  const allDailyQ = [d0, d1, d2, d3, d4, d5]
  const allHeQ    = [h0, h1, h2, h3, h4, h5]
  const allNheQ   = [n0, n1, n2, n3, n4, n5]

  const count = flocks.length
  const dailyData = allDailyQ.slice(0, count).map(q => q.data)
  const heData    = allHeQ.slice(0, count).map(q => q.data)
  const nheData   = allNheQ.slice(0, count).map(q => q.data)

  const anyLoading = allDailyQ.slice(0, count).some(q => q.isLoading) ||
    allHeQ.slice(0, count).some(q => q.isLoading) ||
    allNheQ.slice(0, count).some(q => q.isLoading)

  if (anyLoading) return (
    <div className="space-y-2">
      <Spinner />
      <p className="text-center text-sm text-gray-500">Loading flock data…</p>
    </div>
  )

  // Derived placement totals
  const placed = flocks.map(f => {
    const pF = f.total_placed_f ?? ((f.paid_female ?? 0) + (f.free_female ?? 0))
    const pM = f.total_placed_m ?? ((f.paid_male ?? 0) + (f.free_male ?? 0))
    return { f: pF, m: pM, total: pF + pM }
  })

  const totalRevenue = flocks.map((_, i) => {
    const he   = heData[i]?.totalRevenue ?? 0
    const bird = nheData[i]?.birdRevenue ?? 0
    const other = nheData[i]?.otherRevenue ?? 0
    return he + bird + other
  })

  const headerCells = flocks.map(f => (
    <Th key={f.id} right className="text-brand-700 font-bold">
      Flock {f.flock_no}
    </Th>
  ))

  // Production vectors
  const totalMort  = dailyData.map((d, i) => d ? (d.totalMortF + d.totalMortM) : null)
  const mortPct    = dailyData.map((d, i) => {
    if (!d || placed[i].total === 0) return null
    return (d.totalMortF + d.totalMortM) / placed[i].total
  })
  const peakBirds  = dailyData.map(d => d ? d.peakBirds : null)
  const totalEggs  = dailyData.map(d => d ? d.totalEggs : null)
  const avgHd      = dailyData.map(d => d?.avgHdPct ?? null)
  const totalHE    = dailyData.map(d => d ? d.totalHE : null)
  const avgHe      = dailyData.map(d => d?.avgHePct ?? null)
  const totalDisp  = heData.map(d => d ? d.totalDispatched : null)
  const feedF      = dailyData.map(d => d ? d.totalFeedF : null)
  const feedM      = dailyData.map(d => d ? d.totalFeedM : null)

  // Financial vectors
  const heSalesRev   = heData.map(d => d ? d.totalRevenue : null)
  const birdSalesRev = nheData.map(d => d ? d.birdRevenue : null)
  const otherSales   = nheData.map(d => d ? d.otherRevenue : null)
  const revPerBird   = flocks.map((_, i) =>
    placed[i].total > 0 ? totalRevenue[i] / placed[i].total : null
  )
  const revPerHE     = flocks.map((_, i) => {
    const disp = heData[i]?.totalDispatched ?? 0
    const rev  = heData[i]?.totalRevenue ?? 0
    return disp > 0 ? rev / disp : null
  })

  const bestRev = bestIdx(totalRevenue, false)

  return (
    <div className="space-y-10">

      {/* ── Section 1: Production Comparison ─────────────────────────── */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-brand-50">
            <Egg size={18} className="text-brand-600" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">Production Comparison</h3>
            <p className="text-xs text-gray-500">Birds, eggs and feed metrics across all flocks</p>
          </div>
        </div>
        <Card padding={false}>
          <Table>
            <thead>
              <tr>
                <Th className="min-w-[200px]">Metric</Th>
                {headerCells}
              </tr>
            </thead>
            <tbody>
              {/* Status */}
              <tr className="hover:bg-gray-50/50">
                <Td className="font-medium text-gray-700 text-xs">Status</Td>
                {flocks.map(f => (
                  <Td key={f.id} right>
                    <Badge color={statusBadge(f.status)}>{f.status}</Badge>
                  </Td>
                ))}
              </tr>

              {/* Placement Date */}
              <tr className="hover:bg-gray-50/50">
                <Td className="font-medium text-gray-700 text-xs">Placement Date</Td>
                {flocks.map(f => (
                  <Td key={f.id} right className="text-xs">{fmtDate(f.placement_date)}</Td>
                ))}
              </tr>

              {/* Total Placed */}
              <CompareRow
                label="Total Placed (F + M)"
                values={flocks.map((f, i) => `${n(placed[i].f)}F + ${n(placed[i].m)}M`)}
                rawValues={placed.map(p => p.total)}
              />

              {/* Paid chicks */}
              <tr className="hover:bg-gray-50/50">
                <Td className="font-medium text-gray-700 text-xs">Paid Chicks (F + M)</Td>
                {flocks.map(f => (
                  <Td key={f.id} right className="text-xs">
                    {n(f.paid_female)}F + {n(f.paid_male)}M
                  </Td>
                ))}
              </tr>

              {/* Free chicks */}
              <tr className="hover:bg-gray-50/50">
                <Td className="font-medium text-gray-700 text-xs">Free Chicks (F + M)</Td>
                {flocks.map(f => (
                  <Td key={f.id} right className="text-xs">
                    {n(f.free_female)}F + {n(f.free_male)}M
                  </Td>
                ))}
              </tr>

              {/* Chick Cost */}
              <tr className="hover:bg-gray-50/50">
                <Td className="font-medium text-gray-700 text-xs">Chick Cost (₹)</Td>
                {flocks.map(f => (
                  <Td key={f.id} right className="text-xs font-semibold text-brand-700">
                    {inr(f.chick_cost)}
                  </Td>
                ))}
              </tr>

              {/* Section divider */}
              <tr>
                <Td colSpan={count + 1} className="py-0.5 bg-gray-50 text-[10px] text-gray-400 font-semibold uppercase tracking-wide pl-3">
                  Mortality
                </Td>
              </tr>

              {/* Total Mortality */}
              <CompareRow
                label="Total Mortality (F + M)"
                values={dailyData.map((d, i) => d
                  ? `${n(d.totalMortF)}F + ${n(d.totalMortM)}M`
                  : '—'
                )}
                rawValues={totalMort}
                lowerBetter
              />

              {/* Mortality % */}
              <CompareRow
                label="Mortality %"
                values={mortPct.map(v => v == null ? '—' : `${(v * 100).toFixed(2)}%`)}
                rawValues={mortPct}
                lowerBetter
              />

              {/* Peak Birds */}
              <CompareRow
                label="Peak Birds"
                values={peakBirds.map(v => n(v))}
                rawValues={peakBirds}
              />

              {/* Section divider */}
              <tr>
                <Td colSpan={count + 1} className="py-0.5 bg-gray-50 text-[10px] text-gray-400 font-semibold uppercase tracking-wide pl-3">
                  Egg Production
                </Td>
              </tr>

              <CompareRow
                label="Total Eggs Produced"
                values={totalEggs.map(v => n(v))}
                rawValues={totalEggs}
              />

              <CompareRow
                label="Avg Egg Lay % (HD%)"
                values={avgHd.map(v => pctFmt(v))}
                rawValues={avgHd}
              />

              <CompareRow
                label="Total HE Eggs"
                values={totalHE.map(v => n(v))}
                rawValues={totalHE}
              />

              <CompareRow
                label="Avg HE %"
                values={avgHe.map(v => pctFmt(v))}
                rawValues={avgHe}
              />

              <CompareRow
                label="Total HE Dispatched"
                values={totalDisp.map(v => n(v))}
                rawValues={totalDisp}
              />

              {/* Section divider */}
              <tr>
                <Td colSpan={count + 1} className="py-0.5 bg-gray-50 text-[10px] text-gray-400 font-semibold uppercase tracking-wide pl-3">
                  Feed Consumed (from Daily Records)
                </Td>
              </tr>

              <CompareRow
                label="Feed Consumed — Female"
                values={feedF.map(v => v == null ? '—' : mtFmt(v))}
                rawValues={feedF}
                lowerBetter
              />

              <CompareRow
                label="Feed Consumed — Male"
                values={feedM.map(v => v == null ? '—' : mtFmt(v))}
                rawValues={feedM}
                lowerBetter
              />
            </tbody>
          </Table>
        </Card>
      </section>

      {/* ── Section 2: Financial Comparison ──────────────────────────── */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-green-50">
            <DollarSign size={18} className="text-green-600" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">Financial Comparison</h3>
            <p className="text-xs text-gray-500">Revenue breakdown and per-unit economics</p>
          </div>
        </div>
        <Card padding={false}>
          <Table>
            <thead>
              <tr>
                <Th className="min-w-[200px]">Metric</Th>
                {headerCells}
              </tr>
            </thead>
            <tbody>
              <CompareRow
                label="HE Sales Revenue"
                values={heSalesRev.map(v => inr(v))}
                rawValues={heSalesRev}
              />
              <CompareRow
                label="Bird Sales Revenue"
                values={birdSalesRev.map(v => inr(v))}
                rawValues={birdSalesRev}
              />
              <CompareRow
                label="Other Sales"
                values={otherSales.map(v => inr(v))}
                rawValues={otherSales}
              />

              {/* Total Revenue — bold row */}
              <tr className="bg-gray-50 hover:bg-gray-100/50">
                <Td className="font-bold text-gray-900 text-xs">Total Revenue</Td>
                {flocks.map((_, i) => (
                  <Td
                    key={i}
                    right
                    className={`text-xs font-bold text-brand-800 ${bestRev === i ? BEST_BG : ''}`}
                  >
                    {inr(totalRevenue[i])}
                  </Td>
                ))}
              </tr>

              {/* Section divider */}
              <tr>
                <Td colSpan={count + 1} className="py-0.5 bg-gray-50 text-[10px] text-gray-400 font-semibold uppercase tracking-wide pl-3">
                  Cost &amp; Efficiency
                </Td>
              </tr>

              {/* Chick Cost */}
              <tr className="hover:bg-gray-50/50">
                <Td className="font-medium text-gray-700 text-xs">Chick Cost (₹)</Td>
                {flocks.map(f => (
                  <Td key={f.id} right className="text-xs">{inr(f.chick_cost)}</Td>
                ))}
              </tr>

              <CompareRow
                label="Revenue per Bird Placed"
                values={revPerBird.map(v => v == null ? '—' : inr(v))}
                rawValues={revPerBird}
              />
              <CompareRow
                label="Revenue per HE Dispatched"
                values={revPerHE.map(v => v == null ? '—' : inr(v))}
                rawValues={revPerHE}
              />
            </tbody>
          </Table>
        </Card>
      </section>

      {/* ── Section 3: Per-Flock Cards ────────────────────────────────── */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-purple-50">
            <BarChart2 size={18} className="text-purple-600" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">Flock Snapshot Cards</h3>
            <p className="text-xs text-gray-500">Key metrics at a glance, sorted by flock number</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          {flocks.map((flock, i) => {
            const d   = dailyData[i]
            const he  = heData[i]
            const p   = placed[i]
            const rev = totalRevenue[i]
            const mort = d ? d.totalMortF + d.totalMortM : null
            const mortP = mort != null && p.total > 0
              ? ((mort / p.total) * 100).toFixed(2) + '%'
              : '—'
            const rpb = p.total > 0 ? (rev / p.total).toFixed(0) : null

            return (
              <div
                key={flock.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
              >
                {/* Card header */}
                <div
                  className="px-5 py-4 border-b border-gray-100 flex items-start justify-between"
                  style={{ background: 'linear-gradient(135deg,#f0fdf4,#dcfce7)' }}
                >
                  <div>
                    <p className="text-lg font-extrabold text-gray-900">Flock {flock.flock_no}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{flock.breed ?? 'Unknown breed'}</p>
                  </div>
                  <Badge color={statusBadge(flock.status)}>{flock.status}</Badge>
                </div>

                {/* Metrics grid */}
                <div className="px-5 py-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 rounded-xl p-3">
                      <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wide">Placed</p>
                      <p className="text-sm font-bold text-gray-900 mt-0.5">{n(p.total)}</p>
                      <p className="text-[10px] text-gray-400">{n(p.f)}F · {n(p.m)}M</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3">
                      <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wide">Chick Cost</p>
                      <p className="text-sm font-bold text-brand-700 mt-0.5">{inr(flock.chick_cost)}</p>
                      <p className="text-[10px] text-gray-400">₹{flock.chick_rate ?? '—'}/chick</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3">
                      <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wide">Total Eggs</p>
                      <p className="text-sm font-bold text-yellow-700 mt-0.5">{n(d?.totalEggs)}</p>
                      <p className="text-[10px] text-gray-400">Avg HD: {pctFmt(d?.avgHdPct)}</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3">
                      <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wide">HE Dispatched</p>
                      <p className="text-sm font-bold text-green-700 mt-0.5">{n(he?.totalDispatched)}</p>
                      <p className="text-[10px] text-gray-400">Avg HE%: {pctFmt(d?.avgHePct)}</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3">
                      <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wide">Mortality</p>
                      <p className="text-sm font-bold text-red-700 mt-0.5">{n(mort)}</p>
                      <p className="text-[10px] text-gray-400">{mortP} of placed</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3">
                      <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wide">Total Revenue</p>
                      <p className="text-sm font-bold text-emerald-700 mt-0.5">{inr(rev)}</p>
                      <p className="text-[10px] text-gray-400">₹{rpb ?? '—'}/bird</p>
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="pt-1 border-t border-gray-100 text-xs text-gray-500 flex justify-between">
                    <span>Placed: <span className="font-medium text-gray-700">{fmtDate(flock.placement_date)}</span></span>
                    {flock.close_date && (
                      <span>Closed: <span className="font-medium text-gray-700">{fmtDate(flock.close_date)}</span></span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Legend */}
      <p className="text-xs text-gray-400 border-t border-gray-100 pt-4">
        * Cells highlighted in green indicate the best-performing flock for that metric.
        Feed data sourced from daily records. Financial data from HE dispatch and NHE sales.
        Revenue per bird = total revenue ÷ total birds placed.
      </p>
    </div>
  )
}

// ── page entry point ──────────────────────────────────────────────────────────

export const FlockComparison: React.FC = () => {
  const { data: flocks, isLoading } = useFlocks()

  if (isLoading) return <Spinner />
  if (!flocks || flocks.length === 0) return (
    <div className="space-y-5">
      <SectionHeader title="Flock Comparison" subtitle="Management view" />
      <p className="text-gray-500 text-sm">No flocks found.</p>
    </div>
  )

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Flock Comparison"
        subtitle={`${flocks.length} flocks · Management presentation view`}
      />
      <FlockComparisonInner flocks={flocks} />
    </div>
  )
}
