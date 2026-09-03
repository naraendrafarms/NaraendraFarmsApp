// Module-level page access control — the ~100 routes in App.tsx are grouped
// into these ~15 modules rather than gated one-by-one (see session design
// discussion). Keys are stable strings stored in the DB (role_permissions
// table, migration 514) — renaming a label here must never change a key.
export type ModuleKey =
  | 'dashboard' | 'flock_ops' | 'feed_mill' | 'electricity' | 'purchase'
  | 'inventory' | 'attendance' | 'payroll' | 'masters' | 'reports_ops'
  | 'reports_financial' | 'accounts' | 'vhl' | 'planning' | 'admin'
  | 'line_master'
  | 'line_entry'

export const MODULES: { key: ModuleKey; label: string }[] = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'flock_ops', label: 'Flock Management' },
  { key: 'feed_mill', label: 'Feed Mill' },
  { key: 'electricity', label: 'Electricity' },
  { key: 'purchase', label: 'Purchase (Intent/PO/GRN/Payments)' },
  { key: 'inventory', label: 'Inventory' },
  { key: 'attendance', label: 'Attendance' },
  { key: 'payroll', label: 'Employees / Payroll' },
  { key: 'masters', label: 'Masters & Import' },
  { key: 'reports_ops', label: 'Reports — Operational' },
  { key: 'reports_financial', label: 'Reports — Financial' },
  { key: 'accounts', label: 'Accounts' },
  { key: 'vhl', label: 'VHL' },
  { key: 'planning', label: 'Planning' },
  { key: 'admin', label: 'Admin' },
  // Sits under the Masters tab but carries its own access rule: admin edits,
  // shed supervisor / site manager / site incharge view. Folding it into
  // 'masters' would have handed those roles edit rights, since they hold
  // 'full' there (migration 1127 checked this against the live table).
  { key: 'line_master', label: 'Line Master (shed lines)' },
  { key: 'line_entry', label: 'Line Daily Entry (eggs, mortality, feed)' },
]

// Longest-prefix match against the current route path (no leading slash,
// matching how react-router's relative child paths are defined in App.tsx).
// Paths not listed here (help/chat/tasks) are intentionally ungated —
// always visible to every logged-in role.
export const ROUTE_MODULES: Record<string, ModuleKey> = {
  '': 'dashboard',

  'flocks': 'flock_ops',
  'flock': 'flock_ops',
  'hatchability': 'flock_ops',
  'expenses': 'accounts',
  'bags': 'inventory',
  'generators': 'electricity',

  'feed': 'feed_mill',
  'electricity': 'electricity',

  'purchase': 'purchase',
  'purchases': 'purchase',
  'purchase-orders': 'purchase',
  'procurement': 'purchase',
  'pending-payments': 'purchase',

  'inventory': 'inventory',

  'employees': 'payroll',
  // Attendance sub-routes override the payroll default below (more specific
  // prefix wins) — see resolveModuleForPath().
  'employees/attendance': 'attendance',
  'employees/attendance-daily': 'attendance',
  'employees/attendance-month': 'attendance',
  'employees/monthly-attendance': 'attendance',

  'masters': 'masters',
  'import': 'masters',
  // More specific prefix than 'masters', so longest-prefix wins and this page
  // is gated by line_master rather than by Masters as a whole.
  'masters/lines': 'line_master',
  // Longest prefix wins, so this beats the general 'flocks' mapping and a shed
  // supervisor reaches line entry without gaining any other flock screen.
  'flocks/line-daily': 'line_entry',
  'reports/lines': 'line_entry',

  'reports/pl': 'reports_financial',
  'reports/costs': 'reports_financial',
  'reports/electricity': 'reports_financial',
  'reports/salary-analysis': 'reports_financial',
  'reports/salary': 'reports_financial',
  'reports/export': 'reports_financial',
  'reports/party-outstanding': 'reports_financial',
  'reports/company-pl': 'reports_financial',
  'reports/gst': 'reports_financial',
  'reports/tds-receivable': 'reports_financial',
  'reports/tds-payable': 'reports_financial',
  'reports/flock-pl-summary': 'reports_financial',
  'reports/site-invoice': 'reports_financial',
  'reports/production': 'reports_ops',
  'reports/feed': 'reports_ops',
  'reports/egg-stock': 'reports_ops',
  'reports/shed-day': 'reports_ops',
  'reports/stock-statement': 'reports_ops',
  'reports/daily-summary': 'reports_ops',
  'reports/bird-sales': 'reports_ops',

  'accounts': 'accounts',

  'vhl': 'vhl',

  'planning': 'planning',

  'admin': 'admin',
}

// Longest matching path prefix wins, so 'employees/attendance-daily' beats
// the plain 'employees' entry above.
export function resolveModuleForPath(pathname: string): ModuleKey | null {
  const clean = pathname.replace(/^\/+/, '').replace(/\/+$/, '')
  let best: string | null = null
  for (const key of Object.keys(ROUTE_MODULES)) {
    if (clean === key || clean.startsWith(key + '/')) {
      if (best === null || key.length > best.length) best = key
    }
  }
  return best !== null ? ROUTE_MODULES[best] : null
}
