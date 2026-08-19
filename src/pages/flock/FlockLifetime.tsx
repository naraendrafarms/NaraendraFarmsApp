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
// Weeks are counted the way the farm's own report counts them: week 1 is the
// placement day and the six days after. That was settled by arithmetic rather
// than by reading the sheet's headings — counted this way Flock 22's weeks 2
// to 14 match its weekly report exactly on both mortality and feed, and
// counted from the day after placement not one of them matches. The sheet
// DATES week 1 as placement + 7 because that is the day the birds are weighed,
// which is a different thing from the week it belongs to.

type Flock = {
  id: string; flock_no: string; breed: string | null; status: string
  placement_date: string | null; laying_season: string | null; rearing_season: string | null
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
  // '' means both sexes side by side, the way the weekly report is laid out.
  const [sex, setSex] = useState<'Female' | 'Male' | ''>('Female')

  const { data: flocks = [] } = useQuery({
    queryKey: ['flocks_lifetime'],
    queryFn: async () => {
      const { data } = await supabase.from('flocks')
        .select('id,flock_no,breed,status,placement_date,laying_season,rearing_season,total_placed_f,total_placed_m')
        .order('flock_no')
      return (data ?? []) as unknown as Flock[]
    }
  })

  const flock = (flocks as Flock[]).find(f => f.id === flockId) ?? null
  // A flock has TWO seasons and they are usually different: it is reared through
  // one and lays through the next. The growing standard (weeks 1-24) must be read
  // against the REARING season and the laying standard against the LAYING one —
  // using a single season for both compares half the flock's life against the
  // wrong curve. Where the rearing season has not been set, the placement month
  // is the fallback the rest of the app already uses (Feb-Jul Summer).
  const monthSeason = (d?: string | null) => {
    if (!d) return null
    const m = parseInt(d.slice(5, 7), 10)
    return (m >= 2 && m <= 7) ? 'Summer' : 'Winter'
  }
  const rearSeason = (flock?.rearing_season && /winter/i.test(flock.rearing_season) ? 'Winter'
                      : flock?.rearing_season ? 'Summer'
                      : monthSeason(flock?.placement_date)) ?? 'Summer'
  const laySeason = flock?.laying_season && /winter/i.test(flock.laying_season) ? 'Winter'
                    : flock?.laying_season ? 'Summer' : null

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
    queryKey: ['lifetime_std', rearSeason, laySeason],
    queryFn: async () => {
      const { data } = await supabase.from('breed_standard')
        .select('week_of_age,sex,season,phase,body_weight_g,weekly_gain_g,feed_g_per_day,feed_type')
        .in('season', [...new Set([rearSeason, laySeason ?? rearSeason, 'Both'])]).order('week_of_age')
      return data ?? []
    }
  })

  const { data: curve = [] } = useQuery({
    queryKey: ['lifetime_curve', laySeason ?? rearSeason],
    queryFn: async () => {
      const { data } = await supabase.from('std_production_curve')
        .select('week_of_age,cum_depletion_pct,hen_week_pct,he_pct,std_production_pct')
        .eq('season', laySeason ?? rearSeason).order('week_of_age')
      return data ?? []
    }
  })

  const both = useMemo(() => {
    if (!flock?.placement_date || (daily as any[]).length === 0) return { Female: [] as any[], Male: [] as any[] }
    const placed = new Date(flock.placement_date + 'T00:00:00')
    // Week 1 is the placement day and the six days after it. That is not a
    // guess: counted this way, Flock 22's weeks 2 to 14 reproduce its weekly
    // report EXACTLY, mortality and feed alike, while counting from the day
    // after placement misses every one of them by a day. (Week 1 still differs
    // by the transit mortality and cull chicks, which the report keeps out of
    // depletion and the app records as day-one deaths.)
    const weekOf = (d: string) => {
      const days = Math.floor((new Date(d + 'T00:00:00').getTime() - placed.getTime()) / 86400000)
      return Math.floor(days / 7) + 1
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

    const bwOf = (wk: number, sx: string) => (weights as any[]).find(w => w.week_of_age === wk && w.sex === sx)
    const stdOf = (wk: number, sx: string) => {
      const rows = (std as any[]).filter(s => s.week_of_age === wk && s.sex === sx)
      if (!rows.length) return undefined
      // Males are published once, under season 'Both'.
      if (sx === 'Male') return rows.find(s => s.season === 'Both') ?? rows[0]
      // Week 24 appears in both books. It belongs to laying only once the flock
      // has a laying season, otherwise it is the last growing week.
      const laying = wk > 24 || (wk === 24 && !!laySeason)
      const want = laying ? (laySeason ?? rearSeason) : rearSeason
      const phase = laying ? 'Laying' : 'Growing'
      return rows.find(s => s.phase === phase && s.season === want)
          ?? rows.find(s => s.phase === phase)
    }
    const curveOf = (wk: number) => (curve as any[]).find(c => c.week_of_age === wk)

    // Built once per sex. The running totals must restart for each, or the
    // males would inherit the females' cumulative feed.
    const build = (sx: 'Female' | 'Male') => {
    const placedTotal = sx === 'Female' ? Number(flock.total_placed_f ?? 0) : Number(flock.total_placed_m ?? 0)
    let cumMort = 0, cumFeedKg = 0, cumStdKgPerBird = 0

    return [...m.values()].sort((a, b) => a.wk - b.wk).map(w => {
      const isF = sx === 'Female'
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
      const stdRow = stdOf(w.wk, sx)
      const cur = curveOf(w.wk)

      const cumDepPct = placedTotal > 0 ? (cumMort / placedTotal) * 100 : null
      // The sheet also carries CUMULATIVE feed against cumulative standard, so
      // a flock that ate well one week and poorly the next is judged on the
      // whole run rather than the last seven days.
      cumStdKgPerBird += stdRow?.feed_g_per_day != null ? (Number(stdRow.feed_g_per_day) * 7) / 1000 : 0
      const bw = bwOf(w.wk, sx)
      const bwAct = n0(bw?.avg_body_weight_g)
      const bwStd = n0(stdRow?.body_weight_g)
      const prevBw = bwOf(w.wk - 1, sx)
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
        cumStdPerBird: cumStdKgPerBird || null,
        eggs: w.eggs, hdPct, hdStd: n0(cur?.hen_week_pct),
        hePct: w.eggs > 0 ? (w.he / w.eggs) * 100 : null, heStd: n0(cur?.he_pct),
        phase: stdRow?.phase ?? (w.eggs > 0 ? 'Laying' : 'Growing'),
      }
    })
    }
    return { Female: build('Female'), Male: build('Male') }
  }, [daily, weights, std, curve, flock, rearSeason, laySeason])

  // Eggs belong to the flock, not to a sex, so in the Both view they are shown
  // once against the females that laid them.
  const rows = sex === 'Male' ? both.Male : both.Female
  const showingBoth = sex === ''

  // In the Both view every chart carries four lines — each sex and its own
  // standard. One combined "actual" line would zig-zag between two animals
  // that are not comparable.
  const pair = (key: 'bwAct' | 'cumDepPct' | 'feedGPerDay', stdKey: 'bwStd' | 'stdDepPct' | 'feedStd') => {
    const byWeek = new Map<number, any>()
    for (const r of both.Female) byWeek.set(r.wk, { wk: r.wk, Female: (r as any)[key], 'Female std': (r as any)[stdKey] })
    for (const r of both.Male) {
      const e = byWeek.get(r.wk) ?? { wk: r.wk }
      e['Male'] = (r as any)[key]; e['Male std'] = (r as any)[stdKey]
      byWeek.set(r.wk, e)
    }
    return [...byWeek.values()].sort((a, b) => a.wk - b.wk)
  }

  const chartBW = showingBoth ? pair('bwAct', 'bwStd')
    : rows.filter(r => r.bwAct != null || r.bwStd != null)
        .map(r => ({ wk: r.wk, Actual: r.bwAct, Standard: r.bwStd }))
  const chartDep = showingBoth ? pair('cumDepPct', 'stdDepPct')
    : rows.map(r => ({ wk: r.wk, Actual: r.cumDepPct, Standard: r.stdDepPct }))
  const chartFeed = showingBoth ? pair('feedGPerDay', 'feedStd')
    : rows.filter(r => r.feedGPerDay != null || r.feedStd != null)
        .map(r => ({ wk: r.wk, Actual: r.feedGPerDay, Standard: r.feedStd }))
  const chartEgg = rows.filter(r => (r.hdPct ?? 0) > 0 || (r.hdStd ?? 0) > 0)
    .map(r => ({ wk: r.wk, Actual: r.hdPct, Standard: r.hdStd }))

  const exportCSV = () => {
    const headers = ['Week','Days','Opening','Closing','Mortality','Cum mortality','Cum depletion %','Std depletion %',
      'Body wt (g)','Std body wt','Gain (g)','Std gain','Feed kg','Feed g/bird/day','Std feed g/day','Feed type',
      'Cum feed/bird (kg)','Std cum feed/bird (kg)','Eggs','HD %','Std HD %','HE %','Std HE %']
    const lines = rows.map(r => [r.wk, r.days, r.open ?? '', r.close ?? '', r.mort, r.cumMort,
      r.cumDepPct?.toFixed(2) ?? '', r.stdDepPct ?? '', r.bwAct ?? '', r.bwStd ?? '', r.gainAct ?? '', r.gainStd ?? '',
      r.feedKg.toFixed(1), r.feedGPerDay?.toFixed(1) ?? '', r.feedStd ?? '', r.feedType ?? '',
      r.cumFeedPerBird?.toFixed(2) ?? '', r.cumStdPerBird?.toFixed(2) ?? '', r.eggs, r.hdPct?.toFixed(1) ?? '', r.hdStd ?? '',
      r.hePct?.toFixed(1) ?? '', r.heStd ?? ''])
    const esc = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`
    const csv = [headers.map(esc).join(','), ...lines.map(l => l.map(esc).join(','))].join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = `flock_${flock?.flock_no}_lifetime_${sex || 'female'}.csv`
    a.click()
  }

  const chartCard = (title: string, data: any[], unit: string, d = 0, single = false) => (
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
            {showingBoth && !single ? (
              <>
                <Line type="monotone" dataKey="Female" stroke="#ec4899" strokeWidth={2} dot={false} connectNulls />
                <Line type="monotone" dataKey="Female std" stroke="#f9a8d4" strokeWidth={2} strokeDasharray="4 3" dot={false} connectNulls />
                <Line type="monotone" dataKey="Male" stroke="#2563eb" strokeWidth={2} dot={false} connectNulls />
                <Line type="monotone" dataKey="Male std" stroke="#93c5fd" strokeWidth={2} strokeDasharray="4 3" dot={false} connectNulls />
              </>
            ) : (
              <>
                <Line type="monotone" dataKey="Actual" stroke="#10b981" strokeWidth={2} dot={false} connectNulls />
                <Line type="monotone" dataKey="Standard" stroke="#94a3b8" strokeWidth={2} strokeDasharray="4 3" dot={false} connectNulls />
              </>
            )}
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
          <Select label="Sex" className="w-52" value={sex}
                  options={[{ value: 'Female', label: 'Female' }, { value: 'Male', label: 'Male' },
                            { value: '', label: 'Both (male and female)' }]}
                  onChange={e => setSex(e.target.value as 'Female' | 'Male' | '')} />
          {flock && (
            <div className="text-xs text-gray-500 pb-2">
              Placed {flock.placement_date ? fmtDate(flock.placement_date) : '—'} ·
              {' '}{fmt(sex === 'Female' ? flock.total_placed_f : flock.total_placed_m)} birds ·
              {' '}rearing standard <strong>{rearSeason}</strong>
              {!flock.rearing_season && <span className="text-amber-600"> (from placement month — not set)</span>}
              {' '}· laying standard <strong>{laySeason ?? '—'}</strong>
              {!flock.laying_season && <span className="text-amber-600"> (not set)</span>}
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
            {chartCard('Hen-day production (%)', chartEgg, '%', 1, true)}
          </div>

          <Card padding={false}>
            <div className="overflow-x-auto">
              {showingBoth ? (
                // Both sexes on one line per week, the layout of the farm's own
                // weekly report. Standards are shown as the deviation only —
                // twelve more columns of standard would not fit on any screen,
                // and the deviation is the number anybody actually reads.
                <Table>
                  <thead>
                    <tr>
                      <Th>Wk</Th><Th right>Days</Th>
                      <Th right>♀ Open</Th><Th right>♀ Deaths</Th><Th right>♀ Cum %</Th><Th right>♀ Dev</Th>
                      <Th right>♀ Body wt</Th><Th right>♀ Dev</Th><Th right>♀ Feed g/b/d</Th><Th right>♀ Dev</Th>
                      <Th right>♂ Open</Th><Th right>♂ Deaths</Th><Th right>♂ Cum %</Th><Th right>♂ Dev</Th>
                      <Th right>♂ Body wt</Th><Th right>♂ Dev</Th><Th right>♂ Feed g/b/d</Th><Th right>♂ Dev</Th>
                      <Th right>Eggs</Th><Th right>HD%</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {both.Female.map((f: any, i: number) => {
                      const m2: any = both.Male[i] ?? {}
                      return (
                        <tr key={f.wk} className={f.days < 7 ? 'bg-amber-50/40' : ''}>
                          <Td className="font-medium">{f.wk}</Td>
                          <Td right className={f.days < 7 ? 'text-amber-700' : 'text-gray-400'}>{f.days}</Td>

                          <Td right>{fmt(f.open)}</Td>
                          <Td right className={f.mort > 0 ? 'text-red-600' : 'text-gray-400'}>{fmt(f.mort)}</Td>
                          <Td right>{fmt(f.cumDepPct, 2)}</Td>
                          <Td right><Dev v={f.stdDepPct != null && f.cumDepPct != null ? f.cumDepPct - f.stdDepPct : null} d={2} goodHigh={false} /></Td>
                          <Td right className="font-medium">{fmt(f.bwAct)}</Td>
                          <Td right><Dev v={f.bwAct != null && f.bwStd != null ? f.bwAct - f.bwStd : null} /></Td>
                          <Td right>{fmt(f.feedGPerDay, 1)}</Td>
                          <Td right><Dev v={f.feedGPerDay != null && f.feedStd != null ? f.feedGPerDay - f.feedStd : null} d={1} /></Td>

                          <Td right>{fmt(m2.open)}</Td>
                          <Td right className={m2.mort > 0 ? 'text-red-600' : 'text-gray-400'}>{fmt(m2.mort)}</Td>
                          <Td right>{fmt(m2.cumDepPct, 2)}</Td>
                          <Td right><Dev v={m2.stdDepPct != null && m2.cumDepPct != null ? m2.cumDepPct - m2.stdDepPct : null} d={2} goodHigh={false} /></Td>
                          <Td right className="font-medium">{fmt(m2.bwAct)}</Td>
                          <Td right><Dev v={m2.bwAct != null && m2.bwStd != null ? m2.bwAct - m2.bwStd : null} /></Td>
                          <Td right>{fmt(m2.feedGPerDay, 1)}</Td>
                          <Td right><Dev v={m2.feedGPerDay != null && m2.feedStd != null ? m2.feedGPerDay - m2.feedStd : null} d={1} /></Td>

                          <Td right>{f.eggs ? fmt(f.eggs) : '—'}</Td>
                          <Td right>{f.hdPct ? fmt(f.hdPct, 1) : '—'}</Td>
                        </tr>
                      )
                    })}
                  </tbody>
                </Table>
              ) : (
              <Table>
                <thead>
                  <tr>
                    <Th>Wk</Th><Th right>Days</Th><Th right>Opening</Th><Th right>Deaths</Th>
                    <Th right>Cum %</Th><Th right>Std %</Th><Th right>Dev</Th>
                    <Th right>Body wt</Th><Th right>Std</Th><Th right>Dev</Th>
                    <Th right>Feed kg</Th><Th right>Feed g/b/d</Th><Th right>Std</Th><Th right>Dev</Th>
                    <Th right>Cum feed/bird</Th><Th right>Std cum</Th><Th right>Dev</Th><Th>Feed type</Th>
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
                      <Td right>{fmt(r.feedKg, 0)}</Td>
                      <Td right>{fmt(r.feedGPerDay, 1)}</Td>
                      <Td right className="text-gray-500">{fmt(r.feedStd, 1)}</Td>
                      <Td right><Dev v={r.feedGPerDay != null && r.feedStd != null ? r.feedGPerDay - r.feedStd : null} d={1} /></Td>
                      <Td right>{fmt(r.cumFeedPerBird, 2)}</Td>
                      <Td right className="text-gray-500">{fmt(r.cumStdPerBird, 2)}</Td>
                      <Td right><Dev v={r.cumFeedPerBird != null && r.cumStdPerBird != null ? r.cumFeedPerBird - r.cumStdPerBird : null} d={2} /></Td>
                      <Td className="text-xs text-gray-500">{r.feedType ?? '—'}</Td>
                      <Td right>{r.eggs ? fmt(r.eggs) : '—'}</Td>
                      <Td right>{r.hdPct ? fmt(r.hdPct, 1) : '—'}</Td>
                      <Td right className="text-gray-500">{fmt(r.hdStd, 1)}</Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              )}
            </div>
            <p className="text-xs text-gray-500 px-3 py-2">
              Week 1 is the placement day and the six days after, which is what reproduces the farm's weekly
              report figure for figure. A week with
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
