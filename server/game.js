// Pesten game engine - shared between client and server.
// Encodes all rules from IDEA.md.

const SUITS = ['♣', '♦', '♥', '♠'];
const RANKS = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];

function buildDeck() {
  const deck = [];
  for (const s of SUITS) for (const r of RANKS) deck.push({ r, s });
  deck.push({ r: 'JKR', s: '🃏' });
  deck.push({ r: 'JKR', s: '🃏' });
  return deck;
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Determine number of 54-card decks to use for a given player count.
 * 1-2 players: 1 deck
 * 3-4 players: 2 decks
 * 5-6 players: 3 decks
 * Formula: ceil(players / 2) decks, minimum 1.
 */
function decksForPlayers(n) {
  return Math.max(1, Math.ceil(n / 2));
}

function buildShoe(numPlayers) {
  const n = decksForPlayers(numPlayers);
  const all = [];
  for (let i = 0; i < n; i++) all.push(...buildDeck());
  return shuffle(all);
}

function cardName(c) {
  return `${c.r}${c.s}`;
}

function isStackable(c) {
  return c.r === '2' || c.r === 'JKR';
}

function isEffect(c) {
  return ['A','2','7','8','J','K','JKR'].includes(c.r);
}

function isNumber(c) {
  return ['3','4','5','6','9','10'].includes(c.r);
}

function rankOf(c) { return c.r; }
function suitOf(c) { return c.s; }

function playable(card, top, declaredSuit) {
  if (card.r === 'JKR' || card.r === 'J') return true;
  if (top.r === 'JKR') return true;
  const eff = declaredSuit || top.s;
  return card.r === top.r || card.s === eff;
}

function createGame(numPlayers = 2) {
  const players = [];
  const discard = [];
  // shoe is built when the game starts (after we know player count).
  return {
    deck: [],                 // filled in startGame()
    players,
    discard,
    direction: 1,
    turn: 0,
    skipNext: 0,
    extraTurn: 0,
    pendingTake: 0,
    declaredSuit: null,
    winner: null,
    lastActions: [],
    phase: 'waiting',
    decksUsed: decksForPlayers(numPlayers),
  };
}

function addPlayer(game, id, name) {
  if (game.players.length >= 4) return false;
  game.players.push({
    id, name: name || `Player ${game.players.length+1}`,
    hand: [],
    connected: true,
    pendingSuit: null,
  });
  return true;
}

function startGame(game) {
  const needed = game.players.length * 7 + 1;
  let shoe = buildShoe(game.players.length);
  while (shoe.length < needed) shoe = shoe.concat(buildDeck());
  game.deck = shoe;
  for (const p of game.players) p.hand = [];
  for (let i = 0; i < 7; i++) {
    for (const p of game.players) {
      if (game.deck.length) p.hand.push(game.deck.pop());
    }
  }
  game.discard.push(game.deck.pop());
  game.phase = 'playing';
  game.turn = 0;
  game.direction = 1;
  game.skipNext = 0;
  game.extraTurn = 0;
  game.pendingTake = 0;
  game.declaredSuit = null;
  game.winner = null;
  game.lastActions.push({ msg: `Spel gestart met ${game.players.length} speler${game.players.length === 1 ? '' : 's'}, ${game.decksUsed} deck${game.decksUsed === 1 ? '' : 's'}`, kind: 'sys' });
}

function reshuffleIfEmpty(game) {
  if (game.deck.length === 0 && game.discard.length > 1) {
    const top = game.discard.pop();
    const pile = game.discard;
    game.discard = [top];
    game.deck = shuffle(pile);
  }
}

function takeFromStock(game, n) {
  const taken = [];
  for (let i = 0; i < n; i++) {
    reshuffleIfEmpty(game);
    if (game.deck.length === 0) break;
    taken.push(game.deck.pop());
  }
  return taken;
}

function publicState(game, viewerId) {
  // Strip private info: each player's hand is hidden except viewer's.
  return {
    players: game.players.map(p => ({
      id: p.id,
      name: p.name,
      connected: p.connected,
      count: p.hand.length,
      hand: p.id === viewerId ? p.hand : null,
      isAi: !!p.isAi,
      profileKey: p.profileKey || null,
      profileColor: p.profileColor || null,
      profileTagline: p.profileTagline || null,
    })),
    discardTop: game.discard[game.discard.length - 1],
    lastThree: game.discard.slice(-3),
    direction: game.direction,
    turn: game.turn,
    skipNext: game.skipNext,
    extraTurn: game.extraTurn,
    pendingTake: game.pendingTake,
    declaredSuit: game.declaredSuit,
    winner: game.winner,
    phase: game.phase,
    deckCount: game.deck.length,
    decksUsed: game.decksUsed,
    lastActions: game.lastActions.slice(-10),
    youIndex: game.players.findIndex(p => p.id === viewerId),
  };
}

// Check whether the current player can play a specific card from their hand.
function canPlayCard(game, playerIndex, cardIndex) {
  if (game.winner) return { ok: false, reason: 'Spel is afgelopen' };
  if (game.turn !== playerIndex) return { ok: false, reason: 'Niet jouw beurt' };
  const p = game.players[playerIndex];
  if (cardIndex < 0 || cardIndex >= p.hand.length) return { ok: false, reason: 'Kaartindex ongeldig' };
  const card = p.hand[cardIndex];
  const top = game.discard[game.discard.length - 1];
  if (game.pendingTake > 0) {
    if (!isStackable(card)) return { ok: false, reason: `Je moet stapelen met 2 of Joker (of ${game.pendingTake} kaarten pakken)` };
    return { ok: true };
  }
  if (!playable(card, top, game.declaredSuit)) {
    return { ok: false, reason: `Kan ${cardName(card)} niet op ${cardName(top)} spelen` };
  }
  return { ok: true };
}

// Apply a card play. cardIndex must be validated by canPlayCard first.
// Player chooses which 7-dump order to play (instead of automatic).
// Returns the effect of the LAST dumped card (everything else in the middle is plain).
function applyDump(game, playerIndex, sevenIndex, order) {
  const p = game.players[playerIndex];
  if (sevenIndex < 0 || sevenIndex >= p.hand.length) return { ok: false, reason: 'Kaartindex ongeldig' };
  const sevenCard = p.hand[sevenIndex];
  if (sevenCard.r !== '7') return { ok: false, reason: 'Eerste kaart moet een 7 zijn' };

  const suit = sevenCard.s;
  // order: array of hand indices to play. First must be the 7.
  // Validate: every index must refer to a same-suit card, and last card must NOT be an effect card.
  if (!Array.isArray(order) || order.length < 1) return { ok: false, reason: 'Geen volgorde' };
  if (order[0] !== sevenIndex) return { ok: false, reason: 'De 7 moet als eerste worden gespeeld' };
  const cards = [];
  for (const idx of order) {
    if (idx < 0 || idx >= p.hand.length) return { ok: false, reason: 'Index ongeldig in volgorde' };
    const c = p.hand[idx];
    if (c.s !== suit) return { ok: false, reason: `Kaart ${cardName(c)} is niet van ${suit}` };
    cards.push(c);
  }
  // Last card effect-check: must NOT be an effect card (must be a number card)
  const lastCard = cards[cards.length - 1];
  if (['A','2','7','8','J','K','JKR'].includes(lastCard.r)) {
    return { ok: false, reason: 'Laatste kaart moet een getal zijn (3-10)' };
  }
  // Remove the dumped cards from the hand in reverse order so indices stay valid
  const sortedIdx = [...order].sort((a, b) => b - a);
  for (const idx of sortedIdx) {
    p.hand.splice(idx, 1);
  }
  // Push to discard in play order
  for (const c of cards) game.discard.push(c);
  game.lastActions.push({
    msg: `${p.name} dumpt ${cards.length} ${suit} kaart${cards.length === 1 ? '' : 'en'} via 7${suit} (laatste: ${cardName(lastCard)})`,
    kind: 'effect',
  });
  // Win check: if hand is now empty AND last card is a number, the player wins
  if (p.hand.length === 0 && isNumber(lastCard)) {
    game.winner = playerIndex;
    game.phase = 'ended';
    return { ok: true, requires: null, winner: true };
  }
  // The 7 effect: the next player must play same-suit OR same-rank as lastCard
  return { ok: true, requires: null };
}

function applyPlay(game, playerIndex, cardIndex) {
  const p = game.players[playerIndex];
  const card = p.hand.splice(cardIndex, 1)[0];
  game.discard.push(card);
  const beforePending = game.pendingTake;
  // Note: do NOT reset pendingTake here. Stacking 2/Joker on 2/Joker must accumulate.
  // pendingTake is only reset by applyTake (when a player takes the cards).
  game.declaredSuit = null;

  // If this card is a J or Joker, set pendingSuit flag (player will choose next).
  if (card.r === 'J') {
    p.pendingSuit = 'choose'; // client must send 'declareSuit' action
  } else if (card.r === 'JKR') {
    p.pendingSuit = 'choose'; // next player chooses suit
    game.pendingTake += 5;
  } else {
    p.pendingSuit = null;
  }

  if (card.r === '2') {
    game.pendingTake += 2;
  }

  // Check win (only number cards)
  if (p.hand.length === 0) {
    if (isNumber(card)) {
      game.winner = playerIndex;
      game.phase = 'ended';
      game.lastActions.push({ msg: `${p.name} wint met ${cardName(card)}!`, kind: 'win' });
      return { requires: null };
    } else {
      game.lastActions.push({ msg: `${p.name} speelde effectkaart ${cardName(card)} — trekt 1 kaart`, kind: 'rule' });
      const drawn = takeFromStock(game, 1);
      p.hand.push(...drawn);
    }
  }

  // Effects
  if (card.r === 'A') {
    game.direction *= -1;
    game.lastActions.push({ msg: `${p.name} draaide de richting om`, kind: 'effect' });
  } else if (card.r === '7') {
    const suit = card.s;
    const same = p.hand.filter(c => c.s === suit);
    p.hand = p.hand.filter(c => c.s !== suit);
    for (const c of same) game.discard.push(c);
    const moved = same.slice();
    const len = moved.length;
    game.discard.splice(game.discard.length - len, len);
    const idx7 = game.discard.lastIndexOf(card);
    game.discard.splice(idx7, 0, ...moved);
    game.lastActions.push({ msg: `${p.name} dumpt ${same.length} ${suit} kaart${same.length === 1 ? '' : 'en'} via 7${suit}`, kind: 'effect' });
  } else if (card.r === '8') {
    game.skipNext += 1;
    game.lastActions.push({ msg: `${p.name} slaat de volgende speler over`, kind: 'effect' });
  } else if (card.r === 'K') {
    game.extraTurn += 1;
    game.lastActions.push({ msg: `${p.name} speelt nog een keer (K)`, kind: 'effect' });
  }

  if (card.r === 'J' || card.r === 'JKR') {
    return { requires: 'declareSuit', chooser: playerIndex };
  }
  return { requires: null };
}

// Declare the suit (for J or Joker-after-take).
function declareSuit(game, playerIndex, suitChar) {
  game.declaredSuit = suitChar;
  game.lastActions.push({ msg: `${game.players[playerIndex].name} koos ${suitChar}`, kind: 'effect' });
}

// Player chooses to take the pending cards.
function applyTake(game, playerIndex) {
  const p = game.players[playerIndex];
  const n = game.pendingTake;
  game.pendingTake = 0;
  const taken = takeFromStock(game, n);
  p.hand.push(...taken);
  game.lastActions.push({ msg: `${p.name} pakt ${taken.length} kaart${taken.length === 1 ? '' : 'en'}`, kind: 'take' });
  return { mustChoose: ['play', 'draw', 'skip'], taken: taken.length };
}

// Player draws a card.
function applyDraw(game, playerIndex) {
  const p = game.players[playerIndex];
  const drawn = takeFromStock(game, 1);
  if (drawn.length === 0) {
    game.lastActions.push({ msg: `${p.name} kan niet pakken (voorraad leeg)`, kind: 'take' });
    return { playable: false };
  }
  p.hand.push(...drawn);
  const c = drawn[0];
  game.lastActions.push({ msg: `${p.name} pakt ${cardName(c)}`, kind: 'take' });
  const top = game.discard[game.discard.length - 1];
  return { playable: playable(c, top, game.declaredSuit), drawnCard: c };
}

// Player skips their play.
function applySkip(game, playerIndex) {
  // Cannot skip while a pending stack is in flight — must take or play 2/Joker.
  if (game.pendingTake > 0) {
    return { ok: false, error: 'mustStackOrTake' };
  }
  const p = game.players[playerIndex];
  game.lastActions.push({ msg: `${p.name} past`, kind: 'skip' });
  return { ok: true };
}

function advanceTurn(game) {
  if (game.extraTurn > 0) {
    game.extraTurn -= 1;
    return; // same player again
  }
  let advanceBy = 1;
  if (game.skipNext > 0) {
    game.skipNext -= 1;
    advanceBy = 2; // skip one player (we'll skip them below)
  }
  const n = game.players.length;
  game.turn = ((game.turn + advanceBy * game.direction) % n + n) % n;
}

module.exports = {
  SUITS, RANKS,
  buildDeck, shuffle, buildShoe, decksForPlayers, cardName,
  isStackable, isEffect, isNumber,
  playable, rankOf, suitOf,
  createGame, addPlayer, startGame,
  reshuffleIfEmpty, takeFromStock,
  publicState,
  canPlayCard, applyPlay, declareSuit,
  applyTake, applyDraw, applySkip,
  advanceTurn,
};
