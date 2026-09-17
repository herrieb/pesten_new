// ============================================================
// SPECIAL CARD BANNER
// ============================================================
const RED_SUITS = new Set(['♦', '♥']);
let lastSeenTop = null;
let lastSeenPending = 0;
let bannerTimer = null;

function showBanner(card, opts = {}) {
  const banner = $('#banner');
  const bannerCard = $('#banner-card');
  const bannerText = $('#banner-text');
  const bannerSub = $('#banner-sub');
  if (!banner) return;
  // Guard: only show if we have text AND a card
  if (!opts.text || !card) {
    banner.hidden = true;
    return;
  }

  // Render the card itself
  bannerCard.className = 'banner-card';
  if (card) {
    if (card.r === 'JKR') {
      bannerCard.classList.add('joker');
      bannerCard.innerHTML = `<div class="bc-rank">★</div><div class="bc-suit">★</div>`;
    } else {
      if (RED_SUITS.has(card.s)) bannerCard.classList.add('red');
      const isFace = ['J','Q','K'].includes(card.r);
      bannerCard.innerHTML =
        `<div class="bc-corner"><span>${card.r}</span><span>${card.s}</span></div>` +
        `<div class="bc-rank">${card.r}</div>` +
        `<div class="bc-suit">${card.s}</div>` +
        `<div class="bc-corner" style="top:auto;bottom:10px;left:auto;right:12px;transform:rotate(180deg)"><span>${card.r}</span><span>${card.s}</span></div>`;
    }
  }

  bannerText.textContent = opts.text || '';
  bannerSub.textContent = opts.sub || '';
  banner.className = 'banner tone-' + (opts.tone || 'take2');
  banner.hidden = false;
  // Restart animations by forcing reflow
  void banner.offsetWidth;

  if (bannerTimer) clearTimeout(bannerTimer);
  bannerTimer = setTimeout(() => {
    banner.hidden = true;
  }, opts.duration || 1800);
}

function maybeShowEffectBanner(newState) {
  const top = newState.discardTop;
  if (!top) return;
  const prev = lastSeenTop;
  const prevPending = lastSeenPending;
  const isFreshPlay = prev && (
    prev.r !== top.r || prev.s !== top.s
  );

  if (!prev || !isFreshPlay) {
    lastSeenTop = top;
    lastSeenPending = newState.pendingTake;
    return;
  }

  const pending = newState.pendingTake || 0;
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];

  switch (top.r) {
    case 'A':
      showBanner(top, {
        text: pick(['RICHTING OMGEKEERD!','DRAAIT OM!','WILDER DAN DRAAIT!','U-BOAT!','REVERSE!','TERUG AF!','WEG-DRAAI!','SPIEGEL!','OMGEKEERD!','ACHTBAAN!','ALSMAAR DOOR!','180 GRADEN!']),
        sub: pick(['De richting draait om','Tijd om achteruit te denken','De tafel draait','Iedereen kijkt de andere kant op','Wie had dit verwacht?','Spel in spiegelbeeld']),
        tone: 'reverse', duration: 1500
      });
      break;
    case '2':
      if (pending > 2) {
        const big = pending >= 10;
        showBanner(top, {
          text: pick(big
            ? [`MONSTER GRAB +${pending}!`,`MEGA STACK +${pending}!`,`APOCALYPSE +${pending}!`,`TSUNAMI +${pending}!`,`+${pending} PAKKEN MAAR!`,`CHAOS +${pending}!`,`NIET TE STOPPEN +${pending}!`,`RAMPENPLAN +${pending}!`,`RAMP +${pending}!`,`DEADLY STACK +${pending}!`,`MASSA-INHAAL +${pending}!`]
            : [`+${pending}!`,`STACKED! +${pending}`,`DOORGEVEN! +${pending}`,`OPGEHOOPD +${pending}`,`KETTING-REACTIE +${pending}`,`HORROR-STACK +${pending}`,`+${pending} KAARTEN, VEEL GELUK!`,`STACK ${pending}!`,`DOOR-STACK +${pending}`,`COMBO +${pending}!`,`DOOR-PAKKEN +${pending}`]),
          sub: pick(['Volgende speler pakt of stapelt verder','Niets aan te doen, gewoon pakken','De volgende is de pineut','Of je pakt, of je stapelt door','Geen ontsnapping mogelijk']),
          tone: pending >= 15 ? 'take15' : pending >= 10 ? 'take10' : 'stack',
          duration: 2000 + (big ? 400 : 0)
        });
      } else {
        showBanner(top, {
          text: pick(['PAK 2!','PLUS 2','TWEE KAARTEN ERBIJ','NIET ZO MOOI','GRAB 2','TUT TOCH!','EVEN INNEMEN','+2 OP DE COUNTER','HALEN MAAR','MINI-PAKKAGE','KLEINE STRAF','2-DRUK']),
          sub: pick(['Volgende speler pakt 2 kaarten','Of stapel met 2 of Joker','De volgende aan de beurt voor straf','Lichte schade','Twee kaarten, kan ermee door']),
          tone: 'take2', duration: 1400
        });
      }
      break;
    case '7':
      showBanner(top, {
        text: pick(['DUMP!','VOLLE LEEGGOOI','ALLES ERUIT!','TOTAAL DUMP','HANDEN LEEG!','GRANATEN!','BOM ERUIT','KAARTEN-REGEN','DUMP-MODE','CHAOS-DUMP','VOLLEDIGE LEEGGOOI','SCHOONMAKEN']),
        sub: pick(['Alle kaarten van die kleur eruit','Eén beurt, alles van deze kleur weg','De tafel trilt','Dump alles wat je hebt van deze kleur','Alles in de aflegstapel, nú!']),
        tone: 'dump', duration: 1800
      });
      break;
    case '8':
      showBanner(top, {
        text: pick(['OVERGESLAGEN!','PAS!','JIJ NIET!','SLAA OVER','MIS!','GEEN BEURT','SLAAP!','DOODLOPEN','WACHT MAAR','OM DE HOEK','EVEN WACHTEN','OP DE BANK','VOLGENDE KEER BETER','GEEN BEURT VOOR JOU','NIET VANDAAG']),
        sub: pick(['Volgende speler slaat een beurt over','Even pas op de plaats','De beurt gaat door','Wie dacht dat hij aan de beurt was?','Geen zet voor de volgende']),
        tone: 'skip', duration: 1500
      });
      break;
    case 'J':
      showBanner(top, {
        text: pick(['JACK!','KLEUR KIEZEN!','JOLLY JOKER','JACK ATTACK','KLEUR-TIME','IK BESLIS','KIES MAAR','VAN KLEUR','NAAR KLEUR','WILDE KAART','JACK IN THE BOX','JACKPOT','J IS THE BOSS']),
        sub: pick(['Kleur wordt bepaald','Speler kiest de volgende kleur','Tijd voor een kleurbeslissing','Wat wordt het?','De Jack beslist']),
        tone: 'jack', duration: 1500
      });
      break;
    case 'K':
      showBanner(top, {
        text: pick(['NOG EEN KEER!','KONINKLIJK!','EXTRA BEURT!','BONUS!','OPNIEUW!','KING-SIZE','KRACHT!','KOM MAAR!','GRATIS BEURT','WEER!','+1','NOG EENS!','WILDE KONING','DOUBLE-UP','KING IS BACK']),
        sub: pick(['Speler mag nog een kaart spelen','De koning geeft een cadeautje','Nog een zet, gratis','Koninklijk voorrecht','De beurt is nog niet voorbij']),
        tone: 'king', duration: 1500
      });
      break;
    case 'JKR':
      if (pending > 5) {
        const big = pending >= 15;
        showBanner(top, {
          text: pick(big
            ? [`MONSTER GRAB +${pending}!`,`JOKER-NUCLEAIR +${pending}!`,`FULL STACK +${pending}!`,`RAMPEN-JOKER +${pending}!`,`DODELIJK +${pending}!`,`JOKER STORM +${pending}!`,`+${pending} DONKER!`,`MEGA-JOKER +${pending}!`,`EXTREME STACK +${pending}!`,`JOKER-FRENZY +${pending}`,`JOKER-VLOEK +${pending}!`]
            : [`STACKED JOKER +${pending}!`,`+${pending} KAARTEN!`,`JOKER PLUS +${pending}`,`DOORGEPAKTE JOKER +${pending}`,`JOKER-BOM +${pending}!`,`GRAB-STORM +${pending}`,`STACK ATTACK +${pending}!`,`COMBO-JOKER +${pending}!`,`DOUBLE-STACK +${pending}`,`JOKER OP JOKER +${pending}`]),
          sub: pick(['Volgende speler moet pakken of stapelen','Of nog een Joker erop, of deze straf','De Joker-keten is niet te stoppen','Wie pakt de volgende?','De volgende speler bidt voor een 2']),
          tone: pending >= 15 ? 'take15' : pending >= 10 ? 'take10' : 'stack',
          duration: 2200 + (big ? 400 : 0)
        });
      } else {
        showBanner(top, {
          text: pick(['PAK 5!','JOKER!','+5','PAK MAAR 5','VIJF KAARTEN','JOKER-AANVAL','JOKER-STORM','JOKER-VUIST','JACK VAN KAARTEN','JOKER LAAT ZICH ZIEN','JOKER GRAB','+5 PAKKEN','VIJFTALING','GRAB-FIVE','HANDEN OPEN']),
          sub: pick(['Volgende speler pakt 5 kaarten','Of stapel met 2 of Joker','De Joker is geland, pakken maar','Een Joker komt altijd ongelegen','De volgende is aan de beurt voor 5']),
          tone: 'take5', duration: 1800
        });
      }
      break;
    default:
      break;
  }

  lastSeenTop = top;
  lastSeenPending = newState.pendingTake;
}




