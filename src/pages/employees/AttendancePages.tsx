import React, { useState, useMemo, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Card, CardHeader, Button, Select, SectionHeader, Spinner, Table, Th, Td , DateInput, Modal, SearchableSelect } from '@/components/ui'
import toast from 'react-hot-toast'
import { Save, Download, ChevronLeft, ChevronRight, Plus, Trash2, Pencil, Printer } from 'lucide-react'
import { useConfigOptions } from '@/hooks/useConfigOptions'
import { printReport } from '@/lib/invoicePrint'

const CB: React.FC<{ checked: boolean; indeterminate?: boolean; onChange: () => void; disabled?: boolean }> = ({ checked, indeterminate, onChange, disabled }) => {
  const ref = useRef<HTMLInputElement>(null)
  React.useEffect(() => { if (ref.current) ref.current.indeterminate = !!indeterminate }, [indeterminate])
  return <input ref={ref} type="checkbox" checked={checked} onChange={onChange} disabled={disabled} className="rounded border-gray-300 text-brand-600 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50" />
}

function exportCSV(filename: string, headers: string[], rows: (string|number|null|undefined)[][]) {
  const escape = (v: string|number|null|undefined) => `"${String(v??'').replace(/"/g,'""')}"`
  const csv = [headers.map(escape).join(','), ...rows.map(r => r.map(escape).join(','))].join('\n')
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv],{type:'text/csv'}))
  a.download = filename; a.click()
}

// ── helpers ───────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  P:  'bg-green-100 text-green-800 border-green-300',
  A:  'bg-red-100 text-red-800 border-red-300',
  H:  'bg-amber-100 text-amber-800 border-amber-300',
  WO: 'bg-gray-100 text-gray-500 border-gray-200',
  OT: 'bg-blue-100 text-blue-800 border-blue-300',
}
const STATUS_OPTIONS = ['P','A','H','WO','OT']
const STATUS_LABELS: Record<string, string> = { '': 'Not marked', P:'Present', A:'Absent', H:'Half Day', WO:'Week Off', OT:'Full OT Day' }

function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate()
}
function todayStr() { return new Date().toISOString().slice(0,10) }
function inr(n: number) { return '₹' + n.toLocaleString('en-IN') }

// ── DAILY ATTENDANCE ENTRY ────────────────────────────────────────────────────

