/**
 * Servidor de WhatsApp do RastroLead.
 *
 * Mantém a sessão aberta (Baileys) e dispara a fila devagar. O app na Netlify
 * só enfileira e consulta — quem controla o ritmo é este processo, porque
 * função serverless não vive os 40 minutos que um disparo leva.
 *
 * As travas não são enfeite: disparo em rajada de chip novo é o padrão que a
 * Meta detecta mais rápido.
 */

import express from "express";
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

const PORTA = Number(process.env.PORTA ?? 8080);
const CHAVE = process.env.CHAVE ?? "";
const APP_URL = (process.env.APP_URL ?? "").replace(/\/$/, "");
const DADOS_DIR = process.env.DADOS_DIR ?? "./dados";
const TETO_INICIAL = Number(process.env.TETO_INICIAL ?? 20);
const TETO_MAXIMO = Number(process.env.TETO_MAXIMO ?? 60);

const log = pino({ level: "info" });
fs.mkdirSync(DADOS_DIR, { recursive: true });

// --------------------------------------------------------------- estado

let socket = null;
let qrAtual = null;
let conectado = false;
let numeroConectado = null;

/** Campanha em andamento. Só uma por vez, de propósito. */
let campanha = null;

// ------------------------------------------------------- aquecimento

const ARQUIVO_HISTORICO = path.join(DADOS_DIR, "historico.json");

function lerHistorico() {
  try {
    return JSON.parse(fs.readFileSync(ARQUIVO_HISTORICO, "utf8"));
  } catch {
    return { primeiroDia: null, porDia: {} };
  }
}

function gravarHistorico(h) {
  try {
    fs.writeFileSync(ARQUIVO_HISTORICO, JSON.stringify(h));
  } catch (e) {
    log.warn({ e }, "não consegui gravar o histórico");
  }
}

function hoje() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Teto de hoje, com aquecimento.
 *
 * Chip novo disparando no volume máximo é banido quase na hora. Começa em
 * TETO_INICIAL e sobe 10 por dia de uso até TETO_MAXIMO.
 */
function tetoDeHoje() {
  const h = lerHistorico();
  if (!h.primeiroDia) return TETO_INICIAL;
  const dias = Math.floor((Date.parse(hoje()) - Date.parse(h.primeiroDia)) / 86400000);
  return Math.min(TETO_MAXIMO, TETO_INICIAL + dias * 10);
}

function enviadasHoje() {
  return lerHistorico().porDia[hoje()] ?? 0;
}

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
      // Vira data URL pra tela do app conseguir exibir direto.
      qrAtual = await qrcode.toDataURL(qr, { margin: 1, width: 320 });
      log.info("QR Code novo disponível");
    }

    if (connection === "open") {
      conectado = true;
      qrAtual = null;
      numeroConectado = socket.user?.id?.split(":")[0] ?? null;
      log.info({ numeroConectado }, "conectado");
    }

    if (connection === "close") {
      conectado = false;
      const motivo = lastDisconnect?.error?.output?.statusCode;
      const deslogado = motivo === DisconnectReason.loggedOut;
      log.warn({ motivo, deslogado }, "conexão caiu");

      // Desconexão para a campanha: continuar enviando às cegas é o caminho
      // mais curto pro banimento.
      pararCampanha("conexão do WhatsApp caiu");

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
  pararCampanha("desconectado pelo usuário");
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
}

// --------------------------------------------------------- campanha

function pararCampanha(motivo) {
  if (!campanha || campanha.estado !== "rodando") return;
  campanha.estado = "parada";
  campanha.motivo = motivo;
  log.warn({ motivo }, "campanha parada");
}

function esperar(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/** Avisa o app que o lead foi contatado, reusando a rota que a fila manual já usa. */
async function marcarContatado(item, userId) {
  if (!APP_URL) return;
  try {
    await fetch(`${APP_URL}/api/fila/contatado`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-chave-worker": CHAVE },
      body: JSON.stringify({ empresaId: item.empresaId, leadId: item.leadId, userId }),
    });
  } catch (e) {
    log.warn({ e }, "não consegui marcar como contatado");
  }
}

