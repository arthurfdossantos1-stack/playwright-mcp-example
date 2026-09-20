import {
  createRaffle,
  listRaffles,
  getActiveRaffle,
  setActiveRaffle,
  sellNumber,
  undoNumber,
  getNumberStatus,
  getAvailableNumbers,
  getSoldNumbers,
  deleteRaffle,
  resetAllNumbers,
  setRaffleInfo,
} from './store.js';
import { generateGridImage } from './grid-image.js';
import { generateGridImageWithHeader } from './grid-image-header.js';

// Se configurado (BOT_NAME no .env), mandar so o nome do bot funciona como um
// "ping" pra confirmar que ele esta online, sem precisar lembrar um comando.
const BOT_NAME = (process.env.BOT_NAME || '').trim();

// Dados do PIX que o comando "pix" devolve. PIX_MESSAGE, se preenchido,
// substitui totalmente o texto padrao montado a partir dos outros campos.
const PIX_KEY = (process.env.PIX_KEY || '').trim();
const PIX_NAME = (process.env.PIX_NAME || '').trim();
const PIX_BANK = (process.env.PIX_BANK || '').trim();
// "\n" digitado no .env vira quebra de linha de verdade aqui.
const PIX_MESSAGE = (process.env.PIX_MESSAGE || '').trim().replace(/\\n/g, '\n');

const HELP = `*Bot de Rifa - Comandos*

*Criar e escolher a rifa*
nova <quantidade> [nome] - cria uma rifa nova e ja deixa ela ativa
  Ex: nova 500 Rifa de Natal
rifas - lista todas as rifas ja criadas e quantos numeros cada uma vendeu
usar <id> - troca qual rifa fica ativa (se voce tiver mais de uma)
  Ex: usar 2
excluir rifa [id] - apaga uma rifa inteira (sem id, apaga a rifa ativa)
  Ex: excluir rifa  /  excluir rifa 2
titulo <valor> <data do sorteio> - define o titulo que aparece no topo da
  imagem do "disponiveis" (valor por numero + data do sorteio)
  Ex: titulo 5,00 20/10/2026

*Registrar vendas*
vender <numero(s)> <nome> - registra uma venda (precisa comecar com "vender")
  Ex: vender 23 Joao Silva  /  vender 1,2,3 Joao Silva (varios numeros, mesmo comprador)
vender <numero> <nome>, uma por linha - compradores diferentes numa so mensagem:
  vender 10 Maria
  11 Joao
  12 Kaio
desfazer <numero(s)> - libera de novo numero(s) vendido(s) por engano
  (igual "excluir <numero(s)>" e "desmarcar <numero(s)>")
  Ex: desfazer 23  /  desfazer 1,2,3  /  desfazer todos (libera a rifa toda)

*Consultar*
status <numero> - mostra se um numero especifico esta disponivel ou vendido
disponiveis - manda uma imagem com todos os numeros, X nos ja vendidos
  (com titulo no topo se voce configurou com "titulo")
vendidos - lista todos os numeros ja vendidos e para quem

*Outros*
pix - mostra os dados de pagamento configurados
apagar - apaga a ultima mensagem que o bot mandou aqui
ajuda - mostra esta mensagem${BOT_NAME ? `\nmandar so "${BOT_NAME}" - confirma que o bot esta online` : ''}

*Figurinhas:* manda uma imagem (ou video/GIF) e, na legenda ou logo em
seguida, "figurinha" (ou "sticker"). Video/GIF vira figurinha animada,
foto vira figurinha normal. Tambem funciona respondendo uma imagem/video
ja enviado com "figurinha". Precisa do ffmpeg instalado (pkg install ffmpeg).

Os comandos funcionam com ou sem acento e em qualquer combinacao de
maiuscula/minuscula (disponiveis = disponíveis = DISPONÍVEIS). O bot so
responde a comandos - mensagem solta tipo "oi" fica sem resposta.

*Em grupos:* mande "autorizar grupo" de dentro do grupo (so funciona vindo de
voce, dono do bot) para liberar os comandos ali. "desautorizar grupo" remove
a permissao. Outros grupos continuam sendo ignorados.`;

