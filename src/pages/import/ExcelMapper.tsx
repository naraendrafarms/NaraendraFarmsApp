import React, { useState, useRef, useMemo, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Card, Button, Select, SectionHeader, Badge, Spinner } from '@/components/ui'
import { Upload, FileSpreadsheet, CheckCircle, XCircle, AlertTriangle, Download, RefreshCw, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'
import * as XLSX from 'xlsx'

// ── helpers ───────────────────────────────────────────────────────────────────

const parseDate = (v: any): string | null => {
  if (!v) return null
  if (typeof v === 'number') {
    const d = new Date((v - 25569) * 86400 * 1000)
    return d.toISOString().split('T')[0]
  }
  const s = String(v).trim()
  const matDot = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{2,4})$/)
  if (matDot) { const y = matDot[3].length===2?'20'+matDot[3]:matDot[3]; return `${y}-${matDot[2].padStart(2,'0')}-${matDot[1].padStart(2,'0')}` }
  const matDash = s.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/)
  if (matDash) return `${matDash[3]}-${matDash[2].padStart(2,'0')}-${matDash[1].padStart(2,'0')}`
  const matSlash = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/)
  if (matSlash) { const y = matSlash[3].length===2?'20'+matSlash[3]:matSlash[3]; return `${y}-${matSlash[2].padStart(2,'0')}-${matSlash[1].padStart(2,'0')}` }
  try { const d = new Date(s); if (!isNaN(d.getTime())) return d.toISOString().split('T')[0] } catch {}
  return null
}

const num = (v: any) => { if (!v && v!==0) return 0; const n=parseFloat(String(v).replace(/,/g,'')); return isNaN(n)?0:n }
const int = (v: any) => Math.round(num(v))

function fuzzyMatch(a: string, b: string) {
  a = a.toLowerCase().replace(/[^a-z0-9]/g,'')
  b = b.toLowerCase().replace(/[^a-z0-9]/g,'')
  return a===b || a.includes(b) || b.includes(a)
}

// ── IMPORT TYPE DEFINITIONS ───────────────────────────────────────────────────

interface FieldDef {
  key: string
  label: string
  type: 'date' | 'int' | 'float' | 'text' | 'month'
  required?: boolean
  hint?: string
}

interface ImportTypeDef {
  id: string
  label: string
  description: string
  table: string
  fields: FieldDef[]
  conflictKey?: string
  previewCols: string[]   // field keys to show in preview table
  needsLookup?: 'flock' | 'farm' | 'meter' | 'employee'
  templateRow: Record<string, string>
}

