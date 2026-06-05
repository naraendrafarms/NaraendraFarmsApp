import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { User, Session } from '@supabase/supabase-js'

interface Profile {
  id: string
  full_name?: string
  role: 'admin' | 'manager' | 'supervisor' | 'data_entry' | 'viewer'
  farm_id?: string
  is_active: boolean
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
      set({ user: session?.user ?? null, session })
      if (session?.user) await get().loadProfile(session.user.id)
      else set({ profile: null })
    })
  },

  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return error.message
    if (data.user) await get().loadProfile(data.user.id)
    return null
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
    if (data) set({ profile: data })
  }
}))
