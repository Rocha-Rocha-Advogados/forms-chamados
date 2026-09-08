import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { requireAuth } from '../lib/supabase'
import { cn } from '../lib/utils'

const NAV = [
  { to: '/interno/chamados', label: 'Chamados', icon: '▤', hint: 'Planilha 1 · gráficos e filtros' },
  { to: '/interno/triagem', label: 'Triagem', icon: '⇄', hint: 'Planilha 2 · encaminhamento' },
  { to: '/interno/admissoes', label: 'Admissões', icon: '＋', hint: 'Checklist de entrada' },
  { to: '/interno/desligamentos', label: 'Desligamentos', icon: '－', hint: 'Checklist de saída' },
]

export function AppShell() {
  const { session, signOut } = useAuth()
  const [aberto, setAberto] = useState(false)

  return (
    <div className="flex min-h-screen">
      {/* ---------------------------------------------------------- lateral */}
      <aside
        className={cn(
          'no-print fixed inset-y-0 left-0 z-40 flex w-[236px] flex-col transition-transform lg:static lg:translate-x-0',
          aberto ? 'translate-x-0' : '-translate-x-full',
        )}
        style={{ background: 'var(--brand)', color: 'var(--brand-ink)' }}
      >
        <div className="px-5 pt-5 pb-4">
          <p className="text-[15px] font-semibold tracking-tight">ROCHA &amp; ROCHA</p>
          <p className="mt-0.5 text-[11.5px] opacity-70">Suporte Técnico · Painéis</p>
        </div>

        <nav className="flex flex-col gap-1 px-3">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setAberto(false)}
              className={({ isActive }) =>
                cn(
                  'rounded-lg px-3 py-2.5 transition-colors',
                  isActive ? 'bg-white/15' : 'hover:bg-white/8',
                )
              }
            >
              <span className="flex items-center gap-2.5 text-[13.5px] font-medium">
                <span aria-hidden className="w-4 text-center opacity-80">
                  {item.icon}
                </span>
                {item.label}
              </span>
              <span className="mt-0.5 block pl-6.5 text-[11px] opacity-60">{item.hint}</span>
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto border-t border-white/10 p-3">
          <NavLink
            to="/"
            className="block rounded-lg px-3 py-2 text-[12.5px] font-medium hover:bg-white/10"
            onClick={() => setAberto(false)}
          >
            ↗ Abrir formulário
          </NavLink>
          {requireAuth && session && (
            <button
              type="button"
              onClick={() => void signOut()}
              className="mt-1 block w-full rounded-lg px-3 py-2 text-left text-[12.5px] font-medium hover:bg-white/10"
            >
              ⏻ Sair
            </button>
          )}
        </div>
      </aside>

      {aberto && (
        <button
          type="button"
          aria-label="Fechar menu"
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setAberto(false)}
        />
      )}

      {/* --------------------------------------------------------- conteúdo */}
      <main className="min-w-0 flex-1">
        <button
          type="button"
          onClick={() => setAberto(true)}
          className="no-print btn btn-ghost m-3 lg:hidden"
          aria-label="Abrir menu"
        >
          ☰ Menu
        </button>
        <div className="mx-auto max-w-[1500px] px-4 pt-2 pb-10 lg:px-7 lg:pt-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export function PageHeader({
  title,
  subtitle,
  right,
}: {
  title: string
  subtitle?: string
  right?: React.ReactNode
}) {
  return (
    <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-[21px] font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-[13px] text-ink-2">{subtitle}</p>}
      </div>
      {right && <div className="no-print flex flex-wrap items-center gap-2">{right}</div>}
    </header>
  )
}
