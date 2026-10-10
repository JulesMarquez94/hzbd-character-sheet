# How a card speaks

The reference for every word printed on an ability card: how much fits, where
the blank space goes, which phrases are the system's own and how each one is
spelled. `docs/text-style.md` governs punctuation everywhere; this file governs
the cards. `npm run lint:cards` enforces the measurable half of it.

Established on 2026-08-26, when Jules asked for a readability pass over the
whole codex: a character budget, blank space organized, system wording made
consistent and concise, and a reference so it stays that way.

---

## 1. The box, measured

A card is a fixed 360x640. The art plate takes its 4:3 share, the title takes a
line, and what is left holds the rules text at 0.92rem Montserrat, which comes
out to **about 45 characters a line and 13 lines a card**. A card never
scrolls: `useFitText` shrinks the type until the text fits, down to half size.
(The same pass that set this budget also took the slack out of the card's own
chrome: paragraph gap, title margins, body padding. See the note in
AbilityCard.css. Every pixel of chrome is a pixel the fitter takes off the
type.)

Shrinking is the failure mode, not the feature. At full size the text is
14.7px. At 0.9 fit it is 13.2px, the edge of comfortable at arm's length. At
0.8 it is 11.8px, which is fine print. The codex was measured card by card
against the real renderer (2026-08-26, all 409 cards) and the cost of a card's
parts came out as:

    load = prose characters
         + 30 for each paragraph break
         + 100 if the card carries an optional second half

- **Load 480 or less: the target.** Every such card prints at full size.
- **Load 600: the ceiling.** Past it a card falls under 0.9 fit and into fine
  print. `lint:cards` fails the build there.

In hand terms: a spell with a standard Multicast has room for about 300
characters of its own rules. When a card will not fit, cut words, never
mechanics; if nothing is left to cut, the design is too big for one card and
that is a design conversation, not a wording one.

The day the budget was set, every card was measured against the renderer:
nothing sits under 0.9 fit, and 349 of 409 print at full size.

## 2. Blank space

A paragraph break costs most of a line, so it has to buy clarity worth that.

- **One beat per paragraph.** The cast, the roll and its result, the rider,
  the exception. Two sentences that resolve together share a paragraph: "Make
  a {stat} Ranged Attack {roll}. On a hit, you deal ... damage."
- **The opening paragraph declares**: what you conjure, at whom, how far, how
  long. The paragraphs after it resolve what was declared.
- **A second half is one paragraph**: its price and its resolution together.
  So is an Upkeep: the toll and what missing it costs.
- Never a one-line paragraph that only restates the one before it, and never a
  single `\n` inside a paragraph. It renders as a space and reads as an
  accident in the source. (STEAL's numbered list is authored as one flowing
  paragraph on purpose: four separate paragraphs would not fit the card.)

## 3. The four marks

Unchanged from `src/lib/keywords.js`, restated because every rule below leans
on them. Exactly four things stand out from the prose:

1. **An attribute**: `{stat}`, `{physique}`, `{mind}`, `{instinct}` print the
   attribute's name in its colour.
2. **A damage type**: `{damage}` prints the holder's, `{damage:Fire}` always
   prints Fire.
3. **A keyword**: a defined term from keywords.js, lit in its own colour with
   its explanation one tap away. Never gloss one in prose.
4. **A parameter**, in `**bold**` and nothing else: **how far, at whom, for
   how long.** Never a back-reference ("the target"), never a condition
   ("until it is destroyed"), never a `[[live value]]` that is already lit.

Bold spans follow the keywords.js header exactly: a preposition that only
introduces a measurement stays plain, an "until" phrase is bolded whole.

- Range: `within **9 meters (30 feet)**`, `a **6-meter (20-foot)** radius`
- Target: `**an entity**`, `**all entities**`, `**up to 2 entities**`
- Duration: `for **10 turns (1 minute)**`, `for **1 hour**`,
  `**until your next Long Rest**`, `**until its next Turn End**`

## 4. The system sentences

One canonical spelling per mechanic. A card may say less than the template
where context already answers (a weapon card never says "you can see"), but
where it says the same thing it says it the same way.

### Attack against Defense

    Make a {stat} Melee Attack {roll} against **an entity** within
    **1 meter (3 feet)** of you.

    On a hit, you deal [[2d6 + stat]] {damage} damage.

- `a {stat}` for a Physique or Mind card, `an {stat}` for an Instinct card.
  The article is baked into the body, so it must match the card's own stat.
  A card *read* with a rider on it has the article repaired at the same moment
  the stat is settled, so a creature rolling its best attribute and a lineage's
  "cast with your highest Attribute" both read correctly. That is a repair and
  not a licence: write the right article for the card's own stat.
- Damage is `deal X {damage} damage`. Never "as", never "in": those were both
  in the codex and both said nothing.
- A spell that targets at range adds sight: `**an entity** you can see within
  **9 meters (30 feet)**`.

### Roll against a defence

    Make a {stat} Roll {roll} against its Grit. On a success, ...

- `Roll` capitalised when it is the game's noun; `roll`, `rolls`, `rolling`
  stay plain verbs.
- One named target already declared is `its Grit`, `its Reflex`. Several are
  `the Grit of **all entities** in the area`.
- The failure half, where the card has one, rides the same paragraph: "or
  half as much on a failure."

### Areas and points

    a point you can see within **15 meters (50 feet)**
    a **6-meter (20-foot)** area centered on a point you can see within ...

