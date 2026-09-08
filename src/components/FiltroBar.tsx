import { PERIODOS, contarAtivos, type Filtros } from '../lib/filtros'
import { SelectInput, TextInput } from './ui'

const SITUACOES = [
  { id: '', label: 'Todas as situações' },
  { id: 'abertos', label: 'Em aberto' },
  { id: 'resolvidos', label: 'Resolvidos' },
  { id: 'sem-triagem', label: 'Aguardando triagem' },
  { id: 'sem-destino', label: 'Sem encaminhamento' },
] as const

/** Uma linha de filtros acima dos gráficos — tudo abaixo reage a ela. */
export function FiltroBar({
  filtros,
  onChange,
  naturezas,
  destinos,
  responsaveis,
  urgencias,
  total,
  exibidos,
  acoes,
}: {
  filtros: Filtros
  onChange: (f: Filtros) => void
  naturezas: string[]
  destinos: string[]
  responsaveis: string[]
  urgencias: string[]
  total: number
  exibidos: number
  acoes?: React.ReactNode
}) {
  const set = <K extends keyof Filtros>(key: K, value: Filtros[K]) => onChange({ ...filtros, [key]: value })
  const ativos = contarAtivos(filtros)

  return (
    <div className="no-print card mb-4 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="min-w-[190px] grow sm:max-w-[300px]">
          <TextInput
            type="search"
            value={filtros.busca}
            onChange={(e) => set('busca', e.target.value)}
            placeholder="Buscar colaborador, sistema, observação…"
            aria-label="Buscar chamados"
          />
        </div>

        <select
          className="field w-auto"
          value={filtros.periodo}
          onChange={(e) => set('periodo', e.target.value as Filtros['periodo'])}
          aria-label="Período"
        >
          {PERIODOS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>

        <select
          className="field w-auto"
          value={filtros.situacao}
          onChange={(e) => set('situacao', e.target.value as Filtros['situacao'])}
          aria-label="Situação"
        >
          {SITUACOES.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>

        <SelectInput
          className="w-auto"
          options={urgencias}
          placeholder="Toda urgência"
          value={filtros.urgencia}
          onChange={(e) => set('urgencia', e.target.value)}
          aria-label="Urgência"
        />
        <SelectInput
          className="w-auto"
          options={naturezas}
          placeholder="Toda natureza"
          value={filtros.natureza}
          onChange={(e) => set('natureza', e.target.value)}
          aria-label="Natureza"
        />
        <SelectInput
          className="w-auto"
          options={destinos}
          placeholder="Todo encaminhamento"
          value={filtros.destino}
          onChange={(e) => set('destino', e.target.value)}
          aria-label="Encaminhado para"
        />
        <SelectInput
          className="w-auto"
          options={responsaveis}
          placeholder="Todo responsável"
          value={filtros.responsavel}
          onChange={(e) => set('responsavel', e.target.value)}
          aria-label="Responsável pelo atendimento"
        />

        {ativos > 0 && (
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => onChange({ ...filtros, urgencia: '', natureza: '', destino: '', responsavel: '', situacao: '', busca: '' })}
          >
            Limpar filtros ({ativos})
          </button>
        )}

        <div className="ml-auto flex items-center gap-2">
          <span className="tnum text-[12.5px] text-muted">
            {exibidos === total ? `${total} chamados` : `${exibidos} de ${total} chamados`}
          </span>
          {acoes}
        </div>
      </div>
    </div>
  )
}
