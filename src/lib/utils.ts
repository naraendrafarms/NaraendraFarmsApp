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

// Date format DD-MMM-YYYY
export const fmtDate = (d: string | null | undefined): string => {
  if (!d) return '—'
  const dt = new Date(d)
  return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

// Month label
export const fmtMonth = (d: string): string => {
  const dt = new Date(d)
  return dt.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
}

// Today as YYYY-MM-DD
export const today = (): string => new Date().toISOString().split('T')[0]

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
