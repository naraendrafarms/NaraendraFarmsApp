/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string || ''
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string || ''
const serviceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY as string || ''

export const supabase = createClient(
  url || 'https://placeholder.supabase.co',
  key || 'placeholder-key',
  { auth: { persistSession: true, autoRefreshToken: true } }
)

// Admin client — used only for user management (create/update auth users)
export const supabaseAdmin = createClient(
  url || 'https://placeholder.supabase.co',
  serviceKey || key || 'placeholder-key',
  { auth: { persistSession: false, autoRefreshToken: false, storageKey: 'sb-admin-auth-token' } }
)

export const isConfigured = () => Boolean(url && key)
export type DB = typeof supabase
