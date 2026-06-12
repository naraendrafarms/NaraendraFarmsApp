import React, { useState, useRef } from 'react'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { inr, fmtDate } from '@/lib/utils'
import { parseFile } from '@/lib/parseFile'
import {
  Card, CardHeader, Button, Input, Select,
  Table, Th, Td, Badge, SectionHeader, Spinner, EmptyState, StatCard
} from '@/components/ui'
import {
  Bird, Egg, TrendingUp, ArrowLeft, ChevronLeft, ChevronRight,
  Package, Truck, FlaskConical, ShoppingCart, Pencil, Trash2, X, Check,
  Upload, Download
} from 'lucide-react'

// ── helpers ───────────────────────────────────────────────────────────────────

type BadgeColor = 'green' | 'yellow' | 'gray'
function statusBadge(status: string): BadgeColor {
  if (status === 'laying')  return 'green'
  if (status === 'rearing') return 'yellow'
  return 'gray'
}
function numFmt(v: number | null | undefined) {
  if (v == null) return '—'
  return v.toLocaleString('en-IN')
}
function pctFmt(v: number | null | undefined, decimals = 1) {
  if (v == null) return '—'
  return `${(v * 100).toFixed(decimals)}%`
}

const PAGE_SIZE = 50

// ── SHARED: Bulk select helpers ───────────────────────────────────────────────

const CB: React.FC<{ checked: boolean; indeterminate?: boolean; onChange: () => void }> = ({ checked, indeterminate, onChange }) => {
  const ref = React.useRef<HTMLInputElement>(null)
  React.useEffect(() => { if (ref.current) ref.current.indeterminate = !!indeterminate }, [indeterminate])
  return <input ref={ref} type="checkbox" checked={checked} onChange={onChange} className="rounded border-gray-300 text-brand-600 cursor-pointer" />
}

const BulkBar: React.FC<{ count: number; onDelete: () => void; onClear: () => void; loading?: boolean }> = ({ count, onDelete, onClear, loading }) =>
  count === 0 ? null : (
    <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
      <span className="text-sm font-medium text-red-700">{count} selected</span>
      <button onClick={onClear} className="text-xs text-gray-500 hover:text-gray-700 underline">Clear</button>
      <div className="ml-auto">
        <Button variant="danger" size="sm" icon={<Trash2 size={14}/>} loading={loading} onClick={onDelete}>Delete {count} rows</Button>
      </div>
    </div>
  )

// ── SHARED: Delete confirmation ───────────────────────────────────────────────

const ConfirmDelete: React.FC<{ label: string; onConfirm: () => void; onCancel: () => void }> = ({ label, onConfirm, onCancel }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
    <div className="bg-white rounded-xl shadow-xl p-6 w-80">
      <p className="font-semibold text-gray-900 mb-1">Delete record?</p>
      <p className="text-sm text-gray-500 mb-5">{label}</p>
      <div className="flex gap-3 justify-end">
        <Button variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
        <Button variant="danger" size="sm" onClick={onConfirm}>Delete</Button>
      </div>
    </div>
  </div>
)

// ── SHARED: Generic Edit Modal ─────────────────────────────────────────────────

interface FieldDef {
  key: string
  label: string
  type?: 'text' | 'number' | 'date' | 'select'
  options?: { value: string; label: string }[]
  step?: string
}