function $(s, r = document) { return r.querySelector(s); }
function $$(s, r = document) { return Array.from(r.querySelectorAll(s)); }

function showScreen(id) {
  $$('.screen').forEach(s => s.classList.remove('active'));
  $(id).classList.add('active');
}

function initials(name) {
  return (name || '?').split(/\s+/).map(p => p[0]).join('').slice(0, 2).toUpperCase();
}

function fmtTime(ts) {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// ============================================================
// AUTH SCREEN
// ============================================================

const AVATAR_COUNT = 20;
let guestSelectedAvatar = null;
let registerSelectedAvatar = null;
let authScreenBound = false;

function renderAvatarGrid(container, onSelect) {
  container.innerHTML = '';
  for (let i = 1; i <= AVATAR_COUNT; i++) {
    const cell = document.createElement('div');
    cell.className = 'avatar-cell';
    cell.dataset.avatar = `p${i}.svg`;
    cell.innerHTML = `<img src="/avatars/p${i}.svg" alt="avatar ${i}" />`;
    cell.addEventListener('click', () => {
      $$('.avatar-cell', container).forEach(c => c.classList.remove('selected'));
      cell.classList.add('selected');
      onSelect(cell.dataset.avatar);
    });
    container.appendChild(cell);
  }
}

function updateAuthButtons() {
  // Disable buttons until name + avatar are present (where required)
  const guestName = $('#auth-guest-name').value.trim();
  $('#btn-auth-guest').disabled = !(guestName && guestSelectedAvatar);

  const regUser = $('#auth-reg-user').value.trim();
  const regPass = $('#auth-reg-pass').value;
  $('#btn-auth-register').disabled = !(regUser.length >= 2 && regPass.length >= 3 && registerSelectedAvatar);
}

function bindAuthScreen() {
  if (authScreenBound) return;
  authScreenBound = true;
  // Tab switching
  $$('.auth-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      $$('.auth-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const target = tab.dataset.tab;
      $$('.auth-pane').forEach(p => p.hidden = p.dataset.pane !== target);
    });
  });

  // Default: random avatar selected
  guestSelectedAvatar = 'p1.svg';
  registerSelectedAvatar = 'p1.svg';

  renderAvatarGrid($('#avatar-grid-guest'), (file) => {
    guestSelectedAvatar = file;
    updateAuthButtons();
  });
  renderAvatarGrid($('#avatar-grid-register'), (file) => {
    registerSelectedAvatar = file;
    updateAuthButtons();
  });
  // Pre-select first cell
  ['#avatar-grid-guest', '#avatar-grid-register'].forEach(sel => {
    const first = $(`${sel} .avatar-cell`);
    if (first) first.classList.add('selected');
  });

  $('#auth-guest-name').addEventListener('input', updateAuthButtons);
  $('#auth-reg-user').addEventListener('input', updateAuthButtons);
  $('#auth-reg-pass').addEventListener('input', updateAuthButtons);

  // Guest
  $('#btn-auth-guest').addEventListener('click', () => {
    const name = $('#auth-guest-name').value.trim();
    if (!name || !guestSelectedAvatar) return;
    // Set up guest session, generate a stable playerId locally
    const pid = client.playerId || ('g_' + Math.random().toString(36).slice(2, 10));
    client.playerId = pid;
    client.name = name;
    client.avatar = guestSelectedAvatar;
    client.accountId = null;
    client.saveToStorage();
    enterLobby();
  });

  // Login
  $('#btn-auth-login').addEventListener('click', () => {
    const username = $('#auth-login-user').value.trim();
    const password = $('#auth-login-pass').value;
    const msg = $('#auth-login-msg');
    msg.className = 'auth-msg';
    msg.textContent = 'Bezig…';
    client.login({ username, password }, (res) => {
      if (!res.ok) {
        msg.className = 'auth-msg error';
        msg.textContent = res.error || 'Inloggen mislukt';
        return;
      }
      client.playerId = res.user.playerId;
      client.name = res.user.name;
      client.avatar = res.user.avatar;
      client.accountId = res.user.username;
      client.saveToStorage();
      enterLobby();
    });
  });

  // Register
  $('#btn-auth-register').addEventListener('click', () => {
    const username = $('#auth-reg-user').value.trim();
    const password = $('#auth-reg-pass').value;
    const name = $('#auth-reg-name').value.trim();
    const msg = $('#auth-reg-msg');
    msg.className = 'auth-msg';
    msg.textContent = 'Account aanmaken…';
    client.register({ username, password, name, avatar: registerSelectedAvatar }, (res) => {
      if (!res.ok) {
        msg.className = 'auth-msg error';
        msg.textContent = res.error || 'Registreren mislukt';
        return;
      }
      client.playerId = res.user.playerId;
      client.name = res.user.name;
      client.avatar = res.user.avatar;
      client.accountId = res.user.username;
      client.saveToStorage();
      enterLobby();
    });
  });
}

