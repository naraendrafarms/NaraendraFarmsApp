import React, { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import {
  Card,
  Table,
  Th,
  Td,
  Badge,
  SectionHeader,
  Spinner,
  StatCard,
  Select,
} from '@/components/ui'
import { pct, fmtDate } from '@/lib/utils'
import {
  ResponsiveContainer,
  LineChart,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts'

// ─── Types ────────────────────────────────────────────────────────────────────

interface HatchRow {
  id: string
  flock_id: string
  dc_no: string | null
  setting_date: string | null
  invoice_date: string | null
  hatch_date: string | null
  hatchery: string | null
  setting_no: number | null
  age_weeks: number | null
  eggs_received: number | null
  eggs_set: number | null
  broken: number | null
  infertile: number | null
  chicks_hatched: number | null
  hatch_pct: number | null
  created_at: string
  production_date: string | null
  blasters: number | null
  unhatch: number | null
  rejects: number | null
  eggs_weight: number | null
  flocks: { flock_no: string } | null
}

interface FlockRow {
  id: string
  flock_no: string
}

type TabId = 'master' | 'hatchery' | 'pipeline' | 'age' | 'compare' | 'issues' | 'graphs'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calcHoldDays(row: HatchRow): number | null {
  const ref = row.invoice_date ?? row.production_date
  if (!ref || !row.setting_date) return null
  return Math.round(
    (new Date(row.setting_date).getTime() - new Date(ref).getTime()) / 86400000
  )
}

function num(v: number | null | undefined): number {
  return v ?? 0
}

function safePct(numerator: number | null | undefined, denominator: number | null | undefined): number | null {
  if (denominator == null || denominator === 0) return null
  return num(numerator) / denominator
}

const CHART_COLORS = ['#2563eb', '#16a34a', '#dc2626', '#d97706', '#7c3aed', '#0891b2', '#be185d']

// ─── Data hooks ───────────────────────────────────────────────────────────────

function useHatchability() {
  return useQuery<HatchRow[]>({
    queryKey: ['hatchability-full'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hatchability')
        .select(`
          id, flock_id, dc_no, setting_date, invoice_date, hatch_date,
          hatchery, setting_no, age_weeks, eggs_received, eggs_set,
          broken, infertile, chicks_hatched, hatch_pct, created_at,
          production_date, blasters, unhatch, rejects, eggs_weight,
          flocks(flock_no)
        `)
        .order('setting_date', { ascending: false })
        .limit(2000)
      if (error) throw error
      return (data ?? []) as unknown as HatchRow[]
    },
    staleTime: 5 * 60 * 1000,
  })
}

function useFlocks() {
  return useQuery<FlockRow[]>({
    queryKey: ['flocks-dropdown'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('flocks')
        .select('id, flock_no')
        .order('flock_no')
      if (error) throw error
      return (data ?? []) as FlockRow[]
    },
    staleTime: 10 * 60 * 1000,
  })
}

// ─── Tab bar config ───────────────────────────────────────────────────────────

const TABS: { id: TabId; label: string }[] = [
  { id: 'master',   label: 'Master Report' },
  { id: 'hatchery', label: 'Hatchery Summary' },
  { id: 'pipeline', label: 'Pipeline' },
  { id: 'age',      label: 'Age Trend' },
  { id: 'compare',  label: 'Flock Comparison' },
  { id: 'issues',   label: 'Issues' },
  { id: 'graphs',   label: 'Graphs' },
]

// ─── Master Report tab ────────────────────────────────────────────────────────

const MasterReport: React.FC<{ rows: HatchRow[] }> = ({ rows }) => (
  <Card padding={false}>
    <Table>
      <thead>
        <tr>
          <Th>Flock</Th>
          <Th>Prod Date</Th>
          <Th>DC No</Th>
          <Th>Invoice Date</Th>
          <Th right>Dispatch Qty</Th>
          <Th>Setting Date</Th>
          <Th right>Hold Days</Th>
          <Th>Hatch Date</Th>
          <Th right>Age (wk)</Th>
          <Th>Hatchery</Th>
          <Th right>Eggs Rcvd</Th>
          <Th right>Eggs Set</Th>
          <Th right>Broken</Th>
          <Th right>Broken%</Th>
          <Th right>Infertile</Th>
          <Th right>Inf%</Th>
          <Th right>Blasters</Th>
          <Th right>Blst%</Th>
          <Th right>Chicks</Th>
          <Th right>Hatch%</Th>
          <Th right>Unhatch</Th>
          <Th right>Reject</Th>
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 && (
          <tr>
            <Td colSpan={22} className="text-center text-gray-400 py-8">
              No records found
            </Td>
          </tr>
        )}
        {rows.map(r => {
          const hd = calcHoldDays(r)
          const late = hd !== null && hd > 7
          const lowHatch = r.hatch_pct !== null && r.hatch_pct < 0.75
          const brokenPct = safePct(r.broken, r.eggs_set)
          const infPct    = safePct(r.infertile, r.eggs_set)
          const blstPct   = safePct(r.blasters, r.eggs_set)
          return (
            <tr key={r.id} className={lowHatch ? 'bg-red-50' : undefined}>
              <Td>{r.flocks?.flock_no ?? r.flock_id}</Td>
              <Td>{fmtDate(r.production_date)}</Td>
              <Td>{r.dc_no ?? '—'}</Td>
              <Td>{fmtDate(r.invoice_date)}</Td>
              <Td right>{r.eggs_received != null ? r.eggs_received.toLocaleString() : '—'}</Td>
              <Td>{fmtDate(r.setting_date)}</Td>
              <Td right>
                {hd !== null ? (
                  <span className={late ? 'text-red-600 font-semibold' : 'text-gray-700'}>
                    {hd}d{late ? ' !' : ''}
                  </span>
                ) : '—'}
              </Td>
              <Td>{fmtDate(r.hatch_date)}</Td>
              <Td right>{r.age_weeks ?? '—'}</Td>
              <Td>{r.hatchery ?? '—'}</Td>
              <Td right>{r.eggs_received != null ? r.eggs_received.toLocaleString() : '—'}</Td>
              <Td right>{r.eggs_set != null ? r.eggs_set.toLocaleString() : '—'}</Td>
              <Td right>{r.broken != null ? r.broken.toLocaleString() : '—'}</Td>
              <Td right>{pct(brokenPct, 1)}</Td>
              <Td right>{r.infertile != null ? r.infertile.toLocaleString() : '—'}</Td>
              <Td right>{pct(infPct, 1)}</Td>
              <Td right>{r.blasters != null ? r.blasters.toLocaleString() : '—'}</Td>
              <Td right>{pct(blstPct, 1)}</Td>
              <Td right>{r.chicks_hatched != null ? r.chicks_hatched.toLocaleString() : '—'}</Td>
              <Td right>
                {r.hatch_pct != null ? (
                  <span className={lowHatch ? 'text-red-600 font-bold' : 'text-green-700 font-medium'}>
                    {pct(r.hatch_pct, 1)}
                  </span>
                ) : '—'}
              </Td>
              <Td right>{r.unhatch != null ? r.unhatch.toLocaleString() : '—'}</Td>
              <Td right>{r.rejects != null ? r.rejects.toLocaleString() : '—'}</Td>
            </tr>
          )
        })}
      </tbody>
    </Table>
  </Card>
)

// ─── Hatchery Summary tab ─────────────────────────────────────────────────────

const HatcherySummary: React.FC<{ rows: HatchRow[] }> = ({ rows }) => {
  const groups = useMemo(() => {
    const map = new Map<string, {
      settings: number
      totalEggs: number
      totalChicks: number
      hatchPcts: number[]
    }>()
    for (const r of rows) {
      const key = r.hatchery ?? 'Unknown'
      const g = map.get(key) ?? { settings: 0, totalEggs: 0, totalChicks: 0, hatchPcts: [] }
      g.settings++
      g.totalEggs += num(r.eggs_set)
      g.totalChicks += num(r.chicks_hatched)
      if (r.hatch_pct != null) g.hatchPcts.push(r.hatch_pct)
      map.set(key, g)
    }
    return Array.from(map.entries())
      .map(([name, g]) => ({
        name,
        settings: g.settings,
        totalEggs: g.totalEggs,
        totalChicks: g.totalChicks,
        avgHatch: g.hatchPcts.length > 0
          ? g.hatchPcts.reduce((a, b) => a + b, 0) / g.hatchPcts.length
          : null,
      }))
      .sort((a, b) => b.totalEggs - a.totalEggs)
  }, [rows])

  const chartData = groups.map(g => ({
    name: g.name,
    'Avg Hatch%': g.avgHatch != null ? parseFloat((g.avgHatch * 100).toFixed(1)) : 0,
  }))

  return (
    <div className="space-y-6">
      <Card>
        <h3 className="font-semibold text-gray-800 mb-4">Avg Hatch% by Hatchery</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis domain={[0, 100]} tickFormatter={(v: number) => `${v}%`} tick={{ fontSize: 12 }} />
            <Tooltip formatter={(v: number) => `${v}%`} />
            <Legend />
            <Bar dataKey="Avg Hatch%" fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card padding={false}>
        <Table>
          <thead>
            <tr>
              <Th>Hatchery</Th>
              <Th right>Settings</Th>
              <Th right>Total Eggs Set</Th>
              <Th right>Total Chicks</Th>
              <Th right>Avg Hatch%</Th>
            </tr>
          </thead>
          <tbody>
            {groups.length === 0 && (
              <tr><Td colSpan={5} className="text-center text-gray-400 py-8">No data</Td></tr>
            )}
            {groups.map(g => (
              <tr key={g.name}>
                <Td className="font-medium">{g.name}</Td>
                <Td right>{g.settings}</Td>
                <Td right>{g.totalEggs.toLocaleString()}</Td>
                <Td right>{g.totalChicks.toLocaleString()}</Td>
                <Td right>
                  {g.avgHatch != null ? (
                    <span className={g.avgHatch < 0.75 ? 'text-red-600 font-bold' : 'text-green-700 font-medium'}>
                      {pct(g.avgHatch, 1)}
                    </span>
                  ) : '—'}
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>
    </div>
  )
}

// ─── Pipeline tab ─────────────────────────────────────────────────────────────

const Pipeline: React.FC<{ rows: HatchRow[] }> = ({ rows }) => {
  const sorted = useMemo(() =>
    [...rows].sort((a, b) => {
      const aRef = a.production_date ?? a.invoice_date ?? ''
      const bRef = b.production_date ?? b.invoice_date ?? ''
      return bRef.localeCompare(aRef)
    }), [rows])

  return (
    <Card padding={false}>
      <Table>
        <thead>
          <tr>
            <Th>Flock</Th>
            <Th>DC No</Th>
            <Th>Prod / Invoice Date</Th>
            <Th>Setting Date</Th>
            <Th>Hatch Date</Th>
            <Th right>Hold Days</Th>
            <Th>Status</Th>
            <Th>Hatchery</Th>
            <Th right>Eggs Set</Th>
            <Th right>Chicks</Th>
            <Th right>Hatch%</Th>
          </tr>
        </thead>
        <tbody>
          {sorted.length === 0 && (
            <tr>
              <Td colSpan={11} className="text-center text-gray-400 py-8">No records</Td>
            </tr>
          )}
          {sorted.map(r => {
            const ref = r.invoice_date ?? r.production_date
            const hd = calcHoldDays(r)
            const late = hd !== null && hd > 7
            const sameDay = hd === 0
            return (
              <tr key={r.id}>
                <Td>{r.flocks?.flock_no ?? r.flock_id}</Td>
                <Td>{r.dc_no ?? '—'}</Td>
                <Td>{fmtDate(ref)}</Td>
                <Td>{fmtDate(r.setting_date)}</Td>
                <Td>{fmtDate(r.hatch_date)}</Td>
                <Td right>
                  {hd !== null ? (
                    <span className={
                      late ? 'text-red-600 font-semibold'
                      : sameDay ? 'text-blue-600 font-medium'
                      : 'text-gray-700'
                    }>
                      {hd}d
                    </span>
                  ) : '—'}
                </Td>
                <Td>
                  {hd === null
                    ? <Badge color="gray">No Data</Badge>
                    : late
                    ? <Badge color="red">Late ({hd}d)</Badge>
                    : sameDay
                    ? <Badge color="blue">Same Day</Badge>
                    : <Badge color="green">On Time</Badge>
                  }
                </Td>
                <Td>{r.hatchery ?? '—'}</Td>
                <Td right>{r.eggs_set != null ? r.eggs_set.toLocaleString() : '—'}</Td>
                <Td right>{r.chicks_hatched != null ? r.chicks_hatched.toLocaleString() : '—'}</Td>
                <Td right>
                  {r.hatch_pct != null ? (
                    <span className={r.hatch_pct < 0.75 ? 'text-red-600 font-bold' : 'text-green-700'}>
                      {pct(r.hatch_pct, 1)}
                    </span>
                  ) : '—'}
                </Td>
              </tr>
            )
          })}
        </tbody>
      </Table>
    </Card>
  )
}

// ─── Age Trend tab ────────────────────────────────────────────────────────────

const AgeTrend: React.FC<{ rows: HatchRow[] }> = ({ rows }) => {
  const ageTrend = useMemo(() => {
    const map = new Map<number, {
      pcts: number[]
      count: number
      totalChicks: number
      totalEggs: number
    }>()
    for (const r of rows) {
      if (r.age_weeks == null) continue
      const g = map.get(r.age_weeks) ?? { pcts: [], count: 0, totalChicks: 0, totalEggs: 0 }
      g.count++
      g.totalChicks += num(r.chicks_hatched)
      g.totalEggs   += num(r.eggs_set)
      if (r.hatch_pct != null) g.pcts.push(r.hatch_pct)
      map.set(r.age_weeks, g)
    }
    return Array.from(map.entries())
      .map(([age, g]) => ({
        age,
        avgHatch: g.pcts.length > 0
          ? g.pcts.reduce((a, b) => a + b, 0) / g.pcts.length
          : null,
        count: g.count,
        totalChicks: g.totalChicks,
        totalEggs: g.totalEggs,
      }))
      .sort((a, b) => a.age - b.age)
  }, [rows])

  const chartData = ageTrend.map(a => ({
    age: `Wk ${a.age}`,
    'Hatch%': a.avgHatch != null
      ? parseFloat((a.avgHatch * 100).toFixed(1))
      : null,
  }))

  return (
    <div className="space-y-6">
      <Card>
        <h3 className="font-semibold text-gray-800 mb-1">Hatch% vs Flock Age (weeks)</h3>
        <p className="text-xs text-gray-500 mb-4">Average hatch% grouped by age at setting</p>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="age" tick={{ fontSize: 12 }} />
            <YAxis domain={[0, 100]} tickFormatter={(v: number) => `${v}%`} tick={{ fontSize: 12 }} />
            <Tooltip formatter={(v: number) => `${v}%`} />
            <Legend />
            <Line
              type="monotone"
              dataKey="Hatch%"
              stroke={CHART_COLORS[0]}
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <Card padding={false}>
        <Table>
          <thead>
            <tr>
              <Th>Age (weeks)</Th>
              <Th right>Settings</Th>
              <Th right>Total Eggs Set</Th>
              <Th right>Total Chicks</Th>
              <Th right>Avg Hatch%</Th>
            </tr>
          </thead>
          <tbody>
            {ageTrend.length === 0 && (
              <tr><Td colSpan={5} className="text-center text-gray-400 py-8">No age data</Td></tr>
            )}
            {ageTrend.map(a => (
              <tr key={a.age}>
                <Td>Week {a.age}</Td>
                <Td right>{a.count}</Td>
                <Td right>{a.totalEggs.toLocaleString()}</Td>
                <Td right>{a.totalChicks.toLocaleString()}</Td>
                <Td right>
                  {a.avgHatch != null ? (
                    <span className={a.avgHatch < 0.75 ? 'text-red-600 font-bold' : 'text-green-700 font-medium'}>
                      {pct(a.avgHatch, 1)}
                    </span>
                  ) : '—'}
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>
    </div>
  )
}

// ─── Flock Comparison tab ─────────────────────────────────────────────────────

const FlockComparison: React.FC<{ rows: HatchRow[] }> = ({ rows }) => {
  const flockGroups = useMemo(() => {
    const map = new Map<string, {
      flockNo: string
      settings: number
      totalEggs: number
      totalChicks: number
      infertileTotal: number
      brokenTotal: number
      hatchPcts: number[]
    }>()
    for (const r of rows) {
      const key = r.flock_id
      const label = r.flocks?.flock_no ?? r.flock_id
      const g = map.get(key) ?? {
        flockNo: label,
        settings: 0,
        totalEggs: 0,
        totalChicks: 0,
        infertileTotal: 0,
        brokenTotal: 0,
        hatchPcts: [],
      }
      g.settings++
      g.totalEggs      += num(r.eggs_set)
      g.totalChicks    += num(r.chicks_hatched)
      g.infertileTotal += num(r.infertile)
      g.brokenTotal    += num(r.broken)
      if (r.hatch_pct != null) g.hatchPcts.push(r.hatch_pct)
      map.set(key, g)
    }
    return Array.from(map.values()).sort((a, b) => a.flockNo.localeCompare(b.flockNo))
  }, [rows])

  const chartData = flockGroups.map(g => ({
    flock: g.flockNo,
    'Avg Hatch%': g.hatchPcts.length > 0
      ? parseFloat(((g.hatchPcts.reduce((a, b) => a + b, 0) / g.hatchPcts.length) * 100).toFixed(1))
      : 0,
    Settings: g.settings,
  }))

  return (
    <div className="space-y-6">
      <Card>
        <h3 className="font-semibold text-gray-800 mb-4">Hatch% by Flock (side-by-side)</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="flock" tick={{ fontSize: 12 }} />
            <YAxis yAxisId="left" domain={[0, 100]} tickFormatter={(v: number) => `${v}%`} tick={{ fontSize: 12 }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
            <Tooltip formatter={(v: number, name: string) => name === 'Avg Hatch%' ? `${v}%` : v} />
            <Legend />
            <Bar yAxisId="left"  dataKey="Avg Hatch%" fill={CHART_COLORS[1]} radius={[4, 4, 0, 0]} />
            <Bar yAxisId="right" dataKey="Settings"   fill={CHART_COLORS[6]} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card padding={false}>
        <Table>
          <thead>
            <tr>
              <Th>Flock</Th>
              <Th right>Settings</Th>
              <Th right>Total Eggs Set</Th>
              <Th right>Total Chicks</Th>
              <Th right>Infertile</Th>
              <Th right>Broken</Th>
              <Th right>Avg Hatch%</Th>
            </tr>
          </thead>
          <tbody>
            {flockGroups.length === 0 && (
              <tr><Td colSpan={7} className="text-center text-gray-400 py-8">No data</Td></tr>
            )}
            {flockGroups.map(g => {
              const avg = g.hatchPcts.length > 0
                ? g.hatchPcts.reduce((a, b) => a + b, 0) / g.hatchPcts.length
                : null
              return (
                <tr key={g.flockNo}>
                  <Td className="font-medium">{g.flockNo}</Td>
                  <Td right>{g.settings}</Td>
                  <Td right>{g.totalEggs.toLocaleString()}</Td>
                  <Td right>{g.totalChicks.toLocaleString()}</Td>
                  <Td right>{g.infertileTotal.toLocaleString()}</Td>
                  <Td right>{g.brokenTotal.toLocaleString()}</Td>
                  <Td right>
                    {avg != null ? (
                      <span className={avg < 0.75 ? 'text-red-600 font-bold' : 'text-green-700 font-medium'}>
                        {pct(avg, 1)}
                      </span>
                    ) : '—'}
                  </Td>
                </tr>
              )
            })}
          </tbody>
        </Table>
      </Card>
    </div>
  )
}

// ─── Issues tab ───────────────────────────────────────────────────────────────

const Issues: React.FC<{ rows: HatchRow[] }> = ({ rows }) => {
  const lowHatch = useMemo(() =>
    rows
      .filter(r => r.hatch_pct != null && r.hatch_pct < 0.75)
      .sort((a, b) => num(a.hatch_pct) - num(b.hatch_pct)),
    [rows])

  const missingData = useMemo(() =>
    rows.filter(r =>
      r.eggs_set == null ||
      r.chicks_hatched == null ||
      r.hatch_pct == null ||
      r.setting_date == null ||
      r.hatch_date == null
    ),
    [rows])

  const lateSettings = useMemo(() =>
    rows.filter(r => {
      const hd = calcHoldDays(r)
      return hd !== null && hd > 7
    }),
    [rows])

  return (
    <div className="space-y-6">
      {/* Summary row */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
          <span className="text-red-700 font-bold text-xl">{lowHatch.length}</span>
          <span className="text-red-600 text-sm">Low Hatch (&lt;75%)</span>
        </div>
        <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2">
          <span className="text-yellow-700 font-bold text-xl">{missingData.length}</span>
          <span className="text-yellow-600 text-sm">Missing Data</span>
        </div>
        <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-lg px-4 py-2">
          <span className="text-orange-700 font-bold text-xl">{lateSettings.length}</span>
          <span className="text-orange-600 text-sm">Late Settings (&gt;7 days)</span>
        </div>
      </div>

      {/* Low hatch table */}
      {lowHatch.length > 0 && (
        <Card padding={false}>
          <div className="px-4 py-3 bg-red-50 border-b border-red-100 rounded-t-xl">
            <h3 className="font-semibold text-red-800">Low Hatch Records — below 75%</h3>
          </div>
          <Table>
            <thead>
              <tr>
                <Th>Flock</Th>
                <Th>DC No</Th>
                <Th>Setting Date</Th>
                <Th>Hatch Date</Th>
                <Th>Hatchery</Th>
                <Th right>Age (wk)</Th>
                <Th right>Eggs Set</Th>
                <Th right>Chicks</Th>
                <Th right>Hatch%</Th>
              </tr>
            </thead>
            <tbody>
              {lowHatch.map(r => (
                <tr key={r.id} className="bg-red-50 hover:bg-red-100">
                  <Td>{r.flocks?.flock_no ?? r.flock_id}</Td>
                  <Td>{r.dc_no ?? '—'}</Td>
                  <Td>{fmtDate(r.setting_date)}</Td>
                  <Td>{fmtDate(r.hatch_date)}</Td>
                  <Td>{r.hatchery ?? '—'}</Td>
                  <Td right>{r.age_weeks ?? '—'}</Td>
                  <Td right>{r.eggs_set != null ? r.eggs_set.toLocaleString() : '—'}</Td>
                  <Td right>{r.chicks_hatched != null ? r.chicks_hatched.toLocaleString() : '—'}</Td>
                  <Td right>
                    <span className="text-red-700 font-bold">{pct(r.hatch_pct, 1)}</span>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}

      {/* Missing data */}
      {missingData.length > 0 && (
        <Card padding={false}>
          <div className="px-4 py-3 bg-yellow-50 border-b border-yellow-100 rounded-t-xl">
            <h3 className="font-semibold text-yellow-800">Records with Missing Data</h3>
          </div>
          <Table>
            <thead>
              <tr>
                <Th>Flock</Th>
                <Th>DC No</Th>
                <Th>Setting Date</Th>
                <Th>Missing Fields</Th>
              </tr>
            </thead>
            <tbody>
              {missingData.map(r => {
                const missing: string[] = []
                if (r.eggs_set == null)       missing.push('Eggs Set')
                if (r.chicks_hatched == null) missing.push('Chicks')
                if (r.hatch_pct == null)      missing.push('Hatch%')
                if (r.setting_date == null)   missing.push('Setting Date')
                if (r.hatch_date == null)     missing.push('Hatch Date')
                return (
                  <tr key={r.id}>
                    <Td>{r.flocks?.flock_no ?? r.flock_id}</Td>
                    <Td>{r.dc_no ?? '—'}</Td>
                    <Td>{fmtDate(r.setting_date)}</Td>
                    <Td>
                      <div className="flex flex-wrap gap-1">
                        {missing.map(m => (
                          <Badge key={m} color="yellow">{m}</Badge>
                        ))}
                      </div>
                    </Td>
                  </tr>
                )
              })}
            </tbody>
          </Table>
        </Card>
      )}

      {/* Late settings */}
      {lateSettings.length > 0 && (
        <Card padding={false}>
          <div className="px-4 py-3 bg-orange-50 border-b border-orange-100 rounded-t-xl">
            <h3 className="font-semibold text-orange-800">Late Settings — more than 7 days from dispatch to setting</h3>
          </div>
          <Table>
            <thead>
              <tr>
                <Th>Flock</Th>
                <Th>DC No</Th>
                <Th>Invoice / Prod Date</Th>
                <Th>Setting Date</Th>
                <Th right>Hold Days</Th>
                <Th right>Hatch%</Th>
              </tr>
            </thead>
            <tbody>
              {lateSettings.map(r => {
                const ref = r.invoice_date ?? r.production_date
                const hd = calcHoldDays(r)
                return (
                  <tr key={r.id} className="bg-orange-50 hover:bg-orange-100">
                    <Td>{r.flocks?.flock_no ?? r.flock_id}</Td>
                    <Td>{r.dc_no ?? '—'}</Td>
                    <Td>{fmtDate(ref)}</Td>
                    <Td>{fmtDate(r.setting_date)}</Td>
                    <Td right>
                      <span className="text-orange-700 font-bold">{hd}d</span>
                    </Td>
                    <Td right>{pct(r.hatch_pct, 1)}</Td>
                  </tr>
                )
              })}
            </tbody>
          </Table>
        </Card>
      )}

      {lowHatch.length === 0 && missingData.length === 0 && lateSettings.length === 0 && (
        <Card>
          <p className="text-center text-green-700 py-8 font-medium">
            No issues found — all records look healthy.
          </p>
        </Card>
      )}
    </div>
  )
}

// ─── Graphs tab ───────────────────────────────────────────────────────────────

const Graphs: React.FC<{ rows: HatchRow[] }> = ({ rows }) => {
  // Monthly trend
  const monthlyTrend = useMemo(() => {
    const map = new Map<string, { pcts: number[]; eggs: number; chicks: number }>()
    for (const r of rows) {
      if (!r.setting_date) continue
      const month = r.setting_date.slice(0, 7)
      const g = map.get(month) ?? { pcts: [], eggs: 0, chicks: 0 }
      g.eggs   += num(r.eggs_set)
      g.chicks += num(r.chicks_hatched)
      if (r.hatch_pct != null) g.pcts.push(r.hatch_pct)
      map.set(month, g)
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, g]) => ({
        month,
        'Hatch%': g.pcts.length > 0
          ? parseFloat(((g.pcts.reduce((a, b) => a + b, 0) / g.pcts.length) * 100).toFixed(1))
          : null,
        'Eggs Set': g.eggs,
        Chicks: g.chicks,
      }))
  }, [rows])

  // Hatchery comparison
  const hatcheryData = useMemo(() => {
    const map = new Map<string, { pcts: number[]; settings: number }>()
    for (const r of rows) {
      const key = r.hatchery ?? 'Unknown'
      const g = map.get(key) ?? { pcts: [], settings: 0 }
      g.settings++
      if (r.hatch_pct != null) g.pcts.push(r.hatch_pct)
      map.set(key, g)
    }
    return Array.from(map.entries()).map(([name, g]) => ({
      name,
      'Avg Hatch%': g.pcts.length > 0
        ? parseFloat(((g.pcts.reduce((a, b) => a + b, 0) / g.pcts.length) * 100).toFixed(1))
        : 0,
      Settings: g.settings,
    }))
  }, [rows])

  // Age vs hatch%
  const ageData = useMemo(() => {
    const map = new Map<number, number[]>()
    for (const r of rows) {
      if (r.age_weeks == null || r.hatch_pct == null) continue
      const arr = map.get(r.age_weeks) ?? []
      arr.push(r.hatch_pct)
      map.set(r.age_weeks, arr)
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a - b)
      .map(([age, pcts]) => ({
        age: `Wk ${age}`,
        'Hatch%': parseFloat(((pcts.reduce((a, b) => a + b, 0) / pcts.length) * 100).toFixed(1)),
      }))
  }, [rows])

  return (
    <div className="space-y-6">
      <Card>
        <h3 className="font-semibold text-gray-800 mb-1">Monthly Hatch% Trend</h3>
        <p className="text-xs text-gray-500 mb-4">Average hatch% per month (by setting date)</p>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={monthlyTrend} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis domain={[0, 100]} tickFormatter={(v: number) => `${v}%`} tick={{ fontSize: 12 }} />
            <Tooltip formatter={(v: number) => `${v}%`} />
            <Legend />
            <Line
              type="monotone"
              dataKey="Hatch%"
              stroke={CHART_COLORS[0]}
              strokeWidth={2}
              dot={{ r: 4 }}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <Card>
        <h3 className="font-semibold text-gray-800 mb-1">Hatchery Comparison</h3>
        <p className="text-xs text-gray-500 mb-4">Avg hatch% and settings count per hatchery</p>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={hatcheryData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis yAxisId="left"  domain={[0, 100]} tickFormatter={(v: number) => `${v}%`} tick={{ fontSize: 12 }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
            <Tooltip formatter={(v: number, name: string) => name === 'Avg Hatch%' ? `${v}%` : v} />
            <Legend />
            <Bar yAxisId="left"  dataKey="Avg Hatch%" fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} />
            <Bar yAxisId="right" dataKey="Settings"   fill={CHART_COLORS[1]} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card>
        <h3 className="font-semibold text-gray-800 mb-1">Hatch% vs Flock Age</h3>
        <p className="text-xs text-gray-500 mb-4">Average hatch% at each age-week (scatter-like trend)</p>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={ageData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="age" tick={{ fontSize: 12 }} />
            <YAxis domain={[50, 100]} tickFormatter={(v: number) => `${v}%`} tick={{ fontSize: 12 }} />
            <Tooltip formatter={(v: number) => `${v}%`} />
            <Legend />
            <Line
              type="monotone"
              dataKey="Hatch%"
              stroke={CHART_COLORS[2]}
              strokeWidth={2}
              dot={{ r: 4, fill: CHART_COLORS[2] }}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export const HatchabilityPage: React.FC = () => {
  const [tab, setTab] = useState<TabId>('master')
  const [flockFilter, setFlockFilter] = useState<string>('')
  const [dateFrom, setDateFrom] = useState<string>('')
  const [dateTo, setDateTo] = useState<string>('')

  const { data: rawRows = [], isLoading } = useHatchability()
  const { data: flocks = [] } = useFlocks()

  // Apply filters
  const rows = useMemo(() => {
    let r = rawRows
    if (flockFilter) r = r.filter(x => x.flock_id === flockFilter)
    if (dateFrom)    r = r.filter(x => (x.setting_date ?? '') >= dateFrom)
    if (dateTo)      r = r.filter(x => (x.setting_date ?? '') <= dateTo)
    return r
  }, [rawRows, flockFilter, dateFrom, dateTo])

  // Summary stats (computed from filtered rows)
  const stats = useMemo(() => {
    const totalEggs   = rows.reduce((s, r) => s + num(r.eggs_set), 0)
    const totalChicks = rows.reduce((s, r) => s + num(r.chicks_hatched), 0)
    const pctValues   = rows.filter(r => r.hatch_pct != null).map(r => r.hatch_pct as number)
    const avgHatch    = pctValues.length > 0
      ? pctValues.reduce((a, b) => a + b, 0) / pctValues.length
      : null
    const lowCount = rows.filter(r => r.hatch_pct != null && r.hatch_pct < 0.75).length
    return { totalEggs, totalChicks, avgHatch, lowCount, settings: rows.length }
  }, [rows])

  const flockOptions = [
    { value: '', label: 'All Flocks' },
    ...flocks.map(f => ({ value: f.id, label: f.flock_no })),
  ]

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-[1600px] mx-auto">
      {/* Page header */}
      <SectionHeader
        title="Hatchability Report"
        subtitle={`${stats.settings} setting records — comprehensive hatch performance`}
      />

      {/* Filter bar */}
      <Card>
        <div className="flex flex-wrap items-end gap-4">
          <div className="w-48">
            <Select
              label="Flock"
              value={flockFilter}
              options={flockOptions}
              onChange={e => setFlockFilter(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Setting Date From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm
                focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Setting Date To</label>
            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm
                focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          {(flockFilter || dateFrom || dateTo) && (
            <button
              onClick={() => { setFlockFilter(''); setDateFrom(''); setDateTo('') }}
              className="text-sm text-brand-600 hover:text-brand-800 underline self-end pb-2"
            >
              Clear filters
            </button>
          )}
        </div>
      </Card>

      {/* Summary stat cards — always visible */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Settings"
          value={stats.settings.toLocaleString()}
          subtitle="filtered records"
          color="text-brand-600"
        />
        <StatCard
          title="Total Eggs Set"
          value={stats.totalEggs.toLocaleString()}
          subtitle="across all hatcheries"
          color="text-blue-600"
        />
        <StatCard
          title="Total Chicks Hatched"
          value={stats.totalChicks.toLocaleString()}
          subtitle={`of ${stats.totalEggs.toLocaleString()} eggs`}
          color="text-green-600"
        />
        <StatCard
          title="Avg Hatch%"
          value={stats.avgHatch != null ? pct(stats.avgHatch, 1) : '—'}
          subtitle={`${stats.lowCount} batch${stats.lowCount !== 1 ? 'es' : ''} below 75%`}
          color={
            stats.avgHatch != null && stats.avgHatch < 0.75
              ? 'text-red-600'
              : 'text-green-600'
          }
        />
      </div>

      {/* Tab bar */}
      <div className="flex flex-wrap gap-2">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              tab === t.id
                ? 'bg-brand-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {isLoading ? (
        <Spinner />
      ) : (
        <>
          {tab === 'master'   && <MasterReport rows={rows} />}
          {tab === 'hatchery' && <HatcherySummary rows={rows} />}
          {tab === 'pipeline' && <Pipeline rows={rows} />}
          {tab === 'age'      && <AgeTrend rows={rows} />}
          {tab === 'compare'  && <FlockComparison rows={rows} />}
          {tab === 'issues'   && <Issues rows={rows} />}
          {tab === 'graphs'   && <Graphs rows={rows} />}
        </>
      )}
    </div>
  )
}
