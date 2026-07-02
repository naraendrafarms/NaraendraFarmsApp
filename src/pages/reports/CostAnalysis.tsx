import React, { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { inr, exportCSV } from '@/lib/utils'
import {
  Card, Select, SectionHeader, Spinner, Table, Th, Td, Badge, Button
} from '@/components/ui'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, LineChart, Line
} from 'recharts'
import { Zap, Users, TrendingUp, Download } from 'lucide-react'

const SITES = ['BPET1', 'BPET2', 'PPALLY', 'KPALLY', 'FEEDMILL']
const SITE_COLORS: Record<string, string> = {
  BPET1: '#3b82f6', BPET2: '#10b981', PPALLY: '#f59e0b',
  KPALLY: '#ef4444', FEEDMILL: '#8b5cf6'
}

// ── ELECTRICITY ANALYSIS ─────────────────────────────────────────
export const ElectricityCostPage: React.FC = () => {
  const [fyFilter, setFyFilter] = useState('all')

  const { data: bills, isLoading } = useQuery({
    queryKey: ['elec_bills_all'],
    queryFn: async () => {
      const { data } = await supabase
        .from('electricity_bills')
        .select('bill_month, amount, units_consumed, acd_dc_due, electricity_meters(meter_name, usc_no, notes, farms(code, name))')
        .order('bill_month')
      return data ?? []
    }
  })

  // Group by month × site
  const monthly = useMemo(() => {
    if (!bills) return []
    const map: Record<string, any> = {}
    for (const b of bills) {
      const month = b.bill_month.slice(0, 7)
      const fy = month >= '2022-04' && month <= '2023-03' ? '2022-23'
               : month >= '2023-04' && month <= '2024-03' ? '2023-24'
               : month >= '2024-04' && month <= '2025-03' ? '2024-25'
               : month >= '2025-04' && month <= '2026-03' ? '2025-26'
               : '2026-27'
      if (fyFilter !== 'all' && fy !== fyFilter) continue
      const site = (b.electricity_meters as any)?.farms?.code ?? 'OTHER'
      const key = month
      if (!map[key]) map[key] = { month, label: new Date(month + '-01').toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }), total: 0 }
      map[key][site] = (map[key][site] ?? 0) + (b.amount ?? 0)
      map[key]['units_' + site] = (map[key]['units_' + site] ?? 0) + (b.units_consumed ?? 0)
      map[key].total += (b.amount ?? 0)
    }
    return Object.values(map).sort((a: any, b: any) => a.month.localeCompare(b.month))
  }, [bills, fyFilter])

  // Site totals
  const siteTotals = useMemo(() => {
    const map: Record<string, { amount: number; units: number }> = {}
    for (const r of monthly) {
      for (const site of SITES) {
        if (!map[site]) map[site] = { amount: 0, units: 0 }
        map[site].amount += r[site] ?? 0
        map[site].units += r['units_' + site] ?? 0
      }
    }
    return map
  }, [monthly])

  const grandTotal = Object.values(siteTotals).reduce((s, v) => s + v.amount, 0)

  const fyOptions = [
    { value: 'all', label: 'All Years' },
    { value: '2022-23', label: 'FY 2022-23' },
    { value: '2023-24', label: 'FY 2023-24' },
    { value: '2024-25', label: 'FY 2024-25' },
    { value: '2025-26', label: 'FY 2025-26' },
  ]

  if (isLoading) return <Spinner />

  return (
    <div className="space-y-5">
      <SectionHeader title="Electricity Cost Analysis" subtitle="Monthly bills by site — all 8 meters"
        action={<Button variant="outline" size="sm" icon={<Download size={14}/>} onClick={() => exportCSV(
          'electricity_cost_analysis.csv',
          ['Month', ...SITES, 'Total'],
          (monthly as any[]).map(r => [r.label, ...SITES.map(s => r[s] ?? 0), r.total ?? 0])
        )}>Export Excel</Button>} />

      <div className="flex gap-3">
        <Select label="" placeholder="" options={fyOptions} value={fyFilter} onChange={e => setFyFilter(e.target.value)} className="w-44" />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {SITES.map(site => (
          <Card key={site} className="text-center py-3">
            <div className="text-xs text-gray-500 font-medium">{site}</div>
            <div className="text-lg font-bold text-gray-800 mt-1">{inr(siteTotals[site]?.amount ?? 0)}</div>
            <div className="text-xs text-gray-400 mt-0.5">{Math.round((siteTotals[site]?.units ?? 0) / 1000)}K units</div>
          </Card>
        ))}
      </div>
      <Card className="text-center py-2 bg-blue-50">
        <span className="text-sm text-gray-600">Total Electricity Cost: </span>
        <span className="text-xl font-bold text-blue-700">{inr(grandTotal)}</span>
      </Card>

      {/* Stacked Bar Chart */}
      <Card>
        <h3 className="font-semibold text-gray-800 mb-4">Monthly Electricity Bill by Site</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={monthly} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis tickFormatter={v => `₹${(v / 100000).toFixed(0)}L`} tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v: any) => inr(v)} />
            <Legend />
            {SITES.map(site => (
              <Bar key={site} dataKey={site} stackId="a" fill={SITE_COLORS[site]} name={site} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Monthly Table */}
      <Card>
        <h3 className="font-semibold text-gray-800 mb-3">Month-wise Breakdown</h3>
        <div className="overflow-x-auto">
          <Table>
            <thead>
              <tr>
                <Th>Month</Th>
                {SITES.map(s => <Th key={s} className="text-right">{s}</Th>)}
                <Th className="text-right font-bold">Total</Th>
              </tr>
            </thead>
            <tbody>
              {monthly.map((r: any) => (
                <tr key={r.month} className="hover:bg-gray-50">
                  <Td className="font-medium">{r.label}</Td>
                  {SITES.map(s => (
                    <Td key={s} className="text-right text-sm">
                      {r[s] ? inr(r[s]) : <span className="text-gray-300">—</span>}
                    </Td>
                  ))}
                  <Td className="text-right font-semibold">{inr(r.total)}</Td>
                </tr>
              ))}
              <tr className="bg-gray-100 font-semibold">
                <Td>Total</Td>
                {SITES.map(s => <Td key={s} className="text-right">{inr(siteTotals[s]?.amount ?? 0)}</Td>)}
                <Td className="text-right text-blue-700">{inr(grandTotal)}</Td>
              </tr>
            </tbody>
          </Table>
        </div>
      </Card>
    </div>
  )
}

