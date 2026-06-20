import React, { useState, useRef } from 'react'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { today } from '@/lib/utils'
import { Card, CardHeader, Button, Select, SectionHeader, Badge } from '@/components/ui'
import { Upload, CheckCircle, XCircle, AlertTriangle, FileSpreadsheet } from 'lucide-react'
import toast from 'react-hot-toast'
import * as XLSX from 'xlsx'

interface ImportResult { success: number; errors: number; messages: string[] }

const parseDate = (v: any): string | null => {
  if (!v) return null
  if (typeof v === 'number') {
    const d = new Date((v - 25569) * 86400 * 1000)
    return d.toISOString().split('T')[0]
  }
  const s = String(v).trim()
  // DD.MM.YY or DD-MM-YYYY or YYYY-MM-DD
  const matDot = s.match(/^(\d{2})\.(\d{2})\.(\d{2,4})$/)
  if (matDot) {
    const y = matDot[3].length === 2 ? '20' + matDot[3] : matDot[3]
    return `${y}-${matDot[2].padStart(2,'0')}-${matDot[1].padStart(2,'0')}`
  }
  const matDash = s.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/)
  if (matDash) return `${matDash[3]}-${matDash[2].padStart(2,'0')}-${matDash[1].padStart(2,'0')}`
  try { const d = new Date(s); if (!isNaN(d.getTime())) return d.toISOString().split('T')[0] } catch {}
  return null
}

const num = (v: any): number => {
  if (v === null || v === undefined || v === '') return 0
  const n = parseFloat(String(v).replace(/,/g, ''))
  return isNaN(n) ? 0 : n
}

