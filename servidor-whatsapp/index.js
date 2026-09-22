/**
 * Servidor de WhatsApp do RastroLead — modo PULL.
 *
 * Ele PERGUNTA ao app se tem trabalho, num laço. Nada entra aqui de fora.
 *
 * Por que assim: rodando num celular (Termux) não existe IP público. Com o
 * app chamando o servidor seria preciso túnel, e a URL do túnel muda a cada
 * reinício — o que significaria reconfigurar a Netlify toda vez. Perguntando,
 * uma requisição de saída basta, e isso funciona atrás de qualquer NAT.
 *
 * O estado do disparo vive no app, não aqui. Se o Android matar este
 * processo no meio, você reabre e ele retoma de onde parou.
 */

import qrcode from "qrcode";
import pino from "pino";
import fs from "node:fs";
import path from "node:path";
import {
  makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
} from "baileys";

const APP_URL = (process.env.APP_URL ?? "").replace(/\/$/, "");
const CHAVE = process.env.CHAVE ?? "";
const USUARIO_ID = process.env.USUARIO_ID ?? "";
const DADOS_DIR = process.env.DADOS_DIR ?? "./dados";
const TETO_INICIAL = Number(process.env.TETO_INICIAL ?? 20);
const TETO_MAXIMO = Number(process.env.TETO_MAXIMO ?? 60);
/** Intervalo entre consultas quando não há nada a fazer. */
const ESPERA_OCIOSO = Number(process.env.ESPERA_OCIOSO ?? 8) * 1000;

const log = pino({ level: "info", transport: { target: "pino-pretty" } });

if (!APP_URL || !CHAVE || !USUARIO_ID) {
  log.error("Faltam APP_URL, CHAVE ou USUARIO_ID. Veja o README.");
  process.exit(1);
}

fs.mkdirSync(DADOS_DIR, { recursive: true });

let socket = null;
let qrAtual = null;
let conectado = false;
let numeroConectado = null;
let pausar = null;
const resultadosPendentes = [];

const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

// ------------------------------------------------------- aquecimento

const ARQUIVO = path.join(DADOS_DIR, "historico.json");
const hoje = () => new Date().toISOString().slice(0, 10);

function lerHistorico() {
  try {
    return JSON.parse(fs.readFileSync(ARQUIVO, "utf8"));
  } catch {
    return { primeiroDia: null, porDia: {} };
  }
}

function gravarHistorico(h) {
  try {
    fs.writeFileSync(ARQUIVO, JSON.stringify(h));
  } catch (e) {
    log.warn({ e }, "não consegui gravar o histórico");
  }
}

/**
 * Teto de hoje, com aquecimento: chip novo disparando no volume máximo é
 * banido quase na hora. Começa em TETO_INICIAL e sobe 10 por dia.
 */
function tetoDeHoje() {
  const h = lerHistorico();
  if (!h.primeiroDia) return TETO_INICIAL;
  const dias = Math.floor((Date.parse(hoje()) - Date.parse(h.primeiroDia)) / 86400000);
  return Math.min(TETO_MAXIMO, TETO_INICIAL + dias * 10);
}

const enviadasHoje = () => lerHistorico().porDia[hoje()] ?? 0;

function registrarEnvio() {
  const h = lerHistorico();
  if (!h.primeiroDia) h.primeiroDia = hoje();
  h.porDia[hoje()] = (h.porDia[hoje()] ?? 0) + 1;
  gravarHistorico(h);
}

// ----------------------------------------------------------- conexão

async function conectar() {
  if (socket) return;

  const { state, saveCreds } = await useMultiFileAuthState(path.join(DADOS_DIR, "sessao"));
  const { version } = await fetchLatestBaileysVersion();
  socket = makeWASocket({ version, auth: state, logger: pino({ level: "silent" }) });

  socket.ev.on("creds.update", saveCreds);

  socket.ev.on("connection.update", async (u) => {
    const { connection, lastDisconnect, qr } = u;

    if (qr) {
      qrAtual = await qrcode.toDataURL(qr, { margin: 1, width: 320 });
      log.info("QR Code novo — abra a tela de disparo no RastroLead");
    }

    if (connection === "open") {
      conectado = true;
      qrAtual = null;
      numeroConectado = socket.user?.id?.split(":")[0] ?? null;
      log.info({ numeroConectado }, "conectado");
    }

    if (connection === "close") {
      conectado = false;
      const deslogado = lastDisconnect?.error?.output?.statusCode === DisconnectReason.loggedOut;
      log.warn({ deslogado }, "conexão caiu");
      // Seguir enviando sem conexão é o caminho curto pro banimento.
      pausar = "conexão do WhatsApp caiu";
      socket = null;
      if (!deslogado) setTimeout(() => conectar().catch(() => {}), 5000);
      else {
        numeroConectado = null;
        qrAtual = null;
      }
    }
  });
}

