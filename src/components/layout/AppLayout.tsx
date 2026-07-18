import React, { useState, useRef, useEffect } from 'react'
import { Link, useLocation, Outlet, Navigate, useSearchParams, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Bird, Factory, Zap, Users, Settings,
  ChevronDown, ChevronRight, LogOut, Menu, X,
  BarChart2, Database, Shield, ShoppingCart, BookOpen, Search, MessageCircle, ListTodo, TrendingUp
} from 'lucide-react'
import { useAuth, can, hasModule, type Role } from '@/lib/auth'
import { resolveModuleForPath } from '@/lib/modules'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { ChatPanel } from '@/components/chat/ChatPanel'
import { TaskAlerts } from '@/components/tasks/TaskAlerts'
import { LogoChip } from '@/components/Logo'
import { useQuery } from '@tanstack/react-query'
import { searchAppData, type SearchHit } from '@/lib/globalSearch'

interface NavChild { label: string; to: string }
interface NavItem {
  label: string
  icon: React.ReactNode
  to?: string
  children?: NavChild[]
  roles?: Role[]        // if set, only these roles see this item
  hideRoles?: Role[]    // if set, these roles do NOT see this item
}

const NAV: NavItem[] = [
  { label: 'Dashboard', icon: <LayoutDashboard size={18}/>, to: '/' },
  { label: 'Tasks', icon: <ListTodo size={18}/>, to: '/tasks' },
  {
    label: 'Flock Management', icon: <Bird size={18}/>,
    children: [
      { label: 'Dashboard',          to: '/flock' },
      { label: 'All Flocks (Data)',  to: '/flocks' },
      { label: 'Compare Flocks',     to: '/flock/compare' },
      { label: 'Shed Performance',   to: '/flock/shed-performance' },
      { label: 'Daily Entry',        to: '/flocks/daily' },
      { label: 'Bulk Daily Entry',   to: '/flocks/bulk-daily' },
      { label: 'HE Dispatch',        to: '/flocks/he-dispatch' },
      { label: 'NHE Sales',          to: '/flocks/nhe-sales' },
      { label: 'Egg Conversions',    to: '/flocks/egg-conversions' },
      { label: 'Hatch Batches',      to: '/flocks/hatch-batches' },
      { label: 'Medicine Entry',     to: '/flocks/medicine' },
      { label: 'Egg Opening Stock',  to: '/flocks/opening-stock' },
      { label: 'Vaccination',        to: '/flocks/vaccination' },
      { label: 'HE Rate Register',   to: '/flocks/he-rate-register' },
    ]
  },
  {
    label: 'Feed Mill', icon: <Factory size={18}/>,
    children: [
      { label: 'Raw Materials Stock',  to: '/feed/mill?tab=raw' },
      { label: 'Production',           to: '/feed/mill?tab=production' },
      { label: 'Finished Feed Stock',  to: '/feed/mill?tab=finished' },
      { label: 'Stock Dispatch',       to: '/feed/mill?tab=dispatch' },
    ]
  },
  {
    label: 'Electricity', icon: <Zap size={18}/>,
    children: [
      { label: 'Bills Entry', to: '/electricity' },
      { label: 'Allocation',  to: '/electricity/allocation' },
      { label: 'History',     to: '/electricity/history' },
      { label: 'Analysis',    to: '/electricity/analysis' },
    ]
  },
  { label: 'Generators', icon: <Zap size={18}/>, to: '/generators' },
  { label: 'Empty Bags', icon: <Database size={18}/>, to: '/bags' },
  {
    // Accounts dept + admin only for salary entry; site_manager can view employees
    label: 'Employees', icon: <Users size={18}/>,
    hideRoles: ['site_incharge', 'viewer'],
    children: [
      { label: 'Employee List',   to: '/employees' },
      { label: 'Bulk Salary',      to: '/employees/bulk-salary' },
      { label: 'Salary Register',  to: '/employees/salary-register' },
      { label: 'Salary CMS Export', to: '/employees/cms-export' },
      { label: 'Statutory Compliance (TDS/GST/PF/ESI/PT)', to: '/employees/statutory' },
      { label: 'Salary History',   to: '/employees/salary-history' },
      { label: 'Partner Remuneration', to: '/employees/partner-remuneration' },
      { label: 'Salary Entry',    to: '/employees/salary' },
      { label: 'Salary Abstract', to: '/employees/abstract' },
      { label: 'Site-wise Employee Count', to: '/employees/site-designation-count' },
      { label: 'Bonus',           to: '/employees/bonus' },
      { label: 'ESI / PF Report', to: '/employees/esi-pf' },
      { label: 'Payroll Summary', to: '/employees/payroll-summary' },
      { label: 'Monthly Attendance',    to: '/employees/monthly-attendance' },
      { label: 'Daily Attendance',     to: '/employees/attendance-daily' },
      { label: 'Month Attendance',     to: '/employees/attendance-month' },
      { label: 'Attendance Register',  to: '/employees/attendance' },
      { label: 'Advances',             to: '/employees/advances' },
      { label: 'Payslip Generator',    to: '/employees/payslip' },
    ]
  },
  {
    label: 'Masters', icon: <Settings size={18}/>,
    roles: ['admin', 'accounts'],
    children: [
      { label: 'Farm / Sites',         to: '/masters/farms' },
      { label: 'Sheds',                to: '/masters/sheds' },
      { label: 'Feed Types',           to: '/masters/feed-types' },
      { label: 'Vaccination Schedule', to: '/masters/vaccination' },
      { label: 'Hatcheries',           to: '/masters/hatcheries' },
      { label: 'Electricity Meters',   to: '/masters/meters' },
    ]
  },
  {
    label: 'Reports', icon: <BarChart2 size={18}/>,
    children: [
      { label: 'Flock P&L (Full)',      to: '/reports/pl' },
      { label: 'Flock P&L Summary',    to: '/reports/flock-pl-summary' },
      { label: 'Company P&L',           to: '/reports/company-pl' },
      { label: 'Party Outstanding',     to: '/reports/party-outstanding' },
      { label: 'GST Reports',           to: '/reports/gst' },
      { label: 'Production Report',     to: '/reports/production' },
      { label: 'Feed Cost Report',      to: '/reports/feed' },
      { label: 'Salary Report',         to: '/reports/salary' },
      { label: 'Cost Analysis',         to: '/reports/costs' },
      { label: 'Export to Excel',       to: '/reports/export' },
      { label: 'Egg Stock Balance',      to: '/reports/egg-stock' },
      { label: 'Daily Summary',           to: '/reports/daily-summary' },
      { label: 'TDS Receivable',          to: '/reports/tds-receivable' },
      { label: 'TDS Payable',             to: '/reports/tds-payable' },
      { label: 'Stock Statement',         to: '/reports/stock-statement' },
      { label: 'Site Invoice (Consolidated)', to: '/reports/site-invoice' },
      { label: 'Bird / Cull Sales Report',    to: '/reports/bird-sales' },
    ]
  },
  {
    label: 'Accounts', icon: <BarChart2 size={18}/>,
    children: [
      { label: 'Cash Book', to: '/accounts/cash-book' },
      { label: 'Bank Ledger', to: '/accounts/bank-ledger' },
      { label: 'Party Ledger', to: '/accounts/party-ledger' },
      { label: 'Opening Balances', to: '/accounts/opening-balances' },
      { label: 'Buyer Advances', to: '/accounts/buyer-advances' },
      { label: 'Vendor Advances', to: '/accounts/vendor-advances' },
      { label: 'Daily Payment Planning', to: '/accounts/payment-planning' },
      { label: 'Generate CMS File', to: '/accounts/cms-upload' },
      { label: 'Sales Invoice Register', to: '/accounts/sales-invoices' },
      { label: 'Purchase Invoice Register', to: '/accounts/invoices' },
      { label: 'Invoice Series / Counters', to: '/accounts/invoice-series' },
      { label: 'Pending Payments', to: '/pending-payments' },
    ]
  },
  {
    label: 'Purchase', icon: <ShoppingCart size={18}/>,
    children: [
      { label: 'Purchase Intent', to: '/purchase/intent' },
      { label: 'Items Master',    to: '/purchase/items' },
      { label: 'Suppliers',       to: '/masters/parties' },
      { label: 'Purchase Orders', to: '/purchase/orders' },
      { label: 'GRN',             to: '/purchase/grn' },
      { label: 'Payments',        to: '/pending-payments' },
      { label: 'Farm Expenses',   to: '/expenses' },
    ]
  },
  {
    label: 'Inventory', icon: <Database size={18}/>,
    children: [
      { label: 'Inventory', to: '/inventory' },
    ]
  },
  {
    label: 'VHL', icon: <Bird size={18}/>,
    children: [
      { label: 'VHL Dashboard',         to: '/vhl/dashboard' },
      { label: 'VHL Flocks',            to: '/vhl/flocks' },
      { label: 'VHL Daily Entry',       to: '/vhl/daily-entry' },
      { label: 'VHL Bulk Daily Entry',  to: '/vhl/bulk-daily-entry' },
      { label: 'VHL Egg Production',    to: '/vhl/egg-production' },
      { label: 'VHL Medicine Master',   to: '/vhl/medicine-master' },
      { label: 'VHL Medicine Usage',    to: '/vhl/medicine-usage' },
      { label: 'VHL Shed Performance',  to: '/vhl/shed-performance' },
      { label: 'VHL Egg Stock Register', to: '/vhl/egg-stock-register' },
    ]
  },
  {
    label: 'Import Data', icon: <Database size={18}/>,
    roles: ['admin', 'accounts'],
    children: [
      { label: 'Import Daily Records', to: '/import/daily' },
      { label: 'Import HE Dispatch',   to: '/import/he' },
      { label: 'Import Salary',        to: '/import/salary' },
      { label: 'Import Electricity',   to: '/import/electricity' },
      { label: 'Import GRN',           to: '/import/grn' },
      { label: '✦ Excel Converter',    to: '/import/mapper' },
    ]
  },
  {
    label: 'Discussions', icon: <MessageCircle size={18}/>,
    to: '/chat',
  },
  {
    label: 'Help & Guide', icon: <BookOpen size={18}/>,
    roles: ['admin','management','accounts','site_manager','viewer'],
    to: '/help',
  },
  {
    label: 'Planning', icon: <TrendingUp size={18}/>,
    roles: ['admin'],
    to: '/planning',
  },
  {
    label: 'Admin Centre', icon: <Shield size={18}/>,
    roles: ['admin'],
    children: [
      { label: 'Setup Overview',          to: '/admin' },
      { label: 'Company Profile',         to: '/admin?tab=company' },
      { label: 'Masters',                 to: '/admin?tab=masters' },
      { label: 'Flock–Shed Assignment',   to: '/admin?tab=flocks' },
      { label: 'Electricity Allocation',  to: '/admin?tab=electricity' },
      { label: 'Salary Allocation',       to: '/admin?tab=salary' },
      { label: 'User Management',         to: '/admin/users' },
      { label: 'Access Control',          to: '/admin/access' },
      { label: '🔍 Audit Log',            to: '/admin/audit' },
    ]
  },
]

