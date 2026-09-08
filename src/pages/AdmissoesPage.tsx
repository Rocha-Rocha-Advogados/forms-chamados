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
import { SIM_NAO, STATUS_ALTATECH, STATUS_MAQUINA, STATUS_TAREFA, tarefaFeita } from '../lib/options'
import type { Admissao } from '../lib/types'
import { baixarCsv, buscaEm, fmtDate, toCsv } from '../lib/utils'

/** As quatro colunas finais formam o "Concluído?" da planilha. */
const CHECKLIST = [
  { key: 'providenciar_maquina', label: 'Providenciar máquina', options: STATUS_MAQUINA },
  { key: 'providenciar_equipamentos', label: 'Providenciar equipamentos', options: STATUS_TAREFA },
  { key: 'registrar_patrimonio', label: 'Registrar patrimônio', options: STATUS_TAREFA },
  { key: 'comunicacao_licencas', label: 'Comunicação · licenças', options: STATUS_TAREFA },
] as const

const progresso = (row: Admissao) => CHECKLIST.filter((c) => tarefaFeita(row[c.key])).length

export function AdmissoesPage() {
  const { rows, loading, refreshing, error, reload, insert, update, remove } = useTable('admissoes', {
    orderBy: 'data_admissao',
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
        if (situacao === 'sem-equipamento' && (r.maquina || '').trim()) return false
        return buscaEm(
          busca,
          r.colaborador,
          r.usuario_windows,
          r.email_corporativo,
          r.maquina,
          r.monitor,
          r.mouse_teclado,
          r.numero_chamado,
          r.licencas,
          r.responsavel_licenca,
          r.observacoes,
        )
      }),
    [rows, busca, situacao],
  )

  const concluidos = dados.filter((r) => progresso(r) === CHECKLIST.length)
  const proximos = dados.filter((r) => {
    if (!r.data_admissao) return false
    const d = new Date(`${r.data_admissao}T00:00:00`).getTime()
    return d >= Date.now() - 864e5 && d <= Date.now() + 15 * 864e5
  })
  const semChamado = dados.filter((r) => !(r.numero_chamado || '').trim())

  const pendentesPorEtapa = CHECKLIST.map((c) => ({
    name: c.label,
    value: dados.filter((r) => !tarefaFeita(r[c.key])).length,
  })).sort((a, b) => b.value - a.value)

  const porMes = useMemo(() => {
    const mapa = new Map<string, number>()
    for (const r of dados) {
      if (!r.data_admissao) continue
      const k = r.data_admissao.slice(0, 7)
      mapa.set(k, (mapa.get(k) ?? 0) + 1)
    }
    return [...mapa.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-8)
      .map(([k, value]) => ({ name: `${k.slice(5)}/${k.slice(2, 4)}`, value }))
  }, [dados])

  const salvar = (id: string, patch: Partial<Admissao>) => void update(id, patch)

  const excluir = async (row: Admissao) => {
    if (window.confirm(`Excluir a admissão de ${row.colaborador}?\n\nEssa ação não pode ser desfeita.`))
      await remove(row.id)
  }

  const exportar = () =>
    baixarCsv(
      'admissoes',
      toCsv(
        [
          'Colaborador',
          'Data de Admissão',
          'Usuário Windows',
          'E-mail Corporativo',
          'Divide máquina?',
          'Máquina',
          'Mouse + Teclado',
          'Monitor',
          'Softwares para instalação inicial',
          'Tokens Necessários',
          'Licenças',
          'Responsável pela licença',
          'Solicitação para Altatech',
          'Nº do Chamado',
          ...CHECKLIST.map((c) => c.label),
          'Concluído?',
          'Observações',
        ],
        dados.map((r) => [
          r.colaborador,
          fmtDate(r.data_admissao),
          r.usuario_windows,
          r.email_corporativo,
          r.divide_maquina,
          r.maquina,
          r.mouse_teclado,
          r.monitor,
          r.softwares,
          r.tokens,
          r.licencas,
          r.responsavel_licenca,
          r.solicitacao_altatech,
          r.numero_chamado,
          ...CHECKLIST.map((c) => r[c.key] ?? ''),
          `${progresso(r)}/${CHECKLIST.length}`,
          r.observacoes,
        ]),
      ),
    )

  return (
    <>
      <PageHeader
        title="Admissões"
        subtitle="Checklist de entrada: equipamento, acessos e licenças de cada novo colaborador."
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
              rotuloData="Data de admissão"
              onCriar={async ({ colaborador, data }) => {
                await insert({ colaborador, data_admissao: data })
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

      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Admissões cadastradas" value={dados.length} hint={`${rows.length} no total da base`} />
        <StatTile label="Nos próximos 15 dias" value={proximos.length} accent="var(--series-1)" hint="Prazo de preparação" />
        <StatTile
          label="Checklist pendente"
          value={dados.length - concluidos.length}
          accent="var(--warning)"
          icon="◐"
          hint="Alguma etapa em aberto"
        />
        <StatTile label="Prontos" value={concluidos.length} accent="var(--good)" icon="✓" hint="Checklist completo" />
      </div>

      <div className="mb-4 grid gap-3 xl:grid-cols-2">
        <ChartCard
          title="Etapas ainda pendentes"
          hint="Quantos colaboradores aguardam cada etapa do checklist."
          table={{ headers: ['Etapa', 'Pendentes'], rows: pendentesPorEtapa.map((d) => [d.name, d.value]) }}
        >
          <RankedBars data={pendentesPorEtapa} cores="var(--series-2)" nome="Pendentes" />
        </ChartCard>
        <ChartCard
          title="Admissões por mês"
          hint="Últimos 8 meses com registro."
          table={{ headers: ['Mês', 'Admissões'], rows: porMes.map((d) => [d.name, d.value]) }}
        >
          {porMes.length ? (
            <RankedBars data={porMes} cores="var(--series-1)" nome="Admissões" />
          ) : (
            <EmptyState title="Sem datas de admissão preenchidas." />
          )}
        </ChartCard>
      </div>

      <Card>
        <SectionTitle
          title="Planilha de admissões"
          hint={`Clique em qualquer célula para editar. "Concluído?" é calculado pelas ${CHECKLIST.length} últimas etapas.`}
          right={
            <div className="flex flex-wrap items-center gap-2">
              <TextInput
                type="search"
                className="w-[230px]"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar colaborador, máquina, chamado…"
                aria-label="Buscar admissões"
              />
              <select className="field w-auto" value={situacao} onChange={(e) => setSituacao(e.target.value)} aria-label="Situação">
                <option value="">Todas</option>
                <option value="pendentes">Com pendência</option>
                <option value="concluidos">Concluídos</option>
                <option value="sem-equipamento">Sem máquina definida</option>
              </select>
              {semChamado.length > 0 && (
                <span className="text-[12px] text-muted">
                  {semChamado.length} sem nº de chamado
                </span>
              )}
            </div>
          }
        />
        {loading ? (
          <Spinner label="Carregando admissões…" />
        ) : dados.length === 0 ? (
          <EmptyState title="Nenhuma admissão encontrada." hint="Use “Novo colaborador” para cadastrar." />
        ) : (
          <div className="px-3 pb-3">
            <Sheet minWidth={2280}>
              <thead>
                <GroupRow
                  groups={[
                    { label: 'Colaborador', span: 4 },
                    { label: 'Equipamentos', span: 4, tone: 'var(--brand-2)' },
                    { label: 'Acessos e licenças', span: 4 },
                    { label: 'Altatech', span: 2, tone: 'var(--brand-2)' },
                    { label: 'Checklist de preparação', span: 5 },
                    { label: '', span: 2, tone: 'var(--brand-2)' },
                  ]}
                />
                <tr>
                  <Th width={210} top={31}>Colaborador</Th>
                  <Th width={124} top={31}>Data de admissão</Th>
                  <Th width={140} top={31}>Usuário Windows</Th>
                  <Th width={220} top={31}>E-mail corporativo</Th>
                  <Th width={96} top={31}>Divide máquina?</Th>
                  <Th width={94} top={31}>Máquina</Th>
                  <Th width={110} top={31}>Mouse + teclado</Th>
                  <Th width={104} top={31}>Monitor</Th>
                  <Th width={180} top={31}>Softwares iniciais</Th>
                  <Th width={140} top={31}>Tokens necessários</Th>
                  <Th width={150} top={31}>Licenças</Th>
                  <Th width={150} top={31}>Resp. pela licença</Th>
                  <Th width={130} top={31}>Solicitação</Th>
                  <Th width={128} top={31}>Nº do chamado</Th>
                  {CHECKLIST.map((c) => (
                    <Th key={c.key} width={144} top={31}>
                      {c.label}
                    </Th>
                  ))}
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
                          ariaLabel="Data de admissão"
                          value={r.data_admissao}
                          onCommit={(v) => salvar(r.id, { data_admissao: v })}
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
                        <CellStatus ariaLabel="Divide máquina?" value={r.divide_maquina} options={SIM_NAO} onCommit={(v) => salvar(r.id, { divide_maquina: v })} />
                      </Td>
                      <Td>
                        <CellText ariaLabel="Máquina" value={r.maquina} onCommit={(v) => salvar(r.id, { maquina: v })} className="tnum" />
                      </Td>
                      <Td>
                        <CellText ariaLabel="Mouse e teclado" value={r.mouse_teclado} onCommit={(v) => salvar(r.id, { mouse_teclado: v })} className="tnum" />
                      </Td>
                      <Td>
                        <CellText ariaLabel="Monitor" value={r.monitor} onCommit={(v) => salvar(r.id, { monitor: v })} className="tnum" />
                      </Td>
                      <Td>
                        <CellText ariaLabel="Softwares iniciais" value={r.softwares} onCommit={(v) => salvar(r.id, { softwares: v })} />
                      </Td>
                      <Td>
                        <CellText ariaLabel="Tokens necessários" value={r.tokens} onCommit={(v) => salvar(r.id, { tokens: v })} />
                      </Td>
                      <Td>
                        <CellText ariaLabel="Licenças" value={r.licencas} onCommit={(v) => salvar(r.id, { licencas: v })} />
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
                      {CHECKLIST.map((c) => (
                        <Td key={c.key}>
                          <CellStatus
                            ariaLabel={c.label}
                            value={r[c.key]}
                            options={c.options}
                            onCommit={(v) => salvar(r.id, { [c.key]: v } as Partial<Admissao>)}
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
                          aria-label={`Excluir admissão de ${r.colaborador}`}
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
