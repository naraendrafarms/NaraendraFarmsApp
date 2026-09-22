import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { User, Session } from '@supabase/supabase-js'
import type { ModuleKey } from '@/lib/modules'

export type PermLevel = 'hidden' | 'read_only' | 'full'

// 'shed_supervisor' was added to the database role list in migration 640 but
// never to this type, so the app could not refer to a role its own database
// already accepts. Kept in step with the profiles.role CHECK constraint.
export type Role =
  | 'admin' | 'management' | 'accounts' | 'site_manager' | 'site_incharge'
  | 'viewer' | 'shed_supervisor'
  // Added by migration 1348 - the seven a breeder farm needs that the app did
  // not have. Their module rows were seeded first, deliberately, so nobody
  // working was disturbed; until this type listed them the Admin Centre
  // dropdown could not offer them and no user could hold one.
  | 'doctor' | 'hatchery_manager' | 'feed_mill_manager' | 'store_keeper'
  | 'purchase_officer' | 'hr_officer' | 'auditor'

// The roles that may ENTER data. Auditor is deliberately absent: an auditor
// reads the books, it does not write them.
const ENTRY_ROLES: Role[] = ['admin', 'accounts', 'site_manager', 'site_incharge',
  'doctor', 'hatchery_manager', 'feed_mill_manager', 'store_keeper',
  'purchase_officer', 'hr_officer']

export interface Profile {
  id: string
  full_name?: string
  role: Role
  farm_id?: string | null   // set for site_incharge only
  is_active: boolean
}

// ── Permission helpers ────────────────────────────────────────────
export const can = {
  // Can enter data (create/update records)
  enterData: (r?: Role) => !!r && ENTRY_ROLES.includes(r),

  // Can see salary / employee / financial data
  // The auditor is here because auditing IS reading the financials. It is the
  // only one of the seven new roles with any financial sight at all.
  viewFinancial: (r?: Role) =>
    r === 'admin' || r === 'accounts' || r === 'management' || r === 'auditor',

  // Can see Purchase Orders and Payments pages
  viewPurchase: (r?: Role) =>
    r === 'admin' || r === 'accounts' || r === 'management'
    || r === 'purchase_officer' || r === 'auditor',

  // Can add/edit Purchase Orders and Payments
  // purchase_officer raises intents and POs. They do NOT approve payments and
  // do NOT see the bank ledger - separating those two is the entire reason
  // this role exists instead of handing someone the accounts role.
  editPurchase: (r?: Role) =>
    r === 'admin' || r === 'accounts' || r === 'purchase_officer',

  // Can view Bank Ledger (sensitive — bank balances)
  // Auditor only, and only because migration 1348 already grants it
  // accounts=read_only - a module grant the page then refused would be two
  // permission systems disagreeing, which is the bug class that put company
  // revenue on a shed supervisor's dashboard. NOT purchase_officer.
  viewBankLedger: (r?: Role) =>
    r === 'admin' || r === 'accounts' || r === 'auditor',

  // Can approve / mark payments as Paid
  // Deliberately unchanged. No new role approves a payment - least of all
  // purchase_officer, who raises the order in the first place.
  approvePayment: (r?: Role) =>
    r === 'admin' || r === 'accounts',

  // Can see all sites (not limited to one farm)
  // Only site_incharge and shed_supervisor are scoped to one place; none of
  // the seven new roles is.
  viewAllSites: (r?: Role) =>
    !!r && r !== 'site_incharge' && r !== 'shed_supervisor',

  // Can manage master data (farms, ingredients, parties etc.)
  manageMasters: (r?: Role) =>
    r === 'admin' || r === 'accounts',

  // Can import from Excel
  importData: (r?: Role) =>
    r === 'admin' || r === 'accounts',

  // Can manage users (create/edit user accounts)
  manageUsers: (r?: Role) =>
    r === 'admin',

  // Can delete records
  delete: (r?: Role) =>
    r === 'admin' || r === 'accounts',

  // Can see/enter Planning (Flock Cost Projection, Quarterly Budget) — admin
  // only for now; extend this single check later if a partner/CA needs it.
  // The "extend this later if a partner/CA needs it" note above was written
  // for exactly this: the auditor holds planning=read_only in 1348, so the
  // check has to agree with the grant.
  viewPlanning: (r?: Role) =>
    r === 'admin' || r === 'auditor',
}