const ROLE_LABELS: Record<Role, string> = {
  admin:         'Administrator',
  management:    'Management',
  accounts:      'Accounts',
  site_manager:  'Site Manager',
  site_incharge: 'Site Incharge',
  viewer:        'Viewer',
}
const ROLE_COLORS: Record<Role, string> = {
  admin:         'bg-red-100 text-red-700',
  management:    'bg-purple-100 text-purple-700',
  accounts:      'bg-blue-100 text-blue-700',
  site_manager:  'bg-orange-100 text-orange-700',
  site_incharge: 'bg-green-100 text-green-700',
  viewer:        'bg-gray-100 text-gray-600',
}

// Filters both by the existing static roles/hideRoles arrays AND by the
// admin-editable role_permissions table (via hasModule) — a section whose
// module has been set to Hidden for this role disappears from the nav even
// if its old `roles` array would have allowed it, and vice versa. Children
// are filtered individually since one parent section (e.g. "Employees") can
// mix items from more than one module (Payroll vs Attendance).
function filterNav(nav: NavItem[], role: Role): NavItem[] {
  return nav
    .filter(item => {
      if (item.roles && !item.roles.includes(role)) return false
      if (item.hideRoles && item.hideRoles.includes(role)) return false
      if (item.to && !hasModule(resolveModuleForPath(item.to))) return false
      return true
    })
    .map(item => item.children
      ? { ...item, children: item.children.filter(c => hasModule(resolveModuleForPath(c.to))) }
      : item)
    .filter(item => !item.children || item.children.length > 0)
}

