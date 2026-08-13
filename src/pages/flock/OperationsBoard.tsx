import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { inr, fetchAllPages, flockAgeWeeks, fmtDate } from '@/lib/utils'
import { Card, SectionHeader, Table, Th, Td, Spinner, EmptyState, Badge, Select } from '@/components/ui'
import { Bird, AlertTriangle, Info, TrendingDown } from 'lucide-react'
import toast from 'react-hot-toast'
import { useFeedRates } from '@/hooks/useFeedRates'
import { useMedicineRates } from '@/lib/medicineRates'

// Flock Operations Board — one screen answering "what is every active flock
// doing, and what needs me today".
//
// Two rules run through the whole page, both agreed before it was built:
//
//  1. EVERY deviation from the Venco standard is listed — nothing is hidden
//     behind a threshold. The list is ordered by how far off standard each one
//     is, so the worst is always first and a small drift never buries a real
//     problem.
//  2. Where a figure cannot be computed honestly it shows "—", never 0. A
//     brooding flock has no HD%; a flock with no laying season has no standard
//     to compare against; an unpriced feed day has no cost. A zero in any of
//     those places reads as "bad", which is a different and wrong message.

const numFmt = (n: number) => n.toLocaleString('en-IN')
const pct1 = (n: number | null) => (n == null ? '—' : `${n.toFixed(1)}%`)
const DAYS = 7

type Sev = 'act' | 'check' | 'fyi'
interface Alert { sev: Sev; title: string; detail: string; to?: string; rank: number }

