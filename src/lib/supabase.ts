/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string || ''
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string || ''

export const supabase = createClient(
  url || 'https://placeholder.supabase.co',
  key || 'placeholder-key',
  { auth: { persistSession: true, autoRefreshToken: true } }
)

export const isConfigured = () => Boolean(url && key)
export type DB = typeof supabase
