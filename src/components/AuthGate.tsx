import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { equipeEmail, supabaseConfigured } from '../lib/supabase'
import { ErrorBanner, Field, Spinner, TextInput } from './ui'

/**
 * Portão dos painéis internos: uma senha só, compartilhada pela equipe.
 *
 * Por baixo, a senha entra numa conta única do Supabase Auth — e não numa
 * comparação aqui no navegador. A diferença importa: comparando aqui, a senha
 * viajaria dentro do JavaScript da página e o RLS teria de liberar leitura
 * para a chave anônima, ou seja, qualquer pessoa com o endereço leria os
 * chamados de todo mundo. Assim, sem a senha certa não sai sessão, e sem
 * sessão o banco não devolve nada.
 */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const { session, loading, signIn } = useAuth()
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  if (!supabaseConfigured)
    return (
      <div className="grid min-h-screen place-items-center px-4">
        <div className="card w-full max-w-[520px] p-6">
          <p className="text-[12px] font-semibold tracking-wide uppercase" style={{ color: 'var(--series-1)' }}>
            Rocha &amp; Rocha
          </p>
          <h1 className="mt-1 mb-4 text-[19px] font-semibold">Falta configurar o Supabase</h1>
          <ErrorBanner message="Preencha VITE_SUPABASE_ANON_KEY no arquivo .env e reinicie o servidor (npm run dev)." />
          <ol className="mt-4 grid gap-1.5 text-[13px] text-ink-2">
            <li>1. Supabase → Project Settings → API Keys → copie a chave <strong>anon public</strong>.</li>
            <li>2. Cole no <code>.env</code> em <code>VITE_SUPABASE_ANON_KEY</code>.</li>
            <li>3. Rode <code>supabase/schema.sql</code> no SQL Editor, se ainda não rodou.</li>
          </ol>
        </div>
      </div>
    )

  if (loading) return <Spinner label="Verificando acesso…" />
  if (session) return <>{children}</>

  const entrar = async (e: React.FormEvent) => {
    e.preventDefault()
    setEnviando(true)
    setErro(null)
    const { error } = await signIn(equipeEmail, senha)
    if (error) {
      setErro(
        error.message === 'Invalid login credentials'
          ? 'Senha incorreta.'
          : error.message === 'Email not confirmed'
            ? 'A conta da equipe ainda não foi confirmada no Supabase.'
            : error.message,
      )
      setSenha('')
    }
    setEnviando(false)
  }

  return (
    <div className="grid min-h-screen place-items-center px-4">
      <form onSubmit={entrar} className="card w-full max-w-[360px] p-6">
        <p className="text-[12px] font-semibold tracking-wide uppercase" style={{ color: 'var(--series-1)' }}>
          Rocha &amp; Rocha
        </p>
        <h1 className="mt-1 text-[19px] font-semibold">Painéis internos</h1>
        <p className="mt-1 mb-5 text-[12.5px] text-ink-2">Área da equipe de TI. Informe a senha de acesso.</p>

        <Field label="Senha de acesso" required>
          <TextInput
            type="password"
            autoComplete="current-password"
            autoFocus
            required
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            aria-invalid={Boolean(erro)}
          />
        </Field>

        {erro && (
          <p className="mt-3 text-[12.5px]" style={{ color: 'var(--critical)' }} aria-live="polite">
            ⚠ {erro}
          </p>
        )}

        <button type="submit" className="btn btn-primary mt-5 w-full" disabled={enviando || !senha}>
          {enviando ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </div>
  )
}