function stripAccents(text) {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function requireActive() {
  const raffle = getActiveRaffle();
  if (!raffle) {
    return { raffle: null, error: 'Nenhuma rifa ativa ainda. Crie uma com: nova <quantidade>' };
  }
  return { raffle, error: null };
}

// Aceita "23", "1,2,3" ou "1, 2, 3" e devolve os numeros como array. Retorna
// null se algum pedaco nao for um numero valido.
function parseNumberList(str) {
  const numbers = str
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map(Number);
  if (numbers.length === 0 || numbers.some((n) => !Number.isInteger(n) || n <= 0)) return null;
  return numbers;
}

// Reconhece "<numero(s)> <nome>" no comeco do texto, ex: "23 Joao Silva" ou
// "1,2,3 Joao Silva". Retorna null se o texto nao comecar com numero(s).
function parseSaleArgs(text) {
  const match = text.match(/^(\d+(?:\s*,\s*\d+)*)\s+(.+)$/);
  if (!match) return null;
  const numbers = parseNumberList(match[1]);
  const buyer = match[2].trim();
  if (!numbers || !buyer) return null;
  return { numbers, buyer };
}

function sellMultiple(numbers, buyer) {
  const { raffle, error } = requireActive();
  if (error) return error;
  if (!buyer) return 'Informe o nome do comprador, ex: 23 Joao Silva';

  const vendidos = [];
  const falhas = [];
  for (const numero of numbers) {
    const result = sellNumber(raffle.id, numero, buyer);
    if (result.ok) {
      vendidos.push(numero);
      continue;
    }
    if (result.reason === 'fora_do_intervalo') {
      falhas.push(`${numero} (fora do intervalo, 1 a ${raffle.total})`);
    } else if (result.reason === 'ja_vendido') {
      falhas.push(`${numero} (ja vendido para ${result.buyer})`);
    } else {
      falhas.push(`${numero} (erro ao registrar)`);
    }
  }

  const partes = [];
  if (vendidos.length > 0) {
    partes.push(`Registrado: numero(s) ${vendidos.join(', ')} vendido(s) para ${buyer}.`);
  }
  if (falhas.length > 0) {
    partes.push(`Nao deu pra registrar: ${falhas.join(', ')}.`);
  }
  const remaining = getAvailableNumbers(raffle.id).length;
  partes.push(`Restam ${remaining}/${raffle.total} numeros.`);
  return partes.join('\n');
}

// Reconhece varias linhas, cada uma "<numero(s)> <nome>", permitindo
// compradores diferentes por numero, ex:
//   10 Maria
//   11 Joao
//   12 Kaio
// Retorna null se nao houver pelo menos 2 linhas ou se alguma nao for uma
// venda valida (nesse caso quem chamou trata como outra coisa).
function parseMultilineSales(text) {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) return null;

  const sales = [];
  for (const line of lines) {
    const saleArgs = parseSaleArgs(line);
    if (!saleArgs) return null;
    sales.push(saleArgs);
  }
  return sales;
}

function sellFromLines(sales) {
  const { raffle, error } = requireActive();
  if (error) return error;

  const vendidos = [];
  const falhas = [];
  for (const { numbers, buyer } of sales) {
    for (const numero of numbers) {
      const result = sellNumber(raffle.id, numero, buyer);
      if (result.ok) {
        vendidos.push(`${numero} - ${buyer}`);
      } else if (result.reason === 'fora_do_intervalo') {
        falhas.push(`${numero} (fora do intervalo, 1 a ${raffle.total})`);
      } else if (result.reason === 'ja_vendido') {
        falhas.push(`${numero} (ja vendido para ${result.buyer})`);
      } else {
        falhas.push(`${numero} (erro ao registrar)`);
      }
    }
  }

  const partes = [];
  if (vendidos.length > 0) partes.push(`Registrado:\n${vendidos.join('\n')}`);
  if (falhas.length > 0) partes.push(`Nao deu pra registrar: ${falhas.join(', ')}.`);
  const remaining = getAvailableNumbers(raffle.id).length;
  partes.push(`Restam ${remaining}/${raffle.total} numeros.`);
  return partes.join('\n');
}

