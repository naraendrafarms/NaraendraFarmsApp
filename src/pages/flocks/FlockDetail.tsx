import React, { useState, useMemo, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { inr, pct, fmtDate, flockAgeWeeks } from '@/lib/utils'
import {
  Card, CardHeader, Button, Badge, Table, Th, Td,
  SectionHeader, Spinner, StatCard, Divider, Input, Select
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
  const [tab, setTab] = useState<'overview'|'daily'|'monthly'|'financial'|'transfers'|'placements'>('overview')
  const [placementForm, setPlacementForm] = useState({ allocated_date: '', shed_id: '', female_count: '', male_count: '', notes: '' })
  const [editPlacementId, setEditPlacementId] = useState<string|null>(null)
  const [showPlacementForm, setShowPlacementForm] = useState(false)
  const [selPlacements, setSelPlacements] = useState<Set<string>>(new Set())
  const [bulkPlacementConfirm, setBulkPlacementConfirm] = useState(false)
  const transferImportRef = useRef<HTMLInputElement>(null)
  const blankTransfer = () => ({
    transfer_date: new Date().toISOString().split('T')[0],
    from_farm_id: '', to_farm_id: '', from_shed_id: '', to_shed_id: '',
    female_count: '0', male_count: '0',
    sex_error_female: '0', sex_error_male: '0',
    sold_female: '0', sold_male: '0',
    is_final_transfer: false, notes: ''
  })
  const [transferForm, setTransferForm] = useState(blankTransfer())
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

  const { data: placements } = useQuery({
    queryKey: ['flock_placements', id],
    queryFn: async () => {
      const { data } = await supabase.from('shed_allocations')
        .select('*,shed:sheds(shed_no,shed_name,capacity_female,capacity_male,total_boxes,birds_per_box)')
        .eq('flock_id', id!).order('allocated_date')
      return data ?? []
    }
  })

  const savePlacementMut = useMutation({
    mutationFn: async () => {
      if (!placementForm.allocated_date) throw new Error('Date required')
      const payload = {
        flock_id: id,
        farm_id: flock?.rearing_farm_id ?? flock?.laying_farm_id,
        allocated_date: placementForm.allocated_date,
        shed_id: placementForm.shed_id || null,
        female_count: parseInt(placementForm.female_count) || 0,
        male_count: parseInt(placementForm.male_count) || 0,
        notes: placementForm.notes || null,
      }
      if (editPlacementId) {
        const { error } = await supabase.from('shed_allocations').update(payload).eq('id', editPlacementId)
        if (error) throw error
      } else {
        const { error } = await supabase.from('shed_allocations').insert(payload)
        if (error) throw error
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['flock_placements', id] })
      qc.invalidateQueries({ queryKey: ['flock', id] })
      qc.invalidateQueries({ queryKey: ['flock_dashboard'] })
      setPlacementForm({ allocated_date: '', shed_id: '', female_count: '', male_count: '', notes: '' })
      setEditPlacementId(null); setShowPlacementForm(false)
      toast.success(editPlacementId ? 'Placement updated' : 'Placement recorded')
    },
    onError: (e: any) => toast.error(e.message)
  })

  const delPlacementMut = useMutation({
    mutationFn: async (pid: string) => {
      const { error } = await supabase.from('shed_allocations').delete().eq('id', pid)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['flock_placements', id] })
      qc.invalidateQueries({ queryKey: ['flock', id] })
      toast.success('Deleted')
    },
    onError: (e: any) => toast.error(e.message)
  })

  const bulkDelPlacementMut = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from('shed_allocations').delete().in('id', ids)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['flock_placements', id] })
      qc.invalidateQueries({ queryKey: ['flock', id] })
      setSelPlacements(new Set()); setBulkPlacementConfirm(false)
      toast.success('Deleted')
    },
    onError: (e: any) => toast.error(e.message)
  })

  const addTransferMut = useMutation({
    mutationFn: async () => {
      if (!transferForm.to_farm_id) throw new Error('To Farm is required')
      const trF = parseInt(transferForm.female_count) || 0
      const trM = parseInt(transferForm.male_count) || 0
      const payload = {
        flock_id: id,
        transfer_date: transferForm.transfer_date,
        from_farm_id: transferForm.from_farm_id || null,
        to_farm_id: transferForm.to_farm_id,
        from_shed_id: transferForm.from_shed_id || null,
        to_shed_id: transferForm.to_shed_id || null,
        female_count: trF,
        male_count: trM,
        sex_error_female: parseInt(transferForm.sex_error_female) || 0,
        sex_error_male: parseInt(transferForm.sex_error_male) || 0,
        sold_female: parseInt(transferForm.sold_female) || 0,
        sold_male: parseInt(transferForm.sold_male) || 0,
        is_final_transfer: transferForm.is_final_transfer,
        notes: transferForm.notes || null,
      }
      const { error } = await supabase.from('flock_transfers').insert(payload)
      if (error) throw error

      // Auto-deduct transferred birds from daily record for that date
      if (trF > 0 || trM > 0) {
        const { data: dr } = await supabase.from('daily_records')
          .select('id,transfer_female,transfer_male,opening_female,opening_male,cull_female,cull_male,mortality_female,mortality_male')
          .eq('flock_id', id!).eq('record_date', transferForm.transfer_date).maybeSingle()
        const newTrF = (dr?.transfer_female ?? 0) + trF
        const newTrM = (dr?.transfer_male ?? 0) + trM
        const closingF = Math.max(0, (dr?.opening_female ?? 0) - newTrF - (dr?.cull_female ?? 0) - (dr?.mortality_female ?? 0))
        const closingM = Math.max(0, (dr?.opening_male ?? 0) - newTrM - (dr?.cull_male ?? 0) - (dr?.mortality_male ?? 0))
        const trcullF = newTrF + (dr?.cull_female ?? 0)
        const trcullM = newTrM + (dr?.cull_male ?? 0)
        if (dr) {
          await supabase.from('daily_records').update({
            transfer_female: newTrF, transfer_male: newTrM,
            trcull_female: trcullF, trcull_male: trcullM,
            ...(dr.opening_female ? { closing_female: closingF, closing_male: closingM } : {})
          }).eq('id', dr.id)
        } else {
          await supabase.from('daily_records').insert({
            flock_id: id!, record_date: transferForm.transfer_date,
            transfer_female: trF, transfer_male: trM,
            trcull_female: trF, trcull_male: trM,
            cull_female: 0, cull_male: 0,
            mortality_female: 0, mortality_male: 0,
          })
        }
      }

      // If marked as final transfer, update flock status to laying
      if (transferForm.is_final_transfer) {
        const { error: fe } = await supabase.from('flocks').update({
          status: 'laying',
          laying_farm_id: transferForm.to_farm_id,
          laying_start_date: transferForm.transfer_date,
        }).eq('id', id!)
        if (fe) throw fe
      }
    },
    onSuccess: () => {
      toast.success(transferForm.is_final_transfer ? 'Transfer complete! Flock status → Laying' : 'Transfer recorded!')
      qc.invalidateQueries({ queryKey: ['flock_transfers', id] })
      qc.invalidateQueries({ queryKey: ['flock_daily', id] })
      qc.invalidateQueries({ queryKey: ['flock', id] })
      setShowTransferForm(false)
      setTransferForm(blankTransfer())
    },
    onError: (e: any) => toast.error(e.message)
  })

  const handleTransferImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    const text = await file.text()
    const lines = text.split('\n').filter(l => l.trim())
    if (lines.length < 2) { toast.error('Empty file'); return }
    const hdrs = lines[0].split(',').map(h => h.replace(/"/g,'').trim().toLowerCase().replace(/\s+/g,'_'))
    const col = (n: string) => hdrs.indexOf(n)
    const { data: allFarmsData } = await supabase.from('farms').select('id,name,code')
    const farmMap: Record<string,string> = {}
    for (const f of allFarmsData??[]) { farmMap[f.name.toLowerCase()] = f.id; farmMap[f.code?.toLowerCase()] = f.id }
    let saved = 0
    for (const line of lines.slice(1)) {
      const vals = line.split(',').map(v => v.replace(/"/g,'').trim())
      const fromFarm = farmMap[vals[col('from_farm')]?.toLowerCase()]
      const toFarm = farmMap[vals[col('to_farm')]?.toLowerCase()]
      if (!vals[col('transfer_date')] || !toFarm) continue
      await supabase.from('flock_transfers').insert({
        flock_id: id,
        transfer_date: vals[col('transfer_date')],
        from_farm_id: fromFarm || null,
        to_farm_id: toFarm,
        female_count: parseInt(vals[col('female_count')])||0,
        male_count: parseInt(vals[col('male_count')])||0,
        sex_error_female: parseInt(vals[col('sex_error_female')])||0,
        sex_error_male: parseInt(vals[col('sex_error_male')])||0,
        sold_female: parseInt(vals[col('sold_female')])||0,
        sold_male: parseInt(vals[col('sold_male')])||0,
        notes: vals[col('notes')]||null,
      })
      saved++
    }
    toast.success(`Imported ${saved} transfer records`)
    qc.invalidateQueries({ queryKey: ['flock_transfers', id] })
    if (e.target) e.target.value = ''
  }

  const { data: medMonthly } = useQuery({
    queryKey: ['flock_med', id],
    queryFn: async () => {
      const { data } = await supabase.from('medicine_monthly')
        .select('*').eq('flock_id', id!).order('month', { ascending: false })
      return data ?? []
    }
  })

  const bulkDelMut = useMutation({
    mutationFn: async (dates: string[]) => {
      // collect all raw record IDs for the selected dates (handles multi-shed)
      const allIds = dailyAggregated
        .filter((d: any) => dates.includes(d.record_date))
        .flatMap((d: any) => d._ids as string[])
      const { error } = await supabase.from('daily_records').delete().in('id', allIds)
      if (error) throw error
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['flock_daily', id] }); setSel(new Set()); setBulkConfirm(false) },
    onError: (e: any) => toast.error(e.message),
  })

  // dailyIndexMap: maps record_date → ascending day index (for week number)
  // MUST be before early returns — useMemo is a hook
  const dailyIndexMap = useMemo<Map<string, number>>(() => {
    const m = new Map<string, number>()
    const dates = [...new Set((daily ?? []).map(d => d.record_date))].sort()
    dates.forEach((date, i) => m.set(date, i))
    return m
  }, [daily])

  // dailyAggregated: group by date, sum all shed values into one row per day
  const dailyAggregated = useMemo(() => {
    const map = new Map<string, any>()
    for (const d of daily ?? []) {
      const ex = map.get(d.record_date)
      if (!ex) {
        map.set(d.record_date, {
          ...d,
          _ids: [d.id],
          _sheds: 1,
        })
      } else {
        ex._ids.push(d.id)
        ex._sheds += 1
        ex.opening_female   = (ex.opening_female   ?? 0) + (d.opening_female   ?? 0)
        ex.opening_male     = (ex.opening_male     ?? 0) + (d.opening_male     ?? 0)
        ex.feed_female_kg   = (ex.feed_female_kg   ?? 0) + (d.feed_female_kg   ?? 0)
        ex.feed_male_kg     = (ex.feed_male_kg     ?? 0) + (d.feed_male_kg     ?? 0)
        ex.total_eggs       = (ex.total_eggs       ?? 0) + (d.total_eggs       ?? 0)
        ex.he_eggs          = (ex.he_eggs          ?? 0) + (d.he_eggs          ?? 0)
        ex.mortality_female = (ex.mortality_female ?? 0) + (d.mortality_female ?? 0)
        ex.mortality_male   = (ex.mortality_male   ?? 0) + (d.mortality_male   ?? 0)
        ex.cull_female      = (ex.cull_female      ?? 0) + (d.cull_female      ?? 0)
        ex.cull_male        = (ex.cull_male        ?? 0) + (d.cull_male        ?? 0)
        ex.transfer_female  = (ex.transfer_female  ?? 0) + (d.transfer_female  ?? 0)
        ex.trcull_female    = (ex.trcull_female    ?? 0) + (d.trcull_female    ?? 0)
        ex.closing_female   = (ex.closing_female   ?? 0) + (d.closing_female   ?? 0)
        ex.closing_male     = (ex.closing_male     ?? 0) + (d.closing_male     ?? 0)
        const openF = ex.opening_female ?? 0
        ex.hd_pct = openF > 0 ? (ex.total_eggs ?? 0) / openF : null
        ex.he_pct = (ex.total_eggs ?? 0) > 0 ? (ex.he_eggs ?? 0) / (ex.total_eggs ?? 0) : null
      }
    }
    return Array.from(map.values()) // ascending by date (Map preserves insertion order and daily is ordered asc)
  }, [daily])

  // displayDaily: reversed + date filtered (one row per date, aggregated across sheds)
  const displayDaily = useMemo(() => {
    let arr = [...dailyAggregated].reverse()
    if (fromDate) arr = arr.filter(d => d.record_date >= fromDate)
    if (toDate) arr = arr.filter(d => d.record_date <= toDate)
    return arr
  }, [dailyAggregated, fromDate, toDate])

  const uniqueDates = dailyAggregated.length

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
  const totalTrF   = daily?.reduce((s, d) => s + (d.transfer_female ?? d.trcull_female ?? 0), 0) ?? 0
  const totalTrM   = daily?.reduce((s, d) => s + (d.transfer_male   ?? d.trcull_male   ?? 0), 0) ?? 0
  const totalCullF = daily?.reduce((s, d) => s + (d.cull_female ?? 0), 0) ?? 0
  const totalCullM = daily?.reduce((s, d) => s + (d.cull_male   ?? 0), 0) ?? 0
  const totalFeedF = daily?.reduce((s, d) => s + (d.feed_female_kg ?? 0), 0) ?? 0
  const totalFeedM = daily?.reduce((s, d) => s + (d.feed_male_kg ?? 0), 0) ?? 0
  const hePct = totalEggs > 0 ? totalHE / totalEggs : 0

  // Bulk selection helpers for daily tab (select by date, delete all shed rows for that date)
  const dailyDates = dailyAggregated.map((d: any) => d.record_date)
  const allDailySel = dailyDates.length > 0 && dailyDates.every((dt: string) => sel.has(dt))
  const someDailySel = dailyDates.some((dt: string) => sel.has(dt))
  const toggleDaily = (dt: string) => setSel(s => { const n = new Set(s); n.has(dt) ? n.delete(dt) : n.add(dt); return n })
  const toggleAllDaily = () => setSel(s => { const n = new Set(s); allDailySel ? dailyDates.forEach((dt: string) => n.delete(dt)) : dailyDates.forEach((dt: string) => n.add(dt)); return n })

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

  // Aggregate the most recent date's records across all sheds
  const lastDate = daily?.length ? daily[daily.length - 1].record_date : null
  const lastDateRecords = daily?.filter(d => d.record_date === lastDate) ?? []
  const lastRecord = lastDate ? {
    ...lastDateRecords[0],
    closing_female: lastDateRecords.reduce((s, d) => s + (d.closing_female ?? 0), 0),
    closing_male:   lastDateRecords.reduce((s, d) => s + (d.closing_male   ?? 0), 0),
    opening_female: lastDateRecords.reduce((s, d) => s + (d.opening_female ?? 0), 0),
    opening_male:   lastDateRecords.reduce((s, d) => s + (d.opening_male   ?? 0), 0),
    total_eggs:     lastDateRecords.reduce((s, d) => s + (d.total_eggs     ?? 0), 0),
    he_eggs:        lastDateRecords.reduce((s, d) => s + (d.he_eggs        ?? 0), 0),
    feed_female_kg: lastDateRecords.reduce((s, d) => s + (d.feed_female_kg ?? 0), 0),
    feed_male_kg:   lastDateRecords.reduce((s, d) => s + (d.feed_male_kg   ?? 0), 0),
  } : null
  const ageWeeks = flockAgeWeeks(flock.placement_date)

  // CSV template download
  const handleDownloadTemplate = () => {
    const headers = 'flock_no,record_date,opening_female,opening_male,feed_female_kg,feed_male_kg,total_eggs,he_eggs,transfer_female,transfer_male,cull_female,cull_male,mortality_female,mortality_male,closing_female,closing_male'
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
        transfer_female: parseInt(r.transfer_female) || parseInt(r.trcull_female) || 0,
        transfer_male:   parseInt(r.transfer_male)   || parseInt(r.trcull_male)   || 0,
        cull_female:     parseInt(r.cull_female) || 0,
        cull_male:       parseInt(r.cull_male)   || 0,
        trcull_female:   (parseInt(r.transfer_female)||0) + (parseInt(r.cull_female)||0) || parseInt(r.trcull_female) || 0,
        trcull_male:     (parseInt(r.transfer_male)||0) + (parseInt(r.cull_male)||0) || parseInt(r.trcull_male) || 0,
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
            {flock.breed} • {flock.rearing_farm?.name ?? '—'}{flock.laying_farm?.name ? ` → ${flock.laying_farm.name}` : ''} • Age: {ageWeeks} weeks
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
        {(['overview','placements','daily','monthly','financial','transfers'] as const).map(t => (
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
                    ['Transfers', totalTrF.toLocaleString('en-IN')+' F + '+totalTrM.toLocaleString('en-IN')+' M'],
                    ['Culls Removed', totalCullF.toLocaleString('en-IN')+' F + '+totalCullM.toLocaleString('en-IN')+' M'],
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
              Showing {displayDaily.length} of {uniqueDates} days
              {daily && daily.length > uniqueDates ? ` (${daily.length} records across ${uniqueDates} days, multi-shed aggregated)` : ''}
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
                    <th className="px-2 py-2 text-left font-semibold text-gray-600">Wk/Day</th>
                    <th className="px-2 py-2 text-right font-semibold text-gray-600">Open ♀</th>
                    <th className="px-2 py-2 text-right font-semibold text-gray-600">Open ♂</th>
                    <th className="px-2 py-2 text-right font-semibold text-gray-600">Feed ♀</th>
                    <th className="px-2 py-2 text-right font-semibold text-gray-600">Feed ♂</th>
                    <th className="px-2 py-2 text-right font-semibold text-gray-600">Eggs</th>
                    <th className="px-2 py-2 text-right font-semibold text-gray-600">HD%</th>
                    <th className="px-2 py-2 text-right font-semibold text-gray-600">HE</th>
                    <th className="px-2 py-2 text-right font-semibold text-gray-600">HE%</th>
                    <th className="px-2 py-2 text-right font-semibold text-gray-600">Tr ♀</th>
                    <th className="px-2 py-2 text-right font-semibold text-gray-600">Cull ♀</th>
                    <th className="px-2 py-2 text-right font-semibold text-gray-600">Mort ♀</th>
                    <th className="px-2 py-2 text-right font-semibold text-gray-600">Mort ♂</th>
                    <th className="px-2 py-2 text-right font-semibold text-gray-600">Close ♀</th>
                    <th className="px-2 py-2 text-right font-semibold text-gray-600">Close ♂</th>
                  </tr>
                </thead>
                <tbody>
                  {displayDaily.map((d) => {
                    const isLayingPeriod = flock.laying_start_date && d.record_date >= flock.laying_start_date
                    const dayAge = flock.placement_date
                      ? Math.floor((new Date(d.record_date).getTime() - new Date(flock.placement_date).getTime()) / 86400000)
                      : (dailyIndexMap.get(d.record_date) ?? 0)
                    const weekNum = Math.floor(dayAge / 7) + 1
                    const dayInWeek = (dayAge % 7) + 1
                    return (
                      <tr key={d.record_date} className={`border-b border-gray-50 hover:bg-gray-50
                        ${sel.has(d.record_date) ? 'bg-red-50' : isLayingPeriod ? 'bg-green-50/30' : 'bg-yellow-50/30'}`}>
                        <td className="px-2 py-1.5"><CB checked={sel.has(d.record_date)} onChange={() => toggleDaily(d.record_date)}/></td>
                        <td className="px-2 py-1.5 sticky left-0 font-medium"
                          style={{ backgroundColor: sel.has(d.record_date) ? '#fef2f2' : isLayingPeriod ? '#f0fdf4' : '#fefce8' }}>
                          {fmtDate(d.record_date)}{d._sheds > 1 ? <span className="ml-1 text-blue-400 text-[10px]">{d._sheds} sheds</span> : ''}
                        </td>
                        <td className="px-2 py-1.5 text-gray-400 text-xs whitespace-nowrap">W{weekNum} D{dayInWeek}</td>
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
                        <td className="px-2 py-1.5 text-right text-blue-500">{(d.transfer_female??d.trcull_female??0) > 0 ? (d.transfer_female??d.trcull_female) : '—'}</td>
                        <td className="px-2 py-1.5 text-right text-orange-500">{(d.cull_female??0) > 0 ? d.cull_female : '—'}</td>
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
                      <td className="px-2 py-2 sticky left-0 bg-yellow-50" colSpan={2}>TOTAL ({uniqueDates} days)</td>
                      <td className="px-2 py-2 text-right">—</td>
                      <td className="px-2 py-2 text-right">—</td>
                      <td className="px-2 py-2 text-right">{totalFeedF.toLocaleString('en-IN')}</td>
                      <td className="px-2 py-2 text-right">{totalFeedM.toLocaleString('en-IN')}</td>
                      <td className="px-2 py-2 text-right">{totalEggs.toLocaleString('en-IN')}</td>
                      <td className="px-2 py-2 text-right">{pct(hePct,1)}</td>
                      <td className="px-2 py-2 text-right">{totalHE.toLocaleString('en-IN')}</td>
                      <td className="px-2 py-2 text-right">{pct(hePct,1)}</td>
                      <td className="px-2 py-2 text-right">{totalTrF.toLocaleString('en-IN')}</td>
                      <td className="px-2 py-2 text-right">{totalCullF.toLocaleString('en-IN')}</td>
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

      {/* PLACEMENTS TAB */}
      {tab === 'placements' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="font-semibold text-gray-800">Chick Placements</h3>
              <p className="text-xs text-gray-400 mt-0.5">Record each batch of chicks received — per shed, per day. Total Placed on the flock updates automatically.</p>
            </div>
            <Button size="sm" onClick={() => { setPlacementForm({ allocated_date: flock?.placement_date ?? '', shed_id: '', female_count: '', male_count: '', notes: '' }); setEditPlacementId(null); setShowPlacementForm(true) }}>
              + Add Placement
            </Button>
          </div>

          {showPlacementForm && (
            <Card>
              <CardHeader title={editPlacementId ? 'Edit Placement' : 'Record Chick Intake'} />
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Date Received" type="date" required value={placementForm.allocated_date}
                    onChange={e => setPlacementForm(f => ({ ...f, allocated_date: e.target.value }))} />
                  <Select label="Shed" placeholder="— Select shed —"
                    options={(allSheds ?? []).map((s: any) => ({ value: s.id, label: `${s.shed_no}${s.shed_name ? ' — ' + s.shed_name : ''}` }))}
                    value={placementForm.shed_id}
                    onChange={e => setPlacementForm(f => ({ ...f, shed_id: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Female Count" type="number" required value={placementForm.female_count}
                    onChange={e => setPlacementForm(f => ({ ...f, female_count: e.target.value }))} />
                  <Input label="Male Count" type="number" value={placementForm.male_count}
                    onChange={e => setPlacementForm(f => ({ ...f, male_count: e.target.value }))} />
                </div>
                <Input label="Notes" value={placementForm.notes}
                  onChange={e => setPlacementForm(f => ({ ...f, notes: e.target.value }))} />
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" size="sm" onClick={() => { setShowPlacementForm(false); setEditPlacementId(null) }}>Cancel</Button>
                  <Button size="sm" loading={savePlacementMut.isPending} onClick={() => savePlacementMut.mutate()}>
                    {editPlacementId ? 'Update' : 'Save Placement'}
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {(placements ?? []).length === 0 ? (
            <Card>
              <div className="text-center py-8 text-gray-400 text-sm">
                No placements recorded yet. Click "Add Placement" to record your first chick batch.
              </div>
            </Card>
          ) : (
            <Card>
              {selPlacements.size > 0 && (
                <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-2 mb-3">
                  <span className="text-sm font-medium text-red-700">{selPlacements.size} selected</span>
                  <button onClick={() => setSelPlacements(new Set())} className="text-xs text-gray-500 hover:text-gray-700 underline">Clear</button>
                  <div className="ml-auto">
                    <Button variant="danger" size="sm" icon={<Trash2 size={14}/>} onClick={() => setBulkPlacementConfirm(true)}>
                      Delete {selPlacements.size}
                    </Button>
                  </div>
                </div>
              )}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-left text-xs text-gray-500 uppercase">
                      <th className="px-3 py-2 w-8">
                        <CB
                          checked={(placements ?? []).length > 0 && selPlacements.size === (placements ?? []).length}
                          indeterminate={selPlacements.size > 0 && selPlacements.size < (placements ?? []).length}
                          onChange={() => {
                            if (selPlacements.size === (placements ?? []).length) setSelPlacements(new Set())
                            else setSelPlacements(new Set((placements ?? []).map((p: any) => p.id)))
                          }}
                        />
                      </th>
                      <th className="px-3 py-2">Date</th>
                      <th className="px-3 py-2">Shed</th>
                      <th className="px-3 py-2 text-right">Female</th>
                      <th className="px-3 py-2 text-right">Male</th>
                      <th className="px-3 py-2 text-right">Total Birds</th>
                      <th className="px-3 py-2 text-right">Shed Capacity</th>
                      <th className="px-3 py-2 text-right">Box Usage</th>
                      <th className="px-3 py-2 text-right">Utilization</th>
                      <th className="px-3 py-2">Notes</th>
                      <th className="px-3 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {(placements ?? []).map((p: any) => {
                      const total = (p.female_count ?? 0) + (p.male_count ?? 0)
                      const capF = p.shed?.capacity_female ?? 0
                      const capM = p.shed?.capacity_male ?? 0
                      const totalCap = capF + capM
                      const birdsPerBox = p.shed?.birds_per_box ?? 0
                      const totalBoxes = p.shed?.total_boxes ?? 0
                      const usedBoxes = birdsPerBox > 0 ? Math.ceil(total / birdsPerBox) : null
                      const utilPct = totalCap > 0 ? Math.round(total / totalCap * 100) : null
                      const utilColor = utilPct == null ? '' : utilPct > 100 ? 'text-red-600 font-bold' : utilPct > 85 ? 'text-orange-500 font-semibold' : 'text-green-600'
                      return (
                      <tr key={p.id} className={`border-b border-gray-50 hover:bg-gray-50 ${selPlacements.has(p.id) ? 'bg-red-50' : ''}`}>
                        <td className="px-3 py-2">
                          <CB checked={selPlacements.has(p.id)} onChange={() => setSelPlacements(prev => { const n = new Set(prev); n.has(p.id) ? n.delete(p.id) : n.add(p.id); return n })} />
                        </td>
                        <td className="px-3 py-2">{fmtDate(p.allocated_date)}</td>
                        <td className="px-3 py-2">{p.shed ? `${p.shed.shed_no}${p.shed.shed_name ? ' — ' + p.shed.shed_name : ''}` : <span className="text-gray-400">—</span>}</td>
                        <td className="px-3 py-2 text-right">{p.female_count?.toLocaleString('en-IN')}</td>
                        <td className="px-3 py-2 text-right">{p.male_count?.toLocaleString('en-IN')}</td>
                        <td className="px-3 py-2 text-right font-medium">{total.toLocaleString('en-IN')}</td>
                        <td className="px-3 py-2 text-right text-xs text-gray-500">{totalCap > 0 ? `${capF}F + ${capM}M = ${totalCap}` : '—'}</td>
                        <td className="px-3 py-2 text-right text-xs text-gray-500">{usedBoxes != null ? `${usedBoxes} / ${totalBoxes}` : '—'}</td>
                        <td className={`px-3 py-2 text-right text-xs ${utilColor}`}>{utilPct != null ? `${utilPct}%` : '—'}</td>
                        <td className="px-3 py-2 text-gray-400 text-xs">{p.notes ?? '—'}</td>
                        <td className="px-3 py-2">
                          <div className="flex gap-2 justify-end">
                            <button className="text-xs text-blue-600 hover:underline" onClick={() => {
                              setPlacementForm({ allocated_date: p.allocated_date, shed_id: p.shed_id ?? '', female_count: p.female_count?.toString() ?? '', male_count: p.male_count?.toString() ?? '', notes: p.notes ?? '' })
                              setEditPlacementId(p.id); setShowPlacementForm(true)
                            }}>Edit</button>
                            <button className="text-xs text-red-500 hover:underline" onClick={() => { if (confirm('Delete this placement?')) delPlacementMut.mutate(p.id) }}>Delete</button>
                          </div>
                        </td>
                      </tr>
                    )})}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-50 font-semibold text-sm">
                      <td className="px-3 py-2" colSpan={3}>Total Received</td>
                      <td className="px-3 py-2 text-right">{(placements ?? []).reduce((s: number, p: any) => s + (p.female_count ?? 0), 0).toLocaleString('en-IN')} F</td>
                      <td className="px-3 py-2 text-right">{(placements ?? []).reduce((s: number, p: any) => s + (p.male_count ?? 0), 0).toLocaleString('en-IN')} M</td>
                      <td className="px-3 py-2 text-right text-brand-700">{(placements ?? []).reduce((s: number, p: any) => s + (p.female_count ?? 0) + (p.male_count ?? 0), 0).toLocaleString('en-IN')}</td>
                      <td colSpan={4}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              <p className="text-xs text-gray-400 mt-3 px-1">
                ✓ "Total Placed" on the flock overview updates automatically from these placement records.
              </p>
            </Card>
          )}
          {bulkPlacementConfirm && (
            <ConfirmBulkDelete label={`Delete ${selPlacements.size} placement records? This cannot be undone.`}
              onConfirm={() => bulkDelPlacementMut.mutate([...selPlacements])}
              onCancel={() => setBulkPlacementConfirm(false)} />
          )}
        </div>
      )}

      {/* TRANSFERS TAB */}
      {tab === 'transfers' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="font-semibold text-gray-800">Flock Transfers</h3>
              <p className="text-xs text-gray-400 mt-0.5">Record bird movements between sites. Include sex errors and pre-transfer sales.</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => {
                const hdrs = ['transfer_date','from_farm','to_farm','female_count','male_count','sex_error_female','sex_error_male','sold_female','sold_male','notes']
                const ex = [new Date().toISOString().slice(0,10),'Kethereddypally','Agraharam','8000','800','50','0','0','0','Batch 1']
                const csv = [hdrs, ex].map(r => r.map(v=>`"${v}"`).join(',')).join('\n')
                const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv],{type:'text/csv'})); a.download = 'transfer_template.csv'; a.click()
              }}>Template</Button>
              <Button variant="outline" size="sm" onClick={() => transferImportRef.current?.click()}>Import CSV</Button>
              <input ref={transferImportRef} type="file" accept=".csv" className="hidden" onChange={handleTransferImport}/>
              <Button size="sm" onClick={() => setShowTransferForm(v => !v)}>
                {showTransferForm ? 'Cancel' : '+ Add Transfer'}
              </Button>
            </div>
          </div>

          {showTransferForm && (
            <Card>
              <CardHeader title="New Transfer Entry" />
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Transfer Date *</label>
                    <input type="date" value={transferForm.transfer_date}
                      onChange={e => setTransferForm(f => ({ ...f, transfer_date: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">From Farm</label>
                    <select value={transferForm.from_farm_id}
                      onChange={e => setTransferForm(f => ({ ...f, from_farm_id: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                      <option value="">— None —</option>
                      {(farms ?? []).map((fm: any) => <option key={fm.id} value={fm.id}>{fm.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">To Farm *</label>
                    <select value={transferForm.to_farm_id}
                      onChange={e => setTransferForm(f => ({ ...f, to_farm_id: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                      <option value="">— Select —</option>
                      {(farms ?? []).map((fm: any) => <option key={fm.id} value={fm.id}>{fm.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">From Shed</label>
                    <select value={transferForm.from_shed_id}
                      onChange={e => setTransferForm(f => ({ ...f, from_shed_id: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                      <option value="">— None —</option>
                      {(allSheds ?? []).filter((s: any) => !transferForm.from_farm_id || s.farm_id === transferForm.from_farm_id).map((s: any) => <option key={s.id} value={s.id}>{s.shed_no}{s.shed_name ? ' — '+s.shed_name : ''}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">To Shed</label>
                    <select value={transferForm.to_shed_id}
                      onChange={e => setTransferForm(f => ({ ...f, to_shed_id: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                      <option value="">— None —</option>
                      {(allSheds ?? []).filter((s: any) => !transferForm.to_farm_id || s.farm_id === transferForm.to_farm_id).map((s: any) => <option key={s.id} value={s.id}>{s.shed_no}{s.shed_name ? ' — '+s.shed_name : ''}</option>)}
                    </select>
                  </div>
                </div>

                {/* Birds transferred */}
                <div className="p-3 bg-green-50 rounded-lg border border-green-100">
                  <p className="text-xs font-semibold text-green-700 mb-2 uppercase">Birds Transferred</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">♀ Female Count</label>
                      <input type="number" min="0" value={transferForm.female_count}
                        onChange={e => setTransferForm(f => ({ ...f, female_count: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">♂ Male Count</label>
                      <input type="number" min="0" value={transferForm.male_count}
                        onChange={e => setTransferForm(f => ({ ...f, male_count: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                    </div>
                  </div>
                </div>

                {/* Birds NOT transferred */}
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
                  <p className="text-xs font-semibold text-amber-700 mb-2 uppercase">Birds Not Transferred (optional)</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Sex Error ♀</label>
                      <input type="number" min="0" value={transferForm.sex_error_female}
                        onChange={e => setTransferForm(f => ({ ...f, sex_error_female: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                        placeholder="Wrong sex removed"/>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Sex Error ♂</label>
                      <input type="number" min="0" value={transferForm.sex_error_male}
                        onChange={e => setTransferForm(f => ({ ...f, sex_error_male: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"/>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Sold ♀</label>
                      <input type="number" min="0" value={transferForm.sold_female}
                        onChange={e => setTransferForm(f => ({ ...f, sold_female: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                        placeholder="Sold before shift"/>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Sold ♂</label>
                      <input type="number" min="0" value={transferForm.sold_male}
                        onChange={e => setTransferForm(f => ({ ...f, sold_male: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"/>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
                  <input type="text" value={transferForm.notes}
                    onChange={e => setTransferForm(f => ({ ...f, notes: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="Optional notes..." />
                </div>

                {/* Final transfer checkbox */}
                <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${transferForm.is_final_transfer ? 'bg-green-50 border-green-300' : 'bg-gray-50 border-gray-200'}`}>
                  <input type="checkbox" checked={transferForm.is_final_transfer}
                    onChange={e => setTransferForm(f => ({ ...f, is_final_transfer: e.target.checked }))}
                    className="mt-0.5 rounded text-green-600"/>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">✅ This is the final transfer — all birds shifted</p>
                    <p className="text-xs text-gray-500 mt-0.5">Checking this will automatically change flock status from <strong>Rearing → Laying</strong> and set the laying farm to the destination.</p>
                  </div>
                </label>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => setShowTransferForm(false)}>Cancel</Button>
                  <Button size="sm" loading={addTransferMut.isPending} onClick={() => addTransferMut.mutate()}>
                    {transferForm.is_final_transfer ? 'Save & Mark as Laying' : 'Save Transfer'}
                  </Button>
                </div>
              </div>
            </Card>
          )}

          <Card padding={false}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-3 py-2 text-left font-semibold text-gray-600 text-xs">Date</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-600 text-xs">From → To</th>
                    <th className="px-3 py-2 text-right font-semibold text-gray-600 text-xs">♀ Transferred</th>
                    <th className="px-3 py-2 text-right font-semibold text-gray-600 text-xs">♂ Transferred</th>
                    <th className="px-3 py-2 text-right font-semibold text-gray-600 text-xs">Sex Errors</th>
                    <th className="px-3 py-2 text-right font-semibold text-gray-600 text-xs">Sold</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-600 text-xs">Notes</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-600 text-xs">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(transfers ?? []).length === 0 ? (
                    <tr><td colSpan={8} className="px-3 py-6 text-center text-gray-400 text-sm">No transfers recorded yet</td></tr>
                  ) : (transfers ?? []).map((t: any) => (
                    <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-3 py-2 whitespace-nowrap text-xs">{fmtDate(t.transfer_date)}</td>
                      <td className="px-3 py-2 text-xs">
                        <span className="text-gray-500">{t.from_farm?.name ?? 'KRP'}</span>
                        <span className="text-gray-400 mx-1">→</span>
                        <span className="font-medium text-brand-700">{t.to_farm?.name ?? '—'}</span>
                        {t.from_shed && <div className="text-gray-400 text-[10px]">Shed {t.from_shed.shed_no} → {t.to_shed?.shed_no ?? '—'}</div>}
                      </td>
                      <td className="px-3 py-2 text-right text-xs font-medium">{t.female_count > 0 ? t.female_count.toLocaleString('en-IN') : '—'}</td>
                      <td className="px-3 py-2 text-right text-xs font-medium">{t.male_count > 0 ? t.male_count.toLocaleString('en-IN') : '—'}</td>
                      <td className="px-3 py-2 text-right text-xs text-amber-600">
                        {(t.sex_error_female||0)+(t.sex_error_male||0) > 0
                          ? `${t.sex_error_female||0}♀ ${t.sex_error_male||0}♂` : '—'}
                      </td>
                      <td className="px-3 py-2 text-right text-xs text-orange-600">
                        {(t.sold_female||0)+(t.sold_male||0) > 0
                          ? `${t.sold_female||0}♀ ${t.sold_male||0}♂` : '—'}
                      </td>
                      <td className="px-3 py-2 text-gray-500 text-xs">{t.notes ?? '—'}</td>
                      <td className="px-3 py-2">
                        {t.is_final_transfer
                          ? <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">Final ✓</span>
                          : <span className="text-xs text-gray-400">Partial</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
                {(transfers ?? []).length > 0 && (() => {
                  const totF = (transfers??[]).reduce((s:number,t:any)=>s+(t.female_count||0),0)
                  const totM = (transfers??[]).reduce((s:number,t:any)=>s+(t.male_count||0),0)
                  const totSEF = (transfers??[]).reduce((s:number,t:any)=>s+(t.sex_error_female||0),0)
                  const totSEM = (transfers??[]).reduce((s:number,t:any)=>s+(t.sex_error_male||0),0)
                  const totSF = (transfers??[]).reduce((s:number,t:any)=>s+(t.sold_female||0),0)
                  const totSM = (transfers??[]).reduce((s:number,t:any)=>s+(t.sold_male||0),0)
                  return (
                    <tfoot><tr className="bg-gray-50 font-semibold text-xs">
                      <td className="px-3 py-2" colSpan={2}>TOTAL ({(transfers??[]).length} entries)</td>
                      <td className="px-3 py-2 text-right">{totF.toLocaleString('en-IN')} ♀</td>
                      <td className="px-3 py-2 text-right">{totM.toLocaleString('en-IN')} ♂</td>
                      <td className="px-3 py-2 text-right text-amber-600">{totSEF}♀ {totSEM}♂</td>
                      <td className="px-3 py-2 text-right text-orange-600">{totSF}♀ {totSM}♂</td>
                      <td colSpan={2}/>
                    </tr></tfoot>
                  )
                })()}
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
