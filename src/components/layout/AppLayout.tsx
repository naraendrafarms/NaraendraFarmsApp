import React, { useState } from 'react'
import { Link, useLocation, Outlet, Navigate } from 'react-router-dom'
import {
  LayoutDashboard, Bird, Factory, Zap, Users, Settings,
  ChevronDown, ChevronRight, LogOut, Menu, X,
  BarChart2, Database, Shield
} from 'lucide-react'
import { useAuth, can, type Role } from '@/lib/auth'

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
    label: 'Flocks', icon: <Bird size={18}/>,
    children: [
      { label: 'All Flocks',     to: '/flocks' },
      { label: 'Add New Flock',  to: '/flocks/new' },
      { label: 'Daily Entry',    to: '/flocks/daily' },
      { label: 'HE Dispatch',    to: '/flocks/he-dispatch' },
      { label: 'NHE Sales',      to: '/flocks/nhe-sales' },
      { label: 'Medicine Entry', to: '/flocks/medicine' },
    ]
  },
  {
    label: 'Feed Mill', icon: <Factory size={18}/>,
    children: [
      { label: 'Feed Dashboard',  to: '/feed' },
      { label: 'GRN Entry',       to: '/feed/grn' },
      { label: 'Feed Production', to: '/feed/production' },
      { label: 'Feed Transfer',   to: '/feed/transfer' },
      { label: 'Stock Status',    to: '/feed/stock' },
    ]
  },
  {
    label: 'Electricity', icon: <Zap size={18}/>,
    children: [
      { label: 'Bills Entry', to: '/electricity' },
      { label: 'Allocation',  to: '/electricity/allocation' },
      { label: 'History',     to: '/electricity/history' },
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
    ]
  },
  {
    label: 'Masters', icon: <Settings size={18}/>,
    roles: ['admin', 'accounts'],
    children: [
      { label: 'Farm / Sites',        to: '/masters/farms' },
      { label: 'Sheds',               to: '/masters/sheds' },
      { label: 'Feed Ingredients',    to: '/masters/ingredients' },
      { label: 'Feed Types',          to: '/masters/feed-types' },
      { label: 'Parties',             to: '/masters/parties' },
      { label: 'Hatcheries',          to: '/masters/hatcheries' },
      { label: 'Medicines',           to: '/masters/medicines' },
      { label: 'Electricity Meters',  to: '/masters/meters' },
    ]
  },
  {
    label: 'Reports', icon: <BarChart2 size={18}/>,
    children: [
      { label: 'Hatchability',       to: '/hatchability' },
      { label: 'Flock P&L',         to: '/reports/pl' },
      { label: 'Production Report',  to: '/reports/production' },
      { label: 'Feed Cost Report',   to: '/reports/feed' },
      { label: 'Salary Report',      to: '/reports/salary' },
      { label: 'Export to Excel',    to: '/reports/export' },
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
    ]
  },
  {
    label: 'User Management', icon: <Shield size={18}/>,
    roles: ['admin'],
    to: '/admin/users',
  },
]

const ROLE_LABELS: Record<Role, string> = {
  admin:         'Administrator',
  accounts:      'Accounts',
  site_manager:  'Site Manager',
  site_incharge: 'Site Incharge',
  viewer:        'Viewer',
}
const ROLE_COLORS: Record<Role, string> = {
  admin:         'bg-red-100 text-red-700',
  accounts:      'bg-blue-100 text-blue-700',
  site_manager:  'bg-purple-100 text-purple-700',
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
  const [open, setOpen] = useState(() =>
    item.children?.some(c => location.pathname.startsWith(c.to)) ?? false
  )

  if (!item.children) {
    const active = location.pathname === item.to
    return (
      <Link to={item.to!}
        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
          ${active ? 'bg-brand-600 text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}
      >
        {item.icon}
        {!collapsed && item.label}
      </Link>
    )
  }

  const anyActive = item.children.some(c => location.pathname.startsWith(c.to))

  return (
    <div>
      <button onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium
          transition-colors ${anyActive ? 'text-brand-700 bg-brand-50' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}
      >
        <span className="flex items-center gap-3">{item.icon}{!collapsed && item.label}</span>
        {!collapsed && (open ? <ChevronDown size={14}/> : <ChevronRight size={14}/>)}
      </button>
      {open && !collapsed && (
        <div className="ml-7 mt-1 flex flex-col gap-0.5">
          {item.children.map(c => {
            const active = location.pathname === c.to
            return (
              <Link key={c.to} to={c.to}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors
                  ${active ? 'text-brand-700 font-medium bg-brand-50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}
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
        hidden lg:flex flex-col bg-white border-r border-gray-100 transition-all duration-200
        ${sidebarOpen ? 'w-60' : 'w-16'}
      `}>
        {/* Logo */}
        <div className="flex items-center justify-between h-14 px-4 border-b border-gray-100 shrink-0">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-brand-600 rounded-lg flex items-center justify-center">
                <Bird size={14} className="text-white" />
              </div>
              <div>
                <p className="font-bold text-xs text-gray-900 leading-tight">Naraendra Farms</p>
                <p className="text-[10px] text-gray-400">Broiler Breeder</p>
              </div>
            </div>
          )}
          <button onClick={() => setSidebarOpen(o => !o)}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors ml-auto">
            <Menu size={16} className="text-gray-500" />
          </button>
        </div>

        {/* Role badge */}
        {sidebarOpen && profile && (
          <div className="px-3 pt-3">
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${ROLE_COLORS[role]}`}>
              {ROLE_LABELS[role]}
            </span>
            {profile.farm_id && role === 'site_incharge' && (
              <span className="ml-1 text-[10px] text-gray-400">• Site only</span>
            )}
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-1">
          {visibleNav.map(item => (
            <NavLink key={item.label} item={item} collapsed={!sidebarOpen} />
          ))}
        </nav>

        {/* User */}
        <div className="px-3 py-3 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center text-xs font-bold text-brand-700 shrink-0">
              {profile?.full_name?.[0]?.toUpperCase() ?? 'U'}
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-900 truncate">{profile?.full_name ?? 'User'}</p>
                <p className="text-[10px] text-gray-400 truncate">{ROLE_LABELS[role]}</p>
              </div>
            )}
            {sidebarOpen && (
              <button onClick={signOut} title="Sign out" className="p-1 rounded hover:bg-gray-100 transition-colors">
                <LogOut size={14} className="text-gray-400" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-64 h-full bg-white border-r border-gray-100 flex flex-col">
            <div className="flex items-center justify-between h-14 px-4 border-b border-gray-100">
              <span className="font-bold text-sm">Naraendra Farms</span>
              <button onClick={() => setMobileOpen(false)}><X size={16} /></button>
            </div>
            {profile && (
              <div className="px-3 pt-3">
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${ROLE_COLORS[role]}`}>
                  {ROLE_LABELS[role]}
                </span>
              </div>
            )}
            <nav className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-1">
              {visibleNav.map(item => <NavLink key={item.label} item={item} collapsed={false} />)}
            </nav>
            <div className="px-3 py-3 border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs text-gray-700">{profile?.full_name}</span>
              <button onClick={signOut}><LogOut size={14} className="text-gray-400" /></button>
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
            {new Date().toLocaleDateString('en-IN', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}
          </span>
        </header>
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
