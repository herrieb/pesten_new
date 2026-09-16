// Dutch translations for game messages.

function cardName(c) {
  return `${c.r}${c.s}`;
}

module.exports = {
  joinedLobby: (name) => `${name} is in de lobby`,
  gameStarted: 'Spel gestart',
  gameStartedWith: (n, decks) => `Spel gestart met ${n} speler${n === 1 ? '' : 's'}, ${decks} deck${decks === 1 ? '' : 's'}`,
  playedCard: (name, card) => `${name} speelde ${cardName(card)}`,
  playedDrawn: (name, card) => `${name} speelde de getrokken ${cardName(card)}`,
  reversed: (name) => `${name} draaide de richting om`,
  dumped: (name, n, suit) => `${name} dumpt ${n} ${suit} kaart${n === 1 ? '' : 'en'} via 7${suit}`,
  skippedNext: (name) => `${name} slaat de volgende speler over`,
  playAgain: (name) => `${name} speelt nog een keer (K)`,
  took: (name, n) => `${name} pakt ${n} kaart${n === 1 ? '' : 'en'}`,
  stacks: (name, card, pending) => `${name} stapelt ${cardName(card)} (totaal ${pending})`,
  declaredSuit: (name, suit) => `${name} koos ${suit}`,
  drew: (name) => `${name} pakt een kaart`,
  drewCard: (name, card) => `${name} pakt ${cardName(card)}`,
  skipped: (name) => `${name} past`,
  winsWith: (name, card) => `${name} wint met ${cardName(card)}!`,
  wins: (name) => `${name} wint!`,
  effectCardRule: (name, card) => `${name} speelde effectkaart ${cardName(card)} — trekt 1 kaart`,
  disconnected: (name) => `${name} weggevallen`,
  reconnected: (name) => `${name} opnieuw verbonden`,
  aiJoined: (name) => `${name} (AI) is in de lobby`,
  aiRemoved: (name) => `${name} (AI) verwijderd`,
  youJoined: (name) => `${name} is erbij gekomen`,
  tooFewPlayers: 'Minimaal 2 spelers nodig om te starten',
  gameAlreadyStarted: 'Spel al begonnen',
  roomNotFound: 'Kamer niet gevonden',
  roomFull: 'Kamer vol',
  notYourTurn: 'Niet jouw beurt',
  badCardIndex: 'Kaartindex ongeldig',
  notInGame: 'Niet in het spel',
  gameNotActive: 'Spel niet actief',
  nothingPending: 'Niets te betalen',
  mustStackOrTake: (n) => `Je moet stapelen met 2 of Joker, of ${n} kaarten pakken`,
  cantPlay: (card, top) => `Kan ${cardName(card)} niet op ${cardName(top)} spelen`,
  gameEnded: 'Spel is afgelopen',
};