const EditModal: React.FC<{
  title: string
  fields: FieldDef[]
  data: Record<string, any>
  onSave: (data: Record<string, any>) => void
  onClose: () => void
  saving?: boolean
}> = ({ title, fields, data, onSave, onClose, saving }) => {
  const [form, setForm] = useState<Record<string, any>>({ ...data })

  const set = (key: string, val: any) => setForm(f => ({ ...f, [key]: val }))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <p className="font-semibold text-gray-900">{title}</p>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18}/></button>
        </div>
        <div className="p-4 grid grid-cols-2 gap-3">
          {fields.map(f => (
            <div key={f.key} className={f.type === 'date' || f.type === 'select' ? '' : ''}>
              {f.type === 'select' ? (
                <Select
                  label={f.label}
                  options={f.options ?? []}
                  value={form[f.key] ?? ''}
                  onChange={e => set(f.key, e.target.value)}
                />
              ) : (
                <Input
                  label={f.label}
                  type={f.type ?? 'text'}
                  step={f.step}
                  value={form[f.key] ?? ''}
                  onChange={e => set(f.key, e.target.value)}
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex gap-3 justify-end p-4 border-t">
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" icon={<Check size={14}/>} onClick={() => onSave(form)} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── TABS ──────────────────────────────────────────────────────────────────────

const TABS = ['Overview', 'Daily Records', 'Bird Transfers', 'HE Dispatch', 'Hatch Batches', 'Egg Conversions', 'Feed', 'Medicine', 'Bird Sales'] as const
type Tab = typeof TABS[number]

// ── FLOCK DASHBOARD ───────────────────────────────────────────────────────────

export const FlockDashboard: React.FC = () => {
  const navigate = useNavigate()

  const { data: flocks, isLoading } = useQuery({
    queryKey: ['flock_dashboard'],
    queryFn: async () => {
      const { data } = await supabase
        .from('flocks')
        .select('id,flock_no,breed,placement_date,paid_female,paid_male,free_female,free_male,chick_rate,supplier,status,close_date,total_placed_f,total_placed_m,chick_cost')
        .order('placement_date', { ascending: false })
      return data ?? []
    }
  })

  if (isLoading) return <Spinner />

  return (
    <div className="space-y-5">
      <SectionHeader title="Flock Management" subtitle={`${flocks?.length ?? 0} flocks`} />

      {(!flocks || flocks.length === 0) && (
        <EmptyState icon={<Bird size={32} />} title="No flocks found" />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {flocks?.map((f: any) => {
          const paidF = f.paid_female ?? 0
          const paidM = f.paid_male ?? 0
          const freeF = f.free_female ?? 0
          const freeM = f.free_male ?? 0
          const totalPlacedF = f.total_placed_f ?? (paidF + freeF)
          const totalPlacedM = f.total_placed_m ?? (paidM + freeM)
          const total = totalPlacedF + totalPlacedM

          return (
            <div
              key={f.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 cursor-pointer hover:shadow-md hover:border-brand-200 transition-all"
              onClick={() => navigate(`/flock/${encodeURIComponent(f.flock_no)}`)}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-bold text-gray-900 text-base">Flock {f.flock_no}</p>
                  <p className="text-sm text-gray-500">{f.breed ?? '—'}</p>
                </div>
                <Badge color={statusBadge(f.status)}>{f.status}</Badge>
              </div>

              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Placement</span>
                  <span className="font-medium">{fmtDate(f.placement_date)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Total Placed</span>
                  <span className="font-medium" title={`Paid: ${paidF}F + ${paidM}M · Free: ${freeF}F + ${freeM}M`}>
                    {numFmt(totalPlacedF)}F + {numFmt(totalPlacedM)}M
                    <span className="text-xs text-gray-400 ml-1">({numFmt(total)})</span>
                  </span>
                </div>
                {f.chick_cost != null && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Chick Cost</span>
                    <span className="font-semibold text-brand-700">{inr(f.chick_cost)}</span>
                  </div>
                )}
                {f.supplier && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Supplier</span>
                    <span className="text-xs text-gray-600 truncate max-w-[140px]">{f.supplier}</span>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── FLOCK DETAIL ──────────────────────────────────────────────────────────────

export const FlockDetail: React.FC = () => {
  const { flockNo } = useParams<{ flockNo: string }>()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<Tab>('Overview')

  const { data: flock, isLoading: flockLoading } = useQuery({
    queryKey: ['flock_detail', flockNo],
    queryFn: async () => {
      const { data } = await supabase
        .from('flocks')
        .select('*')
        .eq('flock_no', flockNo!)
        .single()
      return data
    },
    enabled: !!flockNo
  })

  if (flockLoading) return <Spinner />
  if (!flock) return (
    <div className="space-y-4">
      <Button variant="ghost" icon={<ArrowLeft size={16} />} onClick={() => navigate('/flock')}>Back</Button>
      <EmptyState icon={<Bird size={32} />} title="Flock not found" />
    </div>
  )

  const paidF = flock.paid_female ?? 0
  const paidM = flock.paid_male ?? 0
  const freeF = flock.free_female ?? 0
  const freeM = flock.free_male ?? 0
  const totalF = flock.total_placed_f ?? (paidF + freeF)
  const totalM = flock.total_placed_m ?? (paidM + freeM)

  return (
    <div className="space-y-5">
      <div>
        <Button variant="ghost" size="sm" icon={<ArrowLeft size={15} />} onClick={() => navigate('/flock')}>
          All Flocks
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Flock {flock.flock_no}</h2>
          <div className="flex items-center flex-wrap gap-2 mt-1">
            <span className="text-sm text-gray-500">{flock.breed}</span>
            <Badge color={statusBadge(flock.status)}>{flock.status}</Badge>
            <span className="text-xs text-gray-400">Placed: {fmtDate(flock.placement_date)}</span>
            <span className="text-xs text-gray-400">
              {numFmt(totalF)}F + {numFmt(totalM)}M birds
              <span className="ml-1 text-gray-300">(Paid: {paidF}F+{paidM}M · Free: {freeF}F+{freeM}M)</span>
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-1 overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors
                ${activeTab === tab
                  ? 'border-brand-600 text-brand-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'Overview'          && <OverviewTab flock={flock} />}
      {activeTab === 'Daily Records'     && <DailyRecordsTab flockId={flock.id} />}
      {activeTab === 'Bird Transfers'    && <BirdTransfersTab flockId={flock.id} />}
      {activeTab === 'HE Dispatch'       && <HEDispatchTab flockId={flock.id} />}
      {activeTab === 'Hatch Batches'     && <HatchBatchesTab flockId={flock.id} />}
      {activeTab === 'Egg Conversions'   && <EggConversionsTab flockId={flock.id} />}
      {activeTab === 'Feed'              && <FeedTab flockId={flock.id} />}
      {activeTab === 'Medicine'          && <MedicineTab flockId={flock.id} />}
      {activeTab === 'Bird Sales'        && <BirdSalesTab flockId={flock.id} />}
    </div>
  )
}

// ── OVERVIEW TAB ──────────────────────────────────────────────────────────────

const OverviewTab: React.FC<{ flock: any }> = ({ flock }) => {
  const { data: daily } = useQuery({
    queryKey: ['flock_daily_all', flock.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('daily_records')
        .select('record_date,closing_female,closing_male,mortality_female,mortality_male,total_eggs,he_eggs,he_grade_a,he_grade_b,he_grade_c,wastage_eggs,hd_pct,he_pct')
        .eq('flock_id', flock.id)
        .order('record_date', { ascending: false })
      return data ?? []
    }
  })

  const { data: heDispatch } = useQuery({
    queryKey: ['flock_he_dispatch_all', flock.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('he_dispatch')
        .select('total_dispatched')
        .eq('flock_id', flock.id)
      return data ?? []
    }
  })

  if (!daily) return <Spinner />

  const totalPlacedF = flock.total_placed_f ?? ((flock.paid_female ?? 0) + (flock.free_female ?? 0))
  const totalPlacedM = flock.total_placed_m ?? ((flock.paid_male ?? 0) + (flock.free_male ?? 0))
  const latestRow = daily[0]
  const currentBirds = (latestRow?.closing_female ?? 0) + (latestRow?.closing_male ?? 0)
  const totalMortF = daily.reduce((s: number, r: any) => s + (r.mortality_female ?? 0), 0)
  const totalMortM = daily.reduce((s: number, r: any) => s + (r.mortality_male ?? 0), 0)
  const totalEggs   = daily.reduce((s: number, r: any) => s + (r.total_eggs ?? 0), 0)
  const totalHE     = daily.reduce((s: number, r: any) => s + (r.he_eggs ?? 0), 0)
  const totalGradeA = daily.reduce((s: number, r: any) => s + (r.he_grade_a ?? 0), 0)
  const totalGradeB = daily.reduce((s: number, r: any) => s + (r.he_grade_b ?? 0), 0)
  const totalGradeC = daily.reduce((s: number, r: any) => s + (r.he_grade_c ?? 0), 0)
  const totalWaste  = daily.reduce((s: number, r: any) => s + (r.wastage_eggs ?? 0), 0)
  const totalHEDisp = (heDispatch ?? []).reduce((s: number, r: any) => s + (r.total_dispatched ?? 0), 0)

  const hdRows = daily.filter((r: any) => r.hd_pct != null && (r.total_eggs ?? 0) > 0)
  const avgHD  = hdRows.length ? hdRows.reduce((s: number, r: any) => s + r.hd_pct, 0) / hdRows.length : null
  const heRows = daily.filter((r: any) => r.he_pct != null && (r.total_eggs ?? 0) > 0)
  const avgHE  = heRows.length ? heRows.reduce((s: number, r: any) => s + r.he_pct, 0) / heRows.length : null

  const monthly: Record<string, { eggs: number; heEggs: number; gradeA: number; gradeB: number; gradeC: number; waste: number; mort: number; birdDays: number; days: number }> = {}
  daily.forEach((r: any) => {
    const month = (r.record_date as string)?.slice(0, 7) ?? ''
    if (!monthly[month]) monthly[month] = { eggs: 0, heEggs: 0, gradeA: 0, gradeB: 0, gradeC: 0, waste: 0, mort: 0, birdDays: 0, days: 0 }
    monthly[month].eggs     += r.total_eggs ?? 0
    monthly[month].heEggs   += r.he_eggs ?? 0
    monthly[month].gradeA   += r.he_grade_a ?? 0
    monthly[month].gradeB   += r.he_grade_b ?? 0
    monthly[month].gradeC   += r.he_grade_c ?? 0
    monthly[month].waste    += r.wastage_eggs ?? 0
    monthly[month].mort     += (r.mortality_female ?? 0) + (r.mortality_male ?? 0)
    monthly[month].birdDays += (r.closing_female ?? 0) + (r.closing_male ?? 0)
    monthly[month].days     += 1
  })

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Total Placed" value={numFmt(totalPlacedF + totalPlacedM)} subtitle={`${numFmt(totalPlacedF)}F + ${numFmt(totalPlacedM)}M`} icon={<Bird size={18}/>} color="text-brand-600" />
        <StatCard title="Current Birds" value={numFmt(currentBirds)} subtitle={latestRow ? fmtDate(latestRow.record_date) : 'No data'} icon={<Bird size={18}/>} color="text-blue-600" />
        <StatCard title="Total Mortality" value={numFmt(totalMortF + totalMortM)} subtitle={`${numFmt(totalMortF)}F + ${numFmt(totalMortM)}M`} icon={<TrendingUp size={18}/>} color="text-red-600" />
        <StatCard title="Total Eggs" value={numFmt(totalEggs)} icon={<Egg size={18}/>} color="text-yellow-600" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Total HE Eggs" value={numFmt(totalHE)} icon={<Egg size={18}/>} color="text-green-600" />
        <StatCard title="HE Dispatched" value={numFmt(totalHEDisp)} icon={<Truck size={18}/>} color="text-purple-600" />
        <StatCard title="Avg Lay %" value={avgHD != null ? pctFmt(avgHD) : '—'} icon={<TrendingUp size={18}/>} color="text-orange-600" />
        <StatCard title="Avg HE %" value={avgHE != null ? pctFmt(avgHE) : '—'} icon={<TrendingUp size={18}/>} color="text-teal-600" />
      </div>
      {(totalGradeA + totalGradeB + totalGradeC) > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard title="Grade A (HE)" value={numFmt(totalGradeA)} icon={<Egg size={18}/>} color="text-emerald-600" />
          <StatCard title="Grade B (HE)" value={numFmt(totalGradeB)} icon={<Egg size={18}/>} color="text-yellow-600" />
          <StatCard title="Grade C (HE)" value={numFmt(totalGradeC)} icon={<Egg size={18}/>} color="text-orange-600" />
          <StatCard title="Total Wastage" value={numFmt(totalWaste)} icon={<Egg size={18}/>} color="text-red-500" />
        </div>
      )}

      {Object.keys(monthly).length > 0 && (
        <Card padding={false}>
          <div className="p-4 pb-0">
            <p className="font-semibold text-gray-800 text-sm">Monthly Summary</p>
          </div>
          <Table>
            <thead><tr>
              <Th>Month</Th><Th right>Avg Birds</Th><Th right>Total Eggs</Th>
              <Th right>HE Eggs</Th><Th right>Gr A</Th><Th right>Gr B</Th><Th right>Gr C</Th>
              <Th right>Wastage</Th><Th right>Mortality</Th>
            </tr></thead>
            <tbody>
              {Object.entries(monthly).sort(([a], [b]) => a.localeCompare(b)).map(([month, d]) => (
                <tr key={month} className="hover:bg-gray-50">
                  <Td className="font-medium text-xs">{month}</Td>
                  <Td right className="text-xs">{numFmt(d.days ? Math.round(d.birdDays / d.days) : 0)}</Td>
                  <Td right className="text-xs">{numFmt(d.eggs)}</Td>
                  <Td right className="text-xs font-semibold text-green-700">{numFmt(d.heEggs)}</Td>
                  <Td right className="text-xs text-emerald-600">{d.gradeA ? numFmt(d.gradeA) : '—'}</Td>
                  <Td right className="text-xs text-yellow-600">{d.gradeB ? numFmt(d.gradeB) : '—'}</Td>
                  <Td right className="text-xs text-orange-600">{d.gradeC ? numFmt(d.gradeC) : '—'}</Td>
                  <Td right className="text-xs text-red-500">{d.waste ? numFmt(d.waste) : '—'}</Td>
                  <Td right className="text-xs">{numFmt(d.mort)}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}
    </div>
  )
}

// ── DAILY RECORDS TAB ─────────────────────────────────────────────────────────

const DAILY_FIELDS: FieldDef[] = [
  { key: 'record_date',      label: 'Date',           type: 'date' },
  { key: 'age_weeks',        label: 'Age (weeks)',     type: 'number', step: '0.1' },
  { key: 'opening_female',   label: 'Open Female',     type: 'number' },
  { key: 'opening_male',     label: 'Open Male',       type: 'number' },
  { key: 'mortality_female', label: 'Mortality F',     type: 'number' },
  { key: 'mortality_male',   label: 'Mortality M',     type: 'number' },
  { key: 'closing_female',   label: 'Closing Female',  type: 'number' },
  { key: 'closing_male',     label: 'Closing Male',    type: 'number' },
  { key: 'feed_female_kg',   label: 'Feed F (kg)',     type: 'number', step: '0.1' },
  { key: 'feed_male_kg',     label: 'Feed M (kg)',     type: 'number', step: '0.1' },
  { key: 'total_eggs',       label: 'Total Eggs',      type: 'number' },
  { key: 'he_eggs',          label: 'HE Eggs (Total)', type: 'number' },
  { key: 'he_grade_a',       label: 'HE Grade A',      type: 'number' },
  { key: 'he_grade_b',       label: 'HE Grade B',      type: 'number' },
  { key: 'he_grade_c',       label: 'HE Grade C',      type: 'number' },
  { key: 'wastage_eggs',     label: 'Wastage Eggs',    type: 'number' },
]

const DailyRecordsTab: React.FC<{ flockId: string }> = ({ flockId }) => {
  const qc = useQueryClient()
  const [fFarm, setFFarm] = useState('')
  const [fFrom, setFFrom] = useState('')
  const [fTo,   setFTo]   = useState('')
  const [page,  setPage]  = useState(0)
  const [editRow,     setEditRow]     = useState<any | null>(null)
  const [deleteRow,   setDeleteRow]   = useState<any | null>(null)
  const [sel,         setSel]         = useState<Set<string>>(new Set())
  const [bulkConfirm, setBulkConfirm] = useState(false)

  const { data: farms } = useQuery({
    queryKey: ['farms'],
    queryFn: async () => {
      const { data } = await supabase.from('farms').select('id,name,code').order('name')
      return data ?? []
    }
  })

  const { data: allRecords, isLoading } = useQuery({
    queryKey: ['flock_daily_records', flockId],
    queryFn: async () => {
      const CHUNK = 1000
      let all: any[] = []
      let from = 0
      while (true) {
        const { data } = await supabase
          .from('daily_records')
          .select('id,record_date,farm_id,age_weeks,opening_female,opening_male,mortality_female,mortality_male,closing_female,closing_male,feed_female_kg,feed_male_kg,total_eggs,he_eggs,he_grade_a,he_grade_b,he_grade_c,wastage_eggs,hd_pct,he_pct,farms(name,code)')
          .eq('flock_id', flockId)
          .order('record_date', { ascending: false })
          .range(from, from + CHUNK - 1)
        if (!data || data.length === 0) break
        all = all.concat(data)
        if (data.length < CHUNK) break
        from += CHUNK
      }
      return all
    }
  })

  const deleteMut = useMutation({
    mutationFn: async (id: string) => { await supabase.from('daily_records').delete().eq('id', id) },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['flock_daily_records', flockId] }); qc.invalidateQueries({ queryKey: ['flock_daily_all', flockId] }); setDeleteRow(null) }
  })

  const updateMut = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => { await supabase.from('daily_records').update(data).eq('id', id) },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['flock_daily_records', flockId] }); qc.invalidateQueries({ queryKey: ['flock_daily_all', flockId] }); setEditRow(null) }
  })

  const bulkDelMut = useMutation({
    mutationFn: async (ids: string[]) => { await supabase.from('daily_records').delete().in('id', ids) },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['flock_daily_records', flockId] }); qc.invalidateQueries({ queryKey: ['flock_daily_all', flockId] }); setSel(new Set()); setBulkConfirm(false) }
  })

  const filtered = (allRecords ?? []).filter((r: any) => {
    if (fFarm && r.farm_id !== fFarm) return false
    if (fFrom && r.record_date < fFrom) return false
    if (fTo   && r.record_date > fTo)   return false
    return true
  })

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const rows = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  const rowIds = rows.map((r: any) => r.id)
  const allSel = rowIds.length > 0 && rowIds.every((id: string) => sel.has(id))
  const someSel = rowIds.some((id: string) => sel.has(id))
  const toggle = (id: string) => setSel(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  const toggleAll = () => setSel(s => { const n = new Set(s); allSel ? rowIds.forEach((id: string) => n.delete(id)) : rowIds.forEach((id: string) => n.add(id)); return n })

  const totalEggs = filtered.reduce((s: number, r: any) => s + (r.total_eggs ?? 0), 0)
  const totalMort = filtered.reduce((s: number, r: any) => s + (r.mortality_female ?? 0) + (r.mortality_male ?? 0), 0)
  const hdRows = filtered.filter((r: any) => r.hd_pct != null && (r.total_eggs ?? 0) > 0)
  const avgHD  = hdRows.length ? hdRows.reduce((s: number, r: any) => s + r.hd_pct, 0) / hdRows.length : null

  const farmOptions = (farms ?? []).map((f: any) => ({ value: f.id, label: `${f.name} (${f.code})` }))
  const hasFilter = fFarm || fFrom || fTo

  return (
    <div className="space-y-4">
      <Card>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 items-end">
          <Select label="Site" placeholder="All Sites" options={farmOptions}
            value={fFarm} onChange={e => { setFFarm(e.target.value); setPage(0) }} />
          <Input label="Date From" type="date" value={fFrom} onChange={e => { setFFrom(e.target.value); setPage(0) }} />
          <Input label="Date To"   type="date" value={fTo}   onChange={e => { setFTo(e.target.value); setPage(0) }} />
          <div className="flex items-end">
            {hasFilter && (
              <button onClick={() => { setFFarm(''); setFFrom(''); setFTo(''); setPage(0) }}
                className="text-xs text-brand-600 hover:underline">Clear filters</button>
            )}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-3 gap-4">
        <StatCard title="Total Eggs" value={numFmt(totalEggs)} icon={<Egg size={18}/>} color="text-yellow-600" />
        <StatCard title="Total Mortality" value={numFmt(totalMort)} icon={<Bird size={18}/>} color="text-red-600" />
        <StatCard title="Avg HD%" value={avgHD != null ? pctFmt(avgHD) : '—'} icon={<TrendingUp size={18}/>} color="text-green-600" />
      </div>

      {isLoading ? <Spinner /> : (
        <>
          <BulkBar count={sel.size} loading={bulkDelMut.isPending} onClear={() => setSel(new Set())} onDelete={() => setBulkConfirm(true)} />
          <Card padding={false}>
            <Table>
              <thead><tr>
                <Th><CB checked={allSel} indeterminate={someSel && !allSel} onChange={toggleAll}/></Th>
                <Th>Date</Th><Th>Site</Th>
                <Th right>Open F</Th><Th right>Open M</Th>
                <Th right>Feed F kg</Th><Th right>Feed M kg</Th>
                <Th right>Eggs</Th><Th right>HD%</Th>
                <Th right>HE</Th><Th right>Gr A</Th><Th right>Gr B</Th><Th right>Gr C</Th><Th right>HE%</Th>
                <Th right>Wastage</Th>
                <Th right>Mort F</Th><Th right>Mort M</Th>
                <Th right>Close F</Th><Th right>Close M</Th>
                <Th right>Age/Wk</Th>
                <Th></Th>
              </tr></thead>
              <tbody>
                {rows.map((r: any) => (
                  <tr key={r.id} className={`hover:bg-gray-50 ${sel.has(r.id) ? 'bg-red-50' : ''}`}>
                    <Td><CB checked={sel.has(r.id)} onChange={() => toggle(r.id)}/></Td>
                    <Td className="text-xs font-medium">{fmtDate(r.record_date)}</Td>
                    <Td className="text-xs">{r.farms?.code ?? '—'}</Td>
                    <Td right className="text-xs">{numFmt(r.opening_female)}</Td>
                    <Td right className="text-xs">{numFmt(r.opening_male)}</Td>
                    <Td right className="text-xs">{r.feed_female_kg != null ? (r.feed_female_kg as number).toFixed(1) : '—'}</Td>
                    <Td right className="text-xs">{r.feed_male_kg != null ? (r.feed_male_kg as number).toFixed(1) : '—'}</Td>
                    <Td right className="text-xs font-semibold">{numFmt(r.total_eggs)}</Td>
                    <Td right className="text-xs">{r.hd_pct != null ? pctFmt(r.hd_pct) : '—'}</Td>
                    <Td right className="text-xs font-semibold text-green-700">{numFmt(r.he_eggs)}</Td>
                    <Td right className="text-xs text-emerald-600">{r.he_grade_a != null ? numFmt(r.he_grade_a) : '—'}</Td>
                    <Td right className="text-xs text-yellow-600">{r.he_grade_b != null ? numFmt(r.he_grade_b) : '—'}</Td>
                    <Td right className="text-xs text-orange-600">{r.he_grade_c != null ? numFmt(r.he_grade_c) : '—'}</Td>
                    <Td right className="text-xs">{r.he_pct != null ? pctFmt(r.he_pct) : '—'}</Td>
                    <Td right className="text-xs text-red-400">{r.wastage_eggs != null ? numFmt(r.wastage_eggs) : '—'}</Td>
                    <Td right className="text-xs text-red-600">{numFmt(r.mortality_female)}</Td>
                    <Td right className="text-xs text-red-600">{numFmt(r.mortality_male)}</Td>
                    <Td right className="text-xs">{numFmt(r.closing_female)}</Td>
                    <Td right className="text-xs">{numFmt(r.closing_male)}</Td>
                    <Td right className="text-xs text-gray-400">{r.age_weeks ?? '—'}</Td>
                    <Td>
                      <div className="flex gap-1 justify-end">
                        <button onClick={() => setEditRow(r)} className="p-1 text-gray-400 hover:text-brand-600"><Pencil size={13}/></button>
                        <button onClick={() => setDeleteRow(r)} className="p-1 text-gray-400 hover:text-red-600"><Trash2 size={13}/></button>
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
            {rows.length === 0 && <EmptyState icon={<Bird size={32}/>} title="No records found" />}
          </Card>

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">
                {filtered.length} records · Page {page + 1} of {totalPages}
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" icon={<ChevronLeft size={14}/>}
                  disabled={page === 0} onClick={() => setPage(p => p - 1)}>Prev</Button>
                <Button variant="outline" size="sm" icon={<ChevronRight size={14}/>}
                  disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Next</Button>
              </div>
            </div>
          )}
        </>
      )}

      {editRow && (
        <EditModal
          title={`Edit Daily Record — ${fmtDate(editRow.record_date)}`}
          fields={DAILY_FIELDS}
          data={editRow}
          saving={updateMut.isPending}
          onClose={() => setEditRow(null)}
          onSave={form => updateMut.mutate({ id: editRow.id, data: {
            record_date: form.record_date,
            age_weeks: form.age_weeks !== '' ? Number(form.age_weeks) : null,
            opening_female: Number(form.opening_female) || 0,
            opening_male:   Number(form.opening_male)   || 0,
            mortality_female: Number(form.mortality_female) || 0,
            mortality_male:   Number(form.mortality_male)   || 0,
            closing_female: Number(form.closing_female) || 0,
            closing_male:   Number(form.closing_male)   || 0,
            feed_female_kg: form.feed_female_kg !== '' ? Number(form.feed_female_kg) : null,
            feed_male_kg:   form.feed_male_kg   !== '' ? Number(form.feed_male_kg)   : null,
            total_eggs:  Number(form.total_eggs)  || 0,
            he_eggs:     Number(form.he_eggs)     || 0,
            he_grade_a:  form.he_grade_a  !== '' ? Number(form.he_grade_a)  : null,
            he_grade_b:  form.he_grade_b  !== '' ? Number(form.he_grade_b)  : null,
            he_grade_c:  form.he_grade_c  !== '' ? Number(form.he_grade_c)  : null,
            wastage_eggs: form.wastage_eggs !== '' ? Number(form.wastage_eggs) : null,
          }})}
        />
      )}

      {deleteRow && (
        <ConfirmDelete
          label={`Date: ${fmtDate(deleteRow.record_date)} · ${deleteRow.farms?.code ?? ''}`}
          onConfirm={() => deleteMut.mutate(deleteRow.id)}
          onCancel={() => setDeleteRow(null)}
        />
      )}
      {bulkConfirm && (
        <ConfirmDelete label={`Delete ${sel.size} daily records?`}
          onConfirm={() => bulkDelMut.mutate([...sel])} onCancel={() => setBulkConfirm(false)} />
      )}
    </div>
  )
}

// ── BIRD TRANSFERS TAB ────────────────────────────────────────────────────────

const TRANSFER_FIELDS: FieldDef[] = [
  { key: 'transfer_date',  label: 'Date',           type: 'date' },
  { key: 'dc_no',          label: 'DC No',          type: 'text' },
  { key: 'grade',          label: 'Grade',          type: 'text' },
  { key: 'gender',         label: 'Gender',         type: 'text' },
  { key: 'vehicle_no',     label: 'Vehicle No',     type: 'text' },
  { key: 'no_of_boxes',    label: 'No of Boxes',    type: 'number' },
  { key: 'birds_per_box',  label: 'Birds/Box',      type: 'number' },
  { key: 'total_birds',    label: 'Total Birds',    type: 'number' },
]

const BirdTransfersTab: React.FC<{ flockId: string }> = ({ flockId }) => {
  const qc = useQueryClient()
  const [fFrom, setFFrom] = useState('')
  const [fTo,   setFTo]   = useState('')
  const [editRow,     setEditRow]     = useState<any | null>(null)
  const [deleteRow,   setDeleteRow]   = useState<any | null>(null)
  const [sel,         setSel]         = useState<Set<string>>(new Set())
  const [bulkConfirm, setBulkConfirm] = useState(false)

  const { data: transfers, isLoading } = useQuery({
    queryKey: ['flock_bird_transfers', flockId],
    queryFn: async () => {
      const { data } = await supabase
        .from('bird_transfers')
        .select('*, from_farm:farms!from_farm_id(name,code), to_farm:farms!to_farm_id(name,code)')
        .eq('flock_id', flockId)
        .order('transfer_date', { ascending: false })
      return data ?? []
    }
  })

  const deleteMut = useMutation({
    mutationFn: async (id: string) => { await supabase.from('bird_transfers').delete().eq('id', id) },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['flock_bird_transfers', flockId] }); setDeleteRow(null) }
  })

  const updateMut = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => { await supabase.from('bird_transfers').update(data).eq('id', id) },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['flock_bird_transfers', flockId] }); setEditRow(null) }
  })

  const bulkDelMut = useMutation({
    mutationFn: async (ids: string[]) => { await supabase.from('bird_transfers').delete().in('id', ids) },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['flock_bird_transfers', flockId] }); setSel(new Set()); setBulkConfirm(false) }
  })

  const filtered = (transfers ?? []).filter((r: any) => {
    if (fFrom && r.transfer_date < fFrom) return false
    if (fTo   && r.transfer_date > fTo)   return false
    return true
  })

  const totalBirds = filtered.reduce((s: number, r: any) => s + (r.total_birds ?? 0), 0)
  const tIds = filtered.map((r: any) => r.id)
  const allSel = tIds.length > 0 && tIds.every((id: string) => sel.has(id))
  const someSel = tIds.some((id: string) => sel.has(id))
  const toggle = (id: string) => setSel(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  const toggleAll = () => setSel(s => { const n = new Set(s); allSel ? tIds.forEach((id: string) => n.delete(id)) : tIds.forEach((id: string) => n.add(id)); return n })

  return (
    <div className="space-y-4">
      <Card>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 items-end">
          <Input label="Date From" type="date" value={fFrom} onChange={e => setFFrom(e.target.value)} />
          <Input label="Date To"   type="date" value={fTo}   onChange={e => setFTo(e.target.value)} />
          {(fFrom || fTo) && (
            <div className="flex items-end">
              <button onClick={() => { setFFrom(''); setFTo('') }} className="text-xs text-brand-600 hover:underline">Clear</button>
            </div>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 max-w-xs">
        <StatCard title="Total Birds Transferred" value={numFmt(totalBirds)} icon={<Truck size={18}/>} color="text-purple-600" />
      </div>

      {isLoading ? <Spinner /> : (
        <>
          <BulkBar count={sel.size} loading={bulkDelMut.isPending} onClear={() => setSel(new Set())} onDelete={() => setBulkConfirm(true)} />
          <Card padding={false}>
            <Table>
              <thead><tr>
                <Th><CB checked={allSel} indeterminate={someSel && !allSel} onChange={toggleAll}/></Th>
                <Th>Date</Th><Th>DC No</Th><Th>Grade</Th><Th>Gender</Th>
                <Th>Vehicle</Th><Th right>Boxes</Th><Th right>Birds/Box</Th>
                <Th right>Total Birds</Th><Th>From → To</Th>
                <Th></Th>
              </tr></thead>
              <tbody>
                {filtered.map((t: any) => (
                  <tr key={t.id} className={`hover:bg-gray-50 ${sel.has(t.id) ? 'bg-red-50' : ''}`}>
                    <Td><CB checked={sel.has(t.id)} onChange={() => toggle(t.id)}/></Td>
                    <Td className="text-xs">{fmtDate(t.transfer_date)}</Td>
                  <Td className="text-xs font-mono">{t.dc_no ?? '—'}</Td>
                  <Td className="text-xs">{t.grade ?? '—'}</Td>
                  <Td className="text-xs">{t.gender ?? '—'}</Td>
                  <Td className="text-xs">{t.vehicle_no ?? '—'}</Td>
                  <Td right className="text-xs">{numFmt(t.no_of_boxes)}</Td>
                  <Td right className="text-xs">{numFmt(t.birds_per_box)}</Td>
                  <Td right className="text-xs font-semibold">{numFmt(t.total_birds)}</Td>
                  <Td className="text-xs">{t.from_farm?.code ?? '?'} → {t.to_farm?.code ?? '?'}</Td>
                  <Td>
                    <div className="flex gap-1 justify-end">
                      <button onClick={() => setEditRow(t)} className="p-1 text-gray-400 hover:text-brand-600"><Pencil size={13}/></button>
                      <button onClick={() => setDeleteRow(t)} className="p-1 text-gray-400 hover:text-red-600"><Trash2 size={13}/></button>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
            {filtered.length === 0 && <EmptyState icon={<Truck size={32}/>} title="No bird transfers" />}
          </Card>
        </>
      )}

      {editRow && (
        <EditModal
          title={`Edit Transfer — ${fmtDate(editRow.transfer_date)}`}
          fields={TRANSFER_FIELDS}
          data={editRow}
          saving={updateMut.isPending}
          onClose={() => setEditRow(null)}
          onSave={form => updateMut.mutate({ id: editRow.id, data: {
            transfer_date: form.transfer_date,
            dc_no: form.dc_no || null,
            grade: form.grade || null,
            gender: form.gender || null,
            vehicle_no: form.vehicle_no || null,
            no_of_boxes: Number(form.no_of_boxes) || 0,
            birds_per_box: Number(form.birds_per_box) || 0,
            total_birds: Number(form.total_birds) || 0,
          }})}
        />
      )}

      {deleteRow && (
        <ConfirmDelete
          label={`Date: ${fmtDate(deleteRow.transfer_date)} · ${numFmt(deleteRow.total_birds)} birds`}
          onConfirm={() => deleteMut.mutate(deleteRow.id)}
          onCancel={() => setDeleteRow(null)}
        />
      )}
      {bulkConfirm && (
        <ConfirmDelete label={`Delete ${sel.size} transfer records?`}
          onConfirm={() => bulkDelMut.mutate([...sel])} onCancel={() => setBulkConfirm(false)} />
      )}
    </div>
  )
}

// ── HE DISPATCH TAB ───────────────────────────────────────────────────────────

const HE_DISPATCH_FIELDS: FieldDef[] = [
  { key: 'dispatch_date',    label: 'Date',        type: 'date' },
  { key: 'invoice_no',       label: 'Invoice No',  type: 'text' },
  { key: 'dc_no',            label: 'DC No',       type: 'text' },
  { key: 'grade_a',          label: 'Grade A',     type: 'number' },
  { key: 'grade_b',          label: 'Grade B',     type: 'number' },
  { key: 'grade_c',          label: 'Grade C',     type: 'number' },
  { key: 'total_dispatched', label: 'Total',       type: 'number' },
  { key: 'rate',             label: 'Rate (₹)',    type: 'number', step: '0.01' },
  { key: 'amount',           label: 'Amount (₹)', type: 'number', step: '0.01' },
]

const HEDispatchTab: React.FC<{ flockId: string }> = ({ flockId }) => {
  const qc = useQueryClient()
  const [fFrom, setFFrom] = useState('')
  const [fTo,   setFTo]   = useState('')
  const [editRow,     setEditRow]     = useState<any | null>(null)
  const [deleteRow,   setDeleteRow]   = useState<any | null>(null)
  const [sel,         setSel]         = useState<Set<string>>(new Set())
  const [bulkConfirm, setBulkConfirm] = useState(false)

  const { data: allDisp, isLoading } = useQuery({
    queryKey: ['flock_he_dispatch', flockId],
    queryFn: async () => {
      const { data } = await supabase
        .from('he_dispatch')
        .select('*, parties(name)')
        .eq('flock_id', flockId)
        .order('dispatch_date', { ascending: false })
      return data ?? []
    }
  })

  const deleteMut = useMutation({
    mutationFn: async (id: string) => { await supabase.from('he_dispatch').delete().eq('id', id) },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['flock_he_dispatch', flockId] }); qc.invalidateQueries({ queryKey: ['flock_he_dispatch_all', flockId] }); setDeleteRow(null) }
  })

  const updateMut = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => { await supabase.from('he_dispatch').update(data).eq('id', id) },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['flock_he_dispatch', flockId] }); qc.invalidateQueries({ queryKey: ['flock_he_dispatch_all', flockId] }); setEditRow(null) }
  })

  const bulkDelMutHE = useMutation({
    mutationFn: async (ids: string[]) => { await supabase.from('he_dispatch').delete().in('id', ids) },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['flock_he_dispatch', flockId] }); qc.invalidateQueries({ queryKey: ['flock_he_dispatch_all', flockId] }); setSel(new Set()); setBulkConfirm(false) }
  })

  const dispatches = (allDisp ?? []).filter((r: any) => {
    if (fFrom && r.dispatch_date < fFrom) return false
    if (fTo   && r.dispatch_date > fTo)   return false
    return true
  })

  const totalDisp   = dispatches.reduce((s: number, r: any) => s + (r.total_dispatched ?? 0), 0)
  const totalAmount = dispatches.reduce((s: number, r: any) => s + (r.amount ?? 0), 0)
  const dIds = dispatches.map((r: any) => r.id)
  const allSel = dIds.length > 0 && dIds.every((id: string) => sel.has(id))
  const someSel = dIds.some((id: string) => sel.has(id))
  const toggle = (id: string) => setSel(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  const toggleAll = () => setSel(s => { const n = new Set(s); allSel ? dIds.forEach((id: string) => n.delete(id)) : dIds.forEach((id: string) => n.add(id)); return n })

  return (
    <div className="space-y-4">
      <Card>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 items-end">
          <Input label="Date From" type="date" value={fFrom} onChange={e => setFFrom(e.target.value)} />
          <Input label="Date To"   type="date" value={fTo}   onChange={e => setFTo(e.target.value)} />
          {(fFrom || fTo) && (
            <div className="flex items-end">
              <button onClick={() => { setFFrom(''); setFTo('') }} className="text-xs text-brand-600 hover:underline">Clear</button>
            </div>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-3 gap-4">
        <StatCard title="Total Dispatched" value={numFmt(totalDisp)} icon={<Egg size={18}/>} color="text-green-600" />
        <StatCard title="Total Amount" value={inr(totalAmount)} icon={<TrendingUp size={18}/>} color="text-brand-600" />
        <StatCard title="Trip Count" value={dispatches.length.toString()} icon={<Truck size={18}/>} color="text-blue-600" />
      </div>

      {isLoading ? <Spinner /> : (
        <>
          <BulkBar count={sel.size} loading={bulkDelMutHE.isPending} onClear={() => setSel(new Set())} onDelete={() => setBulkConfirm(true)} />
          <Card padding={false}>
            <Table>
              <thead><tr>
                <Th><CB checked={allSel} indeterminate={someSel && !allSel} onChange={toggleAll}/></Th>
                <Th>Date</Th><Th>Invoice</Th><Th>DC No</Th><Th>Party</Th>
                <Th right>Gr A</Th><Th right>Gr B</Th><Th right>Gr C</Th>
                <Th right>Total</Th><Th right>Rate</Th><Th right>Amount</Th>
                <Th></Th>
              </tr></thead>
              <tbody>
                {dispatches.map((d: any) => (
                  <tr key={d.id} className={`hover:bg-gray-50 ${sel.has(d.id) ? 'bg-red-50' : ''}`}>
                    <Td><CB checked={sel.has(d.id)} onChange={() => toggle(d.id)}/></Td>
                    <Td className="text-xs">{fmtDate(d.dispatch_date)}</Td>
                  <Td className="text-xs font-mono text-brand-700">{d.invoice_no ?? '—'}</Td>
                  <Td className="text-xs font-mono">{d.dc_no ?? '—'}</Td>
                  <Td className="text-xs">{d.parties?.name ?? '—'}</Td>
                  <Td right className="text-xs text-emerald-600">{numFmt(d.grade_a)}</Td>
                  <Td right className="text-xs text-yellow-600">{numFmt(d.grade_b)}</Td>
                  <Td right className="text-xs text-orange-600">{numFmt(d.grade_c)}</Td>
                  <Td right className="text-xs font-semibold">{numFmt(d.total_dispatched)}</Td>
                  <Td right className="text-xs">{d.rate != null ? `₹${d.rate}` : '—'}</Td>
                  <Td right className="text-xs font-semibold">{inr(d.amount)}</Td>
                  <Td>
                    <div className="flex gap-1 justify-end">
                      <button onClick={() => setEditRow(d)} className="p-1 text-gray-400 hover:text-brand-600"><Pencil size={13}/></button>
                      <button onClick={() => setDeleteRow(d)} className="p-1 text-gray-400 hover:text-red-600"><Trash2 size={13}/></button>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
            {dispatches.length > 0 && (
              <tfoot><tr className="bg-gray-50 font-semibold">
                <Td colSpan={8}>TOTAL ({dispatches.length})</Td>
                <Td right>{numFmt(totalDisp)}</Td>
                <Td right>—</Td>
                <Td right>{inr(totalAmount)}</Td>
                <Td></Td>
              </tr></tfoot>
            )}
          </Table>
          {dispatches.length === 0 && <EmptyState icon={<Egg size={32}/>} title="No HE dispatch records" />}
          </Card>
        </>
      )}

      {editRow && (
        <EditModal
          title={`Edit HE Dispatch — ${fmtDate(editRow.dispatch_date)}`}
          fields={HE_DISPATCH_FIELDS}
          data={editRow}
          saving={updateMut.isPending}
          onClose={() => setEditRow(null)}
          onSave={form => updateMut.mutate({ id: editRow.id, data: {
            dispatch_date:    form.dispatch_date,
            invoice_no:       form.invoice_no || null,
            dc_no:            form.dc_no || null,
            grade_a:          Number(form.grade_a)          || 0,
            grade_b:          Number(form.grade_b)          || 0,
            grade_c:          Number(form.grade_c)          || 0,
            total_dispatched: Number(form.total_dispatched) || 0,
            rate:             form.rate   !== '' ? Number(form.rate)   : null,
            amount:           form.amount !== '' ? Number(form.amount) : null,
          }})}
        />
      )}

      {deleteRow && (
        <ConfirmDelete
          label={`Date: ${fmtDate(deleteRow.dispatch_date)} · ${numFmt(deleteRow.total_dispatched)} eggs`}
          onConfirm={() => deleteMut.mutate(deleteRow.id)}
          onCancel={() => setDeleteRow(null)}
        />
      )}
      {bulkConfirm && (
        <ConfirmDelete label={`Delete ${sel.size} HE dispatch records?`}
          onConfirm={() => bulkDelMutHE.mutate([...sel])} onCancel={() => setBulkConfirm(false)} />
      )}
    </div>
  )
}

// ── FEED TAB ──────────────────────────────────────────────────────────────────

const FEED_FIELDS: FieldDef[] = [
  { key: 'feed_date',   label: 'Date',       type: 'date' },
  { key: 'feed_type',   label: 'Feed Type',  type: 'text' },
  { key: 'female_kg',   label: 'Female KG',  type: 'number', step: '0.1' },
  { key: 'male_kg',     label: 'Male KG',    type: 'number', step: '0.1' },
  { key: 'female_cost', label: 'Female Cost',type: 'number', step: '0.01' },
  { key: 'male_cost',   label: 'Male Cost',  type: 'number', step: '0.01' },
]

const FeedTab: React.FC<{ flockId: string }> = ({ flockId }) => {
  const qc = useQueryClient()
  const [fFrom, setFFrom] = useState('')
  const [fTo,   setFTo]   = useState('')
  const [editRow,     setEditRow]     = useState<any | null>(null)
  const [deleteRow,   setDeleteRow]   = useState<any | null>(null)
  const [sel,         setSel]         = useState<Set<string>>(new Set())
  const [bulkConfirm, setBulkConfirm] = useState(false)
  const [importing, setImporting] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const { data: feedData, isLoading } = useQuery({
    queryKey: ['flock_daily_feed', flockId],
    queryFn: async () => {
      const { data } = await supabase
        .from('daily_feed')
        .select('*')
        .eq('flock_id', flockId)
        .order('feed_date', { ascending: false })
      return data ?? []
    }
  })

  const { data: feedGrnRates } = useQuery({
    queryKey: ['grn_feed_rates'],
    queryFn: async () => {
      const { data } = await supabase
        .from('grn')
        .select('item_name,price_per_unit,grn_date')
        .order('grn_date', { ascending: false })
      if (!data) return {} as Record<string, number>
      const map: Record<string, number> = {}
      for (const g of data) {
        if (g.item_name && g.price_per_unit) {
          const k = g.item_name.trim().toLowerCase()
          if (!(k in map)) map[k] = g.price_per_unit
        }
      }
      return map
    }
  })

  const deleteMut = useMutation({
    mutationFn: async (id: string) => { await supabase.from('daily_feed').delete().eq('id', id) },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['flock_daily_feed', flockId] }); setDeleteRow(null) }
  })

  const bulkDelMutFeed = useMutation({
    mutationFn: async (ids: string[]) => { await supabase.from('daily_feed').delete().in('id', ids) },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['flock_daily_feed', flockId] }); setSel(new Set()); setBulkConfirm(false) }
  })

  const updateMut = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => { await supabase.from('daily_feed').update(data).eq('id', id) },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['flock_daily_feed', flockId] }); setEditRow(null) }
  })

  const handleDownloadFeedTemplate = () => {
    const headers = 'feed_date,feed_type,female_kg,male_kg,female_cost,male_cost'
    const example = '2025-06-01,Chick,2150.0,57.0,,'
    const blob = new Blob([headers + '\n' + example], { type: 'text/csv' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
    a.download = 'feed_template.csv'; a.click()
  }

  const handleImportFeed = async (file: File) => {
    setImporting(true)
    try {
      const { headers: header, rows: rawRows } = await parseFile(file)
      const rows = rawRows.map(vals => {
        const obj: any = {}
        header.forEach((h, i) => { obj[h] = vals[i] ?? '' })
        return {
          flock_id: flockId,
          feed_date:   obj.feed_date,
          feed_type:   obj.feed_type || null,
          female_kg:   obj.female_kg   !== '' ? Number(obj.female_kg)   : null,
          male_kg:     obj.male_kg     !== '' ? Number(obj.male_kg)     : null,
          female_cost: obj.female_cost !== '' ? Number(obj.female_cost) : null,
          male_cost:   obj.male_cost   !== '' ? Number(obj.male_cost)   : null,
        }
      }).filter((r: any) => r.feed_date)
      const { error } = await supabase.from('daily_feed').upsert(rows, { onConflict: 'flock_id,feed_date,feed_type' })
      if (error) throw error
      qc.invalidateQueries({ queryKey: ['flock_daily_feed', flockId] })
      toast.success(`Imported ${rows.length} feed records!`)
    } catch (e: any) {
      toast.error('Import failed: ' + e.message)
    } finally {
      setImporting(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const getFeedGrnRate = (feedType: string) => {
    if (!feedGrnRates || !feedType) return null
    const ft = feedType.trim().toLowerCase()
    const found = Object.keys(feedGrnRates).find(k => k.includes(ft) || ft.includes(k))
    return found ? feedGrnRates[found] : null
  }

  const filtered = (feedData ?? []).filter((r: any) => {
    if (fFrom && r.feed_date < fFrom) return false
    if (fTo   && r.feed_date > fTo)   return false
    return true
  })

  const totalFemaleKg = filtered.reduce((s: number, r: any) => s + (r.female_kg ?? 0), 0)
  const totalMaleKg   = filtered.reduce((s: number, r: any) => s + (r.male_kg ?? 0), 0)
  const feedIds = filtered.map((r: any) => r.id)
  const allSel = feedIds.length > 0 && feedIds.every((id: string) => sel.has(id))
  const someSel = feedIds.some((id: string) => sel.has(id))
  const toggle = (id: string) => setSel(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  const toggleAll = () => setSel(s => { const n = new Set(s); allSel ? feedIds.forEach((id: string) => n.delete(id)) : feedIds.forEach((id: string) => n.add(id)); return n })
  const totalCostGrn  = filtered.reduce((s: number, r: any) => {
    const rate = getFeedGrnRate(r.feed_type) ?? 0
    return s + ((r.female_kg ?? 0) + (r.male_kg ?? 0)) * rate
  }, 0)

  return (
    <div className="space-y-4">
      <Card>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 items-end">
          <Input label="Date From" type="date" value={fFrom} onChange={e => setFFrom(e.target.value)} />
          <Input label="Date To"   type="date" value={fTo}   onChange={e => setFTo(e.target.value)} />
          {(fFrom || fTo) && (
            <div className="flex items-end">
              <button onClick={() => { setFFrom(''); setFTo('') }} className="text-xs text-brand-600 hover:underline">Clear</button>
            </div>
          )}
        </div>
      </Card>

      <div className="flex gap-2 flex-wrap">
        <Button variant="outline" size="sm" icon={<Download size={14}/>} onClick={handleDownloadFeedTemplate}>
          Download Template
        </Button>
        <Button variant="outline" size="sm" icon={<Upload size={14}/>} loading={importing}
          onClick={() => fileRef.current?.click()}>
          Import CSV
        </Button>
        <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleImportFeed(f) }} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard title="Total Female KG" value={`${numFmt(Math.round(totalFemaleKg))} kg`} icon={<Package size={18}/>} color="text-pink-600" />
        <StatCard title="Total Male KG"   value={`${numFmt(Math.round(totalMaleKg))} kg`}   icon={<Package size={18}/>} color="text-blue-600" />
        <StatCard title="Cost (GRN Rates)" value={inr(totalCostGrn)} icon={<TrendingUp size={18}/>} color="text-green-600" />
      </div>

      {isLoading ? <Spinner /> : (
        <>
          <BulkBar count={sel.size} loading={bulkDelMutFeed.isPending} onClear={() => setSel(new Set())} onDelete={() => setBulkConfirm(true)} />
          <Card padding={false}>
            <Table>
              <thead><tr>
                <Th><CB checked={allSel} indeterminate={someSel && !allSel} onChange={toggleAll}/></Th>
                <Th>Date</Th><Th>Feed Type</Th>
                <Th right>Female KG</Th><Th right>Male KG</Th>
                <Th right>Total KG</Th><Th right>GRN Rate/kg</Th><Th right>Cost (GRN)</Th>
                <Th></Th>
              </tr></thead>
              <tbody>
                {filtered.map((r: any) => {
                  const grnRate = getFeedGrnRate(r.feed_type)
                  const totalKg = (r.female_kg ?? 0) + (r.male_kg ?? 0)
                  const costGrn = grnRate != null ? totalKg * grnRate : null
                  return (
                    <tr key={r.id} className={`hover:bg-gray-50 ${sel.has(r.id) ? 'bg-red-50' : ''}`}>
                      <Td><CB checked={sel.has(r.id)} onChange={() => toggle(r.id)}/></Td>
                      <Td className="text-xs">{fmtDate(r.feed_date)}</Td>
                    <Td className="text-xs"><Badge color="blue">{r.feed_type ?? '—'}</Badge></Td>
                    <Td right className="text-xs">{r.female_kg != null ? (r.female_kg as number).toFixed(1) : '—'}</Td>
                    <Td right className="text-xs">{r.male_kg != null ? (r.male_kg as number).toFixed(1) : '—'}</Td>
                    <Td right className="text-xs font-semibold">{totalKg.toFixed(1)}</Td>
                    <Td right className="text-xs">{grnRate != null ? <span className="text-green-700">₹{grnRate}/kg</span> : <span className="text-gray-400">—</span>}</Td>
                    <Td right className="text-xs font-semibold">{costGrn != null ? inr(costGrn) : '—'}</Td>
                    <Td>
                      <div className="flex gap-1 justify-end">
                        <button onClick={() => setEditRow(r)} className="p-1 text-gray-400 hover:text-brand-600"><Pencil size={13}/></button>
                        <button onClick={() => setDeleteRow(r)} className="p-1 text-gray-400 hover:text-red-600"><Trash2 size={13}/></button>
                      </div>
                    </Td>
                  </tr>
                )
              })}
            </tbody>
          </Table>
            {filtered.length === 0 && <EmptyState icon={<Package size={32}/>} title="No feed records" />}
          </Card>
        </>
      )}

      {editRow && (
        <EditModal
          title={`Edit Feed — ${fmtDate(editRow.feed_date)}`}
          fields={FEED_FIELDS}
          data={editRow}
          saving={updateMut.isPending}
          onClose={() => setEditRow(null)}
          onSave={form => updateMut.mutate({ id: editRow.id, data: {
            feed_date:   form.feed_date,
            feed_type:   form.feed_type || null,
            female_kg:   form.female_kg   !== '' ? Number(form.female_kg)   : null,
            male_kg:     form.male_kg     !== '' ? Number(form.male_kg)     : null,
            female_cost: form.female_cost !== '' ? Number(form.female_cost) : null,
            male_cost:   form.male_cost   !== '' ? Number(form.male_cost)   : null,
          }})}
        />
      )}

      {deleteRow && (
        <ConfirmDelete
          label={`Date: ${fmtDate(deleteRow.feed_date)} · ${deleteRow.feed_type ?? ''}`}
          onConfirm={() => deleteMut.mutate(deleteRow.id)}
          onCancel={() => setDeleteRow(null)}
        />
      )}
      {bulkConfirm && (
        <ConfirmDelete label={`Delete ${sel.size} feed records?`}
          onConfirm={() => bulkDelMutFeed.mutate([...sel])} onCancel={() => setBulkConfirm(false)} />
      )}
    </div>
  )
}

// ── MEDICINE TAB ──────────────────────────────────────────────────────────────

const MEDICINE_FIELDS: FieldDef[] = [
  { key: 'usage_date', label: 'Date',         type: 'date' },
  { key: 'quantity',   label: 'Quantity',     type: 'number', step: '0.001' },
  { key: 'unit',       label: 'Unit',         type: 'text' },
  { key: 'rate',       label: 'Rate (₹)',     type: 'number', step: '0.01' },
  { key: 'amount',     label: 'Amount (₹)',  type: 'number', step: '0.01' },
]

const MedicineTab: React.FC<{ flockId: string }> = ({ flockId }) => {
  const qc = useQueryClient()
  const [fFrom, setFFrom] = useState('')
  const [fTo,   setFTo]   = useState('')
  const [editRow,     setEditRow]     = useState<any | null>(null)
  const [deleteRow,   setDeleteRow]   = useState<any | null>(null)
  const [sel,         setSel]         = useState<Set<string>>(new Set())
  const [bulkConfirm, setBulkConfirm] = useState(false)

  const { data: usages, isLoading } = useQuery({
    queryKey: ['flock_medicine', flockId],
    queryFn: async () => {
      const { data } = await supabase
        .from('medicine_usage')
        .select('*, medicines_master(name,type)')
        .eq('flock_id', flockId)
        .order('usage_date', { ascending: false })
      return data ?? []
    }
  })

  const { data: grnRates } = useQuery({
    queryKey: ['grn_med_rates'],
    queryFn: async () => {
      const { data } = await supabase
        .from('grn')
        .select('item_name,price_per_unit,grn_date')
        .order('grn_date', { ascending: false })
      if (!data) return {} as Record<string, number>
      const map: Record<string, number> = {}
      for (const g of data) {
        if (g.item_name && g.price_per_unit && !(g.item_name in map))
          map[g.item_name.trim().toLowerCase()] = g.price_per_unit
      }
      return map
    }
  })

  const deleteMut = useMutation({
    mutationFn: async (id: string) => { await supabase.from('medicine_usage').delete().eq('id', id) },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['flock_medicine', flockId] }); setDeleteRow(null) }
  })

  const updateMut = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => { await supabase.from('medicine_usage').update(data).eq('id', id) },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['flock_medicine', flockId] }); setEditRow(null) }
  })

  const bulkDelMutMed = useMutation({
    mutationFn: async (ids: string[]) => { await supabase.from('medicine_usage').delete().in('id', ids) },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['flock_medicine', flockId] }); setSel(new Set()); setBulkConfirm(false) }
  })

  const getGrnRate = (name: string) => {
    if (!grnRates || !name) return null
    const key = name.trim().toLowerCase()
    if (grnRates[key] !== undefined) return grnRates[key]
    const found = Object.keys(grnRates).find(k => k.includes(key) || key.includes(k))
    return found ? grnRates[found] : null
  }

  const calcCost = (r: any) => {
    const grnRate = getGrnRate(r.medicines_master?.name ?? '')
    const rate = grnRate ?? r.rate ?? 0
    return (r.quantity ?? 0) * rate
  }

  const filtered = (usages ?? []).filter((r: any) => {
    if (fFrom && r.usage_date < fFrom) return false
    if (fTo   && r.usage_date > fTo)   return false
    return true
  })
  const medIds = filtered.map((r: any) => r.id)
  const allSel = medIds.length > 0 && medIds.every((id: string) => sel.has(id))
  const someSel = medIds.some((id: string) => sel.has(id))
  const toggle = (id: string) => setSel(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  const toggleAll = () => setSel(s => { const n = new Set(s); allSel ? medIds.forEach((id: string) => n.delete(id)) : medIds.forEach((id: string) => n.add(id)); return n })

  const totalCostGrn   = filtered.reduce((s: number, r: any) => s + calcCost(r), 0)
  const totalCostExcel = filtered.reduce((s: number, r: any) => s + (r.amount ?? 0), 0)

  return (
    <div className="space-y-4">
      <Card>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 items-end">
          <Input label="Date From" type="date" value={fFrom} onChange={e => setFFrom(e.target.value)} />
          <Input label="Date To"   type="date" value={fTo}   onChange={e => setFTo(e.target.value)} />
          {(fFrom || fTo) && (
            <div className="flex items-end">
              <button onClick={() => { setFFrom(''); setFTo('') }} className="text-xs text-brand-600 hover:underline">Clear</button>
            </div>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-4 max-w-sm">
        <StatCard title="Cost (GRN Rates)" value={inr(totalCostGrn)} icon={<FlaskConical size={18}/>} color="text-green-600" />
        <StatCard title="Cost (Excel Rates)" value={inr(totalCostExcel)} icon={<FlaskConical size={18}/>} color="text-gray-400" />
      </div>

      {isLoading ? <Spinner /> : (
        <>
          <BulkBar count={sel.size} loading={bulkDelMutMed.isPending} onClear={() => setSel(new Set())} onDelete={() => setBulkConfirm(true)} />
          <Card padding={false}>
            <Table>
              <thead><tr>
                <Th><CB checked={allSel} indeterminate={someSel && !allSel} onChange={toggleAll}/></Th>
                <Th>Date</Th><Th>Medicine / Vaccine</Th><Th right>Qty</Th>
                <Th>Unit</Th><Th right>GRN Rate</Th><Th right>Excel Rate</Th><Th right>Cost (GRN)</Th>
                <Th></Th>
              </tr></thead>
              <tbody>
                {filtered.map((r: any) => {
                  const grnRate = getGrnRate(r.medicines_master?.name ?? '')
                  const cost = calcCost(r)
                  return (
                    <tr key={r.id} className={`hover:bg-gray-50 ${sel.has(r.id) ? 'bg-red-50' : ''}`}>
                      <Td><CB checked={sel.has(r.id)} onChange={() => toggle(r.id)}/></Td>
                      <Td className="text-xs">{fmtDate(r.usage_date)}</Td>
                    <Td className="text-xs font-medium">{r.medicines_master?.name ?? '—'}</Td>
                    <Td right className="text-xs">{r.quantity}</Td>
                    <Td className="text-xs text-gray-400">{r.unit ?? r.medicines_master?.unit ?? '—'}</Td>
                    <Td right className="text-xs">{grnRate != null ? <span className="text-green-700 font-medium">₹{grnRate}</span> : <span className="text-gray-400">not in GRN</span>}</Td>
                    <Td right className="text-xs text-gray-400">{r.rate != null ? `₹${r.rate}` : '—'}</Td>
                    <Td right className="text-xs font-semibold">{inr(cost)}</Td>
                    <Td>
                      <div className="flex gap-1 justify-end">
                        <button onClick={() => setEditRow(r)} className="p-1 text-gray-400 hover:text-brand-600"><Pencil size={13}/></button>
                        <button onClick={() => setDeleteRow(r)} className="p-1 text-gray-400 hover:text-red-600"><Trash2 size={13}/></button>
                      </div>
                    </Td>
                  </tr>
                )
              })}
            </tbody>
            {filtered.length > 0 && (
              <tfoot><tr className="bg-gray-50 font-semibold">
                <Td colSpan={7}>TOTAL ({filtered.length} records)</Td>
                <Td right>{inr(totalCostGrn)}</Td>
                <Td></Td>
              </tr></tfoot>
            )}
          </Table>
          {filtered.length === 0 && <EmptyState icon={<FlaskConical size={32}/>} title="No medicine records" />}
          </Card>
        </>
      )}

      {editRow && (
        <EditModal
          title={`Edit Medicine — ${fmtDate(editRow.usage_date)}`}
          fields={MEDICINE_FIELDS}
          data={editRow}
          saving={updateMut.isPending}
          onClose={() => setEditRow(null)}
          onSave={form => updateMut.mutate({ id: editRow.id, data: {
            usage_date: form.usage_date,
            quantity:   form.quantity !== '' ? Number(form.quantity) : null,
            unit:       form.unit || null,
            rate:       form.rate   !== '' ? Number(form.rate)   : null,
            amount:     form.amount !== '' ? Number(form.amount) : null,
          }})}
        />
      )}

      {deleteRow && (
        <ConfirmDelete
          label={`Date: ${fmtDate(deleteRow.usage_date)} · ${deleteRow.medicines_master?.name ?? ''}`}
          onConfirm={() => deleteMut.mutate(deleteRow.id)}
          onCancel={() => setDeleteRow(null)}
        />
      )}
      {bulkConfirm && (
        <ConfirmDelete label={`Delete ${sel.size} medicine records?`}
          onConfirm={() => bulkDelMutMed.mutate([...sel])} onCancel={() => setBulkConfirm(false)} />
      )}
    </div>
  )
}

// ── BIRD SALES TAB ────────────────────────────────────────────────────────────

const BIRD_SALES_FIELDS: FieldDef[] = [
  { key: 'sale_date',  label: 'Date',        type: 'date' },
  { key: 'dc_no',      label: 'DC No',       type: 'text' },
  { key: 'sale_type',  label: 'Sale Type',   type: 'text' },
  { key: 'quantity',   label: 'Quantity',    type: 'number' },
  { key: 'unit',       label: 'Unit',        type: 'text' },
  { key: 'rate',       label: 'Rate (₹)',   type: 'number', step: '0.01' },
  { key: 'amount',     label: 'Amount (₹)', type: 'number', step: '0.01' },
]

const BirdSalesTab: React.FC<{ flockId: string }> = ({ flockId }) => {
  const qc = useQueryClient()
  const [fFrom, setFFrom] = useState('')
  const [fTo,   setFTo]   = useState('')
  const [fType, setFType] = useState('')
  const [editRow,     setEditRow]     = useState<any | null>(null)
  const [deleteRow,   setDeleteRow]   = useState<any | null>(null)
  const [sel,         setSel]         = useState<Set<string>>(new Set())
  const [bulkConfirm, setBulkConfirm] = useState(false)

  const { data: sales, isLoading } = useQuery({
    queryKey: ['flock_nhe_sales', flockId],
    queryFn: async () => {
      const { data } = await supabase
        .from('nhe_sales')
        .select('*')
        .eq('flock_id', flockId)
        .order('sale_date', { ascending: false })
      return data ?? []
    }
  })

  const deleteMut = useMutation({
    mutationFn: async (id: string) => { await supabase.from('nhe_sales').delete().eq('id', id) },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['flock_nhe_sales', flockId] }); setDeleteRow(null) }
  })

  const updateMut = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => { await supabase.from('nhe_sales').update(data).eq('id', id) },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['flock_nhe_sales', flockId] }); setEditRow(null) }
  })

  const saleTypes = [...new Set((sales ?? []).map((r: any) => r.sale_type).filter(Boolean))]
  const typeOptions = saleTypes.map(t => ({ value: t as string, label: t as string }))

  const filtered = (sales ?? []).filter((r: any) => {
    if (fFrom && r.sale_date < fFrom) return false
    if (fTo   && r.sale_date > fTo)   return false
    if (fType && r.sale_type !== fType) return false
    return true
  })

  const bulkDelMutSales = useMutation({
    mutationFn: async (ids: string[]) => { await supabase.from('nhe_sales').delete().in('id', ids) },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['flock_nhe_sales', flockId] }); setSel(new Set()); setBulkConfirm(false) }
  })

  const totalAmount = filtered.reduce((s: number, r: any) => s + (r.amount ?? 0), 0)
  const saleIds = filtered.map((r: any) => r.id)
  const allSel = saleIds.length > 0 && saleIds.every((id: string) => sel.has(id))
  const someSel = saleIds.some((id: string) => sel.has(id))
  const toggle = (id: string) => setSel(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  const toggleAll = () => setSel(s => { const n = new Set(s); allSel ? saleIds.forEach((id: string) => n.delete(id)) : saleIds.forEach((id: string) => n.add(id)); return n })

  return (
    <div className="space-y-4">
      <Card>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 items-end">
          <Input label="Date From" type="date" value={fFrom} onChange={e => setFFrom(e.target.value)} />
          <Input label="Date To"   type="date" value={fTo}   onChange={e => setFTo(e.target.value)} />
          <Select label="Type" placeholder="All Types" options={typeOptions} value={fType} onChange={e => setFType(e.target.value)} />
          {(fFrom || fTo || fType) && (
            <div className="flex items-end">
              <button onClick={() => { setFFrom(''); setFTo(''); setFType('') }} className="text-xs text-brand-600 hover:underline">Clear</button>
            </div>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-4 max-w-sm">
        <StatCard title="Total Amount" value={inr(totalAmount)} icon={<ShoppingCart size={18}/>} color="text-green-600" />
        <StatCard title="Records" value={filtered.length.toString()} icon={<ShoppingCart size={18}/>} color="text-blue-600" />
      </div>

      {isLoading ? <Spinner /> : (
        <>
          <BulkBar count={sel.size} loading={bulkDelMutSales.isPending} onClear={() => setSel(new Set())} onDelete={() => setBulkConfirm(true)} />
          <Card padding={false}>
            <Table>
              <thead><tr>
                <Th><CB checked={allSel} indeterminate={someSel && !allSel} onChange={toggleAll}/></Th>
                <Th>Date</Th><Th>DC No</Th><Th>Type</Th>
                <Th right>Qty</Th><Th>Unit</Th>
                <Th right>Rate</Th><Th right>Amount</Th>
                <Th></Th>
              </tr></thead>
              <tbody>
                {filtered.map((r: any) => (
                  <tr key={r.id} className={`hover:bg-gray-50 ${sel.has(r.id) ? 'bg-red-50' : ''}`}>
                    <Td><CB checked={sel.has(r.id)} onChange={() => toggle(r.id)}/></Td>
                    <Td className="text-xs">{fmtDate(r.sale_date)}</Td>
                  <Td className="text-xs font-mono">{r.dc_no ?? '—'}</Td>
                  <Td className="text-xs"><Badge color="gray">{r.sale_type ?? '—'}</Badge></Td>
                  <Td right className="text-xs">{numFmt(r.quantity)}</Td>
                  <Td className="text-xs text-gray-400">{r.unit ?? '—'}</Td>
                  <Td right className="text-xs">{r.rate != null ? `₹${r.rate}` : '—'}</Td>
                  <Td right className="text-xs font-semibold">{inr(r.amount)}</Td>
                  <Td>
                    <div className="flex gap-1 justify-end">
                      <button onClick={() => setEditRow(r)} className="p-1 text-gray-400 hover:text-brand-600"><Pencil size={13}/></button>
                      <button onClick={() => setDeleteRow(r)} className="p-1 text-gray-400 hover:text-red-600"><Trash2 size={13}/></button>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
            {filtered.length > 0 && (
              <tfoot><tr className="bg-gray-50 font-semibold">
                <Td colSpan={7}>TOTAL ({filtered.length})</Td>
                <Td right>{inr(totalAmount)}</Td>
                <Td></Td>
              </tr></tfoot>
            )}
          </Table>
          {filtered.length === 0 && <EmptyState icon={<ShoppingCart size={32}/>} title="No bird sales records" />}
          </Card>
        </>
      )}

      {editRow && (
        <EditModal
          title={`Edit Sale — ${fmtDate(editRow.sale_date)}`}
          fields={BIRD_SALES_FIELDS}
          data={editRow}
          saving={updateMut.isPending}
          onClose={() => setEditRow(null)}
          onSave={form => updateMut.mutate({ id: editRow.id, data: {
            sale_date:  form.sale_date,
            dc_no:      form.dc_no || null,
            sale_type:  form.sale_type || null,
            quantity:   form.quantity !== '' ? Number(form.quantity) : null,
            unit:       form.unit || null,
            rate:       form.rate   !== '' ? Number(form.rate)   : null,
            amount:     form.amount !== '' ? Number(form.amount) : null,
          }})}
        />
      )}

      {deleteRow && (
        <ConfirmDelete
          label={`Date: ${fmtDate(deleteRow.sale_date)} · ${deleteRow.sale_type ?? ''} · ${inr(deleteRow.amount)}`}
          onConfirm={() => deleteMut.mutate(deleteRow.id)}
          onCancel={() => setDeleteRow(null)}
        />
      )}
      {bulkConfirm && (
        <ConfirmDelete label={`Delete ${sel.size} bird sale records?`}
          onConfirm={() => bulkDelMutSales.mutate([...sel])} onCancel={() => setBulkConfirm(false)} />
      )}
    </div>
  )
}

// ── HATCH BATCHES TAB (per-flock view) ────────────────────────────────────────

const HatchBatchesTab: React.FC<{ flockId: string }> = ({ flockId }) => {
  const { data: batches, isLoading } = useQuery({
    queryKey: ['flock_hatch_batches', flockId],
    queryFn: async () => {
      const { data } = await supabase
        .from('hatch_batches')
        .select('*')
        .eq('flock_id', flockId)
        .order('setting_date', { ascending: false })
      return data ?? []
    }
  })

  if (isLoading) return <Spinner />

  const total = batches?.length ?? 0
  const totalSet = (batches ?? []).reduce((s: number, r: any) => s + (r.eggs_set ?? 0), 0)
  const totalHatched = (batches ?? []).reduce((s: number, r: any) => s + (r.hatched_chicks ?? 0), 0)
  const avgHatch = batches?.filter((r: any) => r.hatchability_pct != null).length
    ? (batches!.filter((r: any) => r.hatchability_pct != null)
        .reduce((s: number, r: any) => s + r.hatchability_pct, 0) /
       batches!.filter((r: any) => r.hatchability_pct != null).length)
    : null

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Batches" value={total.toString()} icon={<Egg size={18}/>} color="text-blue-600" />
        <StatCard title="Eggs Set" value={numFmt(totalSet)} icon={<Egg size={18}/>} color="text-green-600" />
        <StatCard title="Chicks Hatched" value={numFmt(totalHatched)} icon={<Bird size={18}/>} color="text-brand-600" />
        <StatCard title="Avg Hatchability" value={avgHatch != null ? `${avgHatch.toFixed(1)}%` : '—'} icon={<TrendingUp size={18}/>} color="text-purple-600" />
      </div>
      <Card padding={false}>
        <Table>
          <thead><tr>
            <Th>Invoice</Th><Th>Hatchery</Th><Th>Setting Date</Th><Th>Hatch Date</Th>
            <Th right>Eggs Set</Th><Th right>Hatched</Th>
            <Th right>Fertility%</Th><Th right>Hatchability%</Th>
          </tr></thead>
          <tbody>
            {(batches ?? []).map((b: any) => (
              <tr key={b.id} className="hover:bg-gray-50">
                <Td className="text-xs font-mono text-brand-700">{b.invoice_no ?? '—'}</Td>
                <Td className="text-xs">{b.hatchery_name ?? '—'}</Td>
                <Td className="text-xs">{fmtDate(b.setting_date)}</Td>
                <Td className="text-xs">{b.hatch_date ? fmtDate(b.hatch_date) : <span className="text-yellow-600">Pending</span>}</Td>
                <Td right className="text-xs">{numFmt(b.eggs_set)}</Td>
                <Td right className="text-xs font-semibold text-green-700">{b.hatched_chicks != null ? numFmt(b.hatched_chicks) : <span className="text-gray-400">—</span>}</Td>
                <Td right className="text-xs">{b.fertility_pct != null ? `${b.fertility_pct}%` : '—'}</Td>
                <Td right className="text-xs font-semibold">{b.hatchability_pct != null ? `${b.hatchability_pct}%` : '—'}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
        {(batches ?? []).length === 0 && <EmptyState icon={<Egg size={32}/>} title="No hatch batches yet" />}
      </Card>
    </div>
  )
}

// ── EGG CONVERSIONS TAB (per-flock view) ─────────────────────────────────────

const EGG_TYPE_LABELS: Record<string, string> = {
  he_grade_a: 'HE Gr A', he_grade_b: 'HE Gr B', he_grade_c: 'HE Gr C',
  je_eggs: 'JE', te_eggs: 'TE', be_eggs: 'BE', le_eggs: 'LE',
}

const EggConversionsTab: React.FC<{ flockId: string }> = ({ flockId }) => {
  const { data: conversions, isLoading } = useQuery({
    queryKey: ['flock_egg_conversions', flockId],
    queryFn: async () => {
      const { data } = await supabase
        .from('egg_conversions')
        .select('*')
        .eq('flock_id', flockId)
        .order('conversion_date', { ascending: false })
      return data ?? []
    }
  })

  if (isLoading) return <Spinner />

  const tl = (v: string) => EGG_TYPE_LABELS[v] ?? v

  return (
    <div className="space-y-4">
      <Card padding={false}>
        <Table>
          <thead><tr>
            <Th>Date</Th><Th>From</Th><Th right>From Qty</Th>
            <Th></Th><Th>To</Th><Th right>To Qty</Th><Th>Reason</Th>
          </tr></thead>
          <tbody>
            {(conversions ?? []).map((c: any) => (
              <tr key={c.id} className="hover:bg-gray-50">
                <Td className="text-xs">{fmtDate(c.conversion_date)}</Td>
                <Td><span className="px-2 py-0.5 bg-red-50 text-red-700 rounded text-xs">{tl(c.from_type)}</span></Td>
                <Td right className="text-xs text-red-600 font-medium">{numFmt(c.from_qty)}</Td>
                <Td className="text-xs text-gray-400">→</Td>
                <Td><span className="px-2 py-0.5 bg-green-50 text-green-700 rounded text-xs">{tl(c.to_type)}</span></Td>
                <Td right className="text-xs text-green-600 font-medium">{numFmt(c.to_qty)}</Td>
                <Td className="text-xs text-gray-400">{c.reason ?? '—'}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
        {(conversions ?? []).length === 0 && <EmptyState icon={<Egg size={32}/>} title="No egg conversions" />}
      </Card>
    </div>
  )
}
