// Deck refill + reshuffle rules
// Run with: node --test server/__tests__/test_refill.js

const { test } = require('node:test');
const assert = require('node:assert/strict');
const game = require('../game');

function makePlayingGame(topCard) {
  const g = game.createGame(2);
  game.addPlayer(g, 'p1', 'P1');
  game.addPlayer(g, 'p2', 'P2');
  g.phase = 'playing';
  if (topCard) g.discard = [topCard];
  else g.discard = [{ r: '5', s: '♠' }];
  g.turn = 0;
  return g;
}

test('reshuffleIfEmpty: returns when stock still has cards', () => {
  const g = makePlayingGame({ r: '5', s: '♠' });
  g.deck = [{ r: '7', s: '♦' }];
  g.discard = [{ r: '5', s: '♠' }, { r: '3', s: '♠' }];
  game.reshuffleIfEmpty(g);
  assert.equal(g.deck.length, 1, 'stock unchanged');
  assert.equal(g.discard.length, 2, 'discard unchanged');
});

test('reshuffleIfEmpty: keeps the TOP card (last in array), reshuffles the rest', () => {
  // discard is chronological: [bottom, ..., top]. Last element = current top.
  const g = makePlayingGame({ r: '5', s: '♠' });
  g.deck = [];
  g.discard = [{ r: '3', s: '♠' }, { r: '9', s: '♦' }, { r: 'Q', s: '♣' }, { r: '5', s: '♠' }];
  game.reshuffleIfEmpty(g);
  assert.equal(g.discard.length, 1);
  assert.equal(g.discard[0].r, '5', 'top card preserved');
  assert.equal(g.deck.length, 3);
});

test('takeFromStock: draws multiple cards and reshuffles when needed', () => {
  const g = makePlayingGame({ r: '5', s: '♠' });
  g.deck = [];
  g.discard = [{ r: '5', s: '♠' }, { r: '3', s: '♠' }, { r: '9', s: '♦' }, { r: 'Q', s: '♣' }];
  const taken = game.takeFromStock(g, 3);
  assert.equal(taken.length, 3, 'Should have drawn 3 cards');
});

test('takeFromStock: longer draw triggers multiple reshuffles if needed', () => {
  // Stock empty, 4 cards in discard. Need 14. After first reshuffle, deck has 3.
  // We need to add a new full deck to fulfill the rest.
  const g = makePlayingGame({ r: '5', s: '♠' });
  g.deck = [];
  g.discard = [{ r: '5', s: '♠' }, { r: '3', s: '♠' }, { r: '9', s: '♦' }, { r: 'Q', s: '♣' }];
  const taken = game.takeFromStock(g, 14);
  // Buggy: only 3 taken currently. After fix: should get all 14 (3 from reshuffle + 11 from new deck).
  assert.equal(taken.length, 14, `Should have drawn 14 cards (got ${taken.length})`);
});

test('takeFromStock: emits refill event when it had to add a new deck', () => {
  // The state should carry an event/flag that the UI can pick up to show the achievement modal.
  const g = makePlayingGame({ r: '5', s: '♠' });
  g.deck = [];
  g.discard = [{ r: '5', s: '♠' }, { r: '3', s: '♠' }, { r: '9', s: '♦' }, { r: 'Q', s: '♣' }];
  game.takeFromStock(g, 14);
  assert.ok(g.events, 'should expose events list');
  const refills = (g.events || []).filter(e => e.kind === 'refill');
  assert.ok(refills.length > 0, 'Should have emitted a refill event');
});
