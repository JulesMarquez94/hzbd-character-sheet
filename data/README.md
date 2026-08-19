# Sheet drops

Where CSVs exported from Google Sheets get dropped so they can be pulled into
the game data under `src/lib/`.

## Where to drop the file

At the top level of this folder, under whatever name Google gives it. Sheets
exports as `<Workbook> - <Tab>.csv`, so these arrive as:

```
data/Spells - Primal Spells.csv
data/General Rules - Basic Abilities.csv
```

Drops are gitignored (see `data/.gitignore`), so a CSV sitting here never
reaches GitHub. Only `README.md` and `templates/` are tracked.

## What has been pulled so far

| Sheet | Pulled | Landed in |
| ----- | ------ | --------- |
| Spells · Primal Spells | 2026-08-19, 24 spells | `src/lib/weapons.js` (`SPELLS`) |
| General Rules · Basic Abilities | 2026-08-19, 10 actions | `src/lib/actions.js` (`BASIC_ACTIONS`) |
| Card art, from both Image columns | 2026-08-19, 34 pictures | `public/cards/` + `src/lib/cardArt.js` |
| Talent Set · Cauldron Keeper · Overview | 2026-08-19, 1 set | `src/lib/talents.js` (`TALENTS`) |
| Talent Set · Cauldron Keeper · Ability | 2026-08-19, 4 cards + 18 Ingredients | `src/lib/talents.js`, `src/lib/ingredients.js` |
| General Rules · Status & Terms | 2026-08-19, 26 terms | `src/lib/keywords.js` |
| Cauldron Keeper art, both tabs | 2026-08-19, 22 cards + 1 plate | `public/cards/`, `public/talents/` |

`templates/` holds the current state of both, exported back out in the sheet's
own column order. `primal-spells.csv` holds the 24 Primal spells and nothing
else: the codex also carries one Arcane spell, Containment Sphere, which no
sheet covers yet. Diff a fresh download against those to see exactly what
changed before asking for a pull.

## The Cauldron Keeper

Four tabs, pulled together on 2026-08-19. The **Ability** tab is the design and it
was transcribed rather than interpreted.

| Tab | Landed as |
| --- | --------- |
| `Overview` | the set's head in `talents.js`: `Name`, `Tags`, `Summary` and `Overview` all byte for byte |
| `Ability` | 4 set cards in `talents.js`, 18 Ingredients in `ingredients.js` |
| `Developpement Notes` | the brewing window, `src/components/sheet/BrewWindow.jsx` |
| `Status & Terms` | 26 glossary entries in `keywords.js` |

**Every Ingredient body is the sheet's own Main Effect cell with nothing but
markers inserted.** `2d6 + 2 x Instinct` became `[[2d6 + 2*stat]]` so the number
resolves against the brewer, and a damage type became `{damage:Cold}` so it prints
in its own colour. That claim is checked rather than asserted: a round trip maps
every marker back to the designer's written form and compares it to their cell,
and it passes on all 18, along with every AP, WP and tag.

### What BREW's text buys

The card is the whole rule and the code adds nothing to it. "At least 1 Essence,
exactly 1 Catalyst, and any number of Infusions" is enforced by `brews.js` and is
the literal shape of the window. "The combined Action Point and Willpower cost of
all chosen Ingredients" is summed with its working shown, less 1 Action Point per
Quicksilver and 1 for Efficient Brewing, floored at zero. Tiers open Novice at
Rank 1, Adept at 2, Master at 3.

Nothing finished is stored, because "the resulting Brew takes effect immediately".
The only thing that persists is whether the Cauldron is out, on the talent entry as
`cauldron: 'summoned'`, since BREW needs it Summoned and Bound Cauldron is what
summons it.

### Three readings that need the designer's word

1. **EFFICIENT BREWING is tagged `Adept Catalyst`** and is implemented as the Adept
   Talent, Passive. It carries no AP and no WP where every real Catalyst carries
   both, its text is about the Brew Action rather than about who a Brew reaches, and
   BREW needs exactly one Catalyst, so a Catalyst that only cut the cost would leave
   a Brew with nothing to affect. Reading it as the Adept Talent also completes the
   rank structure at 2/1/1. Its tags were corrected to match Improved Recipes.
2. **VOLCANIC SHARD is tagged an Infusion** but deals damage like an Essence and
   costs 2 AP where every other Infusion costs 0. Left exactly as tagged.
3. **Duplicate Infusions are allowed.** "Any number of Infusions" says nothing
   against it, and Improved Recipes forbids duplicate *Essences* by name, which is
   the only such restriction on the sheet. So two Quicksilvers cut 2 Action Points.

### What the Status & Terms tab corrected

Three of the 26 did not fill a blank, they fixed something:

- **Advantage** is a d4 added to the roll, not a reroll kept high. The codex said
  "roll twice and keep the higher".
