import React, { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { fmtDate, today } from '@/lib/utils'
import { parseFile, downloadXlsxTemplate } from '@/lib/parseFile'
import {
  Card, Button, Input, Select, FormRow, Table, Th, Td, Badge,
  SectionHeader, Spinner, EmptyState
, DateInput } from '@/components/ui'
import { Plus, Pencil, Trash2, AlertTriangle, CheckCircle, Download, Upload, FileDown, CalendarClock } from 'lucide-react'
import toast from 'react-hot-toast'
import { useConfigOptions } from '@/hooks/useConfigOptions'

const ConfirmBulkDelete: React.FC<{ label: string; onConfirm: () => void; onCancel: () => void }> = ({ label, onConfirm, onCancel }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
    <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full mx-4">
      <p className="text-gray-800 font-semibold mb-1">Confirm Delete</p>
      <p className="text-sm text-gray-600 mb-5">{label}</p>
      <div className="flex gap-3 justify-end">
        <button onClick={onCancel} className="px-4 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-50">Cancel</button>
        <button onClick={onConfirm} className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700">Delete</button>
      </div>
    </div>
  </div>
)

const ROUTES_FB = [
  { value: 'drinking_water', label: 'Drinking Water' },
  { value: 'eye_drop',       label: 'Eye Drop' },
  { value: 'injection',      label: 'Injection' },
  { value: 'spray',          label: 'Spray' },
]

const CB: React.FC<{ checked: boolean; indeterminate?: boolean; onChange: () => void }> = ({ checked, indeterminate, onChange }) => {
  const ref = React.useRef<HTMLInputElement>(null)
  React.useEffect(() => { if (ref.current) ref.current.indeterminate = !!indeterminate }, [indeterminate])
  return <input ref={ref} type="checkbox" checked={checked} onChange={onChange} className="rounded border-gray-300 text-brand-600 cursor-pointer" />
}

// Parses the Vaccination Schedule's free-text "Age" column into an offset
// (in days) from placement date — Day 1 = placement date itself (offset 0),
// Week N starts on day (N-1)*7. Returns null for formats we can't parse
// (shown as "—" in the plan; still listed, just without a computed date).
function parseAgeOffsetDays(ageLabel: string): number | null {
  const s = (ageLabel ?? '').trim().toUpperCase()
  let m = s.match(/^DAY\s*(\d+)/)
  if (m) return parseInt(m[1], 10) - 1
  m = s.match(/^(\d+)\s*-\s*(\d+)\s*DAYS?$/)
  if (m) return parseInt(m[1], 10) - 1
  m = s.match(/^WEEK\s*(\d+)/)
  if (m) return (parseInt(m[1], 10) - 1) * 7
  return null
}
const addDays = (dateStr: string, days: number) => {
  const d = new Date(dateStr + 'T00:00:00'); d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}
const normVaccineName = (s?: string | null) => (s ?? '').toLowerCase().replace(/[^a-z0-9]/g, '')

const empty = () => ({
  flock_id: '', shed_id: '', farm_id: '',
  vaccine_date: today(), vaccine_name: '', dose_no: '1',
  route: '', quantity: '', unit: '', cost: '',
  next_due_date: '', administered_by: '', remarks: ''
})

export const VaccinationRecordsPage: React.FC = () => {
  const qc = useQueryClient()
  const ROUTES = useConfigOptions('vaccine_route', ROUTES_FB)
  const routeLabel = (v: string) => ROUTES.find(r => r.value === v)?.label ?? v
  const [editing, setEditing] = useState<any | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(empty())
  const [sel, setSel] = useState<Set<string>>(new Set())
  const [bulkConfirm, setBulkConfirm] = useState(false)
  const [filterFlock, setFilterFlock] = useState('')
  const [filterFrom, setFilterFrom] = useState('')
  const [filterTo, setFilterTo] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const s = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const { data: flocks } = useQuery({
    queryKey: ['flocks_all'],
    queryFn: async () => { const { data } = await supabase.from('flocks').select('id,flock_no,status,placement_date').order('flock_no'); return data ?? [] }
  })
  const { data: sheds } = useQuery({
    queryKey: ['sheds_all'],
    queryFn: async () => { const { data } = await supabase.from('sheds').select('id,shed_no,shed_name,farm_id').order('shed_no'); return data ?? [] }
  })
  const { data: farms } = useQuery({
    queryKey: ['farms_all'],
    queryFn: async () => { const { data } = await supabase.from('farms').select('id,name').order('name'); return data ?? [] }
  })
  const { data: schedule } = useQuery({
    queryKey: ['vaccination_schedule'],
    queryFn: async () => { const { data, error } = await supabase.from('vaccination_schedule').select('*').order('sno'); if (error) throw error; return data ?? [] }
  })

  const [planFlockId, setPlanFlockId] = useState('')
  const { data: planFlockRecords } = useQuery({
    queryKey: ['vaccination_records_for_plan', planFlockId],
    queryFn: async () => {
      if (!planFlockId) return []
      const { data } = await supabase.from('vaccination_records').select('vaccine_name,vaccine_date').eq('flock_id', planFlockId)
      return data ?? []
    },
    enabled: !!planFlockId,
  })
  const planFlock = (flocks ?? []).find((f: any) => f.id === planFlockId)
  const planToday = today()
  const plan = React.useMemo(() => {
    if (!planFlock?.placement_date) return []
    const givenByName = new Map<string, string>()
    for (const r of planFlockRecords ?? []) {
      const key = normVaccineName(r.vaccine_name)
      if (!givenByName.has(key) || r.vaccine_date > givenByName.get(key)!) givenByName.set(key, r.vaccine_date)
    }
    return (schedule ?? []).map((s: any) => {
      const offset = parseAgeOffsetDays(s.age_label)
      const dueDate = offset != null ? addDays(planFlock.placement_date, offset) : null
      const givenDate = givenByName.get(normVaccineName(s.vaccine_name)) ?? null
      let status: 'given' | 'overdue' | 'due_soon' | 'upcoming' | 'unknown' = 'unknown'
      if (givenDate) status = 'given'
      else if (dueDate == null) status = 'unknown'
      else if (dueDate < planToday) status = 'overdue'
      else if (dueDate <= addDays(planToday, 7)) status = 'due_soon'
      else status = 'upcoming'
      return { ...s, dueDate, givenDate, status }
    })
  }, [planFlock, schedule, planFlockRecords, planToday])

  const { data: records, isLoading } = useQuery({
    queryKey: ['vaccination_records', filterFlock, filterFrom, filterTo],
    queryFn: async () => {
      let q = supabase.from('vaccination_records')
        .select('*, flocks(flock_no), sheds(shed_no,shed_name), farms(name)')
        .order('vaccine_date', { ascending: false })
      if (filterFlock) q = q.eq('flock_id', filterFlock)
      if (filterFrom)  q = q.gte('vaccine_date', filterFrom)
      if (filterTo)    q = q.lte('vaccine_date', filterTo)
      const { data } = await q
      return data ?? []
    }
  })

  // Upcoming due alerts: next_due_date within 7 days
  const today_str = today()
  const sevenDaysLater = new Date(); sevenDaysLater.setDate(sevenDaysLater.getDate() + 7)
  const sevenStr = sevenDaysLater.toISOString().slice(0, 10)
  const due = (records ?? []).filter((r: any) => r.next_due_date && r.next_due_date >= today_str && r.next_due_date <= sevenStr)
  const overdue = (records ?? []).filter((r: any) => r.next_due_date && r.next_due_date < today_str)

  const openForm = (row?: any) => {
    if (row) {
      setEditing(row)
      setForm({
        flock_id: row.flock_id ?? '', shed_id: row.shed_id ?? '', farm_id: row.farm_id ?? '',
        vaccine_date: row.vaccine_date ?? today(), vaccine_name: row.vaccine_name ?? '',
        dose_no: row.dose_no?.toString() ?? '1', route: row.route ?? '',
        quantity: row.quantity?.toString() ?? '', unit: row.unit ?? '',
        cost: row.cost?.toString() ?? '', next_due_date: row.next_due_date ?? '',
        administered_by: row.administered_by ?? '', remarks: row.remarks ?? ''
      })
    } else {
      setEditing(null); setForm(empty())
    }
    setShowForm(true)
  }

  // Quick "Mark Given" from the plan — pre-fills a normal record so it goes
  // through the same save path (and shows up back in the plan as Given).
  const markGivenFromPlan = (s: any) => {
    setEditing(null)
    setForm({
      ...empty(),
      flock_id: planFlockId,
      vaccine_date: today(),
      vaccine_name: s.vaccine_name ?? '',
      remarks: [s.dose, s.product].filter(Boolean).join(' · '),
    })
    setShowForm(true)
  }

  const mut = useMutation({
    mutationFn: async () => {
      if (!form.flock_id || !form.vaccine_date || !form.vaccine_name) throw new Error('Flock, date and vaccine name required')
      const payload = {
        flock_id: form.flock_id, shed_id: form.shed_id || null, farm_id: form.farm_id || null,
        vaccine_date: form.vaccine_date, vaccine_name: form.vaccine_name.trim(),
        dose_no: parseInt(form.dose_no) || 1, route: form.route || null,
        quantity: parseFloat(form.quantity) || null, unit: form.unit || null,
        cost: parseFloat(form.cost) || null, next_due_date: form.next_due_date || null,
        administered_by: form.administered_by || null, remarks: form.remarks || null
      }
      if (editing) {
        const { error } = await supabase.from('vaccination_records').update(payload).eq('id', editing.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('vaccination_records').insert(payload)
        if (error) throw error
      }
    },
    onSuccess: () => {
      toast.success(editing ? 'Updated' : 'Vaccination recorded')
      qc.invalidateQueries({ queryKey: ['vaccination_records'] })
      setShowForm(false); setEditing(null)
    },
    onError: (e: any) => toast.error(e.message)
  })

  const delMut = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from('vaccination_records').delete().in('id', ids)
      if (error) throw error
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['vaccination_records'] }); toast.success('Deleted'); setSel(new Set()) },
    onError: (e: any) => toast.error(e.message),
  })

  const rows = records ?? []
  const allSel = rows.length > 0 && sel.size === rows.length
  const someSel = sel.size > 0 && sel.size < rows.length
  const toggle = (id: string) => setSel(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  const toggleAll = () => setSel(allSel ? new Set() : new Set(rows.map((r: any) => r.id)))

  const exportRows = () => {
    const flat = rows.map((r: any) => ({
      flock_no: r.flocks?.flock_no ?? '',
      vaccine_date: r.vaccine_date ?? '',
      vaccine_name: r.vaccine_name ?? '',
      dose_no: r.dose_no ?? '',
      route: r.route ?? '',
      quantity: r.quantity ?? '',
      unit: r.unit ?? '',
      cost: r.cost ?? '',
      next_due_date: r.next_due_date ?? '',
      administered_by: r.administered_by ?? '',
      remarks: r.remarks ?? '',
    }))
    const headers = ['flock_no','vaccine_date','vaccine_name','dose_no','route','quantity','unit','cost','next_due_date','administered_by','remarks']
    const lines = [headers.join(',')]
    for (const r of (flat ?? [])) {
      lines.push(headers.map(h => `"${String((r as any)[h] ?? '').replace(/"/g,'""')}"`).join(','))
    }
    const blob = new Blob([lines.join('\n')], { type:'text/csv;charset=utf-8;' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
    a.download = `vaccinations_${new Date().toISOString().slice(0,10)}.csv`; a.click()
  }

  const parseDMY = (v: string) => {
    if (!v) return null
    const str = String(v).trim()
    if (/^\d{4}-\d{2}-\d{2}/.test(str)) return str.slice(0, 10)
    const [d, m, y] = str.split('/')
    if (d && m && y) return `${y.padStart(4, '20')}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
    return null
  }

  const downloadTemplate = () => {
    downloadXlsxTemplate(
      'Vaccinations_Template.xlsx',
      ['flock_no', 'vaccine_date', 'vaccine_name', 'dose_no', 'route', 'quantity', 'unit', 'cost', 'next_due_date', 'administered_by', 'remarks'],
      ['1', today().split('-').reverse().join('/'), "ND LaSota", '1', 'drinking_water', '1000', 'doses', '500', '', 'Vet', '']
    )
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    e.target.value = ''
    try {
      const { headers, rows } = await parseFile(file)
      if (!rows.length) { toast.error('No data found in file'); return }
      const col = (n: string) => headers.indexOf(n)
      const flockMap = Object.fromEntries((flocks ?? []).map((f: any) => [String(f.flock_no), f.id]))
      const parsed = rows.map((r: string[]) => {
        const flockNo = String(r[col('flock_no')] ?? '').replace(/^F-/i, '').trim()
        return {
          flock_id: flockMap[flockNo] ?? null,
          vaccine_date: parseDMY(r[col('vaccine_date')]) ?? today(),
          vaccine_name: (r[col('vaccine_name')] ?? '').trim(),
          dose_no: parseInt(r[col('dose_no')]) || 1,
          route: r[col('route')] || null,
          quantity: parseFloat(r[col('quantity')]) || null,
          unit: r[col('unit')] || null,
          cost: parseFloat(r[col('cost')]) || null,
          next_due_date: parseDMY(r[col('next_due_date')]),
          administered_by: r[col('administered_by')] || null,
          remarks: r[col('remarks')] || null,
        }
      }).filter((r: any) => r.flock_id && r.vaccine_name)
      if (!parsed.length) { toast.error('No rows matched a known flock with a vaccine name'); return }
      const { error } = await supabase.from('vaccination_records').insert(parsed)
      if (error) throw error
      toast.success(`Imported ${parsed.length} records`)
      qc.invalidateQueries({ queryKey: ['vaccination_records'] })
    } catch (err: any) {
      toast.error('Import failed: ' + err.message)
    }
  }

  const flockOptions = (flocks ?? []).map((f: any) => ({ value: f.id, label: `Flock ${f.flock_no} (${f.status})` }))
  const shedOptions = (sheds ?? []).filter((sh: any) => !form.farm_id || sh.farm_id === form.farm_id)
    .map((sh: any) => ({ value: sh.id, label: `Shed ${sh.shed_no}${sh.shed_name ? ' – ' + sh.shed_name : ''}` }))
  const farmOptions = (farms ?? []).map((f: any) => ({ value: f.id, label: f.name }))

  return (
    <div className="space-y-5">
      <SectionHeader title="Vaccination Records"
        subtitle="Track vaccines administered to each flock with due date alerts"
        action={<div className="flex gap-2">
          <Button variant="outline" size="sm" icon={<FileDown size={14}/>} onClick={downloadTemplate}>Template</Button>
          <Button variant="outline" size="sm" icon={<Upload size={14}/>} onClick={() => fileRef.current?.click()}>Import</Button>
          <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImport} />
          <Button variant="outline" size="sm" icon={<Download size={14}/>} onClick={exportRows}>Export</Button>
          <Button icon={<Plus size={16}/>} onClick={() => openForm()}>Add Record</Button>
        </div>}
      />

      {/* Due / Overdue alerts */}
      {overdue.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-800 flex gap-2">
          <AlertTriangle size={16} className="mt-0.5 shrink-0"/>
          <span><strong>{overdue.length} overdue vaccination{overdue.length > 1 ? 's' : ''}</strong> — {overdue.map((r: any) => `F-${r.flocks?.flock_no}: ${r.vaccine_name} (due ${fmtDate(r.next_due_date)})`).join('; ')}</span>
        </div>
      )}
      {due.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800 flex gap-2">
          <AlertTriangle size={16} className="mt-0.5 shrink-0"/>
          <span><strong>{due.length} upcoming</strong> within 7 days — {due.map((r: any) => `F-${r.flocks?.flock_no}: ${r.vaccine_name} (${fmtDate(r.next_due_date)})`).join('; ')}</span>
        </div>
      )}
      {overdue.length === 0 && due.length === 0 && rows.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-800 flex gap-2">
          <CheckCircle size={16} className="mt-0.5 shrink-0"/> All vaccinations up to date
        </div>
      )}

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Select label="Flock" placeholder="All Flocks" options={flockOptions} value={filterFlock} onChange={e => setFilterFlock(e.target.value)} />
          <DateInput label="From Date" value={filterFrom} onChange={e => setFilterFrom(e.target.value)} />
          <DateInput label="To Date" value={filterTo} onChange={e => setFilterTo(e.target.value)} />
          <div className="flex items-end">
            <Button variant="secondary" onClick={() => { setFilterFlock(''); setFilterFrom(''); setFilterTo('') }}>Clear</Button>
          </div>
        </div>
      </Card>

      {showForm && (
        <Card>
          <p className="font-semibold text-gray-700 mb-4">{editing ? 'Edit' : 'New'} Vaccination Record</p>
          <div className="space-y-4">
            <FormRow>
              <Select label="Flock" required placeholder="— Select Flock —" options={flockOptions} value={form.flock_id} onChange={e => s('flock_id', e.target.value)} />
              <DateInput label="Vaccine Date" required value={form.vaccine_date} onChange={e => s('vaccine_date', e.target.value)} />
            </FormRow>
            <FormRow>
              <Select label="Site" placeholder="— All Sites —" options={farmOptions} value={form.farm_id} onChange={e => { s('farm_id', e.target.value); s('shed_id', '') }} />
              <Select label="Shed (optional)" placeholder="— All Sheds —" options={shedOptions} value={form.shed_id} onChange={e => s('shed_id', e.target.value)} />
            </FormRow>
            <FormRow>
              <Input label="Vaccine Name" required value={form.vaccine_name} onChange={e => s('vaccine_name', e.target.value)} placeholder="e.g. Marek's, ND LaSota…" />
              <Input label="Dose No." type="number" value={form.dose_no} onChange={e => s('dose_no', e.target.value)} />
            </FormRow>
            <FormRow>
              <Select label="Route" placeholder="— Select Route —" options={ROUTES} value={form.route} onChange={e => s('route', e.target.value)} />
              <Input label="Quantity" type="number" value={form.quantity} onChange={e => s('quantity', e.target.value)} />
              <Input label="Unit" value={form.unit} onChange={e => s('unit', e.target.value)} placeholder="ml, doses…" />
            </FormRow>
            <FormRow>
              <Input label="Cost (₹)" type="number" value={form.cost} onChange={e => s('cost', e.target.value)} />
              <DateInput label="Next Due Date" value={form.next_due_date} onChange={e => s('next_due_date', e.target.value)} />
              <Input label="Administered By" value={form.administered_by} onChange={e => s('administered_by', e.target.value)} />
            </FormRow>
            <Input label="Remarks" value={form.remarks} onChange={e => s('remarks', e.target.value)} />
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" onClick={() => { setShowForm(false); setEditing(null) }}>Cancel</Button>
              <Button loading={mut.isPending} onClick={() => mut.mutate()}>Save</Button>
            </div>
          </div>
        </Card>
      )}

      {/* Bulk bar */}
      {sel.size > 0 && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
          <span className="text-sm font-medium text-red-700">{sel.size} selected</span>
          <button onClick={() => setSel(new Set())} className="text-xs text-gray-500 hover:text-gray-700 underline">Clear</button>
          <div className="ml-auto">
            <Button size="sm" variant="danger" loading={delMut.isPending}
              onClick={() => setBulkConfirm(true)}>
              Delete Selected
            </Button>
          </div>
        </div>
      )}

      {isLoading ? <Spinner /> : (
        <Card padding={false}>
          <Table>
            <thead><tr>
              <Th><CB checked={allSel} indeterminate={someSel} onChange={toggleAll} /></Th>
              <Th>Flock</Th><Th>Date</Th><Th>Vaccine</Th><Th>Dose</Th>
              <Th>Route</Th><Th>Shed / Site</Th><Th right>Cost</Th>
              <Th>Next Due</Th><Th>By</Th><Th></Th>
            </tr></thead>
            <tbody>
              {rows.map((r: any) => {
                const isDue = r.next_due_date && r.next_due_date >= today_str && r.next_due_date <= sevenStr
                const isOverdue = r.next_due_date && r.next_due_date < today_str
                return (
                  <tr key={r.id} className={`hover:bg-gray-50 ${sel.has(r.id) ? 'bg-blue-50' : ''}`}>
                    <Td><CB checked={sel.has(r.id)} onChange={() => toggle(r.id)} /></Td>
                    <Td><Badge color="green">F-{r.flocks?.flock_no}</Badge></Td>
                    <Td className="text-xs">{fmtDate(r.vaccine_date)}</Td>
                    <Td className="text-sm font-medium">{r.vaccine_name}</Td>
                    <Td className="text-xs">#{r.dose_no}</Td>
                    <Td className="text-xs">{r.route ? routeLabel(r.route) : '—'}</Td>
                    <Td className="text-xs">{r.sheds ? `Shed ${r.sheds.shed_no}` : r.farms?.name ?? '—'}</Td>
                    <Td right className="text-xs">{r.cost ? `₹${r.cost.toLocaleString('en-IN')}` : '—'}</Td>
                    <Td className="text-xs">
                      {r.next_due_date
                        ? <span className={`font-medium ${isOverdue ? 'text-red-600' : isDue ? 'text-amber-600' : 'text-gray-700'}`}>{fmtDate(r.next_due_date)}</span>
                        : '—'}
                    </Td>
                    <Td className="text-xs text-gray-500">{r.administered_by ?? '—'}</Td>
                    <Td>
                      <div className="flex gap-1">
                        <button onClick={() => openForm(r)} className="p-1 text-gray-400 hover:text-brand-600"><Pencil size={13}/></button>
                        <button onClick={() => { setSel(new Set([r.id])); setBulkConfirm(true) }} className="p-1 text-gray-400 hover:text-red-600"><Trash2 size={13}/></button>
                      </div>
                    </Td>
                  </tr>
                )
              })}
            </tbody>
          </Table>
          {rows.length === 0 && <EmptyState title="No vaccination records" action={<Button icon={<Plus size={16}/>} onClick={() => openForm()}>Add Record</Button>} />}
        </Card>
      )}

      {bulkConfirm && (
        <ConfirmBulkDelete
          label={`Delete ${sel.size} vaccination record(s)? This cannot be undone.`}
          onConfirm={() => { delMut.mutate([...sel]); setBulkConfirm(false) }}
          onCancel={() => setBulkConfirm(false)}
        />
      )}

      {/* Vaccination Plan — per-flock due list computed from the schedule + placement date */}
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <CalendarClock size={16} className="text-brand-600"/>
          <p className="font-semibold text-gray-700 text-sm">Vaccination Plan</p>
        </div>
        <div className="mb-3 max-w-xs">
          <Select label="Flock" placeholder="— Select Flock to see its plan —" options={flockOptions} value={planFlockId} onChange={e => setPlanFlockId(e.target.value)} />
        </div>
        {!planFlockId ? (
          <p className="text-sm text-gray-400">Select a flock to see its due, upcoming and given vaccinations, computed from the schedule and placement date.</p>
        ) : !planFlock?.placement_date ? (
          <p className="text-sm text-red-500">This flock has no placement date recorded — can't compute a plan.</p>
        ) : plan.length === 0 ? (
          <p className="text-sm text-gray-400">No schedule entries found.</p>
        ) : (
          <Table>
            <thead><tr>
              <Th>Age</Th><Th>Due Date</Th><Th>Vaccine / Treatment</Th><Th>Dose</Th><Th>Route</Th><Th>Product</Th><Th>Status</Th><Th></Th>
            </tr></thead>
            <tbody>
              {plan.map((s: any) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <Td className="text-xs font-semibold">{s.age_label}</Td>
                  <Td className="text-xs">{s.dueDate ? fmtDate(s.dueDate) : '—'}</Td>
                  <Td className="text-sm">{s.vaccine_name}</Td>
                  <Td className="text-xs text-gray-500">{s.dose ?? '—'}</Td>
                  <Td className="text-xs text-gray-500">{s.route ?? '—'}</Td>
                  <Td className="text-xs text-gray-500">{s.product ?? '—'}</Td>
                  <Td className="text-xs">
                    {s.status === 'given' && <Badge color="green">Given {fmtDate(s.givenDate)}</Badge>}
                    {s.status === 'overdue' && <Badge color="red">Overdue</Badge>}
                    {s.status === 'due_soon' && <Badge color="yellow">Due Soon</Badge>}
                    {s.status === 'upcoming' && <Badge color="gray">Upcoming</Badge>}
                    {s.status === 'unknown' && <Badge color="gray">—</Badge>}
                  </Td>
                  <Td>
                    {s.status !== 'given' && (
                      <button onClick={() => markGivenFromPlan(s)} className="text-xs text-brand-600 hover:underline font-medium">Mark Given</button>
                    )}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      {/* Vaccination Schedule reference */}
      {(schedule ?? []).length > 0 && (
        <Card>
          <p className="font-semibold text-gray-700 mb-3 text-sm">Vaccination Schedule Reference</p>
          <Table>
            <thead><tr>
              <Th>Age</Th><Th>Vaccine</Th><Th>Route</Th><Th>Dose</Th><Th>Product</Th>
            </tr></thead>
            <tbody>
              {(schedule ?? []).map((s: any) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <Td className="text-xs font-semibold">{s.age_label}</Td>
                  <Td className="text-sm">{s.vaccine_name}</Td>
                  <Td className="text-xs">{s.route ?? '—'}</Td>
                  <Td className="text-xs">{s.dose ?? '—'}</Td>
                  <Td className="text-xs text-gray-500">{s.product ?? '—'}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}
    </div>
  )
}
