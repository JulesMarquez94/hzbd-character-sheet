# Hazebound · Character Vault

A D&D-Beyond-style web app for **Hazebound**, a Victorian high-fantasy TTRPG: accounts, a
character dashboard, a live character sheet and printable-style **ability cards**.

Built with React 19 + Vite + React Router, with Supabase for auth and storage.

---

## 1. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor** and run the contents of [`supabase/schema.sql`](supabase/schema.sql).
   It creates `profiles`, `characters`, `abilities` and `inventory_items`, turns on row-level
   security so each account only ever sees its own data and adds a trigger that creates a
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

`.env.local` is git-ignored. The anon key is safe in the browser. RLS is what protects the data.

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
| `/dashboard` | Your characters · dossier cards, create, delete |
| `/characters/:id` | The character sheet · **public**, editable only by owner or admin |
| `/account` | Display name and password |

### Who can do what

| | View a sheet | Edit / delete it |
| --- | --- | --- |
| Anyone (even signed out) | ✅ | ❌ |
| The owner | ✅ | ✅ |
| An admin | ✅ | ✅ |

Character sheets, their ability cards and their inventory are readable by anyone with the link.
Writes are restricted to the owner or an admin, and that's enforced by RLS in the database.
The read-only UI is just courtesy. A viewer who forged a request would still be rejected by
Postgres.

Make someone an admin from the Supabase SQL Editor:

```sql
update public.profiles set role = 'admin'
where id = (select id from auth.users where email = 'you@example.com');
```

There is deliberately no way to grant admin from inside the app.

Your **dashboard** still lists only your own characters. Public read doesn't mean discoverable,
it means shareable by link.

### Live viewing

Anyone *viewing* a sheet sees changes appear within about a second, no reload: stats, resources,
ability cards and inventory all stream in. A pulsing **Live View** badge marks it.

Editors deliberately do **not** receive remote updates: applying a remote row while someone is
part-way through typing is exactly how you overwrite an unfinished sentence. The owner's screen
stays authoritative over itself. That also means the same character open in two of your own tabs
won't cross-update. Reload the second tab.

If the websocket drops (laptop sleeps, wifi flaps), messages sent during the gap are lost, so the
client refetches on reconnect rather than sitting on stale data.

### The character sheet

Five tabs, all auto-saving (edits batch for ~0.7s, then write; the top bar shows save state):

- **Character**: identity, XP, wealth, the three attributes, combat stats, Health/Shield orbs,
  clickable AP and Reaction pips, a Willpower bar, Karma, talents with rank pips, condition
  flags and session notes.
- **Abilities**: your deck of cards. Create, edit, duplicate and delete, with a live preview
  beside the form. Search and filter by card type. An empty deck offers a sample deck
  transcribed from the printed cards.
- **Inventory**: a bag across the top, then five blocks. Armor down the body, the two weapons in
  hand, the trinkets you wear, the five belt loops and the inventory itself across the whole row.
  Every slot opens the codex; every row of the inventory asks where the thing goes. Two meters
  count what you are carrying. Magic Burden counts the worked magic on you against Level + Mind +
  10 and refuses anything past it. Weight counts everything you own, pack included, against ten
  kilos a point of Physique plus whatever your bag adds, and refuses nothing: past your capacity
  your Movement Speed is halved, and 30% past it you cannot move at all. **Make an Enchanted
  Item** on the codex browser's head builds a piece out of one base and any number of workings,
  names it, gives it a picture and hands it over as a pasteable code.
- **Lore**: portrait, concept line, appearance, personality, backstory, allies.
- **Advancement**: what your character *chose*, level by level. One block per level, level 1
  first and a new one below it each time you level: level 1 asks for a talent set, a lineage, a
  background and your attribute spread (+2 and +1 on two of the three, all starting at 4), every
  even level buys a talent rank, and every odd level after the first gives an attribute point and
  a skill learned from the whole codex.

A global **Metric / Imperial** switch converts movement and weight, and the choice is remembered
locally.

The Character tab is six fixed blocks, and both their order and the grid they sit on are yours to
set. **Arrange blocks** opens a small drawing of the tab: choose a canvas of 1 to 9 columns, then
drag a block onto another to trade their places, or tap one and tap where it should go. The arrow
keys move whichever block has focus. That count is a ceiling rather than a promise, since a block
is a hard 360x640 everywhere: the tab takes as many columns as the window is wide enough for, so
nine is nine on a wall and one on a phone. Both halves are saved on the character
(`characters.block_order` and `characters.block_columns`), so they follow the sheet to any device
and anyone viewing the sheet sees the same layout. The Abilities and Inventory tabs open the same
dialog from their own button, each with a count of its own.