interface AuthState {
  user: User | null
  session: Session | null
  profile: Profile | null
  loading: boolean
  // module_key -> level for the CURRENT profile's role. Admin never reads
  // this map (see hasModule below) — it's fail-safe by construction, not by
  // what happens to be seeded here.
  permissions: Record<string, PermLevel>
  permissionsLoaded: boolean
  signIn: (email: string, password: string) => Promise<string | null>
  signOut: () => Promise<void>
  loadProfile: (userId: string) => Promise<void>
  init: () => Promise<void>
}

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  profile: null,
  loading: true,
  permissions: {},
  permissionsLoaded: false,

  init: async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      set({ user: session.user, session })
      await get().loadProfile(session.user.id)
    }
    set({ loading: false })

    supabase.auth.onAuthStateChange(async (event, session) => {
      // Supabase silently refreshes the JWT whenever the tab regains focus
      // (e.g. Alt+Tab back to the browser) — that fires TOKEN_REFRESHED, not a
      // real sign-in. Treating it like a full login re-fetched the profile and
      // replaced global state on every focus, cascading into a full re-render
      // of every page (looked like the app was "auto refreshing"). Only do the
      // full reload on an actual sign-in/out; just keep the session current
      // otherwise.
      if (event === 'TOKEN_REFRESHED') {
        set({ session })
        return
      }
      set({ user: session?.user ?? null, session })
      if (session?.user) await get().loadProfile(session.user.id)
      else set({ profile: null })
    })
  },

  signIn: async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) return error.message
      if (data.user) await get().loadProfile(data.user.id).catch(() => {})
      return null
    } catch (e: any) {
      return e?.message ?? 'Login failed'
    }
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ user: null, session: null, profile: null })
  },

  loadProfile: async (userId) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    if (data) {
      set({ profile: data as Profile })
      // Admin is hardcoded full everywhere (see hasModule) and never needs
      // this fetch — skip it so a role_permissions outage can never affect
      // the one role that must always be able to reach the fix-it page.
      if ((data as Profile).role !== 'admin') {
        const { data: perms, error } = await supabase
          .from('role_permissions')
          .select('module_key,level')
          .eq('role', (data as Profile).role)
        if (!error && perms) {
          const map: Record<string, PermLevel> = {}
          for (const p of perms) map[p.module_key] = p.level as PermLevel
          set({ permissions: map, permissionsLoaded: true })
        } else {
          // Fetch failed — fail CLOSED (empty map = every module reads as
          // 'hidden' below), never fail open.
          set({ permissions: {}, permissionsLoaded: true })
        }
      } else {
        set({ permissions: {}, permissionsLoaded: true })
      }
    }
  }
}))

// Resolves whether the CURRENT signed-in user can reach a module at all
// (level !== 'hidden'). Admin short-circuits to true before any lookup —
// this is the fail-safe the whole design depends on, so it must stay a
// hardcoded role check, never a table read.
export function hasModule(moduleKey: ModuleKey | null): boolean {
  if (!moduleKey) return true // ungated pages (help/chat/tasks) — always visible
  const { profile, permissions } = useAuth.getState()
  if (profile?.role === 'admin') return true
  return (permissions[moduleKey] ?? 'hidden') !== 'hidden'
}

// Whether the module is Full (can enter/edit) vs Read-only vs Hidden.
// Pages can use this to disable Save/Add/Edit/Delete controls — wiring that
// into individual forms is a follow-up; this returns the raw level so a
// page-wide "read-only banner + disabled buttons" pattern can be added
// incrementally without another schema change.
export function moduleLevel(moduleKey: ModuleKey | null): PermLevel {
  if (!moduleKey) return 'full'
  const { profile, permissions } = useAuth.getState()
  if (profile?.role === 'admin') return 'full'
  return permissions[moduleKey] ?? 'hidden'
}
