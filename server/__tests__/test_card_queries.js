// Card type helpers: rankOf, suitOf, isStackable, isEffect, isNumber
// Run with: node --test server/__tests__/test_card_queries.js

const { test } = require('node:test');
const assert = require('node:assert/strict');
const game = require('../game');

test('rankOf returns the rank string', () => {
  assert.equal(game.rankOf({ r: '7', s: '♠' }), '7');
  assert.equal(game.rankOf({ r: 'JKR', s: '🃏' }), 'JKR');
});

test('suitOf returns the suit symbol', () => {
  assert.equal(game.suitOf({ r: 'A', s: '♦' }), '♦');
});

test('isStackable: 2 and Joker only', () => {
  assert.equal(game.isStackable({ r: '2', s: '♠' }), true);
  assert.equal(game.isStackable({ r: 'JKR', s: '🃏' }), true);
  assert.equal(game.isStackable({ r: 'A', s: '♠' }), false);
  assert.equal(game.isStackable({ r: '7', s: '♠' }), false);
  assert.equal(game.isStackable({ r: '10', s: '♠' }), false);
  assert.equal(game.isStackable({ r: 'J', s: '♠' }), false);
});

test('isEffect: A, 2, 7, 8, J, K, Joker', () => {
  for (const r of ['A', '2', '7', '8', 'J', 'K', 'JKR']) {
    assert.equal(game.isEffect({ r, s: '♠' }), true, `${r} should be effect`);
  }
  for (const r of ['3', '4', '5', '6', '9', '10', 'Q']) {
    assert.equal(game.isEffect({ r, s: '♠' }), false, `${r} should not be effect`);
  }
});

test('isNumber: only plain rank cards (3-10, no face cards or A)', () => {
  for (const r of ['3', '4', '5', '6', '9', '10']) {
    assert.equal(game.isNumber({ r, s: '♠' }), true, `${r} should be a number card`);
  }
  for (const r of ['A', '2', '7', '8', 'J', 'Q', 'K', 'JKR']) {
    assert.equal(game.isNumber({ r, s: '♠' }), false, `${r} should not be a number card`);
  }
});
