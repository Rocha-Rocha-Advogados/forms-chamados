import { useMemo, useState } from 'react'
import { PageHeader } from '../components/AppShell'
import { FiltroBar } from '../components/FiltroBar'
import { ChartCard, LegendItem, RankedBars, SERIES, StackedBars, TimeSeries } from '../components/charts'
import { Sheet, Th, Tr, Td } from '../components/Sheet'
import { Badge, Card, EmptyState, ErrorBanner, SectionTitle, Spinner, StatTile } from '../components/ui'
import { useTable } from '../hooks/useTable'
import { NATUREZAS, URGENCIAS, URGENCIA_COLOR, URGENCIA_ICON } from '../lib/options'
import { FILTROS_VAZIOS, PERIODOS, aplicarFiltros, opcoesDe } from '../lib/filtros'
import {
  baixarCsv,
  contarPor,
  fmtDateTime,
  horasEntre,
  pct,
  serieDiaria,
  toCsv,
} from '../lib/utils'

export function ChamadosPage() {
  const { rows, loading, refreshing, error, reload } = useTable('chamados')
  const [filtros, setFiltros] = useState(FILTROS_VAZIOS)

  const dados = useMemo(() => aplicarFiltros(rows, filtros), [rows, filtros])

  const metricas = useMemo(() => {
    const abertos = dados.filter((c) => !c.resolvido)
    const semTriagem = dados.filter((c) => !c.triagem)
    const altaAberta = abertos.filter((c) => c.urgencia === 'Alta')
    return { abertos, semTriagem, altaAberta }
  }, [dados])

  const dias = PERIODOS.find((p) => p.id === filtros.periodo)?.dias || 30
  const serie = useMemo(() => serieDiaria(dados, Math.min(dias || 30, 90)), [dados, dias])
  const porNatureza = useMemo(() => contarPor(dados, (c) => c.natureza), [dados])
  const porUrgencia = useMemo(
    () =>
      URGENCIAS.map((u) => ({
        name: u,
        value: dados.filter((c) => c.urgencia === u).length,
        icon: URGENCIA_ICON[u],
      })).reverse(),
    [dados],
  )
  const porDestino = useMemo(() => {
    const nomes = opcoesDe(dados, (c) => c.encaminhado_para)
    const lista = nomes.length ? nomes : []
    const semDestino = dados.filter((c) => !(c.encaminhado_para || '').trim()).length
    const base = lista.map((name) => {
      const grupo = dados.filter((c) => (c.encaminhado_para || '') === name)
      return {
        name,
        Resolvidos: grupo.filter((c) => c.resolvido).length,
        Abertos: grupo.filter((c) => !c.resolvido).length,
      }
    })
    if (semDestino) base.push({ name: 'Não encaminhado', Resolvidos: 0, Abertos: semDestino })
    return base.sort((a, b) => b.Resolvidos + b.Abertos - (a.Resolvidos + a.Abertos))
  }, [dados])
  const porResponsavel = useMemo(() => contarPor(dados, (c) => c.responsavel_atendimento), [dados])

  const exportar = () =>
    baixarCsv(
      'chamados',
      toCsv(
        [
          'Data/Hora',
          'Colaborador',
          'Natureza',
          'Equipamento',
          'Sistema',
          'Descrição',
          'Urgência',
          'Encaminhado para',
          'Responsável',
          'Nº chamado',
          'Triagem',
          'Resolvido',
          'Resolvido em',
          'Horas para resolver',
          'Observações',
        ],
        dados.map((c) => [
          fmtDateTime(c.created_at),
          c.colaborador,
          c.natureza,
          c.equipamento,
          c.sistema,
          c.descricao,
          c.urgencia,
          c.encaminhado_para,
          c.responsavel_atendimento,
          c.numero_chamado,
          c.triagem,
          c.resolvido,
          c.resolvido_em ? fmtDateTime(c.resolvido_em) : '',
          c.resolvido_em ? horasEntre(c.created_at, c.resolvido_em).toFixed(1).replace('.', ',') : '',
          c.observacoes,
        ]),
      ),
    )

  return (
    <>
      <PageHeader
        title="Chamados"
        subtitle="Planilha 1 — tudo que entra pelo formulário, com filtros e gráficos."
        right={
          <>
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

      <FiltroBar
        filtros={filtros}
        onChange={setFiltros}
        total={rows.length}
        exibidos={dados.length}
        urgencias={[...URGENCIAS]}
        naturezas={opcoesDe(rows, (c) => c.natureza, NATUREZAS)}
        destinos={opcoesDe(rows, (c) => c.encaminhado_para)}
        responsaveis={opcoesDe(rows, (c) => c.responsavel_atendimento)}
      />

      {loading ? (
        <Spinner label="Carregando chamados…" />
      ) : (
        <>
          {/* ------------------------------------------------------------- KPIs */}
          <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatTile label="Chamados no período" value={dados.length} hint={`${rows.length} no total da base`} />
            <StatTile
              label="Em aberto"
              value={metricas.abertos.length}
              accent="var(--series-2)"
              hint={`${pct(metricas.abertos.length, dados.length)}% do período`}
            />
            <StatTile
              label="Alta urgência em aberto"
              value={metricas.altaAberta.length}
              accent="var(--critical)"
              icon="●"
              hint="Prioridade da fila"
            />
            <StatTile
              label="Aguardando triagem"
              value={metricas.semTriagem.length}
              accent="var(--warning)"
              icon="●"
              hint="Sem checkbox de triagem"
            />
          </div>

          {/* --------------------------------------------------------- gráficos */}
          <div className="mb-4 grid gap-3 xl:grid-cols-2">
            <ChartCard
              className="xl:col-span-2"
              title="Chamados abertos por dia"
              hint={`Volume diário — ${filtros.periodo === 'all' ? 'últimos 90 dias' : PERIODOS.find((p) => p.id === filtros.periodo)?.label.toLowerCase()}`}
              table={{ headers: ['Dia', 'Chamados'], rows: serie.map((d) => [d.label, d.total]) }}
            >
              <TimeSeries data={serie} />
            </ChartCard>

            <ChartCard
              title="Por urgência"
              hint="A cor de status vem sempre acompanhada de ícone e rótulo."
              legend={
                <>
                  {[...URGENCIAS].reverse().map((u) => (
                    <LegendItem key={u} color={URGENCIA_COLOR[u]} icon={URGENCIA_ICON[u]} label={u} />
                  ))}
                </>
              }
              table={{ headers: ['Urgência', 'Chamados'], rows: porUrgencia.map((d) => [d.name, d.value]) }}
            >
              <RankedBars
                data={porUrgencia}
                cores={porUrgencia.map((d) => URGENCIA_COLOR[d.name] ?? 'var(--series-1)')}
                height={170}
              />
            </ChartCard>

            <ChartCard
              title="Por natureza do problema"
              hint="O que mais gera chamado."
              table={{ headers: ['Natureza', 'Chamados'], rows: porNatureza.map((d) => [d.name, d.value]) }}
            >
              <RankedBars data={porNatureza} cores="var(--series-1)" />
            </ChartCard>

            <ChartCard
              title="Encaminhamento × situação"
              hint="Quanto cada destino já resolveu e quanto segue em aberto."
              legend={
                <>
                  <LegendItem color="var(--series-3)" label="Resolvidos" />
                  <LegendItem color="var(--series-2)" label="Abertos" />
                </>
              }
              table={{
                headers: ['Destino', 'Resolvidos', 'Abertos'],
                rows: porDestino.map((d) => [d.name, d.Resolvidos, d.Abertos]),
              }}
            >
              {porDestino.length ? <StackedBars data={porDestino} /> : <EmptyState title="Sem encaminhamentos no filtro atual." />}
            </ChartCard>

            <ChartCard
              title="Por responsável pelo atendimento"
              hint="Distribuição da carga na equipe."
              table={{ headers: ['Responsável', 'Chamados'], rows: porResponsavel.map((d) => [d.name, d.value]) }}
            >
              <RankedBars data={porResponsavel} cores={porResponsavel.map((_, i) => SERIES[i % SERIES.length])} />
            </ChartCard>

          </div>

          {/* --------------------------------------------------------- planilha */}
          <Card>
            <SectionTitle
              title="Planilha de chamados"
              hint="Respostas do formulário. A edição de triagem e encaminhamento fica na aba Triagem."
            />
            {dados.length === 0 ? (
              <EmptyState
                title="Nenhum chamado neste filtro."
                hint={rows.length ? 'Ajuste o período ou limpe os filtros.' : 'Assim que o formulário for respondido, aparece aqui.'}
              />
            ) : (
              <div className="px-3 pb-3">
                <Sheet minWidth={1280}>
                  <thead>
                    <tr>
                      <Th width={132}>Data/Hora</Th>
                      <Th width={190}>Colaborador</Th>
                      <Th width={190}>Natureza</Th>
                      <Th width={150}>Equipamento / Sistema</Th>
                      <Th width={340}>Descrição</Th>
                      <Th width={110} align="center">Urgência</Th>
                      <Th width={130}>Encaminhado</Th>
                      <Th width={120}>Responsável</Th>
                      <Th width={120} align="center">Situação</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {dados.map((c, i) => (
                      <Tr key={c.id} zebra={i % 2 === 1}>
                        <Td className="tnum whitespace-nowrap text-ink-2">{fmtDateTime(c.created_at)}</Td>
                        <Td className="font-medium">{c.colaborador}</Td>
                        <Td className="text-ink-2">{c.natureza}</Td>
                        <Td className="text-ink-2">{c.equipamento || c.sistema || '—'}</Td>
                        <Td className="text-ink-2">
                          <span className="line-clamp-2" title={c.descricao}>
                            {c.descricao}
                          </span>
                        </Td>
                        <Td align="center">
                          <Badge color={URGENCIA_COLOR[c.urgencia]} icon={URGENCIA_ICON[c.urgencia]}>
                            {c.urgencia}
                          </Badge>
                        </Td>
                        <Td className="text-ink-2">{c.encaminhado_para || '—'}</Td>
                        <Td className="text-ink-2">{c.responsavel_atendimento || '—'}</Td>
                        <Td align="center">
                          {c.resolvido ? (
                            <Badge color="var(--good)" icon="✓">
                              Resolvido
                            </Badge>
                          ) : c.triagem ? (
                            <Badge color="var(--series-2)" icon="●">
                              Em atendimento
                            </Badge>
                          ) : (
                            <Badge color="var(--warning)" icon="!">
                              Sem triagem
                            </Badge>
                          )}
                        </Td>
                      </Tr>
                    ))}
                  </tbody>
                </Sheet>
              </div>
            )}
          </Card>
        </>
      )}
    </>
  )
}
