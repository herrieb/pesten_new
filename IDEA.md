# Pesten — refined rules

A Dutch card game similar to UNO, played with a standard 52-card deck plus 2 jokers.

## Setup

- 2+ players (rules below assume 2 unless stated).
- Each player is dealt **7 cards**.
- The dealer flips the top card from the deck face-up to start the discard pile.
- Effects on the dealer's flipped card apply normally.

## Card effects

| Card | Effect |
|---|---|
| **A** | Reverses play direction. With 2 players, turn simply passes to the opponent (direction irrelevant). |
| **2** | Next player draws 2. **Stackable.** |
| **7** | Dump all cards of one suit from your hand this turn (see "7-rule"). |
| **8** | Next player skips their turn. |
| **J** | Declare the next suit. Always playable. |
| **K** | Play again (extra turn). |
| **Joker** | Next player draws 5. **Stackable.** The player who took the Joker declares the next suit (whether they play, draw, or skip afterward). |

## Card play rules

- **One card per turn** — except the **7-rule**.
- A played card must match the top discard's **suit** or **rank**. Exceptions:
  - **J** and **Joker** are always playable.
  - When a Joker is on top, any card is playable (no suit/rank constraint).
- If you can't or don't want to play, **draw 1 card**. If the drawn card is playable, you may **play it or pass** (keep it, end turn).
- **Winning**: first to empty their hand wins.
- **You cannot win with an effect card** (A, 2, 7, 8, J, K, Joker). Your final card must be a plain number card (3, 4, 5, 6, 9, 10).

## Stacking (+2 / +5 chains)

- When a 2 or Joker is played, the next player has a **choice**: stack another 2 or Joker on top (passing the running total on), or take the cards.
- The amount **accumulates** down the chain.
- **Only 2s and Jokers continue the chain.** Playing any other card (A, 7, 8, J, K) means the **current player** takes the accumulated cards — the chain ends *on that player*, not on the next one.
  - Example: P1 plays 2 (+2) → P2 plays 8 → P2 takes 2 cards. P3 is skipped, P4 plays next.
  - Example: P1 plays 2 (+2) → P2 plays A → P2 takes 2 cards. Direction reverses, P4 plays next.
  - Exception: **7** ends the chain on the current player *and* dumps their matching suit; they take the +N cards first, then dump.
- **The player who must take cards has to acknowledge before they're dealt** (to avoid info leakage from timing).
- **After taking the cards**, the player chooses one of: **play a card**, **draw 1 card**, or **skip** (end turn).
  - If the take was triggered by a Joker, the player who took **declares the next suit** regardless of which option they pick.
- Example: P1 plays 2 (+2) → P2 plays Joker (+5, total 7) → P3 plays 2 (+2, total 9) → P4 plays Joker (+5, total 14) → P5 takes 14, then plays/draws/skips, and P6 plays next.

## 7-rule (suit dump)

- Playing a **7** lets you discard **all your cards of that same suit** in one turn.
- You choose the **order** in which they go on the pile.
- **Only the LAST card's effect counts.** Everything else on top is treated as a plain number/rank for effect purposes (a 2 in the middle does not add to a stack, a K in the middle does not give an extra turn, etc.).
  - Example: hand = `7♥, 3♥, 5♥, K♥, 9♥`. Play them in that order. Result: suit dumped, next player must play a heart or a 9. No extra turn, no extra draw.
- The **7 itself is still an effect card**, so it cannot be your winning card even when dumped last.
- After dumping, your turn ends (no draw).

## Ace with 2 players

- With 2 players, an Ace is effectively just a pass — turn goes to the opponent, direction ignored.

## Stock / reshuffle

- When the draw pile runs out, the discard pile (minus top card) is reshuffled back into the stock.
