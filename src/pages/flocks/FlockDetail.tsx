import React, { useState, useMemo, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { inr, pct, fmtDate, flockAgeWeeks } from '@/lib/utils'
import {
  Card, CardHeader, Button, Badge, Table, Th, Td,
  SectionHeader, Spinner, StatCard, Divider
} from '@/components/ui'
import {
  Bird, Egg, TrendingUp, ArrowLeft, Calendar,
  BarChart2, DollarSign, Package, Trash2, Upload, Download
} from 'lucide-react'
import toast from 'react-hot-toast'
import { parseFile } from '@/lib/parseFile'

// ── Bulk selection helpers ─────────────────────────────────────────────────────
const CB: React.FC<{ checked: boolean; indeterminate?: boolean; onChange: () => void }> = ({ checked, indeterminate, onChange }) => {
  const ref = React.useRef<HTMLInputElement>(null)
  React.useEffect(() => { if (ref.current) ref.current.indeterminate = !!indeterminate }, [indeterminate])
  return <input ref={ref} type="checkbox" checked={checked} onChange={onChange} className="rounded border-gray-300 text-brand-600 cursor-pointer" />
}

const BulkBar: React.FC<{ count: number; onDelete: () => void; onClear: () => void; loading?: boolean }> = ({ count, onDelete, onClear, loading }) => count === 0 ? null : (
  <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
    <span className="text-sm font-medium text-red-700">{count} selected</span>
    <button onClick={onClear} className="text-xs text-gray-500 hover:text-gray-700 underline">Clear</button>
    <div className="ml-auto">
      <Button variant="danger" size="sm" icon={<Trash2 size={14}/>} loading={loading} onClick={onDelete}>Delete {count} rows</Button>
    </div>
  </div>
)

const ConfirmBulkDelete: React.FC<{ label: string; onConfirm: () => void; onCancel: () => void }> = ({ label, onConfirm, onCancel }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
    <div className="bg-white rounded-xl shadow-xl p-6 w-80">
      <p className="font-semibold text-gray-900 mb-1">Delete records?</p>
      <p className="text-sm text-gray-500 mb-5">{label}</p>
      <div className="flex gap-3 justify-end">
        <Button variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
        <Button variant="danger" size="sm" onClick={onConfirm}>Delete</Button>
      </div>
    </div>
  </div>
)
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip,
  CartesianGrid, BarChart, Bar, Legend
} from 'recharts'

const NHE_LABEL: Record<string, string> = {
  je: 'Jumbo Eggs (JE)', te: 'Table Eggs (TE)', be: 'Broken/Crack Eggs (BE)',
  bird_cull: 'Bird Sales — Cull', bird_lame: 'Bird Sales — Lame',
  bird_weak: 'Bird Sales — Weak', bird_sex_error: 'Bird Sales — Sex Error',
  gas: 'Gas Cylinders', manure: 'Manure / Litter', other: 'Other Income',
}

