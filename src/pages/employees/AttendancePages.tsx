import React, { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Card, CardHeader, Button, Select, SectionHeader, Spinner, Table, Th, Td } from '@/components/ui'
import toast from 'react-hot-toast'
import { Save, Download, ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react'

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
const STATUS_LABELS: Record<string, string> = { P:'Present', A:'Absent', H:'Half Day', WO:'Week Off', OT:'Full OT Day' }

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
  const [localStatus, setLocalStatus] = useState<Record<string, string>>({})
  const [localOT, setLocalOT] = useState<Record<string, number>>({})
  const [saving, setSaving] = useState(false)

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
      let q = supabase.from('employees').select('id,name,emp_id,designation,farm_id')
      if (farmId) q = q.eq('farm_id', farmId)
      const { data } = await q.order('name')
      return data ?? []
    },
    enabled: !!farmId
  })

  const empIds = employees?.map((e: any) => e.id) ?? []

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

  // Merge DB records into localStatus when data loads
  React.useEffect(() => {
    const map: Record<string, string> = {}
    const otMap: Record<string, number> = {}
    for (const r of (existing ?? [])) {
      map[r.employee_id] = r.status
      if (r.ot_hours) otMap[r.employee_id] = r.ot_hours
    }
    // Default to 'P' for any employee without a record
    for (const e of (employees ?? [])) {
      if (!map[e.id]) map[e.id] = 'P'
    }
    setLocalStatus(map)
    setLocalOT(otMap)
  }, [existing, employees])

  const markAll = (status: string) => {
    const map: Record<string, string> = {}
    for (const e of (employees ?? [])) map[e.id] = status
    setLocalStatus(map)
  }

  const saveAll = async () => {
    if (!employees?.length) return
    setSaving(true)
    try {
      const rows = employees.map((e: any) => ({
        employee_id: e.id,
        farm_id: farmId || e.farm_id,
        attendance_date: date,
        status: localStatus[e.id] ?? 'P',
        ot_hours: localOT[e.id] ?? 0,
      }))
      const { error } = await supabase.from('attendance_daily').upsert(rows, { onConflict: 'employee_id,attendance_date' })
      if (error) throw error
      toast.success(`Attendance saved for ${rows.length} employees`)
      qc.invalidateQueries({ queryKey: ['attendance_day'] })
      qc.invalidateQueries({ queryKey: ['attendance_month'] })
    } catch (e: any) {
      toast.error(e.message)
    }
    setSaving(false)
  }

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
        <Select label="Site" required placeholder="— Select Site —" options={farmOptions}
          value={farmId} onChange={e => setFarmId(e.target.value)} className="w-56" />
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Date</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>
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

          <Card padding={false}>
            <Table>
              <thead>
                <tr>
                  <Th>Employee</Th>
                  <Th>Emp ID</Th>
                  <Th>Designation</Th>
                  {STATUS_OPTIONS.map(s => <Th key={s}>{s}</Th>)}
                  <Th>OT Hrs</Th>
                </tr>
              </thead>
              <tbody>
                {employees.map((e: any) => {
                  const cur = localStatus[e.id] ?? 'P'
                  const otVal = localOT[e.id] ?? 0
                  return (
                    <tr key={e.id} className={`hover:bg-gray-50 ${cur === 'A' ? 'bg-red-50' : cur === 'H' ? 'bg-amber-50' : ''}`}>
                      <Td className="font-medium">{e.name}</Td>
                      <Td className="text-gray-500 text-xs">{e.emp_id ?? '—'}</Td>
                      <Td className="text-gray-500 text-xs">{e.designation ?? '—'}</Td>
                      {STATUS_OPTIONS.map(s => (
                        <Td key={s}>
                          <button onClick={() => setLocalStatus(prev => ({ ...prev, [e.id]: s }))}
                            className={`w-9 h-8 rounded-lg border text-xs font-bold transition-all ${cur === s ? STATUS_COLORS[s] + ' ring-2 ring-offset-1 ring-current' : 'bg-white text-gray-400 border-gray-200 hover:border-gray-400'}`}>
                            {s}
                          </button>
                        </Td>
                      ))}
                      <Td>
                        <input type="number" min="0" max="12" step="0.5"
                          value={otVal || ''}
                          placeholder="0"
                          onChange={e2 => setLocalOT(prev => ({ ...prev, [e.id]: parseFloat(e2.target.value) || 0 }))}
                          className="w-14 border border-gray-300 rounded px-2 py-1 text-xs text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
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
    </div>
  )
}

// ── MONTH ATTENDANCE VIEW ─────────────────────────────────────────────────────

export const MonthAttendancePage: React.FC = () => {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth() + 1)
  const [farmId, setFarmId] = useState('')

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
      const { data } = await q.order('name')
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

  return (
    <div className="space-y-5">
      <SectionHeader title="Month Attendance" subtitle="Day-wise grid per employee"
        action={<Button variant="outline" icon={<Download size={14} />} onClick={handleExport}>Export CSV</Button>} />

      <div className="flex flex-wrap gap-3 items-end">
        <Select label="Site" required placeholder="— Select Site —" options={farmOptions}
          value={farmId} onChange={e => setFarmId(e.target.value)} className="w-56" />
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

      {farmId && (isLoading ? <Spinner /> : (
        <div className="overflow-x-auto">
          <Card padding={false}>
            <table className="min-w-full text-xs">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="sticky left-0 bg-gray-50 px-3 py-2 text-left font-semibold text-gray-700 min-w-[140px]">Employee</th>
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
                    <tr key={e.id} className="border-b hover:bg-gray-50">
                      <td className="sticky left-0 bg-white px-3 py-1.5 font-medium text-gray-900 border-r">
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
    </div>
  )
}

// ── EMPLOYEE ADVANCES ─────────────────────────────────────────────────────────

const ADVANCE_TYPES = [
  { value: 'cash', label: 'Cash Advance' },
  { value: 'egg', label: 'Egg Advance (eggs given)' },
  { value: 'other', label: 'Other Deduction' },
]

const EMPTY_FORM = {
  employee_id: '', farm_id: '', advance_date: todayStr(),
  advance_type: 'cash', amount: '', egg_qty: '', egg_rate: '', narration: '', salary_month: ''
}

export const EmployeeAdvancesPage: React.FC = () => {
  const qc = useQueryClient()
  const today = new Date()
  const curMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
  const [farmId, setFarmId] = useState('')
  const [filterMonth, setFilterMonth] = useState(curMonth)
  const [form, setForm] = useState({ ...EMPTY_FORM, salary_month: curMonth })
  const [showForm, setShowForm] = useState(false)
  const s = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

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
      let q = supabase.from('employees').select('id,name,emp_id,farm_id')
      if (farmId) q = q.eq('farm_id', farmId)
      const { data } = await q.order('name')
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
      const emp = (employees ?? []).find((e: any) => e.id === form.employee_id)
      const { error } = await supabase.from('employee_advances').insert({
        employee_id: form.employee_id,
        farm_id: farmId || emp?.farm_id || null,
        advance_date: form.advance_date,
        advance_type: form.advance_type,
        amount: parseFloat(form.amount),
        egg_qty: form.advance_type === 'egg' ? parseInt(form.egg_qty) || null : null,
        egg_rate: form.advance_type === 'egg' ? parseFloat(form.egg_rate) || null : null,
        narration: form.narration || null,
        salary_month: form.salary_month || null,
      })
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Advance recorded')
      qc.invalidateQueries({ queryKey: ['employee_advances'] })
      setForm({ ...EMPTY_FORM, salary_month: curMonth })
      setShowForm(false)
    },
    onError: (e: any) => toast.error(e.message)
  })

  const delMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('employee_advances').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => { toast.success('Deleted'); qc.invalidateQueries({ queryKey: ['employee_advances'] }) },
    onError: (e: any) => toast.error(e.message)
  })

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
        action={<Button size="sm" onClick={() => setShowForm(v => !v)}><Plus size={14} className="mr-1" />{showForm ? 'Cancel' : 'Add Advance'}</Button>} />

      {showForm && (
        <Card>
          <CardHeader title="New Advance" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Select label="Site Filter" placeholder="All Sites" options={farmOptions} value={farmId} onChange={e => { setFarmId(e.target.value); s('employee_id', '') }} />
            <Select label="Employee *" placeholder="— Select —" options={empOptions} value={form.employee_id} onChange={e => s('employee_id', e.target.value)} />
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Date *</label>
              <input type="date" value={form.advance_date} onChange={e => s('advance_date', e.target.value)}
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
            <Button onClick={() => addMut.mutate()} loading={addMut.isPending}>Save Advance</Button>
            <Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end">
        <Select label="Site" placeholder="All Sites" options={farmOptions} value={farmId} onChange={e => setFarmId(e.target.value)} className="w-48" />
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

      {isLoading ? <Spinner /> : (
        <Card padding={false}>
          <Table>
            <thead>
              <tr>
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
                <tr key={r.id} className="hover:bg-gray-50">
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
                    <button onClick={() => { if (confirm('Delete this advance?')) delMut.mutate(r.id) }}
                      className="text-red-400 hover:text-red-600 p-1"><Trash2 size={14} /></button>
                  </Td>
                </tr>
              ))}
              {(advances ?? []).length === 0 && (
                <tr><td colSpan={8} className="text-center text-gray-400 py-8">No advances recorded for this period</td></tr>
              )}
            </tbody>
          </Table>
        </Card>
      )}
    </div>
  )
}
