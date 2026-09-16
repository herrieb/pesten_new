"""
Pesten - terminal game driver.
State is persisted in a JSON file so the model can keep it between turns.
"""
import json, random, os, sys

STATE_FILE = os.path.join(os.path.dirname(__file__), "state.json")

SUITS = ['♣', '♦', '♥', '♠']
RANKS = ['2','3','4','5','6','7','8','9','10','J','Q','K','A']

def build_deck():
    deck = [(r,s) for s in SUITS for r in RANKS]
    deck += [('JKR','🃏'), ('JKR','🃏')]
    return deck

def shuffle_deck(d):
    random.shuffle(d)
    return d

def card_name(card):
    r,s = card
    return f"{r}{s}"

def is_stackable(card):
    r,_ = card
    return r in ('2','JKR')

def is_effect(card):
    r,_ = card
    return r in ('A','2','7','8','J','K','JKR')

def is_number(card):
    r,_ = card
    return r in ('3','4','5','6','9','10')

def playable(card, top, declared_suit=None):
    """Can this card legally be played on top, given the declared_suit (after a J/Joker)?"""
    r,s = card
    if r == 'JKR':
        return True
    if r == 'J':
        return True
    tr,ts = top
    # Joker on top means anything is playable (no suit/rank constraint).
    if tr == 'JKR':
        return True
    effective = declared_suit if declared_suit else ts
    return r == tr or s == effective

def suit_of(card):
    r,s = card
    return s

def rank_of(card):
    r,s = card
    return r

def new_game(you_starts=True):
    deck = shuffle_deck(build_deck())
    you = [deck.pop() for _ in range(7)]
    me  = [deck.pop() for _ in range(7)]
    # First discard card is drawn from the deck on turn 1 (no effect applies on the draw)
    discard = [deck.pop()]
    # strip any effect from the drawn top - if it's a stackable we treat it as inert (no pending),
    # if it's an effect we still let it apply at end of reveal (simplest: keep effects live)
    state = {
        "deck": deck,
        "you": you,
        "me": me,
        "discard": discard,        # list of cards in play order
        "pending_take": 0,         # accumulated cards owed to next player to take
        "direction": 1,            # +1 clockwise, -1 counter
        "turn": "you" if you_starts else "me",
        "skip_next": 0,            # number of players to skip
        "you_started": you_starts,
        "winner": None,
        "log": [],
    }
    return state

def save_state(state):
    with open(STATE_FILE, "w") as f:
        json.dump(state, f)

def load_state():
    with open(STATE_FILE) as f:
        return json.load(f)

def fmt_hand(hand):
    return [card_name(c) for c in hand]

def show(state, hide_opponent=False):
    print("\n=== PESTEN ===")
    print(f"Direction: {'→' if state['direction']==1 else '←'}   Stock: {len(state['deck'])}")
    top = state["discard"][-1]
    last3 = state["discard"][-3:]
    print(f"Last 3 played: {' | '.join(card_name(c) for c in last3)}")
    print(f"Top: {card_name(top)}")
    if state["pending_take"] > 0 and not hide_opponent:
        print(f"PENDING: {state['pending_take']} cards owed (must be taken or stacked)")
    print(f"\nOpponent has {len(state['me'])} cards.")
    print(f"Your hand ({len(state['you'])}):")
    for i,c in enumerate(state['you']):
        print(f"  {i+1}. {card_name(c)}")
    print(f"\n> {state['turn'].upper()}'s turn")

def legal_plays(hand, top):
    return [i for i,c in enumerate(hand) if playable(c, top)]

