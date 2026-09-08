export type Chamado = {
  id: string
  created_at: string
  updated_at: string
  colaborador: string
  setor: string | null
  email: string | null
  natureza: string
  equipamento: string | null
  sistema: string | null
  descricao: string
  urgencia: string
  encaminhado_para: string | null
  reencaminhamento: string | null
  responsavel_atendimento: string | null
  numero_chamado: string | null
  triagem: boolean
  resolvido: boolean
  resolvido_em: string | null
  observacoes: string | null
}

export type Admissao = {
  id: string
  created_at: string
  updated_at: string
  colaborador: string
  data_admissao: string | null
  usuario_windows: string | null
  email_corporativo: string | null
  divide_maquina: string | null
  maquina: string | null
  mouse_teclado: string | null
  monitor: string | null
  softwares: string | null
  tokens: string | null
  licencas: string | null
  responsavel_licenca: string | null
  solicitacao_altatech: string | null
  numero_chamado: string | null
  providenciar_maquina: string | null
  providenciar_equipamentos: string | null
  registrar_patrimonio: string | null
  comunicacao_licencas: string | null
  observacoes: string | null
}

export type Desligamento = {
  id: string
  created_at: string
  updated_at: string
  colaborador: string
  data_desligamento: string | null
  usuario_windows: string | null
  email_corporativo: string | null
  email_backup: string | null
  licencas_cancelar: string | null
  responsavel_licenca: string | null
  solicitacao_altatech: string | null
  numero_chamado: string | null
  responsavel_recolhimento: string | null
  recolhimento_maquina: string | null
  recolhimento_mouse_teclado: string | null
  recolhimento_monitor: string | null
  comunicacao_licencas: string | null
  observacoes: string | null
}

export type NovoChamado = Pick<
  Chamado,
  'colaborador' | 'setor' | 'email' | 'natureza' | 'equipamento' | 'sistema' | 'descricao' | 'urgencia'
>

export type TableRowMap = {
  chamados: Chamado
  admissoes: Admissao
  desligamentos: Desligamento
}

export type TableInsertMap = {
  chamados: Partial<Chamado> & { colaborador: string; natureza: string; descricao: string }
  admissoes: Partial<Admissao> & { colaborador: string }
  desligamentos: Partial<Desligamento> & { colaborador: string }
}

export type TableName = keyof TableRowMap
export type TableRow<T extends TableName> = TableRowMap[T]
export type TableInsert<T extends TableName> = TableInsertMap[T]