// Bind immediately; ui.js is loaded at the end of the document.
bindAuthScreen();

function renderAvailableRooms(rooms) {
  const wrap = $('#public-rooms');
  if (!wrap) return;
  wrap.innerHTML = '';
  if (!rooms || rooms.length === 0) {
    wrap.innerHTML = '<p class="muted">Geen open spellen</p>';
    return;
  }
  rooms.forEach(room => {
    const button = document.createElement('button');
    button.className = 'available-room';
    button.type = 'button';
    button.innerHTML = '<span><b>' + escapeHtml(room.name) + '</b><small>' + room.players + '/' + room.maxPlayers + ' spelers</small></span><span>Deelnemen →</span>';
    button.addEventListener('click', () => {
      $('#join-code').value = room.code;
      $('#btn-join').click();
    });
    wrap.appendChild(button);
  });
}

function enterLobby() {
  // Populate lobby identity
  $('#lobby-name').textContent = client.name;
  $('#lobby-name-big').textContent = client.name;
  $('#lobby-avatar').src = avatarUrl(client.avatar);
  $('#lobby-account').textContent = client.accountId
    ? `Ingelogd als @${client.accountId}`
    : 'Gast-sessie';
  $('#btn-logout').hidden = !client.accountId;
  showScreen('#screen-lobby');
  client.listRooms((res) => renderAvailableRooms(res?.rooms || []));
}

// ============================================================
// LOBBY (after auth)
// ============================================================

$('#btn-create').addEventListener('click', () => {
  const opts = {
    name: client.name,
    avatar: client.avatar,
    playerId: client.playerId,
  };
  client.create(opts, (res) => {
    if (!res.ok) { alert(res.error || 'Aanmaken mislukt'); return; }
    client.playerId = res.playerId;
    client.code = res.code;
    client.avatar = res.avatar || client.avatar;
    client.saveToStorage();
    enterRoom();
  });
});

$('#btn-join').addEventListener('click', () => {
  const code = $('#join-code').value.trim().toUpperCase();
  if (!code) { alert('Vul een kamercode in'); return; }
  client.join(code, {
    name: client.name,
    avatar: client.avatar,
    playerId: client.playerId,
  }, (res) => {
    if (!res.ok) { alert(res.error || 'Deelnemen mislukt'); return; }
    client.playerId = res.playerId;
    client.code = res.code;
    client.saveToStorage();
    enterRoom();
  });
});

$('#btn-solo').addEventListener('click', () => {
  client.create({
    name: client.name,
    avatar: client.avatar,
    playerId: client.playerId,
  }, (res) => {
    if (!res.ok) { alert(res.error || 'Aanmaken mislukt'); return; }
    client.playerId = res.playerId;
    client.code = res.code;
    client.saveToStorage();
    enterRoom();
    const pool = window.DUTCH_AI_NAMES || ['AI'];
    const aiName = pool[Math.floor(Math.random() * pool.length)];
    fetchProfiles().then((profiles) => {
      const keys = Object.keys(profiles);
      const profileKey = keys.length ? keys[Math.floor(Math.random() * keys.length)] : null;
      setTimeout(() => client.addAi(aiName, profileKey, () => {
        setTimeout(() => client.start(), 200);
      }), 300);
    });
  });
});