def resolve_effect_after_play(state, card, played_by):
    """Apply the effect of the LAST card played. Returns updated state and a log message."""
    r,s = card
    log = []
    if r == 'A':
        state["direction"] *= -1
        log.append("Direction reversed.")
        if len(state["you"])+len(state["me"]) == 0:
            pass
        # With 2 players we treat Ace as just a pass (turn goes to the other player)
        # i.e. we already advanced direction, but in 2-player the order is symmetric so it ends up at the other.
    elif r == '2':
        # add to pending - but only if NOT followed by another stackable in this same play turn (handled by stacking loop)
        pass
    elif r == '7':
        # dump all cards of the chosen suit from current player's hand
        suit = s
        if played_by == 'you':
            same = [c for c in state["you"] if c[1]==suit and c != card]
            state["you"] = [c for c in state["you"] if not (c[1]==suit)]
            for c in same:
                state["discard"].append(c)
            log.append(f"You dumped {len(same)} {suit} card(s).")
        else:
            same = [c for c in state["me"] if c[1]==suit and c != card]
            state["me"] = [c for c in state["me"] if not (c[1]==suit)]
            for c in same:
                state["discard"].append(c)
            log.append(f"Opponent dumped {len(same)} {suit} card(s).")
    elif r == '8':
        state["skip_next"] += 1
        log.append("Next player skipped.")
    elif r == 'J':
        # ask the player to declare a suit
        if played_by == 'you':
            print("You played J. Choose the next suit:")
            for i,suit in enumerate(SUITS):
                print(f"  {i+1}. {suit}")
            choice = input("> ")
            try:
                idx = int(choice)-1
                declared = SUITS[idx]
            except:
                declared = SUITS[0]
            state["declared_suit"] = declared
            log.append(f"You declared {declared}.")
        else:
            # opponent picks
            # simple heuristic: pick a suit they have most of
            counts = {s:0 for s in SUITS}
            for c in state["me"]:
                counts[c[1]] += 1
            declared = max(counts, key=counts.get)
            state["declared_suit"] = declared
            log.append(f"Opponent declared {declared}.")
    elif r == 'K':
        state["extra_turn"] = (state.get("extra_turn",0) + 1)
        log.append(f"{played_by} plays again.")
    elif r == 'JKR':
        # next player draws 5 unless they stack; also opponent (the one who takes after) chooses suit
        # We add +5 to pending_take; the player who takes and then plays gets to declare.
        pass
    return state, log

def opponent_turn(state):
    """Opponent plays one turn: stack/take decision, then a normal play or draw."""
    hand = state["me"]
    top = state["discard"][-1]
    declared = state.get("declared_suit")
    msgs = []
    # if pending > 0, must stack or take
    if state["pending_take"] > 0:
        stack_idx = next((i for i,c in enumerate(hand) if is_stackable(c)), None)
        if stack_idx is not None:
            c = hand[stack_idx]
            state["me"].pop(stack_idx)
            state["discard"].append(c)
            if c[0] == '2':
                state["pending_take"] += 2
                msgs.append(f"Opponent stacks +2 (pending now {state['pending_take']}).")
            else:
                state["pending_take"] += 5
                msgs.append(f"Opponent stacks Joker (pending now {state['pending_take']}).")
            return ("stack", msgs)
        else:
            # must take
            take = min(state["pending_take"], len(state["deck"]))
            taken = []
            for _ in range(take):
                if state["deck"]:
                    taken.append(state["deck"].pop())
                else:
                    if len(state["discard"]) > 1:
                        topc = state["discard"].pop()
                        reshuffle = state["discard"]
                        state["discard"] = [topc]
                        random.shuffle(reshuffle)
                        state["deck"] = reshuffle
                        if state["deck"]:
                            taken.append(state["deck"].pop())
            state["me"].extend(taken)
            state["pending_take"] = 0
            msgs.append(f"Opponent takes {len(taken)} cards.")
            # After taking, opponent's turn CONTINUES - they must play a card or draw.
            # Continue to normal-play section.
    # Normal play section
    legal = legal_plays(hand, top)
    # Filter by declared suit if there is one
    def playable_with_declared(c):
        if not playable(c, top, declared):
            return False
        if declared and c[0] not in ('JKR','J') and c[1] != declared and rank_of(c) != rank_of(top):
            return False
        return True
    legal = [i for i in legal if playable_with_declared(hand[i])]
    if legal:
        non_effect = [i for i in legal if not is_effect(hand[i])]
        idx = non_effect[0] if non_effect else legal[0]
        c = hand[idx]
        state["me"].pop(idx)
        state["discard"].append(c)
        state["declared_suit"] = None
        if c[0] == '2':
            state["pending_take"] += 2
        elif c[0] == 'JKR':
            state["pending_take"] += 5
        state, logs = resolve_effect_after_play(state, c, "me")
        msgs.extend([f"Opponent plays {card_name(c)}."] + logs)
        return ("play", msgs)
    # draw
    if state["deck"]:
        c = state["deck"].pop()
        state["me"].append(c)
        msgs.append(f"Opponent draws: {card_name(c)}.")
        # Drawn card playable?
        if playable(c, top, declared):
            state["me"].pop()
            state["discard"].append(c)
            state["declared_suit"] = None
            if c[0] == '2':
                state["pending_take"] += 2
            elif c[0] == 'JKR':
                state["pending_take"] += 5
            state, logs = resolve_effect_after_play(state, c, "me")
            msgs.extend([f"Opponent plays drawn {card_name(c)}."] + logs)
        return ("draw_or_play", msgs)
    else:
        if len(state["discard"]) > 1:
            topc = state["discard"].pop()
            reshuffle = state["discard"]
            state["discard"] = [topc]
            random.shuffle(reshuffle)
            state["deck"] = reshuffle
            return opponent_turn(state)
        msgs.append("Opponent can't draw (empty stock).")
        return ("draw", msgs)

