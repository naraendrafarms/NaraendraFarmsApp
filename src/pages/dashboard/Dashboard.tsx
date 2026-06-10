import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { inr, pct, fmtDate, statusColor } from '@/lib/utils'
import { StatCard, Card, CardHeader, Badge, Spinner, SectionHeader } from '@/components/ui'
import {
  Bird, Egg, TrendingUp, AlertTriangle, Zap, Users,
  ArrowRight, Activity, DollarSign, Package
} from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip,
  CartesianGrid, BarChart, Bar
} from 'recharts'

export const Dashboard: React.FC = () => {
  const { data: flocks, isLoading: loadingFlocks } = useQuery({
    queryKey: ['flock_summary'],
    queryFn: async () => {
      const { data } = await supabase.from('v_flock_summary').select('*').order('flock_no')
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
      .map(r => ({ ...r, date: new Date(r.date).toLocaleDateString('en-IN', { day:'2-digit', month:'short' }) }))
  }, [recentDaily])

  if (loadingFlocks) return <Spinner />

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Dashboard"
        subtitle={`${activeFlocks.length} active flock${activeFlocks.length !== 1 ? 's' : ''} • Last updated today`}
      />

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
                  <span className="font-medium text-gray-900">{((f.total_he??0)/100000).toFixed(2)}L</span>
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
