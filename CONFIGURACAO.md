# Configuração do RastroLead

Mapa de **todas** as variáveis do projeto: o que cada uma faz, onde ela mora e
onde pegar o valor.

> **Este arquivo não guarda valor nenhum, de propósito.** O repositório é
> público. Uma `SUPABASE_SERVICE_ROLE_KEY` commitada aqui ignora todas as
> regras de segurança do banco e entrega leitura e escrita em todos os dados,
> de todos os usuários, para qualquer pessoa — e o histórico do git guarda
> isso para sempre, mesmo depois de apagada. Robôs varrem o GitHub atrás
> dessas chaves em minutos.
>
> Os valores de verdade ficam em três lugares, e só neles: **Netlify**
> (o site), **Termux/servidor** (o disparo) e **Supabase** (o painel deles).
> Guarde uma cópia num gerenciador de senhas, nunca num arquivo do projeto.

---

## 1. Site (Netlify)

`Site configuration → Environment variables`. Sempre marque **todos os deploy
contexts** e **todos os scopes** — com escopo só de `Builds` as rotas de API
não enxergam a variável.

Depois de mexer em qualquer uma: **Trigger deploy → Clear cache and deploy
site**. Na Netlify a variável entra na função **no momento do deploy**; salvar
sem republicar não muda nada.

### Obrigatórias

| Variável | O que faz | Onde pegar |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Endereço do banco | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave pública, limitada pelas regras de RLS | mesma tela |
| `SUPABASE_SERVICE_ROLE_KEY` | **Ignora todas as regras de segurança.** Só no servidor | mesma tela |
| `GOOGLE_PLACES_API_KEY` | Busca de empresas | Google Cloud, com "Places API (New)" habilitada |
| `NEXT_PUBLIC_SITE_URL` | Base do OAuth, sitemap e metadata | a URL publicada do site |

> `SUPABASE_SERVICE_ROLE_KEY` **nunca** pode ganhar o prefixo `NEXT_PUBLIC_`.
> Esse prefixo é o que manda o Next embutir o valor no JavaScript que vai para
> o navegador — seria publicar a chave mestra do banco em cada página.
> Ela é lida só em `src/lib/supabase/admin.ts`.

### Opcionais — cada uma desliga sozinha se faltar

| Variável | O que faz | Sem ela |
|---|---|---|
| `GEMINI_API_KEY` | Gera a prévia de site | A prévia fica indisponível |
| `GEMINI_MODEL` | Modelo usado | Usa `gemini-flash-latest` |
| `PREVIAS_LIMITE_DIARIO` | Prévias por dia, por usuário | 5 |
| `APIFY_TOKEN` | Busca no Instagram | A fonte "Instagram" some; o Google segue igual |
| `APIFY_ATOR_BUSCA` | Ator da Apify Store que faz a busca | `apify/instagram-search-scraper` |
| `APIFY_MAX_POR_BUSCA` | Teto de perfis por varredura | 40 |
| `APIFY_LIMITE_MENSAL` | Teto de perfis no mês, contado no nosso banco | 1500 |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | CAPTCHA no cadastro | Cadastro funciona, só sem CAPTCHA |
| `WHATSAPP_WORKER_SECRET` | Autentica o servidor de disparo | A tela de disparo explica o que falta |
| `CRON_SECRET` | Protege `/api/cron/follow-ups` | A rota recusa todo mundo |
| `RATE_LIMIT_BUSCAS_POR_MINUTO` | Buscas por janela, por usuário/IP | 10 |
| `RATE_LIMIT_JANELA_SEGUNDOS` | Tamanho da janela | 60 |

Os dois tetos da Apify existem para você **não estourar** o crédito grátis de
US$ 5/mês sem querer. O app confere a cota antes de cada varredura e recusa
quando passa.

---

### O build falha com "secrets scanning"

