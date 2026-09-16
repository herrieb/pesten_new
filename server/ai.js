// AI player using Ollama cloud API.
// Set env: OLLAMA_API_KEY, OLLAMA_BASE_URL (default https://ollama.com), OLLAMA_MODEL (default minimax-m3)
// Or set AI_API_KEY, AI_BASE_URL, AI_MODEL as fallbacks.

const game = require('./game');

const API_KEY = process.env.OLLAMA_API_KEY || process.env.AI_API_KEY || '';
const BASE_URL = (process.env.OLLAMA_BASE_URL || process.env.AI_BASE_URL || 'https://ollama.com').replace(/\/+$/, '');
const MODEL = process.env.OLLAMA_MODEL || process.env.AI_MODEL || 'minimax-m3';

function systemPrompt() {
  return `Je speelt Pesten, een Nederlands kaartspel vergelijkbaar met UNO. Je bent een AI-tegenstander aan een casinotafel. Je praat met de andere spelers in het Nederlands.

# SPELREGELS
- Standaard 54-kaarten deck (52 + 2 jokers). Met 2 spelers: 1 deck. 3-4 spelers: 2 decks.
- Elke speler begint met 7 kaarten.
- Match op kleur OF rang. J en Joker zijn ALTIJD speelbaar (ongeacht de bovenste kaart).
- Als een Joker bovenop ligt: elke kaart is speelbaar (geen kleur/rang beperking).

# KAARTEFFECTEN
- A (Aas): draai de richting om. Met 2 spelers: gewoon passen.
- 2: volgende speler pakt 2. Stapelbaar.
- 7: dump al je kaarten van die kleur in één beurt. Het effect van de LAATSTE kaart telt (de 7 zelf).
- 8: sla de volgende speler over.
- J: bepaal de volgende kleur. ALTIJD speelbaar.
- K: speel nog een keer (extra beurt).
- Joker: volgende speler pakt 5. Stapelbaar. De speler die de Joker pakte bepaalt de volgende kleur (na spelen/pakken/passen).
- 2/Joker ketens accumuleren. De speler die niet (of kan niet) stapelen pakt het lopende totaal.
- ALLEEN 2'en en Jokers laten de keten doorgaan. Elke andere kaart spelen betekent dat JIJ (de huidige speler) de geaccumuleerde kaarten pakt.

# TREKKEN / PAKKEN
- Als je niet kunt of wilt spelen, pak 1 kaart.
- Als de getrokken kaart speelbaar is, mag je die spelen of bewaren (beëindig beurt).
- Na het pakken van een stapel (2/Joker) is de keten VOORBIJ. Je mag daarna alleen:
  - "drawAfterTake": true om nog 1 kaart te pakken (trekken, einde beurt)
  - OF niets (passen, einde beurt)
  Je kunt NIET nog een 2 of Joker stapelen — de keten is afgelopen.
- Als bovenop Joker ligt, bepaal je sowieso de volgende kleur.

# Winnen
- Eerste die hand leeg heeft wint. Kan NIET winnen met een effectkaart (A, 2, 7, 8, J, K, Joker). Laatste kaart moet een getal zijn (3,4,5,6,9,10).

# STRATEGIE
- Dump gevaarlijke kaarten (2, Joker) vroeg als de volgende speler waarschijnlijk niet kan stapelen.
- Probeer K op te zetten voor extra beurten.
- Gebruik J om naar een kleur te gaan waar je veel van hebt.
- Bewaar je getalkaarten voor het laatst.
- Onthul je hand niet in de chat.

# PERSOONLIJKHEID
- Je bent een zelfverzekerde, een beetje brutale casinogast. Lichte trash-talk is welkom.
- Onthul NOOIT je kaarten of strategie in chat. Praat over de SPELSITUATIE, niet je kaarten.
- Houd chatberichten onder 120 tekens, gevat en casual.
- Verontschuldig je niet voor zetten; sta ervoor.
- Nederlands is de voertaal.

# ANTWOORDFORMAAT
Geef ALLEEN geldige JSON:
{
  "action": "play" | "draw" | "skip" | "take" | "declareSuit" | "playDrawn" | "passDrawn",
  "index": <hand-index voor play, anders weglaten>,
  "suit": "<♣♦♥♠ als declareSuit, anders weglaten>",
  "playDrawn": <true als je net getrokken kaart wilt spelen>,
  "chat": "<optioneel kort chatbericht, onder 120 tekens>",
  "reasoning": "<één korte zin over je afweging>"
}`;
}