export const DailyAttendancePage: React.FC = () => {
  const qc = useQueryClient()
  const [date, setDate] = useState(todayStr())
  const [farmId, setFarmId] = useState('')
  const [search, setSearch] = useState('')
  const [genderFilter, setGenderFilter] = useState('')
  const [localStatus, setLocalStatus] = useState<Record<string, string>>({})
  const [localOT, setLocalOT] = useState<Record<string, number>>({})
  const [saving, setSaving] = useState(false)
  const [sel, setSel] = useState<Set<string>>(new Set())
  const [bulkConfirm, setBulkConfirm] = useState(false)

  const { data: farms } = useQuery({
    queryKey: ['farms'],
    queryFn: async () => {
      const { data } = await supabase.from('farms').select('id,name,code').eq('is_active', true).order('name')
      return data ?? []
    }
  })

  const { data: employees } = useQuery({
    queryKey: ['employees_by_farm', farmId],
    queryFn: async () => {
      let q = supabase.from('employees').select('id,name,emp_id,designation,farm_id,gender').eq('is_active', true)
      if (farmId) q = q.eq('farm_id', farmId)
      const { data } = await q.order('emp_id', { ascending: true, nullsFirst: false })
      return data ?? []
    },
    enabled: !!farmId
  })

  // Client-side search + gender filter
  const q = search.trim().toLowerCase()
  const visibleEmployees = (employees ?? []).filter((e: any) => {
    if (q && !(`${e.name ?? ''} ${e.emp_id ?? ''} ${e.designation ?? ''}`.toLowerCase().includes(q))) return false
    if (genderFilter && (e.gender ?? '') !== genderFilter) return false
    return true
  })

  const empIds = employees?.map((e: any) => e.id) ?? []

  // Once an employee's salary for this month has been marked paid
  // (salary_monthly.paid_date), their attendance for that month is locked —
  // editing it after payment would silently disagree with what was actually
  // paid out.
  const monthOfDate = `${date.slice(0, 7)}-01`
  const { data: paidRows } = useQuery({
    queryKey: ['salary_paid_status', monthOfDate, empIds.join(',')],
    queryFn: async () => {
      if (!empIds.length) return []
      const { data } = await supabase.from('salary_monthly').select('employee_id,paid_date').eq('month', monthOfDate).in('employee_id', empIds)
      return data ?? []
    },
    enabled: empIds.length > 0
  })
  const paidEmployeeIds = useMemo(() => new Set((paidRows ?? []).filter((r: any) => !!r.paid_date).map((r: any) => r.employee_id)), [paidRows])

  const { data: existing } = useQuery({
    queryKey: ['attendance_day', date, farmId],
    queryFn: async () => {
      if (!empIds.length) return []
      const { data } = await supabase.from('attendance_daily')
        .select('employee_id, status, ot_hours')
        .in('employee_id', empIds)
        .eq('attendance_date', date)
      return data ?? []
    },
    enabled: empIds.length > 0
  })

  // Merge DB records into localStatus when data loads. Plain/blank by design —
  // an employee with no record stays unmarked (not silently defaulted to
  // Present) until you explicitly click a status or use "Mark all".
  React.useEffect(() => {
    const map: Record<string, string> = {}
    const otMap: Record<string, number> = {}
    for (const r of (existing ?? [])) {
      map[r.employee_id] = r.status
      if (r.ot_hours) otMap[r.employee_id] = r.ot_hours
    }
    setLocalStatus(map)
    setLocalOT(otMap)
  }, [existing, employees])

  const markAll = (status: string) => {
    setLocalStatus(prev => {
      const map = { ...prev }
      for (const e of visibleEmployees) { if (!paidEmployeeIds.has(e.id)) map[e.id] = status }
      return map
    })
  }

  const exportAttendance = () => {
    exportCSV(`attendance_${date}.csv`,
      ['emp_id','name','designation','gender','status','ot_hours'],
      visibleEmployees.map((e:any)=>[
        e.emp_id, e.name, e.designation, e.gender,
        localStatus[e.id] ? (STATUS_LABELS[localStatus[e.id]] ?? localStatus[e.id]) : 'Not marked',
        localOT[e.id] ?? 0,
      ])
    )
  }

  const printAttendance = () => {
    printReport({
      title: 'Daily Attendance', subtitle: date,
      headers: ['Emp ID','Name','Designation','Gender','Status','OT Hours'],
      rows: visibleEmployees.map((e:any)=>[
        e.emp_id, e.name, e.designation, e.gender,
        localStatus[e.id] ? (STATUS_LABELS[localStatus[e.id]] ?? localStatus[e.id]) : 'Not marked',
        localOT[e.id] ?? 0,
      ]),
      rightAlignFrom: 5,
    })
  }

  const saveAll = async () => {
    if (!employees?.length) return
    if (date > todayStr()) { toast.error("Can't save attendance for a future date"); return }
    // Plain by design — only employees you explicitly marked get written.
    // Anyone left blank is skipped entirely, not silently saved as Present.
    // Employees already paid for this month are excluded even if somehow
    // still marked — attendance for a paid month is locked.
    const markedAll = employees.filter((e: any) => !!localStatus[e.id])
    const marked = markedAll.filter((e: any) => !paidEmployeeIds.has(e.id))
    const skippedPaid = markedAll.length - marked.length
    if (!marked.length) { toast.error(skippedPaid ? 'All marked employees are already paid for this month — locked' : 'Mark at least one employee before saving'); return }
    setSaving(true)
    try {
      if (skippedPaid) toast(`${skippedPaid} employee(s) skipped — salary already paid for this month`, { icon: '🔒' })
      const rows = marked.map((e: any) => ({
        employee_id: e.id,
        farm_id: farmId || e.farm_id,
        attendance_date: date,
        status: localStatus[e.id],
        ot_hours: localOT[e.id] ?? 0,
      }))
      const { error } = await supabase.from('attendance_daily').upsert(rows, { onConflict: 'employee_id,attendance_date' })
      if (error) throw error
      toast.success(`Attendance saved for ${rows.length} of ${employees.length} employees`)
      qc.invalidateQueries({ queryKey: ['attendance_day'] })
      qc.invalidateQueries({ queryKey: ['attendance_month'] })
      qc.invalidateQueries({ queryKey: ['monthly_att_grid'] })
      qc.invalidateQueries({ queryKey: ['bulk_daily_att'] })
    } catch (e: any) {
      toast.error(e.message)
    }
    setSaving(false)
  }

  const delMut = useMutation({
    mutationFn: async (empIds: string[]) => {
      // Delete attendance_daily records for the selected employees on this date
      const { error } = await supabase.from('attendance_daily')
        .delete()
        .in('employee_id', empIds)
        .eq('attendance_date', date)
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Attendance deleted')
      setSel(new Set()); setBulkConfirm(false)
      qc.invalidateQueries({ queryKey: ['attendance_day'] })
      qc.invalidateQueries({ queryKey: ['attendance_month'] })
      qc.invalidateQueries({ queryKey: ['monthly_att_grid'] })
      qc.invalidateQueries({ queryKey: ['bulk_daily_att'] })
    },
    onError: (e: any) => toast.error(e.message)
  })

  const visIds = visibleEmployees.map((e: any) => e.id)
  const allSel = visIds.length > 0 && visIds.every((id: string) => sel.has(id))
  const someSel = visIds.some((id: string) => sel.has(id)) && !allSel
  const toggle = (id: string) => setSel(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n })
  const toggleAll = () => setSel(allSel ? new Set() : new Set(visIds))

  const farmOptions = (farms ?? []).map((f: any) => ({ value: f.id, label: f.name }))
  const counts = useMemo(() => {
    const c = { P: 0, A: 0, H: 0, WO: 0, OT: 0 }
    for (const s of Object.values(localStatus)) c[s as keyof typeof c] = (c[s as keyof typeof c] ?? 0) + 1
    return c
  }, [localStatus])

  return (
    <div className="space-y-5">
      <SectionHeader title="Daily Attendance" subtitle="Mark attendance site-wise for a date" />

      <div className="flex flex-wrap gap-3 items-end">
        <SearchableSelect label="Site" required placeholder="— Select Site —" options={farmOptions}
          value={farmId} onChange={v => setFarmId(v)} className="w-56" />
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Date</label>
          <DateInput value={date} onChange={e => setDate(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>
        {farmId && <>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Search</label>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Name, ID…"
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-44 focus:outline-none focus:ring-1 focus:ring-brand-400"/>
          </div>
          <Select label="Gender" placeholder="All" options={[{value:'Male',label:'Male'},{value:'Female',label:'Female'},{value:'Other',label:'Other'}]}
            value={genderFilter} onChange={e=>setGenderFilter(e.target.value)} className="w-32" />
          <Button variant="outline" size="sm" icon={<Download size={14}/>} onClick={exportAttendance}>Export</Button>
          <Button variant="outline" size="sm" icon={<Printer size={14}/>} onClick={printAttendance}>Print</Button>
        </>}
      </div>

      {farmId && employees && employees.length > 0 && (
        <>
          {/* Summary bar */}
          <div className="flex flex-wrap gap-2">
            {STATUS_OPTIONS.map(s => (
              <span key={s} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${STATUS_COLORS[s]}`}>
                {STATUS_LABELS[s]}: {counts[s as keyof typeof counts]}
              </span>
            ))}
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border bg-yellow-50 text-yellow-700 border-yellow-200">
              Not marked: {employees.length - Object.keys(localStatus).length}
            </span>
          </div>

          {/* Bulk mark buttons */}
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-gray-500 self-center">Mark all:</span>
            {STATUS_OPTIONS.map(s => (
              <button key={s} onClick={() => markAll(s)}
                className={`text-xs px-3 py-1.5 rounded-lg border font-medium ${STATUS_COLORS[s]} hover:opacity-80 transition`}>
                All {STATUS_LABELS[s]}
              </button>
            ))}
          </div>

          {sel.size > 0 && (
            <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
              <span className="text-sm font-medium text-red-700">{sel.size} selected</span>
              <button onClick={() => setSel(new Set())} className="text-xs text-gray-500 hover:text-gray-700 underline">Clear</button>
              <div className="ml-auto">
                <Button size="sm" variant="danger" icon={<Trash2 size={14}/>} onClick={() => setBulkConfirm(true)}>Delete Selected ({sel.size})</Button>
              </div>
            </div>
          )}

          <Card padding={false}>
            <Table>
              <thead>
                <tr>
                  <Th><CB checked={allSel} indeterminate={someSel} onChange={toggleAll} /></Th>
                  <Th>Employee</Th>
                  <Th>Emp ID</Th>
                  <Th>Designation</Th>
                  {STATUS_OPTIONS.map(s => <Th key={s}>{s}</Th>)}
                  <Th>OT Hrs</Th>
                </tr>
              </thead>
              <tbody>
                {visibleEmployees.map((e: any) => {
                  const cur = localStatus[e.id] ?? ''
                  const otVal = localOT[e.id] ?? 0
                  const isPaid = paidEmployeeIds.has(e.id)
                  return (
                    <tr key={e.id} className={`hover:bg-gray-50 ${isPaid ? 'opacity-60' : ''} ${sel.has(e.id) ? 'bg-blue-50' : cur === 'A' ? 'bg-red-50' : cur === 'H' ? 'bg-amber-50' : !cur ? 'bg-yellow-50/40' : ''}`}>
                      <Td><CB checked={sel.has(e.id)} onChange={() => toggle(e.id)} disabled={isPaid} /></Td>
                      <Td className="font-medium">{e.name} {isPaid && <span title="Salary already paid for this month — attendance locked" className="ml-1 text-xs text-amber-600">🔒</span>}</Td>
                      <Td className="text-gray-500 text-xs">{e.emp_id ?? '—'}</Td>
                      <Td className="text-gray-500 text-xs">{e.designation ?? '—'}</Td>
                      {STATUS_OPTIONS.map(s => (
                        <Td key={s}>
                          <button disabled={isPaid} onClick={() => setLocalStatus(prev => ({ ...prev, [e.id]: s }))}
                            className={`w-9 h-8 rounded-lg border text-xs font-bold transition-all ${isPaid ? 'cursor-not-allowed' : ''} ${cur === s ? STATUS_COLORS[s] + ' ring-2 ring-offset-1 ring-current' : 'bg-white text-gray-400 border-gray-200 hover:border-gray-400'}`}>
                            {s}
                          </button>
                        </Td>
                      ))}
                      <Td>
                        <input type="number" min="0" max="12" step="0.5"
                          value={otVal || ''}
                          placeholder="0"
                          disabled={isPaid}
                          onChange={e2 => setLocalOT(prev => ({ ...prev, [e.id]: parseFloat(e2.target.value) || 0 }))}
                          className="w-14 border border-gray-300 rounded px-2 py-1 text-xs text-center focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
                          title="Overtime hours (in addition to status)"
                        />
                      </Td>
                    </tr>
                  )
                })}
              </tbody>
            </Table>
          </Card>

          <Button onClick={saveAll} loading={saving} size="lg" className="w-full sm:w-auto">
            <Save size={16} className="mr-2" />Save Attendance ({employees.length} employees)
          </Button>
        </>
      )}

      {farmId && !employees?.length && (
        <Card><div className="p-8 text-center text-gray-400">No employees found for this site</div></Card>
      )}
      {!farmId && (
        <Card><div className="p-8 text-center text-gray-400">Select a site to begin entering attendance</div></Card>
      )}

      <Modal open={bulkConfirm} onClose={() => setBulkConfirm(false)} title="Confirm Delete" size="sm"
        footer={<><Button variant="secondary" onClick={() => setBulkConfirm(false)}>Cancel</Button>
          <Button variant="danger" loading={delMut.isPending} onClick={() => delMut.mutate([...sel])}>
            Delete {sel.size} record{sel.size > 1 ? 's' : ''}
          </Button></>}>
        <p className="text-sm text-gray-700">Delete attendance records for <strong>{sel.size} selected employee{sel.size > 1 ? 's' : ''}</strong> on <strong>{date}</strong>? This cannot be undone.</p>
      </Modal>
    </div>
  )
}

// ── MONTH ATTENDANCE VIEW ─────────────────────────────────────────────────────

export const MonthAttendancePage: React.FC = () => {
  const qc = useQueryClient()
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth() + 1)
  const [farmId, setFarmId] = useState('')
  const [sel, setSel] = useState<Set<string>>(new Set())
  const [bulkConfirm, setBulkConfirm] = useState(false)

  const { data: farms } = useQuery({
    queryKey: ['farms'],
    queryFn: async () => {
      const { data } = await supabase.from('farms').select('id,name,code').eq('is_active', true).order('name')
      return data ?? []
    }
  })

  const monthStr = `${year}-${String(month).padStart(2, '0')}`
  const numDays = daysInMonth(year, month)
  const days = Array.from({ length: numDays }, (_, i) => i + 1)

  const { data: employees } = useQuery({
    queryKey: ['employees_by_farm', farmId],
    queryFn: async () => {
      let q = supabase.from('employees').select('id,name,emp_id,farm_id')
      if (farmId) q = q.eq('farm_id', farmId)
      const { data } = await q.order('emp_id', { ascending: true, nullsFirst: false })
      return data ?? []
    },
    enabled: !!farmId
  })

  const empIds = employees?.map((e: any) => e.id) ?? []

  const { data: attData, isLoading } = useQuery({
    queryKey: ['attendance_month', monthStr, farmId],
    queryFn: async () => {
      if (!empIds.length) return []
      const start = `${monthStr}-01`
      const end = `${monthStr}-${String(numDays).padStart(2, '0')}`
      const { data } = await supabase.from('attendance_daily')
        .select('employee_id, attendance_date, status, ot_hours')
        .in('employee_id', empIds)
        .gte('attendance_date', start)
        .lte('attendance_date', end)
      return data ?? []
    },
    enabled: empIds.length > 0
  })

  // Build: empId → { dayNo → status }
  const attMap = useMemo(() => {
    const m: Record<string, Record<number, string>> = {}
    for (const r of (attData ?? [])) {
      const day = parseInt(r.attendance_date.slice(8, 10))
      if (!m[r.employee_id]) m[r.employee_id] = {}
      m[r.employee_id][day] = r.status
    }
    return m
  }, [attData])

  const calcDays = (empId: string) => {
    const emp = attMap[empId] ?? {}
    return Object.values(emp).reduce((s, st) => s + (st === 'P' ? 1 : st === 'H' ? 0.5 : st === 'OT' ? 1 : 0), 0)
  }

  const prevMonth = () => { if (month === 1) { setMonth(12); setYear(y => y - 1) } else setMonth(m => m - 1) }
  const nextMonth = () => { if (month === 12) { setMonth(1); setYear(y => y + 1) } else setMonth(m => m + 1) }

  const delMut = useMutation({
    mutationFn: async (selEmpIds: string[]) => {
      // Delete attendance_daily records for selected employees across the displayed month
      const start = `${monthStr}-01`
      const end = `${monthStr}-${String(numDays).padStart(2, '0')}`
      const { error } = await supabase.from('attendance_daily')
        .delete()
        .in('employee_id', selEmpIds)
        .gte('attendance_date', start)
        .lte('attendance_date', end)
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Attendance deleted')
      setSel(new Set()); setBulkConfirm(false)
      qc.invalidateQueries({ queryKey: ['attendance_month'] })
      qc.invalidateQueries({ queryKey: ['attendance_day'] })
      qc.invalidateQueries({ queryKey: ['monthly_att_grid'] })
      qc.invalidateQueries({ queryKey: ['bulk_daily_att'] })
    },
    onError: (e: any) => toast.error(e.message)
  })

  const empRowIds = (employees ?? []).map((e: any) => e.id)
  const allSel = empRowIds.length > 0 && empRowIds.every((id: string) => sel.has(id))
  const someSel = empRowIds.some((id: string) => sel.has(id)) && !allSel
  const toggle = (id: string) => setSel(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n })
  const toggleAll = () => setSel(allSel ? new Set() : new Set(empRowIds))

  const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const farmOptions = (farms ?? []).map((f: any) => ({ value: f.id, label: f.name }))

  const handleExport = () => {
    if (!employees?.length) return
    exportCSV(`attendance_${monthStr}.csv`,
      ['Employee', 'Emp ID', ...days.map(d => String(d)), 'Total Days'],
      (employees ?? []).map((e: any) => [
        e.name, e.emp_id ?? '',
        ...days.map(d => attMap[e.id]?.[d] ?? ''),
        calcDays(e.id)
      ])
    )
  }

  const handlePrint = () => {
    if (!employees?.length) return
    printReport({
      title: 'Month Attendance', subtitle: monthStr,
      headers: ['Employee', 'Emp ID', ...days.map(d => String(d)), 'Total Days'],
      rows: (employees ?? []).map((e: any) => [
        e.name, e.emp_id ?? '',
        ...days.map(d => attMap[e.id]?.[d] ?? ''),
        calcDays(e.id)
      ]),
      rightAlignFrom: 2,
    })
  }

  return (
    <div className="space-y-5">
      <SectionHeader title="Month Attendance" subtitle="Day-wise grid per employee"
        action={<div className="flex gap-2">
          <Button variant="outline" icon={<Download size={14} />} onClick={handleExport}>Export CSV</Button>
          <Button variant="outline" icon={<Printer size={14} />} onClick={handlePrint}>Print</Button>
        </div>} />

      <div className="flex flex-wrap gap-3 items-end">
        <SearchableSelect label="Site" required placeholder="— Select Site —" options={farmOptions}
          value={farmId} onChange={v => setFarmId(v)} className="w-56" />
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="p-2 border rounded-lg hover:bg-gray-50"><ChevronLeft size={16} /></button>
          <span className="font-semibold text-gray-800 w-28 text-center">{MONTH_NAMES[month - 1]} {year}</span>
          <button onClick={nextMonth} className="p-2 border rounded-lg hover:bg-gray-50"><ChevronRight size={16} /></button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2">
        {STATUS_OPTIONS.map(s => (
          <span key={s} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${STATUS_COLORS[s]}`}>
            {s} = {STATUS_LABELS[s]}
          </span>
        ))}
      </div>

      {farmId && sel.size > 0 && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
          <span className="text-sm font-medium text-red-700">{sel.size} selected</span>
          <button onClick={() => setSel(new Set())} className="text-xs text-gray-500 hover:text-gray-700 underline">Clear</button>
          <div className="ml-auto">
            <Button size="sm" variant="danger" icon={<Trash2 size={14}/>} onClick={() => setBulkConfirm(true)}>Delete Selected ({sel.size})</Button>
          </div>
        </div>
      )}

      {farmId && (isLoading ? <Spinner /> : (
        <div className="overflow-x-auto">
          <Card padding={false}>
            <table className="min-w-full text-xs">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="sticky left-0 bg-gray-50 px-2 py-2 text-center"><CB checked={allSel} indeterminate={someSel} onChange={toggleAll} /></th>
                  <th className="bg-gray-50 px-3 py-2 text-left font-semibold text-gray-700 min-w-[140px]">Employee</th>
                  {days.map(d => (
                    <th key={d} className="px-1 py-2 text-center font-medium text-gray-600 w-8 min-w-[28px]">{d}</th>
                  ))}
                  <th className="px-3 py-2 text-center font-semibold text-gray-700 min-w-[60px]">Days</th>
                </tr>
              </thead>
              <tbody>
                {(employees ?? []).map((e: any) => {
                  const totalDays = calcDays(e.id)
                  return (
                    <tr key={e.id} className={`border-b hover:bg-gray-50 ${sel.has(e.id) ? 'bg-blue-50' : ''}`}>
                      <td className="sticky left-0 bg-inherit px-2 py-1.5 text-center border-r"><CB checked={sel.has(e.id)} onChange={() => toggle(e.id)} /></td>
                      <td className="bg-inherit px-3 py-1.5 font-medium text-gray-900 border-r">
                        <div>{e.name}</div>
                        <div className="text-gray-400 text-[10px]">{e.emp_id}</div>
                      </td>
                      {days.map(d => {
                        const s = attMap[e.id]?.[d]
                        return (
                          <td key={d} className="px-0.5 py-1 text-center">
                            {s ? (
                              <span className={`inline-flex items-center justify-center w-6 h-6 rounded text-[10px] font-bold border ${STATUS_COLORS[s]}`}>{s}</span>
                            ) : (
                              <span className="inline-flex items-center justify-center w-6 h-6 text-gray-200">—</span>
                            )}
                          </td>
                        )
                      })}
                      <td className="px-3 py-1.5 text-center font-bold text-gray-900">
                        {totalDays > 0 ? totalDays : <span className="text-gray-300">0</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </Card>
        </div>
      ))}

      {!farmId && (
        <Card><div className="p-8 text-center text-gray-400">Select a site to view attendance</div></Card>
      )}

      <Modal open={bulkConfirm} onClose={() => setBulkConfirm(false)} title="Confirm Delete" size="sm"
        footer={<><Button variant="secondary" onClick={() => setBulkConfirm(false)}>Cancel</Button>
          <Button variant="danger" loading={delMut.isPending} onClick={() => delMut.mutate([...sel])}>
            Delete {sel.size} employee{sel.size > 1 ? 's' : ''}
          </Button></>}>
        <p className="text-sm text-gray-700">Delete all attendance records for <strong>{sel.size} selected employee{sel.size > 1 ? 's' : ''}</strong> in <strong>{MONTH_NAMES[month - 1]} {year}</strong>? This cannot be undone.</p>
      </Modal>
    </div>
  )
}

// ── EMPLOYEE ADVANCES ─────────────────────────────────────────────────────────

const ADVANCE_TYPES_FB = [
  { value: 'cash', label: 'Cash Advance' },
  { value: 'egg', label: 'Egg Advance (eggs given)' },
  { value: 'other', label: 'Other Deduction' },
]

const EMPTY_FORM = {
  employee_id: '', farm_id: '', advance_date: todayStr(),
  advance_type: 'cash', amount: '', egg_qty: '', egg_rate: '', narration: '', salary_month: '',
  payment_mode: 'Cash', bank_account_id: '',
}

export const EmployeeAdvancesPage: React.FC = () => {
  const qc = useQueryClient()
  const ADVANCE_TYPES = useConfigOptions('advance_type', ADVANCE_TYPES_FB)
  const today = new Date()
  const curMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
  const [farmId, setFarmId] = useState('')
  const [filterMonth, setFilterMonth] = useState(curMonth)
  const [form, setForm] = useState({ ...EMPTY_FORM, salary_month: curMonth })
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [sel, setSel] = useState<Set<string>>(new Set())
  const [bulkConfirm, setBulkConfirm] = useState(false)
  const s = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const { data: farms } = useQuery({
    queryKey: ['farms'],
    queryFn: async () => {
      const { data } = await supabase.from('farms').select('id,name,code').eq('is_active', true).order('name')
      return data ?? []
    }
  })

  const { data: bankAccounts } = useQuery({
    queryKey: ['bank_accounts'],
    queryFn: async () => { const { data } = await supabase.from('bank_accounts').select('id,bank_name,account_name').eq('is_active', true).order('bank_name'); return data ?? [] }
  })

  const { data: employees } = useQuery({
    queryKey: ['employees_by_farm', farmId],
    queryFn: async () => {
      let q = supabase.from('employees').select('id,name,emp_id,farm_id')
      if (farmId) q = q.eq('farm_id', farmId)
      const { data } = await q.order('emp_id', { ascending: true, nullsFirst: false })
      return data ?? []
    }
  })

  const { data: advances, isLoading } = useQuery({
    queryKey: ['employee_advances', filterMonth, farmId],
    queryFn: async () => {
      let q = supabase.from('employee_advances')
        .select('*, employees(name, emp_id, farm_id, farms(name))')
        .eq('salary_month', filterMonth)
        .order('advance_date', { ascending: false })
      if (farmId) q = q.eq('farm_id', farmId)
      const { data } = await q
      return data ?? []
    }
  })

  // Auto-calc amount for egg advance
  React.useEffect(() => {
    if (form.advance_type === 'egg' && form.egg_qty && form.egg_rate) {
      s('amount', String(parseFloat(form.egg_qty) * parseFloat(form.egg_rate)))
    }
  }, [form.egg_qty, form.egg_rate, form.advance_type])

  const addMut = useMutation({
    mutationFn: async () => {
      if (!form.employee_id) throw new Error('Select an employee')
      if (!form.amount || parseFloat(form.amount) <= 0) throw new Error('Enter a valid amount')
      if (form.advance_type === 'cash' && form.payment_mode === 'Bank' && !form.bank_account_id) {
        throw new Error('Select a Bank Account for a bank-paid advance, or it won\'t be recorded in any ledger')
      }
      const emp = (employees ?? []).find((e: any) => e.id === form.employee_id)
      const advFarmId = farmId || emp?.farm_id || null
      const amount = parseFloat(form.amount)
      const payload: any = {
        employee_id: form.employee_id,
        farm_id: advFarmId,
        advance_date: form.advance_date,
        advance_type: form.advance_type,
        amount,
        egg_qty: form.advance_type === 'egg' ? parseInt(form.egg_qty) || null : null,
        egg_rate: form.advance_type === 'egg' ? parseFloat(form.egg_rate) || null : null,
        narration: form.narration || null,
        salary_month: form.salary_month || null,
        payment_mode: form.advance_type === 'cash' ? form.payment_mode : null,
        bank_account_id: form.advance_type === 'cash' && form.payment_mode === 'Bank' ? form.bank_account_id : null,
      }

      // Delete any previously-linked cash_book/bank_transactions row before
      // re-inserting — same delete-then-reinsert pattern used everywhere
      // else in the app so editing/re-saving never duplicates the ledger entry.
      if (editing) {
        if (editing.cash_book_id) await supabase.from('cash_book').delete().eq('id', editing.cash_book_id)
        if (editing.bank_txn_id) await supabase.from('bank_transactions').delete().eq('id', editing.bank_txn_id)
        payload.cash_book_id = null
        payload.bank_txn_id = null
      }

      // Cash/bank advances are money actually leaving — post to Cash Book
      // or Bank Ledger so it shows up there, not just in this table.
      if (form.advance_type === 'cash') {
        const empName = emp?.name ?? 'Employee'
        if (form.payment_mode === 'Bank') {
          const { data: txn, error: txnErr } = await supabase.from('bank_transactions').insert({
            bank_account_id: form.bank_account_id, txn_date: form.advance_date, txn_type: 'Debit',
            category: 'Employee Advance', amount,
            description: `Advance to ${empName}${form.narration ? ' — ' + form.narration : ''}`,
          }).select('id').single()
          if (txnErr) throw txnErr
          payload.bank_txn_id = txn.id
        } else {
          const { data: cb, error: cbErr } = await supabase.from('cash_book').insert({
            txn_date: form.advance_date, txn_type: 'payment', category: 'advance',
            farm_id: advFarmId, description: `Advance to ${empName}${form.narration ? ' — ' + form.narration : ''}`,
            party_name: empName, amount_out: amount, payment_mode: 'cash',
          }).select('id').single()
          if (cbErr) throw cbErr
          payload.cash_book_id = cb.id
        }
      }

      if (editing) {
        const { error } = await supabase.from('employee_advances').update(payload).eq('id', editing.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('employee_advances').insert(payload)
        if (error) throw error
      }
    },
    onSuccess: () => {
      toast.success(editing ? 'Advance updated' : 'Advance recorded')
      qc.invalidateQueries({ queryKey: ['employee_advances'] })
      qc.invalidateQueries({ queryKey: ['cash_book'] })
      qc.invalidateQueries({ queryKey: ['bank_transactions'] })
      setForm({ ...EMPTY_FORM, salary_month: curMonth })
      setEditing(null)
      setShowForm(false)
    },
    onError: (e: any) => toast.error(e.message)
  })

  const openEdit = (r: any) => {
    setEditing(r)
    setForm({
      employee_id: r.employee_id, farm_id: r.farm_id ?? '', advance_date: r.advance_date,
      advance_type: r.advance_type, amount: String(r.amount ?? ''),
      egg_qty: r.egg_qty != null ? String(r.egg_qty) : '', egg_rate: r.egg_rate != null ? String(r.egg_rate) : '',
      narration: r.narration ?? '', salary_month: r.salary_month ?? '',
      payment_mode: r.payment_mode ?? 'Cash', bank_account_id: r.bank_account_id ?? '',
    })
    setShowForm(true)
  }

  const delMut = useMutation({
    mutationFn: async (ids: string[]) => {
      const { data: rows } = await supabase.from('employee_advances').select('id,cash_book_id,bank_txn_id').in('id', ids)
      const cbIds = (rows ?? []).map((r: any) => r.cash_book_id).filter(Boolean)
      const btIds = (rows ?? []).map((r: any) => r.bank_txn_id).filter(Boolean)
      if (cbIds.length) await supabase.from('cash_book').delete().in('id', cbIds)
      if (btIds.length) await supabase.from('bank_transactions').delete().in('id', btIds)
      const { error } = await supabase.from('employee_advances').delete().in('id', ids)
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Deleted')
      qc.invalidateQueries({ queryKey: ['employee_advances'] })
      qc.invalidateQueries({ queryKey: ['cash_book'] })
      qc.invalidateQueries({ queryKey: ['bank_transactions'] })
      setSel(new Set()); setBulkConfirm(false)
    },
    onError: (e: any) => toast.error(e.message)
  })

  const advIds = (advances ?? []).map((r: any) => r.id)
  const allSel = advIds.length > 0 && advIds.every((id: string) => sel.has(id))
  const someSel = advIds.some((id: string) => sel.has(id)) && !allSel
  const toggle = (id: string) => setSel(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n })
  const toggleAll = () => setSel(allSel ? new Set() : new Set(advIds))

  const farmOptions = (farms ?? []).map((f: any) => ({ value: f.id, label: f.name }))
  const empOptions = (employees ?? []).map((e: any) => ({ value: e.id, label: `${e.name}${e.emp_id ? ' ('+e.emp_id+')' : ''}` }))

  const totalAdv = (advances ?? []).reduce((s: number, r: any) => s + (r.amount ?? 0), 0)

  // Month options — current FY
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1)
    const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    return { value: val, label: d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) }
  })

  return (
    <div className="space-y-5">
      <SectionHeader title="Employee Advances" subtitle="Cash, egg, and other advances deducted from salary"
        action={<Button size="sm" onClick={() => { if (showForm) { setEditing(null); setForm({ ...EMPTY_FORM, salary_month: curMonth }) }; setShowForm(v => !v) }}><Plus size={14} className="mr-1" />{showForm ? 'Cancel' : 'Add Advance'}</Button>} />

      {showForm && (
        <Card>
          <CardHeader title={editing ? 'Edit Advance' : 'New Advance'} />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <SearchableSelect label="Site Filter" placeholder="All Sites" options={farmOptions} value={farmId} onChange={v => { setFarmId(v); s('employee_id', '') }} />
            <SearchableSelect label="Employee *" placeholder="— Select —" options={empOptions} value={form.employee_id} onChange={v => s('employee_id', v)} />
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Date *</label>
              <DateInput value={form.advance_date} onChange={e => s('advance_date', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <Select label="Type" options={ADVANCE_TYPES} value={form.advance_type} onChange={e => s('advance_type', e.target.value)} />
            {form.advance_type === 'egg' ? (
              <>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Egg Qty</label>
                  <input type="number" value={form.egg_qty} onChange={e => s('egg_qty', e.target.value)} placeholder="Number of eggs"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Rate per egg (₹)</label>
                  <input type="number" value={form.egg_rate} onChange={e => s('egg_rate', e.target.value)} placeholder="e.g. 6.50"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                </div>
              </>
            ) : null}
            {form.advance_type === 'cash' && (
              <>
                <Select label="Payment Mode" options={[{value:'Cash',label:'Cash'},{value:'Bank',label:'Bank'}]}
                  value={form.payment_mode} onChange={e => s('payment_mode', e.target.value)} />
                {form.payment_mode === 'Bank' && (
                  <Select label="Bank Account" placeholder="— Select —"
                    options={(bankAccounts ?? []).map((b: any) => ({ value: b.id, label: `${b.bank_name}${b.account_name ? ' — '+b.account_name : ''}` }))}
                    value={form.bank_account_id} onChange={e => s('bank_account_id', e.target.value)} />
                )}
              </>
            )}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Amount (₹) *</label>
              <input type="number" value={form.amount} onChange={e => s('amount', e.target.value)} placeholder="0.00"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
              {form.advance_type === 'egg' && form.egg_qty && form.egg_rate && (
                <p className="text-xs text-green-600 mt-1">Auto: {form.egg_qty} × ₹{form.egg_rate} = ₹{(parseFloat(form.egg_qty) * parseFloat(form.egg_rate)).toFixed(2)}</p>
              )}
            </div>
            <Select label="Deduct from Month" options={monthOptions} value={form.salary_month} onChange={e => s('salary_month', e.target.value)} />
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Narration</label>
              <input type="text" value={form.narration} onChange={e => s('narration', e.target.value)} placeholder="Reason / description"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Button onClick={() => addMut.mutate()} loading={addMut.isPending}>{editing ? 'Update Advance' : 'Save Advance'}</Button>
            <Button variant="secondary" onClick={() => { setEditing(null); setForm({ ...EMPTY_FORM, salary_month: curMonth }); setShowForm(false) }}>Cancel</Button>
          </div>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end">
        <SearchableSelect label="Site" placeholder="All Sites" options={farmOptions} value={farmId} onChange={v => setFarmId(v)} className="w-48" />
        <Select label="Month" options={monthOptions} value={filterMonth} onChange={e => setFilterMonth(e.target.value)} className="w-48" />
      </div>

      {/* Summary */}
      {advances && advances.length > 0 && (
        <div className="flex gap-4">
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <p className="text-xs text-red-600">Total Advances</p>
            <p className="text-lg font-bold text-red-700">{inr(totalAdv)}</p>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
            <p className="text-xs text-gray-500">Records</p>
            <p className="text-lg font-bold text-gray-700">{advances.length}</p>
          </div>
        </div>
      )}

      {/* Bulk bar */}
      {sel.size > 0 && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
          <span className="text-sm font-medium text-red-700">{sel.size} selected</span>
          <button onClick={() => setSel(new Set())} className="text-xs text-gray-500 hover:text-gray-700 underline">Clear</button>
          <div className="ml-auto">
            <Button size="sm" variant="danger" icon={<Trash2 size={14}/>} onClick={() => setBulkConfirm(true)}>Delete Selected ({sel.size})</Button>
          </div>
        </div>
      )}

      {isLoading ? <Spinner /> : (
        <Card padding={false}>
          <Table>
            <thead>
              <tr>
                <Th><CB checked={allSel} indeterminate={someSel} onChange={toggleAll} /></Th>
                <Th>Date</Th>
                <Th>Employee</Th>
                <Th>Site</Th>
                <Th>Type</Th>
                <Th>Details</Th>
                <Th>Amount</Th>
                <Th>Salary Month</Th>
                <Th></Th>
              </tr>
            </thead>
            <tbody>
              {(advances ?? []).map((r: any) => (
                <tr key={r.id} className={`hover:bg-gray-50 ${sel.has(r.id) ? 'bg-blue-50' : ''}`}>
                  <Td><CB checked={sel.has(r.id)} onChange={() => toggle(r.id)} /></Td>
                  <Td className="text-sm">{r.advance_date}</Td>
                  <Td>
                    <div className="font-medium">{r.employees?.name}</div>
                    <div className="text-xs text-gray-400">{r.employees?.emp_id}</div>
                  </Td>
                  <Td className="text-sm text-gray-500">{r.employees?.farms?.name ?? '—'}</Td>
                  <Td>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${r.advance_type === 'cash' ? 'bg-blue-100 text-blue-700' : r.advance_type === 'egg' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>
                      {r.advance_type === 'cash' ? 'Cash' : r.advance_type === 'egg' ? 'Egg' : 'Other'}
                    </span>
                  </Td>
                  <Td className="text-xs text-gray-500">
                    {r.advance_type === 'egg' && r.egg_qty ? `${r.egg_qty} eggs × ₹${r.egg_rate}` : r.narration ?? '—'}
                  </Td>
                  <Td className="font-semibold text-red-700">{inr(r.amount)}</Td>
                  <Td className="text-xs text-gray-500">{r.salary_month ?? '—'}</Td>
                  <Td>
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(r)}
                        className="text-gray-400 hover:text-brand-600 p-1"><Pencil size={14} /></button>
                      <button onClick={() => { setSel(new Set([r.id])); setBulkConfirm(true) }}
                        className="text-red-400 hover:text-red-600 p-1"><Trash2 size={14} /></button>
                    </div>
                  </Td>
                </tr>
              ))}
              {(advances ?? []).length === 0 && (
                <tr><td colSpan={9} className="text-center text-gray-400 py-8">No advances recorded for this period</td></tr>
              )}
            </tbody>
          </Table>
        </Card>
      )}

      <Modal open={bulkConfirm} onClose={() => setBulkConfirm(false)} title="Confirm Delete" size="sm"
        footer={<><Button variant="secondary" onClick={() => setBulkConfirm(false)}>Cancel</Button>
          <Button variant="danger" loading={delMut.isPending} onClick={() => delMut.mutate([...sel])}>
            Delete {sel.size} advance{sel.size > 1 ? 's' : ''}
          </Button></>}>
        <p className="text-sm text-gray-700">Delete <strong>{sel.size} selected advance{sel.size > 1 ? 's' : ''}</strong>? This cannot be undone.</p>
      </Modal>
    </div>
  )
}

// ── MONTHLY ATTENDANCE GRID ───────────────────────────────────────────────────
// One page, all employees as rows, all days as columns. Mark P/A/H/WO/OT per cell.
// OT cells show an hours input. Save → writes attendance_daily + updates salary_monthly.

// Cycle starts and ends on '' (unmarked) — plain by design, nothing defaults
// to Present. Click through: unmarked -> P -> A -> H -> WO -> OT -> unmarked.
const STATUS_CYCLE: Record<string, string> = { '': 'P', P:'A', A:'H', H:'WO', WO:'OT', OT:'' }
const STATUS_SHORT: Record<string, string>  = { '': '—', P:'P', A:'A', H:'H', WO:'WO', OT:'OT' }
const CELL_COLORS: Record<string, string> = {
  '': 'bg-white text-gray-300 border border-dashed border-gray-200',
  P:  'bg-green-100 text-green-800',
  A:  'bg-red-100 text-red-700',
  H:  'bg-amber-100 text-amber-700',
  WO: 'bg-gray-100 text-gray-400',
  OT: 'bg-blue-100 text-blue-700',
}
const DAY_NAMES = ['Su','Mo','Tu','We','Th','Fr','Sa']
const MONTH_NAMES_FULL = ['January','February','March','April','May','June','July','August','September','October','November','December']

type CellKey = string  // `${empId}_${day}`

function computeAbsentDays(empId: string, days: number, grid: Record<CellKey, string>): number {
  let absent = 0
  for (let d = 1; d <= days; d++) {
    const s = grid[`${empId}_${d}`] ?? ''
    if (s === 'A') absent += 1
    else if (s === 'H') absent += 0.5
  }
  return absent
}

export const MonthlyAttendanceGridPage: React.FC = () => {
  const qc = useQueryClient()
  const now = new Date()
  const [month, setMonth] = useState(`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`)
  const [farmId, setFarmId] = useState('')
  const [grid, setGrid] = useState<Record<CellKey, string>>({})       // empId_day → status
  const [otHours, setOtHours] = useState<Record<CellKey, string>>({}) // empId_day → hours
  const [dirtyKeys, setDirtyKeys] = useState<Set<string>>(new Set())  // cells clicked locally, not yet saved
  const [saving, setSaving] = useState(false)
  const [loaded, setLoaded] = useState('')  // tracks which month+farm combo is loaded

  const [yr, mn] = month.split('-').map(Number)
  const totalDays = new Date(yr, mn, 0).getDate()
  const monthDate = `${month}-01`
  const days = Array.from({ length: totalDays }, (_, i) => i + 1)
  // Future days (later than today) must never default to Present — that made
  // an unstarted month look "fully marked P" and would write fabricated
  // attendance for days that haven't happened yet.
  const todayDateStr = todayStr()
  const isFutureDay = (d: number) => `${month}-${String(d).padStart(2, '0')}` > todayDateStr

  // Day-of-week labels for header
  const dayLabels = days.map(d => {
    const dow = new Date(yr, mn - 1, d).getDay()
    return { d, dow, label: DAY_NAMES[dow], isSun: dow === 0 }
  })

  const { data: farms = [] } = useQuery({
    queryKey: ['farms'],
    queryFn: async () => {
      const { data } = await supabase.from('farms').select('id,name,code').eq('is_active', true).order('name')
      return data ?? []
    }
  })

  const { data: employees = [], isLoading: empLoading } = useQuery({
    queryKey: ['employees_att_grid', farmId, month],
    queryFn: async () => {
      const start = `${month}-01`
      const end   = `${month}-${String(totalDays).padStart(2,'0')}`
      // Currently-active employees always qualify. A resigned/deactivated
      // employee also qualifies for any month they actually worked in
      // (joining_date on/before month-end AND leaving_date on/after
      // month-start, or no leaving_date recorded) — otherwise viewing a past
      // month for someone who has since left silently dropped their row
      // (and real attendance_daily/salary data with it) even though it's
      // still in the database.
      let q = supabase.from('employees')
        .select('id,emp_id,name,designation,farm_id,farms(name),is_active,joining_date,leaving_date')
        .or(`is_active.eq.true,and(joining_date.lte.${end},or(leaving_date.is.null,leaving_date.gte.${start}))`)
        .order('emp_id', { ascending: true, nullsFirst: false })
      if (farmId) q = q.eq('farm_id', farmId)
      const { data } = await q
      return data ?? []
    }
  })

  // Once an employee's salary for this month has been marked paid
  // (salary_monthly.paid_date), their attendance for the whole month is
  // locked — editing it after payment would silently disagree with what was
  // actually paid out.
  const { data: paidRows } = useQuery({
    queryKey: ['salary_paid_status_grid', monthDate, (employees as any[]).map(e => e.id).join(',')],
    queryFn: async () => {
      const empIds = (employees as any[]).map(e => e.id)
      if (!empIds.length) return []
      const { data } = await supabase.from('salary_monthly').select('employee_id,paid_date').eq('month', monthDate).in('employee_id', empIds)
      return data ?? []
    },
    enabled: (employees as any[]).length > 0
  })
  const paidEmployeeIds = useMemo(() => new Set((paidRows ?? []).filter((r: any) => !!r.paid_date).map((r: any) => r.employee_id)), [paidRows])

  // Load existing attendance for the month
  const { data: existingAtt, isLoading: attLoading, refetch: refetchAtt } = useQuery({
    queryKey: ['monthly_att_grid', month, farmId],
    queryFn: async () => {
      const start = `${month}-01`
      const end   = `${month}-${String(totalDays).padStart(2,'0')}`
      let q = supabase.from('attendance_daily')
        .select('employee_id,attendance_date,status,ot_hours')
        .gte('attendance_date', start).lte('attendance_date', end)
      if (farmId) {
        const empIds = (employees as any[]).map(e => e.id)
        if (empIds.length) q = q.in('employee_id', empIds)
      }
      const { data } = await q
      return data ?? []
    },
    enabled: (employees as any[]).length > 0,
  })

  // When attendance loads, populate the grid. A fresh month/farm switch fully
  // rebuilds the grid from the server. Once loaded for that month/farm, later
  // refetches (e.g. someone marked a day via Daily Attendance, or another
  // tab/session saved this same month) still need to reach this grid — so
  // merge in server values for every cell EXCEPT ones with an unsaved local
  // click (tracked in dirtyKeys), instead of ignoring the refetch entirely.
  React.useEffect(() => {
    const key = `${month}_${farmId}`
    if (!existingAtt) return
    const isFreshLoad = loaded !== key
    setGrid(g => {
      const next = isFreshLoad ? {} : { ...g }
      for (const r of existingAtt as any[]) {
        const d = parseInt(r.attendance_date.slice(8, 10))
        const cellKey = `${r.employee_id}_${d}`
        if (!isFreshLoad && dirtyKeys.has(cellKey)) continue
        next[cellKey] = r.status
      }
      return next
    })
    setOtHours(h => {
      const next = isFreshLoad ? {} : { ...h }
      for (const r of existingAtt as any[]) {
        const d = parseInt(r.attendance_date.slice(8, 10))
        const cellKey = `${r.employee_id}_${d}`
        if (!isFreshLoad && dirtyKeys.has(cellKey)) continue
        if (r.status === 'OT' && r.ot_hours) next[cellKey] = String(r.ot_hours)
      }
      return next
    })
    if (isFreshLoad) setDirtyKeys(new Set())
    setLoaded(key)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingAtt, month, farmId])

  // Reset loaded when month/farm changes so grid reloads
  React.useEffect(() => { setLoaded('') }, [month, farmId])

  const toggleCell = (empId: string, day: number) => {
    if (isFutureDay(day)) return
    if (paidEmployeeIds.has(empId)) { toast.error('Salary already paid for this month — attendance locked'); return }
    const key = `${empId}_${day}`
    const cur = grid[key] ?? ''
    const next = STATUS_CYCLE[cur] ?? 'P'
    setGrid(g => ({ ...g, [key]: next }))
    setDirtyKeys(s => new Set(s).add(key))
    if (next !== 'OT') setOtHours(h => { const n = { ...h }; delete n[key]; return n })
  }

  const setOT = (empId: string, day: number, val: string) => {
    if (paidEmployeeIds.has(empId)) return
    setDirtyKeys(s => new Set(s).add(`${empId}_${day}`))
    setOtHours(h => ({ ...h, [`${empId}_${day}`]: val }))
  }

  const handleSave = async () => {
    if (!(employees as any[]).length) { toast.error('No employees loaded'); return }
    setSaving(true)
    try {
      // Build upsert rows for attendance_daily — plain by design: only cells
      // you actually clicked get written. Blank/unmarked cells are skipped
      // entirely, never fabricated as Present.
      const rows: any[] = []
      for (const emp of employees as any[]) {
        if (paidEmployeeIds.has(emp.id)) continue  // salary already paid this month — locked
        for (const d of days) {
          if (isFutureDay(d)) continue  // never fabricate attendance for days that haven't happened
          const key = `${emp.id}_${d}`
          const status = grid[key]
          if (!status) continue  // unmarked — skip, don't default to Present
          const dateStr = `${month}-${String(d).padStart(2,'0')}`
          rows.push({
            employee_id: emp.id,
            farm_id: emp.farm_id ?? null,
            attendance_date: dateStr,
            status,
            ot_hours: status === 'OT' ? (parseFloat(otHours[key] ?? '0') || 0) : 0,
          })
        }
      }
      if (!rows.length) { toast.error('Mark at least one day before saving'); setSaving(false); return }

      // Upsert in batches of 500
      for (let i = 0; i < rows.length; i += 500) {
        const { error } = await supabase.from('attendance_daily')
          .upsert(rows.slice(i, i + 500), { onConflict: 'employee_id,attendance_date' })
        if (error) throw error
      }

      // Auto-update salary_monthly absent days for each employee — skip
      // anyone already paid this month, so a paid salary_monthly row is
      // never silently recomputed out from under an already-issued payment.
      const pastDays = days.filter(d => !isFutureDay(d))
      const salaryRows = (employees as any[]).filter(emp => !paidEmployeeIds.has(emp.id)).map(emp => {
        const absentDays = computeAbsentDays(emp.id, totalDays, grid)
        const presentDays = pastDays.filter(d => {
          const s = grid[`${emp.id}_${d}`] ?? ''
          return s === 'P' || s === 'OT'
        }).length
        const halfDays = pastDays.filter(d => (grid[`${emp.id}_${d}`] ?? '') === 'H').length
        const woDays   = pastDays.filter(d => (grid[`${emp.id}_${d}`] ?? '') === 'WO').length
        const otDays   = pastDays.filter(d => (grid[`${emp.id}_${d}`] ?? '') === 'OT').length
        const totalOtHrs = pastDays.reduce((s, d) => s + (parseFloat(otHours[`${emp.id}_${d}`] ?? '0') || 0), 0)
        return {
          employee_id: emp.id,
          month: monthDate,
          absent_days: absentDays,
          month_days: totalDays,
          present_days: presentDays,
          half_days: halfDays,
          wo_days: woDays,
          ot_days: otDays,
          ot_hours: totalOtHrs,
          // Attendance Register (and Salary Abstract/Payslip) read
          // days_worked specifically, not present_days — previously only
          // Bulk Salary/Salary Entry ever set it, so saving real attendance
          // here never reached those pages until Bulk Salary was re-run
          // (and if that run skipped its own attendance auto-fill step,
          // days_worked silently defaulted to the full month). Keep it in
          // sync here too, same P/OT=1, H=0.5 convention used everywhere else.
          days_worked: presentDays + halfDays * 0.5,
        }
      })

      const { error: salErr } = await supabase.from('salary_monthly')
        .upsert(salaryRows, { onConflict: 'employee_id,month', ignoreDuplicates: false })
      if (salErr) throw salErr

      // Clear dirty tracking BEFORE refetching — the merge effect keys off
      // dirtyKeys at the moment the refetch's data lands, so clearing after
      // await refetchAtt() left the just-saved cells marked dirty and the
      // merge skipped them, showing stale values even though the save
      // succeeded (confirmed correct in DB / other pages the whole time).
      setDirtyKeys(new Set())
      await refetchAtt()
      qc.invalidateQueries({ queryKey: ['bulk_salary'] })
      qc.invalidateQueries({ queryKey: ['bulk_daily_att'] })
      qc.invalidateQueries({ queryKey: ['attendance_day'] })
      qc.invalidateQueries({ queryKey: ['attendance_month'] })
      qc.invalidateQueries({ queryKey: ['attendance_fy'] })  // Attendance Register reads days_worked from salary_monthly
      toast.success(`Attendance saved for ${(employees as any[]).length} employees · ${monthDate}`)
    } catch (e: any) {
      toast.error(e.message)
    }
    setSaving(false)
  }

  const farmOptions = [
    { value: '', label: '— All Sites —' },
    ...(farms as any[]).map((f: any) => ({ value: f.id, label: f.name }))
  ]

  const isLoading = empLoading || attLoading

  // Per-employee summary counts
  const summary = React.useMemo(() => {
    const out: Record<string, Record<string, number>> = {}
    for (const emp of employees as any[]) {
      const counts: Record<string, number> = { P: 0, A: 0, H: 0, WO: 0, OT: 0, '': 0, ot_hrs: 0 }
      for (const d of days) {
        if (isFutureDay(d)) continue
        const key = `${emp.id}_${d}`
        const s = grid[key] ?? ''
        counts[s] = (counts[s] ?? 0) + 1
        if (s === 'OT') counts.ot_hrs += parseFloat(otHours[key] ?? '0') || 0
      }
      out[emp.id] = counts
    }
    return out
  }, [grid, otHours, employees, days, todayDateStr])

  const monthLabel = `${MONTH_NAMES_FULL[mn - 1]} ${yr}`

  return (
    <div className="p-3 space-y-3">
      <SectionHeader
        title="Monthly Attendance"
        subtitle={`Mark attendance for all employees — saves to daily records and updates salary`}
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => {
              const g = { ...grid }
              for (const emp of employees as any[]) {
                for (const d of days) {
                  if (isFutureDay(d)) continue
                  const key = `${emp.id}_${d}`
                  if (!g[key]) g[key] = 'P'
                }
              }
              setGrid(g)
              toast.success('Filled all unmarked days with Present — review exceptions, then Save')
            }} disabled={!(employees as any[]).length}>
              Fill unmarked as Present
            </Button>
            <Button onClick={handleSave} loading={saving} disabled={!(employees as any[]).length}>
              <Save size={15} className="mr-1"/> Save Attendance
            </Button>
          </div>
        }
      />

      {/* Controls */}
      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Month</label>
          <input type="month" value={month} onChange={e => { setMonth(e.target.value) }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"/>
        </div>
        <div className="w-48">
          <SearchableSelect options={farmOptions} value={farmId} onChange={v => setFarmId(v)}/>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-3 flex-wrap text-xs">
        {Object.entries(CELL_COLORS).map(([s, cls]) => (
          <span key={s} className={`px-2 py-0.5 rounded font-semibold ${cls}`}>
            {s} — {STATUS_LABELS[s] ?? s}
          </span>
        ))}
        <span className="text-gray-400 ml-2">Click a cell to cycle: P → A → H → WO → OT → P</span>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner size={32}/></div>
      ) : !(employees as any[]).length ? (
        <div className="text-center text-gray-400 py-12">No employees found{farmId ? ' for this site' : ''}</div>
      ) : (
        <div className="overflow-auto max-h-[72vh] rounded-xl border border-gray-200 shadow-sm">
          <table className="min-w-full text-xs border-collapse">
            <thead>
              {/* Day-of-week row — frozen to the top (like Excel freeze panes) so the
                  dates stay visible while scrolling through a long employee list.
                  The "#"/"Employee" corner cells freeze to BOTH top and left. */}
              <tr className="bg-gray-50">
                <th className="sticky left-0 top-0 z-30 bg-gray-50 border-b border-r border-gray-200 px-2 py-1 text-left w-8">#</th>
                <th className="sticky left-8 top-0 z-30 bg-gray-50 border-b border-r border-gray-200 px-3 py-1 text-left min-w-[140px]">Employee</th>
                {dayLabels.map(({ d, label, isSun }) => (
                  <th key={d} className={`sticky top-0 z-20 border-b border-r border-gray-200 px-1 py-1 text-center w-9 ${isSun ? 'bg-red-50 text-red-400' : 'bg-gray-50 text-gray-400'}`}>
                    <div>{label}</div>
                    <div className="font-bold text-gray-700">{d}</div>
                  </th>
                ))}
                <th className="sticky top-0 z-20 border-b border-r border-gray-200 px-1 py-1 text-center bg-green-50 text-green-700 w-8">P</th>
                <th className="sticky top-0 z-20 border-b border-r border-gray-200 px-1 py-1 text-center bg-red-50 text-red-600 w-8">A</th>
                <th className="sticky top-0 z-20 border-b border-r border-gray-200 px-1 py-1 text-center bg-amber-50 text-amber-600 w-8">H</th>
                <th className="sticky top-0 z-20 border-b border-r border-gray-200 px-1 py-1 text-center bg-gray-50 text-gray-500 w-9">WO</th>
                <th className="sticky top-0 z-20 border-b border-r border-gray-200 px-1 py-1 text-center bg-blue-50 text-blue-600 w-8">OT</th>
                <th className="sticky top-0 z-20 border-b border-r border-gray-200 px-1 py-1 text-center bg-yellow-50 text-yellow-700 w-9">—</th>
                <th className="sticky top-0 z-20 border-b border-gray-200 px-1 py-1 text-center bg-blue-50 text-blue-500 w-12">OT Hrs</th>
              </tr>
            </thead>
            <tbody>
              {(employees as any[]).map((emp: any, idx: number) => {
                const s = summary[emp.id] ?? {}
                const isPaid = paidEmployeeIds.has(emp.id)
                return (
                  <tr key={emp.id} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} ${isPaid ? 'opacity-60' : ''}`}>
                    <td className="sticky left-0 z-10 bg-inherit border-b border-r border-gray-100 px-2 py-1 text-gray-400 font-mono">{idx+1}</td>
                    <td className="sticky left-8 z-10 bg-inherit border-b border-r border-gray-100 px-2 py-1 min-w-[140px]">
                      <div className="font-semibold text-gray-800 truncate">{emp.name} {isPaid && <span title="Salary already paid for this month — attendance locked" className="text-amber-600">🔒</span>}</div>
                      <div className="text-gray-400">{emp.emp_id ?? ''} {emp.designation ? `· ${emp.designation}` : ''}</div>
                    </td>
                    {dayLabels.map(({ d, isSun }) => {
                      const key = `${emp.id}_${d}`
                      const future = isFutureDay(d)
                      const status = future ? '' : (grid[key] ?? '')
                      const isOT = status === 'OT'
                      return (
                        <td key={d} className={`border-b border-r border-gray-100 p-0 text-center ${isSun ? 'bg-red-50/30' : ''}`}>
                          <button
                            onClick={() => toggleCell(emp.id, d)}
                            disabled={future || isPaid}
                            title={isPaid ? 'Salary already paid for this month — attendance locked' : future ? 'Future date — not yet marked' : STATUS_LABELS[status]}
                            className={`w-full h-full min-h-[36px] flex flex-col items-center justify-center gap-0.5 font-bold transition-colors ${(future || isPaid) ? 'bg-gray-50 text-gray-300 cursor-not-allowed' : CELL_COLORS[status]}`}
                          >
                            <span>{future ? '—' : STATUS_SHORT[status]}</span>
                          </button>
                          {isOT && (
                            <input
                              type="number" min={0} max={12} step={0.5}
                              value={otHours[key] ?? ''}
                              onChange={e => setOT(emp.id, d, e.target.value)}
                              onClick={e => e.stopPropagation()}
                              placeholder="h"
                              className="w-full border-t border-blue-200 bg-blue-50 text-blue-700 text-center text-xs px-0 py-0.5 focus:outline-none"
                            />
                          )}
                        </td>
                      )
                    })}
                    {/* Summary */}
                    <td className="border-b border-r border-gray-100 text-center font-bold text-green-700 bg-green-50/40">{s.P ?? 0}</td>
                    <td className="border-b border-r border-gray-100 text-center font-bold text-red-600 bg-red-50/40">{s.A ?? 0}</td>
                    <td className="border-b border-r border-gray-100 text-center font-bold text-amber-600 bg-amber-50/40">{s.H ?? 0}</td>
                    <td className="border-b border-r border-gray-100 text-center text-gray-500 bg-gray-50/60">{s.WO ?? 0}</td>
                    <td className="border-b border-r border-gray-100 text-center font-bold text-blue-600 bg-blue-50/40">{s.OT ?? 0}</td>
                    <td className="border-b border-r border-gray-100 text-center font-semibold text-yellow-700 bg-yellow-50/50">{s[''] ?? 0}</td>
                    <td className="border-b border-gray-100 text-center text-blue-500 bg-blue-50/40">{s.ot_hrs > 0 ? s.ot_hrs.toFixed(1) : '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-gray-400">
        Plain by design — click a cell to mark it (unmarked → P → A → H → WO → OT → unmarked). Only cells you mark are saved to <strong>attendance_daily</strong>; unmarked days are skipped, never saved as Present automatically. Saving also updates absent/present days in <strong>salary_monthly</strong> for {monthLabel}.
      </p>
    </div>
  )
}
