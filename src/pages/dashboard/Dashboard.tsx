import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { inr, pct, fmtDate, statusColor, fetchAllPages } from '@/lib/utils'
import { StatCard, Card, CardHeader, Badge, Spinner, SectionHeader } from '@/components/ui'
import {
  Bird, Egg, TrendingUp, AlertTriangle, Zap, Users,
  ArrowRight, Activity, DollarSign, Package
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { MyTasksWidget } from '@/components/tasks/MyTasksWidget'
import { useAuth } from '@/lib/auth'
import type { ModuleKey } from '@/lib/modules'
import { useFarmScope } from '@/lib/useFarmScope'

// ─────────────────────────────────────────────────────────────────────────────
// THE DASHBOARD IS BUILT FROM THE PERMISSIONS THAT ALREADY EXIST.
//
// Until now this page had no role logic at all - the word "role" did not
// appear in it - so every role saw the same six things, including Total HE
// Revenue and the electricity bills. A shed supervisor logged in and was shown
// company revenue, even though the module system hides every Reports page from
// them. The menu was locked and the front door was open.
//
// Each widget below now declares the module it needs. It renders only if the
// signed-in role holds that module, and its QUERY IS SKIPPED when it does not -
// so a vet's browser never even fetches the bills it would not be shown.
//
// This deliberately reuses role_permissions rather than inventing a second set
// of rules. Two permission systems disagreeing is exactly how the revenue tile
// leaked in the first place, and it means a NEW role gets a sensible dashboard
// with no new code: set its modules in Admin Centre and the widgets follow.
// ─────────────────────────────────────────────────────────────────────────────

/** Subscribed to the store, unlike the bare hasModule(), so the page re-renders
 *  the moment permissions finish loading instead of showing a logged-in user an
 *  empty dashboard until something else happens to re-render it. */
function useCanSee() {
  const { profile, permissions, permissionsLoaded } = useAuth()
  const can = (m: ModuleKey) =>
    profile?.role === 'admin' || (permissions[m] ?? 'hidden') !== 'hidden'
  return { can, ready: profile?.role === 'admin' || permissionsLoaded, role: profile?.role }
}

const AlertsWidget: React.FC = () => {
  const navigate = useNavigate()
  const { can } = useCanSee()
  // An alert is a link to a page. Showing one a role cannot open is worse than
  // showing nothing: it says something is wrong and then refuses to explain.
  const seeFlocks   = can('flock_ops')
  const seeStock    = can('feed_mill') || can('inventory')
  const seePayments = can('purchase')
  const threeDaysAgo = new Date(); threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
  const threeDaysStr = threeDaysAgo.toISOString().slice(0, 10)
  const today = new Date().toISOString().slice(0, 10)

  const { data: hdData } = useQuery({
    enabled: seeFlocks,
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
    enabled: seePayments,
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
    enabled: seeStock,
    queryKey: ['alerts_feed_items'],
    queryFn: async () => {
      const { data } = await supabase.from('items').select('id,name,reorder_level').eq('category', 'Feed Ingredient').eq('is_active', true)
      return data ?? []
    }
  })

  const { data: ledgerData } = useQuery({
    enabled: seeStock,
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

  // "All systems normal" must only speak for what this role can actually see.
  // Telling a vet everything is fine when they cannot see payments at all would
  // be a reassurance nobody checked.
  const allClear = (!seeFlocks || lowHDFlocks === 0)
    && (!seeStock || lowStockCount === 0)
    && (!seePayments || overdueCount === 0)
  const nothingVisible = !seeFlocks && !seeStock && !seePayments
  if (nothingVisible) return null

  if (allClear) {
    return (
      <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700 font-medium">
        <span>✓</span><span>All systems normal</span>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap gap-3">
      {seeFlocks && lowHDFlocks > 0 && (
        <button onClick={() => navigate('/flock')} className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 font-medium hover:bg-red-100 transition-colors">
          <AlertTriangle size={15} />{lowHDFlocks} flock{lowHDFlocks > 1 ? 's' : ''} with HD% &lt; 65%
        </button>
      )}
      {seeStock && lowStockCount > 0 && (
        <button onClick={() => navigate('/feed/stock')} className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700 font-medium hover:bg-amber-100 transition-colors">
          <Package size={15} />{lowStockCount} feed item{lowStockCount > 1 ? 's' : ''} low stock
        </button>
      )}
      {seePayments && overdueCount > 0 && (
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
  const { can, ready, role } = useCanSee()
  const { isSiteIncharge, farmId } = useFarmScope()

  const seeFlocks    = can('flock_ops')
  const seeMoney     = can('reports_financial')
  const seeElectric  = can('electricity')

  const { data: flocks, isLoading: loadingFlocks } = useQuery({
    enabled: seeFlocks,
    // farmId is in the key: a site in-charge's list is a DIFFERENT list, and
    // sharing one cache entry would serve them whatever the last user fetched.
    queryKey: ['flock_summary', farmId ?? 'all'],
    queryFn: async () => {
      let q = supabase.from('v_flock_summary').select('*').eq('is_vhl_contract', false)
      // A site in-charge sees THEIR site. Without this the tiles below read
      // "Total Birds" as the whole company's, which is not their business and
      // not what the number claims to be.
      if (isSiteIncharge && farmId) q = q.or(`laying_farm_id.eq.${farmId},rearing_farm_id.eq.${farmId}`)
      const { data } = await q.order('flock_no')
      return data ?? []
    }
  })

  const { data: recentDaily } = useQuery({
    enabled: seeFlocks,
    queryKey: ['recent_daily'],
    queryFn: async () => {
      const today = new Date().toISOString().slice(0, 10)
      // Bounded by DATE, not by row count. It used to take the newest 100 rows
      // and group them into days — but every shed reporting on a day is its own
      // row, so 100 rows is only a handful of days, and the oldest day in the
      // window arrived half-complete: that bar showed a partial day's eggs as
      // if it were the whole day. Ask for the 30 days the chart actually wants.
      const start = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10)
      return fetchAllPages<any>((from, to) => supabase
        .from('daily_records')
        .select('record_date, total_eggs, he_eggs, mortality_female, mortality_male, flock_id, flocks(flock_no)')
        .gte('record_date', start).lte('record_date', today)
        .order('record_date', { ascending: false }).order('id').range(from, to), 'Dashboard chart')
    }
  })

  const { data: elecBills } = useQuery({
    enabled: seeElectric,
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

  const quickActionCount = (['flock_ops','feed_mill','electricity','payroll'] as ModuleKey[])
    .filter(m => can(m)).length

  // Wait for permissions before drawing anything. Rendering first and hiding
  // after would flash the revenue tile at a role that must never see it.
  if (!ready) return <Spinner />
  if (seeFlocks && loadingFlocks) return <Spinner />

  return (
    <div className="space-y-6">
      <AlertsWidget />
      <SectionHeader
        title="Dashboard"
        subtitle={seeFlocks
          ? `${activeFlocks.length} active flock${activeFlocks.length !== 1 ? 's' : ''}${
              isSiteIncharge ? ' at your site' : ''} • Last updated today`
          : `Signed in as ${role ?? 'user'} — you are shown only what your role covers`}
      />

      <MyTasksWidget />

      {/* Summary stats. Bird and egg counts are flock_ops; REVENUE IS NOT -
          it is the one tile that leaked to every role, so it carries its own
          financial gate. */}
      {(seeFlocks || seeMoney) && (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {seeFlocks && <StatCard
          title="Total Birds (Active)"
          value={totalBirds.toLocaleString('en-IN')}
          subtitle={`${activeFlocks.length} flocks running`}
          icon={<Bird size={18}/>}
          color="text-brand-600"
        />}
        {seeFlocks && <StatCard
          title="Total Eggs Produced"
          value={totalEggs.toLocaleString('en-IN')}
          subtitle="All flocks lifetime"
          icon={<Egg size={18}/>}
          color="text-yellow-600"
        />}
        {/* THE TILE THAT LEAKED. reports_financial, never flock_ops. */}
        {seeMoney && <StatCard
          title="Total HE Revenue"
          value={inr(totalRevenue)}
          subtitle="HE + NHE all flocks"
          icon={<DollarSign size={18}/>}
          color="text-green-600"
        />}
        {seeFlocks && <StatCard
          title="Active Flocks"
          value={activeFlocks.length}
          subtitle={`${flocks?.filter(f=>f.status==='closed').length ?? 0} closed`}
          icon={<Activity size={18}/>}
          color="text-blue-600"
        />}
      </div>
      )}

      {/* Flock Cards */}
      {seeFlocks && (
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
                {/* Per-flock revenue is the same leak as the tile above, one
                    card at a time - a site manager has flock_ops but not the
                    books. */}
                {seeMoney && (
                  <div className="flex justify-between">
                    <span>Revenue</span>
                    <span className="font-medium text-green-700">{inr(f.he_revenue)}</span>
                  </div>
                )}
              </div>
              <div className="mt-3 pt-2 border-t border-gray-100 flex justify-between text-xs text-gray-400">
                <span>Placed: {fmtDate(f.placement_date)}</span>
                <span>→</span>
              </div>
            </Link>
          ))}
          {activeFlocks.length === 0 && (
            <p className="text-sm text-gray-400 py-4 text-center col-span-full">
              {isSiteIncharge ? 'No active flocks at your site.' : 'No active flocks.'}
            </p>
          )}
        </div>
      </Card>
      )}

      {/* 14-day production chart */}
      {seeFlocks && chartData.length > 0 && (
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
        {seeElectric && (
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
        )}

        {quickActionCount > 0 && (
        <Card>
          <CardHeader title="Quick Actions" />
          <div className="grid grid-cols-2 gap-3">
            {/* Each shortcut carries the module its DESTINATION needs. A link
                to a page the role cannot open is a dead end that looks like a
                fault, so it is not drawn at all. */}
            {([
              { label: 'Daily Entry',      to: '/flocks/daily',      mod: 'flock_ops' as ModuleKey,  icon: <Activity size={18}/>,  color: 'bg-green-50 text-green-700' },
              { label: 'HE Dispatch',      to: '/flocks/he-dispatch',mod: 'flock_ops' as ModuleKey,  icon: <Package size={18}/>,   color: 'bg-blue-50 text-blue-700' },
              { label: 'GRN Entry',        to: '/feed/grn',          mod: 'feed_mill' as ModuleKey,  icon: <Package size={18}/>,   color: 'bg-yellow-50 text-yellow-700' },
              { label: 'Electricity Bill', to: '/electricity',       mod: 'electricity' as ModuleKey,icon: <Zap size={18}/>,       color: 'bg-orange-50 text-orange-700' },
              { label: 'Salary Entry',     to: '/employees/salary',  mod: 'payroll' as ModuleKey,    icon: <Users size={18}/>,     color: 'bg-purple-50 text-purple-700' },
              { label: 'Add Flock',        to: '/flocks/new',        mod: 'flock_ops' as ModuleKey,  icon: <Bird size={18}/>,      color: 'bg-brand-50 text-brand-700' },
            ]).filter(a => can(a.mod)).map(a => (
              <Link key={a.to} to={a.to}
                className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-all">
                <div className={`p-2 rounded-lg ${a.color}`}>{a.icon}</div>
                <span className="text-sm font-medium text-gray-700">{a.label}</span>
              </Link>
            ))}
          </div>
        </Card>
        )}
      </div>

      {/* A role with nothing on the dashboard gets a sentence, not a blank
          page. A blank page reads as broken and generates a support call. */}
      {!seeFlocks && !seeMoney && !seeElectric && quickActionCount === 0 && (
        <Card>
          <div className="p-6 text-sm text-gray-500 text-center">
            Your role does not include any of the dashboard panels. Use the menu on the
            left for the pages you do have — your tasks are shown above.
          </div>
        </Card>
      )}
    </div>
  )
}
