import React, { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { inr } from '@/lib/utils'
import { useFeedRates } from '@/hooks/useFeedRates'
import { Card, CardHeader, Button, Select, Spinner } from '@/components/ui'
import { Download } from 'lucide-react'
import * as XLSX from 'xlsx'

const BIRD_SALE_TYPES = ['bird_sale', 'bird_cull', 'bird_lame', 'culls', 'birds']

const FY_OPTIONS = [
  { value: '2024-25', label: 'FY 2024-25' },
  { value: '2025-26', label: 'FY 2025-26' },
  { value: '2026-27', label: 'FY 2026-27' },
]

function fyDates(fy: string): { start: string; end: string } {
  const [startY] = fy.split('-')
  const y = parseInt(startY)
  return { start: `${y}-04-01`, end: `${y + 1}-03-31` }
}

function currentFY(): string {
  const now = new Date()
  const m = now.getMonth() + 1
  const y = now.getFullYear()
  return m >= 4 ? `${y}-${String(y + 1).slice(2)}` : `${y - 1}-${String(y).slice(2)}`
}

export const FlockPLSummary: React.FC = () => {
  const [fy, setFy] = useState(currentFY())
  const [statusFilter, setStatusFilter] = useState('all')

  const { start, end } = fyDates(fy)

  const { data: flocks, isLoading: flocksLoading } = useQuery({
    queryKey: ['pl_summary_flocks'],
    queryFn: async () => {
      const { data } = await supabase
        .from('flocks')
        .select('id,flock_no,breed,status,placement_date,close_date,chick_cost,laying_farm_id,rearing_farm_id,farms:laying_farm_id(name)')
        .order('flock_no', { ascending: true })
      return data ?? []
    }
  })

  const { data: heDispatch } = useQuery({
    queryKey: ['pl_summary_he_dispatch'],
    queryFn: async () => {
      const { data } = await supabase.from('he_dispatch').select('flock_id,amount')
      return data ?? []
    }
  })

  const { data: nheSales } = useQuery({
    queryKey: ['pl_summary_nhe_sales'],
    queryFn: async () => {
      const { data } = await supabase.from('nhe_sales').select('flock_id,amount,sale_type')
      return data ?? []
    }
  })

  // Feed read from daily_records (authoritative) and costed with recipe rates — same as
  // the Flock Feed tab — so P&L can't drift from the daily_feed mirror.
  const feedRates = useFeedRates()
  const { data: dailyFeed } = useQuery({
    queryKey: ['pl_summary_daily_records_feed'],
    queryFn: async () => {
      const { data } = await supabase.from('daily_records')
        .select('flock_id,feed_female_kg,feed_type_f,feed_male_kg,feed_type_m,total_eggs')
      return data ?? []
    }
  })

  const { data: medicineUsage } = useQuery({
    queryKey: ['pl_summary_medicine_usage'],
    queryFn: async () => {
      const { data } = await supabase.from('medicine_usage').select('flock_id,amount')
      return data ?? []
    }
  })

  const { data: electricityAlloc } = useQuery({
    queryKey: ['pl_summary_electricity_allocation'],
    queryFn: async () => {
      const { data } = await supabase.from('electricity_allocation').select('flock_id,amount')
      return data ?? []
    }
  })

  const isLoading = flocksLoading || !heDispatch || !nheSales || !dailyFeed || !medicineUsage || !electricityAlloc

  const rows = useMemo(() => {
    if (!flocks || !heDispatch || !nheSales || !dailyFeed || !medicineUsage || !electricityAlloc) return []

    // Filter flocks by FY placement_date
    const fyFlocks = flocks.filter((f: any) => {
      const pd = f.placement_date
      if (!pd) return false
      return pd >= start && pd <= end
    })

    // Apply status filter
    const filtered = statusFilter === 'all' ? fyFlocks : fyFlocks.filter((f: any) => f.status === statusFilter)

    return filtered.map((flock: any) => {
      const fid = flock.id

      const heRev = heDispatch
        .filter((r: any) => r.flock_id === fid)
        .reduce((s: number, r: any) => s + (r.amount ?? 0), 0)

      const nheRev = nheSales
        .filter((r: any) => r.flock_id === fid)
        .reduce((s: number, r: any) => s + (r.amount ?? 0), 0)

      const revenue = heRev + nheRev

      const feedCost = dailyFeed
        .filter((r: any) => r.flock_id === fid)
        .reduce((s: number, r: any) =>
          s + (r.feed_female_kg ?? 0) * feedRates.rate(r.feed_type_f)
            + (r.feed_male_kg ?? 0)   * feedRates.rate(r.feed_type_m), 0)

      const medicineCost = medicineUsage
        .filter((r: any) => r.flock_id === fid)
        .reduce((s: number, r: any) => s + (r.amount ?? 0), 0)

      const electricityCost = electricityAlloc
        .filter((r: any) => r.flock_id === fid)
        .reduce((s: number, r: any) => s + (r.amount ?? 0), 0)

      const eggs = dailyFeed
        .filter((r: any) => r.flock_id === fid)
        .reduce((s: number, r: any) => s + (r.total_eggs ?? 0), 0)

      const chickCost = flock.chick_cost ?? 0
      const totalCost = chickCost + feedCost + medicineCost + electricityCost
      const netPL = revenue - totalCost
      const margin = totalCost > 0 ? (netPL / totalCost) * 100 : 0
      const costPerEgg = eggs > 0 ? totalCost / eggs : 0

      const farmName = (flock.farms as any)?.name ?? '—'

      return {
        id: fid,
        flock_no: flock.flock_no,
        farm: farmName,
        status: flock.status,
        placement_date: flock.placement_date,
        chickCost,
        feedCost,
        medicineCost,
        electricityCost,
        totalCost,
        eggs,
        costPerEgg,
        revenue,
        netPL,
        margin,
      }
    })
  }, [flocks, heDispatch, nheSales, dailyFeed, feedRates, medicineUsage, electricityAlloc, fy, statusFilter, start, end])

  const totals = useMemo(() => {
    return rows.reduce((acc, r) => ({
      chickCost: acc.chickCost + r.chickCost,
      feedCost: acc.feedCost + r.feedCost,
      medicineCost: acc.medicineCost + r.medicineCost,
      electricityCost: acc.electricityCost + r.electricityCost,
      totalCost: acc.totalCost + r.totalCost,
      eggs: acc.eggs + r.eggs,
      revenue: acc.revenue + r.revenue,
      netPL: acc.netPL + r.netPL,
    }), { chickCost: 0, feedCost: 0, medicineCost: 0, electricityCost: 0, totalCost: 0, eggs: 0, revenue: 0, netPL: 0 })
  }, [rows])

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(rows.map(r => ({
      'Flock No': `F-${r.flock_no}`,
      'Farm': r.farm,
      'Status': r.status,
      'Placed': r.placement_date,
      'Chick Cost': r.chickCost,
      'Feed Cost': r.feedCost,
      'Medicine Cost': r.medicineCost,
      'Electricity Cost': r.electricityCost,
      'Total Cost': r.totalCost,
      'Eggs Produced': r.eggs,
      'Cost / Egg': r.costPerEgg ? +r.costPerEgg.toFixed(2) : 0,
      'Revenue': r.revenue,
      'Net P&L': r.netPL,
      'Margin %': r.margin.toFixed(1),
    })))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Flock P&L')
    XLSX.writeFile(wb, `flock-pl-${fy}.xlsx`)
  }

  return (
    <div className="space-y-4">
      <CardHeader
        title="Flock P&L Summary"
        subtitle="Complete profit & loss across all flocks"
        action={
          <div className="flex items-center gap-3">
            <Select
              value={fy}
              onChange={e => setFy((e.target as HTMLSelectElement).value)}
              options={FY_OPTIONS}
            />
            <Select
              value={statusFilter}
              onChange={e => setStatusFilter((e.target as HTMLSelectElement).value)}
              options={[
                { value: 'all', label: 'All Status' },
                { value: 'active', label: 'Active' },
                { value: 'closed', label: 'Closed' },
              ]}
            />
            <Button icon={<Download size={16} />} variant="outline" onClick={handleExport}>
              Export
            </Button>
          </div>
        }
      />

      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner size={32} /></div>
      ) : (
        <Card padding={false}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs text-gray-500 uppercase border-b border-gray-100">
                  <th className="px-3 py-2 text-left">Flock No</th>
                  <th className="px-3 py-2 text-left">Farm</th>
                  <th className="px-3 py-2 text-left">Status</th>
                  <th className="px-3 py-2 text-left">Placed</th>
                  <th className="px-3 py-2 text-right">Chick Cost</th>
                  <th className="px-3 py-2 text-right">Feed</th>
                  <th className="px-3 py-2 text-right">Medicine</th>
                  <th className="px-3 py-2 text-right">Electricity</th>
                  <th className="px-3 py-2 text-right">Total Cost</th>
                  <th className="px-3 py-2 text-right">Eggs</th>
                  <th className="px-3 py-2 text-right">Cost / Egg</th>
                  <th className="px-3 py-2 text-right">Revenue</th>
                  <th className="px-3 py-2 text-right">Net P&amp;L</th>
                  <th className="px-3 py-2 text-right">Margin %</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={14} className="text-center py-12 text-gray-400">No flocks found for selected filters</td>
                  </tr>
                ) : (
                  rows.map((r, idx) => (
                    <tr key={r.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                      <td className="px-3 py-2 font-semibold text-brand-700">F-{r.flock_no}</td>
                      <td className="px-3 py-2 text-gray-600">{r.farm}</td>
                      <td className="px-3 py-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${r.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-gray-500">{r.placement_date}</td>
                      <td className="px-3 py-2 text-right text-gray-700">{inr(r.chickCost)}</td>
                      <td className="px-3 py-2 text-right text-gray-700">{inr(r.feedCost)}</td>
                      <td className="px-3 py-2 text-right text-gray-700">{inr(r.medicineCost)}</td>
                      <td className="px-3 py-2 text-right text-gray-700">{inr(r.electricityCost)}</td>
                      <td className="px-3 py-2 text-right font-medium text-gray-800">{inr(r.totalCost)}</td>
                      <td className="px-3 py-2 text-right text-gray-600">{r.eggs.toLocaleString('en-IN')}</td>
                      <td className="px-3 py-2 text-right font-medium text-purple-700">{r.costPerEgg ? `₹${r.costPerEgg.toFixed(2)}` : '—'}</td>
                      <td className="px-3 py-2 text-right font-medium text-blue-700">{inr(r.revenue)}</td>
                      <td className={`px-3 py-2 text-right font-semibold ${r.netPL >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                        {inr(r.netPL)}
                      </td>
                      <td className={`px-3 py-2 text-right text-xs ${r.margin >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {r.margin.toFixed(1)}%
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {rows.length > 0 && (
                <tfoot>
                  <tr className="bg-gray-100 border-t-2 border-gray-300 font-semibold text-sm">
                    <td className="px-3 py-2" colSpan={4}>Total ({rows.length} flocks)</td>
                    <td className="px-3 py-2 text-right">{inr(totals.chickCost)}</td>
                    <td className="px-3 py-2 text-right">{inr(totals.feedCost)}</td>
                    <td className="px-3 py-2 text-right">{inr(totals.medicineCost)}</td>
                    <td className="px-3 py-2 text-right">{inr(totals.electricityCost)}</td>
                    <td className="px-3 py-2 text-right">{inr(totals.totalCost)}</td>
                    <td className="px-3 py-2 text-right">{totals.eggs.toLocaleString('en-IN')}</td>
                    <td className="px-3 py-2 text-right text-purple-700">{totals.eggs > 0 ? `₹${(totals.totalCost/totals.eggs).toFixed(2)}` : '—'}</td>
                    <td className="px-3 py-2 text-right text-blue-700">{inr(totals.revenue)}</td>
                    <td className={`px-3 py-2 text-right ${totals.netPL >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                      {inr(totals.netPL)}
                    </td>
                    <td className="px-3 py-2" />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
