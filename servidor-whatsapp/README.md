# Servidor de WhatsApp do RastroLead

Mantém a sessão do WhatsApp conectada e dispara a fila **devagar**, com
intervalo aleatório, teto diário e aquecimento.

## Por que é um serviço separado

A Netlify executa funções sem estado e com tempo limitado. Uma sessão do
WhatsApp é um socket que precisa ficar aberto, e um disparo de 40 mensagens
com 60 segundos de intervalo leva 40 minutos. Nada disso cabe lá.

## Antes de subir: leia

Isto usa uma biblioteca **não oficial** que se passa pelo WhatsApp Web.

- **Viola os termos do WhatsApp.** O banimento é do número e costuma ser
  permanente.
- **Use um chip descartável.** Nunca o seu número pessoal ou o da empresa.
- **Aqueça o número.** Chip novo disparando 50 mensagens no primeiro dia é
  banido quase na hora. O padrão embutido começa em 20/dia e sobe 10 por dia.
- Quem responde "não quero" precisa sair da sua lista. Além de ser a regra da
  LGPD, denúncia de usuário é o que mais acelera banimento.

## Onde hospedar

Qualquer lugar que rode um processo Node 24h: Railway, Render, Fly.io, ou uma
VPS. Cerca de R$ 30 a 60 por mês. Precisa de **disco persistente** montado em
`DADOS_DIR` — sem isso a sessão se perde a cada reinício e você refaz o QR.

## Variáveis

| Variável | Para que serve |
|---|---|
| `PORTA` | porta HTTP (padrão 8080) |
| `CHAVE` | segredo compartilhado com o app. Gere um valor longo |
| `APP_URL` | URL do RastroLead, ex.: `https://radarlead5.netlify.app` |
| `DADOS_DIR` | pasta persistente da sessão (padrão `./dados`) |
| `TETO_INICIAL` | mensagens no primeiro dia (padrão 20) |
| `TETO_MAXIMO` | teto depois do aquecimento (padrão 60) |

No RastroLead (Netlify), configure `WHATSAPP_WORKER_URL` apontando para este
serviço e `WHATSAPP_WORKER_SECRET` com o mesmo valor de `CHAVE`.
