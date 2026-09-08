-- =====================================================================
-- Rocha & Rocha — Suporte Técnico / Movimentação de Pessoal
-- Projeto Supabase: iknyexwubnnabdfmqxhz
-- Rode este arquivo no SQL Editor do Supabase (uma vez).
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- 1. CHAMADOS  (origem: formulário "Solicitação de Suporte Técnico")
--    A planilha 1 (Chamados) lê as colunas do formulário.
--    A planilha 2 (Triagem)  edita as colunas de encaminhamento.
-- ---------------------------------------------------------------------
create table if not exists public.chamados (
  id                      uuid primary key default gen_random_uuid(),
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),

  -- ---- preenchido pelo formulário -----------------------------------
  colaborador             text not null,
  setor                   text,
  email                   text,
  natureza                text not null,      -- Computador ou equipamento / Acesso ou senha / ...
  equipamento             text,               -- só quando natureza = Computador ou equipamento
  sistema                 text,               -- só quando natureza = Sistema ou aplicativo interno
  descricao               text not null,
  urgencia                text not null default 'Média',  -- Baixa | Média | Alta

  -- ---- preenchido pela triagem (planilha 2) -------------------------
  encaminhado_para        text,               -- D&I | Administrativo | Altatech | ...
  reencaminhamento        text,
  responsavel_atendimento text,
  numero_chamado          text,               -- nº do chamado Altatech
  triagem                 boolean not null default false,
  resolvido               boolean not null default false,
  resolvido_em            timestamptz,
  observacoes             text
);

create index if not exists chamados_created_at_idx on public.chamados (created_at desc);
create index if not exists chamados_resolvido_idx  on public.chamados (resolvido);
create index if not exists chamados_urgencia_idx   on public.chamados (urgencia);

-- ---------------------------------------------------------------------
-- 2. ADMISSÕES
-- ---------------------------------------------------------------------
create table if not exists public.admissoes (
  id                        uuid primary key default gen_random_uuid(),
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now(),

  colaborador               text not null,
  data_admissao             date,
  usuario_windows           text,
  email_corporativo         text,
  divide_maquina            text,             -- Sim | Não
  maquina                   text,             -- patrimônio
  mouse_teclado             text,
  monitor                   text,
  softwares                 text,
  tokens                    text,
  licencas                  text,
  responsavel_licenca       text,
  solicitacao_altatech      text,             -- Não iniciado | Em andamento | Concluído
  numero_chamado            text,

  -- checklist (as 4 últimas colunas viram o "Concluído?")
  providenciar_maquina      text,             -- Pendente | Formatação | Concluído
  providenciar_equipamentos text,
  registrar_patrimonio      text,
  comunicacao_licencas      text,
  observacoes               text
);

create index if not exists admissoes_data_idx on public.admissoes (data_admissao desc);

-- ---------------------------------------------------------------------
-- 3. DESLIGAMENTOS
-- ---------------------------------------------------------------------
create table if not exists public.desligamentos (
  id                          uuid primary key default gen_random_uuid(),
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now(),

  colaborador                 text not null,
  data_desligamento           date,
  usuario_windows             text,
  email_corporativo           text,
  email_backup                text,           -- e-mail de destino do backup
  licencas_cancelar           text,           -- Sim | Não
  responsavel_licenca         text,
  solicitacao_altatech        text,
  numero_chamado              text,
  responsavel_recolhimento    text,

  -- checklist (as 4 últimas colunas viram o "Concluído?")
  recolhimento_maquina        text,           -- Pendente | Recolhido | N/A
  recolhimento_mouse_teclado  text,
  recolhimento_monitor        text,
  comunicacao_licencas        text,
  observacoes                 text
);

create index if not exists desligamentos_data_idx on public.desligamentos (data_desligamento desc);

-- ---------------------------------------------------------------------
-- updated_at automático
-- ---------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists chamados_touch      on public.chamados;
drop trigger if exists admissoes_touch     on public.admissoes;
drop trigger if exists desligamentos_touch on public.desligamentos;

