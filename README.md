# Suporte Técnico · Rocha & Rocha

Substitui o Forms + planilha do Excel por um app em **React + Vite + Supabase**:

| Rota | O que é | Acesso |
|---|---|---|
| `/` | Formulário de solicitação de suporte (com ramificação de perguntas) | público |
| `/interno/chamados` | **Planilha 1** — tudo que entra pelo formulário, com filtros e gráficos | senha da equipe |
| `/interno/triagem` | **Planilha 2** — encaminhamento, responsável, triagem, resolvido e observações (edição na célula) | senha da equipe |
| `/interno/admissoes` | Checklist de admissão (equipamentos, acessos, licenças) | senha da equipe |
| `/interno/desligamentos` | Checklist de desligamento (backup, recolhimento, licenças) | senha da equipe |

O formulário público **não tem link** para a área interna: só se chega a `/interno/...`
digitando o endereço, e ali é preciso a senha da equipe.

## 1. Configurar o Supabase

1. No projeto `iknyexwubnnabdfmqxhz`, abra **SQL Editor** e rode:
   - `supabase/schema.sql` (tabelas, índices, triggers, RLS)
   - `supabase/seed.sql` (opcional — carrega o que já existia nas planilhas: 18 chamados com a triagem
     preenchida, 4 admissões, 8 desligamentos)
2. Em **Project Settings → API Keys**, copie a chave **anon public**.
3. Preencha o `.env`:

```env
VITE_SUPABASE_URL=https://iknyexwubnnabdfmqxhz.supabase.co
VITE_SUPABASE_ANON_KEY=cole-a-chave-anon-aqui
```

   Só isso. **Quem tem o endereço do painel e a senha entra** — não há mais chave para ligar ou
   desligar o acesso.

4. **Senha da equipe.** Os painéis usam uma conta única do Supabase Auth. O endereço dela é uma
   constante do código (`equipeEmail`, em `src/lib/supabase.ts`) — identifica a conta e não autoriza
   nada, por isso não é segredo. A senha é digitada na tela de acesso. Para criar ou trocar, vá em
   **Authentication → Users** (ao criar, marque *Auto Confirm User*, senão a conta só entra depois
   de confirmar o e-mail).

   A senha entra numa conta de verdade em vez de ser comparada aqui no navegador de propósito:
   comparada no navegador, ela viajaria dentro do JavaScript da página e o RLS teria de liberar
   leitura para a chave anônima — qualquer pessoa com o endereço leria os chamados de todo mundo,
   sem senha. Do jeito atual, sem a senha certa não sai sessão, e sem sessão o banco não devolve
   nada.

> **As policies precisam exigir sessão.** Se em algum momento você liberou leitura para a chave
> anônima, a senha deixa de proteger: essa chave vai publicada no JavaScript do site e com ela dá
> para ler a base inteira sem passar pela tela de acesso. Rodar o `supabase/schema.sql` de novo
> restaura as policies certas (o arquivo é seguro de repetir).

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
- Tema escuro único. Os tokens do tema claro continuam no `index.css`, inertes, se um dia quiser
  reativar a alternância.
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