export const FlockDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const qc = useQueryClient()
  const [tab, setTab] = useState<'overview'|'daily'|'monthly'|'financial'|'transfers'>('overview')
  const [transferForm, setTransferForm] = useState({
    transfer_date: new Date().toISOString().split('T')[0],
    from_farm_id: '', to_farm_id: '', from_shed_id: '', to_shed_id: '',
    female_count: '0', male_count: '0', notes: ''
  })
  const [showTransferForm, setShowTransferForm] = useState(false)
  const [sel, setSel] = useState<Set<string>>(new Set())
  const [bulkConfirm, setBulkConfirm] = useState(false)

  // Date filter state for daily tab
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  // Date filter state for financial tab HE dispatch
  const [heFromDate, setHeFromDate] = useState('')
  const [heToDate, setHeToDate] = useState('')

  // CSV import state
  const [importing, setImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: flock, isLoading } = useQuery({
    queryKey: ['flock', id],
    queryFn: async () => {
      const { data } = await supabase.from('flocks')
        .select('*, rearing_farm:farms!rearing_farm_id(name,code), laying_farm:farms!laying_farm_id(name,code)')
        .eq('id', id!).single()
      return data
    }
  })

  const { data: daily } = useQuery({
    queryKey: ['flock_daily', id],
    queryFn: async () => {
      const { data } = await supabase.from('daily_records')
        .select('*').eq('flock_id', id!).order('record_date')
      return data ?? []
    }
  })

  const { data: heDispatch } = useQuery({
    queryKey: ['flock_he', id],
    queryFn: async () => {
      const { data } = await supabase.from('he_dispatch')
        .select('*').eq('flock_id', id!).order('dispatch_date', { ascending: false })
      return data ?? []
    }
  })

  const { data: nheSales } = useQuery({
    queryKey: ['flock_nhe', id],
    queryFn: async () => {
      const { data } = await supabase.from('nhe_sales')
        .select('*').eq('flock_id', id!).order('sale_date', { ascending: false })
      return data ?? []
    }
  })

  const { data: farms } = useQuery({
    queryKey: ['farms_list'],
    queryFn: async () => {
      const { data } = await supabase.from('farms').select('id,name,code').order('name')
      return data ?? []
    }
  })

  const { data: allSheds } = useQuery({
    queryKey: ['all_sheds'],
    queryFn: async () => {
      const { data } = await supabase.from('sheds').select('id,shed_no,shed_name,farm_id').eq('is_active', true)
      return data ?? []
    }
  })

  const { data: transfers, refetch: refetchTransfers } = useQuery({
    queryKey: ['flock_transfers', id],
    queryFn: async () => {
      const { data } = await supabase.from('flock_transfers')
        .select('*,from_farm:farms!from_farm_id(name),to_farm:farms!to_farm_id(name),from_shed:sheds!from_shed_id(shed_no,shed_name),to_shed:sheds!to_shed_id(shed_no,shed_name)')
        .eq('flock_id', id!).order('transfer_date', { ascending: false })
      return data ?? []
    }
  })

  const addTransferMut = useMutation({
    mutationFn: async () => {
      if (!transferForm.to_farm_id) throw new Error('To Farm is required')
      const payload = {
        flock_id: id,
        transfer_date: transferForm.transfer_date,
        from_farm_id: transferForm.from_farm_id || null,
        to_farm_id: transferForm.to_farm_id,
        from_shed_id: transferForm.from_shed_id || null,
        to_shed_id: transferForm.to_shed_id || null,
        female_count: parseInt(transferForm.female_count) || 0,
        male_count: parseInt(transferForm.male_count) || 0,
        notes: transferForm.notes || null,
      }
      const { error } = await supabase.from('flock_transfers').insert(payload)
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Transfer recorded!')
      qc.invalidateQueries({ queryKey: ['flock_transfers', id] })
      setShowTransferForm(false)
      setTransferForm({ transfer_date: new Date().toISOString().split('T')[0], from_farm_id: '', to_farm_id: '', from_shed_id: '', to_shed_id: '', female_count: '0', male_count: '0', notes: '' })
    },
    onError: (e: any) => toast.error(e.message)
  })

  const { data: medMonthly } = useQuery({
    queryKey: ['flock_med', id],
    queryFn: async () => {
      const { data } = await supabase.from('medicine_monthly')
        .select('*').eq('flock_id', id!).order('month', { ascending: false })
      return data ?? []
    }
  })

  const bulkDelMut = useMutation({
    mutationFn: async (ids: string[]) => { await supabase.from('daily_records').delete().in('id', ids) },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['flock_daily', id] }); setSel(new Set()); setBulkConfirm(false) }
  })

  // dailyIndexMap: maps record id → original ascending index (for week number)
  // MUST be before early returns — useMemo is a hook
  const dailyIndexMap = useMemo<Map<string, number>>(() => {
    const m = new Map<string, number>()
    ;(daily ?? []).forEach((d, i) => m.set(d.id, i))
    return m
  }, [daily])

  // displayDaily: reversed + date filtered
  const displayDaily = useMemo(() => {
    let arr = [...(daily ?? [])].reverse()
    if (fromDate) arr = arr.filter(d => d.record_date >= fromDate)
    if (toDate) arr = arr.filter(d => d.record_date <= toDate)
    return arr
  }, [daily, fromDate, toDate])

  // heDispatch filtered for financial tab
  const displayHeDispatch = useMemo(() => {
    let arr = heDispatch ?? []
    if (heFromDate) arr = arr.filter(d => d.dispatch_date >= heFromDate)
    if (heToDate) arr = arr.filter(d => d.dispatch_date <= heToDate)
    return arr
  }, [heDispatch, heFromDate, heToDate])

  if (isLoading) return <Spinner />
  if (!flock) return <div className="p-8 text-center text-gray-500">Flock not found</div>

  // Computed totals (always from full ascending daily array)
  const totalEggs = daily?.reduce((s, d) => s + (d.total_eggs ?? 0), 0) ?? 0
  const totalHE   = daily?.reduce((s, d) => s + (d.he_eggs ?? 0), 0) ?? 0
  const totalMortF = daily?.reduce((s, d) => s + (d.mortality_female ?? 0), 0) ?? 0
  const totalMortM = daily?.reduce((s, d) => s + (d.mortality_male ?? 0), 0) ?? 0
  const totalTrF   = daily?.reduce((s, d) => s + (d.trcull_female ?? 0), 0) ?? 0
  const totalTrM   = daily?.reduce((s, d) => s + (d.trcull_male ?? 0), 0) ?? 0
  const totalFeedF = daily?.reduce((s, d) => s + (d.feed_female_kg ?? 0), 0) ?? 0
  const totalFeedM = daily?.reduce((s, d) => s + (d.feed_male_kg ?? 0), 0) ?? 0
  const hePct = totalEggs > 0 ? totalHE / totalEggs : 0

  // Bulk selection helpers for daily tab
  const dailyIds = (daily ?? []).map((d: any) => d.id)
  const allDailySel = dailyIds.length > 0 && dailyIds.every((id: string) => sel.has(id))
  const someDailySel = dailyIds.some((id: string) => sel.has(id))
  const toggleDaily = (rowId: string) => setSel(s => { const n = new Set(s); n.has(rowId) ? n.delete(rowId) : n.add(rowId); return n })
  const toggleAllDaily = () => setSel(s => { const n = new Set(s); allDailySel ? dailyIds.forEach((rowId: string) => n.delete(rowId)) : dailyIds.forEach((rowId: string) => n.add(rowId)); return n })

  const heRevenue  = heDispatch?.reduce((s, d) => s + (d.amount ?? 0), 0) ?? 0
  const nheRevenue = nheSales?.reduce((s, d) => s + (d.amount ?? 0), 0) ?? 0
  const medCost    = medMonthly?.reduce((s, m) => s + (m.total_amount ?? 0), 0) ?? 0
  const chickCost  = flock.chick_cost ?? 0
  const totalRevenue = heRevenue + nheRevenue
  const totalCost    = chickCost + medCost

  // Monthly chart data (from full ascending daily array)
  const monthlyData = daily?.reduce((acc: any[], d) => {
    const m = d.record_date.slice(0, 7)
    const existing = acc.find(x => x.month === m)
    if (existing) {
      existing.eggs += d.total_eggs ?? 0
      existing.he   += d.he_eggs ?? 0
      existing.mort += (d.mortality_female ?? 0) + (d.mortality_male ?? 0)
    } else {
      acc.push({ month: m, eggs: d.total_eggs ?? 0, he: d.he_eggs ?? 0,
        mort: (d.mortality_female ?? 0) + (d.mortality_male ?? 0) })
    }
    return acc
  }, []) ?? []

  // lastRecord = last in ascending order = most recent
  const lastRecord = daily?.[daily.length - 1]
  const ageWeeks = flockAgeWeeks(flock.placement_date)

  // CSV template download
  const handleDownloadTemplate = () => {
    const headers = 'flock_no,record_date,opening_female,opening_male,feed_female_kg,feed_male_kg,total_eggs,he_eggs,trcull_female,trcull_male,mortality_female,mortality_male,closing_female,closing_male'
    const blob = new Blob([headers + '\n'], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `daily_records_template.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Import handler (CSV or Excel)
  const handleImport = async (file: File) => {
    setImporting(true)
    try {
      const { headers: hdrs, rows: rawRows } = await parseFile(file)
      if (rawRows.length === 0) { toast.error('Empty file'); return }
      const records = rawRows.map(vals => { const obj: any = {}; hdrs.forEach((h,i) => { obj[h] = vals[i]??'' }); return obj })
      const rows = records.map((r: any) => ({
        flock_id: id,
        record_date: r.record_date,
        opening_female: parseInt(r.opening_female) || null,
        opening_male: parseInt(r.opening_male) || null,
        feed_female_kg: parseFloat(r.feed_female_kg) || null,
        feed_male_kg: parseFloat(r.feed_male_kg) || null,
        total_eggs: parseInt(r.total_eggs) || null,
        he_eggs: parseInt(r.he_eggs) || null,
        trcull_female: parseInt(r.trcull_female) || 0,
        trcull_male: parseInt(r.trcull_male) || 0,
        mortality_female: parseInt(r.mortality_female) || 0,
        mortality_male: parseInt(r.mortality_male) || 0,
        closing_female: parseInt(r.closing_female) || null,
        closing_male: parseInt(r.closing_male) || null,
      })).filter((r: any) => r.record_date)

      const { error } = await supabase.from('daily_records').upsert(rows, { onConflict: 'flock_id,record_date' })
      if (error) throw error
      toast.success(`Imported ${rows.length} records!`)
      qc.invalidateQueries({ queryKey: ['flock_daily', id] })
    } catch (e: any) {
      toast.error('Import failed: ' + e.message)
    } finally {
      setImporting(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/flocks" className="p-2 rounded-lg hover:bg-gray-100">
          <ArrowLeft size={18} className="text-gray-500"/>
        </Link>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">Flock {flock.flock_no}</h1>
            <Badge color={flock.status === 'laying' ? 'green' : flock.status === 'rearing' ? 'yellow' : 'gray'}>
              {flock.status}
            </Badge>
          </div>
          <p className="text-sm text-gray-500 mt-0.5">
            {flock.breed} • {flock.rearing_farm?.name} → {flock.laying_farm?.name} • Age: {ageWeeks} weeks
          </p>
        </div>
        <div className="ml-auto flex gap-2">
          <Link to="/flocks/daily">
            <Button variant="outline" size="sm" icon={<Calendar size={14}/>}>Daily Entry</Button>
          </Link>
        </div>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StatCard title="Total Eggs" value={(totalEggs/100000).toFixed(2)+'L'}
          subtitle="Lifetime production" icon={<Egg size={18}/>} color="text-yellow-600" />
        <StatCard title="HE Eggs" value={(totalHE/100000).toFixed(2)+'L'}
          subtitle={pct(hePct)+' of eggs'} icon={<Egg size={18}/>} color="text-brand-600" />
        <StatCard title="Alive ♀" value={(lastRecord?.closing_female ?? flock.total_placed_f)?.toLocaleString('en-IN')}
          subtitle={'Mortality: '+totalMortF.toLocaleString('en-IN')} icon={<Bird size={18}/>} color="text-green-600" />
        <StatCard title="HE Revenue" value={inr(heRevenue)}
          subtitle="From HE Dispatch records" icon={<DollarSign size={18}/>} color="text-green-700" />
        <StatCard title="Total Revenue" value={inr(totalRevenue)}
          subtitle="HE + NHE all sources" icon={<TrendingUp size={18}/>} color="text-green-700" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {(['overview','daily','monthly','financial','transfers'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors -mb-px
              ${tab === t ? 'border-brand-600 text-brand-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* OVERVIEW TAB */}
      {tab === 'overview' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Bird reconciliation */}
            <Card>
              <CardHeader title="Bird Reconciliation" />
              <table className="w-full text-sm">
                <tbody>
                  {[
                    ['Placed (Paid)', flock.paid_female?.toLocaleString('en-IN')+' F + '+flock.paid_male?.toLocaleString('en-IN')+' M'],
                    ['Placed (Free)', flock.free_female?.toLocaleString('en-IN')+' F + '+flock.free_male?.toLocaleString('en-IN')+' M'],
                    ['Total Placed', flock.total_placed_f?.toLocaleString('en-IN')+' F + '+flock.total_placed_m?.toLocaleString('en-IN')+' M'],
                    ['Tr+Cull (C13/C14)', totalTrF.toLocaleString('en-IN')+' F + '+totalTrM.toLocaleString('en-IN')+' M'],
                    ['Mortality (C15/C16)', totalMortF.toLocaleString('en-IN')+' F + '+totalMortM.toLocaleString('en-IN')+' M'],
                    ['Closing Alive', (lastRecord?.closing_female??0).toLocaleString('en-IN')+' F + '+(lastRecord?.closing_male??0).toLocaleString('en-IN')+' M'],
                  ].map(([label, val]) => (
                    <tr key={label as string} className="border-b border-gray-50 last:border-0">
                      <td className="py-2 text-gray-500 font-medium">{label}</td>
                      <td className="py-2 text-right font-semibold text-gray-900">{val}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>

            {/* Production summary */}
            <Card>
              <CardHeader title="Production Summary" />
              <table className="w-full text-sm">
                <tbody>
                  {[
                    ['Total Eggs', totalEggs.toLocaleString('en-IN')],
                    ['Hatching Eggs (HE)', totalHE.toLocaleString('en-IN')],
                    ['HE %', pct(hePct)],
                    ['HE Dispatched', (heDispatch?.reduce((s,d)=>s+(d.total_dispatched??0),0)??0).toLocaleString('en-IN')],
                    ['Free Eggs (2%)', (heDispatch?.reduce((s,d)=>s+(d.free_eggs??0),0)??0).toLocaleString('en-IN')],
                    ['Feed ♀ (kg)', totalFeedF.toLocaleString('en-IN')],
                    ['Feed ♂ (kg)', totalFeedM.toLocaleString('en-IN')],
                    ['Placement', fmtDate(flock.placement_date)],
                    ['Laying Start', fmtDate(flock.laying_start_date)],
                  ].map(([label, val]) => (
                    <tr key={label as string} className="border-b border-gray-50 last:border-0">
                      <td className="py-2 text-gray-500 font-medium">{label}</td>
                      <td className="py-2 text-right font-semibold text-gray-900">{val}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>

          {/* Chart */}
          {monthlyData.length > 0 && (
            <Card>
              <CardHeader title="Monthly Production" />
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={monthlyData} margin={{ top:4, right:8, bottom:4, left:0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => v.toLocaleString('en-IN')} />
                  <Legend />
                  <Bar dataKey="eggs" fill="#22c55e" name="Total Eggs" />
                  <Bar dataKey="he"   fill="#3b82f6" name="HE Eggs" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          )}
        </div>
      )}

      {/* DAILY TAB */}
      {tab === 'daily' && (
        <>
          {/* Daily tab action bar: import/export buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="sm" icon={<Download size={14}/>} onClick={handleDownloadTemplate}>
              Download Template
            </Button>
            <Button variant="outline" size="sm" icon={<Upload size={14}/>}
              loading={importing}
              onClick={() => fileInputRef.current?.click()}>
              Import CSV
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={e => {
                const file = e.target.files?.[0]
                if (file) handleImport(file)
              }}
            />
          </div>

          {/* Date filter bar */}
          <div className="flex items-center gap-3 flex-wrap bg-gray-50 border border-gray-200 rounded-lg px-4 py-2">
            <span className="text-sm font-medium text-gray-600">Filter:</span>
            <label className="flex items-center gap-1.5 text-sm text-gray-600">
              From
              <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
                className="border border-gray-300 rounded px-2 py-1 text-sm" />
            </label>
            <label className="flex items-center gap-1.5 text-sm text-gray-600">
              To
              <input type="date" value={toDate} onChange={e => setToDate(e.target.value)}
                className="border border-gray-300 rounded px-2 py-1 text-sm" />
            </label>
            {(fromDate || toDate) && (
              <button onClick={() => { setFromDate(''); setToDate('') }}
                className="text-xs text-brand-600 hover:text-brand-800 underline">Clear</button>
            )}
            <span className="text-xs text-gray-500 ml-auto">
              Showing {displayDaily.length} of {daily?.length ?? 0} days
            </span>
          </div>

          <BulkBar count={sel.size} loading={bulkDelMut.isPending} onClear={() => setSel(new Set())} onDelete={() => setBulkConfirm(true)} />
          <Card padding={false}>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-2 py-2 sticky left-0 bg-gray-50"><CB checked={allDailySel} indeterminate={someDailySel && !allDailySel} onChange={toggleAllDaily}/></th>
                    <th className="px-2 py-2 text-left font-semibold text-gray-600 sticky left-0 bg-gray-50">Date</th>
                    <th className="px-2 py-2 text-left font-semibold text-gray-600">Wk</th>
                    <th className="px-2 py-2 text-right font-semibold text-gray-600">Open ♀</th>
                    <th className="px-2 py-2 text-right font-semibold text-gray-600">Open ♂</th>
                    <th className="px-2 py-2 text-right font-semibold text-gray-600">Feed ♀</th>
                    <th className="px-2 py-2 text-right font-semibold text-gray-600">Feed ♂</th>
                    <th className="px-2 py-2 text-right font-semibold text-gray-600">Eggs</th>
                    <th className="px-2 py-2 text-right font-semibold text-gray-600">HD%</th>
                    <th className="px-2 py-2 text-right font-semibold text-gray-600">HE</th>
                    <th className="px-2 py-2 text-right font-semibold text-gray-600">HE%</th>
                    <th className="px-2 py-2 text-right font-semibold text-gray-600">Tr+Cull ♀</th>
                    <th className="px-2 py-2 text-right font-semibold text-gray-600">Mort ♀</th>
                    <th className="px-2 py-2 text-right font-semibold text-gray-600">Mort ♂</th>
                    <th className="px-2 py-2 text-right font-semibold text-gray-600">Close ♀</th>
                    <th className="px-2 py-2 text-right font-semibold text-gray-600">Close ♂</th>
                  </tr>
                </thead>
                <tbody>
                  {displayDaily.map((d) => {
                    const isLayingPeriod = flock.laying_start_date && d.record_date >= flock.laying_start_date
                    const weekNum = Math.floor((dailyIndexMap.get(d.id) ?? 0) / 7) + 1
                    return (
                      <tr key={d.id} className={`border-b border-gray-50 hover:bg-gray-50
                        ${sel.has(d.id) ? 'bg-red-50' : isLayingPeriod ? 'bg-green-50/30' : 'bg-yellow-50/30'}`}>
                        <td className="px-2 py-1.5"><CB checked={sel.has(d.id)} onChange={() => toggleDaily(d.id)}/></td>
                        <td className="px-2 py-1.5 sticky left-0 font-medium"
                          style={{ backgroundColor: sel.has(d.id) ? '#fef2f2' : isLayingPeriod ? '#f0fdf4' : '#fefce8' }}>
                          {fmtDate(d.record_date)}
                        </td>
                        <td className="px-2 py-1.5 text-gray-400">{weekNum}</td>
                        <td className="px-2 py-1.5 text-right">{d.opening_female?.toLocaleString('en-IN')}</td>
                        <td className="px-2 py-1.5 text-right">{d.opening_male?.toLocaleString('en-IN')}</td>
                        <td className="px-2 py-1.5 text-right">{d.feed_female_kg?.toLocaleString('en-IN')}</td>
                        <td className="px-2 py-1.5 text-right">{d.feed_male_kg?.toLocaleString('en-IN')}</td>
                        <td className="px-2 py-1.5 text-right font-medium">{d.total_eggs?.toLocaleString('en-IN')}</td>
                        <td className={`px-2 py-1.5 text-right ${(d.hd_pct??0)>0.85?'text-green-600':'text-orange-500'}`}>
                          {pct(d.hd_pct, 1)}
                        </td>
                        <td className="px-2 py-1.5 text-right font-medium text-blue-600">{d.he_eggs?.toLocaleString('en-IN')}</td>
                        <td className={`px-2 py-1.5 text-right ${(d.he_pct??0)>0.88?'text-green-600':'text-orange-500'}`}>
                          {pct(d.he_pct, 1)}
                        </td>
                        <td className="px-2 py-1.5 text-right text-orange-500">{d.trcull_female > 0 ? d.trcull_female : '—'}</td>
                        <td className="px-2 py-1.5 text-right text-red-500">{d.mortality_female > 0 ? d.mortality_female : '—'}</td>
                        <td className="px-2 py-1.5 text-right text-red-500">{d.mortality_male > 0 ? d.mortality_male : '—'}</td>
                        <td className="px-2 py-1.5 text-right">{d.closing_female?.toLocaleString('en-IN')}</td>
                        <td className="px-2 py-1.5 text-right">{d.closing_male?.toLocaleString('en-IN')}</td>
                      </tr>
                    )
                  })}
                </tbody>
                {/* Totals row */}
                {daily && daily.length > 0 && (
                  <tfoot>
                    <tr className="bg-yellow-50 font-bold text-xs">
                      <td className="px-2 py-2"></td>
                      <td className="px-2 py-2 sticky left-0 bg-yellow-50" colSpan={2}>TOTAL ({daily.length} days)</td>
                      <td className="px-2 py-2 text-right">—</td>
                      <td className="px-2 py-2 text-right">—</td>
                      <td className="px-2 py-2 text-right">{totalFeedF.toLocaleString('en-IN')}</td>
                      <td className="px-2 py-2 text-right">{totalFeedM.toLocaleString('en-IN')}</td>
                      <td className="px-2 py-2 text-right">{totalEggs.toLocaleString('en-IN')}</td>
                      <td className="px-2 py-2 text-right">{pct(hePct,1)}</td>
                      <td className="px-2 py-2 text-right">{totalHE.toLocaleString('en-IN')}</td>
                      <td className="px-2 py-2 text-right">{pct(hePct,1)}</td>
                      <td className="px-2 py-2 text-right">{totalTrF.toLocaleString('en-IN')}</td>
                      <td className="px-2 py-2 text-right">{totalMortF.toLocaleString('en-IN')}</td>
                      <td className="px-2 py-2 text-right">{totalMortM.toLocaleString('en-IN')}</td>
                      <td className="px-2 py-2 text-right">{lastRecord?.closing_female?.toLocaleString('en-IN')}</td>
                      <td className="px-2 py-2 text-right">{lastRecord?.closing_male?.toLocaleString('en-IN')}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </Card>
          {bulkConfirm && (
            <ConfirmBulkDelete label={`Delete ${sel.size} daily records? This cannot be undone.`}
              onConfirm={() => bulkDelMut.mutate([...sel])} onCancel={() => setBulkConfirm(false)} />
          )}
        </>
      )}

      {/* MONTHLY TAB */}
      {tab === 'monthly' && (
        <Card padding={false}>
          <Table>
            <thead><tr>
              <Th>Month</Th><Th right>Days</Th><Th right>Eggs</Th><Th right>HE</Th>
              <Th right>HE%</Th><Th right>Avg Open ♀</Th><Th right>Mort ♀</Th>
              <Th right>Feed ♀ kg</Th><Th right>Feed ♂ kg</Th>
            </tr></thead>
            <tbody>
              {monthlyData.map((m: any) => {
                const monthDaily = daily?.filter(d => d.record_date.startsWith(m.month)) ?? []
                const avgF = monthDaily.reduce((s, d) => s + (d.opening_female ?? 0), 0) / Math.max(monthDaily.length, 1)
                const feedF = monthDaily.reduce((s, d) => s + (d.feed_female_kg ?? 0), 0)
                const feedM = monthDaily.reduce((s, d) => s + (d.feed_male_kg ?? 0), 0)
                const mortF = monthDaily.reduce((s, d) => s + (d.mortality_female ?? 0), 0)
                return (
                  <tr key={m.month} className="hover:bg-gray-50">
                    <Td className="font-medium">{m.month}</Td>
                    <Td right>{monthDaily.length}</Td>
                    <Td right className="font-medium">{m.eggs.toLocaleString('en-IN')}</Td>
                    <Td right className="text-blue-600 font-medium">{m.he.toLocaleString('en-IN')}</Td>
                    <Td right>
                      <span className={m.eggs > 0 && (m.he/m.eggs) > 0.88 ? 'text-green-600' : 'text-orange-500'}>
                        {m.eggs > 0 ? pct(m.he/m.eggs) : '—'}
                      </span>
                    </Td>
                    <Td right>{Math.round(avgF).toLocaleString('en-IN')}</Td>
                    <Td right className="text-red-500">{mortF > 0 ? mortF : '—'}</Td>
                    <Td right>{feedF.toLocaleString('en-IN')}</Td>
                    <Td right>{feedM.toLocaleString('en-IN')}</Td>
                  </tr>
                )
              })}
            </tbody>
          </Table>
        </Card>
      )}

      {/* TRANSFERS TAB */}
      {tab === 'transfers' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-800">Flock Transfers</h3>
            <Button size="sm" onClick={() => setShowTransferForm(v => !v)}>
              {showTransferForm ? 'Cancel' : '+ Add Transfer'}
            </Button>
          </div>

          {showTransferForm && (
            <Card>
              <CardHeader title="New Transfer" />
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Transfer Date</label>
                    <input type="date" value={transferForm.transfer_date}
                      onChange={e => setTransferForm(f => ({ ...f, transfer_date: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">From Farm</label>
                    <select value={transferForm.from_farm_id}
                      onChange={e => setTransferForm(f => ({ ...f, from_farm_id: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                      <option value="">— None —</option>
                      {(farms ?? []).map((fm: any) => <option key={fm.id} value={fm.id}>{fm.name} ({fm.code})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">To Farm *</label>
                    <select value={transferForm.to_farm_id}
                      onChange={e => setTransferForm(f => ({ ...f, to_farm_id: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                      <option value="">— Select —</option>
                      {(farms ?? []).map((fm: any) => <option key={fm.id} value={fm.id}>{fm.name} ({fm.code})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">From Shed</label>
                    <select value={transferForm.from_shed_id}
                      onChange={e => setTransferForm(f => ({ ...f, from_shed_id: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                      <option value="">— None —</option>
                      {(allSheds ?? []).filter((s: any) => !transferForm.from_farm_id || s.farm_id === transferForm.from_farm_id).map((s: any) => <option key={s.id} value={s.id}>{s.shed_no}{s.shed_name ? ' — '+s.shed_name : ''}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">To Shed</label>
                    <select value={transferForm.to_shed_id}
                      onChange={e => setTransferForm(f => ({ ...f, to_shed_id: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                      <option value="">— None —</option>
                      {(allSheds ?? []).filter((s: any) => !transferForm.to_farm_id || s.farm_id === transferForm.to_farm_id).map((s: any) => <option key={s.id} value={s.id}>{s.shed_no}{s.shed_name ? ' — '+s.shed_name : ''}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Female Count</label>
                    <input type="number" min="0" value={transferForm.female_count}
                      onChange={e => setTransferForm(f => ({ ...f, female_count: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Male Count</label>
                    <input type="number" min="0" value={transferForm.male_count}
                      onChange={e => setTransferForm(f => ({ ...f, male_count: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <input type="text" value={transferForm.notes}
                      onChange={e => setTransferForm(f => ({ ...f, notes: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                      placeholder="Optional notes..." />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => setShowTransferForm(false)}>Cancel</Button>
                  <Button size="sm" loading={addTransferMut.isPending} onClick={() => addTransferMut.mutate()}>Save Transfer</Button>
                </div>
              </div>
            </Card>
          )}

          <Card padding={false}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-3 py-2 text-left font-semibold text-gray-600">Date</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-600">From</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-600">To</th>
                    <th className="px-3 py-2 text-right font-semibold text-gray-600">♀ Count</th>
                    <th className="px-3 py-2 text-right font-semibold text-gray-600">♂ Count</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-600">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {(transfers ?? []).length === 0 ? (
                    <tr><td colSpan={6} className="px-3 py-6 text-center text-gray-400 text-sm">No transfers recorded yet</td></tr>
                  ) : (transfers ?? []).map((t: any) => (
                    <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-3 py-2 whitespace-nowrap">{fmtDate(t.transfer_date)}</td>
                      <td className="px-3 py-2 text-sm">
                        <span className="font-medium">{t.from_farm?.name ?? '—'}</span>
                        {t.from_shed && <span className="text-gray-400 text-xs ml-1">/ {t.from_shed.shed_no}{t.from_shed.shed_name ? ' '+t.from_shed.shed_name : ''}</span>}
                      </td>
                      <td className="px-3 py-2 text-sm">
                        <span className="font-medium text-brand-700">{t.to_farm?.name ?? '—'}</span>
                        {t.to_shed && <span className="text-gray-400 text-xs ml-1">/ {t.to_shed.shed_no}{t.to_shed.shed_name ? ' '+t.to_shed.shed_name : ''}</span>}
                      </td>
                      <td className="px-3 py-2 text-right">{t.female_count > 0 ? t.female_count.toLocaleString('en-IN') : '—'}</td>
                      <td className="px-3 py-2 text-right">{t.male_count > 0 ? t.male_count.toLocaleString('en-IN') : '—'}</td>
                      <td className="px-3 py-2 text-gray-500 text-xs">{t.notes ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* FINANCIAL TAB */}
      {tab === 'financial' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Card>
              <CardHeader title="Revenue" />
              <table className="w-full text-sm">
                <tbody>
                  <tr className="border-b border-gray-50">
                    <td className="py-2 text-gray-500">HE Revenue</td>
                    <td className="py-2 text-right font-semibold text-green-700">{inr(heRevenue)}</td>
                  </tr>
                  {/* NHE by type */}
                  {Object.entries(nheSales?.reduce((acc: any, s: any) => {
                    acc[s.sale_type] = (acc[s.sale_type] ?? 0) + s.amount; return acc
                  }, {}) ?? {}).map(([type, amt]: any) => (
                    <tr key={type} className="border-b border-gray-50">
                      <td className="py-2 text-gray-500 pl-4">• {NHE_LABEL[type] ?? type}</td>
                      <td className="py-2 text-right font-medium">{inr(amt)}</td>
                    </tr>
                  ))}
                  <tr className="bg-green-50">
                    <td className="py-2 font-bold">TOTAL REVENUE</td>
                    <td className="py-2 text-right font-bold text-green-700 text-base">{inr(totalRevenue)}</td>
                  </tr>
                </tbody>
              </table>
            </Card>
            <Card>
              <CardHeader title="Cost" />
              <table className="w-full text-sm">
                <tbody>
                  <tr className="border-b border-gray-50">
                    <td className="py-2 text-gray-500">Chick Cost ({flock.paid_female+flock.paid_male} paid × Rs{flock.chick_rate})</td>
                    <td className="py-2 text-right font-semibold">{inr(chickCost)}</td>
                  </tr>
                  <tr className="border-b border-gray-50">
                    <td className="py-2 text-gray-500">Medicine & Vaccine</td>
                    <td className="py-2 text-right font-semibold">{inr(medCost)}</td>
                  </tr>
                  <tr className="border-b border-gray-50">
                    <td className="py-2 text-gray-500 text-xs">Feed Cost (See Feed Report for calculation)</td>
                    <td className="py-2 text-right text-xs text-gray-400">See Reports</td>
                  </tr>
                  <tr className="border-b border-gray-50">
                    <td className="py-2 text-gray-500 text-xs">Salary / Electricity / Bonus</td>
                    <td className="py-2 text-right text-xs text-gray-400">Allocated separately</td>
                  </tr>
                  <tr className="bg-orange-50">
                    <td className="py-2 font-bold">Partial Cost (no feed/salary/elec)</td>
                    <td className="py-2 text-right font-bold text-orange-700">{inr(totalCost)}</td>
                  </tr>
                </tbody>
              </table>
            </Card>
          </div>
          {/* HE Dispatch table */}
          <Card>
            <CardHeader title={`HE Dispatch (${heDispatch?.length ?? 0} records)`} />
            {/* Date filter for HE dispatch */}
            <div className="flex items-center gap-3 flex-wrap mb-3 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2">
              <span className="text-sm font-medium text-gray-600">Filter:</span>
              <label className="flex items-center gap-1.5 text-sm text-gray-600">
                From
                <input type="date" value={heFromDate} onChange={e => setHeFromDate(e.target.value)}
                  className="border border-gray-300 rounded px-2 py-1 text-sm" />
              </label>
              <label className="flex items-center gap-1.5 text-sm text-gray-600">
                To
                <input type="date" value={heToDate} onChange={e => setHeToDate(e.target.value)}
                  className="border border-gray-300 rounded px-2 py-1 text-sm" />
              </label>
              {(heFromDate || heToDate) && (
                <button onClick={() => { setHeFromDate(''); setHeToDate('') }}
                  className="text-xs text-brand-600 hover:text-brand-800 underline">Clear</button>
              )}
              <span className="text-xs text-gray-500 ml-auto">
                Showing {displayHeDispatch.length} of {heDispatch?.length ?? 0} records
              </span>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <thead><tr>
                  <Th>Dispatch Date</Th><Th>Prod Date</Th><Th right>DC No</Th>
                  <Th right>Dispatched</Th><Th right>Free</Th><Th right>Invoice</Th>
                  <Th right>Rate</Th><Th right>Amount</Th>
                </tr></thead>
                <tbody>
                  {displayHeDispatch.map((d: any) => (
                    <tr key={d.id} className="hover:bg-gray-50">
                      <Td className="text-xs">{fmtDate(d.dispatch_date)}</Td>
                      <Td className="text-xs text-gray-400">{fmtDate(d.prod_date)}</Td>
                      <Td right className="text-xs">{d.dc_no}</Td>
                      <Td right>{d.total_dispatched?.toLocaleString('en-IN')}</Td>
                      <Td right className="text-xs text-orange-500">{d.free_eggs > 0 ? d.free_eggs : '—'}</Td>
                      <Td right>{d.invoice_eggs?.toLocaleString('en-IN')}</Td>
                      <Td right className="text-xs">{d.rate ? `Rs ${d.rate}` : '—'}</Td>
                      <Td right className="font-semibold text-green-700">{d.amount ? inr(d.amount) : '—'}</Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
