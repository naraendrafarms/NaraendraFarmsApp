import React, { useState } from 'react'
import { Link, useLocation, Outlet, Navigate, useSearchParams } from 'react-router-dom'
import {
  LayoutDashboard, Bird, Factory, Zap, Users, Settings,
  ChevronDown, ChevronRight, LogOut, Menu, X,
  BarChart2, Database, Shield, ShoppingCart, BookOpen
} from 'lucide-react'
import { useAuth, can, type Role } from '@/lib/auth'
import { ErrorBoundary } from '@/components/ErrorBoundary'

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
    ]
  },
  {
    label: 'Feed Mill', icon: <Factory size={18}/>,
    children: [
      { label: 'Feed Dashboard',       to: '/feed' },
      { label: 'Feed Transfer',        to: '/feed/transfer' },
      { label: 'Stock Status',         to: '/feed/stock' },
      { label: 'Inventory (All Items)', to: '/inventory' },
      { label: 'Formula & Production', to: '/feed/mill' },
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
  {
    // Accounts dept + admin only for salary entry; site_manager can view employees
    label: 'Employees', icon: <Users size={18}/>,
    hideRoles: ['site_incharge', 'viewer'],
    children: [
      { label: 'Employee List',   to: '/employees' },
      { label: 'Salary Entry',    to: '/employees/salary' },
      { label: 'Salary Abstract', to: '/employees/abstract' },
      { label: 'Bonus',           to: '/employees/bonus' },
      { label: 'ESI / PF Report', to: '/employees/esi-pf' },
      { label: 'Payroll Summary', to: '/employees/payroll-summary' },
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
      { label: 'Farm / Sites',        to: '/masters/farms' },
      { label: 'Sheds',               to: '/masters/sheds' },
      { label: 'Item Master',          to: '/masters/ingredients' },
      { label: 'Feed Types',          to: '/masters/feed-types' },
      { label: 'Vaccination Schedule',to: '/masters/vaccination' },
      { label: 'Parties',             to: '/masters/parties' },
      { label: 'Hatcheries',          to: '/masters/hatcheries' },
      { label: 'Medicines',           to: '/masters/medicines' },
      { label: 'Electricity Meters',  to: '/masters/meters' },
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
    ]
  },
  {
    label: 'Accounts', icon: <BarChart2 size={18}/>,
    children: [
      { label: 'Cash Book', to: '/accounts/cash-book' },
      { label: 'Bank Ledger', to: '/accounts/bank-ledger' },
      { label: 'Daily Payment Planning', to: '/accounts/payment-planning' },
      { label: 'Generate CMS File', to: '/accounts/cms-upload' },
      { label: 'Sales Invoice Register', to: '/accounts/sales-invoices' },
      { label: 'Purchase Invoice Register', to: '/accounts/invoices' },
      { label: 'Invoice Series / Counters', to: '/accounts/invoice-series' },
      { label: 'Pending Payments', to: '/pending-payments' },
    ]
  },
  {
    label: 'Purchase & Payments', icon: <ShoppingCart size={18}/>,
    children: [
      { label: 'GRN — Goods Received',  to: '/feed/grn' },
      { label: 'Medicine Receipts (GRN)', to: '/flocks/medicine-purchases' },
      { label: 'New Purchase',         to: '/purchases/new' },
      { label: 'Purchase Orders',      to: '/purchase-orders' },
      { label: 'Rate Comparison',      to: '/purchases/rate-compare' },
      { label: 'Vendor Statement',     to: '/purchases/vendor-statement' },
      { label: 'Farm Expenses',        to: '/expenses' },
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
    label: 'Help & Guide', icon: <BookOpen size={18}/>,
    roles: ['admin','management','accounts','site_manager','viewer'],
    to: '/help',
  },
  {
    label: 'Admin Centre', icon: <Shield size={18}/>,
    roles: ['admin'],
    children: [
      { label: 'Setup Overview',          to: '/admin' },
      { label: 'Masters',                 to: '/admin?tab=masters' },
      { label: 'Flock–Shed Assignment',   to: '/admin?tab=flocks' },
      { label: 'Electricity Allocation',  to: '/admin?tab=electricity' },
      { label: 'Salary Allocation',       to: '/admin?tab=salary' },
      { label: 'User Management',         to: '/admin/users' },
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

function filterNav(nav: NavItem[], role: Role): NavItem[] {
  return nav.filter(item => {
    if (item.roles && !item.roles.includes(role)) return false
    if (item.hideRoles && item.hideRoles.includes(role)) return false
    return true
  })
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

export const AppLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { profile, signOut } = useAuth()

  const role = profile?.role ?? 'viewer'
  const visibleNav = filterNav(NAV, role)

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside className={`
        hidden lg:flex flex-col transition-all duration-200
        ${sidebarOpen ? 'w-64' : 'w-16'}
      `} style={{ background: 'linear-gradient(180deg,#1a5c38 0%,#14532d 60%,#0f3d22 100%)' }}>

        <style>{`
          @keyframes sbBob { 0%,100%{transform:translateY(0) rotate(-3deg)} 50%{transform:translateY(-5px) rotate(3deg)} }
          .sb-bird { animation: sbBob 2s ease-in-out infinite; }
        `}</style>

        {/* Logo + Bird */}
        <div className={`flex items-center border-b border-green-800/40 shrink-0 ${sidebarOpen ? 'h-24 px-4 gap-3' : 'h-16 justify-center'}`}>
          {sidebarOpen ? (
            <>
              <div className="sb-bird shrink-0">
                <svg viewBox="0 0 100 110" xmlns="http://www.w3.org/2000/svg" width="46" height="50">
                  <path d="M72 55 Q85 35 82 55 Q80 42 74 55Z" fill="#2d8f2d"/>
                  <path d="M74 60 Q90 42 86 60 Q84 48 76 60Z" fill="#1a6e1a"/>
                  <ellipse cx="52" cy="68" rx="24" ry="19" fill="#c07c2a"/>
                  <ellipse cx="50" cy="70" rx="18" ry="12" fill="#a86820"/>
                  <ellipse cx="36" cy="56" rx="9" ry="13" fill="#c07c2a"/>
                  <circle cx="30" cy="44" r="15" fill="#d4902e"/>
                  <path d="M23 30 Q25 23 28 30 Q30 22 33 30 Q36 25 38 31" stroke="#e53e3e" strokeWidth="3.5" fill="none" strokeLinecap="round"/>
                  <path d="M22 48 Q18 52 20 57 Q24 60 26 55 Q25 52 22 48Z" fill="#e53e3e"/>
                  <circle cx="25" cy="41" r="4.5" fill="white"/>
                  <circle cx="24" cy="40.5" r="2.5" fill="#1a1a1a"/>
                  <circle cx="23" cy="39.5" r="1" fill="white"/>
                  <path d="M16 43 L10 46 L16 49Z" fill="#f0a830"/>
                  <line x1="46" y1="86" x2="42" y2="100" stroke="#f0a830" strokeWidth="4" strokeLinecap="round"/>
                  <line x1="56" y1="86" x2="60" y2="100" stroke="#f0a830" strokeWidth="4" strokeLinecap="round"/>
                </svg>
              </div>
              <div>
                <p className="font-extrabold text-sm text-white leading-tight">Naraendra Farms</p>
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
              <div className="sb-bird">
                <svg viewBox="0 0 100 110" xmlns="http://www.w3.org/2000/svg" width="28" height="30">
                  <ellipse cx="52" cy="68" rx="24" ry="19" fill="#c07c2a"/>
                  <ellipse cx="36" cy="56" rx="9" ry="13" fill="#c07c2a"/>
                  <circle cx="30" cy="44" r="15" fill="#d4902e"/>
                  <path d="M23 30 Q25 23 28 30 Q30 22 33 30 Q36 25 38 31" stroke="#e53e3e" strokeWidth="3.5" fill="none" strokeLinecap="round"/>
                  <path d="M22 48 Q18 52 20 57 Q24 60 26 55Z" fill="#e53e3e"/>
                  <circle cx="25" cy="41" r="4" fill="white"/>
                  <circle cx="24" cy="40.5" r="2" fill="#1a1a1a"/>
                  <path d="M16 43 L10 46 L16 49Z" fill="#f0a830"/>
                </svg>
              </div>
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
              <div style={{ animation: 'sbBob 2s ease-in-out infinite' }}>
                <svg viewBox="0 0 100 110" xmlns="http://www.w3.org/2000/svg" width="38" height="42">
                  <path d="M72 55 Q85 35 82 55 Q80 42 74 55Z" fill="#2d8f2d"/>
                  <ellipse cx="52" cy="68" rx="24" ry="19" fill="#c07c2a"/>
                  <ellipse cx="50" cy="70" rx="18" ry="12" fill="#a86820"/>
                  <ellipse cx="36" cy="56" rx="9" ry="13" fill="#c07c2a"/>
                  <circle cx="30" cy="44" r="15" fill="#d4902e"/>
                  <path d="M23 30 Q25 23 28 30 Q30 22 33 30 Q36 25 38 31" stroke="#e53e3e" strokeWidth="3.5" fill="none" strokeLinecap="round"/>
                  <path d="M22 48 Q18 52 20 57 Q24 60 26 55Z" fill="#e53e3e"/>
                  <circle cx="25" cy="41" r="4.5" fill="white"/>
                  <circle cx="24" cy="40.5" r="2.5" fill="#1a1a1a"/>
                  <path d="M16 43 L10 46 L16 49Z" fill="#f0a830"/>
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-extrabold text-sm text-white">Naraendra Farms</p>
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
          <div className="flex-1" />
          <span className="text-xs text-gray-400 hidden sm:block">
            {new Date().toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', weekday:'long', day:'2-digit', month:'long', year:'numeric' })}
          </span>
        </header>
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <ErrorBoundary key={location.pathname}>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  )
}
