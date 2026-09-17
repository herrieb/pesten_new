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



const client = new PestenClient();

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
// Lobby
// ============================================================

$('#btn-create').addEventListener('click', () => {
  const name = $('#create-name').value.trim() || 'Speler';
  client.create(name, (res) => {
    if (!res.ok) { alert(res.error || 'Aanmaken mislukt'); return; }
    client.playerId = res.playerId;
    client.code = res.code;
    client.name = name;
    enterRoom();
  });
});

$('#btn-join').addEventListener('click', () => {
  const code = $('#join-code').value.trim().toUpperCase();
  const name = $('#join-name').value.trim() || 'Speler';
  if (!code) { alert('Vul een kamercode in'); return; }
  client.join(code, name, (res) => {
    if (!res.ok) { alert(res.error || 'Deelnemen mislukt'); return; }
    client.playerId = res.playerId;
    client.code = res.code;
    client.name = name;
    enterRoom();
  });
});

$('#btn-solo').addEventListener('click', async () => {
  const name = $('#join-name').value.trim() || $('#create-name').value.trim() || 'Speler';
  client.create(name, (res) => {
    if (!res.ok) { alert(res.error || 'Aanmaken mislukt'); return; }
    client.playerId = res.playerId;
    client.code = res.code;
    client.name = name;
    enterRoom();
    // Pick a random Dutch name + random profile for the AI opponent
    const pool = window.DUTCH_AI_NAMES || ['AI'];
    const aiName = pool[Math.floor(Math.random() * pool.length)];
    // After profiles load, pick one. Otherwise let the server pick one for us.
    fetchProfiles().then((profiles) => {
      const keys = Object.keys(profiles);
      const profileKey = keys.length ? keys[Math.floor(Math.random() * keys.length)] : null;
      setTimeout(() => client.addAi(aiName, profileKey, () => {
        setTimeout(() => client.start(), 200);
      }), 300);
    });
  });
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

function enterRoom() {
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

$('#btn-leave').addEventListener('click', () => {
  location.reload();
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
    li.innerHTML = `
      <div class="avatar">${initials(p.name)}</div>
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
}

// ============================================================
// Game
// ============================================================

let lastDrawnCard = null;
let pendingSuitFromPlay = false;

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
    div.innerHTML = `
      <div class="avatar"${tooltip}>${initials(p.name)}</div>
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

  hand.forEach((c, i) => {
    let playable = false;
    let disabled = false;
    if (isMyTurn) {
      if (state.pendingTake > 0) {
        // Must stack
        playable = c.r === '2' || c.r === 'JKR';
        disabled = !playable;
      } else {
        playable = canPlayClient(c, top, declared);
      }
    } else {
      disabled = true;
    }
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

  drawBtn.hidden = !isMyTurn || pending || !!lastDrawnCard;
  takeBtn.hidden = !(isMyTurn && pending);
  skipBtn.hidden = true; // never show during play
  playDrawnBtn.hidden = !(isMyTurn && lastDrawnCard);
  passDrawnBtn.hidden = !(isMyTurn && lastDrawnCard);
  skipAfterTakeBtn.hidden = !(isMyTurn && !pending && !lastDrawnCard);
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
    if (res.requires === 'declareSuit') {
      pendingSuitFromPlay = true;
      openSuitModal();
    }
    lastDrawnCard = null;
  });
}

// 7-dump modal logic
let sevenCards = []; // array of hand indices in play order
let sevenCardObjects = []; // the actual card objects
let sevenSuit = '';
let sevenCardIndex = -1; // index of the 7 itself in the hand

function openSevenModal(handIndices, suit) {
  sevenSuit = suit;
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
      if (isEffect(card)) {
        el.classList.add('invalid');
        hint.textContent = '✗ Laatste kaart moet een getal zijn (3-10). Sleep een andere kaart naar achter.';
        hint.className = 'seven-hint invalid';
        $('#btn-seven-confirm').disabled = true;
      } else {
        hint.textContent = `✓ Je laatste kaart is ${cardName(card)} — alleen het effect hiervan telt.`;
        hint.className = 'seven-hint valid';
        $('#btn-seven-confirm').disabled = false;
      }
    }
    // Drag handlers
    el.addEventListener('dragstart', (ev) => {
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
      if (Number.isNaN(fromPos) || Number.isNaN(toPos) || fromPos === toPos) return;
      const [moved] = sevenCards.splice(fromPos, 1);
      sevenCards.splice(toPos, 0, moved);
      renderSevenCards();
    });
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
  // Send the 7-dump order to the server
  client.playDump(order, (res) => {
    if (res && res.ok) {
      closeSevenModal();
      lastDrawnCard = null;
      if (res.requires === 'declareSuit') {
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
  client.take((res) => {
    if (res && res.ok) {
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
    if (res.requires === 'declareSuit') {
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
  location.reload();
});

// ============================================================
// Chat
// ============================================================

function renderChat(chat) {
  const log = $('#chat-log');
  log.innerHTML = '';
  chat.forEach(c => {
    const div = document.createElement('div');
    div.className = 'chat-msg' + (c.ai ? ' ai' : '') + (c.name === client.name ? ' you' : '');
    div.innerHTML = `<span class="who">${escapeHtml(c.name)}</span>${escapeHtml(c.msg)}`;
    log.appendChild(div);
  });
  log.scrollTop = log.scrollHeight;
  // Mirror to game-screen chat
  const gameLog = $('#game-chat-log');
  if (gameLog) {
    gameLog.innerHTML = '';
    chat.forEach(c => {
      const div = document.createElement('div');
      div.className = 'chat-msg' + (c.ai ? ' ai' : '') + (c.name === client.name ? ' you' : '');
      div.innerHTML = `<span class="who">${escapeHtml(c.name)}</span>${escapeHtml(c.msg)}`;
      gameLog.appendChild(div);
    });
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
// ============================================================
client.on('state', (s) => {
  renderGame(s);
  maybeShowGameOver(s);
  maybeShowEffectBanner(s);
});
client.on('chat', (c) => renderChat(c));
client.on('error', (m) => alert(m));

client.connect();