$('#btn-logout').addEventListener('click', () => {
  if (!confirm('Uitloggen? Je verliest je sessie maar je account blijft bestaan.')) return;
  client.clearStorage();
  client.playerId = null;
  client.name = null;
  client.avatar = null;
  client.accountId = null;
  showScreen('#screen-auth');
});

$('#btn-change-profile').addEventListener('click', () => {
  // For guests: just return to auth screen.
  // For logged in: clear stored avatar choice (the auth screen lets them pick a new one).
  showScreen('#screen-auth');
  // Pre-populate name field
  if (client.name) $('#auth-guest-name').value = client.name;
  // Set form to register tab if logged in (so they can change avatar there)
  if (client.accountId) {
    $$('.auth-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === 'register'));
    $$('.auth-pane').forEach(p => p.hidden = p.dataset.pane !== 'register');
  }
});

$('#link-rules').addEventListener('click', (e) => {
  e.preventDefault();
  $('#rules-modal').hidden = false;
});
$('#close-rules').addEventListener('click', () => $('#rules-modal').hidden = true);
$('#btn-rules-game').addEventListener('click', () => $('#rules-modal').hidden = false);

// ============================================================
// Room (pre-game lobby)
// ============================================================

function enterRoom(phaseOverride) {
  // If we know the game is already in play, jump straight there.
  if (phaseOverride === 'playing' || (client.state && client.state.phase === 'playing')) {
    showScreen('#screen-game');
    return;
  }
  showScreen('#screen-room');
  $('#room-code-display').textContent = client.code;
  $('#you-label').textContent = client.name;
  $('#btn-copy-code').onclick = () => {
    navigator.clipboard.writeText(client.code);
    $('#btn-copy-code').textContent = 'Gekopieerd!';
    setTimeout(() => $('#btn-copy-code').textContent = 'Kopieer', 1200);
  };
}

$('#btn-start').addEventListener('click', () => {
  client.start((res) => {
    if (!res || !res.ok) {
      // ignore silently
    }
  });
});

// Open AI name modal
$('#btn-add-ai').addEventListener('click', () => {
  openAiNameModal();
});

let cachedProfiles = null;

function fetchProfiles() {
  return new Promise((resolve) => {
    if (cachedProfiles) return resolve(cachedProfiles);
    // Add a one-shot listener; need to make getProfiles call
    client.socket.emit('getProfiles', (res) => {
      if (res && res.ok) {
        cachedProfiles = res.profiles;
        resolve(cachedProfiles);
      } else {
        resolve({});
      }
    });
  });
}

let selectedProfile = 'brutaal';

async function openAiNameModal() {
  $('#ai-name-input').value = '';
  selectedProfile = 'brutaal';
  $('#ai-name-modal').hidden = false;
  setTimeout(() => $('#ai-name-input').focus(), 50);
  await renderProfilePicker();
}

async function renderProfilePicker() {
  const profiles = await fetchProfiles();
  const wrap = $('#ai-profiles');
  wrap.innerHTML = '';
  Object.entries(profiles).forEach(([key, p]) => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'ai-profile-card';
    card.style.setProperty('--profile-color', p.color);
    card.dataset.profileKey = key;
    card.innerHTML = `
      <div class="profile-name"><span class="profile-dot" style="background:${p.color}"></span>${p.name_nl}</div>
      <div class="profile-tag">${p.tagline}</div>
    `;
    if (key === selectedProfile) card.classList.add('selected');
    card.addEventListener('click', () => {
      selectedProfile = key;
      $$('.ai-profile-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
    });
    wrap.appendChild(card);
  });
}

function closeAiNameModal() {
  $('#ai-name-modal').hidden = true;
}

function submitAiName() {
  let name = ($('#ai-name-input').value || '').trim();
  if (!name) {
    const pool = window.DUTCH_AI_NAMES || ['AI'];
    name = pool[Math.floor(Math.random() * pool.length)];
  }
  client.addAi(name, selectedProfile || null, (res) => {
    if (res && res.ok) {
      closeAiNameModal();
    } else if (res && res.error) {
      alert(res.error);
    }
  });
}

$('#btn-ai-random').addEventListener('click', async () => {
  const pool = window.DUTCH_AI_NAMES || ['AI'];
  $('#ai-name-input').value = pool[Math.floor(Math.random() * pool.length)];
  // Also randomize the profile selection
  const profiles = await fetchProfiles();
  const keys = Object.keys(profiles);
  if (keys.length) {
    selectedProfile = keys[Math.floor(Math.random() * keys.length)];
    $$('.ai-profile-card').forEach(c => {
      c.classList.toggle('selected', c.dataset.profileKey === selectedProfile);
    });
  }
  $('#ai-name-input').focus();
});

$('#btn-ai-add').addEventListener('click', submitAiName);
$('#close-ai-name').addEventListener('click', closeAiNameModal);

// Submit on Enter
$('#ai-name-input').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    submitAiName();
  } else if (e.key === 'Escape') {
    closeAiNameModal();
  }
});

$('#btn-close-room').addEventListener('click', () => {
  if (!confirm('Kamer sluiten voor alle spelers?')) return;
  client.closeRoom((res) => {
    if (!res || !res.ok) alert(res?.error || 'Kamer sluiten mislukt');
  });
});

$('#btn-leave').addEventListener('click', () => {
  client.leaveRoom(() => {
    client.code = null;
    client.state = null;
    client.saveToStorage();
    enterLobby();
  });
});

function renderRoom(state) {
  if (!state) return;
  const you = state.players[state.youIndex];
  $('#players-count').textContent = `(${state.players.length}/4)`;
  const list = $('#players-list');
  list.innerHTML = '';
  state.players.forEach((p, i) => {
    const li = document.createElement('li');
    li.className = 'player-row' + (i === state.youIndex ? ' is-you' : '') + (p.isAi ? ' is-ai' : '');
    const ava = p.avatar || 'p1.svg';
    li.innerHTML = `
      <img class="player-avatar" src="${escapeHtml(avatarUrl(ava))}" alt="" />
      <div class="name">${escapeHtml(p.name)}</div>
      <span class="badge ${p.isAi ? 'bot' : ''}">${i === state.youIndex ? 'Jij' : (p.isAi ? 'AI' : 'Speler ' + (i+1))}</span>
      ${p.isAi && i !== state.youIndex ? `<button class="remove-btn" data-id="${p.id}" title="Verwijder">×</button>` : ''}
    `;
    list.appendChild(li);
  });
  list.querySelectorAll('.remove-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.dataset.id;
      client.removeAi(id, () => {});
    });
  });
  // Start button enable
  const isHost = state.youIndex === 0;
  $('#btn-start').disabled = !(isHost && state.players.length >= 2);
  $('#btn-close-room').disabled = !isHost;
}

