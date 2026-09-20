import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import makeWASocket, {
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import pino from 'pino';
import qrcode from 'qrcode-terminal';
import { handleCommand } from './commands.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AUTH_DIR = path.join(__dirname, '..', 'auth_info');
const ENV_FILE = path.join(__dirname, '..', '.env');

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

function getText(msg) {
  const m = msg.message;
  if (!m) return null;
  return m.conversation || m.extendedTextMessage?.text || m.imageMessage?.caption || null;
}

async function sendChunked(sock, jid, text) {
  const MAX_LEN = 3500;
  for (let i = 0; i < text.length; i += MAX_LEN) {
    await sock.sendMessage(jid, { text: text.slice(i, i + MAX_LEN) });
  }
}

async function processMessage(sock, msg) {
  if (!msg.message) return;
  const remoteJid = msg.key.remoteJid;
  if (!remoteJid || remoteJid === 'status@broadcast') return;

  const ownJid = sock.user?.id ? normalizeJid(sock.user.id) : null;
  const isSelfChat = ownJid !== null && remoteJid === ownJid;
  const isFromAuthorizedNumber = !msg.key.fromMe && authorizedJids.includes(remoteJid);

  if (!isSelfChat && !isFromAuthorizedNumber) return;

  const text = getText(msg);
  if (!text) return;

  const reply = handleCommand(text);
  if (!reply) return;

  await sendChunked(sock, remoteJid, reply);
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
}

start().catch((err) => {
  console.error('Falha ao iniciar o bot:', err);
  process.exit(1);
});
