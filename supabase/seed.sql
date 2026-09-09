-- =====================================================================
-- Carga inicial com os dados que já existiam nas planilhas.
-- Rode DEPOIS de schema.sql. Pode rodar novamente sem duplicar
-- (as inserções são condicionadas ao colaborador + data).
-- =====================================================================

-- ---------------------------------------------------------------------
-- CHAMADOS — os seis chamados de 08 e 09/09 que ainda não estavam no
-- banco. Os anteriores saíram daqui depois de carregados: mantê-los só
-- fazia este arquivo reprocessar o que já está lá.
--
-- Nenhum deles passou por triagem, então encaminhamento, responsável e
-- observações entram nulos e eles caem na fila.
-- ---------------------------------------------------------------------
with novos (created_at, colaborador, email, natureza, equipamento, sistema, descricao, urgencia,
            encaminhado_para, reencaminhamento, responsavel_atendimento, triagem, resolvido, observacoes) as (
  values
    ('2026-09-08 16:36-03'::timestamptz,
     'Emilly Campos Silverio',
     'juridico19@rocharocha.adv.br',
     'Outro',
     null::text,
     null::text,
     'Não esta recebendo os e-mails: newsletter, G&C (comunicados) e radar reforma',
     'Baixa',
     null::text,
     null::text,
     null::text,
     false,
     false,
     null::text),
    ('2026-09-08 17:15-03',
     'Mayara Fuentes Brassero - Rocha & Rocha Advogados',
     'mayara.fuentes@rocharocha.adv.br',
     'Computador ou equipamento',
     'Notebook',
     null,
     'Notebook travando',
     'Média',
     null,
     null,
     null,
     false,
     false,
     null),
    ('2026-09-08 17:28-03',
     'Priscilla Ortiz',
     'priscilla.ortiz@rocharocha.adv.br',
     'Rede ou internet',
     null,
     null,
     'Alterar o nome da pasta de 27 - Departamento Pessoal, para 27 - Gente e Cultura',
     'Alta',
     null,
     null,
     null,
     false,
     false,
     null),
    ('2026-09-09 11:11-03',
     'Ângela Honda - FINANCEIRO',
     'financeiro@rocharocha.adv.br',
     'Acesso ou senha',
     null,
     null,
     'Não estou conseguindo acessar o notebook da Jennifer (Administrativo). Quando eu informo a senha para acessar pelo usuário dela aparece a mensagem "Sua conta foi desativada. Contate o administrador do sistema.".',
     'Alta',
     null,
     null,
     null,
     false,
     false,
     null),
    ('2026-09-09 12:53-03',
     'Ângela Honda - FINANCEIRO',
     'financeiro@rocharocha.adv.br',
     'Acesso ou senha',
     null,
     null,
     'A caixa de entrada da Jennifer (administrativo@rocharocha.adv.br) foi para o meu e-mail (financeiro@rocharocha.adv.br), mas não consigo encaminhar os e-mails recebidos. Aparece a mensagem: "Você não tem permissão para enviar mensagens desta caixa de correio.".',
     'Média',
     null,
     null,
     null,
     false,
     false,
     null),
    ('2026-09-09 13:39-03',
     'Manuela Marques - Rocha & Rocha Advogados',
     'empresarial01@rocharocha.adv.br',
     'Acesso ou senha',
     null,
     null,
     E'Boa tarde, pessoal. Tudo bem?\nNão estou conseguindo logar com o meu usuário e senha no computador.',
     'Alta',
     null,
     null,
     null,
     false,
     false,
     null)
)
insert into public.chamados
  (created_at, colaborador, email, natureza, equipamento, sistema, descricao, urgencia,
   encaminhado_para, reencaminhamento, responsavel_atendimento, triagem, resolvido, observacoes)
select n.* from novos n
where not exists (
  select 1 from public.chamados c
  where c.colaborador = n.colaborador and c.created_at = n.created_at
);

-- ---------------------------------------------------------------------
-- DESLIGAMENTOS
-- ---------------------------------------------------------------------
insert into public.desligamentos
  (colaborador, data_desligamento, usuario_windows, email_corporativo, email_backup,
   licencas_cancelar, recolhimento_maquina, recolhimento_mouse_teclado)