### Healing and Shield

    You restore [[2d6 + 2*stat]] Health.        (never "in Health")
    The target gains [[3d6 + 3*stat]] Shield.   (never "in Shield")

### Duration

Written where the thing is declared: `for **10 turns (1 minute)**`,
`for **1 hour**`, `**until your next Long Rest**`. The tracker reads durations
off these exact shapes (see `effectDuration` in combatTurn.js), so a lasting
word stays in front of a clock: "lasts for **3 turns**", "for the next
**5 turns**". A turn-end effect is `**until its next Turn End**`, not "until
the end of its turn".

### Measurements

Lowercase, plural past one, both units: `9 meters (30 feet)`,
`1 meter (3 feet)`, `1.5 meters (5 feet)`. Adjectives hyphenate both halves:
`a 6-meter (20-foot) cone`. Weights and volumes keep the same shape:
`20 kg (44 lbs)`, `2 liters (0.5 gallons)`.

## 5. The optional second half

Four names, from the designer's sheets, each meaning its own thing: Overcast,
Multicast, Blood Tithe, Upkeep. The price is **read off the prose** by
`secondHalf` in overcast.js and proved by `npm run lint:halves`, so the
opening paragraph of the half carries the whole price in these words:

- **A rider taken while casting** opens `When casting this spell, you may
  spend an additional 1 Action Point and 1 Willpower` and never names the
  card: the reader is holding it. (`When casting <Name>` was the old shape;
  "this spell" is shorter and identical on every card.) A half that fires on
  the hit opens `When this spell hits, ...`.
- **A separate spend on a spell already up** opens `While this spell is
  active, you may spend ...` or names the thing it spends: "If you have any
  active Fire Seed, ...". It must not open with "When casting".
- **Repeatable** halves say `any number of times` in the opening sentence and
  resolve with `For each time you do, ...` in the same paragraph. One-shot
  halves resolve with `If you do, ...` (never "If you do so"), or fold the
  effect into the price sentence when it is a single clause: `you may spend 2
  Action Points and 2 Willpower to affect a **6-meter (20-foot)** radius`.
- **Multicast's resolution line** is `For each time you do, target **an
  additional eligible entity**.` Nothing after "entity" unless the card
  genuinely narrows it (a range tighter than the cast, a different condition).
- **Blood Tithe** opens `When casting this spell, you may sacrifice Health
  equal to your {physique} [[physique]].` The word `sacrifice` and the phrase
  `Health equal to` are what the parser prices.
- **Upkeep** is one paragraph and the toll is imperative: `At your Turn
  Start, pay 2 Willpower to keep <what it holds>. Miss the Upkeep and the
  spell ends.` (An optional toll keeps its "may": UMBRAL FORM's hold is a
  choice, not a bill.)

## 6. Vocabulary

- **entity**, never "creature", "target entity" or "single target" in a
  declaration. The defined term is entity; "the target" is the back-reference
  once one is declared. ("A creature" survives only where it means the beast
  itself, as in Feral Curse's carnivore.)
- **this spell / this ability**, never the card's own name, except where the
  name is a persistent object the text must point at (the Fire Seed, the
  Lightmade Weapons, another card's name in a `{{link}}`).
- **Digits for every game number**: 3 turns, 2 Willpower, 6 Action Points,
  no more than 6 words. Words for numbers only in lore flavour.
- Capitalised mid-sentence, because they are the game's proper nouns: Action
  Point, Reaction Point, Willpower, Health, Shield, Supplies, Karma, Magic
  Burden, Long Rest, Short Rest, Long Rest action, Turn Start, Turn End,
  Attack Roll, Critical Hit, Martial Move, Weapon Attack, Special Weapon
  Attack, Empowered, Elevated, Burn, Bleed, Wound, Difficult Terrain, Game Master,
  and every attribute and damage type.
- Lowercase, because they read as prose: advantage, disadvantage, reaction,
  skill check, reach, touch, line of sight, and every state written as an
  adjective: rooted, stunned, poisoned, blinded, constrained, frightened,
  grappled, prone, asleep, unconscious, marked, interrupted, dying.
- **eligible** is the word for "meets this card's own targeting rules": an
  additional eligible entity.

## 7. What never appears on a card

- The rank that granted it ("At Rank 2 you learn this"): the rank is the tag.
  What survives is pool access ("At Rank 2, you can learn Adept Martial
  Moves") and the rank as a number in a formula.
- A gloss on a defined term ("advantage (roll twice...)"): the term carries
  its own explanation. If it does not, add it to keywords.js.
- A pre-computed number a token should carry, a hand-written banner, an em
  dash, an Oxford comma.
- A note to the developer. Rulings live in code comments and data/README.md.

## 8. The checker

`npm run lint:cards` (scripts/lint-cards.mjs) walks every card in the registry
plus the starter deck and fails on:

- a body over the 600 load ceiling (and lists everything over the 480 target
  with `--list`)
- `Meter (`, `Feet)` capitalised measurements
- `in {damage}`, `as {damage}`, `in Health`, `in Shield`
- `If you do so`
- a second half that opens by naming its own card
- `long rest` or `short rest` in lowercase
- a single `\n` used where a paragraph break was meant
- `a {stat}` on an Instinct card or `an {stat}` on a Physique or Mind card:
  the article is baked into the body, so it has to match the card's own stat.
  `castArticles` repairs it for a card read with a rider; this rule still holds
  the source to what the card itself prints

It measures a static approximation of the fit. The renderer's own word is
taken card by card in the browser (the harness lives in this file's history);
the two agreed on every card the day the budget was set.
