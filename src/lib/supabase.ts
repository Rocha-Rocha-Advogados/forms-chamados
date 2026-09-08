import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/** Falso quando o .env ainda não foi preenchido — a UI avisa em vez de quebrar. */
export const supabaseConfigured = Boolean(url && anonKey)

/**
 * Conta única do Supabase Auth usada pela equipe. O endereço não é segredo
 * (identifica a conta, não autoriza nada), então fica fixo aqui em vez de no
 * .env: quem tem a rota do painel e a senha entra, e ponto. A senha é sempre
 * digitada e nunca vai para o pacote publicado.
 */
export const equipeEmail = 'programacao03@rocharocha.adv.br'

export const supabase = createClient(
  url || 'https://placeholder.supabase.co',
  anonKey || 'placeholder-anon-key',
  { auth: { persistSession: true, autoRefreshToken: true } },
)
