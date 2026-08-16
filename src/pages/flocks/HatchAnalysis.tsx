import React, { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { inr, fmtDate, fetchAllPages, AGE_BANDS, SEASONS, flockAgeWeeksAt, inAgeBand, inSeason } from '@/lib/utils'
import {
  Card, SectionHeader, Spinner, StatCard, SearchableSelect, DateInput, Input, Badge
} from '@/components/ui'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  LineChart, Line, ScatterChart, Scatter, ZAxis
} from 'recharts'
import { Egg, AlertTriangle, IndianRupee } from 'lucide-react'

// ── Where the eggs go ────────────────────────────────────────────────────────
// Every egg set ends up in exactly one of five places, and WHICH one decides
// whose problem it is. Keeping them apart is the whole point of this page: a
// hatchery whose hatch % is low because its eggs arrived infertile has a
// BREEDER problem, and adding the two together blames the wrong party.
//
//   broken in transit -> handling and the lorry, between farm and hatchery
//   infertile         -> the breeder flock: males, mating, flock age. NOT the hatchery
//   blasters          -> egg hygiene and storage, farm or hatchery
//   unhatched         -> incubation itself. Squarely the HATCHERY
//   hatched           -> what you actually got
const CAUSE = {
  broken:   { key: 'broken',   label: 'Broken in transit', owner: 'Transport',  color: '#9ca3af' },
  inf:      { key: 'inf',      label: 'Infertile',         owner: 'Breeder flock', color: '#f59e0b' },
  blst:     { key: 'blst',     label: 'Blasters',          owner: 'Egg handling',  color: '#ef4444' },
  unhatch:  { key: 'unhatch',  label: 'Unhatched',         owner: 'Hatchery',   color: '#8b5cf6' },
  hatched:  { key: 'hatched',  label: 'Hatched',           owner: '—',          color: '#10b981' },
}

const pct1 = (n: number, d: number) => d > 0 ? Math.round(n / d * 1000) / 10 : 0
const pp = (n: number) => `${n > 0 ? '+' : ''}${n.toFixed(1)}pp`

function calc(b: any) {
  const received = b.eggs_set ?? 0
  const broken   = b.broken_transit ?? 0
  const setting  = received - broken
  return {
    received, broken, setting,
    inf:     b.infertile ?? 0,
    blst:    b.blasters ?? 0,
    unhatch: b.unhatched ?? 0,
    hatched: b.hatched_chicks ?? 0,
    std:     b.std_chicks ?? 0,
    sold:    b.chicks_sold ?? 0,
    rate:    b.chick_rate ?? null,
  }
}

// Sum a set of batches into one row of totals + the percentages that matter.
// Percentages are computed from the SUMMED counts, never averaged from
// per-batch percentages — a 200-egg batch must not swing the figure as hard as
// a 30,000-egg one.
function rollup(rows: any[]) {
  const t = rows.reduce((a: any, b: any) => {
    const c = calc(b)
    a.batches++; a.received += c.received; a.broken += c.broken; a.setting += c.setting
    a.inf += c.inf; a.blst += c.blst; a.unhatch += c.unhatch
    a.hatched += c.hatched; a.std += c.std; a.sold += c.sold
    if (c.rate != null && c.sold > 0) { a.rateSum += c.rate * c.sold; a.rateQty += c.sold }
    return a
  }, { batches: 0, received: 0, broken: 0, setting: 0, inf: 0, blst: 0,
       unhatch: 0, hatched: 0, std: 0, sold: 0, rateSum: 0, rateQty: 0 })
  return {
    ...t,
    hatchPct:   pct1(t.hatched, t.received),   // chicks ÷ ALL eggs set, the farm's definition
    stdPct:     pct1(t.std, t.received),
    brokenPct:  pct1(t.broken, t.received),
    infPct:     pct1(t.inf, t.setting),
    blstPct:    pct1(t.blst, t.setting),
    unhatchPct: pct1(t.unhatch, t.setting),
    vsStd:      pct1(t.hatched, t.received) - pct1(t.std, t.received),
    // Chicks the standard expected but the batch did not deliver.
    shortChicks: Math.max(0, t.std - t.hatched),
    avgRate:    t.rateQty > 0 ? t.rateSum / t.rateQty : null,
  }
}

const weekStart = (iso: string) => {
  const d = new Date(iso + 'T00:00:00')
  const day = (d.getDay() + 6) % 7          // Monday = 0
  d.setDate(d.getDate() - day)
  return d.toISOString().slice(0, 10)
}