// ============================================================
// Game
// ============================================================

let lastDrawnCard = null;
let afterTake = false;
let pendingSuitFromPlay = false;
let pendingSuitPlayerShown = null;

function showGame() {
  showScreen('#screen-game');
}

function renderGame(state) {
  if (!state) return;
  // If in waiting room, render that
  if (state.phase === 'waiting') {
    showScreen('#screen-room');
    renderRoom(state);
    return;
  }
  showGame();
  if (state.pendingSuitPlayer === state.youIndex && pendingSuitPlayerShown !== state.pendingSuitPlayer) {
    pendingSuitPlayerShown = state.pendingSuitPlayer;
    openSuitModal();
  } else if (state.pendingSuitPlayer !== state.youIndex) {
    pendingSuitPlayerShown = null;
  }
  renderOpponents(state);
  renderTable(state);
  renderActionLog(state);
  renderHand(state);
  renderActionBar(state);
}

function renderOpponents(state) {
  const row = $('#opponents-row');
  row.innerHTML = '';
  const me = state.youIndex;
  state.players.forEach((p, i) => {
    if (i === me) return;
    const div = document.createElement('div');
    div.className = 'opp' + (i === state.turn ? ' active' : '') + (p.isAi ? ' is-ai' : '');
    if (p.profileColor) {
      div.style.setProperty('--player-color', p.profileColor);
      div.setAttribute('data-profile', p.profileKey || '');
    }
    const miniature = p.count > 0 ? '<div class="opp-card-back"></div>' : '';
    const tooltip = p.profileTagline ? ` title="${escapeHtml(p.profileTagline)}"` : '';
    const ava = p.avatar || 'p1.svg';
    div.innerHTML = `
      <img class="opp-avatar" src="${escapeHtml(avatarUrl(ava))}" alt=""${tooltip} />
      <div>
        <div class="name">${escapeHtml(p.name)} ${p.isAi ? '<span class="profile-badge">' + escapeHtml(profileShort(p.profileKey)) + '</span>' : ''}</div>
        <div class="count">${p.count} kaart${p.count === 1 ? '' : 'en'}</div>
      </div>
      ${miniature}
      <div class="badge-turn">${i === state.turn ? '▶' : ''}</div>
    `;
    row.appendChild(div);
  });
}

// Short display name for a profile key
function profileShort(key) {
  const map = {
    brutaal: 'BRU',
    flirterig: 'FLIRT',
    chill: 'CHILL',
    filosoof: 'WISDOM',
    slecht_verliezer: 'DRAMA',
    rekenmeester: 'PRO',
    geluksvogel: 'LUCK',
    kansloos: 'OOF',
    ouwe_rot: 'OLD',
    hyper: 'HYPE',
  };
  return map[key] || key.toUpperCase().slice(0, 4);
}

function renderTable(state) {
  // Stock
  const stockPile = $('#stock-pile');
  stockPile.innerHTML = '';
  if (state.deckCount > 0) {
    const back = renderCard({}, { back: true, onClick: () => onStockClick() });
    stockPile.appendChild(back);
  } else {
    const empty = document.createElement('div');
    empty.className = 'muted';
    empty.textContent = '(leeg)';
    stockPile.appendChild(empty);
  }
  // Re-add stock-count after innerHTML wipe
  let stockCount = stockPile.querySelector('#stock-count');
  if (!stockCount) {
    stockCount = document.createElement('div');
    stockCount.className = 'pile-count';
    stockCount.id = 'stock-count';
    stockPile.appendChild(stockCount);
  }
  stockCount.textContent = `${state.deckCount} in voorraad`;

  // Discard top
  const discardPile = $('#discard-pile');
  discardPile.innerHTML = '';
  if (state.discardTop) {
    const card = renderCard(state.discardTop, { size: 'lg' });
    discardPile.appendChild(card);
  }

  // Last three
  const last3 = $('#last-three');
  last3.innerHTML = '';
  (state.lastThree || []).forEach(c => {
    if (!c) return;
    const card = renderCard(c);
    card.style.cursor = 'default';
    card.style.transform = 'none';
    card.style.boxShadow = '0 2px 4px rgba(0,0,0,0.4)';
    last3.appendChild(card);
  });

  // Status bar
  const turnPlayer = state.players[state.turn];
  $('#turn-indicator').textContent = turnPlayer ? `Beurt van ${turnPlayer.name}` : '—';
  $('#dir-indicator').textContent = state.direction === 1 ? '→' : '←';
  if (state.pendingTake > 0) {
    $('#pending-indicator').hidden = false;
    $('#pending-indicator').textContent = `TE BETALEN: ${state.pendingTake}`;
  } else {
    $('#pending-indicator').hidden = true;
  }
  if (state.declaredSuit) {
    $('#declared-indicator').hidden = false;
    $('#declared-indicator').textContent = `Gekozen: ${state.declaredSuit}`;
  } else {
    $('#declared-indicator').hidden = true;
  }
}

