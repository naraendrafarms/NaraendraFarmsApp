import React, { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { fetchAllPages, fmtDateShort } from '@/lib/utils'
import { Card, CardHeader, Button, Select, Table, Th, Td, Spinner, EmptyState, Modal, Badge } from '@/components/ui'
import { Users, Printer, Download, UserMinus, UserPlus } from 'lucide-react'
import * as XLSX from 'xlsx'
import toast from 'react-hot-toast'
import { printMultiReport, type PrintSection } from '@/lib/invoicePrint'

// ── Verified against the real schema before this page was written ───────────
//   attendance_daily: employee_id, farm_id, attendance_date, status, ot_hours
//                     status ∈ ('P','A','H','WO','OT')   -- NOT present/absent
//                     UNIQUE(employee_id, attendance_date), no flock_id
//   employees:        emp_id, name, designation, department, farm_id, gender,
//                     joining_date, leaving_date, is_active
// There is no flock on an attendance record, so every figure here is SITE-wise.
// A flock-wise split would be invented wherever two flocks share a site.

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const NO_SITE = '(no site)'

const monthLabel = (m: string) => {
  const [y, mo] = m.split('-')
  return `${MONTH_NAMES[parseInt(mo) - 1]} ${y}`
}

function monthOptions() {
  const opts: string[] = []
  const d = new Date()
  for (let i = 0; i < 24; i++) {
    opts.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
    d.setMonth(d.getMonth() - 1)
  }
  return opts
}

const monthStart = (m: string) => `${m}-01`
const monthEnd = (m: string) => {
  const [y, mo] = m.split('-').map(Number)
  return `${m}-${String(new Date(y, mo, 0).getDate()).padStart(2, '0')}`
}
const prevMonth = (m: string) => {
  const [y, mo] = m.split('-').map(Number)
  const d = new Date(y, mo - 2, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}
const datesOfMonth = (m: string) => {
  const [y, mo] = m.split('-').map(Number)
  const last = new Date(y, mo, 0).getDate()
  return Array.from({ length: last }, (_, i) => `${m}-${String(i + 1).padStart(2, '0')}`)
}

// P and OT are a full working day, H is half. A and WO contribute nothing.
// Same rule the Monthly Production Review uses, so the two never disagree.
const workValue = (status: string) => (status === 'P' || status === 'OT' ? 1 : status === 'H' ? 0.5 : 0)
const isWorked = (status: string) => status === 'P' || status === 'OT' || status === 'H'

// gender is free text in the database, so classify by first letter rather than
// assuming an exact casing that may not be what was typed in.
const genderOf = (g: string | null | undefined) => {
  const c = String(g ?? '').trim().toLowerCase()[0]
  return c === 'f' ? 'Female' : c === 'm' ? 'Male' : 'Not set'
}

const n1 = (v: number) => (Number.isInteger(v) ? String(v) : v.toFixed(1))

interface Emp {
  id: string; emp_id: string | null; name: string; designation: string | null
  department: string | null; farm_id: string | null; gender: string | null
  joining_date: string | null; leaving_date: string | null; is_active: boolean | null
}
interface Att {
  employee_id: string; farm_id: string | null; attendance_date: string
  status: string; ot_hours: number | null
}

export const WorkforceReviewPage: React.FC = () => {
  const today = new Date()
  const [month, setMonth] = useState(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`)
  const [siteFilter, setSiteFilter] = useState('')
  const [dayDetail, setDayDetail] = useState<string | null>(null)

  const pm = prevMonth(month)

  const { data: farms = [] } = useQuery({
    queryKey: ['farms_workforce'],
    queryFn: async () => {
      const { data } = await supabase.from('farms').select('id,name').order('name')
      return data ?? []
    },
  })

  const { data: employees = [], isLoading: empLoading } = useQuery<Emp[]>({
    queryKey: ['workforce_employees'],
    queryFn: async () => fetchAllPages<Emp>(
      (from, to) => supabase.from('employees')
        .select('id,emp_id,name,designation,department,farm_id,gender,joining_date,leaving_date,is_active')
        .order('emp_id').order('id').range(from, to),
      'Employees', toast.error),
  })

  // Both months in one fetch — the joiners/leavers panel compares them, and two
  // separate queries could resolve at different moments and be compared while
  // one of them still held the previous selection.
  const { data: attendance = [], isLoading: attLoading } = useQuery<Att[]>({
    queryKey: ['workforce_attendance', pm, month],
    queryFn: async () => fetchAllPages<Att>(
      (from, to) => supabase.from('attendance_daily')
        .select('employee_id,farm_id,attendance_date,status,ot_hours')
        .gte('attendance_date', monthStart(pm)).lte('attendance_date', monthEnd(month))
        .order('attendance_date').order('id').range(from, to),
      'Attendance', toast.error),
  })

  const isLoading = empLoading || attLoading

  const empById = useMemo(() => {
    const m = new Map<string, Emp>()
    employees.forEach(e => m.set(e.id, e))
    return m
  }, [employees])

  const farmName = useMemo(() => {
    const m = new Map<string, string>()
    ;(farms as any[]).forEach(f => m.set(f.id, f.name))
    return m
  }, [farms])

  // The site of a record: the site attendance was marked against, falling back
  // to the employee's own site where attendance carries none.
  const siteOf = (a: Att) => {
    const id = a.farm_id ?? empById.get(a.employee_id)?.farm_id ?? null
    return (id && farmName.get(id)) || NO_SITE
  }
  const empSite = (e: Emp | undefined) => (e?.farm_id && farmName.get(e.farm_id)) || NO_SITE

  const thisRows = useMemo(
    () => attendance.filter(a => a.attendance_date >= monthStart(month) && a.attendance_date <= monthEnd(month)),
    [attendance, month])
  const prevRows = useMemo(
    () => attendance.filter(a => a.attendance_date >= monthStart(pm) && a.attendance_date <= monthEnd(pm)),
    [attendance, pm])

  // Site filter applied once, above every panel, so the tables, the totals, the
  // export and the print can never disagree with each other.
  const rows = useMemo(
    () => (siteFilter ? thisRows.filter(a => siteOf(a) === siteFilter) : thisRows),
    [thisRows, siteFilter, empById, farmName])
  const rowsPrev = useMemo(
    () => (siteFilter ? prevRows.filter(a => siteOf(a) === siteFilter) : prevRows),
    [prevRows, siteFilter, empById, farmName])

  const sites = useMemo(() => {
    const s = new Set<string>()
    thisRows.forEach(a => s.add(siteOf(a)))
    prevRows.forEach(a => s.add(siteOf(a)))
    return Array.from(s).sort()
  }, [thisRows, prevRows, empById, farmName])

  const shownSites = siteFilter ? [siteFilter] : sites
  const dates = datesOfMonth(month)

  // ── 1. Headcount movement: who is not there compared to last month ────────
  const movement = useMemo(() => {
    const workedPrev = new Set(rowsPrev.filter(a => isWorked(a.status)).map(a => a.employee_id))
    const workedNow = new Set(rows.filter(a => isWorked(a.status)).map(a => a.employee_id))
    const lastSeen = new Map<string, string>()
    rowsPrev.concat(rows).filter(a => isWorked(a.status)).forEach(a => {
      const cur = lastSeen.get(a.employee_id)
      if (!cur || a.attendance_date > cur) lastSeen.set(a.employee_id, a.attendance_date)
    })
    const firstSeen = new Map<string, string>()
    rows.filter(a => isWorked(a.status)).forEach(a => {
      const cur = firstSeen.get(a.employee_id)
      if (!cur || a.attendance_date < cur) firstSeen.set(a.employee_id, a.attendance_date)
    })
    const left = Array.from(workedPrev).filter(id => !workedNow.has(id))
      .map(id => ({ e: empById.get(id), last: lastSeen.get(id) ?? '' }))
      .filter(x => x.e)
      .sort((a, b) => empSite(a.e).localeCompare(empSite(b.e)) || (a.e!.name).localeCompare(b.e!.name))
    const joined = Array.from(workedNow).filter(id => !workedPrev.has(id))
      .map(id => ({ e: empById.get(id), first: firstSeen.get(id) ?? '' }))
      .filter(x => x.e)
      .sort((a, b) => empSite(a.e).localeCompare(empSite(b.e)) || (a.e!.name).localeCompare(b.e!.name))
    return { opening: workedPrev.size, closing: workedNow.size, left, joined }
  }, [rows, rowsPrev, empById, farmName])

  // ── 2. Daily presence, site-wise ──────────────────────────────────────────
  const dailyPresence = useMemo(() => {
    const grid = new Map<string, Map<string, number>>()
    rows.forEach(a => {
      const v = workValue(a.status)
      if (!v) return
      if (!grid.has(a.attendance_date)) grid.set(a.attendance_date, new Map())
      const row = grid.get(a.attendance_date)!
      const s = siteOf(a)
      row.set(s, (row.get(s) ?? 0) + v)
    })
    return grid
  }, [rows, empById, farmName])

  // ── 3. Day-wise absentees, and days with nothing marked at all ────────────
  // An employee counts as "expected" on a date once they have joined and before
  // they have left. Someone with no row at all is NOT the same as absent — the
  // entry was simply never made, and that gap is invisible everywhere else.
  const expectedOn = (d: string) => employees.filter(e => {
    if (e.joining_date && e.joining_date > d) return false
    if (e.leaving_date && e.leaving_date < d) return false
    if (!e.is_active && !e.leaving_date) return false
    return siteFilter ? empSite(e) === siteFilter : true
  })

  const dayStats = useMemo(() => {
    const byDate = new Map<string, Att[]>()
    rows.forEach(a => {
      if (!byDate.has(a.attendance_date)) byDate.set(a.attendance_date, [])
      byDate.get(a.attendance_date)!.push(a)
    })
    return dates.map(d => {
      const recs = byDate.get(d) ?? []
      const marked = new Set(recs.map(r => r.employee_id))
      const full = recs.filter(r => r.status === 'A')
      const half = recs.filter(r => r.status === 'H')
      const wo = recs.filter(r => r.status === 'WO')
      const unmarked = recs.length === 0 ? [] : expectedOn(d).filter(e => !marked.has(e.id))
      return {
        date: d, records: recs, full, half, wo, unmarked,
        present: recs.reduce((s, r) => s + workValue(r.status), 0),
        anyMarked: recs.length > 0,
      }
    })
  }, [rows, dates, employees, siteFilter, empById, farmName])

  // ── 4. Site × designation headcount, male / female ────────────────────────
  const designationGrid = useMemo(() => {
    // Counted from who actually worked in the month, not from the master list —
    // a master row for someone who has not worked since March is not a worker
    // on this site today.
    const seen = new Map<string, string>()   // employee_id -> site worked
    rows.filter(a => isWorked(a.status)).forEach(a => { if (!seen.has(a.employee_id)) seen.set(a.employee_id, siteOf(a)) })
    const desigs = new Set<string>()
    const grid = new Map<string, Map<string, { m: number; f: number; o: number }>>()
    seen.forEach((site, id) => {
      const e = empById.get(id)
      if (!e) return
      const d = e.designation || '(no designation)'
      desigs.add(d)
      if (!grid.has(d)) grid.set(d, new Map())
      const row = grid.get(d)!
      if (!row.has(site)) row.set(site, { m: 0, f: 0, o: 0 })
      const cell = row.get(site)!
      const g = genderOf(e.gender)
      if (g === 'Female') cell.f++; else if (g === 'Male') cell.m++; else cell.o++
    })
    return { desigs: Array.from(desigs).sort(), grid }
  }, [rows, empById, farmName])

  // ── 5/7. Per-site month summary: attendance %, OT, absence ────────────────
  const siteSummary = useMemo(() => shownSites.map(site => {
    const r = rows.filter(a => siteOf(a) === site)
    const worked = r.reduce((s, a) => s + workValue(a.status), 0)
    // Available days exclude weekly offs — a rostered day off is not a shortfall.
    const available = r.filter(a => a.status !== 'WO').length
    const otDays = r.filter(a => a.status === 'OT').length
    const otHours = r.reduce((s, a) => s + (Number(a.ot_hours) || 0), 0)
    return {
      site,
      employees: new Set(r.filter(a => isWorked(a.status)).map(a => a.employee_id)).size,
      worked, available,
      pct: available ? (worked / available) * 100 : 0,
      absent: r.filter(a => a.status === 'A').length,
      half: r.filter(a => a.status === 'H').length,
      wo: r.filter(a => a.status === 'WO').length,
      otDays, otHours,
    }
  }), [shownSites, rows, empById, farmName])

  // ── 6. Per-employee absence, worst first ──────────────────────────────────
  const absenceByEmp = useMemo(() => {
    const m = new Map<string, { a: number; h: number; worked: number }>()
    rows.forEach(r => {
      if (!m.has(r.employee_id)) m.set(r.employee_id, { a: 0, h: 0, worked: 0 })
      const c = m.get(r.employee_id)!
      if (r.status === 'A') c.a++
      if (r.status === 'H') c.h++
      c.worked += workValue(r.status)
    })
    return Array.from(m.entries())
      .map(([id, c]) => ({ e: empById.get(id), ...c }))
      .filter(x => x.e && (x.a > 0 || x.h > 0))
      .sort((x, y) => (y.a + y.h * 0.5) - (x.a + x.h * 0.5))
  }, [rows, empById])

  const detail = dayDetail ? dayStats.find(d => d.date === dayDetail) : null

  // ── Print / Export ────────────────────────────────────────────────────────
  const sectionsForPrint = (): PrintSection[] => {
    const secs: PrintSection[] = []
    secs.push({
      heading: `Headcount Movement — ${monthLabel(pm)} vs ${monthLabel(month)}`,
      headers: ['Measure', 'Count'],
      rows: [
        [`Worked in ${monthLabel(pm)} (opening)`, movement.opening],
        ['Joined / first seen this month', movement.joined.length],
        ['Not there this month (left / stopped)', movement.left.length],
        [`Worked in ${monthLabel(month)} (closing)`, movement.closing],
        ['Net change', (movement.closing - movement.opening > 0 ? '+' : '') + (movement.closing - movement.opening)],
      ],
      rightAlignFrom: 1,
    })
    secs.push({
      heading: `Not there this month (worked in ${monthLabel(pm)}, no attendance in ${monthLabel(month)})`,
      headers: ['Emp Code', 'Name', 'Designation', 'Site', 'Last Present', 'Leaving Date'],
      rows: movement.left.map(x => [x.e!.emp_id ?? '', x.e!.name, x.e!.designation ?? '', empSite(x.e),
        fmtDateShort(x.last), x.e!.leaving_date ? fmtDateShort(x.e!.leaving_date) : '—']),
      emptyNote: 'Nobody from last month is missing this month.',
    })
    secs.push({
      heading: `Newly seen this month (no attendance in ${monthLabel(pm)})`,
      headers: ['Emp Code', 'Name', 'Designation', 'Site', 'First Present', 'Joining Date'],
      rows: movement.joined.map(x => [x.e!.emp_id ?? '', x.e!.name, x.e!.designation ?? '', empSite(x.e),
        fmtDateShort(x.first), x.e!.joining_date ? fmtDateShort(x.e!.joining_date) : '—']),
      emptyNote: 'No new faces this month.',
    })
    secs.push({
      heading: 'Daily Presence, Site-wise (P and OT = 1 day, H = ½ day)',
      headers: ['Date', ...shownSites, 'Total'],
      rows: dates.map(d => {
        const row = dailyPresence.get(d)
        const vals = shownSites.map(s => (row?.get(s) ? n1(row.get(s)!) : '—'))
        const tot = shownSites.reduce((s, x) => s + (row?.get(x) ?? 0), 0)
        return [fmtDateShort(d), ...vals, tot ? n1(tot) : '—']
      }),
      rightAlignFrom: 1,
      footerRow: ['TOTAL', ...shownSites.map(s =>
        n1(dates.reduce((acc, d) => acc + (dailyPresence.get(d)?.get(s) ?? 0), 0))),
        n1(rows.reduce((s, a) => s + workValue(a.status), 0))],
      pageBreakBefore: true,
    })
    secs.push({
      heading: 'Day-wise Absentees',
      headers: ['Date', 'Present', 'Full-day Absent', 'Half Day', 'Weekly Off', 'Not Marked'],
      rows: dayStats.filter(d => d.records.length).map(d => [fmtDateShort(d.date), n1(d.present),
        d.full.length, d.half.length, d.wo.length, d.unmarked.length]),
      rightAlignFrom: 1,
      footerRow: ['TOTAL', n1(dayStats.reduce((s, d) => s + d.present, 0)),
        dayStats.reduce((s, d) => s + d.full.length, 0),
        dayStats.reduce((s, d) => s + d.half.length, 0),
        dayStats.reduce((s, d) => s + d.wo.length, 0),
        dayStats.reduce((s, d) => s + d.unmarked.length, 0)],
      note: '"Not Marked" is not absence — those employees had no attendance entry made on a day when entries were made for others.',
      pageBreakBefore: true,
    })
    secs.push({
      heading: 'Workers by Designation and Site (M = male, F = female)',
      headers: ['Designation', ...shownSites, 'Total'],
      rows: designationGrid.desigs.map(d => {
        const row = designationGrid.grid.get(d)
        const cells = shownSites.map(s => {
          const c = row?.get(s)
          if (!c) return '—'
          const tot = c.m + c.f + c.o
          return `${tot} (M ${c.m} / F ${c.f}${c.o ? ` / ? ${c.o}` : ''})`
        })
        const tot = shownSites.reduce((s, x) => {
          const c = row?.get(x); return s + (c ? c.m + c.f + c.o : 0)
        }, 0)
        return [d, ...cells, tot]
      }),
      footerRow: ['TOTAL', ...shownSites.map(s => {
        let t = 0, m = 0, f = 0
        designationGrid.grid.forEach(row => { const c = row.get(s); if (c) { t += c.m + c.f + c.o; m += c.m; f += c.f } })
        return t ? `${t} (M ${m} / F ${f})` : '—'
      }), designationGrid.desigs.reduce((s, d) => {
        const row = designationGrid.grid.get(d)
        return s + shownSites.reduce((x, st) => { const c = row?.get(st); return x + (c ? c.m + c.f + c.o : 0) }, 0)
      }, 0)],
      pageBreakBefore: true,
    })
    secs.push({
      heading: 'Site Summary — attendance %, absence and overtime',
      headers: ['Site', 'Workers', 'Days Worked', 'Available Days', 'Attendance %', 'Absent', 'Half', 'Weekly Off', 'OT Days', 'OT Hours'],
      rows: siteSummary.map(s => [s.site, s.employees, n1(s.worked), s.available, s.pct.toFixed(1) + '%',
        s.absent, s.half, s.wo, s.otDays, n1(s.otHours)]),
      rightAlignFrom: 1,
      footerRow: ['TOTAL', siteSummary.reduce((a, s) => a + s.employees, 0),
        n1(siteSummary.reduce((a, s) => a + s.worked, 0)),
        siteSummary.reduce((a, s) => a + s.available, 0), '',
        siteSummary.reduce((a, s) => a + s.absent, 0),
        siteSummary.reduce((a, s) => a + s.half, 0),
        siteSummary.reduce((a, s) => a + s.wo, 0),
        siteSummary.reduce((a, s) => a + s.otDays, 0),
        n1(siteSummary.reduce((a, s) => a + s.otHours, 0))],
      note: 'Available Days excludes weekly offs — a rostered day off is not a shortfall.',
    })
    secs.push({
      heading: 'Absence by Employee (worst first)',
      headers: ['Emp Code', 'Name', 'Designation', 'Site', 'Full-day Absent', 'Half Days', 'Days Worked'],
      rows: absenceByEmp.map(x => [x.e!.emp_id ?? '', x.e!.name, x.e!.designation ?? '', empSite(x.e),
        x.a, x.h, n1(x.worked)]),
      rightAlignFrom: 4,
      emptyNote: 'No absence recorded this month.',
      pageBreakBefore: true,
    })
    return secs
  }

  const printAll = () => {
    if (!rows.length) { toast.error('No attendance for this month'); return }
    printMultiReport({
      title: 'Workforce Review',
      subtitle: monthLabel(month) + (siteFilter ? ` — ${siteFilter}` : ' — All Sites'),
      sections: sectionsForPrint(),
    })
  }

  const exportXLSX = () => {
    if (!rows.length) { toast.error('No attendance for this month'); return }
    const wb = XLSX.utils.book_new()
    sectionsForPrint().forEach((sec, i) => {
      const aoa = [[sec.heading], sec.headers, ...sec.rows]
      if (sec.footerRow) aoa.push(sec.footerRow)
      const ws = XLSX.utils.aoa_to_sheet(aoa as any)
      // Sheet names are capped at 31 chars by the format itself.
      XLSX.utils.book_append_sheet(wb, ws, `${i + 1}. ${sec.heading}`.slice(0, 31))
    })
    XLSX.writeFile(wb, `WorkforceReview_${month}${siteFilter ? '_' + siteFilter : ''}.xlsx`)
    toast.success('Downloaded')
  }

  const net = movement.closing - movement.opening

  return (
    <div className="p-4 space-y-4">
      <CardHeader
        title={`Workforce Review — ${monthLabel(month)}`}
        subtitle="Who left, who joined, daily presence and absence by site, and workers by designation"
        action={<div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={exportXLSX}><Download size={14} className="mr-1" />Export Excel</Button>
          <Button size="sm" variant="outline" onClick={printAll}><Printer size={14} className="mr-1" />Print</Button>
        </div>} />

      <Card className="p-3 flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Month</label>
          <Select value={month} onChange={e => setMonth(e.target.value)}
            options={monthOptions().map(m => ({ value: m, label: monthLabel(m) }))} />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Site</label>
          <Select value={siteFilter} onChange={e => setSiteFilter(e.target.value)}
            options={[{ value: '', label: 'All Sites' }, ...sites.map(s => ({ value: s, label: s }))]} />
        </div>
        <p className="text-[10px] text-gray-400 max-w-md">
          Attendance is recorded against a <strong>site</strong>, not a flock — there is no flock on an
          attendance record, so these figures are site-wise only.
        </p>
      </Card>

      {isLoading ? <div className="py-16 flex justify-center"><Spinner size={32} /></div>
        : !rows.length ? <EmptyState icon={<Users size={32} />} title="No attendance for this month"
          subtitle="Mark attendance under Employees → Attendance, then come back." />
        : <>

        {/* ── 1. Headcount movement ── */}
        <Card className="p-3">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">
            Headcount — {monthLabel(pm)} vs {monthLabel(month)}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
            {[
              { label: `Worked in ${monthLabel(pm)}`, value: movement.opening, cls: 'bg-gray-50 text-gray-800' },
              { label: 'Joined', value: movement.joined.length, cls: 'bg-green-50 text-green-700' },
              { label: 'Not there now', value: movement.left.length, cls: 'bg-red-50 text-red-700' },
              { label: `Worked in ${monthLabel(month)}`, value: movement.closing, cls: 'bg-brand-50 text-brand-800' },
              { label: 'Net change', value: (net > 0 ? '+' : '') + net, cls: net < 0 ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700' },
            ].map(b => (
              <div key={b.label} className={`rounded-lg px-2 py-3 ${b.cls}`}>
                <div className="text-xl font-bold">{b.value}</div>
                <div className="text-[10px] leading-tight mt-0.5">{b.label}</div>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-gray-400 mt-2">
            "Worked" means at least one day marked P, OT or H in that month.
          </p>
        </Card>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="p-0 overflow-hidden">
            <div className="px-3 py-2 bg-red-50 border-b border-red-100 flex items-center gap-2">
              <UserMinus size={14} className="text-red-600" />
              <span className="text-sm font-semibold text-red-800">Not there this month ({movement.left.length})</span>
            </div>
            <div className="overflow-x-auto max-h-80 overflow-y-auto">
              <Table>
                <thead><tr><Th>Code</Th><Th>Name</Th><Th>Designation</Th><Th>Site</Th><Th>Last Present</Th></tr></thead>
                <tbody>
                  {movement.left.length === 0
                    ? <tr><Td colSpan={5} className="text-center text-gray-400 py-4">Nobody from last month is missing.</Td></tr>
                    : movement.left.map(x => (
                      <tr key={x.e!.id}>
                        <Td>{x.e!.emp_id ?? '—'}</Td>
                        <Td>{x.e!.name}</Td>
                        <Td>{x.e!.designation ?? '—'}</Td>
                        <Td>{empSite(x.e)}</Td>
                        <Td>{fmtDateShort(x.last)}{x.e!.leaving_date && <Badge color="red">Left</Badge>}</Td>
                      </tr>))}
                </tbody>
              </Table>
            </div>
          </Card>

          <Card className="p-0 overflow-hidden">
            <div className="px-3 py-2 bg-green-50 border-b border-green-100 flex items-center gap-2">
              <UserPlus size={14} className="text-green-600" />
              <span className="text-sm font-semibold text-green-800">Newly seen this month ({movement.joined.length})</span>
            </div>
            <div className="overflow-x-auto max-h-80 overflow-y-auto">
              <Table>
                <thead><tr><Th>Code</Th><Th>Name</Th><Th>Designation</Th><Th>Site</Th><Th>First Present</Th></tr></thead>
                <tbody>
                  {movement.joined.length === 0
                    ? <tr><Td colSpan={5} className="text-center text-gray-400 py-4">No new faces this month.</Td></tr>
                    : movement.joined.map(x => (
                      <tr key={x.e!.id}>
                        <Td>{x.e!.emp_id ?? '—'}</Td>
                        <Td>{x.e!.name}</Td>
                        <Td>{x.e!.designation ?? '—'}</Td>
                        <Td>{empSite(x.e)}</Td>
                        <Td>{fmtDateShort(x.first)}</Td>
                      </tr>))}
                </tbody>
              </Table>
            </div>
          </Card>
        </div>

        {/* ── 2. Daily presence site-wise ── */}
        <Card className="p-0 overflow-hidden">
          <div className="px-3 py-2 border-b bg-gray-50">
            <span className="text-sm font-semibold text-gray-700">Daily Presence, Site-wise</span>
            <span className="text-[10px] text-gray-500 ml-2">P and OT count 1 day, H counts ½</span>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <thead>
                <tr>
                  <Th>Date</Th>
                  {shownSites.map(s => <Th key={s} right>{s}</Th>)}
                  <Th right>Total</Th>
                </tr>
              </thead>
              <tbody>
                {dates.map(d => {
                  const row = dailyPresence.get(d)
                  const tot = shownSites.reduce((s, x) => s + (row?.get(x) ?? 0), 0)
                  return (
                    <tr key={d} className={row ? '' : 'bg-gray-50/60'}>
                      <Td>{fmtDateShort(d)}</Td>
                      {shownSites.map(s => <Td key={s} right>{row?.get(s) ? n1(row.get(s)!) : <span className="text-gray-300">—</span>}</Td>)}
                      <Td right className="font-semibold">{tot ? n1(tot) : <span className="text-gray-300">—</span>}</Td>
                    </tr>)
                })}
              </tbody>
              <tfoot>
                <tr className="bg-brand-50 font-semibold text-brand-800">
                  <Td>TOTAL</Td>
                  {shownSites.map(s => <Td key={s} right>
                    {n1(dates.reduce((acc, d) => acc + (dailyPresence.get(d)?.get(s) ?? 0), 0))}
                  </Td>)}
                  <Td right>{n1(rows.reduce((s, a) => s + workValue(a.status), 0))}</Td>
                </tr>
              </tfoot>
            </Table>
          </div>
        </Card>

        {/* ── 3. Day-wise absentees ── */}
        <Card className="p-0 overflow-hidden">
          <div className="px-3 py-2 border-b bg-gray-50">
            <span className="text-sm font-semibold text-gray-700">Day-wise Absentees</span>
            <span className="text-[10px] text-gray-500 ml-2">click a row to see the names</span>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <thead>
                <tr><Th>Date</Th><Th right>Present</Th><Th right>Full-day Absent</Th><Th right>Half Day</Th>
                  <Th right>Weekly Off</Th><Th right>Not Marked</Th></tr>
              </thead>
              <tbody>
                {dayStats.filter(d => d.anyMarked).map(d => (
                  <tr key={d.date} className="cursor-pointer hover:bg-brand-50/50" onClick={() => setDayDetail(d.date)}>
                    <Td>{fmtDateShort(d.date)}</Td>
                    <Td right>{n1(d.present)}</Td>
                    <Td right className={d.full.length ? 'text-red-600 font-semibold' : ''}>{d.full.length || '—'}</Td>
                    <Td right className={d.half.length ? 'text-amber-600 font-semibold' : ''}>{d.half.length || '—'}</Td>
                    <Td right className="text-gray-500">{d.wo.length || '—'}</Td>
                    <Td right className={d.unmarked.length ? 'text-orange-600 font-semibold' : 'text-gray-300'}>{d.unmarked.length || '—'}</Td>
                  </tr>))}
              </tbody>
              <tfoot>
                <tr className="bg-brand-50 font-semibold text-brand-800">
                  <Td>TOTAL</Td>
                  <Td right>{n1(dayStats.reduce((s, d) => s + d.present, 0))}</Td>
                  <Td right>{dayStats.reduce((s, d) => s + d.full.length, 0)}</Td>
                  <Td right>{dayStats.reduce((s, d) => s + d.half.length, 0)}</Td>
                  <Td right>{dayStats.reduce((s, d) => s + d.wo.length, 0)}</Td>
                  <Td right>{dayStats.reduce((s, d) => s + d.unmarked.length, 0)}</Td>
                </tr>
              </tfoot>
            </Table>
          </div>
          <p className="text-[10px] text-gray-500 px-3 py-2 border-t bg-orange-50/50">
            <strong>Not Marked</strong> is not absence — it is an employee who had <em>no</em> attendance entry
            on a day when entries were made for others. Left unfixed it silently reduces that person's paid days.
          </p>
        </Card>

        {/* ── 4. Designation × site ── */}
        <Card className="p-0 overflow-hidden">
          <div className="px-3 py-2 border-b bg-gray-50">
            <span className="text-sm font-semibold text-gray-700">Workers by Designation and Site</span>
            <span className="text-[10px] text-gray-500 ml-2">counted from who actually worked this month</span>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <thead>
                <tr><Th>Designation</Th>{shownSites.map(s => <Th key={s} right>{s}</Th>)}<Th right>Total</Th></tr>
              </thead>
              <tbody>
                {designationGrid.desigs.map(d => {
                  const row = designationGrid.grid.get(d)
                  const tot = shownSites.reduce((s, x) => { const c = row?.get(x); return s + (c ? c.m + c.f + c.o : 0) }, 0)
                  return (
                    <tr key={d}>
                      <Td>{d}</Td>
                      {shownSites.map(s => {
                        const c = row?.get(s)
                        return <Td key={s} right>
                          {c ? <>
                            <span className="font-semibold">{c.m + c.f + c.o}</span>
                            <span className="text-[10px] text-gray-500 ml-1">M {c.m} / F {c.f}{c.o ? ` / ? ${c.o}` : ''}</span>
                          </> : <span className="text-gray-300">—</span>}
                        </Td>
                      })}
                      <Td right className="font-semibold">{tot}</Td>
                    </tr>)
                })}
              </tbody>
              <tfoot>
                <tr className="bg-brand-50 font-semibold text-brand-800">
                  <Td>TOTAL</Td>
                  {shownSites.map(s => {
                    let t = 0, m = 0, f = 0
                    designationGrid.grid.forEach(row => { const c = row.get(s); if (c) { t += c.m + c.f + c.o; m += c.m; f += c.f } })
                    return <Td key={s} right>{t ? <>{t}<span className="text-[10px] font-normal ml-1">M {m} / F {f}</span></> : '—'}</Td>
                  })}
                  <Td right>{designationGrid.desigs.reduce((s, d) => {
                    const row = designationGrid.grid.get(d)
                    return s + shownSites.reduce((x, st) => { const c = row?.get(st); return x + (c ? c.m + c.f + c.o : 0) }, 0)
                  }, 0)}</Td>
                </tr>
              </tfoot>
            </Table>
          </div>
          <p className="text-[10px] text-gray-500 px-3 py-2 border-t">
            "? " is an employee whose gender is not filled in on their master record.
          </p>
        </Card>

        {/* ── 5/7. Site summary ── */}
        <Card className="p-0 overflow-hidden">
          <div className="px-3 py-2 border-b bg-gray-50">
            <span className="text-sm font-semibold text-gray-700">Site Summary — attendance %, absence and overtime</span>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <thead>
                <tr><Th>Site</Th><Th right>Workers</Th><Th right>Days Worked</Th><Th right>Available Days</Th>
                  <Th right>Attendance %</Th><Th right>Absent</Th><Th right>Half</Th><Th right>Weekly Off</Th>
                  <Th right>OT Days</Th><Th right>OT Hours</Th></tr>
              </thead>
              <tbody>
                {siteSummary.map(s => (
                  <tr key={s.site}>
                    <Td>{s.site}</Td>
                    <Td right>{s.employees}</Td>
                    <Td right>{n1(s.worked)}</Td>
                    <Td right>{s.available}</Td>
                    <Td right className={s.pct < 90 ? 'text-red-600 font-semibold' : 'text-green-700 font-semibold'}>
                      {s.pct.toFixed(1)}%
                    </Td>
                    <Td right>{s.absent || '—'}</Td>
                    <Td right>{s.half || '—'}</Td>
                    <Td right className="text-gray-500">{s.wo || '—'}</Td>
                    <Td right>{s.otDays || '—'}</Td>
                    <Td right>{s.otHours ? n1(s.otHours) : '—'}</Td>
                  </tr>))}
              </tbody>
              <tfoot>
                <tr className="bg-brand-50 font-semibold text-brand-800">
                  <Td>TOTAL</Td>
                  <Td right>{siteSummary.reduce((a, s) => a + s.employees, 0)}</Td>
                  <Td right>{n1(siteSummary.reduce((a, s) => a + s.worked, 0))}</Td>
                  <Td right>{siteSummary.reduce((a, s) => a + s.available, 0)}</Td>
                  <Td right>—</Td>
                  <Td right>{siteSummary.reduce((a, s) => a + s.absent, 0)}</Td>
                  <Td right>{siteSummary.reduce((a, s) => a + s.half, 0)}</Td>
                  <Td right>{siteSummary.reduce((a, s) => a + s.wo, 0)}</Td>
                  <Td right>{siteSummary.reduce((a, s) => a + s.otDays, 0)}</Td>
                  <Td right>{n1(siteSummary.reduce((a, s) => a + s.otHours, 0))}</Td>
                </tr>
              </tfoot>
            </Table>
          </div>
          <p className="text-[10px] text-gray-500 px-3 py-2 border-t">
            Available Days excludes weekly offs — a rostered day off is not a shortfall.
          </p>
        </Card>

        {/* ── 6. Absence by employee ── */}
        <Card className="p-0 overflow-hidden">
          <div className="px-3 py-2 border-b bg-gray-50">
            <span className="text-sm font-semibold text-gray-700">Absence by Employee — worst first ({absenceByEmp.length})</span>
          </div>
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <Table>
              <thead>
                <tr><Th>Code</Th><Th>Name</Th><Th>Designation</Th><Th>Site</Th>
                  <Th right>Full-day Absent</Th><Th right>Half Days</Th><Th right>Days Worked</Th></tr>
              </thead>
              <tbody>
                {absenceByEmp.length === 0
                  ? <tr><Td colSpan={7} className="text-center text-gray-400 py-4">No absence recorded this month.</Td></tr>
                  : absenceByEmp.map(x => (
                    <tr key={x.e!.id}>
                      <Td>{x.e!.emp_id ?? '—'}</Td>
                      <Td>{x.e!.name}</Td>
                      <Td>{x.e!.designation ?? '—'}</Td>
                      <Td>{empSite(x.e)}</Td>
                      <Td right className={x.a ? 'text-red-600 font-semibold' : ''}>{x.a || '—'}</Td>
                      <Td right className={x.h ? 'text-amber-600' : ''}>{x.h || '—'}</Td>
                      <Td right>{n1(x.worked)}</Td>
                    </tr>))}
              </tbody>
            </Table>
          </div>
        </Card>
      </>}

      {/* ── Day detail ── */}
      <Modal open={!!detail} onClose={() => setDayDetail(null)} size="lg"
        title={detail ? `${fmtDateShort(detail.date)} — who was where` : ''}>
        {detail && (
          <div className="space-y-3 text-sm">
            {([
              { label: 'Full-day Absent', list: detail.full.map(r => empById.get(r.employee_id)), cls: 'text-red-700 bg-red-50' },
              { label: 'Half Day', list: detail.half.map(r => empById.get(r.employee_id)), cls: 'text-amber-700 bg-amber-50' },
              { label: 'Weekly Off', list: detail.wo.map(r => empById.get(r.employee_id)), cls: 'text-gray-700 bg-gray-50' },
              { label: 'Not Marked (no entry made)', list: detail.unmarked, cls: 'text-orange-700 bg-orange-50' },
            ]).map(g => (
              <div key={g.label}>
                <div className={`px-2 py-1 rounded font-semibold text-xs ${g.cls}`}>{g.label} — {g.list.length}</div>
                {g.list.length === 0
                  ? <p className="text-xs text-gray-400 px-2 py-1">None.</p>
                  : <ul className="px-2 py-1 text-xs grid sm:grid-cols-2 gap-x-4">
                      {g.list.filter(Boolean).map((e: any) => (
                        <li key={e.id} className="py-0.5">
                          {e.emp_id ? `${e.emp_id} — ` : ''}{e.name}
                          <span className="text-gray-400"> · {e.designation ?? 'no designation'} · {empSite(e)}</span>
                        </li>))}
                    </ul>}
              </div>))}
          </div>)}
      </Modal>
    </div>
  )
}
