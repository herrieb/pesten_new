# Pesten — Online Multiplayer Card Game

A real-time multiplayer implementation of Pesten (Dutch UNO-like) with:
- Modern casino-style dark UI
- Real playing cards with face/pip/ace/joker designs (CSS-only)
- Online multiplayer via Socket.io
- AI opponent powered by Ollama cloud (MiniMax M3)
- Lobby system, room codes, live available-room updates, chat, custom rules
- Host-controlled room closing and automatic cleanup when no human players remain

## Setup

```bash
npm install
```

## Running

```bash
# Option 1: set env vars inline
OLLAMA_API_KEY=your_key OLLAMA_MODEL=minimax-m3 node server/index.js

# Option 2: use the run script (Windows)
run.bat
```

Then open **http://localhost:3000/** in your browser.

## Configuration

| Env var | Default | Notes |
|---|---|---|
| `PORT` | 3000 | HTTP port |
| `OLLAMA_API_KEY` | — | Ollama cloud API key (required for AI) |
| `OLLAMA_BASE_URL` | https://ollama.com | Ollama endpoint |
| `OLLAMA_MODEL` | minimax-m3 | Model name |

## Rules

See `IDEA.md` for the full Pesten ruleset.

## Multiplayer

- Click **Create room** to start a new table — share the 5-character code with friends
- Click **Join** with a code to enter an existing room
- Click **Play vs AI** for a quick solo game against the bot
- Add multiple AI bots to any room using the "+ Add AI opponent" button

## Game rules implemented

- 2-4 players, 1-2 decks (1 deck per 2 players)
- Effects: A (reverse), 2 (+2 stackable), 7 (suit dump), 8 (skip), J (declare suit), K (play again), Joker (+5 stackable + suit)
- Drawn card may be played or passed
- Taking from a stack: play, draw, or skip
- Winner must play a number card last
- A 7 starts a rits/dump: selected cards of the 7's suit may be played in order, cards may be omitted, and any card (including an effect/pest card) may be selected last; the last card's effect/value applies
- The 7 must always be the first card in the dump

## Room lifecycle

- The player who creates a room is its host and can close it from the waiting room.
- Closing a waiting room immediately removes it for all connected players and from the available-room list.
- **Back to lobby** removes the current player from the game. A room is automatically deleted when no connected human players remain.
- Available rooms are broadcast live to lobby clients when rooms are created, joined, started, closed, or left.

## Translations

Dutch is the source language and is maintained in separate catalogs per audited source file:

- `public/locales/nl/index.json` — static HTML, labels, buttons, modals, rules, and placeholders
- `public/locales/nl/ui.json` — UI status text, action hints, banners, errors, and AI display text
- `public/locales/nl/game-client.json` — card and avatar labels
- `server/locales/nl/messages.json` — server game messages and errors
- `server/locales/nl/profiles.json` — AI names, taglines, and chat instructions
- `public/locales/nl/manifest.json` — source-file mapping

English and Turkish catalogs must keep the same keys when they are added. Missing translations fall back to the source-language text.

## Tests

```bash
npm test
```

The test suite covers game rules, opening-card effects, 7-dumps, Joker suit selection, and Dutch locale catalog validity.

## File layout

```
pesten/
├── package.json
├── IDEA.md                 # rules spec
├── run.bat                 # windows launcher
├── server/
│   ├── index.js            # Express + Socket.io
│   ├── game.js             # game engine
│   └── ai.js               # Ollama AI integration
└── public/
    ├── index.html          # entry
    ├── css/style.css       # styles
    └── js/
        ├── game-client.js  # card renderer + socket
        └── ui.js           # UI controller
```

## Languages

The interface supports Nederlands (`nl`), English (`en`), and Türkçe (`tr`). The selected language is saved per player session and is used for AI responses. Chat messages are not translated.