function renderHand(state) {
  const hand = state.players[state.youIndex]?.hand || [];
  const container = $('#your-hand');
  container.innerHTML = '';
  $('#hand-count').textContent = `${hand.length} kaart${hand.length === 1 ? '' : 'en'}`;

  const isMyTurn = state.youIndex === state.turn;
  const top = state.discardTop;
  const declared = state.declaredSuit;

  const orderedHand = hand.map((card, index) => {
    let playable = false;
    if (isMyTurn) {
      if (state.pendingTake > 0) {
        playable = card.r === '2' || card.r === 'JKR';
      } else {
        playable = canPlayClient(card, top, declared);
      }
    }
    return { card, index, playable };
  });
  // Keep the hand order stable within each group, but put playable cards first.
  orderedHand.sort((a, b) => Number(b.playable) - Number(a.playable));
  orderedHand.forEach(({ card: c, index: i, playable }) => {
    const card = renderCard(c, {
      disabled: !playable,
      playable,
      onClick: playable ? () => onCardClick(i) : null,
    });
    container.appendChild(card);
  });
}

function canPlayClient(card, top, declared) {
  if (!top) return false;
  if (card.r === 'JKR' || card.r === 'J') return true;
  if (top.r === 'JKR') return true;
  const eff = declared || top.s;
  return card.r === top.r || card.s === eff;
}

function renderActionLog(state) {
  const log = $('#action-log');
  log.innerHTML = '';
  (state.lastActions || []).slice().reverse().forEach(e => {
    const div = document.createElement('div');
    div.className = 'entry ' + (e.kind || '');
    div.textContent = e.msg;
    log.appendChild(div);
  });
}

function renderActionBar(state) {
  const bar = $('#action-bar');
  const isMyTurn = state.youIndex === state.turn;
  const pending = state.pendingTake > 0;
  const drawBtn = $('#btn-draw');
  const takeBtn = $('#btn-take');
  const skipBtn = $('#btn-skip');
  const playDrawnBtn = $('#btn-play-drawn');
  const passDrawnBtn = $('#btn-pass-drawn');
  const skipAfterTakeBtn = $('#btn-skip-after-take');
  const hint = $('#action-hint');
  const drawnPlayable = !!lastDrawnCard && canPlayClient(lastDrawnCard, state.discardTop, state.declaredSuit);

  drawBtn.hidden = !isMyTurn || pending || !!lastDrawnCard;
  takeBtn.hidden = !(isMyTurn && pending);
  skipBtn.hidden = true; // never show during play
  playDrawnBtn.hidden = !(isMyTurn && lastDrawnCard && drawnPlayable);
  passDrawnBtn.hidden = !(isMyTurn && lastDrawnCard);
  skipAfterTakeBtn.hidden = !(isMyTurn && afterTake && !pending && !lastDrawnCard);
  drawBtn.disabled = !(isMyTurn && !pending && !lastDrawnCard);
  takeBtn.disabled = !(isMyTurn && pending);
  skipBtn.disabled = true;
  playDrawnBtn.disabled = !(isMyTurn && lastDrawnCard && drawnPlayable);
  passDrawnBtn.disabled = !(isMyTurn && lastDrawnCard);
  skipAfterTakeBtn.disabled = !(isMyTurn && afterTake && !pending && !lastDrawnCard);
  if (pending) {
    takeBtn.textContent = `Pak ${state.pendingTake}`;
  }

  // Action hint text
  if (!isMyTurn) {
    hint.hidden = true;
    hint.innerHTML = '';
    return;
  }
  // Count playable cards in hand
  const hand = state.players[state.youIndex]?.hand || [];
  let playableCount = 0;
  for (const c of hand) {
    if (pending) {
      if (c.r === '2' || c.r === 'JKR') playableCount++;
    } else {
      if (canPlayClient(c, state.discardTop, state.declaredSuit)) playableCount++;
    }
  }
  if (pending) {
    hint.hidden = false;
    if (playableCount > 0) {
      hint.innerHTML = `Je hebt <span class="you-have">${playableCount}</span> stapelbare kaart${playableCount === 1 ? '' : 'en'} (2 of Joker). Speel er een of pak de straf.`;
    } else {
      hint.innerHTML = `Geen stapelbare kaarten. Je moet <span class="you-have">${state.pendingTake}</span> kaarten pakken.`;
    }
  } else if (lastDrawnCard) {
    hint.hidden = false;
    hint.innerHTML = `Je hebt net <span class="you-have">${lastDrawnCard.r}${lastDrawnCard.s}</span> getrokken. Speel 'm of bewaar 'm.`;
  } else {
    // Post-take or normal play
    const drawn = lastDrawnCard;
    if (drawn) {
      hint.hidden = true;
    } else if (skipAfterTakeBtn && !skipAfterTakeBtn.hidden) {
      hint.hidden = false;
      hint.innerHTML = `Je hebt net de straf gepakt. <span class="you-have">Speel een kaart, pak 1 extra, of pas.</span>`;
    } else if (playableCount > 0) {
      hint.hidden = false;
      hint.innerHTML = `Je hebt <span class="you-have">${playableCount}</span> speelbare kaart${playableCount === 1 ? '' : 'en'}. Klik er één om te spelen, of pak een kaart.`;
    } else {
      hint.hidden = false;
      hint.innerHTML = `Geen speelbare kaart. <span class="you-have">Pak een kaart van de voorraad.</span>`;
    }
  }
}

function onCardClick(i) {
  if (!client.state) return;
  const st = client.state;
  if (st.youIndex !== st.turn) return;
  const card = st.players[st.youIndex].hand[i];
  // 7-dump: intercept and let player pick the order
  if (card && card.r === '7') {
    const suit = card.s;
    const sameSuit = st.players[st.youIndex].hand
      .map((c, idx) => ({ c, idx }))
      .filter(o => o.c.s === suit);
    if (sameSuit.length >= 2) {
      openSevenModal(sameSuit.map(o => o.idx), suit);
      return;
    }
    // Only the 7 itself, just play normally
  }
  client.play(i, (res) => {
    if (!res || !res.ok) {
      alert(res?.error || 'Kan deze kaart niet spelen');
      return;
    }
    if (res.requires === 'declareSuit' && (res.chooser === undefined || res.chooser === client.state.youIndex)) {
      pendingSuitFromPlay = true;
      openSuitModal();
    }
    lastDrawnCard = null;
    afterTake = false;
  });
}

