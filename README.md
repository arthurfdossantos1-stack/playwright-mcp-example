# RastroLead

**Rastreie empresas. Encontre clientes.**

SaaS de prospecção B2B em português do Brasil: encontra empresas por nicho e cidade
(Google Places API), prioriza as melhores oportunidades com o Radar e organiza o contato
com templates, cadências de follow-up e funil kanban.

> **Versão 100% gratuita.** Não existem planos, assinaturas, cobrança, créditos ou contador
> de uso mensal. Toda conta autenticada tem acesso completo e ilimitado a todos os recursos.
> Não há nenhuma referência a preços em qualquer parte da interface.

---

## Stack

| Camada | Tecnologia |
| --- | --- |
| Frontend + Backend | Next.js 15 (App Router), React 19, TypeScript |
| Estilo | Tailwind CSS 4 |
| Banco + Auth | Supabase (Postgres + Auth e-mail/senha e Google) |
| Dados de empresas | Google Places API (New) — Text Search + Place Details |
| Instagram | Parsing da homepage da empresa via regex |
| Follow-up | Worker/cron (rota `/api/cron/follow-ups`, Edge Function ou pg_cron) |
| Conteúdo/SEO | Markdown em `content/artigos`, renderizado no próprio Next |

---

## Rodando localmente

```bash
npm install
cp .env.example .env.local   # preencha as variáveis
npm run dev                  # http://localhost:3000
```

### Variáveis de ambiente

| Variável | Para que serve |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave pública do Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Worker de follow-up (somente servidor) |
| `GOOGLE_PLACES_API_KEY` | Places API (New) |
| `NEXT_PUBLIC_SITE_URL` | Base para OAuth, sitemap e metadata |
| `CRON_SECRET` | Protege `/api/cron/follow-ups` |
| `RATE_LIMIT_BUSCAS_POR_MINUTO` | Proteção técnica de infraestrutura (padrão 10) |
| `RATE_LIMIT_JANELA_SEGUNDOS` | Janela do rate limit (padrão 60) |

O rate limit **não é um plano**: ele só evita rajadas que estourariam a cota da API do Google
e nunca aparece na interface como limitação de produto.

---

## Configurando o Supabase

1. Crie um projeto em [supabase.com](https://supabase.com).
2. No **SQL Editor**, rode `supabase/schema.sql` (tabelas, RLS, triggers e a view `empresas_radar`).
3. Rode `supabase/cron.sql` para agendar o worker de follow-up (opcional, mas recomendado).
4. Em **Authentication → Providers**, habilite **Email** e **Google**.
   - Em Google, informe Client ID e Secret do Google Cloud.
   - Em **URL Configuration**, adicione `http://localhost:3000/auth/callback` e a URL de produção
     em *Redirect URLs*.
5. Se quiser que a conta já entre logada ao se cadastrar, desative *Confirm email*
   em **Authentication → Sign In / Providers**.

O RLS isola os dados por usuário: cada conta enxerga apenas os próprios registros
(`auth.uid() = user_id`).

## Configurando o Google Places

1. No Google Cloud Console, habilite **Places API (New)**.
2. Crie uma chave de API e restrinja por aplicação/IP.
3. Coloque a chave em `GOOGLE_PLACES_API_KEY`.

A busca usa `places:searchText` paginando **todas** as páginas que a API devolver e depois
`places/{id}` (Place Details) para telefone, site, avaliações e endereço. Não há corte de
resultados por parte do RastroLead.

---

## Worker de follow-up

Três formas de rodar (escolha uma):

**A. pg_cron chamando a função SQL** (mais simples — já vem em `supabase/cron.sql`):

```sql
select cron.schedule('rastrolead-follow-ups', '*/15 * * * *',
  $$ select public.disparar_follow_ups_vencidos(); $$);
```

**B. Supabase Edge Function**

```bash
supabase functions deploy follow-ups --no-verify-jwt
supabase secrets set CRON_SECRET=...
```

**C. Cron da hospedagem** apontando para a rota do Next:

```bash
curl -X POST https://seu-dominio/api/cron/follow-ups -H "x-cron-secret: $CRON_SECRET"
```

O worker marca como `pronto` os follow-ups vencidos, registra a interação no histórico do lead
e encerra as cadências sem etapas pendentes. O envio da mensagem continua sendo do usuário.

---

## Estrutura

```
content/artigos/         Artigos de SEO em Markdown (frontmatter define a rota)
src/app/                 Rotas (App Router)
  page.tsx               Landing single-page — sem seção de preços
  conteudos/             Hub de conteúdos + /conteudos/[slug]
  como-encontrar-clientes, guia-prospeccao-b2b
  termos, privacidade, cookies
  auth/                  Login, cadastro, redefinir senha, callback OAuth
  app/                   App autenticado
    page.tsx             Visão geral + follow-ups do dia
    buscar/              Nova varredura
    resultados/[buscaId] Empresas encontradas + selo do Radar
    radar/               Só as oportunidades quentes e intocadas
    leads/               Funil kanban (Novo → Contatado → Respondeu → Fechado)
    templates/           CRUD com variáveis e prévia
    cadencias/           Sequências de follow-up (dia 0 / 3 / 7)
    projetos/            Agrupamento por cliente ou campanha
    configuracoes/       Conta, senha, conexão com o Google
    acoes.ts             Server actions (todas as mutações)
  api/buscas             Executa a varredura completa
  api/cron/follow-ups    Worker de follow-up
src/components/          UI de marketing, auth e app
src/lib/                 Places, Instagram, Radar, templates, cadências, rate limit
supabase/                schema.sql, cron.sql e a Edge Function
```

## Lógica do Radar de Oportunidades

| Sinal | Peso | Efeito |
| --- | --- | --- |
| Empresa sem website no Place Details | +50 | Prioridade **alta** |
| Menos de 10 avaliações | +30 | Prioridade **média-alta** |
| Entre 10 e 29 avaliações | +15 | — |
| Sem Instagram encontrado no site | +20 | Prioridade **média** |
| Sem telefone público | +5 | — |
| Nota abaixo de 4,0 | +10 | — |

O score vira o selo: `≥50` alta, `≥30` média-alta, `≥15` média, abaixo disso baixa.
Leads que ainda não entraram em nenhuma coluna do funil são marcados como **intocados**
e são os únicos que aparecem em `/app/radar`.

## Variáveis dos templates

`{{empresa}}` `{{cidade}}` `{{nicho}}` `{{telefone}}` `{{site}}` `{{instagram}}`
`{{nota}}` `{{avaliacoes}}` `{{meu_nome}}`

---

## Scripts

```bash
npm run dev        # desenvolvimento
npm run build      # build de produção
npm run start      # serve o build
npm run lint       # ESLint
npm run typecheck  # tsc --noEmit
```

## Licença

Uso interno. Os dados de empresas vêm de fontes públicas via Google Places e estão sujeitos
aos termos da Google. Respeite a LGPD ao abordar as empresas listadas.
