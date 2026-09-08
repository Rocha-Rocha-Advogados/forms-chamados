-- =====================================================================
-- MODO SEM LOGIN  (combina com VITE_REQUIRE_AUTH=false)
--
-- Libera leitura e escrita dos painéis para a chave anon. Rode isto no
-- SQL Editor SOMENTE se você aceita que qualquer pessoa com o link do
-- app veja e edite todos os chamados, admissões e desligamentos —
-- inclusive nome, e-mail e descrição de problema dos colaboradores.
--
-- Para voltar ao modo com login: rode de novo o bloco de RLS do
-- schema.sql (as policies têm o mesmo nome e são substituídas) e ponha
-- VITE_REQUIRE_AUTH=true no .env.
-- =====================================================================

-- chamados -------------------------------------------------------------
drop policy if exists "chamados: insert publico"   on public.chamados;
drop policy if exists "chamados: leitura interna"  on public.chamados;
drop policy if exists "chamados: update interna"   on public.chamados;
drop policy if exists "chamados: delete interna"   on public.chamados;

create policy "chamados: insert publico" on public.chamados
  for insert to anon, authenticated with check (true);
create policy "chamados: leitura interna" on public.chamados
  for select to anon, authenticated using (true);
create policy "chamados: update interna" on public.chamados
  for update to anon, authenticated using (true) with check (true);
create policy "chamados: delete interna" on public.chamados
  for delete to anon, authenticated using (true);

-- admissoes ------------------------------------------------------------
drop policy if exists "admissoes: interna" on public.admissoes;
create policy "admissoes: interna" on public.admissoes
  for all to anon, authenticated using (true) with check (true);

-- desligamentos --------------------------------------------------------
drop policy if exists "desligamentos: interna" on public.desligamentos;
create policy "desligamentos: interna" on public.desligamentos
  for all to anon, authenticated using (true) with check (true);
