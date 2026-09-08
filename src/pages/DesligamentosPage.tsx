import { useMemo, useState } from 'react'
import { PageHeader } from '../components/AppShell'
import { CellLong, CellStatus, CellText } from '../components/cells'
import { ChartCard, RankedBars } from '../components/charts'
import { NovoColaborador } from '../components/NovoColaborador'
import { GroupRow, Sheet, Td, Th, Tr } from '../components/Sheet'
import {
  Card,
  EmptyState,
  ErrorBanner,
  ProgressPill,
  SectionTitle,
  Spinner,
  StatTile,
  TextInput,
} from '../components/ui'
import { useTable } from '../hooks/useTable'
import { SIM_NAO, STATUS_ALTATECH, STATUS_RECOLHIMENTO, STATUS_TAREFA, tarefaFeita } from '../lib/options'
import type { Desligamento } from '../lib/types'
import { baixarCsv, buscaEm, fmtDate, toCsv } from '../lib/utils'

/** As quatro colunas finais formam o "Concluído?" da planilha. */
const CHECKLIST = [
  { key: 'recolhimento_maquina', label: 'Recolhimento da máquina', options: STATUS_RECOLHIMENTO },
  { key: 'recolhimento_mouse_teclado', label: 'Recolhimento mouse + teclado', options: STATUS_RECOLHIMENTO },
  { key: 'recolhimento_monitor', label: 'Recolhimento do monitor', options: STATUS_RECOLHIMENTO },
  { key: 'comunicacao_licencas', label: 'Comunicação · licenças', options: STATUS_TAREFA },
] as const

const progresso = (row: Desligamento) => CHECKLIST.filter((c) => tarefaFeita(row[c.key])).length

