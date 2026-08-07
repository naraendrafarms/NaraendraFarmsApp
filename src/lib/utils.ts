// Indian number format — Rs 1,23,45,678
export const inr = (v: number | null | undefined, decimals = 2): string => {
  if (v == null) return '—'
  const res = Math.abs(v).toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })
  return v < 0 ? `−Rs ${res}` : `Rs ${res}`
}

// Plain Indian number without Rs
export const inrNum = (v: number | null | undefined, decimals = 2): string => {
  if (v == null) return '—'
  return Math.abs(v).toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })
}

// Percentage
export const pct = (v: number | null | undefined, decimals = 2): string => {
  if (v == null) return '—'
  return `${(v * 100).toFixed(decimals)}%`
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

// Date format DD/MM/YYYY — parses YYYY-MM-DD directly to avoid timezone shift
export const fmtDate = (d: string | null | undefined): string => {
  if (!d) return '—'
  const parts = d.split('T')[0].split('-')        // handle ISO timestamps too
  if (parts.length === 3) {
    const [y, m, day] = parts
    return `${day}/${m}/${y}`
  }
  return d
}

// Short date: DD MMM YYYY  e.g. 19 Jun 2026
export const fmtDateShort = (d: string | null | undefined): string => {
  if (!d) return '—'
  const parts = d.split('T')[0].split('-')
  if (parts.length === 3) {
    const [y, m, day] = parts
    return `${day} ${MONTHS[parseInt(m) - 1]} ${y}`
  }
  return d
}

// Month label: Jun 2026
export const fmtMonth = (d: string | null | undefined): string => {
  if (!d) return '—'
  const parts = d.split('-')
  if (parts.length >= 2) return `${MONTHS[parseInt(parts[1]) - 1]} ${parts[0]}`
  return d
}

// Date + time in IST: 19/06/2026 02:30 PM IST
export const fmtDateTime = (ts: string | null | undefined): string => {
  if (!ts) return '—'
  return new Date(ts).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  }).replace(',', '')   // "19/06/2026 02:30 pm" → clean
}

// Today as YYYY-MM-DD in IST
export const today = (): string => {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }) // en-CA gives YYYY-MM-DD
}

// Current Indian financial year string e.g. "2026-27"
export const currentFY = (): string => {
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
  const y = now.getFullYear(), m = now.getMonth() + 1
  const startYear = m >= 4 ? y : y - 1
  return `${startYear}-${String(startYear + 1).slice(-2)}`
}

// FY date range — start/end as YYYY-MM-DD for a FY string like "2026-27"
export const fyRange = (fy: string): { start: string; end: string } => {
  const y = parseInt(fy.split('-')[0]); return { start: `${y}-04-01`, end: `${y + 1}-03-31` }
}

// Which FY string ("2026-27") a given YYYY-MM-DD date falls in — the
// inverse of fyRange(), used to auto-switch a fiscal-year filter to match
// a date the user just entered (e.g. a 01-April transaction added while an
// older FY was still selected, which would otherwise save fine but not
// appear anywhere in the current view).
export const fyOfDate = (dateStr: string): string => {
  const [y, m] = dateStr.split('-').map(Number)
  const startYear = m >= 4 ? y : y - 1
  return `${startYear}-${String(startYear + 1).slice(-2)}`
}

// FY months as ['YYYY-MM', ...] from Apr..Mar
export const fyMonths = (fy: string): string[] => {
  const y = parseInt(fy.split('-')[0]); const out: string[] = []
  for (let i = 0; i < 12; i++) { const m = ((3 + i) % 12) + 1; const yr = (3 + i) <= 11 ? y : y + 1; out.push(`${yr}-${String(m).padStart(2, '0')}`) }
  return out
}

export const FY_OPTIONS = ['2024-25', '2025-26', '2026-27', '2027-28']