function userPrompt(state, hand, options, chatHistory) {
  const top = state.discard[state.discard.length - 1];
  const topName = game.cardName(top);
  const declared = state.declaredSuit || '';
  const directionArrow = state.direction === 1 ? '->' : '<-';
  const pending = state.pendingTake > 0 ? `PENDING: ${state.pendingTake} cards to take (you MUST stack or take)` : '';
  const myName = state.players[state.turn]?.name || 'You';

  const handStr = hand.map((c, i) => `${i}: ${game.cardName(c)}`).join(', ');
  const legalStr = options.legalPlayIndices.map(i => `${i}: ${game.cardName(hand[i])}`).join(', ') || '(none)';

  // Suit counts in hand (for strategy hint)
  const suitCounts = hand.reduce((acc, c) => { acc[c.s] = (acc[c.s]||0)+1; return acc; }, {});
  const suitSummary = Object.entries(suitCounts).map(([s,n]) => `${s}=${n}`).join(' ');

  let ctx = `# CURRENT STATE
- Top card: ${topName}${declared ? ` (declared suit: ${declared})` : ''}
- Direction: ${directionArrow}
- ${pending || 'No pending stack.'}
- Decks in play: ${state.decksUsed || 1}

# PLAYERS
${state.players.map((p,i) => `${i===state.turn?'*':''}${p.name}${p.isAi?' (AI)':''}: ${p.count} cards${p.connected===false?' [disconnected]':''}`).join('\n')}

# YOUR HAND (${myName})
${handStr}
- Suit counts: ${suitSummary}

# LEGAL MOVES
${options.legalPlayIndices.length > 0
  ? `You may play: ${legalStr}`
  : `No legal plays - you MUST draw`}
${state.pendingTake > 0
  ? `Since there's a pending stack, you MUST stack with a 2/Joker, OR take ${state.pendingTake} cards.`
  : ''}

# OPTIONS
${options.takingOptions ? `You JUST TOOK cards. Choose: ${options.takingOptions.map(o => o.toUpperCase()).join(', ')}.` : ''}
${options.mustDeclareSuit ? `You MUST DECLARE the next suit. Valid: ${game.SUITS.join(' ')}.` : ''}
${options.drawnCardPlayable ? `You drew ${game.cardName(options.drawnCard)} which IS playable. Choose: play it or pass (end turn).` : ''}

# RECENT CHAT
${options.chatHistory && options.chatHistory.length
  ? options.chatHistory.map(c => `${c.name}: ${c.msg}`).join('\n')
  : '(no chat yet)'}

DECIDE NOW. Output JSON only. Include a short chat line if it fits your persona.`;
  return ctx;
}

async function callOllama(messages) {
  const res = await fetch(`${BASE_URL}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      stream: false,
      temperature: 0.7,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Ollama API ${res.status}: ${text.slice(0, 200)}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

function tryParseJSON(s) {
  // Try direct
  try { return JSON.parse(s); } catch {}
  // Try to find JSON in text
  const m = s.match(/\{[\s\S]*\}/);
  if (m) {
    try { return JSON.parse(m[0]); } catch {}
  }
  // Try cleaning code fences
  const cleaned = s.replace(/^```json\s*/i, '').replace(/```$/, '').trim();
  try { return JSON.parse(cleaned); } catch {}
  return null;
}

function profileContext(profile) {
  if (!profile) return '';
  const b = profile.bias || {};
  const lines = [];
  lines.push('');
  lines.push(`# JOUW PERSONAGE: ${profile.name_nl}`);
  lines.push(profile.tagline);
  lines.push('');
  lines.push('## Toon');
  lines.push(profile.chat_tone);
  lines.push('');
  lines.push('## Speelstijl');
  if (b.aggression >= 0.8) lines.push('- Speel agressief. Dump gevaarlijke kaarten (2, Joker) snel. Laat de ketting groeien.');
  else if (b.aggression <= 0.4) lines.push('- Speel voorzichtig. Bewaar power-kaarten tot ze het hardst nodig zijn.');
  else lines.push('- Speel gebalanceerd. Mix aanval en verdediging.');
  if (b.play_effects_early) lines.push('- Speel effectkaarten vroeg. Liever chaos dan veiligheid.');
  else lines.push('- Bewaar 7, 8, J, K voor tactische momenten.');
  if (b.save_wildcards) lines.push('- Bewaar 2/Joker voor als een ander ze op je afvuurt.');
  else lines.push('- Gebruik 2/Joker meteen om druk te zetten.');
  if (b.emoji_chance >= 0.6) lines.push('- Veel emoji in chat.');
  else if (b.emoji_chance <= 0.3) lines.push('- Weinig tot geen emoji in chat.');
  if (b.taunt_chance >= 0.8) lines.push('- Veel trash-talk. Wees brutaal.');
  else if (b.taunt_chance >= 0.5) lines.push('- Lichte plaagstootjes zijn oké.');
  else lines.push('- Houd het vriendelijk. Weinig trash-talk.');
  return lines.join('\n');
}

