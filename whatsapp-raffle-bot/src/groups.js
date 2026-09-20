import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');
const GROUPS_FILE = path.join(DATA_DIR, 'groups.json');

function load() {
  if (!fs.existsSync(GROUPS_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(GROUPS_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function save(list) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const tmpFile = `${GROUPS_FILE}.tmp`;
  fs.writeFileSync(tmpFile, JSON.stringify(list, null, 2));
  fs.renameSync(tmpFile, GROUPS_FILE);
}

export function isAuthorizedGroup(jid) {
  return load().includes(jid);
}

export function addAuthorizedGroup(jid) {
  const list = load();
  if (list.includes(jid)) return false;
  list.push(jid);
  save(list);
  return true;
}

export function removeAuthorizedGroup(jid) {
  const list = load();
  const idx = list.indexOf(jid);
  if (idx === -1) return false;
  list.splice(idx, 1);
  save(list);
  return true;
}

export function listAuthorizedGroups() {
  return load();
}
