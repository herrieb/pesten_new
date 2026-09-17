const test = require('node:test');
const assert = require('node:assert/strict');
const game = require('../server/game');

test('opening Ace applies direction before selecting the first turn', () => {
  const g = game.createGame(2);
  game.addPlayer(g, 'p1', 'One', 'p1.svg');
  game.addPlayer(g, 'p2', 'Two', 'p2.svg');
  g.discard = [{ r: 'A', s: '♠' }];
  game.applyOpeningEffects(g);
  assert.equal(g.direction, -1);
  assert.equal(g.turn, 1);
});

test('opening 2 and 8 apply their effects before the first turn', () => {
  const g = game.createGame(3);
  for (let i = 0; i < 3; i++) game.addPlayer(g, `p${i}`, `P${i}`, 'p1.svg');
  g.discard = [{ r: '2', s: '♠' }];
  game.applyOpeningEffects(g);
  assert.equal(g.pendingTake, 2);
  assert.equal(g.turn, 1);

  g.discard = [{ r: '8', s: '♠' }];
  g.turn = 0;
  g.pendingTake = 0;
  game.applyOpeningEffects(g);
  assert.equal(g.turn, 2);
});

test('7-dump allows an effect card last and applies its value', () => {
  const g = game.createGame(2);
  game.addPlayer(g, 'p1', 'One', 'p1.svg');
  game.addPlayer(g, 'p2', 'Two', 'p2.svg');
  g.players[0].hand = [{ r: '7', s: '♥' }, { r: '3', s: '♥' }, { r: '2', s: '♥' }];
  g.discard = [{ r: '4', s: '♣' }];
  const result = game.applyDump(g, 0, 0, [0, 1, 2]);
  assert.equal(result.ok, true);
  assert.equal(g.pendingTake, 2);
});


test('7-dump allows a partial dump with any final card', () => {
  const g = game.createGame(2);
  game.addPlayer(g, 'p1', 'One', 'p1.svg');
  game.addPlayer(g, 'p2', 'Two', 'p2.svg');
  g.players[0].hand = [{ r: '7', s: '♥' }, { r: '3', s: '♥' }, { r: '2', s: '♥' }, { r: '8', s: '♣' }];
  g.discard = [{ r: '4', s: '♣' }];
  const result = game.applyDump(g, 0, 0, [0, 3]);
  assert.equal(result.ok, true);
  assert.equal(g.skipNext, 1);
  assert.equal(g.players[0].hand.length, 2);
});