// First day of month
export const firstOfMonth = (d: Date = new Date()): string => {
  const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}-01`
}

// Days between two dates
export const daysBetween = (a: string, b: string): number => {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000)
}

// Flock age in weeks from placement date
export const flockAgeWeeks = (placementDate: string, asOf?: string): number => {
  const ref = asOf ? new Date(asOf) : new Date()
  const placed = new Date(placementDate)
  return Math.floor((ref.getTime() - placed.getTime()) / (7 * 86400000))
}

// "58w 4d" format — weeks + remainder days, the way age is read off a
// production register (each egg-laying day has its own age, not just one
// age for the whole flock).
export const flockAgeWeeksDays = (placementDate: string, asOf?: string): string => {
  const ref = asOf ? new Date(asOf) : new Date()
  const placed = new Date(placementDate)
  const totalDays = Math.floor((ref.getTime() - placed.getTime()) / 86400000)
  const weeks = Math.floor(totalDays / 7)
  const days = totalDays % 7
  return `${weeks}w ${days}d`
}

// Status badge color
export const statusColor = (status: string): string => {
  const map: Record<string, string> = {
    rearing: 'bg-yellow-100 text-yellow-800',
    laying:  'bg-green-100 text-green-800',
    closed:  'bg-gray-100 text-gray-600',
    active:  'bg-green-100 text-green-800',
    inactive:'bg-red-100 text-red-800',
  }
  return map[status] ?? 'bg-gray-100 text-gray-600'
}

// Truncate text
export const truncate = (s: string, n = 30): string =>
  s.length > n ? s.slice(0, n) + '…' : s

// Parse Excel date serial number
export const excelDateToISO = (serial: number): string => {
  const d = new Date((serial - 25569) * 86400 * 1000)
  return d.toISOString().split('T')[0]
}

// PostgREST caps a single response at its server-side "max rows" setting
// (1000 by default) regardless of a client .limit() — a client limit only
// sets the requested Range, the server still clamps the response. Any page
// that SUMS/AVERAGES/computes a running BALANCE from a query must use this
// instead of a plain .select(), or a large date range/FY/all-time view will
// silently understate the total past that row count rather than erroring.
// Pass a function that takes (from, to) and returns the Supabase query for
// that page — same shape a .range(from, to) call takes.
export const FETCH_PAGE_SIZE = 1000
export async function fetchAllPages<T>(
  buildPage: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
  errLabel: string,
  onError?: (message: string) => void,
): Promise<T[]> {
  const all: T[] = []
  let from = 0
  for (;;) {
    const { data, error } = await buildPage(from, from + FETCH_PAGE_SIZE - 1)
    if (error) { (onError ?? console.error)(`${errLabel}: ${error.message}`); break }
    const page = data ?? []
    all.push(...page)
    if (page.length < FETCH_PAGE_SIZE) break
    from += FETCH_PAGE_SIZE
  }
  return all
}

// Shared CSV export — opens directly in Excel. One place instead of every
// page reimplementing its own escaping/download logic.
export function exportCSV(filename: string, headers: string[], rows: (string | number | null | undefined)[][]) {
  const esc = (v: string | number | null | undefined) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const csv = [headers.map(esc).join(','), ...rows.map(r => r.map(esc).join(','))].join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.click()
}

// Flock age label for one record date, e.g. "W0 D1" on the placement date.
//
// Age is 0-BASED: a day-old chick is 0 weeks 1 day, and the flock turns 1 week
// old on day 8. This matches the standard curve, which is keyed on completed
// weeks, and the Age (weeks) figure the daily entry auto-fills.
//
// Days BEFORE placement are real — chicks can arrive over two or three days
// while day 1 is reckoned from the last consignment — so they are labelled
// rather than mislabelled. Note JavaScript's % keeps the sign of the operand
// (-2 % 7 === -2), so a negative day would otherwise print as "D-1".
export const flockAgeLabel = (placementDate: string | null | undefined, recordDate: string): string => {
  if (!placementDate || !recordDate) return '—'
  const days = Math.floor(
    (new Date(recordDate).getTime() - new Date(placementDate).getTime()) / 86400000)
  if (days < 0) return `Pre ${days}d`
  return `W${Math.floor(days / 7)} D${(days % 7) + 1}`
}

// The week bucket a record falls in — 0 for the first week, and -1 for
// anything before placement so those days group together and sort first.
export const flockAgeWeekBucket = (placementDate: string | null | undefined, recordDate: string): number | null => {
  if (!placementDate || !recordDate) return null
  const days = Math.floor(
    (new Date(recordDate).getTime() - new Date(placementDate).getTime()) / 86400000)
  return days < 0 ? -1 : Math.floor(days / 7)
}