def apply_pending_on_turn_start(state):
    """When a player's turn begins, if there's a pending_take, they must stack or take."""
    # already handled in opponent_turn and in human driver
    pass

def advance_turn(state):
    """Move to the next player's turn respecting direction and skips/extras."""
    # if extra turn queued, same player goes again
    if state.get("extra_turn", 0) > 0:
        state["extra_turn"] -= 1
        return
    if state["skip_next"] > 0:
        state["skip_next"] -= 1
        # skip one player
        state["turn"] = "me" if state["turn"] == "you" else "you"
        return
    state["turn"] = "me" if state["turn"] == "you" else "you"

def check_winner(state):
    if len(state["you"]) == 0:
        return "you"
    if len(state["me"]) == 0:
        return "me"
    return None

# ----- CLI -----

def cmd_new(args):
    state = new_game(you_starts=True)
    save_state(state)
    show(state)
    print("\n(Your move: type a number, or 'draw')")

def cmd_show(args):
    state = load_state()
    show(state)

def cmd_hand(args):
    state = load_state()
    print("Your hand:")
    for i,c in enumerate(state["you"]):
        print(f"  {i+1}. {card_name(c)}")

def cmd_legal(args):
    state = load_state()
    top = state["discard"][-1]
    legal = legal_plays(state["you"], top)
    print("Legal plays (1-indexed):", [i+1 for i in legal])
    for i in legal:
        print(f"  {i+1}. {card_name(state['you'][i])}")

def cmd_play(args):
    state = load_state()
    if state["turn"] != "you":
        print("Not your turn.")
        return
    if state["winner"]:
        print(f"Game over. Winner: {state['winner']}")
        return
    if not args:
        print("Usage: play <hand-index>")
        return
    try:
        idx = int(args[0]) - 1
    except:
        print("Bad index.")
        return
    if idx < 0 or idx >= len(state["you"]):
        print("Out of range.")
        return
    card = state["you"][idx]
    top = state["discard"][-1]
    declared = state.get("declared_suit")
    # If pending take, must play stackable
    if state["pending_take"] > 0:
        if not is_stackable(card):
            print(f"You must stack with a 2 or Joker (or take {state['pending_take']} with 'take').")
            return
    else:
        if not playable(card, top) and state.get("declared_suit") is None:
            print(f"You can't play {card_name(card)} on {card_name(top)}.")
            return
        if not playable(card, top) and state.get("declared_suit"):
            # declared suit overrides top suit
            r,s = card
            tr,ts = top
            if r != 'JKR' and r != 'J' and r != tr and s != state["declared_suit"]:
                print(f"You can't play {card_name(card)} (declared suit is {state['declared_suit']}, top is {card_name(top)}).")
                return
    # play it
    state["you"].pop(idx)
    state["discard"].append(card)
    # clear declared suit since a card was played
    state["declared_suit"] = None
    # handle stacking
    if card[0] == '2':
        state["pending_take"] += 2
    elif card[0] == 'JKR':
        state["pending_take"] += 5
    # resolve effect (A/7/8/J/K)
    state, logs = resolve_effect_after_play(state, card, "you")
    for l in logs:
        print(l)
    # check winner immediately (hand empty after play)
    w = check_winner(state)
    if w:
        state["winner"] = w
        save_state(state)
        print(f"\n*** {w.upper()} WINS! ***")
        return
    # if K, same player again - skip advance
    if state.get("extra_turn",0) > 0:
        state["extra_turn"] -= 1
        save_state(state)
        show(state)
        print("\nPlay again (K).")
        return
    # advance to opponent
    advance_turn(state)
    save_state(state)
    show(state)
    # if it's opponent's turn, run it
    if state["turn"] == "me":
        run_opponent_loop(state)

