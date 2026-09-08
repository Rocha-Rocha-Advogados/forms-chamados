import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/** Falso quando o .env ainda não foi preenchido — a UI avisa em vez de quebrar. */
export const supabaseConfigured = Boolean(url && anonKey)

export const requireAuth = import.meta.env.VITE_REQUIRE_AUTH !== 'false'

export const supabase = createClient(
  url || 'https://placeholder.supabase.co',
  anonKey || 'placeholder-anon-key',
  { auth: { persistSession: true, autoRefreshToken: true } },
)
