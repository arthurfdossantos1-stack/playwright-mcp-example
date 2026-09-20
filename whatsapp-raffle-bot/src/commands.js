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
} from './store.js';

const HELP = `*Comandos do bot de rifa*

nova <quantidade> [nome] - cria uma rifa nova (fica ativa)
<numero> <nome do comprador> - registra uma venda, ex: 23 Joao Silva
vender <numero> <nome> - mesma coisa, forma explicita
desfazer <numero> - libera um numero vendido por engano
status <numero> - consulta um numero
disponiveis - mostra quantos e quais numeros restam
vendidos - mostra os numeros ja vendidos e para quem
rifas - lista todas as rifas criadas
usar <id> - troca qual rifa esta ativa
ajuda - mostra esta mensagem

*Em grupos:* mande "autorizar grupo" dentro do grupo (so voce, dono do bot,
consegue) para liberar os comandos ali. "desautorizar grupo" remove.`;

function compressRanges(numbers) {
  if (numbers.length === 0) return 'nenhum';
  const parts = [];
  let start = numbers[0];
  let prev = numbers[0];
  for (let i = 1; i <= numbers.length; i++) {
    const cur = numbers[i];
    if (cur === prev + 1) {
      prev = cur;
      continue;
    }
    parts.push(start === prev ? `${start}` : `${start}-${prev}`);
    start = cur;
    prev = cur;
  }
  return parts.join(', ');
}

function requireActive() {
  const raffle = getActiveRaffle();
  if (!raffle) {
    return { raffle: null, error: 'Nenhuma rifa ativa ainda. Crie uma com: nova <quantidade>' };
  }
  return { raffle, error: null };
}

function sell(numero, buyer) {
  const { raffle, error } = requireActive();
  if (error) return error;
  if (!buyer) return 'Informe o nome do comprador, ex: 23 Joao Silva';
  const result = sellNumber(raffle.id, numero, buyer);
  if (!result.ok) {
    if (result.reason === 'fora_do_intervalo') {
      return `O numero ${numero} nao existe nessa rifa (1 a ${raffle.total}).`;
    }
    if (result.reason === 'ja_vendido') {
      return `O numero ${numero} ja foi vendido para ${result.buyer}.`;
    }
    return 'Nao foi possivel registrar a venda.';
  }
  const remaining = getAvailableNumbers(raffle.id).length;
  return `Registrado: numero ${numero} vendido para ${buyer}.\nRestam ${remaining}/${raffle.total} numeros.`;
}

export function handleCommand(rawText) {
  const text = rawText.trim();
  if (!text) return null;

  const tokens = text.split(/\s+/);
  const firstAsNumber = Number(tokens[0]);
  const looksLikeShorthandSale =
    Number.isInteger(firstAsNumber) && firstAsNumber > 0 && tokens.length > 1;

  if (looksLikeShorthandSale) {
    const buyer = text.slice(tokens[0].length).trim();
    return sell(firstAsNumber, buyer);
  }

  const [cmdRaw, ...rest] = tokens;
  const cmd = cmdRaw.toLowerCase().replace(/^\//, '');

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
      const [numStr, ...nameParts] = rest;
      const numero = Number(numStr);
      const buyer = nameParts.join(' ');
      if (!Number.isInteger(numero) || !buyer) {
        return 'Uso: vender <numero> <nome do comprador>';
      }
      return sell(numero, buyer);
    }

    case 'desfazer': {
      const numero = Number(rest[0]);
      if (!Number.isInteger(numero)) return 'Uso: desfazer <numero>';
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
      const numbers = getAvailableNumbers(raffle.id);
      return `*${raffle.name}* - disponiveis: ${numbers.length}/${raffle.total}\n${compressRanges(numbers)}`;
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
      return `Nao entendi "${cmdRaw}". Mande "ajuda" para ver os comandos.`;
  }
}