def run_opponent_loop(state):
    """Run the opponent's turn(s) until it's your turn again or game ends."""
    # In 2-player mode, with the take-doesn't-end-turn rule, after opponent's turn
    # ends normally, it should become your turn. The opponent may chain (stack a
    # 2/Joker) which hands control back to you immediately.
    while state["turn"] == "me" and not state["winner"]:
        action, msgs = opponent_turn(state)
        for m in msgs:
            print(m)
        w = check_winner(state)
        if w:
            state["winner"] = w
            save_state(state)
            print(f"\n*** {w.upper()} WINS! ***")
            return
        if action == "stack":
            # Opponent just stacked - chain continues, hand control back to you.
            state["turn"] = "you"
            save_state(state)
            show(state)
            if state.get("pending_take", 0) > 0:
                print(f"\n*** Opponent stacked. You owe {state['pending_take']} cards, or stack. ***")
            return
        elif action == "play":
            top = state["discard"][-1]
            if top[0] in ('2','JKR'):
                # Opponent just played a 2/Joker without a pending pre-existing stack
                # (so they played normally and the next pending comes from this play).
                # Actually, opponent_turn already added to pending if 2/Joker. So this means
                # a NEW chain was started by opponent, handing control to you.
                state["turn"] = "you"
                save_state(state)
                show(state)
                if state.get("pending_take", 0) > 0:
                    print(f"\n*** Opponent started/stacked a chain. You owe {state['pending_take']} cards, or stack. ***")
                return
            else:
                # non-stackable play - opponent's turn ends.
                advance_turn(state)
                save_state(state)
                if state["turn"] == "me":
                    continue
                else:
                    show(state)
                    return
        elif action == "draw_or_play":
            # Opponent drew (and maybe played drawn). Turn ends.
            advance_turn(state)
            save_state(state)
            if state["turn"] == "me":
                continue
            else:
                show(state)
                return
        elif action == "draw":
            advance_turn(state)
            save_state(state)
            if state["turn"] == "me":
                continue
            else:
                show(state)
                return

def cmd_take(args):
    state = load_state()
    if state["turn"] != "you":
        print("Not your turn.")
        return
    if state["pending_take"] <= 0:
        print("Nothing pending.")
        return
    take = state["pending_take"]
    taken = []
    for _ in range(take):
        if state["deck"]:
            taken.append(state["deck"].pop())
        else:
            if len(state["discard"]) > 1:
                topc = state["discard"].pop()
                reshuffle = state["discard"]
                state["discard"] = [topc]
                random.shuffle(reshuffle)
                state["deck"] = reshuffle
            if state["deck"]:
                taken.append(state["deck"].pop())
            else:
                break
    state["you"].extend(taken)
    print(f"You take {len(taken)} cards.")
    state["pending_take"] = 0
    state["declared_suit"] = None
    # After taking, the player can play, draw, or SKIP (end turn).
    # If the top is a Joker, the player who took MUST choose a suit regardless.
    top_after_take = state["discard"][-1]
    if top_after_take[0] == 'JKR':
        print("You took a Joker. Choose the next suit:")
        for i, suit in enumerate(SUITS):
            print(f"  {i+1}. {suit}")
        try:
            suit_choice = input("> ").strip()
            idx = int(suit_choice) - 1
            declared = SUITS[idx]
        except (EOFError, ValueError, IndexError):
            declared = SUITS[0]
        state["declared_suit"] = declared
        print(f"You declared {declared}.")
    print("Play a card, draw, or skip? (play/draw/skip)")
    try:
        choice = input("> ").strip().lower()
    except EOFError:
        choice = "skip"
    if choice in ("play","p"):
        # Let player pick a card from their hand
        idx_input = input("Which card? (1-N) > ").strip()
        try:
            idx = int(idx_input) - 1
        except:
            idx = -1
        if idx < 0 or idx >= len(state["you"]):
            print("Bad index, skipping turn.")
            advance_turn(state)
        else:
            c = state["you"][idx]
            top = state["discard"][-1]
            if not playable(c, top):
                print(f"Can't play {card_name(c)}. Skipping turn.")
                advance_turn(state)
            else:
                state["you"].pop(idx)
                state["discard"].append(c)
                if c[0] == '2':
                    state["pending_take"] += 2
                elif c[0] == 'JKR':
                    state["pending_take"] += 5
                state, logs = resolve_effect_after_play(state, c, "you")
                for l in logs:
                    print(l)
                w = check_winner(state)
                if w:
                    state["winner"] = w
                    save_state(state)
                    print(f"\n*** {w.upper()} WINS! ***")
                    return
                if state.get("extra_turn",0) > 0:
                    state["extra_turn"] -= 1
                    save_state(state)
                    show(state)
                    print("\nPlay again (K).")
                    return
                advance_turn(state)
    elif choice in ("draw","d"):
        if state["deck"]:
            c = state["deck"].pop()
            state["you"].append(c)
            print(f"You draw: {card_name(c)}")
        advance_turn(state)
    else:
        # skip
        advance_turn(state)
    save_state(state)
    show(state)
    if state["turn"] == "me":
        run_opponent_loop(state)

