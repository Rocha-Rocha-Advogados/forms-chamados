import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CapaPublica } from '../components/CapaPublica'
import { Badge, ErrorBanner, Field, Spinner, TextInput } from '../components/ui'
import { DOMINIO, useIdentificacao } from '../hooks/useIdentificacao'
import { supabase, supabaseConfigured } from '../lib/supabase'
import { URGENCIA_COLOR, URGENCIA_ICON } from '../lib/options'
import { fmtDateTime } from '../lib/utils'

/** O que a função meus_chamados devolve — sem as observações internas da triagem. */
type MeuChamado = {
  id: string
  created_at: string
  natureza: string
  equipamento: string | null
  sistema: string | null
  descricao: string
  urgencia: string
  encaminhado_para: string | null
  responsavel_atendimento: string | null
  triagem: boolean
  resolvido: boolean
  resolvido_em: string | null
}

export function MeusChamadosPage() {
  const { email, identificar, sair } = useIdentificacao()
  const navegar = useNavigate()

  const [rascunho, setRascunho] = useState('')
  const [erroEmail, setErroEmail] = useState<string | null>(null)

  const [chamados, setChamados] = useState<MeuChamado[]>([])
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const buscar = useCallback(async () => {
    if (!email) return
    if (!supabaseConfigured) {
      setErro('Supabase não configurado: preencha VITE_SUPABASE_ANON_KEY no arquivo .env.')
      return
    }
    setCarregando(true)
    const { data, error } = await supabase.rpc('meus_chamados', { p_email: email })
    if (error) setErro(error.message)
    else {
      setErro(null)
      setChamados((data ?? []) as MeuChamado[])
    }
    setCarregando(false)
  }, [email])

  useEffect(() => {
    void buscar()
  }, [buscar])

  const entrar = (e: React.FormEvent) => {
    e.preventDefault()
    if (!identificar(rascunho)) {
      setErroEmail(rascunho.trim() ? `Use seu e-mail @${DOMINIO}.` : 'Informe seu e-mail corporativo.')
      return
    }
    setErroEmail(null)
  }

  return (
    <CapaPublica
      titulo={
        <>
          Meus
          <br />
          chamados
        </>
      }
      subtitulo="Acompanhe o que você já pediu para a equipe de TI e abra novas solicitações."
    >
      {!email ? (
        <form onSubmit={entrar} className="card p-6">
          <h2 className="text-[17px] font-semibold">Entrar</h2>
          <p className="mt-1 mb-5 text-[13px] text-ink-2">
            Informe seu e-mail corporativo para ver seus chamados e abrir novos.
          </p>
          <Field label="E-mail corporativo" required error={erroEmail ?? undefined}>
            <TextInput
              type="email"
              autoFocus
              autoComplete="email"
              value={rascunho}
              onChange={(e) => setRascunho(e.target.value)}
              onFocus={() => setErroEmail(null)}
              aria-invalid={Boolean(erroEmail)}
              placeholder={`nome@${DOMINIO}`}
            />
          </Field>
          <button type="submit" className="btn btn-primary mt-5 w-full">
            Entrar
          </button>
        </form>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-[12.5px] text-ink-2">
              Você está como <strong className="font-medium text-ink">{email}</strong>{' '}
              <button
                type="button"
                onClick={sair}
                className="ml-1 underline decoration-[var(--line-strong)] hover:text-ink"
              >
                trocar
              </button>
            </p>
            <button type="button" className="btn btn-primary" onClick={() => navegar('/novo')}>
              ＋ Abrir chamado
            </button>
          </div>

          {erro && (
            <div className="mb-4">
              <ErrorBanner message={erro} onRetry={() => void buscar()} />
            </div>
          )}

          {carregando ? (
            <Spinner label="Buscando seus chamados…" />
          ) : chamados.length === 0 ? (
            <div className="card px-5 py-12 text-center">
              <p className="text-[14px] font-medium">Você ainda não abriu nenhum chamado.</p>
              <p className="mt-1 text-[12.5px] text-muted">
                Quando abrir, o andamento aparece aqui.
              </p>
            </div>
          ) : (
            <ul className="grid gap-3">
              {chamados.map((c) => (
                <li key={c.id} className="card p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[14px] font-semibold">
                        {c.natureza}
                        {(c.equipamento || c.sistema) && (
                          <span className="font-normal text-ink-2"> · {c.equipamento || c.sistema}</span>
                        )}
                      </p>
                      <p className="tnum mt-0.5 text-[12px] text-muted">Aberto em {fmtDateTime(c.created_at)}</p>
                    </div>
                    <Situacao chamado={c} />
                  </div>

                  <p className="mt-2.5 text-[13px] leading-relaxed whitespace-pre-line text-ink-2">{c.descricao}</p>

                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t pt-2.5 text-[12px] text-muted">
                    <span className="inline-flex items-center gap-1.5">
                      <span aria-hidden style={{ color: URGENCIA_COLOR[c.urgencia] }}>
                        {URGENCIA_ICON[c.urgencia]}
                      </span>
                      Urgência {c.urgencia.toLowerCase()}
                    </span>
                    {c.responsavel_atendimento && <span>Atendido por {c.responsavel_atendimento}</span>}
                    {c.resolvido && c.resolvido_em && <span>Resolvido em {fmtDateTime(c.resolvido_em)}</span>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </CapaPublica>
  )
}

function Situacao({ chamado }: { chamado: MeuChamado }) {
  if (chamado.resolvido)
    return (
      <Badge color="var(--good)" icon="✓">
        Resolvido
      </Badge>
    )
  if (chamado.triagem)
    return (
      <Badge color="var(--series-2)" icon="●">
        Em atendimento
      </Badge>
    )
  return (
    <Badge color="var(--warning)" icon="●">
      Aguardando triagem
    </Badge>
  )
}