// 7-dump modal logic
let sevenCards = []; // array of hand indices in play order
let sevenCardObjects = []; // the actual card objects
let sevenSuit = '';
let sevenCardIndex = -1; // index of the 7 itself in the hand
let sevenOptionalLastIndices = [];

function openSevenModal(handIndices, suit) {
  sevenSuit = suit;
  sevenOptionalLastIndices = client.state.players[client.state.youIndex].hand
    .map((c, idx) => handIndices.includes(idx) ? -1 : idx).filter(idx => idx >= 0);
  const lastSelect = $('#seven-last-card');
  if (lastSelect) {
    lastSelect.innerHTML = '<option value="">Geen extra kaart</option>';
    sevenOptionalLastIndices.forEach(idx => {
      const option = document.createElement('option');
      const card = client.state.players[client.state.youIndex].hand[idx];
      option.value = String(idx);
      option.textContent = `${cardName(card)} als laatste`;
      lastSelect.appendChild(option);
    });
  }
  sevenCardIndex = handIndices[0]; // first card we found; we'll find the 7 below
  // Find which one is the 7
  const hand = client.state.players[client.state.youIndex].hand;
  const sevenIdx = hand.findIndex(c => c.r === '7');
  sevenCardIndex = sevenIdx >= 0 ? sevenIdx : handIndices[0];
  // Build the cards in default order: 7 first, then others
  sevenCardObjects = handIndices.map(idx => ({ ...hand[idx], _handIdx: idx }));
  sevenCards = [...sevenCardObjects];
  // Put the 7 first by default
  const sevenObjIdx = sevenCards.findIndex(c => c.r === '7');
  if (sevenObjIdx > 0) {
    const [s] = sevenCards.splice(sevenObjIdx, 1);
    sevenCards.unshift(s);
  }
  renderSevenCards();
  $('#seven-modal').hidden = false;
}

function closeSevenModal() {
  $('#seven-modal').hidden = true;
}

function renderSevenCards() {
  const wrap = $('#seven-cards');
  wrap.innerHTML = '';
  const hint = $('#seven-hint');
  sevenCards.forEach((card, pos) => {
    const el = renderCard(card, { size: 'sm' });
    el.classList.add('seven-card');
    el.draggable = true;
    el.dataset.pos = pos;
    if (pos === sevenCards.length - 1) {
      // Last card - highlight and tag
      el.classList.add('last-card');
      const tag = document.createElement('div');
      tag.className = 'last-tag';
      tag.textContent = isEffect(card) ? 'LAATSTE (effect)' : 'LAATSTE';
      el.appendChild(tag);
      hint.textContent = `✓ Je laatste kaart is ${cardName(card)} — de waarde/het effect hiervan telt.`;
      hint.className = 'seven-hint valid';
      $('#btn-seven-confirm').disabled = false;
    }
    // Drag handlers
    el.addEventListener('dragstart', (ev) => {
      if (pos === 0) { ev.preventDefault(); return; }
      ev.dataTransfer.setData('text/plain', String(pos));
      el.classList.add('dragging');
    });
    el.addEventListener('dragend', () => {
      el.classList.remove('dragging');
    });
    el.addEventListener('dragover', (ev) => {
      ev.preventDefault();
    });
    el.addEventListener('drop', (ev) => {
      ev.preventDefault();
      const fromPos = parseInt(ev.dataTransfer.getData('text/plain'), 10);
      const toPos = parseInt(el.dataset.pos, 10);
      if (Number.isNaN(fromPos) || Number.isNaN(toPos) || fromPos === toPos || fromPos === 0 || toPos === 0) return;
      const [moved] = sevenCards.splice(fromPos, 1);
      sevenCards.splice(toPos, 0, moved);
      renderSevenCards();
    });
    if (pos > 0) {
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'seven-remove';
      remove.textContent = '×';
      remove.title = 'Kaart weglaten';
      remove.addEventListener('click', (ev) => {
        ev.stopPropagation();
        sevenCards.splice(pos, 1);
        renderSevenCards();
      });
      el.appendChild(remove);
    }
    wrap.appendChild(el);
  });
}

function isEffect(card) {
  if (!card) return true;
  return ['A','2','7','8','J','K','JKR'].includes(card.r);
}

function cardName(card) {
  return card ? `${card.r}${card.s}` : '?';
}

$('#btn-seven-confirm').addEventListener('click', () => {
  // Build the play order. The 7 must be first (it's the actual play).
  // Then the rest in order. The last card stays as is.
  const order = sevenCards.map(c => c._handIdx);
  const optionalLastValue = $('#seven-last-card')?.value || '';
  if (optionalLastValue !== '') order.push(Number(optionalLastValue));
  // Send the 7-dump order to the server
  client.playDump(order, (res) => {
    if (res && res.ok) {
      closeSevenModal();
      lastDrawnCard = null;
      if (res.requires === 'declareSuit' && (res.chooser === undefined || res.chooser === client.state.youIndex)) {
        pendingSuitFromPlay = true;
        openSuitModal();
      }
    } else {
      alert(res?.error || 'Dump mislukt');
    }
  });
});

$('#btn-seven-cancel').addEventListener('click', closeSevenModal);
$('#close-seven').addEventListener('click', closeSevenModal);

function onStockClick() {
  if (!client.state) return;
  const st = client.state;
  if (st.youIndex !== st.turn) return;
  client.draw((res) => {
    if (!res || !res.ok) {
      alert(res?.error || 'Kan niet pakken');
      return;
    }
    lastDrawnCard = res.drawnCard;
    afterTake = false;
    // Render will pick this up
    renderActionBar(client.state);
    if (res.playable && res.drawnCard) {
      // Notify user they can play the drawn card
      // (the bar will show Play/Pass buttons)
    }
  });
}

$('#btn-draw').addEventListener('click', onStockClick);

$('#btn-take').addEventListener('click', () => {
  showBanner({ r: '7', s: '♣' }, { text: 'Grabble Grabble!', sub: 'Kaarten pakken maar', tone: 'take2', duration: 1400 });
  client.take((res) => {
    if (res && res.ok) {
      afterTake = true;
      // After taking, must declare suit if top is Joker
      if (client.state.discardTop?.r === 'JKR') {
        pendingSuitFromPlay = false;
        openSuitModal();
      }
      renderActionBar(client.state);
    }
  });
});