- **Empowered** adds a die (2d6 becomes 3d6); **Elevate** grows the die (d6 becomes
  d8, capped at d12). One function in `cardText.js` was doing the second job under
  the first name, so `empowerDie` became `elevateDie` and `empowerCount` was added.
  **This changes printed numbers on every card an Empowering enchantment touches**,
  which is the correct change and worth knowing about.
- **Critical Hit** is a maximum result on an Attack Roll. It cannot be "a natural
  20": a Roll here is 2d6 plus an attribute.

**ROLL was deliberately left out of the glossary.** It is a real defined term on the
sheet, but the word appears on 49 of the 166 cards, and lighting a third of every
card is the exact failure `keywords.js` warns about in its own header. Say the word
and it goes in.

Still provisional, because the tab does not cover them: **stunned** (which Amber
Shard leans on), **unconscious**, asleep, marked and dying. **Poison** was added as
a damage type for Toxic Toad, with its own token so Draconic Scale can grant
resistance to it without granting resistance to Decay.

## The columns

The sheets already have a shape and the importer reads that shape rather than
imposing one. Spells carry eight columns, basic abilities the same minus the
two secondary ones.

| Column | Required | What goes in it |
| ------ | -------- | --------------- |
| `Name` | yes | The printed name. Case is not meaningful, the cards are set in caps either way. |
| `Tags` | yes | Comma separated, **in order**. Spells read tier, school, family: `Novice Spell, Primal, Flora`. Basic abilities read `Basic Action` plus any extra: `Basic Action, Movement`. Order is not decoration, the banner and the talent pools both read position. |
| `AP` | yes | Action Point cost, a whole number, or `X` when the cost is not fixed. |
| `WP` | yes for spells | Willpower cost. Blank on basic abilities, which never cost any. |
| `Main Effect` | yes | The card text. Paragraph breaks are real line breaks in the cell, Alt+Enter. |
| `Secondary Type` | no | The rider's name: `MULTICAST`, `OVERCAST`, `UPKEEP`, `BLOOD TITHE`. Blank if the card has no second half. |
| `Secondary Effect` | no | The rider's text. Blank whenever `Secondary Type` is blank. |
| `Image` | no | Card art. A postimg page link is fine, see below. |

## Three things the sheets do not carry

None of these block a pull. They are the difference between a pull that is
mechanical and one that needs judgement, which is worth knowing before the
codex gets big.

**1. There is no `id` column, and that is the risky one.**

An `id` is what a saved character points at. A Mycomancer's prepared spells are
stored as `picks: ['bramble-whip', …]`, `{{Bramble Whip}}` links resolve through
the same key, and `src/lib/cardArt.js` keys every picture by it. With no column
for it, an id has to be guessed from the name, and a renamed spell then reads as
a brand new one and silently drops off every character who had picked it.

This already happened once: `SHARPEN SENSES` was `Sharpen Sense` in the codex.
The name was updated and the id `sharpen-sense` deliberately left alone.

Adding one `id` column to each sheet, filled once and then never edited, makes
every future pull mechanical. `templates/primal-spells.csv` and
`templates/basic-abilities.csv` have it as their first column, filled with the
ids in use now, so it can be pasted straight in.

**2. There is no `summary` column.**

Every card carries a one-line summary, used in pickers and browsers before the
card is opened. Those are written by hand in the house voice. If you would
rather own that line, add a `Summary` column and it will be read from there.

**3. There is no `damage` column.**

The damage type is currently read out of the `Main Effect` prose, so `2d6 + 2 x
Mind in Decay damage` becomes `damage: ['Decay']`. That works while a spell
deals one type and says so plainly. A `Damage` column would make it certain.

## The Image column, and `npm run art`

Keep writing postimg page links in the sheet. They serve HTML rather than an
image, and the importer follows each one to the `og:image` behind it.

What it does **not** do is point the site at postimg. Doing that cost readers
**26.2 MB across 34 pictures**, several of them 3 MB PNGs at 1280x956, arriving
at 200 to 450 KB/s from a host that stalled for 155 seconds on a single file
during testing. The plate that shows them is 360x270.

So the art is pulled once, resized, and shipped with the site:

```bash
npm run art
```

[scripts/pull-card-art.mjs](../scripts/pull-card-art.mjs) reads the Image column
out of every CSV in this folder, matches each row to a card by name, downloads
the picture, and writes two WebP files into `public/cards/`:

| File | Size | Drawn by |
| ---- | ---- | -------- |
| `<id>.webp` | 720px wide, ~47 KB | the dealt card, whose plate is 360x270 |
| `<id>-thumb.webp` | 200px wide, ~6 KB | a brief, whose plate is 92px and 58px in a list |

Then it rewrites `src/lib/cardArt.js`, which is generated and should not be
edited by hand.

**26.2 MB became 1.78 MB.** A wall of twenty-four briefs went from roughly 18 MB
to 160 KB, and Cloudflare serves all of it from the edge instead of postimg.

