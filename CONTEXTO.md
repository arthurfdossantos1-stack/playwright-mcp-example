# Contexto do RastroLead — prompt de continuidade

Cole o texto abaixo (da linha `---` em diante) numa IA nova para ela assumir o
projeto sabendo o que existe, o que foi decidido e por quê.

---

Você vai continuar o desenvolvimento do **RastroLead**, um SaaS de prospecção
B2B em português do Brasil, já em produção. Leia todo este contexto antes de
propor qualquer coisa.

## O produto

O usuário busca empresas por **nicho + cidade** (ou país inteiro), o app
pontua cada uma num **Radar** — priorizando quem tem menos presença digital,
porque é quem mais precisa do serviço dele —, e organiza a abordagem num funil
até o fechamento.

O usuário é um prestador de serviço (sites, marketing, design) procurando
clientes. O produto **não é um CRM genérico**: ele existe para transformar uma
busca em conversa no WhatsApp.

## Stack

- **Next.js 15.5** (App Router), **React 19**, **TypeScript**
- **Tailwind CSS v4** — configuração em CSS via `@theme`, sem `tailwind.config.js`
- **Supabase** — Postgres + Auth (`@supabase/ssr`), RLS em todas as tabelas
- **Zod** para validar toda entrada de rota
- Deploy na **Netlify**, a partir da branch de trabalho
- **Baileys** no servidor de WhatsApp (pacote `baileys`, versão 6.x)

## Convenções — siga sem exceção

1. **Tudo em português**: nomes de arquivo, variáveis, funções, colunas do
   banco, comentários, textos de tela. `criarClienteAdmin`, `statusDoLead`,
   `empresas_radar`. Não misture inglês.
2. **Comentário explica o porquê, não o quê.** Nada de `// retorna o total`.
   Bons comentários deste projeto dizem coisas como "cadência regular é o que
   denuncia robô — por isso não existe opção de intervalo fixo". Se o código
   já diz o que faz, não comente.
3. **Falha silenciosa é bug.** O projeto já perdeu dados duas vezes por causa
   disso (veja "Armadilhas"). Erro de API vira aviso na tela, não `null`.
4. **Filtre no banco, não em JavaScript depois do `.limit()`.** Foi a causa de
   47 de 85 leads sumirem de uma fila.
5. **Nada de `dark:` nas classes.** O tema escuro inverte os tokens
   `--color-*` em `:root[data-theme="dark"]`. São ~440 utilitários; a
   inversão de paleta é o que torna isso sustentável.

## Regras duras

- **Nunca** implemente cobrança, planos, tabela de preços ou qualquer UI de
  pagamento. O produto é gratuito por decisão do dono. Limites existentes
  (`RATE_LIMIT_*`, `PREVIAS_LIMITE_DIARIO`, tetos da Apify) são **técnicos**,
  para proteger cota de API — nunca os transforme em "plano".
- **Nunca** commite valores de variáveis de ambiente. O repositório é público.
- `SUPABASE_SERVICE_ROLE_KEY` só em `src/lib/supabase/admin.ts`, jamais com
  prefixo `NEXT_PUBLIC_`.
- O disparo automático de WhatsApp usa uma conexão **não oficial** e viola os
  termos de uso da plataforma. O dono foi avisado do risco de banimento e
  decidiu seguir. As travas de segurança — intervalo sorteado, teto diário com
  aquecimento, parada após 3 falhas seguidas, checagem de `onWhatsApp` antes
  de enviar — são **parte obrigatória** da funcionalidade. Não as remova nem
  as torne opcionais.

## Banco (Postgres, schema `public`, RLS por `user_id` em tudo)

| Tabela | Para quê |
|---|---|
| `profiles` | Perfil do usuário |
| `projetos` | Agrupa buscas e leads |
| `buscas` | Uma busca (`nicho`, `cidade`, `pais`, `fonte`, `status`) |
| `empresas` | Resultado de busca. `score_radar`, `motivos_radar` (jsonb), `whatsapp_e164`, `contatado_fila_em`, campos `instagram_*` |
| `empresas_radar` | **View** que junta empresa + status do lead |
| `leads` | Funil. `status`: novo, contatado, respondeu, fechado, descartado |
| `interacoes` | Histórico por lead |
| `templates` | Modelos de mensagem, por canal |
| `cadencias` / `cadencia_etapas` / `lead_cadencias` | Sequências de follow-up |
| `follow_ups` | Follow-ups agendados |
| `previas_site` | Prévias geradas com Gemini |
| `rate_limit_eventos` | Janela do rate limit |
| `whatsapp_sessao` | Estado do servidor de disparo (`conectado`, `numero`, `qr`, `comando`, `visto_em`, `enviadas_hoje`, `teto_hoje`) |
| `disparos` / `disparo_itens` | Campanha de disparo e seus itens |

