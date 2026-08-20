# Hazebound text style

House rules for every word a player can read: buttons, labels, tooltips, hints,
card text, codex entries, page copy, the README. Code comments are out of scope.

Two rules are absolute. The rest is how to obey them without flattening the voice.

---

## 1. No em dashes. No en dashes.

`—` and `–` never appear in user-facing text. They are not replaced with a
different dash, they are removed by restructuring the line.

Which replacement depends on what the dash was doing. There are only four cases.

### The dash joined two full clauses, so use a full stop

The second clause becomes its own sentence. This is the most common case and the
default when nothing else fits.

| Instead of | Write |
| --- | --- |
| `A consumable — using it destroys it.` | `A consumable. Using it destroys it.` |
| `Not used up — it stays on your belt.` | `Not used up. It stays on your belt.` |
| `Overburdened by 2 — shed some worn magic.` | `Overburdened by 2. Shed some worn magic.` |
| `Discarding is permanent — the piece leaves the sheet.` | `Discarding is permanent. The piece leaves the sheet.` |

### The dash introduced an explanation or a list, so use a colon

Use a colon when what follows answers what came before, or names the thing the
first part was pointing at.

| Instead of | Write |
| --- | --- |
| `your ancestry — the blood you come from` | `your ancestry: the blood you come from` |
| `Level 3 — Learn a Skill` | `Level 3: Learn a Skill` |
| `Use — Fireball` | `Use: Fireball` |
| `Not done — dodge is beyond you.` | `Not done: dodge is beyond you.` |

A colon is also right for action-and-object titles, where the first word is a
verb and the rest is what it acts on: `Replace: Main Hand`, `Edit: Something You
Carry`.

### The dash separated two peer parts of one label, so use a middot

`·` (U+00B7, `&middot;`) joins coordinates that name a single thing. Neither
half explains the other, they sit side by side. This is already the app's glyph:
`LVL 4 · CAP`, `join(' · ')`.

| Instead of | Write |
| --- | --- |
| `Mycomancer — Rank 2` | `Mycomancer · Rank 2` |
| `Fireball — in hand` | `Fireball · in hand` |
| `Ashen Blade — details and lore` | `Ashen Blade · details and lore` |
| `Empty — tap to browse` | `Empty · tap to browse` |
| `Hazebound — Character Vault` | `Hazebound · Character Vault` |

Prefer the middot in short fragments that are not sentences: tooltips, badges,
empty-slot hints, provenance lines, `source:` strings, `aria-label` pairs. It
keeps them compact where a full stop would read as two stranded sentences.

### The dash was a parenthetical aside, so use commas or brackets

A pair of dashes around an aside becomes a pair of commas. When the aside has
commas of its own, commas cannot hold it, so use round brackets instead. If it
is long enough that neither works, cut it into its own sentence.

| Instead of | Write |
| --- | --- |
| `more friends than is respectable — none of whom will admit it` | `more friends than is respectable, none of whom will admit it` |
| `the land around the camp — snares, water, roots — and gain 15 Supplies` | `the land around the camp (snares, water, roots) and gain 15 Supplies` |
| `A regiment, a levy — you carried a weapon for wages.` | `A regiment, a levy. You carried a weapon for wages.` |

### Terminal punctuation

A fragment keeps whatever it had: if a tooltip ended without a full stop, it
still does. But a line that a dash-split turns into two sentences is prose now,
and takes a closing full stop. `Take off Ashen Blade — it goes to your
inventory` becomes `Take off Ashen Blade. It goes to your inventory.`

### The one dash that stays

A bare `—` alone in a numeric slot, standing for "no value yet", is a table
glyph and not punctuation. It stays: the turn counter before the first turn, the
XP step column at level 1. Nothing else survives.

A dash-wrapped placeholder is not that case. Strip the wrappers:
`— not chosen —` becomes `not chosen`, `— your scale colour —` becomes
`your scale colour`.

---

## 2. No Oxford comma.

No comma before the `and` or `or` that closes a list of three or more.

| Instead of | Write |
| --- | --- |
| `a plant, a beast, and the weather` | `a plant, a beast and the weather` |
| `to track, calm, or handle an animal` | `to track, calm or handle an animal` |
| `light bones, keen eyes, and quick reactions` | `light bones, keen eyes and quick reactions` |

### What is not an Oxford comma

Four commas sit in front of an `and` or an `or` and are all correct. The checker
knows all four, so a finding it reports is a real one.

**1. It joins two independent clauses.** Cover everything before the comma. If
what remains has its own subject and verb and could stand as a sentence, the
comma stays.

- Keep: `You sit with the dying, and you have never been turned away.`
- Keep: `At Rank 2 you learn Adept Moves, and at Rank 3 you gain Master.`
- Cut: `files, pliers, and the one tool you made yourself`

**2. It closes an appositive or an aside.** The phrase between the two commas
renames or qualifies what came before it rather than being the next item.

- Keep: `a distance up to your Movement Speed, [[speed]] meters, and a height`
  (`[[speed]] meters` restates the Speed, it is not a third thing you jump)
- Keep: `Hide your ally in your shadow, where nothing can touch it, and call it back out.`

**3. Every item carries its own conjunction.** `A, or B, or C` is a deliberate
rhythm, not a list with one stray comma. Leave all of it alone.

- Keep: `born to a house with land, or money, or at minimum a very old grievance`

**4. The item before it already contains an `and` or an `or`.** Dropping the
comma there fuses two levels of list into nonsense.

- Keep: `to identify a creature, plant, venom or disease, or predict how it behaves`
- Keep: `Defense, Initiative and Speed, and the damage of anything quick`

Only the **last** conjunction in a sentence can carry an Oxford comma. Fixing
one can expose an earlier one that was hiding behind it, so re-run the checker
until it stops finding them.

## 3. Applying this to new text

When a design sheet, a card export or a block of copy arrives:

1. **Never reword.** These rules touch punctuation only. Jules's nouns, verbs,
   numbers, names and clause order are the design. Restructuring a dash into a
   full stop is allowed. Trading his word for a better one is not. See the
   `transcribe-dont-invent` rule.
2. **Splitting a sentence is a punctuation edit.** Turning one dash into a full
   stop plus a capital letter is fine, and it is the preferred fix. Adding a
   connective word that was not there is not.
3. **Terminal punctuation follows the original.** If a tooltip had no final full
   stop, it still has none afterwards.
4. **Then check yourself.** `npm run lint:text` fails on any em dash, en dash or
   serial comma in user-facing text, and prints file and line. It reads strings,
   JSX text and Markdown, and ignores comments.
5. **A genuine exception gets marked, not tolerated.** If a line is right as it
   stands and the checker disagrees, end it with `// text-style-ok: <reason>`.
   That silences the line and leaves the reason on the record. Sixteen lines in
   `src/lib` carry one. Reach for it only after the four exceptions above have
   failed to explain the finding.

## 4. Conventions worth keeping

Observed in the code and left alone, recorded so they stay consistent:

- Attribute, resource and keyword names are capitalised mid-sentence: Action
  Points, Willpower, Magic Burden, Supplies, Shield, Health.
- Slot and block names are capitalised: Main Hand, Belt, Inventory tab.
- Empty states name the slot, then say what to do: `Empty · tap to arm yourself`.
- Provenance reads `<thing> · <where it came from>`: `Fireball · in hand`,
  `Tonic · mixed in your Cauldron`.
- The reader is `you`. The app is never `we`.
