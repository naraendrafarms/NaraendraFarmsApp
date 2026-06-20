// Indian number format — Rs 1,23,45,678
export const inr = (v: number | null | undefined, decimals = 0): string => {
  if (v == null) return '—'
  const abs = Math.abs(v)
  const parts = abs.toFixed(decimals).split('.')
  const int = parts[0]
  let res = ''
  const mod = int.length % 2
  for (let i = 0; i < int.length; i++) {
    if (i > 0 && (i - mod) % 2 === 0 && mod ? i > 1 : i > 1) res += ','
    res += int[i]
  }
  // Standard Indian grouping
  const n = parseInt(parts[0])
  res = n.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })
  return v < 0 ? `−Rs ${res}` : `Rs ${res}`
}

// Plain Indian number without Rs
export const inrNum = (v: number | null | undefined, decimals = 0): string => {
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