// ── IMPORT DAILY RECORDS ─────────────────────────────────────────
export const ImportDaily: React.FC = () => {
  const qc = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [selectedFlock, setSelectedFlock] = useState('')
  const [result, setResult] = useState<ImportResult | null>(null)
  const [preview, setPreview] = useState<any[]>([])

  const { data: flocks } = useQuery({
    queryKey: ['flocks_all'],
    queryFn: async () => { const { data } = await supabase.from('flocks').select('id,flock_no,laying_farm_id,rearing_farm_id').order('flock_no'); return data ?? [] }
  })

  const parseExcelFile = (file: File): Promise<XLSX.WorkBook> =>
    new Promise((res, rej) => {
      const reader = new FileReader()
      reader.onload = e => { try { res(XLSX.read(e.target?.result, { type: 'binary', cellDates: false })) } catch(err) { rej(err) } }
      reader.onerror = rej
      reader.readAsBinaryString(file)
    })

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    const wb = await parseExcelFile(file)
    const rows: any[] = []

    for (const sheetName of wb.SheetNames) {
      const ws = wb.Sheets[sheetName]
      const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null }) as any[][]

      let curDate: string | null = null
      for (const row of data) {
        if (!row || row.length < 10) continue
        // Date in col 0
        const d0 = row[0]
        if (d0 !== null && d0 !== undefined) {
          const parsed = parseDate(d0)
          if (parsed) curDate = parsed
        }
        // TOTAL row: col 1 contains 'total' (case-insensitive)
        const lbl = String(row[1] ?? '').trim().toLowerCase()
        if (lbl !== 'total' || !curDate) continue

        // Detect layout: 21-col (PPally/BPET) vs 16-col (Kpally)
        const is21col = row.length >= 19
        if (is21col) {
          rows.push({
            record_date:      curDate,
            opening_female:   num(row[2]),
            opening_male:     num(row[3]),
            feed_female_kg:   num(row[6]),
            feed_male_kg:     num(row[7]),
            total_eggs:       num(row[8]),
            he_eggs:          num(row[11]),
            trcull_female:    num(row[13]),
            trcull_male:      num(row[14]),
            mortality_female: num(row[15]),
            mortality_male:   num(row[16]),
            closing_female:   num(row[17]),
            closing_male:     num(row[18]),
          })
        } else if (row.length >= 14) {
          rows.push({
            record_date:      curDate,
            opening_female:   num(row[2]),
            opening_male:     num(row[3]),
            feed_female_kg:   num(row[6]),
            feed_male_kg:     num(row[7]),
            total_eggs:       0, he_eggs: 0,
            trcull_female:    0, trcull_male: 0,
            mortality_female: num(row[10]),
            mortality_male:   num(row[11]),
            closing_female:   num(row[12]),
            closing_male:     num(row[13]),
          })
        }
      }
    }

    // Deduplicate by date (keep last)
    const deduped = Object.values(rows.reduce((acc: any, r) => { acc[r.record_date] = r; return acc }, {}))
    setPreview(deduped.slice(0, 5))
    toast.success(`Parsed ${deduped.length} daily records from ${file.name}`)
    return deduped
  }

  const [parsedRows, setParsedRows] = useState<any[]>([])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rows = await handleFile(e) ?? []
    setParsedRows(rows as any[])
  }

  const mut = useMutation({
    mutationFn: async () => {
      if (!selectedFlock) throw new Error('Select a flock')
      if (!parsedRows.length) throw new Error('No data parsed')
      const flockData = flocks?.find((f: any) => f.id === selectedFlock)
      const farmId = flockData?.laying_farm_id ?? flockData?.rearing_farm_id

      let success = 0; let errors = 0; const messages: string[] = []
      const BATCH = 50
      for (let i = 0; i < parsedRows.length; i += BATCH) {
        const batch = parsedRows.slice(i, i + BATCH).map((r: any) => ({
          ...r, flock_id: selectedFlock, farm_id: farmId
        }))
        const { error } = await supabase.from('daily_records')
          .upsert(batch, { onConflict: 'flock_id,record_date,farm_id', ignoreDuplicates: false })
        if (error) { errors += batch.length; messages.push(`Batch ${i}-${i+BATCH}: ${error.message}`) }
        else success += batch.length
      }
      return { success, errors, messages }
    },
    onSuccess: (r) => {
      setResult(r)
      if (r.success > 0) { toast.success(`Imported ${r.success} records!`); qc.invalidateQueries({ queryKey: ['flock_daily'] }) }
      if (r.errors > 0) toast.error(`${r.errors} records failed`)
    },
    onError: (e: any) => toast.error(e.message)
  })

  const flockOptions = flocks?.map((f: any) => ({ value: f.id, label: `Flock ${f.flock_no}` })) ?? []

  return (
    <div className="space-y-5">
      <SectionHeader title="Import Daily Records"
        subtitle="Upload monthly flock report Excel files (Flock_16_*.xlsx, Flock_17_*.xlsx etc.)" />
      <Card>
        <div className="space-y-4">
          <Select label="Flock" required placeholder="— Select flock to import into —"
            options={flockOptions} value={selectedFlock} onChange={e => setSelectedFlock(e.target.value)} />

          <div>
            <label className="text-sm font-medium text-gray-700">Upload Excel File(s)</label>
            <p className="text-xs text-gray-400 mt-0.5 mb-2">
              Supports: Flock_16_*.xlsx, Flock_17_*.xlsx monthly files. Both 16-column (Kpally) and 21-column (PPally/BPET) layouts auto-detected.
            </p>
            <div
              className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-brand-300 hover:bg-brand-50/20 transition-all"
              onClick={() => fileRef.current?.click()}>
              <FileSpreadsheet size={32} className="mx-auto text-gray-300 mb-2" />
              <p className="text-sm text-gray-500">Click to upload or drag & drop</p>
              <p className="text-xs text-gray-400 mt-1">.xlsx files only</p>
              <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFileChange} />
            </div>
          </div>

          {preview.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Preview (first 5 rows of {parsedRows.length} total):</p>
              <div className="overflow-x-auto text-xs bg-gray-50 rounded-lg p-3">
                <table className="w-full">
                  <thead><tr>
                    {['Date','Open ♀','Open ♂','Feed ♀','Feed ♂','Eggs','HE','TrCull ♀','Mort ♀','Mort ♂','Close ♀'].map(h =>
                      <th key={h} className="px-2 py-1 text-left text-gray-500">{h}</th>
                    )}
                  </tr></thead>
                  <tbody>{preview.map((r: any, i: number) => (
                    <tr key={i} className="border-t border-gray-200">
                      <td className="px-2 py-1 font-medium">{r.record_date}</td>
                      <td className="px-2 py-1">{r.opening_female}</td>
                      <td className="px-2 py-1">{r.opening_male}</td>
                      <td className="px-2 py-1">{r.feed_female_kg}</td>
                      <td className="px-2 py-1">{r.feed_male_kg}</td>
                      <td className="px-2 py-1">{r.total_eggs}</td>
                      <td className="px-2 py-1">{r.he_eggs}</td>
                      <td className="px-2 py-1">{r.trcull_female}</td>
                      <td className="px-2 py-1">{r.mortality_female}</td>
                      <td className="px-2 py-1">{r.mortality_male}</td>
                      <td className="px-2 py-1">{r.closing_female}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <Button icon={<Upload size={16}/>} loading={mut.isPending}
              disabled={!selectedFlock || parsedRows.length === 0}
              onClick={() => mut.mutate()}>
              Import {parsedRows.length > 0 ? parsedRows.length + ' Records' : ''}
            </Button>
            {parsedRows.length > 0 && (
              <span className="self-center text-sm text-gray-500">{parsedRows.length} records ready to import</span>
            )}
          </div>
        </div>
      </Card>

      {result && (
        <Card>
          <div className="flex items-center gap-3 mb-3">
            {result.errors === 0 ? <CheckCircle size={20} className="text-green-500"/> : <AlertTriangle size={20} className="text-orange-500"/>}
            <h3 className="font-semibold">Import Result</h3>
          </div>
          <div className="flex gap-4 text-sm">
            <span className="text-green-600 font-medium">✓ {result.success} imported</span>
            {result.errors > 0 && <span className="text-red-600 font-medium">✗ {result.errors} failed</span>}
          </div>
          {result.messages.length > 0 && (
            <div className="mt-3 space-y-1">
              {result.messages.map((m, i) => <p key={i} className="text-xs text-red-500">{m}</p>)}
            </div>
          )}
        </Card>
      )}
    </div>
  )
}

// ── IMPORT ELECTRICITY ───────────────────────────────────────────
export const ImportElectricity: React.FC = () => {
  const qc = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [parsedRows, setParsedRows] = useState<any[]>([])
  const [result, setResult] = useState<ImportResult | null>(null)

  const { data: meters } = useQuery({
    queryKey: ['meters'],
    queryFn: async () => { const { data } = await supabase.from('electricity_meters').select('id,usc_no,meter_name').eq('is_active',true); return data ?? [] }
  })

  const METER_NAMES: Record<string, string[]> = {
    '103770716': ['bodjanampet - 1', 'bpet1', 'bodjanampet-1', 'bodjanampet 1'],
    '103770715': ['bodjanampet - 2', 'bpet2', 'bodjanampet-2', 'bodjanampet 2'],
    '112870608': ['feedmill', 'feed mill', 'feed  mill'],
    '103770721': ['kethireddypally', 'kpally', 'kethireddy'],
    '108508370': ['potlapally', 'ppally', 'agraharam'],
  }

  const findMeter = (name: string): string | null => {
    const nl = name.toLowerCase().trim()
    for (const [usc, names] of Object.entries(METER_NAMES)) {
      if (names.some(n => nl.includes(n))) {
        const meter = meters?.find((m: any) => m.usc_no === usc)
        return meter?.id ?? null
      }
    }
    return null
  }

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    const wb = XLSX.read(await file.arrayBuffer(), { type: 'array' })
    const rows: any[] = []

    for (const sheetName of wb.SheetNames) {
      // Skip non-month sheets
      if (['sheet1','sheet2','sheet3','all months'].includes(sheetName.toLowerCase())) continue
      // Try to parse month from sheet name
      const monthParsed = new Date(sheetName + ' 1')
      if (isNaN(monthParsed.getTime())) continue
      const monthStr = monthParsed.toISOString().slice(0, 7) + '-01'

      const ws = wb.Sheets[sheetName]
      const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null }) as any[][]
      for (const row of data) {
        if (!row || row.length < 4) continue
        const nameCell = String(row[2] ?? row[1] ?? '').trim()
        if (!nameCell || nameCell.toLowerCase() === 'unit name') continue
        const amount = num(row[3])
        if (!amount) continue
        const meterId = findMeter(nameCell)
        if (!meterId) continue
        const units = num(row[6]) || null
        rows.push({ meter_id: meterId, bill_month: monthStr, units_consumed: units || null, amount })
      }
    }
    setParsedRows(rows)
    toast.success(`Parsed ${rows.length} bill records`)
  }

  const mut = useMutation({
    mutationFn: async () => {
      let success = 0, errors = 0; const messages: string[] = []
      for (const row of parsedRows) {
        const { error } = await supabase.from('electricity_bills')
          .upsert(row, { onConflict: 'meter_id,bill_month' })
        if (error) { errors++; messages.push(error.message) } else success++
      }
      return { success, errors, messages }
    },
    onSuccess: (r) => { setResult(r); if (r.success > 0) { toast.success(`Imported ${r.success} bills!`); qc.invalidateQueries({ queryKey: ['elec_bills'] }) } },
    onError: (e: any) => toast.error(e.message)
  })

  return (
    <div className="space-y-5">
      <SectionHeader title="Import Electricity Bills"
        subtitle="Upload ELECTRICTY_BILLS_DETAILS.xlsx or Electricity_Bill_Details_FY2025-26.xlsx" />
      <Card>
        <div className="space-y-4">
          <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-700">
            <p className="font-medium mb-1">Expected format (any sheet named after a month):</p>
            <p>Row headers: Sl.No | Service No | Unit Name | Amount | ACD/DC Due | No Of Units</p>
            <p className="mt-1">Site names auto-matched: Bodjanampet-1, Bodjanampet-2, Feedmill, Kethireddypally, Potlapally</p>
          </div>
          <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-brand-300 transition-all"
            onClick={() => fileRef.current?.click()}>
            <FileSpreadsheet size={32} className="mx-auto text-gray-300 mb-2" />
            <p className="text-sm text-gray-500">Click to upload electricity bills Excel</p>
            <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFile} />
          </div>
          {parsedRows.length > 0 && (
            <div className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
              <p className="font-medium mb-1">{parsedRows.length} bill records parsed</p>
              {parsedRows.slice(0, 3).map((r, i) => (
                <p key={i} className="text-xs text-gray-400">
                  {r.bill_month} | Meter: {meters?.find((m:any) => m.id === r.meter_id)?.meter_name} | Rs {r.amount.toLocaleString('en-IN')}
                </p>
              ))}
            </div>
          )}
          <Button icon={<Upload size={16}/>} loading={mut.isPending}
            disabled={parsedRows.length === 0} onClick={() => mut.mutate()}>
            Import {parsedRows.length > 0 ? parsedRows.length + ' Bills' : ''}
          </Button>
        </div>
      </Card>
      {result && (
        <Card>
          <div className="flex gap-4 text-sm">
            <span className="text-green-600 font-medium">✓ {result.success} imported</span>
            {result.errors > 0 && <span className="text-red-600 font-medium">✗ {result.errors} failed</span>}
          </div>
          {result.messages.slice(0, 5).map((m, i) => <p key={i} className="text-xs text-red-500 mt-1">{m}</p>)}
        </Card>
      )}
    </div>
  )
}

