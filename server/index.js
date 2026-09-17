const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const { customAlphabet } = require('nanoid');
const game = require('./game');
const ai = require('./ai');
const profiles = require('./profiles');
const t = require('./i18n');
const auth = require('./auth');

const nanoid = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 5);
// Dutch name pools for AI players
const AI_NAMES_M = ['Daan','Sem','Lucas','Finn','Levi','Noah','Milan','Sam','Bram','Liam','Luuk','Thijs','Julian','Noud','Gijs','Teun','Stijn','Sven','Lars','Ruben','Mark','Joris','Tim','Niels','Tom','Jeroen','Pepijn','Roel','Floris','Hugo','Bas','Vince','Pieter','Jan','Kees','Max'];
const AI_NAMES_F = ['Emma','Julia','Mila','Tess','Sophie','Zoë','Anna','Eva','Saar','Lieke','Fenna','Sanne','Noor','Lynn','Roos','Evi','Yara','Fleur','Lotte','Hannah','Lisa','Anne','Sofie','Maria','Femke','Wendy','Inge','Ilse','Mirthe','Puck','Fenne','Maud','Britt','Bo','Jade','Veerle','Noortje','Sara','Nina','Ella','Liv','Suze','Cato','Kiki','Maya'];

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(express.static(path.join(__dirname, '..', 'public')));

// rooms: code -> { game, chat: [], sockets: {socketId -> {playerIndex, name}} }
const rooms = new Map();

function getRoom(code) {
  if (!rooms.has(code)) {
    rooms.set(code, { game: game.createGame(), chat: [], sockets: new Map() });
  }
  return rooms.get(code);
}

function broadcast(code) {
  const room = getRoom(code);
  for (const [sockId, info] of room.sockets) {
    const ps = game.publicState(room.game, info.playerId);
    io.to(sockId).emit('state', ps);
  }
  // Trigger AI turn if it's now AI's turn
  setImmediate(() => maybeRunAiTurn(code));
}

function broadcastChat(code) {
  const room = getRoom(code);
  io.to(code).emit('chat', room.chat);
}

function findPlayerIndex(room, playerId) {
  return room.game.players.findIndex(p => p.id === playerId);
}

function logAction(code, msg, kind='action') {
  const room = getRoom(code);
  room.game.lastActions.push({ msg, kind, t: Date.now() });
  // Keep last 50 actions
  if (room.game.lastActions.length > 50) room.game.lastActions.shift();
}

