import React, { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { today, fyRange, FY_OPTIONS } from '@/lib/utils'
import {
  Card, Select, SectionHeader, Spinner, Table, Th, Td, Badge, SearchableSelect
} from '@/components/ui'
import { Download } from 'lucide-react'
import * as XLSX from 'xlsx'

const fmt = (n: number) => n === 0 ? '—' : n.toLocaleString('en-IN')
const fmtN = (n: number) => n.toLocaleString('en-IN')

export const EggStockPage: React.FC = () => {
  const [toDate, setToDate] = useState(today())
  const [fromDate, setFromDate] = useState('')
  const [fy, setFy] = useState('')
  const [flockFilter, setFlockFilter] = useState('')

  const applyFy = (v: string) => {
    setFy(v)
    if (v) { const r = fyRange(v); setFromDate(r.start); setToDate(r.end) }
  }

  // Flocks
  const { data: flocks, isLoading: flocksLoading } = useQuery({
    queryKey: ['egg_stock_flocks'],
    queryFn: async () => {
      // Closed flocks are included — a flock closed while still holding
      // unsold eggs used to vanish from the register entirely, breaking the
      // opening + received − sold − wastage reconciliation at farm level.
      const { data } = await supabase
        .from('flocks')
        .select('id, flock_no, status, farms!laying_farm_id(name)')
        .order('flock_no')
      return data ?? []
    }
  })

  // Daily records: production + wastage (all dates up to toDate)
  const { data: dailyRecs } = useQuery({
    queryKey: ['egg_stock_daily', toDate],
    queryFn: async () => {
      const { data } = await supabase
        .from('daily_records')
        .select('flock_id, record_date, he_grade_a, he_grade_b, he_grade_c, je_eggs, te_eggs, be_eggs, le_eggs, wastage_he, wastage_je, wastage_te, wastage_be')
        .lte('record_date', toDate)
      return data ?? []
    },
    enabled: !!toDate
  })

  // HE dispatched (sales) — use lines for accurate per-grade data, join dispatch for date+flock
  const { data: heDisp } = useQuery({
    queryKey: ['egg_stock_he_disp', toDate],
    queryFn: async () => {
      const { data } = await supabase
        .from('he_dispatch_lines')
        .select('flock_id, grade_a, grade_b, grade_c, he_dispatch!inner(flock_id, dispatch_date)')
        .lte('he_dispatch.dispatch_date', toDate)
      // Flatten: use line's flock_id (same as dispatch's), dispatch_date from parent
      return (data ?? []).map((l: any) => ({
        flock_id: l.flock_id,
        dispatch_date: l.he_dispatch?.dispatch_date,
        grade_a: l.grade_a ?? 0,
        grade_b: l.grade_b ?? 0,
        grade_c: l.grade_c ?? 0,
      })).filter((l: any) => l.dispatch_date && l.dispatch_date <= toDate)
    },
    enabled: !!toDate
  })

  // NHE sold — use nhe_sale_lines for per-type quantities on multi-line sales
  const { data: nheSales } = useQuery({
    queryKey: ['egg_stock_nhe_sales', toDate],
    queryFn: async () => {
      const { data } = await supabase
        .from('nhe_sales')
        .select('id, flock_id, sale_date, sale_type, quantity, nhe_sale_lines(sale_type, quantity)')
        .lte('sale_date', toDate)
      const rows: { flock_id: string; sale_date: string; sale_type: string; quantity: number }[] = []
      for (const s of (data ?? [])) {
        const lines: any[] = (s as any).nhe_sale_lines ?? []
        if (lines.length > 0) {
          for (const l of lines) {
            rows.push({ flock_id: s.flock_id, sale_date: s.sale_date, sale_type: l.sale_type, quantity: l.quantity ?? 0 })
          }
        } else {
          rows.push({ flock_id: s.flock_id, sale_date: s.sale_date, sale_type: s.sale_type, quantity: s.quantity ?? 0 })
        }
      }
      return rows
    },
    enabled: !!toDate
  })

  // Opening stock
  const { data: openingStock } = useQuery({
    queryKey: ['egg_stock_opening'],
    queryFn: async () => {
      const { data } = await supabase
        .from('egg_opening_stock')
        .select('flock_id, he_grade_a, he_grade_b, he_grade_c, nhe_je, nhe_te, nhe_be')
      return data ?? []
    }
  })

  const isLoading = flocksLoading

  // Compute per-flock stock
  const stockRows = useMemo(() => {
    if (!flocks) return []

    const fd = fromDate || null

    // Helper: is a date within [fromDate, toDate] (for period received/sales)
    const inPeriod = (d: string) => (!fd || d >= fd) && d <= toDate
    // Helper: is a date before fromDate (for opening carryover)
    const beforePeriod = (d: string) => fd ? d < fd : false

    // Opening stock (always included as base)
    const openA: Record<string, number> = {}
    const openB: Record<string, number> = {}
    const openC: Record<string, number> = {}
    const openJE: Record<string, number> = {}
    const openTE: Record<string, number> = {}
    const openBE: Record<string, number> = {}
    for (const o of (openingStock ?? [])) {
      openA[o.flock_id] = (openA[o.flock_id] ?? 0) + (o.he_grade_a ?? 0)
      openB[o.flock_id] = (openB[o.flock_id] ?? 0) + (o.he_grade_b ?? 0)
      openC[o.flock_id] = (openC[o.flock_id] ?? 0) + (o.he_grade_c ?? 0)
      openJE[o.flock_id] = (openJE[o.flock_id] ?? 0) + (o.nhe_je ?? 0)
      openTE[o.flock_id] = (openTE[o.flock_id] ?? 0) + (o.nhe_te ?? 0)
      openBE[o.flock_id] = (openBE[o.flock_id] ?? 0) + (o.nhe_be ?? 0)
    }

    // Accumulate daily records: split into "before period" (adds to opening) and "in period" (received + wastage)
    const carryA: Record<string, number> = {}
    const carryB: Record<string, number> = {}
    const carryC: Record<string, number> = {}
    const carryJE: Record<string, number> = {}
    const carryTE: Record<string, number> = {}
    const carryBE: Record<string, number> = {}
    const carryWHE: Record<string, number> = {}
    const carryWJE: Record<string, number> = {}
    const carryWTE: Record<string, number> = {}
    const carryWBE: Record<string, number> = {}

    const rcvA: Record<string, number> = {}
    const rcvB: Record<string, number> = {}
    const rcvC: Record<string, number> = {}
    const rcvJE: Record<string, number> = {}
    const rcvTE: Record<string, number> = {}
    const rcvBE: Record<string, number> = {}
    const rcvLE: Record<string, number> = {}
    const wstHE: Record<string, number> = {}
    const wstJE: Record<string, number> = {}
    const wstTE: Record<string, number> = {}
    const wstBE: Record<string, number> = {}

    for (const r of (dailyRecs ?? [])) {
      const fid = r.flock_id
      const d = r.record_date
      if (fd && beforePeriod(d)) {
        // Accumulate into opening carryover
        carryA[fid] = (carryA[fid] ?? 0) + (r.he_grade_a ?? 0)
        carryB[fid] = (carryB[fid] ?? 0) + (r.he_grade_b ?? 0)
        carryC[fid] = (carryC[fid] ?? 0) + (r.he_grade_c ?? 0)
        carryJE[fid] = (carryJE[fid] ?? 0) + (r.je_eggs ?? 0)
        carryTE[fid] = (carryTE[fid] ?? 0) + (r.te_eggs ?? 0)
        carryBE[fid] = (carryBE[fid] ?? 0) + (r.be_eggs ?? 0)
        carryWHE[fid] = (carryWHE[fid] ?? 0) + (r.wastage_he ?? 0)
        carryWJE[fid] = (carryWJE[fid] ?? 0) + (r.wastage_je ?? 0)
        carryWTE[fid] = (carryWTE[fid] ?? 0) + (r.wastage_te ?? 0)
        carryWBE[fid] = (carryWBE[fid] ?? 0) + (r.wastage_be ?? 0)
      } else if (inPeriod(d)) {
        rcvA[fid] = (rcvA[fid] ?? 0) + (r.he_grade_a ?? 0)
        rcvB[fid] = (rcvB[fid] ?? 0) + (r.he_grade_b ?? 0)
        rcvC[fid] = (rcvC[fid] ?? 0) + (r.he_grade_c ?? 0)
        rcvJE[fid] = (rcvJE[fid] ?? 0) + (r.je_eggs ?? 0)
        rcvTE[fid] = (rcvTE[fid] ?? 0) + (r.te_eggs ?? 0)
        rcvBE[fid] = (rcvBE[fid] ?? 0) + (r.be_eggs ?? 0)
        rcvLE[fid] = (rcvLE[fid] ?? 0) + (r.le_eggs ?? 0)
        wstHE[fid] = (wstHE[fid] ?? 0) + (r.wastage_he ?? 0)
        wstJE[fid] = (wstJE[fid] ?? 0) + (r.wastage_je ?? 0)
        wstTE[fid] = (wstTE[fid] ?? 0) + (r.wastage_te ?? 0)
        wstBE[fid] = (wstBE[fid] ?? 0) + (r.wastage_be ?? 0)
      }
    }

    // HE dispatched — split into carry (before period) vs period
    const carryDispA: Record<string, number> = {}
    const carryDispB: Record<string, number> = {}
    const carryDispC: Record<string, number> = {}
    const salesA: Record<string, number> = {}
    const salesB: Record<string, number> = {}
    const salesC: Record<string, number> = {}
    for (const d of (heDisp ?? [])) {
      const fid = d.flock_id
      if (fd && beforePeriod(d.dispatch_date)) {
        carryDispA[fid] = (carryDispA[fid] ?? 0) + (d.grade_a ?? 0)
        carryDispB[fid] = (carryDispB[fid] ?? 0) + (d.grade_b ?? 0)
        carryDispC[fid] = (carryDispC[fid] ?? 0) + (d.grade_c ?? 0)
      } else if (inPeriod(d.dispatch_date)) {
        salesA[fid] = (salesA[fid] ?? 0) + (d.grade_a ?? 0)
        salesB[fid] = (salesB[fid] ?? 0) + (d.grade_b ?? 0)
        salesC[fid] = (salesC[fid] ?? 0) + (d.grade_c ?? 0)
      }
    }

    // NHE sold — split carry vs period
    const carryJESold: Record<string, number> = {}
    const carryTESold: Record<string, number> = {}
    const carryBESold: Record<string, number> = {}
    const salesJE: Record<string, number> = {}
    const salesTE: Record<string, number> = {}
    const salesBE: Record<string, number> = {}
    for (const s of (nheSales ?? [])) {
      const fid = s.flock_id
      const st = s.sale_type
      const isJE = st === 'je' || st === 'je_eggs'
      const isTE = st === 'te' || st === 'te_eggs'
      const isBE = st === 'be' || st === 'be_eggs'
      if (!isJE && !isTE && !isBE) continue
      if (fd && beforePeriod(s.sale_date)) {
        if (isJE) carryJESold[fid] = (carryJESold[fid] ?? 0) + s.quantity
        else if (isTE) carryTESold[fid] = (carryTESold[fid] ?? 0) + s.quantity
        else if (isBE) carryBESold[fid] = (carryBESold[fid] ?? 0) + s.quantity
      } else if (inPeriod(s.sale_date)) {
        if (isJE) salesJE[fid] = (salesJE[fid] ?? 0) + s.quantity
        else if (isTE) salesTE[fid] = (salesTE[fid] ?? 0) + s.quantity
        else if (isBE) salesBE[fid] = (salesBE[fid] ?? 0) + s.quantity
      }
    }

    return (flocks as any[])
      .filter((f: any) => !flockFilter || f.id === flockFilter)
      .map((f: any) => {
        const id = f.id

        // Opening = opening_stock + carry (before period)
        const opA = (openA[id] ?? 0) + (carryA[id] ?? 0) - (carryWHE[id] ?? 0) - (carryDispA[id] ?? 0)
        const opB = (openB[id] ?? 0) + (carryB[id] ?? 0) - (carryDispB[id] ?? 0)
        const opC = (openC[id] ?? 0) + (carryC[id] ?? 0) - (carryDispC[id] ?? 0)
        const opJE = (openJE[id] ?? 0) + (carryJE[id] ?? 0) - (carryWJE[id] ?? 0) - (carryJESold[id] ?? 0)
        const opTE = (openTE[id] ?? 0) + (carryTE[id] ?? 0) - (carryWTE[id] ?? 0) - (carryTESold[id] ?? 0)
        const opBE = (openBE[id] ?? 0) + (carryBE[id] ?? 0) - (carryWBE[id] ?? 0) - (carryBESold[id] ?? 0)

        // Period received
        const recA = rcvA[id] ?? 0
        const recB = rcvB[id] ?? 0
        const recC = rcvC[id] ?? 0
        const recJE = rcvJE[id] ?? 0
        const recTE = rcvTE[id] ?? 0
        const recBE = rcvBE[id] ?? 0
        const recLE = rcvLE[id] ?? 0

        // Period wastage
        const wsHE = wstHE[id] ?? 0
        const wsJE = wstJE[id] ?? 0
        const wsTE = wstTE[id] ?? 0
        const wsBE = wstBE[id] ?? 0

        // Period sales
        const slA = salesA[id] ?? 0
        const slB = salesB[id] ?? 0
        const slC = salesC[id] ?? 0
        const slJE = salesJE[id] ?? 0
        const slTE = salesTE[id] ?? 0
        const slBE = salesBE[id] ?? 0

        // Closing
        const clA = opA + recA - wsHE - slA
        const clB = opB + recB - slB
        const clC = opC + recC - slC
        const clJE = opJE + recJE - wsJE - slJE
        const clTE = opTE + recTE - wsTE - slTE
        const clBE = opBE + recBE - wsBE - slBE

        const totalOpenHE = opA + opB + opC
        const totalOpenNHE = opJE + opTE + opBE
        const totalRecHE = recA + recB + recC
        const totalRecNHE = recJE + recTE + recBE
        const totalWst = wsHE + wsJE + wsTE + wsBE
        const totalSlHE = slA + slB + slC
        const totalSlNHE = slJE + slTE + slBE
        const totalClHE = clA + clB + clC
        const totalClNHE = clJE + clTE + clBE

        const hasNegative = clA < 0 || clB < 0 || clC < 0 || clJE < 0 || clTE < 0 || clBE < 0

        return {
          id,
          flockNo: f.flock_no,
          farm: (f.farms as any)?.name ?? '—',
          // Opening
          opA, opB, opC, totalOpenHE,
          opJE, opTE, opBE, totalOpenNHE,
          // Received
          recA, recB, recC, totalRecHE,
          recJE, recTE, recBE, recLE, totalRecNHE,
          // Wastage
          wsHE, wsJE, wsTE, wsBE, totalWst,
          // Sales
          slA, slB, slC, totalSlHE,
          slJE, slTE, slBE, totalSlNHE,
          // Closing
          clA, clB, clC, totalClHE,
          clJE, clTE, clBE, totalClNHE,
          hasNegative,
        }
      })
  }, [flocks, flockFilter, dailyRecs, heDisp, nheSales, openingStock, fromDate, toDate])

  const flockOptions = (flocks ?? []).map((f: any) => ({ value: f.id, label: `Flock ${f.flock_no}${f.status === 'closed' ? ' (closed)' : ''}` }))

  // Day-wise view when a single flock is selected
  const dayRows = useMemo(() => {
    if (!flockFilter || !dailyRecs) return []
    const fd = fromDate || null
    const inPeriod = (d: string) => (!fd || d >= fd) && d <= toDate

    // Opening stock for this flock
    const op = (openingStock ?? []).find((o: any) => o.flock_id === flockFilter)
    let balA = op?.he_grade_a ?? 0, balB = op?.he_grade_b ?? 0, balC = op?.he_grade_c ?? 0
    let balJE = op?.nhe_je ?? 0, balTE = op?.nhe_te ?? 0, balBE = op?.nhe_be ?? 0

    // Carry forward everything before fromDate into opening — wastage
    // wasn't subtracted here either, so the opening balance itself was
    // overstated whenever any wastage was recorded before the filter date.
    for (const r of (dailyRecs ?? []).filter((r: any) => r.flock_id === flockFilter)) {
      if (fd && r.record_date < fd) {
        balA += (r.he_grade_a ?? 0) - (r.wastage_he ?? 0); balB += r.he_grade_b ?? 0; balC += r.he_grade_c ?? 0
        balJE += (r.je_eggs ?? 0) - (r.wastage_je ?? 0); balTE += (r.te_eggs ?? 0) - (r.wastage_te ?? 0); balBE += (r.be_eggs ?? 0) - (r.wastage_be ?? 0)
      }
    }
    for (const d of (heDisp ?? []).filter((d: any) => d.flock_id === flockFilter)) {
      if (fd && d.dispatch_date < fd) {
        balA -= d.grade_a ?? 0; balB -= d.grade_b ?? 0; balC -= d.grade_c ?? 0
      }
    }
    for (const s of (nheSales ?? []).filter((s: any) => s.flock_id === flockFilter)) {
      if (fd && s.sale_date < fd) {
        const isJE = s.sale_type === 'je' || s.sale_type === 'je_eggs'
        const isTE = s.sale_type === 'te' || s.sale_type === 'te_eggs'
        const isBE = s.sale_type === 'be' || s.sale_type === 'be_eggs'
        if (isJE) balJE -= s.quantity; else if (isTE) balTE -= s.quantity; else if (isBE) balBE -= s.quantity
      }
    }

    // Collect all dates in period that have any activity
    const dateSet = new Set<string>()
    ;(dailyRecs ?? []).filter((r: any) => r.flock_id === flockFilter && inPeriod(r.record_date)).forEach((r: any) => dateSet.add(r.record_date))
    ;(heDisp ?? []).filter((d: any) => d.flock_id === flockFilter && inPeriod(d.dispatch_date)).forEach((d: any) => dateSet.add(d.dispatch_date))
    ;(nheSales ?? []).filter((s: any) => s.flock_id === flockFilter && inPeriod(s.sale_date)).forEach((s: any) => dateSet.add(s.sale_date))
    const dates = [...dateSet].sort()

    return dates.map(date => {
      // Opening for this day = current running balance
      const opA = balA, opB = balB, opC = balC, opJE = balJE, opTE = balTE, opBE = balBE

      // Production
      const dayProd = (dailyRecs ?? []).filter((r: any) => r.flock_id === flockFilter && r.record_date === date)
      const pA = dayProd.reduce((s: number, r: any) => s + (r.he_grade_a ?? 0), 0)
      const pB = dayProd.reduce((s: number, r: any) => s + (r.he_grade_b ?? 0), 0)
      const pC = dayProd.reduce((s: number, r: any) => s + (r.he_grade_c ?? 0), 0)
      const pJE = dayProd.reduce((s: number, r: any) => s + (r.je_eggs ?? 0), 0)
      const pTE = dayProd.reduce((s: number, r: any) => s + (r.te_eggs ?? 0), 0)
      const pBE = dayProd.reduce((s: number, r: any) => s + (r.be_eggs ?? 0), 0)
      const pLE = dayProd.reduce((s: number, r: any) => s + (r.le_eggs ?? 0), 0)
      const wHE = dayProd.reduce((s: number, r: any) => s + (r.wastage_he ?? 0), 0)
      // Previously only wastage_he was read here — wastage_je/te/be were
      // ignored, so this day-wise view disagreed with the summary table
      // (which does subtract all four) whenever any NHE wastage existed.
      const wJE = dayProd.reduce((s: number, r: any) => s + (r.wastage_je ?? 0), 0)
      const wTE = dayProd.reduce((s: number, r: any) => s + (r.wastage_te ?? 0), 0)
      const wBE = dayProd.reduce((s: number, r: any) => s + (r.wastage_be ?? 0), 0)

      // Sales / dispatch for this day
      const dayDisp = (heDisp ?? []).filter((d: any) => d.flock_id === flockFilter && d.dispatch_date === date)
      const sA = dayDisp.reduce((s: number, d: any) => s + (d.grade_a ?? 0), 0)
      const sB = dayDisp.reduce((s: number, d: any) => s + (d.grade_b ?? 0), 0)
      const sC = dayDisp.reduce((s: number, d: any) => s + (d.grade_c ?? 0), 0)
      const daySales = (nheSales ?? []).filter((s: any) => s.flock_id === flockFilter && s.sale_date === date)
      const sJE = daySales.filter((s: any) => s.sale_type === 'je' || s.sale_type === 'je_eggs').reduce((a: number, s: any) => a + s.quantity, 0)
      const sTE = daySales.filter((s: any) => s.sale_type === 'te' || s.sale_type === 'te_eggs').reduce((a: number, s: any) => a + s.quantity, 0)
      const sBE = daySales.filter((s: any) => s.sale_type === 'be' || s.sale_type === 'be_eggs').reduce((a: number, s: any) => a + s.quantity, 0)

      // Update running balance
      balA += pA - sA - wHE; balB += pB - sB; balC += pC - sC
      balJE += pJE - sJE - wJE; balTE += pTE - sTE - wTE; balBE += pBE - sBE - wBE

      return { date, opA, opB, opC, opJE, opTE, opBE, pA, pB, pC, pJE, pTE, pBE, pLE, wHE, wJE, wTE, wBE, sA, sB, sC, sJE, sTE, sBE, clA: balA, clB: balB, clC: balC, clJE: balJE, clTE: balTE, clBE: balBE }
    })
  }, [flockFilter, dailyRecs, heDisp, nheSales, openingStock, fromDate, toDate])

  const totals = useMemo(() => ({
    opHE: stockRows.reduce((s, r) => s + r.totalOpenHE, 0),
    opNHE: stockRows.reduce((s, r) => s + r.totalOpenNHE, 0),
    recHE: stockRows.reduce((s, r) => s + r.totalRecHE, 0),
    recNHE: stockRows.reduce((s, r) => s + r.totalRecNHE, 0),
    recLE: stockRows.reduce((s, r) => s + r.recLE, 0),
    wst: stockRows.reduce((s, r) => s + r.totalWst, 0),
    slHE: stockRows.reduce((s, r) => s + r.totalSlHE, 0),
    slNHE: stockRows.reduce((s, r) => s + r.totalSlNHE, 0),
    clHE: stockRows.reduce((s, r) => s + r.totalClHE, 0),
    clNHE: stockRows.reduce((s, r) => s + r.totalClNHE, 0),
  }), [stockRows])

  const handleExport = () => {
    const flockLabel = flockOptions.find(f => f.value === flockFilter)?.label ?? 'All_Flocks'
    const wb = XLSX.utils.book_new()

    if (flockFilter && dayRows.length > 0) {
      const ws = XLSX.utils.aoa_to_sheet([
        ['Date', 'Open A', 'Open B', 'Open C', 'Open JE', 'Open TE', 'Open BE',
          'Prod A', 'Prod B', 'Prod C', 'JE', 'TE', 'BE', 'LE',
          'Sale A', 'Sale B', 'Sale C', 'Sale JE', 'Sale TE', 'Sale BE',
          'Cl A', 'Cl B', 'Cl C', 'Cl JE', 'Cl TE', 'Cl BE'],
        ...dayRows.map(r => [
          r.date.split('-').reverse().join('/'),
          r.opA, r.opB, r.opC, r.opJE, r.opTE, r.opBE,
          r.pA, r.pB, r.pC, r.pJE, r.pTE, r.pBE, r.pLE,
          r.sA, r.sB, r.sC, r.sJE, r.sTE, r.sBE,
          r.clA, r.clB, r.clC, r.clJE, r.clTE, r.clBE,
        ])
      ])
      ws['!cols'] = [{ wch: 12 }, ...Array(25).fill({ wch: 9 })]
      XLSX.utils.book_append_sheet(wb, ws, flockLabel)
      XLSX.writeFile(wb, `egg_stock_daily_${flockLabel.replace(/\s+/g, '_')}_${fromDate || 'start'}_to_${toDate}.xlsx`)
    } else {
      const ws = XLSX.utils.aoa_to_sheet([
        ['Flock', 'Farm',
          'Open HE-A', 'Open HE-B', 'Open HE-C', 'Open JE', 'Open TE', 'Open BE',
          'Rcv HE-A', 'Rcv HE-B', 'Rcv HE-C', 'Rcv JE', 'Rcv TE', 'Rcv BE', 'Rcv LE',
          'Wst HE', 'Wst JE', 'Wst TE', 'Wst BE',
          'Sale HE-A', 'Sale HE-B', 'Sale HE-C', 'Sale JE', 'Sale TE', 'Sale BE',
          'Cl HE-A', 'Cl HE-B', 'Cl HE-C', 'Cl JE', 'Cl TE', 'Cl BE'],
        ...stockRows.map(r => [
          `F-${r.flockNo}`, r.farm,
          r.opA, r.opB, r.opC, r.opJE, r.opTE, r.opBE,
          r.recA, r.recB, r.recC, r.recJE, r.recTE, r.recBE, r.recLE,
          r.wsHE, r.wsJE, r.wsTE, r.wsBE,
          r.slA, r.slB, r.slC, r.slJE, r.slTE, r.slBE,
          r.clA, r.clB, r.clC, r.clJE, r.clTE, r.clBE,
        ])
      ])
      ws['!cols'] = [{ wch: 10 }, { wch: 18 }, ...Array(29).fill({ wch: 9 })]
      XLSX.utils.book_append_sheet(wb, ws, 'Egg Stock Summary')
      XLSX.writeFile(wb, `egg_stock_register_${toDate}.xlsx`)
    }
  }

  if (isLoading) return <Spinner />

  const dateLabel = fromDate ? `${fromDate} to ${toDate}` : `up to ${toDate}`

  // Show wastage columns only if any flock actually has wastage data
  const hasWastage = stockRows.some(r => r.totalWst > 0)

  // Total wastage col count for colspan calculations
  const wstCols = hasWastage ? 4 : 0
  // Total data columns: 2(flock+farm) + 6(open) + 7(recv+LE) + wstCols + 6(sales) + 6(close) = 27+wstCols
  const totalCols = 2 + 6 + 7 + wstCols + 6 + 6

  // Column group helper
  const GH = ({ children, span, cls }: { children: React.ReactNode; span?: number; cls?: string }) => (
    <th colSpan={span ?? 1} className={`px-2 py-1 text-center text-xs font-semibold uppercase tracking-wide border-b border-gray-200 ${cls ?? ''}`}>
      {children}
    </th>
  )
  const SH = ({ children, bg }: { children: React.ReactNode; bg: string }) => (
    <th className={`px-1 py-1.5 text-right font-medium ${bg}`}>{children}</th>
  )

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Egg Stock Register"
        subtitle={`Opening · Received · Wastage · Sales · Closing — ${dateLabel}`}
        action={
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
          >
            <Download size={14} /> Export Excel
          </button>
        }
      />

      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-end">
        <SearchableSelect
          placeholder="All Flocks"
          options={flockOptions}
          value={flockFilter}
          onChange={v => setFlockFilter(v)}
          className="w-44"
        />
        <label className="flex items-center gap-1.5 text-sm text-gray-600">
          FY
          <select value={fy} onChange={e => applyFy(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1 text-sm">
            <option value="">— FY —</option>
            {FY_OPTIONS.map(f => <option key={f} value={f}>FY {f}</option>)}
          </select>
        </label>
        <label className="flex items-center gap-1.5 text-sm text-gray-600">
          From
          <input type="date" value={fromDate} onChange={e => { setFromDate(e.target.value); setFy('') }}
            className="border border-gray-300 rounded px-2 py-1 text-sm" />
        </label>
        <label className="flex items-center gap-1.5 text-sm text-gray-600">
          To
          <input type="date" value={toDate} onChange={e => { setToDate(e.target.value); setFy('') }}
            className="border border-gray-300 rounded px-2 py-1 text-sm" />
        </label>
        {(flockFilter || fromDate) && (
          <button onClick={() => { setFlockFilter(''); setFromDate(''); setFy('') }}
            className="text-sm text-gray-500 hover:text-gray-700 underline">
            Clear Filters
          </button>
        )}
      </div>

      {/* Day-wise table when a flock is selected */}
      {flockFilter && dayRows.length > 0 && (
        <Card padding={false}>
          <div className="px-4 py-2 border-b bg-blue-50 text-sm text-blue-700 font-medium">
            Day-wise Stock Register — {flockOptions.find(f => f.value === flockFilter)?.label}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-200 text-gray-500">
                  <th className="px-2 py-1.5 text-left">Date</th>
                  <th className="px-1 py-1.5 text-right bg-sky-50/60">Op A</th>
                  <th className="px-1 py-1.5 text-right bg-sky-50/60">Op B</th>
                  <th className="px-1 py-1.5 text-right bg-sky-50/60">Op C</th>
                  <th className="px-1 py-1.5 text-right bg-sky-50/60">Op JE</th>
                  <th className="px-1 py-1.5 text-right bg-sky-50/60">Op TE</th>
                  <th className="px-1 py-1.5 text-right bg-sky-50/60">Op BE</th>
                  <th className="px-1 py-1.5 text-right bg-green-50/60">Prod A</th>
                  <th className="px-1 py-1.5 text-right bg-green-50/60">Prod B</th>
                  <th className="px-1 py-1.5 text-right bg-green-50/60">Prod C</th>
                  <th className="px-1 py-1.5 text-right bg-green-50/60">JE</th>
                  <th className="px-1 py-1.5 text-right bg-green-50/60">TE</th>
                  <th className="px-1 py-1.5 text-right bg-green-50/60">BE</th>
                  <th className="px-1 py-1.5 text-right bg-green-100/60">LE</th>
                  <th className="px-1 py-1.5 text-right bg-orange-50/60">Sale A</th>
                  <th className="px-1 py-1.5 text-right bg-orange-50/60">Sale B</th>
                  <th className="px-1 py-1.5 text-right bg-orange-50/60">Sale C</th>
                  <th className="px-1 py-1.5 text-right bg-orange-50/60">JE</th>
                  <th className="px-1 py-1.5 text-right bg-orange-50/60">TE</th>
                  <th className="px-1 py-1.5 text-right bg-orange-50/60">BE</th>
                  <th className="px-1 py-1.5 text-right bg-purple-50/60 font-semibold">Cl A</th>
                  <th className="px-1 py-1.5 text-right bg-purple-50/60 font-semibold">Cl B</th>
                  <th className="px-1 py-1.5 text-right bg-purple-50/60 font-semibold">Cl C</th>
                  <th className="px-1 py-1.5 text-right bg-purple-50/60 font-semibold">JE</th>
                  <th className="px-1 py-1.5 text-right bg-purple-50/60 font-semibold">TE</th>
                  <th className="px-1 py-1.5 text-right bg-purple-50/60 font-semibold">BE</th>
                </tr>
              </thead>
              <tbody>
                {dayRows.map((r, i) => (
                  <tr key={r.date} className={`border-b border-gray-100 hover:bg-gray-50 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}`}>
                    <td className="px-2 py-1.5 font-medium">{r.date.split('-').reverse().join('/')}</td>
                    <td className="px-1 py-1.5 text-right text-sky-700 bg-sky-50/20">{fmt(r.opA)}</td>
                    <td className="px-1 py-1.5 text-right text-sky-700 bg-sky-50/20">{fmt(r.opB)}</td>
                    <td className="px-1 py-1.5 text-right text-sky-700 bg-sky-50/20">{fmt(r.opC)}</td>
                    <td className="px-1 py-1.5 text-right text-sky-700 bg-sky-50/20">{fmt(r.opJE)}</td>
                    <td className="px-1 py-1.5 text-right text-sky-700 bg-sky-50/20">{fmt(r.opTE)}</td>
                    <td className="px-1 py-1.5 text-right text-sky-700 bg-sky-50/20">{fmt(r.opBE)}</td>
                    <td className="px-1 py-1.5 text-right text-green-700 bg-green-50/20">{fmt(r.pA)}</td>
                    <td className="px-1 py-1.5 text-right text-green-700 bg-green-50/20">{fmt(r.pB)}</td>
                    <td className="px-1 py-1.5 text-right text-green-700 bg-green-50/20">{fmt(r.pC)}</td>
                    <td className="px-1 py-1.5 text-right text-green-700 bg-green-50/20">{fmt(r.pJE)}</td>
                    <td className="px-1 py-1.5 text-right text-green-700 bg-green-50/20">{fmt(r.pTE)}</td>
                    <td className="px-1 py-1.5 text-right text-green-700 bg-green-50/20">{fmt(r.pBE)}</td>
                    <td className="px-1 py-1.5 text-right text-green-600 bg-green-100/20">{fmt(r.pLE)}</td>
                    <td className="px-1 py-1.5 text-right text-orange-700 bg-orange-50/20">{fmt(r.sA)}</td>
                    <td className="px-1 py-1.5 text-right text-orange-700 bg-orange-50/20">{fmt(r.sB)}</td>
                    <td className="px-1 py-1.5 text-right text-orange-700 bg-orange-50/20">{fmt(r.sC)}</td>
                    <td className="px-1 py-1.5 text-right text-orange-700 bg-orange-50/20">{fmt(r.sJE)}</td>
                    <td className="px-1 py-1.5 text-right text-orange-700 bg-orange-50/20">{fmt(r.sTE)}</td>
                    <td className="px-1 py-1.5 text-right text-orange-700 bg-orange-50/20">{fmt(r.sBE)}</td>
                    <td className={`px-1 py-1.5 text-right font-semibold bg-purple-50/20 ${r.clA < 0 ? 'text-red-700' : 'text-purple-800'}`}>{fmtN(r.clA)}</td>
                    <td className={`px-1 py-1.5 text-right font-semibold bg-purple-50/20 ${r.clB < 0 ? 'text-red-700' : 'text-purple-800'}`}>{fmtN(r.clB)}</td>
                    <td className={`px-1 py-1.5 text-right font-semibold bg-purple-50/20 ${r.clC < 0 ? 'text-red-700' : 'text-purple-800'}`}>{fmtN(r.clC)}</td>
                    <td className={`px-1 py-1.5 text-right font-semibold bg-purple-50/20 ${r.clJE < 0 ? 'text-red-700' : 'text-purple-800'}`}>{fmtN(r.clJE)}</td>
                    <td className={`px-1 py-1.5 text-right font-semibold bg-purple-50/20 ${r.clTE < 0 ? 'text-red-700' : 'text-purple-800'}`}>{fmtN(r.clTE)}</td>
                    <td className={`px-1 py-1.5 text-right font-semibold bg-purple-50/20 ${r.clBE < 0 ? 'text-red-700' : 'text-purple-800'}`}>{fmtN(r.clBE)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="text-center py-3">
          <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">HE Stock</div>
          <div className={`text-2xl font-bold mt-1 ${totals.clHE < 0 ? 'text-red-600' : 'text-blue-700'}`}>{fmtN(totals.clHE)}</div>
          <div className="text-xs text-gray-400 mt-0.5">Closing Balance</div>
        </Card>
        <Card className="text-center py-3">
          <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">NHE Stock</div>
          <div className={`text-2xl font-bold mt-1 ${totals.clNHE < 0 ? 'text-red-600' : 'text-green-700'}`}>{fmtN(totals.clNHE)}</div>
          <div className="text-xs text-gray-400 mt-0.5">JE + TE + BE</div>
        </Card>
        <Card className="text-center py-3">
          <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">Total Received</div>
          <div className="text-2xl font-bold mt-1 text-gray-800">{fmtN(totals.recHE + totals.recNHE)}</div>
          <div className="text-xs text-gray-400 mt-0.5">HE + NHE (period)</div>
        </Card>
        <Card className="text-center py-3">
          <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">Total Sold</div>
          <div className="text-2xl font-bold mt-1 text-orange-700">{fmtN(totals.slHE + totals.slNHE)}</div>
          <div className="text-xs text-gray-400 mt-0.5">HE dispatched + NHE sales</div>
        </Card>
      </div>

      {/* Stock Table */}
      <Card padding={false}>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              {/* Group headers — same 6 sub-cols per section (HE-A HE-B HE-C JE TE BE) */}
              <tr className="bg-gray-100 border-b border-gray-200">
                <GH span={2} cls="text-left">Flock</GH>
                <GH span={6} cls="bg-sky-50 text-sky-800">Opening</GH>
                <GH span={7} cls="bg-green-50 text-green-800">Received (Period)</GH>
                {hasWastage && <GH span={4} cls="bg-red-50 text-red-800">Wastage (Period)</GH>}
                <GH span={6} cls="bg-orange-50 text-orange-800">Sales (Period)</GH>
                <GH span={6} cls="bg-purple-50 text-purple-800">Closing Balance</GH>
              </tr>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-500">
                <th className="px-2 py-1.5 text-left font-medium">Flock</th>
                <th className="px-2 py-1.5 text-left font-medium">Farm</th>
                <SH bg="bg-sky-50/60">HE-A</SH>
                <SH bg="bg-sky-50/60">HE-B</SH>
                <SH bg="bg-sky-50/60">HE-C</SH>
                <SH bg="bg-sky-50/60">JE</SH>
                <SH bg="bg-sky-50/60">TE</SH>
                <SH bg="bg-sky-50/60">BE</SH>
                <SH bg="bg-green-50/60">HE-A</SH>
                <SH bg="bg-green-50/60">HE-B</SH>
                <SH bg="bg-green-50/60">HE-C</SH>
                <SH bg="bg-green-50/60">JE</SH>
                <SH bg="bg-green-50/60">TE</SH>
                <SH bg="bg-green-50/60">BE</SH>
                <SH bg="bg-green-100/60">LE</SH>
                {hasWastage && <><SH bg="bg-red-50/60">HE</SH><SH bg="bg-red-50/60">JE</SH><SH bg="bg-red-50/60">TE</SH><SH bg="bg-red-50/60">BE</SH></>}
                <SH bg="bg-orange-50/60">HE-A</SH>
                <SH bg="bg-orange-50/60">HE-B</SH>
                <SH bg="bg-orange-50/60">HE-C</SH>
                <SH bg="bg-orange-50/60">JE</SH>
                <SH bg="bg-orange-50/60">TE</SH>
                <SH bg="bg-orange-50/60">BE</SH>
                <th className="px-1 py-1.5 text-right bg-purple-50/60 font-semibold">HE-A</th>
                <th className="px-1 py-1.5 text-right bg-purple-50/60 font-semibold">HE-B</th>
                <th className="px-1 py-1.5 text-right bg-purple-50/60 font-semibold">HE-C</th>
                <th className="px-1 py-1.5 text-right bg-purple-50/60 font-semibold">JE</th>
                <th className="px-1 py-1.5 text-right bg-purple-50/60 font-semibold">TE</th>
                <th className="px-1 py-1.5 text-right bg-purple-50/60 font-semibold">BE</th>
              </tr>
            </thead>
            <tbody>
              {stockRows.map((r, idx) => (
                <tr key={r.id} className={`border-b border-gray-100 hover:bg-gray-50 ${r.hasNegative ? 'bg-red-50' : idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}`}>
                  <td className="px-2 py-1.5"><Badge color="green">F-{r.flockNo}</Badge></td>
                  <td className="px-2 py-1.5 text-gray-500">{r.farm}</td>
                  {/* Opening */}
                  <td className="px-1 py-1.5 text-right text-sky-700 bg-sky-50/20">{fmt(r.opA)}</td>
                  <td className="px-1 py-1.5 text-right text-sky-700 bg-sky-50/20">{fmt(r.opB)}</td>
                  <td className="px-1 py-1.5 text-right text-sky-700 bg-sky-50/20">{fmt(r.opC)}</td>
                  <td className="px-1 py-1.5 text-right text-sky-700 bg-sky-50/20">{fmt(r.opJE)}</td>
                  <td className="px-1 py-1.5 text-right text-sky-700 bg-sky-50/20">{fmt(r.opTE)}</td>
                  <td className="px-1 py-1.5 text-right text-sky-700 bg-sky-50/20">{fmt(r.opBE)}</td>
                  {/* Received */}
                  <td className="px-1 py-1.5 text-right text-green-700 bg-green-50/20">{fmt(r.recA)}</td>
                  <td className="px-1 py-1.5 text-right text-green-700 bg-green-50/20">{fmt(r.recB)}</td>
                  <td className="px-1 py-1.5 text-right text-green-700 bg-green-50/20">{fmt(r.recC)}</td>
                  <td className="px-1 py-1.5 text-right text-green-700 bg-green-50/20">{fmt(r.recJE)}</td>
                  <td className="px-1 py-1.5 text-right text-green-700 bg-green-50/20">{fmt(r.recTE)}</td>
                  <td className="px-1 py-1.5 text-right text-green-700 bg-green-50/20">{fmt(r.recBE)}</td>
                  <td className="px-1 py-1.5 text-right text-green-600 bg-green-100/30 font-medium">{fmt(r.recLE)}</td>
                  {/* Wastage — only rendered when hasWastage */}
                  {hasWastage && <><td className="px-1 py-1.5 text-right text-red-600 bg-red-50/20">{fmt(r.wsHE)}</td><td className="px-1 py-1.5 text-right text-red-600 bg-red-50/20">{fmt(r.wsJE)}</td><td className="px-1 py-1.5 text-right text-red-600 bg-red-50/20">{fmt(r.wsTE)}</td><td className="px-1 py-1.5 text-right text-red-600 bg-red-50/20">{fmt(r.wsBE)}</td></>}
                  {/* Sales */}
                  <td className="px-1 py-1.5 text-right text-orange-700 bg-orange-50/20">{fmt(r.slA)}</td>
                  <td className="px-1 py-1.5 text-right text-orange-700 bg-orange-50/20">{fmt(r.slB)}</td>
                  <td className="px-1 py-1.5 text-right text-orange-700 bg-orange-50/20">{fmt(r.slC)}</td>
                  <td className="px-1 py-1.5 text-right text-orange-700 bg-orange-50/20">{fmt(r.slJE)}</td>
                  <td className="px-1 py-1.5 text-right text-orange-700 bg-orange-50/20">{fmt(r.slTE)}</td>
                  <td className="px-1 py-1.5 text-right text-orange-700 bg-orange-50/20">{fmt(r.slBE)}</td>
                  {/* Closing */}
                  <td className={`px-1 py-1.5 text-right font-semibold bg-purple-50/20 ${r.clA < 0 ? 'text-red-700' : 'text-purple-800'}`}>{fmtN(r.clA)}</td>
                  <td className={`px-1 py-1.5 text-right font-semibold bg-purple-50/20 ${r.clB < 0 ? 'text-red-700' : 'text-purple-800'}`}>{fmtN(r.clB)}</td>
                  <td className={`px-1 py-1.5 text-right font-semibold bg-purple-50/20 ${r.clC < 0 ? 'text-red-700' : 'text-purple-800'}`}>{fmtN(r.clC)}</td>
                  <td className={`px-1 py-1.5 text-right font-semibold bg-purple-50/20 ${r.clJE < 0 ? 'text-red-700' : 'text-purple-800'}`}>{fmtN(r.clJE)}</td>
                  <td className={`px-1 py-1.5 text-right font-semibold bg-purple-50/20 ${r.clTE < 0 ? 'text-red-700' : 'text-purple-800'}`}>{fmtN(r.clTE)}</td>
                  <td className={`px-1 py-1.5 text-right font-semibold bg-purple-50/20 ${r.clBE < 0 ? 'text-red-700' : 'text-purple-800'}`}>{fmtN(r.clBE)}</td>
                </tr>
              ))}
              {stockRows.length === 0 && (
                <tr>
                  <td colSpan={totalCols} className="text-center text-gray-400 py-8">No flocks found</td>
                </tr>
              )}
            </tbody>
            {stockRows.length > 1 && (
              <tfoot>
                <tr className="bg-gray-100 border-t-2 border-gray-300 font-semibold text-xs">
                  <td colSpan={2} className="px-2 py-2">TOTAL ({stockRows.length} flocks)</td>
                  {/* Opening */}
                  <td className="px-1 py-2 text-right text-sky-800 bg-sky-50/30" colSpan={3}>{fmtN(totals.opHE)}</td>
                  <td className="px-1 py-2 text-right text-sky-800 bg-sky-50/30" colSpan={3}>{fmtN(totals.opNHE)}</td>
                  {/* Received */}
                  <td className="px-1 py-2 text-right text-green-800 bg-green-50/30" colSpan={3}>{fmtN(totals.recHE)}</td>
                  <td className="px-1 py-2 text-right text-green-800 bg-green-50/30" colSpan={3}>{fmtN(totals.recNHE)}</td>
                  <td className="px-1 py-2 text-right text-green-700 bg-green-100/30">{fmtN(totals.recLE)}</td>
                  {/* Wastage */}
                  {hasWastage && <td className="px-1 py-2 text-right text-red-700 bg-red-50/30" colSpan={4}>{fmtN(totals.wst)}</td>}
                  {/* Sales */}
                  <td className="px-1 py-2 text-right text-orange-800 bg-orange-50/30" colSpan={3}>{fmtN(totals.slHE)}</td>
                  <td className="px-1 py-2 text-right text-orange-800 bg-orange-50/30" colSpan={3}>{fmtN(totals.slNHE)}</td>
                  {/* Closing */}
                  <td className={`px-1 py-2 text-right bg-purple-50/30 ${totals.clHE < 0 ? 'text-red-700' : 'text-purple-900'}`} colSpan={3}>{fmtN(totals.clHE)}</td>
                  <td className={`px-1 py-2 text-right bg-purple-50/30 ${totals.clNHE < 0 ? 'text-red-700' : 'text-purple-900'}`} colSpan={3}>{fmtN(totals.clNHE)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </Card>

      {stockRows.some(r => r.hasNegative) && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
          <span className="font-medium">Note:</span> Rows highlighted in red have negative closing stock — check opening stock entries or data errors.
        </div>
      )}
    </div>
  )
}
