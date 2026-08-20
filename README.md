# Hazebound — Character Vault

A D&D-Beyond-style web app for **Hazebound**, a Victorian high-fantasy TTRPG: accounts, a
character dashboard, a live character sheet, and printable-style **ability cards**.

Built with React 19 + Vite + React Router, with Supabase for auth and storage.

---

## 1. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor** and run the contents of [`supabase/schema.sql`](supabase/schema.sql).
   It creates `profiles`, `characters`, `abilities` and `inventory_items`, turns on row-level
   security so each account only ever sees its own data, and adds a trigger that creates a
   profile row on signup. The script is safe to re-run.
3. Go to **Project Settings → API** and copy the *Project URL* and the *anon public* key.

## 2. Configure the app

```bash
cp .env.example .env.local
```

Then fill in:

```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

`.env.local` is git-ignored. The anon key is safe in the browser — RLS is what protects the data.

> Without these values the app still runs, but shows a banner and blocks the vault pages.

## 3. Run it

```bash
npm install
npm run dev
```

Open http://localhost:5173.

---

## What's in here

| Route | What it is |
| --- | --- |
| `/` | Landing page with a live ability-card showcase |
| `/register`, `/login` | Signup with email confirmation, login, password recovery |
| `/codex` | Colour-token registry: damage types, attributes, resources, card anatomy |
| `/dashboard` | Your characters — dossier cards, create, delete |
| `/characters/:id` | The character sheet — **public**, editable only by owner or admin |
| `/account` | Display name and password |

### Who can do what

| | View a sheet | Edit / delete it |
| --- | --- | --- |
| Anyone (even signed out) | ✅ | ❌ |
| The owner | ✅ | ✅ |
| An admin | ✅ | ✅ |

Character sheets, their ability cards and their inventory are readable by anyone with the link.
Writes are restricted to the owner or an admin, and that's enforced by RLS in the database —
the read-only UI is just courtesy. A viewer who forged a request would still be rejected by
Postgres.

Make someone an admin from the Supabase SQL Editor:

```sql
update public.profiles set role = 'admin'
where id = (select id from auth.users where email = 'you@example.com');
```

There is deliberately no way to grant admin from inside the app.

Your **dashboard** still lists only your own characters — public read doesn't mean discoverable,
it means shareable by link.

### Live viewing

Anyone *viewing* a sheet sees changes appear within about a second, no reload — stats, resources,
ability cards and inventory all stream in. A pulsing **Live View** badge marks it.

Editors deliberately do **not** receive remote updates: applying a remote row while someone is
part-way through typing is exactly how you overwrite an unfinished sentence. The owner's screen
stays authoritative over itself. That also means the same character open in two of your own tabs
won't cross-update — reload the second tab.

If the websocket drops (laptop sleeps, wifi flaps), messages sent during the gap are lost, so the
client refetches on reconnect rather than sitting on stale data.

### The character sheet

Five tabs, all auto-saving (edits batch for ~0.7s, then write; the top bar shows save state):

- **Character** — identity, XP, wealth, the three attributes, combat stats, Health/Shield orbs,
  clickable AP and Reaction pips, a Willpower bar, Karma, talents with rank pips, condition
  flags, and session notes.
- **Abilities** — your deck of cards. Create, edit, duplicate and delete, with a live preview
  beside the form. Search and filter by card type. An empty deck offers a sample deck
  transcribed from the printed cards.
- **Inventory** — five blocks: armor down the body, the two weapons in hand, the trinkets you
  wear, the five belt loops, and the inventory itself across the whole row. Every slot opens the
  codex; every row of the inventory asks where the thing goes. A Magic Burden meter counts all
  the worked magic on you against Level + Mind + 10. **Make an Enchanted Item** on the codex
  browser's head builds a piece out of one base and any number of workings, names it, gives it a
  picture, and hands it over as a pasteable code.
- **Lore** — portrait, concept line, appearance, personality, backstory, allies.
- **Advancement** — what your character *chose*, level by level. One block per level, level 1
  first and a new one below it each time you level: level 1 asks for a talent set, a lineage, a
  background and your attribute spread (+2 and +1 on two of the three, all starting at 4), every
  even level buys a talent rank, and every odd level after the first gives an attribute point and
  a skill learned from the whole codex.

A global **Metric / Imperial** switch converts movement, and the choice is remembered locally.

The Character tab is six fixed blocks, and their order is yours to set: grab the dotted strip at
the top of a block and drag it to another slot, or focus that strip and use the arrow keys. The
arrangement is saved on the character (`characters.block_order`), so it follows the sheet to any
device and anyone viewing the sheet sees the same layout.

### Martial Moves

A **Martial Move** is a third kind of card, beside a spell and a talent card: a trained manoeuvre
you buy *before* an attack, which then rides the next weapon attack you make.

Two sets teach them — a Guardian's Shield Expertise and a Duelist's Dexterous — and each hands
over a hand to choose out of the pool in `src/lib/martial.js`, the same way a Mycomancer chooses
spells. How many you know grows with your rank, and Rank 2 opens the Adept moves while Rank 3
opens Master.

Paying for one lays it on the **Temporary Effects** tracker, where it sits until you swing. While
it is there, every place the sheet prints that attack says what it is carrying — *"This attack
will Wing Clip and Reckless"* — and the card prints the advantage as a green arrow with the number
of d4 in it. Making the attack spends the move, hit or miss. One move rides a swing; a Master
Duelist's Sharp allows two, and a chip with nowhere to ride says so rather than taking your
Willpower.

### Ability cards

`src/components/AbilityCard.jsx` reproduces the printed layout: art plate, gold-fist **AP** and
violet-flame **Willpower** badges, a green or red **advantage arrow** when the holder has any, a
grey chevron type banner, a heavy condensed title, and black-on-white rules text with an optional
secondary section (e.g. *Blood Tithe*).

Card text is authored in a mini-markdown: wrap keywords in `**double asterisks**` to bold them,
and leave a blank line between paragraphs.

### Rules maths

`src/lib/characterModel.js` holds the derived-stat formulas in one place:

```
health_max     = 8 + Physique × 2 + level
willpower_max  = 3 + Mind
avoid          = 8 + Instinct
initiative     = Instinct + ⌊Mind ÷ 2⌋
xp threshold   = 1000 × level
```

These are **suggestions** — every number stays hand-editable on the sheet, because talents and
gear bend all of them. Adjust the formulas there when the rules firm up and the whole app
follows.

## Commands

```bash
npm run dev      # dev server
npm run build    # production build to dist/
npm run preview  # serve the production build
npm run lint     # eslint
```