// ── SALARY ANALYSIS ──────────────────────────────────────────────
export const SalaryCostPage: React.FC = () => {
  const [fyFilter, setFyFilter] = useState('2024-25')

  const { data: salaries, isLoading } = useQuery({
    queryKey: ['salary_analysis', fyFilter],
    queryFn: async () => {
      const [startYear] = fyFilter.split('-')
      const startDate = `${startYear}-04-01`
      const endDate = `${parseInt(startYear) + 1}-03-31`
      let all: any[] = [], from = 0
      while (true) {
        const { data } = await supabase
          .from('salary_monthly')
          .select('month, earned_salary, net_salary, advance, tds, days_worked, employees(farm_id, farms(code, name))')
          .gte('month', startDate)
          .lte('month', endDate)
          .order('month')
          .range(from, from + 999)
        if (!data || data.length === 0) break
        all = all.concat(data)
        if (data.length < 1000) break
        from += 1000
      }
      return all
    }
  })

  const monthly = useMemo(() => {
    if (!salaries) return []
    const map: Record<string, any> = {}
    for (const s of salaries) {
      const month = s.month.slice(0, 7)
      const site = (s.employees as any)?.farms?.code ?? 'HO'
      if (!map[month]) map[month] = { month, label: new Date(month + '-01').toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }), total: 0, headcount: {} }
      map[month][site] = (map[month][site] ?? 0) + (s.net_salary ?? 0)
      map[month]['hc_' + site] = (map[month]['hc_' + site] ?? 0) + 1
      map[month].total += (s.net_salary ?? 0)
    }
    return Object.values(map).sort((a: any, b: any) => a.month.localeCompare(b.month))
  }, [salaries])

  const sites = useMemo(() => {
    const s = new Set<string>()
    for (const r of monthly) {
      for (const key of Object.keys(r)) {
        if (!key.startsWith('hc_') && !['month', 'label', 'total', 'headcount'].includes(key)) s.add(key)
      }
    }
    return Array.from(s).sort()
  }, [monthly])

  const siteTotals = useMemo(() => {
    const map: Record<string, number> = {}
    for (const r of monthly) {
      for (const site of sites) {
        map[site] = (map[site] ?? 0) + (r[site] ?? 0)
      }
    }
    return map
  }, [monthly, sites])

  const grandTotal = Object.values(siteTotals).reduce((s, v) => s + v, 0)

  const fyOptions = [
    { value: '2024-25', label: 'FY 2024-25' },
    { value: '2025-26', label: 'FY 2025-26' },
  ]

  if (isLoading) return <Spinner />

  return (
    <div className="space-y-5">
      <SectionHeader title="Salary Cost Analysis" subtitle="Monthly net salary paid by site"
        action={<Button variant="outline" size="sm" icon={<Download size={14}/>} onClick={() => exportCSV(
          'salary_cost_analysis.csv',
          ['Month', ...sites, 'Total'],
          (monthly as any[]).map(r => [r.label, ...sites.map(s => r[s] ?? 0), r.total ?? 0])
        )}>Export Excel</Button>} />

      <div className="flex gap-3">
        <Select label="" placeholder="" options={fyOptions} value={fyFilter} onChange={e => setFyFilter(e.target.value)} className="w-40" />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {sites.map(site => (
          <Card key={site} className="text-center py-3">
            <div className="text-xs text-gray-500 font-medium">{site || 'HO'}</div>
            <div className="text-lg font-bold text-gray-800 mt-1">{inr(siteTotals[site] ?? 0)}</div>
          </Card>
        ))}
      </div>
      <Card className="text-center py-2 bg-green-50">
        <span className="text-sm text-gray-600">Total Salary Cost: </span>
        <span className="text-xl font-bold text-green-700">{inr(grandTotal)}</span>
      </Card>

      {/* Chart */}
      <Card>
        <h3 className="font-semibold text-gray-800 mb-4">Monthly Salary by Site</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={monthly} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis tickFormatter={v => `₹${(v / 100000).toFixed(0)}L`} tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v: any) => inr(v)} />
            <Legend />
            {sites.map((site, i) => (
              <Bar key={site} dataKey={site} stackId="a" fill={Object.values(SITE_COLORS)[i % 5]} name={site || 'HO'} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <thead>
              <tr>
                <Th>Month</Th>
                {sites.map(s => <Th key={s} className="text-right">{s || 'HO'}</Th>)}
                <Th className="text-right font-bold">Total</Th>
              </tr>
            </thead>
            <tbody>
              {monthly.map((r: any) => (
                <tr key={r.month} className="hover:bg-gray-50">
                  <Td className="font-medium">{r.label}</Td>
                  {sites.map(s => (
                    <Td key={s} className="text-right text-sm">
                      {r[s] ? inr(r[s]) : <span className="text-gray-300">—</span>}
                    </Td>
                  ))}
                  <Td className="text-right font-semibold">{inr(r.total)}</Td>
                </tr>
              ))}
              <tr className="bg-gray-100 font-semibold">
                <Td>Total</Td>
                {sites.map(s => <Td key={s} className="text-right">{inr(siteTotals[s] ?? 0)}</Td>)}
                <Td className="text-right text-green-700">{inr(grandTotal)}</Td>
              </tr>
            </tbody>
          </Table>
        </div>
      </Card>
    </div>
  )
}

// ── COMBINED COST OVERVIEW ────────────────────────────────────────
export const CostOverviewPage: React.FC = () => {
  const [tab, setTab] = useState<'electricity' | 'salary' | 'combined'>('combined')

  const { data: elecSummary } = useQuery({
    queryKey: ['elec_annual_summary'],
    queryFn: async () => {
      const { data } = await supabase
        .from('electricity_bills')
        .select('bill_month, amount, electricity_meters(farms(code))')
      if (!data) return []
      const fyMap: Record<string, number> = {}
      for (const b of data) {
        const m = b.bill_month.slice(0, 7)
        const fy = m >= '2024-04' ? (m <= '2025-03' ? '2024-25' : '2025-26') : m >= '2023-04' ? '2023-24' : '2022-23'
        fyMap[fy] = (fyMap[fy] ?? 0) + (b.amount ?? 0)
      }
      return Object.entries(fyMap).map(([fy, amt]) => ({ fy, electricity: amt })).sort((a, b) => a.fy.localeCompare(b.fy))
    }
  })

  const { data: salSummary } = useQuery({
    queryKey: ['salary_annual_summary'],
    queryFn: async () => {
      const fyMap: Record<string, number> = {}
      for (const fy of ['2024-25', '2025-26']) {
        const [y] = fy.split('-')
        let total = 0, from = 0
        while (true) {
          const { data } = await supabase.from('salary_monthly')
            .select('net_salary').gte('month', `${y}-04-01`).lte('month', `${parseInt(y) + 1}-03-31`)
            .range(from, from + 999)
          if (!data || data.length === 0) break
          total += data.reduce((s: number, r: any) => s + (r.net_salary ?? 0), 0)
          if (data.length < 1000) break
          from += 1000
        }
        fyMap[fy] = total
      }
      return Object.entries(fyMap).map(([fy, salary]) => ({ fy, salary }))
    }
  })

  const combined = useMemo(() => {
    const map: Record<string, any> = {}
    for (const e of (elecSummary ?? [])) map[e.fy] = { ...map[e.fy], fy: e.fy, electricity: e.electricity }
    for (const s of (salSummary ?? [])) map[s.fy] = { ...map[s.fy], fy: s.fy, salary: s.salary }
    return Object.values(map).sort((a: any, b: any) => a.fy.localeCompare(b.fy))
  }, [elecSummary, salSummary])

  return (
    <div className="space-y-5">
      <SectionHeader title="Cost Overview" subtitle="Annual electricity + salary summary"
        action={<Button variant="outline" size="sm" icon={<Download size={14}/>} onClick={() => exportCSV(
          'cost_overview.csv',
          ['FY', 'Electricity', 'Salary'],
          (combined as any[]).map(r => [r.fy, r.electricity ?? 0, r.salary ?? 0])
        )}>Export Excel</Button>} />

      <div className="flex gap-2 border-b border-gray-200 pb-0">
        {(['combined', 'electricity', 'salary'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px capitalize ${tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t === 'combined' ? 'Overview' : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === 'combined' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {combined.map((r: any) => (
              <Card key={r.fy} className="space-y-3">
                <div className="text-sm font-bold text-gray-700">FY {r.fy}</div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2 text-sm text-blue-600"><Zap size={14} /> Electricity</span>
                  <span className="font-semibold">{r.electricity ? inr(r.electricity) : '—'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2 text-sm text-green-600"><Users size={14} /> Salaries</span>
                  <span className="font-semibold">{r.salary ? inr(r.salary) : '—'}</span>
                </div>
                {r.electricity && r.salary && (
                  <div className="flex justify-between items-center border-t pt-2">
                    <span className="text-sm font-medium text-gray-600">Total</span>
                    <span className="font-bold text-gray-800">{inr(r.electricity + r.salary)}</span>
                  </div>
                )}
              </Card>
            ))}
          </div>

          <Card>
            <h3 className="font-semibold text-gray-800 mb-4">Year-on-Year Comparison</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={combined} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="fy" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={v => `₹${(v / 100000).toFixed(0)}L`} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: any) => inr(v)} />
                <Legend />
                <Bar dataKey="electricity" name="Electricity" fill="#3b82f6" />
                <Bar dataKey="salary" name="Salaries" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </>
      )}

      {tab === 'electricity' && <ElectricityCostPage />}
      {tab === 'salary' && <SalaryCostPage />}
    </div>
  )
}
