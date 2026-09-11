import { useMemo, useState } from 'react'
import { PageHeader } from '../components/AppShell'
import { FiltroBar } from '../components/FiltroBar'
import { CellLong, CellText, TextoExpansivel } from '../components/cells'
import { GroupRow, Sheet, Td, Th, Tr } from '../components/Sheet'
import { Badge, Card, Check, EmptyState, ErrorBanner, SectionTitle, Spinner, StatTile } from '../components/ui'
import { useTable } from '../hooks/useTable'
import { useQuemSouEu } from '../hooks/useQuemSouEu'
import { DESTINOS, NATUREZAS, RESPONSAVEIS, URGENCIAS, URGENCIA_COLOR, URGENCIA_ICON } from '../lib/options'
import { FILTROS_VAZIOS, aplicarFiltros, opcoesDe, type Filtros } from '../lib/filtros'
import { baixarCsv, fmtDateTime, tempoDoChamado, toCsv } from '../lib/utils'
import type { Chamado } from '../lib/types'

const LISTA_DESTINOS = 'lista-destinos'
const LISTA_RESPONSAVEIS = 'lista-responsaveis'

export function TriagemPage() {
  const { rows, loading, refreshing, error, reload, update, remove } = useTable('chamados')
  const [filtros, setFiltros] = useState<Filtros>({ ...FILTROS_VAZIOS, periodo: 'all' })
  const [salvando, setSalvando] = useState<Set<string>>(new Set())
  const { quem, setQuem } = useQuemSouEu()

  const dados = useMemo(() => aplicarFiltros(rows, filtros), [rows, filtros])

  const destinos = useMemo(() => opcoesDe(rows, (c) => c.encaminhado_para, DESTINOS), [rows])
  const responsaveis = useMemo(() => opcoesDe(rows, (c) => c.responsavel_atendimento, RESPONSAVEIS), [rows])

  const marcar = (id: string, ativo: boolean) =>
    setSalvando((prev) => {
      const next = new Set(prev)
      if (ativo) next.add(id)
      else next.delete(id)
      return next
    })

  const salvar = async (id: string, patch: Partial<Chamado>) => {
    marcar(id, true)
    await update(id, patch)
    marcar(id, false)
  }

  const excluir = async (c: Chamado) => {
    const ok = window.confirm(
      `Excluir definitivamente o chamado de ${c.colaborador} (${fmtDateTime(c.created_at)})?\n\nEssa ação não pode ser desfeita.`,
    )
    if (ok) await remove(c.id)
  }

  const pendentes = dados.filter((c) => !c.triagem)
  const emAtendimento = dados.filter((c) => c.triagem && !c.resolvido)
  const semResponsavel = dados.filter((c) => !c.resolvido && !(c.responsavel_atendimento || '').trim())

  const exportar = () =>
    baixarCsv(
      'triagem',
      toCsv(
        [
          'Data/Hora',
          'Colaborador',
          'E-mail',
          'Urgência',
          'Encaminhado para',
          'Responsável pelo atendimento',
          'Nº do chamado',
          'Triagem',
          'Resolvido',
          'Tempo',
          'Observações',
        ],
        dados.map((c) => [
          fmtDateTime(c.created_at),
          c.colaborador,
          c.email,
          c.urgencia,
          c.encaminhado_para,
          c.responsavel_atendimento,
          c.numero_chamado,
          c.triagem,
          c.resolvido,
          tempoDoChamado(c),
          c.observacoes,
        ]),
      ),
    )

  return (
    <>
      <PageHeader
        title="Triagem e encaminhamento"
        subtitle="Planilha 2 — mesma base dos chamados, com as colunas de atendimento editáveis. Toda alteração salva na hora."
        right={
          <>
            <label className="flex items-center gap-2 text-[12.5px] text-ink-2">
              Você é
              <select
                className="field w-[136px]"
                value={quem}
                onChange={(e) => setQuem(e.target.value)}
                aria-label="Quem está usando o painel"
                style={{ color: quem ? undefined : 'var(--muted)' }}
                title="Usado para assinar quem resolveu o chamado"
              >
                <option value="">Selecione</option>
                {responsaveis.map((r) => (
                  <option key={r} value={r} style={{ color: 'var(--ink)' }}>
                    {r}
                  </option>
                ))}
              </select>
            </label>
            <button type="button" className="btn btn-ghost" onClick={() => void reload()} disabled={refreshing}>
              <span aria-hidden className={refreshing ? 'inline-block animate-spin' : undefined}>
                ↻
              </span>
              {refreshing ? 'Atualizando…' : 'Atualizar'}
            </button>
            <button type="button" className="btn btn-primary" onClick={exportar} disabled={!dados.length}>
              ↓ Exportar CSV
            </button>
          </>
        }
      />

      {error && (
        <div className="mb-4">
          <ErrorBanner message={error} onRetry={() => void reload()} />
        </div>
      )}

      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Na fila (sem triagem)" value={pendentes.length} accent="var(--warning)" icon="!" />
        <StatTile label="Em atendimento" value={emAtendimento.length} accent="var(--series-2)" icon="●" />
        <StatTile label="Sem responsável definido" value={semResponsavel.length} accent="var(--critical)" icon="●" />
        <StatTile label="Resolvidos" value={dados.filter((c) => c.resolvido).length} accent="var(--good)" icon="✓" />
      </div>

      <FiltroBar
        filtros={filtros}
        onChange={setFiltros}
        total={rows.length}
        exibidos={dados.length}
        urgencias={[...URGENCIAS]}
        naturezas={opcoesDe(rows, (c) => c.natureza, NATUREZAS)}
        destinos={destinos}
        responsaveis={responsaveis}
      />

      {/* sugestões reaproveitadas em todas as células (aceita valor livre) */}
      <datalist id={LISTA_DESTINOS}>
        {destinos.map((d) => (
          <option key={d} value={d} />
        ))}
      </datalist>
      <datalist id={LISTA_RESPONSAVEIS}>
        {responsaveis.map((r) => (
          <option key={r} value={r} />
        ))}
      </datalist>

      <Card>
        <SectionTitle
          title="Fila de atendimento"
          hint={
            quem
              ? `Linha verde = resolvido · linha laranja = urgência alta ainda em aberto. Ao marcar "Resolvido", o chamado é assinado como ${quem}.`
              : 'Linha verde = resolvido · linha laranja = urgência alta ainda em aberto. Escolha "Você é" acima para que os chamados que você resolver saiam assinados.'
          }
        />
        {loading ? (
          <Spinner label="Carregando fila…" />
        ) : dados.length === 0 ? (
          <EmptyState title="Nenhum chamado neste filtro." hint="Ajuste os filtros acima." />
        ) : (
          <div className="px-3 pb-3">
            <Sheet minWidth={1480}>
              <thead>
                <GroupRow
                  groups={[
                    { label: 'Dados do chamado', span: 5 },
                    { label: 'Encaminhamento', span: 3, tone: 'var(--brand-2)' },
                    { label: 'Situação', span: 4 },
                    { label: '', span: 1, tone: 'var(--brand-2)' },
                  ]}
                />
                <tr>
                  <Th width={128} top={31}>Data/Hora</Th>
                  <Th width={210} top={31}>Colaborador</Th>
                  <Th width={160} top={31}>Natureza</Th>
                  <Th width={280} top={31}>Descrição</Th>
                  <Th width={104} top={31} align="center">Urgência</Th>
                  <Th width={160} top={31}>Encaminhado para</Th>
                  <Th width={140} top={31}>Responsável</Th>
                  <Th width={126} top={31}>Nº do chamado</Th>
                  <Th width={72} top={31} align="center">Triagem</Th>
                  <Th width={80} top={31} align="center">Resolvido</Th>
                  <Th width={86} top={31} align="right" title="Só o expediente (seg a sex, 7h às 19h), da abertura do chamado até a solução — ou até agora, se ainda está na fila. “d” são dias de expediente, de 12h.">
                    Tempo
                  </Th>
                  <Th width={260} top={31}>Observações</Th>
                  <Th width={48} top={31} align="center">·</Th>
                </tr>
              </thead>
              <tbody>
                {dados.map((c, i) => {
                  const tone = c.resolvido
                    ? 'color-mix(in srgb, var(--good) 9%, var(--surface))'
                    : c.urgencia === 'Alta'
                      ? 'color-mix(in srgb, var(--serious) 12%, var(--surface))'
                      : i % 2 === 1
                        ? 'var(--surface-2)'
                        : 'var(--surface)'
                  return (
                    <Tr key={c.id} tone={tone}>
                      <Td className="tnum whitespace-nowrap text-ink-2">{fmtDateTime(c.created_at)}</Td>
                      <Td className="font-medium">
                        {c.colaborador}
                        {c.email && (
                          <span className="block truncate text-[11.5px] font-normal text-muted" title={c.email}>
                            {c.email}
                          </span>
                        )}
                      </Td>
                      <Td className="text-ink-2">
                        {c.natureza}
                        {(c.equipamento || c.sistema) && (
                          <span className="block text-[11.5px] text-muted">{c.equipamento || c.sistema}</span>
                        )}
                      </Td>
                      <Td className="text-ink-2">
                        <TextoExpansivel texto={c.descricao} />
                      </Td>
                      <Td align="center">
                        <Badge color={URGENCIA_COLOR[c.urgencia]} icon={URGENCIA_ICON[c.urgencia]}>
                          {c.urgencia}
                        </Badge>
                      </Td>

                      <Td>
                        <CellText
                          ariaLabel={`Encaminhado para — ${c.colaborador}`}
                          list={LISTA_DESTINOS}
                          value={c.encaminhado_para}
                          onCommit={(v) => void salvar(c.id, { encaminhado_para: v })}
                        />
                      </Td>
                      <Td>
                        <CellText
                          ariaLabel={`Responsável — ${c.colaborador}`}
                          list={LISTA_RESPONSAVEIS}
                          value={c.responsavel_atendimento}
                          onCommit={(v) => void salvar(c.id, { responsavel_atendimento: v })}
                        />
                      </Td>
                      <Td>
                        <CellText
                          ariaLabel={`Nº do chamado — ${c.colaborador}`}
                          className="tnum"
                          value={c.numero_chamado}
                          onCommit={(v) => void salvar(c.id, { numero_chamado: v })}
                        />
                      </Td>

                      <Td align="center">
                        <Check
                          checked={c.triagem}
                          label={`Triagem de ${c.colaborador}`}
                          onChange={(v) => void salvar(c.id, { triagem: v })}
                        />
                      </Td>
                      <Td align="center">
                        <Check
                          checked={c.resolvido}
                          label={`Resolvido — ${c.colaborador}`}
                          onChange={(v) =>
                            void salvar(c.id, {
                              resolvido: v,
                              // a triagem é pré-requisito: resolver implica triado
                              ...(v && !c.triagem ? { triagem: true } : {}),
                              // assina quem resolveu, se ninguém tinha assumido
                              ...(v && quem && !(c.responsavel_atendimento || '').trim()
                                ? { responsavel_atendimento: quem }
                                : {}),
                            })
                          }
                        />
                      </Td>
                      <Td align="right" className="tnum text-ink-2">
                        {tempoDoChamado(c)}
                      </Td>
                      <Td>
                        <CellLong
                          ariaLabel={`Observações — ${c.colaborador}`}
                          value={c.observacoes}
                          placeholder="Chamado aberto, aguardando…"
                          onCommit={(v) => void salvar(c.id, { observacoes: v })}
                        />
                      </Td>
                      <Td align="center">
                        {salvando.has(c.id) ? (
                          <span
                            aria-label="Salvando"
                            className="inline-block size-3 animate-spin rounded-full border-2"
                            style={{ borderColor: 'var(--line-strong)', borderTopColor: 'var(--series-1)' }}
                          />
                        ) : (
                          <button
                            type="button"
                            onClick={() => void excluir(c)}
                            title="Excluir chamado"
                            aria-label={`Excluir chamado de ${c.colaborador}`}
                            className="rounded px-1.5 py-0.5 text-[13px] text-muted opacity-0 transition-opacity group-hover:opacity-100 hover:text-[var(--critical)] focus-visible:opacity-100"
                          >
                            ✕
                          </button>
                        )}
                      </Td>
                    </Tr>
                  )
                })}
              </tbody>
            </Sheet>
          </div>
        )}
      </Card>
    </>
  )
}
