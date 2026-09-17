// Pesten game client - card renderer and socket layer.

const SUITS = ['♣', '♦', '♥', '♠'];
const SUIT_GLYPH = { '♣':'♣', '♦':'♦', '♥':'♥', '♠':'♠' };
const SUIT_COLOR_RED = new Set(['♦', '♥']);
const FACE_RANKS = ['J', 'Q', 'K'];
const FACE_NAMES = { 'J':'JACK', 'Q':'QUEEN', 'K':'KING' };

function isPip(c) { return ['3','4','5','6','7','8','9','10'].includes(c.r); }
function isFace(c) { return FACE_RANKS.includes(c.r); }
function isAce(c) { return c.r === 'A'; }
function isJoker(c) { return c.r === 'JKR'; }
function isRed(c) { return SUIT_COLOR_RED.has(c.s); }

function rankLabel(c) {
  if (isJoker(c)) return '★';
  return c.r;
}
function suitLabel(c) {
  if (isJoker(c)) return 'JOKER';
  return SUIT_GLYPH[c.s] || c.s;
}

/**
 * Render a playing card to an HTMLElement.
 * @param {Object} c - {r, s} card object
 * @param {Object} opts - { size: 'sm'|'lg', back: bool, faceDown: bool, disabled: bool, playable: bool, onClick: fn }
 */
function renderCard(c, opts = {}) {
  const el = document.createElement('div');
  const { size = 'sm', back = false, disabled = false, playable = false, onClick } = opts;
  el.className = 'playing-card';
  if (size === 'lg') el.classList.add('large');
  if (back) {
    el.classList.add('back');
    if (onClick) el.addEventListener('click', onClick);
    return el;
  }
  if (isRed(c)) el.classList.add('red');
  if (isJoker(c)) el.classList.add('joker');
  if (isAce(c)) el.classList.add('is-ace');
  else if (isFace(c)) el.classList.add('is-face');
  else if (isPip(c)) el.classList.add('is-pip');
  if (disabled) el.classList.add('disabled');
  if (playable) el.classList.add('playable');

  // Top-left corner
  const corner = document.createElement('div');
  corner.className = 'corner';
  corner.innerHTML = `<span class="rank">${rankLabel(c)}</span><span class="suit">${suitLabel(c)}</span>`;
  el.appendChild(corner);

  // Center art
  if (isJoker(c)) {
    const face = document.createElement('div');
    face.className = 'face-art';
    face.innerHTML = `<div class="j-symbol">★</div><div class="j-stars">★ ★ ★</div><div style="margin-top:6px;font-size:9px;letter-spacing:2px">JOKER</div>`;
    el.appendChild(face);
  } else if (isFace(c)) {
    const face = document.createElement('div');
    face.className = 'face-art';
    face.innerHTML = `${c.r}<small>${SUIT_GLYPH[c.s]}</small><small style="margin-top:2px">${FACE_NAMES[c.r]}</small>`;
    el.appendChild(face);
  } else {
    const center = document.createElement('div');
    center.className = 'center-area';
    center.textContent = SUIT_GLYPH[c.s];
    el.appendChild(center);
  }

  // Bottom-right corner (mirrored)
  const corner2 = document.createElement('div');
  corner2.className = 'corner bottom';
  corner2.innerHTML = `<span class="rank">${rankLabel(c)}</span><span class="suit">${suitLabel(c)}</span>`;
  el.appendChild(corner2);

  if (onClick && !disabled) el.addEventListener('click', onClick);
  if (disabled) el.style.cursor = 'not-allowed';
  return el;
}

// ============================================================
// Socket layer
// ============================================================

class PestenClient {
  constructor() {
    this.socket = null;
    this.state = null;
    this.playerId = null;
    this.code = null;
    this.name = null;
    this.avatar = null;
    this.accountId = null; // username if registered, null for guest
    this.language = 'nl';
    this.listeners = {};
    this.loadFromStorage();
  }
  loadFromStorage() {
    try {
      const stored = JSON.parse(localStorage.getItem('pesten.auth') || 'null');
      if (stored) {
        this.playerId = stored.playerId || null;
        this.name = stored.name || null;
        this.avatar = stored.avatar || null;
        this.accountId = stored.accountId || null;
        this.language = stored.language || 'nl';
        this.lastRoom = stored.lastRoom || null;
      }
    } catch (e) {}
  }
  saveToStorage() {
    localStorage.setItem('pesten.auth', JSON.stringify({
      playerId: this.playerId,
      name: this.name,
      avatar: this.avatar,
      accountId: this.accountId,
      language: this.language,
      lastRoom: this.code,
    }));
  }
  clearStorage() {
    localStorage.removeItem('pesten.auth');
  }
  on(event, fn) {
    (this.listeners[event] = this.listeners[event] || []).push(fn);
  }
  emit(event, data, ack) {
    if (!this.socket) return;
    this.socket.emit(event, data, ack);
  }
  fire(event, payload) {
    (this.listeners[event] || []).forEach(fn => fn(payload));
  }
  connect() {
    this.socket = io();
    this.socket.on('connect', () => {
      this.fire('connected');
    });
    this.socket.on('state', (s) => {
      this.state = s;
      this.fire('state', s);
    });
    this.socket.on('chat', (c) => {
      this.fire('chat', c);
    });
    this.socket.on('rooms', (rooms) => {
      this.fire('rooms', rooms);
    });
    this.socket.on('roomClosed', (info) => {
      this.fire('roomClosed', info);
    });
    this.socket.on('error-msg', (m) => {
      this.fire('error', m);
    });
  }
  create(opts, ack) {
    opts.language = this.language;
    // opts: { name, avatar, username?, password?, playerId? }
    this.emit('create', opts, ack);
  }
  listRooms(ack) { this.emit('listRooms', {}, ack); }
  join(code, opts, ack) {
    // opts: { name?, avatar?, playerId? }
    this.emit('join', { code, ...opts }, ack);
  }
  register(opts, ack) { this.emit('register', opts, ack); }
  login(opts, ack) { this.emit('login', opts, ack); }
  rejoin(code, playerId, ack) { this.emit('rejoin', { code, playerId }, ack); }
  start(ack) { this.emit('start', {}, ack); }
  play(idx, ack) { this.emit('play', { cardIndex: idx }, ack); }
  playDump(order, ack) { this.emit('playDump', { order }, ack); }
  declareSuit(suit) { this.emit('declareSuit', { suit }); }
  take(ack) { this.emit('take', {}, ack); }
  draw(ack) { this.emit('draw', {}, ack); }
  playDrawn(ack) { this.emit('playDrawn', {}, ack); }
  skip() { this.emit('skip', {}); }
  chat(msg) { this.emit('chat', { msg }); }
  addAi(name, profileKey, ack) { this.emit('addAi', { name, profileKey }, ack); }
  removeAi(id, ack) { this.emit('removeAi', { aiId: id }, ack); }
  leaveRoom(ack) { this.emit('leaveRoom', {}, ack); }
  endGame(ack) { this.emit('endGame', {}, ack); }
}

function avatarUrl(file) {
  if (!file) return '/avatars/p1.svg';
  if (file.startsWith('http')) return file;
  return '/avatars/' + file;
}


window.PestenClient = PestenClient;
window.renderCard = renderCard;
window.SUITS = SUITS;
window.avatarUrl = avatarUrl;
