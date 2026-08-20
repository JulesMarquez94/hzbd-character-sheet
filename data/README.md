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
| Talent Set · Enchanter · Ability, amended | **2026-08-20, 4 cards** (3 on 08-19) | `src/lib/talents.js`, exported to `data/templates/` |

`templates/` holds the current state of each, exported back out in the sheet's
own column order. `primal-spells.csv` holds the 24 Primal spells and nothing
else: the codex also carries one Arcane spell, Containment Sphere, which no
sheet covers yet. `draconic-bond-overview.csv` and `enchanter-ability.csv` are the two tabs that were written
here rather than exported, so they are tracked: a clone would otherwise lose the only copy.
`cauldron-keeper-ingredients.csv` carries an extra **Sheet AP**
column beside the live one, so the Catalyst balance pass below reads as a diff
rather than a claim, and `enchantments.csv` carries what each one costs to lay and
what its sentence was turned into mechanically. Diff a fresh download against those to see exactly what
changed before asking for a pull.

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
| Making an enchanted item: pick an item, apply an enchantment, carry more than one | **in**, at a Long Rest. Any number per item |
| Naming one | **out.** Needs an item instance |
| Sharing one by code, and adding one by code | **out.** Same reason |
| A Trinket block, and the Inventory tab shrinking to two blocks for it | **out** |
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
| WIELDER OF WONDER | `worn: ['primal-sense']` | permanent, as many as your rank |
| ENCHANTING | `laid: { longbow: ['fire-infusion'] }` | permanent, 70 Supplies a point of burden |
| EPHEMERAL ENCHANTMENT | an `effects` row carrying `ench` | one hour |

**The split between those is the whole design.** `worn` and `laid` are gear:
`deriveStats` reads them and `syncDerived` bakes them into the stored columns
exactly the way a worn breastplate is baked in, and they cost Magic Burden.
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
  and reads the way a Mycomancer's spell swap reads.
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

### What is still not built

**An item instance.** `laid` is keyed by item *id*, so two longswords are one
longsword and an enchantment laid on one is laid on both. Lifting that is what the
last of the Developpement Notes' asks need: **naming** an enchanted piece, and
**sharing one by code** with another player. Both were left out rather than faked,
because a share code for a thing with no identity of its own has nothing to point
at.

Also still out: the **Trinket block** the notes ask for, and the two blocks the
Inventory tab would shrink to in order to make room for it.

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

**And it weighs once.** A worn enchantment costs Magic Burden as *worn*, never once
per weapon held, so the meter reads 8 for a character wearing one and carrying a
laid one, not 12 for the same character holding two weapons. The meter was also
leaving the body slots out entirely and now counts them: WIELDER OF WONDER never
says its enchantments are free of burden, where EPHEMERAL ENCHANTMENT says exactly
that of its own.

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
| "at level one it has 5 Physique, 4 Instinct, 6 Mind" | `base: { physique: 5, instinct: 4, mind: 6 }` |
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
**talent set** the same way this one claims folders named for a shelf, and the
two never reach for the same directory. See "the two sources" below.

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