Re-runnable and idempotent: a picture already on disk is skipped, so adding one
spell costs one download rather than thirty-four. Pass `--force` to re-fetch
everything, which is what you want after replacing an image in the sheet.

`public/_headers` gives `/cards/*` a day of freshness and a month of
stale-while-revalidate. Not `immutable`, deliberately: the filename does not
change when the picture does, so an immutable copy would never be replaced for
anyone who had already seen the old one.

Two cards have no picture, both correctly: **Climb**, which is not on the sheet,
and **Containment Sphere**, which no sheet covers yet.

**Who sees them is a separate question.** Card art is a paid capability, so a
`free` account gets the empty plate and `premium` upward get the picture. The
rule is written once in `src/lib/tiers.js` and applied once in
`src/components/useCodexArt.js`. The one exception is the sample card on the
landing page, which is marked `promo` and shows to everybody.

## How card text is written

`Main Effect` and `Secondary Effect` are written the way the printed cards read.
The markers are plain text and survive a spreadsheet cell untouched, so type
them literally. The sheet can also just write prose and have the markers added
on the way in, which is what happened with the first pull.

| Marker | What it prints |
| ------ | -------------- |
| `{stat}` | **The card's own attribute.** This is the modular one. See below. |
| `{mind}` `{physique}` `{instinct}` | A named attribute, when the card means that one for every caster. |
| `{damage}` | The card's own damage type. |
| `{damage:Necrotic}` | A specific type, when the card names one outright. |
| `{roll}` | What this character adds to that roll, printed as `(+4)`. |
| `{roll:mind}` | The same, for a named attribute. |
| `[[1d6 + 2*stat]]` | A live value, printed as `1d6 + 12` and clickable for the breakdown. |
| `[[speed]]` | This character's Movement Speed, for the cards that say how far you go. |
| `{{Investigate}}` | A link to another card, opened on top of this one. |

### Only three things stand out

An attribute, a damage type and a defined term. Nothing else.

The card bodies used to carry `**bold**` for emphasis as well, on distances,
durations and whichever clause mattered. That was taken back out of every card
in the codex: 749 bolded phrases across 155 cards, because a card with thirty
emphasised phrases has nothing emphasised at all. The renderer still understands
the marker for cards a player types into their own Abilities tab, but no card in
the codex uses it.

So when you write a sheet: if a word is a defined term it goes in
`src/lib/keywords.js` and lights itself. If it is not, it stays plain.

### Do not gloss a defined term

Terms like Grit, Shield, advantage, Empowered, touch and Long Rest carry their
own explanation, shown when the reader points at them. Write "the target becomes
poisoned", never "poisoned (takes damage each turn)".

The matcher lights a term wherever it appears, which cuts both ways. A card must
not use a defined word to mean an ordinary one. Four had to be reworded:

- "something critical" lit the natural-20 rule, so it became "something worth knowing"
- "give up the initiative" lit turn order, so it became "hold back"
- `Gore Armor` naming itself lit Armor, so its rider says "this spell"
- `Vampiric Touch` naming itself lit touch, same fix

### Why `{stat}` and not `{mind}`

A spell is not owned by the attribute it was printed with. A Mycomancer casts
Primal spells with Instinct, and their loadout carries `cast: 'instinct'` to say
so. Any spell written with `{stat}` and `*stat` reprints itself in their hand:
Bramble Whip reads *Instinct Ranged Attack (+5)* and deals `1d6 + 10` instead of
*Mind (+6)* and `1d6 + 12`. A spell written with `{mind}` and `2*mind` is stuck
as Mind for everybody, forever.

So: `{stat}` unless the attribute is genuinely fixed. The Blood Tithe riders are
the exception in the current codex, and they are written `{physique}` on
purpose, because what a tithe costs is paid by the body whatever you cast with.

## Still wanted: a statuses tab

The glossary now holds every term the new cards use, so `touch`, `rooted`,
`poisoned` and the rest light up and answer when you point at them. Eight of
those definitions are **provisional**: a best reading of what the cards using
them imply, not something transcribed from a rules sheet. They are marked
`provisional: true` in `src/lib/keywords.js` so they are one grep away.

| Term | Where it appears |
| ---- | ---------------- |
| `poisoned` | Snake!, Force Inebriation |
| `rooted` | Entangling Roots, Thorn Rampart |
| `prone` | Shove |
| `grappled` | Grapple |
| `stunned` | Containment Sphere |
| `incapacitated` | Bird View |
| `unconscious` | Pack Bond, Stabilize |
| `elevates` | Verdant Field |

A `General Rules · Statuses` tab with a name and a sentence each replaces every
one of them. Two other things that tab could settle: what Elevate actually does
to a spell, and whether Verdant Field's "Plant spells" means the Flora family,
which is how it is currently written.
