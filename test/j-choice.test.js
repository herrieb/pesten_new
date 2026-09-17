const test = require('node:test');
const assert = require('node:assert/strict');
const game = require('../server/game');

test('playing a J marks that same player as suit chooser', () => {
  const g = game.createGame(2);
  game.addPlayer(g, 'p1', 'One', 'p1.svg');
  game.addPlayer(g, 'p2', 'Two', 'p2.svg');
  g.players[0].hand = [{ r: 'J', s: '♥' }];
  g.discard = [{ r: '4', s: '♣' }];
  const result = game.applyPlay(g, 0, 0);
  assert.equal(result.requires, 'declareSuit');
  assert.equal(g.pendingSuitPlayer, 0);
});
