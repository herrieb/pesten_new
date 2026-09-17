// Test suite for server/game.js logic.
// Run with: npm test

const { test } = require('node:test');
const assert = require('node:assert/strict');
const game = require('../game');

test('buildDeck: produces 54 unique cards (52 + 2 jokers)', () => {
  const deck = game.buildDeck();
  assert.equal(deck.length, 54);
  // Use object identity for uniqueness (the two jokers are separate card instances)
  const seen = new Set();
  for (const c of deck) seen.add(c);
  assert.equal(seen.size, 54, 'All 54 cards are unique instances');
  let jokers = 0;
  for (const c of deck) {
    if (c.r === 'JKR') jokers++;
    else {
      assert.ok(game.RANKS.includes(c.r), `${c.r} is a valid rank`);
      assert.ok(game.SUITS.includes(c.s), `${c.s} is a valid suit`);
    }
  }
  assert.equal(jokers, 2, 'Exactly 2 jokers in a deck');
});

test('buildShoe(1) returns 54 cards', () => {
  const shoe = game.buildShoe(1);
  assert.equal(shoe.length, 54);
});

test('buildShoe(3) returns 108 cards (2 decks)', () => {
  const shoe = game.buildShoe(3);
  assert.equal(shoe.length, 108);
});

test('decksForPlayers scales with player count', () => {
  assert.equal(game.decksForPlayers(1), 1);
  assert.equal(game.decksForPlayers(2), 1);
  assert.equal(game.decksForPlayers(3), 2);
  assert.equal(game.decksForPlayers(4), 2);
});

test('cardName renders something readable', () => {
  assert.equal(game.cardName({ r: '7', s: '♠' }), '7♠');
  assert.equal(game.cardName({ r: 'JKR', s: '🃏' }), 'Joker');
  assert.equal(game.cardName({ r: 'A', s: '♦' }), 'A♦');
});