create trigger chamados_touch      before update on public.chamados      for each row execute function public.touch_updated_at();
create trigger admissoes_touch     before update on public.admissoes     for each row execute function public.touch_updated_at();
create trigger desligamentos_touch before update on public.desligamentos for each row execute function public.touch_updated_at();

-- marca a data de resolução quando "Resolvido" é ligado
create or replace function public.chamados_stamp_resolvido()
returns trigger language plpgsql as $$
begin
  if new.resolvido and not coalesce(old.resolvido, false) then
    new.resolvido_em = now();
  elsif not new.resolvido then
    new.resolvido_em = null;
  end if;
  return new;
end $$;

drop trigger if exists chamados_stamp_resolvido on public.chamados;
create trigger chamados_stamp_resolvido before update on public.chamados
  for each row execute function public.chamados_stamp_resolvido();

-- ---------------------------------------------------------------------
-- 4. VIEW auxiliar: SLA / tempo de atendimento
-- ---------------------------------------------------------------------
create or replace view public.chamados_sla as
select
  id, created_at, colaborador, natureza, urgencia, encaminhado_para,
  responsavel_atendimento, triagem, resolvido, resolvido_em,
  case when resolvido and resolvido_em is not null
       then round(extract(epoch from (resolvido_em - created_at)) / 3600.0, 2)
  end as horas_para_resolver
from public.chamados;

-- ---------------------------------------------------------------------
-- 5. DOMÍNIO DO E-MAIL
--    O formulário exige o e-mail corporativo, mas o endpoint de insert
--    é aberto (anon), então a regra também vale no banco: quem postar
--    direto na API não passa com endereço de fora.
--    Nulo continua aceito por causa dos registros migrados da planilha,
--    que não traziam e-mail.
-- ---------------------------------------------------------------------
alter table public.chamados drop constraint if exists chamados_email_dominio;
alter table public.chamados add constraint chamados_email_dominio
  check (email is null or email ~* '^[^@[:space:]]+@rocharocha\.adv\.br$');

-- ---------------------------------------------------------------------
-- 6. TEMPO REAL
--    Sem entrar nesta publicação, o Supabase não emite eventos e os
--    painéis só atualizam quando alguém recarrega a página.
--    (Equivale a ligar "Realtime" na tabela pelo painel do Supabase.)
-- ---------------------------------------------------------------------
do $$
declare
  t text;
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    raise notice 'publicação supabase_realtime não existe aqui — ignorando';
    return;
  end if;
  foreach t in array array['chamados', 'admissoes', 'desligamentos'] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- 7. RLS
--    O formulário é público (anon INSERT em chamados).
--    Leitura/edição dos painéis exige usuário autenticado.
--    >>> Para usar sem login, troque `to authenticated` por `to anon, authenticated`.
-- ---------------------------------------------------------------------
alter table public.chamados      enable row level security;
alter table public.admissoes     enable row level security;
alter table public.desligamentos enable row level security;

-- formulário público
drop policy if exists "chamados: insert publico" on public.chamados;
create policy "chamados: insert publico" on public.chamados
  for insert to anon, authenticated with check (true);

-- painéis
drop policy if exists "chamados: leitura interna" on public.chamados;
create policy "chamados: leitura interna" on public.chamados
  for select to authenticated using (true);

drop policy if exists "chamados: update interna" on public.chamados;
create policy "chamados: update interna" on public.chamados
  for update to authenticated using (true) with check (true);

drop policy if exists "chamados: delete interna" on public.chamados;
create policy "chamados: delete interna" on public.chamados
  for delete to authenticated using (true);

drop policy if exists "admissoes: interna" on public.admissoes;
create policy "admissoes: interna" on public.admissoes
  for all to authenticated using (true) with check (true);

drop policy if exists "desligamentos: interna" on public.desligamentos;
create policy "desligamentos: interna" on public.desligamentos
  for all to authenticated using (true) with check (true);