export function DesligamentosPage() {
  const { rows, loading, refreshing, error, reload, insert, update, remove } = useTable('desligamentos', {
    orderBy: 'data_desligamento',
    ascending: false,
  })
  const [busca, setBusca] = useState('')
  const [situacao, setSituacao] = useState('')

  const dados = useMemo(
    () =>
      rows.filter((r) => {
        const done = progresso(r)
        if (situacao === 'pendentes' && done === CHECKLIST.length) return false
        if (situacao === 'concluidos' && done !== CHECKLIST.length) return false
        if (situacao === 'sem-backup' && (r.email_backup || '').trim()) return false
        if (situacao === 'licenca-aberta' && !(r.licencas_cancelar === 'Sim' && !tarefaFeita(r.comunicacao_licencas)))
          return false
        return buscaEm(
          busca,
          r.colaborador,
          r.usuario_windows,
          r.email_corporativo,
          r.email_backup,
          r.responsavel_licenca,
          r.responsavel_recolhimento,
          r.numero_chamado,
          r.observacoes,
        )
      }),
    [rows, busca, situacao],
  )

  const concluidos = dados.filter((r) => progresso(r) === CHECKLIST.length)
  const recentes = dados.filter((r) => {
    if (!r.data_desligamento) return false
    const d = new Date(`${r.data_desligamento}T00:00:00`).getTime()
    return d >= Date.now() - 30 * 864e5 && d <= Date.now()
  })

  const pendentesPorEtapa = CHECKLIST.map((c) => ({
    name: c.label,
    value: dados.filter((r) => !tarefaFeita(r[c.key])).length,
  })).sort((a, b) => b.value - a.value)

  const porMes = useMemo(() => {
    const mapa = new Map<string, number>()
    for (const r of dados) {
      if (!r.data_desligamento) continue
      const k = r.data_desligamento.slice(0, 7)
      mapa.set(k, (mapa.get(k) ?? 0) + 1)
    }
    return [...mapa.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-8)
      .map(([k, value]) => ({ name: `${k.slice(5)}/${k.slice(2, 4)}`, value }))
  }, [dados])

  const salvar = (id: string, patch: Partial<Desligamento>) => void update(id, patch)

  const excluir = async (row: Desligamento) => {
    if (window.confirm(`Excluir o desligamento de ${row.colaborador}?\n\nEssa ação não pode ser desfeita.`))
      await remove(row.id)
  }

  const exportar = () =>
    baixarCsv(
      'desligamentos',
      toCsv(
        [
          'Colaborador',
          'Data de Desligamento',
          'Usuário Windows',
          'E-mail Corporativo',
          'E-mail de destino do backup',
          'Licenças a cancelar',
          'Responsável pela licença',
          'Solicitação para Altatech',
          'Nº do Chamado',
          'Responsável pelo recolhimento',
          ...CHECKLIST.map((c) => c.label),
          'Concluído?',
          'Observações',
        ],
        dados.map((r) => [
          r.colaborador,
          fmtDate(r.data_desligamento),
          r.usuario_windows,
          r.email_corporativo,
          r.email_backup,
          r.licencas_cancelar,
          r.responsavel_licenca,
          r.solicitacao_altatech,
          r.numero_chamado,
          r.responsavel_recolhimento,
          ...CHECKLIST.map((c) => r[c.key] ?? ''),
          `${progresso(r)}/${CHECKLIST.length}`,
          r.observacoes,
        ]),
      ),
    )

  return (
    <>
      <PageHeader
        title="Desligamentos"
        subtitle="Checklist de saída: backup de e-mail, recolhimento de equipamentos e cancelamento de licenças."
        right={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => void reload()} disabled={refreshing}>
              <span aria-hidden className={refreshing ? 'inline-block animate-spin' : undefined}>
                ↻
              </span>
              {refreshing ? 'Atualizando…' : 'Atualizar'}
            </button>
            <button type="button" className="btn btn-ghost" onClick={exportar} disabled={!dados.length}>
              ↓ Exportar CSV
            </button>
            <NovoColaborador
              rotuloData="Data de desligamento"
              onCriar={async ({ colaborador, data }) => {
                await insert({ colaborador, data_desligamento: data })
              }}
            />
          </>
        }
      />

      {error && (
        <div className="mb-4">
          <ErrorBanner message={error} onRetry={() => void reload()} />
        </div>
      )}

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <StatTile label="Desligamentos cadastrados" value={dados.length} hint={`${rows.length} no total da base`} />
        <StatTile label="Últimos 30 dias" value={recentes.length} accent="var(--series-1)" hint="Janela de recolhimento" />
        <StatTile label="Encerrados" value={concluidos.length} accent="var(--good)" icon="✓" hint="Checklist completo" />
      </div>

      <div className="mb-4 grid gap-3 xl:grid-cols-2">
        <ChartCard
          title="Etapas ainda pendentes"
          hint="Quantos desligamentos aguardam cada etapa."
          table={{ headers: ['Etapa', 'Pendentes'], rows: pendentesPorEtapa.map((d) => [d.name, d.value]) }}
        >
          <RankedBars data={pendentesPorEtapa} cores="var(--series-2)" nome="Pendentes" />
        </ChartCard>
        <ChartCard
          title="Desligamentos por mês"
          hint="Últimos 8 meses com registro."
          table={{ headers: ['Mês', 'Desligamentos'], rows: porMes.map((d) => [d.name, d.value]) }}
        >
          {porMes.length ? (
            <RankedBars data={porMes} cores="var(--series-1)" nome="Desligamentos" />
          ) : (
            <EmptyState title="Sem datas de desligamento preenchidas." />
          )}
        </ChartCard>
      </div>

      <Card>
        <SectionTitle
          title="Planilha de desligamentos"
          hint={`Clique em qualquer célula para editar. "Concluído?" é calculado pelas ${CHECKLIST.length} últimas etapas.`}
          right={
            <div className="flex flex-wrap items-center gap-2">
              <TextInput
                type="search"
                className="w-[230px]"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar colaborador, e-mail, chamado…"
                aria-label="Buscar desligamentos"
              />
              <select className="field w-[190px]" value={situacao} onChange={(e) => setSituacao(e.target.value)} aria-label="Situação">
                <option value="">Todas</option>
                <option value="pendentes">Com pendência</option>
                <option value="concluidos">Concluídos</option>
                <option value="licenca-aberta">Licença a cancelar em aberto</option>
                <option value="sem-backup">Sem destino de backup</option>
              </select>
            </div>
          }
        />
        {loading ? (
          <Spinner label="Carregando desligamentos…" />
        ) : dados.length === 0 ? (
          <EmptyState title="Nenhum desligamento encontrado." hint="Use “Novo colaborador” para cadastrar." />
        ) : (
          <div className="px-3 pb-3">
            <Sheet minWidth={2180}>
              <thead>
                <GroupRow
                  groups={[
                    { label: 'Colaborador', span: 4 },
                    { label: 'Backup e licenças', span: 3, tone: 'var(--brand-2)' },
                    { label: 'Altatech', span: 2 },
                    { label: 'Recolhimento', span: 4, tone: 'var(--brand-2)' },
                    { label: 'Licenças', span: 1 },
                    { label: '', span: 3, tone: 'var(--brand-2)' },
                  ]}
                />
                <tr>
                  <Th width={230} top={31}>Colaborador</Th>
                  <Th width={132} top={31}>Data de desligamento</Th>
                  <Th width={140} top={31}>Usuário Windows</Th>
                  <Th width={220} top={31}>E-mail corporativo</Th>
                  <Th width={220} top={31}>E-mail de destino do backup</Th>
                  <Th width={104} top={31}>Licenças a cancelar</Th>
                  <Th width={150} top={31}>Resp. pela licença</Th>
                  <Th width={130} top={31}>Solicitação</Th>
                  <Th width={128} top={31}>Nº do chamado</Th>
                  <Th width={150} top={31}>Resp. recolhimento</Th>
                  <Th width={140} top={31}>Máquina</Th>
                  <Th width={150} top={31}>Mouse + teclado</Th>
                  <Th width={130} top={31}>Monitor</Th>
                  <Th width={150} top={31}>Comunicação licenças</Th>
                  <Th width={132} top={31}>Concluído?</Th>
                  <Th width={200} top={31}>Observações</Th>
                  <Th width={46} top={31} align="center">·</Th>
                </tr>
              </thead>
              <tbody>
                {dados.map((r, i) => {
                  const done = progresso(r)
                  const completo = done === CHECKLIST.length
                  return (
                    <Tr
                      key={r.id}
                      tone={
                        completo
                          ? 'color-mix(in srgb, var(--good) 9%, var(--surface))'
                          : r.licencas_cancelar === 'Sim' && !tarefaFeita(r.comunicacao_licencas)
                            ? 'color-mix(in srgb, var(--serious) 12%, var(--surface))'
                            : i % 2 === 1
                              ? 'var(--surface-2)'
                              : 'var(--surface)'
                      }
                    >
                      <Td className="font-medium">
                        <CellText
                          ariaLabel="Colaborador"
                          value={r.colaborador}
                          onCommit={(v) => v && salvar(r.id, { colaborador: v })}
                          className="font-medium"
                        />
                      </Td>
                      <Td className="tnum">
                        <CellText
                          type="date"
                          ariaLabel="Data de desligamento"
                          value={r.data_desligamento}
                          onCommit={(v) => salvar(r.id, { data_desligamento: v })}
                        />
                      </Td>
                      <Td>
                        <CellText ariaLabel="Usuário Windows" value={r.usuario_windows} onCommit={(v) => salvar(r.id, { usuario_windows: v })} />
                      </Td>
                      <Td>
                        <CellText
                          type="email"
                          ariaLabel="E-mail corporativo"
                          value={r.email_corporativo}
                          onCommit={(v) => salvar(r.id, { email_corporativo: v })}
                        />
                      </Td>
                      <Td>
                        <CellText
                          type="email"
                          ariaLabel="E-mail de destino do backup"
                          value={r.email_backup}
                          onCommit={(v) => salvar(r.id, { email_backup: v })}
                        />
                      </Td>
                      <Td>
                        <CellStatus
                          ariaLabel="Licenças a cancelar"
                          value={r.licencas_cancelar}
                          options={SIM_NAO}
                          onCommit={(v) => salvar(r.id, { licencas_cancelar: v })}
                        />
                      </Td>
                      <Td>
                        <CellText ariaLabel="Responsável pela licença" value={r.responsavel_licenca} onCommit={(v) => salvar(r.id, { responsavel_licenca: v })} />
                      </Td>
                      <Td>
                        <CellStatus
                          ariaLabel="Solicitação para Altatech"
                          value={r.solicitacao_altatech}
                          options={STATUS_ALTATECH}
                          onCommit={(v) => salvar(r.id, { solicitacao_altatech: v })}
                        />
                      </Td>
                      <Td>
                        <CellText ariaLabel="Número do chamado" value={r.numero_chamado} onCommit={(v) => salvar(r.id, { numero_chamado: v })} className="tnum" />
                      </Td>
                      <Td>
                        <CellText
                          ariaLabel="Responsável pelo recolhimento"
                          value={r.responsavel_recolhimento}
                          onCommit={(v) => salvar(r.id, { responsavel_recolhimento: v })}
                        />
                      </Td>
                      {CHECKLIST.map((c) => (
                        <Td key={c.key}>
                          <CellStatus
                            ariaLabel={c.label}
                            value={r[c.key]}
                            options={c.options}
                            onCommit={(v) => salvar(r.id, { [c.key]: v } as Partial<Desligamento>)}
                          />
                        </Td>
                      ))}
                      <Td>
                        <ProgressPill done={done} total={CHECKLIST.length} />
                      </Td>
                      <Td>
                        <CellLong ariaLabel="Observações" value={r.observacoes} onCommit={(v) => salvar(r.id, { observacoes: v })} />
                      </Td>
                      <Td align="center">
                        <button
                          type="button"
                          onClick={() => void excluir(r)}
                          aria-label={`Excluir desligamento de ${r.colaborador}`}
                          title="Excluir"
                          className="rounded px-1.5 py-0.5 text-[13px] text-muted opacity-0 transition-opacity group-hover:opacity-100 hover:text-[var(--critical)] focus-visible:opacity-100"
                        >
                          ✕
                        </button>
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
