// canPlayCard: legality checks for every effect
// Run with: node --test server/__tests__/test_can_play_card.js

const { test } = require('node:test');
const assert = require('node:assert/strict');
const game = require('../game');

// Helper: build a fresh 2-player game with both players' hands set up.
function makeGame(topCard) {
  const g = game.createGame(2);
  game.addPlayer(g, 'p1', 'P1');
  game.addPlayer(g, 'p2', 'P2');
  // game starts in 'waiting' phase; flip to 'playing' for these tests
  g.phase = 'playing';
  if (topCard) g.discard = [topCard];
  g.turn = 0;
  return g;
}

test('canPlayCard: same suit, number rank = legal', () => {
  const g = makeGame({ r: '7', s: '♠' });
  g.players[0].hand = [{ r: '4', s: '♠' }];
  const res = game.canPlayCard(g, 0, 0);
  assert.equal(res.ok, true);
});

test('canPlayCard: same suit, face rank = legal', () => {
  const g = makeGame({ r: '7', s: '♠' });
  g.players[0].hand = [{ r: 'Q', s: '♠' }];
  const res = game.canPlayCard(g, 0, 0);
  assert.equal(res.ok, true);
});

test('canPlayCard: same rank = legal', () => {
  const g = makeGame({ r: '7', s: '♠' });
  g.players[0].hand = [{ r: '7', s: '♦' }];
  const res = game.canPlayCard(g, 0, 0);
  assert.equal(res.ok, true);
});

test('canPlayCard: different suit and rank = not legal', () => {
  const g = makeGame({ r: '7', s: '♠' });
  g.players[0].hand = [{ r: '9', s: '♦' }];
  const res = game.canPlayCard(g, 0, 0);
  assert.equal(res.ok, false);
});

test('canPlayCard: J always playable', () => {
  const g = makeGame({ r: '7', s: '♠' });
  g.players[0].hand = [{ r: 'J', s: '♦' }];
  const res = game.canPlayCard(g, 0, 0);
  assert.equal(res.ok, true);
});

test('canPlayCard: Joker always playable', () => {
  const g = makeGame({ r: '7', s: '♠' });
  g.players[0].hand = [{ r: 'JKR', s: '🃏' }];
  const res = game.canPlayCard(g, 0, 0);
  assert.equal(res.ok, true);
});

test('canPlayCard: 2 plays on same rank only (not always playable)', () => {
  // 2 is NOT always playable — only same rank, same suit, or when pendingTake is active.
  const g = makeGame({ r: '7', s: '♠' });
  g.players[0].hand = [{ r: '2', s: '♦' }];
  const res = game.canPlayCard(g, 0, 0);
  assert.equal(res.ok, false);
});

test('canPlayCard: 2 plays on same rank', () => {
  const g = makeGame({ r: '2', s: '♠' });
  g.players[0].hand = [{ r: '2', s: '♦' }];
  assert.equal(game.canPlayCard(g, 0, 0).ok, true);
});

test('canPlayCard: 2 plays on same suit', () => {
  const g = makeGame({ r: '7', s: '♠' });
  g.players[0].hand = [{ r: '2', s: '♠' }];
  assert.equal(game.canPlayCard(g, 0, 0).ok, true);
});

test('canPlayCard: any card legal when top is Joker (Joker-on-top rule)', () => {
  const g = makeGame({ r: 'JKR', s: '🃏' });
  g.players[0].hand = [{ r: '9', s: '♣' }];
  assert.equal(game.canPlayCard(g, 0, 0).ok, true);
});

test('canPlayCard: when pending take, only 2 or Joker legal', () => {
  const g = makeGame({ r: '7', s: '♠' });
  g.players[0].hand = [
    { r: '3', s: '♠' },  // not stackable — illegal
    { r: '2', s: '♦' },  // stackable — legal
    { r: 'JKR', s: '🃏' }, // stackable — legal
    { r: '9', s: '♣' },  // not stackable — illegal
  ];
  g.pendingTake = 5;
  assert.equal(game.canPlayCard(g, 0, 0).ok, false, '3♠ should not be legal');
  assert.equal(game.canPlayCard(g, 0, 1).ok, true, '2♦ should be legal');
  assert.equal(game.canPlayCard(g, 0, 2).ok, true, 'Joker should be legal');
  assert.equal(game.canPlayCard(g, 0, 3).ok, false, '9♣ should not be legal');
});