$('#btn-skip').addEventListener('click', () => {
  client.skip();
  lastDrawnCard = null;
  afterTake = false;
});

$('#btn-skip-after-take').addEventListener('click', () => {
  // After taking from a stack, the player chose to pass (end turn)
  client.skip();
  lastDrawnCard = null;
});

$('#btn-play-drawn').addEventListener('click', () => {
  client.playDrawn((res) => {
    if (!res || !res.ok) {
      alert(res?.error || 'Kan getrokken kaart niet spelen');
      return;
    }
    lastDrawnCard = null;
    afterTake = false;
    if (res.requires === 'declareSuit' && (res.chooser === undefined || res.chooser === client.state.youIndex)) {
      pendingSuitFromPlay = true;
      openSuitModal();
    }
  });
});

$('#btn-pass-drawn').addEventListener('click', () => {
  client.skip();
  lastDrawnCard = null;
});

// Mobile chat collapse toggle
const chatPanel = $('#game-chat-panel');
const chatToggle = $('#btn-chat-toggle');
if (chatToggle && chatPanel) {
  chatToggle.addEventListener('click', () => {
    chatPanel.classList.toggle('collapsed');
  });
  // Always start open. The user can collapse with the toggle button.
  chatPanel.classList.remove('collapsed');
  // Re-check on resize - keep state as-is, no auto-collapse
}

function openSuitModal() {
  // Show how many cards of each suit the player has in their hand
  const hand = client.state?.players?.[client.state.youIndex]?.hand || [];
  const counts = { '♦': 0, '♣': 0, '♥': 0, '♠': 0 };
  for (const c of hand) {
    if (counts[c.s] !== undefined) counts[c.s]++;
  }
  // Update the badges
  $$('.suit-btn .suit-count').forEach(el => {
    const suit = el.dataset.suit;
    const n = counts[suit] || 0;
    el.textContent = `${n} kaart${n === 1 ? '' : 'en'}`;
  });
  // Mark zero-suit buttons as 'zero' class
  $$('.suit-btn').forEach(btn => {
    const suit = btn.dataset.suit;
    btn.classList.toggle('zero', (counts[suit] || 0) === 0);
    btn.classList.remove('recommended');
  });
  // Highlight the highest-count suit as 'recommended' (if at least 1)
  let best = null, bestN = -1;
  for (const [s, n] of Object.entries(counts)) {
    if (n > bestN) { bestN = n; best = s; }
  }
  if (best && bestN > 0) {
    const btn = document.querySelector(`.suit-btn[data-suit="${best}"]`);
    if (btn) btn.classList.add('recommended');
  }
  $('#suit-modal').hidden = false;
}
function closeSuitModal() {
  $('#suit-modal').hidden = true;
  pendingSuitFromPlay = false;
  $$('.suit-btn').forEach(btn => {
    btn.classList.remove('recommended', 'zero');
  });
}
$$('.suit-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const suit = btn.dataset.suit;
    client.declareSuit(suit);
    closeSuitModal();
  });
});

// Game over
function maybeShowGameOver(state) {
  if (state.phase === 'ended' && state.winner !== null && state.winner !== undefined) {
    const winner = state.players[state.winner];
    const isMe = state.winner === state.youIndex;
    $('#gameover-title').textContent = isMe ? 'Jij wint! 🎉' : `${winner?.name} wint!`;
    $('#gameover-msg').textContent = isMe ? 'Mooi gespeeld.' : 'Volgende keer beter.';
    $('#gameover-modal').hidden = false;
  } else {
    $('#gameover-modal').hidden = true;
  }
}
$('#btn-back-lobby').addEventListener('click', () => {
  client.leaveRoom((res) => {
    client.code = null;
    client.state = null;
    client.saveToStorage();
    $('#gameover-modal').hidden = true;
    enterLobby();
  });
});

// ============================================================
// Chat
// ============================================================

function renderChat(chat) {
  function avatarFor(entry) {
    if (entry.avatar) return entry.avatar;
    // Look up by playerId in current state
    if (client.state && entry.playerId) {
      const p = client.state.players.find(pp => pp.id === entry.playerId);
      if (p && p.avatar) return p.avatar;
    }
    return 'p1.svg';
  }
  function buildMessage(entry) {
    const div = document.createElement('div');
    div.className = 'chat-msg' + (entry.ai ? ' ai' : '') + (entry.name === client.name ? ' you' : '');
    div.innerHTML =
      `<img class="chat-avatar" src="${escapeHtml(avatarUrl(avatarFor(entry)))}" alt="" />` +
      `<div class="chat-msg-body">` +
        `<span class="who">${escapeHtml(entry.name)}</span>` +
        `<span class="msg-text">${escapeHtml(entry.msg)}</span>` +
      `</div>`;
    return div;
  }
  const log = $('#chat-log');
  if (log) {
    log.innerHTML = '';
    chat.forEach(c => log.appendChild(buildMessage(c)));
    log.scrollTop = log.scrollHeight;
  }
  // Mirror to game-screen chat
  const gameLog = $('#game-chat-log');
  if (gameLog) {
    gameLog.innerHTML = '';
    chat.forEach(c => gameLog.appendChild(buildMessage(c)));
    gameLog.scrollTop = gameLog.scrollHeight;
  }
}

$('#chat-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const input = $('#chat-input');
  const msg = input.value.trim();
  if (!msg) return;
  client.chat(msg);
  input.value = '';
});

$('#game-chat-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const input = $('#game-chat-input');
  const msg = input.value.trim();
  if (!msg) return;
  client.chat(msg);
  input.value = '';
});

// ============================================================
// Escape helper
// ============================================================
function escapeHtml(s) {
  return (s || '').replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));
}

// ============================================================
// Init
// Client is instantiated by the inline boot script in index.html
// which also calls connect() and bindAuthScreen().
// ============================================================