export const HatchAnalysis: React.FC = () => {
  const [tab, setTab] = useState<'flock'|'hatchery'|'week'|'eggage'|'money'>('flock')
  const [flockFilter, setFlockFilter] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  // Like-for-like: compare hatcheries on ONE flock's eggs only. Without this the
  // ranking mixes up "this hatchery is worse" with "this hatchery happened to
  // get the weaker flock's eggs", which on the current data is most of the gap.
  const [lflFlock, setLflFlock] = useState('')
  const [hatcheryFilter, setHatcheryFilter] = useState('')
  const [ageBand, setAgeBand] = useState('')
  const [season, setSeason] = useState('')
  const [rateInput, setRateInput] = useState('')

  const { data: batches, isLoading } = useQuery({
    queryKey: ['hatch_analysis'],
    queryFn: async () => fetchAllPages<any>((from, to) => supabase
      .from('hatch_batches')
      .select('*, hatcheries(name), flocks(flock_no,placement_date)')
      .order('setting_date', { ascending: false }).range(from, to), 'Hatch analysis')
  })

  // Egg age needs the PRODUCTION date, which lives on the dispatch lines — not
  // on the batch. Only fetched for batches that carry a dispatch link.
  const dispatchIds = useMemo(() =>
    [...new Set((batches ?? []).map((b: any) => b.dispatch_id).filter(Boolean))], [batches])
  const { data: dispatchLines } = useQuery({
    queryKey: ['hatch_analysis_lines', dispatchIds.length],
    enabled: dispatchIds.length > 0,
    queryFn: async () => fetchAllPages<any>((from, to) => supabase
      .from('he_dispatch_lines').select('dispatch_id,prod_date,grade_a,grade_b,grade_c')
      .in('dispatch_id', dispatchIds as string[]).range(from, to), 'Dispatch lines')
  })

  // Egg-weighted mean production date per dispatch → egg age at setting.
  const eggAgeByDispatch = useMemo(() => {
    const g: Record<string, { sum: number; n: number }> = {}
    for (const l of (dispatchLines ?? [])) {
      if (!l.dispatch_id || !l.prod_date) continue
      const qty = (l.grade_a ?? 0) + (l.grade_b ?? 0) + (l.grade_c ?? 0)
      const ms = new Date(l.prod_date + 'T00:00:00').getTime()
      const e = (g[l.dispatch_id] ??= { sum: 0, n: 0 })
      e.sum += ms * (qty || 1); e.n += (qty || 1)
    }
    const out: Record<string, number> = {}
    for (const [k, v] of Object.entries(g)) if (v.n > 0) out[k] = v.sum / v.n
    return out
  }, [dispatchLines])

  const rows = useMemo(() => (batches ?? []).filter((b: any) =>
    b.hatched_chicks != null &&
    (!flockFilter || b.flock_id === flockFilter) &&
    (!hatcheryFilter || (b.hatchery_id ?? `text:${b.hatchery_name ?? '(not set)'}`) === hatcheryFilter) &&
    (!fromDate || (b.setting_date && b.setting_date >= fromDate)) &&
    (!toDate   || (b.setting_date && b.setting_date <= toDate)) &&
    inAgeBand(ageBand, flockAgeWeeksAt(b.flocks?.placement_date, b.setting_date)) &&
    inSeason(season, b.setting_date)
  ), [batches, flockFilter, hatcheryFilter, fromDate, toDate, ageBand, season])

  const total = useMemo(() => rollup(rows), [rows])

  const flockOptions = useMemo(() => {
    const m = new Map<string, string>()
    for (const b of (batches ?? [])) if (b.flock_id) m.set(b.flock_id, b.flocks?.flock_no ?? '?')
    return [...m].map(([v, l]) => ({ value: v, label: `Flock ${l}` }))
  }, [batches])

  const hName = (b: any) => b.hatcheries?.name ?? b.hatchery_name ?? '(not set)'

  // Built from the batches so typed-name hatcheries can be selected too.
  const hatcheryOptions = useMemo(() => {
    const m = new Map<string, string>()
    for (const b of (batches ?? [])) {
      const key = b.hatchery_id ?? `text:${b.hatchery_name ?? '(not set)'}`
      if (!m.has(key)) m.set(key, hName(b))
    }
    return [...m].map(([value, label]) => ({ value, label })).sort((a, b) => a.label.localeCompare(b.label))
  }, [batches])

  const groupBy = (list: any[], key: (b: any) => string) => {
    const m: Record<string, any[]> = {}
    for (const b of list) (m[key(b)] ??= []).push(b)
    return Object.entries(m).map(([name, rs]) => ({ name, ...rollup(rs) }))
  }

  const byFlock    = useMemo(() => groupBy(rows, b => `F-${b.flocks?.flock_no ?? '?'}`)
    .sort((a, b) => b.received - a.received), [rows])
  const byHatchery = useMemo(() => groupBy(rows, hName)
    .sort((a, b) => a.hatchPct - b.hatchPct), [rows])
  const byWeek     = useMemo(() => groupBy(rows.filter(b => b.setting_date), b => weekStart(b.setting_date))
    .sort((a, b) => a.name.localeCompare(b.name)), [rows])

  // Like-for-like: hatcheries, restricted to one flock's eggs.
  const lfl = useMemo(() => {
    if (!lflFlock) return []
    return groupBy(rows.filter(b => b.flock_id === lflFlock), hName)
      .sort((a, b) => b.hatchPct - a.hatchPct)
  }, [rows, lflFlock])

  // ── The verdict ───────────────────────────────────────────────────────────
  // Stated in plain words, and only where the data supports it. Unhatched is
  // the hatchery's own result, so that is what a hatchery is judged on — not
  // the headline hatch %, which moves with whose eggs it happened to receive.
  const hatcheryVerdict = useMemo(() => {
    if (byHatchery.length < 2) return null
    const best  = [...byHatchery].sort((a, b) => a.unhatchPct - b.unhatchPct)[0]
    const worst = [...byHatchery].sort((a, b) => b.unhatchPct - a.unhatchPct)[0]
    if (!best || !worst || best.name === worst.name) return null
    const gap = worst.unhatchPct - best.unhatchPct
    const eggsAtWorst = worst.setting
    const chicksLost = Math.round(eggsAtWorst * gap / 100)
    return { best, worst, gap, chicksLost }
  }, [byHatchery])

  const flockVerdict = useMemo(() => {
    if (byFlock.length < 2) return null
    const best  = [...byFlock].sort((a, b) => a.infPct - b.infPct)[0]
    const worst = [...byFlock].sort((a, b) => b.infPct - a.infPct)[0]
    if (!best || !worst || best.name === worst.name) return null
    return { best, worst, gap: worst.infPct - best.infPct,
             eggsLost: Math.round(worst.setting * (worst.infPct - best.infPct) / 100) }
  }, [byFlock])

  // ── Egg age ───────────────────────────────────────────────────────────────
  const eggAgeRows = useMemo(() => rows.map((b: any) => {
    const prodMs = b.dispatch_id ? eggAgeByDispatch[b.dispatch_id] : undefined
    if (prodMs == null || !b.setting_date) return null
    const days = Math.round((new Date(b.setting_date + 'T00:00:00').getTime() - prodMs) / 86400000)
    if (days < 0 || days > 60) return null
    const c = rollup([b])
    return { days, hatchPct: c.hatchPct, eggs: c.received, label: `${b.flocks?.flock_no ?? '?'} · ${fmtDate(b.setting_date)}` }
  }).filter(Boolean) as any[], [rows, eggAgeByDispatch])

  const eggAgeBands = useMemo(() => {
    const bands: Record<string, { eggs: number; hatched: number; n: number }> = {}
    for (const r of eggAgeRows) {
      const b = r.days <= 3 ? '0-3 days' : r.days <= 5 ? '4-5 days' : r.days <= 7 ? '6-7 days' : '8+ days'
      const e = (bands[b] ??= { eggs: 0, hatched: 0, n: 0 })
      e.eggs += r.eggs; e.hatched += r.eggs * r.hatchPct / 100; e.n++
    }
    return ['0-3 days','4-5 days','6-7 days','8+ days']
      .filter(k => bands[k])
      .map(k => ({ band: k, batches: bands[k].n, eggs: bands[k].eggs,
                   hatchPct: pct1(bands[k].hatched, bands[k].eggs) }))
  }, [eggAgeRows])

  // ── Money ─────────────────────────────────────────────────────────────────
  // Rate comes from the batches themselves when they carry one; otherwise from
  // the box, and the page says which it used. It never invents a rate.
  const typedRate = parseFloat(rateInput)
  const rate = total.avgRate ?? (isFinite(typedRate) && typedRate > 0 ? typedRate : null)
  const rateSource = total.avgRate != null ? 'from the batches’ own chick rate'
                   : rate != null ? 'from the rate you typed' : null

  const money = useMemo(() => {
    if (!rate) return null
    const lost = (n: number) => n * rate
    return {
      short:   lost(total.shortChicks),
      broken:  lost(total.broken),               // an egg broken is a chick not made
      inf:     lost(total.inf),
      blst:    lost(total.blst),
      unhatch: lost(total.unhatch),
      earned:  total.hatched * rate,
      hatcheryGap: hatcheryVerdict ? lost(hatcheryVerdict.chicksLost) : null,
      flockGap: flockVerdict ? lost(flockVerdict.eggsLost) : null,
    }
  }, [rate, total, hatcheryVerdict, flockVerdict])

  const TABS = [
    ['flock','Flock-wise'], ['hatchery','Hatchery-wise'], ['week','Week-wise'],
    ['eggage','Egg Age'], ['money','Money'],
  ] as const

  const LossTable: React.FC<{ data: any[]; firstCol: string }> = ({ data, firstCol }) => (
    <Card padding={false}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm" style={{ minWidth: '860px' }}>
          <thead className="bg-gray-50 text-xs text-gray-500">
            <tr>
              <th className="px-3 py-2 text-left">{firstCol}</th>
              <th className="px-3 py-2 text-right">Batches</th>
              <th className="px-3 py-2 text-right">Eggs Set</th>
              <th className="px-3 py-2 text-right">Hatch%</th>
              <th className="px-3 py-2 text-right">Std%</th>
              <th className="px-3 py-2 text-right">vs Std</th>
              <th className="px-3 py-2 text-right">Broken%</th>
              <th className="px-3 py-2 text-right" title="Breeder flock">Inf%</th>
              <th className="px-3 py-2 text-right">Blst%</th>
              <th className="px-3 py-2 text-right" title="The hatchery's own result">Unhatch%</th>
            </tr>
          </thead>
          <tbody>
            {data.map((r: any) => (
              <tr key={r.name} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="px-3 py-2 font-medium">{r.name}</td>
                <td className="px-3 py-2 text-right">{r.batches}</td>
                <td className="px-3 py-2 text-right">{r.received.toLocaleString('en-IN')}</td>
                <td className="px-3 py-2 text-right font-semibold">{r.hatchPct}%</td>
                <td className="px-3 py-2 text-right text-gray-500">{r.stdPct}%</td>
                <td className={`px-3 py-2 text-right font-medium ${r.vsStd < 0 ? 'text-red-600' : 'text-green-600'}`}>{pp(r.vsStd)}</td>
                <td className="px-3 py-2 text-right">{r.brokenPct}%</td>
                <td className="px-3 py-2 text-right text-amber-600">{r.infPct}%</td>
                <td className="px-3 py-2 text-right">{r.blstPct}%</td>
                <td className="px-3 py-2 text-right text-violet-700 font-medium">{r.unhatchPct}%</td>
              </tr>
            ))}
            {data.length === 0 && (
              <tr><td colSpan={10} className="px-3 py-8 text-center text-gray-400">No batches in this selection</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  )

  // Stacked "where the eggs went" — the composition, not just the headline.
  const stackData = (data: any[]) => data.map((r: any) => ({
    name: r.name,
    Hatched: r.hatchPct,
    Unhatched: pct1(r.unhatch, r.received),
    Infertile: pct1(r.inf, r.received),
    Blasters: pct1(r.blst, r.received),
    Broken: r.brokenPct,
  }))

  if (isLoading) return <Spinner />

  return (
    <div className="space-y-5">
      <SectionHeader title="Hatch Analysis"
        subtitle={`${rows.length.toLocaleString('en-IN')} completed batch(es)${
          flockFilter ? ' in this flock' : ''}${hatcheryFilter ? ' at this hatchery' : ''}${
          ageBand ? `, flock ${AGE_BANDS.find(x => x.value === ageBand)?.label.toLowerCase()} at setting` : ''}${
          season ? `, set in ${SEASONS.find(x => x.value === season)?.label}` : ''}${
          fromDate || toDate ? ` set ${fromDate ? fmtDate(fromDate) : 'the beginning'} to ${toDate ? fmtDate(toDate) : 'now'}` : ''
        } — every figure below is computed from the summed counts of exactly these`}/>

      <div className="flex gap-1 border-b border-gray-200 overflow-x-auto">
        {TABS.map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
              tab===t ? 'border-brand-600 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {label}
          </button>
        ))}
      </div>

      <div className="flex gap-3 items-end flex-wrap">
        <SearchableSelect placeholder="All Flocks" options={flockOptions}
          value={flockFilter} onChange={v => setFlockFilter(v)} className="w-44"/>
        <SearchableSelect placeholder="All Hatcheries" options={hatcheryOptions}
          value={hatcheryFilter} onChange={v => setHatcheryFilter(v)} className="w-48"/>
        <DateInput label="From (setting date)" value={fromDate} onChange={e => setFromDate(e.target.value)}/>
        <DateInput label="To" value={toDate} onChange={e => setToDate(e.target.value)}/>
        <SearchableSelect placeholder="Any flock age" options={AGE_BANDS.map(b => ({ value: b.value, label: b.label }))}
          value={ageBand} onChange={v => setAgeBand(v)} className="w-40"/>
        <SearchableSelect placeholder="Any season" options={SEASONS.map(x => ({ value: x.value, label: x.label }))}
          value={season} onChange={v => setSeason(v)} className="w-44"/>
        {(flockFilter || hatcheryFilter || fromDate || toDate || ageBand || season) && (
          <button className="text-sm text-gray-500 hover:text-gray-700 underline pb-2"
            onClick={() => { setFlockFilter(''); setHatcheryFilter(''); setFromDate(''); setToDate(''); setAgeBand(''); setSeason('') }}>
            Clear
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Eggs Set" value={total.received.toLocaleString('en-IN')} icon={<Egg size={18}/>} color="text-brand-600"/>
        <StatCard title="Chicks Hatched" value={total.hatched.toLocaleString('en-IN')} icon={<Egg size={18}/>} color="text-green-600"/>
        <StatCard title="Hatch %" value={`${total.hatchPct}%`} icon={<Egg size={18}/>}
          color={total.hatchPct >= total.stdPct ? 'text-green-600' : 'text-orange-500'}/>
        <StatCard title="Short of Std" value={total.shortChicks.toLocaleString('en-IN')} icon={<AlertTriangle size={18}/>} color="text-red-600"/>
      </div>

      {/* ── FLOCK-WISE ─────────────────────────────────────────────────────── */}
      {tab === 'flock' && (
        <>
          {flockVerdict && flockVerdict.gap >= 0.5 && (
            <Card>
              <p className="text-sm text-gray-700">
                <strong>{flockVerdict.worst.name}</strong> is losing{' '}
                <strong>{flockVerdict.gap.toFixed(1)} percentage points</strong> more eggs to
                infertility than {flockVerdict.best.name} ({flockVerdict.worst.infPct}% against {flockVerdict.best.infPct}%)
                — about <strong>{flockVerdict.eggsLost.toLocaleString('en-IN')} eggs</strong> that were never
                going to hatch anywhere.
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Infertility is a breeder-flock matter — males, mating ratio, flock age — not the hatchery's doing.
                No hatchery can incubate an infertile egg.
              </p>
            </Card>
          )}
          <Card>
            <h3 className="font-semibold text-gray-800 mb-4">Standard vs Actual chicks, by flock</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={byFlock}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                <XAxis dataKey="name" tick={{ fontSize: 12 }}/>
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: any) => `${(v/100000).toFixed(1)}L`}/>
                <Tooltip formatter={(v: any) => Number(v).toLocaleString('en-IN')}/>
                <Legend/>
                <Bar dataKey="std" name="Std (standard)" fill="#9ca3af" radius={[3,3,0,0]}/>
                <Bar dataKey="hatched" name="Actual hatched" fill="#10b981" radius={[3,3,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </Card>
          <Card>
            <h3 className="font-semibold text-gray-800 mb-4">Where every egg went, by flock (% of eggs set)</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={stackData(byFlock)} layout="vertical" margin={{ left: 30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                <XAxis type="number" domain={[0,100]} tick={{ fontSize: 11 }}/>
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={60}/>
                <Tooltip formatter={(v: any) => `${v}%`}/>
                <Legend/>
                <Bar dataKey="Hatched"   stackId="a" fill={CAUSE.hatched.color}/>
                <Bar dataKey="Unhatched" stackId="a" fill={CAUSE.unhatch.color}/>
                <Bar dataKey="Infertile" stackId="a" fill={CAUSE.inf.color}/>
                <Bar dataKey="Blasters"  stackId="a" fill={CAUSE.blst.color}/>
                <Bar dataKey="Broken"    stackId="a" fill={CAUSE.broken.color}/>
              </BarChart>
            </ResponsiveContainer>
          </Card>
          <LossTable data={byFlock} firstCol="Flock"/>
        </>
      )}

      {/* ── HATCHERY-WISE ──────────────────────────────────────────────────── */}
      {tab === 'hatchery' && (
        <>
          {hatcheryVerdict && (
            <Card>
              <p className="text-sm text-gray-700">
                <strong>{hatcheryVerdict.worst.name}</strong> leaves{' '}
                <strong>{hatcheryVerdict.worst.unhatchPct}%</strong> of its eggs unhatched against{' '}
                <strong>{hatcheryVerdict.best.unhatchPct}%</strong> at {hatcheryVerdict.best.name}
                {' '}— a gap of {hatcheryVerdict.gap.toFixed(1)}pp, worth roughly{' '}
                <strong>{hatcheryVerdict.chicksLost.toLocaleString('en-IN')} chicks</strong> on the eggs it received.
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Judged on UNHATCHED, not on hatch %. Unhatched is incubation — the hatchery's own result.
                Hatch % also moves with how fertile the eggs arrived, which is the breeder's doing, so
                ranking on hatch % alone can blame a hatchery for a flock's problem. Use Like-for-like below
                to compare hatcheries on one flock's eggs.
              </p>
            </Card>
          )}
          <Card>
            <h3 className="font-semibold text-gray-800 mb-4">Where every egg went, by hatchery (% of eggs set)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stackData(byHatchery)} layout="vertical" margin={{ left: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                <XAxis type="number" domain={[0,100]} tick={{ fontSize: 11 }}/>
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={120}/>
                <Tooltip formatter={(v: any) => `${v}%`}/>
                <Legend/>
                <Bar dataKey="Hatched"   stackId="a" fill={CAUSE.hatched.color}/>
                <Bar dataKey="Unhatched" stackId="a" fill={CAUSE.unhatch.color}/>
                <Bar dataKey="Infertile" stackId="a" fill={CAUSE.inf.color}/>
                <Bar dataKey="Blasters"  stackId="a" fill={CAUSE.blst.color}/>
                <Bar dataKey="Broken"    stackId="a" fill={CAUSE.broken.color}/>
              </BarChart>
            </ResponsiveContainer>
          </Card>
          <LossTable data={byHatchery} firstCol="Hatchery"/>
          <Card>
            <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
              <div>
                <h3 className="font-semibold text-gray-800">Like-for-like — one flock's eggs only</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Hatcheries do not all get the same eggs. Pick a flock to compare them on equal terms;
                  a gap that survives here belongs to the hatchery.
                </p>
              </div>
              <SearchableSelect placeholder="— Select a flock —" options={flockOptions}
                value={lflFlock} onChange={v => setLflFlock(v)} className="w-48"/>
            </div>
            {!lflFlock ? (
              <p className="text-sm text-gray-400 py-6 text-center">Select a flock to compare hatcheries on its eggs alone</p>
            ) : lfl.length < 2 ? (
              <p className="text-sm text-gray-400 py-6 text-center">
                That flock's eggs went to only one hatchery in this selection — nothing to compare against.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-xs text-gray-500">
                    <tr>
                      <th className="px-3 py-2 text-left">Hatchery</th>
                      <th className="px-3 py-2 text-right">Batches</th>
                      <th className="px-3 py-2 text-right">Eggs Set</th>
                      <th className="px-3 py-2 text-right">Hatch%</th>
                      <th className="px-3 py-2 text-right">Unhatch%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lfl.map((r: any, i: number) => (
                      <tr key={r.name} className="border-t border-gray-100">
                        <td className="px-3 py-2 font-medium">
                          {r.name} {i === 0 && <Badge color="green">best</Badge>}
                        </td>
                        <td className="px-3 py-2 text-right">{r.batches}</td>
                        <td className="px-3 py-2 text-right">{r.received.toLocaleString('en-IN')}</td>
                        <td className="px-3 py-2 text-right font-semibold">{r.hatchPct}%</td>
                        <td className="px-3 py-2 text-right text-violet-700">{r.unhatchPct}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="text-xs text-gray-500 mt-3">
                  Spread on this flock: {(lfl[0].hatchPct - lfl[lfl.length-1].hatchPct).toFixed(1)}pp between
                  best and worst hatchery. Compare that against the {(byHatchery[byHatchery.length-1].hatchPct - byHatchery[0].hatchPct).toFixed(1)}pp
                  spread across all flocks above — if the like-for-like spread is much smaller, most of the
                  headline difference is which eggs each hatchery received, not how they ran them.
                </p>
              </div>
            )}
          </Card>
        </>
      )}

      {/* ── WEEK-WISE ──────────────────────────────────────────────────────── */}
      {tab === 'week' && (
        <>
          <Card>
            <h3 className="font-semibold text-gray-800 mb-4">Hatch % by setting week, against the standard</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={byWeek.map((w: any) => ({ ...w, week: fmtDate(w.name).slice(0,5) }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                <XAxis dataKey="week" tick={{ fontSize: 10 }} interval="preserveStartEnd"/>
                <YAxis domain={[60, 100]} tick={{ fontSize: 11 }}/>
                <Tooltip formatter={(v: any) => `${v}%`}/>
                <Legend/>
                <Line type="monotone" dataKey="hatchPct" name="Hatch %" stroke="#10b981" strokeWidth={2} dot={false}/>
                <Line type="monotone" dataKey="stdPct" name="Standard %" stroke="#9ca3af" strokeDasharray="4 4" dot={false}/>
                <Line type="monotone" dataKey="unhatchPct" name="Unhatched %" stroke="#8b5cf6" strokeWidth={1} dot={false}/>
                <Line type="monotone" dataKey="infPct" name="Infertile %" stroke="#f59e0b" strokeWidth={1} dot={false}/>
              </LineChart>
            </ResponsiveContainer>
            <p className="text-xs text-gray-500 mt-2">
              A week where the hatch line dips while infertile stays flat is an incubation week.
              A week where infertile climbs with it is an egg week — the flock, the weather, or storage.
            </p>
          </Card>
          <Card padding={false}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500">
                  <tr>
                    <th className="px-3 py-2 text-left">Week starting</th>
                    <th className="px-3 py-2 text-right">Batches</th>
                    <th className="px-3 py-2 text-right">Eggs Set</th>
                    <th className="px-3 py-2 text-right">Hatch%</th>
                    <th className="px-3 py-2 text-right">vs Std</th>
                    <th className="px-3 py-2 text-right">Inf%</th>
                    <th className="px-3 py-2 text-right">Unhatch%</th>
                  </tr>
                </thead>
                <tbody>
                  {[...byWeek].reverse().map((w: any) => (
                    <tr key={w.name} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="px-3 py-2 font-medium">{fmtDate(w.name)}</td>
                      <td className="px-3 py-2 text-right">{w.batches}</td>
                      <td className="px-3 py-2 text-right">{w.received.toLocaleString('en-IN')}</td>
                      <td className="px-3 py-2 text-right font-semibold">{w.hatchPct}%</td>
                      <td className={`px-3 py-2 text-right ${w.vsStd < 0 ? 'text-red-600' : 'text-green-600'}`}>{pp(w.vsStd)}</td>
                      <td className="px-3 py-2 text-right text-amber-600">{w.infPct}%</td>
                      <td className="px-3 py-2 text-right text-violet-700">{w.unhatchPct}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {/* ── EGG AGE ────────────────────────────────────────────────────────── */}
      {tab === 'eggage' && (
        <>
          {eggAgeRows.length === 0 ? (
            <Card>
              <h3 className="font-semibold text-gray-800 mb-2">Egg age cannot be measured yet</h3>
              <p className="text-sm text-gray-600">
                Egg age is the days between an egg being LAID and being SET, and it is one of the few
                hatchability losses entirely within your control — eggs held too long lose hatchability
                whatever the hatchery does.
              </p>
              <p className="text-sm text-gray-600 mt-2">
                The app cannot work it out for these batches because the laying date is not on the batch —
                it lives on the HE dispatch that carried the eggs. <strong>0 of the {rows.length} batches
                here are linked to a dispatch</strong>, so there is no production date to measure from.
              </p>
              <p className="text-sm text-gray-700 mt-3">
                To switch this on: open a batch in Hatch Batches and use <strong>Link Dispatch Invoice</strong>.
                The dropdown lists that flock's dispatches from the three weeks before the setting date first,
                each showing its date, invoice, egg count and production-date range. Every batch you link
                appears here automatically.
              </p>
              <p className="text-xs text-gray-500 mt-3">
                Nothing is guessed on your behalf: a 1,00,800-egg dispatch is routinely split across
                hatcheries and settings, so the app links a batch by itself only when exactly one dispatch
                of that flock matches its egg count — otherwise it waits for you rather than attach a wrong
                laying date and quietly bend this chart.
              </p>
            </Card>
          ) : (
            <>
              <Card>
                <h3 className="font-semibold text-gray-800 mb-4">Hatch % against egg age at setting</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                    <XAxis type="number" dataKey="days" name="Egg age (days)" tick={{ fontSize: 11 }}/>
                    <YAxis type="number" dataKey="hatchPct" name="Hatch %" domain={[50,100]} tick={{ fontSize: 11 }}/>
                    <ZAxis type="number" dataKey="eggs" range={[40, 300]}/>
                    <Tooltip cursor={{ strokeDasharray: '3 3' }}
                      formatter={(v: any, n: any) => n === 'Hatch %' ? `${v}%` : Number(v).toLocaleString('en-IN')}/>
                    <Scatter name="Batch" data={eggAgeRows} fill="#3b82f6" fillOpacity={0.6}/>
                  </ScatterChart>
                </ResponsiveContainer>
                <p className="text-xs text-gray-500 mt-2">
                  Each dot is a batch; bigger dots are more eggs. Measured on {eggAgeRows.length} of {rows.length} batches
                  — only those linked to a dispatch carry a laying date.
                </p>
              </Card>
              <Card padding={false}>
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-xs text-gray-500">
                    <tr>
                      <th className="px-3 py-2 text-left">Egg age at setting</th>
                      <th className="px-3 py-2 text-right">Batches</th>
                      <th className="px-3 py-2 text-right">Eggs Set</th>
                      <th className="px-3 py-2 text-right">Hatch%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {eggAgeBands.map((b: any) => (
                      <tr key={b.band} className="border-t border-gray-100">
                        <td className="px-3 py-2 font-medium">{b.band}</td>
                        <td className="px-3 py-2 text-right">{b.batches}</td>
                        <td className="px-3 py-2 text-right">{b.eggs.toLocaleString('en-IN')}</td>
                        <td className="px-3 py-2 text-right font-semibold">{b.hatchPct}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            </>
          )}
        </>
      )}

      {/* ── MONEY ──────────────────────────────────────────────────────────── */}
      {tab === 'money' && (
        <>
          <Card>
            <div className="flex items-end gap-3 flex-wrap">
              <Input label="Chick rate (₹ per chick)" type="number" placeholder="e.g. 32"
                value={rateInput} onChange={e => setRateInput(e.target.value)} className="w-48"/>
              <p className="text-xs text-gray-500 pb-2">
                {total.avgRate != null
                  ? `Using ₹${total.avgRate.toFixed(2)}/chick from the batches' own Chick Rate — the box only applies where a batch has none.`
                  : `None of these ${rows.length} batches carries a Chick Rate, so every figure below uses the rate you type. Nothing is assumed.`}
              </p>
            </div>
          </Card>
          {!money ? (
            <Card>
              <p className="text-sm text-gray-500 text-center py-8">
                Type a chick rate above to see these losses in rupees.
              </p>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard title="Chicks short of Std" value={inr(money.short)} icon={<IndianRupee size={18}/>} color="text-red-600"/>
                <StatCard title="Lost to unhatched" value={inr(money.unhatch)} icon={<IndianRupee size={18}/>} color="text-violet-700"/>
                <StatCard title="Lost to infertile" value={inr(money.inf)} icon={<IndianRupee size={18}/>} color="text-amber-600"/>
                <StatCard title="Value hatched" value={inr(money.earned)} icon={<IndianRupee size={18}/>} color="text-green-600"/>
              </div>
              <Card>
                <h3 className="font-semibold text-gray-800 mb-1">What each loss is worth, at {rate ? `₹${rate.toFixed(2)}` : '—'} a chick</h3>
                <p className="text-xs text-gray-500 mb-4">
                  Rate taken {rateSource}. Each row values one egg lost as one chick not sold — the honest
                  ceiling on what fixing it could be worth, not a promise that all of it is recoverable.
                </p>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={[
                    { name: 'Unhatched', value: money.unhatch, who: 'Hatchery' },
                    { name: 'Infertile', value: money.inf, who: 'Breeder flock' },
                    { name: 'Blasters', value: money.blst, who: 'Egg handling' },
                    { name: 'Broken in transit', value: money.broken, who: 'Transport' },
                  ]} layout="vertical" margin={{ left: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                    <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v: any) => `${(v/100000).toFixed(1)}L`}/>
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={130}/>
                    <Tooltip formatter={(v: any) => inr(Number(v))}/>
                    <Bar dataKey="value" name="₹ lost" fill="#ef4444" radius={[0,3,3,0]}/>
                  </BarChart>
                </ResponsiveContainer>
              </Card>
              <Card>
                <h3 className="font-semibold text-gray-800 mb-3">What closing each gap would be worth</h3>
                <ul className="text-sm text-gray-700 space-y-2">
                  {money.hatcheryGap != null && hatcheryVerdict && (
                    <li>
                      • Bringing <strong>{hatcheryVerdict.worst.name}</strong> up to {hatcheryVerdict.best.name}'s
                      unhatched rate: <strong>{inr(money.hatcheryGap)}</strong> a year at this volume
                      ({hatcheryVerdict.chicksLost.toLocaleString('en-IN')} chicks).
                    </li>
                  )}
                  {money.flockGap != null && flockVerdict && (
                    <li>
                      • Bringing <strong>{flockVerdict.worst.name}</strong>'s fertility up to {flockVerdict.best.name}'s:{' '}
                      <strong>{inr(money.flockGap)}</strong> ({flockVerdict.eggsLost.toLocaleString('en-IN')} eggs).
                    </li>
                  )}
                  <li>
                    • Meeting the standard on every batch: <strong>{inr(money.short)}</strong>{' '}
                    ({total.shortChicks.toLocaleString('en-IN')} chicks).
                  </li>
                </ul>
                <p className="text-xs text-gray-500 mt-3">
                  These are what the gaps are worth if they closed completely, which no flock or hatchery
                  ever does. Read them as the size of the prize, not a forecast.
                </p>
              </Card>
            </>
          )}
        </>
      )}
    </div>
  )
}