const IMPORT_TYPES: ImportTypeDef[] = [
  {
    id: 'daily_records',
    label: 'Daily Records (Production)',
    description: 'Daily egg production, feed consumption, bird mortality per shed',
    table: 'daily_records',
    conflictKey: 'flock_id,record_date,shed_id',
    needsLookup: 'flock',
    previewCols: ['record_date','total_eggs','he_eggs','mortality_female','mortality_male','feed_female_kg'],
    fields: [
      { key:'record_date',       label:'Date',                type:'date',  required:true },
      { key:'total_eggs',        label:'Total Eggs',          type:'int' },
      { key:'he_eggs',           label:'HE Eggs',             type:'int' },
      { key:'he_grade_a',        label:'HE Grade A',          type:'int' },
      { key:'he_grade_b',        label:'HE Grade B',          type:'int' },
      { key:'he_grade_c',        label:'HE Grade C',          type:'int' },
      { key:'je_eggs',           label:'JE (Jumbo)',          type:'int' },
      { key:'te_eggs',           label:'TE (Table)',          type:'int' },
      { key:'be_eggs',           label:'BE (Broken)',         type:'int' },
      { key:'le_eggs',           label:'LE (Leached)',        type:'int' },
      { key:'wastage_eggs',      label:'Wastage',             type:'int' },
      { key:'opening_female',    label:'Opening Female',      type:'int' },
      { key:'opening_male',      label:'Opening Male',        type:'int' },
      { key:'mortality_female',  label:'Deaths Female',       type:'int' },
      { key:'mortality_male',    label:'Deaths Male',         type:'int' },
      { key:'transfer_female',    label:'Transfer Female',     type:'int' },
      { key:'transfer_male',     label:'Transfer Male',       type:'int' },
      { key:'cull_female',       label:'Cull Female',         type:'int' },
      { key:'cull_male',         label:'Cull Male',           type:'int' },
      { key:'closing_female',    label:'Closing Female',      type:'int' },
      { key:'closing_male',      label:'Closing Male',        type:'int' },
      { key:'feed_female_kg',    label:'Feed Female (kg)',    type:'float' },
      { key:'feed_male_kg',      label:'Feed Male (kg)',      type:'float' },
      { key:'lighting_hrs',      label:'Lighting Hours',      type:'float' },
      { key:'age_weeks',         label:'Age (weeks)',         type:'float' },
      { key:'remarks',           label:'Remarks',             type:'text' },
    ],
    templateRow: { record_date:'01-06-2025', total_eggs:'9500', he_eggs:'8200', he_grade_a:'7000', he_grade_b:'900', he_grade_c:'300', je_eggs:'500', te_eggs:'400', be_eggs:'50', mortality_female:'2', mortality_male:'0', opening_female:'10000', opening_male:'1100', feed_female_kg:'1800', feed_male_kg:'220', remarks:'' }
  },
  {
    id: 'salary',
    label: 'Salary Records',
    description: 'Monthly salary data for employees',
    table: 'salary_monthly',
    conflictKey: 'employee_id,month',
    needsLookup: 'employee',
    previewCols: ['emp_id','month','basic_salary','gross_salary','advance','net_salary'],
    fields: [
      { key:'emp_id',          label:'Emp ID',           type:'text',  required:true, hint:'Must match employee emp_id in app' },
      { key:'month',           label:'Month (YYYY-MM)',  type:'month', required:true },
      { key:'days_worked',     label:'Days Worked',      type:'float' },
      { key:'basic_salary',    label:'Basic Salary',     type:'float' },
      { key:'hra',             label:'HRA',              type:'float' },
      { key:'arrears',         label:'Arrears',          type:'float' },
      { key:'ot_bonus',        label:'OT / Bonus',       type:'float' },
      { key:'gross_salary',    label:'Gross Salary',     type:'float' },
      { key:'esi_employee',    label:'ESI Employee',     type:'float' },
      { key:'esi_employer',    label:'ESI Employer',     type:'float' },
      { key:'pf_employee',     label:'PF Employee',      type:'float' },
      { key:'pf_employer',     label:'PF Employer',      type:'float' },
      { key:'pt',              label:'PT',               type:'float' },
      { key:'advance',         label:'Advance',          type:'float' },
      { key:'tds',             label:'TDS',              type:'float' },
      { key:'hold',            label:'Hold',             type:'float' },
      { key:'net_salary',      label:'Net Salary',       type:'float' },
      { key:'payment_mode',    label:'Payment Mode',     type:'text' },
      { key:'remarks',         label:'Remarks',          type:'text' },
    ],
    templateRow: { emp_id:'BPS4001', month:'2025-06', days_worked:'26', basic_salary:'8000', hra:'2000', gross_salary:'10000', esi_employee:'75', pf_employee:'960', pt:'200', advance:'500', net_salary:'8265', payment_mode:'Cash', remarks:'' }
  },
  {
    id: 'electricity',
    label: 'Electricity Bills',
    description: 'Monthly electricity bills per meter/site',
    table: 'electricity_bills',
    conflictKey: 'meter_id,bill_month',
    needsLookup: 'meter',
    previewCols: ['meter_name','bill_month','units_consumed','amount','paid_date'],
    fields: [
      { key:'meter_name',       label:'Meter Name',       type:'text',  required:true, hint:'Must match meter name in app' },
      { key:'bill_month',       label:'Bill Month (YYYY-MM)', type:'month', required:true },
      { key:'units_consumed',   label:'Units Consumed',   type:'int' },
      { key:'amount',           label:'Amount (₹)',       type:'float', required:true },
      { key:'acd_dc_due',       label:'ACD/DC Due',       type:'float' },
      { key:'deposit_amount',   label:'Deposit',          type:'float' },
      { key:'paid_date',        label:'Paid Date',        type:'date' },
      { key:'remarks',          label:'Remarks',          type:'text' },
    ],
    templateRow: { meter_name:'Main Meter', bill_month:'2025-06', units_consumed:'1200', amount:'18500', acd_dc_due:'0', deposit_amount:'0', paid_date:'2025-06-15', remarks:'' }
  },
  {
    id: 'attendance',
    label: 'Attendance Records',
    description: 'Daily attendance P/A/H/WO/OT per employee',
    table: 'attendance_daily',
    conflictKey: 'employee_id,attendance_date',
    needsLookup: 'employee',
    previewCols: ['emp_id','attendance_date','status','ot_hours'],
    fields: [
      { key:'emp_id',           label:'Emp ID',           type:'text', required:true },
      { key:'attendance_date',  label:'Date',             type:'date', required:true },
      { key:'status',           label:'Status (P/A/H/WO/OT)', type:'text', required:true, hint:'P=Present A=Absent H=Half WO=WeekOff OT=Overtime' },
      { key:'ot_hours',         label:'OT Hours',         type:'float' },
      { key:'notes',            label:'Notes',            type:'text' },
    ],
    templateRow: { emp_id:'BPS4001', attendance_date:'01-06-2025', status:'P', ot_hours:'0', notes:'' }
  },
  {
    id: 'grn',
    label: 'GRN / Purchases',
    description: 'Goods Received Notes for feed ingredients',
    table: 'grn',
    conflictKey: 'grn_no',
    previewCols: ['grn_date','ingredient_name','quantity_kg','rate_per_kg','total_amount'],
    fields: [
      { key:'grn_date',         label:'GRN Date',         type:'date',  required:true },
      { key:'grn_no',           label:'GRN / Invoice No', type:'text',  required:true },
      { key:'ingredient_name',  label:'Ingredient Name',  type:'text',  required:true },
      { key:'quantity_kg',      label:'Quantity (kg)',     type:'float', required:true },
      { key:'rate_per_kg',      label:'Rate per kg',      type:'float' },
      { key:'total_amount',     label:'Total Amount',     type:'float' },
      { key:'vehicle_no',       label:'Vehicle No',       type:'text' },
      { key:'party_name',       label:'Party/Supplier',   type:'text' },
      { key:'remarks',          label:'Remarks',          type:'text' },
    ],
    templateRow: { grn_date:'01-06-2025', grn_no:'GRN001', ingredient_name:'Maize', quantity_kg:'10000', rate_per_kg:'21.5', total_amount:'215000', vehicle_no:'AP28XX1234', party_name:'Sai Traders', remarks:'' }
  },
  {
    id: 'flock_transfers',
    label: 'Flock Transfers',
    description: 'Bird movements between sites',
    table: 'flock_transfers',
    needsLookup: 'flock',
    previewCols: ['transfer_date','female_count','male_count','sex_error_female','sold_female'],
    fields: [
      { key:'transfer_date',    label:'Transfer Date',    type:'date',  required:true },
      { key:'from_farm',        label:'From Farm Name',   type:'text' },
      { key:'to_farm',          label:'To Farm Name',     type:'text',  required:true },
      { key:'female_count',     label:'Female Transferred', type:'int' },
      { key:'male_count',       label:'Male Transferred', type:'int' },
      { key:'sex_error_female', label:'Sex Error Female', type:'int' },
      { key:'sex_error_male',   label:'Sex Error Male',   type:'int' },
      { key:'sold_female',      label:'Sold Female',      type:'int' },
      { key:'sold_male',        label:'Sold Male',        type:'int' },
      { key:'notes',            label:'Notes',            type:'text' },
    ],
    templateRow: { transfer_date:'01-06-2025', from_farm:'Kethereddypally', to_farm:'Agraharam', female_count:'8000', male_count:'800', sex_error_female:'50', sex_error_male:'0', sold_female:'0', sold_male:'0', notes:'' }
  },
]

