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
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
} from "baileys";

/**
 * Le o .env ao lado deste arquivo, se existir.
 *
 * Sem isso a configuracao so existia em `export`, que morre junto com a aba
 * do Termux: reabrir o app dava "Faltam APP_URL, CHAVE ou USUARIO_ID" e
 * obrigava a colar os tres de novo. Variavel ja presente no ambiente continua
 * ganhando, pra dar pra sobrescrever num teste sem editar arquivo.
 */
function carregarEnv() {
  const aqui = path.dirname(fileURLToPath(import.meta.url));
  let texto;
  try {
    texto = fs.readFileSync(path.join(aqui, ".env"), "utf8");
  } catch {
    return;
  }
  for (const linha of texto.split("\n")) {
    const par = linha.match(/^\s*([A-Za-z_][A-Za-z_0-9]*)\s*=\s*(.*)$/);
    if (!par) continue;
    // Aspas em volta do valor sao do formato, nao fazem parte da chave.
    const valor = par[2].trim().replace(/^(["\'])(.*)\1$/, "$2");
    if (process.env[par[1]] === undefined) process.env[par[1]] = valor;
  }
}

carregarEnv();

const APP_URL = (process.env.APP_URL ?? "").replace(/\/$/, "");
const CHAVE = process.env.CHAVE ?? "";
const USUARIO_ID = process.env.USUARIO_ID ?? "";
const DADOS_DIR = process.env.DADOS_DIR ?? "./dados";
const TETO_INICIAL = Number(process.env.TETO_INICIAL ?? 20);
const TETO_MAXIMO = Number(process.env.TETO_MAXIMO ?? 60);
/** Intervalo entre consultas quando não há nada a fazer. */
const ESPERA_OCIOSO = Number(process.env.ESPERA_OCIOSO ?? 8) * 1000;
/** Quanto tempo sem conexão antes de avisar o app que o disparo parou. */
const TOLERANCIA_QUEDA = Number(process.env.TOLERANCIA_QUEDA ?? 180) * 1000;

const log = pino({ level: "info", transport: { target: "pino-pretty" } });

if (!APP_URL || !CHAVE || !USUARIO_ID) {
  log.error(
    "Faltam APP_URL, CHAVE ou USUARIO_ID. Crie o arquivo servidor-whatsapp/.env a partir do .env.exemplo — assim não precisa exportar nada toda vez que abrir o Termux.",
  );
  process.exit(1);
}

fs.mkdirSync(DADOS_DIR, { recursive: true });

let socket = null;
let qrAtual = null;
let conectado = false;
let numeroConectado = null;
let pausar = null;
/** Desde quando está fora do ar, para separar oscilação de queda de verdade. */
let caiuEm = null;
let tentativasReconexao = 0;
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

const PASTA_SESSAO = path.join(DADOS_DIR, "sessao");

/**
 * Códigos em que a credencial guardada não serve mais.
 *
 * Este é o pior estado possível, e é silencioso: tendo credencial salva o
 * Baileys se considera registrado e **não emite QR**. Ele fica tentando
 * autenticar com algo que o WhatsApp recusa, num laço que nunca sai do
 * lugar — no app a tela pede o código para sempre, e aqui o log só repete
 * "caiu, reconectando". Apagar a sessão é o que devolve o QR.
 */
const SESSAO_MORTA = new Set([
  DisconnectReason.loggedOut,
  DisconnectReason.forbidden,
  DisconnectReason.badSession,
  DisconnectReason.multideviceMismatch,
]);

function apagarSessao() {
  fs.rmSync(PASTA_SESSAO, { recursive: true, force: true });
}

async function conectar() {
  if (socket) return;

  const { state, saveCreds } = await useMultiFileAuthState(PASTA_SESSAO);
  const { version } = await fetchLatestBaileysVersion();
  const meu = makeWASocket({ version, auth: state, logger: pino({ level: "silent" }) });
  socket = meu;

  meu.ev.on("creds.update", saveCreds);

  meu.ev.on("connection.update", async (u) => {
    // Evento de um socket que já foi substituído não pode mexer no estado
    // de agora: era assim que o fechamento de uma conexão velha zerava a
    // conexão nova que acabara de subir.
    if (socket !== meu) return;

    const { connection, lastDisconnect, qr } = u;

    if (qr) {
      qrAtual = await qrcode.toDataURL(qr, { margin: 1, width: 320 });
      log.info("QR Code novo — abra a tela de disparo no RastroLead");
    }

    if (connection === "open") {
      conectado = true;
      caiuEm = null;
      tentativasReconexao = 0;
      qrAtual = null;
      numeroConectado = meu.user?.id?.split(":")[0] ?? null;
      log.info({ numeroConectado }, "conectado");
    }

    if (connection === "close") {
      conectado = false;
      caiuEm ??= Date.now();
      socket = null;

      const codigo = lastDisconnect?.error?.output?.statusCode;

      // Codigo indefinido e queda comum de rede, nao recusa de credencial:
      // apagar a sessao ai custaria um QR novo sem motivo.
      if (codigo !== undefined && SESSAO_MORTA.has(codigo)) {
        log.warn({ codigo }, "a sessão salva não vale mais — apagando para gerar um QR novo");
        apagarSessao();
        numeroConectado = null;
        qrAtual = null;
        tentativasReconexao = 0;
        setTimeout(() => conectar().catch((e) => log.error({ e }, "falha ao reconectar")), 2000);
        return;
      }

      if (codigo === DisconnectReason.connectionReplaced) {
        // Outra cópia assumiu a conexão. Reconectar aqui faz as duas se
        // derrubarem em looping, e nada deixa um número suspeito mais rápido.
        log.error("outra cópia deste servidor assumiu a conexão — feche a outra antes de reiniciar");
        pausar = "outra cópia do servidor assumiu a conexão";
        return;
      }

      // Queda passageira aqui é a regra, não a exceção: rede de celular
      // oscila e o WhatsApp derruba o aparelho ligado de tempos em tempos.
      // Avisar o app a cada uma delas pausava o disparo inteiro e obrigava a
      // clicar de novo — foi assim que quatro disparos orfaos apareceram no
      // banco. Agora ele so reconecta, e o disparo espera parado.
      //
      // restartRequired e pedido do proprio WhatsApp logo depois do
      // pareamento: esperar ali so atrasa a primeira conexao.
      const espera =
        codigo === DisconnectReason.restartRequired
          ? 0
          : Math.min(60_000, 5_000 * 2 ** tentativasReconexao);
      if (espera) tentativasReconexao += 1;
      log.warn({ codigo, tentarEmSegundos: Math.round(espera / 1000) }, "conexão caiu, reconectando");
      setTimeout(() => conectar().catch((e) => log.error({ e }, "falha ao reconectar")), espera);
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
  apagarSessao();
  log.info("desconectado e sessão apagada");
}

// --------------------------------------------------------- chave errada

const SAL_IMPRESSAO = "rastrolead-impressao-v1";
let jaDiagnosticou = false;

/**
 * 401 é sempre a mesma família de erro, mas com causas diferentes, e o log
 * cru ("app respondeu 401") não separa elas. Aqui a gente pergunta ao app o
 * que ele tem — sem trocar segredo, só a impressão digital — e diz em uma
 * linha o que fazer.
 */
async function diagnosticarChave() {
  if (jaDiagnosticou) return;

  const minha = createHash("sha256").update(SAL_IMPRESSAO + CHAVE).digest("hex").slice(0, 8);

  let d;
  try {
    const r = await fetch(`${APP_URL}/api/whatsapp/agente`, {
      signal: AbortSignal.timeout(15_000),
    });
    if (r.status === 405 || r.status === 404) {
      log.error(
        "o app publicado é mais antigo que este servidor. Faça um novo deploy na Netlify (Trigger deploy > Clear cache and deploy site).",
      );
      return;
    }
    // Esta rota e publica de proposito. Se ELA pede autenticacao, quem esta
    // barrando nao e o app: e uma protecao na frente do site inteiro.
    if (r.status === 401 || r.status === 403) {
      log.error(
        "o site inteiro está protegido por login — nem a rota pública responde. Na Netlify: Site configuration > Access & security (ou as configurações da equipe) e deixe a produção pública.",
      );
      return;
    }
    if (!r.ok) {
      log.error(`diagnóstico respondeu ${r.status}; não dá pra dizer qual é a causa.`);
      return;
    }
    d = await r.json();
    // Só agora a resposta é conclusiva: antes disso vale tentar de novo,
    // senão um deploy antigo silenciaria o diagnóstico pra sempre.
    jaDiagnosticou = true;
  } catch (e) {
    log.error({ e: String(e?.message ?? e) }, "não consegui rodar o diagnóstico");
    return;
  }

  if (!d.configurado) {
    log.error(
      "o app NÃO tem WHATSAPP_WORKER_SECRET. Na Netlify: Site configuration > Environment variables > Add. Marque todos os deploy contexts e todos os scopes (Functions inclusive). Depois Trigger deploy > Clear cache and deploy site.",
    );
    return;
  }
  if (d.temAspas) {
    log.error("a chave no app está entre aspas. Salve o valor sem aspas e faça o deploy de novo.");
    return;
  }
  if (d.temEspacoSobrando) {
    log.error("a chave no app tem espaço sobrando nas pontas. Salve sem espaços e faça o deploy.");
    return;
  }
  if (d.impressao !== minha) {
    log.error(
      { chaveDoApp: `${d.tamanho} caracteres`, minhaChave: `${CHAVE.length} caracteres` },
      "o app tem uma chave DIFERENTE da sua. Copie o mesmo valor nos dois lados e faça o deploy.",
    );
    return;
  }

  log.error(
    "as duas chaves são iguais — então o 401 não é a chave. Confira se APP_URL aponta pro site publicado e me avise.",
  );
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
    const erro = new Error(`app respondeu ${r.status}`);
    erro.status = r.status;
    throw erro;
  }
  return r.json();
}

async function enviarItem(item) {
  try {
    // Número sem WhatsApp é mensagem que nunca chega e conta como sinal ruim.
    const [existe] = await socket.onWhatsApp(item.numero);
    if (!existe?.exists) {
      resultadosPendentes.push({ itemId: item.id, estado: "pulado", motivo: "não tem WhatsApp" });
      return "pulado";
    }

    // O JID de verdade vem daqui, e no Brasil ele quase nunca e o numero que
    // a gente tem: conta antiga vive sem o nono digito. Montar
    // `${numero}@s.whatsapp.net` manda pra um endereco que o servidor aceita
    // e ninguem recebe — a mensagem "sai" e nao chega em lugar nenhum.
    const jid = existe.jid ?? `${item.numero}@s.whatsapp.net`;
    await socket.sendMessage(jid, { text: item.texto });
    registrarEnvio();
    resultadosPendentes.push({ itemId: item.id, estado: "enviado" });
    log.info({ numero: item.numero, jid }, "enviada");
    return "enviado";
  } catch (e) {
    const motivo = String(e?.message ?? e).slice(0, 300);

    // Conexão que cai no meio do envio não é o lead recusando: o item fica
    // pendente e volta no próximo lote. Marcar como falha perderia o lead e
    // ainda contaria como sinal de bloqueio, que é outra coisa.
    if (!conectado || !socket) {
      log.warn({ motivo }, "conexão caiu no envio — o lead volta para a fila");
      return "semConexao";
    }

    log.error({ motivo }, "falha ao enviar");
    resultadosPendentes.push({ itemId: item.id, estado: "falhou", motivo });
    return "falhou";
  }
}

/** O app zera o comando ao entregar: quem le e o unico que pode agir. */
async function aplicarComando(comando) {
  if (comando === "conectar") {
    // Pedido explícito zera o que estiver meio-morto. Com um socket travado
    // em pé, o `if (socket) return` de conectar() engoliria o clique e a tela
    // ficaria pedindo o código sem nunca receber. Zerar `socket` antes do
    // end() faz o evento de fechamento do velho ser ignorado.
    if (socket && !conectado) {
      const velho = socket;
      socket = null;
      try {
        velho.end(undefined);
      } catch {
        /* já estava fora */
      }
    }
    await conectar().catch((e) => log.error({ e }, "falha ao conectar"));
  }
  if (comando === "desconectar") await desconectar();
}

/**
 * Espera entre mensagens sem sumir do mapa.
 *
 * O app decide "servidor no ar?" por `visto_em`, com 45s de tolerancia. Como
 * o intervalo entre mensagens chega a 180s, ficar so dormindo fazia a tela
 * dizer "fora do ar" e "desconectado" no meio de um disparo que estava indo
 * bem. De quebra, cada consulta entrega os resultados acumulados: se o
 * Android matar o Termux, perde-se no maximo a ultima mensagem, nao o lote.
 *
 * Os itens que vierem aqui sao ignorados de proposito — estamos no meio do
 * intervalo. Eles voltam na proxima volta do laco, menos os ja confirmados.
 */
async function esperarDandoSinal(ms) {
  const PEDACO = 20_000;
  for (let restante = ms; restante > 0; restante -= PEDACO) {
    await dormir(Math.min(PEDACO, restante));
    try {
      const trabalho = await consultar();
      // Comando entregue aqui nao volta na proxima: um "desconectar" clicado
      // no meio do intervalo sumiria se a gente so olhasse os itens.
      await aplicarComando(trabalho.comando);
    } catch (e) {
      log.warn({ e: String(e?.message ?? e) }, "sinal de vida falhou");
    }
  }
}

async function laco() {
  let falhasSeguidas = 0;

  for (;;) {
    let trabalho = null;
    try {
      trabalho = await consultar();
      jaDiagnosticou = false;
    } catch (e) {
      if (e?.status === 401) {
        await diagnosticarChave();
        // Config errada não conserta em 8s, e o log vira uma parede de WARN.
        // Meio minuto ainda pega o deploy novo rápido sem poluir a tela.
        await dormir(30_000);
        continue;
      }
      log.warn({ e: String(e?.message ?? e) }, "não consegui falar com o app");
      await dormir(ESPERA_OCIOSO);
      continue;
    }

    await aplicarComando(trabalho.comando);

    const itens = trabalho.itens ?? [];
    if (!trabalho.disparo || itens.length === 0) {
      await dormir(ESPERA_OCIOSO);
      continue;
    }

    if (!conectado) {
      // Só vira "parou" depois da tolerância. Antes disso é oscilação, e o
      // disparo continua de pé esperando a reconexão.
      const foraHa = caiuEm ? Date.now() - caiuEm : 0;
      if (foraHa > TOLERANCIA_QUEDA) {
        pausar = `sem conexão há ${Math.round(foraHa / 1000)}s`;
      }
      await dormir(ESPERA_OCIOSO);
      continue;
    }

    const { intervaloMin, intervaloMax } = trabalho.disparo;

    // UMA por volta do laço, de propósito. Percorrer o lote inteiro aqui
    // dentro deixava o servidor até uma hora sem falar com o app: nada era
    // confirmado, e um disparo interrompido no meio voltava com as 20
    // mensagens ainda "pendente", como se nunca tivesse acontecido.
    const item = itens[0];

    if (enviadasHoje() >= tetoDeHoje()) {
      pausar = `teto de hoje atingido (${tetoDeHoje()} mensagens)`;
      log.warn(pausar);
      await dormir(ESPERA_OCIOSO);
      continue;
    }

    const resultado = await enviarItem(item);
    if (resultado === "semConexao") {
      await dormir(ESPERA_OCIOSO);
      continue;
    }
    falhasSeguidas = resultado === "falhou" ? falhasSeguidas + 1 : 0;
    // Três falhas seguidas quase sempre é bloqueio começando.
    if (falhasSeguidas >= 3) {
      pausar = "três falhas seguidas — pode ser bloqueio";
      log.error(pausar);
      falhasSeguidas = 0;
      continue;
    }

    // Intervalo SORTEADO: cadência regular é o que denuncia robô.
    const espera = intervaloMin + Math.random() * (intervaloMax - intervaloMin);
    log.info(`próxima em ${Math.round(espera)}s`);
    await esperarDandoSinal(espera * 1000);
  }
}

log.info({ APP_URL, USUARIO_ID }, "servidor de WhatsApp em modo pull");
log.info(`teto de hoje: ${tetoDeHoje()} · enviadas hoje: ${enviadasHoje()}`);
laco().catch((e) => {
  log.error({ e }, "laço morreu");
  process.exit(1);
});
