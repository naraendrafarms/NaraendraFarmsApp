import React, { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { fetchAllPages, fmtDate } from '@/lib/utils'
import { Card, Select, SectionHeader, Spinner, Table, Th, Td, Button, EmptyState } from '@/components/ui'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'
import { Download, LineChart as LineIcon } from 'lucide-react'

// One flock, week 1 to the last bird, actual against standard.
//
// Everything here is DERIVED, not entered a second time. Mortality and feed
// come from the daily records the sheds already fill in, body weight from the
// weekly weighing, and the standards from the breed tables. That was the whole
// argument for building it: the weekly report a manager assembles by hand in
// Excel is already sitting in the database, one week apart from being read.
//
// Weeks are counted the way the farm's own report counts them — day 1 is the
// day AFTER placement, so week 1 ends on placement + 7. That was checked
// against Flock 22, placed 05-May-2026, whose report dates week 1 as 12-May.

type Flock = {
  id: string; flock_no: string; breed: string | null; status: string
  placement_date: string | null; laying_season: string | null
  total_placed_f: number | null; total_placed_m: number | null
}

const n0 = (v: any) => v == null ? null : Number(v)
const fmt = (v: number | null | undefined, d = 0) =>
  v == null || isNaN(v) ? '—' : Number(v).toLocaleString('en-IN', { minimumFractionDigits: d, maximumFractionDigits: d })

// A deviation reads better with its sign kept: behind standard and ahead of it
// are different problems.
const Dev: React.FC<{ v: number | null; d?: number; goodHigh?: boolean }> = ({ v, d = 0, goodHigh = true }) => {
  if (v == null || isNaN(v)) return <span className="text-gray-300">—</span>
  const good = goodHigh ? v >= 0 : v <= 0
  return (
    <span className={Math.abs(v) < 0.0001 ? 'text-gray-400' : good ? 'text-green-600' : 'text-red-600'}>
      {v > 0 ? '+' : ''}{fmt(v, d)}
    </span>
  )
}

export const FlockLifetime: React.FC = () => {
  const [flockId, setFlockId] = useState('')
  const [sex, setSex] = useState<'Female' | 'Male'>('Female')

  const { data: flocks = [] } = useQuery({
    queryKey: ['flocks_lifetime'],
    queryFn: async () => {
      const { data } = await supabase.from('flocks')
        .select('id,flock_no,breed,status,placement_date,laying_season,total_placed_f,total_placed_m')
        .order('flock_no')
      return (data ?? []) as unknown as Flock[]
    }
  })

  const flock = (flocks as Flock[]).find(f => f.id === flockId) ?? null
  // The standard is published per season. A flock that has not been given one
  // is read against Summer, and the page says so rather than hiding it.
  const season = flock?.laying_season && /winter/i.test(flock.laying_season) ? 'Winter' : 'Summer'

  const { data: daily = [], isLoading } = useQuery({
    queryKey: ['lifetime_daily', flockId],
    enabled: !!flockId,
    queryFn: async () => fetchAllPages<any>(
      (from, to) => supabase.from('daily_records')
        .select('record_date,opening_female,opening_male,closing_female,closing_male,' +
                'mortality_female,mortality_male,trcull_female,trcull_male,' +
                'feed_female_kg,feed_male_kg,total_eggs,he_eggs')
        .eq('flock_id', flockId)
        .order('record_date').order('id').range(from, to),
      'Flock lifetime'
    )
  })

  const { data: weights = [] } = useQuery({
    queryKey: ['lifetime_bw', flockId],
    enabled: !!flockId,
    queryFn: async () => {
      const { data } = await supabase.from('flock_weekly_performance')
        .select('week_of_age,sex,avg_body_weight_g,uniformity_pct,cv_pct')
        .eq('flock_id', flockId).order('week_of_age')
      return data ?? []
    }
  })

  const { data: std = [] } = useQuery({
    queryKey: ['lifetime_std', season, sex],
    queryFn: async () => {
      const { data } = await supabase.from('breed_standard')
        .select('week_of_age,phase,body_weight_g,weekly_gain_g,feed_g_per_day,feed_type')
        .eq('sex', sex).in('season', [season, 'Both']).order('week_of_age')
      return data ?? []
    }
  })

  const { data: curve = [] } = useQuery({
    queryKey: ['lifetime_curve', season],
    queryFn: async () => {
      const { data } = await supabase.from('std_production_curve')
        .select('week_of_age,cum_depletion_pct,hen_week_pct,he_pct,std_production_pct')
        .eq('season', season).order('week_of_age')
      return data ?? []
    }
  })

  const rows = useMemo(() => {
    if (!flock?.placement_date || (daily as any[]).length === 0) return []
    const placed = new Date(flock.placement_date + 'T00:00:00')
    const weekOf = (d: string) => {
      const days = Math.floor((new Date(d + 'T00:00:00').getTime() - placed.getTime()) / 86400000)
      return Math.floor((days - 1) / 7) + 1     // day 1 = the day after placement
    }

    type W = {
      wk: number; days: number
      openF: number | null; openM: number | null
      closeF: number | null; closeM: number | null
      mortF: number; mortM: number; cullF: number; cullM: number
      feedF: number; feedM: number; eggs: number; he: number
    }
    const m = new Map<number, W>()
    for (const r of daily as any[]) {
      const wk = weekOf(r.record_date)
      if (wk < 1) continue                     // anything dated before placement
      const e = m.get(wk) ?? { wk, days: 0, openF: null, openM: null, closeF: null, closeM: null,
                               mortF: 0, mortM: 0, cullF: 0, cullM: 0, feedF: 0, feedM: 0, eggs: 0, he: 0 }
      e.days += 1
      // Opening is the FIRST reading of the week and closing the LAST, summed
      // across sheds on those days — a flock in five sheds has five rows a day.
      if (e.openF == null && r.opening_female != null) e.openF = 0
      e.mortF += Number(r.mortality_female ?? 0); e.mortM += Number(r.mortality_male ?? 0)
      e.cullF += Number(r.trcull_female ?? 0); e.cullM += Number(r.trcull_male ?? 0)
      e.feedF += Number(r.feed_female_kg ?? 0); e.feedM += Number(r.feed_male_kg ?? 0)
      e.eggs += Number(r.total_eggs ?? 0); e.he += Number(r.he_eggs ?? 0)
      m.set(wk, e)
    }

    // Opening and closing birds per week, taken from the first and last DAY of
    // the week across every shed, so a multi-shed flock is counted once.
    const byDate = new Map<string, { f: number; m: number }>()
    for (const r of daily as any[]) {
      const e = byDate.get(r.record_date) ?? { f: 0, m: 0 }
      e.f += Number(r.opening_female ?? 0); e.m += Number(r.opening_male ?? 0)
      byDate.set(r.record_date, e)
    }
    const dates = [...byDate.keys()].sort()
    const firstDayOfWeek = new Map<number, string>(), lastDayOfWeek = new Map<number, string>()
    for (const d of dates) {
      const wk = weekOf(d)
      if (wk < 1) continue
      if (!firstDayOfWeek.has(wk)) firstDayOfWeek.set(wk, d)
      lastDayOfWeek.set(wk, d)
    }

    const bwOf = (wk: number) => (weights as any[]).find(w => w.week_of_age === wk && w.sex === sex)
    const stdOf = (wk: number) => (std as any[]).find(s => s.week_of_age === wk)
    const curveOf = (wk: number) => (curve as any[]).find(c => c.week_of_age === wk)

    const placedTotal = sex === 'Female' ? Number(flock.total_placed_f ?? 0) : Number(flock.total_placed_m ?? 0)
    let cumMort = 0, cumFeedKg = 0

    return [...m.values()].sort((a, b) => a.wk - b.wk).map(w => {
      const isF = sex === 'Female'
      const mort = isF ? w.mortF : w.mortM
      const feed = isF ? w.feedF : w.feedM
      cumMort += mort
      cumFeedKg += feed

      const openDay = firstDayOfWeek.get(w.wk)
      const open = openDay ? (isF ? byDate.get(openDay)!.f : byDate.get(openDay)!.m) : null
      const closeDay = lastDayOfWeek.get(w.wk)
      const close = closeDay ? (isF ? byDate.get(closeDay)!.f : byDate.get(closeDay)!.m) : null

      const birds = open || close || null
      // Feed per bird per day needs the birds that ate it and the days they
      // ate over — a short week must not read as a low intake.
      const feedGPerDay = birds && w.days > 0 ? (feed * 1000) / birds / w.days : null
      const stdRow = stdOf(w.wk)
      const cur = curveOf(w.wk)

      const cumDepPct = placedTotal > 0 ? (cumMort / placedTotal) * 100 : null
      const bw = bwOf(w.wk)
      const bwAct = n0(bw?.avg_body_weight_g)
      const bwStd = n0(stdRow?.body_weight_g)
      const prevBw = bwOf(w.wk - 1)
      const gainAct = bwAct != null && prevBw?.avg_body_weight_g != null
        ? bwAct - Number(prevBw.avg_body_weight_g) : null
      const hdPct = birds && w.days > 0 ? (w.eggs / birds / w.days) * 100 : null

      return {
        wk: w.wk, days: w.days, open, close, mort, cumMort,
        cumDepPct, stdDepPct: n0(cur?.cum_depletion_pct),
        bwAct, bwStd, gainAct, gainStd: n0(stdRow?.weekly_gain_g),
        feedKg: feed, feedGPerDay, feedStd: n0(stdRow?.feed_g_per_day),
        feedType: stdRow?.feed_type ?? null,
        cumFeedPerBird: birds ? cumFeedKg / birds : null,
        eggs: w.eggs, hdPct, hdStd: n0(cur?.hen_week_pct),
        hePct: w.eggs > 0 ? (w.he / w.eggs) * 100 : null, heStd: n0(cur?.he_pct),
        phase: stdRow?.phase ?? (w.eggs > 0 ? 'Laying' : 'Growing'),
      }
    })
  }, [daily, weights, std, curve, flock, sex])

  const chartBW = rows.filter(r => r.bwAct != null || r.bwStd != null)
    .map(r => ({ wk: r.wk, Actual: r.bwAct, Standard: r.bwStd }))
  const chartDep = rows.map(r => ({ wk: r.wk, Actual: r.cumDepPct, Standard: r.stdDepPct }))
  const chartFeed = rows.filter(r => r.feedGPerDay != null || r.feedStd != null)
    .map(r => ({ wk: r.wk, Actual: r.feedGPerDay, Standard: r.feedStd }))
  const chartEgg = rows.filter(r => (r.hdPct ?? 0) > 0 || (r.hdStd ?? 0) > 0)
    .map(r => ({ wk: r.wk, Actual: r.hdPct, Standard: r.hdStd }))

  const exportCSV = () => {
    const headers = ['Week','Days','Opening','Closing','Mortality','Cum mortality','Cum depletion %','Std depletion %',
      'Body wt (g)','Std body wt','Gain (g)','Std gain','Feed kg','Feed g/bird/day','Std feed g/day','Feed type',
      'Cum feed/bird (kg)','Eggs','HD %','Std HD %','HE %','Std HE %']
    const lines = rows.map(r => [r.wk, r.days, r.open ?? '', r.close ?? '', r.mort, r.cumMort,
      r.cumDepPct?.toFixed(2) ?? '', r.stdDepPct ?? '', r.bwAct ?? '', r.bwStd ?? '', r.gainAct ?? '', r.gainStd ?? '',
      r.feedKg.toFixed(1), r.feedGPerDay?.toFixed(1) ?? '', r.feedStd ?? '', r.feedType ?? '',
      r.cumFeedPerBird?.toFixed(2) ?? '', r.eggs, r.hdPct?.toFixed(1) ?? '', r.hdStd ?? '',
      r.hePct?.toFixed(1) ?? '', r.heStd ?? ''])
    const esc = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`
    const csv = [headers.map(esc).join(','), ...lines.map(l => l.map(esc).join(','))].join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = `flock_${flock?.flock_no}_lifetime.csv`
    a.click()
  }

  const chartCard = (title: string, data: any[], unit: string, d = 0) => (
    <Card>
      <p className="text-sm font-semibold mb-2">{title}</p>
      {data.length === 0 ? (
        <p className="text-xs text-gray-400 py-8 text-center">Nothing recorded yet.</p>
      ) : (
        <ResponsiveContainer width="100%" height={230}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="wk" tick={{ fontSize: 11 }}
                   label={{ value: 'Week of age', position: 'insideBottom', offset: -4, fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v: any) => v == null ? '—' : `${fmt(Number(v), d)}${unit}`} />
            <Legend />
            <Line type="monotone" dataKey="Actual" stroke="#10b981" strokeWidth={2} dot={false} connectNulls />
            <Line type="monotone" dataKey="Standard" stroke="#94a3b8" strokeWidth={2} strokeDasharray="4 3" dot={false} connectNulls />
          </LineChart>
        </ResponsiveContainer>
      )}
    </Card>
  )

  return (
    <div className="space-y-4">
      <SectionHeader title="Flock Lifetime — Actual vs Standard"
        subtitle="Week 1 to the last bird. Built from the daily records and the weekly weighing, against the Vencobb430 standard — nothing is entered twice."
        action={rows.length > 0
          ? <Button variant="ghost" size="sm" icon={<Download size={15} />} onClick={exportCSV}>Export</Button>
          : undefined}
      />

      <Card>
        <div className="flex flex-wrap gap-3 items-end">
          <Select label="Flock" placeholder="Select a flock" className="w-56"
                  options={(flocks as Flock[]).map(f => ({ value: f.id, label: `Flock ${f.flock_no} — ${f.status}` }))}
                  value={flockId} onChange={e => setFlockId(e.target.value)} />
          <Select label="Sex" className="w-40" value={sex}
                  options={[{ value: 'Female', label: 'Female' }, { value: 'Male', label: 'Male' }]}
                  onChange={e => setSex(e.target.value as 'Female' | 'Male')} />
          {flock && (
            <div className="text-xs text-gray-500 pb-2">
              Placed {flock.placement_date ? fmtDate(flock.placement_date) : '—'} ·
              {' '}{fmt(sex === 'Female' ? flock.total_placed_f : flock.total_placed_m)} birds ·
              {' '}standard read as <strong>{season}</strong>
              {!flock.laying_season && <span className="text-amber-600"> (no season set on the flock)</span>}
            </div>
          )}
        </div>
      </Card>

      {!flockId ? (
        <Card><EmptyState icon={<LineIcon size={28} />} title="Choose a flock"
          subtitle="Every week of its life, against the standard for its breed and season." /></Card>
      ) : isLoading ? <Spinner /> : rows.length === 0 ? (
        <Card><EmptyState icon={<LineIcon size={28} />} title="No daily records for this flock"
          subtitle="The page is built from daily entry, so it fills in as the days are entered." /></Card>
      ) : (
        <>
          <div className="grid md:grid-cols-2 gap-4">
            {chartCard('Body weight (g)', chartBW, ' g')}
            {chartCard('Cumulative depletion (%)', chartDep, '%', 2)}
            {chartCard('Feed (g/bird/day)', chartFeed, ' g', 1)}
            {chartCard('Hen-day production (%)', chartEgg, '%', 1)}
          </div>

          <Card padding={false}>
            <div className="overflow-x-auto">
              <Table>
                <thead>
                  <tr>
                    <Th>Wk</Th><Th right>Days</Th><Th right>Opening</Th><Th right>Deaths</Th>
                    <Th right>Cum %</Th><Th right>Std %</Th><Th right>Dev</Th>
                    <Th right>Body wt</Th><Th right>Std</Th><Th right>Dev</Th>
                    <Th right>Feed g/b/d</Th><Th right>Std</Th><Th right>Dev</Th>
                    <Th right>Cum feed/bird</Th><Th>Feed type</Th>
                    <Th right>Eggs</Th><Th right>HD%</Th><Th right>Std</Th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(r => (
                    <tr key={r.wk} className={r.days < 7 ? 'bg-amber-50/40' : ''}>
                      <Td className="font-medium">{r.wk}</Td>
                      <Td right className={r.days < 7 ? 'text-amber-700' : 'text-gray-400'}>{r.days}</Td>
                      <Td right>{fmt(r.open)}</Td>
                      <Td right className={r.mort > 0 ? 'text-red-600' : 'text-gray-400'}>{fmt(r.mort)}</Td>
                      <Td right>{fmt(r.cumDepPct, 2)}</Td>
                      <Td right className="text-gray-500">{fmt(r.stdDepPct, 2)}</Td>
                      <Td right><Dev v={r.stdDepPct != null && r.cumDepPct != null ? r.cumDepPct - r.stdDepPct : null} d={2} goodHigh={false} /></Td>
                      <Td right className="font-medium">{fmt(r.bwAct)}</Td>
                      <Td right className="text-gray-500">{fmt(r.bwStd)}</Td>
                      <Td right><Dev v={r.bwAct != null && r.bwStd != null ? r.bwAct - r.bwStd : null} /></Td>
                      <Td right>{fmt(r.feedGPerDay, 1)}</Td>
                      <Td right className="text-gray-500">{fmt(r.feedStd, 1)}</Td>
                      <Td right><Dev v={r.feedGPerDay != null && r.feedStd != null ? r.feedGPerDay - r.feedStd : null} d={1} /></Td>
                      <Td right>{fmt(r.cumFeedPerBird, 2)}</Td>
                      <Td className="text-xs text-gray-500">{r.feedType ?? '—'}</Td>
                      <Td right>{r.eggs ? fmt(r.eggs) : '—'}</Td>
                      <Td right>{r.hdPct ? fmt(r.hdPct, 1) : '—'}</Td>
                      <Td right className="text-gray-500">{fmt(r.hdStd, 1)}</Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
            <p className="text-xs text-gray-500 px-3 py-2">
              Week 1 is the day after placement to placement + 7, the same as the farm's weekly report. A week with
              fewer than seven days of entry is shaded — its totals are real but not comparable with a full week.
              Depletion is measured against the birds placed. Feed per bird per day divides the week's feed by the
              birds and the days actually entered. Body weight comes from the weekly weighing, so it is blank in any
              week nobody weighed.
            </p>
          </Card>
        </>
      )}
    </div>
  )
}