function undoMultiple(numbers) {
  const { raffle, error } = requireActive();
  if (error) return error;

  const liberados = [];
  const falhas = [];
  for (const numero of numbers) {
    const result = undoNumber(raffle.id, numero);
    if (result.ok) {
      liberados.push(numero);
    } else if (result.reason === 'fora_do_intervalo') {
      falhas.push(`${numero} (fora do intervalo, 1 a ${raffle.total})`);
    } else if (result.reason === 'nao_vendido') {
      falhas.push(`${numero} (ja estava disponivel)`);
    } else {
      falhas.push(`${numero} (erro)`);
    }
  }

  const partes = [];
  if (liberados.length > 0) partes.push(`Liberado(s): ${liberados.join(', ')}.`);
  if (falhas.length > 0) partes.push(`Nao deu pra liberar: ${falhas.join(', ')}.`);
  return partes.join('\n');
}

function resetAllCommand() {
  const { raffle, error } = requireActive();
  if (error) return error;
  const result = resetAllNumbers(raffle.id);
  if (result.count === 0) return `*${raffle.name}* - nenhum numero estava vendido.`;
  return `*${raffle.name}* - ${result.count} numero(s) desmarcado(s). Todos voltaram a ficar disponiveis.`;
}

// Trata "<numero(s)>" ou "todos" depois de desfazer/excluir/desmarcar.
function undoArgsCommand(rest, cmdName) {
  const argText = rest.join(' ').trim();
  const uso = `Uso: ${cmdName} <numero(s)>  ou  ${cmdName} todos`;
  if (!argText) return uso;
  if (stripAccents(argText.toLowerCase()) === 'todos') return resetAllCommand();
  const numbers = parseNumberList(argText);
  if (!numbers) return uso;
  return undoMultiple(numbers);
}

function deleteRaffleCommand(id) {
  let raffleId = id;
  if (!raffleId) {
    const { raffle, error } = requireActive();
    if (error) return error;
    raffleId = raffle.id;
  }
  const result = deleteRaffle(raffleId);
  if (!result.ok) return `Nao encontrei nenhuma rifa com id ${raffleId}.`;
  const sold = Object.values(result.raffle.numbers).filter((n) => n.status === 'vendido').length;
  const aviso = sold > 0 ? ` Ela tinha ${sold} numero(s) vendido(s), que foram perdidos junto.` : '';
  return `Rifa "${result.raffle.name}" (id ${raffleId}) excluida.${aviso}`;
}

