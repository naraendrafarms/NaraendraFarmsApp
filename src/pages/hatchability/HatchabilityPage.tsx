import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { pct, fmtDate } from '@/lib/utils'
import { Card, Table, Th, Td, Badge, SectionHeader, Spinner, StatCard, Select } from '@/components/ui'
import { Egg, TrendingUp } from 'lucide-react'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'

export const HatchabilityPage: React.FC = () => {
  const [flockFilter, setFlockFilter] = useState('')

  const { data: flocks } = useQuery({
    queryKey: ['flocks_all'],
    queryFn: async () => {
      const { data } = await supabase.from('flocks').select('id,flock_no').order('flock_no')
      return data ?? []
    }
  })

  const { data: hatch, isLoading } = useQuery({
    queryKey: ['hatchability', flockFilter],
    queryFn: async () => {
      let q = supabase.from('hatchability')
        .select('*, flocks(flock_no)')
        .order('setting_date', { ascending: false })
        .limit(1000)
      if (flockFilter) q = q.eq('flock_id', flockFilter)
      const { data } = await q
      return data ?? []
    }
  })

  const flockOptions = (flocks ?? []).map((f: any) => ({ value: f.id, label: `Flock ${f.flock_no}` }))
  const totalEggs   = (hatch ?? []).reduce((s: number, h: any) => s + (h.eggs_set ?? 0), 0)
  const totalChicks = (hatch ?? []).reduce((s: number, h: any) => s + (h.chicks_hatched ?? 0), 0)
  const avgHatch    = (hatch?.length ?? 0) > 0
    ? (hatch ?? []).reduce((s: number, h: any) => s + (h.hatch_pct ?? 0), 0) / hatch!.length
    : 0
  const totalBroken = (hatch ?? []).reduce((s: number, h: any) => s + (h.broken ?? 0), 0)

  // Monthly chart
  const byMonth: Record<string, { total: number; count: number }> = {}
  ;(hatch ?? []).forEach((h: any) => {
    if (!h.setting_date) return
    const mo = h.setting_date.slice(0, 7)
    if (!byMonth[mo]) byMonth[mo] = { total: 0, count: 0 }
    byMonth[mo].total += h.hatch_pct ?? 0
    byMonth[mo].count += 1
  })
  const chartData = Object.entries(byMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, v]) => ({
      month,
      hatch_pct: Math.round((v.total / v.count) * 100 * 10) / 10
    }))

  // By hatchery
  const byHatchery: Record<string, { eggs: number; chicks: number; count: number; pctSum: number }> = {}
  ;(hatch ?? []).forEach((h: any) => {
    const n = h.hatchery || 'Unknown'
    if (!byHatchery[n]) byHatchery[n] = { eggs: 0, chicks: 0, count: 0, pctSum: 0 }
    byHatchery[n].eggs   += h.eggs_set ?? 0
    byHatchery[n].chicks += h.chicks_hatched ?? 0
    byHatchery[n].count  += 1
    byHatchery[n].pctSum += h.hatch_pct ?? 0
  })

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Hatchability Report"
        subtitle={`${hatch?.length ?? 0} setting records across all flocks`}
      />

      <div className="flex gap-3">
        <Select label="" placeholder="All Flocks" options={flockOptions}
          value={flockFilter} onChange={e => setFlockFilter(e.target.value)} className="w-44" />
        {flockFilter && (
          <button onClick={() => setFlockFilter('')}
            className="text-sm text-gray-500 hover:text-gray-700 self-center">
            Clear
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Eggs Set"  value={(totalEggs / 100000).toFixed(2) + 'L'} icon={<Egg size={18}/>} color="text-brand-600" />
        <StatCard title="Total Chicks"    value={(totalChicks / 1000).toFixed(1) + 'K'} icon={<Egg size={18}/>} color="text-green-600" />
        <StatCard title="Avg Hatch %"     value={pct(avgHatch)}                          icon={<TrendingUp size={18}/>} color="text-blue-600" />
        <StatCard title="Total Broken"    value={totalBroken.toLocaleString('en-IN')}    icon={<Egg size={18}/>} color="text-orange-500" />
      </div>

      {chartData.length > 0 && (
        <Card>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Monthly Avg Hatch % Trend</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} unit="%" />
              <Tooltip formatter={(v: number) => `${v}%`} />
              <Line type="monotone" dataKey="hatch_pct" stroke="#3b82f6"
                name="Hatch %" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      {Object.keys(byHatchery).length > 0 && (
        <Card>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">By Hatchery</h3>
          <Table>
            <thead><tr>
              <Th>Hatchery</Th><Th right>Settings</Th>
              <Th right>Eggs Set</Th><Th right>Chicks</Th><Th right>Avg Hatch %</Th>
            </tr></thead>
            <tbody>
              {Object.entries(byHatchery)
                .sort(([, a], [, b]) => b.eggs - a.eggs)
                .map(([name, v]) => (
                  <tr key={name} className="hover:bg-gray-50">
                    <Td className="font-medium">{name}</Td>
                    <Td right>{v.count}</Td>
                    <Td right>{v.eggs.toLocaleString('en-IN')}</Td>
                    <Td right>{v.chicks.toLocaleString('en-IN')}</Td>
                    <Td right>
                      <span className={(v.pctSum / v.count) > 0.75 ? 'text-green-600 font-bold' : 'text-orange-500 font-bold'}>
                        {pct(v.pctSum / v.count)}
                      </span>
                    </Td>
                  </tr>
                ))}
            </tbody>
          </Table>
        </Card>
      )}

      {isLoading ? <Spinner /> : (
        <Card padding={false}>
          <Table>
            <thead><tr>
              <Th>Flock</Th><Th>Setting Date</Th><Th>Hatch Date</Th>
              <Th>Hatchery</Th><Th>Setting No</Th>
              <Th right>Age</Th><Th right>Eggs Set</Th>
              <Th right>Broken</Th><Th right>Infertile</Th>
              <Th right>Chicks</Th><Th right>Hatch %</Th>
            </tr></thead>
            <tbody>
              {(hatch ?? []).map((h: any, i: number) => (
                <tr key={h.id ?? i} className="hover:bg-gray-50">
                  <Td><Badge color="green">F-{h.flocks?.flock_no}</Badge></Td>
                  <Td className="text-xs">{fmtDate(h.setting_date)}</Td>
                  <Td className="text-xs text-gray-400">{fmtDate(h.hatch_date)}</Td>
                  <Td className="text-xs">{h.hatchery || '—'}</Td>
                  <Td className="text-xs text-gray-400">{h.setting_no || '—'}</Td>
                  <Td right className="text-xs">{h.age_weeks ?? '—'}</Td>
                  <Td right className="font-medium">{h.eggs_set?.toLocaleString('en-IN')}</Td>
                  <Td right className="text-xs text-orange-500">{(h.broken ?? 0) > 0 ? h.broken : '—'}</Td>
                  <Td right className="text-xs text-orange-400">{(h.infertile ?? 0) > 0 ? h.infertile : '—'}</Td>
                  <Td right className="font-medium text-green-700">{h.chicks_hatched?.toLocaleString('en-IN')}</Td>
                  <Td right>
                    <span className={`font-bold text-sm ${(h.hatch_pct ?? 0) > 0.75 ? 'text-green-600' : 'text-orange-500'}`}>
                      {pct(h.hatch_pct)}
                    </span>
                  </Td>
                </tr>
              ))}
            </tbody>
            {(hatch?.length ?? 0) > 0 && (
              <tfoot><tr className="bg-gray-50 font-bold">
                <Td colSpan={6}>TOTAL ({hatch!.length} settings)</Td>
                <Td right>{totalEggs.toLocaleString('en-IN')}</Td>
                <Td right className="text-orange-500">{totalBroken.toLocaleString('en-IN')}</Td>
                <Td right>—</Td>
                <Td right className="text-green-700">{totalChicks.toLocaleString('en-IN')}</Td>
                <Td right className="text-blue-600 font-bold">{pct(avgHatch)}</Td>
              </tr></tfoot>
            )}
          </Table>
          {(hatch?.length ?? 0) === 0 && (
            <div className="py-12 text-center text-gray-400">
              No hatchability records found
            </div>
          )}
        </Card>
      )}
    </div>
  )
}
