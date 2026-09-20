import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'raffles.json');

function emptyState() {
  return { activeRaffleId: null, nextId: 1, raffles: {} };
}

function load() {
  if (!fs.existsSync(DATA_FILE)) return emptyState();
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch {
    return emptyState();
  }
}

function save(state) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const tmpFile = `${DATA_FILE}.tmp`;
  fs.writeFileSync(tmpFile, JSON.stringify(state, null, 2));
  fs.renameSync(tmpFile, DATA_FILE);
}

export function createRaffle(total, name) {
  const state = load();
  const id = String(state.nextId++);
  const numbers = {};
  for (let n = 1; n <= total; n++) numbers[n] = { status: 'disponivel' };
  const raffle = {
    id,
    name: name || `Rifa ${id}`,
    total,
    createdAt: new Date().toISOString(),
    numbers,
  };
  state.raffles[id] = raffle;
  state.activeRaffleId = id;
  save(state);
  return raffle;
}

function summarize(raffle, activeId) {
  const sold = Object.values(raffle.numbers).filter((n) => n.status === 'vendido').length;
  return {
    id: raffle.id,
    name: raffle.name,
    total: raffle.total,
    sold,
    available: raffle.total - sold,
    active: raffle.id === activeId,
  };
}

export function listRaffles() {
  const state = load();
  return Object.values(state.raffles)
    .sort((a, b) => Number(a.id) - Number(b.id))
    .map((r) => summarize(r, state.activeRaffleId));
}

export function getActiveRaffle() {
  const state = load();
  if (!state.activeRaffleId) return null;
  return state.raffles[state.activeRaffleId] || null;
}

export function setActiveRaffle(id) {
  const state = load();
  if (!state.raffles[id]) return false;
  state.activeRaffleId = id;
  save(state);
  return true;
}

export function deleteRaffle(id) {
  const state = load();
  const raffle = state.raffles[id];
  if (!raffle) return { ok: false };
  delete state.raffles[id];
  if (state.activeRaffleId === id) state.activeRaffleId = null;
  save(state);
  return { ok: true, raffle };
}

export function getRaffle(id) {
  const state = load();
  return state.raffles[id] || null;
}

export function resetAllNumbers(id) {
  const state = load();
  const raffle = state.raffles[id];
  if (!raffle) return { ok: false };
  let count = 0;
  for (const entry of Object.values(raffle.numbers)) {
    if (entry.status === 'vendido') {
      entry.status = 'disponivel';
      delete entry.buyer;
      delete entry.soldAt;
      count++;
    }
  }
  save(state);
  return { ok: true, count };
}

export function sellNumber(raffleId, number, buyer) {
  const state = load();
  const raffle = state.raffles[raffleId];
  if (!raffle) return { ok: false, reason: 'sem_rifa' };
  const entry = raffle.numbers[number];
  if (!entry) return { ok: false, reason: 'fora_do_intervalo' };
  if (entry.status === 'vendido') return { ok: false, reason: 'ja_vendido', buyer: entry.buyer };
  entry.status = 'vendido';
  entry.buyer = buyer;
  entry.soldAt = new Date().toISOString();
  save(state);
  return { ok: true };
}

export function undoNumber(raffleId, number) {
  const state = load();
  const raffle = state.raffles[raffleId];
  if (!raffle) return { ok: false, reason: 'sem_rifa' };
  const entry = raffle.numbers[number];
  if (!entry) return { ok: false, reason: 'fora_do_intervalo' };
  if (entry.status !== 'vendido') return { ok: false, reason: 'nao_vendido' };
  entry.status = 'disponivel';
  delete entry.buyer;
  delete entry.soldAt;
  save(state);
  return { ok: true };
}

export function getNumberStatus(raffleId, number) {
  const raffle = getRaffle(raffleId);
  if (!raffle) return null;
  return raffle.numbers[number] || null;
}

export function getAvailableNumbers(raffleId) {
  const raffle = getRaffle(raffleId);
  if (!raffle) return [];
  return Object.entries(raffle.numbers)
    .filter(([, v]) => v.status === 'disponivel')
    .map(([k]) => Number(k))
    .sort((a, b) => a - b);
}

export function getSoldNumbers(raffleId) {
  const raffle = getRaffle(raffleId);
  if (!raffle) return [];
  return Object.entries(raffle.numbers)
    .filter(([, v]) => v.status === 'vendido')
    .map(([k, v]) => ({ number: Number(k), buyer: v.buyer, soldAt: v.soldAt }))
    .sort((a, b) => a.number - b.number);
}