export async function handleCommand(rawText) {
  const text = rawText.trim();
  if (!text) return null;

  if (BOT_NAME && stripAccents(text.toLowerCase()) === stripAccents(BOT_NAME.toLowerCase())) {
    return `Oi! Estou online. Mande "ajuda" para ver os comandos.`;
  }

  const tokens = text.split(/\s+/);
  const [cmdRaw, ...rest] = tokens;
  const cmd = stripAccents(cmdRaw.toLowerCase().replace(/^\//, ''));

  switch (cmd) {
    case 'ajuda':
    case 'help':
    case 'menu':
      return HELP;

    case 'nova': {
      const [totalStr, ...nameParts] = rest;
      const total = Number(totalStr);
      if (!Number.isInteger(total) || total <= 0) {
        return 'Uso: nova <quantidade> [nome]  (ex: nova 500 Rifa da Pascoa)';
      }
      const name = nameParts.join(' ') || undefined;
      const raffle = createRaffle(total, name);
      return `Rifa criada e definida como ativa.\nID: ${raffle.id}\nNome: ${raffle.name}\nNumeros: 1 a ${raffle.total}`;
    }

    case 'vender': {
      // Pega o texto original apos a palavra "vender", preservando quebras
      // de linha (rest.join(' ') perderia isso, ja que veio de um split por
      // espaco/quebra de linha).
      const argsText = text.replace(/^\S+\s*/, '');
      const usoVender =
        'Uso: vender <numero(s)> <nome do comprador>\n  Ex: vender 1,2,3 Joao Silva\n' +
        'ou varias linhas depois de "vender", uma venda por linha:\n  vender 10 Maria\n  11 Joao\n  12 Kaio';

      const multiline = parseMultilineSales(argsText);
      if (multiline) return sellFromLines(multiline);

      const saleArgs = parseSaleArgs(argsText);
      if (!saleArgs) return usoVender;
      return sellMultiple(saleArgs.numbers, saleArgs.buyer);
    }

    case 'desfazer':
    case 'desmarcar':
      return undoArgsCommand(rest, cmd);

    case 'excluir': {
      const [arg, ...restArgs] = rest;
      if (!arg) {
        return 'Uso: excluir <numero(s)>  ou  excluir todos\nou: excluir rifa [id]  (apaga uma rifa inteira)';
      }
      if (stripAccents(arg.toLowerCase()) === 'rifa') {
        return deleteRaffleCommand(restArgs[0]);
      }
      return undoArgsCommand(rest, 'excluir');
    }

    case 'status': {
      const numero = Number(rest[0]);
      if (!Number.isInteger(numero)) return 'Uso: status <numero>';
      const { raffle, error } = requireActive();
      if (error) return error;
      const entry = getNumberStatus(raffle.id, numero);
      if (!entry) return `O numero ${numero} nao existe nessa rifa (1 a ${raffle.total}).`;
      if (entry.status === 'vendido') return `Numero ${numero}: VENDIDO para ${entry.buyer}.`;
      return `Numero ${numero}: disponivel.`;
    }

    case 'disponiveis': {
      const { raffle, error } = requireActive();
      if (error) return error;
      const disponiveis = getAvailableNumbers(raffle.id).length;
      const image =
        raffle.price && raffle.drawDate
          ? await generateGridImageWithHeader(raffle, raffle.price, raffle.drawDate)
          : generateGridImage(raffle);
      return {
        image,
        caption: `*${raffle.name}*\nDisponiveis: ${disponiveis}/${raffle.total}\nX = vendido`,
      };
    }

    case 'titulo': {
      const [valor, ...dataParts] = rest;
      const data = dataParts.join(' ');
      if (!valor || !data) {
        return 'Uso: titulo <valor por numero> <data do sorteio>\n  Ex: titulo 5,00 20/10/2026';
      }
      const { raffle, error } = requireActive();
      if (error) return error;
      setRaffleInfo(raffle.id, { price: valor, drawDate: data });
      return `Titulo definido para "${raffle.name}":\nCada numero: R$ ${valor}\nSorteio: ${data}\nAgora "disponiveis" ja mostra isso na imagem.`;
    }

    case 'vendidos': {
      const { raffle, error } = requireActive();
      if (error) return error;
      const sold = getSoldNumbers(raffle.id);
      if (sold.length === 0) return `*${raffle.name}* - nenhum numero vendido ainda.`;
      const lines = sold.map((s) => `${s.number} - ${s.buyer}`);
      return `*${raffle.name}* - vendidos: ${sold.length}/${raffle.total}\n${lines.join('\n')}`;
    }

    case 'rifas': {
      const raffles = listRaffles();
      if (raffles.length === 0) return 'Nenhuma rifa criada ainda. Use: nova <quantidade>';
      return raffles
        .map((r) => `${r.active ? '>' : ' '} ID ${r.id} - ${r.name} - ${r.sold}/${r.total} vendidos`)
        .join('\n');
    }

    case 'usar': {
      const id = rest[0];
      if (!id) return 'Uso: usar <id>  (veja os ids com o comando "rifas")';
      const ok = setActiveRaffle(id);
      return ok ? `Rifa ${id} agora esta ativa.` : `Nao encontrei nenhuma rifa com id ${id}.`;
    }

    case 'pix': {
      if (PIX_MESSAGE) return PIX_MESSAGE;
      if (!PIX_KEY) {
        return 'Chave PIX ainda nao configurada. Preencha PIX_KEY (e opcionalmente PIX_NAME, PIX_BANK) no .env.';
      }
      const linhas = ['*Dados para pagamento (PIX)*', `Chave: ${PIX_KEY}`];
      if (PIX_NAME) linhas.push(`Nome: ${PIX_NAME}`);
      if (PIX_BANK) linhas.push(`Banco: ${PIX_BANK}`);
      return linhas.join('\n');
    }

    case 'apagar':
      return { action: 'delete_last' };

    default:
      // Mensagem comum (tipo "oi", papo aleatorio) nao e comando: fica em
      // silencio em vez de responder qualquer coisa que passar pelo bot.
      return null;
  }
}