async function rodarCampanha() {
  const c = campanha;

  for (const item of c.itens) {
    if (c.estado !== "rodando") break;

    if (enviadasHoje() >= tetoDeHoje()) {
      pararCampanha(`teto de hoje atingido (${tetoDeHoje()} mensagens)`);
      break;
    }
    if (!conectado) {
      pararCampanha("WhatsApp desconectado");
      break;
    }

    const jid = `${item.numero}@s.whatsapp.net`;

    try {
      // Número sem WhatsApp = mensagem que nunca chega e conta como sinal
      // ruim. Conferir antes sai mais barato do que enviar no escuro.
      const [existe] = await socket.onWhatsApp(jid);
      if (!existe?.exists) {
        c.pulados.push({ ...item, motivo: "não tem WhatsApp" });
        continue;
      }

      await socket.sendMessage(jid, { text: item.texto });
      registrarEnvio();
      c.enviados.push(item.empresaId);
      await marcarContatado(item, c.userId);
    } catch (e) {
      log.error({ e, numero: item.numero }, "falha ao enviar");
      c.falhas.push({ ...item, motivo: String(e?.message ?? e) });
      // Três falhas seguidas quase sempre é bloqueio começando.
      if (c.falhas.length >= 3) {
        pararCampanha("três falhas seguidas — pode ser bloqueio");
        break;
      }
    }

    // Intervalo ALEATÓRIO: cadência humana é irregular, e regularidade é o
    // que denuncia robô.
    const espera = c.intervaloMin + Math.random() * (c.intervaloMax - c.intervaloMin);
    await esperar(espera * 1000);
  }

  if (c.estado === "rodando") {
    c.estado = "concluida";
    c.motivo = null;
  }
  c.terminadaEm = new Date().toISOString();
}

// ------------------------------------------------------------- HTTP

const app = express();
app.use(express.json({ limit: "2mb" }));

app.use((req, res, next) => {
  if (req.path === "/saude") return next();
  if (!CHAVE || req.get("x-chave") !== CHAVE) {
    return res.status(401).json({ erro: "Chave inválida." });
  }
  next();
});

app.get("/saude", (_req, res) => res.json({ ok: true }));

app.get("/estado", (_req, res) => {
  res.json({
    conectado,
    numero: numeroConectado,
    qr: qrAtual,
    tetoHoje: tetoDeHoje(),
    enviadasHoje: enviadasHoje(),
    campanha: campanha && {
      estado: campanha.estado,
      motivo: campanha.motivo,
      total: campanha.itens.length,
      enviados: campanha.enviados.length,
      pulados: campanha.pulados.length,
      falhas: campanha.falhas.length,
    },
  });
});

app.post("/conectar", async (_req, res) => {
  try {
    await conectar();
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ erro: String(e?.message ?? e) });
  }
});

app.post("/desconectar", async (_req, res) => {
  await desconectar();
  res.json({ ok: true });
});

app.post("/campanha", async (req, res) => {
  if (!conectado) return res.status(400).json({ erro: "WhatsApp não está conectado." });
  if (campanha?.estado === "rodando") {
    return res.status(409).json({ erro: "Já existe um disparo em andamento." });
  }

  const { itens, userId, intervaloMin = 45, intervaloMax = 90 } = req.body ?? {};
  if (!Array.isArray(itens) || itens.length === 0) {
    return res.status(400).json({ erro: "Nenhum lead para disparar." });
  }

  const cabem = Math.max(0, tetoDeHoje() - enviadasHoje());
  if (cabem === 0) {
    return res.status(429).json({ erro: `Teto de hoje atingido (${tetoDeHoje()} mensagens).` });
  }

  campanha = {
    estado: "rodando",
    motivo: null,
    userId,
    // Nunca aceita mais do que cabe no teto de hoje, mesmo que o app peça.
    itens: itens.slice(0, cabem),
    intervaloMin: Math.max(20, Number(intervaloMin)),
    intervaloMax: Math.max(Number(intervaloMin) + 10, Number(intervaloMax)),
    enviados: [],
    pulados: [],
    falhas: [],
    comecouEm: new Date().toISOString(),
  };

  rodarCampanha().catch((e) => log.error({ e }, "campanha morreu"));
  res.json({ ok: true, total: campanha.itens.length, tetoHoje: tetoDeHoje() });
});

app.post("/campanha/parar", (_req, res) => {
  pararCampanha("parado pelo usuário");
  res.json({ ok: true });
});

app.listen(PORTA, () => {
  log.info({ PORTA }, "servidor de WhatsApp no ar");
  if (!CHAVE) log.error("CHAVE não configurada — o serviço vai recusar tudo");
});