io.on('connection', (socket) => {
  let currentRoom = null;
  let playerId = null;
  let playerName = null;

  // Client can fetch the list of available AI personality profiles
  socket.on('getProfiles', (ack) => {
    const cb = typeof ack === 'function' ? ack : null;
    // Strip the 'chat_tone' field from public payload; keep the rest for client display
    const pub = {};
    for (const [k, v] of Object.entries(profiles)) {
      pub[k] = {
        name_nl: v.name_nl,
        tagline: v.tagline,
        color: v.color,
        bias: v.bias,
      };
    }
    cb && cb({ ok: true, profiles: pub });
  });

  socket.on('create', ({ name, avatar, username, password, playerId }, ack) => {
      const cb = typeof ack === 'function' ? ack : null;
      const code = nanoid();
      const room = getRoom(code);
      // Resolve identity. Three paths:
      //   1. Authenticated: username + password
      //   2. Returning user with stored playerId matches a known account
      //   3. New guest
      let user = null;
      if (username && password) {
        const r = auth.login({ username, password });
        if (!r.ok) return cb && cb({ ok: false, error: r.error });
        user = r.user;
        playerId = user.playerId;
        avatar = user.avatar;
      } else if (playerId && typeof playerId === 'string' && playerId.startsWith('u_')) {
        // Returning authenticated user whose playerId matches a registered account
        const u = auth.getByPlayerId(playerId);
        if (u) {
          user = u;
          playerName = user.name.slice(0, 20);
          avatar = user.avatar;
        }
      }
      if (!user) {
        if (!playerId) playerId = nanoid();
        playerName = (name || 'Speler').slice(0, 20);
        avatar = avatar || 'p1.svg';
      } else {
        playerId = user.playerId;
        playerName = user.name.slice(0, 20);
        avatar = user.avatar;
      }
      const ok = game.addPlayer(room.game, playerId, playerName, avatar);
      if (!ok) {
        return cb && cb({ ok: false, error: t.roomFull });
      }
      const p = room.game.players[room.game.players.length - 1];
      p.accountId = user ? user.username : null;
      socket._avatar = avatar;
      room.sockets.set(socket.id, { playerId, name: playerName, avatar });
      socket.join(code);
      currentRoom = code;
      logAction(code, t.joinedLobby(playerName), 'join');
      cb && cb({ ok: true, code, playerId, avatar, name: playerName });
      broadcast(code);
      broadcastChat(code);
    });

    socket.on('register', ({ username, password, name, avatar }, ack) => {
      const cb = typeof ack === 'function' ? ack : null;
      if (!username) return cb && cb({ ok: false, error: 'Vul een gebruikersnaam in' });
      const r = auth.register({ username, password, name, avatar });
      if (!r.ok) return cb && cb({ ok: false, error: r.error });
      // The user now has a stable playerId. Mirror it onto the active socket so rejoin works.
      playerId = r.user.playerId;
      playerName = r.user.name;
      socket._avatar = r.user.avatar;
      cb && cb({ ok: true, user: r.user });
    });

    socket.on('login', ({ username, password }, ack) => {
      const cb = typeof ack === 'function' ? ack : null;
      if (!username || !password) return cb && cb({ ok: false, error: 'Vul alles in' });
      const r = auth.login({ username, password });
      if (!r.ok) return cb && cb({ ok: false, error: r.error });
      // Set the socket's playerId so rejoin uses the right id.
      playerId = r.user.playerId;
      playerName = r.user.name;
      socket._avatar = r.user.avatar;
      cb && cb({ ok: true, user: r.user });
    });

    socket.on('rejoin', ({ code, playerId: pid }, ack) => {
      const cb = typeof ack === 'function' ? ack : null;
      const upper = (code || '').toUpperCase();
      if (!rooms.has(upper)) {
        return cb && cb({ ok: false, error: 'Kamer niet gevonden of spel is afgelopen' });
      }
      const room = rooms.get(upper);
      const found = room.game.players.find(p => p.id === pid);
      if (!found) {
        return cb && cb({ ok: false, error: 'Speler niet meer in deze kamer' });
      }
      if (room.game.phase !== 'waiting') {
        found.connected = true;
      }
      playerId = pid;
      playerName = found.name;
      room.sockets.set(socket.id, { playerId, name: playerName, avatar: found.avatar });
      socket.join(upper);
      currentRoom = upper;
      logAction(upper, t.reconnected(playerName), 'join');
      cb && cb({ ok: true, code: upper, playerId: pid, name: found.name, avatar: found.avatar, phase: room.game.phase });
      broadcast(upper);
      broadcastChat(upper);
    });

    socket.on('whoami', (ack) => {
      const cb = typeof ack === 'function' ? ack : null;
      cb && cb({ ok: true, playerId, name: playerName, currentRoom });
    });

    socket.on('join', ({ code, name, avatar, playerId: pid }, ack) => {
      const cb = typeof ack === 'function' ? ack : null;
      code = (code || '').toUpperCase();
      if (!rooms.has(code)) {
        return cb && cb({ ok: false, error: t.roomNotFound });
      }
      const room = rooms.get(code);
      if (room.game.phase !== 'waiting') {
        // Try to find a matching seat by stable playerId (rejoin)
        const existing = pid
          ? room.game.players.find(p => p.id === pid)
          : room.game.players.find(p => p.name === (name || '').slice(0, 20));
        if (!existing) {
          return cb && cb({ ok: false, error: t.gameAlreadyStarted });
        }
        playerId = existing.id;
        playerName = existing.name;
        existing.connected = true;
        socket._avatar = existing.avatar;
        logAction(code, t.reconnected(playerName), 'join');
      } else {
        if (!pid) pid = nanoid();
        playerId = pid;
        playerName = (name || 'Speler').slice(0, 20);
        const ok = game.addPlayer(room.game, playerId, playerName, avatar);
        if (!ok) {
          return cb && cb({ ok: false, error: t.roomFull });
        }
        socket._avatar = avatar;
      }
      room.sockets.set(socket.id, { playerId, name: playerName, avatar: socket._avatar });
      socket.join(code);
      currentRoom = code;
      logAction(code, t.joinedLobby(playerName), 'join');
      cb && cb({ ok: true, code, playerId });
      broadcast(code);
      broadcastChat(code);
    });

  socket.on('start', (ack) => {
    const cb = typeof ack === 'function' ? ack : null;
    if (!currentRoom) return;
    const room = getRoom(currentRoom);
    if (room.game.players.length < 2) {
      socket.emit('error-msg', t.tooFewPlayers);
      return;
    }
    if (room.game.phase !== 'waiting') return;
    game.startGame(room.game);
    logAction(currentRoom, t.gameStarted, 'sys');
    broadcast(currentRoom);
  });

  socket.on('play', ({ cardIndex }, ack) => {
    const cb = typeof ack === 'function' ? ack : null;
    if (!currentRoom) return cb && cb({ ok: false, error: 'Geen kamer' });
    const room = getRoom(currentRoom);
    const idx = findPlayerIndex(room, playerId);
    if (idx < 0) return cb && cb({ ok: false, error: t.notInGame });
    if (room.game.phase !== 'playing') return cb && cb({ ok: false, error: t.gameNotActive });
    const check = game.canPlayCard(room.game, idx, cardIndex);
    if (!check.ok) return cb && cb(check);
    const card = room.game.players[idx].hand[cardIndex];
    const result = game.applyPlay(room.game, idx, cardIndex);
    logAction(currentRoom, t.playedCard(playerName, card), 'play');
    if (room.game.winner === null || room.game.winner === undefined) {
      if (card.r === 'JKR') {
        game.advanceTurn(room.game);
        room.game.pendingSuitPlayer = room.game.turn;
      } else if (!result.requires) {
        game.advanceTurn(room.game);
      }
    }
    cb && cb({ ok: true, requires: result.requires });
    broadcast(currentRoom);
  });

  socket.on('playDump', ({ order }, ack) => {
    const cb = typeof ack === 'function' ? ack : null;
    if (!currentRoom) return cb && cb({ ok: false, error: 'Geen kamer' });
    const room = getRoom(currentRoom);
    const idx = findPlayerIndex(room, playerId);
    if (idx < 0 || room.game.phase !== 'playing' || room.game.turn !== idx) {
      return cb && cb({ ok: false, error: t.notYourTurn });
    }
    if (!Array.isArray(order) || order.length < 1) {
      return cb && cb({ ok: false, error: 'Geen geldige 7-volgorde' });
    }
    const sevenIndex = order[0];
    const check = game.canPlayCard(room.game, idx, sevenIndex);
    if (!check.ok) return cb && cb(check);
    const result = game.applyDump(room.game, idx, sevenIndex, order);
    if (!result.ok) return cb && cb(result);
    logAction(currentRoom, t.dumped(playerName, order.length, room.game.discard[room.game.discard.length - order.length].s), 'effect');
    if (room.game.winner === null || room.game.winner === undefined) game.advanceTurn(room.game);
    cb && cb({ ok: true });
    broadcast(currentRoom);
  });

  socket.on('declareSuit', ({ suit }) => {
    if (!currentRoom) return;
    const room = getRoom(currentRoom);
    const idx = findPlayerIndex(room, playerId);
    if (idx < 0) return;
    if (!game.SUITS.includes(suit)) return;
    if (room.game.pendingSuitPlayer !== idx) {
      return socket.emit('error-msg', 'Deze speler mag de kleur niet kiezen');
    }
    const wasPlayerTurn = room.game.turn === idx;
    const jokerChoice = room.game.discard[room.game.discard.length - 1]?.r === 'JKR';
    game.declareSuit(room.game, idx, suit);
    // A J is declared by its player before the turn advances. A Joker is declared
    // by the next player, whose turn is already active.
    if (wasPlayerTurn && !jokerChoice && (room.game.winner === null || room.game.winner === undefined)) {
      game.advanceTurn(room.game);
    }
    broadcast(currentRoom);
  });

  socket.on('take', (ack) => {
    const cb = typeof ack === 'function' ? ack : null;
    if (!currentRoom) return cb && cb({ ok: false });
    const room = getRoom(currentRoom);
    const idx = findPlayerIndex(room, playerId);
    if (idx < 0) return;
    if (room.game.pendingTake <= 0) return cb && cb({ ok: false, error: t.nothingPending });
    const result = game.applyTake(room.game, idx);
    cb && cb({ ok: true, mustChoose: result.mustChoose });
    broadcast(currentRoom);
  });

  socket.on('draw', (ack) => {
    const cb = typeof ack === 'function' ? ack : null;
    if (!currentRoom) return cb && cb({ ok: false });
    const room = getRoom(currentRoom);
    const idx = findPlayerIndex(room, playerId);
    if (idx < 0) return;
    if (room.game.pendingTake > 0) return cb && cb({ ok: false, error: 'Je moet eerst de openstaande kaarten pakken' });
    const result = game.applyDraw(room.game, idx);
    if (room.game.winner === null || room.game.winner === undefined) {
      game.advanceTurn(room.game);
    }
    cb && cb({ ok: true, playable: result.playable, drawnCard: result.drawnCard });
    broadcast(currentRoom);
  });

  socket.on('playDrawn', (ack) => {
    const cb = typeof ack === 'function' ? ack : null;
    if (!currentRoom) return cb && cb({ ok: false });
    const room = getRoom(currentRoom);
    const idx = findPlayerIndex(room, playerId);
    if (idx < 0) return;
    const p = room.game.players[idx];
    if (p.hand.length === 0) return cb && cb({ ok: false, error: 'Geen kaart in hand' });
    const drawn = p.hand[p.hand.length - 1];
    const cardIndex = p.hand.length - 1;
    const check = game.canPlayCard(room.game, idx, cardIndex);
    if (!check.ok) return cb && cb(check);
    const result = game.applyPlay(room.game, idx, cardIndex);
    logAction(currentRoom, t.playedDrawn(playerName, drawn), 'play');
    if (room.game.winner === null || room.game.winner === undefined) {
      if (!result.requires) {
        game.advanceTurn(room.game);
      }
    }
    cb && cb({ ok: true, requires: result.requires });
    broadcast(currentRoom);
  });

  socket.on('skip', () => {
    if (!currentRoom) return;
    const room = getRoom(currentRoom);
    const idx = findPlayerIndex(room, playerId);
    if (idx < 0) return;
    if (room.game.turn !== idx) return;
    game.applySkip(room.game, idx);
    if (room.game.winner === null || room.game.winner === undefined) {
      game.advanceTurn(room.game);
    }
    broadcast(currentRoom);
  });

  socket.on('nextTurn', () => {
    if (!currentRoom) return;
    const room = getRoom(currentRoom);
    if (room.game.phase !== 'playing') return;
    game.advanceTurn(room.game);
    broadcast(currentRoom);
  });

  socket.on('chat', ({ msg }) => {
    if (!currentRoom) return;
    msg = (msg || '').slice(0, 500);
    if (!msg.trim()) return;
    const room = getRoom(currentRoom);
    const entry = { name: playerName, msg, t: Date.now(), ai: false, playerId, avatar: socket._avatar };
    room.chat.push(entry);
    if (room.chat.length > 200) room.chat.shift();
    // Reset AI↔AI chain depth on every human message — humans always re-open the floor
    room.aiChainDepth = 0;
    broadcastChat(currentRoom);
    maybeAiRespond(currentRoom, msg);
  });

  socket.on('addAi', async ({ name, profileKey }, ack) => {
    const cb = typeof ack === 'function' ? ack : null;
    if (!currentRoom) return cb && cb({ ok: false, error: 'Niet in een kamer' });
    const room = getRoom(currentRoom);
    if (room.game.phase !== 'waiting') return cb && cb({ ok: false, error: 'Spel al begonnen' });
    // Sanitize and dedupe the requested AI name. If none provided, pick from gender-aware pool.
    let requested = (name || '').toString().trim().slice(0, 16);
    if (!requested) {
      // Alternate gender for variety
      const useFemale = Math.random() < 0.5;
      const pool = useFemale ? AI_NAMES_F : AI_NAMES_M;
      requested = pool[Math.floor(Math.random() * pool.length)];
    }
    let aiName = requested;
    const existingNames = new Set(room.game.players.map(p => p.name.toLowerCase()));
    if (existingNames.has(aiName.toLowerCase())) {
      let n = 2;
      while (existingNames.has(`${aiName} ${n}`.toLowerCase()) && n < 99) n++;
      aiName = `${aiName} ${n}`;
    }
    // Resolve profile: explicit key, random, or fallback
    let profileKeyFinal = profileKey;
    if (!profileKeyFinal || !profiles[profileKeyFinal]) {
      const keys = Object.keys(profiles);
      profileKeyFinal = keys[Math.floor(Math.random() * keys.length)];
    }
    const profile = profiles[profileKeyFinal];
    const aiId = 'ai_' + nanoid();
    // Random avatar from the 20 portraits
    const avatarNum = 1 + Math.floor(Math.random() * 20);
    const ok = game.addPlayer(room.game, aiId, aiName, `p${avatarNum}.svg`);
    if (!ok) return cb && cb({ ok: false, error: t.roomFull });
    const aiPlayer = room.game.players[room.game.players.length - 1];
    aiPlayer.isAi = true;
    aiPlayer.profileKey = profileKeyFinal;
    aiPlayer.profileColor = profile.color;
    aiPlayer.profileTagline = profile.tagline;
    aiPlayer.gender = Math.random() < 0.5 ? 'm' : 'f';
    logAction(currentRoom, t.aiJoined(aiName), 'join');
    cb && cb({ ok: true, profileKey: profileKeyFinal, profileName: profile.name_nl });
    broadcast(currentRoom);
  });

  socket.on('removeAi', ({ aiId }, ack) => {
    const cb = typeof ack === 'function' ? ack : null;
    if (!currentRoom) return cb && cb({ ok: false });
    const room = getRoom(currentRoom);
    if (room.game.phase !== 'waiting') return cb && cb({ ok: false, error: 'Spel al begonnen' });
    const idx = room.game.players.findIndex(p => p.id === aiId && p.isAi);
    if (idx < 0) return cb && cb({ ok: false, error: 'AI niet gevonden' });
    const name = room.game.players[idx].name;
    room.game.players.splice(idx, 1);
    if (room.game.turn >= room.game.players.length) room.game.turn = 0;
    logAction(currentRoom, t.aiRemoved(name), 'leave');
    cb && cb({ ok: true });
    broadcast(currentRoom);
  });

  socket.on('leaveRoom', (ack) => {
    const cb = typeof ack === 'function' ? ack : null;
    if (!currentRoom) return cb && cb({ ok: true });
    const code = currentRoom;
    const room = rooms.get(code);
    if (room) {
      const idx = findPlayerIndex(room, playerId);
      if (idx >= 0) {
        room.game.players[idx].connected = false;
        logAction(code, t.disconnected(playerName), 'leave');
      }
      room.sockets.delete(socket.id);
      socket.leave(code);
      broadcast(code);
    }
    currentRoom = null;
    playerId = null;
    cb && cb({ ok: true });
  });

  socket.on('disconnect', () => {
    if (!currentRoom) return;
    const room = getRoom(currentRoom);
    const idx = findPlayerIndex(room, playerId);
    if (idx >= 0) {
      room.game.players[idx].connected = false;
      logAction(currentRoom, t.disconnected(playerName), 'leave');
    }
    room.sockets.delete(socket.id);
    broadcast(currentRoom);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Pesten server listening on http://localhost:${PORT}`);
});

// ---------- AI driver ----------

async function maybeAiRespond(code, lastMsg, opts = {}) {
  const room = getRoom(code);
  const aiPlayers = room.game.players.filter(p => p.isAi);
  if (aiPlayers.length === 0) return;

  // Anti-loop: max 5 AI-to-AI bounces without a human message.
  if ((room.aiChainDepth || 0) >= 5) {
    room.aiChainDepth = 0; // reset; require a human to continue
    return;
  }

  // Anti-loop: each AI can only reply once every 3 seconds
  const now = Date.now();
  room.aiLastReplyAt = room.aiLastReplyAt || {};
  const eligible = aiPlayers.filter(p => !room.aiLastReplyAt[p.id] || now - room.aiLastReplyAt[p.id] >= 3000);
  if (eligible.length === 0) return;

  // Pick a responder. If a target player name was specified (because someone @-mentioned them
  // or another AI addressed them), prefer that player. Otherwise prefer current-turn AI, else random.
  let responder;
  if (opts.targetName) {
    const want = opts.targetName.trim().toLowerCase();
    responder = eligible.find(p => p.name.toLowerCase() === want)
             || eligible.find(p => p.name.toLowerCase().includes(want) || want.includes(p.name.toLowerCase()));
  }
  if (!responder) {
    const turnPlayer = room.game.players[room.game.turn];
    responder = turnPlayer?.isAi && eligible.includes(turnPlayer)
      ? turnPlayer
      : eligible[Math.floor(Math.random() * eligible.length)];
  }

  try {
    const otherAiNames = aiPlayers.filter(p => p.id !== responder.id).map(p => p.name);
    const reply = await ai.aiChat(lastMsg, room.chat.slice(-10),
      responder.profileKey ? profiles[responder.profileKey] : null,
      otherAiNames);
    if (reply && reply.trim()) {
      const cleanReply = reply.trim();
      // Detect @-mention in the AI's reply text for potential chain reply
      const mentionMatch = cleanReply.match(/(?:^|\s)@?([A-Z][a-zA-Zà-ÿ]{1,14})(?:\b|$)/);
      const mentionedName = mentionMatch ? mentionMatch[1] : null;

      room.chat.push({ name: responder.name, msg: cleanReply, t: now, ai: true, playerId: responder.id, avatar: responder.avatar });
      if (room.chat.length > 200) room.chat.shift();
      room.aiLastReplyAt[responder.id] = now;
      broadcastChat(code);

      // Bump chain depth (this reply counts as one bounce)
      room.aiChainDepth = (room.aiChainDepth || 0) + 1;

      // ~50% chance for the mentioned AI to reply, if mentioned and different from responder
      if (mentionedName && Math.random() < 0.5) {
        const target = room.game.players.find(p =>
          p.isAi && p.id !== responder.id && p.name.toLowerCase() === mentionedName.toLowerCase());
        if (target) {
          // Schedule a delayed reply so it doesn't feel instant
          setTimeout(() => {
            maybeAiRespond(code, cleanReply, { targetName: mentionedName });
          }, 1800 + Math.floor(Math.random() * 1400));
        }
      }
    } else {
      // AI returned empty; reset chain so we don't get stuck
      room.aiChainDepth = 0;
    }
  } catch (e) {
    console.error('AI chat reply failed:', e.message);
    room.aiChainDepth = 0;
  }
}

// Track per-room AI driver to prevent concurrent runs (avoids Ollama 429s).
const aiRunning = new Set();


function currentProfile(room) {
  const p = room.game.players[room.game.turn];
  if (!p || !p.profileKey) return null;
  return profiles[p.profileKey] || null;
}

async function maybeRunAiTurn(code) {
  if (aiRunning.has(code)) return; // already in flight; the running call will re-check after delay
  aiRunning.add(code);
  const room = getRoom(code);
  let turnPlayer = null;
  try {
    if (room.game.phase !== 'playing') return;
    if (room.game.winner !== null && room.game.winner !== undefined) return;
    turnPlayer = room.game.players[room.game.turn];
    if (!turnPlayer || !turnPlayer.isAi) return;

    await new Promise(r => setTimeout(r, 800));

    // Re-check after delay (state may have changed)
    if (room.game.phase !== 'playing') return;
    if (room.game.winner !== null && room.game.winner !== undefined) return;
    turnPlayer = room.game.players[room.game.turn];
    if (!turnPlayer?.isAi) return;
  } catch (e) {
    console.error('AI driver error:', e.message);
  } finally {
    aiRunning.delete(code);
  }

  const chatCtx = room.chat.slice(-6);

  // Helper: apply AI's chosen move, advance if needed
  async function applyAiAction(decision) {
    const cur = room.game.turn;
    const curPlayer = room.game.players[cur];

    // === TAKE (pending stack) ===
    if (decision.action === 'take' && room.game.pendingTake > 0) {
      const result = game.applyTake(room.game, cur);
      logAction(code, t.took(curPlayer.name, result.taken), 'take');
      // After taking the penalty, the chain is OVER. AI can:
      // - draw one more card (decision.drawAfterTake)
      // - end their turn (skip)
      // They cannot stack another 2/Joker because the chain is done.
      if (decision.drawAfterTake) {
        game.applyDraw(room.game, cur);
        logAction(code, t.drew(curPlayer.name), 'take');
      }
      if (room.game.winner === null || room.game.winner === undefined) {
        game.advanceTurn(room.game);
      }
      return { requiresSuit: false };
    }

    // === SKIP ===
    if (decision.action === 'skip') {
      if (room.game.winner === null || room.game.winner === undefined) {
        game.advanceTurn(room.game);
      }
      return { requiresSuit: false };
    }

    // === PLAY ===
    if (decision.action === 'play' && typeof decision.index === 'number') {
      const card = room.game.players[cur].hand[decision.index];
      if (card && game.canPlayCard(room.game, cur, decision.index).ok) {
        const result = game.applyPlay(room.game, cur, decision.index);
        logAction(code, t.playedCard(curPlayer.name, card), 'play');
        if (result.requires === 'declareSuit') {
          const suit = decision.suit || pickRandomSuit(room.game, curPlayer);
          game.declareSuit(room.game, cur, suit);
          logAction(code, t.declaredSuit(curPlayer.name, suit), 'effect');
        }
        if (decision.chat) {
          room.chat.push({ name: curPlayer.name, msg: decision.chat.slice(0, 200), t: Date.now(), ai: true, playerId: curPlayer.id, avatar: curPlayer.avatar });
          if (room.chat.length > 200) room.chat.shift();
        }
        if (room.game.winner !== null && room.game.winner !== undefined) {
          logAction(code, t.wins(curPlayer.name), 'win');
        }
        if (room.game.winner === null || room.game.winner === undefined) {
          game.advanceTurn(room.game);
        }
        return { requiresSuit: false };
      }
    }

    // === DRAW (default) ===
    const dr = game.applyDraw(room.game, cur);
    logAction(code, t.drew(curPlayer.name), 'take');
    if (dr.playable && decision.action === 'playDrawn') {
      const drawnIdx = curPlayer.hand.length - 1;
      const drawn = curPlayer.hand[drawnIdx];
      const result = game.applyPlay(room.game, cur, drawnIdx);
      logAction(code, t.playedDrawn(curPlayer.name, drawn), 'play');
      if (result.requires === 'declareSuit') {
        const suit = decision.suit || pickRandomSuit(room.game, curPlayer);
        game.declareSuit(room.game, cur, suit);
        logAction(code, t.declaredSuit(curPlayer.name, suit), 'effect');
      }
    }
    if (room.game.winner === null || room.game.winner === undefined) {
      game.advanceTurn(room.game);
    }
    return { requiresSuit: false };
  }

  if (room.game.pendingTake > 0) {
    const decision = await ai.aiDecide(room.game, turnPlayer, chatCtx, currentProfile(room));
    if (decision.action === 'play' && typeof decision.index === 'number') {
      const card = turnPlayer.hand[decision.index];
      if (game.isStackable(card)) {
        // Stack - chain continues. Advance turn to the next player (the new target).
        game.applyPlay(room.game, room.game.turn, decision.index);
        logAction(code, t.stacks(turnPlayer.name, card, room.game.pendingTake), 'play');
        if (room.game.winner === null || room.game.winner === undefined) {
          game.advanceTurn(room.game);
        }
      } else {
        // Take the pending cards. Turn continues - AI must decide play/draw/skip.
        const beforePending = room.game.pendingTake;
        game.applyTake(room.game, room.game.turn);
        logAction(code, t.took(turnPlayer.name, beforePending), 'take');
        // Now AI plays/draws/skips normally (the chain ended)
        const nextDecision = await ai.aiDecide(room.game, turnPlayer, chatCtx, currentProfile(room));
        await applyAiAction(nextDecision);
      }
    } else if (decision.action === 'take') {
      const beforePending = room.game.pendingTake;
      game.applyTake(room.game, room.game.turn);
      logAction(code, t.took(turnPlayer.name, beforePending), 'take');
      const nextDecision = await ai.aiDecide(room.game, turnPlayer, chatCtx, currentProfile(room));
      await applyAiAction(nextDecision);
    } else {
      // skip - while pending stack, applySkip rejects; treat as take instead.
      if (room.game.pendingTake > 0) {
        const beforePending = room.game.pendingTake;
        game.applyTake(room.game, room.game.turn);
        logAction(code, t.took(turnPlayer.name, beforePending), 'take (geen zet, gepakt)');
        if (room.game.winner === null || room.game.winner === undefined) {
          game.advanceTurn(room.game);
        }
      } else {
        game.applySkip(room.game, room.game.turn);
        if (room.game.winner === null || room.game.winner === undefined) {
          game.advanceTurn(room.game);
        }
      }
    }
    broadcast(code);
    broadcastChat(code);
    setTimeout(() => maybeRunAiTurn(code), 200);
    return;
  }

  const decision = await ai.aiDecide(room.game, turnPlayer, chatCtx, currentProfile(room));
  await applyAiAction(decision);
  broadcast(code);
  broadcastChat(code);
  setTimeout(() => maybeRunAiTurn(code), 200);
}

function pickRandomSuit(gameState, player) {
  // pick a suit the player has the most of
  const counts = { '♣':0, '♦':0, '♥':0, '♠':0 };
  for (const c of player.hand) counts[c.s]++;
  let best = '♣', bestN = -1;
  for (const s of game.SUITS) {
    if (counts[s] > bestN) { best = s; bestN = counts[s]; }
  }
  return best;
}