### Martial Moves

A **Martial Move** is a third kind of card, beside a spell and a talent card: a trained manoeuvre
you buy *before* an attack, which then rides the next weapon attack you make.

Four sets teach them: a Guardian's Shield Expertise, a Duelist's Dexterous, a Colossus's Martial
Training and a Feral Cursed's Beast Within, and each hands over a hand to choose out of the pool in
`src/lib/martial.js`, the same way a Mycomancer chooses spells. How many you know grows with your
rank, and Rank 2 opens the Adept moves while Rank 3 opens Master.

What the weapon in your hand is worth is read off the same set. A Duelist has advantage and a point
of Defense with a one-handed weapon; a Colossus has advantage with a Colossal Weapon, a die size on
every two-handed swing from Rank 2, and another die *per move riding it* from Rank 3.

Paying for one lays it on the **Temporary Effects** tracker, where it sits until you swing. While
it is there, every place the sheet prints that attack says what it is carrying: *"This attack
will Wing Clip and Reckless"*, and the card prints the advantage as a green arrow with the number
of d4 in it. Making the attack spends the move, hit or miss. One move rides a swing; a Master
Duelist's Sharp, a Master Colossus's Perfect Technique and a Master Feral Cursed's Bestial Frenzy
each allow two, and a chip with nowhere to ride says so rather than taking your Willpower.

### The Temporary Effects tracker

The bottom of the Character tab holds what is **running on you**: a name, how many of your turns it
has left, and something to read. A row counted in turns ticks down when you start one, and a
condition goes on as "until it ends" because being grappled does not run out, it is broken.

**A row can move your numbers.** A card whose printed text names something the sheet already holds
bends it for as long as the row is up, and takes it back off when the row comes off. Giant Growth
doubles your Movement Speed and Empowers your damage, Barkskin raises your Defense by 1, Kindle
Weapon makes the blade deal Fire. The tile changes, the tooltip under it credits the card by name,
and the row itself says what it is doing. Nothing is written to your sheet: it is the same bend an
Ephemeral Enchantment makes, applied where the sheet is read. See `src/lib/riders.js` for the
table and what each entry was read from.

**What is running on you is often not yours.** So the picker searches two shelves: what your own
sources, hands and belt hand you, and the whole codex. When the druid across the table casts Giant
Growth on you, nothing is spent on your sheet and no source of yours has heard of the spell, so you
search the codex, take the card and your Speed doubles. A card taken off either shelf lands the
same way and carries the same rider, because a rider is keyed on the card and never on who paid for
it. Search your own cards for something you do not have and the footer says how many the codex
holds and offers to look there.

The turn count is filled in from whatever the card's own text says, which is a suggestion and never
a rule: the dial is right there and the table decides.

### The Feral Form

A **Feral Curse** does not hand you a card or a creature, it hands you a second shape of your own.
Entering it costs half the Health you have left and buys twice as much Shield, and the Shield is the
clock: the form lasts until it empties or until a short rest. Inside it you swing with advantage,
your Claws & Teeth land a bigger die, and your belt, your spells and every ability that is not the
curse's own are out of reach until it ends.

That gets a block of its own on the Character tab, movable like the six: the beast you chose and
what you call it, the Feral Rage difficulty with the two presses that move it, the hide with the
sentence about what emptying it does, and one button in and one button out. Nothing on it ticks:
being in the form is *having Shield left*, so an attack that eats the last of it ends the form on
the next render, and the Armor a Feral Hide was granting comes off in the same frame.

### Ability cards

`src/components/AbilityCard.jsx` reproduces the printed layout: art plate, gold-fist **AP** and
violet-flame **Willpower** badges, a green or red **advantage arrow** when the holder has any, a
grey chevron type banner, a heavy condensed title and black-on-white rules text with an optional
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

These are **suggestions**. Every number stays hand-editable on the sheet, because talents and
gear bend all of them. Adjust the formulas there when the rules firm up and the whole app
follows.

## Commands

```bash
npm run dev      # dev server
npm run build    # production build to dist/
npm run preview  # serve the production build
npm run lint     # eslint
```

Four checkers prove things eslint cannot:

```bash
npm run lint:text    # no em dashes and no Oxford commas in anything a player reads
npm run lint:math    # every stat tooltip adds up to the number above it
npm run lint:halves  # every card's optional half is priced off its own prose
npm run lint:riders  # every tracker rider reaches the sheet and comes back off
```