async function desconectar() {
  try {
    await socket?.logout();
  } catch {
    /* já estava fora */
  }
  socket = null;
  conectado = false;
  qrAtual = null;
  numeroConectado = null;
  fs.rmSync(path.join(DADOS_DIR, "sessao"), { recursive: true, force: true });
  log.info("desconectado e sessão apagada");
}

// -------------------------------------------------------------- laço

async function consultar() {
  const corpo = {
    userId: USUARIO_ID,
    conectado,
    numero: numeroConectado,
    qr: qrAtual,
    enviadasHoje: enviadasHoje(),
    tetoHoje: tetoDeHoje(),
    resultados: resultadosPendentes.splice(0, resultadosPendentes.length),
    pausar,
  };
  pausar = null;

  const r = await fetch(`${APP_URL}/api/whatsapp/agente`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-chave-worker": CHAVE },
    body: JSON.stringify(corpo),
    signal: AbortSignal.timeout(30_000),
  });

  if (!r.ok) {
    // Devolve os resultados à fila: perder confirmação faz o app reenviar o
    // mesmo lead depois, e ninguém quer receber a mensagem duas vezes.
    resultadosPendentes.unshift(...corpo.resultados);
    throw new Error(`app respondeu ${r.status}`);
  }
  return r.json();
}

async function enviarItem(item) {
  const jid = `${item.numero}@s.whatsapp.net`;
  try {
    // Número sem WhatsApp é mensagem que nunca chega e conta como sinal ruim.
    const [existe] = await socket.onWhatsApp(jid);
    if (!existe?.exists) {
      resultadosPendentes.push({ itemId: item.id, estado: "pulado", motivo: "não tem WhatsApp" });
      return true;
    }

    await socket.sendMessage(jid, { text: item.texto });
    registrarEnvio();
    resultadosPendentes.push({ itemId: item.id, estado: "enviado" });
    log.info({ numero: item.numero }, "enviada");
    return true;
  } catch (e) {
    const motivo = String(e?.message ?? e).slice(0, 300);
    log.error({ motivo }, "falha ao enviar");
    resultadosPendentes.push({ itemId: item.id, estado: "falhou", motivo });
    return false;
  }
}

async function laco() {
  let falhasSeguidas = 0;

  for (;;) {
    let trabalho = null;
    try {
      trabalho = await consultar();
    } catch (e) {
      log.warn({ e: String(e?.message ?? e) }, "não consegui falar com o app");
      await dormir(ESPERA_OCIOSO);
      continue;
    }

    if (trabalho.comando === "conectar") await conectar().catch((e) => log.error({ e }));
    if (trabalho.comando === "desconectar") await desconectar();

    const itens = trabalho.itens ?? [];
    if (!trabalho.disparo || itens.length === 0) {
      await dormir(ESPERA_OCIOSO);
      continue;
    }

    if (!conectado) {
      pausar = "WhatsApp não está conectado";
      await dormir(ESPERA_OCIOSO);
      continue;
    }

    const { intervaloMin, intervaloMax } = trabalho.disparo;

    for (const item of itens) {
      if (!conectado) {
        pausar = "conexão caiu no meio do disparo";
        break;
      }
      if (enviadasHoje() >= tetoDeHoje()) {
        pausar = `teto de hoje atingido (${tetoDeHoje()} mensagens)`;
        log.warn(pausar);
        break;
      }

      const ok = await enviarItem(item);
      falhasSeguidas = ok ? 0 : falhasSeguidas + 1;
      // Três falhas seguidas quase sempre é bloqueio começando.
      if (falhasSeguidas >= 3) {
        pausar = "três falhas seguidas — pode ser bloqueio";
        log.error(pausar);
        break;
      }

      // Intervalo SORTEADO: cadência regular é o que denuncia robô.
      const espera = intervaloMin + Math.random() * (intervaloMax - intervaloMin);
      log.info(`próxima em ${Math.round(espera)}s`);
      await dormir(espera * 1000);
    }
  }
}

log.info({ APP_URL, USUARIO_ID }, "servidor de WhatsApp em modo pull");
log.info(`teto de hoje: ${tetoDeHoje()} · enviadas hoje: ${enviadasHoje()}`);
laco().catch((e) => {
  log.error({ e }, "laço morreu");
  process.exit(1);
});