// ── IMPORT SALARY ABSTRACT ───────────────────────────────────────
export const ImportSalary: React.FC = () => {
  const qc = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [parsedRows, setParsedRows] = useState<any[]>([])
  const [result, setResult] = useState<ImportResult | null>(null)

  const { data: farms } = useQuery({
    queryKey: ['farms'],
    queryFn: async () => { const { data } = await supabase.from('farms').select('id,name,code').eq('is_active',true); return data ?? [] }
  })

  const FARM_NAMES: Record<string, string[]> = {
    'BPET1':    ['bodjanampet-1','bodjanampet 1','farm-bodjanampet-1','bpet1'],
    'BPET2':    ['bodjanampet-2','bodjanampet 2','farm-bodjanampet-2','bpet2'],
    'PPALLY':   ['potlapall','potlapalli','farm-potlapall','ppally'],
    'KPALLY':   ['kethireddy','kpally','farm-kethireddy'],
    'HO':       ['head office','h.o','ho'],
    'FEEDMILL': ['feed mill','feedmill','cms'],
  }

  const findFarm = (name: string): string | null => {
    const nl = name.toLowerCase().trim()
    for (const [code, names] of Object.entries(FARM_NAMES)) {
      if (names.some(n => nl.includes(n))) {
        const farm = farms?.find((f: any) => f.code === code)
        return farm?.id ?? null
      }
    }
    return null
  }

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    // Guess month from filename: 1_Salary_Details_APRIL_2024 or 01_Salary_Details_April_2025
    const fnMatch = file.name.match(/(\w+)[_\s](\d{4})/i)
    let monthStr = ''
    if (fnMatch) {
      const monthName = fnMatch[1]; const year = fnMatch[2]
      const months: Record<string, string> = {
        jan:'01',feb:'02',mar:'03',apr:'04',may:'05',jun:'06',
        jul:'07',aug:'08',sep:'09',oct:'10',nov:'11',dec:'12'
      }
      const mo = months[monthName.toLowerCase().slice(0,3)]
      if (mo) monthStr = `${year}-${mo}-01`
    }

    const wb = XLSX.read(await file.arrayBuffer(), { type: 'array' })
    const rows: any[] = []

    for (const sheetName of wb.SheetNames) {
      if (sheetName.toLowerCase() !== 'abstract') continue
      const ws = wb.Sheets[sheetName]
      const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null }) as any[][]
      for (const row of data) {
        if (!row || row.length < 10) continue
        const unitName = String(row[1] ?? '').trim()
        if (!unitName || unitName.toLowerCase() === 'unit') continue
        const earned = num(row[2])
        if (!earned) continue
        const farmId = findFarm(unitName)
        if (!farmId) continue
        rows.push({
          farm_id: farmId, month: monthStr,
          total_salary: earned, total_advance: num(row[3]),
          net_salary: num(row[9]), employee_count: num(row[10]) || null
        })
      }
      break
    }
    setParsedRows(rows)
    toast.success(`Parsed ${rows.length} abstract rows from ${file.name}`)
  }

  const mut = useMutation({
    mutationFn: async () => {
      let success = 0, errors = 0; const messages: string[] = []
      for (const row of parsedRows) {
        if (!row.month || !row.farm_id) { errors++; messages.push(`Missing month or farm`); continue }
        const { error } = await supabase.from('salary_abstract')
          .upsert(row, { onConflict: 'farm_id,month' })
        if (error) { errors++; messages.push(error.message) } else success++
      }
      return { success, errors, messages }
    },
    onSuccess: (r) => { setResult(r); if (r.success > 0) { toast.success(`Imported ${r.success} entries!`); qc.invalidateQueries({ queryKey: ['salary_abstract'] }) } },
    onError: (e: any) => toast.error(e.message)
  })

  return (
    <div className="space-y-5">
      <SectionHeader title="Import Salary Abstract"
        subtitle="Upload monthly salary Excel files (Abstract sheet)" />
      <Card>
        <div className="space-y-4">
          <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-700">
            <p className="font-medium">Reads the 'Abstract' sheet. Columns: SL NO | UNIT | E.SAL | ADV | TDS | HOLD | ARREARS | HOLD/PAID | OT/BONUS | NET SALARY | No Of Employees</p>
            <p className="mt-1 text-xs">Month auto-detected from filename (e.g. 1_Salary_Details_APRIL_2024.xlsx → April 2024)</p>
          </div>
          <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-brand-300 transition-all"
            onClick={() => fileRef.current?.click()}>
            <FileSpreadsheet size={32} className="mx-auto text-gray-300 mb-2" />
            <p className="text-sm text-gray-500">Click to upload salary Excel file</p>
            <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFile} />
          </div>
          {parsedRows.length > 0 && (
            <div className="text-sm bg-gray-50 rounded-lg p-3 space-y-1">
              {parsedRows.map((r, i) => (
                <p key={i} className="text-xs text-gray-600">
                  {farms?.find((f:any)=>f.id===r.farm_id)?.name} | {r.month} | E.Sal: Rs {r.total_salary?.toLocaleString('en-IN')} | Net: Rs {r.net_salary?.toLocaleString('en-IN')}
                </p>
              ))}
            </div>
          )}
          <Button icon={<Upload size={16}/>} loading={mut.isPending}
            disabled={parsedRows.length === 0} onClick={() => mut.mutate()}>
            Import {parsedRows.length > 0 ? parsedRows.length + ' Records' : ''}
          </Button>
        </div>
      </Card>
      {result && (
        <Card>
          <div className="flex gap-4 text-sm">
            <span className="text-green-600 font-medium">✓ {result.success} imported</span>
            {result.errors > 0 && <span className="text-red-600 font-medium">✗ {result.errors} failed</span>}
          </div>
        </Card>
      )}
    </div>
  )
}

