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
} from './store.js';
import { generateGridImage } from './grid-image.js';

// Se configurado (BOT_NAME no .env), mandar so o nome do bot funciona como um
// "ping" pra confirmar que ele esta online, sem precisar lembrar um comando.
const BOT_NAME = (process.env.BOT_NAME || '').trim();

const HELP = `*Bot de Rifa - Comandos*

*Criar e escolher a rifa*
nova <quantidade> [nome] - cria uma rifa nova e ja deixa ela ativa
  Ex: nova 500 Rifa de Natal
rifas - lista todas as rifas ja criadas e quantos numeros cada uma vendeu
usar <id> - troca qual rifa fica ativa (se voce tiver mais de uma)
  Ex: usar 2
excluir rifa [id] - apaga uma rifa inteira (sem id, apaga a rifa ativa)
  Ex: excluir rifa  /  excluir rifa 2

*Registrar vendas*
<numero(s)> <nome do comprador> - forma rapida de registrar uma venda
  Ex: 23 Joao Silva  /  Ex: 1,2,3 Joao Silva (varios numeros de uma vez)
vender <numero(s)> <nome> - mesma coisa, por extenso
  Ex: vender 23 Joao Silva  /  vender 1,2,3 Joao Silva
desfazer <numero> - libera de novo um numero vendido por engano (igual "excluir <numero>")
  Ex: desfazer 23

*Consultar*
status <numero> - mostra se um numero especifico esta disponivel ou vendido
disponiveis - manda uma imagem com todos os numeros, X nos ja vendidos
vendidos - lista todos os numeros ja vendidos e para quem

*Outros*
ajuda - mostra esta mensagem${BOT_NAME ? `\nmandar so "${BOT_NAME}" - confirma que o bot esta online` : ''}

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

function undoNumberCommand(numero) {
  if (!Number.isInteger(numero)) return 'Uso: excluir <numero>  (ou: desfazer <numero>)';
  const { raffle, error } = requireActive();
  if (error) return error;
  const result = undoNumber(raffle.id, numero);
  if (!result.ok) {
    if (result.reason === 'fora_do_intervalo') return `O numero ${numero} nao existe nessa rifa.`;
    if (result.reason === 'nao_vendido') return `O numero ${numero} ja esta disponivel.`;
    return 'Nao foi possivel desfazer.';
  }
  return `Numero ${numero} liberado novamente.`;
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

export function handleCommand(rawText) {
  const text = rawText.trim();
  if (!text) return null;

  if (BOT_NAME && stripAccents(text.toLowerCase()) === stripAccents(BOT_NAME.toLowerCase())) {
    return `Oi! Estou online. Mande "ajuda" para ver os comandos.`;
  }

  const shorthandSale = parseSaleArgs(text);
  if (shorthandSale) {
    return sellMultiple(shorthandSale.numbers, shorthandSale.buyer);
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
      const saleArgs = parseSaleArgs(rest.join(' '));
      if (!saleArgs) {
        return 'Uso: vender <numero>[,<numero>,...] <nome do comprador>\n  Ex: vender 1,2,3 Joao Silva';
      }
      return sellMultiple(saleArgs.numbers, saleArgs.buyer);
    }

    case 'desfazer':
      return undoNumberCommand(Number(rest[0]));

    case 'excluir': {
      const [arg, ...restArgs] = rest;
      if (!arg) {
        return 'Uso: excluir <numero>  (libera um numero)\nou: excluir rifa [id]  (apaga uma rifa inteira)';
      }
      if (stripAccents(arg.toLowerCase()) === 'rifa') {
        return deleteRaffleCommand(restArgs[0]);
      }
      return undoNumberCommand(Number(arg));
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
      return {
        image: generateGridImage(raffle),
        caption: `*${raffle.name}*\nDisponiveis: ${disponiveis}/${raffle.total}\nX = vendido`,
      };
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

    default:
      // Mensagem comum (tipo "oi", papo aleatorio) nao e comando: fica em
      // silencio em vez de responder qualquer coisa que passar pelo bot.
      return null;
  }
}
