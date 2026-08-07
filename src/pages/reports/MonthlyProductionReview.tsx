// Monthly Production Review — the management-meeting report.
//
// Phase 1: every panel that can be built from data the app already holds.
// Deliberately NOT included, because the figures would have to be invented:
//   • "Selection" and the LOSS/PROFIT line — the derivation is not known.
//   • Body weight / B-W gain / Uniformity / CV — no such field exists anywhere.
//   • Feed gm/bird vs standard — actuals exist, the breed's feed STANDARD does not.
//   • Vaccination due-date vs done-date — only the date done is recorded.
// Each of those is called out on screen so a reader is never left wondering
// whether a missing panel means "zero" or "not recorded".
//
// Charts print as pictures of the charts actually on screen (see chartImage.ts),
// so the printout and the review can never disagree.

import React, { useState, useMemo, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { inr, fetchAllPages } from '@/lib/utils'
import {
  Card, Button, Select, SectionHeader, Spinner, Table, Th, Td, SearchableSelect,
} from '@/components/ui'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { Printer } from 'lucide-react'
import { printMultiReport, type PrintSection } from '@/lib/invoicePrint'
import { chartToDataUri } from '@/lib/chartImage'
import toast from 'react-hot-toast'

// ── Helpers ─────────────────────────────────────────────────────────────────

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

const thisMonth = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

const monthLabel = (ym: string) => {
  const [y, m] = ym.split('-')
  return `${MONTH_NAMES[Number(m) - 1]}-${y.slice(2)}`
}

const monthStart = (ym: string) => `${ym}-01`
const monthEnd = (ym: string) => {
  const [y, m] = ym.split('-').map(Number)
  return `${ym}-${String(new Date(y, m, 0).getDate()).padStart(2, '0')}`
}

// The N months ending at ym, oldest first — the deck compares three months.
const lastMonths = (ym: string, n: number) => {
  const [y, m] = ym.split('-').map(Number)
  const out: string[] = []
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(y, m - 1 - i, 1)
    out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  return out
}

const num = (v: any) => Number(v ?? 0) || 0

// PostgREST types an embedded relation as an array even when it resolves to a
// single row, so read it defensively rather than assuming either shape.
const farmName = (f: any) => {
  const r = f?.farms
  return (Array.isArray(r) ? r[0]?.name : r?.name) ?? null
}
const pct1 = (v: number | null) => v == null ? '—' : `${v.toFixed(1)}`
const pct2 = (v: number | null) => v == null ? '—' : `${v.toFixed(2)}`
const dev = (a: number | null, s: number | null, dp = 1) =>
  a == null || s == null ? '—' : `${a - s >= 0 ? '+' : ''}${(a - s).toFixed(dp)}`

// Age in completed weeks on a date (placement date = week 0), matching the
// convention the standard curve is keyed on.
const ageWeeksOn = (placement: string | null | undefined, on: string) => {
  if (!placement) return null
  const d = Math.floor((new Date(on).getTime() - new Date(placement).getTime()) / 86400000)
  return d < 0 ? null : Math.floor(d / 7)
}

// ── Page ────────────────────────────────────────────────────────────────────

export const MonthlyProductionReview: React.FC = () => {
  const [month, setMonth] = useState(thisMonth())
  const [scope, setScope] = useState<'flock' | 'all' | 'company'>('flock')
  const [flockId, setFlockId] = useState('')

  const start = monthStart(month)
  const end = monthEnd(month)
  const months3 = lastMonths(month, 3)

  const hdChartRef = useRef<HTMLDivElement>(null)
  const mortChartRef = useRef<HTMLDivElement>(null)
  const hatchChartRef = useRef<HTMLDivElement>(null)

  // ── Data ──────────────────────────────────────────────────────────────────

  const { data: flocks = [], isLoading: flocksLoading } = useQuery({
    queryKey: ['mpr_flocks'],
    queryFn: async () => {
      const { data } = await supabase.from('flocks')
        .select('id,flock_no,status,placement_date,total_placed_f,total_placed_m,laying_season,laying_farm_id,rearing_farm_id,farms:laying_farm_id(name,code)')
        .order('flock_no')
      return data ?? []
    },
  })

  const activeFlocks = useMemo(
    () => flocks.filter((f: any) => f.status !== 'closed'), [flocks])

  // Default to the first active flock once they load.
  React.useEffect(() => {
    if (!flockId && activeFlocks.length) setFlockId(activeFlocks[0].id)
  }, [activeFlocks, flockId])

  const selectedFlock = useMemo(
    () => flocks.find((f: any) => f.id === flockId) ?? null, [flocks, flockId])

  // Which flocks this run covers.
  const scopeFlocks = useMemo(() => {
    if (scope === 'flock') return selectedFlock ? [selectedFlock] : []
    return activeFlocks
  }, [scope, selectedFlock, activeFlocks])

  const scopeIds = useMemo(() => scopeFlocks.map((f: any) => f.id), [scopeFlocks])

  // Every daily record from placement to month end. The cumulative figures
  // (cum mortality, cum feed/bird, cum HH eggs) are cumulative over the flock's
  // WHOLE life, not the month, so the month alone is not enough.
  const { data: dailyAll = [], isLoading: dailyLoading } = useQuery({
    queryKey: ['mpr_daily', scopeIds.join(','), end],
    enabled: scopeIds.length > 0,
    queryFn: () => fetchAllPages<any>((from, to) =>
      supabase.from('daily_records')
        .select('flock_id,record_date,shed_id,opening_female,opening_male,mortality_female,mortality_male,cull_female,cull_male,transfer_female,transfer_male,trcull_female,trcull_male,total_eggs,he_eggs,je_eggs,te_eggs,be_eggs,le_eggs,feed_female_kg,feed_male_kg,closing_female,closing_male')
        .in('flock_id', scopeIds)
        .lte('record_date', end)
        .order('record_date')
        .range(from, to),
      'Daily records (Monthly Review)', toast.error),
    staleTime: 60_000,
  })

  // One row per flock per date: shed rows and the flock-level grade row both
  // exist, so summing raw rows would double-count the eggs.
  const dailyByFlockDate = useMemo(() => {
    const map = new Map<string, any>()
    for (const d of dailyAll) {
      const key = `${d.flock_id}|${d.record_date}`
      const ex = map.get(key)
      if (!ex) {
        map.set(key, { ...d,
          opening_female: num(d.opening_female), opening_male: num(d.opening_male),
          mortality_female: num(d.mortality_female), mortality_male: num(d.mortality_male),
          cull_female: num(d.cull_female), transfer_female: num(d.transfer_female),
          trcull_female: num(d.trcull_female),
          total_eggs: num(d.total_eggs), he_eggs: num(d.he_eggs), je_eggs: num(d.je_eggs),
          te_eggs: num(d.te_eggs), be_eggs: num(d.be_eggs), le_eggs: num(d.le_eggs),
          feed_female_kg: num(d.feed_female_kg), feed_male_kg: num(d.feed_male_kg),
        })
        continue
      }
      // Shed rows carry birds/feed/mortality; the flock-level row carries the
      // grade split. Adding both is correct for every column EXCEPT where the
      // flock-level row repeats total_eggs — so take the maximum for eggs and
      // sum the rest.
      ex.opening_female += num(d.opening_female)
      ex.opening_male += num(d.opening_male)
      ex.mortality_female += num(d.mortality_female)
      ex.mortality_male += num(d.mortality_male)
      ex.cull_female += num(d.cull_female)
      ex.transfer_female += num(d.transfer_female)
      ex.trcull_female += num(d.trcull_female)
      ex.feed_female_kg += num(d.feed_female_kg)
      ex.feed_male_kg += num(d.feed_male_kg)
      ex.total_eggs = Math.max(ex.total_eggs, num(d.total_eggs))
      ex.he_eggs = Math.max(ex.he_eggs, num(d.he_eggs))
      ex.je_eggs = Math.max(ex.je_eggs, num(d.je_eggs))
      ex.te_eggs = Math.max(ex.te_eggs, num(d.te_eggs))
      ex.be_eggs = Math.max(ex.be_eggs, num(d.be_eggs))
      ex.le_eggs = Math.max(ex.le_eggs, num(d.le_eggs))
    }
    return [...map.values()].sort((a, b) => a.record_date.localeCompare(b.record_date))
  }, [dailyAll])

  const { data: stdCurve = [] } = useQuery({
    queryKey: ['mpr_std', selectedFlock?.laying_season],
    queryFn: async () => {
      const { data } = await supabase.from('std_production_curve').select('*').order('week_of_age')
      return data ?? []
    },
    staleTime: 5 * 60_000,
  })

  const stdByWeek = useMemo(() => {
    const season = selectedFlock?.laying_season
    const m = new Map<number, any>()
    for (const s of stdCurve) {
      if (season && s.season && s.season !== season) continue
      m.set(s.week_of_age, s)
    }
    return m
  }, [stdCurve, selectedFlock?.laying_season])

  // Sheds of the flock's laying site, for the bird-status panel.
  const farmForSheds = selectedFlock?.laying_farm_id ?? selectedFlock?.rearing_farm_id ?? null
  const { data: sheds = [] } = useQuery({
    queryKey: ['mpr_sheds', farmForSheds],
    enabled: !!farmForSheds,
    queryFn: async () => {
      const { data } = await supabase.from('sheds')
        .select('id,shed_no,shed_name,shed_type,capacity_female,capacity_male,is_active')
        .eq('farm_id', farmForSheds).order('shed_no')
      return data ?? []
    },
  })

  // Latest per-shed bird counts within the month.
  const shedCounts = useMemo(() => {
    const m = new Map<string, { f: number; mle: number; date: string }>()
    for (const d of dailyAll) {
      if (!d.shed_id) continue
      if (d.record_date < start || d.record_date > end) continue
      if (scope === 'flock' && d.flock_id !== flockId) continue
      const ex = m.get(d.shed_id)
      if (!ex || d.record_date >= ex.date) {
        m.set(d.shed_id, {
          f: num(d.closing_female) || num(d.opening_female),
          mle: num(d.closing_male) || num(d.opening_male),
          date: d.record_date,
        })
      }
    }
    return m
  }, [dailyAll, start, end, scope, flockId])

  const { data: hatch = [] } = useQuery({
    queryKey: ['mpr_hatch', scopeIds.join(','), start, end],
    enabled: scopeIds.length > 0,
    queryFn: () => fetchAllPages<any>((from, to) =>
      supabase.from('hatchability')
        .select('flock_id,age_weeks,setting_date,hatch_date,eggs_set,broken,infertile,chicks_hatched,hatch_pct')
        .in('flock_id', scopeIds)
        .gte('setting_date', start).lte('setting_date', end)
        .order('age_weeks')
        .range(from, to),
      'Hatchability (Monthly Review)', toast.error),
    staleTime: 60_000,
  })

  // Rejection-egg sales: the whole flock life, so the month-wise money table
  // reads like the one in the reference deck.
  const { data: nheSales = [] } = useQuery({
    queryKey: ['mpr_nhe', scopeIds.join(',')],
    enabled: scopeIds.length > 0,
    queryFn: () => fetchAllPages<any>((from, to) =>
      supabase.from('nhe_sales')
        .select('flock_id,sale_date,sale_type,quantity,amount')
        .in('flock_id', scopeIds)
        .order('sale_date')
        .range(from, to),
      'NHE sales (Monthly Review)', toast.error),
    staleTime: 60_000,
  })

  const { data: diesel = [] } = useQuery({
    queryKey: ['mpr_diesel'],
    queryFn: () => fetchAllPages<any>((from, to) =>
      supabase.from('generator_diesel_purchases')
        .select('purchase_date,qty_ltr,amount').order('purchase_date').range(from, to),
      'Diesel purchases', toast.error),
    staleTime: 5 * 60_000,
  })

  const { data: staffDays = [] } = useQuery({
    queryKey: ['mpr_staff', start, end],
    queryFn: () => fetchAllPages<any>((from, to) =>
      supabase.from('attendance_daily')
        .select('attendance_date,status,employees!employee_id(designation)')
        .gte('attendance_date', start).lte('attendance_date', end).range(from, to),
      'Attendance (Monthly Review)', toast.error),
    staleTime: 60_000,
  })

  // ── Derived panels ────────────────────────────────────────────────────────

  const inMonth = (d: any, ym: string) => d.record_date.slice(0, 7) === ym
  const forFlock = (d: any, id: string) => d.flock_id === id

  // Month figures for one flock.
  const flockMonth = (id: string, ym: string) => {
    const rows = dailyByFlockDate.filter(d => forFlock(d, id) && inMonth(d, ym))
    const eggs = rows.reduce((a, d) => a + d.total_eggs, 0)
    const he = rows.reduce((a, d) => a + d.he_eggs, 0)
    const openFSum = rows.reduce((a, d) => a + d.opening_female, 0)
    const mortF = rows.reduce((a, d) => a + d.mortality_female, 0)
    const mortM = rows.reduce((a, d) => a + d.mortality_male, 0)
    const cullF = rows.reduce((a, d) => a + d.cull_female + d.transfer_female + d.trcull_female, 0)
    const feedF = rows.reduce((a, d) => a + d.feed_female_kg, 0)
    const feedM = rows.reduce((a, d) => a + d.feed_male_kg, 0)
    const openBirds = rows.length ? rows[0].opening_female : 0
    return {
      days: rows.length, eggs, he, openFSum, mortF, mortM, cullF, feedF, feedM, openBirds,
      hd: openFSum > 0 ? (eggs / openFSum) * 100 : null,
      hePct: eggs > 0 ? (he / eggs) * 100 : null,
      je: rows.reduce((a, d) => a + d.je_eggs, 0),
      te: rows.reduce((a, d) => a + d.te_eggs, 0),
      be: rows.reduce((a, d) => a + d.be_eggs, 0),
      le: rows.reduce((a, d) => a + d.le_eggs, 0),
    }
  }

  // Cumulative (placement → end of ym) for one flock.
  const flockCum = (id: string, ym: string) => {
    const upto = monthEnd(ym)
    const rows = dailyByFlockDate.filter(d => forFlock(d, id) && d.record_date <= upto)
    const f = flocks.find((x: any) => x.id === id)
    const placedF = num(f?.total_placed_f)
    const mortF = rows.reduce((a, d) => a + d.mortality_female, 0)
    const feedF = rows.reduce((a, d) => a + d.feed_female_kg, 0)
    const eggs = rows.reduce((a, d) => a + d.total_eggs, 0)
    const he = rows.reduce((a, d) => a + d.he_eggs, 0)
    return {
      cumMortPct: placedF > 0 ? (mortF / placedF) * 100 : null,
      cumFeedPerBird: placedF > 0 ? feedF / placedF : null,
      cumHHEggs: placedF > 0 ? eggs / placedF : null,
      cumHHHEggs: placedF > 0 ? he / placedF : null,
      ageWeeks: ageWeeksOn(f?.placement_date, upto),
    }
  }

  // Standard for a flock at the age it reached in a month.
  const stdForMonth = (id: string, ym: string) => {
    const f = flocks.find((x: any) => x.id === id)
    const wk = ageWeeksOn(f?.placement_date, monthEnd(ym))
    if (wk == null) return null
    return stdByWeek.get(wk) ?? null
  }

  // Panel: 3-month comparison for the selected flock.
  const monthWise = useMemo(() => {
    if (!selectedFlock) return []
    return months3.map(ym => {
      const m = flockMonth(selectedFlock.id, ym)
      const c = flockCum(selectedFlock.id, ym)
      const s = stdForMonth(selectedFlock.id, ym)
      const startWk = ageWeeksOn(selectedFlock.placement_date, monthStart(ym))
      const endWk = ageWeeksOn(selectedFlock.placement_date, monthEnd(ym))
      return {
        ym, m, c,
        ageRange: startWk == null || endWk == null ? '—' : `${startWk} to ${endWk}`,
        stdHd: s?.hen_week_pct ?? null,
        stdHe: s?.he_pct ?? null,
        stdCumMort: s?.cum_depletion_pct ?? null,
        stdCumTeHh: s?.cum_te_hh ?? null,
        stdCumHeHh: s?.cum_he_hh ?? null,
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFlock, months3.join(','), dailyByFlockDate, stdByWeek, flocks])

  // Panel: week-wise rejection for the selected flock, within the month.
  const rejectionWeeks = useMemo(() => {
    if (!selectedFlock) return []
    const byWeek = new Map<number, any>()
    for (const d of dailyByFlockDate) {
      if (!forFlock(d, selectedFlock.id)) continue
      if (d.record_date < start || d.record_date > end) continue
      const wk = ageWeeksOn(selectedFlock.placement_date, d.record_date)
      if (wk == null) continue
      const r = byWeek.get(wk) ?? { wk, eggs: 0, je: 0, te: 0, be: 0, le: 0 }
      r.eggs += d.total_eggs; r.je += d.je_eggs; r.te += d.te_eggs
      r.be += d.be_eggs; r.le += d.le_eggs
      byWeek.set(wk, r)
    }
    return [...byWeek.values()].sort((a, b) => a.wk - b.wk)
  }, [selectedFlock, dailyByFlockDate, start, end])

  // Panel: rejection-egg SALES for the month (quantity, amount, avg rate).
  const rejectionSale = useMemo(() => {
    const types: Record<string, string> = { je: 'Jumbo', te: 'Table', be: 'Crack' }
    const acc: Record<string, { qty: number; amt: number }> = {}
    for (const s of nheSales) {
      if (s.sale_date < start || s.sale_date > end) continue
      if (!types[s.sale_type]) continue
      if (scope === 'flock' && s.flock_id !== flockId) continue
      const a = acc[s.sale_type] ?? { qty: 0, amt: 0 }
      a.qty += num(s.quantity); a.amt += num(s.amount)
      acc[s.sale_type] = a
    }
    return Object.entries(types).map(([k, label]) => ({
      label, qty: acc[k]?.qty ?? 0, amt: acc[k]?.amt ?? 0,
      rate: acc[k]?.qty ? acc[k].amt / acc[k].qty : 0,
    }))
  }, [nheSales, start, end, scope, flockId])

  // Panel: month-wise rejection-egg money, flock life to date.
  const rejectionByMonth = useMemo(() => {
    const acc: Record<string, { je: number; te: number; be: number }> = {}
    for (const s of nheSales) {
      if (scope === 'flock' && s.flock_id !== flockId) continue
      if (!['je', 'te', 'be'].includes(s.sale_type)) continue
      const ym = s.sale_date.slice(0, 7)
      const a = acc[ym] ?? { je: 0, te: 0, be: 0 }
      ;(a as any)[s.sale_type] += num(s.amount)
      acc[ym] = a
    }
    return Object.entries(acc).sort(([a], [b]) => a.localeCompare(b))
      .map(([ym, v]) => ({ ym, ...v, total: v.je + v.te + v.be }))
  }, [nheSales, scope, flockId])

  // Panel: hatchability week-wise.
  const hatchRows = useMemo(() => {
    return hatch
      .filter((h: any) => scope !== 'flock' || h.flock_id === flockId)
      .map((h: any) => {
        const set = num(h.eggs_set)
        const chicks = num(h.chicks_hatched)
        const unhatch = set - chicks - num(h.infertile) - num(h.broken)
        const wk = h.age_weeks != null ? Math.round(num(h.age_weeks)) : null
        const std = wk != null ? (stdByWeek.get(wk)?.hatch_pct ?? null) : null
        const act = set > 0 ? (chicks / set) * 100 : null
        return {
          wk, set, unhatch: unhatch > 0 ? unhatch : 0,
          unhatchPct: set > 0 && unhatch > 0 ? (unhatch / set) * 100 : null,
          infPct: set > 0 ? (num(h.infertile) / set) * 100 : null,
          chicks, act, std,
        }
      })
      .sort((a: any, b: any) => (a.wk ?? 0) - (b.wk ?? 0))
  }, [hatch, scope, flockId, stdByWeek])

  // Panel: diesel, month-wise across the FY-to-date.
  const dieselByMonth = useMemo(() => {
    const acc: Record<string, { qty: number; amt: number }> = {}
    for (const d of diesel) {
      const ym = (d.purchase_date ?? '').slice(0, 7)
      if (!ym) continue
      const a = acc[ym] ?? { qty: 0, amt: 0 }
      a.qty += num(d.qty_ltr); a.amt += num(d.amount)
      acc[ym] = a
    }
    return Object.entries(acc).sort(([a], [b]) => a.localeCompare(b))
      .map(([ym, v]) => ({ ym, ...v, avg: v.qty ? v.amt / v.qty : 0 }))
  }, [diesel])

  // Panel: staff working days by designation.
  const staffByDesig = useMemo(() => {
    const acc: Record<string, number> = {}
    const daysInMonth = new Date(Number(month.split('-')[0]), Number(month.split('-')[1]), 0).getDate()
    // attendance_daily.status is one of P (present), A (absent), H (half day),
    // WO (weekly off) or OT. Only days actually worked count: A and WO are not
    // working days, and H is half a day.
    const WORKED: Record<string, number> = { P: 1, OT: 1, H: 0.5 }
    for (const a of staffDays) {
      const weight = WORKED[String(a.status ?? '').toUpperCase()]
      if (!weight) continue
      const emp = (a as any).employees
      const d = (Array.isArray(emp) ? emp[0]?.designation : emp?.designation) ?? 'Unspecified'
      acc[d] = (acc[d] ?? 0) + weight
    }
    return Object.entries(acc).sort(([a], [b]) => a.localeCompare(b))
      .map(([desig, days]) => ({ desig, days, avg: days / daysInMonth }))
  }, [staffDays, month])

  // Panel: all-flocks summary for the month.
  const allFlocksSummary = useMemo(() => {
    return activeFlocks.map((f: any) => {
      const m = flockMonth(f.id, month)
      const c = flockCum(f.id, month)
      return { f, m, c }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFlocks, month, dailyByFlockDate, flocks])

  // ── Chart data (age-week series over the flock's life) ────────────────────
  const weekSeries = useMemo(() => {
    if (!selectedFlock) return []
    const byWeek = new Map<number, { eggs: number; he: number; openF: number; mort: number }>()
    for (const d of dailyByFlockDate) {
      if (!forFlock(d, selectedFlock.id)) continue
      const wk = ageWeeksOn(selectedFlock.placement_date, d.record_date)
      if (wk == null) continue
      const r = byWeek.get(wk) ?? { eggs: 0, he: 0, openF: 0, mort: 0 }
      r.eggs += d.total_eggs; r.he += d.he_eggs
      r.openF += d.opening_female; r.mort += d.mortality_female
      byWeek.set(wk, r)
    }
    const placedF = num(selectedFlock.total_placed_f)
    let cumMort = 0
    return [...byWeek.entries()].sort(([a], [b]) => a - b).map(([wk, r]) => {
      cumMort += r.mort
      const s = stdByWeek.get(wk)
      return {
        wk,
        actHd: r.openF > 0 ? +((r.eggs / r.openF) * 100).toFixed(1) : null,
        stdHd: s?.hen_week_pct ?? null,
        actHe: r.eggs > 0 ? +((r.he / r.eggs) * 100).toFixed(1) : null,
        stdHe: s?.he_pct ?? null,
        actCumMort: placedF > 0 ? +((cumMort / placedF) * 100).toFixed(2) : null,
        stdCumMort: s?.cum_depletion_pct ?? null,
      }
    })
  }, [selectedFlock, dailyByFlockDate, stdByWeek])

  const hatchSeries = useMemo(() =>
    hatchRows.filter((h: any) => h.wk != null).map((h: any) => ({
      wk: h.wk, act: h.act == null ? null : +h.act.toFixed(1), std: h.std,
    })), [hatchRows])

  // ── Print ─────────────────────────────────────────────────────────────────

  const scopeLabel = scope === 'flock'
    ? `Flock ${selectedFlock?.flock_no ?? '—'}`
    : scope === 'all' ? `All Active Flocks (${activeFlocks.length})` : 'Company'

  const notRecorded = [
    'Body weight / B-W gain / Uniformity / CV — not recorded anywhere in the app.',
    'Feed gm/bird vs standard — actual feed is recorded, the breed feed standard is not.',
    'Vaccination due-date vs done-date — only the date administered is recorded.',
    'Selection and the Loss/Profit line — the derivation has not been confirmed, so it is omitted rather than guessed.',
  ]

  const handlePrint = () => {
    const sections: PrintSection[] = []

    if (scope !== 'company' && selectedFlock) {
      sections.push({
        heading: `Birds Status by Shed — ${farmName(selectedFlock) ?? 'Site'}`,
        headers: ['Shed', 'Type', 'Female Capacity', 'Present Birds', 'Utilisation %', 'Male Capacity', 'Present Males', 'Male %'],
        rightAlignFrom: 2,
        rows: shedPanel.rows,
        footerRow: shedPanel.footer,
        emptyNote: 'No shed capacities recorded for this site.',
      })

      sections.push({
        heading: `Flock ${selectedFlock.flock_no} — Month Wise (Actual vs Standard)`,
        headers: ['Particulars', ...months3.map(monthLabel)],
        rightAlignFrom: 1,
        rows: monthWiseRows,
        note: 'Standard is the breed curve at the age the flock reached in that month.',
        emptyNote: 'No daily records for these months.',
      })

      sections.push({
        heading: `Flock ${selectedFlock.flock_no} — Rejection Details (Week Wise)`,
        headers: ['Age Wk', 'Total Eggs', 'Jumbo', '%', 'Table', '%', 'Crack', '%', 'Litter', '%', 'Total %'],
        rightAlignFrom: 1,
        rows: rejectionWeeks.map(r => {
          const p = (v: number) => r.eggs > 0 ? ((v / r.eggs) * 100).toFixed(1) : '—'
          const tot = r.je + r.te + r.be + r.le
          return [r.wk, r.eggs.toLocaleString('en-IN'), r.je, p(r.je), r.te, p(r.te),
            r.be, p(r.be), r.le, p(r.le), r.eggs > 0 ? ((tot / r.eggs) * 100).toFixed(1) : '—']
        }),
        emptyNote: 'No production records in this month.',
      })
    }

    sections.push({
      heading: `Rejection Egg Sale — ${monthLabel(month)}`,
      headers: ['Eggs', 'Sold Eggs', 'Amount', 'Avg Rate'],
      rightAlignFrom: 1,
      rows: rejectionSale.map(r => [r.label, r.qty.toLocaleString('en-IN'), inr(r.amt), inr(r.rate)]),
      footerRow: ['TOTAL',
        rejectionSale.reduce((a, r) => a + r.qty, 0).toLocaleString('en-IN'),
        inr(rejectionSale.reduce((a, r) => a + r.amt, 0)),
        inr(rejectionSale.reduce((a, r) => a + r.qty, 0) > 0
          ? rejectionSale.reduce((a, r) => a + r.amt, 0) / rejectionSale.reduce((a, r) => a + r.qty, 0) : 0)],
      emptyNote: 'No rejection-egg sales recorded in this month.',
    })

    sections.push({
      heading: 'Accounts of Rejection Eggs — Month Wise',
      headers: ['Month', 'Jumbo', 'Table', 'Crack', 'Total Amount'],
      rightAlignFrom: 1,
      rows: rejectionByMonth.map(r => [monthLabel(r.ym), inr(r.je), inr(r.te), inr(r.be), inr(r.total)]),
      footerRow: ['TOTAL',
        inr(rejectionByMonth.reduce((a, r) => a + r.je, 0)),
        inr(rejectionByMonth.reduce((a, r) => a + r.te, 0)),
        inr(rejectionByMonth.reduce((a, r) => a + r.be, 0)),
        inr(rejectionByMonth.reduce((a, r) => a + r.total, 0))],
      emptyNote: 'No rejection-egg sales recorded.',
    })

    if (scope !== 'company') {
      sections.push({
        heading: 'Hatchability — Week Wise',
        headers: ['Age Wk', 'Egg Set', 'Un-Hatch', 'Un-Hatch %', 'Inf. %', 'Hatch Chicks', 'Act. Hatch %', 'Std Hatch %', 'Dev.'],
        rightAlignFrom: 1,
        rows: hatchRows.map((h: any) => [h.wk ?? '—', h.set.toLocaleString('en-IN'),
          h.unhatch.toLocaleString('en-IN'), pct2(h.unhatchPct), pct2(h.infPct),
          h.chicks.toLocaleString('en-IN'), pct1(h.act), h.std == null ? '—' : pct1(h.std),
          dev(h.act, h.std, 2)]),
        emptyNote: 'No hatchability records with a setting date in this month.',
      })
    }

    if (scope !== 'flock') {
      sections.push({
        heading: `All Active Flocks — ${monthLabel(month)}`,
        headers: ['Flock', 'Site', 'Age Wks', 'Opening Birds', 'Eggs', 'HE', 'HD %', 'HE %', 'Mortality', 'Cum Mort %', 'Feed (kg)'],
        rightAlignFrom: 2,
        rows: allFlocksSummary.map(({ f, m, c }) => [
          `F-${f.flock_no}`, farmName(f) ?? '—', c.ageWeeks ?? '—',
          m.openBirds.toLocaleString('en-IN'), m.eggs.toLocaleString('en-IN'),
          m.he.toLocaleString('en-IN'), pct1(m.hd), pct1(m.hePct),
          m.mortF.toLocaleString('en-IN'), pct2(c.cumMortPct),
          m.feedF.toFixed(0),
        ]),
        footerRow: ['TOTAL', '', '',
          allFlocksSummary.reduce((a, x) => a + x.m.openBirds, 0).toLocaleString('en-IN'),
          allFlocksSummary.reduce((a, x) => a + x.m.eggs, 0).toLocaleString('en-IN'),
          allFlocksSummary.reduce((a, x) => a + x.m.he, 0).toLocaleString('en-IN'),
          '', '',
          allFlocksSummary.reduce((a, x) => a + x.m.mortF, 0).toLocaleString('en-IN'),
          '', allFlocksSummary.reduce((a, x) => a + x.m.feedF, 0).toFixed(0)],
        emptyNote: 'No active flocks.',
      })

      sections.push({
        heading: 'Monthly Diesel Purchase',
        headers: ['Month', 'Qty (Ltrs)', 'Amount', 'Avg / Ltr'],
        rightAlignFrom: 1,
        rows: dieselByMonth.map(d => [monthLabel(d.ym), d.qty.toLocaleString('en-IN'), inr(d.amt), inr(d.avg)]),
        footerRow: ['TOTAL',
          dieselByMonth.reduce((a, d) => a + d.qty, 0).toLocaleString('en-IN'),
          inr(dieselByMonth.reduce((a, d) => a + d.amt, 0)),
          inr(dieselByMonth.reduce((a, d) => a + d.qty, 0) > 0
            ? dieselByMonth.reduce((a, d) => a + d.amt, 0) / dieselByMonth.reduce((a, d) => a + d.qty, 0) : 0)],
        emptyNote: 'No diesel purchases recorded.',
      })

      sections.push({
        heading: `Average Staff Working Day Per Day — ${monthLabel(month)}`,
        headers: ['Designation', 'Total Working Days', 'Avg Working Day'],
        rightAlignFrom: 1,
        rows: staffByDesig.map(s => [s.desig, s.days, s.avg.toFixed(1)]),
        footerRow: ['TOTAL',
          staffByDesig.reduce((a, s) => a + s.days, 0),
          staffByDesig.reduce((a, s) => a + s.avg, 0).toFixed(1)],
        emptyNote: 'No attendance recorded for this month.',
      })
    }

    // Charts — pictures of exactly what is on screen.
    if (scope !== 'company') {
      const hd = chartToDataUri(hdChartRef.current)
      if (hd) sections.push({ heading: 'Production — HD % and HE %, Actual vs Standard', headers: [], rows: [], image: hd, pageBreakBefore: true })
      const mo = chartToDataUri(mortChartRef.current)
      if (mo) sections.push({ heading: 'Cumulative Mortality — Actual vs Standard', headers: [], rows: [], image: mo })
      const ha = chartToDataUri(hatchChartRef.current)
      if (ha) sections.push({ heading: 'Hatchability — Actual vs Standard', headers: [], rows: [], image: ha })
    }

    sections.push({
      heading: 'Not Included In This Report',
      headers: ['Item'],
      rows: notRecorded.map(n => [n]),
      note: 'These are absent because the underlying figures are not recorded in the app — they are not zero.',
    })

    printMultiReport({
      title: 'Monthly Production Review',
      subtitle: `${monthLabel(month)} · ${scopeLabel}`,
      sections,
    })
  }

  // ── Shed panel rows (shared by screen and print) ──────────────────────────
  const shedPanel = useMemo(() => {
    const rows = sheds.filter((s: any) => s.is_active !== false).map((s: any) => {
      const c = shedCounts.get(s.id)
      const capF = num(s.capacity_female), capM = num(s.capacity_male)
      const pf = c?.f ?? 0, pm = c?.mle ?? 0
      return [
        s.shed_no, s.shed_type ?? '—',
        capF.toLocaleString('en-IN'), pf ? pf.toLocaleString('en-IN') : '—',
        capF > 0 ? ((pf / capF) * 100).toFixed(2) : '—',
        capM.toLocaleString('en-IN'), pm ? pm.toLocaleString('en-IN') : '—',
        pf > 0 ? ((pm / pf) * 100).toFixed(2) : '—',
      ]
    })
    const capF = sheds.reduce((a: number, s: any) => a + num(s.capacity_female), 0)
    const capM = sheds.reduce((a: number, s: any) => a + num(s.capacity_male), 0)
    const pf = sheds.reduce((a: number, s: any) => a + (shedCounts.get(s.id)?.f ?? 0), 0)
    const pm = sheds.reduce((a: number, s: any) => a + (shedCounts.get(s.id)?.mle ?? 0), 0)
    return {
      rows,
      footer: ['LAYING CAPACITY', '', capF.toLocaleString('en-IN'), pf.toLocaleString('en-IN'),
        capF > 0 ? ((pf / capF) * 100).toFixed(2) : '—', capM.toLocaleString('en-IN'),
        pm.toLocaleString('en-IN'), pf > 0 ? ((pm / pf) * 100).toFixed(2) : '—'],
    }
  }, [sheds, shedCounts])

  // Month-wise table rows, shared by screen and print.
  const monthWiseRows = useMemo(() => {
    if (!monthWise.length) return []
    const r = (label: string, get: (x: any) => string | number) =>
      [label, ...monthWise.map(get)]
    return [
      r('Age in wks', x => x.ageRange),
      r('HD % Act', x => pct1(x.m.hd)),
      r('HD % Std', x => x.stdHd == null ? '—' : pct1(Number(x.stdHd))),
      r('Deviation', x => dev(x.m.hd, x.stdHd == null ? null : Number(x.stdHd))),
      r('HE % Act', x => pct1(x.m.hePct)),
      r('HE % Std', x => x.stdHe == null ? '—' : pct1(Number(x.stdHe))),
      r('Deviation', x => dev(x.m.hePct, x.stdHe == null ? null : Number(x.stdHe))),
      r('Cum. Mortality % Act', x => pct2(x.c.cumMortPct)),
      r('Cum. Mortality % Std', x => x.stdCumMort == null ? '—' : pct2(Number(x.stdCumMort))),
      r('Deviation', x => dev(x.c.cumMortPct, x.stdCumMort == null ? null : Number(x.stdCumMort), 2)),
      r('Total Eggs', x => x.m.eggs.toLocaleString('en-IN')),
      r('HE Eggs', x => x.m.he.toLocaleString('en-IN')),
      r('Mortality (nos)', x => x.m.mortF.toLocaleString('en-IN')),
      r('Feed Female (kg)', x => x.m.feedF.toFixed(0)),
      r('Cum Feed/bird (kg) Act', x => x.c.cumFeedPerBird == null ? '—' : x.c.cumFeedPerBird.toFixed(3)),
      r('Cum. HH Eggs Act', x => x.c.cumHHEggs == null ? '—' : x.c.cumHHEggs.toFixed(2)),
      r('Cum. HH Eggs Std', x => x.stdCumTeHh == null ? '—' : Number(x.stdCumTeHh).toFixed(2)),
      r('Deviation', x => dev(x.c.cumHHEggs, x.stdCumTeHh == null ? null : Number(x.stdCumTeHh), 2)),
      r('Cum. HHH Eggs Act', x => x.c.cumHHHEggs == null ? '—' : x.c.cumHHHEggs.toFixed(2)),
      r('Cum. HHH Eggs Std', x => x.stdCumHeHh == null ? '—' : Number(x.stdCumHeHh).toFixed(2)),
      r('Deviation', x => dev(x.c.cumHHHEggs, x.stdCumHeHh == null ? null : Number(x.stdCumHeHh), 2)),
    ]
  }, [monthWise])

  const loading = flocksLoading || dailyLoading

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">
      <SectionHeader title="Monthly Production Review"
        subtitle="Management review pack — production, rejection, hatchability and site costs"
        action={
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <Select label="" value={scope} onChange={e => setScope(e.target.value as any)}
              options={[
                { value: 'flock', label: 'One Flock' },
                { value: 'all', label: 'All Active Flocks' },
                { value: 'company', label: 'Company (Month Wise)' },
              ]} />
            {scope === 'flock' && (
              <SearchableSelect className="w-44" value={flockId} onChange={v => setFlockId(v)}
                options={flocks.map((f: any) => ({
                  value: f.id, label: `F-${f.flock_no}${f.status === 'closed' ? ' (closed)' : ''}`,
                }))} />
            )}
            <input type="month" value={month} onChange={e => setMonth(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500" />
            <Button size="sm" variant="outline" onClick={handlePrint}>
              <Printer size={14} className="mr-1" />Print Review
            </Button>
          </div>
        } />

      {loading ? <Spinner /> : (
        <>
          {scope !== 'company' && selectedFlock && (
            <>
              <Card>
                <p className="text-sm font-semibold text-gray-800 mb-2">
                  Birds Status by Shed — {farmName(selectedFlock) ?? 'Site'}
                </p>
                <div className="overflow-x-auto">
                  <Table>
                    <thead><tr>
                      <Th>Shed</Th><Th>Type</Th><Th right>Female Capacity</Th><Th right>Present Birds</Th>
                      <Th right>Utilisation %</Th><Th right>Male Capacity</Th><Th right>Present Males</Th><Th right>Male %</Th>
                    </tr></thead>
                    <tbody>
                      {shedPanel.rows.map((r, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          {r.map((c, j) => <Td key={j} right={j >= 2} className="text-sm">{c}</Td>)}
                        </tr>
                      ))}
                      <tr className="bg-gray-50 font-semibold">
                        {shedPanel.footer.map((c, j) => <Td key={j} right={j >= 2} className="text-sm">{c}</Td>)}
                      </tr>
                    </tbody>
                  </Table>
                </div>
              </Card>

              <Card>
                <p className="text-sm font-semibold text-gray-800 mb-2">
                  Flock {selectedFlock.flock_no} — Month Wise (Actual vs Standard)
                </p>
                <div className="overflow-x-auto">
                  <Table>
                    <thead><tr>
                      <Th>Particulars</Th>{months3.map(m => <Th key={m} right>{monthLabel(m)}</Th>)}
                    </tr></thead>
                    <tbody>
                      {monthWiseRows.map((r, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          {r.map((c, j) => (
                            <Td key={j} right={j > 0}
                              className={`text-sm ${String(r[0]).startsWith('Deviation') ? 'font-medium text-blue-700' : ''}`}>{c}</Td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Standard is the breed curve at the age the flock reached in that month.
                  A dash means no standard is loaded for that age.
                </p>
              </Card>

              <Card>
                <p className="text-sm font-semibold text-gray-800 mb-3">
                  Production — HD % and HE %, Actual vs Standard
                </p>
                <div ref={hdChartRef}>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={weekSeries} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="wk" tick={{ fontSize: 11 }} label={{ value: 'Age in weeks', position: 'insideBottom', offset: -2, fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} domain={[0, 120]} />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="stdHd" name="STD HD%" stroke="#3b82f6" dot={false} strokeDasharray="4 3" />
                      <Line type="monotone" dataKey="actHd" name="ACT HD%" stroke="#ef4444" dot={false} />
                      <Line type="monotone" dataKey="stdHe" name="STD HE%" stroke="#16a34a" dot={false} strokeDasharray="4 3" />
                      <Line type="monotone" dataKey="actHe" name="ACT HE%" stroke="#7c3aed" dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card>
                <p className="text-sm font-semibold text-gray-800 mb-3">
                  Cumulative Mortality — Actual vs Standard
                </p>
                <div ref={mortChartRef}>
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={weekSeries} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="wk" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="stdCumMort" name="CUM STD %" stroke="#93c5fd" dot={false} strokeDasharray="4 3" />
                      <Line type="monotone" dataKey="actCumMort" name="CUM ACT %" stroke="#1d4ed8" dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card>
                <p className="text-sm font-semibold text-gray-800 mb-2">
                  Flock {selectedFlock.flock_no} — Rejection Details (Week Wise)
                </p>
                <div className="overflow-x-auto">
                  <Table>
                    <thead><tr>
                      <Th>Age Wk</Th><Th right>Total Eggs</Th><Th right>Jumbo</Th><Th right>%</Th>
                      <Th right>Table</Th><Th right>%</Th><Th right>Crack</Th><Th right>%</Th>
                      <Th right>Litter</Th><Th right>%</Th><Th right>Total %</Th>
                    </tr></thead>
                    <tbody>
                      {rejectionWeeks.length === 0 ? (
                        <tr><Td colSpan={11} className="text-sm text-gray-500">No production records in this month.</Td></tr>
                      ) : rejectionWeeks.map(r => {
                        const p = (v: number) => r.eggs > 0 ? ((v / r.eggs) * 100).toFixed(1) : '—'
                        const tot = r.je + r.te + r.be + r.le
                        return (
                          <tr key={r.wk} className="hover:bg-gray-50">
                            <Td className="text-sm">{r.wk}</Td>
                            <Td right className="text-sm">{r.eggs.toLocaleString('en-IN')}</Td>
                            <Td right className="text-sm">{r.je}</Td><Td right className="text-sm">{p(r.je)}</Td>
                            <Td right className="text-sm">{r.te}</Td><Td right className="text-sm">{p(r.te)}</Td>
                            <Td right className="text-sm">{r.be}</Td><Td right className="text-sm">{p(r.be)}</Td>
                            <Td right className="text-sm">{r.le}</Td><Td right className="text-sm">{p(r.le)}</Td>
                            <Td right className="text-sm font-semibold text-red-600">
                              {r.eggs > 0 ? ((tot / r.eggs) * 100).toFixed(1) : '—'}
                            </Td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </Table>
                </div>
              </Card>

              <Card>
                <p className="text-sm font-semibold text-gray-800 mb-2">Hatchability — Week Wise</p>
                <div className="overflow-x-auto">
                  <Table>
                    <thead><tr>
                      <Th>Age Wk</Th><Th right>Egg Set</Th><Th right>Un-Hatch</Th><Th right>Un-Hatch %</Th>
                      <Th right>Inf. %</Th><Th right>Hatch Chicks</Th><Th right>Act. Hatch %</Th>
                      <Th right>Std Hatch %</Th><Th right>Dev.</Th>
                    </tr></thead>
                    <tbody>
                      {hatchRows.length === 0 ? (
                        <tr><Td colSpan={9} className="text-sm text-gray-500">No hatchability records with a setting date in this month.</Td></tr>
                      ) : hatchRows.map((h: any, i: number) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <Td className="text-sm">{h.wk ?? '—'}</Td>
                          <Td right className="text-sm">{h.set.toLocaleString('en-IN')}</Td>
                          <Td right className="text-sm">{h.unhatch.toLocaleString('en-IN')}</Td>
                          <Td right className="text-sm">{pct2(h.unhatchPct)}</Td>
                          <Td right className="text-sm">{pct2(h.infPct)}</Td>
                          <Td right className="text-sm">{h.chicks.toLocaleString('en-IN')}</Td>
                          <Td right className="text-sm font-medium">{pct1(h.act)}</Td>
                          <Td right className="text-sm">{h.std == null ? '—' : pct1(Number(h.std))}</Td>
                          <Td right className="text-sm text-blue-700">{dev(h.act, h.std == null ? null : Number(h.std), 2)}</Td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </Card>

              {hatchSeries.length > 0 && (
                <Card>
                  <p className="text-sm font-semibold text-gray-800 mb-3">Hatchability — Actual vs Standard</p>
                  <div ref={hatchChartRef}>
                    <ResponsiveContainer width="100%" height={280}>
                      <LineChart data={hatchSeries} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="wk" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="act" name="Hatch % Act" stroke="#1d4ed8" />
                        <Line type="monotone" dataKey="std" name="Hatch % Std" stroke="#f59e0b" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              )}
            </>
          )}

          <Card>
            <p className="text-sm font-semibold text-gray-800 mb-2">
              Rejection Egg Sale — {monthLabel(month)}
            </p>
            <Table>
              <thead><tr><Th>Eggs</Th><Th right>Sold Eggs</Th><Th right>Amount</Th><Th right>Avg Rate</Th></tr></thead>
              <tbody>
                {rejectionSale.map(r => (
                  <tr key={r.label} className="hover:bg-gray-50">
                    <Td className="text-sm">{r.label}</Td>
                    <Td right className="text-sm">{r.qty.toLocaleString('en-IN')}</Td>
                    <Td right className="text-sm">{inr(r.amt)}</Td>
                    <Td right className="text-sm">{inr(r.rate)}</Td>
                  </tr>
                ))}
                <tr className="bg-gray-50 font-semibold">
                  <Td className="text-sm">TOTAL</Td>
                  <Td right className="text-sm">{rejectionSale.reduce((a, r) => a + r.qty, 0).toLocaleString('en-IN')}</Td>
                  <Td right className="text-sm">{inr(rejectionSale.reduce((a, r) => a + r.amt, 0))}</Td>
                  <Td right className="text-sm">
                    {inr(rejectionSale.reduce((a, r) => a + r.qty, 0) > 0
                      ? rejectionSale.reduce((a, r) => a + r.amt, 0) / rejectionSale.reduce((a, r) => a + r.qty, 0) : 0)}
                  </Td>
                </tr>
              </tbody>
            </Table>
          </Card>

          <Card>
            <p className="text-sm font-semibold text-gray-800 mb-2">Accounts of Rejection Eggs — Month Wise</p>
            <div className="overflow-x-auto">
              <Table>
                <thead><tr><Th>Month</Th><Th right>Jumbo</Th><Th right>Table</Th><Th right>Crack</Th><Th right>Total Amount</Th></tr></thead>
                <tbody>
                  {rejectionByMonth.length === 0 ? (
                    <tr><Td colSpan={5} className="text-sm text-gray-500">No rejection-egg sales recorded.</Td></tr>
                  ) : rejectionByMonth.map(r => (
                    <tr key={r.ym} className="hover:bg-gray-50">
                      <Td className="text-sm">{monthLabel(r.ym)}</Td>
                      <Td right className="text-sm">{inr(r.je)}</Td>
                      <Td right className="text-sm">{inr(r.te)}</Td>
                      <Td right className="text-sm">{inr(r.be)}</Td>
                      <Td right className="text-sm font-semibold">{inr(r.total)}</Td>
                    </tr>
                  ))}
                  {rejectionByMonth.length > 0 && (
                    <tr className="bg-gray-50 font-semibold">
                      <Td className="text-sm">TOTAL</Td>
                      <Td right className="text-sm">{inr(rejectionByMonth.reduce((a, r) => a + r.je, 0))}</Td>
                      <Td right className="text-sm">{inr(rejectionByMonth.reduce((a, r) => a + r.te, 0))}</Td>
                      <Td right className="text-sm">{inr(rejectionByMonth.reduce((a, r) => a + r.be, 0))}</Td>
                      <Td right className="text-sm">{inr(rejectionByMonth.reduce((a, r) => a + r.total, 0))}</Td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>
          </Card>

          {scope !== 'flock' && (
            <>
              <Card>
                <p className="text-sm font-semibold text-gray-800 mb-2">
                  All Active Flocks — {monthLabel(month)}
                </p>
                <div className="overflow-x-auto">
                  <Table>
                    <thead><tr>
                      <Th>Flock</Th><Th>Site</Th><Th right>Age Wks</Th><Th right>Opening Birds</Th>
                      <Th right>Eggs</Th><Th right>HE</Th><Th right>HD %</Th><Th right>HE %</Th>
                      <Th right>Mortality</Th><Th right>Cum Mort %</Th><Th right>Feed (kg)</Th>
                    </tr></thead>
                    <tbody>
                      {allFlocksSummary.map(({ f, m, c }) => (
                        <tr key={f.id} className="hover:bg-gray-50">
                          <Td className="text-sm font-medium">F-{f.flock_no}</Td>
                          <Td className="text-sm">{farmName(f) ?? '—'}</Td>
                          <Td right className="text-sm">{c.ageWeeks ?? '—'}</Td>
                          <Td right className="text-sm">{m.openBirds.toLocaleString('en-IN')}</Td>
                          <Td right className="text-sm">{m.eggs.toLocaleString('en-IN')}</Td>
                          <Td right className="text-sm">{m.he.toLocaleString('en-IN')}</Td>
                          <Td right className="text-sm">{pct1(m.hd)}</Td>
                          <Td right className="text-sm">{pct1(m.hePct)}</Td>
                          <Td right className="text-sm">{m.mortF.toLocaleString('en-IN')}</Td>
                          <Td right className="text-sm">{pct2(c.cumMortPct)}</Td>
                          <Td right className="text-sm">{m.feedF.toFixed(0)}</Td>
                        </tr>
                      ))}
                      <tr className="bg-gray-50 font-semibold">
                        <Td className="text-sm">TOTAL</Td><Td /><Td />
                        <Td right className="text-sm">{allFlocksSummary.reduce((a, x) => a + x.m.openBirds, 0).toLocaleString('en-IN')}</Td>
                        <Td right className="text-sm">{allFlocksSummary.reduce((a, x) => a + x.m.eggs, 0).toLocaleString('en-IN')}</Td>
                        <Td right className="text-sm">{allFlocksSummary.reduce((a, x) => a + x.m.he, 0).toLocaleString('en-IN')}</Td>
                        <Td /><Td />
                        <Td right className="text-sm">{allFlocksSummary.reduce((a, x) => a + x.m.mortF, 0).toLocaleString('en-IN')}</Td>
                        <Td />
                        <Td right className="text-sm">{allFlocksSummary.reduce((a, x) => a + x.m.feedF, 0).toFixed(0)}</Td>
                      </tr>
                    </tbody>
                  </Table>
                </div>
              </Card>

              <Card>
                <p className="text-sm font-semibold text-gray-800 mb-2">Monthly Diesel Purchase</p>
                <Table>
                  <thead><tr><Th>Month</Th><Th right>Qty (Ltrs)</Th><Th right>Amount</Th><Th right>Avg / Ltr</Th></tr></thead>
                  <tbody>
                    {dieselByMonth.length === 0 ? (
                      <tr><Td colSpan={4} className="text-sm text-gray-500">No diesel purchases recorded.</Td></tr>
                    ) : dieselByMonth.map(d => (
                      <tr key={d.ym} className="hover:bg-gray-50">
                        <Td className="text-sm">{monthLabel(d.ym)}</Td>
                        <Td right className="text-sm">{d.qty.toLocaleString('en-IN')}</Td>
                        <Td right className="text-sm">{inr(d.amt)}</Td>
                        <Td right className="text-sm">{inr(d.avg)}</Td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card>

              <Card>
                <p className="text-sm font-semibold text-gray-800 mb-2">
                  Average Staff Working Day Per Day — {monthLabel(month)}
                </p>
                <Table>
                  <thead><tr><Th>Designation</Th><Th right>Total Working Days</Th><Th right>Avg Working Day</Th></tr></thead>
                  <tbody>
                    {staffByDesig.length === 0 ? (
                      <tr><Td colSpan={3} className="text-sm text-gray-500">No attendance recorded for this month.</Td></tr>
                    ) : staffByDesig.map(s => (
                      <tr key={s.desig} className="hover:bg-gray-50">
                        <Td className="text-sm">{s.desig}</Td>
                        <Td right className="text-sm">{s.days}</Td>
                        <Td right className="text-sm">{s.avg.toFixed(1)}</Td>
                      </tr>
                    ))}
                    {staffByDesig.length > 0 && (
                      <tr className="bg-gray-50 font-semibold">
                        <Td className="text-sm">TOTAL</Td>
                        <Td right className="text-sm">{staffByDesig.reduce((a, s) => a + s.days, 0)}</Td>
                        <Td right className="text-sm">{staffByDesig.reduce((a, s) => a + s.avg, 0).toFixed(1)}</Td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </Card>
            </>
          )}

          <Card className="bg-amber-50 border-amber-200">
            <p className="text-sm font-semibold text-amber-900 mb-2">Not included in this report</p>
            <ul className="text-xs text-amber-800 space-y-1 list-disc pl-5">
              {notRecorded.map((n, i) => <li key={i}>{n}</li>)}
            </ul>
            <p className="text-xs text-amber-700 mt-2">
              These panels are absent because the underlying figures are not recorded in the app —
              they are <strong>not</strong> zero. Tell me the missing pieces and they can be added.
            </p>
          </Card>
        </>
      )}
    </div>
  )
}

export default MonthlyProductionReview
