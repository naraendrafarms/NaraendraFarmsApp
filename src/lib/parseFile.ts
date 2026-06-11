import * as XLSX from 'xlsx'

/** Parse CSV or Excel file → { headers (lowercase), rows (string[][]) } */
export async function parseFile(file: File): Promise<{ headers: string[]; rows: string[][] }> {
  if (file.name.toLowerCase().endsWith('.csv')) {
    const text = await file.text()
    const lines = text.split('\n').filter(l => l.trim())
    const headers = lines[0].split(',').map(h => h.replace(/^"|"$/g, '').trim().toLowerCase())
    const rows = lines.slice(1).map(l => l.split(',').map(v => v.replace(/^"|"$/g, '').trim()))
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