select * from (values
  ('RAQUEMILLY QUEREN MORAES DE ALMEIDA', '2026-09-02'::date, 'raquemilly.almeida', 'raquemilly.almeida@rocharocha.adv.br', 'marcos@rocharocha.adv.br',      'Sim', 'Recolhido', 'Recolhido'),
  ('LARA DE PAIVA OMENA',                 '2026-09-01'::date, 'lara.paiva',         'lara.paiva@rocharocha.adv.br',         'henrique.souza@rocharocha.adv.br','Sim', 'Recolhido', 'Recolhido'),
  ('MARINA PEREIRA TICIANELLI',           '2026-08-31'::date, null,                 'juridico12@rocharocha.adv.br',         'juridico19@rocharocha.adv.br',   'Sim', 'Recolhido', 'Recolhido'),
  ('JENNIFER PLACIDO BATISTA',            '2026-08-31'::date, null,                 'administrativo@rocharocha.adv.br',     'financeiro@rocharocha.adv.br',   'Sim', 'Recolhido', 'Recolhido'),
  ('JULIA VIEIRA DUTRA',                  '2026-08-31'::date, 'julia.dutra',        'julia.dutra@rocharocha.adv.br',        'marcos@rocharocha.adv.br',       'Sim', 'Recolhido', 'Recolhido'),
  ('LUCAS EIDI MATSNURA',                 '2026-08-31'::date, 'lucas.matsnura',     'lucas.matsnura@rocharocha.adv.br',     'marcos@rocharocha.adv.br',       'Sim', 'Recolhido', 'Recolhido'),
  ('JHONATAS LUIZ MOREIRA DE PAULA FILHO','2026-08-05'::date, 'jhonattan.silva',    'jhonattan.silva@rocharocha.adv.br',    'juliacastro@rocharocha.adv.br',  'Sim', 'Recolhido', 'Recolhido'),
  ('KAUANA NIEUWENHOFF FRAGA',            '2026-08-03'::date, null,                 'documentos01@rocharocha.adv.br',       'documentos01@rocharocha.adv.br', 'Não', 'Recolhido', 'Recolhido')
) as v(colaborador, data_desligamento, usuario_windows, email_corporativo, email_backup,
       licencas_cancelar, recolhimento_maquina, recolhimento_mouse_teclado)
where not exists (
  select 1 from public.desligamentos d
  where d.colaborador = v.colaborador and d.data_desligamento = v.data_desligamento
);

-- ---------------------------------------------------------------------
-- ADMISSÕES
-- ---------------------------------------------------------------------
insert into public.admissoes
  (colaborador, data_admissao, divide_maquina, maquina, mouse_teclado, monitor,
   solicitacao_altatech, numero_chamado, providenciar_maquina, providenciar_equipamentos)
select * from (values
  ('Gabriel Shawarski de Mello Montanha',  '2026-09-17'::date, 'Não', '360', '129', '383',      'Em andamento', '#0926-000166', 'Formatação', 'Concluído'),
  ('Eduardo Gabriel Guilherme dos Santos', '2026-09-08'::date, 'Não', '388', '71',  '270',      'Em andamento', '#0926-000166', 'Formatação', 'Concluído'),
  ('Juliana Santos Alves',                 '2026-09-08'::date, 'Não', '382', '55',  'R&R 0242', 'Em andamento', '#0926-000166', 'Formatação', 'Concluído'),
  ('Walter Brandão da Silva Neto',         '2026-09-08'::date, 'Não', '301', '103', 'R&R 0389', 'Em andamento', '#0926-000166', 'Formatação', 'Concluído')
) as v(colaborador, data_admissao, divide_maquina, maquina, mouse_teclado, monitor,
       solicitacao_altatech, numero_chamado, providenciar_maquina, providenciar_equipamentos)
where not exists (
  select 1 from public.admissoes a
  where a.colaborador = v.colaborador and a.data_admissao = v.data_admissao
);
