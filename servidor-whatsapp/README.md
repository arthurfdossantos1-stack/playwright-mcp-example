# Servidor de WhatsApp do RastroLead

Mantém a sessão do WhatsApp conectada e dispara a fila **devagar**, com
intervalo sorteado, teto diário e aquecimento.

## Como ele conversa com o app

Ele **pergunta** ao RastroLead se tem trabalho, num laço. Nada entra aqui de
fora — só saem requisições.

Isso é o que permite rodar num celular: não precisa de IP público, nem de
túnel, nem de URL que muda a cada reinício. E o estado do disparo vive no
app, então **se o processo morrer no meio, você reabre e ele retoma de onde
parou**.

## Antes de subir: leia

Isto usa uma biblioteca **não oficial** que se passa pelo WhatsApp Web.

- **Viola os termos do WhatsApp.** O banimento é do número e costuma ser
  permanente.
- **Use um chip descartável.** Nunca o seu número pessoal ou o da empresa.
- **Comece devagar.** O padrão embutido começa em 20 mensagens/dia e sobe 10
  por dia. Na primeira semana, prefira o intervalo de 90 a 180 segundos.
- Quem pedir para parar de receber tem que sair da sua lista. Além da LGPD,
  denúncia de usuário é o que mais acelera banimento.

## Variáveis

| Variável | Para que serve |
|---|---|
| `APP_URL` | URL do RastroLead, ex.: `https://radarlead5.netlify.app` |
| `CHAVE` | o mesmo valor de `WHATSAPP_WORKER_SECRET` na Netlify |
| `USUARIO_ID` | seu id de usuário — aparece na tela de disparo do app |
| `DADOS_DIR` | pasta da sessão (padrão `./dados`) |
| `TETO_INICIAL` | mensagens no primeiro dia (padrão 20) |
| `TETO_MAXIMO` | teto depois do aquecimento (padrão 60) |
| `ESPERA_OCIOSO` | segundos entre consultas quando não há trabalho (padrão 8) |

Na Netlify basta `WHATSAPP_WORKER_SECRET`. O `WHATSAPP_WORKER_URL` não é mais
necessário — o app não chama o servidor.

## Rodando no Termux (celular Android)

```bash
pkg update && pkg upgrade
pkg install nodejs git
git clone https://github.com/arthurfdossantos1-stack/playwright-mcp-example
cd playwright-mcp-example/servidor-whatsapp
npm install

export APP_URL="https://radarlead5.netlify.app"
export CHAVE="o-mesmo-segredo-da-netlify"
export USUARIO_ID="seu-id-da-tela-de-disparo"
npm start
```

Depois, no RastroLead: **Disparo automático → Gerar QR Code**. O código
aparece na tela do app em poucos segundos — escaneie com o celular do chip
descartável.

### Para o Android não matar o processo

```bash
termux-wake-lock
```

E ainda:

- Configurações do Android → Apps → Termux → Bateria → **Sem restrições**
- Fixe o Termux na tela de apps recentes
- **Nunca ligue o modo economia de bateria** — ele ignora o wake lock
- Use `tmux` para a sessão sobreviver ao fechar o terminal

Mesmo assim o Android pode matar o processo, principalmente da versão 14 em
diante. Não é problema: reabra o Termux, rode `npm start` de novo e o disparo
continua de onde parou. Enquanto estiver disparando, o melhor é **deixar a
tela do Termux aberta**.

## Se aparecer "app respondeu 401"

Significa que a rota existe no site publicado (senão seria 404), mas a chave
não bate. O próprio servidor diagnostica: ele consulta
`SEU_SITE/api/whatsapp/agente` e diz em uma linha qual é a causa — variável
ausente, valor diferente, aspas ou espaço sobrando.

Você também pode abrir esse endereço no navegador. Ele devolve algo assim:

```json
{ "configurado": true, "tamanho": 44, "impressao": "015c1470" }
```

Nenhum segredo sai daí: `impressao` é um resumo de 8 dígitos, só para
comparar os dois lados. Para ver a impressão da sua chave local:

```bash
node -e 'console.log(require("node:crypto").createHash("sha256").update("rastrolead-impressao-v1"+process.env.CHAVE).digest("hex").slice(0,8))'
```

Iguais, o problema não é a chave. Diferentes — ou `configurado: false` —
ajuste na Netlify em **Site configuration → Environment variables**,
deixando marcados **todos os deploy contexts** e **todos os scopes**
(`Functions` inclusive; só `Builds` não chega na rota). Depois **Trigger
deploy → Clear cache and deploy site**: na Netlify a variável entra na função
no momento do deploy, então salvar sem republicar não muda nada.

## Rodando num servidor de verdade

Qualquer lugar que rode Node 24h: Railway, Render, Fly.io, VPS. Cerca de
R$ 30 a 60 por mês. Precisa de **disco persistente** em `DADOS_DIR`, senão a
sessão se perde a cada reinício e você refaz o QR. A vantagem sobre o Termux
é disparar com o celular desligado.
