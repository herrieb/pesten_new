// Persistent user accounts and rejoin support.
// Username + password (PBKDF2-hashed via Node's built-in crypto).
// Storage: a single JSON file at server/data/users.json.
// Each user record: { username, salt, hash, iters, name (display name), avatar, playerId, createdAt }

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

let cache = null;
function load() {
  if (cache) return cache;
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (fs.existsSync(USERS_FILE)) {
      const raw = fs.readFileSync(USERS_FILE, 'utf8');
      cache = JSON.parse(raw);
      if (!cache.users) cache.users = {};
    } else {
      cache = { users: {} };
      save();
    }
  } catch (e) {
    console.error('Failed to load users.json, starting empty:', e.message);
    cache = { users: {} };
  }
  return cache;
}
function save() {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(USERS_FILE, JSON.stringify(cache, null, 2));
  } catch (e) {
    console.error('Failed to save users.json:', e.message);
  }
}

function hashPassword(password, salt, iters = 50000) {
  // PBKDF2-SHA256, 64 bytes output
  return crypto.pbkdf2Sync(String(password), salt, iters, 64, 'sha256').toString('hex');
}

function register({ username, password, name, avatar }) {
  load();
  if (!username || username.length < 2 || username.length > 24) {
    return { ok: false, error: 'Gebruikersnaam moet 2-24 tekens zijn' };
  }
  if (!password || password.length < 3) {
    return { ok: false, error: 'Wachtwoord minimaal 3 tekens' };
  }
  const u = username.toLowerCase();
  if (cache.users[u]) {
    return { ok: false, error: 'Gebruikersnaam al in gebruik' };
  }
  const salt = crypto.randomBytes(16).toString('hex');
  const iters = 50000;
  const hash = hashPassword(password, salt, iters);
  const playerId = 'u_' + crypto.randomBytes(8).toString('hex');
  cache.users[u] = {
    username: u,
    salt, hash, iters,
    name: (name || username).slice(0, 20),
    avatar: avatar || 'p1.svg',
    playerId,
    createdAt: Date.now(),
  };
  save();
  return {
    ok: true,
    user: sanitize(cache.users[u]),
  };
}

function login({ username, password }) {
  load();
  if (!username || !password) return { ok: false, error: 'Vul alles in' };
  const u = String(username).toLowerCase();
  const rec = cache.users[u];
  if (!rec) return { ok: false, error: 'Onbekende gebruiker' };
  const candidate = hashPassword(password, rec.salt, rec.iters);
  // Constant-time-ish comparison
  if (candidate.length !== rec.hash.length || !crypto.timingSafeEqual(Buffer.from(candidate, 'hex'), Buffer.from(rec.hash, 'hex'))) {
    return { ok: false, error: 'Verkeerd wachtwoord' };
  }
  return { ok: true, user: sanitize(rec) };
}

function getByPlayerId(playerId) {
  load();
  for (const u of Object.values(cache.users)) {
    if (u.playerId === playerId) return sanitize(u);
  }
  return null;
}

function getByUsername(username) {
  load();
  const u = String(username || '').toLowerCase();
  return cache.users[u] ? sanitize(cache.users[u]) : null;
}

function sanitize(rec) {
  if (!rec) return null;
  return {
    username: rec.username,
    name: rec.name,
    avatar: rec.avatar,
    playerId: rec.playerId,
    createdAt: rec.createdAt,
  };
}

module.exports = { register, login, getByPlayerId, getByUsername };