async function aiDecide(gameState, aiPlayer, chatHistory, profile) {
  const hand = aiPlayer.hand;
  const top = gameState.discard[gameState.discard.length - 1];
  const legal = [];
  for (let i = 0; i < hand.length; i++) {
    if (game.playable(hand[i], top, gameState.declaredSuit)) legal.push(i);
  }

  const options = {
    legalPlayIndices: legal,
    takingOptions: null,
    mustDeclareSuit: false,
    drawnCardPlayable: false,
    chatHistory: chatHistory || [],
  };

  // Build decision context
  if (gameState.pendingTake > 0) {
    options.legalPlayIndices = hand.map((_,i) => i).filter(i => game.isStackable(hand[i]));
    options.takingOptions = ['play', 'take', 'skip'];
  }

  // Inject profile bias into system prompt + user prompt
  const profileSuffix = profile ? profileContext(profile) : '';

  const messages = [
    { role: 'system', content: systemPrompt() + profileSuffix },
    { role: 'user', content: userPrompt(gameState, hand, options, chatHistory) },
  ];

  let raw;
  try {
    raw = await callOllama(messages);
  } catch (e) {
    console.error('AI call failed:', e.message);
    // Fallback: pick first legal play or draw
    // Fallback for effect check: tolerate undefined cards (hand may have shrunk
    // while we awaited the API).
    function safeIsEffect(c) {
      return c && c.r ? game.isEffect(c) : true; // undefined treated as effect so it's skipped
    }

    if (legal.length > 0) {
      // Prefer non-effect, non-stackable
      const nonEff = legal.find(i => !safeIsEffect(hand[i]));
      const idx = nonEff !== undefined ? nonEff : legal[0];
      if (hand[idx]) {
        return { action: 'play', index: idx, chat: 'Mijn hersenen zijn even offline, ik ga random.' };
      }
    }
    return { action: 'draw' };
    }

  const parsed = tryParseJSON(raw);
  if (!parsed) {
    if (legal.length > 0 && hand[legal[0]]) return { action: 'play', index: legal[0], chat: '' };
    return { action: 'draw' };
  }
  // Validate the parsed decision before returning - hand may have changed during the API call
  if (parsed.action === 'play' && typeof parsed.index === 'number') {
    if (!hand[parsed.index] || !game.canPlayCard(gameState, gameState.turn, parsed.index).ok) {
      // Hand changed (other player did something) - fall back
      if (legal.length > 0 && hand[legal[0]]) return { action: 'play', index: legal[0], chat: '' };
      return { action: 'draw' };
    }
  }
  return parsed;
}

async function aiChat(messages, chatHistory, profile, otherAiNames) {
  const sys = `Je bent een AI-tegenstander in een potje Pesten (Nederlands kaartspel, vergelijkbaar met UNO) die casual kletst met de andere speler aan tafel.

PERSOONLIJKHEID: zelfverzekerd, een beetje brutaal, casinogast. Lichte trash-talk is prima.
CHATREGELS:
- Houd berichten onder 120 tekens. Geen essays.
- Onthul NOOIT je kaarten of je strategie.
- Praat over de SPELSITUATIE (net gemist, gelukkige draw, etc.) niet over je hand.
- Reageer op wat de ander zegt. Wees gevat.
- Als de ander trash-talks, geef het subtiel terug.
- Schrijf in het Nederlands.
- Als je DIRECT iemand anders aanspreekt, gebruik dan @Naam aan het begin van je bericht (bijv. "@Sanne gelukkige draw!"). Anders niet.
- Aanwezige andere AI-tegenstanders: ${otherAiNames && otherAiNames.length ? otherAiNames.join(', ') : 'geen'}.

${profile ? `# JOUW PERSONAGE: ${profile.name_nl}\n${profile.tagline}\n\nToon: ${profile.chat_tone}` : ''}

Recente spelcontext (voor kleur, citeer niet): je speelt nu een potje Pesten.`;
  const recent = chatHistory.slice(-10).map(c => ({ role: 'user', content: `${c.name}: ${c.msg}` }));
  recent.push({ role: 'user', content: messages });
  const msgs = [{ role: 'system', content: sys }, ...recent];
  try {
    const raw = await callOllama(msgs);
    return raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/, '').trim().slice(0, 200);
  } catch (e) {
    console.error('AI chat failed:', e.message);
    return 'hmm';
  }
}

module.exports = { aiDecide, aiChat, MODEL };