A Netlify varre o resultado do build atrás dos valores das suas variáveis e
reprova o deploy se achar algum. Ela vai achar: `NEXT_PUBLIC_SUPABASE_URL` e
`NEXT_PUBLIC_SUPABASE_ANON_KEY` **existem para ir ao navegador** — é isso que
o prefixo `NEXT_PUBLIC_` significa. O scanner não sabe disso.

Declare quais são públicas de propósito, como mais uma variável:

```
SECRETS_SCAN_OMIT_KEYS=NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY,NEXT_PUBLIC_SITE_URL
```

**Não use `SECRETS_SCAN_ENABLED=false`.** Desligar tudo tira a única rede de
proteção que pegaria a `SUPABASE_SERVICE_ROLE_KEY` vazando para o pacote do
navegador — e essa sim seria catastrófica. A lista acima mantém a varredura
ligada onde ela importa.

Se o log reprovar alguma chave que **não** comece com `NEXT_PUBLIC_`, não
adicione à lista: isso é um vazamento de verdade, e o certo é descobrir por
que ela foi parar no pacote.

## 2. Servidor de WhatsApp (Termux, VPS, etc.)

Ficam no arquivo **`servidor-whatsapp/.env`** (copie de `.env.exemplo`). Um
`export` no terminal também funciona e tem prioridade sobre o arquivo, mas
vale só naquela aba: fechou o Termux, sumiu. Detalhes em
[`servidor-whatsapp/README.md`](servidor-whatsapp/README.md).

| Variável | O que faz | Padrão |
|---|---|---|
| `APP_URL` | Site publicado que ele consulta | — (obrigatória) |
| `CHAVE` | **Precisa ser idêntica** a `WHATSAPP_WORKER_SECRET` | — (obrigatória) |
| `USUARIO_ID` | Seu id, mostrado na tela "Disparo automático" | — (obrigatória) |
| `DADOS_DIR` | Onde fica a sessão do WhatsApp e o histórico | `./dados` |
| `TETO_INICIAL` | Mensagens no primeiro dia | 20 |
| `TETO_MAXIMO` | Teto depois do aquecimento | 60 |
| `ESPERA_OCIOSO` | Segundos entre consultas ao app | 8 |
| `TOLERANCIA_QUEDA` | Segundos sem conexão antes de avisar que parou | 180 |

`DADOS_DIR` guarda as credenciais da sessão: **quem tem essa pasta entra na
conta de WhatsApp sem escanear QR nenhum.** Ela está no `.gitignore` e precisa
continuar lá.

O aquecimento (`TETO_INICIAL` subindo 10 por dia até `TETO_MAXIMO`) não é
enfeite: chip novo disparando no volume máximo é banido quase na hora.

### Chave não bate?

Abra `SEU_SITE/api/whatsapp/agente` no navegador. Ele responde se a variável
chegou até a função, o tamanho e uma impressão digital — sem expor o segredo.
Compare com a sua:

```bash
node -e 'console.log(require("node:crypto").createHash("sha256").update("rastrolead-impressao-v1"+process.env.CHAVE).digest("hex").slice(0,8))'
```

---

## 3. Supabase (painel, não é variável)

| Onde | O que configurar |
|---|---|
| Authentication → URL Configuration | **Site URL** e **Redirect URLs** com a URL publicada |
| Authentication → Emails → SMTP Settings | SMTP próprio (Brevo, Resend…) |
| Authentication → Attack Protection | A chave **secreta** do Turnstile (a pública vai na Netlify) |
| Authentication → Providers → Google | Client ID e secret do Google Cloud |

O SMTP próprio **não é opcional na prática**: o servidor embutido do Supabase
se recusa a entregar e-mail para endereços que não são da equipe do projeto.
Sem SMTP, ninguém além de você consegue criar conta.

---

## 4. Desenvolvimento local

```bash
cp .env.example .env.local   # .env.local está no .gitignore
npm install
npm run dev
```

`.env.local` nunca entra em commit. Antes de qualquer push, `git status` não
pode listar nenhum arquivo `.env`.
