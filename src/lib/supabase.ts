import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/** Falso quando o .env ainda não foi preenchido — a UI avisa em vez de quebrar. */
export const supabaseConfigured = Boolean(url && anonKey)

export const requireAuth = import.meta.env.VITE_REQUIRE_AUTH !== 'false'

/**
 * Conta única do Supabase Auth usada pela equipe. Só o endereço mora aqui —
 * a senha é digitada por quem entra e nunca vai para o pacote publicado.
 */
export const equipeEmail = (import.meta.env.VITE_EQUIPE_EMAIL as string) || 'ti@rocharocha.adv.br'

export const supabase = createClient(
  url || 'https://placeholder.supabase.co',
  anonKey || 'placeholder-anon-key',
  { auth: { persistSession: true, autoRefreshToken: true } },
)