// ── IMPORT HE DISPATCH ───────────────────────────────────────────
export const ImportHE: React.FC = () => {
  const qc = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [parsedRows, setParsedRows] = useState<any[]>([])
  const [preview, setPreview] = useState<any[]>([])
  const [selectedFlock, setSelectedFlock] = useState('')
  const [result, setResult] = useState<ImportResult | null>(null)

  const { data: flocks } = useQuery({ queryKey:['flocks_all'], queryFn:async()=>{const{data}=await supabase.from('flocks').select('id,flock_no').order('flock_no');return data??[]} })
  const { data: hatcheries } = useQuery({ queryKey:['hatcheries'], queryFn:async()=>{const{data}=await supabase.from('hatcheries').select('id,name').eq('is_active',true);return data??[]} })
  const { data: parties } = useQuery({ queryKey:['parties'], queryFn:async()=>{const{data}=await supabase.from('parties').select('id,name').eq('is_active',true);return data??[]} })

  const findHatchery = (name: string) => {
    if (!name || !hatcheries) return null
    const nl = name.toLowerCase()
    return hatcheries.find((h: any) => nl.includes(h.name.toLowerCase().split(' ')[0].toLowerCase()))?.id ?? null
  }
  const findParty = (name: string) => {
    if (!name || !parties) return null
    const nl = name.toLowerCase()
    return parties.find((p: any) => nl.includes(p.name.toLowerCase().split(' ')[0].toLowerCase()))?.id ?? null
  }

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    const wb = XLSX.read(await file.arrayBuffer(), { type: 'array', cellDates: false })
    const rows: any[] = []

    for (const sheetName of wb.SheetNames) {
      const ws = wb.Sheets[sheetName]
      const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null }) as any[][]
      for (const row of data) {
        if (!row || row.length < 6) continue
        const d = parseDate(row[0])
        if (!d) continue
        const gradeA = num(row[3]); const gradeB = num(row[4]); const total = num(row[5]) || (gradeA + gradeB)
        if (!total) continue
        const free = num(row[6])
        const rate = num(row[7])
        const amount = num(row[8]) || ((total - free) * rate)
        rows.push({
          dispatch_date: d,
          dc_no: row[1] ? String(row[1]).trim() : null,
          hatchery_name: row[2] ? String(row[2]).trim() : null,
          grade_a: gradeA, grade_b: gradeB,
          total_dispatched: total,
          free_eggs: free, rate, amount,
          setting_date: parseDate(row[9]),
          hatch_date: parseDate(row[10]),
          chicks_sold: num(row[11]) || null,
          remarks: row[12] ? String(row[12]).trim() : null,
        })
      }
    }
    setParsedRows(rows)
    setPreview(rows.slice(0, 5))
    toast.success(`Parsed ${rows.length} HE dispatch records`)
  }

  const mut = useMutation({
    mutationFn: async () => {
      if (!selectedFlock) throw new Error('Select a flock')
      if (!parsedRows.length) throw new Error('No data parsed')
      let success = 0, errors = 0; const messages: string[] = []
      for (const r of parsedRows) {
        const hatchery_id = findHatchery(r.hatchery_name ?? '')
        const party_id = findParty(r.hatchery_name ?? '')
        const { error } = await supabase.from('he_dispatch').insert({
          flock_id: selectedFlock,
          dispatch_date: r.dispatch_date,
          dc_no: r.dc_no,
          hatchery_id, party_id,
          grade_a: r.grade_a, grade_b: r.grade_b,
          total_dispatched: r.total_dispatched,
          free_eggs: r.free_eggs, rate: r.rate, amount: r.amount,
          setting_date: r.setting_date, hatch_date: r.hatch_date,
          chicks_sold: r.chicks_sold, remarks: r.remarks,
        })
        if (error) { errors++; messages.push(error.message) } else success++
      }
      return { success, errors, messages }
    },
    onSuccess: (r) => { setResult(r); if(r.success>0){toast.success(`Imported ${r.success} HE records!`);qc.invalidateQueries({queryKey:['he_dispatch']})} },
    onError: (e:any) => toast.error(e.message)
  })

  const flockOptions = flocks?.map((f:any)=>({value:f.id,label:`Flock ${f.flock_no}`}))??[]

  return (
    <div className="space-y-5">
      <SectionHeader title="Import HE Dispatch" subtitle="Upload HE dispatch Excel files (date, dc_no, hatchery, grade_a, grade_b, total, free, rate, amount)"/>
      <Card>
        <div className="space-y-4">
          <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-700">
            <p className="font-medium mb-1">Expected columns (row by row):</p>
            <p>Date | DC No | Hatchery Name | Grade A | Grade B | Total | Free Eggs | Rate | Amount | Setting Date | Hatch Date | Chicks Sold</p>
          </div>
          <Select label="Flock" required placeholder="— Select flock —" options={flockOptions} value={selectedFlock} onChange={e=>setSelectedFlock(e.target.value)}/>
          <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-brand-300 transition-all" onClick={()=>fileRef.current?.click()}>
            <FileSpreadsheet size={32} className="mx-auto text-gray-300 mb-2"/>
            <p className="text-sm text-gray-500">Click to upload HE Dispatch Excel</p>
            <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFile}/>
          </div>
          {preview.length > 0 && (
            <div className="overflow-x-auto text-xs bg-gray-50 rounded-lg p-3">
              <table className="w-full">
                <thead><tr>{['Date','DC No','Hatchery','Gr A','Gr B','Total','Free','Rate','Amount'].map(h=><th key={h} className="px-2 py-1 text-left text-gray-500">{h}</th>)}</tr></thead>
                <tbody>{preview.map((r:any,i:number)=>(
                  <tr key={i} className="border-t border-gray-200">
                    <td className="px-2 py-1 font-medium">{r.dispatch_date}</td>
                    <td className="px-2 py-1">{r.dc_no??'—'}</td>
                    <td className="px-2 py-1">{r.hatchery_name??'—'}</td>
                    <td className="px-2 py-1">{r.grade_a}</td>
                    <td className="px-2 py-1">{r.grade_b}</td>
                    <td className="px-2 py-1 font-semibold">{r.total_dispatched}</td>
                    <td className="px-2 py-1">{r.free_eggs}</td>
                    <td className="px-2 py-1">{r.rate}</td>
                    <td className="px-2 py-1">{r.amount?.toLocaleString('en-IN')}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
          <div className="flex gap-3">
            <Button icon={<Upload size={16}/>} loading={mut.isPending} disabled={!selectedFlock||parsedRows.length===0} onClick={()=>mut.mutate()}>
              Import {parsedRows.length > 0 ? parsedRows.length + ' Records' : ''}
            </Button>
          </div>
        </div>
      </Card>
      {result && (
        <Card>
          <div className="flex gap-4 text-sm">
            <span className="text-green-600 font-medium">✓ {result.success} imported</span>
            {result.errors > 0 && <span className="text-red-600 font-medium">✗ {result.errors} failed</span>}
          </div>
          {result.messages.slice(0,5).map((m,i)=><p key={i} className="text-xs text-red-500 mt-1">{m}</p>)}
        </Card>
      )}
    </div>
  )
}

// ── IMPORT GRN ───────────────────────────────────────────────────
export const ImportGRN: React.FC = () => {
  const qc = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [parsedRows, setParsedRows] = useState<any[]>([])
  const [preview, setPreview] = useState<any[]>([])
  const [result, setResult] = useState<ImportResult | null>(null)

  const { data: farms } = useQuery({ queryKey:['farms'], queryFn:async()=>{const{data}=await supabase.from('farms').select('id,name,code').eq('is_active',true);return data??[]} })
  const { data: parties } = useQuery({ queryKey:['parties'], queryFn:async()=>{const{data}=await supabase.from('parties').select('id,name').eq('is_active',true);return data??[]} })
  const { data: ingredients } = useQuery({ queryKey:['ingredients'], queryFn:async()=>{const{data}=await supabase.from('feed_ingredients').select('id,name,code,short_name').eq('is_active',true);return data??[]} })

  const findFarm = (name: string) => {
    if (!name || !farms) return null
    const nl = name.toLowerCase()
    return farms.find((f:any) => nl.includes(f.code.toLowerCase()) || nl.includes(f.name.toLowerCase().split(' ')[0]))?.id ?? null
  }
  const findParty = (name: string) => {
    if (!name || !parties) return null
    const nl = name.toLowerCase()
    return parties.find((p:any) => nl.includes(p.name.toLowerCase().split(' ')[0]))?.id ?? null
  }
  const findIngredient = (name: string) => {
    if (!name || !ingredients) return null
    const nl = name.toLowerCase()
    return ingredients.find((i:any) =>
      nl.includes(i.code?.toLowerCase() ?? '') ||
      nl.includes(i.short_name?.toLowerCase() ?? '') ||
      nl.includes(i.name?.toLowerCase().split('-')[0] ?? '')
    )?.id ?? null
  }

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    const wb = XLSX.read(await file.arrayBuffer(), { type: 'array', cellDates: false })
    const rows: any[] = []

    // Strip rupee symbol / currency chars before parsing numbers
    const numStr = (v: any): number | null => {
      if (v == null) return null
      const s = String(v).replace(/[₹??,\s]/g, '').trim()
      const n = parseFloat(s)
      return isNaN(n) ? null : n
    }

    for (const sheetName of wb.SheetNames) {
      const ws = wb.Sheets[sheetName]
      const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null }) as any[][]

      // Detect header row by looking for known column names
      let headerRow = -1
      const colIdx: Record<string,number> = {}
      for (let i = 0; i < Math.min(10, data.length); i++) {
        const r = data[i] ?? []
        const norm = r.map((v:any) => String(v??'').toLowerCase().replace(/[_\s/]+/g,''))
        if (norm.some(v=>v.includes('grn')) || norm.some(v=>v.includes('item'))) {
          headerRow = i
          const aliases: Record<string,string[]> = {
            grn_no:         ['grn_no','grnno','grn','grnnumber'],
            grn_date:       ['grn_date','grndate','date','receiveddate'],
            farm_name:      ['farm','site','site_code','sitecode','farmcode','farm_name'],
            party_name:     ['party','supplier','vendor','party_name','partyname'],
            invoice_no:     ['invoice_no','invoiceno','invoicenumber','bill_no','billno'],
            invoice_date:   ['invoice_date','invoicedate','billdate','bill_date'],
            item_name:      ['item','item_name','itemname','ingredient','material','description'],
            qty:            ['qty','quantity'],
            unit:           ['unit','uom'],
            bags:           ['bags','packs','packets'],
            price_per_unit: ['price_per_unit','price','rate','priceperunit','priceperkg'],
            gst_pct:        ['gst_pct','gst','gst%','tax%','taxrate'],
            vehicle_no:     ['vehicle_no','vehicleno','vehicle','truckno'],
            remarks:        ['remarks','notes','comment'],
          }
          for (let ci = 0; ci < norm.length; ci++) {
            for (const [field, alts] of Object.entries(aliases)) {
              if (!(field in colIdx) && alts.includes(norm[ci])) colIdx[field] = ci
            }
          }
          break
        }
      }

      const dataRows = headerRow >= 0 ? data.slice(headerRow + 1) : data
      const get = (row: any[], field: string, fallbackIdx: number) => {
        const idx = field in colIdx ? colIdx[field] : fallbackIdx
        return row[idx] ?? null
      }

      for (const row of dataRows) {
        if (!row || row.length < 4) continue
        const rawDate = get(row, 'grn_date', 0)
        const d = parseDate(rawDate)
        const rawQty = get(row, 'qty', 7)
        const qty = numStr(rawQty); if (!qty) continue
        const rawGrnNo = get(row, 'grn_no', 1)
        rows.push({
          grn_date: d ?? String(rawDate??'').trim(),
          grn_no: rawGrnNo ? String(rawGrnNo).trim() : `GRN-${d}`,
          farm_name: get(row, 'farm_name', 2) ? String(get(row,'farm_name',2)).trim() : null,
          party_name: get(row, 'party_name', 3) ? String(get(row,'party_name',3)).trim() : null,
          item_name: get(row, 'item_name', 4) ? String(get(row,'item_name',4)).trim() : null,
          invoice_no: get(row, 'invoice_no', 5) ? String(get(row,'invoice_no',5)).trim() : null,
          qty,
          unit: get(row, 'unit', 8) ? String(get(row,'unit',8)).trim() : 'kg',
          bags: parseInt(String(get(row,'bags',9)??'')) || null,
          price_per_unit: numStr(get(row, 'price_per_unit', 10)),
          gst_pct: numStr(get(row, 'gst_pct', 11)),
          vehicle_no: get(row, 'vehicle_no', 12) ? String(get(row,'vehicle_no',12)).trim() : null,
          remarks: get(row, 'remarks', 13) ? String(get(row,'remarks',13)).trim() : null,
          total_amount: null,
        })
      }
    }
    setParsedRows(rows)
    setPreview(rows.slice(0, 5))
    toast.success(`Parsed ${rows.length} GRN records`)
  }

  const mut = useMutation({
    mutationFn: async () => {
      if (!parsedRows.length) throw new Error('No data parsed')
      let success = 0, errors = 0, newParties = 0, newItems = 0; const messages: string[] = []

      // Local caches so names created during this import are reused, not duplicated
      const partyCache: Record<string,string> = {}
      ;(parties??[]).forEach((p:any) => { partyCache[p.name.trim().toLowerCase()] = p.id })
      const itemCache: Record<string,string> = {}
      ;(ingredients??[]).forEach((i:any) => { itemCache[i.name.trim().toLowerCase()] = i.id })

      // Find an existing party or create it on the fly
      const getOrCreateParty = async (name: string): Promise<string|null> => {
        if (!name) return null
        const key = name.trim().toLowerCase()
        if (partyCache[key]) return partyCache[key]
        const matched = findParty(name)
        if (matched) { partyCache[key] = matched; return matched }
        const { data, error } = await supabase.from('parties')
          .insert({ name: name.trim(), type: 'supplier', is_active: true })
          .select('id').single()
        if (error || !data) return null
        partyCache[key] = data.id; newParties++; return data.id
      }
      const getOrCreateIngredient = async (name: string): Promise<string|null> => {
        if (!name) return null
        const key = name.trim().toLowerCase()
        if (itemCache[key]) return itemCache[key]
        const matched = findIngredient(name)
        if (matched) { itemCache[key] = matched; return matched }
        const { data, error } = await supabase.from('feed_ingredients')
          .insert({ name: name.trim(), is_active: true })
          .select('id').single()
        if (error || !data) return null
        itemCache[key] = data.id; newItems++; return data.id
      }

      for (const r of parsedRows) {
        const farm_id = findFarm(r.farm_name ?? '')
        const party_id = await getOrCreateParty(r.party_name ?? '')
        const ingredient_id = await getOrCreateIngredient(r.item_name ?? '')
        const { error } = await supabase.from('grn').insert({
          grn_no: r.grn_no, grn_date: r.grn_date,
          farm_id, party_id, ingredient_id,
          item_name: r.item_name,
          invoice_no: r.invoice_no,
          qty: r.qty, unit: r.unit, bags: r.bags,
          price_per_unit: r.price_per_unit || null,
          basic_amount: r.basic_amount || null,
          gst_pct: r.gst_pct || null,
          total_amount: r.total_amount || null,
          vehicle_no: r.vehicle_no, remarks: r.remarks,
        })
        if (error) { errors++; messages.push(`${r.grn_no}: ${error.message}`) } else success++
      }
      if (newParties) messages.unshift(`Auto-created ${newParties} new supplier(s)`)
      if (newItems) messages.unshift(`Auto-created ${newItems} new item(s)`)
      return { success, errors, messages }
    },
    onSuccess: (r) => {
      setResult(r)
      if(r.success>0){
        toast.success(`Imported ${r.success} GRN entries!`)
        qc.invalidateQueries({queryKey:['grn']})
        qc.invalidateQueries({queryKey:['parties']})
        qc.invalidateQueries({queryKey:['ingredients']})
      }
    },
    onError: (e:any) => toast.error(e.message)
  })

  return (
    <div className="space-y-5">
      <SectionHeader title="Import GRN" subtitle="Upload Goods Received Note Excel files"/>
      <Card>
        <div className="space-y-4">
          <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-700">
            <p className="font-medium mb-1">Accepted columns (header names detected automatically):</p>
            <p>grn_no | grn_date | site_code | party_name | invoice_no | invoice_date | item_name | qty | unit | bags | price_per_unit | gst_pct | vehicle_no | remarks</p>
          </div>
          <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-brand-300 transition-all" onClick={()=>fileRef.current?.click()}>
            <FileSpreadsheet size={32} className="mx-auto text-gray-300 mb-2"/>
            <p className="text-sm text-gray-500">Click to upload GRN CSV / Excel</p>
            <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFile}/>
          </div>
          {preview.length > 0 && (
            <div className="overflow-x-auto text-xs bg-gray-50 rounded-lg p-3">
              <table className="w-full">
                <thead><tr>{['Date','GRN No','Farm','Party','Item','Qty','Unit','Amount'].map(h=><th key={h} className="px-2 py-1 text-left text-gray-500">{h}</th>)}</tr></thead>
                <tbody>{preview.map((r:any,i:number)=>(
                  <tr key={i} className="border-t border-gray-200">
                    <td className="px-2 py-1 font-medium">{r.grn_date}</td>
                    <td className="px-2 py-1">{r.grn_no}</td>
                    <td className="px-2 py-1">{r.farm_name??'—'}</td>
                    <td className="px-2 py-1">{r.party_name??'—'}</td>
                    <td className="px-2 py-1">{r.item_name??'—'}</td>
                    <td className="px-2 py-1 font-semibold">{r.qty?.toLocaleString('en-IN')}</td>
                    <td className="px-2 py-1">{r.unit}</td>
                    <td className="px-2 py-1">{r.total_amount?.toLocaleString('en-IN')}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
          <Button icon={<Upload size={16}/>} loading={mut.isPending} disabled={parsedRows.length===0} onClick={()=>mut.mutate()}>
            Import {parsedRows.length > 0 ? parsedRows.length + ' Records' : ''}
          </Button>
        </div>
      </Card>
      {result && (
        <Card>
          <div className="flex gap-4 text-sm">
            <span className="text-green-600 font-medium">✓ {result.success} imported</span>
            {result.errors > 0 && <span className="text-red-600 font-medium">✗ {result.errors} failed</span>}
          </div>
          {result.messages.slice(0,5).map((m,i)=><p key={i} className="text-xs text-red-500 mt-1">{m}</p>)}
        </Card>
      )}
    </div>
  )
}
