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

/** Parse CSV or Excel file → { headers (lowercase), rows (string[][]) } */
export async function parseFile(file: File): Promise<{ headers: string[]; rows: string[][] }> {
  if (file.name.toLowerCase().endsWith('.csv')) {
    const text = await file.text()
    const lines = text.split(/\r?\n/).filter(l => l.trim())
    const headers = splitCsvLine(lines[0]).map(h => h.toLowerCase())
    const rows = lines.slice(1).map(l => splitCsvLine(l))
    return { headers, rows }
  }
  const buffer = await file.arrayBuffer()
  const wb = XLSX.read(buffer)
  const ws = wb.Sheets[wb.SheetNames[0]]
  const raw = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1, raw: false, defval: '' })
  const headers = ((raw[0] ?? []) as any[]).map((h: any) => String(h ?? '').trim().toLowerCase())
  const rows = raw.slice(1).map((row: any[]) => row.map((v: any) => String(v ?? '').trim()))
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
