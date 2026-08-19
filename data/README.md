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

`templates/` holds the current state of both, exported back out in the sheet's
own column order. `primal-spells.csv` holds the 24 Primal spells and nothing
else: the codex also carries one Arcane spell, Containment Sphere, which no
sheet covers yet. Diff a fresh download against those to see exactly what
changed before asking for a pull.

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
| `Image` | no | Card art. See the note below, the links in there do not work yet. |

## Three things the sheets do not carry

None of these block a pull. They are the difference between a pull that is
mechanical and one that needs judgement, which is worth knowing before the
codex gets big.

**1. There is no `id` column, and that is the risky one.**

An `id` is what a saved character points at. A Mycomancer's prepared spells are
stored as `picks: ['bramble-whip', …]`, and `{{Bramble Whip}}` links resolve
through the same key. With no column for it, an id has to be guessed from the
name, and a renamed spell then reads as a brand new one and silently drops off
every character who had picked it.

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

## The Image column

Every row has one and none of them can be used yet. They are postimg *page*
links, `https://postimg.cc/tYJMvMY1`, which serve an HTML page rather than an
image. A card needs the direct link, the kind `BARKSKIN` already has:

```
https://i.postimg.cc/NF2kKvZm/BARKSKIN.png
```

On postimg that is the "Direct link" option rather than the page URL. Once the
column holds those, the art wires into the card's own `art_url` field with no
other change.

## How card text is written

`Main Effect` and `Secondary Effect` are written the way the printed cards
read. The markers are plain text and survive a spreadsheet cell untouched, so
type them literally. The sheet can also just write prose, and the marker is
added on the way in, which is what happened with this first pull.

| Marker | What it prints |
| ------ | -------------- |
| `**bold**` | Bold, exactly as on the printed cards. |
| `{stat}` | **The card's own attribute.** This is the modular one. See below. |
| `{mind}` `{physique}` `{instinct}` | A named attribute, when the card means that one for every caster. |
| `{damage}` | The card's own damage type. |
| `{damage:Necrotic}` | A specific type, when the card names one outright. |
| `{roll}` | What this character adds to that roll, printed as `(+4)`. |
| `{roll:mind}` | The same, for a named attribute. |
| `[[1d6 + 2*stat]]` | A live value, printed as `1d6 + 12` and clickable for the breakdown. |
| `[[speed]]` | This character's Movement Speed, for the cards that say how far you go. |
| `{{Investigate}}` | A link to another card, opened on top of this one. |

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

### Do not gloss a defined term

Terms like **Grit**, **Shield**, **advantage**, **Empowered** and **Long Rest**
carry their own explanation, shown when the reader points at them. Write "the
target becomes **poisoned**", never "poisoned (takes damage each turn)".

The matcher lights a term wherever it appears, which cuts both ways. `Gore
Armor` printing its own name lit *Armor* as the damage-reduction stat, and
"something critical" lit *critical* as the natural-20 rule. Both were reworded.
If a card needs a term the glossary lacks, it gets added to
`src/lib/keywords.js` rather than explained on the card.

## Still wanted

**A statuses tab.** The new spells name `poisoned`, `rooted`, `asleep`,
`incapacitated` and `unconscious`, and the basic actions name `grappled` and
`prone`. None of them are in the glossary, so they print as plain bold with
nothing behind them. They were left that way rather than given invented
definitions. A `General Rules · Statuses` tab with a name and a sentence each is
all it takes to light every one of them.
