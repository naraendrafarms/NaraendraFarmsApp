import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { inr, fmtDate, currentFY, fyRange, FY_OPTIONS } from '@/lib/utils'
import { useFeedRates } from '@/hooks/useFeedRates'
import {
  Card, Button, Select, SectionHeader, Spinner, Table, Th, Td, Badge, Input
} from '@/components/ui'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts'
import { Download } from 'lucide-react'
import * as XLSX from 'xlsx'

// ── PRODUCTION REPORT ────────────────────────────────────────────
export const ProductionReport: React.FC = () => {
  const [flockId, setFlockId] = useState('')

  const { data: flocks } = useQuery({ queryKey:['flocks_all'], queryFn:async()=>{const{data}=await supabase.from('flocks').select('id,flock_no').order('flock_no');return data??[]} })

  const { data: records, isLoading } = useQuery({
    queryKey: ['prod_report', flockId],
    enabled: !!flockId,
    queryFn: async () => {
      const { data } = await supabase.from('daily_records')
        .select('record_date,total_eggs,he_eggs,mortality_female,mortality_male,opening_female,opening_male,feed_female_kg,feed_male_kg')
        .eq('flock_id', flockId)
        .order('record_date')
      return data ?? []
    }
  })

  const monthly = React.useMemo(() => {
    if (!records) return []
    const map: Record<string, any> = {}
    for (const r of records) {
      const m = r.record_date.slice(0, 7)
      if (!map[m]) map[m] = { month: m, days: 0, total_eggs: 0, he_eggs: 0, mort_f: 0, mort_m: 0, feed_f: 0, feed_m: 0, avg_open_f: 0, open_f_sum: 0 }
      map[m].days++
      map[m].total_eggs += r.total_eggs ?? 0
      map[m].he_eggs += r.he_eggs ?? 0
      map[m].mort_f += r.mortality_female ?? 0
      map[m].mort_m += r.mortality_male ?? 0
      map[m].feed_f += r.feed_female_kg ?? 0
      map[m].feed_m += r.feed_male_kg ?? 0
      map[m].open_f_sum += r.opening_female ?? 0
    }
    return Object.values(map).map((m: any) => ({
      ...m,
      month_label: new Date(m.month + '-01').toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }),
      avg_open_f: Math.round(m.open_f_sum / m.days),
      he_pct: m.total_eggs > 0 ? ((m.he_eggs / m.total_eggs) * 100).toFixed(1) : '0',
      hd_pct: m.days > 0 && m.open_f_sum > 0 ? ((m.total_eggs / m.open_f_sum) * 100).toFixed(1) : '0',
    }))
  }, [records])

  const flockOptions = flocks?.map((f: any) => ({ value: f.id, label: `Flock ${f.flock_no}` })) ?? []

  const exportExcel = () => {
    if (!monthly.length) return
    const ws = XLSX.utils.json_to_sheet(monthly.map((m: any) => ({
      'Month': m.month, 'Days': m.days, 'Total Eggs': m.total_eggs, 'HE Eggs': m.he_eggs,
      'HE%': m.he_pct, 'HD%': m.hd_pct, 'Mort ♀': m.mort_f, 'Mort ♂': m.mort_m,
      'Feed ♀ (kg)': Math.round(m.feed_f), 'Feed ♂ (kg)': Math.round(m.feed_m), 'Avg Open ♀': m.avg_open_f
    })))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Production')
    XLSX.writeFile(wb, `Production_Report_Flock${flocks?.find((f:any)=>f.id===flockId)?.flock_no}.xlsx`)
  }

  return (
    <div className="space-y-5">
      <SectionHeader title="Production Report" subtitle="Monthly egg production & mortality by flock"
        action={monthly.length > 0 ? <Button variant="secondary" icon={<Download size={16}/>} onClick={exportExcel}>Export Excel</Button> : undefined}/>
      <div className="flex gap-3">
        <Select label="" placeholder="— Select Flock —" options={flockOptions} value={flockId} onChange={e=>setFlockId(e.target.value)} className="w-48"/>
      </div>
      {!flockId && <Card><p className="text-gray-400 text-sm text-center py-8">Select a flock to view production report</p></Card>}
      {isLoading && <Spinner/>}
      {monthly.length > 0 && (
        <>
          <Card>
            <h3 className="font-semibold text-gray-800 mb-4">Monthly Egg Production</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                <XAxis dataKey="month_label" tick={{ fontSize: 12 }}/>
                <YAxis tick={{ fontSize: 12 }}/>
                <Tooltip formatter={(v: any) => v.toLocaleString('en-IN')}/>
                <Legend/>
                <Bar dataKey="total_eggs" name="Total Eggs" fill="#10b981" radius={[3,3,0,0]}/>
                <Bar dataKey="he_eggs" name="HE Eggs" fill="#3b82f6" radius={[3,3,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </Card>
          <Card>
            <h3 className="font-semibold text-gray-800 mb-4">HD% & HE% Trend</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                <XAxis dataKey="month_label" tick={{ fontSize: 12 }}/>
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }}/>
                <Tooltip/>
                <Legend/>
                <Line type="monotone" dataKey="hd_pct" name="HD%" stroke="#10b981" dot={false} strokeWidth={2}/>
                <Line type="monotone" dataKey="he_pct" name="HE%" stroke="#3b82f6" dot={false} strokeWidth={2}/>
              </LineChart>
            </ResponsiveContainer>
          </Card>
          <Card padding={false}>
            <Table>
              <thead><tr>
                <Th>Month</Th><Th right>Days</Th><Th right>Total Eggs</Th><Th right>HE Eggs</Th>
                <Th right>HE%</Th><Th right>HD%</Th><Th right>Avg Open ♀</Th>
                <Th right>Mort ♀</Th><Th right>Mort ♂</Th><Th right>Feed ♀ (kg)</Th>
              </tr></thead>
              <tbody>
                {monthly.map((m: any) => (
                  <tr key={m.month} className="hover:bg-gray-50">
                    <Td className="font-medium">{m.month_label}</Td>
                    <Td right>{m.days}</Td>
                    <Td right>{m.total_eggs.toLocaleString('en-IN')}</Td>
                    <Td right>{m.he_eggs.toLocaleString('en-IN')}</Td>
                    <Td right><Badge color={parseFloat(m.he_pct)>90?'green':parseFloat(m.he_pct)>80?'yellow':'red'}>{m.he_pct}%</Badge></Td>
                    <Td right>{m.hd_pct}%</Td>
                    <Td right>{m.avg_open_f.toLocaleString('en-IN')}</Td>
                    <Td right className="text-red-600">{m.mort_f}</Td>
                    <Td right className="text-red-600">{m.mort_m}</Td>
                    <Td right>{Math.round(m.feed_f).toLocaleString('en-IN')}</Td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50 font-semibold">
                  <Td>TOTAL</Td>
                  <Td right>{monthly.reduce((s:number,m:any)=>s+m.days,0)}</Td>
                  <Td right>{monthly.reduce((s:number,m:any)=>s+m.total_eggs,0).toLocaleString('en-IN')}</Td>
                  <Td right>{monthly.reduce((s:number,m:any)=>s+m.he_eggs,0).toLocaleString('en-IN')}</Td>
                  <Td right colSpan={6}></Td>
                </tr>
              </tfoot>
            </Table>
          </Card>
        </>
      )}
    </div>
  )
}

// ── FLOCK P&L REPORT ─────────────────────────────────────────────
export const PLReport: React.FC = () => {
  const [flockId, setFlockId] = useState('')

  const { data: flocks } = useQuery({ queryKey:['flocks_all'], queryFn:async()=>{const{data}=await supabase.from('flocks').select('id,flock_no,chick_cost,placement_date,close_date,status,laying_farm_id,rearing_farm_id').order('flock_no');return data??[]} })

  const enabled = !!flockId
  const flock = flocks?.find((f: any) => f.id === flockId)
  const farmId = flock?.laying_farm_id ?? flock?.rearing_farm_id

  // ── REVENUE ──────────────────────────────────────────────────────
  const { data: heRevenue } = useQuery({
    queryKey: ['pl_he', flockId], enabled,
    queryFn: async () => { const { data } = await supabase.from('he_dispatch').select('amount,total_dispatched,free_eggs').eq('flock_id', flockId); return data ?? [] }
  })
  const { data: nheRevenue } = useQuery({
    queryKey: ['pl_nhe', flockId], enabled,
    queryFn: async () => { const { data } = await supabase.from('nhe_sales').select('amount,sale_type').eq('flock_id', flockId); return data ?? [] }
  })
  const { data: hatchRevenue } = useQuery({
    queryKey: ['pl_hatch', flockId], enabled,
    queryFn: async () => { const { data } = await supabase.from('hatch_batches').select('chicks_sold,chick_rate,chick_amount').eq('flock_id', flockId); return data ?? [] }
  })

  // ── COSTS ─────────────────────────────────────────────────────────
  const { data: medicineUsage } = useQuery({
    queryKey: ['pl_med_usage', flockId], enabled,
    queryFn: async () => { const { data } = await supabase.from('medicine_usage').select('quantity,rate,amount').eq('flock_id', flockId); return data ?? [] }
  })
  // Feed: read from daily_records (authoritative) and costed with recipe rates.
  const feedRates = useFeedRates()
  const { data: dailyFeed } = useQuery({
    queryKey: ['pl_feed_records', flockId], enabled,
    queryFn: async () => { const { data } = await supabase.from('daily_records').select('feed_female_kg,feed_type_f,feed_male_kg,feed_type_m').eq('flock_id', flockId); return data ?? [] }
  })
  // Electricity: bills for flock's farm — electricity_bills has no farm_id
  // column of its own (farm comes via the meter), so the previous query
  // errored on every call and the cost silently read as ₹0 in every Flock
  // P&L, overstating profit whenever electricity bills existed.
  const { data: elecBills } = useQuery({
    queryKey: ['pl_elec', farmId], enabled: !!farmId,
    queryFn: async () => {
      const { data } = await supabase.from('electricity_bills')
        .select('amount, electricity_meters!inner(farm_id)')
        .eq('electricity_meters.farm_id', farmId)
      return data ?? []
    }
  })
  // Salary: abstracts for flock's farm
  const { data: salaryAbstracts } = useQuery({
    queryKey: ['pl_salary', farmId], enabled: !!farmId,
    queryFn: async () => { const { data } = await supabase.from('salary_abstract').select('net_salary').eq('farm_id', farmId); return data ?? [] }
  })
  // Farm expenses: linked to this flock or its farm
  const { data: farmExpenses } = useQuery({
    queryKey: ['pl_farm_exp', flockId, farmId], enabled,
    queryFn: async () => {
      const { data } = await supabase.from('farm_expenses').select('amount,category')
        .or(`flock_id.eq.${flockId}${farmId ? `,farm_id.eq.${farmId}` : ''}`)
      return data ?? []
    }
  })

  // ── COMPUTATIONS ─────────────────────────────────────────────────
  const totalHERev      = (heRevenue ?? []).reduce((s: number, r: any) => s + (r.amount ?? 0), 0)
  const totalNHERev     = (nheRevenue ?? []).reduce((s: number, r: any) => s + (r.amount ?? 0), 0)
  const totalChickRev   = (hatchRevenue ?? []).reduce((s: number, r: any) => s + (r.chick_amount ?? (r.chicks_sold ?? 0) * (r.chick_rate ?? 0)), 0)
  const totalRevenue    = totalHERev + totalNHERev + totalChickRev

  const chickCost = flock?.chick_cost ?? 0
  const medCost   = (medicineUsage ?? []).reduce((s: number, r: any) => s + (r.amount ?? ((r.quantity ?? 0) * (r.rate ?? 0))), 0)

  const feedCost = (dailyFeed ?? []).reduce((s: number, r: any) =>
    s + (r.feed_female_kg ?? 0) * feedRates.rate(r.feed_type_f)
      + (r.feed_male_kg ?? 0)   * feedRates.rate(r.feed_type_m), 0)

  const elecCost   = (elecBills ?? []).reduce((s: number, r: any) => s + (r.amount ?? 0), 0)
  const salaryCost = (salaryAbstracts ?? []).reduce((s: number, r: any) => s + (r.net_salary ?? 0), 0)

  const expByCategory: Record<string, number> = {}
  ;(farmExpenses ?? []).forEach((e: any) => { expByCategory[e.category] = (expByCategory[e.category] ?? 0) + (e.amount ?? 0) })
  const totalFarmExp = Object.values(expByCategory).reduce((s, v) => s + v, 0)

  const totalCost   = chickCost + medCost + feedCost + elecCost + salaryCost + totalFarmExp
  const netProfit   = totalRevenue - totalCost
  const totalHEEggs = (heRevenue ?? []).reduce((s: number, r: any) => s + (r.total_dispatched ?? 0), 0)

  const nheByType = (nheRevenue ?? []).reduce((acc: any, r: any) => { acc[r.sale_type] = (acc[r.sale_type] ?? 0) + (r.amount ?? 0); return acc }, {})
  const flockOptions = (flocks ?? []).map((f: any) => ({ value: f.id, label: `Flock ${f.flock_no} (${f.status})` }))

  const CostRow: React.FC<{ label: string; value: number; sub?: string }> = ({ label, value, sub }) => (
    <div className="flex justify-between text-sm">
      <span className={value === 0 ? 'text-gray-400' : ''}>{label}{sub && <span className="text-xs text-gray-400 ml-1">{sub}</span>}</span>
      <span className={value === 0 ? 'text-gray-300' : 'font-semibold text-red-600'}>{value > 0 ? inr(value) : '—'}</span>
    </div>
  )

  return (
    <div className="space-y-5">
      <SectionHeader title="Flock P&L Report" subtitle="Complete revenue vs cost — all cost centres included"/>
      <div className="flex gap-3">
        <Select label="" placeholder="— Select Flock —" options={flockOptions} value={flockId} onChange={e=>setFlockId(e.target.value)} className="w-56"/>
      </div>
      {!flockId && <Card><p className="text-gray-400 text-sm text-center py-8">Select a flock to view P&L</p></Card>}
      {flockId && flock && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* REVENUE */}
            <Card>
              <h3 className="font-semibold text-green-700 mb-4 flex items-center gap-2">Revenue</h3>
              <div className="space-y-2.5">
                <div className="flex justify-between text-sm"><span>HE Dispatch <span className="text-xs text-gray-400">({totalHEEggs.toLocaleString('en-IN')} eggs)</span></span><span className="font-semibold text-green-700">{inr(totalHERev)}</span></div>
                {Object.entries(nheByType).map(([type, amt]: any) => (
                  <div key={type} className="flex justify-between text-sm text-gray-600 pl-2">
                    <span className="capitalize">{type.replace(/_/g,' ')}</span>
                    <span>{inr(amt)}</span>
                  </div>
                ))}
                {totalChickRev > 0 && <div className="flex justify-between text-sm"><span>Chick Sales (Hatchery)</span><span className="font-semibold text-green-700">{inr(totalChickRev)}</span></div>}
                <div className="border-t pt-2 flex justify-between font-bold text-green-700">
                  <span>Total Revenue</span><span>{inr(totalRevenue)}</span>
                </div>
              </div>
            </Card>

            {/* COSTS */}
            <Card>
              <h3 className="font-semibold text-red-700 mb-4">Costs</h3>
              <div className="space-y-2.5">
                <CostRow label="Chick Cost" value={chickCost} />
                <CostRow label="Feed Cost" value={feedCost} sub={feedCost === 0 ? '(no feed records)' : ''} />
                <CostRow label="Medicine / Vaccine" value={medCost} />
                <CostRow label="Electricity" value={elecCost} sub={elecCost === 0 ? '(farm-level)' : '(farm-level)'} />
                <CostRow label="Salary" value={salaryCost} sub="(farm-level)" />
                {Object.entries(expByCategory).map(([cat, amt]: any) => (
                  <CostRow key={cat} label={cat.charAt(0).toUpperCase()+cat.slice(1)} value={amt} />
                ))}
                {totalFarmExp === 0 && <div className="flex justify-between text-sm text-gray-400"><span>Maintenance / Other Expenses</span><span>— <span className="text-xs">(enter in Farm Expenses)</span></span></div>}
                <div className="border-t pt-2 flex justify-between font-bold text-red-700">
                  <span>Total Cost</span><span>{inr(totalCost)}</span>
                </div>
              </div>
            </Card>
          </div>

          {/* NET P&L */}
          <Card>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm text-gray-500">Net Profit / Loss — Flock {flock.flock_no}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {flock.placement_date ? `Placed: ${fmtDate(flock.placement_date)}` : ''}
                  {flock.close_date ? ` · Closed: ${fmtDate(flock.close_date)}` : ' · Active'}
                  {elecCost > 0 || salaryCost > 0 ? ' · Note: electricity & salary shown at farm level, not per-flock allocated' : ''}
                </p>
              </div>
              <div className={`text-3xl font-bold ${netProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                {inr(netProfit)}
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-4 text-sm border-t pt-4">
              <div><p className="text-gray-500 text-xs">Total Revenue</p><p className="font-semibold text-green-700">{inr(totalRevenue)}</p></div>
              <div><p className="text-gray-500 text-xs">Total Cost</p><p className="font-semibold text-red-600">{inr(totalCost)}</p></div>
              <div><p className="text-gray-500 text-xs">Margin</p><p className={`font-semibold ${netProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>{totalRevenue > 0 ? (netProfit/totalRevenue*100).toFixed(1)+'%' : '—'}</p></div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

// ── SALARY REPORT ────────────────────────────────────────────────
export const SalaryReport: React.FC = () => {
  const [filterYear, setFilterYear] = useState(currentFY())

  const { data: abstracts, isLoading } = useQuery({
    queryKey: ['salary_report', filterYear],
    queryFn: async () => {
      const { start, end } = fyRange(filterYear)
      const { data } = await supabase.from('salary_abstract')
        .select('*, farms(name,code)')
        .gte('month', start)
        .lte('month', end)
        .order('month')
      return data ?? []
    }
  })

  const monthly = React.useMemo(() => {
    if (!abstracts) return []
    const map: Record<string, any> = {}
    for (const r of abstracts) {
      const m = r.month.slice(0, 7)
      if (!map[m]) map[m] = { month: m, month_label: new Date(m + '-01').toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }), total: 0, net: 0, count: 0 }
      map[m].total += r.total_salary ?? 0
      map[m].net += r.net_salary ?? 0
      map[m].count += r.employee_count ?? 0
    }
    return Object.values(map)
  }, [abstracts])

  const exportExcel = () => {
    if (!abstracts?.length) return
    const ws = XLSX.utils.json_to_sheet(abstracts.map((a: any) => ({
      'Farm': a.farms?.name, 'Month': a.month,
      'Earned Salary': a.total_salary, 'Advance': a.total_advance,
      'Net Salary': a.net_salary, 'Employees': a.employee_count
    })))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Salary')
    XLSX.writeFile(wb, `Salary_Report_${filterYear}.xlsx`)
  }

  return (
    <div className="space-y-5">
      <SectionHeader title="Salary Report" subtitle="Site-wise monthly salary summary"
        action={<Button variant="secondary" icon={<Download size={16}/>} onClick={exportExcel}>Export Excel</Button>}/>
      <div className="flex gap-3">
        <Select label="" options={FY_OPTIONS} value={filterYear} onChange={e=>setFilterYear(e.target.value)} className="w-32"/>
      </div>
      {isLoading ? <Spinner/> : (
        <>
          {monthly.length > 0 && (
            <Card>
              <h3 className="font-semibold text-gray-800 mb-4">Monthly Salary Trend</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={monthly}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                  <XAxis dataKey="month_label" tick={{ fontSize: 12 }}/>
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v/100000).toFixed(0)}L`}/>
                  <Tooltip formatter={(v: any) => inr(v)}/>
                  <Legend/>
                  <Bar dataKey="total" name="Earned" fill="#3b82f6" radius={[3,3,0,0]}/>
                  <Bar dataKey="net" name="Net Paid" fill="#10b981" radius={[3,3,0,0]}/>
                </BarChart>
              </ResponsiveContainer>
            </Card>
          )}
          <Card padding={false}>
            <Table>
              <thead><tr>
                <Th>Farm</Th><Th>Month</Th><Th right>Earned</Th><Th right>Advance</Th><Th right>Net</Th><Th right>Employees</Th>
              </tr></thead>
              <tbody>
                {abstracts?.map((a: any) => (
                  <tr key={a.id} className="hover:bg-gray-50">
                    <Td><span className="font-medium">{a.farms?.name}</span></Td>
                    <Td>{new Date(a.month).toLocaleDateString('en-IN',{month:'short',year:'numeric'})}</Td>
                    <Td right>{inr(a.total_salary)}</Td>
                    <Td right className="text-orange-600">{a.total_advance>0?inr(a.total_advance):'—'}</Td>
                    <Td right className="font-semibold text-green-700">{inr(a.net_salary)}</Td>
                    <Td right>{a.employee_count??'—'}</Td>
                  </tr>
                ))}
              </tbody>
              {abstracts && abstracts.length > 0 && (
                <tfoot>
                  <tr className="bg-gray-50 font-semibold">
                    <Td colSpan={2}>TOTAL {filterYear}</Td>
                    <Td right>{inr(abstracts.reduce((s: number, a: any) => s + (a.total_salary ?? 0), 0))}</Td>
                    <Td right>{inr(abstracts.reduce((s: number, a: any) => s + (a.total_advance ?? 0), 0))}</Td>
                    <Td right>{inr(abstracts.reduce((s: number, a: any) => s + (a.net_salary ?? 0), 0))}</Td>
                    <Td right>{abstracts.reduce((s: number, a: any) => s + (a.employee_count ?? 0), 0)}</Td>
                  </tr>
                </tfoot>
              )}
            </Table>
            {!abstracts?.length && <p className="text-center text-gray-400 text-sm py-8">No salary data for {filterYear}</p>}
          </Card>
        </>
      )}
    </div>
  )
}

// ── FEED COST REPORT ─────────────────────────────────────────────
export const FeedReport: React.FC = () => {
  const [filterMonth, setFilterMonth] = useState('')

  const { data: grns, isLoading } = useQuery({
    queryKey: ['feed_report', filterMonth],
    queryFn: async () => {
      let q = supabase.from('grn').select('*, feed_ingredients(name,short_name,category), farms(name,code), parties(name)').order('grn_date', { ascending: false })
      if (filterMonth) q = q.gte('grn_date', filterMonth + '-01').lte('grn_date', filterMonth + '-31')
      const { data } = await q.limit(200)
      return data ?? []
    }
  })

  const { data: production } = useQuery({
    queryKey: ['feed_prod_report', filterMonth],
    queryFn: async () => {
      let q = supabase.from('feed_production').select('*, feed_types(code,name)').order('production_date', { ascending: false })
      if (filterMonth) q = q.gte('production_date', filterMonth + '-01').lte('production_date', filterMonth + '-31')
      const { data } = await q.limit(100)
      return data ?? []
    }
  })

  const totalPurchase = grns?.reduce((s: number, r: any) => s + (r.total_amount ?? 0), 0) ?? 0
  const totalProduction = production?.reduce((s: number, r: any) => s + (r.quantity_kg ?? 0), 0) ?? 0

  const byIngredient = grns?.reduce((acc: any, r: any) => {
    const k = r.feed_ingredients?.short_name ?? r.item_name ?? 'Unknown'
    if (!acc[k]) acc[k] = { name: k, qty: 0, amount: 0 }
    acc[k].qty += r.qty ?? 0
    acc[k].amount += r.total_amount ?? 0
    return acc
  }, {})

  const exportExcel = () => {
    if (!grns?.length) return
    const ws = XLSX.utils.json_to_sheet(grns.map((g: any) => ({
      'Date': g.grn_date, 'GRN No': g.grn_no, 'Farm': g.farms?.code,
      'Supplier': g.parties?.name, 'Ingredient': g.feed_ingredients?.name ?? g.item_name,
      'Qty (kg)': g.qty, 'Price/kg': g.price_per_unit, 'Amount': g.total_amount
    })))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'GRN')
    XLSX.writeFile(wb, `Feed_GRN_Report.xlsx`)
  }

  return (
    <div className="space-y-5">
      <SectionHeader title="Feed Cost Report" subtitle="GRN purchases and production summary"
        action={<Button variant="secondary" icon={<Download size={16}/>} onClick={exportExcel}>Export Excel</Button>}/>
      <div className="flex gap-3">
        <Input label="" type="month" value={filterMonth} onChange={e=>setFilterMonth(e.target.value)} className="w-48"/>
        {filterMonth && <Button variant="ghost" size="sm" onClick={()=>setFilterMonth('')}>Clear</Button>}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><p className="text-xs text-gray-400 mb-1">Total Purchase Value</p><p className="text-xl font-bold text-blue-700">{inr(totalPurchase)}</p></Card>
        <Card><p className="text-xs text-gray-400 mb-1">Total Production</p><p className="text-xl font-bold text-green-700">{totalProduction.toLocaleString('en-IN')} kg</p></Card>
        <Card><p className="text-xs text-gray-400 mb-1">GRN Entries</p><p className="text-xl font-bold text-gray-700">{grns?.length ?? 0}</p></Card>
      </div>
      {byIngredient && Object.keys(byIngredient).length > 0 && (
        <Card>
          <h3 className="font-semibold text-gray-800 mb-3">Purchase by Ingredient</h3>
          <Table>
            <thead><tr><Th>Ingredient</Th><Th right>Qty (kg)</Th><Th right>Amount</Th><Th right>Avg Rate</Th></tr></thead>
            <tbody>
              {Object.values(byIngredient).sort((a:any,b:any)=>b.amount-a.amount).map((r: any) => (
                <tr key={r.name} className="hover:bg-gray-50">
                  <Td className="font-medium">{r.name}</Td>
                  <Td right>{Math.round(r.qty).toLocaleString('en-IN')}</Td>
                  <Td right>{inr(r.amount)}</Td>
                  <Td right>{r.qty > 0 ? `Rs ${(r.amount/r.qty).toFixed(2)}` : '—'}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}
      {isLoading ? <Spinner/> : (
        <Card padding={false}>
          <div className="px-4 py-3 border-b border-gray-100"><h3 className="font-semibold text-gray-800">GRN Register</h3></div>
          <Table>
            <thead><tr>
              <Th>Date</Th><Th>GRN No</Th><Th>Farm</Th><Th>Supplier</Th><Th>Ingredient</Th>
              <Th right>Qty (kg)</Th><Th right>Rate</Th><Th right>Amount</Th>
            </tr></thead>
            <tbody>
              {grns?.map((g: any) => (
                <tr key={g.id} className="hover:bg-gray-50">
                  <Td>{g.grn_date}</Td>
                  <Td className="font-mono text-xs">{g.grn_no}</Td>
                  <Td><span className="text-xs font-mono text-brand-700">{g.farms?.code}</span></Td>
                  <Td className="text-xs">{g.parties?.name??'—'}</Td>
                  <Td>{g.feed_ingredients?.name??g.item_name??'—'}</Td>
                  <Td right>{g.qty?.toLocaleString('en-IN')}</Td>
                  <Td right className="text-xs">{g.price_per_unit?`Rs ${g.price_per_unit}`:'—'}</Td>
                  <Td right className="font-medium">{g.total_amount?inr(g.total_amount):'—'}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
          {!grns?.length && <p className="text-center text-gray-400 text-sm py-8">No GRN records{filterMonth ? ` for ${filterMonth}` : ''}</p>}
        </Card>
      )}
    </div>
  )
}

// ── EXPORT PAGE ──────────────────────────────────────────────────
export const ExportPage: React.FC = () => {
  const [exporting, setExporting] = useState<string | null>(null)

  const exportTable = async (table: string, label: string, query?: any) => {
    setExporting(table)
    try {
      const q = query ?? supabase.from(table).select('*').limit(10000)
      const { data, error } = await q
      if (error) throw error
      const ws = XLSX.utils.json_to_sheet(data ?? [])
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, label)
      XLSX.writeFile(wb, `${label}_Export_${new Date().toISOString().slice(0,10)}.xlsx`)
    } catch (e: any) {
      alert(e.message)
    } finally {
      setExporting(null)
    }
  }

  const exports = [
    { key: 'daily_records', label: 'Daily Records', desc: 'All flock daily production records' },
    { key: 'he_dispatch', label: 'HE Dispatch', desc: 'Hatching egg dispatch records' },
    { key: 'nhe_sales', label: 'NHE Sales', desc: 'Non-HE egg and bird sales' },
    { key: 'grn', label: 'GRN Register', desc: 'Feed ingredient purchases' },
    { key: 'feed_production', label: 'Feed Production', desc: 'Feed mill batch records' },
    { key: 'feed_transfers', label: 'Feed Transfers', desc: 'Mill to farm feed transfers' },
    { key: 'electricity_bills', label: 'Electricity Bills', desc: 'All meter bills' },
    { key: 'salary_abstract', label: 'Salary Abstract', desc: 'Monthly salary by site' },
    { key: 'medicine_usage', label: 'Medicine Usage', desc: 'Daily medicine logs' },
    { key: 'flocks', label: 'Flocks', desc: 'Flock master data' },
  ]

  return (
    <div className="space-y-5">
      <SectionHeader title="Export to Excel" subtitle="Download any table as Excel spreadsheet"/>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {exports.map(e => (
          <Card key={e.key}>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-800">{e.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{e.desc}</p>
              </div>
              <Button variant="secondary" size="sm" icon={<Download size={14}/>}
                loading={exporting === e.key}
                onClick={() => exportTable(e.key, e.label)}>
                Export
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
