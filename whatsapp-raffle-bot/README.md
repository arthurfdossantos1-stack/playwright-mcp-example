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

### Comandos

```
nova <quantidade> [nome]        cria uma rifa nova (fica ativa). Ex: nova 500 Rifa de Pascoa
<numero> <nome do comprador>    registra uma venda. Ex: 23 Joao Silva
vender <numero> <nome>          mesma coisa, forma explicita
desfazer <numero>                libera um numero vendido por engano
status <numero>                  consulta um numero especifico
disponiveis                      mostra quantos e quais numeros restam
vendidos                         mostra os numeros vendidos e para quem
rifas                            lista todas as rifas ja criadas
usar <id>                        troca qual rifa esta ativa
ajuda                            mostra o menu de comandos
```

## Instalação no Termux

1. Instale o **Termux** pela [F-Droid](https://f-droid.org/packages/com.termux/) (a versão da
   Play Store está desatualizada e pode dar problema).

2. Atualize os pacotes e instale Node.js e git:

   ```bash
   pkg update && pkg upgrade
   pkg install nodejs git
   node -v   # confira se é 18 ou mais novo
   ```

3. Copie este projeto para o celular (git clone do seu repositório, ou transferindo a pasta
   `whatsapp-raffle-bot/` por qualquer meio) e entre nela:

   ```bash
   cd whatsapp-raffle-bot
   npm install
   ```

4. Crie o arquivo de configuração:

   ```bash
   cp .env.example .env
   ```

   Se quiser permitir que outras pessoas registrem vendas direto no número do bot, edite o `.env`
   e preencha `AUTHORIZED_NUMBERS` (DDI+DDD+número, só dígitos, separado por vírgula). Isso é
   opcional — falar com você mesmo sempre funciona, mesmo com o `.env` vazio.

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

7. Vai aparecer um **QR code** no terminal. No WhatsApp do celular: `Configurações` →
   `Aparelhos conectados` → `Conectar um aparelho`, e escaneie o QR.

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