export const OperationsBoard: React.FC = () => {
  const [scope, setScope] = useState<'all' | 'site' | 'day' | 'month'>('all')
  const [periodFlock, setPeriodFlock] = useState('')
  const feedRates = useFeedRates()
  const medRate = useMedicineRates()

  const today = new Date()
  const iso = (d: Date) => d.toISOString().slice(0, 10)
  const from = iso(new Date(today.getTime() - DAYS * 864e5))
  const monthStart = iso(new Date(today.getFullYear(), today.getMonth(), 1))
  // Twelve months back, so the month-wise view has something to show. The
  // month-to-date cost still uses monthStart; only the production history is
  // fetched wider.
  const histFrom = iso(new Date(today.getFullYear() - 1, today.getMonth(), 1))

  const { data: flocks, isLoading: flocksLoading } = useQuery({
    queryKey: ['ob_flocks'],
    queryFn: async () => {
      const { data, error } = await supabase.from('flocks')
        .select('id,flock_no,breed,status,placement_date,laying_start_date,laying_season,rearing_farm_id,laying_farm_id,paid_female,paid_male,free_female,free_male,chick_rate')
        .neq('status', 'closed').order('flock_no')
      if (error) { toast.error(error.message); throw error }
      return data ?? []
    },
  })
  // Live birds come from v_flock_summary, the one place that owns the rule:
  // closing_female, else opening_female, else total placed — and MALES as well
  // as females. The first version of this page read the latest daily record's
  // opening_female on its own, which both ignored the closing figure and
  // dropped every male bird, so it disagreed with the Dashboard and with All
  // Flocks Data. One source, not a third opinion.
  const { data: summary } = useQuery({
    queryKey: ['ob_flock_summary'],
    queryFn: async () => {
      const { data, error } = await supabase.from('v_flock_summary')
        .select('id,current_female,current_male,total_placed_f,total_placed_m')
      if (error) { toast.error(error.message); throw error }
      return data ?? []
    },
  })
  const { data: farms } = useQuery({
    queryKey: ['ob_farms'],
    queryFn: async () => { const { data } = await supabase.from('farms').select('id,name,code'); return data ?? [] },
  })
  // Daily records from the start of this month — enough for the 7-day rates and
  // the month-to-date cost, in one fetch rather than two overlapping ones.
  const { data: daily, isLoading: dailyLoading } = useQuery({
    queryKey: ['ob_daily', histFrom],
    queryFn: async () => fetchAllPages<any>((f, t) => supabase.from('daily_records')
      .select('flock_id,record_date,total_eggs,he_eggs,opening_female,opening_male,mortality_female,mortality_male,feed_female_kg,feed_male_kg,feed_type_f,feed_type_m')
      .gte('record_date', histFrom).range(f, t), 'Daily records', toast.error),
  })
  const { data: stdCurve } = useQuery({
    queryKey: ['ob_std_curve'],
    queryFn: async () => {
      const { data } = await supabase.from('std_production_curve').select('season,week_of_age,hen_week_pct,he_pct')
      return data ?? []
    },
  })
  const { data: medUsage } = useQuery({
    queryKey: ['ob_med', monthStart],
    queryFn: async () => fetchAllPages<any>((f, t) => supabase.from('medicine_usage')
      .select('flock_id,usage_date,quantity,rate,medicines_master(name,item_id)')
      .gte('usage_date', monthStart).range(f, t), 'Medicine', toast.error),
  })
  const { data: expenses } = useQuery({
    queryKey: ['ob_exp', monthStart],
    queryFn: async () => {
      const { data } = await supabase.from('farm_expenses')
        .select('flock_id,amount,expense_date').gte('expense_date', monthStart)
      return data ?? []
    },
  })
  const { data: dispatches } = useQuery({
    queryKey: ['ob_disp', monthStart],
    queryFn: async () => {
      const { data } = await supabase.from('he_dispatch')
        .select('id,flock_id,dispatch_date,dc_no,invoice_no,total_dispatched,amount')
        .gte('dispatch_date', monthStart).order('dispatch_date')
      return data ?? []
    },
  })
  const { data: attendance } = useQuery({
    queryKey: ['ob_attendance'],
    queryFn: async () => {
      const y = iso(new Date(today.getTime() - 864e5))
      const { data } = await supabase.from('attendance_daily')
        .select('employee_id,farm_id,status,attendance_date').eq('attendance_date', y)
      return data ?? []
    },
  })
  const { data: employees } = useQuery({
    queryKey: ['ob_employees'],
    queryFn: async () => { const { data } = await supabase.from('employees').select('id,farm_id').eq('is_active', true); return data ?? [] },
  })

  const farmName = useMemo(() => {
    const m: Record<string, string> = {}
    for (const f of (farms ?? []) as any[]) m[f.id] = f.name ?? f.code
    return m
  }, [farms])

  // A flock's site on a date follows the batch: rearing site until the laying
  // start date, laying site after it.
  const siteOf = (fl: any, d: string) =>
    (fl.laying_start_date && d >= fl.laying_start_date ? fl.laying_farm_id : fl.rearing_farm_id)
    ?? fl.laying_farm_id ?? fl.rearing_farm_id ?? null

  const feedRate = (t: any) => (t ? (feedRates.byTypeId[t] ?? feedRates.rate(t)) : 0)

  const rows = useMemo(() => {
    if (!flocks) return []
    const dr = (daily ?? []) as any[]
    const recent = dr.filter(r => r.record_date >= from)

    return (flocks as any[]).map(fl => {
      const mine = dr.filter(r => r.flock_id === fl.id && r.record_date >= monthStart)
      const mine7 = recent.filter(r => r.flock_id === fl.id)

      const eggs7 = mine7.reduce((s, r) => s + (r.total_eggs ?? 0), 0)
      const he7 = mine7.reduce((s, r) => s + (r.he_eggs ?? 0), 0)
      const openF7 = mine7.reduce((s, r) => s + (r.opening_female ?? 0), 0)
      // Weighted across the week — the sum of eggs over the sum of the
      // denominator, not an average of each day's own percentage, which drifts
      // whenever bird count varies. Same formula v_flock_summary uses.
      const hd = openF7 > 0 ? (eggs7 / openF7) * 100 : null
      const hePct = eggs7 > 0 ? (he7 / eggs7) * 100 : null

      const sm = ((summary ?? []) as any[]).find(v => v.id === fl.id)
      const birdsF = sm?.current_female ?? 0
      const birdsM = sm?.current_male ?? 0
      const birds = birdsF + birdsM
      const placed = (sm?.total_placed_f ?? 0) + (sm?.total_placed_m ?? 0)
      const mortMtd = mine.reduce((s, r) => s + (r.mortality_female ?? 0) + (r.mortality_male ?? 0), 0)

      // Feed per bird per day, SEPARATELY for each sex. The first version
      // divided the combined feed by the combined bird count, which is
      // meaningless — males and females are fed different quantities, and a
      // blended figure matches neither. Each is grams fed to that sex divided
      // by that sex's bird-DAYS (the sum of its opening count across the days),
      // so a day with fewer birds counts for less, exactly as it should.
      const femDays = mine7.reduce((s, r) => s + (r.opening_female ?? 0), 0)
      const maleDays = mine7.reduce((s, r) => s + (r.opening_male ?? 0), 0)
      const feedFkg = mine7.reduce((s, r) => s + (r.feed_female_kg ?? 0), 0)
      const feedMkg = mine7.reduce((s, r) => s + (r.feed_male_kg ?? 0), 0)
      const feedPerBirdF = femDays > 0 ? (feedFkg * 1000) / femDays : null
      const feedPerBirdM = maleDays > 0 ? (feedMkg * 1000) / maleDays : null

      // Month-to-date DIRECT cost. Salary and electricity are deliberately not
      // here: they are recorded per SITE and nothing says which flock they
      // belong to, so they are reported in the site table instead of being
      // split into a number that would be invented.
      const feedCost = mine.reduce((s, r) =>
        s + (r.feed_female_kg ?? 0) * feedRate(r.feed_type_f) + (r.feed_male_kg ?? 0) * feedRate(r.feed_type_m), 0)
      const feedUnpriced = mine.reduce((s, r) =>
        s + (feedRate(r.feed_type_f) ? 0 : (r.feed_female_kg ?? 0))
          + (feedRate(r.feed_type_m) ? 0 : (r.feed_male_kg ?? 0)), 0)
      const medCost = ((medUsage ?? []) as any[]).filter(m => m.flock_id === fl.id)
        .reduce((s, m) => s + (m.quantity ?? 0) *
          (medRate(m.medicines_master?.item_id, m.medicines_master?.name ?? '') ?? m.rate ?? 0), 0)
      const expCost = ((expenses ?? []) as any[]).filter(e => e.flock_id === fl.id)
        .reduce((s, e) => s + (e.amount ?? 0), 0)
      const directCost = feedCost + medCost + expCost

      const eggsMtd = mine.reduce((s, r) => s + (r.total_eggs ?? 0), 0)
      const heMtd = mine.reduce((s, r) => s + (r.he_eggs ?? 0), 0)
      const costPerEgg = eggsMtd > 0 ? directCost / eggsMtd : null
      // Cost per HE is the same cost over hatching eggs only — what a saleable
      // egg costs, since the JE/TE/BE eat the same feed but are not the product.
      const costPerHe = heMtd > 0 ? directCost / heMtd : null

      const wk = flockAgeWeeks(fl.placement_date)
      const std = fl.laying_season
        ? ((stdCurve ?? []) as any[]).find(c => c.season === fl.laying_season && c.week_of_age === wk)
        : null

      return {
        fl, wk, birds, birdsF, birdsM, placed, site: farmName[siteOf(fl, iso(today)) ?? ''] ?? '—',
        eggs7, hd, hePct, mortMtd,
        mortPct: placed > 0 ? (mortMtd / placed) * 100 : null,
        feedPerBirdF, feedPerBirdM, directCost, costPerEgg, costPerHe, feedUnpriced,
        eggsMtd, heMtd,
        stdHd: std?.hen_week_pct ?? null,
        stdHe: std?.he_pct ?? null,
        hasStd: !!std,
        laying: !!fl.laying_start_date && iso(today) >= fl.laying_start_date,
      }
    })
  }, [flocks, summary, daily, stdCurve, medUsage, expenses, farmName, feedRates, medRate])

  // Every deviation, worst first. Nothing is filtered out by a threshold.
  const alerts = useMemo(() => {
    const out: Alert[] = []
    for (const r of rows) {
      if (r.hd != null && r.stdHd != null) {
        const d = r.hd - r.stdHd
        if (Math.abs(d) >= 0.05) out.push({
          sev: d < -3 ? 'act' : d < 0 ? 'check' : 'fyi',
          title: `Flock ${r.fl.flock_no} — HD% ${d < 0 ? 'below' : 'above'} standard by ${Math.abs(d).toFixed(1)}`,
          detail: `${pct1(r.hd)} against ${pct1(r.stdHd)} for week ${r.wk}.`,
          to: `/flocks/${r.fl.id}`, rank: Math.abs(d),
        })
      }
      if (r.hePct != null && r.stdHe != null) {
        const d = r.hePct - r.stdHe
        if (Math.abs(d) >= 0.05) out.push({
          sev: d < -3 ? 'act' : d < 0 ? 'check' : 'fyi',
          title: `Flock ${r.fl.flock_no} — HE% ${d < 0 ? 'below' : 'above'} standard by ${Math.abs(d).toFixed(1)}`,
          detail: `${pct1(r.hePct)} against ${pct1(r.stdHe)} for week ${r.wk}.`,
          to: `/flocks/${r.fl.id}`, rank: Math.abs(d),
        })
      }
      if (r.laying && !r.fl.laying_season) out.push({
        sev: 'check',
        title: `Flock ${r.fl.flock_no} has no laying season set`,
        detail: 'Without Summer or Winter there is no Venco standard, so its HD% and HE% show with no target beside them.',
        to: '/flocks', rank: 100,
      })
      if (r.feedUnpriced > 0) out.push({
        sev: 'check',
        title: `Flock ${r.fl.flock_no} — ${numFmt(Math.round(r.feedUnpriced))} kg of feed cannot be priced`,
        detail: 'Either the day has no feed type, or that feed type has no costed formula behind it. Cost per egg is understated by whatever it would have cost.',
        to: `/flocks/${r.fl.id}`, rank: 90,
      })
    }
    const noInv = ((dispatches ?? []) as any[]).filter(d => !d.invoice_no && (d.amount ?? 0) > 0)
    if (noInv.length) out.push({
      sev: 'act',
      title: `${noInv.length} dispatch${noInv.length > 1 ? 'es' : ''} with no invoice number`,
      detail: `${inr(noInv.reduce((s, d) => s + (d.amount ?? 0), 0))} dispatched this month and not yet invoiced.`,
      to: '/flocks/he-dispatch', rank: 200,
    })
    return out.sort((a, b) => b.rank - a.rank)
  }, [rows, dispatches])

  const sites = useMemo(() => {
    const m: Record<string, any> = {}
    for (const r of rows) {
      const k = r.site
      m[k] ??= { site: k, flocks: 0, birds: 0, eggs7: 0, he7: 0, openF7: 0, mort: 0, staff: 0, cost: 0, eggsMtd: 0, heMtd: 0 }
      m[k].flocks++; m[k].birds += r.birds; m[k].eggs7 += r.eggs7
      m[k].mort += r.mortMtd; m[k].cost += r.directCost
      m[k].eggsMtd += r.eggsMtd; m[k].heMtd += r.heMtd
    }
    // Staff present yesterday, by site — attendance carries its own farm_id,
    // falling back to the employee's.
    const empFarm: Record<string, string> = {}
    for (const e of (employees ?? []) as any[]) empFarm[e.id] = e.farm_id
    for (const a of (attendance ?? []) as any[]) {
      if (a.status !== 'P' && a.status !== 'OT' && a.status !== 'H') continue
      const nm = farmName[a.farm_id ?? empFarm[a.employee_id] ?? ''] ?? null
      if (nm && m[nm]) m[nm].staff += a.status === 'H' ? 0.5 : 1
    }
    return Object.values(m)
  }, [rows, attendance, employees, farmName])

  // Day-wise and month-wise, on exactly the same bird-days rule as the cards —
  // one definition of feed per bird for the whole page, so the views cannot
  // quietly disagree with each other.
  const periodRows = useMemo(() => {
    const dr = ((daily ?? []) as any[]).filter(r => !periodFlock || r.flock_id === periodFlock)
    const key = (d: string) => (scope === 'month' ? d.slice(0, 7) : d)
    const m: Record<string, any> = {}
    for (const r of dr) {
      const k = key(String(r.record_date))
      m[k] ??= { k, eggs: 0, he: 0, femDays: 0, maleDays: 0, feedF: 0, feedM: 0, mort: 0, days: new Set<string>() }
      const g = m[k]
      g.eggs += r.total_eggs ?? 0; g.he += r.he_eggs ?? 0
      g.femDays += r.opening_female ?? 0; g.maleDays += r.opening_male ?? 0
      g.feedF += r.feed_female_kg ?? 0; g.feedM += r.feed_male_kg ?? 0
      g.mort += (r.mortality_female ?? 0) + (r.mortality_male ?? 0)
      g.days.add(String(r.record_date))
    }
    return Object.values(m).map((g: any) => ({
      k: g.k, eggs: g.eggs, he: g.he, mort: g.mort, days: g.days.size,
      hd: g.femDays > 0 ? (g.eggs / g.femDays) * 100 : null,
      hePct: g.eggs > 0 ? (g.he / g.eggs) * 100 : null,
      feedF: g.femDays > 0 ? (g.feedF * 1000) / g.femDays : null,
      feedM: g.maleDays > 0 ? (g.feedM * 1000) / g.maleDays : null,
      feedKg: g.feedF + g.feedM,
    })).sort((a, b) => b.k.localeCompare(a.k))
  }, [daily, scope, periodFlock])

  const totals = useMemo(() => {
    const birds = rows.reduce((s, r) => s + r.birds, 0)
    const eggs7 = rows.reduce((s, r) => s + r.eggs7, 0)
    const eggsMtd = rows.reduce((s, r) => s + r.eggsMtd, 0)
    const heMtd = rows.reduce((s, r) => s + r.heMtd, 0)
    const cost = rows.reduce((s, r) => s + r.directCost, 0)
    const laying = rows.filter(r => r.hd != null)
    return {
      birds, eggs7, eggsMtd, heMtd, cost,
      hd: laying.length ? laying.reduce((s, r) => s + (r.hd ?? 0), 0) / laying.length : null,
      he: laying.length ? laying.reduce((s, r) => s + (r.hePct ?? 0), 0) / laying.length : null,
      costPerEgg: eggsMtd > 0 ? cost / eggsMtd : null,
      costPerHe: heMtd > 0 ? cost / heMtd : null,
    }
  }, [rows])

  if (flocksLoading || dailyLoading) return <div className="py-16 flex justify-center"><Spinner size={32} /></div>
  if (!rows.length) return (
    <EmptyState icon={<Bird size={32} />} title="No active flocks"
      subtitle="Every flock is closed, or none has been created yet." />
  )

  const sevStyle: Record<Sev, string> = {
    act: 'bg-red-50 text-red-700 border-red-200',
    check: 'bg-amber-50 text-amber-700 border-amber-200',
    fyi: 'bg-brand-50 text-brand-700 border-brand-200',
  }
  const sevStripe: Record<Sev, string> = { act: 'bg-red-500', check: 'bg-amber-500', fyi: 'bg-brand-500' }
  const sevLabel: Record<Sev, string> = { act: 'Act', check: 'Check', fyi: 'FYI' }

  return (
    <div className="space-y-5">
      <SectionHeader title="Operations Board"
        subtitle={`${rows.length} active flock${rows.length > 1 ? 's' : ''} · production over the last ${DAYS} days · cost month to date`}
        action={<div className="flex gap-2 flex-wrap">
          {(scope === 'day' || scope === 'month') && (
            <Select value={periodFlock} onChange={e => setPeriodFlock(e.target.value)}
              options={[{ value: '', label: 'All flocks' },
                ...rows.map(r => ({ value: r.fl.id, label: `Flock ${r.fl.flock_no}` }))]} />
          )}
          <Select value={scope} onChange={e => setScope(e.target.value as any)}
            options={[{ value: 'all', label: 'By flock' }, { value: 'site', label: 'By site' },
              { value: 'day', label: 'Day-wise' }, { value: 'month', label: 'Month-wise' }]} />
        </div>} />

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-px bg-gray-200 border border-gray-200 rounded-xl overflow-hidden">
        {[
          { lab: 'Active flocks', val: String(rows.length), sub: `${sites.length} site${sites.length > 1 ? 's' : ''}` },
          { lab: 'Live birds', val: numFmt(totals.birds), sub: 'latest daily entry' },
          { lab: `Eggs (${DAYS}d)`, val: numFmt(totals.eggs7), sub: 'all types' },
          { lab: 'HD %', val: pct1(totals.hd), sub: 'laying flocks only' },
          { lab: 'HE %', val: pct1(totals.he), sub: 'of total eggs' },
          { lab: 'Cost / egg', val: totals.costPerEgg != null ? `₹${totals.costPerEgg.toFixed(2)}` : '—', sub: 'direct, month to date' },
          { lab: 'Cost / HE', val: totals.costPerHe != null ? `₹${totals.costPerHe.toFixed(2)}` : '—', sub: 'same cost ÷ HE only' },
        ].map(k => (
          <div key={k.lab} className="bg-white p-3">
            <div className="text-[10px] uppercase tracking-wide text-gray-500 font-semibold">{k.lab}</div>
            <div className="text-xl font-bold text-gray-900 mt-0.5">{k.val}</div>
            <div className="text-[10px] text-gray-400 mt-0.5">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Alerts */}
      <Card padding={false}>
        <div className="px-4 py-3 border-b border-gray-100 flex items-baseline justify-between gap-3 flex-wrap">
          <h3 className="font-semibold text-gray-800">Needs attention</h3>
          <p className="text-[11px] text-gray-500 max-w-xl">
            Every deviation from standard is listed — nothing is hidden by a threshold — ordered by how far off
            standard each one is, so the worst is always at the top.
          </p>
        </div>
        {alerts.length === 0 ? (
          <div className="px-4 py-6 text-sm text-gray-400 text-center">
            Nothing to flag — every flock is on standard and every dispatch is invoiced.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {alerts.map((a, i) => (
              <div key={i} className="flex items-stretch">
                <span className={`w-1 shrink-0 ${sevStripe[a.sev]}`} />
                <div className="flex-1 px-4 py-2.5">
                  <div className="text-sm font-medium text-gray-800">
                    <span className={`inline-block text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full border mr-2 ${sevStyle[a.sev]}`}>
                      {sevLabel[a.sev]}
                    </span>
                    {a.title}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">{a.detail}</div>
                </div>
                {a.to && (
                  <Link to={a.to} className="px-4 py-2.5 text-xs font-semibold text-brand-600 hover:text-brand-700 self-center whitespace-nowrap">
                    Open →
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Flock cards */}
      {scope === 'all' && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rows.map(r => (
            <Card key={r.fl.id} padding={false} className="flex flex-col">
              <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-start gap-3">
                <div>
                  <Link to={`/flocks/${r.fl.id}`} className="font-bold text-gray-900 hover:text-brand-700">
                    Flock {r.fl.flock_no}
                  </Link>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {r.fl.breed} · {r.site} · <Badge color={r.laying ? 'green' : 'yellow'}>{r.fl.status}</Badge>
                  </div>
                  {r.laying && !r.fl.laying_season && (
                    <div className="mt-1.5 inline-block text-[11px] font-medium border border-amber-300 bg-amber-50 text-amber-700 rounded px-2 py-0.5">
                      No laying season — set it to compare against standard
                    </div>
                  )}
                </div>
                <div className="text-right text-xs text-gray-500">
                  age<span className="block text-base font-bold text-gray-900">{r.wk} wk</span>
                </div>
              </div>

              <div className="divide-y divide-gray-50 text-sm">
                <Metric k="Live birds" v={numFmt(r.birds)} note={`♀ ${numFmt(r.birdsF)} · ♂ ${numFmt(r.birdsM)}`} />
                <Metric k={`HD % (${DAYS}d)`} v={pct1(r.hd)}
                  std={r.stdHd} actual={r.hd} hasStd={r.hasStd}
                  note={!r.laying ? 'brooding' : undefined} />
                <Metric k="HE %" v={pct1(r.hePct)}
                  std={r.stdHe} actual={r.hePct} hasStd={r.hasStd}
                  note={!r.laying ? 'brooding' : undefined} />
                <Metric k="Mortality (mtd)" v={pct1(r.mortPct)} note={`${numFmt(r.mortMtd)} of ${numFmt(r.placed)} placed`} />
                <Metric k="Feed / ♀ / day" v={r.feedPerBirdF != null ? `${r.feedPerBirdF.toFixed(0)} g` : '—'} />
                <Metric k="Feed / ♂ / day" v={r.feedPerBirdM != null ? `${r.feedPerBirdM.toFixed(0)} g` : '—'} />
              </div>

              <div className="mt-auto px-4 py-2.5 bg-gray-50 border-t border-gray-100 flex justify-between text-xs">
                {r.laying ? (
                  <>
                    <span>Cost/egg <b className="text-gray-900">{r.costPerEgg != null ? `₹${r.costPerEgg.toFixed(2)}` : '—'}</b></span>
                    <span>Cost/HE <b className="text-gray-900">{r.costPerHe != null ? `₹${r.costPerHe.toFixed(2)}` : '—'}</b></span>
                  </>
                ) : (
                  <span className="text-gray-500">Rearing — cost per egg starts with lay</span>
                )}
                <span className="text-gray-500">Spend mtd <b className="text-gray-800">{inr(r.directCost)}</b></span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {(scope === 'day' || scope === 'month') && (
        <Card padding={false}>
          <div className="px-4 py-3 border-b border-gray-100 flex items-baseline justify-between gap-3 flex-wrap">
            <h3 className="font-semibold text-gray-800">
              {scope === 'day' ? 'Day-wise' : 'Month-wise'}
              {periodFlock ? ` — Flock ${rows.find(r => r.fl.id === periodFlock)?.fl.flock_no ?? ''}` : ' — all active flocks'}
            </h3>
            <p className="text-[11px] text-gray-500">
              Feed per bird is grams fed to that sex ÷ that sex's bird-days, so a day with fewer birds counts for less.
            </p>
          </div>
          <div className="overflow-x-auto max-h-[36rem] overflow-y-auto">
            <Table>
              <thead><tr>
                <Th>{scope === 'day' ? 'Date' : 'Month'}</Th>
                <Th right>Eggs</Th><Th right>HE</Th><Th right>HD %</Th><Th right>HE %</Th>
                <Th right>Feed kg</Th><Th right>Feed / ♀ / day</Th><Th right>Feed / ♂ / day</Th><Th right>Mortality</Th>
              </tr></thead>
              <tbody>
                {periodRows.map((r: any) => (
                  <tr key={r.k} className="hover:bg-gray-50">
                    <Td>{scope === 'day' ? fmtDate(r.k) : r.k}</Td>
                    <Td right>{numFmt(r.eggs)}</Td>
                    <Td right>{numFmt(r.he)}</Td>
                    <Td right>{pct1(r.hd)}</Td>
                    <Td right>{pct1(r.hePct)}</Td>
                    <Td right>{numFmt(Math.round(r.feedKg))}</Td>
                    <Td right>{r.feedF != null ? `${r.feedF.toFixed(0)} g` : '—'}</Td>
                    <Td right>{r.feedM != null ? `${r.feedM.toFixed(0)} g` : '—'}</Td>
                    <Td right>{r.mort || '—'}</Td>
                  </tr>
                ))}
                {periodRows.length === 0 && (
                  <tr><Td colSpan={9} className="text-center text-gray-400 py-8">No daily records in this period.</Td></tr>
                )}
              </tbody>
            </Table>
          </div>
        </Card>
      )}

      {/* Site roll-up */}
      <Card padding={false}>
        <div className="px-4 py-3 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">By site</h3>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <thead><tr>
              <Th>Site</Th><Th right>Flocks</Th><Th right>Live birds</Th><Th right>Eggs ({DAYS}d)</Th>
              <Th right>Mortality (mtd)</Th><Th right>Staff present</Th>
              <Th right>Direct cost (mtd)</Th><Th right>Cost / egg</Th><Th right>Cost / HE</Th>
            </tr></thead>
            <tbody>
              {sites.map((s: any) => (
                <tr key={s.site} className="hover:bg-gray-50">
                  <Td>{s.site}</Td>
                  <Td right>{s.flocks}</Td>
                  <Td right>{numFmt(s.birds)}</Td>
                  <Td right>{numFmt(s.eggs7)}</Td>
                  <Td right>{numFmt(s.mort)}</Td>
                  <Td right>{s.staff || '—'}</Td>
                  <Td right>{inr(s.cost)}</Td>
                  <Td right>{s.eggsMtd > 0 ? `₹${(s.cost / s.eggsMtd).toFixed(2)}` : '—'}</Td>
                  <Td right>{s.heMtd > 0 ? `₹${(s.cost / s.heMtd).toFixed(2)}` : '—'}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
        <div className="px-4 py-2.5 border-t border-gray-100 text-[11px] text-gray-500">
          <b>Direct cost</b> is feed, medicine and expenses booked to the flock. Salary and electricity are recorded per
          site, not per flock, and nothing in the data says which flock a worker or a unit of power belonged to — so they
          are not divided into these figures. For the complete cost including them, open a flock and use its
          Cost &amp; Income tab.
        </div>
      </Card>
    </div>
  )
}

// One metric line, with a bar carrying the standard as a marker where the flock
// has one. No laying season means no bar at all rather than an invented target.
const Metric: React.FC<{
  k: string; v: string; std?: number | null; actual?: number | null; hasStd?: boolean; note?: string
}> = ({ k, v, std, actual, hasStd, note }) => {
  const dev = actual != null && std != null ? actual - std : null
  return (
    <div className="grid grid-cols-[1fr_auto_5.5rem] gap-2.5 items-center px-4 py-2">
      <span className="text-xs text-gray-600">{k}</span>
      <span className="text-sm font-semibold text-right">{v}</span>
      <span>
        {hasStd && actual != null && std != null ? (
          <>
            <span className="block h-1.5 rounded-full bg-gray-100 relative overflow-hidden">
              <i className={`absolute inset-y-0 left-0 rounded-full ${dev! < -3 ? 'bg-red-500' : dev! < 0 ? 'bg-amber-500' : 'bg-brand-500'}`}
                style={{ width: `${Math.min(100, Math.max(0, actual))}%` }} />
              <span className="absolute -top-0.5 -bottom-0.5 w-0.5 bg-gray-500 opacity-70"
                style={{ left: `${Math.min(100, Math.max(0, std))}%` }} />
            </span>
            <span className={`block text-[10px] text-right mt-0.5 ${dev! < 0 ? 'text-red-600' : 'text-brand-600'}`}>
              {dev! >= 0 ? '+' : ''}{dev!.toFixed(1)} vs std
            </span>
          </>
        ) : (
          <span className="block text-[10px] text-gray-400 text-right">{note ?? (v === '—' ? '' : 'no standard')}</span>
        )}
      </span>
    </div>
  )
}
