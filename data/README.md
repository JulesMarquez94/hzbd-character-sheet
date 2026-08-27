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
| Talent Set · Trickster · Developpement Notes | **2026-08-20, the pending rider and the steal table** | `src/lib/tricks.js`, `combatBar.js`, `StealWindow.jsx` |
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
| General Rules · Skills | **2026-08-21, 32 skills** | `src/lib/backgrounds.js` (`SKILLS`) |
| Skill art, from `Skills/` and `Background/Skills/` | **2026-08-21, 30 of the 32** | `public/cards/` + `src/lib/cardArt.js` |
| Background art, from `Background/` | **2026-08-21, 10 plates** | `public/backgrounds/` |
| The ten backgrounds and the purse formula | **2026-08-21, named in chat** | `src/lib/backgrounds.js` (`BACKGROUNDS`) |
| Two attribute points at every odd level | **2026-08-21, ruled in chat** | `src/lib/levelPicks.js` (`raised`) |
| Talent Set · Berserker · Overview and Ability | **2026-08-23, 1 set + 9 cards** | `src/lib/talents.js` (`TALENTS`) |
| Talent Set · Berserker · Developpement Notes | **2026-08-23, 20 rows of adaptation** | [the Berserker](#the-berserker-2026-08-23) |
| Berserker art, from the `Berserker/` folder | **2026-08-23, 9 cards + 1 plate** | `public/cards/`, `public/talents/` |
| The talent wall, shelved by attribute | **2026-08-23, asked for in chat** | `src/lib/talents.js` (`TALENT_CATEGORIES`) |
| Talent Set · Colossus · Overview and Ability | **2026-08-23, 1 set + 7 cards** | `src/lib/talents.js` (`TALENTS`) |
| Talent Set · Colossus · Developpement Notes | **2026-08-23, a whole weapon category** | `src/lib/weapons.js`, 4 weapons + 8 cards |
| Colossus art, from the `Colossus/` folder | **2026-08-23, 7 cards + 1 plate** | `public/cards/`, `public/talents/` |
| The ten missing weapon types, off `Source Temp/` | **2026-08-24, 10 weapons + 20 cards** | `src/lib/weapons.js`, `itemParts.jsx` |
| The weapon table, handed over in chat | **2026-08-24, the whole wall rebuilt: 39 weapons + 78 cards** | `src/lib/weapons.js`, `items.js`, `statMath.js`, `moves.js`, `talents.js` |
| The wall read back, nine rulings in one message | **2026-08-24, the card face, the magazine and the tags** | [the card face](#the-card-face-the-magazine-and-the-tag-pass-2026-08-24) |
| Talent Set · Arcanist · Ability | **2026-08-24, 4 cards** | `src/lib/talents.js` (`TALENTS`), `src/lib/loadouts.js`, `src/lib/spellbook.js` |
| Talent Set · Arcanist · Overview | **2026-08-24, written here off the designer’s superseded Overview tab** | `src/lib/talents.js` (`tagline`, `blurb`) |
| Arcanist art, from the `Arcanist/` folder | **2026-08-24, 4 cards + 1 plate** | `public/cards/`, `public/talents/` |
| Spells · Ethereal · Light | **2026-08-25, 13 spells** | `src/lib/spells.js` (`SPELLS`) |
| Ethereal art, from the `Ethereal/` folder | **2026-08-25, 13 plates** | `public/cards/` + `src/lib/cardArt.js` |
| Spells · Ethereal · Shadow | **2026-08-25, 12 spells** | `src/lib/spells.js` (`SPELLS`), `keywords.js` |
| Shadow art, from the `Shadow/` folder | **2026-08-25, 12 plates** | `public/cards/` + `src/lib/cardArt.js` |
| Spells · Ethereal · Time | **2026-08-25, 12 spells** | `src/lib/spells.js` (`SPELLS`), `keywords.js` |
| Time art, from the `Time/` folder | **2026-08-25, 12 plates** | `public/cards/` + `src/lib/cardArt.js` |
| Spells · Ethereal · Spacial | **2026-08-25, 12 spells** | `src/lib/spells.js` (`SPELLS`) |
| Spacial art, from the `Space/` folder | **2026-08-25, 12 plates** | `public/cards/` + `src/lib/cardArt.js` |
| Spells · Primal · Death | **2026-08-26, 11 spells** | `src/lib/spells.js` (`SPELLS`), `keywords.js` |
| Death art, from the `Death/` folder | **2026-08-26, 12 plates** | `public/cards/` + `src/lib/cardArt.js` |
| GORE SPIKE, the blank twelfth row, handed over in chat | **2026-08-26, 1 spell** | `src/lib/spells.js` (`SPELLS`) |
| Spells · Primal · Flora, the Master rung | **2026-08-26, 4 spells** (8 on 08-19) | `src/lib/spells.js` (`SPELLS`) |
| Flora art, from the `Flora/` folder | **2026-08-26, 4 plates** | `public/cards/` + `src/lib/cardArt.js` |
| Spells · Primal · Wild, the Master rung | **2026-08-26, 4 spells** (8 on 08-19) | `src/lib/spells.js` (`SPELLS`) |
| Wild art, from the `Wild/` folder | **2026-08-26, 4 plates** | `public/cards/` + `src/lib/cardArt.js` |
| Spells · Primal · Life, the Adept and Master rungs | **2026-08-26, 8 spells** (4 on 08-19) | `src/lib/spells.js` (`SPELLS`) |
| Life art, from the `Life/` folder | **2026-08-26, 8 plates** | `public/cards/` + `src/lib/cardArt.js` |
| Spells · Elemental · Earth | **2026-08-26, 8 spells** (1 on 08-20) | `src/lib/spells.js` (`SPELLS`) |
| Earth art, from the `Earth/` folder | **2026-08-26, 9 plates** (SHAPE EARTH redrawn) | `public/cards/` + `src/lib/cardArt.js` |
| Fire art, from the `Fire/` folder | **2026-08-26, 9 plates**, all redraws | `public/cards/` + `src/lib/cardArt.js` |
| A content hash on every art URL | **2026-08-27, 295 rows** | `src/lib/cardArt.js`, `src/lib/itemArt.js` |

`templates/` holds the current state of each, exported back out in the sheet's
own column order. `primal-spells.csv` holds the 52 Primal spells and nothing
else, which is the whole of what the codex has under that school: the one Arcane
spell it used to carry beside them, Containment Sphere, moved to Ethereal ·
Spacial on 2026-08-25 when a sheet finally covered it, and the twelve Death rows
joined them on 2026-08-26. Those twelve and the Flora and Wild Masters are the
only rows in the file with an `Image` column filled in, because they are the only
ones whose art arrived as a folder rather than as a postimg link.

**Most other files in `templates/` are still pre-readability-pass.** That pass
(2026-08-26) rewrote card text across the codex and did not re-export the tabs,
so `ethereal-spells.csv` still says "in Shield" where the card now says "Shield",
and every second half in it still names its own card. `primal-spells.csv` was
re-exported when Death landed and `elemental-spells.csv` when Earth did, so those two
are current; the rest are a regenerate away and nobody has asked for it.
`elemental-spells.csv` holds the 37 Elemental spells — a tab with no sheet behind it,
generated straight out of `spells.js`, and its Image column names the picture each row
came from, which is what the art importer places the files by. Nineteen of them name a
whole card render in `data/Elemental/`; the other eighteen name a plate in
`data/Fire/` or `data/Earth/`, because the 2026-08-26 drop redrew them.

`draconic-bond-overview.csv`, `trickster-overview.csv`,
`duelist-overview.csv`, `martial-moves.csv`, `enchanter-ability.csv` and the two
`berserker-*.csv` are the tabs that were written here rather than exported, so
they are tracked: a clone would otherwise lose the only copy. The two
`colossus-*.csv` are the workbook's own tabs with the `Image` column filled in,
tracked for the same reason the Berserker's pair are and read the same way.

`ethereal-spells.csv` is the third generated one and holds the whole school, 37
rows straight out of `spells.js` in the drop's own column order, with an `id`
column the drops have not got and an `Image` column naming the picture each row
came from. All three drops left Image empty, so the art importer places the files
by filename and five of the thirty-seven need an alias; putting those names in the
drops' own Image column retires all five. One file per school folder, the way
`elemental-spells.csv` covers every Elemental family. See
[the Ethereal school](#the-ethereal-school-2026-08-25),
[the Shadow family](#the-shadow-family-2026-08-25) and
[the Time family](#the-time-family-2026-08-25).

It is also the first generated template to carry the `**bold**` markers of the
2026-08-25 card pass, because it was regenerated after it. Most of the others were
not, so they are a backup of a codex that has since moved: `elemental-spells.csv`
is the one worth fixing, and it is not fixed here.

The Berserker's pair are the whole workbook rather than a missing tab: it was
transcribed here out of a PDF, so `berserker-ability.csv` and
`berserker-overview.csv` are the copy of record, `Image` names the file in
`data/Berserker/` each row was drawn from, and the `id` column is what the next
pull should read ids off instead of the names. See
[the Berserker](#the-berserker-2026-08-23).

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

**`weapon-icons.csv` and `weapon-cards.csv` run the other way.** Every other
template is a record of a sheet that arrived; these two are a **work list going
out**, added 2026-08-24 with the rebuilt weapon wall. Between them they name all
123 pictures the wall still needs, 45 weapon icons and 78 ability cards, each with
the id its files will be called, the sizes it is cut to and the plates it is drawn
on. The `Name` and `Image` columns are the importers' own, so a filled-in copy
dropped into `data/` is the input rather than a thing to transcribe. Keep the two
apart when you drop them: one CSV holding both, with filenames on the icon rows
and links on the card rows, makes `pull-card-art.mjs` report every icon row as a
card name it has never heard of. `data/weapon-art.xlsx` is the same two tables
plus a tab on how to deliver them.

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
{ trick: { id: 'ambush', elevate: 2, advantage: 1 } }   the next Weapon Attack
                                                       is made with Advantage
                                                       and Elevated twice
{ trick: { id: 'poison', flat: 1 } }                    and deals another
                                                       1 x Instinct
```

From then on the attack prints its raised damage **everywhere the sheet prints
it** — the quick bar chip, block 3's row, the dealt card. A Longbow Aimed Shot
under a 3-Elevate ambush reads `3d12 + 12` instead of `3d6 + 12`.

`elevate` is a stored number because it is history: "equal to the Willpower paid"
is about what was actually paid, and swapping weapons afterwards must not change
the answer. `flat` is a *multiplier* on Instinct rather than a number, because
Poison says "equal to your Instinct Attribute" and means the Instinct you have
when you swing.

`advantage` is the card's **first** line, and it is stored beside the Elevate for
the same reason: the row is the receipt for what the Willpower bought. It reaches
the roll through `attackModifiers` in `moves.js` — the one function every printed
attack goes through — so the green arrow is on the chip, on block 3's row, on the
dealt card and on the tracker row itself, exactly where a Duelist's DEXTEROUS
arrow already is. Two ambushes bought for one swing are two payments of Elevate
and **one** arrow: "unless they say otherwise effects don't stack from the same
source", deduped in `trickRider` where the sum happens. A Duelist's one-handed
arrow and an ambush are two different sources and do stack, and the badge names
both.

**Lost on use** is `spendTricks`, called from `spendUse` in `combatBar.js` — the
one place every use on the sheet is paid for, so a rider comes off whether the
swing was tapped on the quick bar or on block 3. It comes off hit or miss:
AMBUSH's Willpower buys the *attempt*, Advantage applies to the roll, and the
roll has happened.

**What counts as a swing** is read off the tags, never guessed, and it is not the
same answer for every rider. The glossary is broad — a Weapon Attack is "either of
the two attacks the weapon in your hands teaches you" — and the four things tagged
`Weapon Move` are neither of them. Shield Block is one of those, and a rider that
raised a shield block would be lending damage to a defence.

**AMBUSH is narrower than the glossary**, which is a ruling rather than a reading:
it rides the plain `Weapon Attack` a weapon teaches, and a `Special Weapon Attack`
neither prints it nor spends it. A stolen Poison keeps the broad reading and rides
either. `trickRides` in `tricks.js` is the one place those two part company. See
[where a rider lands](#where-a-rider-lands-2026-08-21).

### AMBUSH prices itself off the weapon

"The cost of this ability is equal to the weapon number of base damage dice
before enchant or boost" — so the card's printed cost is the sheet's own `x`, and
the number belongs to the weapon rather than to the card. Daggers strike for 1d6,
a Longbow shoots for 2d6 and a Staff blasts for 3d6, so the same card costs 1, 2
or 3 depending on what is in your hands, and Elevates to match.

`ambushUse` in `combatBar.js` reads it off the weapon in the main hand and hands
the chip an ordinary number, so an ambush is paid for at the chip like everything
else on the bar. "Before enchant or boost" is honoured by reading the card's own
printed expression: an Empowering enchantment adds dice at print time and has no
business raising the price of an ambush.

A weapon whose plain attack rolls no damage dice cannot be ambushed with, and the
chip says so rather than taking the Willpower: **No blade**, wearing the reason,
which is the shape a Martial Move with no room and an empty flask both wear.

**This is where the window went.** `AmbushWindow.jsx` used to list both attacks
with a price on each, print the chosen one *as it would land* and take the payment
itself, because until an attack was chosen the price was not knowable. Only one
attack can be ambushed now, so there is nothing to choose and nothing to confirm.
See [where a rider lands](#where-a-rider-lands-2026-08-21).

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
  same as AMBUSH. Not narrowed with it, though: the ruling below is about AMBUSH
  and says nothing about a stolen poison, so a poison is still spent by either of
  the two attacks.

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
one swing — as long as the swing was the plain attack, which is the one thing the
two rider systems no longer agree about. See
[where a rider lands](#where-a-rider-lands-2026-08-21). It fires when the attack
is **paid for**, not when it lands. The note
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

One card has no picture, correctly: **Climb**, which is not on the sheet.
Containment Sphere was the other until the Spacial drop on 2026-08-25 brought a
render with it.

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

### And "your highest Attribute"

Ten cards do not name an attribute at all, they name a rule. Six lineage traits
and three skills hand over a spell "cast with your highest Attribute", and DRAGON
BREATH rolls off it itself.

That rule is written `highest` and it goes exactly where an attribute key would:

| Where | Written | What it means |
| ----- | ------- | ------------- |
| on a card | `stat: HIGHEST` | this card rolls off its holder's best attribute |
| on a choice that teaches a card | `cast: HIGHEST` | the card it hands over does |
| on a loadout | `cast: 'instinct'` | the older, ordinary form: a named attribute |

It is not a fourth attribute and nothing on a sheet holds a value for it.
`castStat` in `src/lib/cardText.js` settles it against whoever is holding the
card, at the moment the card is printed, so the sheet's own `{stat}` and
`[[2d6 + 2*stat]]` do the rest: DRAGON BREATH reads *Physique roll (+8)* and
`2d6 + 16` for a Physique 8, and *Mind (+9)* and `2d6 + 18` for a Mind 9. A
spell an Innate card hands over prints the same way instead of the Mind the codex
printed it for.

**A tie goes to the printed order**, Physique then Instinct then Mind. Two
attributes at 6 roll the same 6 whichever is named, so the tie decides a word and
not a number, and 6/6/4 spreads are common. Say the word if the player should get
to choose which one is named.

The cards that grant a spell keep saying "your highest Attribute" in prose rather
than naming today's winner, because what they state is the rule and the rule
outlives the spread: the *spell* is where the live numbers belong.

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
| `stunned` | Ice Block, Magma Chains, Chrono Lock, Execute |
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

## Where a rider lands, 2026-08-21

> "Ambush onyl a apply on "Weapon Attack", not speical attack. there is no need
> for a confirmation button. In the case o martial move when you get rank free. It
> just just apply ot boht and hte first one of the tow action used remove the
> effect"

Three rulings on the two rider systems, and the second two fall out of the first.

### An ambush rides one attack

A weapon teaches two cards and the glossary calls both of them a Weapon Attack.
AMBUSH does not.

| the card | prints the ambush | spends it |
| --- | --- | --- |
| `Daggers - Strike` · `Weapon Attack` | yes | yes |
| `Daggers - Triple Strike` · `Special Weapon Attack` | no | **no** |
| `Shield Block` · `Weapon Move` | no | no |

That middle row is the half that matters. A Trickster who pays for an ambush and
then makes a Triple Strike has made an attack and **still has the ambush**: a rider
that was not on a swing cannot be taken off by one. So `spendTricks` is now told
which card was paid for, and `trickRides` is the single place that decides. Both
halves of a rider's life read that one function, so what a card prints and what a
swing spends can never disagree.

`isPlainAttack` is the narrow test and `isWeaponAttack` is the broad one, both in
`tricks.js`, both off the tags and neither out of the prose.

### So there is nothing left to confirm

`AmbushWindow.jsx` is gone, and the ruling above is what removed the reason for
it. The price of an ambush is the attack's own base damage dice, and with two
attacks to choose between the sheet could not know the number until the player
picked one. With one attack it is knowable the moment a weapon is in hand.

So an ambush is paid for at the chip like every other card. `ambushUse` in
`combatBar.js` reads the main hand, puts the Willpower in the orb, says what the
payment will do — *Rides Daggers - Strike: Advantage on the roll, and the damage
Elevated once* — and lays the rider as the use's own `extra`, so one write spends
the Willpower and writes the tracker row together. The action-or-reaction question
is asked once, by the same `UsePrompt` everything else on the sheet is paid
through, and Cancel still costs nothing.

The card keeps `opens: 'ambush'` as the marker `ambushUse` reads, the way CALL THE
BEAST carries `opens: 'feral'`, and has dropped `pays: 'window'`. The attack as it
would land is one tap away on the In Hand chip, before the ambush and after it.

### A Martial Move rides both

"it just apply to both and the first one of the two action used remove the
effect". A move rides both of the attacks a weapon teaches, prints on both, and
comes off on whichever of the two is made first. That was already what the sheet
did; what is new is that it is written down where it can be read — on the tracker
row itself (*Rides your next weapon attack, special or not*) and in `spendMoves`,
which deliberately takes no card where `spendTricks` takes one.

| the rider | rides | spent by |
| --- | --- | --- |
| AMBUSH | the plain attack | the plain attack |
| a stolen Poison | either attack | either attack |
| a Martial Move | either attack | either attack, and the first one takes it |

**One clause is read rather than known.** "when you get rank free" is taken as the
Rank 3 case, where SHARP and BESTIAL FRENZY put two moves on one swing: both ride,
and the first attack takes both, with nothing split across the two attacks and
nothing held back for the second. That is the only place two moves can be waiting
at once, so it is the only place the sentence has anything to add. Either way the
behaviour asked for is the same one, so nothing hangs on the reading.

## The lineages, remade 2026-08-21

Two new tabs, `General Rules - Lineage` and `General Rules - Lineage Cards`, plus
`data/Lineage/` and `data/Lineage/Lineage Cards/` with a picture for every row of
both. They replace the V4 "Hazebound - Character Sheet V4 - LINEAGE" sheet the
old codex was transcribed from, and `lineages.js` was rewritten against them.

### Eighteen ancestries became thirteen

**The six beastkin lines are gone.** Featherborn, Furborn, Gillborn, Muckborn,
Scaleborn and Slickborn have no row on the new tab. One ancestry replaces all
six: **Wildkin**, which offers the pool those six used to divide between them and
asks the player to keep two of it. 18 − 6 + 1 = 13, which is exactly what the
picture folder holds.

Twenty-two card rows against V4's twenty-seven, and almost none of the names
survived: DRACONIC HIDE is now DRACONIC SCALES, STONESKIN is MINERAL SKIN,
POISONOUS is VENOMOUS, HARDENED FRAME is STRONG, UNDYING is UNDEATH RESILIENCE,
FEED is CANNIBALISM. **No V4 id survives**, so a character saved on the old codex
keeps its lineage *name* and loses nothing else: the name is what the `lineage`
column stores, and `getLineage` missing it prints "written in by hand" rather
than clearing it. A character on one of the six removed lines reads that way now,
and picking again is the fix.

The numbers moved with the names. Health per level is written against 10 rather
than V4's 5, which is what `deriveStats` already computes; Movement Speed is in
meters rather than points; and the V4 casting-attribute question is gone, because
every spell a lineage grants is now cast with "your highest Attribute". Wisdom
and Fortitude are off the sheet as options with it.

"Your highest Attribute" is wired, as of 2026-08-22: an Innate trait hands its
spell over with `cast: HIGHEST` on it and DRAGON BREATH carries `stat: HIGHEST`,
so both print the attribute their holder actually stands highest in rather than
the words. See "And your highest Attribute" above.

### Wildkin asks for cards, not for a value

Every other ancestry hands its cards over as printed, and the only question any
of them asks is *what a card says*: which damage type your scales resist. Wildkin
asks **which cards you have**, and that is a new shape.

| | |
| --- | --- |
| the pool | Amphibian, Scaley, Venomous, Cold Blooded, Sharp Sense, Hearthy, Wild Swiftness, Sticky |
| keep | 2 |
| stored in | `choices['wildkin-traits']`, a list of card ids |

**No new column.** The `choices` bag is already "what this lineage left to you",
every other reader of it looks up `choices[card.id]`, and a pool's id is not a
card's, so a list under one more key needs no migration. Dropping the lineage
drops the picks with it.

All eight are in the registry whether or not anybody kept them, or a Wildkin's
two would be the only cards on the sheet no `{{link}}` could resolve and no pile
could deal. What a character *holds* comes from `lineageCards`, which is
`lineage.cards` for twelve of the thirteen and the kept two for Wildkin, and
every surface that prints "what your blood carries" goes through it.

Keeping a third drops the one kept longest rather than refusing the click: a pool
of eight you have to clear before you can change your mind is worse than one that
rolls.

### How the transcription was proved

Every card body was resolved back through its markers and compared to the
designer's cell with case and punctuation flattened, alongside its AP, its WP and
all thirteen blurbs. **64 of 82 comparisons match.** All thirteen blurbs and
every AP and WP match exactly. The eighteen that differ are all reads, and the
full list of them is in the header of `lineages.js`: single-word spelling
("eahc", "aiblity", "cielings", "fice sense"), singulars that wanted plurals
("short rest no longer restore"), house units ("1.5 meter" to 1.5 meters), and
DRAGON BREATH's person, which is written off a monster's stat block and says "in
front of itself" about a player.

INNATE X is one modular row and six cards. Its cell carries "(mdoular card were X
is replace with the type of school in the anme)", which is a note to the builder
rather than rules text, so it is dropped and built: the lineage tab names a school
for each of six ancestries and each gets its own card. All six were checked
against the one row.

Its "a Novice X Spell" is the one promise on the tab a card cannot keep by
itself, so the card asks which spell. The school's Novice shelf is the answer,
offered in the window that hands the lineage over, and the spell chosen there
joins the hand as a card of its own: a Scorchbound holds Living Furnace, Innate
Fire and the Fire spell they took. The sentence still round-trips to the cell,
because unanswered the `{choice}` prints the four words it replaced.

### Four things for the designer

1. **LIVING FURNACE does not say what you regain.** "You regain 10 + 5 for each
   Willpower spent" names no pool. Health is the only one the numbers fit, and
   that is still not what the cell says, so the card prints the sentence as
   written. Its Willpower column reads `x`, which no card shape holds, so the
   ceiling is printed in the body instead.
2. **SPROUT WINGS is one card given to two ancestries and names one of them.**
   Celestial and Infernal both take it and it reads "Celestial wings". V4 had
   two cards here, CELESTIAL WINGS and INFERNAL WINGS; the new tab has one row
   and one picture. Left as printed.
3. **Three cards still say "Fortitude".** FEY BLOOD, UNDEATH RESILIENCE and
   HEARTHY all read "per level in Fortitude and Physique", and V5 has no
   Fortitude. `deriveStats` computes Health as 10 per character level plus 10 per
   Physique, so the app already reads the first half as level.
4. **Innate Light and Innate Shadow name schools that do not exist.** Fire, Wind,
   Water and Earth are all Elemental families with Novice spells already written.
   Light and Shadow are neither a school nor a family anywhere in `spells.js`, so
   those two cards promised a spell nobody could look up, which left a Celestial
   and an Infernal unable to finish level 1. Each school now holds one stand-in,
   UNWRITTEN LIGHT and UNWRITTEN SHADOW, printed with a body that says it is
   standing in. The Innate cards read their options off the school's Novice
   shelf, so writing the real spells is all it takes to retire the stand-ins.

Two tags contradict their own costs and were read against the cost: SPROUT WINGS
is tagged `Basic Action` on a tab of lineage cards while carrying 2 AP and 2 WP,
and LIVING FURNACE is tagged `Passive` while carrying a cost. Both are treated as
the Abilities they are priced as.

### What is printed and not yet wired

Only the three attribute grants are declared and added: STRONG raises Physique,
INSTINCTUAL Instinct, INTELLIGENT Mind, the same three V4 had. **MINERAL SKIN and
SCALEY's "+1 Defense", INNER TIDE's "+4 Willpower", WIND GRACE and WILD
SWIFTNESS's "+1.5 meters", and the four cards that change Health per level are
printed on the card and not read by the sheet.** That is exactly where V4 left
them, so nothing regressed, but the list is longer now and INNER TIDE's +4 is the
largest number on it.

### Two ids came free

**`resilience` and `create-water` are no longer held by a lineage trait.** Both
V4 traits are gone, so the collisions recorded above under [the
Enchanter](#one-id-had-to-change) and [the Elemental
school](#one-id-had-to-change-again) no longer exist. The renames stay as they
are: `resilience-enchantment` and `create-water-spell` are what saved characters
point at now, and an id is not worth churning twice.

The Draconic scale table is unchanged, so the disagreement recorded under [the
Draconic Bond](#three-things-for-the-designer) stands as it was. It is
DRACONIC SCALES that holds the lineage's half of it now, not CHROMATIC
RESISTANCE.

### One id had to change, a third time

**DRAGON BREATH is `dragon-breath-lineage`.** The Draconic Bond already prints a
DRAGON BREATH, and the lineage card is the same effect rewritten: the ally breathes
2d4 and its Mind in front of *itself*, you breathe 2d6 and your highest Attribute.
Two cards, one name. The older keeps the id, the same way RESILIENCE and CREATE
WATER were settled, and lineage cards fold in *after* talent cards so the clash
would have taken the ally’s card out of `getCard` silently.

That "in front of itself" is also where the lineage row came from: it is the ally’s
sentence with the ally taken out and nothing put back. The person read in
`lineages.js` is that, corrected.

### The art is placed

All thirty-five pictures are cut and committed: **27 card plates** into
`public/cards/` and **13 ancestry plates** into `public/lineages/`, the second lot
square 640px JPEG beside the talent sets’. Twenty-two files became twenty-seven
cards, because INNATE X is one drawing for six of them.

**67 files, 2.08 MB**, cut from 77.4 MB of originals that stay in `data/` and stay
out of the clone. That is the same trade the rest of `public/cards/` made, and the
reason for it is in `pull-card-art.mjs`: a build cannot reach out for a picture, so
what ships has to be in the repo.

Two things had to change for it to work at all.

**`lineages.js` now wears its art.** The blocker recorded in `pull-card-art.mjs` was
real: the module handed the same card out twice, on `lineage.cards` and again
flattened into the registry, and `withArt` spreads, so dressing the flattened copy
would have given the picture to `getCard` and left the sheet’s own card bare. The
fix is to dress *first*, once, on one deduplicated list, and rebuild both the
registry and the thirteen ancestries from those objects. A card two ancestries
share is still one object, and a pool’s eight are dressed with the rest.

**The lineage folder resolves against lineages alone.** `data/Lineage/` is the only
folder besides a spell school that nests, and it needs its own name maps rather
than the codex-wide one, because `Dragon Breath.png` exists in both
`data/Draconic Bond/` and `data/Lineage/Lineage Cards/` and one flat map cannot
hold both. Scoped per folder there is no question which is which.

Four filenames are aliased, and all four are reads the codex already made:
`Canibalism`, `Venemous`, `Undeath Resillience` and `Draconic Scale`. Renaming a
file retires its alias. `Wild Swiftness,.jpg` needs none, because flattening drops
the comma on its own.

**`backgrounds.js` is now the only module still unwrapped**, and a background skill
is still the one card a picture cannot be placed on. It is the same one-line fix.

*Done on 2026-08-21, when the Skills tab arrived with its own pictures. See [the
skills](#the-skills-are-the-designers-now-2026-08-21).*

## The skills are the designer's now, 2026-08-21

`data/General Rules - Skills.csv` landed with **32 rows**, and it replaces the
eighteen skills `backgrounds.js` had been carrying since 2026-08-19. Those
eighteen were a first pass written before the tab existed, off the three skills
Jules had handed over by hand. They are gone, ids and all: nothing in the codex
points at `negotiator`, `field-medic`, `quartermaster` or the fifteen others.

**A saved character keeps the shape and loses the skills.** The
`background_skills` column holds ids, and `normalizeBackgroundSkills` drops any
id the pool no longer offers, so an existing sheet reads as a background with
none of its picks made. That is the honest answer: the skills it named do not
exist, and the block asks for them again rather than inventing a mapping.

### What the round trip proves

Every body was compared to its Main Effect cell with case and punctuation
flattened. **All 32 rows are accounted for**, and the reads are listed in full in
the header of `backgrounds.js`: spelling (nineteen of them), grammar (nine),
capitalised defined terms, one distance written the codex's way, and nine Oxford
commas dropped per `docs/text-style.md`.

Six things the tab leaves open, all recorded over the codex rather than guessed
at here:

1. **Arcane Marshal and Cartographer carry the same cell**, word for word. It is
   plainly Cartographer's text. Both are printed as written.
2. **Unseen Spellwork asks for "a Cunning skill check"**, and Cunning is a skill
   on the same tab rather than one of the three attributes.
3. **Three armor masteries change a stat the sheet does not yet add.** All three
   are level 5, so nothing is missing from a level-1 sheet.
4. **Tailor asks for two items that do not exist**, a Disguise Kit and Bandages
   as a consumable. `bandage-roll` in `utility.js` is close to the second.
5. **Spell Eater's row ends in a stray cell** holding the Wildkin pool off the
   lineage tab. Dropped.
6. **Empath and Seafarer have no picture**, and there is one unnamed file in the
   drop (`Gemini_Generated_Image_w78nd7w78nd7w78n.jpg`) that may be either.
   Renaming it after the skill it was drawn for places it.

### Three rows ask a question

Innate Spell Novice, Adept and Master each promise a spell of that rank "from any
school" and name none. That is INNATE X's own shape off the lineage tab, so it is
built the same way: the rank's whole shelf is the card's `choice`, read off
`spells.js`, `learns: true` says the answer is a card rather than a word, and the
spell named joins the hand behind the skill that taught it.

Thirty Novice, eighteen Adept and eight Master, so all three can be answered. The
question is asked **in the window that hands the skill over**, in both places a
skill can come from: the background block's pool, and the level chooser. Taking
one that asks nothing closes the chooser; taking one that asks keeps it open,
because the shelf underneath is the rest of the same decision.

An unanswered one badges the Advancement tab exactly as an unanswered lineage
card does, through `levelQuestions`.

### Five skills a background cannot teach

The Requirement column gates three armor masteries and Innate Spell Adept at
level 5, and Innate Spell Master at level 10. A background is the life you led
before level 1, so it may not offer one, and `skillOptionsAt` measures the
**slot's** level rather than where the character stands: the level-3 slot refuses
Innate Spell Adept with "Needs level 5", and the level-11 slot is the first that
can take Master. A pool holding a gated skill says so at load in dev.

### Mastermind and Spell Eater grow

Both say "You can use this feature once, regaining it after a long rest. The
number of uses increases to 2 at level 6." So `uses` in `uses.js` may now be a
function of level as well as a number, and `cardLimit`, `normalizeUses`,
`cardUse` and `usesRest` ask how many a card holds *of a character*. Every caller
already had one in hand, so nothing had to be threaded anywhere. A plain number
never looks at the level.

### `Long Rest` is the tab's word for a labour

The Tags column says `Long Rest` where this repo said `Labour`. `restLabours`
reads both, so Apothecary, Scavenger and Tailor are offered in the rest window
without either name having to win.

### And the module wears its art

`backgrounds.js` was [the last module still unwrapped](#the-art-is-placed). It is
dressed now, the same way `lineages.js` is: once, at module scope, on one list,
with `BACKGROUNDS` rebuilt to point at those objects. So a skill offered by four
backgrounds is still one object with one picture, and `getCard` hands back the
dressed card.

`data/Background/` nests like `data/Lineage/` does, and `data/Skills/` is claimed
beside it. Both resolve against the same two maps, backgrounds and skills, and
never against the codex at large: a name is one or the other and never both, so
which folder a file sits in decides nothing. That is what lets the two stray
background plates in the skills folder land correctly instead of being reported.

Two small rules came with it. A file whose name ends in `copy` is Windows making
a duplicate and is skipped in silence, which is what `Heavy Armor Mastery -
Copy.jpg` is. And when two files claim one card, the "two files claim it" line is
held back if they match on both size and mtime, because `data/Skills/` and
`data/Background/Skills/` are a folder and a copy of it, which is one picture in
two places rather than a redraw.

Six filenames are aliased, and every one is a read the codex already made:
`Haggle`, `Helper`, `Inquistor`, `Cultist` (Occultist's, the only file with no row
and the only row with no file), the three `Inate Spell` rows, and `Mercanery.jpg`
for the Mercenary plate. Renaming a file retires its alias.

## The ten backgrounds, 2026-08-21

Jules named them and set the arithmetic: **Criminal, Erudit, Military, Outlander,
Craftsman, Entertainer, Merchant, Aristocrat, Investigator and Mercenary**. The
eight drafted on 2026-08-19 are gone.

### One formula is the whole balance

```
Coins = (4 - skills) * 2000        Supplies = 70, for everybody
```

A background teaches **one, two or three** skills, so it shows up with 6000,
4000 or 2000 Coins. A poor life taught you more and left you less, and that is
the only axis the ten are arranged along. `startingCoins` is the one place it is
written down and every purse is filled in from it, so a coin count can never
drift from the picks beside it.

| Background | Skills | Coins | Weapons | Pockets | Pool |
| ---------- | -----: | ----: | ------: | ------: | ---: |
| Criminal | 3 | 2000 | 1 | 2 belt, 1 pack | 6 |
| Erudit | 3 | 2000 | 1 | 1 belt, 2 pack | 7 |
| Outlander | 3 | 2000 | 1 | 2 belt, 1 pack | 6 |
| Entertainer | 3 | 2000 | 1 | 1 belt, 2 pack | 6 |
| Military | 2 | 4000 | 2 | 1 belt, 1 pack | 6 |
| Mercenary | 2 | 4000 | 2 | 2 belt, 1 pack | 6 |
| Craftsman | 2 | 4000 | 1 | 1 belt, 2 pack | 6 |
| Investigator | 2 | 4000 | 1 | 1 belt, 2 pack | 7 |
| Merchant | 1 | 6000 | 1 | 1 belt, 2 pack | 6 |
| Aristocrat | 1 | 6000 | 1 | 1 belt, 2 pack | 6 |

Everyone still gets one full set of Common armor. Coins and Supplies being
settled by the formula leaves the pool, the weapon count and the pockets as the
only things telling the ten apart, which is where the character of each one now
lives: the Military and the Mercenary are the two that arm both hands, the
Merchant walks in with a Terra Cotta Disk because a merchant owns a cart, and the
Criminal and the Investigator both carry Thief's Picks for opposite reasons.

**The purse moved by roughly ten times.** The old drafts ran 100 to 600 Coins.
Nothing else on the sheet was rebalanced against that: what armor and weapons
cost is `items.js`'s, and it has not been touched.

Every pool offers six or seven and lets you keep one to three, so two characters
out of the same trade need not look alike, and **all 27 skills learnable at level
1 are offered by somebody**. The five gated ones are offered by nobody, on
purpose.

## An odd level raises two attributes, 2026-08-21

Level 1's +2 / +1 spread is untouched. Every **odd level after it** now hands out
two points, +1 apiece, on two different attributes, where it used to hand out one.

The record changes with it. `attribute: "mind"` becomes `raised: ["mind",
"physique"]`, a list rather than a pair of named slots, because both points are
the same size and their order means nothing.

**A sheet written by the older build reads as one taken and one open.** The
single point is read back as a list of one, which is what it now is: half a pick,
badged unfinished until the second is placed. Nothing is dropped and no second
point is invented. `check-stat-math.mjs` keeps level 9 of its ladder written the
old way on purpose, so the round trip proves both readings add up.

The chooser needed nothing new. Level 1 already ran two slots that may never land
on the same attribute, and tapping the one the other slot holds trades places
rather than refusing, so an odd level is now that same dialog with both slots
worth +1.

## Every card read for what it does, 2026-08-22

A pass over all 279 cards in the codex, asking two questions of each: **does its
own text say it lasts**, and **if it lasts, does it move a number this sheet
holds**. The first question is what the tracker's picker filters on and it was
getting nine cards wrong. The second had never been asked of anything but an
Ephemeral Enchantment.

### Nine cards were being read wrong

`effectDuration` in combatTurn.js reads a duration off the printed text, because
no card carries a duration field. It matched patterns in a fixed order and the
first hit won, which is fine until a card states two durations. Now it collects
every match with its position and answers with the best, under two rules:

- **The main text first.** The optional half is read only where the main text
  said nothing, because that half is nearly always a way of spending more rather
  than a second clock. SENSE LIFE runs for 10 turns and its Overcast marks
  something until a Long Rest, and it is a 10-turn spell.
- **Precise before vague, then earliest.** A clause naming a rest or a count of
  turns beats one that only says the thing lasts. Between two equally precise
  answers, the first stated is the card's own and the later belongs to a rider.

| Card | Was read as | Now | Why |
| --- | --- | --- | --- |
| THORN RAMPART | 1 turn | 10 turns | the wall stands "for 10 turns (1 minute)" in its first line, and the rooting four lines down is "until the end of its turn" |
| BLIND | until it ends | 1 turn | "Blinded until its Turn End", which is the codex's own way of writing one turn |
| AMBER SHARD | until it ends | 1 turn | "Stunned until their next Turn End" |
| DRACONIC MARK | until it ends | 1 turn | "until your next Turn End" |
| BARKSKIN | does not last | until it ends | "This effect is lost when all Shield is depleted" is a duration with no duration word in it |
| THIEF'S PICKS | 1 minute | does not last | "given 1 minute, a free hand" is how long picking a lock takes |
| TAILOR | 1 minute | does not last | "spend at least 1 minute looking at its garments" |
| LIGHTNING STRIKE | 12 hours | does not last | "if you used Lightning Strike in the last 12 hours" is a memory, not a thing running on anybody |
| UNWRITTEN LIGHT / SHADOW | until it ends | does not last | "this card holds the slot until it is" is the placeholder talking about itself |

So a clock now needs something to be running **for** it, and a bare "until"
needs a lasting verb in front of it. The three that were dropped are still
reachable through the picker's own escape hatch.

### Six cards now move the sheet

`src/lib/riders.js` is the new table. A card in it is a card whose printed text
names a number this sheet already holds, and tracking it moves that number for as
long as the row is up:

| Card | What it prints | What the sheet does |
| --- | --- | --- |
| GIANT GROWTH | "doubling its Movement Speed and granting it Empowered" | Speed x2, damage Empowered by 1 |
| BARKSKIN | "+1 Defense" | Defense +1 |
| KINDLE WEAPON | "Empowered by 1 and the damage type becomes Fire" | the swing deals Fire, Empowered by 1 |
| WISP OF MIST | "Movement Speed increased by 50%" | Speed x1.5 |
| FOUR-LEAF CLOVER, lucky | "Advantage on their next Skill Check or Attack Roll" | an arrow up on the attack |
| FOUR-LEAF CLOVER, unlucky | "Disadvantage on their next ..." | an arrow down, the first in the codex |

**A rider is keyed on the card and never on the caster.** That is the whole point
of it: when somebody else casts GIANT GROWTH on you, nothing is spent on your
sheet and no source of yours has ever heard of the spell. So the picker can now
search the **whole codex** rather than only what you hold, and a card taken off
that shelf lands with its rider like any other.

Nothing is stored. It bends through `liveCharacter` exactly the way an Ephemeral
Enchantment does, and for the same reason: a doubled Speed written into a column
would still be doubled next week. `check-riders.mjs` walks every rider from a
stored row to the number on the tile and back off again, and `check-stat-math.mjs`
gained two sheets so the tooltip under a doubled Speed still adds up to it.

### Cards that plainly last and are still notes

Left out on purpose, each because the sheet cannot apply the rule without
inventing something the card does not say:

- **AIR CONTROL** has two modes chosen at cast, and Light "increases all
  entities' Movement Speed by 3". The tracker has nowhere to record which mode
  was chosen, so neither mode is wired.
- **WILD STRIDER** says the Movement Speed "cannot be reduced by any effect".
  The only thing on this sheet that reduces one is being overloaded, and whether
  the spell beats a full pack is the table's call.
- **VERDANT FIELD** elevates Flora spells for anyone standing in it.
- **PACK BOND** is conditional on who is adjacent to whom, clause by clause.
- **DRACONIC SCALE** grants resistance to a chosen damage type. The sheet holds
  no resistances anywhere yet, on a card or otherwise.
- **SHARPEN SENSE** and **SKILLSEED NUT** bend skill checks, which the sheet does
  not roll.

### Four things for the designer

All four are the source sheets' own words, transcribed faithfully. None is a
transcription bug and none was changed.

1. **Arcane Marshal and Cartographer carry the same effect, word for word**, in
   General Rules · Skills: both are "read or draw a map, or retrace a route you
   have walked once before, or find a location". Arcane Marshal presumably wanted
   something arcane.
2. **THRILLED's second clause looks unfinished.** "Your Action Points and Reaction
   Points maximum are increased to 7 and you start with Action Points each turn."
   A number is missing after "with", and the sheet applies the ceiling only.
3. **ICE ARMOR names no duration.** It grants Shield and fires a spike whenever
   Shield is lost, which reads like it runs while the Shield holds, the way
   BARKSKIN says outright. The card does not say so, so nothing was assumed.
4. **AIR CONTROL's Light mode names no duration** where Dense says "for 10 turns
   (1 minute)". Same question, and the reason the spell carries no rider.

The three Ingredients in the rider table also name no duration, because an
Ingredient is part of a Brew rather than a spell of its own and no Brew has a
clock. They are offered at "while it lasts" and the dial is right there.

## The canvas, 2026-08-23

"I want to change feature to work with a grid. How it work: I open a
visualization of the block with their name at a small scale. The you can
dertermine your canvas Nomber of column default is 3 up to 9. Then you can move
with drag and drop the blocks to place ethe how you want. This menu need to work
as a 1 block view."

The arranger was a list of rows, which is what replaced dragging a block where
it sits. A list can say "sixth" and it cannot say "bottom left", so it is now
the grid itself, drawn small: one tile per block at the block's own 360x640
shape, with the name of the block on it. See `BlockArrange.jsx`, which is shared
by the Character, Abilities and Inventory tabs.

### Three readings that changed what got built

- **One count per tab, not one per sheet.** Six character blocks and three
  ability blocks rarely want the same canvas, so `block_columns`,
  `ability_columns` and `inventory_columns` sit beside the three orders that
  were already there. Every one defaults to 3.
- **No holes.** Blocks flow in reading order, so a stored order is still the
  flat array it always was and nothing that reads one has to learn about gaps.
  Dropping a block on another **trades** the two rather than inserting, because
  "put the Loadout top right" should move two blocks and not shuffle everything
  between them. Every arrangement is still reachable, since any order is some
  sequence of swaps. Dropping past the last block sends it to the end.
- **The dialog takes the page measure**, the same 1180 the codex browser and the
  effect tracker take, because a nine-column canvas has nowhere to go at 560.
  The body inside it is held to the width of the canvas rather than the width of
  the dialog, so three columns read as a page rather than as a small picture
  stranded in a wide one.

The three counts are new columns. **Re-run `supabase/schema.sql`** or they are
dropped from every write with a console warning, and the arranger will forget
the canvas on the next load.

### The count is a ceiling, not a promise

A block is a hard 360x640 on every device, so nine of them are 3384px of grid.
The chosen count is therefore the most the tab may take and `--sheet-fit` in
sheet.css is how many the window has room for, one more every 376px. The smaller
of the two is what gets drawn, which is the old three-two-one behaviour written
as arithmetic: a canvas set to nine is nine on a wall and one on a phone, and
nothing has to be rearranged to move between them.

`--sheet-measure` moved up from `.sheet-canvas` to `.sheet` for the same reason.
The canvas grows past 1290px once there are more than three columns, and so does
the bar of tabs above it, which cannot read a variable declared below itself.

### A finger never drags

Dragging is a mouse gesture here. A touch drag has to take the gesture away from
the browser with `touch-action: none`, and the canvas is the thing you scroll
when the arrangement is taller than the dialog, which one column of six blocks
on a phone is. So a tap picks a block up and a second tap puts it down on the
block it trades with. That is the same path the keyboard takes with Enter, and
the arrow keys move the focused block a slot at a time. "This menu need to work
as a 1 block view" is what all of it is for: the whole dialog fits a 375px phone
with the canvas at 46vh and nothing scrolling, and a tile keeps a floor of 100px
so a name is always readable, or 56px on a phone, where the name comes off the
tile and the number stays.

## The Berserker, 2026-08-23

The eighth talent set, and the first that arrived as a **character sheet** rather
than as a workbook: `Hazebound - Character Sheet V4 - BERSERKER.pdf`, three pages
with the cards printed as pictures. It was transcribed into
`Talent Set - Berserker.xlsx` first, in the three tabs every other set arrives
in, and that workbook is what was pulled. Both halves of it are tracked in
`templates/` because the workbook was written here and a clone would otherwise
hold no copy of it.

**Nine cards over three ranks**, and the signature needed no adapting at all: the
rage is a 10 turn clock and every Rampage Skill pays for itself in turns off that
clock. That makes it the counterpart to the Feral Curse. Same idea, a different
clock, and this one is spent on purpose rather than run down.

| Rank | Cards |
| ---- | ----- |
| 1 · Novice | GOING BERSERK, BERSERKER'S RAGE, RAGING BLOW |
| 2 · Adept | MASTER OF PAIN, IGNORE PAIN |
| 3 · Master | UNSTOPPABLE, RAGE THROUGH, AVATAR OF CARNAGE, RECKLESS VIOLENCE |

### What the V4 sheet needed on the way in

The workbook's `Developpement Notes` tab is twenty rows of this, one per read,
and it is the tab that does not survive a clone. What it says, in short:

- **Rank scaffolding, gone.** Every rank in the track opened by naming itself and
  the card it hands over: "At Rank 2, you learn the Rampage skill Ignore Pain."
  No card in the codex announces its own rank. The rank is the Tags column and
  holding the rank is what hands the card over, so the line only restated that
  IGNORE PAIN is tagged `Adept Talent`. What survives of each old rank entry is
  the clause after "Additionally". Every "At Rank N" still in the codex is about
  which tier of a *pool* you may learn from, which is a different sentence.
- **Four ranks became three.** The old Rank 4 held UNSTOPPABLE and AVATAR OF
  CARNAGE. A set is a three rank track and the cap is not a soft one, so both are
  Master cards and neither name was lost.
- **RAGE THROUGH had no rank at all.** The sheet's Rank 3 line names Ignore Pain,
  which Rank 2 had already granted, so the sheet never says where this card sits.
  Rank 3 is the slot with the broken line, so that is where it went. That leaves
  the track at 3 Novice, 2 Adept and 4 Master. **Moving it down to Adept would
  even that to 3, 3 and 3, and is the other defensible reading.**
- **"Damage dice increase by one category" is Elevated by 1.** Elevate is the
  glossary's word for precisely this: the same number of dice, one size larger and
  nothing past a d12. Empowered is the other word and means an extra die. The
  wrong one changes every number the card prints.
- **"Critical strike" is a Critical Hit**, which is the term in Status & Terms.
  The clause that earns it, exceeding Defense by 4 or more, is untouched.
- **Saving throws, both ways round.** Nothing makes a saving throw any more: a
  card either swings at Defense or is contested against Reflex or Grit, and either
  way the roll is the attacker's. So "enemies make saving throws against your
  Special Attacks with disadvantage" became advantage on the roll *you* make
  (MASTER OF PAIN), and "you automatically succeed on your next saving throw"
  became "the next roll contested against your Reflex or Grit automatically
  fails" (RAGE THROUGH).
- **"Melee Weapon Special Attack" is a Special Weapon Attack**, the tag every
  weapon's second card carries. It is already melee or ranged by the weapon
  holding it.
- **"Spend Health" is Sacrifice Health.** Sacrifice is the glossary term for a
  cost that ignores reduction, mitigation and prevention. Plain spending would be
  stopped by Shield and by damage reduction, this set's own IGNORE PAIN included,
  which would let a Berserker buy Action Points for free.
- **Target and Duration had their own band on the sheet** and there is no column
  for either. Every card here is Self, and the only duration that is not
  Instantaneous is the rage, so its 10 turns is written into the sentence
  `effectDuration` reads a duration from.
- **A fourth tag, `Rampage`.** The sheet's type line said "Berserker Skill -
  Rampage". The Rampage cards are a family inside the set, gated behind the rage
  and paid for out of its clock, and nothing else in the codex carries a fourth
  tag. **The one new thing on the tab and the one worth arguing with.**
- **Three cards print no fist and are `0 AP`, not blank.** A blank AP on that tab
  is what a passive has, so a card that genuinely costs no Action Points has to
  say the nothing out loud.

### Four open questions

Every one of these is kept exactly as the sheet wrote it. None is a guess and
none is wired to anything.

1. **"Once per round"** on RECKLESS VIOLENCE, and **"once per combat"** on AVATAR
   OF CARNAGE. A use limit is a count plus the boundary that refills it, and the
   only boundaries `uses.js` can refill on are the short rest and the long one. A
   round is neither and neither is a fight. Both lines stand as rules the table
   enforces until there is somewhere to write them down.
2. **"Additional Physique equal to your Berserker Rank."** Every rider in
   `riders.js` bends a stat by a flat number. This one scales off the rank of the
   set holding it, which would be the first of its kind, so no rider is declared
   and the tile does not move.
3. **The compulsion.** "You must attack the nearest target, even if it is an
   ally" stays prose: the sheet does not know where anybody is standing, so it
   cannot tell you the nearest target is your friend. This is the cost that makes
   the set interesting and it belongs at the table.
4. **Six Action Points for `5 x level` Health.** The ceiling *is* 6, so this hands
   back a whole turn once a fight, and a weapon attack costs 4 of them. At level
   10 the price is 50 Health. The workbook was written with "twice your level" and
   the tab that arrived says 5 x level, which is the sheet's to set. Worth a look
   before it ships, because the ratio only improves as levels climb.

A fifth thing turned up in the pull rather than on the notes tab, and it follows
from the sheet's own tag. **AVATAR OF CARNAGE is tagged `Passive` and prints no
cost**, so it lands in the quick bar's "Traits · Always on" recap and never as a
playable move, which means the Health it sacrifices and the 6 Action Points it
hands back are spent by hand. Every other card on the set that *does* something
is tagged `Ability`, including the three that cost 0 AP. If it is meant to be
pressed, it is an `Ability` with 0 AP like RAGING BLOW.

### How the transcription was proved

The same round trip the Trickster and the Mycomancer got: every card's `id`,
`Name`, `Tags`, `AP`, `WP` and `Main Effect` rebuilt out of the codex fields into
the sheet's own written form and compared to the cell, quote- and
whitespace-normalised, plus the Overview tab's four fields and every `{{card
link}}` resolved against the codex. **63 of 63 comparisons match.**

Three markers were inserted and nothing else was touched: `4d6 + 4 x your
Physique` is `[[4d6 + 4*stat]]`, `5 x level` is `[[5*level]]`, and the `Physique`
the rage hands over is `{physique}` so it lights the way an attribute's name does
everywhere else. Four cards say "your Berserker's Rage" and MASTER OF PAIN says
"Raging Blow", so those are `{{links}}` to the cards they name.

`[[4d6 + 4*stat]]` and not `{physique}` inside the brackets, because that is the
holder's own attribute: the literal form is reserved for a *target's*, and this
set has no source that could override the cast anyway.

### The picture folder

Ten files in `data/Berserker/`, 2400x1792 art plates apiece, cut out of the PDF
rather than drawn from a link, so the Image column was empty on every row and
`npm run art:cards` placed them from the folder. Nine card plates into
`public/cards/` and `Berserker Overview.jpg` into `public/talents/berserker.jpg`.

**Five needed an alias in `pull-card-art.mjs`.** Four are spellings the sheet does
not use, `Going Bersek.jpg`, `Instappable.jpg`, `Avatarr of Carnage.jpg` and
`Berserker Rage.jpg` for BERSERKER'S RAGE. That last one had to be in the table
rather than left to be noticed: the folder pass claims any leftover file whose
name starts with the *set's* name as the set's overview plate, so without the
alias the rage's picture would quietly have overwritten the Berserker's plate.

The fifth is not a misspelling. **`Master of Rage.jpg` is another name for MASTER
OF PAIN**, which is what the Ability tab prints and what the V4 sheet's own rank
list calls it, so the codex follows the sheet and the file is placed by alias. The
picture is the newer artifact, though, so if the card was renamed while it was
being drawn, this is the line to change. The `id` column said `master-of-rage` and
the codex uses `master-of-pain`, since an id nobody has saved yet is free to fix
and this was the last moment it would be.

Pasting the `id` and `Image` columns out of `templates/berserker-ability.csv` back
into the sheet retires all five entries and the id question with them.

### The shelves, and two sets re-shelved

Asked for in the same message: the chooser wall is cut into **Physique, Instinct,
Mind and Other**, because with nine sets on it the first question anybody has is
"my 6 is in Physique, so what does a 6 in Physique buy me". The cut lives in
`TALENT_CATEGORIES` in `talents.js` and is a set's `stat` and nothing else;
`TalentWall` in `TalentBlock.jsx` draws it, and it drops back to one plain wall
when a filter narrows it to a single shelf, the same way `PoolWall` does with a
pool of cards. The three attribute shelves read their heading note off
`attributes.js`, so what an attribute buys is written in one place.

Two rulings came with it, both Jules's:

- **Guardian is Physique**, and every card on it still rolls Instinct. A Guardian
  is built on the body that holds the shield up, so Physique is what somebody
  choosing the set is choosing it for. The Instinct contest SHIELD EXPERTISE gives
  advantage on is untouched: a set's `stat` is its shelf, a card's `stat` is its
  roll, and these are the only two that disagree.
- **Draconic Bond is Level**, which is what the fourth shelf is for. Its Mind was
  read off the rolls the ally makes, but what the set actually buys is a second
  stat block, and every number in it grows on level: 5 Health a level, a point of
  Mind every odd one and a point of Physique or Instinct every even one. A bonded
  who never raises Mind again still gets all of it.

`Level` is a fourth entry in `TALENT_TAGS` wearing `kind: 'attribute'` even though
it is not one. That is deliberate and it is what makes the filter behave: chips
inside a kind widen the result and chips across kinds narrow it, so a kind of its
own would make "Mind or Level" match nothing. It is the same pseudo-attribute
`cardText.js` already prints for a `{level}` token.

## The Colossus, 2026-08-23

The ninth talent set, and it arrived the same day the Berserker did and in the
same three tabs: `Talent Set - Colossus.xlsx`, with `Overview`, `Ability` and
`Developpement Notes` all filled in. Nothing had to be written here to complete
it, which makes it the first set since the Cauldron Keeper to land whole.

**Seven cards over three ranks**, and it is the Duelist's opposite number in so
many words: "Where a Duelist buys options with a free hand, a Colossus buys
weight." So it is built out of the same two specs, a `loadout` that hands over
Martial Moves and a `martial` block that says what the move system lets the set
do, and everything new in it is in the second one.

| Rank | Cards |
| ---- | ----- |
| 1 · Novice | MARTIAL TRAINING, GIANT SLAYER |
| 2 · Adept | COLOSSAL FORCE, PRACTICED MOVES |
| 3 · Master | PERFECT TECHNIQUE, MARTIAL SWIFTNESS, COLOSSAL GRIP |

**Two of the seven are house-written and the tab says so.** The `Source` column
arrived with the Berserker and said `sheet` on all nine of its rows; this is the
first set where it does not. COLOSSAL FORCE and COLOSSAL GRIP say `house` and
both are marked in `talents.js` where they sit, the same way `martial.js` marks
its eight house-written moves. If a sheet ever arrives for them, that column is
the list of what to overwrite.

### What the workbook needed on the way in

Very little, and that is worth saying: the Ability tab is seven clean sentences
and six of them were transcribed with nothing touched at all.

- **Spellings, on two cards.** GIANT SLAYER's "Colosal Weapon" reads Colossal,
  which is what the weapons carrying the tag are called. COLOSSAL GRIP arrived
  as "You can now equped Pair Two-handed  colosall weapon, and your Colosall
  weapon attack cost 1 lest Aciton Points" and reads "You can now equip Paired
  Colossal Weapons, and your Colossal Weapon Attacks cost 1 less Action Point."
  Six corrections and a missing full stop, and nothing about what the card does
  was touched.
- **"Paired Two-Handed Colossal Weapon" is "Paired Colossal Weapons"**, which is
  the name of the item in `weapons.js`, so the card and the thing it lets you
  pick up say the same words. The item still carries the `Two-Handed` tag, so
  nothing the sentence claimed was dropped.
- **Elevated and Empowered were both already right**, which no other sheet has
  managed first time. COLOSSAL FORCE Elevates (the same dice one size up) and
  PERFECT TECHNIQUE Empowers (another die). Getting those two the wrong way round
  changes every number a card prints, and this tab did not.
- **Nothing needed a marker.** No card here prints a die pool, an attribute or a
  level, so the seven bodies carry no `[[math]]`, no `{attribute}` and no
  `{{link}}` at all. The Berserker needed three markers on nine cards; this needs
  none on seven.

### The weapon category the notes tab asked for

The `Developpement Notes` tab is one row and it is a build order, so it was
built. Its own words:

> Make a new category of weapon that is called colosal weapon that uses physique,
> they cost 5 actoin point to use normal. There is a bow, two-hand, Polearm. The
> bow as peircing shot that can hit multiple enemy in a line as long as it keep
> beating the reflex of poel as special attack, two-hand special attack is cleave
> and polearm is a hit that also push. Polearm as more range. Then also make athe
> colosal paired two-hand which as a 6 Action point attack were you attack with
> both weapon at the same time. The special move is wirwind were you hit everyone
> around you.

It was not optional. GIANT SLAYER and COLOSSAL GRIP both name a Colossal Weapon,
so without the category two of the seven cards would point at a kind of weapon
nothing in the codex is. **Four weapons and eight cards**, in `weapons.js`:

| Weapon | Weight | Attack | Special Attack |
| ------ | ------ | ------ | -------------- |
| Colossal Two-Handed Weapon | 8 kg | Strike, 5 AP, 3 m | Cleave, 5 AP + 1 WP, everything in a 4.5 m arc |
| Colossal Polearm | 7 kg | Thrust, 5 AP, 4.5 m | Drive, 5 AP + 1 WP, and a 3 m push |
| Colossal Bow | 6 kg | Shoot, 5 AP, 30 m | Piercing Shot, 5 AP + 1 WP, down a line |
| Paired Colossal Weapons | 16 kg | Double Strike, 6 AP, two rolls | Whirlwind, 6 AP + 1 WP, everything within 3 m |

The category, the attribute, the four weapons, both Action Point costs and all
four special attacks are the tab's. **The dice, the reaches, the push distance
and the weights are house-written**, and this is the list to overwrite when a
sheet arrives for them:

- **Every Colossal attack deals `3d6 + 2*stat`**, off the scale the rest of
  `weapons.js` keeps: 2 Action Points buys `1d6 + stat`, 3 buys `2d6 + stat` and
  4 buys `2d6 + 2*stat`, so 5 buys one more die. Nothing steps the multiplier.
- **`stat: 'physique'` on all eight.** That one is the tab's: "uses physique".
- **The polearm's reach is the whole of what it buys.** 4.5 m on the plain attack
  where the other two melee weapons reach 3, and the same dice, so choosing it
  over the two-hander is a step of distance traded against an arc.
- **The Piercing Shot is one roll, not two.** The first entity is a Weapon Attack
  against Defense, and that same number is then held against each Reflex behind
  it, stopping at the first one it does not beat. "As long as it keep beating the
  reflex" is literal that way, and a shot that runs out of force stops where it
  stopped instead of being rerolled into a second chance.
- **`Colossal` is a second tag, not a category of its own.** Three of the four are
  still held in two hands, so they carry `Two-Handed` as well and everything a set
  hangs on that tag reaches them. That is the reading the whole set is built on:
  its own MARTIAL TRAINING lets moves be used "with Two-Handed Weapons" and
  COLOSSAL GRIP calls the paired one a Two-Handed Colossal Weapon in the same
  breath. The bow is not a melee weapon and the Greatbow beside it carries no
  `Two-Handed` either, so it stays `Bow`. **What that costs the bow is real and
  worth checking**: a Colossal Bow gets GIANT SLAYER's advantage and neither
  COLOSSAL FORCE's Elevate nor PERFECT TECHNIQUE's dice.
- **The weights are the cost the Action Points do not charge.** A starting Physique
  of 4 carries 20 kg, so a Colossal weapon is a quarter of everything you can lift
  and the paired pair is most of it. The carry ceiling is one a character is
  allowed to cross, which is what makes this a price rather than a wall.

### What reaches the sheet, and what does not

Five of the seven cards move a number the sheet works out. Two do not, and both
are Action Point discounts.

`weaponRiders` in `moves.js` grew a **`grants` list** for this set, because it is
the first whose cards hang on two different weapon tags at once. Each entry names
the tag it wants and falls back to the set's own `weapon` when it does not, which
is what keeps the Duelist's two entries reading exactly as they always did. Four
things an entry can carry: `advantage`, `defense`, `elevate` and `perMove`.

| Card | Reaches the sheet as |
| ---- | -------------------- |
| MARTIAL TRAINING | the `loadout`: 3, 4 and 5 moves by rank, tiers by rank, changed on a long rest |
| GIANT SLAYER | `advantage` on the `Colossal` tag |
| COLOSSAL FORCE | `elevate` on the `Two-Handed` tag |
| PRACTICED MOVES | `martial.onReaction` at Rank 2, and nothing else (see below) |
| PERFECT TECHNIQUE | `martial.perAttack` 2, and `perMove` on the `Two-Handed` tag |
| MARTIAL SWIFTNESS | nothing (see below) |
| COLOSSAL GRIP | nothing, but the weapons it names are real |

`perMove` is the only genuinely new shape: a die **per Martial Move riding the
swing** rather than a die for having laid any, so a Master Colossus who laid two
gets two and one who laid none gets nothing.

### Open questions

Four, and none of them is a guess. Every one stands as the sheet wrote it.

1. **Three Action Point discounts, none of them wired.** MARTIAL SWIFTNESS ("your
   Martial Moves no longer cost Action Points"), PRACTICED MOVES ("that Martial
   Move costs no Action Points") and COLOSSAL GRIP ("cost 1 less Action Point").
   The chip on the quick bar can be told to charge less, but the use prompt deals
   the card beside the button and the card prints what the codex says it costs, so
   the two would disagree at the exact moment somebody is deciding whether to pay.
   **A card printing 1 beside a button charging 0 is worse than a rule the table
   reads once.** This is the same call the Berserker's RECKLESS VIOLENCE got, and
   it is now three cards on one set rather than one on another, which is the
   argument for building somewhere to print a discounted cost.
   PRACTICED MOVES has a second reason on top: a move is laid *before* the swing,
   so the sheet does not yet know whether the attack it rides will be a reaction.
2. **"You can use them with Two-Handed Weapons" is read as a permission.** The
   overview calls Martial Moves "the trained manoeuvres nobody with two hands on a
   haft has the time for", so this is the set that buys the time rather than a set
   that is restricted to it. Read the other way it would be the only weapon gate on
   a move in the codex. Nothing enforces it either way, because `canLayMove` has
   never asked what is in your hand: a move is laid before the swing and the weapon
   can still be swapped after.
3. **PERFECT TECHNIQUE's second move is not gated on the weapon.** The card says
   "two Martial Moves on the same Two-Handed Weapon Attack", and `perAttack` is
   read when a move is *laid*, which is before the swing exists. Refusing it would
   mean refusing it against a weapon that may not be the one it ends up riding, so
   the count is ungated the same way the Duelist's SHARP is. The die each move adds
   *is* gated, because that is read on the attack itself.
4. **COLOSSAL GRIP's first half is a gate on an item, and the sheet has none.**
   Nothing stops anybody equipping Paired Colossal Weapons, the same way nothing
   stops a wizard putting on full plate. What makes it a Master card in practice is
   the 16 kg.

### How the transcription was proved

The same round trip the Berserker got. Every card's `id`, `Name`, `Tags`, `AP`,
`WP`, `Main Effect` and `Source` rebuilt out of the codex fields into the sheet's
own written form and compared to the cell, quote- and whitespace-normalised, plus
the Overview tab's four fields. The two corrections above were declared to the
script and applied to the *sheet* side before comparing, so an undeclared
difference is a finding rather than a diff nobody sees.
**46 of 46 comparisons match.**

### The picture folder

Eight files in `data/Colossus/`, four at 2400x1792 and four at 1200x896, cut the
same way the Berserker's were, so the Image column was empty on every row and
`npm run art:cards` placed them from the folder. Seven card plates into
`public/cards/` and `Colossal Overview.jpg` into `public/talents/colossus.jpg`.

**Three needed an alias in `pull-card-art.mjs`.** `Matrtial Training.jpg` and
`Paracticed Move.jpg` are plain misspellings, one letter too many apiece and a
plural too few on the second. The third is the overview plate: the folder rule
claims a set's plate by the set's own name, and `Colossal Overview.jpg` is the
adjective rather than the name, which two letters is enough to defeat. It is in
`PLATE_ALIASES` beside the Draconic Bond's.

Pasting the `id` and `Image` columns out of `templates/colossus-ability.csv` back
into the sheet retires all three.

## The ten missing weapon types, 2026-08-24

Off the conversion pass over `data/Source Temp/`, which is a folder of everything
ever made for the system across its iterations. That pass produced 20 workbooks
under `data/Conversion/` and nothing else; this is the first of them to reach
`src/`, and it is the weapons only.

**Ten weapons and twenty ability cards.** Six were named in the old weapon lists
and never built: Polearm, Spear, Great Shield, Crossbow, Hand Crossbow and the
Tome of Incantations, which the old category tab called Incant. Three are the
Thrown class, which was the only old weapon class with no descendant here at all:
Javelins, Throwing Hatchets and the Sling. And Paired One-Handed Weapons mirrors
Paired Colossal Weapons, which had been built without its ordinary-sized twin.

The wall goes from 26 weapons to 36, and `CARDS` from 303 to 323.

### Two new tag values, and only two

`Crossbow` and `Thrown`. Everything else reuses a tag the wall already knows:
`Reach` for the Polearm and the Spear, `Focus` for the Tome, `Paired` for the two
new pairs, `Shielded` for the Great Shield.

That restraint is deliberate, because a tag here is not decoration. `weaponRiders`
in `moves.js` does a plain membership check against a talent set's `weapon` tag, so
every new tag value is a new thing for a set to fail to cover.

### Three tags left off on purpose

This is the part worth knowing, because each one would have quietly handed an
existing set a weapon nobody wrote it for.

**Spear carries no `One-Handed`.** The Whip does not carry it either, though a whip
is swung in one hand, so on this wall a reach weapon carries `Reach` and stops
there. Tagging the Spear `One-Handed` would have given a Duelist a weapon that
reaches 3 meters and can be thrown, on top of everything DEXTEROUS already grants.

**Great Shield carries no `Two-Handed`**, matching `Shield & One-Handed`, which
carries `Shielded` alone. Otherwise it would be the only weapon in the codex
satisfying two sets' `weapon` tags at once, and a Colossus holding a shield is not
a thing anybody has ruled on.

**Tome of Incantations carries no `Two-Handed`**, matching the Staff, for the same
reason: COLOSSAL FORCE would have started Elevating a spellbook.

Polearm *does* carry `Two-Handed`, because Colossal Polearm already does and the
ordinary one should read the same. It is the one new weapon an existing set
reaches, and it is the Colossus reaching a polearm, which is right.

### Every number came off the other 35 cards

Read back off them rather than invented:

| Class | Damage | AP | stat |
| ----- | ------ | -- | ---- |
| light | `1d6 + stat` | 1 to 2 | instinct |
| standard | `2d6 + stat` | 1 to 3 | instinct |
| heavy two-handed | `2d6 + 2*stat` | 3 to 4 | physique |
| concentrated | `3d6 + stat` | 2 to 4 | mind or instinct |
| colossal | `3d6 + 2*stat` | 5 to 6 | physique |

A Special Weapon Attack costs 1 Willpower and 0 to 1 Action Points over the plain
one. A Reload costs no Willpower and its Action Points scale with the shots it
restores: the pistol restores 3 for 3, the rifle 2 for 4, the canon 1 for 3. The
Crossbow restores 1 for 3 and the Hand Crossbow 2 for 4, which are the canon's
rate and the rifle's.

### Three of them were wrong, and the arithmetic is why

Each new weapon was checked cycle by cycle against its nearest built neighbour at
attribute 10. Three came out strictly better than something already shipped.

**Hand Crossbow** shot for 1 Action Point and reloaded for 2, so a full cycle was
4 points for 34 damage where a Flintlock Pistol spends 6 for 40.5. Better per
point, better per shot, longer reach on the bigger die. It is on the rifle's rate
now: 2 a shot, 4 to reload.

**Paired One-Handed Flurry** cost 5 Action Points and a Willpower for two hits
totalling 34, which is exactly what a One-Handed Weapon does with a Strike and a
Swift Strike for 5 points and no Willpower. Now 4, so the Willpower buys a point.

**Great Shield Wall** cost 1 point and a Willpower, the same as the ordinary
`shield-block`, for `3d6 + 2*stat` against that card's `2d6 + stat` plus cover for
an ally behind. Now 2.

### Two trades left in, deliberately

**Javelins throw for 3 Action Points** where the Greatbow pays 4 for the same
`2d6 + 2*stat`. The javelin buys that point with range, 18 meters against 30, and
with the weapon being on the floor afterward. If it should cost 4, it is one number.

**Great Shield is a straight upgrade on `Shield & One-Handed`** on both cards. Its
price is 12 kg against 6, and carry weight is 10 kg a point of Physique, so the
6 kg is a real cost on the sheet rather than on the card. That is the flat-cost
rule of 2026-08-22 doing its job: weight is the only field that separates two
weapons, so weight is where a difference has to go.

### No pictures, and that is not a gap

`art_url` is `null` on all ten and on all twenty cards, which is the state every
other weapon on this wall is already in: not one weapon or weapon ability has
art today. Nothing was added to `itemArt.js` or `cardArt.js`, and nothing needs
to be until there are pictures. The Image Prompts tab of
`data/Conversion/Weapons.xlsx` holds a prompt for each of the ten.

### Two glyph cases

`glyphForItem` in `itemParts.jsx` picks an icon off the family tag, and its own
comment says a bow should never show up as a sword. `Crossbow` now returns the bow
and `Thrown` returns the hand, rather than both falling through to the generic
`Ranged Weapon` bow, which would have drawn a longbow for a sling.

### How it was proved

`lint:text`, `lint:math`, `lint:halves`, `lint:riders`, `eslint` and `vite build`
all clean. `lint:text` caught one serial comma in the Crossbow blurb, which is
what it is for.

Then every one of the twenty bodies was run through `resolveValue` against a
Physique 8, Instinct 10, Mind 6 character at level 5: **20 of 20 resolve, no
`NaN`, and no leftover marker outside `{stat}`, `{roll}` and `{damage}`.** Ids are
unique across all 323 cards and every `abilities` reference resolves through
`getCard`.

## The weapon table, and the wall rebuilt on it, 2026-08-24

Handed over in chat as a screenshot of `Table3`: ten families across the columns
and five costs down the rows, thirty-one cells. Jules: "Ok, I want to redo the
weapon. In the table given you all existing type of weapon."

So this is not a pull that added weapons, it is the one that **replaced the
wall**. Everything on it before came off, and what is here now is the table plus
the twelve variations the magic families ask for.

The wall goes from 36 weapons to 39 cells (45 items, counting Claws & Teeth and
the five named enchanted ones), and 78 weapon cards.

### The cost column is the whole balance

The one thing the table settles that nothing settled before: **a weapon's cost is
its Action Point cost, and the cost is the only thing that sets the damage.**

| Cost | Damage |
| ---- | ------ |
| 2 | `1d6 + stat` |
| 3 | `2d6 + stat` |
| 4 | `2d6 + 2*stat` |
| 5 | `3d6 + 2*stat` |
| 6 | `3d6 + 3*stat` |

Word for word: "Using base cost / 2 Cost weapon do 1d6 + Stat / 3 Cost weapon do
2d6 + Stat / 4 Cost weapon do 2d6 + 2xStat / 5 Cost Weapon do 3d6 + 2xStat / 6
Cost weapon do 3d6 + 3xstat".

Three families read the ladder sideways, and all three rules are Jules's:

- **`X + Shield`** deals what the bare weapon deals and costs one point more.
  "They base attack is the same as the normal +1. So finesse + Shield base attack
  do that same as finesse in damage but cost 1 more."
- **`Paired X`** deals the rung below with its dice as d4, rolled twice, at one
  point more, and every roll it makes is at disadvantage. "Their attack use twice
  d4 instead of d6 and they do one attack roll to hit damage twice. So Finesse
  paired if it lands is 2x 1d4 + Stat."
- **Crossbows and the Ballista** deal their own rung for one point less and have
  to reload. "The cost of the weapon attack is by default 1 less, but it requires
  to reload to shoot again."

`scripts/check-weapons.mjs` is the round trip on all of it. The table is written
out there once, cell by cell, and every card is measured against it: cost, dice,
attribute, what the second card costs, and whether a melee weapon that is not a
reach weapon reaches 1 Meter. `npm run lint:weapons`, and `--list` prints the
whole grid back.

### The attribute of every cell is the designer's

The colours on the screenshot could not be read reliably, so the map was asked for
in words and given in three lists on 2026-08-24. It is transcribed in `TABLE` in
`check-weapons.mjs` and it is the authority:

**Instinct (15).** Finesse Weapon, Short Bow, Flintlock Pistol, Fist Weapon, Bow,
Flintlock Rifle, Whip, Light Crossbow, Paired Finesse, Enchanted Instrument,
Finesse + Shield, Portable Canon, Polearm, Crossbow, Heavy Crossbow.

**Physique (12).** Melee Light, Melee Heavy, Long Bow, Paired Light Weapon, Melee
Light + Shield, Melee Great, Great Bow, Great Polearm, Paired Heavy Weapon, Melee
Heavy + Shield, Ballista, Paired Great Weapon.

**Mind (4).** Wand, Tome of Incantations, Staff, Censer.

Four of those are worth noticing because a guess would have got them wrong:
**Melee Light is Physique** while Finesse is Instinct, which is the difference
between those two columns. **Polearm is Instinct and Great Polearm is Physique**,
the one family that changes attribute up its own column. **Heavy Crossbow is
Instinct and the Ballista is Physique**, the same thing in the crossbow column.
And the **Enchanted Instrument is Instinct**, so it is the one Focus on the wall
that is not a Mind weapon.

### Twelve weapons left the codex

Jules, asked directly: drop all twelve. They have no cell on the table.

Bo Staff, Trident, Daggers, One-Handed Weapon, Two-Handed Weapon, Shield &
One-Handed, Dual Pistols, Spear, Great Shield, Javelins, Throwing Hatchets and
the Sling. Eight of those were built the day before this, off `Source Temp/`, and
they lasted a day.

**The Thrown class is gone with them**, and it is the only weapon class on the old
wall with no descendant here at all. The `Thrown` tag went with it, and so did the
glyph branch in `itemParts.jsx` that served it.

Two things did not go:

- **Claws & Teeth** stays. It is not a weapon anybody buys, it is what a Feral
  Cursed has instead of one (`FERAL_WEAPON` in `feral.js`). Its reach came down to
  1 Meter with everything else.
- **The five named enchanted weapons** stay and were repointed. Cold-Infused
  Sword, Patien and Grave-Lantern Blade teach Melee Light's two cards where they
  taught One-Handed's; the Imbued Flintlock Pistol is unchanged; and the **Deep
  Sea Trident is a Polearm** now, which is the closest thing on the wall to a
  three-pronged fishing spear held at the far end. Its reach came down from 4.5
  Meter to 3 with the family.

### Great is Colossal, confirmed

Melee Great, Great Bow, Great Polearm and Paired Great Weapon cost 5, 5, 5 and 6
Action Points on Physique. That is exactly what the four Colossal weapons built
for the Colossus set the day before cost, so they were put to Jules as the same
tier renamed, and they are: "Yes, Great is Colossal."

All four carry `Colossal` as a second tag, so GIANT SLAYER and COLOSSAL GRIP still
see them and neither card had to move. `check-weapons.mjs` asserts both halves:
every Great weapon carries `Colossal`, and nothing else does.

**Superseded the same day.** The tag pass later on 2026-08-24 renamed `Colossal` to
`Great` and reworded both cards. See
[the card face](#the-card-face-the-magazine-and-the-tag-pass-2026-08-24).

### The two sets moved onto families

Jules, mid-build: "Update duelist to be : Finesse & Light Melee and Colossus to be
Heavy & Great Melee by the way."

That is the change the old wall could not have taken. `One-Handed` and `Two-Handed`
were doing two jobs at once, describing how a weapon is held *and* standing in for
what kind of weapon it is, and a set hung on the second meaning. Now the family is
its own tag and the hands are just the hands.

| | was | is |
| --- | --- | --- |
| Duelist | `'One-Handed'` | `['Finesse', 'Light Melee']` |
| Colossus | `'Two-Handed'` | `['Heavy Melee', 'Great Melee']` |
| GIANT SLAYER | `'Colossal'` | unchanged |
| Feral Curse | `'Natural'` | unchanged |

**A `martial` spec may name more than one tag now**, and any one of them is a
match. That is one line in `tagged` in `moves.js`; `weaponRiders` never had to
know. Seven card bodies were reworded to say what they now do, on Jules's
instruction rather than as a transcription: DEXTEROUS, AGILE and FOLLOW UP on the
Duelist, MARTIAL TRAINING, COLOSSAL FORCE, PERFECT TECHNIQUE and COLOSSAL GRIP on
the Colossus.

**Every weapon carries exactly one of `One-Handed` and `Two-Handed`** now, which is
Jules's own rule read literally: "Some of this as marker as one-hand, like finesse
melee light, pistol, whip, wand, ect, the other are two-hands." The named five are
One-Handed; the Light Crossbow and the three Censers were read into the "ect"
because both are held in one hand; everything else is Two-Handed, the shielded and
paired ones included. Nothing hangs on those two tags any more, so a wrong reading
here costs nothing but the word on the card.

### A shield is worth something only while you are holding it

"The shield give 3 Armor and 1 Defense, that is their special is a passive."

So the three shielded weapons carry `armor: 3` and `defense: 1` on the item, the
way a breastplate does, and their second card is SHIELD - GUARD, one passive
shared by all three because the numbers are the same three times over.

The catch is that the sheet has **two weapon slots and only one of them is a
hand**. `wornItems` walks both, so a shield stowed in the secondary slot would
have been worth 3 Armor from your back, and two shielded weapons carried at once
would have been worth 6. That is the whole point of Swap Weapons costing Action
Points, so it was closed rather than left:

- `heldItems` in `items.js` is `wornItems` without the secondary weapon, and
  `equipmentEffects` reads it for `defenseFlat` and `armorTotal` alone.
- `placesOf` in `statMath.js` takes a `stowed` flag and the Armor and Defense
  lines pass `false`, so the tooltip says the same thing the tile does.
- Weight and Magic Burden still walk both hands, because weight is what a thing
  costs to carry and you are carrying it either way.

There is a fixture for it in `check-stat-math.mjs`, "a shield in hand and a second
one stowed": Armor 3, Defense +1, and 14 kg of weapons.

`shield-guard` is also **the one card in the codex that names no attribute**. Three
weapons share it and they do not agree on one (Finesse + Shield is Instinct, the
other two Physique), and nothing on it rolls. `check-weapons.mjs` allows that only
for a card tagged `Passive`.

### What was house-written, and where

Everything below is invented off the designer's own scale and is what to overwrite
when a sheet arrives for it.

**Every ranged distance.** Jules: "For all the range weapon I let you review the
range of them to be logical." Melee is 1 Meter unless the weapon is a reach weapon,
which is their rule; the Whip keeps 4.5 Meter and both Polearms have 3, which is
their number too. The rest:

| | | | |
| --- | --- | --- | --- |
| Short Bow 18m | Bow 25m | Long Bow 45m | Great Bow 60m |
| Flintlock Pistol 15m | Flintlock Rifle 30m | Portable Canon 25m | |
| Light Crossbow 25m | Crossbow 30m | Heavy Crossbow 45m | Ballista 60m |
| Wands 18m | Tomes 12m | Staves 18m | Censers 3m |
| Enchanted Instrument 15m | | | |

The Censer's 3 Meter is the shortest range on the wall and shorter than most melee
weapons swing, which is the reading of "They have real short range".

**The Reload Bolt costs 1 Action Point**, on all four crossbows. That is the point
the discount came off, so a shot plus its reload costs exactly what the cost table
asks and a crossbow is never cheaper than a bow over two turns. What it buys is
*when*: the shot is cheap now and the winding is paid on a turn with a point spare.

**What an unpriced special costs.** Jules priced four outright: FLURRY at 5 Action
Points and 2 Willpower, AIMED SHOT at the plain attack's cost plus 1 and 1
Willpower, the Polearm's DRIVE at the plain attack's own cost and 1 Willpower, and
the Instrument's DISCORD the same. Everything else was read off those: a special
that multiplies what one swing puts out costs a point more than the plain attack,
one that spends itself on an area or a rider costs the same, and both cost 1
Willpower. A Reload rolls nothing and costs none.

**The Staff's area is 3 Meter**, off "small area". It is half the Tome's ring and
the smallest area anything in the codex throws.

**Seven special moves are named here.** Jules named FLURRY, AIMED SHOT, VOLLEY and
WHIRLWIND. The rest are house names for moves they described but did not name:
DRIVE (the Polearm's push), CHORUS (the Tome's ring), BURST (the Staff's area),
FUMIGATE (the Censer's smoke), DISCORD (the Instrument's rider), BOLT, RECITE,
WAFT and BLAST for the plain attacks of the four magic families.

**Every weight**, on the same scale as the wall this replaced.

**SWIFT STRIKE and CLEAVE were carried over rather than invented.** Jules named a
second card for every family except the three Melee ones, so Melee Light keeps the
One-Handed Weapon's Swift Strike and Melee Heavy and Melee Great keep the
two-hander's Cleave. Cleave's arc came down to 1 Meter with the reach.

**"Balista" is spelled Ballista**, the way "Colosal" was read as Colossal on the
way in. "Portable Canon" was left as it is, because it is already that in the
codex and its id is `portable-canon`.

### Six things for the designer

**0. `Great Melee` is column 2's cell and not the whole Great tier.** "Heavy &
Great Melee" was read literally, onto the two cells actually called Melee Heavy
and Melee Great (and their Paired versions). So a Colossus holding a **Great
Polearm** or a **Great Bow** gets GIANT SLAYER's advantage, because both carry
`Colossal`, but not COLOSSAL FORCE's Elevate or PERFECT TECHNIQUE's per-move die.
For the Great Bow that is unchanged from the old wall; for the Great Polearm it is
a narrowing, because the old Colossal Polearm carried `Two-Handed` and got the
Elevate. Say the word and `Great Melee` goes on all four Great weapons.

Where the two sets currently land, at rank 3:

| in hand | Duelist | Colossus |
| --- | --- | --- |
| Finesse Weapon, Melee Light, Paired Finesse | advantage + 1 Defense | nothing |
| Melee Heavy, Paired Heavy | nothing | Elevate + per-move die |
| Melee Great, Paired Great | nothing | advantage + Elevate + per-move die |
| Great Bow, Great Polearm | nothing | advantage only |
| Finesse + Shield, Melee Light + Shield | nothing | nothing |

**1. The Guardian set names an ability that no longer exists.** This is the real
one. INTERCEPT says "you can use your Shield & One-handed Block ability without
paying its action point cost", and SHIELD EXPERTISE's last sentence pays out
"after successfully blocking damage with a shield". The shield's second card is a
passive now, so there is no Block to use and nothing to trigger off. Both cards
were left exactly as written, with the problem flagged in `talents.js`, because
what a Guardian gets instead is a ruling and not a transcription. Two obvious
shapes: give the shielded weapons a third card, or rewrite those two clauses
around the passive.

**2. The three Melee weapons still have no special of the designer's.** Swift
Strike and Cleave are the old wall's. Worth a look, because they are the only
second cards on the wall nobody chose.

**3. Melee Heavy and Melee Great reach 1 Meter.** That follows the rule as
written ("For all melee weapon by default attack range is 1m", and only the Whip
and the Polearms were named as exceptions), but a greatsword reaching no further
than a dagger is worth confirming. The old wall gave a two-hander 3 Meter.

**4. Paired weapons may be strictly worse than the weapon under them.** Paired
Finesse costs 3 for `2x (1d4 + Instinct)` at disadvantage; Melee Light costs 3 for
`2d6 + Physique` with no penalty. Two hits beat one against Armor and the average
is close, but the disadvantage is on every roll the weapon ever makes, both cards,
forever. That is the designer's rule as written and it may be exactly the intent.

**5. The Wand's VOLLEY may be the best special on the wall.** Three projectiles at
3 Action Points and 1 Willpower, split however you like, where FLURRY pays 5 and 2
for three hits on one target. The prices come from two different rules of Jules's
own, so neither is invented, but they meet here.

### How it was proved

`lint:text`, `lint:math`, `lint:halves`, `lint:riders`, `lint:weapons`, `eslint`
and `vite build` all clean.

`check-weapons.mjs` is the new one and it is the transcription proof: **39 of 39
cells match the table** on cost, damage, attribute and the price of the second
card, with the shield, paired and crossbow rules applied. It also checks that
every weapon carries one hand tag and one category, that melee without `Reach`
reaches 1 Meter, that the four Great weapons and only those carry `Colossal`, that
every tag a set hangs on is on at least one weapon, and that no weapon card is
taught by nothing.

`check-stat-math.mjs` went from 11 fixtures to 12 with the stowed-shield sheet.
Its two old fixtures that held `one-handed` and `two-handed` now hold `melee-light`
and `melee-heavy`, which weigh the same, so the load lines did not move.

Then every one of the 78 bodies was run through `resolveValue` against a Physique
8, Instinct 10, Mind 6 character at level 5: **all 71 live values resolve, no
`NaN`, and no leftover marker outside `{stat}`, `{roll}` and `{damage}`.** Ids are
unique across the whole of `CARDS`, which is 339 cards now, and every `abilities`
reference resolves through `getCard`.

### No pictures

Nothing on this wall has art, which is the state the wall it replaced was in. The
old weapon ids that had none still have none, and the ones that are gone took
nothing with them: `cardArt.js` never carried a weapon card.

## The card face, the magazine and the tag pass, 2026-08-24

The wall rebuilt earlier the same day, read back and corrected. Nine instructions
in one message, and they land in four places: what a card is headed with, what a
firearm costs and holds, what four cards are priced at, and what a weapon's tags
say.

### The weapon name moved off the title and into the banner

> "In the weapon card, the weapon name should be in the banner not the title. So
> Short bow shoot should just be called Shoot. And in the banner above read
> Ranged - Weapon Attack - Shortbow."

So a dealt card reads:

| | was | is |
| --- | --- | --- |
| title | Short Bow - Shoot | **Shoot** |
| banner | RANGED - WEAPON ATTACK | **RANGED - WEAPON ATTACK - SHORT BOW** |

**The card's `name` did not change**, and that is the whole of how this was built.
A name is the card's identity rather than its heading: it is what every
`{{link}}` resolves against, what `pull-card-art.mjs` matches a filename to, what
`data/templates/weapon-cards.csv` lists for the artist, and what a saved row
naming a card names. Renaming 78 of them to "Shoot", "Strike" and "Reload" would
also have collided in `CARD_BY_NAME`, where seven cards called Shoot leave one
card called Shoot.

What changed is a new field, `weapon`, on all 78 cards, holding the weapon as the
card names it. `cardTitle` takes it off the front of the name and `cardBanner`
puts it on the end of the tags, both in `cardText.js`. Four surfaces print the
title now: the dealt card, the brief, the Inventory tab's ability box and the
loadout row. `shortName` in `combatBar.js` used to cut the same string on its
dash and now reads the field, so the chip and the card can never disagree.

`check-weapons.mjs` asserts that every weapon card carries a `weapon` and that it
is the name's own prefix, which is the only way the two stay in step: the field is
a copy of half the name, and a copy is a thing that drifts.

A brief has no banner, so it carries the weapon as one more chip beside the tags.

### Focus is gone, and the implements are tags

> "Focus tag make no sense need to be removed. [...] Then Wand, Staffs ect are a
> tag."

`Focus` held the three Wands, the three Staves, the three Tomes, the three Censers
and the Enchanted Instrument under one word, and **no talent set ever reached for
it**: the only thing in the app that read it was the glyph picker. Each implement
is its own family tag now, on the rule the rest of the axis already followed.

| was | is |
| --- | --- |
| `Focus` on 13 weapons | `Wand`, `Staff`, `Tome`, `Censer`, `Instrument` |

All five still share the one glyph, because a wand, a stave, a tome, a censer and
a fiddle are five silhouettes nobody has drawn and one honest placeholder beats
five wrong ones.

### The tag axes, rewritten

> "Weapon is redundant in the weapon category so it can have but hidden. Ranged
> weapon should just be ranged, melee just melee. So Great bow can be
> Great - Ranged - Two-handed - Bow."

Five axes, and the first two are carried and never drawn:

| axis | values | shown |
| --- | --- | --- |
| rarity | Common, Uncommon, Rare, Epic | all but `Common` |
| kind | `Weapon`, on every weapon | no |
| size | `Great`, on the four whose names say Great | yes |
| category | `Melee`, `Ranged` | yes |
| hands | `One-Handed`, `Two-Handed` | yes |
| family | Finesse, Light Melee, Heavy Melee, Great Melee, Fist, Bow, Crossbow, Firearm, Polearm, Whip, Reach, Wand, Staff, Tome, Censer, Instrument, Paired, Shielded, Natural | yes |

`Common` is hidden on the same reasoning `Weapon` is, and it was not asked for:
the example tag line has no rarity in it, and Common is the default on every
weapon but five. Uncommon, Rare and Epic still show, and still carry their colour.
Both live in `HIDDEN_TAGS` in `itemParts.jsx`, so nothing was taken out of the
data and the filter row still reaches all of it. Great Bow now reads exactly as
asked: **Great · Ranged · Two-Handed · Bow**.

`Whip` is a new family tag, for the same reason a Wand is one, and because the
Duelist now reaches for it by name.

### Colossal is Great, and two cards say so

The tag renamed, on Jules's answer to where "Great" comes from: the Colossus
reaches its own weapons through `Heavy Melee` and `Great Melee`, so the second tag
on the four biggest is free to be the word the wall itself uses.

| | was | is |
| --- | --- | --- |
| the tag | `Colossal` on 4 weapons | `Great` on the same 4 |
| GIANT SLAYER reads | `Colossal` | `Great` |
| GIANT SLAYER prints | "a Colossal Weapon" | **"a Great Weapon"** |
| COLOSSAL GRIP prints | "your Colossal Weapon Attacks" | **"your Great Weapon Attacks"** |

**The two card bodies changed, which is a step past a retag and worth knowing
about.** The designer's own Ability tab spells the category "Colosal Weapon" on
both cards. A card that names a category no weapon carries is a rule a player
cannot check against the thing in their hands, so the printed word followed the
tag. The card *names* are untouched: COLOSSAL FORCE and COLOSSAL GRIP are names,
not categories. Ballista is deliberately **not** Great, so the tag still means
exactly the four it meant as `Colossal`.

### The Duelist reaches four families now

> "Duelist is Finesse, Whip, Fist and polearm. Update text in cards as well."

| | was | is |
| --- | --- | --- |
| Duelist | `['Finesse', 'Light Melee']` | `['Finesse', 'Whip', 'Fist', 'Polearm']` |
| Colossus | `['Heavy Melee', 'Great Melee']` | unchanged |

Wider in three places and narrower in one: the Whip, the Fist Weapon, the Polearm
and the Great Polearm come in, and Melee Light goes out with its three enchanted
cousins (Cold-Infused Sword, Patien, Grave-Lantern Blade). Six lines of card text
follow it, on DEXTEROUS, AGILE and FOLLOW UP, summaries included.

**Two of the four are Two-Handed**, which retires the reading that this set was
ever about the free hand. The overview still says "A Duelist fights with one hand
and keeps the other free" — that is prose the designer holds a copy of in
`Talent Set - Duelist - Overview.csv`, so it was left alone rather than quietly
rewritten. It now disagrees with the cards, and that is one for Jules.

Great Polearm carries `Polearm`, so a Duelist reaches a siege halberd. Nobody has
ruled on that either way and the tag the designer named is the tag that answers.

### A firearm fires for 1 Action Point

> "All shoot ablity should cost 1 for firams."

| | was | is | deals |
| --- | --- | --- | --- |
| Flintlock Pistol · Shoot | 2 AP | **1 AP** | 1d6 + Instinct |
| Flintlock Rifle · Shoot | 3 AP | **1 AP** | 2d6 + Instinct |
| Portable Canon · Shoot | 4 AP | **1 AP** | 2d6 + 2 × Instinct |

This takes the three firearms off the cost column, which was until now the only
thing on the wall that set damage. They keep the damage their rung buys and pay
for it somewhere else: the magazine. A Portable Canon puts out what 4 Action
Points buys for 1, once, and then somebody spends 3 loading it. `check-weapons.mjs`
carries it as a fourth sideways rule beside shield, paired and crossbow.

The three Reloads are unchanged at 3, 4 and 3.

### The magazine, drawn as rounds

> "Fire arms need to have added a bullet ocunt tarchar. So on the action next to
> shoot you you seel bullet shaped indicator that empty as you use. And the preive
> w to use should let you know as well. Same for crossbow but with 1 bolt."

Seven weapons hold ammunition and every one of them already had a Reload card and
a shot count printed in prose that nothing read:

| weapon | holds | Reload |
| --- | --- | --- |
| Flintlock Pistol | 3 Shots | 3 AP |
| Flintlock Rifle | 2 Shots | 4 AP |
| Portable Canon | 1 Shot | 3 AP |
| Light Crossbow, Crossbow, Heavy Crossbow, Ballista | 1 Bolt | 1 AP |

**It needed no new column.** `card_uses` already counts what a limited card has
spent, keyed by card id, and a magazine is that same count filled by a different
thing. So the attack carries `ammo: { max, unit, reload }` and the Reload carries
`reloads`, both riders on the card the way `uses` and `recharge` are, and
`magazineUse` in `uses.js` reads either end of the pair. One function, because a
chip and a row that disagree about whether a gun is loaded is the failure this
was built to avoid.

What a player sees:

- **rounds, not dots.** A belt charge is a dot because a flask holds a measure of
  something. A magazine holds countable objects, so the pip is the object: a
  cartridge for a Shot, a fletched bolt for a Bolt, filled copper while it is in
  there and an empty outline once it is gone. `AmmoPips` in `itemParts.jsx`.
- **on the loadout row, beside the attack**, which is where it was asked for. And
  on the Reload row too, because the row that fills a magazine is the row a reader
  looks at to find out whether it needs filling.
- **on the quick-bar chip**, in place of the "×2" a charged item gets.
- **on the use prompt**, at full size with the count spelled out. A round is the
  one cost a printed card cannot show, and the prompt is the last thing before the
  trigger.
- **refused when it is empty**, greyed with "Empty" and the reason in the tooltip,
  the way a spent flask is. A Reload with nothing to fill is refused as "Loaded".

The card bodies were rewritten to match. They used to explain the mechanism
("Every use of the Flintlock Pistol - Shoot ability consumes one shot") because
nothing implemented it; now the sheet counts, so the attack says a shot is spent
and the Reload says what it puts back.

**A long rest fills a magazine too, and that is a house ruling.** Nothing else on
the sheet is refillable only by spending Action Points, and a character who walked
out of a fight with an empty pistol and then slept should not have to mime a
Reload before the next one. The printed card still says what it says. One for
Jules if it should be Reload and nothing else.

### Four cards the designer priced by hand

> "Wand Volley should cost 5 action points and 2 willpower. Tome of incations
> Special attack should cost 4 action points and 2 WP."

| | was | is |
| --- | --- | --- |
| Volley, all three Wands | 3 AP · 1 WP | **5 AP · 2 WP** |
| Chorus, all three Tomes | 3 AP · 1 WP | **4 AP · 2 WP** |

Both break the rule the other specials follow, which is that a special costs the
plain attack's price or one more and 1 Willpower. Volley is now priced exactly as
Flurry is, and both of them sell the same thing: more than one hit off one roll.
`check-weapons.mjs` carries them by name beside Flurry rather than letting the
generic rule wave them through.

### Discord is contested, not aimed

> "Instrument discord is against hte grit of an enetity not an attack roll."

| | was | is |
| --- | --- | --- |
| Enchanted Instrument · Discord | Instinct Ranged Attack, vs Defense | **Instinct Roll, vs Grit** |

A wrong note is not thrown at anybody, it is endured. Its cost is unchanged, and
it is the codex's second roll shape rather than a third: the Tomes and the Censers
already contest Grit, and the file header's "exactly two shapes" note holds.

### The three staves have names

> "Name the staff something more in lore rather than just roce blunt and and
> sharp. Arcane sounding things."

| was | is | deals |
| --- | --- | --- |
| Sharp Staff | **Rivenstave** | Sharp |
| Force Staff | **Sunderstave** | Force |
| Blunt Staff | **Loadstave** | Blunt |

Jules picked the set. Each one still says what it does — riven air, a sundering
shove, a load coming down — without naming the damage type twice.

**The ids stay `sharp-staff`, `force-staff` and `blunt-staff`**, and the six card
ids with them. An id is what a saved sheet points at and what the art work list
already names its files for, so renaming one would orphan an equipped weapon and a
picture at once. The name is what a reader sees, the id is what the sheet
remembers, and only the first of those was asked to change.

### How it was proved

`check-weapons.mjs` gained four walks and kept the five it had:

- the **firearm** rule, as a fourth way of reading the cost grid
- **Volley** and **Chorus**, priced by name
- the **tag axes**: one rarity, one of Melee and Ranged, one of the two hands, the
  hidden `Weapon` on every weapon, no `Focus` anywhere, and `Great` on exactly the
  four whose names say Great
- the **title**: every weapon card carries a `weapon`, and it is the prefix of its
  own name
- the **magazines**: `ammo` and `reloads` point at each other, every count matches
  the designer's sheet, every round has a unit, and no card tells a reader to
  Reload without a rider that counts

All 39 cells match the table across 45 weapons and 78 cards, `npm run lint` and
`npm run lint:text` are clean, and the magazine was walked end to end: three shots
out of a pistol, refused empty, filled by its Reload, and half-filled by a long
rest.

Both art work lists were regenerated off the codex, so the 45 icon rows and 78
card rows carry the new names, tags, costs and bodies. `Image`, `Group` and `Note`
are the sheet's own columns and were carried across by id.

### Two things for Jules

1. **The Duelist overview still says "one hand".** Two of its four weapon
   families are Two-Handed now. The overview prose is the one thing here the
   designer holds their own copy of, so it was not touched.
2. **A long rest reloads.** The house ruling above. Say the word and it comes out,
   and a magazine is filled only by the card that says it fills it.

## The Arcanist, 2026-08-24

The eleventh talent set, and the first caster whose spells are not a *hand*.

It arrived as one tab, `Talent Set - Arcanist - Ability.csv`, with four cards and
five pictures in `data/Arcanist/`. The Overview was written here, which the
designer asked for in those words and asked to be about the fantasy rather than
the rules. Its raw material is theirs: see "where the overview came from" below.

| Rank | Cards |
| ---- | ----- |
| 1 · Novice | SPELLBOOK, ARCANE RESEARCH |
| 2 · Adept | OVERLOAD |
| 3 · Master | PERFECT CASTING |

### The superseded six-card draft

`data/Conversion/Talent Set - Arcanist.xlsx` (2026-08-23) is a seven-tab
conversion off `Hazebound System - Arcanist.pdf`, and it proposes a **different
set**: SPELLBOOK, TRANSCRIBING, IMPROVED FORMULAS, ARCANE SPECIALIST, ANALYTIC
SIGHT and ARCHMAGI, with a tome capped at Mind + level and a spell taking 24
hours of copying in two-hour pieces.

**None of it is built.** Three things settle it, and they all point the same way:

- the four-card CSV is a day newer,
- the five pictures in `data/Arcanist/` are drawn for *those* four cards and the
  set plate, and the xlsx's own `Image Prompts` tab names six different files
  (`Transcribing.jpg`, `Improved Formulas.jpg` and the rest) that do not exist,
- the xlsx's own `Special Feature` tab called the half-transcribed spell "a
  progress bar the site has nowhere for", and the new sheet deletes it. Research
  is one long rest action that finishes in that rest, which the site already has
  a slot for.

The proposal is kept rather than thrown away, because its `Overview` tab is the
best writing anybody has done about this set and it is where the blurb comes
from. The rest of it is a record of a road not taken.

### Where the overview came from

The designer's own `Overview` tab, with the withdrawn mechanics taken out. What
survived is the fantasy, almost word for word: "An Arcanist does not know spells,
they own them", the tome "bound to their being" that "comes when called even
after it has been burned", nothing arriving "by revelation", a spell "found in
somebody else's book or taught by somebody who has it", and the book that "has to
be held and read aloud, which costs a hand and a voice".

What came out was every sentence describing a rule that no longer exists: "24
hours of transcription, taken two hours at a time", "as many as their Mind and
their level allow", "a school is chosen and then cast from for free until the
Willpower runs out", and the Rank 5 second school. The tagline is the `Summary`
column untouched.

### What the Ability tab needed on the way in

The round trip, per card, against the designer's own cells:

| Card | Words kept | Tags | AP · WP |
| ---- | ---------- | ---- | ------- |
| SPELLBOOK | 94% | same | same |
| ARCANE RESEARCH | 89% | same | same |
| OVERLOAD | 100% | same | same |
| PERFECT CASTING | 71% | **changed**, see below | same |

Every difference, and there are only six:

- **"As an Arcanist you record"** loses its first three words on SPELLBOOK, the
  way MARTIAL TRAINING is not headed "As a Colossus". The card is in the set and
  the tag says so.
- **A comma splice becomes an "and"**, and `dismiss` gets the `it` it was missing:
  "you record all your spells in a bound tome, you can summon and dismiss at
  will" reads "...bound tome, and you can summon and dismiss it at will".
- **"Additional Willpower" and "Advantage" are lowercased.** The codex capitalises
  a term off the Status & Terms sheet, and Empowered is one. An adjective is not,
  and every other card writes "made with advantage" in prose. OVERLOAD is
  otherwise the cell verbatim, all sixteen words of it.
- **"you can take the Arcane Research action" reads "you can use your long rest
  action"** on ARCANE RESEARCH. That is FUNGAL INVOCATION's idiom word for word.
  The site's rest buys exactly one action, and a card should say which one it is
  spending rather than naming itself.
- **"multiplied by 10 + your level" is written out as the arithmetic.** See the
  ruling below.
- **"cannot bring the spell below 1" reads "to a minimum of 1"** on PERFECT
  CASTING, which is the designer's own phrasing for the identical rule on the
  superseded sheet's IMPROVED FORMULAS. The original is a subjectless fragment.

No card in the codex that is not on the sheet. Nothing invented.

### The spellbook is a library, not a hand

This is the real build, and it is the first pool in the codex that does not
behave like the Mycomancer's.

Every other choosing set prepares. A Mycomancer knows four Primal spells at Rank
2, has four, cannot have five, and swaps any number of them at a long rest. An
Arcanist **keeps a library**: spells go in one at a time, they stay in, the
ceiling is a formula off rank *and level*, and a spell entering a full book pushes
one out.

So a loadout spec grew four fields, all of them generic and all of them a sentence
of ARCANE RESEARCH:

| Field | The sentence |
| ----- | ------------ |
| `start: 5` | "You start with 5 Novice Spells of your choice" |
| `capacity: { perRank: 10, perLevel: 1 }` | "a number of spells equal to your Rank in Arcanist multiplied by 10 + your level" |
| `research: ['long']` | "Whenever you take a Long Rest ... research a single spell" |
| no `school` | "from any school" |

The distinction the code turns on is **capacity against allowance**. A hand has
one number and they are the same. A library has two: what it could hold one day
(`capacity`), and what it may hold tonight (`allowance`).

The allowance is *what is written in the book*, floored at the free five and
ceilinged at the capacity, plus whatever the window in front of the player grants.
A long rest's research grants 1. That is what lets exactly one spell in, and it is
what makes the tap after it replace instead of add, which is the card's "you will
have to replace a spell" with no line of its own.

**No stored counter, deliberately.** A `researched: 6` column on the talent entry
would be a second source of truth for something the picks already say, and the two
would drift the first time somebody edited a book by hand.

Proved end to end: a fresh Rank 1 shows 5 of 11; the five are chosen off the
sheet; a sixth chosen off the sheet **replaces** rather than adds; the long rest
offers `Research a spell · 5 of 11 written down. Tonight adds one more.`; taking
it leaves six. A full book at 11 reads `Full at 11. Tonight's spell replaces one
already written.` and researching one names the spell it displaced.

### A schoolless pool broke a gate nobody had to think about before

`spells.js` says, in as many words, that a Unique Spell stays out of every pool
without a line being added to either gate, "because no set's school is Elemental
or Nightmare".

**The Arcanist is the first spec to name no school at all**, so that gate stopped
firing. Without a fix, a Rank 1 Arcanist could research `nightmare-wall` and
`deep-sea-accretion`, which exist on one item each and are nobody's to prepare,
plus `unwritten-light` and `unwritten-shadow`, which are stand-ins for two schools
nobody has written yet.

Two gates in `loadoutOptions` now, and both were free for every existing set:

- a card carrying `placeholder` is refused as a school: the school is not written,
  so there is nothing here to learn,
- the tier gate lost its `tier &&` guard, so a card off the Novice/Adept/Master
  ladder is refused rather than waved through. Every Martial Move and every real
  spell carries a rung; only the four above do not.

The pool comes out at **28 spells at Rank 1, 54 at Rank 3**, and the Mycomancer's
is still exactly the 24 it was.

### Four rulings, all flagged in the code where they sit

1. **The capacity formula reads two ways.** "your Rank in Arcanist multiplied by
   10 + your level" is either `(rank × 10) + level` or `rank × (10 + level)`. They
   agree only at Rank 1. Built as `(rank × 10) + level`, which is what precedence
   gives: 11 at Rank 1 level 1, 24 at Rank 2 level 4, 38 at Rank 3 level 8. The
   other reading gives 28 and 54. **Say the word and it is one number in
   `talents.js`.**
2. **ARCANE RESEARCH names no tier.** It is the only card granting a pool that
   does not print the "at Rank 2 you can learn Adept" ladder, so read literally a
   Rank 1 Arcanist researches a Master spell on the first night. Built with the
   ladder every other casting set has, which is also what the superseded sheet's
   TRANSCRIBING spelled out.
3. **PERFECT CASTING is tagged `Long Rest` on the sheet.** That is ARCANE
   RESEARCH's tag two rows above it and cannot be this card's, because nothing on
   it is done at a rest. Built as `Passive`, which is what OVERLOAD beside it
   carries and what IMPROVED FORMULAS carried for the same sentence.
4. **`spellcasting` was added to the Tags column.** The superseded sheet says
   "Support, Control, Mind" and all three are kept. A caster missing off the
   casting shelf of the chooser wall would be a hole in the filter.

### Two things left printed rather than wired

- **PERFECT CASTING's discount** was the fifth card on this line and is now
  **wired**. See "The cut, printed where it is charged" below. The other four stay
  in prose.
- **SPELLBOOK's free hand and voice.** A voice is not on the sheet at all. A free
  hand is, and it is still prose: the sheet has nowhere to refuse a *spell* for
  what is in your hands, and inventing one would refuse the Mycomancer's spells
  too. The table plays it.

### What the Willpower touched

SPELLBOOK grants 4 Willpower a rank, and it is the only source of Willpower on
the sheet that is neither worn nor running. It lands in `spellbook.js` and is
summed into both places a Willpower maximum is worked out: `deriveStats`, which
writes the column, and `statMath`, which promises the tile's breakdown adds up to
it. A rider reaching one and not the other is exactly what
`scripts/check-stat-math.mjs` exists to catch, so a thirteenth fixture was added
for it. A Master Arcanist at level 10 reads `10 base + 20 your level + 12 Mind +
12 Arcanist = 54`.

### The proof

`npm run lint`, `lint:text`, `lint:math`, `lint:riders`, `lint:halves` and
`lint:weapons` are all clean. The four pictures and the set plate were placed by
`npm run art:cards` with no alias needed, because the designer's filenames match
the card names exactly.

### One thing for Jules

**The capacity is generous and that may be the point.** At Rank 3 and level 10 the
book holds 40 spells, and the whole codex is 58 with 54 of them reachable. The
superseded sheet's own `Open Questions` tab raised this about the older Mind +
level formula: "a late Arcanist owns most of a school. That may be the point, or
the formula may want to be flatter." It is still open, and it is one number.

## The Arcanist's spellbook and the cut it earns, 2026-08-24

Two bugs reported the same afternoon the set landed, both against the Arcanist,
and both in the machinery the set had just introduced.

> "Bug ranking up arcanist does not let you choose new spells. or change
> yourspells
>
> The cost of spell shoud visible be reduced when yo utry to cast arcanist spell
> at master, same fro all acarnist effect"

### The rank-up bug: a panel capped at the wrong one of the two numbers

A library has two numbers, and the day before this the whole codebase agreed that
every chooser answered to the smaller one. `allowanceAt` is what a book may hold
*tonight*: what is written in it, floored at the free five, plus whatever the
window in front of the player is granting. On the sheet nothing is granting, so
the allowance was **exactly what was already held**.

Which meant the panel could never add a card, at any rank, ever. And because
`toggleLoadoutPick` replaces the oldest pick once the allowance is met, a tap in
that panel did not fail: it silently deleted a spell and wrote the new one in its
place, so the count never moved. Ranking up made it worse, because ranking up
opens the chooser: the rank widened the book by ten, the window came up on its
own, and every tap in it looked like it had done nothing.

Both halves of the report are the same line of code.

**The fix is that the sheet's panel answers to the capacity and a rest answers to
the allowance.** `loadoutState` takes `capped`, and the two panels that edit a
pool (the set's block on the Advancement tab, and its block on the Abilities tab)
pass `capped: 'capacity'`.

This is a ruling and not only a fix, so it is worth saying what it rests on. The
sheet's own panels are the **editing surface**: they can already change a
Mycomancer's prepared hand on a day that is not a rest, and `swapsAtRest` says so
in as many words. The rules live in the window that plays them, which is the rest.
A library capped at its ceiling on the sheet is exactly parallel: the panel may
fill the book, the rest is what grants one night's work, and a player who missed
six nights of research is no longer locked out of them forever. **Say the word and
it is one string in two call sites.**

Three things fell out of it:

- **`owed` is a third number**, because `remaining` stopped meaning what the
  button needed. A hand owes its whole count. A library owes the five that arrive
  with the set and *nothing after them*: room is not a debt, so a spellbook
  holding its five with thirty places left reads as finished, and its button says
  "open your spellbook" rather than "write in 30 more spells". `complete` is
  measured off `owed` now, which is what stopped the count beside the label
  reading unsettled for the rest of the character's life.
- **A tap that displaces something says whose place it takes.** "Replace the
  oldest" is a sensible rule and an invisible one. `displacedBy` reads the end
  `toggleLoadoutPick` cuts from, and the wall's button reads `Learn it · Bramble
  Whip goes`.
- **The rest window was granting one spell per spell.** Found while proving the
  above and fixed with it. `restSwaps` measured the allowance off the *draft*, and
  the draft gains a card every time you tap one, so the allowance rose with it:
  four taps, four spells, on a card that says "research a single spell". It is
  measured off the record the night started from now, which `restActions` hands in
  beside the draft. One tap adds, every tap after it replaces.

Proved: a Rank 2 Arcanist holding five reads `5 of 24 written down` with room for
19; a long rest offers exactly one and the second tap in it names what it would
displace; a full book at 11 still gets its replacement.

### The cut, printed where it is charged

PERFECT CASTING was the fifth card in the codex to cut another card's Action Point
cost, and the standing ruling on all five was that the arithmetic stays in prose.
That ruling was never about the arithmetic. It was that `UsePrompt` deals the
codex card beside the pay button, so a button charging 2 next to a card printing 3
reads as a bug at the exact moment somebody is deciding whether to pay. Being the
fifth is what bought the place to print it.

The cut rides the card the way Empowering and advantage already do, and for the
same reason: it is the *holder's*, not the card's. The same spell in somebody
else's book prints its own cost.

| Where | What it does |
| ----- | ------------ |
| `talents.js` | `discount: { from, ap: [null, 0, 0, 1], floor: 1 }` beside `boost`, indexed by rank |
| `loadoutModifiers` | lays `apCut`, `apFloor` and `apCutFrom` on every card the pool hands out |
| `cardCost` in `cardText.js` | the one place a printed cost and a rider that cuts it meet |
| `CostOrb` | takes `was`, and draws the old number slashed beside the orb |
| `combatBar` | `move.ap` is the cut number, so the chip, the prompt and the pools all charge it |

The floor is the card's own word, "to a minimum of 1", so a spell printing 1 keeps
1 and a card printing nothing is left alone: a passive has no cost for a discount
to come off, and 1 subtracted from 0 and floored at 1 would invent a price for a
card that has none.

It shows in four places, all of which used to print the card's own number: the
card face, the brief, the row on the Character tab and the button that charges it.
The button also says it in words, `Perfect Casting · 3 Action Points cut to 2`,
because that is the one line explaining why the orbs disagree with the card beside
them. The quick-bar chip is 16 pixels of orb and has no room to slash anything, so
it prints the cut number and says the rest on hover.

**The slash is diagonal and drawn rather than decorated.** `line-through` runs a
rule across the middle of a glyph, which is exactly where a 3, a 5 and an 8 keep
their own crossbar: at the 12px a brief draws it at, a struck 3 stops reading as a
3. Tried horizontal first, at two thicknesses, and it read as a currency symbol
both times.

"same for all arcanist effect" was already true of the other two. OVERLOAD's
Empowered die and its advantage arrow have ridden the prepared card since the set
landed, and they show on the card, the brief and the prompt.

### The other four stay in prose, and it is not the same call twice

RECKLESS VIOLENCE, MARTIAL SWIFTNESS, PRACTICED MOVES and COLOSSAL GRIP cut the
cost of cards their sets hand out **no rider on**. A Berserker's attacks arrive
off the weapon in their hands, not out of a `loadout` spec, so there is nothing of
the set's riding them to carry an `apCut`. The place to print a discount now
exists and is proven; what those four still need is a different rider, on the
holder rather than on the pool. **Worth doing, and it is its own change.**

## The roster, 2026-08-24

The whole plan is in the codex now. Thirty-four sets on the chooser wall, eleven
of them written and twenty-three standing in as placeholders.

It arrived as a screenshot of the roster sheet: four columns, `Physique`,
`Instinct`, `Mind` and `Other`, nine rows deep on the first three and six on the
last. Eleven of the names were already built. The other twenty-three had nothing
but a name, and now they have a name, an id and a shelf.

| Column | On the sheet | Written | Placeholders |
| ------ | ------------ | ------- | ------------ |
| Physique | 9 | Guardian, Berserker, Colossus | Brawler, Runebearer, Hemoturgy, Totemic, Painseeker, Dragon Aspect |
| Instinct | 9 | Mycomancer, Duelist, Trickster, Cauldron Keeper, Feral Curse | Virtuoso, Flowing Fist, Sharpshooter, Wilder |
| Mind | 9 | Arcanist, Enchanter | Alchemist, Necromancer, Spellquill, Spellblade, Thaumaturge, Tactician, Elemental Aspect |
| Other | 6 | none | Beastbond, Oathbound, Pactbound, Quartermaster, Weaver, Weapon Master |

The Draconic Bond is the thirty-fourth. It is built, it is on the Other shelf and
it is not on the roster at all: see the ruling below.

### What a placeholder is, and what it refuses to be

`stub: true` on a set in `talents.js`, and three fields with anything in them:

- **the id**, which is what a saved sheet, a picture folder and a card link will
  point at once the set exists. Settled now so it never has to move.
- **the name**, as the roster spells it, with its typos corrected and nothing
  else touched.
- **the shelf**, which is the column it was filed under and the one design fact
  the roster actually carries.

Everything else is absent on purpose. No cards, no loadout, no minion, no
enchanting spec, no tagline of its own and no blurb of its own. The tagline and
blurb are one shared pair of strings that say the set is not written yet, so all
twenty-three say the same thing in the same words and none of them says anything
about what the set does.

**A placeholder that guessed would be the codex inventing the game.** Nobody
knows what a Painseeker does. There is no sheet for it, and the `transcribe, do
not invent` rule is exactly as binding on a set with no cards as on a set with
four.

### They draw on the wall, and they cannot be taken

Ruled by the designer, asked as a choice between locked-and-visible and
hidden-until-written: **visible**. So a shelf reads as the whole column rather
than as the part of it that happens to be finished, and the Physique shelf says
nine sets because the roster says nine.

`optionsAt` refuses every stub before it works out a rank, with `rank: null` and
the reason `Not written yet.` That is the same shape a finished Master set hands
back, so `TalentTile` prints it where a price would go with no new branch and no
new class. One line moved to keep them on the wall: the filter that drops
unbuyable options now keeps a stub.

That filter's other two cases are about *this character* and both come back the
moment something changes: a set they have finished, a rank they have not reached.
A placeholder will not come back for anybody, and standing it on the wall is the
entire point.

`chooseAt` refuses one too. The tile is locked and its take button disabled, so
this is the model holding the line the UI already holds: a level spent on a set
with no cards would buy nothing and there would be no way to tell from the sheet.

`TalentSummary` gained the only branch a stub needed. A filled slot with nothing
to print already said "Written in by hand. This build's codex has no cards for
it", which is true of a name somebody typed into the column and false of a
placeholder. A stub can only get onto a sheet by hand-editing the `talents`
column, and when it does the block now says which of the two happened.

### Two names the designer settled

- **`Hamoturgy` is Hemoturgy.** Asked against Haemoturgy and Haemothurgy, and the
  short US form won, which is the codex's spelling everywhere else: Defense,
  Armor, Color.
- **`Brawlere` is Brawler.** No question about that one.

### Every other correction, and the one that is not a correction

Read off the screenshot and applied without asking, because each one is a typo
with exactly one reading:

| On the sheet | In the codex |
| ------------ | ------------ |
| `Trcikster` | Trickster (already built) |
| `Bersker` | Berserker (already built) |
| `Echanter` | Enchanter (already built) |
| `Aclhemist` | Alchemist |
| `Tachticain` | Tactician |
| `SharpShooter` | Sharpshooter |
| `SpellBlade` | Spellblade |

`Elemental Aspe` is the odd one out and is **not** a typo: it is the column
cutting the cell off. Read as Elemental Aspect, which is what the Dragon Aspect
on the Physique shelf pairs it with.

`Cauldron` in row 4 of Instinct is the built set's short name. The set stays
**Cauldron Keeper**, which is the name on its own Ability tab.

Beastbond, Oathbound and Pactbound are one word each on the sheet and stay one
word each.

### The Draconic Bond is not on the roster, and stays anyway

The roster has **Dragon Aspect** on Physique and **Beastbond** on Other. It has
no Draconic Bond, which is a built set with nine cards, a minion spec, a picture
folder and eight plates.

Three readings were possible and the designer took the third: **leave it, add
both**. So there are three dragon-shaped or bond-shaped entries in the codex now,
one real and two empty, and which of them the Draconic Bond turns out to be is a
question its own sheet will answer.

The reasoning behind the ruling is worth keeping, because it is the argument the
sheet will have to settle. Beastbond, Oathbound and Pactbound are a family of
three on the Other shelf and the Draconic Bond fits it exactly. Dragon Aspect and
Elemental Aspect are a family of two across Physique and Mind, and an Aspect
reads like becoming the thing where a Bond reads like standing beside it. Either
family could claim it. Renaming a transcribed set on a guess is the one move that
cannot be undone cheaply, since the id is what saved sheets point at.

### One thing for Jules

**The Other column has no attribute, so its placeholders carry no tags at all.**
The other three carry exactly one, the attribute their column names, and no role:
a role is a reading of what the cards do and there are no cards. That means the
six Other placeholders match no chip in the filter row and only turn up in an
unfiltered wall or by name in the search box. It is the honest answer and it may
not be the one you want. `level` was deliberately not borrowed from the Draconic
Bond, because that tag is a claim about how its ally scales and nothing is known
about how a Weaver does.

### The proof

`npm run lint`, `lint:text`, `lint:math`, `lint:riders`, `lint:halves` and
`lint:weapons` are all clean. The codex was walked directly as well: 34 sets, no
duplicate id and no duplicate name, every placeholder holding no cards, no art
and no spec of any kind, every one of the twenty-three landing on the shelf its
column names, none of them offered as takeable at any of the seven advancement
levels, and `chooseAt(weaver)` at level 1 returning an empty list where
`chooseAt(guardian)` returns a Rank 1 Guardian. The filter row came out with the
same nine tags it had before.

## The Alchemist, 2026-08-24

The twelfth set, and the first one converted out of the pile rather than off a
workbook. Jules asked for three things in one line:

> "used the convert alchemist to create the alchemist talent set and also
> implement all the potions. Potion to craft the cost need to be converted into
> supplies for the long rest action"

So: the set, the seven potions, and the craft cost paid in Supplies as the long
rest action. All three are built.

### The conversion pass had ruled the other way, and this reverses it

`data/Conversion/00 - Conversion Overview.xlsx` read the pile on 2026-08-23 and
filed the Alchemist under **Duplicate**: "On the site as Cauldron Keeper. Its
potions convert as items instead, not as a set." `General Items.xlsx` says the
same thing in its own Legend tab: "the Alchemist is the Cauldron Keeper on the
site already, and the Cauldron Keeper brews at the table rather than carrying
flasks."

That reading is now overturned by the designer, and the roster is what makes it
easy: **the Cauldron Keeper is on the Instinct shelf and the Alchemist is on
Mind**, in the designer's own four-column roster. They are two sets, and they
were always meant to be. The line each one holds is clean:

| | Cauldron Keeper | Alchemist |
| --- | --- | --- |
| When | mid-fight, at the moment of use | the night before, at the fire |
| What it makes | a Brew, which "takes effect immediately" and is stored nowhere | a flask, which goes in the pack and is carried |
| What it costs | Action Points and Willpower | Supplies out of the crate |
| Who can use it | the Keeper, that instant | anybody who is handed the bottle |

### Three sources, and none of them an Ability tab

There is no `Talent Set - Alchemist.xlsx` anywhere, because the conversion pass
never wrote one. What exists is:

| Source | What it holds |
| --- | --- |
| `Hazebound/Tables/Alchemist - Potions.xlsx` | 8 Novice potions: a name, a Willpower cost, an Improvised Brewing dice combination and full effect text apiece |
| `Hazebound/Ressources/Skillsets/Alchemist/*.jpg` | 3 card renders: Rank 1, Alchemical Ingredients and Improvised Brewing. Every word of those three cards is read off the pictures |
| `data/Conversion/General Items.xlsx` | the 2026-08-23 pass, which converted the potion table as consumables and left two rows amber |

That is a **Rank 1 only** set. There is no Rank 2, 3, 4 or 5 card for the
Alchemist in the pile, and the potions table is titled Novice. So three cards are
transcribed and two are house-written, which is the Sharpshooter's arrangement at
a slightly larger scale, and both house cards are marked `house` in
`data/templates/alchemist-ability.csv`.

| Rank | Card | Where it came from |
| ---- | ---- | ------------------ |
| 1 · Novice | ALCHEMY | `Alchemist - Rank 1 - Skill.jpg` |
| 1 · Novice | ALCHEMICAL INGREDIENTS | `Alchemist - Alchemical Ingredients - Action.jpg` |
| 1 · Novice | IMPROVISED BREWING | `Alchemist - Improvised Brewing - Action.jpg` |
| 2 · Adept | REFINED REAGENTS | house |
| 3 · Master | TWIN DISTILLATION | house |

The Overview is house-written too, the same way the Enchanter's and the
Sharpshooter's were: no source in the pile carries one. It is exported to
`data/templates/alchemist-overview.csv` in the workbook's own column order.

### The price, and where the number actually came from

This is the ask, and it took two sources agreeing to answer it.

The old system priced a brew in **two** currencies, and the cards keep them
apart. ALCHEMICAL INGREDIENTS prices the *components* in coin: "when a recipe
asks for 1000 coins' worth of Fire ingredients, this could be 100 spicy peppers
or a dragon flower". ALCHEMY prices the *working* in Willpower: "you need to have
the required components and willpower available". Jules asked for the first of
those to become Supplies.

**The problem is that the source prints no component price per potion.** The 1000
coins is an illustration inside a card, not a column. The only per-potion number
the table has is its Willpower column, and that column is the designer's own
ordering of the seven:

| Potion | Old Willpower |
| --- | --- |
| Healing Draught, Love Potion | 2 |
| Flame Burst Flask, Strength, Agility, Intellect, Wits | 3 |
| Growth Elixir | 4 |

So the **shape** of the price is his and only the scale is this pass's:

    Supplies = 10 x the Willpower the old table printed

And the scale is not free either. The APOTHECARY background skill, on the site
since the Skills tab landed, already crafts a healing potion at a long rest "by
expending 20 Supplies" — and the Healing Draught's own 2 Willpower times ten is
exactly 20. Two sources written years apart agree on the cheapest row in the
table, which is what fixed the rate rather than a number that looked about right.

| Recipe | Supplies | Coin |
| --- | --- | --- |
| Healing Draught | 20 | 100 |
| Love Potion | 20 | 100 |
| Flame Burst Flask | 30 | 150 |
| Potion of Physique | 30 | 150 |
| Potion of Instinct | 30 | 150 |
| Potion of Mind | 30 | 150 |
| Growth Elixir | 40 | 200 |

Coin is 5 a Supply, which is the same anchor read the other way: the site's own
Healing Potion is 100 coins on the belt shelf and Apothecary crafts one for 20.
The numbers are written out per item in `utility.js`, the way an enchantment's
`supplies` is written out per enchantment, so a row the designer reprices stays
repriced and nothing recomputes it.

### The Willpower is not charged, and that is a ruling

Which leaves the old table's Willpower with nothing to do. It is **printed
nowhere and charged nowhere**, for a reason that is specific to this site:
brewing here only happens inside a long rest, and a long rest ends by filling
Willpower to its maximum. A Willpower price paid in the middle of one is a price
nobody ever pays. ALCHEMY's own words say the same thing from the other side: you
brew "while still benefiting from a long rest".

The seven potions therefore cost **2 Action Points and no Willpower** to use. The
site's own Healing Potion costs 2 and 2, and that is the Ability List's printed
card rather than an Alchemist recipe, so it is untouched.

### Brewing is the long rest action, and it is the fifth kind

`restActions` in rest.js had four kinds and now has five: `labour`, `enchant`,
`worn`, `prepare` and `alchemy`. The row appears for an Alchemist on a long rest
and never on a short one, because ALCHEMY names the long one.

It is the only long rest action **whose output is a thing**. A labour moves the
crate, a working lays a rider on something you already own, a prepared hand
rewrites a column, and this one fills the pack. So `restPlan` takes a fifth
argument, `brews` — a list of recipe ids, one per brew — prices it into the same
plan and the same ledger as everything else, and appends the flasks to `pack` in
the same patch. Backing out of the rest leaves the components in the crate and
the flasks unmade, which is the whole point of that file.

The window walks the way every other action does: **the slot → the still → back
to the rest**. `BrewRest.jsx` is two halves, and the top one is the point: what
is going in tonight, with the count and the running Supplies, above the shelf of
recipes. A shelf on its own would be a wall you tap and hope, and the number a
player is actually deciding against is how much of the crate is left. Every
recipe is offered dead if it would overdraw the crate once the rest itself is
paid for, which is the law `labourAffordable` and `layingAffordable` already
read by.

The flasks land in the **pack** and not on the belt. A loop is a place you have
chosen to put something, and choosing is what the Inventory tab is for.

### What the ranks buy

`alchemy` on the set is the sixth shape of spec in the codex, beside `loadout`,
`brewing`, `enchanting`, `minion` and `feral`.

| | Rank 1 | Rank 2 | Rank 3 |
| --- | --- | --- | --- |
| Brews a night | 2 | 3 | 3 |
| Off each price | nothing | 10 Supplies, never below 10 | the same |
| Flasks a brew | 1 | 1 | 2 |
| Shelf | Novice | Novice, Adept | Novice, Adept, Master |

REFINED REAGENTS moves the two numbers ALCHEMY already prints, which is the test
a house card has to pass: nothing new for the sheet to hold. TWIN DISTILLATION
does not raise the count a third time, because that would have been the Adept
card twice — it doubles what comes out instead. Six flasks a night at three
prices.

### A rank can open a shelf the codex has not filled

The tier ladder is read off "you have learned to brew all Novice Potions", the
same ladder every tiered set in the codex prints. **The codex holds no Adept and
no Master potion**, because the only potions table in the pile is the Novice one.
So Ranks 2 and 3 open shelves with nothing on them.

That is left as it is rather than quietly deleted, and the presentation page is
made to say so: `AlchemyRankNote` prints "No Adept potion is written yet, so this
rank opens a shelf the codex has not filled" instead of a silent `+0`. The day an
Adept potion is written it appears on both, and no card has to change.

### IMPROVISED BREWING is printed and not wired

The one card in the set with no button behind it, and the reason is two things
the sheet does not hold.

It says a potion brewed this way "will expire at the end of the day". **This site
has no day.** It has rests. And an item in the pack is a bare id with no instance
of its own for a state to live on: `forged.js` is the only thing on the sheet
that gives an item an identity, and its own first rule is that "nothing
mechanical is stored".

Wiring it without both of those would hand over **free potions that never spoil**,
and the spoiling is the entire reason they are free. So the card carries its own
rule and the table plays it, the same way SPELLBOOK's free hand and voice are
played. Every recipe still carries its dice on the shelf, so the combination the
card sends you looking for is there to read: "any · any" for a Healing Draught,
"Wind · Wind · Wind" for a Growth Elixir.

### Every other reading, in order

1. **"Rank 1 - Novice Alchemist" is ALCHEMY.** A card never names its own rank
   here: the Tags column carries it. The name is the card's own first word.
2. **"during a long rest, you can craft two potions"** becomes "whenever you take
   a long rest you can use your long rest action to brew two of them". A rest
   buys one action, and a card that spends it should say which one it is
   spending. FUNGAL INVOCATION's idiom, and ARCANE RESEARCH's.
3. **"You learn the Alchemical Ingredients and Improvised Brewing abilities"** is
   dropped. Both are Novice Alchemist cards on the same rank, so the sentence
   hands over what the set has already handed over.
4. **"feathers are associated with winds" becomes Wind**, which is the name of
   that Elemental family everywhere in the codex. It puts all four of IMPROVISED
   BREWING's dice on words the site already uses: Earth, Water, Fire and Wind are
   all real spell families today.
5. **"half your power" is written out.** Old Power was the attribute plus the
   level, this site has no such number, and the conversion key says every "your
   power" becomes a die count and an attribute multiple. So it is "your Mind plus
   your level, halved and rounded down".
6. **The Intellect Potion and the Wits Potion are one card.** The site has three
   attributes where the old system had four, and the conversion key sends both to
   Mind. POTION OF MIND takes either row's die, so its combination reads "any ·
   Fire or Wind" — the one place on the shelf where an element slot is a choice.
7. **"the crafter's Spellpower" becomes the drinker's Mind.** This was the
   conversion pass's amber row: "HEALING DRAUGHT and LOVE POTION scale off
   whoever brewed them, not whoever drinks them. The site stores no such number
   on an item instance." It still does not, and the site's own Healing Potion
   already scales on whoever drinks it (`2d6 + 5 x level`), so both follow it.
8. **"1000 coins' worth of Fire ingredients" becomes 20 Supplies of Fire.** A
   recipe on this site asks in Supplies. The hundred spicy peppers and the dragon
   flower are his.
9. **Four potions move numbers, so four carry riders.** POTION OF PHYSIQUE,
   POTION OF INSTINCT, POTION OF MIND and GROWTH ELIXIR are in `EFFECT_RIDERS`,
   keyed on the card rather than on the drinker for the reason that table exists:
   a potion is very often somebody else's, handed to you at the fire, with
   nothing on your sheet for a rider to hang off. The Love Potion is not a rider
   (nothing about being trusted is a number), the Healing Draught is a pool moved
   once, and the Flame Burst Flask's lingering flames are a place on the table.
10. **The Alchemist keeps a Recipes block on the Abilities tab**, `aside` the way
    the Cauldron Keeper's Ingredients block is, so the shelf can be read outside
    a rest. A recipe is not a move: you never use a Healing Draught off that
    block, you brew one.

### Six things for Jules

1. **GROWTH ELIXIR takes a level-1 drinker to minus one Instinct.** The card says
   "your Instinct is reduced by 5" and a fresh sheet starts at 4, so the sheet
   honestly prints Instinct -1, Defense 1 and Initiative 0. Nothing floors it,
   because the card names no floor. Say the word and it gets one.
2. **Should the Healing Potion be on the Alchemist's shelf?** It is not, today.
   It is the Ability List's flask rather than a row on the potions table, and
   APOTHECARY already crafts it at exactly the 20 Supplies this pass's rate
   gives. Putting it on the shelf would make the HEALING DRAUGHT beside it
   pointless, since 2d6 + 5 x level beats 1d6 + Mind at every level for the same
   price. Two clean answers: leave it off, or put it on and reprice the draught.
3. **Is the Willpower really gone?** See above. The alternative that works is
   charging it against the Willpower you *wake with*, so a night of brewing costs
   you the morning's pool. That is a real cost and it contradicts "while still
   benefiting from a long rest", which is why it was not taken.
4. **Adept and Master potions.** Two empty rungs are waiting. Anything with a
   tier of `Adept` or `Master` and a `brew` spec lands on them with no code.
5. **Improvised brewing.** If it is worth wiring, the cheapest honest version is
   an expiry keyed to the next long rest rather than to a day, which needs the
   pack to hold something more than an id.
6. **The two house cards.** REFINED REAGENTS and TWIN DISTILLATION are the whole
   of Ranks 2 and 3 and neither has a source. If the real ones exist somewhere,
   they replace these outright.

### No pictures

`data/Alchemist/` does not exist yet. Five cards and a set plate are wanted:
Alchemy, Alchemical Ingredients, Improvised Brewing, Refined Reagents, Twin
Distillation and an Alchemist Overview. Seven potion items want one each too, and
`General Items.xlsx` already carries a written prompt for six of them on its
Image Prompts tab. Drop them into `data/Alchemist/` and `data/Potions/` and run
`npm run art`; until then every plate draws empty, which is what a card with no
picture has always done.

### The proof

`npm run lint`, `lint:text`, `lint:math`, `lint:riders`, `lint:halves`,
`lint:weapons` and `npm run build` are all clean. The codex was walked directly
as well: 34 sets still, no duplicate card id and no new duplicate card name, the
Alchemist offered at Rank 1 on level 1 and ranking to 2 at level 4 and 3 at level
8, seven recipes on the shelf at every rank, `restActions` offering the still on a
long rest and nothing at all on a short one, a two-potion night pricing 50
Supplies out of a 200 crate and landing both flasks in the pack beside what was
already there, and all four potion riders reaching the sheet and coming back off.

## The Ethereal school, 2026-08-25

Asked for in as many words: "add the Ethereal Light spell, I have added the image
in the etheral folder. Correct the text and make sure it is inline with the
system wording."

Two sources, both already on disk. `data/Spells - Ethereal - Light.csv` holds
thirteen rows in the drop's usual eight columns, and `data/Ethereal/` holds
thirteen 2400x1792 pictures, one per row. Ethereal is a main school level with
Primal and Elemental, and Light is its first family: same three-tag banner, same
tiers, same shelves.

| Tier | Spells |
| ---- | ------ |
| Novice | BARRIER, BOLSTER, LIGHT, LIGHTFORGED WEAPON |
| Adept | ORBITING ARSENAL, WINGS OF RADIANCE, SIGIL OF TRUTH, HARD LIGHT |
| Master | CELESTIAL EDICT, LIGHTSTRIDER GATEWAY, GUARDIAN ANGEL, BEND LIGHT |
| Legendary | THEON PERFECT REPLICANTS |

### What this retires

**UNWRITTEN LIGHT is deleted.** Flag 4 in `lineages.js` was that a Celestial's
INNATE LIGHT promised a Novice Light Spell the codex had not got, so the ancestry
could never be settled and a stand-in card held the slot open. Four real Novice
Light spells arrive here, and the Innate cards read their options off the Novice
shelf of the school they name, so INNATE LIGHT now offers Barrier, Bolster, Light
and Lightforged Weapon with nothing else changed. The note over the stand-in
always said to delete it on this day, and it was.

UNWRITTEN SHADOW stays. Shadow is still neither a school nor a family anywhere in
`spells.js`, so an Infernal still holds a card standing in for one, and flag 4 is
rewritten to be about that one card rather than two.

### Legendary is a fourth rung, and it needs no gate

THEON PERFECT REPLICANTS is tagged `Legendary Spell · Ethereal · Light` and is the
first card in the codex to carry a tier that is not Novice, Adept or Master.
Nothing had to learn the word. `tierOf` in `loadouts.js` reads exactly those three
and returns nothing for anything else, so the card falls off the ladder and
`loadoutOptions` refuses it by name — "Legendary is not a rung any set reaches" —
and `spellsAt` in `EnchantWindow.jsx` matches the same three words, so no
Imbuement can bind it either. This is the shape Unique already has, arrived at
from the other direction: Unique is deliberately off the ladder, Legendary is
above the top of it.

Checked rather than assumed: at Rank 3 the Arcanist's spellbook offers twelve of
the thirteen and refuses that one with that sentence.

### The Arcanist's spellbook grew by twelve

The Arcanist is the one spec that names no school, so it draws from the whole
codex by tier, and a new school widens it. Its Rank 3 pool is now 24 Primal, 29
Elemental, 12 Ethereal and 1 Arcane. That is the same thing the Elemental pull did
on 2026-08-20 and not a new exposure. No other set is touched: every set that
names a school refuses all thirteen with "Ethereal school, not Primal" or its
equivalent.

### BARRIER had to change its id

**The spell is `barrier-spell`, not `barrier`.** A Novice enchantment already holds
that id and already prints that name (2d6 in Shield at combat start), and `SPELLS`
is spread into `CARDS` *before* `ENCHANTMENTS`, so the spell on the plain id would
not have collided so much as swallowed it: `getCard('barrier')` would have stopped
answering with the enchantment and a tracker row written for it would have opened
the spell instead. Same call RESILIENCE and CREATE WATER made, for the same
reason: an id is what a saved character points at, so the older record keeps it.

The printed names still collide and a table will see two cards called Barrier.
Worth renaming one at the source.

### The art importer learned two things

1. **A school folder can hold art plates instead of card renders.** `data/Elemental/`
   set the default: a family per subfolder and every file a whole 1055x1496 card,
   so `cardPlate` cuts the painting out of it. The Ethereal drop is thirteen
   2400x1792 plates at the top of the folder with no border and no banner, which
   is what the lineage and background drops are. Cutting one would have taken the
   top 45% of a painting that is already only the painting. `PLATE_SCHOOLS` is the
   exception and turns off the crop and nothing else: the folder is still claimed
   by name and still walked into any family folder a later drop brings.
2. **A school folder's files resolve against the spell codex.** This is the
   BARRIER collision at the other end, and it is the failure the DRAGON BREATH
   note in that file already predicted: `cardIds` is one flat printed-name map and
   the last registry spread into it wins, so `Barrier.jpg` landed on the
   *enchantment* — a picture of a warded dwarf on a card about maximum Health, and
   the spell left with no art at all. A school folder holds spells, so it now
   answers to a spells-only map, consulted after the sheet's own Image column and
   before the codex-wide one so nothing that already resolved resolves
   differently. The link pass reads the row's own Tags column for the same reason,
   which is what stopped it reporting a missing picture for a row whose picture
   had just been placed.

Three files needed an alias, because the drop's Image column is empty and there is
nowhere else for them to be named: `Celestail Edict.jpg` is two letters out of
CELESTIAL EDICT, and `Lightstrider Gate.jpg` and `Theon Perfect replicant.jpg` are
each a word short of the name the sheet prints. The other ten match. None of the
three could have landed on something else the way BERSERKER'S RAGE could, since
Ethereal is not a talent set and there is no plate branch to claim a leftover
file; unaliased they would simply have been reported.

### The rolls

**Three rolls were brought onto the two legal targets** — a Mind Attack against
Defense, or a Mind Roll against Grit or Reflex, rolled by the caster, which is the
rule the Elemental pull established. LIGHT's burst named no defense at all, SIGIL
OF TRUTH named Grit in the possessive-less "against all entities Grit", and
CELESTIAL EDICT named Reflex the same way. The two that named one keep it. LIGHT's
went to Grit, because that is what BLIND already rolls against to blind somebody,
so the codex had the answer and it did not have to be invented.

**BEND LIGHT is the one target-rolled contest kept**, the exception MAGMA CHAINS'
breakout already is. The roll is made by the entity the spell is *on* when it
acts, which may be an ally on the far side of the map, so it is neither the
caster's roll nor the caster's attribute: it carries `{instinct}` as a name and no
`{roll}`, because the number belongs to whoever makes it and the card has no way
to know who that is. CONTAINMENT SPHERE's breakout prints no attribute for the
same reason.

That card's roll also needed a reading. "it must make an Instinct roll agasitn the
target Grit" is read as the target of the *action*, not of the spell: the entity
is the spell's target, so against its own Grit is a contest with itself. Acting on
somebody and rolling against their Grit to stay unseen is the sentence that
reading gives back, and it needs no number the sheet does not carry.

### The halves

**BEND LIGHT's is a Multicast, not the Overcast the sheet labels it.** Its prose is
word for word BOLSTER's and WINGS OF RADIANCE's, both of which the same sheet
labels MULTICAST, and what it buys is another target, which is what Multicast
means in this codex. The label is the only thing that changed.

**SIGIL OF TRUTH's opens later.** The sheet's copy begins "When casting Sigil of
Truth", which `overcast.js` reads as a rider on the cast and prices on top of it,
and then spends on consuming a branding that cannot exist until an entity has
lied. So it opens "While a branding lasts", which charges the same 2 Action Points
and 2 Willpower as its own spend the way every other later half is. "If you do You
can consume" is the same paste the opening is.

All seven halves parse: three Multicasts on top and repeatable, four Overcasts as
their own spend, and `npm run lint:halves` prices all 45 in the codex off their own
prose.

### Every other reading, in order

Each of these is a cell that could not be printed as it stood.

- **Six ranges had the metres and lost the feet**: "6 meter (feet)", "9 Meter
  (feet)", "15 Meter (feeet)". The metre leads every cell in this codex and the
  conversion is the codex's own (6/20, 9/30, 15/50), which is the call WALL OF
  FLAMES documents.
- **LIGHT is cast "within range" and names none.** Its own illumination is a
  15-meter radius, so that is the range it is read at. This is the one reading in
  the pull that adds a number the row does not carry anywhere, and the only one
  worth a second opinion.
- **LIGHTFORGED WEAPON teleports "to a point within range"** and that range is the
  row's own 15 meters, written out.
- "at the start of each of your turns" is **Turn Start**, the defined term.
- **LIGHTFORGED WEAPON's attack is a Melee Attack on both halves.** The weapon
  teleports beside its target and swings at what is adjacent to it, which is what
  "within reach" means in `keywords.js`; the sheet's second half says only "attack"
  and takes the first's word for which.
- **ORBITING ARSENAL's weapons "float around"** and the card never says what they
  orbit. Read as around you, which is what the title says.
- **GUARDIAN ANGEL says what it looks like twice**: "take the appearance you whish,
  taking the form of a medium-sized entity of your choice". The second is the
  specific one, so it is the one that survives.
- "gain the benefits of Bolster" is a `{{link}}` to the card, which is the Novice
  spell three rows above it.
- **THEON PERFECT REPLICANTS' second sentence is two sentences run together**:
  "This Action will target all Entities you can see you can choose if you want it
  to have it target only hostile or allied entities."
- Spelling, throughout: "an halo", "the rob explode", "Lightfroged", "additoanl",
  "rol lagaisnt", "elegible", "lauch", "en entity", "cna", "enity", "abiltiy",
  "houe", "feeet", "unconcious", "3turns", "agaisnt", "adjacvent", "tht",
  "minnutes", "whish", "ocmpletly", "invisble", "entty", "agasitn", "your
  perform".

### Two names left as the sheet has them

**"Lightmade Weapon" is kept as its own term.** ORBITING ARSENAL conjures six of
them and calls them that twice; the stray "the Lightforged" in the middle of its
Overcast is a paste from the row above and is dropped. They are not LIGHTFORGED
WEAPON's weapon — that one teleports and swings itself every turn, these are
thrown one at a time — so collapsing the two names would have made a Novice card's
routine run six times off an Adept one. Worth settling at the source, and this is
the reading that changes nothing if it is wrong.

**THEON PERFECT REPLICANTS reads like a possessive with no apostrophe.** Left as
the sheet prints it, the same way SPROUT WINGS' Celestial wording is.

### The banner order, and one stray row

The sheet writes the three tags two ways: four rows read "Ethereal, Novice Spell,
Light" and the other nine lead with the tier. The banner is tier, school, family
everywhere in this codex and `schoolOf` reads position rather than words, so all
thirteen are normalised to that and nothing else moves.

The drop also carries a fourteenth row at the bottom, VAMPIRIC TOUCH, tagged
`Novice Spell, Primal, Blood` with a postimg link. That is the Primal spell pulled
on 2026-08-19 and already in the codex with its art; it is ignored here. It is the
only reason the tab counts as one that carries links at all, which is what made the
link pass talkative until it learned to read the Tags column.

### Nothing here is wired

No effect in this drop moves a number on the sheet. Four of the thirteen are ones
a tracker row would want to carry — BOLSTER's advantage, WINGS OF RADIANCE's
flight, BEND LIGHT's two advantage and GUARDIAN ANGEL's damage sink — and none has
a rider in `riders.js`. They print, they can be dealt, and the table does the
arithmetic, which is where every effect in this codex starts.

### Four things for Jules

1. **LIGHT's range.** The row says "within range" and names none. Read as the
   spell's own 15 meters. Confirm or give it a number.
2. **Lightmade against Lightforged.** One term or two? Kept as two, above.
3. **THEON PERFECT REPLICANTS.** Is "Theon" a possessive missing its apostrophe,
   and is Legendary a rung a talent set is meant to reach one day? Nothing reaches
   it today and nothing needed to change for that to be true.
4. **Two cards called Barrier.** The enchantment and the spell. The ids are
   separate and safe; the printed names are not, and only the sheet can settle it.

### The proof

`npm run lint`, `lint:text`, `lint:math`, `lint:riders`, `lint:halves` and
`npm run build` are all clean, and `npm run art:cards` reports only the four
problems it reported before this drop. The codex was walked directly as well: 367
cards with no duplicate id, all thirteen bodies and seven second halves resolved
with no unspent token, all thirteen carrying art and a thumbnail, UNWRITTEN LIGHT
gone and UNWRITTEN SHADOW still there, INNATE LIGHT offering the four real Novice
spells, `{{Bolster}}` resolving, THEON PERFECT REPLICANTS refused by the tier gate
with the sentence quoted above, and `templates/ethereal-spells.csv` read back
column by column against `spells.js` with all thirteen rows matching.

## The bold, and the card that stopped scrolling, 2026-08-25

Asked for in as many words: "In spells and ability, I want you to put in bold in
card in general notions of distance, targeting and duration. So 3 turn, 1 hour,
etc do a pass over everything. Also I dont want scrolling in cards. If text get
smaller name and sub name like overcast etc can be shrinked a bit."

Two changes, and neither of them writes a word of new rules text. Every card body
in the codex came back byte for byte with the markers taken off again, which is
the one thing worth proving about a pass this wide.

### What is bold, and what is not

Emphasis had been removed from the codex outright once before, because a card
with thirty emphasised phrases has nothing emphasised at all. It is back with a
job and only that job: **how far, at whom, and for how long** — the three things
a player scans a card for before playing it. The rule is written at the top of
`src/lib/keywords.js`, beside the three kinds of colour, because that is where
anybody writing a new card will look for it.

| | bold | plain |
| - | - | - |
| range | "within **9 meters (30 feet)**", "a **6-meter (20-foot)** radius" | "regardless of the distance" |
| targeting | the target a card *declares* — "**an entity**", "**all entities**", "**up to two entities**", "**a dying entity**" | a back-reference — "the target", "the entity", "that specific entity" |
| duration | "for **10 turns (1 minute)**", "**until your next Long Rest**", "**until its Turn End**" | a condition — "until it is destroyed", "until you Shoot", "until all Shield is gone" |

Three rulings inside that, each of which decides dozens of phrases:

1. **The declaration, never the back-reference.** "an entity" is bold on 89
   cards and "the target" is plain on 66, because the first says whom you may
   pick and the second points at somebody already picked. Bolding both would
   have made the mark mean "this sentence mentions a creature", which is not
   information.
2. **Nothing already lit is lit twice.** MOVE prints "[[speed]] meters" and the
   live value is louder than any weight could be, so it stays plain. A keyword
   *inside* a bolded phrase keeps its own colour — "**all entities**" is a scope
   wearing a defined word, and the two marks are different on purpose.
3. **A measured span, not a condition.** "for 10 turns" and "until your next
   Long Rest" answer the same question; "until it is destroyed" is a thing that
   might happen. Only the first two are bold.

Four bolds already in the codex predate the rule. `**Claws & Teeth**` on the two
Feral Curse cards stays: it is deliberate and its reason is written beside it —
the weapon has no card of its own for a `{{link}}` to reach. `**Grit**`,
`**Movement Speed**` and `**Defense**` on the two potions came off, because all
three are keywords and were already coloured and underlined before the bold was
added on top.

### Every parser reads the words, so every parser strips the markers first

A marker in the middle of a phrase is invisible to a reader and fatal to a
regex. `combatTurn.js` and `rest.js` already knew this and each stripped by hand;
`overcast.js` did not, and GIANT GROWTH's Multicast stopped repeating the moment
"for each additional entity" became "for **each additional entity**". The search
box had the same hole the other way round: a card printing "within **9 meters (30
feet)**" could not be found by typing "within 9 meters".

So `cardProse` in `cardText.js` is the one place that takes them off, and all four
call it: `effectDuration`, `secondHalf`, `labourOptions` and `cardHaystack`, plus
`scripts/check-weapons.mjs`, which reads "within 1 Meter" off a Strike to hold the
melee reach rule. `cardGist` uses it too, so a brief still reads as plain prose.

The renderer learned one thing as well: a bold run now reads to the next `**`
rather than to the next `*`, so a live value is allowed inside one.

### A card does not scroll any more

`.ac-body` was `overflow-y: auto` — the last resort for a card too dense even at
the smallest readable type. It is `overflow: hidden` now, which means the fit has
to actually land rather than nearly land, and the single `box / natural` pass it
did could not: that ratio is only the right answer while everything in the box
scales together, and the heading does not. `useFitText` searches instead — seven
halvings between the floor and full size, keeping the largest that fits.

The heading gives up a little of its own room now, which is what "name and sub
name can be shrinked a bit" bought. It rides `--ac-name-fit`, which is `--ac-fit`
at half the rate and floored at 0.72, so a dense card sets its name a shade
smaller instead of making the rules text absorb all of the shrinking alone. It
used to be one size on every card, deliberately, so that no two cards disagreed
about how big a card name is; that was the right trade while the last lines could
scroll, and they cannot now.

### One number for the designer

ARM SWEEP (`actions.js`) pushes the target back "1.5 meters (3 feet)". Everywhere
else in the codex 1.5 meters reads as 5 feet, including LIGHT ARMOR MASTERY on the
same conversion. Left exactly as the sheet has it and flagged here rather than
corrected, because either half of it could be the one that is right.

### The proof

`npm run lint`, `lint:text`, `lint:math`, `lint:riders`, `lint:halves`,
`lint:weapons` and `npm run build` are all clean. Beyond those, three round trips
were run directly against the codex:

- **The prose.** All 367 cards dumped before and after, markers stripped from
  both: not one character of card text differs. The pass adds `**` and nothing
  else.
- **What the sheet reads out of the prose.** `effectDuration`, `secondHalf`,
  `labourOptions` and `cardGist` compared card by card across all 367. Every
  answer is identical; the only field that moved is `cardHaystack`, which is the
  intended fix.
- **The fit.** All 367 cards dealt at once in a browser and measured, twice: bare,
  and again with a footer and a row of buttons on every one of them, which is the
  worst case the sheet can hand a card. Nothing scrolls, nothing reaches the type
  floor, and the tightest card in the codex (BEND LIGHT, with a Multicast half)
  sets at 0.72 of full size bare and 0.60 loaded. 308 of the 367 need no shrinking
  at all.
## The Shadow family, 2026-08-25

Asked for in as many words: "shadow spell have been added to the data folder with
image, correct text make sur wording is consitent and in the system prefered
lingo."

Two sources, both already on disk. `data/Spells - Ethereal - Shadow.csv` holds
twelve rows in the drop's usual eight columns, and `data/Shadow/` holds twelve
pictures, one per row. Shadow is the Ethereal school's second family, arriving the
same day as its first: same three-tag banner, same tiers, same shelves. The sheet
writes all twelve in tier, school, family order already, so unlike the Light drop
nothing had to be normalised.

| Tier | Spells |
| ---- | ------ |
| Novice | SCOURGE, CLOUD MIND, GLOOM SPIKE, DARK BARGAIN |
| Adept | SHADOW HEX, EFFIGY, COGNITIVE DISTORTION, SHADOW BIND |
| Master | JULES' ABSOLUTE EDICT, HAUNTING SHADOWS, UMBRAL FORM, GLOOM ECHO |

Four to a rung and no Legendary. THEON PERFECT REPLICANTS is still the only card
in the codex on that fourth rung, and still nothing reaches it.

### What this retires

**UNWRITTEN SHADOW is deleted, and flag 4 in `lineages.js` is closed.** An
Infernal's INNATE SHADOW promised a Novice Shadow Spell the codex had not got, so
the ancestry could never be settled and a stand-in card held the slot open. Four
real Novice Shadow spells arrive here, and the Innate cards read their options off
the Novice shelf of the school they name, so INNATE SHADOW now offers Scourge,
Cloud Mind, Gloom Spike and Dark Bargain with nothing else changed.

That was the second of the two stand-ins, Light having gone the same morning. So
the flag is not rewritten this time, it is retired: **there is no lineage card
left whose question the codex cannot answer.** All six Innate cards offer real
spells, and no card in the codex carries `placeholder` any more.

The gate that read that flag is kept. `loadoutOptions` still refuses a
`placeholder` card as a school, and it now fires on nothing, because the next
school the lineage tab names before a sheet arrives is exactly the situation it
was built for. Both notes say so, in `spells.js` and beside the gate.

### The codex learned one word

**CONSTRAINED is a keyword now.** SHADOW BIND glosses it at its own foot, and the
rule at the top of `keywords.js` is that a defined term is never glossed in prose
as well: "If a term needs explaining and is not in this file, the fix is to add it
here, not to gloss it in the card body." So the designer's sentence moved into
`keywords.js` word for word and the parenthetical came off the card. Not marked
`provisional`, because it is transcribed rather than inferred. That is exactly the
trade ICE BLOCK made for Stunned on 2026-08-20.

This one was overdue. The Trickster's AMBUSH has named the Constrained status
since 2026-08-23, beside Stunned and Grappled, with nothing at all behind the
word. It is lit and answers for itself now, on both cards.

### Shadow is written against Light, and it settled a reading

Three pairs are exact, and worth knowing because the codex reads a missing number
off the twin.

- **SCOURGE is BOLSTER inverted**, cost for cost: 3 Action Points and 4 Willpower,
  a crown for a halo, disadvantage on every action for advantage on every action,
  and a Multicast at the same 1 and 3.
- **JULES' ABSOLUTE EDICT is CELESTIAL EDICT's opposite number**, compelling one
  kind of action where the other forbids one.
- **GLOOM ECHO doubles your next Action where THEON PERFECT REPLICANTS widens it.**

### The rolls

Every contest in the drop is the caster's own, so all six are a Mind Roll against
Grit or Reflex or a Mind Ranged Attack, which is the rule the Elemental pull
established. Nothing here needed BEND LIGHT's target-rolled exception.

**CLOUD MIND asks for a saving throw, and this system does not have one.** "if
they succeed the saving throw" is the only borrowed term in the drop, and it is
the caster who rolls here, so the sentence is read from the other end: the target
learns its mind was altered when the spell ends or when the roll fails. Same
event, named the way the codex names it. This is the clearest case of the "system
preferred lingo" the request asked for.

### The halves

Seven, and for once every label on the sheet is the right one: two Multicasts,
three Overcasts and two Upkeeps. `npm run lint:halves` prices all 52 in the codex
off their own prose.

**Two of them open later than the sheet has them.** EFFIGY's Overcast reads "You
can spend 2 Action Points and 2 Willpower" and says nothing about when, and its
doll cannot be scryed through before it exists. SHADOW BIND's Upkeep is the same
shape. Both now open on the state they need, the way SIGIL OF TRUTH's does, so the
parse in `overcast.js` charges them as their own spend rather than as a rider on
the cast. DARK BARGAIN's genuinely is a rider on the cast and keeps "When
casting". HAUNTING SHADOWS already opened "While Haunting Shadows is active" and
needed nothing.

**UMBRAL FORM's Upkeep says "may" and not "must".** Every other Upkeep in the
codex is a toll on a spell that would otherwise run on. This one lasts until your
next Turn Start on its own, so the payment buys another turn rather than
preventing an ending, and writing "must" would have described a spell that does
not exist. The house sentence follows it unchanged, because not paying does end
it.

### Every other reading, in order

Each of these is a cell that could not be printed as it stood.

- **Four ranges had the metres and lost the feet**: "6 Meter (feet)", "9 meter
  (feet)", "12 Meter (feet)". The metre leads every cell in this codex and the
  conversion is the codex's own three metres to ten feet, which is the call WALL
  OF FLAMES documents. HAUNTING SHADOWS' 12 meters is the first 40 feet in the
  codex.
- **JULES' ABSOLUTE EDICT is cast "within range" and names none**, the same hole
  LIGHT had in the morning. Read at CELESTIAL EDICT's 9 meters: same tier, same
  school, same "an entity that can hear you", and it is the card this one mirrors.
  The codex had the answer rather than having to invent one, which is what made
  this reading safe where LIGHT's needed a second opinion.
- **DARK BARGAIN names no range at all**, not even a broken one. Left at "an
  entity you can see", which is a limit of its own. The one card in the drop that
  ends without a distance.
- **DARK BARGAIN's Health is the target's own.** "they scarficiceHealth equal to
  your 3 x their level" carries a "your" pasted in from the column beside it. It
  is 3 times the *target's* level, and the target may be anybody at the table, so
  it is written in plain words with no live value at all. That is the trade WINGS
  OF RADIANCE makes with "its Movement Speed", for the same reason: the sheet
  cannot compute a number that belongs to somebody else.
- "At the start of its turn" and "At each Start Turn" are **Turn Start**, and
  "before the end of its next turn" is its **next Turn End**. The defined terms.
- **SHADOW BIND's "10 turns" is written out as 10 turns (1 minute)**, the form
  ENTANGLING ROOTS uses. The codex prints the minute beside the count.
- **SCOURGE names its own effect twice**, "a Crown of shadow" and then "The Crown
  of Shadows". The second survives, which is the call GUARDIAN ANGEL's double
  description documents.
- **JULES' ABSOLUTE EDICT says the command must be possible twice**, once as "If
  the command is impossible, the spell fails" and once as the feasibility sentence
  with the non-flying example. Same call, and the survivor carries the consequence
  the general one stated.
- **EFFIGY mirrors "health"** and means the stat, so it is Health and lit.
- **GLOOM SPIKE ends any effect the target was paying Upkeep for.** The row reads
  "any effect that required upkeep by the entity", and Upkeep is a defined term in
  this codex, so the sentence names it. That makes this Novice spell the only card
  in the codex that strips an Upkeep off somebody.
- Spelling and grammar, throughout: "scarficice", "conditions.The", "can ear you",
  "agaisth", "emeerge", "aciton", "umbral from", "your have", "can slips",
  "traverser", "enitites", "thier", "thir", "teh", "paranoi", "stoping", "form
  taking", "disvetnage", "addtional", "Start Turn", "with 9 Meter".

### One card name moved

**COGNITE DISTORTION is read as COGNITIVE DISTORTION.** "Cognite" is not a word in
any of the sheet's languages, cognitive distortion is the real term for what the
card does, and the picture drawn for it is called `Cognitive Distortion.jpg`.
Three things agreeing against one typo. It is the only card name in the drop that
moved, and it is worth confirming at the source, because a name is what a table
calls a card.

The two names that looked like they would need help did not.
`Jules Absolute Edict.jpg` lands on JULES' ABSOLUTE EDICT because `flatten` drops
the apostrophe, and the card keeps the apostrophe the sheet prints.

### The art importer learned that a folder can be a family

`data/Shadow/` sits at the top of `data/`, beside `Ethereal/` rather than inside
it, and Shadow is a **family** and not a school: the sheet is `Spells - Ethereal -
Shadow.csv` and the banner on all twelve cards reads Ethereal second and Shadow
third. Adding "shadow" to `SCHOOL_FOLDERS` would have put a word in that set the
codex does not use that way, so there is a `FAMILY_FOLDERS` set holding it and a
`SPELL_FOLDERS` union that every predicate now reads. What the two sets are really
for is the same thing, and it now has a name: a folder whose files are spell art.

`PLATE_SCHOOLS` became `PLATE_FOLDERS` for the same reason and holds both, since
these twelve are plates rather than card renders and must not be cut. Nothing else
about the folder's handling changed.

Moving the folder to `data/Ethereal/Shadow/` would retire the `FAMILY_FOLDERS`
entry outright, because a family under its school is the shape
`data/Elemental/Fire/` already has and a school folder is walked into whatever
subfolders it brings. It is left where the drop put it, and the note beside the set
says so.

One file needed an alias: `Hauting shadows.jpg` is an n short of HAUNTING SHADOWS.
The other eleven land without help.

### Nothing here is wired

No effect in this drop moves a number on the sheet, which is where the Light drop
landed too. Six are effects a tracker row would want to carry, and the two worth
naming are HAUNTING SHADOWS, which stops a rest and stops Health coming back, and
GLOOM SPIKE, which ends an Upkeep. Neither has a rider in `riders.js`. They print,
they can be dealt, and the table does the arithmetic, which is where every effect
in this codex starts.

### The Arcanist's spellbook grew by twelve

The Arcanist is still the one spec that names no school, so it draws from the whole
codex by tier and a new family widens it. Its Rank 3 pool is now 24 Primal, 29
Elemental, 24 Ethereal and 1 Arcane, up from 12 Ethereal this morning. Every other
set that names a school refuses all twelve: the Mycomancer does so with "Ethereal
school, not Primal", and no other set on the wall has a spell pool at all.

### Five things for Jules

1. **COGNITE DISTORTION.** Read as COGNITIVE DISTORTION, off the picture's own
   filename. The only card name in the drop that changed.
2. **JULES' ABSOLUTE EDICT's range.** The row says "within range" and names none.
   Read at CELESTIAL EDICT's 9 meters, the card it mirrors. Confirm or give it a
   number.
3. **DARK BARGAIN has no range at all.** Left at "an entity you can see". Is that
   deliberate, or did a distance go missing?
4. **DARK BARGAIN's Overcast.** The base half gives advantage and the Overcast
   says Empowered and Elevated. Read as additive, so an overcast bargain gives all
   three, because the cost it names is "an additional". If it was meant to replace
   the advantage, say so and the word "also" comes out.
5. **Two cards called Barrier, still.** Not this drop's doing, and still only the
   sheet can settle it.

### The proof

`npm run lint`, `lint:text`, `lint:math`, `lint:riders`, `lint:halves` and
`lint:weapons` are all clean, `npm run build` is clean, and `npm run art:cards`
reports only the four problems it reported before this drop. The codex was walked
directly as well: 378 cards with no duplicate id, all twelve bodies and seven
halves resolving with no unspent token, all twelve carrying art and a thumbnail on
disk, UNWRITTEN SHADOW gone and no `placeholder` card left anywhere, all six INNATE
cards offering real spells, CONSTRAINED lit on both SHADOW BIND and AMBUSH, the
Arcanist offering all twelve at Rank 3 and the Mycomancer refusing all twelve.

`templates/ethereal-spells.csv` was regenerated at 25 rows and read back: every row
parses into the same card it came from, and the thirteen Light rows differ from the
file they replace by nothing but the `**` markers of the 2026-08-25 card pass, which
that file predated.

## The Time family, 2026-08-25

Asked for in as many words: "I have added the tiem spell add them to the systme
image are in time folder correct textand adapt to syustem wording."

Two sources, both already on disk. `data/Spells - Ethereal - Time.csv` holds
twelve rows in the drop's usual eight columns, and `data/Time/` holds twelve
pictures, one per row. Time is the Ethereal school's third family and the third to
arrive on the same day: same three-tag banner, same tiers, same shelves. The sheet
writes all twelve in tier, school, family order already, so like the Shadow drop
and unlike the Light one, nothing had to be normalised.

| Tier | Spells |
| ---- | ------ |
| Novice | SLOW, FORESIGHT, TEMPORAL EROSION, REVERSE |
| Adept | TEMPORAL MEND, CHRONO LOCK, DELAY, UNDO |
| Master | CHRONO ANOMALY, TEMPORAL COLLAPSE, SELF HELP, TIME SKIP |

Four to a rung and no Legendary. THEON PERFECT REPLICANTS is still the only card
in the codex on that fourth rung, and still nothing reaches it.

The CSV also carries a stray VAMPIRIC TOUCH row after eleven empty ones, pasted in
from the Primal sheet. It is already in the codex with its art placed, so the
importer skipped it and nothing was read off it. Worth deleting at the source.

### What this retires: nothing, for the first time

Light and Shadow each closed something. Each was a school the lineage tab had
named before any sheet filled it, so a Celestial's INNATE LIGHT and an Infernal's
INNATE SHADOW promised a Novice spell that could not be looked up, and a stand-in
card held the slot. Time was never promised by anything. No ancestry names the
family, no talent set names it, and nothing was waiting.

So this drop only adds. The Ethereal school went from two shelves to three, and
every gate it passes through was already built for it.

### What the codex learned: INTERRUPTED

UNDO's Main Effect cell ends with a note to the developer rather than card text:

> lets add the interrupted key word whcih means the next action in question does
> not happen but the cost is still spent

That is a definition, so it went to `keywords.js` in the designer's own sense and
the note came off the card, which is exactly the trade SHADOW BIND made for
Constrained the same afternoon. A defined term is never glossed in prose as well,
and the writing rule at the top of `keywords.js` says so.

Interrupted is not Stunned, and the difference is the bill. A stunned entity takes
no Actions at all. An interrupted one loses the Action it was taking and has
already paid for it, which is what makes UNDO worth 4 Action Points and 6
Willpower rather than being a worse Chrono Lock.

The word was already in the codex once, in CONCUSS's summary, where it means the
ordinary English thing. A summary is printed as plain text and never through
`CardText`, so it is not lit and needed no rewording. Nothing else in any card
body uses the word, which was checked rather than assumed.

### The readings

Every one of these is a cell that could not be printed as it stood. They are all
written down in the Time section of `spells.js` as well, beside the cards.

- **Six ranges had the metres and lost the feet.** "9 meter (feet)", "6 Meter
  (feet)", "9 meter()" and "3 (feet) Meter" are the four shapes it took. The metre
  leads every cell in this codex and the conversion is the codex's own three metres
  to ten feet, the call WALL OF FLAMES documents. This family settles its own
  broken cells rather than being read against another: REVERSE and TEMPORAL
  COLLAPSE print "9 meter (30 feet)" intact on the same sheet.
- **DELAY calls itself Chrono Lock, twice.** "Until the Chrono lock ends" in the
  body and "When Chrono Lock ends" in the Overcast are both pastes from the row
  directly above it, which really is CHRONO LOCK. This card is DELAY in its Name
  column, on its picture and in everything it describes, so both now name it. The
  same call ORBITING ARSENAL's stray "the Lightforged" documents.
- **TEMPORAL MEND's weight limit says "100 kg (imperial value here)"**, a note to
  whoever was going to convert it. 220 lbs, in the form TELEKINESIS already prints.
- **CHRONO ANOMALY's Overcast repositions it "within range" and names none**, the
  same hole LIGHT had. Read at the row's own 6 meters.
- **FORESIGHT covers "the next Attribute you make"**, which is an Attribute Roll
  with the noun dropped. The average is left in plain words with no live value on
  it, because the roll it covers may be any attribute rather than the one the spell
  was cast with, so a number printed here would be the wrong number.
- **CHRONO LOCK gives its duration twice**, "for a turn" and then "until the end of
  its next turn". The precise one survives, which is the call GUARDIAN ANGEL's
  double description documents.
- "At each of the entity Start Turn" and "on their next Turn Start" are **Turn
  Start**. "until the end of its next turn" and "its next End Turn" are its **next
  Turn End**. The defined terms.
- **REVERSE said "undoing wounds" and lit a term it did not mean.** Wound is a
  defined thing in this system, and the sheet was using the word in its ordinary
  sense, so the card reads "running its injuries backwards" instead. Reworded
  rather than exempted, which is the trade GORE ARMOR and VAMPIRIC TOUCH made and
  what the writing rule at the top of `keywords.js` asks for. Caught by reading
  every Time card back through the keyword matcher, not by eye.
- Spelling and grammar, throughout and without further comment: "tunrs", "you can
  within", "ot its", "moer than", "bunrt", "with 6 Meter", "with in", "their
  Grits", "tis grits", "Addtional", "loose", "repostion", "ntunred", "had happen",
  "teh cost", "is undo", "Start Turn", "End Turn", "all effect", "Upkeep are",
  "Damage and Healing effect".

TIME SKIP is the one card that arrived almost clean and needed only its serial
comma restructured, which `lint:text` caught.

### One number here is not the designer's

**TEMPORAL EROSION arrived with an empty AP column and an empty WP column.** That
is not a blank meaning free, the way LIGHT's empty Willpower cell is: this spell
deals damage every turn for five turns, and no spell in the codex has ever had an
empty AP column at all.

It is priced at **3 Action Points and 3 Willpower**, which is where its two Novice
neighbours sit (SLOW at 3 and 2, FORESIGHT at 2 and 4) and what SHADOW HEX charges
a rung up for the same creeping-damage shape. It sits in one place, on the card,
and changing it is changing two numbers.

This is the first thing to check, and the note beside the card says so in bold.

### Exhaustion is a word the codex does not have

TIME SKIP charges "1 level of Exhaustion for each additional cast" before a Long
Rest. Nothing in `keywords.js` defines Exhaustion, no other card in the codex
spends it, and no bar, pip or pool on the Character tab holds it.

It prints as the plain words the sheet wrote, unlit, and the table runs it. This is
not the INTERRUPTED case: UNDO's cell handed over a definition to add, and this one
names a system that does not exist yet. Writing one off a single card's mention
would be inventing rules rather than transcribing them.

The second thing to check.

### The halves

Five, all labelled correctly: two Multicasts and three Overcasts. `lint:halves`
reads all five off their own prose and the codex now stands at 57 second halves.

| Card | Half | Opens | Costs |
| ---- | ---- | ----- | ----- |
| SLOW | Multicast | rides the cast | 1 Action Point and 1 Willpower |
| FORESIGHT | Overcast | its own spend | 6 Willpower |
| REVERSE | Multicast | rides the cast | 1 Action Point and 3 Willpower |
| DELAY | Overcast | its own spend | 3 Willpower |
| CHRONO ANOMALY | Overcast | its own spend | 2 Action Points |

**Two of the three Overcasts open later than a cast**, and both had to be written
that way rather than left in the sheet's words. FORESIGHT's is bought when a roll
it covered fails, and DELAY's when the delay runs out. Neither is a rider on the
cast, so the parse in `overcast.js` charges each as its own spend, the way SIGIL OF
TRUTH's does. CHRONO ANOMALY's already opened "While Chrono Anomaly is active" and
needed nothing.

### The art importer needed one word and one alias

`data/Time/` is the second folder to arrive as a family at the top of `data/`
rather than under its school, so it went into the `FAMILY_FOLDERS` set beside
`shadow` and into `PLATE_FOLDERS` beside `shadow` and `ethereal`, since these
twelve are plates rather than card renders and must not be cut. Two entries make
that a pattern rather than one drop's exception, and the note beside the set says
what retires both: moving the folders to `data/Ethereal/Shadow/` and
`data/Ethereal/Time/`, since a school folder is walked into whatever subfolders it
brings.

The drop is also the first to arrive at two sizes, 2400x1792 for FORESIGHT and SLOW
and 1200x896 for the other ten. Neither is cut and the resize takes whatever it is
handed down to 720, so the ten small ones cost 0.66 to 1.02 MB in and 35 to 82 KB
out.

One file needed an alias: `Temporall Collapse.jpg` has an l too many for the
sheet's TEMPORAL COLLAPSE, and the sheet is the authority on what a card is called.
The other eleven land without help, `TIme Skip.jpg` included, because `flatten`
lowercases before it compares and the capital I costs nothing.

That is the third drop running whose Image column is empty and whose files are
therefore placed by filename. Five of the thirty-seven Ethereal rows now need an
alias, and filling in the drops' own Image column retires all five at once.

### Nothing here is wired

No effect in this drop moves a number on the sheet, which is where both earlier
Ethereal drops landed too. Four are effects a tracker row would want to carry, and
the two worth naming are SLOW, which takes 2 Action Points off a turn that has not
started yet, and CHRONO ANOMALY, which hands 2 back to everybody standing in it.
Neither has a rider in `riders.js`.

SELF HELP and TIME SKIP are a different shape again: they move a *turn* rather than
a number, and `combatBar.js` has nothing that can hold a turn open or hand one
back. Prose for both, and the table runs them.

They print, they can be dealt, and the table does the arithmetic, which is where
every effect in this codex starts.

### The Arcanist's spellbook grew by twelve again

The Arcanist is still the one spec that names no school, so it draws from the whole
codex by tier and a new family widens it. Its Rank 3 pool is now 24 Primal, 29
Elemental, 36 Ethereal and 1 Arcane, up from 24 Ethereal after the Shadow drop.
Rank 1 offers the four Novice, Rank 2 adds the four Adept, and Rank 3 opens all
twelve.

Every other set that names a school refuses all twelve. The Mycomancer does so with
"Ethereal school, not Primal", and no other set on the wall has a spell pool at
all. Imbuements pick all twelve up on their own, because `spellsAt` matches the
tier word and Novice, Adept and Master are three of the words it matches.

### Two things for Jules

1. **TEMPORAL EROSION's cost is a guess.** The sheet left both columns empty on a
   spell that deals damage for five turns. Priced at 3 and 3 off its Novice
   neighbours and SHADOW HEX. Give it a number.
2. **Exhaustion is not a term this system has.** TIME SKIP is the only card that
   charges it. Either it wants a `keywords.js` entry and something on the Character
   tab to hold it, or the sentence wants rewriting in terms the codex already has.

Two smaller ones, both already decided and both cheap to reverse: DELAY is named
DELAY on both halves rather than Chrono Lock, and TEMPORAL COLLAPSE keeps the
sheet's spelling over the picture's.

### The proof

`npm run lint`, `lint:text`, `lint:math`, `lint:riders`, `lint:halves` and
`lint:weapons` are all clean, `npm run build` is clean, and `npm run art:cards`
reports only the four problems it reported before this drop.

The codex was walked directly as well: 390 cards with no duplicate id, all twelve
Time bodies and five halves resolving with no unspent token, all twelve carrying a
plate and a thumbnail on disk, INTERRUPTED lit on UNDO and on no other card body,
CONCUSS still unlit because its use of the word is in a summary, the Arcanist
offering 4 at Rank 1, 8 at Rank 2 and all 12 at Rank 3, and the Mycomancer refusing
all twelve as the wrong school.

All twelve were then printed the way a reader sees them, live values resolved
against a sample caster and every keyword marked. That is what caught REVERSE
lighting Wound, and it is worth doing on the next drop too: a term used in its
ordinary sense reads perfectly well until the matcher colours it. TIME SKIP is the
longest of the twelve at 565 characters, sixth of all 390 cards and well inside the
667 the box already holds, so none of these needed the card to shrink further than
it already does.

`templates/ethereal-spells.csv` is 37 rows now, 13 Light and 12 Shadow and 12 Time,
and every Time row was read back: each parses into the card it came from field for
field, and every Image cell names a file that is really in `data/Time/`.

## The Spacial family, and colour on every tag, 2026-08-25

Asked for in as many words: "I ahve added the Spacial spells you have hte image in
the space folder. I also want you to do a pass color on tags for the spells, each
school and sub schoo lshould have a color here they can be close to each other. Try
to establsih one htat make sense for each . Also clean the tags so damage type does
not show in the list or overcast and multicast ect but can still be serach (like
invisible tags)."

Three things, and the first is another spell drop.

Two sources, both already on disk. `data/Spells - Ethreal - Spacial.csv` holds
twelve rows in the drop's usual eight columns, and `data/Space/` holds twelve
pictures at 1200x896, one per row. Spacial is the Ethereal school's fourth family
and the fourth to arrive on the same day: same three-tag banner, same tiers, same
shelves. The sheet writes all twelve in tier, school, family order already, so
nothing had to be normalised.

| Tier | Spells |
| ---- | ------ |
| Novice | DIMENSIONAL POCKET, COMPRESSION BLAST, DIMENSIONAL REACH, WARP TIDE |
| Adept | SPATIAL FOLD, PORTAL TRICK, ENERGY BEAM, CONTAINMENT SPHERE |
| Master | TRANSPOSITION BEACON, SPATIAL TRANSPOSITION, BANISHMENT VAULT, EVENT HORIZON |

Four to a rung and no Legendary. THEON PERFECT REPLICANTS is still the only card in
the codex on that fourth rung, and still nothing reaches it.

### The family is Spacial, with a c

All twelve Tags cells say Spacial and so does the sheet's filename. Two of the
cards are named with a t (SPATIAL FOLD, SPATIAL TRANSPOSITION), a third says
"spatial pocket" in its body, and the picture folder is called Space. The Tags
column is what a banner prints and what a filter chips, so the tag is the sheet's
Spacial and the card names are the sheet's Spatial. Neither was corrected against
the other, and it is worth a glance at the source since a family name is what a
whole shelf is called.

### What this retires: the Arcane school

CONTAINMENT SPHERE was the codex's only Arcane spell. It had no sheet behind it and
no picture on disk, and the two exceptions this file has been carrying since the
Primal pull, "one Arcane spell no sheet covers yet" and "two cards have no
picture", were both about that one card.

This sheet has it at the same tier, the same 4 Action Points and 4 Willpower, and
the same three paragraphs, with a render beside it. So it is the same card finally
filed. It moved rather than being written twice: the id `containment-sphere` is
unchanged, so a spellbook already holding it still resolves and simply reads
Ethereal · Spacial from here on.

Two things about it did change, and both are the sheet's:

- the trapped entity is **Constrained** where the old card said stunned, which is
  the keyword SHADOW BIND defined that afternoon and the better word for a thing
  sealed inside a sphere
- the Overcast costs **3 Willpower** where it used to cost 2

Arcane is empty now, which is exactly where Nature has always been: a word on the
shelf in `cardOrder.js` with nothing standing on it. Both keep their places, so the
day a sheet arrives it lands where the designer already put the word.

### The rolls

Seven contests, all the caster's own and all against Reflex: COMPRESSION BLAST,
WARP TIDE, PORTAL TRICK, ENERGY BEAM, SPATIAL TRANSPOSITION, BANISHMENT VAULT and
EVENT HORIZON. No family in the codex has leaned this hard on one defense.

CONTAINMENT SPHERE's breakout is the eighth roll and is the trapped entity's, so it
prints `{stat}` as a name and no `{roll}`: the number belongs to whoever is in the
sphere and the card has no way to know who that is. BEND LIGHT is the only other
card that does this, and it is unchanged from the old Arcane version.

### The halves

Six, and five are labelled the way the codex uses the words. Three Overcasts that
buy more (COMPRESSION BLAST widens, ENERGY BEAM bends, CONTAINMENT SPHERE hampers
the breakout), one that closes a spell early (SPATIAL FOLD), one that spends the
beacon you left (TRANSPOSITION BEACON) and one genuine Multicast (BANISHMENT
VAULT).

**DIMENSIONAL POCKET's is called a Multicast and moves an item rather than catching
a target.** Multicast means spending more to reach more, and one more item in the
pocket is the nearest thing this card has to another target. The sheet's word
stands. Worth a glance: an Overcast is what the same half would be called if the
thing it reached were not countable.

Four of the six open later than a cast. SPATIAL FOLD, TRANSPOSITION BEACON and
DIMENSIONAL POCKET all begin "While X is active", and CONTAINMENT SPHERE's opens on
the breakout, so `overcast.js` charges all four as their own spend rather than as a
rider on the cast. COMPRESSION BLAST's, ENERGY BEAM's and BANISHMENT VAULT's keep
"When casting" and are riders.

### Two numbers here are not the designer's

1. **ENERGY BEAM arrived with no Action Point and no Willpower cost**, the same hole
   TEMPORAL EROSION had on the Time sheet the evening before. It is priced at 4 and
   5, which is what SAVAGE SLAM and WALL OF FLAMES both charge for the same shape:
   an Adept spell catching everything in an area for `4d6 + 4*stat`. It sits at the
   top of its rung in the family, above SPATIAL FOLD and PORTAL TRICK at 3 and 4
   and level with CONTAINMENT SPHERE's 4, which is where the family's one damage
   card belongs. Give it a number.
2. **COMPRESSION BLAST deals damage and names no type.** Its two siblings both say
   Force and this one says nothing, so it prints untyped rather than being given a
   type it does not carry: a damage type is what a resistance answers, and DRACONIC
   SCALE grants one without the other. Force is the obvious answer and it is one
   word at the source.

### Every other reading, in order

- **Nine ranges had the metres and lost the feet**: "3 Meter()", "9 Meter ()",
  "with 18 meter ()", "with in 9 Meters ()", "1.5m ()", "20 meter ()". The metre
  leads every cell in this codex and the conversion is the codex's own three metres
  to ten feet, which is the call WALL OF FLAMES documents.
- **EVENT HORIZON's 20 meters is the first range in the codex off its own ladder.**
  Every other distance is a multiple of 3 metres or the two halves 1.5 and 4.5, and
  20 is neither, so it converts to 65 feet rather than to one of the round numbers
  the rest of the codex prints. The number is the designer's and it stands. 18
  meters (60 feet) is what it would be on the ladder, and SPATIAL TRANSPOSITION on
  the same rung is already there.
- **SPATIAL FOLD's Overcast calls the spell Dimensional Pocket**, a paste from the
  row two above it, and its second sentence closes "the Spatial Fold". The card is
  SPATIAL FOLD in its Name column, on its picture and in everything it describes,
  so both halves name it. The same call DELAY documents.
- **ENERGY BEAM's Overcast calls the spell Arcane Ray** and bends "the ray". Same
  paste and same call: the Name column, the picture and the body all say Energy
  Beam, so the half says Energy Beam and bends the beam.
- **DIMENSIONAL POCKET's weight limit says "20 Kg (imperial value)"**, a note to
  whoever was going to convert it, exactly as TEMPORAL MEND's did. 44 lbs, in the
  form TELEKINESIS prints.
- **DIMENSIONAL REACH is cast with "special magic".** Left as the sheet wrote it.
  It is a real word in a real sentence, so the COGNITE reading does not apply, but
  every other card in the family says space or spatial and this one is called
  DIMENSIONAL REACH. One letter at the source either way.
- **PORTAL TRICK intercepts "the next attack and entity you can see"**, which is an
  attack *of* an entity with one letter turned. Nothing else in the sentence
  parses: a portal that intercepts an entity is what CONTAINMENT SPHERE does.
- "Until the end of your next turn" is your **next Turn End**, and "At each of your
  Turn end" is **at your Turn End**. The defined terms.
- Spelling and grammar, throughout and without further comment: "abiltieis", "YOu",
  "agasn", "tey", "entitles", "this two points", "are connect", "is redirect",
  "entiteis", "Transpostion", "that last for", "orginaly", "intendend", "all action
  apply", "htier", "teh", "They banished", "item fall out into the ground".

### The art importer learned one word

`data/Space/` is the third family folder dropped at the top of `data/` rather than
under its school, after `data/Shadow/` and `data/Time/`, so `space` joined
`FAMILY_FOLDERS` and `PLATE_FOLDERS` in `pull-card-art.mjs`. The first says the
folder is spell art; the second says its files are paintings rather than whole card
renders and must not be cropped.

It is the one entry there that is not named for the family it holds: the folder is
Space and the family is Spacial. Nothing in that script compares a folder's name to
a tag, so the mismatch costs nothing. The name is only how the folder is claimed,
and the cards inside it are matched to the codex by their own filenames.

**No alias was needed, which is a first for these drops.** All twelve filenames
match the names the sheet prints once `flatten` has lowercased them and dropped the
punctuation, `Containment SPhere.png` included.

### Nothing here is wired

Which is where all three earlier Ethereal drops landed. Five are effects a tracker
row would want to carry, and the two worth naming are DIMENSIONAL POCKET, which
holds two items off the Inventory tab until a Long Rest, and BANISHMENT VAULT,
which takes an entity off the board for two turns. Neither has a rider in
`riders.js`.

The pocket in particular is a new shape: it is the first card in the codex that
changes what a character is carrying without the item leaving the sheet, so a bag
that knew about it would have to hold an item that is neither worn, on the belt nor
in the inventory. They print, they can be dealt, and the table does the arithmetic,
which is where every effect in this codex starts.

### The Arcanist's spellbook grew by eleven

Eleven and not twelve, because CONTAINMENT SPHERE was already in it under another
school. The Arcanist is still the one spec that names no school, so it draws from
the whole codex by tier: its Rank 3 pool is now 24 Primal, 29 Elemental and 48
Ethereal, up from 24 Primal, 29 Elemental, 36 Ethereal and 1 Arcane. Rank 1 offers
44 cards and Rank 2 offers 77.

Every other set that names a school refuses all twelve. The Mycomancer does so with
"Ethereal school, not Primal", and no other set on the wall has a spell pool at
all. Imbuements pick all twelve up on their own, because `spellsAt` matches the
tier word and Novice, Adept and Master are three of the words it matches.

## Colour on every school and every family, 2026-08-25

The second and third parts of the same ask, and both are about the chip row rather
than about any card's text.

### One law, and six leans

**The school owns a hue and a family is a shade of it.** So the school is what you
see first and the family what you see second, which is the order the banner itself
reads in. Every family sits inside about thirty degrees of its school's hue and
separates from its siblings on lightness and saturation instead.

| School | Hue | Families |
| --- | --- | --- |
| Primal | green | Flora leaf, Wild moss, Life spring, **Blood** |
| Nature | teal-green | none yet |
| Arcane | magenta | Energy, lighter |
| Elemental | ember amber | **Fire**, Magma, Earth, **Lightning**, Wind, **Water** |
| Ethereal | sky | **Light** palest, Time cyan, Spacial indigo, **Shadow** deepest |
| Nightmare | crimson-magenta | none yet |

The bold six are the leans, and they are written into the law rather than around
it: **where the codex already knows what colour a family is, that colour is what
its shade leans to.** Fire, Water, Lightning and Blood each answer to a damage or
stat token that has been in `index.css` since the beginning; Light and Shadow are
their own names, and being the palest and the deepest thing on the Ethereal shelf
is the whole of that pair. Blood is the one that leaves its school's band outright,
because a green Blood chip would read as poison.

None of the six is a second copy of the token it answers to. A chip is 0.56rem
uppercase on a dark ground and needs more light than a body-text colour does, so
each is its own value and says at the token which one it answers to.

Nature and Arcane have no spell in the codex and are coloured anyway, so the day a
sheet arrives it lands somewhere rather than falling to grey.

### Where it lives

`src/lib/tagColors.js`, a leaf that imports nothing, for the reason `cardOrder.js`
is one: it is reached from the card brief and from the filter row, so anything it
pulled in would be pulled into both. Every value in it is a `var(--...)`, so
`index.css` stays the one place a colour is written down and `tagColors.js` stays
the one place a *word* is matched to one.

Two callers, and they agree on purpose. A brief's chips take the colour, so a wall
of spells reads school by school; the filter row's chips take the same one, so
"Ethereal" in the box and Ethereal on a brief are visibly the same thing. The
ground and the border are mixed off `currentColor` in the stylesheet rather than
written in the module, so one property lights a whole chip and the CSS keeps
deciding how strongly.

**The rung is not coloured.** `Novice Spell` and its siblings keep the card's own
accent, the violet the printed card is capped with, because what a card *is* is a
different question from what school it belongs to and the brief already answers it.
Nothing that is not a school or a family is coloured either: a martial move's
`Martial Move`, a talent's `Passive`, an item's `Uncommon` are all still grey, and
`tagColor` gives back null for every one of them so a caller can leave the chip
alone rather than having to know which words are in the table.

### The damage type and the second half are not chips any more

A brief was carrying the tier, the school, the family, often the weapon, then the
damage type and then the name of the second half. Six chips under a name that then
had nowhere to sit. Both of the last two went.

Neither is lost. The damage type is written into the sentence that deals it, in its
own colour, on the card itself, and the second half has its own heading there. And
both are still **searchable**, which is the other half of what was asked: the box
above a wall reads `cardHaystack`, which has carried the damage types and the
half's name the whole time whether or not anything printed them. Typing "force" or
"overcast" narrows a wall to the cards that have them.

One thing had to change for that to be true everywhere. The spell chooser was
searching `card.name` and `card.body` only, so a damage type and a half's name were
the two things about a card it could not find. It reads `cardHaystack` now, which
the Abilities tab has always read. Nothing was added to the chip *suggestions*: an
invisible tag that appeared in the list of tags would not be invisible.

### The proof

`npm run lint`, `lint:text`, `lint:math`, `lint:riders`, `lint:halves`,
`lint:order` and `lint:weapons` are all clean, `npm run build` is clean, and
`npm run art:cards` reports only the four problems it reported before this drop.

The codex was walked directly as well: 401 cards with no duplicate id, all twelve
Spacial bodies and six halves resolving with no unspent token, all twelve carrying
a plate and a thumbnail on disk, CONSTRAINED lit on CONTAINMENT SPHERE, every
keyword each of the twelve lights read out and checked, the Arcanist offering 44 at
Rank 1, 77 at Rank 2 and 101 at Rank 3, and the Mycomancer refusing all twelve as
the wrong school. BANISHMENT VAULT is the longest of the twelve at 547 characters,
eighth of all the spells and well inside the 667 the box already holds, so none of
these needed the card to shrink further than it already does.

The chips were then read out of a running browser rather than reasoned about: every
school and family chip resolves to its own colour with none left grey, a Spacial
brief carries three chips and not five, and no `card-brief-dmg` element exists
anywhere on a page of twenty-seven briefs. The search was walked the same way:
"force" finds 7 cards including ENERGY BEAM, "overcast" finds 33, "blood tithe"
finds 4 and "spacial" finds all 12.

`templates/ethereal-spells.csv` is 49 rows now, 13 Light and 12 Shadow and 12 Time
and 12 Spacial, and every Spacial row was read back: each parses into the card it
came from field for field, and every Image cell names a file that is really in
`data/Space/`.

## The readability pass, 2026-08-26

Jules asked for a pass on all the card text: "It need to be redable", a
researched maximum before text stops being readable, blank space organized, the
system wording made easier and more concise, and a reference document so it
stays that way. The reference is `docs/card-text.md` and its checker is
`npm run lint:cards`; this entry is the record of what moved.

### The research

All 409 cards were measured against the real renderer in a browser: each one's
`--ac-fit` taken by the same binary search `useFitText` runs. The cost model
came out as **load = prose characters + 30 per paragraph break + 100 for an
optional second half**; a card at 480 or less prints at full size (14.7px) and
past 600 it falls under 0.9 fit (13.2px), which is where reading at arm's
length stops being comfortable. Before the pass 93 cards were shrunk and 21 sat
below 0.8 fit, the worst at 0.69 (BEND LIGHT). After it, nothing in the codex
is below 0.9 and 349 of 409 print at full size.

Part of the room came from the card's own chrome rather than from the text:
paragraph gap 0.7rem to 0.55rem, line-height 1.5 to 1.45, title margins and
body padding trimmed, the second-half heading pulled closer. About one full
line of text at full size, on every card, without the type getting smaller.

### The wording

One spelling per mechanic now, the codex-wide sweeps first: lowercase
measurements ("18 meters (60 feet)", the weapon wall said "18 Meter"), damage
dealt plain ("deal X {damage} damage", where the codex had both "as" and "in"),
"restore X Health" and "gain X Shield", "Long Rest" and "Short Rest" as the
proper nouns they are, "Attack Roll" capitalised and advantage, disadvantage
and skill check in lowercase, states as adjectives in lowercase (rooted,
stunned, constrained), "entity" where "a creature", "a target entity" and "a
single target" had drifted in, and "Roll" capitalised where it is the game's
noun.

Every optional second half is one paragraph now, price and resolution together,
and never names its own card: "When casting this spell", where twenty-odd cards
each said their own name. Multicast resolves as "For each time you do, target
**an additional eligible entity**." An Upkeep reads "At your Turn Start, pay 2
Willpower to keep <X>. Miss the Upkeep and the spell ends." All of it stays
inside the shapes `secondHalf`, `halfPrice` and `effectDuration` parse, and
`lint:halves` still prices all 63 halves off their own prose.

About sixty of the densest cards were also trimmed by hand: restatements cut
(GALVANIZE declared its target twice), filler dropped ("devastating",
"completely", "the following ways"), declaration and roll merged where they are
one beat. Mechanics, numbers and names untouched throughout, and where a
sentence was broken it was mended rather than shortened: WIELDER OF WONDER's
comma splice, THRILLED's missing 7, AMBUSH's developer note turned into a
sentence, VIGILANT's "saving throw" turned into the house's own Roll.

### The proof

`lint`, `lint:text`, `lint:cards`, `lint:halves`, `lint:riders`, `lint:math`,
`lint:order` and `lint:weapons` are all clean (`check-weapons` itself learned
the lowercase meter), `npm run build` is clean, and the whole codex was
re-measured in the browser after the last edit: 0 cards under 0.9 fit, worst
card 0.902, 349 of 409 at full size.

## The Death family, 2026-08-26

Asked for in as many words: "I have added death spells and deaht iamge in death
folder for the death school of magic. Add it, make sure the text is correct and
alligne with your guilde lins and style for the system."

Two sources, both already on disk. `data/Spells - Primal - Death.csv` holds eleven
rows in the drop's usual eight columns, and `data/Death/` holds the pictures at
2400x1792, one per row. The CSV is on disk **twice**, once at the top of `data/` and
once inside `data/Death/`, and the two are byte for byte identical, so nothing had to
choose between them.

A twelfth card, GORE SPIKE, came later the same day: the sheet had left a blank row
for it, and it was handed over in chat with its picture dropped into the same folder.
So the family is twelve, and the folder is twelve, and only eleven of them came off
the CSV.

| Tier | Spells |
| ---- | ------ |
| Novice | ROTTING TOUCH, SICKNESS, MIMIC DEATH, DREDGE CORPSE |
| Adept | PESTILENT CLOUD, CORPSE STRIDE, CORRUPT LIFE, GORE BLAST |
| Master | UNALIVE, ENBRITTLE, DEATH WAIL, GORE SPIKE |

### Death is a family and Primal is the school

The ask calls it a school and the sheet does not. All eleven Tags cells read
"Novice Spell, Primal, Death", and the sheet's own filename says the same thing in
the same order the four Ethereal drops did: the school, then the family. So Death
goes on the shelf in `cardOrder.js` beside Flora, Wild, Life and Blood rather than
beside Primal, Elemental and Ethereal, and a card's banner reads NOVICE SPELL ·
PRIMAL · DEATH.

The Tags column is what a banner prints and what a filter chips, so it is what the
codex follows. Worth a glance, because it decides which specs can ever prepare
these: a family under Primal is the Mycomancer's, where a school of its own would
have been nobody's.

### Primal has Master spells for the first time

The most consequential thing in the drop, and it is a side effect rather than a
card. Primal was 24 spells in four families and **not one of them was Master**:
sixteen Novice and eight Adept. **Death's four were the school's first.** Flora's
four followed later the same day (DEVOURING BLOSSOM, SEEDLING SPIRITS, IMPALING
GROVE, BLIGHT POLLEN), so Primal stands at 40 spells now, at 20 Novice, 12 Adept and
8 Master. The four that opened the rung were these.

That moves a pool nobody touched. The Mycomancer draws Primal by tier, and its Rank
3 offered the same 24 cards its Rank 2 did, because the extra rung it opened had
nothing standing on it. Death took Rank 3 to 36 and Flora took it to 40, where Rank
2 is still 32, so for the first time reaching the top of that set is worth
something.

| Mycomancer pool | Before | After Death | With Flora |
| --------------- | ------ | ----------- | ---------- |
| Rank 1 (Novice) | 16 | 20 | 20 |
| Rank 2 (+ Adept) | 24 | 32 | 32 |
| Rank 3 (+ Master) | 24 | 36 | 40 |

The Arcanist, which names no school and draws the whole codex by tier, goes from 44,
77 and 101 to **48, 85 and 113** on this drop, and to 48, 85 and 117 once Flora's
Masters landed.

### The twelfth row, and what went in it

Four Novice, four Adept and four Master, which is what every Ethereal family landed.
**It did not arrive that way.** The sheet's twelfth row was not absent, it was
*blank*: a row carrying "Master Spell, Primal, Death" in its Tags cell and nothing in
any other column, so a fourth Master had been laid out and never written.

GORE SPIKE is that row. It was designed in chat against the gap the other eleven left
and handed back as a finished cell, so it is the one card in the family that did not
come off the CSV.

> A corpse you can see within **15 meters (50 feet)** erupts into a spike of gore.
>
> Make a {stat} Ranged Attack {roll} against **an entity** within **6 meters
> (20 feet)** of it. On a hit, you deal [[6d6 + 6*stat]] {damage} damage.

4 Action Points, 10 Willpower, Decay. It is GORE BLAST's sentence structure line for
line with the Roll against Reflex swapped for an Attack Roll and the area swapped for
one target, so the corpse engine now has its area payoff at Adept and its focused one
at Master.

The 6-meter tether is what makes it interesting. You need a corpse within 6 meters of
what you want dead, and DREDGE CORPSE is the only card that puts one there, at 2
Action Points and 1 Willpower with no range of its own beyond what you can see.
Overcast that dredge and the corpse comes up bloated, which leaves any ability using
it Empowered and Elevated, so the spike lands as 7d6 elevated to 7d8 with no extra
words on this card. DREDGE CORPSE goes from the cheapest card in the family to the
thing three others want.

### Three glosses became keywords

The drop explains three effects at the foot of the cards that inflict them, and a
gloss on a card is exactly what `keywords.js` exists to absorb. All three moved, all
three sentences are the designer's own, and the glossary is 76 terms where it was
73.

- **diseased**, off SICKNESS: -1 to all attributes until a Long Rest. The only state
  in the codex that moves every attribute at once.
- **vulnerable**, off ENBRITTLE, which spells it out in a parenthesis the designer
  marked "(note ...)". BURN has been *defined in terms of* this word since
  2026-08-20 and the word itself was never lit. It is now, on three cards: ENBRITTLE,
  BURN's own explanation and the Nightmare Curse in `enchantments.js`.
- **Corpse Carrion**, off GORE BLAST. The term carries what it does and the card
  keeps how long, the way BLIND prints a duration over the blinded keyword. That
  split is not cosmetic: `effectDuration` in `combatTurn.js` reads a count off the
  card's own prose, so the 5 turns had to stay printed or the tracker would have
  nothing to count. Its damage is the caster's attribute and is written out in words,
  which no other entry in that file has had to do, since a glossary entry is one
  static sentence with no card under it to resolve a live value against.

### The rolls and the halves

Six contests and they are not all one shape. Three are the caster's Roll against a
named defense (CORRUPT LIFE and ENBRITTLE against Grit, GORE BLAST against the
Reflex of an area) and three are attacks against Defense (ROTTING TOUCH in melee,
SICKNESS and GORE SPIKE at range). MIMIC DEATH's inspection is a seventh Roll and is
the examiner's rather than the caster's, so it prints no dice arrow.

GORE SPIKE is the family's only Master attack, and it closes a hole the other three
left: UNALIVE deals its damage without rolling for it, ENBRITTLE rolls against Grit
and DEATH WAIL rolls nothing, so the top rung had no Attack Roll on it at all.

Five second halves, all the designer's word: four Overcasts and CORRUPT LIFE's
Multicast. Two of the five open later than a cast (SICKNESS's on an entity already
diseased, PESTILENT CLOUD's on a cloud already up), so `overcast.js` charges them as
their own spend rather than as a rider on the cast. Three of the five said "pay"
where the codex says "spend", which is the word the price is read off.

### The readings

Every one of these is a cell that could not be printed as it stood.

- **Ten ranges had the metres and lost the feet**: "6 meter ()", "9 Meter ()",
  "12 meter ()", "18 meter ()", "15 meter ()", "6meter ()", "3 Meter ()". The
  conversion is the codex's own three metres to ten feet. UNALIVE's "9 meter
  (30 feet)" is the only range on the sheet that arrived whole.
- **DREDGE CORPSE names no range at all**: "at a point you can see on the ground".
  Every other card in the family gives a distance. Left as line of sight rather than
  given a number the sheet does not carry, and it is the first thing to check.
- **SICKNESS is an attack and not a Roll.** Its cell says "You make a Mind roll
  attack. On a hit", and it names no defense to roll against, where the family's
  three Rolls all name one and all resolve "on a success". An attack is rolled
  against Defense by definition, so reading it that way invents nothing; reading it
  as a Roll would have meant choosing a defense for it. Printed as a Ranged Attack,
  because the target is 6 metres off and the codex's attack sentence names which
  kind.
- **MIMIC DEATH's inspection Roll prints Mind and not the caster's attribute.** The
  examiner's Mind is Mind whoever cast the spell, and a Mycomancer casting this off
  Instinct must not make the examiner roll Instinct. CONTAINMENT SPHERE prints the
  caster's attribute for the trapped entity's breakout, which is the same question
  answered the other way, and it is worth settling once for both.
- **CORPSE STRIDE's Overcast deals damage and names no type**, the hole COMPRESSION
  BLAST had on the Spacial sheet. Every other damaging card in this family says Decay
  and this one says nothing, so it prints untyped rather than being given a type it
  does not carry: a damage type is what a resistance answers. Decay is the obvious
  answer. Its "2d66" is 2d6.
- **DREDGE CORPSE's Overcast names two defined terms and no amount**: "empowering and
  elevating abilities using a the corpse". Empowered is one more die and Elevated is
  one step of die size, both of which the glossary already says, but the cell gives no
  count for either, so the card prints the two words bare. How many of each is a
  ruling, and it is the second thing to check.
- **DEATH WAIL's cell ends on a comma**: "gain shield equal to your maximum,".
  Maximum Health is the only reading that resolves, and it is what the card prints.
- **GORE BLAST hits for one die plus the attribute**, the smallest damage on any
  Adept spell in the codex that catches an area. That looks like the point rather
  than a slip: what the card is really for is the Corpse Carrion behind it.
- **UNALIVE costs 12 Willpower and GORE SPIKE costs 10**, where nothing else in
  Primal had ever charged more than THORN RAMPART's 6. Both stand as written.
  Neither is the codex's highest, which is the 30 that THEON PERFECT REPLICANTS and
  TERRA COTTA DISK both ask, and 12 ties LIGHTSTRIDER GATEWAY and GUARDIAN ANGEL.
  The pair is worth reading side by side: GORE SPIKE lands 6d6 and six times the
  attribute for 4 and 10 and always keeps it, where UNALIVE lands 8d6 and eight times
  for 5 and 12 and is negated outright unless the hit kills.
- **GORE SPIKE's cell writes the damage token as `{decay}`** and it prints as
  `{damage}` over a Decay, which is the form every other card in the codex takes. The
  difference is not cosmetic: `{damage}` prints whatever type the card is carrying,
  so a Decay Infusion or a Draconic Scale can move it, where a type written into the
  token could never be moved by anything.
- Spelling and grammar, throughout and without further comment: "O n a hit", "your
  del", "nad", "withn", "coprse", "concious", "YOu", "a corpse emerge", "turn stat",
  "that last for", "agiasnt", "entitles", "wtih", "CorpsCarriosn", "nleash a beam co
  carkcling magic etempty", "weakend to constitution", "Wilppower", "diseases by
  Sickenss", "entites", "along rest".

### Nothing here is wired, and SICKNESS is why

**SICKNESS came closer than anything in the last four drops and is still written up
in `riders.js` rather than wired.** Diseased is -1 to all three attributes, which is
exactly the shape `growth-elixir` already takes, so the arithmetic is not what
stopped it.

A rider is keyed on the card and not on the caster, which works everywhere else
because only the entity a spell landed on has any reason to hold the row. SICKNESS
breaks that: its Overcast only exists "while an entity is diseased by this spell", so
the caster has to keep the row too, and a rider here would quietly take a point off
all three of *their* attributes for holding a reminder. A wrong number is worse than
a missing one. What unlocks it is the tracker learning which side of a card a row is
on.

Five of the twelve are offered on the tracker (MIMIC DEATH, PESTILENT CLOUD, CORRUPT
LIFE, GORE BLAST and DEATH WAIL) and five of the seven left out are instants with
nothing to run, GORE SPIKE among them. SICKNESS and ENBRITTLE are the two that plainly last and are still
not offered, both because what they leave on a target has no clock printed on the
card: SICKNESS's duration is the diseased keyword's, and ENBRITTLE's runs until the
next time the target takes damage, which is a condition and not a duration. SNAKE
SPIRIT has had the same hole since the opening drop, with poisoned.

DEATH WAIL is the other one worth naming. It hands out Shield equal to a full Health
bar and then forbids healing until a Long Rest, and the second half of that is a rule
the sheet has no channel for, so wiring the first half alone would be a promise half
kept.

### The colour, and the shelf

Death is the fifth Primal family and the seventh lean under the colour law: it
answers to `--dmg-decay`, which is what every damaging card in it deals. Decay's own
green is within five degrees of the school hue, so the lean is taken on hue and the
separation on saturation. `--family-death` is the one grey green on a shelf of four
bright ones, which is what rot looks like beside things that grow.

### The art needed no aliases

Twelve plates at 2400x1792, the same shape the Ethereal drop arrived in: no white
border, no banner, the painting and nothing else. So `data/Death/` joins both
`FAMILY_FOLDERS` and `PLATE_FOLDERS` in `scripts/pull-card-art.mjs`, and the crop a
school folder's files get is turned off for it.

Every one of the twelve filenames matched the name its card prints, so the drop adds
nothing to `ALIASES`. That is the second drop in a row to manage it: the Ethereal,
Shadow and Time folders needed five entries between them and `data/Space/` needed
none. 12 encoded, 0 fetched, around 43 KB of WebP apiece.

GORE SPIKE was drawn to a prompt written against GORE BLAST, its sibling, so the two
share a palette: desaturated grey green and olive, with arterial red and toxic green
as the only saturated colours. That is also what `--family-death` answers to, so the
plate and the chip agree.

### The proof

- `npm run lint:cards`: every Death card is inside the 600 ceiling and spelled one
  way. Three of the twelve sit over the 480 target and under the ceiling (PESTILENT
  CLOUD 541, CORRUPT LIFE 520, SICKNESS 484), which puts them in the lower half of a
  band the codex already has 85 cards in. GORE SPIKE is not among them.
- **The run was red for a while, and not on a Death card.** IMPALING GROVE, one of
  Flora's four new Masters, was still mid-transcription at 632 and 32 past the
  ceiling. It was left alone here on the grounds that trimming somebody's card in
  flight is not this file's business, and it came down to 579 in that other session.
  See "the fit that cost a paragraph" below.
- **The renderer was asked directly, and it is kinder than the estimate.** All twelve
  were rendered through the real `AbilityCard` and their `--ac-fit` read off the
  node: **eleven print at full size** and PESTILENT CLOUD alone shrinks, to 0.969,
  which is well above the 0.9 floor the budget was set at. Nothing in the family is
  fine print. The static load is an approximation and the browser is the authority,
  which is what `docs/card-text.md` says of it.
- `npm run lint:order`: 4 schools and 15 families are shelved, and 180 cards sort up
  the ladder (176 of them before Flora's four Masters landed). Death is the fifteenth family and the first added to a school other
  than Ethereal since the Elemental pull.
- `npm run lint:halves`: all 70 priced off their own prose, up from 63. GORE SPIKE
  carries none, so the family stays at four Overcasts and one Multicast.
- `npm run lint:text`: clean across 136 files.
- `npm run lint:riders`, `lint:math`, `lint:weapons`: unchanged and clean.
- `data/templates/primal-spells.csv` re-exported at 40 rows, which carries Flora's
  four new Masters along with the twelve Death rows. The exporter was
  proved first by regenerating `ethereal-spells.csv` and diffing: every difference
  was a readability-pass spelling that file has not caught up with, and nothing else.

## The Flora Masters, 2026-08-26

Asked for in as many words: "added flora file and folder iwth image, Add the Maste
flora spell just the mast flora spell. The image are i nth flora folder. Make sur
they are inline with system wording and format."

Two sources, both in the same new folder. `data/Flora/Spells - Primal - Flora.csv`
holds twelve rows in the drop's usual eight columns, and `data/Flora/` holds four
pictures at 2400x1792. Only the four Master rows were asked for and only the four
Master rows have a picture, so the two sources agree on the scope.

| Tier | Spells |
| ---- | ------ |
| Novice | BRAMBLE WHIP, BARKSKIN, ENTANGLING ROOTS, SLEEPING SPORES *(already in the codex)* |
| Adept | PARASITIC SPORE, VERDANT FIELD, THORN RAMPART, NATURALIZE *(already in the codex)* |
| Master | DEVOURING BLOSSOM, SEEDLING SPIRITS, IMPALING GROVE, BLIGHT POLLEN |

### The eight rows above them are the opening drop, unchanged

Flora is the codex's oldest family. Its Novice four and Adept four came in on
2026-08-19 with the very first sheet, and this file holds all eight of them again
with four new rows underneath. They were read against what is printed and **not one
of them has moved**: the readability pass of earlier the same day rewrote several of
these cards, and the sheet still carries the pre-pass wording ("2d6 + 2 x Mind", "in
Sharp damage", capitalised states). Where the sheet and the card differ on wording
alone, the card is the later artifact and it stands.

So this drop is four cards and not twelve, which is what the ask said.

### The second Primal family to reach Master

Primal had no Master spell at all until this morning. Death's four were the school's
first and Flora's four are the second set, so the top rung goes from four to eight
and two of the five Primal families have one. Wild, Life and Blood are still Novice
and Adept only.

| Pool | Before today | After Death | With Flora |
| ---- | ------------ | ----------- | ---------- |
| Mycomancer Rank 1 (Novice) | 16 | 20 | 20 |
| Mycomancer Rank 2 (+ Adept) | 24 | 32 | 32 |
| Mycomancer Rank 3 (+ Master) | 24 | 36 | **40** |
| Arcanist Rank 3 (the whole codex) | 101 | 113 | **117** |

The Mycomancer is the set this lands on: it draws Primal by tier, so all four of
these are cards its Rank 3 opens over its Rank 2, and Rank 3 was worth nothing at
all before today.

### The first sheet written in the codex's own notation

Every earlier drop arrived in the designer's longhand and had to be translated:
"2d6 + 2 x Mind" became `[[2d6 + 2*stat]]`, a bare "Mind Roll" grew its dice arrow, a
range that said "12 meter ()" had its feet put back. This one arrives with
`[[10*stat]]`, `{roll}`, `{damage}` and "15 meters (50 feet)" already in the cells,
and BLIGHT POLLEN writes `{stat}` where its three siblings still name Mind.

That is worth recording because it changes what a pull costs. The Death sheet the
same morning needed ten ranges repaired before a card could print at all; this one
needed four readings and three typos, and the rest is a copy.

### The readings

- **IMPALING GROVE writes the damage token and never names a type.** The cell says
  "you deal [[4d6 + 4*stat]] {damage} damage", and `{damage}` prints the type the
  card declares, which this card declares nowhere. It prints untyped, the call
  COMPRESSION BLAST and CORPSE STRIDE both took: a damage type is what a resistance
  answers, so it is not one to hand out. Sharp is the obvious answer and it is what
  the family's other two physical cards deal, BRAMBLE WHIP's vine and THORN RAMPART's
  briars. **Third card in a row with this hole**, and worth settling for all three at
  once.
- **SEEDLING SPIRITS counts its spirits off Mind and the card prints the caster's own
  attribute**, which is the same turn all eight cards above it take: the sheet has
  always said "Make a Mind Roll" and the codex has always printed `{stat}`. There is
  no live token for a half, so a half is written as the attribute's *name*, the way
  GLACIAL ACCRETION writes "half your {mind}". That card keeps Mind because its cap
  and its throw measure the same Ice Spikes; here the count and the healing are
  separate quantities, so the whole card stays on one attribute and a Mycomancer
  calls up spirits by Instinct.
- **BLIGHT POLLEN's Blood Tithe is the first in the codex not paid in Physique.**
  "Health equal to your 3xlevel" reads as three times the caster's level and prints
  `[[3*level]]`. Every other tithe costs `{physique}`, on the stated grounds that a
  body pays it, and `level` is a pseudo-attribute nothing is cast off. `secondHalf`
  in `overcast.js` prices it the same either way, so nothing broke; whether a tithe
  is allowed to leave Physique is the designer's call.
- Spelling and grammar, without further comment: "BLight Pollen", "1 Action Points",
  "The spirit cannot be target otherwise". DEVOURING BLOSSOM's "for 10 turns" gained
  the "(1 minute)" its three siblings and the row under it all print.

### What it confirms

DEVOURING BLOSSOM's flower is a conjured thing with a Health bar, and it arrived on
the ladder HARD LIGHT already set: `[[10*stat]]` Health and `[[2*stat]]` Defense, the
same two expressions in the same order, off a sheet that has never seen that card.

It is **not a minion**. Nothing here hands over a body with a sheet of its own, which
is what `minions.js` is for; it is an object on the table, which is all SHAPE EARTH's
wall and HARD LIGHT's bridge are either.

### The fit that cost a paragraph

IMPALING GROVE would not fit. Transcribed as it stood it loaded 632, which is 32 past
the ceiling `lint:cards` fails the build at, and the real renderer put it at **0.895**
— just under the 0.9 floor and into fine print.

Its Overcast is what makes it heavy. A repeatable half is 161 characters before it
says anything of its own, because the price has to be spelled the way `secondHalf`
reads it and the resolution the way all twenty repeatable halves in the codex write
it. Nothing in the half could come off, and the body is a declaration, a Roll and two
states.

So four variants were rendered through the real `AbilityCard` and their `--ac-fit`
read off the node:

| Variant | Fit |
| ------- | --- |
| Declaration alone, then Roll and result | 0.895 |
| Declaration and Roll, then result | 0.898 |
| One paragraph, keeping "erupt from the ground" | 0.926 |
| One paragraph, without it | **0.930** |

The paragraph break is worth about 0.03 of type size and the four words are worth
0.004. That settles it against the usual two-paragraph shape: **the break was what
made the card unreadable, not the words in it**, and `docs/card-text.md` is explicit
that a break has to buy clarity worth most of a line. So the body is one paragraph,
declaration and Roll and result together, which is the shape PARASITIC SPORE already
has two rungs down in the same family. "from the ground" came off with it and is the
only thing that did, because the one-paragraph version still loads 595 with it and
the checker fails at 600.

### Nothing is wired, and BLIGHT POLLEN is why

**All four are offered on the tracker**: three print a count of turns and IMPALING
GROVE's rooted runs to a Turn End, so `effectDuration` has a clock for each. Death
offered five of its twelve.

**BLIGHT POLLEN moves two numbers and neither is wired**, and it is written up beside
sickness in `riders.js` rather than left silent:

- Its diseased is SICKNESS's problem a second time. Diseased is -1 to all three
  attributes, exactly `growth-elixir`'s shape, so the arithmetic is not what stops it.
  A rider is keyed on the card and not on the caster, and here the caster is the one
  who paid Health for the tithe, so a row taking a point off all three attributes has
  every reason to be sitting on the wrong sheet. A wrong number is worse than a
  missing one.
- "Cannot restore Health for 5 turns" is a different kind of gap: not a number to bend
  but a heal to refuse, and the sheet has no channel that refuses one. That is the
  wall DEATH WAIL's second sentence hit this morning.

### The shelf, the colour and the art

**This is the first spell drop that added no word to anything.** Flora has been on
the Primal shelf in `cardOrder.js` and had `--family-flora` in `index.css` since those
files existed, so `lint:order` still reports 4 schools and 15 families and the tag
colours were not touched. Four cards landed inside a family that was already fully
furnished, which is what a family's second rung should cost.

Four plates at 2400x1792, the same shape the Ethereal and Death drops arrived in: no
white border, no banner, the painting and nothing else. So `data/Flora/` joins both
`FAMILY_FOLDERS` and `PLATE_FOLDERS` in `scripts/pull-card-art.mjs` and the crop is
turned off for it. It is the fifth folder there claimed as a family rather than a
school, and the first that names a family the codex has held from the beginning.

Every filename matched the name its card prints, including "Blight pollen.jpg"
against BLIGHT POLLEN, since a name is flattened before it is compared. So the drop
adds nothing to `ALIASES`: 4 encoded, 0 fetched, 35 to 56 KB of WebP apiece.

### The proof

- **The renderer was asked directly, card by card.** `--ac-fit` read off the real
  `AbilityCard` node: **DEVOURING BLOSSOM, SEEDLING SPIRITS and BLIGHT POLLEN print
  at full size**, IMPALING GROVE at 0.930. Nothing is fine print, and 0.930 sits
  between SENSE LIFE's 0.902, which is the codex's floor, and RAIN OF FIRE's 0.945.
  The harness was proved first by re-reading three cards whose fit is already on the
  record and matching them.
- `npm run lint:cards`: 425 cards inside the 600 ceiling and spelled one way. Three
  of the four are over the 480 target and under it (IMPALING GROVE 579, DEVOURING
  BLOSSOM 539, SEEDLING SPIRITS 491), in a band the codex has 91 cards in.
- `npm run lint:halves`: all 70 priced off their own prose, up from 68. The two new
  ones are IMPALING GROVE's Overcast and BLIGHT POLLEN's Blood Tithe, and the tithe is
  the first the parser has priced off a level.
- `npm run lint:order`: 4 schools and 15 families shelved, 180 cards sorting up the
  ladder, unchanged in shape.
- `npm run lint:text`: clean across 136 files. `lint`, `lint:riders`, `lint:math` and
  `lint:weapons` clean and unchanged.
- `data/templates/primal-spells.csv` at 40 rows with Flora's four exported into it,
  their `Image` column carrying the filename each picture arrived under.

## The Wild Masters, 2026-08-26

Asked for in as many words: "I have added hte missing WIld spell in the data folder
and the missing image in the Wild folder. Make sure you only add the 4 missing wild
maste spell and not change anything lese make sure the newspell are in line with
wording and system rule and presentation".

Two sources, and unlike the Flora drop they are not in the same place.
`data/Spells - Primal - Wild.csv` sits at the top of `data/` with twelve rows in the
usual eight columns, and `data/Wild/` holds four pictures at 2400x1792. Only the four
Master rows were asked for, only the four Master rows have a picture, and the eight
above them carry a `postimg.cc` link the way the opening drop did. All three signals
agree on the scope.

| Tier | Spells |
| ---- | ------ |
| Novice | WILD STRIDER, SNAKE!, SHARPEN SENSES, PRIMAL ROAR *(already in the codex)* |
| Adept | WILD SWEEP, SAVAGE SLAM, PACK BOND, BIRD VIEW *(already in the codex)* |
| Master | STAMPED, QUARRY, CRITTER FORM, MOLT |

### The eight rows above them are the opening drop, unchanged

Wild's Novice four and Adept four came in on 2026-08-19 with the first sheet, and
this file holds all eight of them again with four new rows underneath. They were read
against what is printed and **not one of them has moved**. The sheet still carries
the pre-readability-pass wording those cards were rewritten out of earlier the same
day: "2d6 + 2 x Mind" where the card says `[[2d6 + 2*stat]]`, "in Decay damage" where
it says "{damage} damage", "an Advantage on all Skill Checks" where it says
"advantage on all skill checks", and PACK BOND's four paragraphs where the card has
three. Where the sheet and the card differ on wording alone the card is the later
artifact and it stands.

So this drop is four cards and not twelve, which is what the ask said. It is the
Flora drop's shape exactly, twelve hours later.

### The third Primal family to reach Master

Primal had no Master spell at all until this morning. Death's four were the school's
first, Flora's four the second set and these are the third, so the top rung goes from
eight to twelve and **three of the five Primal families have one**. Life and Blood
are still Novice and Adept only.

| | Novice | Adept | Master | Total |
| - | - | - | - | - |
| Primal before Death | 16 | 8 | 0 | 24 |
| after Death | 20 | 12 | 4 | 36 |
| after Flora | 20 | 12 | 8 | 40 |
| **after Wild** | **20** | **12** | **12** | **44** |

The Mycomancer draws Primal by tier, so its Rank 3 goes from 40 to 44 against a Rank
2 still standing at 32. The Arcanist, which names no school, goes from 48, 85 and 117
to 48, 85 and 121.

### The second sheet in the codex's own notation

The Flora sheet was the first to arrive already written in the codex's markers, and
this one is the second. It only needed them once: STAMPED's cell carries
`[[6d6 + 6*stat]]`, `{roll}` and `{damage}`, and the other three name no number at
all. Metres arrive with their feet beside them on every row. So the transcription is
a copy, and marker insertion plus emphasis was the whole of the work.

### The readings

- **The name STAMPED is the one thing here worth a second look, and it is Jules'
  call.** The cell says it, the picture file says `Stamped.jpg`, and the card's own
  first line says "a herd of beast spirits charges", which is a stampede. It is
  transcribed as the sheet spells it, because a card name is the designer's word and
  nothing but his own prose suggests the other one. Renaming it later is one edit in
  `spells.js` plus an `ALIASES` entry in `pull-card-art.mjs`, since the plate would
  no longer match.
- **STAMPED writes the damage token and names no type**, so it prints untyped. That
  is the call COMPRESSION BLAST, CORPSE STRIDE and IMPALING GROVE all took, and it is
  now **the fourth card in a row with the hole**, which is worth settling for all
  four at once. Force is the obvious answer here: it is what SAVAGE SLAM's beast
  deals two rungs down in this same family, and a herd running you over is the same
  kind of blow.
- **QUARRY empowers and elevates with no count for either**, so the card prints
  Empowered and Elevated bare. DREDGE CORPSE's Overcast is written the same way and
  reads the same, and the two are worth settling together.
- **QUARRY's sense has no clock of its own.** "You sense it at any distance and
  through total cover" hangs off the marked duration in the paragraph above it, which
  is the reading that makes the card one effect rather than two, and it is the Long
  Rest the tracker reads for the whole card.
- **CRITTER FORM's Multicast is GIANT GROWTH's shape to the word**: 3 Willpower for
  each additional entity you can touch, with no Action Point on top. It is the
  codex's only second half priced in Willpower alone, and `secondHalf` already reads
  "for each additional" as the repeat, so nothing in `overcast.js` had to change.
- The four names arrived in sentence case where the sheet's own eight rows above them
  are capitals. Nothing else needed a hand.

### Nothing is wired, and QUARRY is why

Two of the four are offered on the tracker: QUARRY's mark runs to a Long Rest and
CRITTER FORM's shape for an hour, so `effectDuration` has a clock for both. STAMPED's
prone carries its own end inside the keyword — a move action ends it — and MOLT
resolves the instant it is cast, so neither wants a row.

**QUARRY is the closest thing to a wired rider this family has and it is not wired
either.** Empowered and Elevated are numbers the sheet knows how to bend, but both
are printed without a count and both apply only to damage against one named entity,
which is a condition the tracker cannot see: a rider raises a number on a sheet,
never a number against a target. Written up beside sickness in the
considered-and-left-out list in `riders.js`.

### The shelf, the colour and the art

**The second spell drop in a row that added no word to anything.** Wild has been on
the Primal shelf in `cardOrder.js` and had `--family-wild` in `index.css` since those
files existed, so `lint:order` still reports 4 schools and 15 families and the tag
colours were not touched.

Four plates at 2400x1792, the same shape the Ethereal, Death and Flora drops arrived
in: no white border, no banner, the painting and nothing else. So `data/Wild/` joins
both `FAMILY_FOLDERS` and `PLATE_FOLDERS` in `scripts/pull-card-art.mjs` and the crop
is turned off for it. It is the sixth folder there claimed as a family rather than a
school, and the first whose sheet is *not* inside it — which nothing in that script
reads, so it cost nothing.

Every filename matched the name its card prints, so the drop adds nothing to
`ALIASES`: 4 encoded from a folder, 0 fetched, 35 to 52 KB of WebP apiece.

### The proof

- **The renderer was asked directly, card by card.** `--ac-fit` read off the real
  `AbilityCard` node: **STAMPED, QUARRY and MOLT print at full size**, CRITTER FORM
  at 0.949. Nothing is fine print, and 0.949 sits just above RAIN OF FIRE's 0.945.
- **The harness was proved wrong first, then fixed.** Rebuilt as `fit.html` plus
  `src/fit-harness.jsx` and deleted after, it read SENSE LIFE at 0.930 against the
  0.902 on the record — because the page did not load the three Google faces
  `index.html` does and was measuring the sans-serif fallback. With the faces linked
  *and nothing rendered until `document.fonts.ready`* (`useFitText` measures once in
  a layout effect, so a face that lands after the mount is a face the fit never saw),
  all three control cards came back exactly on the record: SENSE LIFE 0.902, RAIN OF
  FIRE 0.945, PESTILENT CLOUD 0.969. **Worth knowing for the next drop: without the
  fonts every number reads about 0.03 to 0.04 high, which is the difference between
  fine print and fine.**
- `npm run lint:cards`: 429 cards inside the 600 ceiling and spelled one way. One of
  the four is over the 480 target, CRITTER FORM at 573, in the band IMPALING GROVE
  (579) already sits in.
- `npm run lint:halves`: all 71 priced off their own prose, up from 70. The new one is
  CRITTER FORM's Multicast, read as 0 Action Points and 3 Willpower, repeatable.
- `npm run lint:order`: 4 schools and 15 families shelved, 184 cards sorting up the
  ladder, unchanged in shape.
- `npm run lint:text` clean across 136 files. `lint`, `lint:riders`, `lint:math` and
  `lint:weapons` clean and unchanged. `npm run build` clean.
- Every keyword the four cards name lights on the rendered card: prone, marked, Long
  Rest, total cover, Empowered, Elevated, constrained.
- `data/templates/primal-spells.csv` at 44 rows with Wild's four inserted after BIRD
  VIEW where the codex has them, their `Image` column carrying the filename each
  picture arrived under. Twelve inserted lines and no other byte touched.

## The Life Adepts and Masters, 2026-08-26

Asked for in as many words: "added life file and folder iwth image, Add the Master
and adept life spell just thoose spell. The image are i nth life folder. Make sur
they are inline with system wording and format. rename Agony to exposed nevers".

Two sources, in the shape the Wild drop set. `data/Spells - Primal - Life.csv` sits
at the top of `data/` with twelve rows in the usual eight columns, and `data/Life/`
holds eight pictures at 2400x1792. The Adept and Master rows were asked for, those
same eight rows are the ones with a picture, and the four above them carry a
`postimg.cc` link the way the opening drop did. All three signals agree on the scope.

| Tier | Spells |
| ---- | ------ |
| Novice | FORCE INEBRIATION, SENSE LIFE, RENEW, GIANT GROWTH *(already in the codex)* |
| Adept | HEAL, PURGE, EXPOSED NERVES, VIGOR |
| Master | HIBERNATION, RESURRECTION, LIFE LINK, SEVER LIFE |

This is the third drop of the day in that shape and **the first to bring a whole
Adept rung with it**. Flora and Wild each added four cards to a family that already
had eight; Life had four and now has twelve.

### The four rows above them are the opening drop, unchanged

Life's Novice four came in on 2026-08-19 with the first sheet, and this file holds
all four of them again with eight new rows underneath. They were read against what is
printed and **not one of them has moved**. The sheet still carries the
pre-readability-pass wording those cards were rewritten out of earlier the same day:
"1d6 + Mind" where RENEW says `[[1d6 + stat]]`, "the target becomes Poisoned" where
FORCE INEBRIATION says "poisoned", "While Sense Life is active" where the card says
"While this spell is active". Where the sheet and the card differ on wording alone the
card is the later artifact and it stands.

### The fourth Primal family to reach Master, and the last one left

Primal had no Master spell at all this morning. Death's four were the school's first,
Flora's four the second set, Wild's four the third, and these eight are the fourth
family and the largest single drop of the four.

| | Novice | Adept | Master | Total |
| - | - | - | - | - |
| Primal before Death | 16 | 8 | 0 | 24 |
| after Death | 20 | 12 | 4 | 36 |
| after Flora | 20 | 12 | 8 | 40 |
| after Wild | 20 | 12 | 12 | 44 |
| **after Life** | **20** | **16** | **16** | **52** |

**Four of the five Primal families now stand at a full twelve**, four cards a rung.
Blood is the only one left and it is still the four Novice cards it opened with:
BLEEDING TRAIL, BLOOD SPEAR, GORE ARMOR, VAMPIRIC TOUCH.

The Mycomancer draws Primal by tier, so its Rank 3 goes from 44 to 52 and **its Rank
2 moves for the first time since the school opened**, 32 to 36, because this is the
first drop of the day to touch a rung below the top. The Arcanist, which names no
school, goes from 48, 85 and 121 to 48, 89 and 129.

### The third sheet in the codex's notation, and the first that half commits

Flora's sheet was the first written in the codex's own markers and Wild's was the
second. This one is split down the middle: HEAL, VIGOR and SEVER LIFE carry `[[...]]`,
`{roll}` and `{damage}`, while EXPOSED NERVES and HIBERNATION are longhand from the
drops before them ("2d6 + 2 x Mind", "Make Mind roll"). HEAL's cell writes
`[[4d6 + 4*Mind]]` with the attribute inside the token, where every spell in the
codex takes its numbers off `*stat` so a Mycomancer's Instinct can print through the
same card. Metres arrive with their feet beside them on every row.

**Every difference between cell and card was listed and checked one at a time**, by
mapping the markers back to the longhand the sheet writes and diffing the two sides
word by word. SEVER LIFE and VIGOR came back word for word; the other six are the
list under "the readings" and nothing besides.

### The readings

- **AGONY is printed as EXPOSED NERVES**, which is the rename the ask carries. The
  plate on disk is still `Agony.jpg`, so this is the first entry in the `ALIASES`
  table in `pull-card-art.mjs` that records a rename rather than a misspelling, and
  it is the exact trade the STAMPED note predicted a day early: one line in the
  codex, one line in the script, and the file keeps its old name.
- **RESURRECTION is spelled out.** The cell says REssurection and the picture says
  Ressurection, which is two different misspellings of one English word rather than a
  name, and that is what separates it from STAMPED one family over: STAMPED is a word
  on its own and this is not. Aliased the same way, for the ordinary reason.
- **VIGOR arrived with no Action Point and no Willpower**, the only blank in the
  sheet, and it is read as **3 and 3**. Every repeatable half on this family prices
  its repeat one Willpower under the card's own cost (FORCE INEBRIATION 2 to 1, PURGE
  3 to 2, HEAL 4 to 3), and VIGOR's repeat is 2, so the card reads 3. The 3 Action
  Points are the only count the rung had not already used, between PURGE's 2 and
  HEAL's 4. **This one wants Jules' word**: it is the only number in the drop that is
  not on the sheet.
- **VIGOR's half is labelled OVERCAST and written as a MULTICAST**, word for word the
  sentence HEAL and PURGE carry two rows above it, resolution line included. It is
  printed as a Multicast, because the codex's own split is that an Overcast spends
  more to do more and a Multicast spends more to hit more, and buying another target
  is the second of those. **Also worth Jules' word**, since the label is his too.
- **LIFE LINK's leash converts wrong.** The cast range is "12 meters (40 feet)" and
  the leash three lines later is "12 meters (60 feet)". Twelve metres is forty feet,
  and a leash at the cast range is what makes the card one shape, so both are printed
  40. If the leash was meant to reach past the cast, the number wanted is 18 meters.
- **EXPOSED NERVES and SEVER LIFE both write the damage token and name no type**, so
  both print untyped. That is the **fifth and sixth card in a row** with the hole
  after COMPRESSION BLAST, CORPSE STRIDE, IMPALING GROVE and STAMPED, and the whole
  set is still one ruling waiting to be made.
- **RESURRECTION never says what a success does.** Its second paragraph gives a body
  dead under a minute back at 1 Health and its third rolls for anything older and
  names only the failure. Read as returning at 1 Health, which is the only rate the
  card states.
- **HIBERNATION's Upkeep is the first in the codex not paid at a Turn Start.** "At
  each Long Rest, pay 10 Willpower" is the right clock for a spell that runs a day.
  `secondHalf` prices it off the same words a Turn Start toll uses and needed no
  change, and the tracker takes the card's 24 hours off the body before it ever reads
  the toll.
- Spelling and grammar, without further comment: the eight names arrived in four
  different cases, HIBERNATION's roll sentence carried a comma splice and a repeated
  clause ("On a success it sleeps, While it sleeps, it is incapacitated"), PURGE
  ended on "entitiy", EXPOSED NERVES on a stray asterisk and SEVER LIFE on a stray
  `**`.

### EXPOSED NERVES is wired, and VIGOR is the one that got away

Six of the eight are offered on the tracker: EXPOSED NERVES for a turn, VIGOR for an
hour, HIBERNATION for a day, LIFE LINK for 5 turns and SEVER LIFE until a Long Rest.
HEAL and PURGE resolve the instant they are cast and want no row.

**EXPOSED NERVES is the first Life card that moves a number on the sheet**, and the
number is the one it prints: disadvantage, on the sheet of whoever holds the row.
That is UNLUCKY CLOVER's rider exactly, down to the trade it already documents (the
Attack Roll is the sheet's, the skill check is the table's), and the card carries its
own clock so the row expires without anybody dropping it. `lint:riders` walks it from
a stored row through to the printed attack and back off: 11 riders now, up from 10.

**VIGOR is the closest thing to a second rider and it cannot be one.** `healthMax` is
a field the table already holds and the card plainly names it, but it names it as
`[[3*stat]]` off the *caster's* Mind, and a rider is keyed on the card rather than on
the caster, so the one sheet holding the row is the one sheet that cannot work the
number out. Every entry in `EFFECT_RIDERS` today is a literal constant for exactly
that reason. SEVER LIFE is the same wall from the other side: its cut to maximum
Health is "the damage dealt", a number nobody knows until the dice land. Both are
written up in the considered-and-left-out list in `riders.js`.

### The shelf, the colour and the art

**The third spell drop in a row that added no word to anything.** Life has been on
the Primal shelf in `cardOrder.js` and had `--family-life` in `index.css` since those
files existed, so `lint:order` still reports 4 schools and 15 families and the tag
colours were not touched.

Eight plates at 2400x1792, the same shape the Ethereal, Death, Flora and Wild drops
arrived in: no white border, no banner, the painting and nothing else. So `data/Life/`
joins both `FAMILY_FOLDERS` and `PLATE_FOLDERS` in `scripts/pull-card-art.mjs` and
the crop is turned off for it. It is the seventh folder there claimed as a family
rather than a school, and the first whose drop is not a Master rung, which nothing in
that script counts.

### What was checked

- **The fits are the renderer's own**, off the throwaway harness rebuilt for the
  purpose and deleted after (`fit.html` plus `src/fit-harness.jsx`, cards rendered
  through the real `AbilityCard` behind `showsArt: () => false`, `--ac-fit` read off
  each `.ac-body`). Proved first against the three cards whose fit is on the record
  and all three came back exact: SENSE LIFE 0.902, RAIN OF FIRE 0.945, PESTILENT
  CLOUD 0.969. **Seven of the eight print at full size** and HIBERNATION prints at
  0.965, comfortably above the 0.9 floor.
- **The transcription was proved rather than claimed.** Markers mapped back to the
  sheet's longhand, both sides whitespace-normalised and diffed word by word: SEVER
  LIFE and VIGOR matched exactly, and every word that moved on the other six is in
  "the readings" above. Every AP, WP and tag matched except VIGOR's blank pair.
- `npm run lint:cards`: 437 cards inside the 600 ceiling and spelled one way. One of
  the eight is over the 480 target, HIBERNATION at 521, in a band the codex has 93
  cards in and well under NATURALIZE's 599.
- `npm run lint:halves`: all 75 priced off their own prose, up from 71. The four new
  ones are three Multicasts and HIBERNATION's Upkeep, which is priced at 10 Willpower
  off a Long Rest sentence rather than a Turn Start one.
- `npm run lint:riders`: all 11 reach the sheet and come back off, up from 10.
- `npm run lint:order`: 4 schools and 15 families shelved, 192 cards sorting up the
  ladder, unchanged in shape.
- `npm run lint:text` clean across 136 files. `lint`, `lint:math` and `lint:weapons`
  clean and unchanged. `npm run build` clean.
- Every marker resolves on the rendered card and every keyword the eight name lights:
  entity, see, touch, Health, Grit, Action Point, Willpower, disadvantage, Turn End,
  incapacitated, Long Rest, Upkeep. The two untyped cards render "you deal 4d6 damage"
  with no type word, which is what STAMPED and IMPALING GROVE already do.
- `data/templates/primal-spells.csv` at 52 rows with Life's eight exported into it
  after GIANT GROWTH where the codex has them, their `Image` column carrying the
  filename each picture arrived under, `Agony.jpg` and `Ressurection.jpg` included.

## The Earth family and the Fire redraws, 2026-08-26

Asked for in as many words: "In the fire folder there is all the final iamge to use
for the fire spells. Also I have added all the elemental earht spell in the data with
all image in the earth folder. including for shape arth. Remeberto correct the text,
make sure it follow the system wording and guide line."

Two folders and one sheet. `data/Fire/` holds nine pictures and asks for nothing else:
Fire's nine cards have been in the codex since the school arrived, and these are the
finished paintings for them. `data/Spells - Elemental - Earth.csv` sits at the top of
`data/` with eight rows in the usual eight columns, and `data/Earth/` holds nine
pictures for them, the ninth being a redraw of SHAPE EARTH.

| Tier | Spells |
| ---- | ------ |
| Novice | SHAPE EARTH *(already in the codex)*, STONE BARRAGE, STONEFLESH |
| Adept | TREMOR SENSE, EARTH GLIDE, SINKHOLE |
| Master | MOUNTAIN'S WEIGHT, EARTHQUAKE, AEGIS OF STONE |

### Earth was one card, and is now three a rung

Earth arrived with the Elemental school on 2026-08-20 as a single loose render at the
top of `data/Elemental/`, no family folder under it and no rung above Novice. Its own
note in `spells.js` said "the family exists the moment a second card does". Eight
arrived at once.

| | Novice | Adept | Master | Total |
| - | - | - | - | - |
| Elemental before | 12 | 9 | 8 | 29 |
| **after** | **14** | **12** | **11** | **37** |

**Earth is the fifth of the school's seven families to reach Master** and the third to
stand at a full nine, beside Fire and Water. Lightning and Magma reach Master on one
card a rung. Wind is the short family now at three Novice and one Adept, and Steam is
still an empty folder holding somebody else's HURL.

No talent set casts from Elemental yet, so no set's pool moves. The Arcanist, which
names no school, goes from 48, 89 and 129 to **50, 94 and 137**. An Imbuement binds "a
NOVICE spell" with no school named, so STONE BARRAGE and STONEFLESH can reach an item
from the day they exist.

### The sheet's own hand

Longhand, like every Elemental cell before it: "Make a Mind Ranged Attack roll", "2d6 +
Mind Blunt damage", "4d6 + 4 × Mind Shield". The markers were put back the way the
school's first pull put them back, and every number comes off `*stat` rather than off
Mind, so an Instinct caster prints through the same card. Metres arrive with their feet
beside them on five of the eight rows and with the brackets left empty on three.

### The readings

- **AEGIS OF STONE is spelled out.** The Name cell says "Aegis of Stron" and the
  picture says `Aegiis of stone.jpg`, which is two different misspellings of one
  English phrase rather than a name. The read RESURRECTION got one school over, and
  aliased in `pull-card-art.mjs` for the same reason.
- **STONEFLESH's resistance gloss went to the glossary.** The cell spells the word out
  inside its own sentence, "(reistance means halved damaged)", and a defined term is
  never glossed in prose as well. `keywords.js` carries **resistance** now, beside
  VULNERABLE: the two are one rule read from both ends, doubled against halved, and
  only one end of it was written down. Five card bodies have printed the word with
  nothing behind it since each of them arrived (UMBRAL FORM, DRACONIC SCALES,
  AMPHIBIAN, the Cauldron Keeper's hardened scale and now STONEFLESH) and all five
  light. It is the trade BURN made when this school first arrived.
- **STONEFLESH costs 8 Willpower, and no Novice spell in the codex costs more than 4.**
  It is level with the priciest Adept, double every other Novice, and it is what the
  sheet says. **Worth Jules's word.**
- **STONEFLESH names "physical damage"**, a category the codex does not define. The
  only other card that uses the word is the Soak background's "non-physical damage",
  unlit since it arrived. Left plain, and on the pile for the statuses tab this file
  has been asking for since August.
- **TREMOR SENSE and SINKHOLE are both labelled OVERCAST over an empty cell.** Neither
  prints a second half, because there is no half to print. **Worth Jules's word**:
  either the label is a leftover or two riders went missing on the way out of the
  sheet.
- **Three conversions arrived empty.** TREMOR SENSE reads "18 meter ()", EARTH GLIDE
  "20 meter (.)" and MOUNTAIN'S WEIGHT "9 meters ( feet)". Filled at the codex's own
  rates: 60 feet, 65 feet and 30 feet, the middle one being the conversion SINGULARITY
  settled a day earlier.
- **EARTHQUAKE doubles against "inaniamte entity"**, printed as inanimate ones. Nothing
  in the codex defines an inanimate entity, and SHAPE EARTH's wall two rungs up is the
  only thing in the school with Health of its own, so it is very likely the card that
  was meant to break. On the statuses tab's pile with Difficult Terrain and Slow Fall.
- **MOUNTAIN'S WEIGHT has no clock.** The boulder holds until 6 Action Points get the
  target out from under it, which is the card's only exit and is priced the way a
  grapple's is. Read as constrained until freed, and the tracker offers it no row.
- **STONE BARRAGE and EARTHQUAKE print Blunt**, the sheet's own word on both rows and
  the first typed damage this family has had.
- Spelling and grammar, without further comment: "YOu", "teh", "entites", "isnbile
  one", "silouhte", "imapre you vision", "your resitant", "bouldr", "boulder rock", a
  missing space after a comma in STONEFLESH, and a "He" that is every entity the spell
  can land on.

### Two cards were cut to fit, and the estimate did not catch either

`lint:cards` passed EARTHQUAKE at a load of 596, inside the 600 ceiling. The renderer
disagreed: **0.894**, under the codex's 0.9 floor and the first card that would have
gone out as fine print. EARTH GLIDE read **0.902**, exactly on it. Both were cut, and
what went was repetition rather than rules:

- EARTHQUAKE's "The area is Difficult Terrain" folded into the sentence that makes it,
  and "The damage is double on inaniamte entity" became "Inanimate ones take double".
  **0.949**, better than RAIN OF FIRE beside it.
- EARTH GLIDE's "You move through earth and stone" is a second telling of "pass through
  it like water" one line above, so the Movement Speed moved up into that sentence and
  the repetition went. **0.965**.

Every mechanic on both rows is still printed. This is the case docs/card-text.md
describes: cut words, never mechanics.

**The estimate has a blind spot worth knowing about.** RAIN OF FIRE at load 594 prints
at 0.945 and EARTHQUAKE at 596 printed at 0.894, two cards two characters apart and
half a rung of type apart, because the fitter breaks lines and the estimate counts
characters. The static number is a gate, not an answer.

### The redraws, and one folder that should be deleted

**This is the first drop that replaces art the codex already had.** Elemental arrived
in August as whole card renders in `data/Elemental/<family>/` — 1055x1496 with a white
border, cost orbs and the banner baked in — and `cardPlate` cropped the painting out of
the top 45% of each one. These nineteen files are those paintings, dropped as plates:
1200x896 and 2400x1792, no border and no banner.

So `data/Fire/` and `data/Earth/` join both `FAMILY_FOLDERS` and `PLATE_FOLDERS` in
`scripts/pull-card-art.mjs`, and the crop is off for both. They are the eighth and
ninth folders claimed as a family rather than a school and the first two under
Elemental. This is the retirement the school's own note predicted on 2026-08-20: "a
drop of art-only files would retire them, and nothing needs renaming when it comes."

**Ten files in `data/Elemental/` are now dead weight and the art run says so on every
pass.** Every picture in the two drops claims a card that a render in
`data/Elemental/` also claims, so the "one card, two files" rule settles it: the newest
file wins, by seven months, and the loser is named in the report. Ten lines a run:

    shape-earth   two files claim it — using Earth/Shape Earth, not NOVICE SPELL - ELEMENTAL - EARTH - SHAPE EARTH
    produce-flame two files claim it — using Fire/Produce Flame, not NOVICE SPELL - ELEMENTAL - FIRE - PRODUCE FLAME
    ... and eight more

**Deleting `data/Elemental/FIRE/` and the loose `NOVICE SPELL - ELEMENTAL - EARTH -
SHAPE EARTH.jpg` beside it makes the report go quiet.** Nothing is lost: those renders
are the paintings with a card drawn around them, and the paintings are now in `Fire/`
and `Earth/`. Left in place rather than deleted here, the way the stray HURL in
`Steam/` was left, because a picture in `data/` is the designer's.

Three filenames needed an ALIASES row, all three from the Earth drop, whose Image
column is empty: `Stone Flesh.jpg` for STONEFLESH, `Earth Quake.jpg` for EARTHQUAKE and
`Aegiis of stone.jpg` for AEGIS OF STONE. The other six land on their own,
`Mountain s Weight.jpg` included, because `flatten` turns the sheet's apostrophe into a
space and the file already has one there. All nine Fire files land on their own.

### The shelf and the colour did not move

Nothing to shelve or colour. Earth has been sixth on the Elemental shelf in
`cardOrder.js` and had `--family-earth` in `index.css` since those files existed, both
put there by the drop that brought SHAPE EARTH. `lint:order` still reports 4 schools
and 15 families.

### What was checked

- **The fits are the renderer's own**, off the throwaway harness rebuilt for the
  purpose and deleted after (`fit.html` plus `src/fit-harness.jsx`, cards rendered
  through the real `AbilityCard` behind `showsArt: () => false`, `--ac-fit` read off
  each `.ac-body`). Proved first against the three cards whose fit is on the record and
  all three came back exact: SENSE LIFE 0.902, RAIN OF FIRE 0.945, PESTILENT CLOUD
  0.969. **Seven of the nine print at full size**, EARTHQUAKE at 0.949 and EARTH GLIDE
  at 0.965.
- **Every marker resolves and nothing is unspent**, resolved the way `CardText.jsx`
  resolves it: `[[stat + level]]`, `[[5*stat]]`, `[[2d6 + stat]]`, `[[4d6 + 4*stat]]`
  and `[[2d6 + 2*stat]]` all give numbers, `{damage}` finds Blunt on the two cards that
  carry a type, and `{stat}` and `{roll}` find Mind. Twenty-one defined terms light
  across the family, resistance among them.
- `npm run lint:cards`: 445 cards inside the 600 ceiling and spelled one way, up from
  437. Three of the nine are over the 480 target: EARTHQUAKE 585, EARTH GLIDE 544 and
  STONE BARRAGE 515, in a band the codex holds 96 cards in.
- `npm run lint:halves`: all 79 priced off their own prose, up from 75. The four new
  ones are STONE BARRAGE's Multicast, EARTH GLIDE's and AEGIS OF STONE's Overcasts and
  EARTHQUAKE's Upkeep.
- **The tracker reads the durations off the prose**, unchanged: TREMOR SENSE 1 hour,
  AEGIS OF STONE 3 hours, EARTHQUAKE an Upkeep each turn. STONEFLESH is offered no row
  on purpose: its clock is the Shield pool, which is a condition and not a duration.
- `npm run lint:order`: 4 schools and 15 families shelved, 200 cards sorting up the
  ladder, up from 192. `lint:riders`: all 11 still reach the sheet and come back off.
- `npm run lint:text` clean across 136 files. `lint`, `lint:math` and `lint:weapons`
  clean and unchanged. `npm run build` clean.
- **The art was looked at rather than counted.** Eighteen plates re-encoded, 720px and
  a 200px thumbnail apiece, 21 to 67 KB. PRODUCE FLAME and EARTHQUAKE were opened: the
  whole painting, no white border and no banner, which is what a plate is and what the
  crop would have ruined.
- `data/templates/elemental-spells.csv` regenerated straight out of `spells.js` at 37
  rows, Earth's nine included, every named picture proved to exist on disk. It had been
  stale since 2026-08-20 and carried the pre-readability-pass wording for all 29 of the
  old rows; it now carries what the cards print. The Image column names the file each
  picture came out of, `Stone Flesh.jpg` and `Aegiis of stone.jpg` included.

### This is the Earth half of the compound-element proposal, written by hand

Earlier the same day Jules asked for every missing Elemental spell to be designed and
gave the shape: **Earth and Wind each at 3 Novice, 3 Adept and 3 Master, and Sand,
Steam, Mud and Storm at 1 of each**, because "they are compound elements like magma is
fire + earth, wind and water are storm". Twenty-five spells were proposed against that
and none were written, because he said not to change the files.

**These eight are Earth's share of that count, and they are his rather than the
proposal's.** They land on exactly the 3/3/3 he specified. So the proposal's Earth half
is retired, and what is left of it is **seventeen** spells: five to finish Wind and
three each for the four compound families, none of which exist yet. Those designs and
the nine rulings they raise are still only in the artifact and the `.mjs` handed over
in chat, not in this file.

### Still open

Four, all of them Jules's to settle: **STONEFLESH's 8 Willpower** on a Novice card;
**the two empty OVERCAST cells** on TREMOR SENSE and SINKHOLE; **what an inanimate
entity is**, which EARTHQUAKE doubles against and nothing defines; and whether
**"physical damage"** is Sharp and Blunt or something wider.

## A redraw needs a new URL, 2026-08-27

Reported the morning after the Fire drop: "in the spell preview I see the old image
so like in arcanist spellbook and blazing suns is wrong no matter what".

**Nothing was wrong with the drop.** The pictures were on disk, `cardArt.js` pointed
at them, the build carried them and the render path asked for the right file. It was
checked end to end: the brief that the Arcanist's spellbook draws asks for
`/cards/blazing-suns-thumb.webp`, and the dev server answered with the new 5,912
bytes rather than the old 7,154.

**The bug is that the URL did not change when the picture did.** A redraw keeps the
filename and swaps the pixels, which is the one shape of change no cache can see.
Every browser and every Cloudflare edge that had already fetched
`/cards/blazing-suns.webp` went on serving the painting it already had, and would
have kept doing it until something evicted it. Eighteen redrawn pictures shipped to
readers who could not see any of them.

### Eight characters on the end of every art URL

`pull-card-art.mjs` and `pull-item-art.mjs` now stamp each row with the first eight
characters of its file's SHA-256:

    'blazing-suns': '/cards/blazing-suns.webp?v=ff3242fd',

The old Blazing Suns art hashes to `77fa1925` and the new one to `ff3242fd`, so had
this been in place on 2026-08-26 the drop would have reached every reader the moment
it deployed.

- **Same bytes, same URL.** A run that changes no picture changes no line of
  `cardArt.js`, which was proved by running it twice and diffing. The lookup does not
  churn and neither does the diff.
- **A query string rather than a hashed filename.** The file on disk keeps the name a
  person would look for, and Cloudflare's default cache key already includes the
  query. A hashed filename would work as well and would leave the beaten file behind
  on every redraw, which is a second thing to clean up.
- **The thumbnail rides the full picture's hash.** The two are cut from one source in
  the same pass and are only ever written together, so they cannot disagree, and one
  token per card keeps the lookup one flat map of one string. `thumbFor` inserts
  `-thumb` before the query rather than at the end of the string.
- **Items got the same treatment**, since `itemArt.js` is generated the same way and
  has the same hole in it. Nothing has been redrawn there yet, which is the only
  reason it had not bitten.

### What is still uncovered

**A talent, lineage or background plate has no version on it.** Those are not
generated: `art: '/backgrounds/mercenary.jpg'` is written by hand in
`backgrounds.js`, and the same in `talents.js` and `lineages.js`. Redraw one of those
and the same thing happens again, with no generator to stamp it. The Mycomancer's
overview plate has already been redrawn once, on 2026-08-20, back when nobody was
looking at a cache.

Fixing it means either generating those three lookups the way the two art files are
generated, or hand-editing a hash into a data file on every redraw, which nobody will
remember to do. **Left alone until a plate is actually redrawn**, and written down
here so that day is not spent rediscovering this page.

### While you wait for a deploy

A reader already holding an old picture picks the new one up on their next load,
because the URL they are asking for no longer exists in their cache. Nothing has to
be purged and nobody has to hard-reload. That is the whole point of the eight
characters.

## The Storm family, 2026-08-27

Asked for in as many words: "In the data there is now the Storm spells and in data I
have the storm folder wiht hte images, add the spells. Add the m and make sure to
conrecct the text and make the wording up to the system. reduce the cost of eye fo teh
storm to 6"

One sheet and one folder. `data/Spells - Elemental - Storm.csv` sits at the top of
`data/` with three rows in the usual eight columns, and `data/Storm/` holds a picture
for each of them.

| Tier | Spell |
| ---- | ----- |
| Novice | DOWNPOUR |
| Adept | HAILSTORM |
| Master | EYE OF THE STORM |

### Storm is the school's eighth family, and the first compound to open

One card a rung is the compound shape. Storm is wind and water the way Magma is fire
and earth, and a compound family runs three deep where a base element runs nine.

| | Novice | Adept | Master | Total |
| - | - | - | - | - |
| Elemental before | 14 | 12 | 11 | 37 |
| **after** | **15** | **13** | **12** | **40** |

Plus DEEP SEA ACCRETION, which is Unique and item-bound, so the school holds 41 rows.

No talent set casts from Elemental yet, so no set's pool moves. The Arcanist, which
names no school, goes from 50, 94 and 137 to **51, 96 and 140**. An Imbuement binds "a
NOVICE spell" with no school named, so DOWNPOUR can reach an item from the day it
exists.

### The one thing that is not the sheet's

**EYE OF THE STORM costs 6 Willpower and the sheet says 10.** Asked for in the drop
itself, so the cast is the second number. The 4 Willpower Upkeep is untouched, and 6
sits inside the Master rung either way: the priciest cast in the codex is 12 and there
are four of them.

### The sheet's own hand

Longhand, like every Elemental cell before it: "Make a Mind Roll roll", "2d6 + 2 x
Mind Cold damage". The markers were put back the way the school's first pull put them
back, and every number comes off `*stat` rather than off Mind, so an Instinct caster
prints through the same card.

### The readings

- **DOWNPOUR's radius is twice its range.** A **36-meter** circle placed at
  **18 meters**, which makes it the largest area in the codex by three times over and
  puts the caster well inside their own weather. EARTHQUAKE's 18-meter radius at 30
  meters is the next biggest. It is what the cell says, so it is what prints. **Worth
  Jules's word**: 3.6 or 6 meters would both read as the number that was meant.
- **The conversion arrived empty**, "36-meter ()", filled at the codex's own rate as
  120 feet. Third Elemental sheet in a row to leave a bracket open.
- **HAILSTORM prints Cold, the school's first.** The damage table answers to Cold and
  Frost off one token and every real use in the codex writes Cold, so the sheet's own
  word needed nothing done to it.
- **Storm deals Cold and Blunt and no Lightning**, which is the sheet's own choice on
  both rows and the thing that keeps the Lightning family's edge.
- **EYE OF THE STORM carries a printed duration and an Upkeep at once.** HIBERNATION
  and SHADOW BIND already do, so the **10 turns (1 minute)** is the ceiling and the
  toll is what reaches it.
- **The Upkeep is spelled out.** The Secondary Effect cell reads "4 Willpower or ti
  stops", the toll and its consequence in shorthand, and it prints in the codex's own
  Upkeep shape: "At your Turn Start, pay 4 Willpower to keep the storm turning. Miss
  the Upkeep and the spell ends."
- **Difficult Terrain stays plain** on HAILSTORM, which is where SINKHOLE, MAGMA SURGE
  and EARTHQUAKE already leave it. Still on the statuses tab's pile.
- Spelling, without further comment: "Downpou" on the picture and "ti stops" in the
  Upkeep cell.

### Three plurals light now, and one card paid a step for it

DOWNPOUR prints "Ranged Attacks" and EYE OF THE STORM prints "Attack Rolls" and "Turn
Starts". All three singulars have been defined terms since `keywords.js` existed, and
a term is listed by its printed forms rather than guessed at by suffix, so all three
arrived half lit, with the colour stopping in the middle of a phrase. The three
plurals are in the table now, which is the trade STONEFLESH's **resistance** made a
day earlier.

It lights five other card bodies that have printed one of them since each arrived:
PACK BOND and TAUNTING carry "Attack Rolls", DEVOURING BLOSSOM and DRAIN FLUIDS carry
"Turn Starts", and FERAL FORM and LIGHTNING IN A BOTTLE carry one each.

**`.ac-kw` is bold, so lighting a phrase widens it and the fitter can feel it.** All
eight cards were measured against the real renderer before and after. Only PACK BOND
moved, 0.934 to 0.930, one step of the binary search, and nothing came near the 0.9
floor.

### EYE OF THE STORM was cut to fit, and the estimate did not catch it

`lint:cards` passed it at a load of 557 against a 600 ceiling. The renderer printed it
at **0.902**, level with SENSE LIFE for the worst card in the codex. This is the
EARTHQUAKE lesson again: **take the fit off the harness for any card over about 550,
never off the static number.**

What went was repetition, not mechanics.

- "calm within **3 meters (10 feet)** of you" already says "around you" a second time,
  so "of you" went.
- "at each of their Turn Starts you deal [[2d6 + 2*stat]] {damage} damage to them" is
  the long way round "take [[2d6 + 2*stat]] {damage} damage at each of their Turn
  Starts", which is the shape MAGMA CHAINS and PESTILENT CLOUD already print.

Nineteen characters of load, two rungs of type: **0.969** now. The other two print at
full size.

### The shelf, and a colour that did not exist

**Storm is the first new family word since Spacial.** It goes seventh on the Elemental
shelf in `cardOrder.js`, after Earth and in the order `spells.js` writes it, and
`lint:order` now counts 16 families where it counted 15.

`--family-storm` is **#7E9CB8**, a slate: taken between Wind's teal (h173) and Water's
blue (h205) on hue, then pulled down on saturation toward `--dmg-blunt` so it reads as
neither of them. A storm sky is the one grey thing in a school of embers, and Storm
deals Blunt and Cold. It is the eighth marked lean in `index.css` and the first taken
off two families rather than off a token.

Checked numerically rather than by eye, against every school and family token in
`index.css`: its nearest neighbour is Wind at a distance of 25, where the palette's
own tightest existing pairs sit at 10 to 17 (Elemental and Magma, Ethereal and
Spacial, Arcane and Energy). Nothing new is closer than what is already there.

### The art

Three 2400x1792 plates, one of them a pixel narrow at 2398, no white border and no
banner, so `data/Storm/` joins `FAMILY_FOLDERS` and `PLATE_FOLDERS` in
`pull-card-art.mjs` and the crop stays off. `Downpou.jpg` is a dropped letter and gets
an `ALIASES` entry. The other two land on their own names.

**This is the tenth family folder and the first that shadows nothing.** `data/Fire/`
and `data/Earth/` a day earlier each claimed cards a render in `data/Elemental/` also
claimed, which is what prints the ten "two files claim it" lines on every art run.
Storm had no card in the codex before this drop, so nothing in `data/Elemental/`
claims one of its three and the run says nothing about them.

### What was checked

- **A round trip.** Every marker mapped back to the sheet's written form and diffed
  against the cell, whitespace-normalised. HAILSTORM matches byte for byte. DOWNPOUR
  differs only by the filled conversion, EYE OF THE STORM only by the four departures
  named above, and all three tag triplets and all three AP values match.
- `lint:cards` 448 cards inside the ceiling, `lint:text` clean across 136 files,
  `lint:halves` all 80 priced off their own prose, `lint:order` 4 schools and 16
  families shelved and 203 cards sorting up the ladder, then `lint:math`,
  `lint:riders`, `lint:weapons`, `eslint` and `vite build`, all clean.
- **The printed order**, read off `sortCards` rather than off the shelf: Storm comes
  last in each of the three rungs, after Earth.
- **The fit**, off the real renderer with the fonts awaited, proved first against the
  three cards whose numbers are on the record. SENSE LIFE 0.902, RAIN OF FIRE 0.945
  and PESTILENT CLOUD 0.969 all read exactly as recorded, so the harness was telling
  the truth about the rest. DOWNPOUR 1.0, HAILSTORM 1.0, EYE OF THE STORM 0.969.
- **The art run twice**, second pass zero diff on `cardArt.js`, which is what the
  content hashes are for.
- `data/templates/elemental-spells.csv` carries the three new rows in the sheet's own
  column order, so the workbook can catch up.

### Still open

Four for Jules, three of them small:

1. **DOWNPOUR's 36-meter radius at 18-meter range.** Transcribed as printed. The
   likeliest reading is that a decimal point or a digit went missing.
2. Whether the Elemental shelf regroups as four bases then six compounds rather than
   the arrival order it has now. Storm is the second compound to land and the question
   is the one the Earth drop left open.
3. One base and three compounds are still short: Wind stops at Adept and wants five
   more, and Steam, Sand and Mud have nothing. Fourteen of the original twenty-five
   proposals are left.
4. **"Ranged Attacks", "Attack Rolls" and "Turn Starts" are three plurals somebody
   noticed.** There may be others in the codex reading half lit. Nobody has swept for
   them.

## The Mud family, 2026-08-27

Asked for in as many words: "In the data there is now the Mud spells and in data I have
the Mud folder wiht hte images, add the spells. Add the m and make sure to conrecct the
text and make the wording up to the system."

One sheet and one folder. `data/Spells - Elemental - Mud.csv` sits at the top of `data/`
with three rows in the usual eight columns, and `data/Mud/` holds a picture for each of
them, named after the card it belongs to.

| Tier | Spell |
| ---- | ----- |
| Novice | MIRE |
| Adept | ENGULF |
| Master | DROWNING EARTH |

### Mud is the school's ninth family, and its second compound

One card a rung is the compound shape. Mud is water and earth the way Storm is wind and
water, and a compound family runs three deep where a base element runs nine.

| | Novice | Adept | Master | Total |
| - | - | - | - | - |
| Elemental before | 15 | 13 | 12 | 40 |
| **after** | **16** | **14** | **13** | **43** |

Plus DEEP SEA ACCRETION, which is Unique and item-bound, so the school holds 44 rows.

No talent set casts from Elemental yet, so no set's pool moves. The Arcanist, which
names no school, goes from 51, 96 and 140 to **52, 98 and 143**. An Imbuement binds "a
NOVICE spell" with no school named, so MIRE can reach an item from the day it exists.

Nothing in this drop is anything but the sheet's, except the wording the request asked
for and the cut DROWNING EARTH needed to fit on a card. Both are below.

Against the compound law written up under the Earth family, this closes Mud and leaves
**eleven of the original twenty-five proposals**: five to finish Wind, and three each
for Sand and Steam. Wind still stops at Adept, and Sand and Steam are still empty.

| Family | Kind | Has | Wants |
| --- | --- | --- | --- |
| Fire, Water, Earth | base | 9, 10, 9 | done |
| Wind | base | 4 | 5 more |
| Lightning, Magma, Storm, **Mud** | compound | 3 each | done |
| Sand, Steam | compound | 0 | 3 each |

### What the family does

All three cards hold an entity down, and each one prices its own way out. MIRE trips
whoever walks into it, ENGULF seals one target and bills it every turn, DROWNING EARTH
sinks a whole area by degrees. None of them is a save-or-suffer with no exit: MIRE ends
the moment the prone entity stands, ENGULF sells a Physique contest for 3 Action Points
and DROWNING EARTH sells a stage back for 4.

### Open for Jules

1. **`buried` is not a defined term, and DROWNING EARTH is the card that wants one.**
   Its ladder is "rooted, then constrained, then buried". The first two are keywords
   that carry their own explanations; the third is a word the card glosses itself,
   "buried and taking [damage] at each Turn Start". That reads fine as printed, because
   the damage is stated on the line, so it is transcribed as prose rather than lit,
   which is how Difficult Terrain has sat in five card bodies since the school arrived.
   **But whether buried is a status with rules of its own is a design answer, not a
   wording one.** Does it stop actions the way constrained does? Does it suffocate? Does
   it end when the spell ends? Say the word and it becomes a keyword in `keywords.js`
   with its own colour and its own tap-to-read explanation, the way STONEFLESH's
   **resistance** did a day earlier. Inventing the definition here would have been
   inventing design.
2. **DROWNING EARTH's ladder has no stated floor and no stated release.** An entity
   that fails once is rooted and one that fails three times is buried. Nothing says
   what a fourth failure does, and nothing says the stages come off when the entity
   leaves the slurry or when the spell ends. The Upkeep is the only clock, which is
   EARTHQUAKE's shape, so the spell ending is what has been read as releasing them.
3. **ENGULF deals 1d6 + Mind at Adept**, where that rung's damage is otherwise
   2d6 + 2 × Mind. It is a toll every turn rather than a cast, and MAGMA CHAINS is the
   precedent: an Adept card that binds one entity and bills it Mind at each Turn Start.
   Engulf asks for more per turn than that. Transcribed as printed.
4. **DROWNING EARTH casts for 5 Action Points**, the only Master spell in the school
   that does; every other one casts at 4. MAGMA CHAINS spends 5 at Adept, so the number
   is unusual rather than unprecedented. Transcribed as printed.
5. **ENGULF's escape rolls against your Grit**, not your Mind. MAGMA CHAINS is the one
   other card where a target buys a contest with its own Action Points, and it rolls
   Physique against your Mind. Grit is a defence and the sentence works either way, so
   the sheet's own word stands.

### The wording, corrected

Three typos and one verb, and nothing else was touched:

| The cell said | The card says |
| --- | --- |
| "The netity" | "It" |
| "4 action poitns" | "4 Action Points" |
| "reduce teh effect" | "reduce the effect", then cut (below) |
| "can use 4 action poitns" | "can spend 4 Action Points" |

The verb is the only one that is a house rule rather than a spelling: the codex spends
Action Points and never uses them, which is MOUNTAIN'S WEIGHT's word and CONTAINMENT
SPHERE's. ENGULF's own clause already read "can spend".

The rest of the pass is the school's usual one. Every "Make a Mind Roll roll" becomes
`{stat} Roll {roll}` so the markers light and an Instinct caster reads the same card;
"3d6 + 3 × Mind Blunt damage" becomes `[[3d6 + 3*stat]] {damage} damage` off the same
rule; ranges, radii and durations take the bold that says how far, at whom and for how
long. `rooted`, `constrained`, `prone`, `Difficult Terrain`, `Turn Start`, `Reflex`,
`Grit` and `Action Points` were already the codex's own spellings and needed nothing.

### DROWNING EARTH had to be cut to fit, and the cut is worth reading

It arrived at a load of **696 against a 600 ceiling**, the worst overrun of any card
pulled so far. The reason is that it carries four mechanics and an Upkeep: an area, a
per-turn contest, a three-rung ladder with damage on the last rung, an escape priced in
Action Points, and a toll. The Upkeep alone eats 192 of the budget, 92 of prose and the
flat 100 that any second half costs, which left the body about 310 to work in.

What went was repetition and one paragraph break. No mechanic was dropped.

- **The clock is said once.** The paragraph opens "At the Turn Start of **any entity**
  in the area", so the buried rung's damage inherits it instead of printing "at each
  Turn Start" a second time, which is what the cell did.
- **The escape moved into the paragraph of the ladder it undoes**, worth 30 on its own.
  It also reads better there: "rise a stage" is the sheet's "reduce the effect by 1
  stage" in half the words and the exact inverse of the "sinks a stage" above it.
- **The range dropped "on a point"**, which is EARTHQUAKE's own shorter form for an
  area made of ground.
- The Upkeep holds "it" where "the ground" was.

696 to **593**. See docs/card-text.md: cut words, never mechanics.

That leaves it 3 short of EARTHQUAKE's 596, and EARTHQUAKE is the card that proved the
static estimate wrong by printing at 0.894 under a 0.9 floor. So the fit was taken off
the renderer rather than the number.

| Card | Load | Real fit |
| --- | --- | --- |
| MIRE | 321 | 1 (full size) |
| ENGULF | 399 | 1 (full size) |
| DROWNING EARTH | 593 | **0.961** |

0.961 is better than RAIN OF FIRE and level with EYE OF THE STORM. The estimate reads
this card high because it counts markers at their source length, and this one carries 36
characters of `{stat}`, `{roll}`, `[[3d6 + 3*stat]]` and `{damage}` that render to about
17. The harness was proved first against SENSE LIFE, RAIN OF FIRE, PESTILENT CLOUD,
EARTHQUAKE and EYE OF THE STORM and read all five to the recorded digit.

### The shelf, and a colour that could not be sited the way Storm's was

Mud goes eighth on the Elemental shelf in `cardOrder.js`, after Storm.

`--family-mud` is `#9C8E70`. **Storm's method does not transfer to it.** Storm took the
midpoint of the two families it is made of, because Wind and Water sit 32 degrees apart
on hue and a midpoint between them is a colour. **Water and Earth sit 174 degrees
apart, so their midpoint is green or purple.** So the lean is taken on the axis the
colour law already names: Mud is Earth's hue, and the whole separation is lightness and
saturation. Which is also what water does to earth, so the physical reading and the
law's reading agree for once.

Measured rather than eyeballed, in CIE76 against every school and family token in
`index.css`:

| Pair | Distance |
| --- | --- |
| Mud / Earth | 20.9 |
| Mud / Death | 27.7 |
| Mud / Storm | 36.2 |

The palette's own tightest pairs sit at 10.8 (Primal / Flora) to 17.9 (Storm /
Ethereal), so Mud against Earth is looser than nine pairs already on the wall, Storm's
own nearest included. Two candidate families were rejected on measurement rather than
taste: a grey-beige Mud separated from Earth better but landed 26 from Storm, which
already owns the one grey slot in a school of embers, and an olive Mud landed 25 from
Wild and read as moss.

One thing that fell out of siting it: **Lab lightness is the binding constraint on any
new family token, not hue.** A chip is 0.56rem on a dark panel, and every existing
token sits between L\* 56 (Blood) and 85 (Light). Every genuinely mud-coloured brown is
down at L\* 39 to 46, which is why Mud is a dulled tan rather than the brown the word
suggests.

### The art

Three 2400x1792 plates, no white border and no banner, so `data/Mud/` joins both
`FAMILY_FOLDERS` and `PLATE_FOLDERS` in `pull-card-art.mjs` and the crop stays off. All
three filenames are already the card names, so unlike the Storm drop nothing goes in
`ALIASES`. Nothing in `data/Elemental/` holds a Mud render, so like Storm these three
shadow nothing and the run says nothing about them.

### One thing found while measuring, which is not about Mud

The card budget in docs/card-text.md was calibrated against cards rendered **without a
character attached**, and that is what every recorded fit number in this file is. A card
in a player's hands has one, and a live value renders longer with it: `[[3d6 + 3*stat]]`
prints "3d6" with no character and "3d6 + 30" at Mind 10, and `{roll}` prints nothing
against "(+10)".

Swept the whole codex both ways at Mind 10, which is the worst case:

| | At full size | Under the 0.9 floor |
| --- | --- | --- |
| No character (how the budget was set) | 386 of 448 | 0, worst 0.902 |
| Character at 10 | 383 of 448 | **1: EARTHQUAKE at 0.894** |

So the cost is three cards' full size and exactly one card under the floor, and that
card is EARTHQUAKE, which this file already records as having been fixed to 0.949 on
2026-08-26. That 0.949 is a no-character number. **Nothing was changed about it here**,
because it is not this drop's card and the fix is a wording pass on somebody else's
paragraph. Flagged so the next person to touch EARTHQUAKE knows, and so the budget's
own calibration is on the record. The three Mud cards read identically under both, so
the drop does not depend on which way it is measured.


## The Pact of Ordenance, 2026-08-27

Handed over in chat rather than as a sheet: a set built around a bargain with the
entity living in a weapon. It filled the roster's `pactbound` slot (the id stays
`pactbound`, the name is the one given in chat), so the wall is 13 written and 21
placeholders. Every card is house-written to the chat spec and the whole tab is
exported back to `data/templates/pact-of-ordenance-ability.csv` and
`-overview.csv` with a `Source` column of `chat`, which is the overwrite list if a
real sheet ever arrives.

### What landed

- **The set**, 5 cards across three ranks, in `src/lib/talents.js` under a new
  `pact` spec — the ninth shape of what a set can hand over, resolved by the new
  `src/lib/pact.js` the way `minions.js` and `feral.js` resolve theirs.
- **A new jsonb column, `pact`**, keyed by the granting set id: which bargain,
  the weapon's form and forged-record id, lifetime progress, the picks, the
  standing missions and a capped log. `supabase/schema.sql` has the column and
  the backfill line; re-run it in the SQL editor to deploy.
- **The Pact block** on the Character tab (`PactBlock.jsx`, id `pact:<set>`),
  grown into `block_order` like a creature's: rank and chosen pact on top, the
  XP-style bar (tap it for the pact's own ledger), the claim button when a bar
  fills, the next-boon line, then the mission tracker — one built-in action
  (Tally souls / Offer tribute), at most two standing missions and a create
  button.
- **The sealing walk** (`PactPick.jsx`), opened on top of the Rank 1 take:
  Soulreaping or Collector's, the weapon's form off the plain weapon wall, then
  FIRST BOON's Novice spell and Novice Martial Move. Done stays disabled and
  names what is missing; an unsealed pact badges the Advancement tab through
  `levelQuestions`.
- **The pact-bound weapon** is a forged-record instance flagged `pact`, pinned to
  the Primary slot: the equip hook redirects anything aimed at that slot to the
  Secondary, unequip refuses, the Loadout block's Swap is offered dead with the
  reason, and the Inventory row wears a Pact-Bound chip and opens the item
  instead of the browser. Its workings weigh **nothing** on Magic Burden
  (`itemBurden` returns 0 for a pact item), which is the designer's own "does
  not take burden".
- **Reshaping** is a sixth long-rest action kind (`pact` in `restActions` /
  `restPlan`), one night, no Supplies, workings ride along.
- **The boon ladder**: four a rank in printed order (enchantment for the weapon,
  spell, Martial Move, skill), Novice / Adept / Master, each claimable once.
  Rank 3 opens the endless bargain once all twelve are claimed: each further bar
  costs half again the last, for any spell or any Martial Move.
- **The riders**: everything the pact grants (the weapon's attacks included) is
  cast with the best attribute (`cast: 'highest'`, the lineage cards' own
  HIGHEST), Empowered by 1 at Rank 2 and rolled with advantage at Rank 3 —
  `pactModifiers` on the granted cards, `pactWeaponRiders` folded into
  `attackModifiers` beside the Colossus and the hide.
- **The Abilities tab** grows a "Boons of the pact" block per pact (kind
  `pact`), riders on every row, with `PactTools` under it: adjust the bargain,
  the form and every claimed pick. Permanent at the table, correctable there,
  the pair every permanent choice keeps.
- A skill the pact granted is refused by the odd-level chooser ("Your pact
  already granted you this") and the pact's own skill wall refuses the ones a
  background or a level taught, so no skill is ever sold twice.

### The prices

The designer's numbers, on the spec: a Collector's Pact starts at 4,000 coins and
grows by 2,000 a bar; a Soulreaping Pact starts at 8 and grows by 4, a soul worth
the dead entity's level (two level 4 kills are 8). Progress is a lifetime total
like XP and bars are derived, so nothing is ever spent down or lost.

### The readings, open for Jules

The chat spec left more open than a sheet does. Each of these is one line to
change if the reading is wrong:

1. **The name is kept letter for letter: "Pact of Ordenance".** If Ordnance
   (weaponry) or Ordinance (a decree) was meant, it is one string in talents.js
   and two filenames in `data/templates/`.
2. **It filled the roster's Pactbound slot.** If it was meant as a new set
   beside Pactbound, the placeholder line goes back and the id changes.
3. **Claim order.** The spec says boons "come in a specific order" and also that
   the player is asked "which of the 4 he wants". Reading: the printed order is
   what the block announces as next; the claim menu offers every open rung and
   the player chooses. If the ladder is strict, the menu locks to the first open
   rung.
4. **Banked bars.** Progress keeps accruing past the current rank's rungs (a
   Rank 1 pact that fills five bars claims the fifth the moment Rank 2 opens),
   because the bar is lifetime like XP. If overflow should be lost, the walk in
   `pactBars` caps instead.
5. **The endless price compounds**: bar 13 is bar 12's cost times 1.5 rounded
   up, and so on. If "increased by 50%" meant 50% of the flat step, the factor
   line in `pactThreshold` changes.
6. **The endless boon reaches every tier** (Novice, Adept and Master; Legendary
   and Unique stay out of reach, as everywhere).
7. **The weapon's own attacks count as pact abilities**: best attribute, the
   Rank 2 Empower and the Rank 3 advantage all land on them. FIRST BOON prints
   it, so the card is the place to correct it.
8. **"Weapon enchant" reads as every enchantment that is not Body or Curse.**
   An Imbuement binds its spell at the moment the boon is claimed. The spell an
   Imbuement carries is dealt as gear (printed attribute, no pact riders): the
   enchantment is the boon, the spell rides the item.
9. **"Any existing weapon" reads as the plain weapon wall** (Common,
   unenchanted, not Claws & Teeth). The five named enchanted blades are
   particular items, not forms.
10. **A skill boon is gated by level** the way the odd-level skill is, off "a
    skill that he could learn".
11. **Handing the set back** (a level lost) removes the block, the boons and
    the guards. The forged weapon record stays equipped as an ordinary item
    until removed by hand — what the entity does about a broken bargain is the
    table's, not the sheet's.
12. **An item tribute feeds the pact its codex price** and the item is
    destroyed. A custom item has no price the sheet knows and goes through a
    mission instead.

### The art

Nothing painted yet. The set plate goes in `data/Pact of Ordenance/` and the five
card plates are keyed `what-it-hungers-for`, `pact-bound-weapon`, `first-boon`,
`deepened-bargain` and `endless-bargain`; run `npm run art:cards` when they land.
