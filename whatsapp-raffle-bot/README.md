# Bot de Rifa no WhatsApp (Termux)

Bot de WhatsApp **não oficial**, feito com [Baileys](https://github.com/WhiskeySockets/Baileys), para
controlar a venda de números de rifa direto pelo WhatsApp. Não usa navegador (Chromium/Puppeteer),
só o protocolo do WhatsApp Web — por isso roda bem em algo leve como o Termux.

Os dados ficam salvos em `data/raffles.json` (números disponíveis, vendidos e para quem).

> **Aviso:** isso usa uma biblioteca não oficial, conectada como um "aparelho vinculado" da sua
> própria conta de WhatsApp. Não é afiliado/aprovado pela Meta e existe risco (baixo, mas real)
> de o número ser bloqueado se for usado com volume muito alto. Para uma rifa entre
> amigos/conhecidos o uso é tranquilo.

## Como funciona

Você conversa com **você mesmo** no WhatsApp (função "Mensagens para você" — procure seu próprio
número/nome no WhatsApp) e manda comandos. Se quiser que outras pessoas também possam registrar
vendas direto no número do bot, coloque os números delas em `AUTHORIZED_NUMBERS` no `.env`.

Também dá pra usar em **grupos específicos** (por exemplo, um grupo com quem está vendendo os
números da rifa): entre no grupo e mande, de dentro dele, `autorizar grupo` — só funciona quando
é você (dono do bot) mandando. A partir daí, qualquer mensagem naquele grupo é lida como comando
(`23 João Silva`, `disponiveis`, etc.), igual ao chat pessoal. Pra tirar a permissão, mande
`desautorizar grupo`. Outros grupos que você participa continuam ignorados normalmente.

O bot só responde a comandos reconhecidos (e ao nome dele, se configurado — veja abaixo).
Mensagens comuns, tipo "oi" ou papo aleatório, ficam sem resposta.

### Comandos

```
nova <quantidade> [nome]        cria uma rifa nova (fica ativa). Ex: nova 500 Rifa de Pascoa
<numero(s)> <nome do comprador>  registra venda(s). Ex: 23 Joao Silva  /  Ex: 1,2,3 Joao Silva
vender <numero(s)> <nome>       mesma coisa, forma explicita
                                 varias linhas tambem funciona, uma venda por linha:
                                   10 Maria
                                   11 Joao
                                   12 Kaio
excluir/desfazer/desmarcar <numero(s)>   libera numero(s) vendido(s) por engano
excluir/desfazer/desmarcar todos          libera TODOS os numeros vendidos da rifa ativa
excluir rifa [id]                apaga uma rifa inteira (sem id, apaga a rifa ativa)
status <numero>                  consulta um numero especifico
disponiveis                      manda uma imagem com todos os numeros, X nos ja vendidos
vendidos                         lista em texto os numeros vendidos e para quem
rifas                            lista todas as rifas ja criadas
usar <id>                        troca qual rifa esta ativa
pix                              mostra os dados de pagamento configurados no .env
apagar                           apaga a ultima mensagem que o bot mandou naquele chat
ajuda                            mostra o menu de comandos

autorizar grupo                  (dentro de um grupo, so o dono) libera os comandos ali
desautorizar grupo               (dentro de um grupo, so o dono) remove a permissao
```

Pra usar o comando `pix`, preencha `PIX_KEY` (e opcionalmente `PIX_NAME`, `PIX_BANK`) no `.env` —
ou `PIX_MESSAGE` se quiser controlar o texto inteiro. Veja o `.env.example`.

Os comandos funcionam com ou sem acento e em qualquer combinação de maiúsculas/minúsculas
(`disponiveis`, `disponíveis`, `DISPONÍVEIS` — todos funcionam igual).

### Confirmar que o bot está online

Se preencher `BOT_NAME` no `.env` (ex: `BOT_NAME=Pierre`), mandar só esse nome funciona como
um "tá vivo?" — o bot responde confirmando que está online, sem precisar lembrar um comando.

## Instalação no Termux

1. Instale o **Termux** pela [F-Droid](https://f-droid.org/packages/com.termux/) (a versão da
   Play Store está desatualizada e pode dar problema).

2. Atualize os pacotes e instale Node.js e git:

   ```bash
   pkg update && pkg upgrade
   pkg install nodejs git
   node -v   # confira se é 18 ou mais novo
   ```

3. Baixe o repositório direto do GitHub (troque a URL se o seu repositório for outro) e entre na
   pasta do bot:

   ```bash
   git clone -b claude/whatsapp-raffle-bot-7chewp https://github.com/arthurfdossantos1-stack/playwright-mcp-example.git
   cd playwright-mcp-example/whatsapp-raffle-bot
   npm install
   ```

   Se o repositório for privado, o Git vai pedir usuário e senha — use um
   [personal access token](https://github.com/settings/tokens) do GitHub no lugar da senha.

4. Crie o arquivo de configuração:

   ```bash
   cp .env.example .env
   ```

   Se quiser permitir que outras pessoas registrem vendas direto no número do bot, edite o `.env`
   e preencha `AUTHORIZED_NUMBERS` (DDI+DDD+número, só dígitos, separado por vírgula). Isso é
   opcional — falar com você mesmo sempre funciona, mesmo com o `.env` vazio.

   Também dá pra preencher `PAIRING_NUMBER` com o seu próprio número, se quiser que o bot já
   gere o código de pareamento direto ao iniciar (veja o passo 7).

5. Evite que o Android mate o processo enquanto o Termux estiver em segundo plano:

   ```bash
   termux-wake-lock
   ```

   E, nas configurações do Android, tire o Termux da otimização de bateria (senão o sistema
   derruba a conexão depois de um tempo com a tela apagada).

6. Rode o bot:

   ```bash
   npm start
   ```

7. Vai aparecer um **QR code** no terminal e, logo abaixo, uma pergunta:

   ```
   Digite seu numero com DDI+DDD, so numeros (ex: 5511999999999), ou aperte Enter para usar so o QR:
   ```

   Você escolhe **um dos dois** jeitos de conectar:

   - **QR code**: no WhatsApp do celular vá em `Configurações` → `Aparelhos conectados` →
     `Conectar um aparelho`, e escaneie o QR que apareceu no Termux. Nesse caso, só aperte
     Enter na pergunta do terminal sem digitar nada.

     Se o desenho em texto do terminal ficar cortado/ilegível (comum em tela de celular), o bot
     também salva o mesmo QR como imagem em `qr.png`, na pasta do projeto. Copie esse arquivo
     para outro aparelho com câmera (celular, tablet, computador) e escaneie a imagem de lá —
     por exemplo, com `termux-setup-storage` e depois:

     ```bash
     cp qr.png ~/storage/downloads/
     ```

     e abra o arquivo pela Galeria/Arquivos do Android numa tela maior, ou envie para outro
     aparelho (e-mail, Bluetooth, etc.) para escanear de lá.
   - **Código de pareamento**: digite seu número (com DDI+DDD, só números) e aperte Enter. O
     terminal mostra um **código de 8 caracteres**. No WhatsApp: `Configurações` →
     `Aparelhos conectados` → `Conectar um aparelho` → `Conectar com número de telefone` (link
     embaixo da tela do QR) e digite o código.

   Se preferir não responder nada toda vez, preencha `PAIRING_NUMBER` no `.env` (passo 4) — o
   bot já pede o código de pareamento direto ao iniciar, sem perguntar no terminal.

8. Depois de conectar, abra uma conversa com você mesmo no WhatsApp e mande `ajuda` para ver o
   bot respondendo.

### Mantendo rodando em segundo plano

Se fechar o Termux o processo é encerrado. Para manter rodando mesmo saindo do app, use `tmux`:

```bash
pkg install tmux
tmux new -s rifa
npm start
# Ctrl+B depois D para "desanexar" e deixar rodando em segundo plano
# Para voltar: tmux attach -t rifa
```

Para o bot voltar sozinho se o celular reiniciar, dá para usar o addon
[Termux:Boot](https://wiki.termux.com/wiki/Termux:Boot) para iniciar automaticamente.

### Backup dos dados

Todo o histórico da rifa fica em `data/raffles.json`. Vale copiar esse arquivo de vez em quando
para outro lugar (Google Drive, e-mail para você mesmo, etc.), por exemplo com
`termux-setup-storage` e copiando para `~/storage/downloads/`.

### Login expirou / trocar de número

Apague a pasta `auth_info/` e rode `npm start` de novo para escanear um novo QR code. Isso não
apaga os dados das rifas (`data/raffles.json`), só a sessão de login do WhatsApp.