const NavLink: React.FC<{ item: NavItem; collapsed: boolean }> = ({ item, collapsed }) => {
  const location = useLocation()

  const isChildActive = (childTo: string) => {
    const [childPath, childQuery] = childTo.split('?')
    if (childQuery) {
      return location.pathname === childPath && location.search === '?' + childQuery
    }
    return location.pathname.startsWith(childPath) && !location.search
  }

  const [open, setOpen] = useState(() =>
    item.children?.some(c => isChildActive(c.to)) ?? false
  )

  if (!item.children) {
    const active = location.pathname === item.to
    return (
      <Link to={item.to!}
        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
          ${active ? 'bg-white/20 text-white' : 'text-green-100 hover:bg-white/10 hover:text-white'}`}
      >
        {item.icon}
        {!collapsed && item.label}
      </Link>
    )
  }

  const anyActive = item.children.some(c => isChildActive(c.to))

  return (
    <div>
      <button onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium
          transition-colors ${anyActive ? 'bg-white/15 text-white' : 'text-green-100 hover:bg-white/10 hover:text-white'}`}
      >
        <span className="flex items-center gap-3">{item.icon}{!collapsed && item.label}</span>
        {!collapsed && (open ? <ChevronDown size={14}/> : <ChevronRight size={14}/>)}
      </button>
      {open && !collapsed && (
        <div className="ml-7 mt-1 flex flex-col gap-0.5">
          {item.children.map(c => {
            const active = isChildActive(c.to)
            return (
              <Link key={c.to} to={c.to}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors
                  ${active ? 'bg-white/20 text-white font-semibold' : 'text-green-200 hover:text-white hover:bg-white/10'}`}
              >
                {c.label}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

// Flatten all nav items into a searchable list
function buildSearchIndex(nav: NavItem[]): { label: string; parent: string; to: string }[] {
  const items: { label: string; parent: string; to: string }[] = []
  for (const item of nav) {
    if (item.to) {
      items.push({ label: item.label, parent: '', to: item.to })
    }
    if (item.children) {
      for (const child of item.children) {
        items.push({ label: child.label, parent: item.label, to: child.to })
      }
    }
  }
  return items
}

const GlobalSearch: React.FC<{ nav: NavItem[] }> = ({ nav }) => {
  const [query, setQuery] = useState('')
  const [debounced, setDebounced] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const index = buildSearchIndex(nav)

  // Debounce the data search (page-nav search stays instant, it's just an
  // in-memory filter) so typing doesn't fire a query per keystroke.
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 300)
    return () => clearTimeout(t)
  }, [query])

  const pageResults = query.trim().length > 0
    ? index.filter(i => i.label.toLowerCase().includes(query.toLowerCase()) || i.parent.toLowerCase().includes(query.toLowerCase())).slice(0, 5)
    : []

  const { data: dataResults = [], isFetching } = useQuery({
    queryKey: ['global_data_search', debounced],
    queryFn: () => searchAppData(debounced),
    enabled: debounced.length >= 2,
  })

  const noResults = query.trim().length > 0 && pageResults.length === 0 && dataResults.length === 0 && !isFetching

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const goTo = (to: string) => { navigate(to); setQuery(''); setOpen(false) }

  return (
    <div ref={ref} className="relative w-72 hidden sm:block">
      <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-1.5">
        <Search size={14} className="text-gray-400 shrink-0" />
        <input
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          placeholder="Search pages, employees, flocks, bills, tasks..."
          className="bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none w-full"
        />
        {query && <button onClick={() => { setQuery(''); setOpen(false) }}><X size={12} className="text-gray-400 hover:text-gray-600" /></button>}
      </div>
      {open && (pageResults.length > 0 || dataResults.length > 0) && (
        <div className="absolute top-full mt-1 left-0 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden max-h-96 overflow-y-auto">
          {pageResults.length > 0 && (
            <div className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400">Pages</div>
          )}
          {pageResults.map((r, i) => (
            <button key={`p${i}`} onMouseDown={() => goTo(r.to)}
              className="w-full text-left px-3 py-2 hover:bg-gray-50 flex flex-col border-b border-gray-50 last:border-0">
              <span className="text-sm font-medium text-gray-800">{r.label}</span>
              {r.parent && <span className="text-xs text-gray-400">{r.parent}</span>}
            </button>
          ))}
          {dataResults.length > 0 && (
            <div className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400 border-t border-gray-100">Records</div>
          )}
          {dataResults.map((r: SearchHit, i: number) => (
            <button key={`d${i}`} onMouseDown={() => goTo(r.to)}
              className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-start gap-2 border-b border-gray-50 last:border-0">
              <span className="text-base leading-5 shrink-0">{r.icon}</span>
              <span className="flex flex-col min-w-0">
                <span className="text-sm font-medium text-gray-800 truncate">{r.title}</span>
                <span className="text-xs text-gray-400 truncate">{r.type}{r.subtitle ? ' · ' + r.subtitle : ''}</span>
              </span>
            </button>
          ))}
        </div>
      )}
      {open && isFetching && debounced.length >= 2 && pageResults.length === 0 && dataResults.length === 0 && (
        <div className="absolute top-full mt-1 left-0 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 px-3 py-4 text-sm text-gray-400 text-center">
          Searching…
        </div>
      )}
      {open && noResults && (
        <div className="absolute top-full mt-1 left-0 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 px-3 py-4 text-sm text-gray-400 text-center">
          No results for "{query}"
        </div>
      )}
    </div>
  )
}

// Defense-in-depth: even if a hidden nav item is never clicked, someone
// could still type the URL directly. Blocks the page itself, not just the
// link to it. Admin always passes (hasModule short-circuits); for everyone
// else, wait for the permissions fetch to actually land before deciding —
// otherwise the one render before it arrives would show "access restricted"
// for a page that's actually allowed.
const ModuleGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile, permissionsLoaded } = useAuth()
  const location = useLocation()
  const moduleKey = resolveModuleForPath(location.pathname)
  if (profile?.role !== 'admin' && !permissionsLoaded) {
    return <div className="flex justify-center p-12 text-gray-400 text-sm">Loading…</div>
  }
  if (!hasModule(moduleKey)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-6">
        <div className="text-5xl">🔒</div>
        <h2 className="text-xl font-bold text-gray-800">Access Restricted</h2>
        <p className="text-gray-500 text-sm max-w-sm">You don't have permission to view this page. Contact your administrator to request access.</p>
        <p className="text-xs text-gray-400">Your role: <span className="font-semibold">{profile?.role ?? 'unknown'}</span></p>
      </div>
    )
  }
  return <>{children}</>
}

export const AppLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { profile, signOut } = useAuth()
  // Used below to remount the ErrorBoundary on route change. Without this,
  // `location` in this component resolved to the bare global window.location
  // (not reactive to client-side navigation), so the boundary's key never
  // actually changed and it couldn't self-heal after an error on route change.
  const location = useLocation()

  const role = profile?.role ?? 'viewer'
  const visibleNav = filterNav(NAV, role)

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside className={`
        hidden lg:flex flex-col transition-all duration-200
        ${sidebarOpen ? 'w-64' : 'w-16'}
      `} style={{ background: 'linear-gradient(180deg,#1a5c38 0%,#14532d 60%,#0f3d22 100%)' }}>

        {/* Logo */}
        <div className={`flex items-center border-b border-green-800/40 shrink-0 ${sidebarOpen ? 'h-24 px-4 gap-3' : 'h-16 justify-center'}`}>
          {sidebarOpen ? (
            <>
              <div className="shrink-0"><LogoChip size={40} /></div>
              <div>
                <p className="font-extrabold text-sm text-white leading-tight">Nara<span style={{ color: '#d6ab5f' }}>e</span>ndra Farms</p>
                <p className="text-[10px] text-green-300">Broiler Breeder</p>
              </div>
              <button onClick={() => setSidebarOpen(o => !o)}
                className="ml-auto p-1.5 rounded-lg hover:bg-green-700/40 transition-colors shrink-0">
                <Menu size={16} className="text-green-200" />
              </button>
            </>
          ) : (
            <button onClick={() => setSidebarOpen(o => !o)}
              className="flex flex-col items-center gap-1 p-1 rounded-lg hover:bg-green-700/40 transition-colors">
              <LogoChip size={28} />
              <Menu size={12} className="text-green-300" />
            </button>
          )}
        </div>

        {/* User name + Role badge */}
        {sidebarOpen && profile && (
          <div className="px-4 pt-3 pb-2">
            <p className="text-sm font-bold text-white truncate">{profile.full_name ?? 'User'}</p>
            <div className="flex items-center gap-1 mt-1">
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${ROLE_COLORS[role]}`}>
                {ROLE_LABELS[role]}
              </span>
              {profile.farm_id && role === 'site_incharge' && (
                <span className="text-[10px] text-green-400">• Site only</span>
              )}
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-1">
          {visibleNav.map(item => (
            <NavLink key={item.label} item={item} collapsed={!sidebarOpen} />
          ))}
        </nav>

        {/* User sign-out strip */}
        <div className="px-3 py-3 border-t border-green-800/40">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold text-white shrink-0">
              {profile?.full_name?.[0]?.toUpperCase() ?? 'U'}
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white truncate">{profile?.full_name ?? 'User'}</p>
              </div>
            )}
            {sidebarOpen && (
              <button onClick={signOut} title="Sign out" className="p-1 rounded hover:bg-white/10 transition-colors">
                <LogOut size={14} className="text-green-300" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-72 h-full flex flex-col"
            style={{ background: 'linear-gradient(180deg,#1a5c38,#0f3d22)' }}>
            {/* Header with bird */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-green-800/40">
              <LogoChip size={38} />
              <div className="flex-1">
                <p className="font-extrabold text-sm text-white">Nara<span style={{ color: '#d6ab5f' }}>e</span>ndra Farms</p>
                {profile && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <p className="text-xs text-green-200 truncate">{profile.full_name}</p>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${ROLE_COLORS[role]}`}>
                      {ROLE_LABELS[role]}
                    </span>
                  </div>
                )}
              </div>
              <button onClick={() => setMobileOpen(false)}>
                <X size={18} className="text-green-300" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-0.5">
              {visibleNav.map(item => <NavLink key={item.label} item={item} collapsed={false} />)}
            </nav>
            <div className="px-3 py-3 border-t border-green-800/40 flex items-center justify-between">
              <span className="text-xs font-medium text-green-200">{profile?.full_name}</span>
              <button onClick={signOut} className="flex items-center gap-1 text-xs text-green-300 hover:text-white">
                <LogOut size={14}/> Sign out
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 bg-white border-b border-gray-100 flex items-center px-4 gap-4 shrink-0">
          <button className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100" onClick={() => setMobileOpen(true)}>
            <Menu size={18} />
          </button>
          <GlobalSearch nav={visibleNav} />
          <div className="flex-1" />
          <ChatPanel />
          <TaskAlerts />
          <span className="text-xs text-gray-400 hidden sm:block">
            {new Date().toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', weekday:'long', day:'2-digit', month:'long', year:'numeric' })}
          </span>
        </header>
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <ErrorBoundary key={location.pathname}>
            <ModuleGuard>
              <Outlet />
            </ModuleGuard>
          </ErrorBoundary>
        </main>
      </div>
    </div>
  )
}
