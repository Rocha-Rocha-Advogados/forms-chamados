import type { Chamado } from './types'
import { buscaEm } from './utils'

export const PERIODOS = [
  { id: '7', label: 'Últimos 7 dias', dias: 7 },
  { id: '30', label: 'Últimos 30 dias', dias: 30 },
  { id: '90', label: 'Últimos 90 dias', dias: 90 },
  { id: 'all', label: 'Todo o período', dias: 0 },
] as const

export type PeriodoId = (typeof PERIODOS)[number]['id']

export type Filtros = {
  periodo: PeriodoId
  urgencia: string
  natureza: string
  destino: string
  responsavel: string
  situacao: '' | 'abertos' | 'resolvidos' | 'sem-triagem' | 'sem-destino'
  busca: string
}

export const FILTROS_VAZIOS: Filtros = {
  periodo: '30',
  urgencia: '',
  natureza: '',
  destino: '',
  responsavel: '',
  situacao: '',
  busca: '',
}

export const contarAtivos = (f: Filtros) =>
  (f.urgencia ? 1 : 0) +
  (f.natureza ? 1 : 0) +
  (f.destino ? 1 : 0) +
  (f.responsavel ? 1 : 0) +
  (f.situacao ? 1 : 0) +
  (f.busca.trim() ? 1 : 0)

export function aplicarFiltros(rows: Chamado[], f: Filtros) {
  const dias = PERIODOS.find((p) => p.id === f.periodo)?.dias ?? 0
  const limite = dias ? Date.now() - dias * 864e5 : 0

  return rows.filter((c) => {
    if (limite && new Date(c.created_at).getTime() < limite) return false
    if (f.urgencia && c.urgencia !== f.urgencia) return false
    if (f.natureza && c.natureza !== f.natureza) return false
    if (f.destino && (c.encaminhado_para || '') !== f.destino) return false
    if (f.responsavel && (c.responsavel_atendimento || '') !== f.responsavel) return false
    if (f.situacao === 'abertos' && c.resolvido) return false
    if (f.situacao === 'resolvidos' && !c.resolvido) return false
    if (f.situacao === 'sem-triagem' && c.triagem) return false
    if (f.situacao === 'sem-destino' && (c.encaminhado_para || '').trim()) return false
    if (
      !buscaEm(
        f.busca,
        c.colaborador,
        c.natureza,
        c.equipamento,
        c.sistema,
        c.descricao,
        c.encaminhado_para,
        c.responsavel_atendimento,
        c.numero_chamado,
        c.observacoes,
      )
    )
      return false
    return true
  })
}

/** Valores realmente presentes na base — os selects não oferecem opção vazia de resultado. */
export function opcoesDe(rows: Chamado[], pick: (c: Chamado) => string | null | undefined, extras: readonly string[] = []) {
  const set = new Set<string>(extras.filter(Boolean))
  for (const row of rows) {
    const v = (pick(row) || '').trim()
    if (v) set.add(v)
  }
  return [...set].sort((a, b) => a.localeCompare(b, 'pt-BR'))
}
