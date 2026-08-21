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

Pictures arrive as a **folder** instead, named for the inventory shelf it fills
— `data/Armor/` — because item art is delivered as files rather than links. See
[the picture folders](#the-picture-folders-and-npm-run-artitems).

Drops are gitignored (see `data/.gitignore`), so neither a CSV nor a picture
sitting here reaches GitHub. Only `README.md` and `templates/` are tracked.

**The picture rule was added on 2026-08-20 and 12 files had already gone in**
under it — the originals are 2.4 MB each, so `data/Armor/` was about to put
66 MB in every clone to serve none of it (what ships is the 0.84 MB that
`npm run art:items` cuts into `public/items/`). Those 12 are untracked as of
this change and still on disk. They are still in the *history*, which only a
rewrite would clear; worth doing if the repo size ever matters, and not worth
doing on its own.

## What has been pulled so far

| Sheet | Pulled | Landed in |
| ----- | ------ | --------- |
| Spells · Primal Spells | 2026-08-19, 24 spells | `src/lib/weapons.js` (`SPELLS`) |
| General Rules · Basic Abilities | 2026-08-19, 10 actions | `src/lib/actions.js` (`BASIC_ACTIONS`) |
| Card art, from both Image columns | 2026-08-19, 34 pictures | `public/cards/` + `src/lib/cardArt.js` |
| Talent Set · Cauldron Keeper · Overview | 2026-08-19, 1 set | `src/lib/talents.js` (`TALENTS`) |
| Talent Set · Cauldron Keeper · Ability | 2026-08-19, 4 cards + 19 Ingredients | `src/lib/talents.js`, `src/lib/ingredients.js` |
| General Rules · Status & Terms | 2026-08-19, 26 terms | `src/lib/keywords.js` |
| Cauldron Keeper art, both tabs | 2026-08-19, 22 cards + 1 plate | `public/cards/`, `public/talents/` |
| Equipment · Armor | **2026-08-20, 27 pieces** (21 on 08-19) | `src/lib/items.js` (`ARMOR_ITEMS`) |
| Armor art, from the `Armor/` folder | **2026-08-20, 27 pictures** | `public/items/` + `src/lib/itemArt.js` |
| Talent Set · Enchanter · Ability | 2026-08-19, 3 cards | `src/lib/talents.js` (`TALENTS`) |
| Talent Set · Enchanter · Overview | 2026-08-19, written here | `src/lib/talents.js`, exported back to `data/` |
| Equipment · Enchantments | **2026-08-20, 23 enchantments** (13 on 08-19) | `src/lib/enchantments.js` (`ENCHANTMENTS`) |
| Talent Set · Mycomancer · Ability | **2026-08-20, 6 cards** (a rewrite, see below) | `src/lib/talents.js` (`TALENTS`) |
| Mycomancer art, from the `Mycomancer/` folder | **2026-08-20, 6 cards + 1 plate** | `public/cards/`, `public/talents/` |
| Talent Set · Draconic Bond · Ability | **2026-08-20, 9 cards** | `src/lib/talents.js` (`TALENTS`) |
| Talent Set · Draconic Bond · Developpement Notes | **2026-08-20, the minion system** | `src/lib/minions.js`, `MinionBlock.jsx`, `MinionPick.jsx` |
| Talent Set · Draconic Bond · Overview | **2026-08-20, written here** | `src/lib/talents.js`, exported back to `data/` |
| Draconic Bond art, from the `Draconic Bond/` folder | **2026-08-20, 9 cards + 1 plate** | `public/cards/`, `public/talents/` |
| Talent Set · Trickster · Ability | **2026-08-20, 7 cards** | `src/lib/talents.js` (`TALENTS`) |
| Talent Set · Trickster · Developpement Notes | **2026-08-20, the pending rider and the steal table** | `src/lib/tricks.js`, `AmbushWindow.jsx`, `StealWindow.jsx` |
| Talent Set · Trickster · Overview | **2026-08-20, written here** | `src/lib/talents.js`, exported back to `data/` |
| Trickster art, from the `Trickster/` folder | **2026-08-20, 7 cards + 1 plate** | `public/cards/`, `public/talents/` |
| Talent Set · Enchanter · Ability, amended | **2026-08-20, 4 cards** (3 on 08-19) | `src/lib/talents.js`, exported to `data/templates/` |
| One-off things, handed over in chat | **2026-08-20, 5 of them** | see [the one-offs](#the-one-offs-2026-08-20) |
| Trinkets, written here | **2026-08-20, 12 accessories** | `src/lib/trinkets.js` |
| The item instance, and its share code | **2026-08-20, asked for in chat** | `src/lib/forged.js`, two new columns |
| The same-source stacking law | **2026-08-20, ruled in chat** | `grantsFrom`, `itemModifiers`, `characterGrants` |
| Talent Set · Duelist · Ability | **2026-08-20, 4 cards** | `src/lib/talents.js` (`TALENTS`) |
| Talent Set · Duelist · Developpement Notes | **2026-08-20, the move rider and the arrow** | `src/lib/moves.js`, `RollArrow.jsx` |
| Talent Set · Duelist · Overview | **2026-08-20, written here** | `src/lib/talents.js`, exported back to `data/` |
| Martial Move card plates, handed over in chat | **2026-08-20, 6 Novice transcribed + 8 house-written** | `src/lib/martial.js` (`MARTIAL_MOVES`) |
| Spells · Elemental, from the `Elemental/` folder | **2026-08-20, 29 spells off card renders** | `src/lib/spells.js` (`SPELLS`) |
| Elemental art, cut out of those renders | **2026-08-20, 29 plates** | `public/cards/` + `src/lib/cardArt.js` |
| The Nightmare set and the Ring of Shrouding, handed over in chat | **2026-08-20, 1 spell + 2 workings + 2 trinkets** | see [the named trinkets](#the-named-trinkets-2026-08-20) |

`templates/` holds the current state of each, exported back out in the sheet's
own column order. `primal-spells.csv` holds the 24 Primal spells and nothing
else: the codex also carries one Arcane spell, Containment Sphere, which no
sheet covers yet. `elemental-spells.csv` holds the 29 Elemental spells — a tab
with no sheet behind it, generated straight out of `spells.js`, and its Image
column names the render each row came from, which is what the art importer
places the files by. `draconic-bond-overview.csv`, `trickster-overview.csv`,
`duelist-overview.csv`, `martial-moves.csv` and `enchanter-ability.csv` are the
tabs that were written here rather than exported, so they are tracked: a clone
would otherwise lose the only copy.

`martial-moves.csv` is the one with no sheet behind it at all — six rows off the
card plates and eight written here — so it carries two extra columns beside the
sheet-shaped ones, the way `enchantments.csv` does: **`Rides`**, what the move does
to the swing mechanically, and **`Source`**, `plate` for the six and `house` for the
eight. If a tab ever arrives for these, that column is the diff.
`cauldron-keeper-ingredients.csv` carries an extra **Sheet AP**
column beside the live one, so the Catalyst balance pass below reads as a diff
rather than a claim, and `enchantments.csv` carries what each one costs to lay and
what its sentence was turned into mechanically. Diff a fresh download against those to see exactly what
changed before asking for a pull.

**`enchantments.csv` is the sheet's 23 rows and not the codex's 25.** PREPARED and
UNIQUE IMBUEMENT came from chat rather than from the tab, so putting them in the
template would make every future diff read as two rows the designer has lost.
They are marked in `src/lib/enchantments.js` where they sit, and a round trip
skips them. If they reach the sheet, the template is where they land.

## The armor

Twenty-seven pieces, pulled on 2026-08-20 from `Equipment, Enchantments and
Items - Armor`, and every one of them now has a picture — see [the picture
folders](#the-picture-folders-and-npm-run-artitems) below. Three sets of three
slots, and with the 08-20 drop all three sets run all three tiers:

| Set | Common | Rare | Epic |
| --- | ------ | ---- | ---- |
| Heavy | Chainmail, +3 Armor | Half Plate, +4 | Full Plate, +5 |
| Magic | Runed, Shield = Mind | Greater Runed, 2x Mind | Supreme Runed, 3x Mind and a bigger cap |
| Light | Leather, +1 Defense | **Studded Leather, +1 Defense and +1 Armor** | **Scale, +1 Defense and +2 Armor** |

**The six new ones finish the Light ladder**, which was the one set with nothing
above Common. They are also the only pieces in the game that carry both stats at
once: the Common tier buys Defense alone, and the two above it keep that +1 and
add Armor on top, so a Light wearer climbing tiers stops being purely evasive
without ever becoming Heavy. `Scale Armor` is the sheet's own name for the Epic
torso piece — the set is Scale, and its chest is the one piece that does not say
what it covers.

**The Magic pieces stack.** Each of the three says "When you enter combat, you start
with a Shield equal to your Mind" on its own, so a full Runed set starts a fight
with three times Mind, a Greater set with six and a Supreme set with nine — capped
by the Shield the character can actually hold, which Supreme raises by Mind.
`combatShieldGrant` in `combatTurn.js` sums what every worn piece gives; it used to
take the best single piece, which meant two thirds of a full set did nothing.

**Verified by round trip, not asserted.** Every row's `Tags` and `Main Effect`
were rebuilt out of the codex fields and compared to the sheet cell,
whitespace-normalised. **81 of 81 comparisons match** — name, tags, rarity and
`Main Effect` on all 27 rows. Eighteen cells differ, and all eighteen are one of
the two deliberate reads below: nine `Spelled Armor`, and nine of the double full
stop, which is now every Light row rather than just the three Leather ones,
because Studded Leather and Scale carry the same sentence.

### Two things the sheet says twice, differently

1. **`Magic Armor` in the Tags column, "Spelled Armor" in the Set Bonus sentence**,
   on all nine of those pieces. They are the same set: the tag is what identifies
   set membership everywhere else (a Heavy Armor tag against "filled with Heavy
   Armor"), and it is consistent across all nine rows, so the tag was taken as the
   name and the bonus sentence now says **Magic Armor** too. This renamed the set
   in code as well: `characterModel.js` reads `fullSet === 'Magic Armor'` for the
   Grit rule. **Say the word and it goes back to Spelled Armor instead** — it is
   one string in `ARMOR_SETS` and one line in `characterModel.js`.
2. **"your Defense is equal to your Reflex.."** on all nine Light rows, kept as
   one full stop.

### What did not change, and is still open

Light Armor's full set still says Defense "is equal to your Reflex" while the
three pieces each add `+1 Defense` on top, so a full Leather set reads Reflex + 3.
That is the sheet's own numbers, unchanged by this pull, and it is the same open
question it was before: zero the pieces, skip flats when a set swaps the base, or
reword the card.

**The 08-20 drop widens it rather than settling it.** Studded Leather and Scale
each carry the same `+1 Defense` as Leather, so every Light set still reads
Reflex + 3 whichever tier it is — the new tiers buy Armor, not Defense, so the
number the set bonus contradicts is the same +3 at all three tiers. Worth knowing
if the ruling turns out to be "zero the pieces": there are nine pieces to zero
now, not three, and doing it would leave Studded Leather and Scale as pure Armor
pieces in the set whose bonus is about not being hit.

### Ids, and the two that were kept

There is still no `id` column, so ids were read off the names —
`chainmail-coif`, `supreme-runed-robes`. Two are deliberately not:

| Sheet name | id | Why |
| ---------- | -- | --- |
| Leather Tunic | `leather-vest` | same slot, set, rarity and +1 Defense as the old Leather Vest |
| Leather Breeches | `leather-pants` | same, for Leather Pants |

They are the same piece renamed, and an id is what a saved character points at,
so renaming it would quietly strip the armor off anyone wearing it. Same call as
`sharpen-sense`. The other seven old ids (`spelled-*`, `mail-*`) are gone,
because those pieces changed mechanically as well as by name — a character still
wearing one will find that slot empty.

The six new pieces took their names plainly: `studded-leather-helm`,
`scale-armor`, and so on.

`templates/armor.csv` has all 27 with their ids in the first column **and their
picture named in the `Image` column**, so pasting those two columns back into the
sheet makes the next pull mechanical in both directions — no ids read off names,
and no alias table for the five filenames that do not match.

## The Cauldron Keeper

Four tabs, pulled together on 2026-08-19. The **Ability** tab is the design and it
was transcribed rather than interpreted.

| Tab | Landed as |
| --- | --------- |
| `Overview` | the set's head in `talents.js`: `Name`, `Tags`, `Summary` and `Overview` all byte for byte |
| `Ability` | 4 set cards in `talents.js`, 19 Ingredients in `ingredients.js` (18 rows, one split in two) |
| `Developpement Notes` | the brewing window, `src/components/sheet/BrewWindow.jsx` |
| `Status & Terms` | 26 glossary entries in `keywords.js` |

**Every Ingredient body is the sheet's own Main Effect cell with nothing but
markers inserted.** `2d6 + 2 x Instinct` became `[[2d6 + 2*stat]]` so the number
resolves against the brewer, and a damage type became `{damage:Cold}` so it prints
in its own colour. That claim is checked rather than asserted: a round trip maps
every marker back to the designer's written form and compares it to their cell,
and it passes. **Nine cells differ now and every one of the nine is a decision on
record**: the six Catalyst Action Points, Volcanic Shard's tag, the Clover split and
Efficient Brewing's reading. Nineteen rows on the sheet carry an Ingredient tag (the
18 Ingredients, plus Efficient Brewing, which is tagged `Adept Catalyst`) and ten of
them match cell for cell, along with every remaining AP, WP and tag. The three
readings below and the second pass above say why each of the nine differs.

### What BREW's text buys

The card is the whole rule and the code adds nothing to it. "At least 1 Essence,
exactly 1 Catalyst, and any number of Infusions" is enforced by `brews.js` and is
the literal shape of the window. "The combined Action Point and Willpower cost of
all chosen Ingredients" is summed with its working shown, less 1 Action Point per
Quicksilver and 1 for Efficient Brewing, floored at zero. Tiers open Novice at
Rank 1, Adept at 2, Master at 3.

The window is three rows of slots, one row per kind, because that is what the
configuration sentence is: a Catalyst is one slot because there is exactly one of
it, Essences are as many slots as the rank allows, and Infusions always end in one
more open slot because "any number" has no last one. An empty slot is a `+` that
opens the shelf filtered to what that slot takes. It replaced a wall of eighteen
Ingredient rows standing open under three areas that could not themselves be
pressed. Same grammar as the armor block: tap the slot, the codex opens. The shelf
prints its Ingredients as the same card briefs every other pool on the sheet prints
— art plate, cost orbs, chips — because an Ingredient is a card and had no business
reading like a table row.

A mixed Brew is called **Brew** and wears BREW's own picture. It was named after
its Essence alone ("Four-Leaf Clover Brew"), which reads as that Ingredient's own
card and says nothing about the Catalyst, and its plate fell through to the talent
set's wide plate for want of art of its own. It quotes what went into it without
naming any of it: the Brew is one effect read in the order it resolves, and the
Ingredients are on the window that mixed it.

Nothing finished is stored, because "the resulting Brew takes effect immediately".
Nothing else is stored either: **the Cauldron is assumed to be at the brewer's
side, always.** The talent entry used to carry `cauldron: 'summoned'` and the
window refused to brew without it, which put a button between the player and the
thing they meant to press. The Overview's own words are "bearing a soul-bound
Cauldron that bubbles continuously upon their back", so the sheet takes it as read.
Bound Cauldron still costs its 2 Action Points and still says every word it says.
Nothing checks it.

### Second pass, 19 Aug 2026

Four changes after playing with the window. Three are the designer's calls and one
was a bug.

**1. The Clover is two Ingredients now.** FOUR-LEAF CLOVER was one Essence that
asked the brewer for a state, Lucky or Unlucky. It is now **LUCKY CLOVER** and
**UNLUCKY CLOVER**, two Novice Essences at 1 AP and 1 WP each. Nothing was
reworded: each keeps the sheet's own sentence for its own half, byte for byte, and
the line of flavour above it is his with one word turned over ("a rare, lucky
plant" / "a rare, unlucky plant"). Two Essences rather than one means Improved
Recipes can carry both at once, and the decision is made by reaching for a shelf
rather than by answering a question after the Ingredient is already in the pot. The
`four-leaf-clover` id is gone and strips nothing off anybody: a Brew "takes effect
immediately" and is stored nowhere, so no saved sheet has ever pointed at an
Ingredient. **Three Ingredients ask something as they go in now, not four.**
Neither Clover has art, on purpose.

**2. Every Catalyst costs 1 Action Point more.** A balance pass, so the round trip
flags all six cells on purpose:

| Catalyst | Sheet | Now |
| -------- | ----- | --- |
| Eye of the Seeker | 1 AP | 2 AP |
| Puffball Mushroom | 1 AP | 2 AP |
| Sampled Catalyst | 1 AP | 2 AP |
| Sticky Resin | 1 AP | 2 AP |
| Lightning in a Bottle | 2 AP | 3 AP |
| Sacred Chalk | 1 AP | 2 AP |

Every Brew needs exactly one Catalyst, so this is a flat +1 on the floor price of
brewing at all: the cheapest Novice Brew was 2 Action Points and is now 3, less
whatever Quicksilver and Efficient Brewing take back off it. Willpower is untouched.
`templates/cauldron-keeper-ingredients.csv` prints both numbers side by side.

**3. A Brew you cannot pay for is refused in the window.** It used to be pressable,
and `UsePrompt` would refuse it afterwards. That is the right place for a card with
a printed cost. A Brew has none: its cost is whatever went in the pot, so a Keeper
could assemble four Ingredients, press the only button in the window, and only then
be told the total was never payable. `brewShortfall` in `brews.js` measures the live
total against the pools, the window prints it in the red every refusal on this sheet
wears, and "Brew it" is disabled with the shortfall as its reason. **Either pool
counts for the Action Points**, because a Brew is asked about action-or-reaction like
every other use, so it is only unpayable when neither pool covers it. Willpower has
no second pool. The warning sits above "Still needed", which stays what it was: what
the *rule* wants, in the designer's own words.

**4. The filled slot was drawing the browser's own button.** `.brew-slot-body` and
`.brew-slot-drop` never declared `background`, `border` or `font-family`, and this
stylesheet has no global button reset on purpose — every button here says what it
looks like. So a slot with an Ingredient in it wore a light grey fill with a raised
border, which covered the slot's green and left the Ingredient's name white on
near-white. Fixed on both, plus the font on `.brew-slot-add` and `.brew-chip`, which
were quietly rendering in the system font.

### Three readings that need the designer's word

1. **EFFICIENT BREWING is tagged `Adept Catalyst`** and is implemented as the Adept
   Talent, Passive. It carries no AP and no WP where every real Catalyst carries
   both, its text is about the Brew Action rather than about who a Brew reaches, and
   BREW needs exactly one Catalyst, so a Catalyst that only cut the cost would leave
   a Brew with nothing to affect. Reading it as the Adept Talent also completes the
   rank structure at 2/1/1. Its tags were corrected to match Improved Recipes.
2. **VOLCANIC SHARD is tagged an Infusion** but deals damage like an Essence and
   costs 2 AP where every other Infusion costs 0. **Answered 19 Aug 2026: it is an
   Essence.** `ingredients.js` files it with the Essences, Novice, tagged `Novice
   Essence`. The sheet's cell still says Infusion, so the round trip flags that one
   cell on purpose and the entry carries a comment saying why.
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

## The Enchanter

Two tabs arrived, **Ability** and **Developpement Notes**, and the Overview was
handed over rather than exported: "you are in charge for the overview page." So
this one is the reverse of the Cauldron Keeper pull. The cards are transcribed and
the Overview is written.

| Tab | Landed as |
| --- | --------- |
| `Ability` | 3 set cards in `talents.js`, all Rank 1 |
| `Overview` | written here, and exported back out to `data/Talent Set - Enchanter - Overview.csv` |
| `Developpement Notes` | built, bar one thing. See "The build" below |

**The three cards are the Ability tab, cell for cell.** A round trip maps every
marker back to the written form and compares it to the cell: 16 of 16 fields match,
tags, AP and WP included. No marker was needed on any of the three, because none of
them rolls anything or deals damage.

### The Overview tab, written

`Name`, `Tags`, `Summary` and `Overview` are in the codex and in a CSV in the
sheet's own column order, so the workbook can hold the same words. Paste it in as a
new tab and the next pull is a diff.

It is written out twice on purpose. `data/Talent Set - Enchanter - Overview.csv` sits
where a drop of that tab would land, so a fresh download diffs straight against it.
`templates/enchanter-overview.csv` is the same file **tracked**, because drops are
gitignored and this one is authored rather than exported: without the tracked copy
the only place the words survive is `talents.js`.

| Column | What it says | Why |
| ------ | ------------ | --- |
| `Tags` | `Support, Mind` | Support because an Enchanter arms other people. Mind because nothing they do is rolled: what an enchantment costs is Magic Burden, and what a body can carry is `Level + Mind + 10` (`magicBurdenMax` in `items.js`). Mind is what lets an Enchanter wear their own work. |
| `Summary` | "An artisan of Willpower who turns ordinary gear into lasting wonder." | The shape the other three sets use: a noun, then what it turns into what. |
| `Overview` | three paragraphs | Built from the set's own lexicon and nothing else, the way Guardian and Mycomancer build every card name out of words in their own blurb: imbuement, Willpower, wonder, wielder, supplies, Long Rest, Magic Burden. |
| `Image` | **empty** | There is no plate. Paste a postimg link in that column, run `npm run art`, and `/talents/enchanter.jpg` appears; until then the wall and the page draw the empty haze plate, the same as any card without art. |

### Ranks 2 and 3 hand out no cards

All three cards are Novice. What the next two ranks buy is written *inside* two of
them, and nowhere else:

- ENCHANTING: "At Rank 1 you learn Novice enchantments, at Rank 2 you learn Adept
  enchantments, and at Rank 3 you learn Master enchantments."
- WIELDER OF WONDER: "The amount of such enchantments you can have is equal to your
  rank in enchanter."

The presentation page prints a rank only when that rank hands something over, so
without this the Enchanter's page would have stopped after Rank 1 and a player at
level 4 deciding on Rank 2 would have found nothing there. So the set carries an
`enchanting` spec beside its cards — a fourth shape of choice next to a fixed hand,
a `loadout` and a `brewing` spec — and `enchantPreview` in `talents.js` turns it
into the one line each rank needs. It is arithmetic on those two sentences and
needs no codex, which is why it lives in the leaf.

**The note counted nothing at first, and counts now.** For one pull the
enchantment shelf could not be counted: every row on the Equipment · Enchantments
tab was Novice, so a number at Rank 2 would have been a zero about the codex rather
than a fact about the rank. The 2026-08-20 drop brought the Adept and Master shelves
in and the note says what the Brew note says — `+13 Novice enchantments`, then
`+6 Adept`, then `+4 Master`. See "The second Enchantments pull" below.

### One reading that changed code

**`Long Rest` in the tag slot.** The Enchanter's sheet writes it where every other
set writes `Ability` or `Passive`, on ENCHANTING and WIELDER OF WONDER, both of
which cost nothing. The tag was kept and `isPassive` in `abilitySources.js` was
taught the word instead. Without that, `combatBar.js` would have offered both on
the combat quick bar as free actions — the one place a night's labour cannot be
taken — and left them out of the recap that is supposed to hold every card exactly
once. Both cards are true of the character from the moment the set is taken ("you
have learned the art", "the enchanter body is able to withstand"); the tag says when
the work they allow gets done. A card tagged `Long Rest` that does carry a cost is
still a move.

### What the notes asked for, and where each one landed

The Developpement Notes are a system rather than a card. The list, with what is in:

| The ask | State |
| ------- | ----- |
| Making an enchanted item: pick an item, apply an enchantment, carry more than one | **in**, at a Long Rest, and **in** at the forge with no rank gate |
| Naming one | **in**, as of 20 Aug 2026. See [the item instance](#the-item-instance-20-aug-2026) |
| Sharing one by code, and adding one by code | **in**, same date. `HZBD1.…` |
| A Trinket block | **in**, same date. The tab is five blocks now rather than shrinking to two |
| Ephemeral Enchantment writing to the tracker from the quick action | **in**, and from the tracker's own prompt |
| An ephemeral +1 Instinct moving the character sheet | **in**, along with everything Instinct buys |
| Another player searching for an effect laid on them | **out.** Nothing writes to another character's row |

The three that are out are all one missing thing, and it is named under "What is
still not built" below.

### The build, 19 Aug 2026

The Developpement Notes stopped being a list. Four of the five things they ask for
are in, and the fifth is named at the end of this section.

**The Enchantments tab was pulled.** All thirteen, into `src/lib/enchantments.js`,
a new leaf. `weapons.js` held four of them and still re-exports `ENCHANTMENTS` and
still folds them into `CARDS`, so nothing downstream moved. Every `Main Effect` and
every `Magic Burden` matches the sheet cell for cell, 13 of 13, checked by round
trip rather than claimed.

Two things the codex carries that the sheet does not, both deliberate:

- **A grouping tag in second position** (`Body`, `Infusion`, `Utility`,
  `Imbuement`). Not new: `Infusion`, `Utility` and `Imbuement` were already there
  on the four that existed. `Body` is the word for the five that raise an
  attribute or a pool, and it is what the shelf groups by. Position 0 is now the
  sheet's own `Novice Enchantment`, which is also where the tier comes from.
- **A rider per row.** "1 Instinct" has to *be* 1 Instinct, and no amount of
  reading the sentence will make that happen, so every mechanical consequence is a
  field: `attributes`, `healthMax`, `shieldAtCombat`, `damageType`, `empower`,
  `spell`, `light`. Mechanics as data, never parsed out of prose, which is the same
  law BREW's `opens` follows.

**NOVICE IMBUEMENT weighs 4 now, not 3.** The tab says 4 and it is the tab's own
column, so the tab won. It costs 280 Supplies to lay rather than 210, and
`grave-lantern-blade`, the one codex item that comes pre-laid with it, weighs a
point more on its bearer than it did.

### Where the numbers go, and what is never stored

The Enchanter's whole record lives on **its own talent entry**, beside the `picks`
a Mycomancer keeps there, so no column was added and handing the set back takes
its work with it:

| Card | Stored as | Permanence |
| ---- | --------- | ---------- |
| WIELDER OF WONDER | `worn: ['primal-sense']` | permanent, as many as your rank, no burden |
| ENCHANTING | `laid: { longbow: ['fire-infusion'] }` | permanent, 70 Supplies a point of burden |
| EPHEMERAL ENCHANTMENT | an `effects` row carrying `ench` | one hour |

**The split between those is the whole design.** `worn` and `laid` are gear:
`deriveStats` reads them and `syncDerived` bakes them into the stored columns
exactly the way a worn breastplate is baked in. Only `laid` costs Magic Burden,
and the *thing* carries it: a body slot is free, by its own card.
Ephemeral is an hour long and **bends what the sheet shows and never what the
sheet stores**, because a bonus written into `instinct` is one nothing can ever
take back off: `levelPicks.js` rebuilds all three attributes from its own record,
so it would be read back as a level-up. Its own card says it costs no burden.

`liveCharacter` in `characterModel.js` is that one bend, and `CharacterSheet.jsx`
hands it to the Character, Abilities and Inventory tabs. **Not** to Advancement,
which is where the attribute columns are decided and has to go on seeing what the
ledger actually bought. Writing is unaffected either way, because `patch` closes
over the stored row rather than the bent one. The Character tab prints one line
saying what is bent and by how much, because a stat nobody can account for is
worse than a stat that is merely bent.

An ephemeral +1 Instinct therefore moves Instinct, Defense, Initiative, Movement
Speed, Reflex, Grit and every number printed on every card that rolls Instinct,
and moves none of them back onto the row.

### Three ways into the same window

`EnchantWindow.jsx` is the shelf, and it is the same shelf however it is reached:

1. **The quick bar.** EPHEMERAL ENCHANTMENT prints 3 Action Points and `x`
   Willpower, so the whole cost is worked out and paid *in the window*, once. It
   carries `opens: 'ephemeral'` and `pays: 'window'`, and a move marked that way
   skips the chip's prompt rather than charging the printed half up front and
   asking the action-or-reaction question twice. Closing the shelf costs nothing.
2. **The effect tracker's own add prompt**, which offers "Lay an Ephemeral
   Enchantment instead" to a character who can. Typing "Primal Sense" in by hand
   would get the row and none of the +1 Instinct, so the offer is made where the
   mistake would otherwise be made.
3. **The Long Rest window**, for the two slow cards. See below.

The shelf is grouped by what an enchantment is *for* rather than printed as a wall
of thirteen, and each one is the same card brief every other pool on the sheet
prints. NOVICE IMBUEMENT is the one that asks a second question, because it
carries a spell and the card does not say which; it is asked in the window that
granted it, and the chosen spell rides on the effect.

**A bound spell reaches the quick bar.** An ephemeral Novice Imbuement puts its
spell in a group of its own, `Bound In`, at its own printed cost — "paying its
costs as normal" — and before what you know, because an hour-old casting is the
thing most easily forgotten. It is its own group rather than folded under a set,
because the card says "whether or not they can cast spells of their own".

### The Long Rest window

Both slow cards happen there and nowhere else. **Rewritten 2026-08-20** — they are
two of the things the rest's single action slot can be spent on, rather than two
standing sections of it. See "One action a rest" below for the window; what each
one is still costs what it always cost:

- **On your own person.** As many slots as the rank allows, filled or waiting.
  **No Supplies**, because WIELDER OF WONDER names none for changing what you wear
  and reads the way a Mycomancer's spell swap reads, and **no Magic Burden** either
  (2026-08-21, see below).
- **On what you carry.** Anything worn, in hand, on the belt or in the pack. Priced
  at **70 Supplies a point of Magic Burden**, out of the same crate and through the
  same ledger as the rest itself, and a price the crate cannot cover is offered
  dead rather than left to fail at the last button. Stripping one back off returns
  nothing. **One enchantment an item**, or two once LAYERED ENCHANTMENT is held.

Every choice writes into the window's own `talents` draft, the same draft the spell
swaps write into, and only "Yes, rest" commits any of it. A rest nobody can pay for
writes nothing at all, work included.

**A laid enchantment is real, not just recorded.** `heldItem(character, id)` in
`items.js` merges what this character has laid into the codex item's own
`enchants`, and everything downstream was already written against that field — the
damage type and Empowering the weapon block prints, the cards an item teaches, the
Magic Burden meter, and the recap's Enchantments group. Nothing had to be taught
what an Enchanter is.

### What was not built then, and is now

**An item instance.** `laid` is keyed by item *id*, so two longswords were one
longsword and an enchantment laid on one was laid on both. That was what the last
of the Developpement Notes' asks all needed — naming an enchanted piece, and
sharing one by code — and all three were left out rather than faked, because a
share code for a thing with no identity of its own has nothing to point at.

**It exists as of 20 Aug 2026.** See [the item instance](#the-item-instance-20-aug-2026)
below. `laid` is still keyed by id and did not have to change: a forged id *is* an
instance, so laying a working on one silver ring lands on that ring. Two of the
same **codex** piece are still one piece to `laid`, which is the honest reading of
a record keyed by id and is what the forge is for.

### The second Enchantments pull, 20 Aug 2026

Twenty-three rows where the first pull had thirteen, and **the tiers are real now**,
which is what the Enchanter's ranks 2 and 3 had been waiting on. Every `Main
Effect`, tag and `Magic Burden` matches the sheet cell for cell, 23 of 23.

| Tier | Rows | Opens at |
| ---- | ---- | -------- |
| Novice | 13 | Enchanter Rank 1 |
| Adept | 6 | Rank 2 |
| Master | 4 | Rank 3 |

`templates/enchantments.csv` holds all 23 with their ids, what each costs to lay,
what it costs in coin, and what the sheet's words were turned into mechanically.

**The rank note counts now.** It printed no numbers for one pull, on purpose,
because every enchantment was Novice and a count at Rank 2 would have been a zero
about the codex rather than a fact about the rank. The Enchanter's page now reads
`+13 Novice enchantments` at Rank 1, `+6 Adept` and 19 to lay from at Rank 2, and
`+4 Master` and 23 in all at Rank 3.

#### Four new riders, and four things left printed

The ten new rows brought four consequences the sheet had not needed before, and
`deriveStats` reads all four:

| Enchantment | Cell | What moves |
| ----------- | ---- | ---------- |
| Celerity | "2 Speed" | Movement Speed, +2 |
| Arcane Battery | "Willpower is increase by 8." | maximum Willpower, +8 |
| Resilience | "3 armor" | Armor, +3 |
| Oz'em Pick | "the cost in supplies of short and long rest are reduced by 2" | the price of **both** rests |

Oz'em Pick is the only thing on the sheet that moves a *rest* rather than a stat,
so `restPrice(character, kind)` is now what everything asks — the plan, the two
affordability checks, and the buttons on the block, which read 3 and 8 rather than
5 and 10 for whoever wears it. Floored at nothing, because a rest that paid you
would be a strange kind of rest.

**Resilience's Armor is one number, not two.** It joins the worn pieces' total, so
the meter reads it *and* Heavy Armor's "half of Armor" rider reads the same one. A
full Heavy set with Resilience on top therefore gets +1 Defense out of it as well.
That is an interaction the sheet has never had to price before, and it is one line
in `deriveStats` if it should not compound.

And four that stay printed rules the table plays, for the same reason Barrier's
`2d6` does — nothing here knows what a ceiling is, or that a character went down:

- **Defibrillation** and **Death Defiance** both fire when you go down, and both
  are spent until a Long Rest. Nothing tracks "has triggered", and nothing on the
  sheet notices the moment of going down.
- **Crawler** (walls and ceilings) and **Soar** (flight at your Movement Speed).

#### Two things worth knowing before the next session

**1. NOVICE IMBUEMENT lost its limit.** The cell used to end "1 time until they
take a Long Rest" and now stops at "cast this spell", and the two new Imbuements
read the same way, so the removal is consistent across all three rather than a slip
on one. **Transcribed as written: nothing limits the casting any more.** A burden-4
enchantment granting a Novice spell without limit is a different thing from one
granting a single casting, so this is flagged rather than quietly kept. Say the word
and the clause goes back on all three.

**2. There are no Master spells.** MASTER IMBUEMENT binds "a MASTER spell" and the
codex holds nine Adept and sixteen Novice and none at Master. The window says so
rather than showing an empty chip row and refusing to be pressed: *"No Master
spells in the codex yet. Lay it and name one at the table."* It lays without a name
and the table supplies one. A Master spells tab fixes it with no code change.

**Fixed later the same day, with exactly no code change:** the Elemental pull
brought eight Master spells (see [the Elemental school](#the-elemental-school-2026-08-20)),
so the window now offers real chips and that message retires itself.

#### One id had to change

**RESILIENCE is `resilience-enchantment`, not `resilience`.** A lineage trait
already held that id *and* that printed name ("6 health per point of Fortitude and
Physique instead of 5"), and an id is what a saved character points at, so the older
one keeps it. This was not cosmetic: lineage cards fold into the registry *after*
enchantments, so both on one id silently lost the enchantment out of `getCard`, and
a tracker row written for it would have opened the lineage trait instead.

`weapons.js` now logs a duplicate-id error in development, because a collision does
not throw, it loses a card.

**The printed names still collide.** The sheet says RESILIENCE and renaming the
designer's card is not the importer's call, so a table with both will see two cards
called Resilience. Worth renaming one at the source.

### Five corrections, 20 Aug 2026

**1. Taking the Enchanter asks for the body enchantment.** WIELDER OF WONDER says
"choose one **when becoming an enchanter**", and that moment was going unasked: the
set arrived and the slot sat empty until somebody found the Long Rest window. The
shelf now opens on top of the take, exactly the way a Mycomancer's spell pool does,
and again at Rank 2 and Rank 3 because each of those widens the count by another.
The slots stay on the block afterwards as a plainly visible way to change them.

One component serves both moments — `WornEnchants.jsx` — because it is one rule read
twice. The only difference is where the new value goes: `patch` on the Advancement
tab, the rest's own draft in the rest window. It writes nothing itself.

**2. A Wielder of Wonder group in the recap.** What is on the Enchanter's own person
now has its own heading in the Always On block rather than being folded in with the
gear, because it is a different kind of standing thing: an enchantment on a hood
goes when the hood does, and these are on the Enchanter. The heading is the card
that put them there, so each row spends its provenance saying what it costs in
Magic Burden instead — the number this block exists to stop anyone forgetting.

**3. Workings is called Enchantments.** That group was the block's own word for
something the cards already have a word for, and a player reading their sheet has
no reason to learn a second one. `Enchantments`, "worked into what you carry".

**4. An enchantment on the body works the weapon in your hands.** "Enchantments
apply to your person", so a Fire Infusion worn by an Enchanter is a working on the
hands rather than the blade, and it travels from weapon to weapon with them. The
damage type and the Empowering now reach whatever they are actually holding.

**Only what is held.** A Fire Infusion on an Enchanter's hands does nothing to the
spare dagger in their pack, so `wieldModifiers` in `items.js` is what decides —
that file is the one that knows what equipment is, and weapons.js is handed the
answer.

**And it weighs nothing.** A worn enchantment never weighed once per weapon held,
so the meter never read 12 for a character holding two blades. What it did do was
count the body slots at all, on the reading that WIELDER OF WONDER never said its
enchantments were free of burden where EPHEMERAL ENCHANTMENT said exactly that of
its own. **Overturned 2026-08-21: a body slot costs no Magic Burden.** See
[the ruling](#a-body-slot-costs-no-magic-burden-2026-08-21).

**5. Two damage types read as "Decay or Fire".** A blade with Decay worked into it,
in the hands of someone wearing Fire, is a blade that deals **Decay or Fire**: both
enchantments replaced its own type and neither of them lost. It used to be
whichever came last, which quietly threw one away and turned the order of a list
into a rule. `itemModifiers` hands back a list now, and the renderer already knew
how to print one — each type in its own colour, joined with "or", no Oxford comma.
A type named twice is named once, so two Fire Infusions are one Fire.

The weapon block's banner reads `Enchanted · Decay or Fire`, and the dealt card
reads *"you deal 4d6 + 6 as Decay or Fire damage"* — 4d6 because both Infusions
Empower, and Empowered stacks.

#### And one thing that was telling players the wrong rule

The six Infusion cards said Empowered "steps up a category — a d6 becomes a d8".
**That is Elevate.** The Status & Terms tab defines Empowered as one more die of the
same kind, 2d6 becoming 3d6, and `empowerCount` in `cardText.js` has done exactly
that since that pull — so six cards were describing the opposite of what the sheet
then rolled. The bodies now say what the glossary says. The `Main Effect` cells are
the designer's own and were not touched: "Empowered by 1" was always right.

### Two numbers answered, two readings still open

1. **70 Supplies a point of Magic Burden. Answered 19 Aug 2026: 70.** Not 700. It
   sits beside the 750 *coin* a point the codex charges for the same enchantment,
   which is a different economy — making a Fire Infusion costs 280 Supplies where
   buying one costs 3000 coin.
2. **NOVICE IMBUEMENT's burden. The tab won: 4, not 3.** It is the tab's own column
   and the tab is newer. Costs 280 Supplies to lay rather than 210, and
   `grave-lantern-blade` weighs a point more than it did.

And two that are a reading rather than a ruling, both flagged in code:

3. **Changing what you wear is free.** WIELDER OF WONDER names no cost for changing
   the enchantments on your own person, where ENCHANTING names one for enchanting
   an item, so each card's own words were allowed to govern and the body slots
   re-choose for nothing — the way a Mycomancer's spells do. `changeCost` in
   `enchanting.js` is the one function to change if the body should cost Supplies
   too.
4. **BARRIER grants a roll, not a number.** "Gain 2d6 in Shield at combat start" is
   carried as `shieldAtCombat: '2d6'` and printed on the card, and nothing rolls
   it: the sheet prints dice and the table rolls them, which is how every other
   printed die on it works. It is the one rider that moves no number by itself. Say
   the word and combat start can roll it.

## The Mycomancer, rewritten 2026-08-20

The `Ability` tab arrived again, and it is not an edit — it is a different set.
Six cards where there were seven, and the whole **cadaver economy** is gone:
touching a fresh corpse no longer cheapens a spell, a corpse in range no longer
replicates FUNGAL BLOOM, and MOLDY REANIMATION does not exist. What replaced it
is a bond economy, and every card now points at the network rather than at the
dead.

Transcribed straight off the tab. What changed, card by card:

| Card | Then | Now |
| ---- | ---- | --- |
| Fungal Invocation | "Nature Spells"; swap after a **short or long** rest; a fresh cadaver cheapens a spell by 1 WP | "**Primal** Spells"; change them with your **long rest action**; no cadaver clause at all |
| Mycelium Network | four paragraphs — advantage on nature rolls, cast off Instinct, weapon proficiency, Mycelial Communion | one sentence: your Mycomancer spells cast off Instinct instead of Mind |
| Fungal Bloom | Necrotic; a cadaver in range replicated it for free | **Decay**; the cadaver clause is gone |
| Mycelial Bond | — | unchanged, word for word |
| Sporatic Infusion | **1 AP / 1 WP**, extra damage equal to Instinct | **Sporadic** Infusion, **4 AP / 5 WP**, `4d6 + 4 x Instinct` in Decay, through the bond |
| Deepening Connection | bonds persist; cheapened spells fed bonded allies 1 WP; self-targeting spells shared, once per long rest | bonds persist, capped at half Instinct, and you may **cast through a bonded ally** as the point of origin |
| Moldy Reanimation | 4 AP / 2 WP, reanimate a Minion cadaver | **not on the sheet.** Removed. |

### What that moved in code

- **`loadout.swap` is `['long']`**, where it was `['short', 'long']`. The rest
  window reads that list to decide whether to offer the swap, so a Mycomancer's
  short rest no longer opens the spell pool. Three comments quoting the old
  wording — in `rest.js`, `loadouts.js` and `RestPrompt.jsx` — were corrected
  with it.
- **The Nature/Primal contradiction is settled.** The card said "Nature School"
  while `loadout.school` said `Primal`, which is where the printed spells
  actually are. The new tab says Primal in all three places it names the school,
  so the note asking for a ruling is gone.
- **`sporatic-infusion` is now `sporadic-infusion`.** Safe: a saved character
  stores *picked* card ids, and a talent's own cards are granted rather than
  picked, so no character points at that id.
- **Decay, not Necrotic.** `cardText.js` maps both to `--dmg-decay` and the
  alias stays for the one spell that still prints Necrotic, but the Mycomancer's
  two damaging cards now print what the sheet prints.

### One word changed, and one thing flagged

**"leared" was set as "learned"** in Fungal Invocation. That is the only
departure from the cell, and it is a typo rather than a design.

**The tagline and blurb were left alone, and they now contradict the cards.**
Both are the `Overview` tab's — "turning the dead into power", "they turn fallen
foes into a resource, hastening the decomposition of cadavers" — and that tab
was not in this drop. The Ability tab withdrew the mechanic they describe.
Rewriting them would mean inventing replacement prose for a tab that simply did
not export, so they stand as written with a note in `talents.js`. **Send the
`Overview` tab and they get corrected in the same pass.**

### How the transcription was proved

Every marker was mapped back to the prose it stands for — `[[4d6 + 4*stat]]` to
"4d6 + 4 times your Instinct", `{damage:Decay}` to "Decay", `{instinct}` to
"Instinct" — and the result compared to the designer's cell with whitespace and
case flattened, plus name, AP, WP, tags and rank for each row. **35 of 36 checks
matched.** The one that did not is "leared" above.

## The Draconic Bond, 2026-08-20

The first set that hands over a **body** instead of a card. Nine cards on the
`Ability` tab, a `Developpement Notes` tab describing a whole new kind of block,
and a folder of eleven pictures. No `Overview` tab: it was handed over to be
written here, the way the Enchanter's was.

### The split the sheet already made

The Tags column does the work, and it is worth noticing because nothing else in
the codex needed it: four cards are tagged **`Draconic Ally`** and five
**`Draconic Bond`**. That is the designer saying which of the two bodies plays
which card, and it is what the two quick bars are built on. A `Draconic Ally`
card is played from the creature's block and paid out of the creature's Action
Points; it is kept off the character's own quick bar so nothing is ever charged
to the wrong pool.

| Rank | The bonded plays | The ally plays |
| ---- | ---------------- | -------------- |
| 1 · Novice | One and the Same, Draconic Recall | Wyrm Bolt, Dragon's Favor |
| 2 · Adept | Draconic Mark | Dragon Breath |
| 3 · Master | Empowered Bond, Draconic Link | Frightful Roar |

### The minion system

`src/lib/minions.js` is new and is written generically, because the notes say so:
"this a system that will be used late for other thing so make it ahead of time
modular". What a creature *is* lives there; what *this* creature is made of is a
`minion` spec on the set in `talents.js`, exactly the way `loadout`, `brewing`
and `enchanting` already work. A second set with a different creature writes a
different spec and changes no code.

Every number in the spec is the notes', transcribed:

| The note | The spec |
| -------- | -------- |
| "at level one it has 5 Physique, 4 Instinct, 6 Mind" | `base: { physique: 5, instinct: 4, mind: 7 }` — the Mind raised by one on Jules' ruling of 2026-08-20, and the one cell in this table the notes did not write |
| "every uneven level he gains 1 Mind, and every even level he gains 1 Physique or 1 Instinct, alternating" | `growth: { odd: ['mind'], even: ['physique', 'instinct'] }` |
| "health is 5 per level and 5 per physique" | `health: { perLevel: 5, perPhysique: 5 }` |
| "a Defense equal to its Grit" | `defense: 'grit'` |
| "it cannot go in negative" | `floor: 0` |
| ONE AND THE SAME: "unable to reemerge until you take a Long Rest" | `returns: 'long'` |
| EMPOWERED BOND: "its damage is Elevated by 1" | `elevate: [null, 0, 0, 1]` |
| "Red (fire), Blue (Cold), White (lightning), Yellow (sacred), Purlple (psychic), Green (decay)" | `scales.options` |

"All the stat are derived the same", so Reflex, Grit, Initiative, Speed, Action
Points and Reaction Points are the character's own formulas from
`deriveStats` run against the ally's attributes. At level 1 that is
**30 Health, Defense 10, Reflex 9, Grit 10, Initiative 5, Speed 5m**; at level 12
it is **100 Health and Defense 18**.

### The two blocks

"You get a new block add to your character page. This a two block wide ... the
minion also has his own one block ... this block can also be move around both
the 1 and 2 block."

Read as **two blocks**, each the ordinary 360x640 cell, side by side in their
factory order and each with its own row in the arranger. That satisfies both
halves of the sentence: together they are two blocks wide, and each moves on its
own. `block_order` is therefore no longer a fixed list of six numbers —
`normalizeBlockOrder` now takes the extra ids (`minion:draconic-bond` and
`minion:draconic-bond:bar`) and repairs the stored list the way the Abilities
tab's `normalizeSourceOrder` does.

Both blocks draw with the **character's own tiles** — `AttrTile`, `StatBox`,
`ResourceBar`, `PipRow`, the quick bar's chip — because the stats are derived
the same and a Grit has to look like a Grit.

The pools sit in a new `minions` jsonb column, keyed by the set:
`{ "draconic-bond": { name, scale, portrait_url, health, shield, ap, reaction } }`.
**Re-run `supabase/schema.sql`** or the column is dropped from writes with a
console warning.

### Who pays for what

"The minion always use his own action point and reaction point but uses the
character willpower."

`minionActor` dresses the creature up as a character — its attributes, its
pools, and its bonded's Willpower — and hands that to the two components that
already know how to read one. So `UsePrompt` refuses a Wyrm Bolt when the *ally*
is out of Action Points and when *you* are out of Willpower, with no second copy
of the prompt, and `AbilityCard` prints "2d4 + 6" off the ally's Mind rather than
yours. The confirmed patch is then split by `minionSpend`: points to the
creature's row, Willpower to the character's, in one write.

That needed one new modifier: **`actor`**, beside `damage`, `empower`,
`elevate`, `stat` and `choice`. `elevate` also had to be threaded through
`CardText` and `AbilityCard`, which knew about `empower` and not its twin.

### Naming it

"A new window open, you name the draconic ally. You choose it scale color ...
when naming it should also allow you to add an image to it like for character."

It opens on top of the take, the way a Mycomancer's spell pool does, and it is a
button afterwards in two places: on the set on the Advancement tab, and on the
creature's own block. An unnamed ally is counted by `openChoices`, so it wears
the same badge on the Advancement tab that an unanswered lineage card does.

### Two edits to the sheet's own words, and why

- **"Mind Range Attack" was set as "Mind Ranged Attack"** on WYRM BOLT. Ranged
  Attack is the game's own defined term, printed that way on the Status & Terms
  tab and on every other card, and the missing letter would have left it unlit.
- **FRIGHTFUL ROAR's parenthesis moved to `keywords.js`.** The card spells
  Frightened out at its foot; a defined term carries its own explanation and must
  never be glossed in prose as well, so the designer's sentence went into the
  glossary word for word and the parenthesis came off the body.

Everything else round-tripped: every marker mapped back to the written form and
compared to the cell with whitespace and apostrophes flattened, plus tags, AP and
WP for each row. **9 of 9 matched.**

### Three things for the designer

1. **Two scale tables disagree.** The Draconic *lineage*'s CHROMATIC RESISTANCE
   reads white as Cold, blue as Lightning and black as Decay; the Draconic Bond
   notes read blue as Cold, white as Lightning and green as Decay. Both are
   yours. The set uses the notes' table and the lineage keeps its own.
2. **The tagline, tags and blurb are house-written**, and exported back to
   `data/Talent Set - Draconic Bond - Overview.csv` in the sheet's own column
   order so the workbook can hold the same words. Tags were guessed as
   "Martial, Support, Control, Mind".
3. **"Dead" against "retreats into your shadow".** The notes say the ally is
   "instantly shown as dead" at 0 Health and cannot go negative; ONE AND THE SAME
   says it retreats into your shadow until a Long Rest. The block does both: the
   bar bottoms out at nothing and wears the skull, and the card's own sentence is
   printed underneath so nobody reads the skull as gone for good. A Long Rest
   brings it back, in the rest window's own list of lines.

### The picture folder

Eleven files for nine cards and one set plate, and three of them did not match
by name. `pull-card-art.mjs` learned all three rather than anybody renaming a
file:

- `Empowred Bond.png` → an `ALIASES` entry for EMPOWERED BOND.
- `Draonic Bon Overview.png` → a new `PLATE_ALIASES` table, keyed by talent id,
  for a set plate whose filename is not the set's name.
- `Dragon Favor.jpg` **and** `Dragon's Favor.png` both claim DRAGON'S FAVOR. The
  importer now takes the **newest** file when two claim one card and names the
  one it set aside in the run's report, because which of them wins was otherwise
  down to alphabetical order. Deleting the older file retires both that rule's
  involvement and the alias.

## The Trickster, 2026-08-20

Seven cards on the `Ability` tab, a `Developpement Notes` tab with two sentences
in it, and a folder of eight pictures. No `Overview` tab: it was handed over to
be written here, the way the Enchanter's and the Draconic Bond's were.

| Rank | Cards |
| ---- | ----- |
| 1 · Novice | Blind, Ambush, Skulk |
| 2 · Adept | Dodge, Distract |
| 3 · Master | Steal, Thrilled |

Instinct throughout. Every roll the set asks for is an Instinct roll and there is
no second attribute anywhere on the tab, which is the cleanest a set has arrived
yet.

### How the transcription was proved

The same round trip the Mycomancer and the armor got: every card's `Name`,
`Tags`, `AP`, `WP` and `Main Effect` rebuilt out of the codex fields into the
designer's own written form, and compared to the sheet cell, quote- and
whitespace-normalised. **33 of 35 comparisons match across 7 rows.** All seven
names, all seven tag lists and every AP and WP match exactly. Two `Main Effect`
cells differ and both are decisions on record:

1. **BLIND** — the Blinded gloss came off the card body. The sheet spells the
   status out in a parenthesis at the foot of the card, and a defined term must
   never be glossed in prose as well, so the sentence went to `keywords.js`
   **word for word** and a new `blinded` term lights wherever it is printed. Same
   trade FRIGHTFUL ROAR made three sets ago. The card's own title is deliberately
   *not* a term: BLIND opens "You attempt to Blind a target", and lighting a
   card's name inside its own first sentence is noise.
2. **STEAL** — two of the four rows were tokenised. "twice your Instinct
   Attribute" became `[[2d6 + 2*stat]]` and "thrice your Instinct Attribute"
   became `[[3*stat]]`, so the card prints *2d6 + 8* and *12* for an Instinct-4
   Trickster instead of asking them to multiply mid-fight. The other two rows are
   the sheet's own prose untouched. Same trade as the Cauldron Keeper's
   Ingredients.

The tags are the sheet's column split on the comma, exactly the way the Cauldron
Keeper's are: `['Trickster', 'Novice Talent', 'Ability']`. Nothing was
re-labelled.

### What the notes asked for, and where each one landed

The `Developpement Notes` tab is two sentences and both of them are about the
same missing idea — a thing that waits on your **next** weapon attack:

> "On the trickster two things, first for the next time after he use ambush, the
> weapon attack should reflet the increase in damage. Thi should be lost on use.
> Then when he use steal, it should show the options after he press use. so he
> can slect which one and apply it. which would include the damage increase
> ,return ect."

`src/lib/tricks.js` is new, and it is where both live.

**The rider.** AMBUSH is not something you do to a target, it is something you do
to your own next swing, and the swing has to *show* it before it is made. So a
rider is stored on the **effects tracker** — an ordinary row carrying a `trick`
object — and no new column was added for it. The tracker already is exactly this
list: what is running on you right now, drawn on the Turn block, countable and
clearable. It is also where the one other mechanical payload on this sheet lives
(an Ephemeral Enchantment's `ench` key). A rider you cannot see is a rider you
will forget you paid for.

```
{ trick: { id: 'ambush', elevate: 2 } }   the next Weapon Attack is Elevated twice
{ trick: { id: 'poison', flat: 1 } }      and deals another 1 x Instinct
```

From then on the attack prints its raised damage **everywhere the sheet prints
it** — the quick bar chip, block 3's row, the dealt card. A Longbow Aimed Shot
under a 3-Elevate ambush reads `3d12 + 12` instead of `3d6 + 12`.

`elevate` is a stored number because it is history: "equal to the Willpower paid"
is about what was actually paid, and swapping weapons afterwards must not change
the answer. `flat` is a *multiplier* on Instinct rather than a number, because
Poison says "equal to your Instinct Attribute" and means the Instinct you have
when you swing.

**Lost on use** is `spendTricks`, called from `spendUse` in `combatBar.js` — the
one place every use on the sheet is paid for, so a rider comes off whether the
swing was tapped on the quick bar or on block 3. It comes off hit or miss:
AMBUSH's Willpower buys the *attempt*, Advantage applies to the roll, and the
roll has happened.

**What counts as a swing** is read off the tags, never guessed. The glossary is
narrow — a Weapon Attack is "either of the two attacks the weapon in your hands
teaches you" — so both `Weapon Attack` and `Special Weapon Attack` carry a rider
and the four things tagged `Weapon Move` do not. Shield Block is one of those, and
a rider that raised a shield block would be lending damage to a defence.

### AMBUSH prices itself, so it asks

"The cost of this ability is equal to the weapon number of base damage dice
before enchant or boost" — so the card's printed cost is the sheet's own `x`, and
the number is not knowable until the attack is chosen. **The two attacks a weapon
teaches do not always roll the same dice.** A Longbow shoots for 2d6 and takes
aim for 3d6, so an ambush costs 2 one way and 3 the other and is Elevated to
match.

So AMBUSH is marked `pays: 'window'`, the same as EPHEMERAL ENCHANTMENT, and
`AmbushWindow.jsx` lists the attacks in hand with the Willpower each would cost
and prints the chosen one *as it would land* before a point is spent. "Before
enchant or boost" is honoured by reading the card's own printed expression: an
Empowering enchantment adds dice at print time and has no business raising the
price of an ambush.

A weapon whose card rolls no damage dice cannot be ambushed with and is left out
of the list. That is the four `Reload` cards, which are tagged `Special Weapon
Attack` and deal nothing.

### STEAL opens the table

`opens: 'steal'`, so the two Action Points and the Willpower are paid at the chip
— they are the price of the attempt — and `StealWindow.jsx` comes up afterwards
to decide what was lifted. It asks for the d4 first, because the die is the
table's and never the sheet's, and it shows all four rows whether or not the roll
reached them: knowing what you missed is half of what a d4 is for.

Three rows are applied outright. Healing Tonic is not — its 2d6 is rolled at the
table, so the window asks for it and adds the flat half to whatever is typed in,
which is the same law `shieldRolls` keeps in `enchanting.js`. Health and Shield
both move through the **ledger**, because every other change to either is logged.

| Row | What the sheet writes |
| --- | --------------------- |
| 1 · Healing Tonic | Health + the rolled 2d6 + 2 × Instinct, capped at max, ledgered |
| 2 · Poison | a rider on the tracker: the next weapon attack carries another 1 × Instinct |
| 3 · Protective Charm | Shield + 3 × Instinct, capped by the shield cap, ledgered |
| 4 · Strange Dust | Action Points + 3 capped at the pool's ceiling, and the Willpower back |

Strange Dust is capped at `ap_max` rather than allowed to overfill, which is the
law everywhere else on this sheet that puts points *in* — see
`combatReactionGrant`. THRILLED is what makes it land in full, because a Master
Trickster's ceiling is 7.

### THRILLED moves a number that had never moved

`ap_max` and `reaction_max` were a literal `6` in `deriveStats`, because until now
nothing in the game touched either. THRILLED does: "your Action Points and
Reaction Points maximum are increased to 7". Both now read
`pointCeilings(character.talents)` from `tricks.js`, indexed by rank off the set's
own `tricks.points`, and the same shape comes back whether or not the character
has the set. They are derived columns, so `syncDerived` carries the change to
every reader and clamps a full pool down again if the set is handed back.

### One new modifier: `bonus`

Poison adds flat damage, and the card renderer had `empower` and `elevate` but no
way to say "and another 4". `resolveValue` in `cardText.js` takes a `bonus` now,
threaded through `AbilityCard` and `CardText` beside the other two.

It only lands on an expression that **rolls dice**, and that guard is load-bearing:
`teeth-bite` is the one card in the codex with two live values — "[[2d6 + 2*stat]]
as damage and gain Shield equal to [[stat]]" — and lending damage to a swing must
never quietly raise the shield it also grants. Every weapon attack's damage rolls
dice and nothing else on one of those cards does, so the die is the tell.

### The Overview tab, written

No `Overview` tab arrived, so `tagline`, `tags` and `blurb` are house-written and
exported back out to `data/templates/trickster-overview.csv` in the sheet's own
column order, tracked in git because it is the only copy. The set tags are
`Martial, Defense, Control, Instinct`:

- **Instinct** — every roll on the tab, and no second attribute anywhere.
- **Martial** — AMBUSH and STEAL are both spent on a weapon in hand.
- **Defense** — DODGE is the only card in the codex that makes a *landed* attack
  miss.
- **Control** — BLIND.
- **Support** is deliberately absent. SKULK is the one clause that reaches an
  ally, and one clause is not a role.

### Three things for the designer

1. **STEAL's "below" deletes row 4.** "Roll a d4 and choose any one effect whose
   value is below the number you rolled." Read literally, a 1 steals nothing and
   **Strange Dust can never be taken at all** — no d4 result is above 4. The notes
   name "return" as one of the options the window has to offer, which is that row,
   so it is read here as **at or below**: the ladder runs 1 to 4 and every roll
   takes something. Deleting a row you wrote is the larger invention, but this is a
   reading and not your word. `tricks.steal.reach` in `talents.js` is one string
   and flipping it to `'below'` makes the window follow the literal rule.
2. **THRILLED's last clause is unfinished.** "…are increased to 7 and you start
   with Action Points each turn" names no number. It is transcribed as it stands
   and only the half that can be read is built. A turn already refills Action
   Points to whatever the cap is, so the clause is either that rule restated or a
   number that did not export — and if it was meant to be *Reaction* Points, that
   is a real rule the sheet is currently missing, because the two turn boundaries
   deliberately leave the reaction pool alone.
3. **Constrained is not a defined term.** AMBUSH triggers on "the Stunned,
   Grappled, or Constrained status". `Stunned` and `Grappled` are both on the
   Status & Terms tab; **Constrained is on no tab**, so it prints plain where the
   other two light up. Nothing was invented for it. `Rooted` is the closest thing
   the glossary has, and if they are the same status the card should say Rooted.

Two smaller things, decided rather than asked:

- **AMBUSH's Advantage is printed, not applied.** The card says the attack "is
  made with Advantage", and Advantage is a d4 added to a roll the table makes. The
  rider says so on the tracker and on the window; the sheet does not roll it.
- **Poison's "next Weapon Attacks" is read as one swing.** The row is written
  plural where the sentence is singular ("your *next* Weapon Attacks"), and a
  rider with no end condition never comes off. Treated as the next attack, the
  same as AMBUSH, so both are lost together on the same swing.

### The picture folder

Eight files for seven cards and one set plate, and every one of them matched by
name — the first set folder that needed no alias at all. `Trickster overview
image.jpg` was claimed as the plate by the folder rule that already existed (a
file whose name starts with the set's own name), so `pull-card-art.mjs` was not
touched for this set.

## The Duelist and the Martial Moves, 2026-08-20

Four cards on the `Ability` tab, a `Developpement Notes` tab with two sentences,
no `Overview` tab, and no picture folder. Plus six **card plates** handed over in
chat for a thing the codex has been promising since the Guardian was written and
has never had: a **Martial Move**.

| Rank | Cards |
| ---- | ----- |
| 1 · Novice | Dexterous, Agile |
| 2 · Adept | Follow Up |
| 3 · Master | Sharp |

Instinct throughout, house-assigned: the set names no attribute anywhere on the
tab, and everything it buys is footwork and finesse.

### A Martial Move is not a spell and is not a talent card

It is a third shape, and `src/lib/martial.js` is its codex — its own leaf module
for exactly the reason `spells.js` is one, so a pool can be reached without
dragging the whole card registry into the landing page's bundle.

A move is bought out of a pool, waits, and is spent by the next weapon attack you
make. The banner is two tags in the order the plates print them:

```
MARTIAL MOVE - NOVICE
```

That is the *reverse* of a spell's banner (`NOVICE SPELL - PRIMAL - FLORA`) and it
is deliberate, because it is what the plates say. `tierOf` in `loadouts.js` looks
for the tier word in any tag rather than in the first one, so both orders resolve
with no change. There is no school and no family: the tier is the only thing that
gates a move, which is why the chooser walls the pool **by tier** rather than by a
sub-school none of them has (`group: 'tier'` on the spec).

| Tier | Moves |
| ---- | ----- |
| Novice | Wound, Wing Clip, Concuss, Momentum, Reckless, Taunting |
| Adept | Rend, Disarm, Feint, Sweep |
| Master | Riposte, Execute, Perfect Form, Bleed |

**Six are transcribed and eight are house-written.** The six Novice moves are the
plates, byte for byte, costs read off the orbs — a plate with one orb costs only
that, so CONCUSS and MOMENTUM carry no Action Points. The eight above them were
asked for in chat ("extrapolate to also have 4 adept and 4 master new ones"), are
marked `house: true` in the file, and are the only cards in it that are not off a
plate. That flag is the list of what to overwrite the day a sheet arrives for them.

They invent **no new status**. Everything they lean on is already in the glossary —
prone, grappled, stunned, Critical Hit, Empowered, Elevated, Reaction Points,
Wound — because a status nobody has written down is a rule the table cannot look
up. AMBUSH names a `Constrained` status that the Status & Terms tab does not
define, and nothing here was built on it for the same reason.

### Two sets teach them, and the card said so all along

`SHIELD EXPERTISE` has read "You learn a number of Novice Martial Moves equal to
1 + your Rank in Guardian" since the Guardian was written, with nothing behind it.
It has a pool now, on the same `loadout` spec a Mycomancer's spells use:

| Set | Rank 1 | Rank 2 | Rank 3 | Tiers |
| --- | ------ | ------ | ------ | ----- |
| Duelist (2 + rank) | 3 | 4 | 5 | Novice → +Adept → +Master |
| Guardian (1 + rank) | 2 | 3 | 4 | Novice → +Adept → +Master |

Both counts and both ladders are off those two cards and nothing was added. A
character holding both sets has **two** allowances out of one pool, which is the
literal reading: each card grants its own, and each was paid for.

**The Guardian's has no `swap`.** DEXTEROUS prints the sentence that lets a rest
re-choose the hand, word for word the one FUNGAL INVOCATION prints, so the Duelist
appears in the long rest window's action list. SHIELD EXPERTISE prints no such
sentence, so the Guardian is offered none — a rest is not the place to invent a
rule a card never printed. The panel on the sheet still changes it at any time,
and the block on the Abilities tab now says which of the two a set is rather than
promising "swapped at any rest" to both. **Worth a ruling.**

### The rider, and where the notes landed

The `Developpement Notes` are two sentences and the second one is the whole
system:

> "When soemthing give oyu permnanet adventage like this it should dispaly on the
> card adventage should be a an arrow up witn an umber in it( green arrow). In
> case it happes later disvage its the same so ability that are itne tracker
> would do th same as well."

> "in genral justn ot for this, martial mvoe are activate before the attack so
> they show in ttracker until the atakc is made. Remove on the tracker on the
> attack alnd and when possible updating the attack text to say (not on the card)
> that this attack will "mARTIAL MOE NAME a""

`src/lib/moves.js` is new and is where all of it lives. It is the Trickster's
rider system again, deliberately: same storage, same law, one field.

```
{ move: { id: 'wing-clip' } }
```

**Only the id.** An AMBUSH stores its Elevate because that number is *history* —
what was actually paid for a particular weapon — while a move's numbers are
printed on its card and never vary, so they are read back off the codex (`rides`
in `martial.js`) and a correction to a card corrects every rider already laid.

`rides` is three optional keys — `advantage`, `empower`, `elevate` — and the line
for what goes in it is strict. RECKLESS is Empowered "on a hit" and every hit is
one, so the sheet prints it. REND is Empowered only if the target already carried
a Wound, and the sheet has no idea whether it did, so REND carries nothing and the
table reads the sentence. Five moves carry no numbers at all and still ride: WOUND,
CONCUSS, MOMENTUM, SWEEP and BLEED change what the attack *does*.

Every place the sheet prints an attack now folds the riders in through one
function, `attackModifiers`, so the four of them can never disagree about what
the next swing does:

| Where | What it shows |
| ----- | ------------- |
| Block 3's attack row | a second amber line: *This attack will Wing Clip and Reckless.* |
| The use prompt | the same line as its note, above the card, and the arrow on the card |
| The quick bar chip | the raised damage, and the arrow on the card it opens |
| The Inventory tab's weapon block | the arrow and the raised damage on the card it deals |
| The card body | **nothing** — "not on the card", from the note |

That last split is the note's own and it is the right one: the card is the codex's
and says what the attack always does; the row is the sheet's and says what *this*
swing will do.

`withTrickRider` in `tricks.js` was the old single-rider version of that fold and
is gone, with a pointer left where it stood. A card cannot be printed off one kind
of rider and not the other, so there is one fold and every call site uses it.

**Lost on use** is `spendMoves`, called from the same `spendUse` the Trickster's
riders come off in, so a Duelist who ambushed and then laid a Wound loses both to
one swing. It fires when the attack is **paid for**, not when it lands. The note
says "remove on the attack land"; nothing here asks about the outcome, so nothing
here can be wrong about it, and it is the same reading `spendTricks` already
takes — what a move buys is the attempt. **Worth a ruling** if the other thing was
meant.

### The arrow

`src/components/RollArrow.jsx` is the badge the first note asked for: a green
triangle up with the number of d4s in it, a red one down, in the two colours the
words *advantage* and *disadvantage* already wear in card text. It draws in both
places the note names — under the cost orbs on a card, and on a tracker row that
is granting any.

It is a **number** because Advantage stacks (each instance is another d4), and it
**nets** because Advantage and Disadvantage cancel one for one. Two against one is
one arrow up; one against one draws nothing at all, which is the rule applied
rather than handed to the reader. Its tooltip names every source, so a 3 is
*"3 d4s of advantage on this roll — from Duelist, Wing Clip and Reckless"* rather
than a number to go and reconstruct.

Nothing in the codex grants Disadvantage on your own swing yet. The downward half
is built anyway, because the note asked for it and a renderer that understands one
direction is one that has to be found and changed the first time something needs
the other.

### AGILE moves a stat, so it moves it in `deriveStats`

"While you have a one-handed weapon in hand your Defense is increased by 1" is the
first card in the game to grant a stat for what you are **holding** rather than
what you are wearing, and it is a condition the sheet can check — the `One-Handed`
tag on the item. So `martialDefense` reads the main hand and `deriveStats` adds it,
which means swapping to a two-hander takes the point straight back off on the next
render.

The sheet's parenthesis — *"(note: if you use the swap function to go to another
non one-handed weapon you loose this bonus)"* — is therefore built rather than
printed. It was guidance to whoever built the sheet, it named a button on the
Inventory tab, and it said nothing the first sentence does not already say.

DEXTEROUS's advantage rides the same test and shows as the arrow. FOLLOW UP does
not: the sheet does not know an attack missed and never will, so its reroll is a
printed rule the table plays, and no number for it was put in the spec — a number
nothing reads is a promise the data cannot keep.

### How the transcription was proved

The same round trip every set since the Mycomancer has had: each card's `Name`,
`Tags`, `AP` and `Main Effect` rebuilt out of the codex fields and compared to the
sheet cell, quote- and whitespace-normalised. **12 of 16 comparisons match across
4 rows.** All four names, all four tag lists and every AP and WP match exactly.
All four `Main Effect` cells differ, and every difference is one of the reads
below.

| Card | Read |
| ---- | ---- |
| DEXTEROUS | "adventage" → advantage · "Martial moves" → Martial Moves · a missing space after "weapons." · "your rank in duelist.." → "your Rank in Duelist." |
| AGILE | "your defense" → "your Defense" · the implementer's parenthesis dropped and built instead |
| FOLLOW UP | "Whileyou" → "While you" · "your fist attack" → "your first attack" · "with a one-handed each turn" → "with a one-handed weapon each turn" · "that miss can be re rolled once" → "that misses can be rerolled once" |
| SHARP | "Two Martial moves" → "two Martial Moves" · "weapon attack" → "Weapon Attack", twice · "beofer" → before · "reaciton" → reaction · the implementer's Note dropped and built instead |

Every one of the spelling changes exists so a **defined term lights**, which is the
same trade WYRM BOLT's "Range Attack" made. The two dropped parentheses are both
notes to the builder rather than rules text, and both are built: AGILE's in
`deriveStats`, SHARP's across `moves.js` and the three places an attack is printed.

Three reads on the way into the move codex, for the same reason: MOMENTUM's
"Movemend Speed" reads Movement Speed, WING CLIP's "the entity Move Action cost"
reads "the entity's `{{Move}}` action cost" so the link resolves, and WOUND's
parenthesis went to `keywords.js` **word for word** as a new `wound` term. That
last is the trade BLIND and FRIGHTFUL ROAR both made: a defined term must never be
glossed in prose as well. Unlike those two, this card's own *name* is the term, and
that is allowed — Gore Armor and Vampiric Touch were reworded because their titles
collided with an unrelated stat and an unrelated range, which is a different fault
from a card named after the thing it does.

### Four things for the designer

1. **`Shield & One-Handed` is tagged `Shielded`, not `One-Handed`.** So on a
   literal reading a Duelist with a shield in the off hand gets no advantage from
   DEXTEROUS and no point from AGILE. That may well be right — the Guardian is the
   set built around a shield — but it is a reading, not a transcription. One string
   in the Duelist's `martial.weapon` if it should be both.
2. **Riders come off when the attack is paid for, not when it lands.** See above.
   One line in `spendUse` if the other thing was meant, though the sheet would then
   need to be told whether the swing hit, which it currently never is.
3. **The Guardian's moves cannot be re-chosen at a rest**, because SHIELD EXPERTISE
   does not print the sentence DEXTEROUS does. Add `swap: ['long']` to its loadout
   if it should.
4. **SHIELD EXPERTISE also grants "+1 Defense while wielding a weapon that includes
   a shield"**, and that has never been built. It is now exactly the same code path
   AGILE uses — a `martial` spec with `weapon: 'Shielded'` and `defense` — and it
   was deliberately *not* added, because it would change the Defense of every
   Guardian already on a sheet and nobody asked for that. Say the word and it is
   four lines.

### No pictures yet

No `data/Duelist/` folder arrived, so the set's plate and all fourteen move plates
are absent and every one of them draws the empty art window an unpainted card has
always drawn. The set's `art` is `null` rather than a path that is not there: the
tiles draw the picture as a CSS background and would show nothing either way, but
the summary and the presentation page use an `img` and would show a broken one.
Drop the overview picture into `data/Duelist/`, run `npm run art:cards`, and point
`art` at `/talents/duelist.jpg`.

## One action a rest, 2026-08-20

Three asks from Jules, in one pass, and they are all the same rule seen from
three sides.

> "You can only do 1 action per long rest, so if I m enchanting a new weapon I
> cannot do another one."
>
> "An enchanter should not be able to add more than 1 enchant a time at novice,
> so update that info, then add a Master talent that allow to have 2 enchant on
> the same item."
>
> "For the long rest redo the page to have a clear menu of thing you can do ...
> take long rest > Choose Long Rest Action > Change Wielder of Wonder Enchant >
> select new one > back to long rest overview (now you can see what you re doing
> here) > accept."

### The rest window is a slot now

It used to be four standing sections stacked under the plan: the work of the
camp, what you enchant, what you wear and what you prepare. Each policed its own
limit and **none of them policed the one that mattered** — a single night could
craft a potion, lay two enchantments, change what it wore and re-prepare a whole
hand. The Status & Terms tab has always said otherwise: "allows you to perform 1
Long Rest Action."

So there is one slot:

    Take a Long Rest
      What it does        · every line the rest writes, as before
      Supplies after      · the crate, as before
      Your Long Rest action
        [ + Choose your long rest action — 4 things you could do tonight ]

Opening it swaps the window to a menu of everything available tonight, grouped
by where it came from. Picking one closes the menu and raises that action's own
step; finishing the step lands back on the overview with the slot filled and the
plan rewritten. The slot then says what the action has *actually done* ("Fire
Infusion laid on Longsword"), and distinguishes that from a slot merely filled
("Nothing laid yet"), so a step closed halfway does not read as a night's work
finished.

Picking a second action gives the first one back, draft and all. So does Clear,
and so does closing the window.

### What the slot may hold

`restActions` in `rest.js` is the only place that knows, the same way
`abilitySources.js` is the only place that knows what a source is. One list, one
shape, four kinds so far:

| Kind | Where it comes from | Its step |
| ---- | ------------------- | -------- |
| `labour` | a background skill worked during a rest | the amount chips, in the menu |
| `enchant` | ENCHANTING | which item, then the shelf |
| `worn` | WIELDER OF WONDER | the body slots and their shelf |
| `prepare` | a set with a `loadout` that swaps on this rest | the set's own pool |

Every step is the very chooser its own part of the sheet already raises, writing
into the window's draft instead of into the character. A short rest names none of
the four, so it gets no slot at all and is the plain plan it always was.

### One enchantment an item, two at Master

`enchanting.perItem` is a new rank-indexed number on the set, `[null, 1, 1, 2]`,
beside `tiers` and `worn`. It is read by the shelf, by the item list, by the rank
note on the presentation page and by `layOn` itself, so a full item is refused by
the same rule in all four places. A full item can still be *changed*: stripping
and laying are one action, and the strip is offered on the item's own row.

### Three house edits to the Enchanter, and why

All three are Jules's instruction rather than a sheet, and the amended tab is
exported to `data/templates/enchanter-ability.csv` so the workbook can be brought
level. **The drop in `data/` is left exactly as it arrived.**

1. **ENCHANTING: "your Long Rest actions" → "your Long Rest action".** The plural
   was the last thing on the sheet promising two, and it contradicted both the
   glossary and the window.
2. **ENCHANTING gains a last line: "An item can hold one enchantment at a time."**
   A limit with no card saying it is a limit nobody can read.
3. **LAYERED ENCHANTMENT is new, at Rank 3.** Named out of the set's own lexicon
   the way every other card in it is, and its two sentences say only what the
   existing cards already imply about a second working: it is another night's
   labour at the same price, and the wielder carries both burdens. It also fills
   a rank that until now added no card at all.

## The one-offs, 2026-08-20

Five things, handed over in chat rather than on a tab, and one folder to hold
their pictures.

> "First: Add an Adept Enchantment 'PREPARED: You start each combat with 3
> reaction points.' 4 burden. The create en enchanted one-hand sword called
> Patien whci that enchantement, making it rare."
>
> "Second: create a 'UNIQUE SPELL - ELEMENAL - WATER' … Then make a tride (its a
> bo start with sharp damage) enchante with this special spell on it. The triden
> is also enchant with cold enhancement."
>
> "Then a special called Druidic Tome - which hte player can have on their
> utility belt. The item can be used ocne a day to auto succeed on a skill check
> related to nature."

| What | Where it landed |
| ---- | --------------- |
| PREPARED, an Adept enchantment, 4 burden | `src/lib/enchantments.js` |
| Patien, a Rare one-handed sword carrying it | `src/lib/weapons.js` (`WEAPONS`) |
| Deep Sea Accretion, the first Unique spell | `src/lib/spells.js` |
| Trident, and the Deep Sea Trident that carries the spell | `src/lib/weapons.js`, both arrays |
| Druidic Tome, a belt item | `src/lib/utility.js`, both arrays |

### PREPARED, and the one pool the bell used to empty

Nothing in the game had ever put a Reaction Point *in*. They are earned inside a
round — ANTICIPATE converts Action Points, the Avian lineage burns Health — and
the start of a fight is the one place the sheet clears them, on purpose:
`startCombat` sets them to nothing because a new fight has none earned yet.

"You start each combat with 3 reaction points" is the first thing to contradict
that, so it needed a rider rather than a sentence. `reactionAtCombat` is that
rider, summed in `grantsFrom` beside the rest and read once, at the bell, by the
new `combatReactionGrant` in `combatTurn.js`. It is capped at `reaction_max` and
can never leave a fight starting worse than it would have, which is the shape
`combatShieldGrant` already had. The Start Combat button's note reads from it, so
what the button promises is what it does.

Priced from the shelf's own two rates: 750 a point of burden in coin, 70 in
Supplies, which is what Celerity — the other burden-4 Adept — already charges.

**Three places it can come from, and they add up.** Laid on the character's own
person, running on them for the hour, and worked into something they are wearing
or holding. The third is Patien, and it needed a second reader:
`allGrants` is what is laid on the *character*, and an enchantment on a **thing**
never reached it. It never had to — the three enchanted weapons already in the
codex carry a damage type, a light and a spell, and all three of those are read
off `item.enchants` somewhere else. Patien is the first item to carry a rider
that moves a pool, so `combatReactionEffects` in `items.js` is where an item's
riders are read from now. Worn and in hand only: what is in the pack is not on
you, and a loop on the belt is reached for rather than carried into the fight.

**One gap was still open, and it is closed now.** An item carrying VITALITY or
RESILIENCE handed its wielder nothing, because `deriveStats` read only the worn and
running halves. Closing it meant changing numbers `syncDerived` bakes into stored
columns, which wanted your word first — and the stacking ruling **was** that word,
since it only means anything if a working in a ring does something. See
[the same-source law](#the-same-source-law-20-aug-2026). `characterGrants` in
`items.js` is the composed reading now, and this function is only the attribution.

### A Unique spell, and how it reaches an item

DEEP SEA ACCRETION is tagged `Unique Spell · Elemental · Water`, and none of
those three words existed before. **Unique is not a rank.** It is a spell that
lives on one item and nowhere else, and two gates already keep it out of every
pool without a line being added to either: `loadoutOptions` refuses a card whose
school is not the set's and Elemental is nobody's school, and `spellsAt` matches
the tier word, which Novice, Adept and Master do not.

What it *did* need is a working to bind it, because an item-carried spell reaches
the Abilities tab through its `enchants` entry and through nothing else (see
`gearSource` in `abilitySources.js`). So UNIQUE IMBUEMENT is new, and it carries a
`unique` flag that `enchantOptions` drops outright. Every other row a rank cannot
reach comes back marked "Adept needs a higher rank", which is true and useful; a
Unique Imbuement is not waiting on a rank and never will be.

Two edits to the words as given, and nothing else: "5 Hour" reads "5 hours", and
"each Ice Spikes consumed" reads "each Ice Spike consumed".

**Both halves say `{mind}` rather than `{stat}`**, which is the exception
`spells.js` allows rather than the rule it sets. The cap is "half your Mind" and
there is no live token for a half, so the codex writes those as the attribute's
name — DEEPENING CONNECTION already writes "half of your `{instinct}`". Having the
cap name Mind while the attack said `{stat}` would let a set that recast the spell
in Instinct build spikes against one attribute and throw them with another.

### The trident, and what its enchantments do not touch

"A bo staff with sharp damage", so the two cards are the Bo Staff's two moves with
the type changed: same reach, same Action Points, same Willpower on the sweep.
Its own cards rather than the staff's, because the type is on the card and not on
the item — reusing `bo-staff-slam` would have printed Blunt on a trident, and an
infusion on the trident would have changed what every bo staff in the game deals.
Slam is Impale here, since the thing has a point on the end now.

The Deep Sea Trident carries **two** workings, which is one more than the
Enchanter's own rule allows and the same licence GRAVE-LANTERN BLADE already takes
with three: the rule is what an Enchanter may *lay*, not what the world may
contain. Cold Infusion turns the prongs' Sharp into Cold and Empowers them, so
Impale prints `3d6` in Cold. The spell it carries is dealt **without** the item's
modifiers, on purpose, so the Ice Spikes stay Sharp: an infusion changes what the
weapon hits for, not what a spell cast through it hits for.

### Two things for the designer

1. **The Deep Sea Trident's name is not yours.** You asked for "a trident" and
   left it there, so it is named the way the codex names its other enchanted
   weapons — Cold-Infused Sword, Grave-Lantern Blade. Renaming it costs the id
   and the two art filenames and nothing else. Its rarity is a guess too: Epic,
   because Grave-Lantern Blade is Rare with three ordinary workings and this holds
   a spell no shelf stocks.
2. **UNIQUE IMBUEMENT weighs 9, level with Master Imbuement.** Burden on this
   sheet tracks what a working is worth, and a Unique spell is rarer than a Master
   one rather than stronger — Deep Sea Accretion sits around Adept for power.
   Sitting it above Master instead would put the trident past what a level-1
   character can carry at all, capacity being Level + Mind + 10, which is a real
   decision and not one to make by feel.

### The Druidic Tome says a day and tracks a rest

The sheet has no clock and no calendar: Short Rest and Long Rest are the only two
boundaries it knows. So the card prints the day you named and `recharge` is the
long one, which at a table that rests nightly is the same sentence.

No Action Points and no Willpower, the way Thief's Picks costs neither — a skill
check is not a turn. What counts as "related to nature" is the table's, which is
how every other domain on the sheet works, and the card names the same ground the
Naturalist background skill names so the two do not drift.

And the rest is what fills it. `recharge` began as a label and nothing else: the
card said the tome was spent until a Long Rest, and the dot stayed dark until
somebody remembered to tap it back on. Taking the rest now hands back every belt
use whose refill that rest is, and prints a line for each beside the pools. A
long rest fills a short-rest item because it does everything a short rest does,
and a short rest leaves a long-rest item cold: the same list that decides which
effects a rest ends. `beltRest` in `src/lib/items.js` is the whole of it, and
`rechargeRest` beside it is what reads the printed prose back to one of the two
boundaries. Anything it cannot read back to, such as a refill on the turn of a
season, is nobody's business but the table's and is left alone.

### `data/OF/` — the folder both importers walk

A one-off arrives as one thing rather than as a shelf or a set, so it has no
folder it could be named for. `data/OF/` is the folder it lands in instead, and it
is the first directory under `data/` that **both** art scripts claim.

Each places what it recognises and stays quiet about the rest:
`pull-item-art.mjs` reads the card registry only so it can tell that a card's
picture is not its business, and `pull-card-art.mjs` reads the item registry for
the same reason. A name that is neither is reported by both, which is the right
number of times for a file nobody can place. A name that is **both** — "Druidic
Tome" is, and every belt item is — is placed twice on purpose: the card plate and
the belt tile are different crops of one picture.

Drop the pictures in named for the thing they show, then run `npm run art`:

| File in `data/OF/` | Where it lands |
| ------------------ | -------------- |
| `Patien.jpg` | `public/items/patien.webp` |
| `Trident.jpg` | `public/items/trident.webp` |
| `Deep Sea Trident.jpg` | `public/items/deep-sea-trident.webp` |
| `Druidic Tome.jpg` | `public/items/druidic-tome.webp` **and** `public/cards/druidic-tome.webp` |
| `Deep Sea Accretion.jpg` | `public/cards/deep-sea-accretion.webp` |
| `Prepared.jpg` | `public/cards/prepared.webp` |
| `Trident - Impale.jpg` | `public/cards/trident-impale.webp` |

Punctuation and case are flattened before matching, so `deep sea trident.png` is
the same file. A picture redrawn under the same name replaces itself; when two
files claim one thing the newest wins and the run names the one it set aside.

### Three registries that could not carry a picture

`WEAPON_ABILITIES`, `ENCHANTMENTS` and `UTILITY_CARDS` were never wrapped in
`withArt`, because until this drop nothing in them had a picture. A file placed
for one would have shipped in `public/cards/` and been read by nothing, which is
the worst way to lose art: silently. All three are wrapped now, and
`pull-card-art.mjs` reaches them, so `Prepared.png` is placed rather than reported
as a name the codex has never heard of.

Not `LINEAGE_CARDS` or `BACKGROUND_CARDS`. Those modules hand the same object out
twice — once flattened into the registry and once on the lineage or background
itself — so wrapping the flat copy alone would give a picture to the codex and not
to the sheet. Until they are wrapped the way `talents.js` wraps its sets, a file
named for one is better reported than half-placed.

### The run's report got quieter, and on purpose

Widening the registry had a cost: an enchantment's name now resolves to a card,
so all 23 rows of the Enchantments tab started reporting "no link in the Image
column" on every run — the exact wall of noise that list is meant not to become.

A tab that carries no link **anywhere** is waiting on its art rather than missing
it, so its rows are quiet now. What still warns is a row with no link on a tab
where other rows have one, because that is a picture that went missing. Three
Enchanter rows went quiet for the same reason, correctly.

Two problems are left on a clean run, and both are real: `FOUR-LEAF CLOVER: the
codex has no card by that name` — that Ingredient was split into Lucky Clover and
Unlucky Clover on 19 Aug 2026 and the sheet still carries the old row, which is
exactly what the warning is for (`public/cards/four-leaf-clover.webp` is an orphan
from before the split and can go whenever the row does) — and `Elemental/Steam/Copy
of ADEPT SPELL - ELEMENTAL - WIND - HURL: the codex has no card by that name`,
which is the stray Steam file described under
[the Elemental school](#the-elemental-school-2026-08-20).

## The Elemental school, 2026-08-20

Twenty-nine spells, and the first school to arrive as **pictures instead of a
tab**: `data/Elemental/` holds a folder per family and a finished card render
per spell — title, banner, cost orbs and rules text baked into a 1055x1496
JPG — with two loose files at the top and no CSV anywhere. Everything below
was transcribed off the cards themselves.

Elemental is a main school now, level with Primal: same three-tag banner
(tier · school · family), same tiers, same shelves. No talent set casts from
it yet, so nothing reaches these through a loadout — but an Imbuement binds "a
NOVICE spell" with no school named, so every one of them can reach an item
from the day it exists.

| Family | Novice | Adept | Master |
| ------ | ------ | ----- | ------ |
| Fire | Produce Flame, Cloak of Flames, Kindle Weapon | Fire Seed, Molten Grasp, Wall of Flames | Blazing Suns, Cauterize, Rain of Fire |
| Water | Control Water, Create Water, Ice Armor | Drain Fluids, Flash Freeze, Tidal Wave | Glacial Accretion, Ice Block, Water Vortex |
| Wind | Air Control, Fling, Wind Blade | Hurl | — |
| Lightning | Lightning Strike | Voltaic Jolt | Galvanize |
| Magma | Slag Shot | Magma Chains | Magma Surge |
| Earth | Shape Earth | — | — |
| Steam | — | — | — |

**The eight Master rows are the first Master spells in the codex**, which is
what MASTER IMBUEMENT had been apologising for — its "no Master spells yet"
fallback retires itself with no code change, exactly as promised when it was
written.

### Every roll brought onto the two legal targets

The cards predate the ruling that a spell rolls **Mind** — an Attack against
Defense, or a Roll against **Grit** or **Reflex** — and eight of them still
rolled at something else. All eight are converted, each flagged in
`spells.js` where it sits:

| Card | The card said | Now |
| ---- | ------------- | --- |
| Rain of Fire | Mind roll against **Instinct** | Mind Roll against **Reflex** — fire out of the sky is dodged |
| Lightning Strike | Mind roll against **Instinct** | Mind Roll against **Reflex** |
| Ice Block | Mind roll against **Instinct** | Mind Roll against **Reflex** |
| Drain Fluids | Mind roll against **Physique** | Mind Roll against **Grit** — the save FORCE INEBRIATION already asks for |
| Flash Freeze | Mind roll against **Physique** | Mind Roll against **Reflex** — a sudden burst is dodged before it sets |
| Hurl | Mind roll against **Physique** | Mind Roll against **Grit** |
| Tidal Wave | **the target rolled** — Physique against your Mind | you roll: Mind Roll against **Grit**, success pushes |
| Water Vortex | **the target rolled**, with Advantage for height | you roll: Mind Roll against **Grit** at each entity's Turn Start, and the height clause turned over with it — what was their Advantage is **Disadvantage on your roll** |

**One target-rolled contest was kept on purpose.** MAGMA CHAINS' breakout —
"a Physique roll against your Mind", paid for in the target's own Action
Points — is the exact shape of CONTAINMENT SPHERE's breakout and the grappled
rule, so the designer's sentence stands.

### Four cards whose names disagree with themselves

| The codex says | Because |
| -------------- | ------- |
| CLOAK OF FLAMES | the render's title line says "PRODUCE FLAME" — a paste from the card before it. The filename and the body are a cloak |
| KINDLE WEAPON | the card's own title; the file says KINDLE WEAPONS |
| VOLTAIC JOLT | the card's own title; the file is named "ADEPT SPELL - ELEMENTAL - LIGHTNING - LIGHTNING STRIKE", which is a different card in the same family |
| MAGMA SURGE | three names on one card: the file says MAGMA SLIDE, the title says MAGAM SURGE, the banner says MAGMA. The title won with its letters put back — say the word if MAGMA SLIDE is the name it should have kept |

The CSV's Image column is what carries these mismatches, so no alias table
grew: the sheet names the file, and the file lands on the right card.

### The Wind family, and the empty Steam one

The three Novice banners print **AIR**; the folder, the Adept card (HURL) and
the codex say **WIND**. One word in three tags to turn back if AIR was the
intent.

`Steam/` holds exactly one file, `Copy of ADEPT SPELL - ELEMENTAL - WIND -
HURL.jpg` — the same Hurl card re-exported, not a Steam spell. **No Steam
spells exist yet.** The file was left where it sits and the art run names it
on every pass; delete it, or replace it with real Steam cards, and the report
goes quiet.

### Readings on record, beyond the rolls

- **"2 meters (10 feet)"** on WALL OF FLAMES (thick) reads **2 meters (6
  feet)**: the metre leads every cell in this codex and 6 feet is the
  conversion NATURALIZE already uses. NIGHTMARE WALL (tall) got the same
  reading. Say the word and they become 3 meters (10 feet) instead.
- **The Burn gloss went to the glossary.** CLOAK OF FLAMES and SLAG SHOT both
  spell it out at their foot; `keywords.js` now carries **burn** with that
  sentence word for word, and the parentheses came off both bodies.
- **Stunned stopped being provisional.** ICE BLOCK defines it at its own foot
  — "The entity cannot take Actions or Reactions until the effect ends" — and
  that sentence replaced the codex's guess, which also settles what Amber
  Shard leans on.
- **The Upkeep halves print their number.** The cards all say "you must pay
  the Upkeep amount in Willpower" under a heading like "UPKEEP 3"; the codex
  inlines the number into the sentence, the way PARASITIC SPORE prints its
  own toll. RAIN OF FIRE's "of the spell effect ends" typo went with it.
- **"Mind Range Attack"** reads **Ranged** on PRODUCE FLAME and CREATE WATER,
  the same missing letter WYRM BOLT had.
- **MOLTEN GRASP's "1.5² meters (5² feet)"** reads "1.5 square meters (5
  square feet)": a superscript is not prose.
- Smaller ones, all in the entries' own comments: "inthe" → "in the", "an
  another entity" → "another entity", "that last for" → "lasts for",
  "Any entities that enters … takes" → "Any entity entering … takes",
  "centered around yourself" → "centered on yourself" (VERDANT FIELD's
  phrasing), "each Ice Spikes" → "each Ice Spike", missing "(50-foot)" and
  "(1 minute)" conversions added where every sibling card carries them, and
  Oxford commas dropped per house style.
- **Slow Fall and Difficult Terrain are printed like defined terms and
  defined nowhere.** AIR CONTROL grants "the Slow Fall effect"; WATER VORTEX
  and MAGMA SURGE mark areas "Difficult Terrain". Both are left plain and
  belong on the statuses tab this file already asks for.

### One id had to change, again

**CREATE WATER is `create-water-spell`.** The Tidebound lineage trait already
holds `create-water` — its card is the one that says "You learn the Create
Water spell", and until this pull there was no such spell for it to mean. Same
collision RESILIENCE had, resolved the same way: the older record keeps the
id, because an id is what a saved character points at. The printed names still
collide, and now do so *by design* — the trait teaches the spell — so nothing
needs renaming, but a table will see both.

### GLACIAL ACCRETION, and the unique it rhymes with

The Master Water spell is DEEP SEA ACCRETION's learnable twin: the same
freezing aura, a fifth of the duration (5 turns against 5 hours), spikes at 2
Willpower rather than 4, and the same half-Mind cap. Both entries carry
`{mind}` on both halves for the same reason, documented on each. The trident
stays what it was — the unique is rarer, not stronger, and now it is not even
the only aura of its kind.

### How the art lands, when the art is the whole card

`pull-card-art.mjs` learned two things:

1. **School folders.** It used to claim only talent-set folders and `OF/`;
   `data/Elemental/` (and any future `Primal/`, `Arcane/`, `Nature/`) is
   claimed by name and walked into its family subfolders.
2. **The plate is cut out of the render.** A set folder's files are art; a
   school folder's files are whole cards, so `cardPlate` crops past the white
   border and stops above the banner — proportionally, so a re-render at
   another size still cuts clean. The painted cost orbs in the art's top-right
   corner survive the crop, since they sit inside the painting itself; a drop
   of art-only files would retire them, and nothing needs renaming when it
   comes.

Which card a file belongs to is the **sheet's** business: `data/Spells -
Elemental Spells.csv` names every file in its Image column, so the four
mismatched filenames above needed no alias entries, and the link pass now
skips a row whose Image is a filename rather than trying to download it.

The template is generated, not hand-kept: `templates/elemental-spells.csv` is
written straight out of `spells.js` (29 rows, ids, tags, costs, both halves,
Image filenames), and the generation run also proves every body renders with
no unspent token, every named file exists on disk, and no id in the whole
registry is duplicated.

## The named trinkets, 2026-08-20

Three card renders handed over in chat, the way Patien and the trident were:
a **special spell**, the **curse** that shadows it, and a **ring**. Asked for
in as many words — "take the cloak of nightmare and the special spell and make
them into a spell and an enchanted item in the trinket category", and "add the
ring of shrouding with a special enchantment that costs no burden."

| What | Where it landed |
| ---- | --------------- |
| NIGHTMARE WALL, a Unique spell | `src/lib/spells.js` |
| NIGHTMARE'S CURSE, a Unique enchantment tagged `Curse` | `src/lib/enchantments.js` |
| Cloak of Nightmare, an Epic trinket carrying both | `src/lib/trinkets.js` |
| SHROUDING, a Unique enchantment at 0 burden | `src/lib/enchantments.js` |
| Ring of Shrouding, a Rare trinket carrying it | `src/lib/trinkets.js` |

**The trinket shelf carries worked pieces now.** The twelve plain trinkets are
unchanged and still the point of the shelf; the two named ones prove the rule
rather than break it — what they do lives entirely in `enchants`, the field
the forge already writes, so the Magic Burden meter, the Abilities tab and the
recap read them without a line of new code. Wearing the cloak grants NIGHTMARE
WALL exactly the way holding the trident grants DEEP SEA ACCRETION.

Readings on record:

- **"SPECIAL SPELL" is a Unique Spell.** Special is not a tier this codex has;
  a spell that exists on one item and nowhere else is what Unique already
  means. Its banner keeps the card's own second word: `Unique Spell ·
  Nightmare`, no school and no family, because the card names neither.
- **The curse weighs nothing.** Burden tracks what a working is worth to its
  wielder, and a curse takes rather than gives — charging capacity for the
  affliction would price the cloak's drawback as a second power. So the cloak
  weighs its Imbuement's 9 and not a point more. The curse itself is printed
  rules the table plays: nothing on this sheet knows what sleeping is, or how
  to make one spell's damage hurt its own caster more.
- **SHROUDING's 0 burden is the designer's own number**, not a reading — "cost
  no burden" was the ask. It makes the ring the one enchanted piece in the
  codex that weighs nothing on its wearer. Both of its sentences are printed
  rules too: nothing on this sheet knows what scrying is.
- **Rarity is house-picked**, since neither card prints one: the cloak holds a
  Unique spell like the trident (Epic), the ring holds one working (Rare).
- **The cloak's name, blurb and lore are house-written** off the card art —
  the render is the curse's card, not the cloak's. Renaming Cloak of Nightmare
  means one id and nothing else, because nothing saved points at it yet.

**No art is on disk for any of the three** — the renders came through chat
rather than as files. Drop `Nightmare Wall.jpg`, `Nightmare's Curse.jpg`,
`Cloak of Nightmare.jpg` and `Ring of Shrouding.jpg` into `data/OF/` and run
`npm run art` (the first two are cards) and `npm run art:items` (the last two
are item tiles); every name resolves already.

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
out of every CSV in this folder and one level of subfolder below it, matches
each row to a card by name, downloads the picture, and writes two WebP files
into `public/cards/`:

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
everything, which is what you want after replacing an image in the sheet. A
picture that came from a **folder** needs no flag — see below.

### Two sources, one importer

Card art arrives two ways now, and the only difference is where the bytes start.

| Source | Looks like | What happens |
| ------ | ---------- | ------------ |
| **A link** | a postimg page URL in the `Image` column | followed to its `og:image`, downloaded, encoded |
| **A folder** | `data/<Set>/`, one picture per card, named for the card | encoded straight off disk; nothing downloads |

The Mycomancer's seven pictures arrived the second way on 2026-08-20 — 2400x1792
JPEGs, ~3 MB each, against an `Image` column left empty — so the importer grew a
folder pass to match the one in `pull-item-art.mjs`. It claims only folders
named for a **talent set**, leaving `data/Armor/` to the item importer and
`data/templates/` alone entirely, because templates are the importer's contract
rather than a drop.

The folder pass runs **first**, and a card it placed is never asked for a link
afterwards. That is what lets a sheet leave the `Image` column empty on purpose
without the run reporting six problems it cannot do anything about.

Two more things fall out of the folder being the original:

- **Both cuts come from it.** A downloaded card's thumbnail is cut from its
  720px copy, because the original is a download away. Here it is right there,
  so 2400 → 200 happens in one step rather than losing detail twice.
- **A redrawn picture replaces itself, with no flag.** The folder pass compares
  mtimes, so a file in `data/` newer than what was made from it is re-cut.
  `Mycomancer overivew.jpg` landed on 08-20 over a talent plate pulled from
  postimg on 08-17; skipping on existence alone would have quietly kept the old
  one. Downloads still skip on existence, because checking would cost the
  download the check is meant to save.

**One filename does not match its card.** `Sporatic Infusion.jpg` was drawn while
the card was still spelled that way; the 08-20 sheet prints SPORADIC INFUSION.
It lives in an `ALIASES` table at the top of the importer, and putting the
filename in the sheet's own `Image` column retires the entry.

**The set's own plate comes from the same folder.** A picture whose name begins
with the set's name — `Mycomancer overivew.jpg` — is the 640x640 square behind
`talent.art`, not a card. Cards are matched first, so a card that happened to
share the set's name would still be dealt as a card.

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

## The picture folders, and `npm run art:items`

Item art does not arrive as links. It arrives as a folder, which is what
`data/Armor/` is: 27 JPEGs, one per piece, named for the piece. So there is a
second importer beside the card one, and the only real difference is that
nothing downloads.

Drop the folder here, named for the **inventory shelf** it fills — `Armor/`,
and `Weapons/` or `Belt Gear/` the day either lands. Then:

```bash
npm run art:items     # the folders only
npm run art           # both importers, cards then items
```

[scripts/pull-item-art.mjs](../scripts/pull-item-art.mjs) matches each file to a
codex item by name and writes two WebP files into `public/items/`:

| File | Size | Drawn by |
| ---- | ---- | -------- |
| `<id>.webp` | 720px square, ~29 KB | the item card, whose plate is 360 wide |
| `<id>-thumb.webp` | 128px square, ~2 KB | the icon tile: 40px in every block, 52 in the equip prompt |

Then it rewrites `src/lib/itemArt.js`, which is generated and should not be
edited by hand. `items.js` wraps the **whole** codex in its `withArt`, not just
the armor, so a weapon picks its picture up the day `data/Weapons/` lands with no
further change.

**64.7 MB became 0.84 MB**, which is 77x. The originals are 2048x2048 and 2.4 MB
apiece; the biggest plate that draws one is 360 CSS pixels. The thumbnail is the
half that matters most — a codex browser draws nine tiles at once and every block
in the inventory draws one, so the tile is the commonest picture on the sheet and
the item card is the rarest.

Both sizes are cut from the original rather than the thumbnail from the 720
copy: the original is right there on disk, and 2048 → 128 in one step keeps
detail that 2048 → 720 → 128 throws away twice.

Idempotent, and `--force` re-encodes everything — which is what you want after
replacing a picture in the folder. `public/_headers` gives `/items/*` the same
day of freshness and month of stale-while-revalidate as `/cards/*`, and for the
same reason: the filename is the item's id and does not change when the picture
does.

### The five filenames that do not match

Twenty-two of the 27 matched their row on name alone, ignoring case and spacing
(`Studded leather Helm.jpg` is fine). Five did not, and each was **opened and
looked at** rather than guessed from its filename:

| Sheet name | File | Why |
| ---------- | ---- | --- |
| Greater Runed Leggings | `Greater Runed Legging.jpg` | singular file, plural piece |
| Runed Robes | `Runed Robe.jpg` | same |
| Runed Leggings | `Runed Pants.jpg` | the art calls them pants |
| Half Plate Greaves | `Half Plate Pants.jpg` | same, and the Full Plate tier says Pants in both |
| Leather Tunic | `Leather Leggings.jpg` | **not a spelling.** The file is a sleeveless leather *vest*, and the legs already have `Leather Breeches.jpg`. The torso piece is the one with no file under its own name, and this file is the garment that piece is — which is also why its id is `leather-vest`. |

Those five live in an `ALIASES` table at the top of the importer, one comment
each. **Pasting `templates/armor.csv`'s `Image` column back into the sheet
retires all five**, because a file the sheet names is read from there first.

### A folder that is not a shelf

`data/Mycomancer/` appeared on 2026-08-20 with seven pictures in it. Those are
**talent cards**, not items, so this importer does not touch them — it claims
only folders named for an inventory shelf.

They are placed now, by the other importer. `pull-card-art.mjs` grew the folder
pass this section used to say was missing: it claims folders named for a
**talent set** the same way this one claims folders named for a shelf. See "the
two sources" below.

**One directory is shared, and only one.** `data/OF/` holds one-off things, which
arrive as one thing rather than as a shelf or a set, so both scripts walk it and
each stays quiet about the other's files. See
[the one-offs](#the-one-offs-2026-08-20).

**Who sees them** is the same question and the same answer as card art: a paid
capability, `showsArt` in `src/lib/tiers.js`, applied in
`src/components/useCodexArt.js`. A `free` account keeps the rarity-tinted glyph
tile it has always had, and the item card grows no plate at all.

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

**And one term is on no tab at all.** `Constrained` is a status AMBUSH triggers on
— "the Stunned, Grappled, or Constrained status" — and the Status & Terms tab
covers the first two and has never heard of the third. Nothing was invented for
it, so it prints plain where the other two light up. `Rooted` is the closest the
glossary has; if they are the same status, the card should say Rooted. See
[the Trickster](#the-trickster-2026-08-20).

`Blinded` is the opposite case and needs nothing: BLIND defines it outright at the
foot of its own card, so that sentence is in `keywords.js` word for word rather
than provisionally.

## The item instance, 20 Aug 2026

The one missing thing named at the end of the Enchanter build, and the three
Developpement Notes asks that were waiting on it. All of it landed together
because none of it works alone.

Two new columns. **Re-run `supabase/schema.sql`.**

| Column | Holds |
| ------ | ----- |
| `trinkets` | a plain list of item ids, no ceiling |
| `forged` | `{ "forged-a1b2": { base, ench, name, art } }` — one record per made thing |

### Trinkets

A fifth block on the Inventory tab, and the only one on the site with no slot
count. Armor has three places and hands have two; a character wearing nine rings
is wearing nine rings, so it is a list with one empty place always waiting at the
bottom of it and a bare count in its head.

That is also why they are **not** in the `equipment` map: that map has one key per
place and a fixed set of keys. `normalizeTrinkets` in `items.js` owns the shape.

Twelve pieces in `src/lib/trinkets.js`, and every one of them is mundane on
purpose — four rings, three things for the neck, a cloak, a belt, a bracelet, a
circlet, a brooch. No numbers, no cards, no rules text, Common across the board.
**A trinket is the empty vessel.** Before this shelf existed every working had to
compete with a breastplate for a slot; now you wear a silver ring because it will
hold a Primal Sense, not because a silver ring is worth wearing.

The notes asked for the tab to shrink to two blocks to make room. It did not: the
grid already reflows three across, two across and one across by width, so a fifth
block costs nothing and the four fixed ones are still the player's to arrange.

### The forge

`+ Make an Enchanted Item` on the codex browser's own head, between the title and
the close, from whichever block opened it. One base piece, any number of workings,
an optional name and an optional picture. It lands in the inventory rather than on
the character, because making a ring is not putting it on.

**It is not ENCHANTING.** That card is a night's labour: gated by the Enchanter's
rank, priced at 70 Supplies a point of Magic Burden, capped at one working an item
until Rank 3, and done inside a Long Rest (`EnchantRest.jsx`, untouched). The
forge is how an enchanted item *arrives* — found, bought, awarded — so it has no
rank gate, no price and no cap. Nobody paid Supplies for the Deep Sea Trident
either, and the codex ships it with two workings on it.

What the forge does refuse is the **same working twice in one piece**: two Primal
Senses is one point of Instinct for eight points of burden, so the shelf marks the
second "Take it out" rather than selling it.

An Imbuement is asked which spell it carries, in the window that granted it, the
same way `EnchantWindow` asks. Master Imbuement still says "no Master spells in
the codex yet" and lets you make it anyway.

### The code

```
HZBD1.<base64url payload>.<checksum>
```

The payload is the base id, the workings, the name and the picture — and **no
instance id**, so pasting a code makes a *new* item to the same design. Two
players cannot be holding the same ring. A two-working named ring is about 190
characters.

The checksum is FNV-1a in base 36, and it is there so a paste that lost a
character fails loudly. Without it a truncated code still decodes, into a
different item, and nobody finds out until the table argues about a damage type.
A code carrying a working this build does not know is read anyway and says how
many rows it dropped.

Where a code appears: on the forge preview before the thing exists, on the equip
prompt (which is what clicking an inventory row opens), and on the item's own
card. `ShareCode.jsx` is all three.

A pasted `art` field that is not `http(s)` is dropped rather than rendered — a
pasted code is a stranger's data, and that field ends up in an `img` tag.

### One instance, one place

A codex id may repeat as often as the player owns copies: three healing potions
are three ids. A forged id is one *thing*, so it may sit in exactly one place —
`placementOf` in `items.js` is the check, and the browser, the equip prompt and
every writer in `useEquipSlots` all apply it. Refused rather than moved: "take it
off, then put it on" is what a hand does with a ring, and moving it would mean
every commit path lifting the id out of three other columns first.

The pack is deliberately **not** a placement. That is where a thing waits.

`+1` never appears on a made row for the same reason — a second pack entry
pointing at one instance would be two rows secretly sharing a record. A second of
those is made by pasting its code again, which mints a new instance.

`pruneForged` runs on every write out of `useEquipSlots`: a record whose thing has
been thrown away dies with it, so the column cannot grow forever and a Long Rest
never offers to enchant a ring nobody owns.

### Getting a second one

`+1` beside every row's main button in the codex browser, on every block. It was
genuinely impossible before: "Equip" already took the copy in your pack rather
than conjuring one, so there was no way at all to say "get me another". It is the
codex rather than a shop, so nothing is charged — the ledger is where coin moves.

## The same-source law, 20 Aug 2026

Jules, in as many words: *"unless they say otherwise effects don't stack from the
same source. So the instinct enchant, if you have it on two rings, it is still
only a +1. However you can have a +1 from the lineage and a +1 from the ring that
does stack. It just cannot be the same source twice."*

**One enchantment is one source**, however many things it is written into. So:

| | |
| --- | --- |
| Primal Sense on two rings | +1 Instinct |
| Primal Sense on a ring **and** on the Enchanter's own person | +1 Instinct |
| Primal Sense on a ring, and an hour of Ephemeral Primal Sense | +1 Instinct |
| Primal Sense on a ring, and a lineage that grants Instinct | **+2.** Different sources |
| Fire Infusion in the blade and Fire Infusion on the hands | Fire, Empowered by 1 |
| Decay in the blade and Lightning on the hands | Decay or Lightning, Empowered by 2 |

It is applied in exactly two places, both of them the one place their kind of sum
happens: `grantsFrom` in `enchanting.js` deduplicates the id list on the way in,
and `itemModifiers` in `weapons.js` folds each enchantment once (the damage type
already deduplicated; the Empower that rides with it now does too).

**Magic Burden is not an effect.** Two rings carrying Primal Sense weigh eight and
grant one point, because burden is what a thing *weighs* rather than what it does.
`itemBurden` never goes through `grantsFrom`.

### The gap this closed

The Enchanter build flagged one open thing: *"an item carrying VITALITY or
RESILIENCE would still hand its wielder nothing, because `deriveStats` reads only
the worn and running halves ... closing it means changing numbers `syncDerived`
bakes into stored columns, which is a bigger change than one bell-time grant and
wants your word first."*

The stacking ruling **is** that word — it only means anything if a working in a
ring does something — so the gap is closed. `characterGrants` in `items.js` is the
composed reading: the Enchanter's own body slots, what is running for the hour, and
what is worked into anything worn, held or on a trinket, with the law applied once
across all three. `deriveStats` reads it, and `syncDerived` bakes the permanent
half into the stored columns exactly as a worn breastplate is baked in.

**What counts as "on you"** was worn, in hand, and on a trinket — `wornItems`. Not
the belt and not the pack: a loop is reached for rather than carried into a fight,
and what is in the pack is not on you. That is the line `combatReactionEffects`
already drew for Patien. Burden still counted the belt, because weight and effect
are different questions. **Answered 2026-08-21 — the belt grants too.** See below.

### What moved, and one number that had been wrong

- `magicBurdenUsed` takes the character now instead of a loose `(equipment, belt)`
  pair. **Two call sites were passing no character at all** — the codex browser and
  the equip prompt, which are the two places that *refuse* an item for being over
  capacity. Neither could see the Enchanter's own body slots or a working laid on a
  blade, so both read low and let a player equip past their capacity.
- `armorSetName` and `equipmentEffects` take the character too, and resolve through
  `heldItem`: a renamed breastplate is still a breastplate, where `getItem` on a
  forged id is null and read as "no set".
- `beltEntry` and `isUsedUp` take the character, so a forged flask in a loop is not
  drawn as an empty loop with an id still stored in it.
- `combatReactionGrant` takes its *number* from `characterGrants` and only its
  *names* from `combatReactionEffects`. Summing both would brace you twice.
- `LoadoutBlock` prints `wieldModifiers` rather than `itemModifiers`, so an
  Enchanter's own Fire Infusion changes the chip on the Character tab and not only
  the one on the Inventory tab.

## Two bugs, 20 Aug 2026

**The creature's quick bar overlapped its tracker.** `.active-block > .block-head`
is sticky with a −0.9rem top margin, so it lands flush on the block's edge. The
creature's action block wears **two** heads — its own, and the tracker's
`.block-head.fx-head` halfway down — and the second was taking that negative
margin and riding 14px up over the last row of action chips, with `z-index: 2` to
put it on top. The rule is `:not(.fx-head)` now. A second sticky head would have
been wrong anyway: two things pinned to the same `top` stack on each other the
moment either list scrolls.

**Portraits cropped from the middle.** A picture that is not its frame's shape has
to lose something, and a centred crop loses half the head and half the boots. All
four now say `object-position: 50% 0` and take the boots: block 1's plate, the Lore
tab's editor, the creature's plate and the creature's editor, plus the dashboard
card. Faces are at the top of pictures of people — the same reason
`.talent-summary-art` has biased upward since it was written.

## The Feral Curse, 2026-08-20

Four cards on the `Ability` tab, a `Developpement Notes` tab of one paragraph
describing a whole new kind of block, no `Overview` tab and no picture folder.
Plus an ask in chat, which is the part that makes this set different from every
other one in `data/`:

> "now I need you to do the feral curse i had, yo uare in charge of making hte
> overview and extrapolating ability for the feral curse at rank 2 and 3 at rank
> three there need to be soemtihgn that allow amrital move as reaciton to do two
> at once."

So **half of this set is house-written**, and which half is marked in the data
rather than described here: the four Rank 2 and Rank 3 cards carry `house: true`
in `talents.js`, the same flag the eight house-written Martial Moves wear in
`martial.js`, and `data/templates/feral-cursed-ability.csv` has a `Source` column
saying `sheet` or `house` for every row. That flag is the list of what to
overwrite the day a sheet arrives for them.

| Rank | Cards | Whose |
| ---- | ----- | ----- |
| 1 · Novice | Feral Form, Feral Rage, Beast Within, Bestial Sense | the sheet's |
| 2 · Adept | Feral Hide, Call the Beast | house |
| 3 · Master | Bestial Frenzy, Beast and Drifter | house |

Instinct throughout, house-assigned: FERAL RAGE rolls it, BESTIAL SENSE is the
five senses, and both Claws & Teeth cards are Instinct attacks. Tags guessed as
"Martial, Defense, Instinct" — Defense because the form is bought in Shield and
thickened in Armor, which is the only reason a transformation costing half your
blood is worth making.

### What the four Rank 1 cards actually say

Worth reading them together, because two of them are stranger than they look.

**FERAL FORM** is a trade and a clock. Half your *current* Health for twice as
much Shield, and the Shield is the timer: "you remain in your Feral Form until all
Shield is gone or you take a Short Rest." In exchange you get advantage on every
attack roll and a die on your teeth, and you lose your items, your spells and
every ability that is not this set's.

**FERAL RAGE** is the one nobody expects. It fires on losing Health or spending
Willpower, and it lets a Feral Cursed **choose to fail** the roll — with nothing
anywhere on the card letting them choose to pass it. At Rank 1 the beast can only
be refused, never called. And refusing it makes it *harder* to reach next time:
"on a failure the difficulty increase by 1 for your enxt roll", resetting to 8
only when a transformation happens. So restraint is rewarded with a quieter beast
and a worse chance of having it when it is wanted. That hole is what CALL THE
BEAST was written to fill, and it is the single most interesting thing on the tab.

**BEAST WITHIN** is a Martial Move pool with a mouth. Same count and same ladder
the Duelist's DEXTEROUS prints, off a different set's card, so it hangs on the
`loadout` spec with no new code:

| Set | Rank 1 | Rank 2 | Rank 3 | Tiers |
| --- | ------ | ------ | ------ | ----- |
| Feral Curse (2 + rank) | 3 | 4 | 5 | Novice → +Adept → +Master |
| Duelist (2 + rank) | 3 | 4 | 5 | Novice → +Adept → +Master |
| Guardian (1 + rank) | 2 | 3 | 4 | Novice → +Adept → +Master |

It prints the swap sentence DEXTEROUS prints, so it carries `swap: ['long']` and
appears in the long rest window's action list. A Feral Cursed and a Duelist in the
same character have **two** allowances out of one pool, which is the literal
reading and the same one the Guardian/Duelist pair already gets.

**BESTIAL SENSE** is one sentence and needed a verb.

### The four house-written ones, and why each exists

Every name is built out of the set's own words — Feral, Bestial, Beast, Rage —
because that is the convention the Guardian and the Mycomancer set and the one
thing an extrapolation must not break. None of them invents a status: Armor,
Shield, advantage, Empowered and Short Rest are all in the glossary already.

**FERAL HIDE** (Adept, Passive) — *"While you are in your Feral Form, your Armor
is increased by half your Instinct, rounded down."* The form's clock **is** its
Shield, so a card granting more Shield would buy a longer fight rather than a
better one. Armor is the same effect said the other way round, since every hit
then costs the clock less, and it is a number the sheet already knows how to hold
— `deriveStats` reads it, so the Armor tile moves the moment the form does and
moves back on the render the Shield empties.

**CALL THE BEAST** (Adept, Ability, 1 AP / 2 WP) — the beast called instead of
refused, with the Feral Rage difficulty reset to 8. It exists because FERAL RAGE
leaves no way to pass a roll on purpose, which is a hole and not a flourish. The
Willpower is not decoration either: "whenever you lose Health or spend Willpower,
you have a chance to transform" is the set's own trigger, so paying Willpower to
force what Willpower already risks is this card agreeing with the one above it.

**BESTIAL FRENZY** (Master, Passive) — the card that was asked for by name.
*"You can now use two Martial Moves on the same Weapon Attack, or use one Martial
Move just before a Weapon Attack reaction."* That is SHARP's text, **deliberately
unchanged**: two cards that move the same allowance have to say it the same way,
or a table reading one of them will assume the other does something else. It is
also the same two spec keys — `martial.perAttack` and `martial.onReaction` — so
the rule stayed parsed out of a card exactly once. A character holding a Master
Duelist *and* a Master Feral Cursed gets **two, not three**: `moveAllowance` takes
the highest rather than summing, because each card raises the same allowance
rather than adding one of its own.

**BEAST AND DRIFTER** (Master, Passive) — the form stops locking your own
abilities and spells away, and keeps locking items away. It answers the sentence
on FERAL FORM that costs a Feral Cursed most, and answers two thirds of it: a paw
is the reason items were locked, and mastering a curse does not give you thumbs.

### The form is a state, not a card

`src/lib/feral.js` is new and is written the way `minions.js` was, for the same
reason the Draconic Bond's notes gave: a set's spec describes, a resolver
resolves, and `talents.js` stays a leaf. Everything in the spec is a card's own
sentence:

| The card | The spec |
| -------- | -------- |
| "you lose half your current Health and gain twice as much Shield" | `enter: { spend: 0.5, gain: 2 }` |
| "until all Shield is gone or you take a Short Rest" | `ends: 'short'`, and the Shield read off the character |
| "a difficulty of 8 … increases by 1 … resets to 8 on a transformation" | `rage: { base: 8, step: 1 }` |
| "advantage on all attack rolls" | `advantage: 1` |
| "your Claws & Teeth attacks are Empowered by 1" | `empower: { weapon: 'Natural', label: 'Claws & Teeth', amount: 1 }` |
| "unable to use items, non-Feral Curse abilities or spells" | `locks: { items: true, foreign: true, tag: 'Feral Curse' }` |
| BEAST AND DRIFTER | `opens: [null, null, null, { foreign: true }]` |
| FERAL HIDE | `armor: [null, 0, 0.5, 0.5]` |
| CALL THE BEAST | `willing: [null, false, true, true]` |
| "you choose a Carnivore Mammal" | `beasts.options`, eight of them |

**The clock is the Shield pool.** Not a counter and not a duration on the tracker:
the card says "until all Shield is gone", so being in the form is `on && shield > 0`
and the sheet only has to look. Nothing ticks, and an attack that eats the last of
the Shield ends the form on the very next render with no press and no write — the
Armor from FERAL HIDE comes off in the same frame, the belt unlocks in the same
frame, and the block says "Spent".

Storage is one `feral` jsonb column keyed by the set:
`{ "feral-curse": { beast, name, portrait_url, dc, on } }`. **Re-run
`supabase/schema.sql`** or the column is dropped from writes with a console
warning.

### One block, and what is not on it

"The feral curse add a new block, which is the feral form block … The feral form
blcok o nthe caracter sheet as Image with name of the beast. A tracker that show
you the DC you are at, a button that you can click to increment the DC as you
succed your roll and a transform button that make the proper changes to your
hcaracter as you transform such as lossing health gaining shield."

**One** block, where a creature gets two. A creature needed two because it has a
stat block *and* a turn to spend; a form has neither — its stats are the
character's own, bent, and it spends the character's points. What it needs is the
picture, the difficulty, the clock and three presses, and that fits one 360x640
cell with room left over. `normalizeBlockOrder` takes `feral:<set>` the same way
it already took the two minion ids, so the block moves in the arranger like any
other and the arrangement follows the sheet.

It borrows the creature block's identity row wholesale — `.minion-id`,
`.minion-plate`, `.minion-name`, `.minion-chip` — and that is deliberate. A
picture of a thing you turn into and a picture of a thing standing beside you are
the same 72px square, and two blocks that draw the same row two ways is how two
blocks drift apart.

**The starter Martial Moves the note asks for are not on it.** They are a
`loadout`, so they are chosen in the panel every other picked hand on this sheet
is chosen in: on the Abilities tab, and on the set's own block on the Advancement
tab. A second chooser built for one set would be the one place the sheet asked for
a hand differently.

**The Shield bar on it is a readout.** It is the same pool block 2 draws and moves
through the ledger; this block's claim on it is only the sentence about what
emptying it does, so it has no click.

### The difficulty button says the opposite of the note

The note asks for a button that increments the difficulty **"as you succed your
roll"**. FERAL RAGE says the increase is on a **failure**. The card wins, and the
button is labelled in the card's own terms — *"Held it in, +1"* — because that is
what a failed roll means here: you did not transform. If the note is right and the
roll is a *resistance* roll, the label is one string and the reading flips.
**Worth a ruling.**

The roll itself is never asked for. Same law every other die on this sheet keeps:
the sheet is told that Health moved and never what moved it, so a sheet that asked
for a Feral Rage roll would ask on every scratch.

### Two ways in, one write

`enterFormBody` lives in `combatBar.js` beside `spendUse`, and both ways into the
form go through it — the block's Transform button, and CALL THE BEAST on the quick
bar, which pays its printed Action Point and Willpower and carries the
transformation as its `extra` so the whole thing is a single write. A form entered
one way is therefore identical to one entered the other, including the Feral Rage
reset, which is FERAL RAGE's own next sentence and has nowhere left to be
forgotten.

Health and Shield both move through the **ledger**, because every other movement
of either on this sheet is logged and this is the largest one a character will
ever make on purpose. The lines read *"Feral Rage: the price"*, *"Feral Rage: the
hide"*, *"Call the Beast: the hide"* and *"Feral Form ended"*.

Ending it takes the Shield with it — "there is a butto to end trnasformation that
also remove all shield" — so the button says how much it is about to throw away
before it does.

### The locks, and what "items" means

FERAL FORM forbids "items, non-Feral Curse abilities or spells", and the quick bar
now refuses those chips rather than hiding them, wearing the reason. That is the
same call the belt already makes for an empty flask and the Martial Move allowance
makes for a full tracker: a card that has quietly vanished reads as a bug, one
wearing the reason reads as a rule.

| Group | In the form |
| ----- | ----------- |
| In Hand | **allowed.** A weapon is wielded, not used — and the Empowered die lands here |
| On the Belt | refused, *No hands*. The belt is where this sheet uses an item |
| Bound In | refused. Somebody else's spell, out of an item: both locks at once |
| The set's own block | allowed |
| Its Martial Moves | **allowed**, and this needed care — see below |
| Any other set, lineage or gear | refused, *Not in form*. Unless BEAST AND DRIFTER |
| Basic Actions | **never refused.** A wolf still moves, hides and shoves |

**"items" is read as the belt.** Armor is worn and a weapon is wielded; a loop is
reached for, and it is the only place this sheet lets you *use* an item. A stricter
reading is available — paws cannot hold a sword either, so a Feral Cursed with a
longsword equipped could not attack at all — and it was not built, because it would
make the set unplayable for anybody who had not equipped Claws & Teeth first.
**Worth a ruling.**

**A Feral Cursed's Martial Moves are tagged `Martial Move, Novice` and never with
the set's own word**, so a tag test alone would have refused the very cards BEAST
WITHIN says the beast fights with. So `passesForm` checks the *set* the block
belongs to as well as the card's tags, off the quick bar's own source id
(`talent:feral-curse`, `loadout:feral-curse`). A **Duelist's** copy of the same
move is still refused, which is the literal reading and a good one: it was trained
for a blade.

### The advantage reaches every attack, because there is only one kind left

"Advantage on all attack rolls" is folded into `attackModifiers`, which runs for
weapon attacks. That is not a shortcut — inside the form a weapon attack is the
*only* attack there is, since the same card forbids spells and every ability that
is not this set's. The one gap is a Master who has taken BEAST AND DRIFTER and can
attack with a spell again: that attack roll does not get the arrow. **One line in
`feralRiders` if it should.**

The arrow itself credits the set by name, so a Feral Cursed's Claws - Shred reads
*"1 d4 of advantage on this roll — from Feral Curse"* and prints `2d6 + 8` where
the card prints `1d6`.

### How the transcription was proved

The same round trip every set since the Mycomancer has had: each card's `Name`,
`Tags`, `AP` and `Main Effect` rebuilt out of the codex fields and compared to the
sheet cell, quote- and whitespace-normalised. **15 of 20 comparisons match across
the 4 transcribed rows.** All four tag lists, every AP and WP, and three of four
names match exactly. The five differences are each one of the reads below.

| Card | Read |
| ---- | ---- |
| FERAL FORM | "Advantage" → advantage, the glossary's own casing · "your Teeth & Claws attack are Empowered by 1" → "your **Claws & Teeth** attacks" · "non-freal curse abilities or spells" → "abilities and spells that are not Feral Curse ones" |
| FERAL RAGE | "loose health" → lose Health · "change" → chance · "int" → into · "diffuclity" → difficulty · "enxt" → next · "increase" → increases · the last two sentences were run together and are set as two |
| BEAST WITHIN | "whci hyou" → "which you" · "tooth and claw" and "Tooth & Claw" → **Claws & Teeth** · "your rank in Feral Cursed.." → "your Rank in Feral Curse." · "Martial moves" → Martial Moves · two double spaces closed up · the implementer's parenthesis dropped and built instead |
| BESTIAL SENSE | **the card's own name**: "BEATIAL SENSE" → Bestial Sense · "You Advantage on Skill Checks" → "You have advantage on Skill Checks" |

The name correction is the only one in the set and carries no risk, because the id
`bestial-sense` is new and nothing has ever pointed at the other spelling. Every
other change exists so a **defined term lights** rather than sitting in the
sentence as plain text, which is the same trade WYRM BOLT's "Range Attack" made.

**Claws & Teeth is bolded and not linked.** Every other `{{double brace}}` in the
codex names a *card*, and `getCard` resolves a card id or a printed card name, so
`{{Claws & Teeth}}` would have been the only dead link in 252 cards — the weapon's
own two cards are Claws - Shred and Teeth - Bite, and neither of them is what those
sentences are about.

### Five things for the designer

1. ~~**"Gain twice as much Shield" runs straight into the Shield cap.**~~
   **Answered on 2026-08-21. See "The ceiling comes off" below.** Shield capped at
   half your maximum Health, and half your *current* Health doubled is exactly
   that cap when you are at full Health, so a full-Health transformation paid 60
   and received 60 rather than 120: break even, plus the advantage and the die.
   BESTIAL SENSE now raises the ceiling to the whole of maximum Health, so the
   doubling pays.
2. **A weapon slot that "permanently beomce tooth and claw" is not built**, and it
   contradicts BEAST WITHIN's own previous clause: a slot that always holds the
   weapon is a pair of hands that is never empty. What *is* built is the tag, so
   the Empowered die lands on Claws & Teeth whichever hand it is in and whoever
   put it there. Say which of the two sentences wins.
3. **Three spellings for one weapon appear on the tab** — "Teeth & Claws",
   "Tooth & Claw" and "tooth and claw" — and the codex's own name is
   `Claws & Teeth`. All three were set as that. Renaming the item is a one-line
   change in `weapons.js` if the set's spelling should win instead.
4. **The difficulty climbs on a failure, not a success.** See above. The note and
   the card disagree and the card won.
5. **A spent form whose Shield is restored by somebody else reads as running
   again.** "Until all Shield is gone" is read as a *state* rather than an event,
   so a Guardian's Shield laid on a Feral Cursed whose hide had just run out puts
   them back in the form. The other reading — the form ended and stays ended — is
   one line in `feralState`. Both are defensible; this one is what the sentence
   says.

### No pictures yet

No `data/Feral cursed/` folder arrived, so the set's plate and all eight card
plates are absent and every one of them draws the empty art window an unpainted
card has always drawn. The set's `art` is `null` rather than a path that is not
there, for the reason the Duelist's is. Drop the overview picture in, run
`npm run art:cards`, and point `art` at `/talents/feral-curse.jpg`.

## The belt grants, 2026-08-21

> "Items that go on the belt should be able to be enchanted."

They already could. The Long Rest's ENCHANTING window has always offered every
loop, the forge has always taken a flask as a base, and the Magic Burden meter has
always charged for the working. What a loop could not do was **anything with it**:
`gearEnchantIds` read `wornItems`, which is the body and the hands, so a Vitality
laid on the potion on your hip cost 280 Supplies and 4 Magic Burden and handed over
nothing at all. The same working on a ring is 20 Health. That is the gap the
sentence closes, and the meter had already settled the principle it closes it by:
worked magic weighs the same wherever it is carried, so it works wherever it is
carried too.

### The line that moved

`carriedItems` in `items.js` is the new reading — worn, in hand, on a trinket, and
**on the belt**. Three things read it:

| | reads | so that |
|---|---|---|
| `gearEnchantIds` | `carriedItems` | a working on a loop reaches `deriveStats` |
| `combatReactionEffects` | `carriedItems` | the bell can name the flask that gave the Reaction Points, not only count them |
| `workings` in `combatBar.js` | `carriedItems` | the standing-effects block lists it, so it is written somewhere |

`wornItems` stays exactly what it was and keeps its other three callers, because
an item's **own** numbers are a different question: a breastplate's Defense and a
Runed Hood's Shield at the bell are true of a thing you are wearing, not a thing
hanging off your hip. Only what is *worked into* a thing travels to the belt.

**Still not the pack.** That is the line that stayed. A spare dagger can be
enchanted tonight at the fire and does nothing until it is drawn, the same as a
breastplate nobody has put on — so the rest window's list is deliberately one item
wider than the sum: `enchantableItems` in `EnchantRest.jsx` includes the pack,
`carriedItems` does not.

### The stacking law is untouched, and this is where it shows

| what | grants |
|---|---|
| Vitality on the loop | +20 Health |
| Vitality on the loop, and Vitality on a ring | **+20.** One working, two things |
| ...and it weighs | **8.** Burden is what a thing weighs, not what it does |

The second row is `grantsFrom` deduplicating on the way in, as it always has —
nothing about it had to know a belt exists. See *The same-source law* above.

### One line on the loop

A worked loop now prints what is in it, under the tags: the enchantment's **name**
and nothing more (`.belt-working`). The trinket block prints the effect text too,
because a trinket has no numbers of its own and that line is its whole worth — a
loop already carries a name, its tags, its cost orbs and its charge dots, so the
effect stays on the ⓘ card. Same trade an enchanted weapon makes with its blurb.

## The ceiling comes off, 2026-08-21

> "Bestial sense passive should also have an effect that read 'Your maximum shiled
> is now equal to your healht isnteado half'. Update it and make it work so the
> feral curse shied is correct."

This answers the biggest open question the set shipped with, and it answers it on
the card the designer named rather than as a hidden exception for one talent set.

### What the question was

FERAL FORM buys Shield with blood: "you lose half your current Health and gain
twice as much Shield." Twice half of what you are holding is all of what you are
holding, and the Shield pool ceilinged at **half** maximum Health. So a Feral
Cursed at full Health paid 50 and received 50 rather than 100: break even, and the
one transformation the set is built around was the one that paid worst.

### What the card now says

| | |
| --- | --- |
| Transcribed | "You have advantage on Skill Checks related to using your 5 senses." |
| Added | "Your maximum Shield is now equal to your Health instead of half of it." |

The second sentence is **not on the tab**. It is the only addition in the set and
the first one in the codex: every other card is a transcription, and the eight
Rank 2 and Rank 3 cards that are not transcriptions are whole cards wearing
`house: true`. A card that is half transcribed and half amended is neither, so it
carries no flag and is recorded here instead.

### What it does to the arithmetic

At 100 maximum Health, at full Health, entering the form:

| | before | now |
| --- | --- | --- |
| Health paid | 50 | 50 |
| Shield owed | 100 | 100 |
| Ceiling | 50 | **100** |
| Shield received | 50 | **100** |
| What the ceiling ate | 50 | **nothing** |

The ceiling still bites for a Feral Cursed who transforms with Shield already on
them, and the block and the chip still say what it took. That case is honest
arithmetic rather than a rule fighting itself: you cannot be handed a hundred into
a pool holding eighty.

### Where it lives

One key and one line, which is what the open question said it would be.

| | |
| --- | --- |
| `feral.shieldShare` in `talents.js` | `[null, 1, 1, 1]`. The share of maximum Health the pool ceilings at, indexed by rank the way `armor` and `willing` are |
| `feralShieldShare` in `feral.js` | the highest share any set grants, or 0. Reads `feralState` and **not** `running`: this is a Novice passive, not something the hide does |
| `shieldShareFor` in `characterModel.js` | `Math.max(0.5, ...)`, so "instead of half" replaces the half rather than stacking on it, and a set that says nothing costs nothing |

Three consequences worth knowing:

1. **The ceiling is up before the first transformation and stays up after the
   last.** The card never mentions the form, so neither does the code. A Feral
   Cursed out of their hide still holds a Shield pool the size of their Health,
   and anything else that grants Shield can fill it.
2. **Every reader moved at once**, because they all already went through
   `shieldCapFor`: the Character tab's bar, the Shield ledger's ceiling, the
   Feral Form block's clock, the Trickster's STEAL and the bell's Runed Hood.
   `syncDerived` keeps the `shield_max` column on the new number too.
3. **The Supreme Runed set still adds Mind on top**, because that is a worn bonus
   and this is the base share. A Feral Cursed in the full set caps at maximum
   Health plus Mind.

## A body slot costs no Magic Burden, 2026-08-21

> "The enchanter "Wielder of Wonder" enchantment on his body should not cost Magic
> Burden. Fix it please and make sure the card text match if needed."

A ruling on the reading recorded above, and it goes the other way. WIELDER OF
WONDER names no price at all, and the sheet had been filling that silence the
ordinary way: an enchantment weighs, so a worn one weighs. It does not. The card's
own first sentence is the reason, and it was there the whole time: the enchanter
body **withstands** the power of enchantments onto itself. What the body holds is
withstood rather than carried.

That makes two of the set's three cards free of burden rather than one. Only
ENCHANTING, the card that lays on a *thing*, costs anything, and the thing is what
carries it.

### What the card now says

| | |
| --- | --- |
| Transcribed | "The enchanter body is able to withstand the power of enchantments onto itself. Enchantments apply to your person. Choose one when becoming an enchanter, you can change it during a Long Rest. The amount of such enchantments you can have is equal to your rank in enchanter." |
| Added | "These do not count toward your Magic Burden." |

Worded out of EPHEMERAL ENCHANTMENT's own line for the same rule, so the set says
its one free thing one way rather than two. Exported back out to
`data/templates/enchanter-ability.csv` beside LAYERED ENCHANTMENT's two sentences,
so the workbook can hold the same words.

### What it does to the meter

A Rank 2 Enchanter wearing Primal Sense and Vitality, carrying a Fire Infusion
blade:

| | before | now |
| --- | --- | --- |
| Primal Sense, worn | 4 | **0** |
| Vitality, worn | 4 | **0** |
| Fire Infusion, on the blade | 4 | 4 |
| The meter | 12 / 22 | **4 / 22** |

Nothing else about a worn enchantment moved. It still grants what it grants, it is
still permanent, `syncDerived` still bakes it into the stored columns, and it still
reaches the weapon in their hands.

### Where it lives

| | |
| --- | --- |
| `magicBurdenUsed` in `items.js` | the one line that added the body slots, now gone. Only what is *carried* weighs: worn, held, on a trinket or clipped to the belt |
| `enchanting.js` | no total in the file carries a burden any more. `noGrants`, `grantsFrom` and `allGrants` all lost the field, and `wornGrants` went with it: the meter was its only caller |
| `combatBar.js` | the recap's Wielder of Wonder rows spent their provenance on the burden each one cost. There is nothing left there to say, so they print their name and what they do |
| `WornEnchants.jsx` | a filled slot led with its burden and does not now. The shelf prints a price only where there is one, and its rule line says "No Supplies and no Magic Burden" once instead |

Two things that did **not** move, both because burden is what a *thing* weighs:

1. **A working laid on an item still weighs**, at its full value, on the item.
   `itemBurden` was always the counter for that and is untouched.
2. **The same working on two rings still costs twice.** The same-source law says
   an effect does not stack with itself, and it never governed burden: two rings
   grant one point of Instinct and weigh 8. `grantsFrom` deduplicates and
   `itemBurden` does not, which is exactly the split that was always there.
