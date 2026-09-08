import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { requireAuth, supabaseConfigured } from '../lib/supabase'
import { ErrorBanner, Field, Spinner, TextInput } from './ui'

/** Protege os painéis internos. O formulário público fica fora daqui. */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const { session, loading, signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  if (!requireAuth) return <>{children}</>
  if (!supabaseConfigured)
    return (
      <div className="grid min-h-screen place-items-center px-4">
        <div className="card w-full max-w-[520px] p-6">
          <p className="text-[12px] font-semibold tracking-wide uppercase" style={{ color: 'var(--brand-2)' }}>
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
    const { error } = await signIn(email.trim(), senha)
    if (error) setErro(error.message === 'Invalid login credentials' ? 'E-mail ou senha incorretos.' : error.message)
    setEnviando(false)
  }

  return (
    <div className="grid min-h-screen place-items-center px-4">
      <form onSubmit={entrar} className="card w-full max-w-[380px] p-6">
        <p className="text-[12px] font-semibold tracking-wide uppercase" style={{ color: 'var(--brand-2)' }}>
          Rocha &amp; Rocha
        </p>
        <h1 className="mt-1 text-[19px] font-semibold">Acesso aos painéis</h1>
        <p className="mt-1 mb-5 text-[12.5px] text-ink-2">
          Uso interno da equipe de TI. O formulário de chamados é público e não exige login.
        </p>

        <div className="grid gap-3.5">
          <Field label="E-mail" required>
            <TextInput
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nome@rocharocha.adv.br"
            />
          </Field>
          <Field label="Senha" required>
            <TextInput
              type="password"
              autoComplete="current-password"
              required
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
            />
          </Field>
        </div>

        {erro && (
          <p className="mt-3 text-[12.5px]" style={{ color: 'var(--critical)' }}>
            ⚠ {erro}
          </p>
        )}

        <button type="submit" className="btn btn-primary mt-5 w-full" disabled={enviando}>
          {enviando ? 'Entrando…' : 'Entrar'}
        </button>
        <p className="mt-3 text-[11.5px] text-muted">
          Os usuários são criados em Supabase → Authentication → Users.
        </p>
      </form>
    </div>
  )
}
