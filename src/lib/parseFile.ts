import * as XLSX from 'xlsx'

/** Split a single CSV line respecting double-quoted fields (which may contain commas). */
function splitCsvLine(line: string): string[] {
  const out: string[] = []
  let cur = '', inQ = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (inQ) {
      if (c === '"') {
        if (line[i + 1] === '"') { cur += '"'; i++ }   // escaped quote ""
        else inQ = false
      } else cur += c
    } else {
      if (c === '"') inQ = true
      else if (c === ',') { out.push(cur); cur = '' }
      else cur += c
    }
  }
  out.push(cur)
  return out.map(v => v.trim())
}

// Some real-world exports have a title row above the actual column headers
// (e.g. a merged "RECOMMENDED VACCINATION SCHEDULE" banner in cell A1, with
// the real "S.No / Age / ..." header in row 2). Treating row 1 as headers
// always failed to import those. Scan the first few rows and use the first
// one that looks like an actual header row (2+ non-empty cells) — a title
// row's own row typically has only one. Falls back to row 0 unchanged if
// nothing else qualifies, so normal files (header already in row 0) are
// unaffected.
function findHeaderRowIndex(rows: any[][]): number {
  for (let i = 0; i < Math.min(5, rows.length); i++) {
    const nonEmpty = (rows[i] ?? []).filter(c => String(c ?? '').trim() !== '').length
    if (nonEmpty >= 2) return i
  }
  return 0
}

/** Parse CSV or Excel file → { headers (lowercase), rows (string[][]) } */
export async function parseFile(file: File): Promise<{ headers: string[]; rows: string[][] }> {
  if (file.name.toLowerCase().endsWith('.csv')) {
    const text = await file.text()
    const lines = text.split(/\r?\n/).filter(l => l.trim())
    const splitLines = lines.map(splitCsvLine)
    const headerIdx = findHeaderRowIndex(splitLines)
    const headers = splitLines[headerIdx].map(h => h.toLowerCase())
    const rows = splitLines.slice(headerIdx + 1)
    return { headers, rows }
  }
  const buffer = await file.arrayBuffer()
  const wb = XLSX.read(buffer)
  const ws = wb.Sheets[wb.SheetNames[0]]
  const raw = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1, raw: false, defval: '' })
  const headerIdx = findHeaderRowIndex(raw)
  const headers = ((raw[headerIdx] ?? []) as any[]).map((h: any) => String(h ?? '').trim().toLowerCase())
  const rows = raw.slice(headerIdx + 1).map((row: any[]) => row.map((v: any) => String(v ?? '').trim()))
  return { headers, rows }
}

/** Download an Excel (.xlsx) template */
export function downloadXlsxTemplate(filename: string, headers: string[], exampleRow?: (string|number)[]) {
  const wb = XLSX.utils.book_new()
  const data = exampleRow ? [headers, exampleRow] : [headers]
  const ws = XLSX.utils.aoa_to_sheet(data)
  // Auto-width columns
  ws['!cols'] = headers.map(h => ({ wch: Math.max(h.length + 2, 14) }))
  XLSX.utils.book_append_sheet(wb, ws, 'Template')
  XLSX.writeFile(wb, filename)
}
