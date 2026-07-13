import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { inr, pct, fmtDate, statusColor } from '@/lib/utils'
import { StatCard, Card, CardHeader, Badge, Spinner, SectionHeader } from '@/components/ui'
import {
  Bird, Egg, TrendingUp, AlertTriangle, Zap, Users,
  ArrowRight, Activity, DollarSign, Package
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { MyTasksWidget } from '@/components/tasks/MyTasksWidget'

const AlertsWidget: React.FC = () => {
  const navigate = useNavigate()
  const threeDaysAgo = new Date(); threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
  const threeDaysStr = threeDaysAgo.toISOString().slice(0, 10)
  const today = new Date().toISOString().slice(0, 10)

  const { data: hdData } = useQuery({
    queryKey: ['alerts_hd'],
    queryFn: async () => {
      const { data } = await supabase
        .from('daily_records')
        .select('flock_id, he_eggs_a, he_eggs_b, he_eggs_c, nhe_je, nhe_te, nhe_be, female_alive, flocks(flock_no)')
        .gte('record_date', threeDaysStr)
      return data ?? []
    }
  })

  const { data: overdueData } = useQuery({
    queryKey: ['alerts_overdue'],
    queryFn: async () => {
      const { data } = await supabase
        .from('pending_payments')
        .select('amount')
        .lt('due_date', today)
        .neq('status', 'paid')
      return data ?? []
    }
  })

  // Feed ingredient items + unified stock_ledger (same source as Feed Mill Raw Materials Stock)
  const { data: feedItems } = useQuery({
    queryKey: ['alerts_feed_items'],
    queryFn: async () => {
      const { data } = await supabase.from('items').select('id,name,reorder_level').eq('category', 'Feed Ingredient').eq('is_active', true)
      return data ?? []
    }
  })

  const { data: ledgerData } = useQuery({
    queryKey: ['alerts_stock_ledger'],
    queryFn: async () => {
      let all: any[] = [], from = 0
      while (true) {
        const { data } = await supabase.from('stock_ledger').select('item_id,item_name,txn_type,qty').range(from, from + 999)
        if (!data || !data.length) break
        all = all.concat(data); if (data.length < 1000) break; from += 1000
      }
      return all
    }
  })

  const lowHDFlocks = React.useMemo(() => {
    if (!hdData) return 0
    const byFlock: Record<string, { total: number; birds: number; count: number }> = {}
    for (const r of hdData) {
      const eggs = (r.he_eggs_a ?? 0) + (r.he_eggs_b ?? 0) + (r.he_eggs_c ?? 0) + (r.nhe_je ?? 0) + (r.nhe_te ?? 0) + (r.nhe_be ?? 0)
      const alive = r.female_alive ?? 0
      if (!byFlock[r.flock_id]) byFlock[r.flock_id] = { total: 0, birds: 0, count: 0 }
      byFlock[r.flock_id].total += eggs
      byFlock[r.flock_id].birds += alive
      byFlock[r.flock_id].count += 1
    }
    return Object.values(byFlock).filter(v => v.birds > 0 && (v.total / v.birds) * 100 < 65).length
  }, [hdData])

  const lowStockCount = React.useMemo(() => {
    if (!feedItems || !ledgerData) return 0
    const OUT = new Set(['production_out', 'medicine_out', 'adjustment_out', 'transfer_out'])
    const nrm = (s: any) => (s ?? '').toString().trim().toLowerCase()
    const balById: Record<string, number> = {}, balByName: Record<string, number> = {}
    for (const r of ledgerData) {
      const q = Number(r.qty ?? 0) * (OUT.has(r.txn_type) ? -1 : 1)
      if (r.item_id) balById[r.item_id] = (balById[r.item_id] ?? 0) + q
      const nm = nrm(r.item_name)
      if (nm) balByName[nm] = (balByName[nm] ?? 0) + q
    }
    // Count feed-ingredient items at/below reorder (or out of stock), matching by id or name
    return (feedItems as any[]).filter((it: any) => {
      const b = (it.id in balById) ? balById[it.id] : (balByName[nrm(it.name)] ?? 0)
      const reorder = Number(it.reorder_level ?? 0)
      return reorder > 0 ? b <= reorder : b <= 0
    }).length
  }, [feedItems, ledgerData])

  const overdueCount = overdueData?.length ?? 0
  const overdueAmt = overdueData?.reduce((s: number, r: any) => s + (r.amount ?? 0), 0) ?? 0

  const allClear = lowHDFlocks === 0 && lowStockCount === 0 && overdueCount === 0

  if (allClear) {
    return (
      <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700 font-medium">
        <span>✓</span><span>All systems normal</span>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap gap-3">
      {lowHDFlocks > 0 && (
        <button onClick={() => navigate('/flock')} className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 font-medium hover:bg-red-100 transition-colors">
          <AlertTriangle size={15} />{lowHDFlocks} flock{lowHDFlocks > 1 ? 's' : ''} with HD% &lt; 65%
        </button>
      )}
      {lowStockCount > 0 && (
        <button onClick={() => navigate('/feed/stock')} className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700 font-medium hover:bg-amber-100 transition-colors">
          <Package size={15} />{lowStockCount} feed item{lowStockCount > 1 ? 's' : ''} low stock
        </button>
      )}
      {overdueCount > 0 && (
        <button onClick={() => navigate('/pending-payments')} className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 text-sm text-orange-700 font-medium hover:bg-orange-100 transition-colors">
          <DollarSign size={15} />{overdueCount} overdue payment{overdueCount > 1 ? 's' : ''} ({inr(overdueAmt)})
        </button>
      )}
    </div>
  )
}
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip,
  CartesianGrid, BarChart, Bar
} from 'recharts'

export const Dashboard: React.FC = () => {
  const { data: flocks, isLoading: loadingFlocks } = useQuery({
    queryKey: ['flock_summary'],
    queryFn: async () => {
      const { data } = await supabase.from('v_flock_summary').select('*').eq('is_vhl_contract', false).order('flock_no')
      return data ?? []
    }
  })

  const { data: recentDaily } = useQuery({
    queryKey: ['recent_daily'],
    queryFn: async () => {
      const today = new Date().toISOString().slice(0, 10)
      const { data } = await supabase
        .from('daily_records')
        .select('record_date, total_eggs, he_eggs, mortality_female, mortality_male, flock_id, flocks(flock_no)')
        .lte('record_date', today)
        .order('record_date', { ascending: false })
        .limit(100)
      return data ?? []
    }
  })

  const { data: elecBills } = useQuery({
    queryKey: ['elec_latest'],
    queryFn: async () => {
      const { data } = await supabase
        .from('electricity_bills')
        .select('*, electricity_meters(meter_name)')
        .order('bill_month', { ascending: false })
        .limit(10)
      return data ?? []
    }
  })

  const activeFlocks  = flocks?.filter(f => f.status !== 'closed') ?? []
  const totalEggs     = flocks?.reduce((s, f) => s + (f.total_eggs ?? 0), 0) ?? 0
  const totalRevenue  = flocks?.reduce((s, f) => s + (f.he_revenue ?? 0) + (f.nhe_revenue ?? 0), 0) ?? 0
  const totalBirds    = activeFlocks.reduce((s, f) => s + (f.current_female ?? 0) + (f.current_male ?? 0), 0)

  // Chart data — 30-day production
  const chartData = React.useMemo(() => {
    if (!recentDaily) return []
    const byDate: Record<string, { date: string; eggs: number; he: number; mort: number }> = {}
    recentDaily.forEach((r: any) => {
      const d = r.record_date
      if (!byDate[d]) byDate[d] = { date: d, eggs: 0, he: 0, mort: 0 }
      byDate[d].eggs += r.total_eggs ?? 0
      byDate[d].he   += r.he_eggs ?? 0
      byDate[d].mort += (r.mortality_female ?? 0) + (r.mortality_male ?? 0)
    })
    return Object.values(byDate)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-14)
      .map(r => { const p=r.date.split('-'); const mn=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']; return { ...r, date: `${p[2]} ${mn[parseInt(p[1])-1]}` } })
  }, [recentDaily])

  if (loadingFlocks) return <Spinner />

  return (
    <div className="space-y-6">
      <AlertsWidget />
      <SectionHeader
        title="Dashboard"
        subtitle={`${activeFlocks.length} active flock${activeFlocks.length !== 1 ? 's' : ''} • Last updated today`}
      />

      <MyTasksWidget />

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Birds (Active)"
          value={totalBirds.toLocaleString('en-IN')}
          subtitle={`${activeFlocks.length} flocks running`}
          icon={<Bird size={18}/>}
          color="text-brand-600"
        />
        <StatCard
          title="Total Eggs Produced"
          value={(totalEggs / 100000).toFixed(1) + ' L'}
          subtitle="All flocks lifetime"
          icon={<Egg size={18}/>}
          color="text-yellow-600"
        />
        <StatCard
          title="Total HE Revenue"
          value={inr(totalRevenue)}
          subtitle="HE + NHE all flocks"
          icon={<DollarSign size={18}/>}
          color="text-green-600"
        />
        <StatCard
          title="Active Flocks"
          value={activeFlocks.length}
          subtitle={`${flocks?.filter(f=>f.status==='closed').length ?? 0} closed`}
          icon={<Activity size={18}/>}
          color="text-blue-600"
        />
      </div>

      {/* Flock Cards */}
      <Card>
        <CardHeader
          title="Active Flocks"
          action={<Link to="/flocks" className="text-sm text-brand-600 hover:text-brand-700 flex items-center gap-1">All flocks <ArrowRight size={14}/></Link>}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {activeFlocks.map((f: any) => (
            <Link key={f.id} to={`/flocks/${f.id}`}
              className="block p-4 rounded-xl border border-gray-100 hover:border-brand-200 hover:bg-brand-50/30 transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="text-lg font-bold text-gray-900">F-{f.flock_no}</span>
                <Badge color={f.status==='laying'?'green':f.status==='rearing'?'yellow':'gray'}>
                  {f.status}
                </Badge>
              </div>
              <div className="space-y-1.5 text-xs text-gray-600">
                <div className="flex justify-between">
                  <span>Site</span>
                  <span className="font-medium text-gray-900 truncate max-w-[100px]">{f.laying_farm}</span>
                </div>
                <div className="flex justify-between">
                  <span>Birds ♀</span>
                  <span className="font-medium text-gray-900">{(f.current_female??0).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span>HE (Total)</span>
                  <span className="font-medium text-gray-900">{(f.total_he??0).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span>HE%</span>
                  <span className={`font-medium ${(f.he_pct??0)>0.88?'text-green-600':'text-orange-600'}`}>
                    {pct(f.he_pct)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Revenue</span>
                  <span className="font-medium text-green-700">{inr(f.he_revenue)}</span>
                </div>
              </div>
              <div className="mt-3 pt-2 border-t border-gray-100 flex justify-between text-xs text-gray-400">
                <span>Placed: {fmtDate(f.placement_date)}</span>
                <span>→</span>
              </div>
            </Link>
          ))}
        </div>
      </Card>

      {/* 14-day production chart */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader title="14-Day Production" subtitle="Eggs + HE across all active flocks" />
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => v.toLocaleString('en-IN')} />
              <Line type="monotone" dataKey="eggs" stroke="#22c55e" strokeWidth={2} dot={false} name="Total Eggs" />
              <Line type="monotone" dataKey="he"   stroke="#3b82f6" strokeWidth={2} dot={false} name="HE Eggs" />
              <Line type="monotone" dataKey="mort" stroke="#ef4444" strokeWidth={1.5} dot={false} name="Mortality" />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Electricity + Quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader
            title="Latest Electricity Bills"
            action={<Link to="/electricity" className="text-sm text-brand-600">View all</Link>}
          />
          <div className="space-y-2">
            {elecBills?.slice(0,5).map((b: any) => (
              <div key={b.id} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-900">{b.electricity_meters?.meter_name}</p>
                  <p className="text-xs text-gray-500">{fmtDate(b.bill_month)} • {b.units_consumed?.toLocaleString('en-IN') ?? 'N/A'} units</p>
                </div>
                <span className="text-sm font-semibold text-gray-900">{inr(b.amount)}</span>
              </div>
            ))}
            {!elecBills?.length && <p className="text-sm text-gray-400 py-4 text-center">No bills entered yet</p>}
          </div>
        </Card>

        <Card>
          <CardHeader title="Quick Actions" />
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Daily Entry',      to: '/flocks/daily',      icon: <Activity size={18}/>,  color: 'bg-green-50 text-green-700' },
              { label: 'HE Dispatch',      to: '/flocks/he-dispatch',icon: <Package size={18}/>,   color: 'bg-blue-50 text-blue-700' },
              { label: 'GRN Entry',        to: '/feed/grn',          icon: <Package size={18}/>,   color: 'bg-yellow-50 text-yellow-700' },
              { label: 'Electricity Bill', to: '/electricity',        icon: <Zap size={18}/>,       color: 'bg-orange-50 text-orange-700' },
              { label: 'Salary Entry',     to: '/employees/salary',  icon: <Users size={18}/>,     color: 'bg-purple-50 text-purple-700' },
              { label: 'Add Flock',        to: '/flocks/new',        icon: <Bird size={18}/>,      color: 'bg-brand-50 text-brand-700' },
            ].map(a => (
              <Link key={a.to} to={a.to}
                className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-all">
                <div className={`p-2 rounded-lg ${a.color}`}>{a.icon}</div>
                <span className="text-sm font-medium text-gray-700">{a.label}</span>
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
