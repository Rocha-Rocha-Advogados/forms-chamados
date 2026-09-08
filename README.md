# Suporte Técnico · Rocha & Rocha

Substitui o Forms + planilha do Excel por um app em **React + Vite + Supabase**:

| Rota | O que é | Acesso |
|---|---|---|
| `/` | Formulário de solicitação de suporte (com ramificação de perguntas) | público |
| `/painel/chamados` | **Planilha 1** — tudo que entra pelo formulário, com filtros e gráficos | equipe de TI |
| `/painel/triagem` | **Planilha 2** — encaminhamento, reencaminhamento, responsável, triagem, resolvido e observações (edição na célula) | equipe de TI |
| `/painel/admissoes` | Checklist de admissão (equipamentos, acessos, licenças) | equipe de TI |
| `/painel/desligamentos` | Checklist de desligamento (backup, recolhimento, licenças) | equipe de TI |

## 1. Configurar o Supabase

1. No projeto `iknyexwubnnabdfmqxhz`, abra **SQL Editor** e rode:
   - `supabase/schema.sql` (tabelas, índices, triggers, RLS)
   - `supabase/seed.sql` (opcional — carrega o que já existia nas planilhas: 18 chamados com a triagem
     preenchida, 4 admissões, 8 desligamentos)
   - `supabase/policies-sem-login.sql` (só no modo sem login — veja o aviso abaixo)
2. Em **Project Settings → API Keys**, copie a chave **anon public**.
3. Preencha o `.env`:

```env
VITE_SUPABASE_URL=https://iknyexwubnnabdfmqxhz.supabase.co
VITE_SUPABASE_ANON_KEY=cole-a-chave-anon-aqui
VITE_REQUIRE_AUTH=true
```

4. Crie os usuários da equipe em **Authentication → Users** (e-mail + senha). Só eles enxergam os painéis;
   o formulário público não pede login e só consegue **inserir** chamados.

> **Painéis sem login?** Ponha `VITE_REQUIRE_AUTH=false` no `.env` **e** rode
> `supabase/policies-sem-login.sql`. As duas coisas juntas — só desligar a flag do app não basta: o
> RLS continua barrando a leitura e os painéis aparecem vazios, com cara de "não conectou". Nesse
> modo, qualquer pessoa com o link vê e edita tudo, inclusive nome, e-mail e descrição de problema
> dos colaboradores.

> **Primeiro login não entra?** Com *Confirm email* ligado (padrão do Supabase), a conta só funciona
> depois de clicar no link do e-mail de confirmação. Para uso interno é mais prático desligar em
> Authentication → Sign In / Providers → Email → *Confirm email*.

## 2. Rodar

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # gera dist/
npm run preview  # serve o dist/
```

## Como o fluxo funciona

```
Formulário (/)  ──insert──▶  tabela chamados  ──▶  Painel Chamados (leitura + gráficos)
                                   ▲
                                   └──update──  Painel Triagem (encaminhamento e situação)
```

- **Uma tabela só** (`chamados`) alimenta as duas planilhas: a primeira mostra as respostas do
  formulário, a segunda edita as colunas de atendimento. Nada de cópia entre abas.
- **Atualização sem recarregar a tela.** Só a primeira carga mostra "carregando"; depois disso nada
  é remontado. Se o Igor marcar "Resolvido", chega o evento e só aquela linha muda na tela do Murilo
  — inclusive sem apagar o que ele estiver digitando numa célula. O botão "Atualizar" busca em
  segundo plano (fica "Atualizando…") e voltar para a aba do navegador também revalida sozinho.
  Para o tempo real funcionar, as tabelas precisam estar na publicação `supabase_realtime` — o
  `schema.sql` já faz isso na seção 5.
- **Reencaminhamento** saiu da tela e do CSV; ficou só "Encaminhado para". A coluna continua no
  banco com o histórico, então é só recolocar na planilha se um dia fizer falta.
- **`resolvido_em`** é gravado por trigger no momento em que "Resolvido" é marcado (e limpo se você
  desmarcar). Não aparece nos painéis, mas vai no CSV junto com as horas até a solução — é o que
  permite medir SLA depois, sem ninguém anotar hora na mão.
- **Data e hora sempre no fuso de São Paulo**, independente do fuso do computador de quem abre.
- **"Concluído?"** de admissão e desligamento é **calculado** pelas quatro últimas etapas do
  checklist (nada de `#REF!`). Contam como feito: *Concluído*, *Recolhido*, *N/A*, *Sim*, *OK*.
- **Exportar CSV** em qualquer painel gera um arquivo separado por `;` e com BOM, que o Excel abre
  com os acentos certos.

## Decisões de interface

- Paleta de gráficos validada para daltonismo e contraste; urgência sempre traz **ícone + rótulo**
  junto da cor, e todo gráfico tem botão **"Ver tabela"**.
- Tema claro/escuro seguindo o sistema, com alternância manual (fica salvo no navegador).
- Edição em planilha grava no `blur`/Enter, com atualização otimista: se o servidor recusar, o valor
  anterior volta e o erro aparece.

## Estrutura

```
src/
  pages/      FormularioPage · ChamadosPage · TriagemPage · AdmissoesPage · DesligamentosPage
  components/ AppShell · AuthGate · FiltroBar · Sheet · charts · cells · ui
  hooks/      useTable (CRUD + realtime) · useAuth · useTheme
  lib/        supabase · types · options · filtros · utils
supabase/     schema.sql · seed.sql
```
