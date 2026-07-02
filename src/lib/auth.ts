import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { User, Session } from '@supabase/supabase-js'

export type Role = 'admin' | 'management' | 'accounts' | 'site_manager' | 'site_incharge' | 'viewer'

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
  enterData: (r?: Role) =>
    r === 'admin' || r === 'accounts' || r === 'site_manager' || r === 'site_incharge',

  // Can see salary / employee / financial data
  viewFinancial: (r?: Role) =>
    r === 'admin' || r === 'accounts' || r === 'management',

  // Can see Purchase Orders and Payments pages
  viewPurchase: (r?: Role) =>
    r === 'admin' || r === 'accounts' || r === 'management',

  // Can add/edit Purchase Orders and Payments
  editPurchase: (r?: Role) =>
    r === 'admin' || r === 'accounts',

  // Can view Bank Ledger (sensitive — bank balances)
  viewBankLedger: (r?: Role) =>
    r === 'admin' || r === 'accounts',

  // Can approve / mark payments as Paid
  approvePayment: (r?: Role) =>
    r === 'admin' || r === 'accounts',

  // Can see all sites (not limited to one farm)
  viewAllSites: (r?: Role) =>
    r === 'admin' || r === 'accounts' || r === 'site_manager' || r === 'viewer' || r === 'management',

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
}

interface AuthState {
  user: User | null
  session: Session | null
  profile: Profile | null
  loading: boolean
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
    if (data) set({ profile: data as Profile })
  }
}))