def cmd_draw(args):
    state = load_state()
    if state["turn"] != "you":
        print("Not your turn.")
        return
    if state["pending_take"] > 0:
        print(f"You must take the pending {state['pending_take']} cards with 'take' (or stack).")
        return
    c = None
    if state["deck"]:
        c = state["deck"].pop()
        state["you"].append(c)
        print(f"You draw: {card_name(c)}")
    else:
        if len(state["discard"]) > 1:
            topc = state["discard"].pop()
            reshuffle = state["discard"]
            state["discard"] = [topc]
            random.shuffle(reshuffle)
            state["deck"] = reshuffle
            c = state["deck"].pop()
            state["you"].append(c)
            print(f"Stock reshuffled. You draw: {card_name(c)}")
        else:
            print("Stock empty and nothing to reshuffle.")
            return
    top = state["discard"][-1]
    if playable(c, top, state.get("declared_suit")):
        # Player's choice: play the drawn card or pass (keep it, end turn).
        print(f"You drew {card_name(c)} which is playable on {card_name(top)}.")
        # Allow passing the choice as an argument: 'draw y' to play, 'draw n' to pass.
        play_choice = None
        if args:
            a = args[0].strip().lower()
            if a in ("y","yes","play","p"):
                play_choice = "y"
            elif a in ("n","no","pass"):
                play_choice = "n"
        if play_choice is None:
            print("Play it? (y/n)")
            try:
                play_choice = input("> ").strip().lower()
            except EOFError:
                play_choice = "n"
        if play_choice not in ("y","yes","play","p"):
            # Keep the card; turn ends.
            save_state(state)  # persist the drawn card even if we pass
            advance_turn(state)
            save_state(state)
            show(state)
            if state["turn"] == "me":
                run_opponent_loop(state)
            return
        # Play the drawn card.
        state["you"].pop()  # remove the just-added card
        state["discard"].append(c)
        state["declared_suit"] = None
        if c[0] == '2':
            state["pending_take"] += 2
        elif c[0] == 'JKR':
            state["pending_take"] += 5
        state, logs = resolve_effect_after_play(state, c, "you")
        for l in logs:
            print(l)
        w = check_winner(state)
        if w:
            state["winner"] = w
            save_state(state)
            print(f"\n*** {w.upper()} WINS! ***")
            return
        if state.get("extra_turn",0) > 0:
            state["extra_turn"] -= 1
            save_state(state)
            show(state)
            print("\nPlay again (K).")
            return
        advance_turn(state)
        save_state(state)
        show(state)
        if state["turn"] == "me":
            run_opponent_loop(state)
        return
    # Not playable - turn ends.
    advance_turn(state)
    save_state(state)
    show(state)
    if state["turn"] == "me":
        run_opponent_loop(state)

def cmd_state(args):
    state = load_state()
    # debug
    print(json.dumps({
        "deck_size": len(state["deck"]),
        "your_hand": fmt_hand(state["you"]),
        "opponent_hand_size": len(state["me"]),
        "discard_top3": [card_name(c) for c in state["discard"][-3:]],
        "pending": state["pending_take"],
        "direction": state["direction"],
        "turn": state["turn"],
        "declared_suit": state.get("declared_suit"),
        "skip_next": state["skip_next"],
        "extra_turn": state.get("extra_turn", 0),
        "winner": state["winner"],
    }, indent=2))

CMDS = {
    "new": cmd_new,
    "show": cmd_show,
    "hand": cmd_hand,
    "legal": cmd_legal,
    "play": cmd_play,
    "take": cmd_take,
    "draw": cmd_draw,
    "state": cmd_state,
}

def main():
    if len(sys.argv) < 2:
        print("Commands:", ", ".join(CMDS.keys()))
        return
    cmd = sys.argv[1]
    args = sys.argv[2:]
    if cmd in CMDS:
        CMDS[cmd](args)
    else:
        print("Unknown command.")

if __name__ == "__main__":
    main()