// ── STATUS BADGE ─────────────────────────────────────────────────────────────

const StatusBadge: React.FC<{status:'valid'|'warn'|'error'; text: string}> = ({status,text}) => {
  const cls = status==='valid' ? 'bg-green-100 text-green-700' : status==='warn' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
  const Icon = status==='valid' ? CheckCircle : status==='warn' ? AlertTriangle : XCircle
  return <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${cls}`}><Icon size={11}/>{text}</span>
}

// ── MAIN PAGE ─────────────────────────────────────────────────────────────────

export const ExcelMapperPage: React.FC = () => {
  const [step, setStep] = useState<1|2|3|4>(1)
  const [importType, setImportType] = useState<ImportTypeDef | null>(null)
  const [rawHeaders, setRawHeaders] = useState<string[]>([])
  const [rawRows, setRawRows] = useState<any[][]>([])
  const [mapping, setMapping] = useState<Record<string, string>>({})   // appField → excelCol
  const [lookupId, setLookupId] = useState('')   // flock/meter/employee id for import
  const [previewData, setPreviewData] = useState<{row: any; errors: string[]; warns: string[]}[]>([])
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{success:number;errors:number;messages:string[]} | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // Lookups
  const { data: flocks } = useQuery({ queryKey:['flocks_import'], queryFn: async()=>{ const{data}=await supabase.from('flocks').select('id,flock_no').order('flock_no'); return data??[] } })
  const { data: meters } = useQuery({ queryKey:['meters_import'], queryFn: async()=>{ const{data}=await supabase.from('electricity_meters').select('id,meter_name,usc_no').order('meter_name'); return data??[] } })
  const { data: employees } = useQuery({ queryKey:['employees_import'], queryFn: async()=>{ const{data}=await supabase.from('employees').select('id,emp_id,name').order('name'); return data??[] } })
  const { data: farms } = useQuery({ queryKey:['farms_import'], queryFn: async()=>{ const{data}=await supabase.from('farms').select('id,name,code').order('name'); return data??[] } })
  const { data: ingredients } = useQuery({ queryKey:['ingredients_import'], queryFn: async()=>{ const{data}=await supabase.from('ingredients').select('id,name').order('name'); return data??[] } })

  const empMap = useMemo(()=>{ const m:Record<string,string>={}; for(const e of employees??[]) if(e.emp_id) m[e.emp_id.toLowerCase()]=e.id; return m },[employees])
  const meterMap = useMemo(()=>{ const m:Record<string,string>={}; for(const mt of meters??[]) { m[mt.meter_name?.toLowerCase()]=mt.id; if(mt.usc_no) m[mt.usc_no.toLowerCase()]=mt.id }; return m },[meters])
  const farmMap = useMemo(()=>{ const m:Record<string,string>={}; for(const f of farms??[]) { m[f.name?.toLowerCase()]=f.id; if(f.code) m[f.code.toLowerCase()]=f.id }; return m },[farms])
  const ingMap = useMemo(()=>{ const m:Record<string,string>={}; for(const i of ingredients??[]) { if(i.name) for(const k of [i.name.toLowerCase(),...(i.name.toLowerCase().split(' '))]) m[k]=i.id }; return m },[ingredients])

  // Step 1: Select import type
  const handleTypeSelect = (t: ImportTypeDef) => {
    setImportType(t); setStep(2); setRawHeaders([]); setRawRows([]); setMapping({}); setPreviewData([]); setImportResult(null); setLookupId('')
  }

  // Step 2: Upload and parse file
  const parseAndLoad = useCallback(async (file: File) => {
    if (!importType) return
    try {
      const buf = await file.arrayBuffer()
      const wb = XLSX.read(buf)
      const ws = wb.Sheets[wb.SheetNames[0]]
      const data = XLSX.utils.sheet_to_json<any[]>(ws, { header:1, defval:'' })
      if (data.length < 2) { toast.error('File appears empty'); return }
      const hdrs = (data[0] as any[]).map(h => String(h ?? '').trim())
      const rows = data.slice(1).filter((r:any[]) => r.some(v => v !== '' && v !== null && v !== undefined))
      setRawHeaders(hdrs)
      setRawRows(rows)
      const autoMap: Record<string,string> = {}
      for (const field of importType.fields) {
        const match = hdrs.find(h => fuzzyMatch(h, field.label) || fuzzyMatch(h, field.key))
        if (match) autoMap[field.key] = match
      }
      setMapping(autoMap)
      setStep(3)
      toast.success(`Loaded ${rows.length} rows, ${hdrs.length} columns. Auto-mapped ${Object.keys(autoMap).length} fields.`)
    } catch(err:any) { toast.error('Failed to read file: '+err.message) }
  }, [importType])

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    await parseAndLoad(file)
    if (e.target) e.target.value = ''
  }

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false)
    const file = e.dataTransfer.files?.[0]; if (!file) return
    if (!/\.(xlsx|xls|csv)$/i.test(file.name)) { toast.error('Please drop an Excel (.xlsx/.xls) or CSV file'); return }
    await parseAndLoad(file)
  }, [parseAndLoad])

  // Step 3: Build preview from mapping
  const buildPreview = () => {
    if (!importType) return
    const colIdx = (name: string) => rawHeaders.indexOf(name)
    const get = (row: any[], fieldKey: string) => {
      const col = mapping[fieldKey]
      if (!col) return undefined
      return row[colIdx(col)]
    }

    const result = rawRows.map((row, i) => {
      const errors: string[] = []
      const warns: string[] = []
      const converted: Record<string,any> = {}

      for (const field of importType.fields) {
        const raw = get(row, field.key)
        let val: any = undefined

        if (field.type === 'date') val = parseDate(raw)
        else if (field.type === 'month') {
          // Handle YYYY-MM or parse from date
          if (!raw) val = null
          else {
            const s = String(raw).trim()
            if (/^\d{4}-\d{2}$/.test(s)) val = s
            else { const d = parseDate(raw); val = d ? d.slice(0,7) : null }
          }
        }
        else if (field.type === 'int') val = raw !== '' && raw !== undefined ? int(raw) : null
        else if (field.type === 'float') val = raw !== '' && raw !== undefined ? num(raw) : null
        else val = raw !== undefined ? String(raw).trim() || null : null

        if (field.required && (val === null || val === undefined || val === '')) {
          errors.push(`${field.label} is required (row ${i+1})`)
        }
        converted[field.key] = val
      }

      // Validate status for attendance
      if (importType.id === 'attendance' && converted.status) {
        const s = String(converted.status).toUpperCase()
        if (!['P','A','H','WO','OT'].includes(s)) warns.push(`Status "${converted.status}" is not valid (use P/A/H/WO/OT)`)
        else converted.status = s
      }

      return { row: converted, errors, warns, rawIndex: i }
    })
    setPreviewData(result)
    setStep(4)
  }

  // Step 4: Import to Supabase
  const handleImport = async () => {
    if (!importType) return
    setImporting(true)
    const validRows = previewData.filter(r => r.errors.length === 0)
    let success = 0, errors = 0
    const messages: string[] = []

    try {
      if (importType.id === 'daily_records') {
        const flock = flocks?.find((f:any) => f.id === lookupId)
        if (!flock) { toast.error('Select a flock first'); setImporting(false); return }
        const toInsert = validRows.map(r => ({
          flock_id: lookupId, record_date: r.row.record_date,
          total_eggs: r.row.total_eggs||0, he_eggs: r.row.he_eggs||0,
          he_grade_a: r.row.he_grade_a, he_grade_b: r.row.he_grade_b, he_grade_c: r.row.he_grade_c,
          je_eggs: r.row.je_eggs||0, te_eggs: r.row.te_eggs||0, be_eggs: r.row.be_eggs||0,
          le_eggs: r.row.le_eggs||0, wastage_eggs: r.row.wastage_eggs||0,
          opening_female: r.row.opening_female, opening_male: r.row.opening_male,
          mortality_female: r.row.mortality_female||0, mortality_male: r.row.mortality_male||0,
          transfer_female: r.row.transfer_female||0, transfer_male: r.row.transfer_male||0,
          cull_female: r.row.cull_female||0, cull_male: r.row.cull_male||0,
          trcull_female: (r.row.transfer_female||0) + (r.row.cull_female||0),
          trcull_male: (r.row.transfer_male||0) + (r.row.cull_male||0),
          closing_female: r.row.closing_female, closing_male: r.row.closing_male,
          feed_female_kg: r.row.feed_female_kg||0, feed_male_kg: r.row.feed_male_kg||0,
          lighting_hrs: r.row.lighting_hrs, age_weeks: r.row.age_weeks, remarks: r.row.remarks,
        }))
        for (let i=0;i<toInsert.length;i+=50) {
          const { error } = await supabase.from('daily_records').upsert(toInsert.slice(i,i+50),{onConflict:'flock_id,record_date'})
          if (error) { errors += Math.min(50,toInsert.length-i); messages.push(error.message) }
          else success += Math.min(50,toInsert.length-i)
        }
      }

      else if (importType.id === 'salary') {
        const toInsert = validRows.map(r => {
          const empId = empMap[String(r.row.emp_id||'').toLowerCase()]
          if (!empId) { errors++; messages.push(`Emp ID "${r.row.emp_id}" not found`); return null }
          return {
            employee_id: empId, month: r.row.month+'-01',
            days_worked: r.row.days_worked, basic_salary: r.row.basic_salary,
            hra: r.row.hra||0, arrears: r.row.arrears||0, ot_bonus: r.row.ot_bonus||0,
            gross_salary: r.row.gross_salary, esi_employee: r.row.esi_employee||0,
            esi_employer: r.row.esi_employer||0, pf_employee: r.row.pf_employee||0,
            pf_employer: r.row.pf_employer||0, pt: r.row.pt||0, advance: r.row.advance||0,
            tds: r.row.tds||0, hold: r.row.hold||0, net_salary: r.row.net_salary,
            earned_salary: r.row.gross_salary, payment_mode: r.row.payment_mode||'Cash',
            remarks: r.row.remarks,
          }
        }).filter(Boolean) as any[]
        for (let i=0;i<toInsert.length;i+=50) {
          const { error } = await supabase.from('salary_monthly').upsert(toInsert.slice(i,i+50),{onConflict:'employee_id,month'})
          if (error) { errors++; messages.push(error.message) } else success += Math.min(50,toInsert.length-i)
        }
      }

      else if (importType.id === 'electricity') {
        const toInsert = validRows.map(r => {
          const meterId = meterMap[String(r.row.meter_name||'').toLowerCase()]
          if (!meterId) { errors++; messages.push(`Meter "${r.row.meter_name}" not found`); return null }
          return { meter_id: meterId, bill_month: r.row.bill_month+'-01', units_consumed: r.row.units_consumed, amount: r.row.amount, acd_dc_due: r.row.acd_dc_due||0, deposit_amount: r.row.deposit_amount||0, paid_date: r.row.paid_date||null, remarks: r.row.remarks }
        }).filter(Boolean) as any[]
        for (let i=0;i<toInsert.length;i+=50) {
          const { error } = await supabase.from('electricity_bills').upsert(toInsert.slice(i,i+50),{onConflict:'meter_id,bill_month'})
          if (error) { errors++; messages.push(error.message) } else success += Math.min(50,toInsert.length-i)
        }
      }

      else if (importType.id === 'attendance') {
        const toInsert = validRows.map(r => {
          const empId = empMap[String(r.row.emp_id||'').toLowerCase()]
          if (!empId) { errors++; messages.push(`Emp ID "${r.row.emp_id}" not found`); return null }
          return { employee_id: empId, attendance_date: r.row.attendance_date, status: r.row.status||'P', ot_hours: r.row.ot_hours||0, notes: r.row.notes||null }
        }).filter(Boolean) as any[]
        for (let i=0;i<toInsert.length;i+=100) {
          const { error } = await supabase.from('attendance_daily').upsert(toInsert.slice(i,i+100),{onConflict:'employee_id,attendance_date'})
          if (error) { errors++; messages.push(error.message) } else success += Math.min(100,toInsert.length-i)
        }
      }

      else if (importType.id === 'grn') {
        const toInsert = validRows.map(r => {
          const ingName = String(r.row.ingredient_name||'').toLowerCase()
          const ingId = ingMap[ingName] || Object.entries(ingMap).find(([k])=>ingName.includes(k)||k.includes(ingName))?.[1]
          return { grn_date: r.row.grn_date, grn_no: r.row.grn_no, ingredient_id: ingId||null, item_name: r.row.ingredient_name||null, qty: r.row.quantity_kg||null, price_per_unit: r.row.rate_per_kg||null, total_amount: r.row.total_amount||null, vehicle_no: r.row.vehicle_no||null, remarks: r.row.remarks||null }
        })
        for (let i=0;i<toInsert.length;i+=50) {
          const { error } = await supabase.from('grn').upsert(toInsert.slice(i,i+50),{onConflict:'grn_no',ignoreDuplicates:true})
          if (error) { errors++; messages.push(error.message) } else success += Math.min(50,toInsert.length-i)
        }
      }

      else if (importType.id === 'flock_transfers') {
        if (!lookupId) { toast.error('Select a flock first'); setImporting(false); return }
        const toInsert = validRows.map(r => ({
          flock_id: lookupId,
          transfer_date: r.row.transfer_date,
          from_farm_id: farmMap[String(r.row.from_farm||'').toLowerCase()]||null,
          to_farm_id: farmMap[String(r.row.to_farm||'').toLowerCase()]||null,
          female_count: r.row.female_count||0, male_count: r.row.male_count||0,
          sex_error_female: r.row.sex_error_female||0, sex_error_male: r.row.sex_error_male||0,
          sold_female: r.row.sold_female||0, sold_male: r.row.sold_male||0,
          notes: r.row.notes||null,
        }))
        const { error } = await supabase.from('flock_transfers').insert(toInsert)
        if (error) { errors = toInsert.length; messages.push(error.message) } else success = toInsert.length
      }

      setImportResult({ success, errors, messages })
      if (success > 0) toast.success(`Imported ${success} records successfully`)
      if (errors > 0) toast.error(`${errors} rows had errors`)
    } catch(err:any) {
      toast.error(err.message)
    }
    setImporting(false)
  }

  const downloadTemplate = () => {
    if (!importType) return
    const hdrs = importType.fields.map(f => f.key)
    const row = hdrs.map(k => importType.templateRow[k] ?? '')
    const csv = [hdrs, row].map(r => r.map(v => `"${v}"`).join(',')).join('\n')
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv],{type:'text/csv'}))
    a.download = `${importType.id}_template.csv`; a.click()
  }

  const validCount = previewData.filter(r => r.errors.length === 0).length
  const errorCount = previewData.filter(r => r.errors.length > 0).length
  const warnCount = previewData.filter(r => r.warns.length > 0 && r.errors.length === 0).length

  return (
    <div className="space-y-5">
      <SectionHeader title="Excel → App Converter" subtitle="Upload your Excel, map columns, verify data, then import"/>

      {/* Step indicator */}
      <div className="flex items-center gap-2 text-sm">
        {(['Select Type','Upload File','Map Columns','Verify & Import'] as const).map((label,i) => (
          <React.Fragment key={i}>
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${step===i+1?'bg-brand-600 text-white':step>i+1?'bg-green-100 text-green-700':'bg-gray-100 text-gray-400'}`}>
              {step > i+1 ? <CheckCircle size={13}/> : <span className="text-xs">{i+1}</span>}
              {label}
            </div>
            {i < 3 && <ArrowRight size={14} className="text-gray-300"/>}
          </React.Fragment>
        ))}
      </div>

      {/* STEP 1: Select type */}
      {step === 1 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {IMPORT_TYPES.map(t => (
            <button key={t.id} onClick={() => handleTypeSelect(t)}
              className="text-left p-4 border-2 border-gray-200 rounded-xl hover:border-brand-400 hover:bg-brand-50 transition-all group">
              <div className="flex items-center gap-2 mb-2">
                <FileSpreadsheet size={18} className="text-brand-500"/>
                <span className="font-semibold text-gray-800 group-hover:text-brand-700">{t.label}</span>
              </div>
              <p className="text-xs text-gray-500">{t.description}</p>
            </button>
          ))}
        </div>
      )}

      {/* STEP 2: Upload file */}
      {step === 2 && importType && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button onClick={() => setStep(1)} className="text-sm text-brand-600 hover:underline">← Back</button>
              <span className="text-gray-400">/</span>
              <span className="font-semibold text-gray-800">{importType.label}</span>
            </div>
            <Button variant="outline" size="sm" icon={<Download size={14}/>} onClick={downloadTemplate}>
              Download Template
            </Button>
          </div>

          <Card>
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              className={`flex flex-col items-center justify-center py-14 gap-4 rounded-xl border-2 border-dashed cursor-pointer transition-all
                ${dragOver ? 'border-brand-500 bg-brand-50 scale-[1.01]' : 'border-gray-300 hover:border-brand-400 hover:bg-gray-50'}`}
            >
              <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors ${dragOver ? 'bg-brand-100' : 'bg-brand-50'}`}>
                <Upload size={28} className={dragOver ? 'text-brand-600' : 'text-brand-400'}/>
              </div>
              <div className="text-center pointer-events-none">
                <p className="font-semibold text-gray-800 text-base">
                  {dragOver ? 'Drop it here!' : 'Drag & drop your Excel or CSV file'}
                </p>
                <p className="text-sm text-gray-400 mt-1">or click to browse — .xlsx, .xls, .csv accepted</p>
                <p className="text-xs text-gray-400 mt-0.5">Columns don't have to match — you'll map them in the next step</p>
              </div>
              <Button variant="outline" size="sm" icon={<Upload size={14}/>} onClick={e => { e.stopPropagation(); fileRef.current?.click() }}>
                Browse Files
              </Button>
              <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFile}/>
            </div>

            <div className="border-t border-gray-100 pt-4">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Expected columns (download template above):</p>
              <div className="flex flex-wrap gap-1.5">
                {importType.fields.map(f => (
                  <span key={f.key} className={`text-xs px-2 py-0.5 rounded border ${f.required?'bg-red-50 border-red-200 text-red-600':'bg-gray-50 border-gray-200 text-gray-500'}`}>
                    {f.label}{f.required?' *':''}
                    {f.hint && <span className="text-gray-400 ml-1">({f.hint})</span>}
                  </span>
                ))}
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* STEP 3: Map columns */}
      {step === 3 && importType && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <button onClick={() => setStep(2)} className="text-sm text-brand-600 hover:underline">← Back</button>
              <span className="font-semibold text-gray-800">Map Columns — {rawRows.length} rows loaded</span>
            </div>
            <div className="flex gap-2">
              {(importType.needsLookup === 'flock') && (
                <Select label="" placeholder="— Select Flock —"
                  options={(flocks??[]).map((f:any)=>({value:f.id,label:`F-${f.flock_no}`}))}
                  value={lookupId} onChange={e=>setLookupId(e.target.value)} className="w-40"/>
              )}
              <Button onClick={buildPreview} icon={<RefreshCw size={14}/>}>Preview Mapped Data</Button>
            </div>
          </div>

          <Card>
            <p className="text-sm text-gray-500 mb-4">Match your Excel column (left) to the app field (right). Auto-mapped where names matched.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {importType.fields.map(field => (
                <div key={field.key} className="flex items-center gap-3 p-2 rounded-lg border border-gray-100 hover:border-brand-200 bg-gray-50">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-700 truncate">
                      {field.label}{field.required && <span className="text-red-500 ml-0.5">*</span>}
                    </p>
                    {field.hint && <p className="text-[10px] text-gray-400">{field.hint}</p>}
                  </div>
                  <ArrowRight size={12} className="text-gray-400 shrink-0"/>
                  <select
                    value={mapping[field.key] ?? ''}
                    onChange={e => setMapping(m => ({ ...m, [field.key]: e.target.value }))}
                    className={`flex-1 text-xs border rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-500 ${mapping[field.key] ? 'border-green-400 bg-green-50' : 'border-gray-300 bg-white'}`}>
                    <option value="">— skip —</option>
                    {rawHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                  {mapping[field.key] && <CheckCircle size={13} className="text-green-500 shrink-0"/>}
                </div>
              ))}
            </div>
          </Card>

          {/* Sample of raw data */}
          <Card padding={false}>
            <div className="px-4 py-2 border-b text-xs font-semibold text-gray-500 uppercase">Your file — first 3 rows</div>
            <div className="overflow-x-auto">
              <table className="text-xs w-full">
                <thead><tr>{rawHeaders.map(h=><th key={h} className="px-2 py-1.5 text-left font-medium text-gray-500 bg-gray-50 whitespace-nowrap border-b">{h}</th>)}</tr></thead>
                <tbody>{rawRows.slice(0,3).map((row,i)=><tr key={i} className="border-b">{rawHeaders.map((_,j)=><td key={j} className="px-2 py-1 text-gray-700 whitespace-nowrap">{String(row[j]??'')}</td>)}</tr>)}</tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* STEP 4: Verify & Import */}
      {step === 4 && importType && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <button onClick={() => setStep(3)} className="text-sm text-brand-600 hover:underline">← Back to Mapping</button>
              <span className="font-semibold text-gray-800">Verify Data — {previewData.length} rows</span>
            </div>
            <div className="flex gap-2 items-center">
              {(importType.needsLookup === 'flock') && !lookupId && (
                <Select label="" placeholder="— Select Flock *—"
                  options={(flocks??[]).map((f:any)=>({value:f.id,label:`F-${f.flock_no}`}))}
                  value={lookupId} onChange={e=>setLookupId(e.target.value)} className="w-40"/>
              )}
              <Button loading={importing} onClick={handleImport}
                className={validCount===0?'opacity-50':''}
                disabled={validCount===0}>
                Import {validCount} Valid Rows
              </Button>
            </div>
          </div>

          {/* Summary bar */}
          <div className="flex flex-wrap gap-3">
            <StatusBadge status="valid" text={`${validCount} ready to import`}/>
            {warnCount>0 && <StatusBadge status="warn" text={`${warnCount} with warnings (will import)`}/>}
            {errorCount>0 && <StatusBadge status="error" text={`${errorCount} errors (will be skipped)`}/>}
          </div>

          {/* Import result */}
          {importResult && (
            <div className={`p-4 rounded-lg border ${importResult.errors===0?'bg-green-50 border-green-200':'bg-amber-50 border-amber-200'}`}>
              <p className="font-semibold text-gray-800">Import Complete</p>
              <p className="text-sm mt-1">✅ {importResult.success} records imported · ❌ {importResult.errors} failed</p>
              {importResult.messages.length > 0 && (
                <div className="mt-2 space-y-1">
                  {importResult.messages.slice(0,10).map((m,i) => <p key={i} className="text-xs text-red-600">{m}</p>)}
                </div>
              )}
              <Button variant="outline" size="sm" className="mt-3" onClick={() => { setStep(1); setImportType(null); setPreviewData([]); setImportResult(null) }}>
                Import Another File
              </Button>
            </div>
          )}

          {/* Data preview table */}
          <Card padding={false}>
            <div className="overflow-x-auto">
              <table className="text-xs w-full">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="px-2 py-2 text-left font-semibold text-gray-600">Row</th>
                    <th className="px-2 py-2 text-left font-semibold text-gray-600">Status</th>
                    {importType.previewCols.map(k => (
                      <th key={k} className="px-2 py-2 text-left font-semibold text-gray-600 whitespace-nowrap">
                        {importType.fields.find(f=>f.key===k)?.label ?? k}
                      </th>
                    ))}
                    <th className="px-2 py-2 text-left font-semibold text-gray-600">Issues</th>
                  </tr>
                </thead>
                <tbody>
                  {previewData.slice(0,100).map((item, i) => (
                    <tr key={i} className={`border-b ${item.errors.length>0?'bg-red-50':item.warns.length>0?'bg-amber-50':'hover:bg-gray-50'}`}>
                      <td className="px-2 py-1.5 text-gray-400">{i+1}</td>
                      <td className="px-2 py-1.5">
                        {item.errors.length>0 ? <StatusBadge status="error" text="Error"/> : item.warns.length>0 ? <StatusBadge status="warn" text="Warn"/> : <StatusBadge status="valid" text="OK"/>}
                      </td>
                      {importType.previewCols.map(k => (
                        <td key={k} className="px-2 py-1.5 whitespace-nowrap text-gray-700">
                          {item.row[k] !== null && item.row[k] !== undefined ? String(item.row[k]) : <span className="text-gray-300">—</span>}
                        </td>
                      ))}
                      <td className="px-2 py-1.5 text-xs">
                        {[...item.errors.map(e=><span key={e} className="text-red-500 block">{e}</span>), ...item.warns.map(w=><span key={w} className="text-amber-600 block">{w}</span>)]}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {previewData.length > 100 && <p className="text-xs text-gray-400 px-3 py-2">Showing first 100 of {previewData.length} rows</p>}
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
