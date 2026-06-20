import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { fmtDate, inr } from '@/lib/utils'
import {
  Card, Button, Select, Input, Table, Th, Td, Badge,
  SectionHeader, Spinner, EmptyState, StatCard
, DateInput } from '@/components/ui'
import { Bird, Egg, TrendingUp, Building2, ChevronDown, ChevronRight } from 'lucide-react'

function numFmt(v: number | null | undefined) {
  if (v == null || v === 0) return '—'
  return v.toLocaleString('en-IN')
}
function pct(num: number, den: number, dec = 1) {
  if (!den) return '—'
  return (num / den * 100).toFixed(dec) + '%'
}
function pctVal(num: number, den: number) {
  if (!den) return null
  return num / den * 100
}
function colorPct(val: number | null, good = 80, warn = 65) {
  if (val == null) return 'text-gray-400'
  if (val >= good) return 'text-green-700 font-semibold'
  if (val >= warn) return 'text-yellow-700'
  return 'text-red-600'
}

const VIEW_TABS = ['By Site', 'By Shed', 'By Flock'] as const
type ViewTab = typeof VIEW_TABS[number]

// Date range helpers
const today = () => new Date().toISOString().split('T')[0]
const daysAgo = (n: number) => { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().split('T')[0] }

export const ShedPerformancePage: React.FC = () => {
  const [tab, setTab] = useState<ViewTab>('By Site')
  const [fromDate, setFromDate] = useState(daysAgo(30))
  const [toDate, setToDate] = useState(today())
  const [filterFarm, setFilterFarm] = useState('')

  const { data: farms } = useQuery({
    queryKey: ['farms'],
    queryFn: async () => { const { data } = await supabase.from('farms').select('id,name,code').order('name'); return data ?? [] }
  })

  // All daily records in range (with shed + flock + farm joins)
  const { data: records, isLoading } = useQuery({
    queryKey: ['shed_perf_records', fromDate, toDate, filterFarm],
    queryFn: async () => {
      let q = supabase
        .from('daily_records')
        .select('id,record_date,farm_id,shed_id,flock_id,opening_female,opening_male,closing_female,closing_male,mortality_female,mortality_male,trcull_female,trcull_male,total_eggs,he_eggs,he_grade_a,he_grade_b,he_grade_c,je_eggs,te_eggs,be_eggs,le_eggs,wastage_eggs,feed_female_kg,feed_male_kg,hd_pct,he_pct,farms(name,code),sheds(shed_no,shed_name,shed_type),flocks(flock_no,breed)')
        .gte('record_date', fromDate)
        .lte('record_date', toDate)
        .order('record_date', { ascending: false })
      if (filterFarm) q = q.eq('farm_id', filterFarm)
      const { data } = await q
      return data ?? []
    }
  })

  // Latest shed allocations to know current birds per shed
  const { data: allocations } = useQuery({
    queryKey: ['shed_alloc_summary'],
    queryFn: async () => {
      const { data } = await supabase
        .from('shed_allocations')
        .select('shed_id,flock_id,allocated_date,female_count,male_count,sheds(shed_no,shed_name,farm_id,farms(name,code)),flocks(flock_no)')
        .order('allocated_date', { ascending: false })
      return data ?? []
    }
  })

  // Latest allocation per flock+shed
  const latestAlloc: Record<string, any> = {}
  ;(allocations ?? []).forEach((a: any) => {
    const key = `${a.flock_id}__${a.shed_id}`
    if (!latestAlloc[key]) latestAlloc[key] = a
  })
  const currentBirdsByShed: Record<string, { female: number; male: number; flocks: string[] }> = {}
  Object.values(latestAlloc).forEach((a: any) => {
    const sid = a.shed_id
    if (!currentBirdsByShed[sid]) currentBirdsByShed[sid] = { female: 0, male: 0, flocks: [] }
    currentBirdsByShed[sid].female += a.female_count ?? 0
    currentBirdsByShed[sid].male   += a.male_count   ?? 0
    const fn = (a.flocks as any)?.flock_no
    if (fn && !currentBirdsByShed[sid].flocks.includes(fn)) currentBirdsByShed[sid].flocks.push(fn)
  })

  const recs = records ?? []

  // Aggregate helper: given a list of records, compute summary
  const agg = (rows: any[]) => {
    const openF   = rows.reduce((s, r) => s + (r.opening_female ?? 0), 0)
    const openM   = rows.reduce((s, r) => s + (r.opening_male ?? 0), 0)
    const closeF  = rows.reduce((s, r) => s + (r.closing_female ?? 0), 0)
    const closeM  = rows.reduce((s, r) => s + (r.closing_male ?? 0), 0)
    const mortF   = rows.reduce((s, r) => s + (r.mortality_female ?? 0), 0)
    const mortM   = rows.reduce((s, r) => s + (r.mortality_male ?? 0), 0)
    const eggs    = rows.reduce((s, r) => s + (r.total_eggs ?? 0), 0)
    const he      = rows.reduce((s, r) => s + (r.he_eggs ?? 0), 0)
    const grA     = rows.reduce((s, r) => s + (r.he_grade_a ?? 0), 0)
    const grB     = rows.reduce((s, r) => s + (r.he_grade_b ?? 0), 0)
    const grC     = rows.reduce((s, r) => s + (r.he_grade_c ?? 0), 0)
    const je      = rows.reduce((s, r) => s + (r.je_eggs ?? 0), 0)
    const te      = rows.reduce((s, r) => s + (r.te_eggs ?? 0), 0)
    const be      = rows.reduce((s, r) => s + (r.be_eggs ?? 0), 0)
    const le      = rows.reduce((s, r) => s + (r.le_eggs ?? 0), 0)
    const waste   = rows.reduce((s, r) => s + (r.wastage_eggs ?? 0), 0)
    const feedF   = rows.reduce((s, r) => s + (r.feed_female_kg ?? 0), 0)
    const feedM   = rows.reduce((s, r) => s + (r.feed_male_kg ?? 0), 0)
    const days    = rows.length
    const birdDays = rows.reduce((s, r) => s + (r.opening_female ?? 0), 0)
    return { openF, openM, closeF, closeM, mortF, mortM, eggs, he, grA, grB, grC, je, te, be, le, waste, feedF, feedM, days, birdDays,
      hdPct: pctVal(eggs, birdDays),
      hePct: pctVal(he, eggs),
      mortRate: birdDays > 0 ? mortF / birdDays * 100 : null,
    }
  }

  const farmOptions = (farms ?? []).map((f: any) => ({ value: f.id, label: `${f.name} (${f.code})` }))

  // ── By Site ──────────────────────────────────────────────────────────────────
  const bySite = () => {
    const map: Record<string, any[]> = {}
    recs.forEach(r => {
      const k = r.farm_id ?? '__none__'
      if (!map[k]) map[k] = []
      map[k].push(r)
    })
    return Object.entries(map).map(([farmId, rows]) => {
      const farm = (rows[0] as any).farms
      const s = agg(rows)
      const shedIds = [...new Set(rows.filter(r => r.shed_id).map(r => r.shed_id))]
      const flockIds = [...new Set(rows.map(r => r.flock_id))]
      return { farmId, farm, s, shedCount: shedIds.length, flockCount: flockIds.length }
    }).sort((a, b) => (a.farm?.code ?? '').localeCompare(b.farm?.code ?? ''))
  }

  // ── By Shed ──────────────────────────────────────────────────────────────────
  const byShed = () => {
    const map: Record<string, any[]> = {}
    recs.forEach(r => {
      const k = r.shed_id ?? `__noshed__${r.farm_id}`
      if (!map[k]) map[k] = []
      map[k].push(r)
    })
    return Object.entries(map).map(([key, rows]) => {
      const shed = (rows[0] as any).sheds
      const farm = (rows[0] as any).farms
      const shedId = rows[0].shed_id
      const s = agg(rows)
      const current = shedId ? currentBirdsByShed[shedId] : null
      const flockNos = [...new Set(rows.map(r => (r.flocks as any)?.flock_no).filter(Boolean))]
      return { key, shed, farm, s, current, flockNos }
    }).sort((a, b) => {
      const fa = a.farm?.code ?? ''; const fb = b.farm?.code ?? ''
      if (fa !== fb) return fa.localeCompare(fb)
      return (a.shed?.shed_no ?? '').localeCompare(b.shed?.shed_no ?? '')
    })
  }

  // ── By Flock ─────────────────────────────────────────────────────────────────
  const byFlock = () => {
    const map: Record<string, any[]> = {}
    recs.forEach(r => {
      const k = r.flock_id ?? '__none__'
      if (!map[k]) map[k] = []
      map[k].push(r)
    })
    return Object.entries(map).map(([flockId, rows]) => {
      const flock = (rows[0] as any).flocks
      const s = agg(rows)
      const farms2 = [...new Set(rows.map(r => (r.farms as any)?.code).filter(Boolean))]
      const sheds2 = [...new Set(rows.filter(r => r.shed_id).map(r => (r.sheds as any)?.shed_no).filter(Boolean))]
      return { flockId, flock, s, farms: farms2, sheds: sheds2 }
    }).sort((a, b) => (a.flock?.flock_no ?? '').localeCompare(b.flock?.flock_no ?? ''))
  }

  const totals = agg(recs)

  return (
    <div className="space-y-5">
      <SectionHeader title="Shed / Site Performance"
        subtitle="Production percentages across sites, sheds and flocks" />

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 items-end">
          <DateInput label="From Date" value={fromDate} onChange={e => setFromDate(e.target.value)} />
          <DateInput label="To Date"   value={toDate}   onChange={e => setToDate(e.target.value)} />
          <Select label="Site" placeholder="All Sites" options={farmOptions}
            value={filterFarm} onChange={e => setFilterFarm(e.target.value)} />
          <div className="flex items-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => { setFromDate(daysAgo(7));  setToDate(today()) }}>7d</Button>
            <Button variant="ghost" size="sm" onClick={() => { setFromDate(daysAgo(30)); setToDate(today()) }}>30d</Button>
            <Button variant="ghost" size="sm" onClick={() => { setFromDate(daysAgo(90)); setToDate(today()) }}>90d</Button>
            {filterFarm && <Button variant="ghost" size="sm" onClick={() => setFilterFarm('')}>Clear</Button>}
          </div>
        </div>
      </Card>

      {/* Summary stats */}
      {!isLoading && recs.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <StatCard title="Total Eggs" value={totals.eggs.toLocaleString('en-IN')} icon={<Egg size={16}/>} color="text-yellow-600" />
          <StatCard title="HE Eggs" value={totals.he.toLocaleString('en-IN')} icon={<Egg size={16}/>} color="text-green-600" />
          <StatCard title="Avg HD%" value={totals.hdPct != null ? totals.hdPct.toFixed(1)+'%' : '—'} icon={<TrendingUp size={16}/>} color={colorPct(totals.hdPct)} />
          <StatCard title="Avg HE%" value={totals.hePct != null ? totals.hePct.toFixed(1)+'%' : '—'} icon={<TrendingUp size={16}/>} color={colorPct(totals.hePct)} />
          <StatCard title="Total Mortality F" value={totals.mortF.toLocaleString('en-IN')} icon={<Bird size={16}/>} color="text-red-500" />
        </div>
      )}

      {/* View tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-1">
          {VIEW_TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap
                ${tab === t ? 'border-brand-600 text-brand-700' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
              {t}
            </button>
          ))}
        </nav>
      </div>

      {isLoading ? <Spinner /> : recs.length === 0 ? (
        <EmptyState icon={<Egg size={32}/>} title="No records in this date range" />
      ) : (
        <>
          {/* ── BY SITE ── */}
          {tab === 'By Site' && (
            <div className="space-y-3">
              {bySite().map(({ farmId, farm, s, shedCount, flockCount }) => (
                <SiteCard key={farmId} farm={farm} s={s} shedCount={shedCount} flockCount={flockCount} />
              ))}
            </div>
          )}

          {/* ── BY SHED ── */}
          {tab === 'By Shed' && (
            <Card padding={false}>
              <Table>
                <thead><tr>
                  <Th>Site</Th><Th>Shed</Th><Th>Type</Th><Th>Flocks</Th>
                  <Th right>Current Birds</Th>
                  <Th right>Days</Th><Th right>Total Eggs</Th>
                  <Th right>HE Eggs</Th><Th right>HD%</Th><Th right>HE%</Th>
                  <Th right>Gr A</Th><Th right>Gr B</Th><Th right>Gr C</Th>
                  <Th right>JE</Th><Th right>TE</Th><Th right>BE+LE</Th>
                  <Th right>Wastage</Th><Th right>Mort F</Th>
                </tr></thead>
                <tbody>
                  {byShed().map(({ key, shed, farm, s, current, flockNos }) => (
                    <tr key={key} className="hover:bg-gray-50">
                      <Td className="text-xs font-medium">{farm?.code ?? '—'}</Td>
                      <Td className="text-xs font-mono text-purple-700">{shed?.shed_no ?? <span className="text-gray-400">No shed</span>}{shed?.shed_name ? ` — ${shed.shed_name}` : ''}</Td>
                      <Td><Badge color="gray">{shed?.shed_type ?? '—'}</Badge></Td>
                      <Td className="text-xs">{flockNos.map(f => <span key={f} className="inline-block bg-green-100 text-green-800 rounded px-1 mr-0.5 text-xs">F-{f}</span>)}</Td>
                      <Td right className="text-xs">
                        {current ? <span className="font-medium">{numFmt(current.female + current.male)} <span className="text-gray-400">({current.flocks.map(f=>'F-'+f).join(', ')})</span></span> : '—'}
                      </Td>
                      <Td right className="text-xs">{s.days}</Td>
                      <Td right className="text-xs font-semibold">{numFmt(s.eggs)}</Td>
                      <Td right className="text-xs text-green-700">{numFmt(s.he)}</Td>
                      <Td right className={`text-xs ${colorPct(s.hdPct)}`}>{s.hdPct != null ? s.hdPct.toFixed(1)+'%' : '—'}</Td>
                      <Td right className={`text-xs ${colorPct(s.hePct, 90, 75)}`}>{s.hePct != null ? s.hePct.toFixed(1)+'%' : '—'}</Td>
                      <Td right className="text-xs text-emerald-600">{numFmt(s.grA)}</Td>
                      <Td right className="text-xs text-yellow-600">{numFmt(s.grB)}</Td>
                      <Td right className="text-xs text-orange-600">{numFmt(s.grC)}</Td>
                      <Td right className="text-xs">{numFmt(s.je)}</Td>
                      <Td right className="text-xs">{numFmt(s.te)}</Td>
                      <Td right className="text-xs">{numFmt(s.be + s.le)}</Td>
                      <Td right className="text-xs text-red-400">{numFmt(s.waste)}</Td>
                      <Td right className="text-xs text-red-600">{numFmt(s.mortF)}</Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card>
          )}

          {/* ── BY FLOCK ── */}
          {tab === 'By Flock' && (
            <Card padding={false}>
              <Table>
                <thead><tr>
                  <Th>Flock</Th><Th>Breed</Th><Th>Sites</Th><Th>Sheds</Th>
                  <Th right>Days</Th><Th right>Total Eggs</Th>
                  <Th right>HE Eggs</Th><Th right>HD%</Th><Th right>HE%</Th>
                  <Th right>Gr A</Th><Th right>Gr B</Th><Th right>Gr C</Th>
                  <Th right>JE</Th><Th right>TE</Th><Th right>Wastage</Th>
                  <Th right>Mort F</Th><Th right>Feed F kg</Th>
                </tr></thead>
                <tbody>
                  {byFlock().map(({ flockId, flock, s, farms: fms, sheds: shs }) => (
                    <tr key={flockId} className="hover:bg-gray-50">
                      <Td className="text-xs font-bold text-brand-700">F-{flock?.flock_no ?? '?'}</Td>
                      <Td className="text-xs">{flock?.breed ?? '—'}</Td>
                      <Td className="text-xs">{fms.join(', ') || '—'}</Td>
                      <Td className="text-xs text-purple-700">{shs.length > 0 ? shs.join(', ') : '—'}</Td>
                      <Td right className="text-xs">{s.days}</Td>
                      <Td right className="text-xs font-semibold">{numFmt(s.eggs)}</Td>
                      <Td right className="text-xs text-green-700">{numFmt(s.he)}</Td>
                      <Td right className={`text-xs ${colorPct(s.hdPct)}`}>{s.hdPct != null ? s.hdPct.toFixed(1)+'%' : '—'}</Td>
                      <Td right className={`text-xs ${colorPct(s.hePct, 90, 75)}`}>{s.hePct != null ? s.hePct.toFixed(1)+'%' : '—'}</Td>
                      <Td right className="text-xs text-emerald-600">{numFmt(s.grA)}</Td>
                      <Td right className="text-xs text-yellow-600">{numFmt(s.grB)}</Td>
                      <Td right className="text-xs text-orange-600">{numFmt(s.grC)}</Td>
                      <Td right className="text-xs">{numFmt(s.je)}</Td>
                      <Td right className="text-xs">{numFmt(s.te)}</Td>
                      <Td right className="text-xs text-red-400">{numFmt(s.waste)}</Td>
                      <Td right className="text-xs text-red-600">{numFmt(s.mortF)}</Td>
                      <Td right className="text-xs">{s.feedF > 0 ? s.feedF.toFixed(0)+' kg' : '—'}</Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card>
          )}
        </>
      )}
    </div>
  )
}

// ── Site expandable card ───────────────────────────────────────────────────────

const SiteCard: React.FC<{ farm: any; s: ReturnType<typeof buildAgg>; shedCount: number; flockCount: number }> = ({ farm, s, shedCount, flockCount }) => {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-4 p-4 bg-white hover:bg-gray-50 text-left transition-colors"
      >
        <Building2 size={18} className="text-brand-600 flex-shrink-0"/>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-bold text-gray-900">{farm?.name ?? 'Unknown Site'}</span>
            <Badge color="gray">{farm?.code}</Badge>
            <span className="text-xs text-gray-400">{shedCount} shed{shedCount !== 1 ? 's' : ''} · {flockCount} flock{flockCount !== 1 ? 's' : ''} · {s.days} day records</span>
          </div>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4 mt-2">
            <Metric label="Total Eggs" value={s.eggs.toLocaleString('en-IN')} />
            <Metric label="HE Eggs" value={s.he.toLocaleString('en-IN')} color="text-green-700" />
            <Metric label="HD%" value={s.hdPct != null ? s.hdPct.toFixed(1)+'%' : '—'} color={colorPct(s.hdPct)} />
            <Metric label="HE%" value={s.hePct != null ? s.hePct.toFixed(1)+'%' : '—'} color={colorPct(s.hePct, 90, 75)} />
            <Metric label="Mort F" value={s.mortF > 0 ? s.mortF.toLocaleString('en-IN') : '—'} color="text-red-500" />
            <Metric label="JE + TE" value={(s.je + s.te) > 0 ? (s.je + s.te).toLocaleString('en-IN') : '—'} />
          </div>
        </div>
        {open ? <ChevronDown size={16} className="text-gray-400"/> : <ChevronRight size={16} className="text-gray-400"/>}
      </button>

      {open && (
        <div className="border-t border-gray-100 bg-gray-50 p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white rounded-lg p-3 border border-gray-100">
              <p className="text-xs text-gray-500 mb-1">HE Grade Breakdown</p>
              <div className="space-y-0.5 text-xs">
                <div className="flex justify-between"><span className="text-emerald-600">Grade A</span><span className="font-semibold">{s.grA > 0 ? s.grA.toLocaleString('en-IN') : '—'}</span></div>
                <div className="flex justify-between"><span className="text-yellow-600">Grade B</span><span className="font-semibold">{s.grB > 0 ? s.grB.toLocaleString('en-IN') : '—'}</span></div>
                <div className="flex justify-between"><span className="text-orange-600">Grade C</span><span className="font-semibold">{s.grC > 0 ? s.grC.toLocaleString('en-IN') : '—'}</span></div>
              </div>
            </div>
            <div className="bg-white rounded-lg p-3 border border-gray-100">
              <p className="text-xs text-gray-500 mb-1">NHE Egg Types</p>
              <div className="space-y-0.5 text-xs">
                <div className="flex justify-between"><span>Jumbo (JE)</span><span className="font-semibold">{s.je > 0 ? s.je.toLocaleString('en-IN') : '—'}</span></div>
                <div className="flex justify-between"><span>Table (TE)</span><span className="font-semibold">{s.te > 0 ? s.te.toLocaleString('en-IN') : '—'}</span></div>
                <div className="flex justify-between"><span>Broken (BE)</span><span className="font-semibold text-red-400">{s.be > 0 ? s.be.toLocaleString('en-IN') : '—'}</span></div>
                <div className="flex justify-between"><span>Leached (LE)</span><span className="font-semibold text-red-400">{s.le > 0 ? s.le.toLocaleString('en-IN') : '—'}</span></div>
              </div>
            </div>
            <div className="bg-white rounded-lg p-3 border border-gray-100">
              <p className="text-xs text-gray-500 mb-1">Mortality & Wastage</p>
              <div className="space-y-0.5 text-xs">
                <div className="flex justify-between"><span>Mortality F</span><span className="font-semibold text-red-600">{s.mortF.toLocaleString('en-IN')}</span></div>
                <div className="flex justify-between"><span>Mortality M</span><span className="font-semibold text-red-600">{s.mortM.toLocaleString('en-IN')}</span></div>
                <div className="flex justify-between"><span>Wastage</span><span className="font-semibold text-red-400">{s.waste > 0 ? s.waste.toLocaleString('en-IN') : '—'}</span></div>
                <div className="flex justify-between"><span>Mort Rate F</span><span className={colorPct(s.mortRate ? 100 - s.mortRate : null)}>{s.mortRate != null ? s.mortRate.toFixed(3)+'%/d' : '—'}</span></div>
              </div>
            </div>
            <div className="bg-white rounded-lg p-3 border border-gray-100">
              <p className="text-xs text-gray-500 mb-1">Feed</p>
              <div className="space-y-0.5 text-xs">
                <div className="flex justify-between"><span>Female KG</span><span className="font-semibold">{s.feedF > 0 ? s.feedF.toFixed(0)+' kg' : '—'}</span></div>
                <div className="flex justify-between"><span>Male KG</span><span className="font-semibold">{s.feedM > 0 ? s.feedM.toFixed(0)+' kg' : '—'}</span></div>
                <div className="flex justify-between"><span>F/Bird/Day</span><span className="font-semibold">{s.birdDays > 0 && s.feedF > 0 ? (s.feedF*1000/s.birdDays).toFixed(0)+' g' : '—'}</span></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// helper for type inference
function buildAgg(rows: any[]) {
  const openF   = rows.reduce((s: number, r: any) => s + (r.opening_female ?? 0), 0)
  const openM   = rows.reduce((s: number, r: any) => s + (r.opening_male ?? 0), 0)
  const closeF  = rows.reduce((s: number, r: any) => s + (r.closing_female ?? 0), 0)
  const closeM  = rows.reduce((s: number, r: any) => s + (r.closing_male ?? 0), 0)
  const mortF   = rows.reduce((s: number, r: any) => s + (r.mortality_female ?? 0), 0)
  const mortM   = rows.reduce((s: number, r: any) => s + (r.mortality_male ?? 0), 0)
  const eggs    = rows.reduce((s: number, r: any) => s + (r.total_eggs ?? 0), 0)
  const he      = rows.reduce((s: number, r: any) => s + (r.he_eggs ?? 0), 0)
  const grA     = rows.reduce((s: number, r: any) => s + (r.he_grade_a ?? 0), 0)
  const grB     = rows.reduce((s: number, r: any) => s + (r.he_grade_b ?? 0), 0)
  const grC     = rows.reduce((s: number, r: any) => s + (r.he_grade_c ?? 0), 0)
  const je      = rows.reduce((s: number, r: any) => s + (r.je_eggs ?? 0), 0)
  const te      = rows.reduce((s: number, r: any) => s + (r.te_eggs ?? 0), 0)
  const be      = rows.reduce((s: number, r: any) => s + (r.be_eggs ?? 0), 0)
  const le      = rows.reduce((s: number, r: any) => s + (r.le_eggs ?? 0), 0)
  const waste   = rows.reduce((s: number, r: any) => s + (r.wastage_eggs ?? 0), 0)
  const feedF   = rows.reduce((s: number, r: any) => s + (r.feed_female_kg ?? 0), 0)
  const feedM   = rows.reduce((s: number, r: any) => s + (r.feed_male_kg ?? 0), 0)
  const days    = rows.length
  const birdDays = rows.reduce((s: number, r: any) => s + (r.opening_female ?? 0), 0)
  return { openF, openM, closeF, closeM, mortF, mortM, eggs, he, grA, grB, grC, je, te, be, le, waste, feedF, feedM, days, birdDays,
    hdPct: pctVal(eggs, birdDays),
    hePct: pctVal(he, eggs),
    mortRate: birdDays > 0 ? mortF / birdDays * 100 : null,
  }
}

const Metric: React.FC<{ label: string; value: string; color?: string }> = ({ label, value, color }) => (
  <div>
    <p className="text-xs text-gray-500">{label}</p>
    <p className={`text-sm font-semibold ${color ?? 'text-gray-800'}`}>{value}</p>
  </div>
)
