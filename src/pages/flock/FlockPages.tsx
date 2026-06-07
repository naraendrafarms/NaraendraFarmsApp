import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { inr, fmtDate } from '@/lib/utils'
import {
  Card, CardHeader, Button, Input, Select,
  Table, Th, Td, Badge, SectionHeader, Spinner, EmptyState, StatCard
} from '@/components/ui'
import {
  Bird, Egg, TrendingUp, ArrowLeft, ChevronLeft, ChevronRight,
  Package, Truck, FlaskConical, ShoppingCart
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

// ── TABS ──────────────────────────────────────────────────────────────────────

const TABS = ['Overview', 'Daily Records', 'Bird Transfers', 'HE Dispatch', 'Feed', 'Medicine', 'Bird Sales'] as const
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

      {activeTab === 'Overview'       && <OverviewTab flock={flock} />}
      {activeTab === 'Daily Records'  && <DailyRecordsTab flockId={flock.id} />}
      {activeTab === 'Bird Transfers' && <BirdTransfersTab flockId={flock.id} />}
      {activeTab === 'HE Dispatch'    && <HEDispatchTab flockId={flock.id} />}
      {activeTab === 'Feed'           && <FeedTab flockId={flock.id} />}
      {activeTab === 'Medicine'       && <MedicineTab flockId={flock.id} />}
      {activeTab === 'Bird Sales'     && <BirdSalesTab flockId={flock.id} />}
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
        .select('record_date,closing_female,closing_male,mortality_female,mortality_male,total_eggs,he_eggs,hd_pct,he_pct')
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
  const totalEggs = daily.reduce((s: number, r: any) => s + (r.total_eggs ?? 0), 0)
  const totalHE   = daily.reduce((s: number, r: any) => s + (r.he_eggs ?? 0), 0)
  const totalHEDisp = (heDispatch ?? []).reduce((s: number, r: any) => s + (r.total_dispatched ?? 0), 0)

  const hdRows = daily.filter((r: any) => r.hd_pct != null)
  const avgHD  = hdRows.length ? hdRows.reduce((s: number, r: any) => s + r.hd_pct, 0) / hdRows.length : null
  const heRows = daily.filter((r: any) => r.he_pct != null && (r.total_eggs ?? 0) > 0)
  const avgHE  = heRows.length ? heRows.reduce((s: number, r: any) => s + r.he_pct, 0) / heRows.length : null

  // Monthly summary
  const monthly: Record<string, { eggs: number; heEggs: number; mort: number; birdDays: number; days: number }> = {}
  daily.forEach((r: any) => {
    const month = (r.record_date as string)?.slice(0, 7) ?? ''
    if (!monthly[month]) monthly[month] = { eggs: 0, heEggs: 0, mort: 0, birdDays: 0, days: 0 }
    monthly[month].eggs     += r.total_eggs ?? 0
    monthly[month].heEggs   += r.he_eggs ?? 0
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

      {Object.keys(monthly).length > 0 && (
        <Card padding={false}>
          <div className="p-4 pb-0">
            <p className="font-semibold text-gray-800 text-sm">Monthly Summary</p>
          </div>
          <Table>
            <thead><tr>
              <Th>Month</Th><Th right>Avg Birds</Th><Th right>Total Eggs</Th>
              <Th right>HE Eggs</Th><Th right>Mortality</Th>
            </tr></thead>
            <tbody>
              {Object.entries(monthly).sort(([a], [b]) => a.localeCompare(b)).map(([month, d]) => (
                <tr key={month} className="hover:bg-gray-50">
                  <Td className="font-medium text-xs">{month}</Td>
                  <Td right className="text-xs">{numFmt(d.days ? Math.round(d.birdDays / d.days) : 0)}</Td>
                  <Td right className="text-xs">{numFmt(d.eggs)}</Td>
                  <Td right className="text-xs">{numFmt(d.heEggs)}</Td>
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

const DailyRecordsTab: React.FC<{ flockId: string }> = ({ flockId }) => {
  const [fFarm, setFFarm] = useState('')
  const [fFrom, setFFrom] = useState('')
  const [fTo,   setFTo]   = useState('')
  const [page,  setPage]  = useState(0)

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
          .select('*, farms(name,code)')
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

  const filtered = (allRecords ?? []).filter((r: any) => {
    if (fFarm && r.farm_id !== fFarm) return false
    if (fFrom && r.record_date < fFrom) return false
    if (fTo   && r.record_date > fTo)   return false
    return true
  })

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const rows = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  const totalEggs = filtered.reduce((s: number, r: any) => s + (r.total_eggs ?? 0), 0)
  const totalMort = filtered.reduce((s: number, r: any) => s + (r.mortality_female ?? 0) + (r.mortality_male ?? 0), 0)
  const hdRows = filtered.filter((r: any) => r.hd_pct != null)
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
          <Card padding={false}>
            <Table>
              <thead><tr>
                <Th>Date</Th><Th>Site</Th>
                <Th right>Open F</Th><Th right>Open M</Th>
                <Th right>Feed F kg</Th><Th right>Feed M kg</Th>
                <Th right>Eggs</Th><Th right>HD%</Th>
                <Th right>HE</Th><Th right>HE%</Th>
                <Th right>Mort F</Th><Th right>Mort M</Th>
                <Th right>Close F</Th><Th right>Close M</Th>
                <Th right>Age/Wk</Th>
              </tr></thead>
              <tbody>
                {rows.map((r: any) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <Td className="text-xs font-medium">{fmtDate(r.record_date)}</Td>
                    <Td className="text-xs">{r.farms?.code ?? '—'}</Td>
                    <Td right className="text-xs">{numFmt(r.opening_female)}</Td>
                    <Td right className="text-xs">{numFmt(r.opening_male)}</Td>
                    <Td right className="text-xs">{r.feed_female_kg != null ? (r.feed_female_kg as number).toFixed(1) : '—'}</Td>
                    <Td right className="text-xs">{r.feed_male_kg != null ? (r.feed_male_kg as number).toFixed(1) : '—'}</Td>
                    <Td right className="text-xs font-semibold">{numFmt(r.total_eggs)}</Td>
                    <Td right className="text-xs">{r.hd_pct != null ? pctFmt(r.hd_pct) : '—'}</Td>
                    <Td right className="text-xs">{numFmt(r.he_eggs)}</Td>
                    <Td right className="text-xs">{r.he_pct != null ? pctFmt(r.he_pct) : '—'}</Td>
                    <Td right className="text-xs text-red-600">{numFmt(r.mortality_female)}</Td>
                    <Td right className="text-xs text-red-600">{numFmt(r.mortality_male)}</Td>
                    <Td right className="text-xs">{numFmt(r.closing_female)}</Td>
                    <Td right className="text-xs">{numFmt(r.closing_male)}</Td>
                    <Td right className="text-xs text-gray-400">{r.age_weeks ?? '—'}</Td>
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
    </div>
  )
}

// ── BIRD TRANSFERS TAB ────────────────────────────────────────────────────────

const BirdTransfersTab: React.FC<{ flockId: string }> = ({ flockId }) => {
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

  const totalBirds = (transfers ?? []).reduce((s: number, r: any) => s + (r.total_birds ?? 0), 0)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 max-w-xs">
        <StatCard title="Total Birds Transferred" value={numFmt(totalBirds)} icon={<Truck size={18}/>} color="text-purple-600" />
      </div>
      {isLoading ? <Spinner /> : (
        <Card padding={false}>
          <Table>
            <thead><tr>
              <Th>Date</Th><Th>DC No</Th><Th>Grade</Th><Th>Gender</Th>
              <Th>Vehicle</Th><Th right>Boxes</Th><Th right>Birds/Box</Th>
              <Th right>Total Birds</Th><Th>From → To</Th>
            </tr></thead>
            <tbody>
              {transfers?.map((t: any) => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <Td className="text-xs">{fmtDate(t.transfer_date)}</Td>
                  <Td className="text-xs font-mono">{t.dc_no ?? '—'}</Td>
                  <Td className="text-xs">{t.grade ?? '—'}</Td>
                  <Td className="text-xs">{t.gender ?? '—'}</Td>
                  <Td className="text-xs">{t.vehicle_no ?? '—'}</Td>
                  <Td right className="text-xs">{numFmt(t.no_of_boxes)}</Td>
                  <Td right className="text-xs">{numFmt(t.birds_per_box)}</Td>
                  <Td right className="text-xs font-semibold">{numFmt(t.total_birds)}</Td>
                  <Td className="text-xs">{t.from_farm?.code ?? '?'} → {t.to_farm?.code ?? '?'}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
          {transfers?.length === 0 && <EmptyState icon={<Truck size={32}/>} title="No bird transfers" />}
        </Card>
      )}
    </div>
  )
}

// ── HE DISPATCH TAB ───────────────────────────────────────────────────────────

const HEDispatchTab: React.FC<{ flockId: string }> = ({ flockId }) => {
  const [fFrom, setFFrom] = useState('')
  const [fTo,   setFTo]   = useState('')

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

  const dispatches = (allDisp ?? []).filter((r: any) => {
    if (fFrom && r.dispatch_date < fFrom) return false
    if (fTo   && r.dispatch_date > fTo)   return false
    return true
  })

  const totalDisp   = dispatches.reduce((s: number, r: any) => s + (r.total_dispatched ?? 0), 0)
  const totalAmount = dispatches.reduce((s: number, r: any) => s + (r.amount ?? 0), 0)

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
        <Card padding={false}>
          <Table>
            <thead><tr>
              <Th>Date</Th><Th>DC No</Th><Th>Party</Th>
              <Th right>Grade A</Th><Th right>Grade B</Th>
              <Th right>Total</Th><Th right>Rate</Th><Th right>Amount</Th>
            </tr></thead>
            <tbody>
              {dispatches.map((d: any) => (
                <tr key={d.id} className="hover:bg-gray-50">
                  <Td className="text-xs">{fmtDate(d.dispatch_date)}</Td>
                  <Td className="text-xs font-mono">{d.dc_no ?? '—'}</Td>
                  <Td className="text-xs">{d.parties?.name ?? '—'}</Td>
                  <Td right className="text-xs">{numFmt(d.grade_a)}</Td>
                  <Td right className="text-xs">{numFmt(d.grade_b)}</Td>
                  <Td right className="text-xs font-semibold">{numFmt(d.total_dispatched)}</Td>
                  <Td right className="text-xs">{d.rate != null ? `₹${d.rate}` : '—'}</Td>
                  <Td right className="text-xs font-semibold">{inr(d.amount)}</Td>
                </tr>
              ))}
            </tbody>
            {dispatches.length > 0 && (
              <tfoot><tr className="bg-gray-50 font-semibold">
                <Td colSpan={5}>TOTAL ({dispatches.length})</Td>
                <Td right>{numFmt(totalDisp)}</Td>
                <Td right>—</Td>
                <Td right>{inr(totalAmount)}</Td>
              </tr></tfoot>
            )}
          </Table>
          {dispatches.length === 0 && <EmptyState icon={<Egg size={32}/>} title="No HE dispatch records" />}
        </Card>
      )}
    </div>
  )
}

// ── FEED TAB ──────────────────────────────────────────────────────────────────

const FeedTab: React.FC<{ flockId: string }> = ({ flockId }) => {
  const { data: feedData, isLoading } = useQuery({
    queryKey: ['flock_daily_feed', flockId],
    queryFn: async () => {
      const { data } = await supabase
        .from('daily_feed')
        .select('*')
        .eq('flock_id', flockId)
        .order('feed_date', { ascending: true })
      return data ?? []
    }
  })

  // GRN rates for feed types — use latest price per unit per item name
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

  // Match feed type code (BCM/BGM/BDM) to GRN item name
  const getFeedGrnRate = (feedType: string) => {
    if (!feedGrnRates || !feedType) return null
    const ft = feedType.trim().toLowerCase()
    const found = Object.keys(feedGrnRates).find(k => k.includes(ft) || ft.includes(k))
    return found ? feedGrnRates[found] : null
  }

  const totalFemaleKg = (feedData ?? []).reduce((s: number, r: any) => s + (r.female_kg ?? 0), 0)
  const totalMaleKg   = (feedData ?? []).reduce((s: number, r: any) => s + (r.male_kg ?? 0), 0)
  const totalCostExcel = (feedData ?? []).reduce((s: number, r: any) => s + (r.female_cost ?? 0) + (r.male_cost ?? 0), 0)
  const totalCostGrn  = (feedData ?? []).reduce((s: number, r: any) => {
    const rate = getFeedGrnRate(r.feed_type) ?? 0
    return s + ((r.female_kg ?? 0) + (r.male_kg ?? 0)) * rate
  }, 0)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Total Female KG" value={`${numFmt(Math.round(totalFemaleKg))} kg`} icon={<Package size={18}/>} color="text-pink-600" />
        <StatCard title="Total Male KG"   value={`${numFmt(Math.round(totalMaleKg))} kg`}   icon={<Package size={18}/>} color="text-blue-600" />
        <StatCard title="Cost (GRN Rates)" value={inr(totalCostGrn)} icon={<TrendingUp size={18}/>} color="text-green-600" />
        <StatCard title="Cost (Excel Rates)" value={inr(totalCostExcel)} icon={<TrendingUp size={18}/>} color="text-gray-400" />
      </div>
      <p className="text-xs text-gray-500">Note: Only rearing period (Nov 2023–Mar 2024) has feed type data. Laying period feed totals are in Daily Records tab. GRN Rate = actual purchase rate from invoices.</p>
      {isLoading ? <Spinner /> : (
        <Card padding={false}>
          <Table>
            <thead><tr>
              <Th>Date</Th><Th>Feed Type</Th>
              <Th right>Female KG</Th><Th right>Male KG</Th>
              <Th right>Total KG</Th><Th right>GRN Rate/kg</Th><Th right>Cost (GRN)</Th>
            </tr></thead>
            <tbody>
              {feedData?.map((r: any) => {
                const grnRate = getFeedGrnRate(r.feed_type)
                const totalKg = (r.female_kg ?? 0) + (r.male_kg ?? 0)
                const costGrn = grnRate != null ? totalKg * grnRate : null
                return (
                <tr key={r.id} className="hover:bg-gray-50">
                  <Td className="text-xs">{fmtDate(r.feed_date)}</Td>
                  <Td className="text-xs"><Badge color="blue">{r.feed_type ?? '—'}</Badge></Td>
                  <Td right className="text-xs">{r.female_kg != null ? (r.female_kg as number).toFixed(1) : '—'}</Td>
                  <Td right className="text-xs">{r.male_kg != null ? (r.male_kg as number).toFixed(1) : '—'}</Td>
                  <Td right className="text-xs font-semibold">{totalKg.toFixed(1)}</Td>
                  <Td right className="text-xs">{grnRate != null ? <span className="text-green-700">₹{grnRate}/kg</span> : <span className="text-gray-400">—</span>}</Td>
                  <Td right className="text-xs font-semibold">{costGrn != null ? inr(costGrn) : '—'}</Td>
                </tr>
                )
              })}
            </tbody>
          </Table>
          {feedData?.length === 0 && <EmptyState icon={<Package size={32}/>} title="No feed records" />}
        </Card>
      )}
    </div>
  )
}

// ── MEDICINE TAB ──────────────────────────────────────────────────────────────

const MedicineTab: React.FC<{ flockId: string }> = ({ flockId }) => {
  const { data: usages, isLoading } = useQuery({
    queryKey: ['flock_medicine', flockId],
    queryFn: async () => {
      const { data } = await supabase
        .from('medicine_usage')
        .select('*, medicines_master(name,type)')
        .eq('flock_id', flockId)
        .order('usage_date', { ascending: true })
      return data ?? []
    }
  })

  // GRN rates: latest price_per_unit per item_name from actual purchase invoices
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

  const getGrnRate = (name: string) => {
    if (!grnRates || !name) return null
    const key = name.trim().toLowerCase()
    // exact match
    if (grnRates[key] !== undefined) return grnRates[key]
    // partial match
    const found = Object.keys(grnRates).find(k => k.includes(key) || key.includes(k))
    return found ? grnRates[found] : null
  }

  const calcCost = (r: any) => {
    const grnRate = getGrnRate(r.medicines_master?.name ?? '')
    const rate = grnRate ?? r.rate ?? 0
    return (r.quantity ?? 0) * rate
  }

  const totalCostGrn = (usages ?? []).reduce((s: number, r: any) => s + calcCost(r), 0)
  const totalCostExcel = (usages ?? []).reduce((s: number, r: any) => s + (r.amount ?? 0), 0)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-lg">
        <StatCard title="Cost (GRN Rates)" value={inr(totalCostGrn)} icon={<FlaskConical size={18}/>} color="text-green-600" />
        <StatCard title="Cost (Excel Rates)" value={inr(totalCostExcel)} icon={<FlaskConical size={18}/>} color="text-gray-400" />
      </div>
      <p className="text-xs text-gray-500">GRN Rate = actual purchase rate from GRN invoices (most recent per item). Excel Rate = rate recorded in monthly report — may be inaccurate. Use GRN Rate for accounting.</p>
      {isLoading ? <Spinner /> : (
        <Card padding={false}>
          <Table>
            <thead><tr>
              <Th>Date</Th><Th>Medicine / Vaccine</Th><Th right>Qty</Th>
              <Th>Unit</Th><Th right>GRN Rate</Th><Th right>Excel Rate</Th><Th right>Cost (GRN)</Th>
            </tr></thead>
            <tbody>
              {usages?.map((r: any) => {
                const grnRate = getGrnRate(r.medicines_master?.name ?? '')
                const cost = calcCost(r)
                return (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <Td className="text-xs">{fmtDate(r.usage_date)}</Td>
                    <Td className="text-xs font-medium">{r.medicines_master?.name ?? '—'}</Td>
                    <Td right className="text-xs">{r.quantity}</Td>
                    <Td className="text-xs text-gray-400">{r.unit ?? r.medicines_master?.unit ?? '—'}</Td>
                    <Td right className="text-xs">{grnRate != null ? <span className="text-green-700 font-medium">₹{grnRate}</span> : <span className="text-gray-400">not in GRN</span>}</Td>
                    <Td right className="text-xs text-gray-400">{r.rate != null ? `₹${r.rate}` : '—'}</Td>
                    <Td right className="text-xs font-semibold">{inr(cost)}</Td>
                  </tr>
                )
              })}
            </tbody>
            {(usages?.length ?? 0) > 0 && (
              <tfoot><tr className="bg-gray-50 font-semibold">
                <Td colSpan={6}>TOTAL ({usages?.length} records)</Td>
                <Td right>{inr(totalCostGrn)}</Td>
              </tr></tfoot>
            )}
          </Table>
          {usages?.length === 0 && <EmptyState icon={<FlaskConical size={32}/>} title="No medicine records" />}
        </Card>
      )}
    </div>
  )
}

// ── BIRD SALES TAB ────────────────────────────────────────────────────────────

const BirdSalesTab: React.FC<{ flockId: string }> = ({ flockId }) => {
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

  const totalAmount = (sales ?? []).reduce((s: number, r: any) => s + (r.amount ?? 0), 0)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 max-w-xs">
        <StatCard title="Total Sale Amount" value={inr(totalAmount)} icon={<ShoppingCart size={18}/>} color="text-green-600" />
      </div>
      {isLoading ? <Spinner /> : (
        <Card padding={false}>
          <Table>
            <thead><tr>
              <Th>Date</Th><Th>DC No</Th><Th>Type</Th>
              <Th right>Qty</Th><Th>Unit</Th>
              <Th right>Rate</Th><Th right>Amount</Th>
            </tr></thead>
            <tbody>
              {sales?.map((r: any) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <Td className="text-xs">{fmtDate(r.sale_date)}</Td>
                  <Td className="text-xs font-mono">{r.dc_no ?? '—'}</Td>
                  <Td className="text-xs"><Badge color="gray">{r.sale_type ?? '—'}</Badge></Td>
                  <Td right className="text-xs">{numFmt(r.quantity)}</Td>
                  <Td className="text-xs text-gray-400">{r.unit ?? '—'}</Td>
                  <Td right className="text-xs">{r.rate != null ? `₹${r.rate}` : '—'}</Td>
                  <Td right className="text-xs font-semibold">{inr(r.amount)}</Td>
                </tr>
              ))}
            </tbody>
            {(sales?.length ?? 0) > 0 && (
              <tfoot><tr className="bg-gray-50 font-semibold">
                <Td colSpan={6}>TOTAL ({sales?.length})</Td>
                <Td right>{inr(totalAmount)}</Td>
              </tr></tfoot>
            )}
          </Table>
          {sales?.length === 0 && <EmptyState icon={<ShoppingCart size={32}/>} title="No bird sales records" />}
        </Card>
      )}
    </div>
  )
}
