/** Listas de opções — espelham o formulário e as validações da planilha. */

export const NATUREZAS = [
  'Computador ou equipamento',
  'Acesso ou senha',
  'Sistema ou aplicativo interno',
  'Rede ou internet',
  'Outro',
] as const

export const EQUIPAMENTOS = ['Notebook', 'Monitor', 'Teclado/Mouse', 'Impressora', 'Rede/Internet', 'Outro'] as const

export const URGENCIAS = ['Baixa', 'Média', 'Alta'] as const
export type Urgencia = (typeof URGENCIAS)[number]

export const SETORES = [
  'Jurídico',
  'Administrativo',
  'Financeiro',
  'Documentos',
  'Recursos Humanos',
  'Comercial',
  'Diretoria',
  'Outro',
] as const

export const DESTINOS = ['D&I', 'Administrativo', 'Altatech', 'Financeiro', 'Jurídico', 'Outro'] as const

export const RESPONSAVEIS = ['Murilo', 'Igor', 'Nathan', 'Marcos', 'Outro'] as const

/** Status do checklist de admissão/desligamento. */
export const STATUS_TAREFA = ['', 'Pendente', 'Em andamento', 'Concluído', 'N/A'] as const
export const STATUS_MAQUINA = ['', 'Pendente', 'Formatação', 'Em andamento', 'Concluído', 'N/A'] as const
export const STATUS_RECOLHIMENTO = ['', 'Pendente', 'Recolhido', 'N/A'] as const
export const STATUS_ALTATECH = ['', 'Não iniciado', 'Em andamento', 'Concluído'] as const
export const SIM_NAO = ['', 'Sim', 'Não'] as const

/** Um status conta como feito quando é conclusivo (concluído / recolhido / não se aplica). */
const FEITOS = new Set(['concluído', 'concluido', 'recolhido', 'n/a', 'ok', 'sim', 'feito'])
export const tarefaFeita = (v: string | null | undefined) =>
  FEITOS.has((v ?? '').trim().toLowerCase())

export const URGENCIA_COLOR: Record<string, string> = {
  Baixa: 'var(--good)',
  Média: 'var(--warning)',
  Alta: 'var(--critical)',
}

/** Ícone textual que acompanha a cor de status (cor nunca carrega sentido sozinha). */
export const URGENCIA_ICON: Record<string, string> = { Baixa: '○', Média: '◐', Alta: '●' }
