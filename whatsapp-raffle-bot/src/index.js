import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';
import makeWASocket, {
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import pino from 'pino';
import qrcode from 'qrcode-terminal';
import QRCode from 'qrcode';
import { handleCommand } from './commands.js';
import { isAuthorizedGroup, addAuthorizedGroup, removeAuthorizedGroup } from './groups.js';

// A biblioteca de criptografia (libsignal) usa console.info diretamente para
// avisos de rotina ("Closing session", "Opening session"...), ignorando o
// nosso logger. Isso lota o terminal e esconde os logs que importam.
console.info = () => {};

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AUTH_DIR = path.join(__dirname, '..', 'auth_info');
const ENV_FILE = path.join(__dirname, '..', '.env');
const QR_IMAGE_PATH = path.join(__dirname, '..', 'qr.png');

function loadEnvFile() {
  if (!fs.existsSync(ENV_FILE)) return;
  const lines = fs.readFileSync(ENV_FILE, 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnvFile();

const authorizedJids = (process.env.AUTHORIZED_NUMBERS || '')
  .split(',')
  .map((n) => n.replace(/\D/g, ''))
  .filter(Boolean)
  .map((n) => `${n}@s.whatsapp.net`);

function normalizeJid(jid) {
  return jid.split(':')[0] + '@s.whatsapp.net';
}

// O WhatsApp vem migrando as conversas (incluindo a de "mensagens para voce")
// para um identificador @lid em vez do numero de telefone. sock.user.lid traz
// esse identificador equivalente ao seu proprio numero.
function normalizeLid(lid) {
  const user = lid.split('@')[0].split(':')[0];
  return `${user}@lid`;
}

function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

// Guarda a escolha (numero ou "so QR") feita na primeira tentativa de conexao,
// para nao ficar perguntando de novo a cada reconexao automatica.
let pairingChoiceMade = false;
let pairingPhoneNumber = '';

async function setupPairingCode(sock) {
  if (!pairingChoiceMade) {
    pairingPhoneNumber = (process.env.PAIRING_NUMBER || '').replace(/\D/g, '');
    if (!pairingPhoneNumber) {
      console.log('\nAlem do QR code, da para conectar por CODIGO DE PAREAMENTO (sem escanear nada).');
      const answer = await ask(
        'Digite seu numero com DDI+DDD, so numeros (ex: 5511999999999), ou aperte Enter para usar so o QR: '
      );
      pairingPhoneNumber = answer.replace(/\D/g, '');
    }
    pairingChoiceMade = true;
  }

  if (!pairingPhoneNumber) return;

  try {
    const code = await sock.requestPairingCode(pairingPhoneNumber);
    console.log(`\nCodigo de pareamento: ${code}`);
    console.log(
      'No WhatsApp: Aparelhos conectados > Conectar um aparelho > "Conectar com numero de telefone" e digite esse codigo.\n'
    );
  } catch (err) {
    console.error('Nao foi possivel gerar o codigo de pareamento:', err?.message || err);
  }
}

// O WhatsApp as vezes embrulha a mensagem de verdade dentro de outra (mensagem
// efemera, "ver uma vez", ou repassada de outro aparelho seu). Desembrulha ate
// achar o texto de fato.
function unwrapMessage(message) {
  if (!message) return message;
  const wrapperKey = [
    'ephemeralMessage',
    'viewOnceMessage',
    'viewOnceMessageV2',
    'viewOnceMessageV2Extension',
    'documentWithCaptionMessage',
    'deviceSentMessage',
  ].find((key) => message[key]?.message);
  return wrapperKey ? unwrapMessage(message[wrapperKey].message) : message;
}

function getText(msg) {
  const m = unwrapMessage(msg.message);
  if (!m) return null;
  return m.conversation || m.extendedTextMessage?.text || m.imageMessage?.caption || null;
}

// Guarda a chave da ultima mensagem que o bot mandou em cada conversa, para
// o comando "apagar" poder revoga-la (delete for everyone).
const lastSentMessageKey = new Map();

async function sendChunked(sock, jid, text) {
  const MAX_LEN = 3500;
  let sent;
  for (let i = 0; i < text.length; i += MAX_LEN) {
    sent = await sock.sendMessage(jid, { text: text.slice(i, i + MAX_LEN) });
  }
  return sent;
}

async function processMessage(sock, msg) {
  if (!msg.message) return;
  const remoteJid = msg.key.remoteJid;
  if (!remoteJid || remoteJid === 'status@broadcast') return;

  const isGroup = remoteJid.endsWith('@g.us');
  const text = getText(msg);

  // So o dono do bot (fromMe, ou seja, mandado do proprio WhatsApp dele) pode
  // autorizar ou remover um grupo, mandando a mensagem dentro do grupo.
  if (isGroup && msg.key.fromMe && text) {
    const normalized = text.trim().toLowerCase();
    if (normalized === 'autorizar grupo') {
      const added = addAuthorizedGroup(remoteJid);
      await sendChunked(
        sock,
        remoteJid,
        added ? 'Grupo autorizado! Agora da pra usar os comandos da rifa aqui.' : 'Esse grupo ja estava autorizado.'
      );
      return;
    }
    if (normalized === 'desautorizar grupo') {
      const removed = removeAuthorizedGroup(remoteJid);
      await sendChunked(
        sock,
        remoteJid,
        removed ? 'Grupo desautorizado.' : 'Esse grupo nao estava autorizado.'
      );
      return;
    }
  }

  const ownJid = sock.user?.id ? normalizeJid(sock.user.id) : null;
  const ownLid = sock.user?.lid ? normalizeLid(sock.user.lid) : null;
  const isSelfChat = (ownJid !== null && remoteJid === ownJid) || (ownLid !== null && remoteJid === ownLid);
  const isFromAuthorizedNumber = !isGroup && !msg.key.fromMe && authorizedJids.includes(remoteJid);
  const isGroupAllowed = isGroup && isAuthorizedGroup(remoteJid);

  console.log(
    `[recebido] remoteJid=${remoteJid} fromMe=${msg.key.fromMe} autorizado=${isSelfChat || isFromAuthorizedNumber || isGroupAllowed} texto=${JSON.stringify(text)}`
  );

  if (!isSelfChat && !isFromAuthorizedNumber && !isGroupAllowed) return;
  if (!text) return;

  const reply = handleCommand(text);
  if (!reply) return;

  try {
    if (typeof reply === 'string') {
      const sent = await sendChunked(sock, remoteJid, reply);
      if (sent) lastSentMessageKey.set(remoteJid, sent.key);
    } else if (reply.image) {
      const sent = await sock.sendMessage(remoteJid, { image: reply.image, caption: reply.caption });
      lastSentMessageKey.set(remoteJid, sent.key);
    } else if (reply.action === 'delete_last') {
      const key = lastSentMessageKey.get(remoteJid);
      if (key) {
        await sock.sendMessage(remoteJid, { delete: key });
        lastSentMessageKey.delete(remoteJid);
      } else {
        await sendChunked(sock, remoteJid, 'Nao tenho nenhuma mensagem recente pra apagar aqui.');
      }
    }
    console.log(`[enviado] resposta enviada com sucesso para ${remoteJid}`);
  } catch (err) {
    console.error(`[erro ao enviar] nao consegui responder para ${remoteJid}:`, err?.message || err);
  }
}

async function start() {
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log('\nEscaneie o QR code no WhatsApp: Aparelhos conectados > Conectar um aparelho\n');
      qrcode.generate(qr, { small: true });
      QRCode.toFile(QR_IMAGE_PATH, qr, { width: 512 })
        .then(() => {
          console.log(`\nSe o desenho acima nao escanear direito, o mesmo QR foi salvo como imagem em: ${QR_IMAGE_PATH}`);
          console.log('Copie esse arquivo para outro aparelho (ou abra numa tela maior) e escaneie a imagem.\n');
        })
        .catch((err) => console.error('Nao consegui salvar o QR como imagem:', err?.message || err));
    }

    if (connection === 'close') {
      const statusCode = new Boom(lastDisconnect?.error).output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
      console.log('Conexao encerrada. Reconectar:', shouldReconnect);
      if (shouldReconnect) {
        start();
      } else {
        console.log('Sessao desconectada pelo WhatsApp. Apague a pasta auth_info/ e rode de novo para escanear o QR.');
      }
    } else if (connection === 'open') {
      console.log('Conectado ao WhatsApp. Numero do bot:', sock.user?.id);
      console.log('Mande "ajuda" para voce mesmo no WhatsApp para ver os comandos.');
    }
  });

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    for (const msg of messages) {
      try {
        await processMessage(sock, msg);
      } catch (err) {
        console.error('Erro ao processar mensagem:', err);
      }
    }
  });

  if (!state.creds.registered) {
    await setupPairingCode(sock);
  }
}

start().catch((err) => {
  console.error('Falha ao iniciar o bot:', err);
  process.exit(1);
});
