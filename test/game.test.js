const test = require('node:test');
const assert = require('node:assert/strict');
const game = require('../server/game');

function card(r, s = '♥') { return { r, s }; }

test('7-dump accepts every card of the suit in the requested order', () => {
  const g = game.createGame(2);
  game.addPlayer(g, 'p1', 'One', 'p1.svg');
  game.addPlayer(g, 'p2', 'Two', 'p2.svg');
  g.players[0].hand = [card('7'), card('3'), card('K'), card('9')];
  g.discard = [card('4', '♣')];
  const result = game.applyDump(g, 0, 0, [0, 2, 1, 3]);
  assert.equal(result.ok, true);
  assert.equal(g.players[0].hand.length, 0);
  assert.deepEqual(g.discard.slice(-4).map(c => c.r), ['7', 'K', '3', '9']);
  assert.equal(g.winner, 0);
});

test('7-dump rejects duplicate or incomplete card orders', () => {
  const g = game.createGame(2);
  game.addPlayer(g, 'p1', 'One', 'p1.svg');
  game.addPlayer(g, 'p2', 'Two', 'p2.svg');
  g.players[0].hand = [card('7'), card('3'), card('9')];
  assert.equal(game.applyDump(g, 0, 0, [0, 0, 1]).ok, false);
  assert.equal(game.applyDump(g, 0, 0, [0, 1]).ok, false);
});

test('public state exposes the player who must choose a Joker suit', () => {
  const g = game.createGame(2);
  game.addPlayer(g, 'p1', 'One', 'p1.svg');
  game.addPlayer(g, 'p2', 'Two', 'p2.svg');
  g.pendingSuitPlayer = 1;
  assert.equal(game.publicState(g, 'p1').pendingSuitPlayer, 1);
});