Migrações em `supabase/migrations/`. Schema completo em `supabase/schema.sql`.

## Estrutura

```
src/app/                    páginas (App Router)
  /                         landing
  /auth/*                   login, verificação em 2 etapas, senha
  /app/*                    área logada
  /conteudos/*              conteúdo para SEO
  /api/buscas               dispara uma busca
  /api/fila/contatado       marca contato (aceita keepalive e o worker)
  /api/whatsapp             estado da conexão e do disparo
  /api/whatsapp/agente      única porta do servidor de disparo
  /api/whatsapp/conexao     deixa o comando conectar/desconectar
  /api/whatsapp/disparo     inicia/cancela campanha
  /api/cron/follow-ups      worker de follow-up
src/lib/                    places, apify, radar, status-lead, paises, tema,
                            cookies, fila-pendente, rate-limit, gemini…
src/components/app/         telas da área logada
servidor-whatsapp/          servidor Baileys em modo pull (roda no Termux)
```

## Decisões de arquitetura que você precisa entender

**Status do lead é derivado, não armazenado.** `src/lib/status-lead.ts` tem a
função `statusDoLead()`, que é a fonte única da verdade em todas as telas.
Guardar o status em coluna duplicaria a verdade e as telas divergiriam.

**O servidor de WhatsApp funciona em modo PULL.** Ele **pergunta** ao app se
tem trabalho, a cada 8 segundos. O app nunca chama o servidor. Isso é o que
permite rodar num celular com Termux: não existe IP público atrás de NAT, e
com o app chamando seria preciso um túnel cuja URL muda a cada reinício — ou
seja, reconfigurar a Netlify toda vez.

Consequência: **clicar em "Gerar QR Code" não chama nada.** Grava um comando
que o servidor busca depois. O código leva até ~20s para aparecer, e a tela
precisa dizer isso, senão parece quebrado.

**Escritas que precisam sobreviver ao app ser fechado** usam
`fetch(..., { keepalive: true })` mais uma fila em `localStorage`
(`src/lib/fila-pendente.ts`). O usuário sai do app para mandar a mensagem no
WhatsApp; sem isso, a marcação de contato se perde.

**Tema escuro por inversão de paleta**, não por `dark:` em cada utilitário.

## Armadilhas já pagas — não repita

- **Place Details falhando em silêncio.** `if (!resposta.ok) return null` fez
  373 de 414 leads parecerem "empresas sem telefone". Hoje tem retry (só em
  429 e 5xx — 404 e 403 não melhoram repetindo), contagem de falhas e aviso
  na tela.
- **`.limit(300)` antes de filtrar em JS** escondeu 47 de 85 leads elegíveis.
  Filtre na tabela principal e deixe o `.limit()` valer depois.
- **CSP com `unsafe-eval`**: o `next dev` precisa dele para o HMR, a build de
  produção não. Condicione ao ambiente, senão a página nunca hidrata em dev.
- **Apify rejeita pontuação** no campo `search` e trata vírgula como
  separador. Há um `termoSeguro()` em `src/lib/apify.ts`.
- **Radar de Instagram precisa de penalidades negativas.** Sem elas, um perfil
  morto pontuava 71 e um influenciador 70.
- **Variável nova na Netlify só entra na função no deploy.** Salvar sem
  republicar não muda nada — vale "Clear cache and deploy site".
- Depois de apagar uma rota, `rm -rf .next`, senão `.next/types` gera erro
  fantasma no `tsc`.

## O que está pronto

Busca (Google Places e Instagram, cidade ou país inteiro), Radar com score,
funil de leads, templates, cadências e follow-ups, prévia de site com Gemini,
fila de envio manual, disparo automático de WhatsApp em modo pull, tema
claro/escuro, consentimento de cookies, verificação em 2 etapas, CAPTCHA no
cadastro, cabeçalhos de segurança, páginas de conteúdo para SEO.

## O que falta

1. **SMTP próprio no Supabase** — o servidor embutido se recusa a entregar
   e-mail para quem não é da equipe do projeto, então hoje **ninguém além do
   dono consegue criar conta**. É o bloqueio mais urgente.
2. Google OAuth (credenciais), Turnstile (chaves), `CRON_SECRET`
3. Regenerar as chaves do Google que já foram expostas em conversa
4. `supabase/cron.sql` (opcional), para agendar os follow-ups
5. Nunca foram testados contra a API real: a busca no Instagram (Apify) e a
   conexão com o WhatsApp

## Como trabalhar

Antes de qualquer push: `npx tsc --noEmit` e `npm run build`. A mensagem de
commit explica **por que** a mudança existe e o que quebrava antes — não
liste arquivos alterados.

Leia `CONFIGURACAO.md` para o mapa completo das variáveis.
