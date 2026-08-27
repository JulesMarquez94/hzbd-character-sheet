/**
 * Pull the card art named by the design sheets, optimise it, and rewrite the
 * lookup the codex reads.
 *
 *     npm run art
 *
 * ---------------------------------------------------------------- why it exists
 * The sheets point at postimg, and pointing the site straight at postimg was
 * costing readers 26.2 MB across 34 pictures — several of them 3 MB PNGs at
 * 1280x956 — served at 200 to 450 KB/s by a host that occasionally stalls for
 * over two minutes on a single file. The card plate is 360x270 CSS pixels, so
 * none of that size was ever reaching a reader's eye.
 *
 * This downloads each one once, resizes it to what the plate can actually show
 * at 2x, writes WebP into public/cards/, and points the codex at the local
 * copy. Cloudflare then serves them from the edge, cached, beside the rest of
 * the site.
 *
 * ------------------------------------------------------------------ the flow
 *   1. place any picture that arrived as a folder — see "the two sources"
 *   2. read the Image column out of the CSVs in data/, for everything left
 *   3. a postimg *page* link serves HTML, so follow it to the og:image
 *   4. download, resize, encode
 *   5. rewrite src/lib/cardArt.js
 *
 * Re-runnable and idempotent: a picture already on disk is skipped unless
 * --force is passed, so adding one new spell costs one download rather than
 * thirty-four. A picture that came from a folder is also re-cut when the file
 * in `data/` is newer than what was made from it, so redrawing one costs one
 * encode and no flag.
 *
 * ------------------------------------------------------------------- the cost
 * Committing the WebP files is deliberate. They are the product's art, they are
 * ~47 KB each, and having them in the repo is what lets Cloudflare serve them:
 * a build cannot reach out to postimg. The originals stay on postimg, and this
 * script is how they get here.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA = path.join(ROOT, 'data');
const OUT = path.join(ROOT, 'public', 'cards');
/* A talent set's overview picture is not a card plate. It sits behind
   `talent.art` at 640x640, square, and the sets' own sheets carry its link in the
   same Image column, so it is placed here rather than by hand. */
const TALENT_OUT = path.join(ROOT, 'public', 'talents');
const TALENT_SIZE = 640;
const TALENT_QUALITY = 82;
/* An ancestry plate is the same thing for a lineage: 640 square behind
   `lineage.art`, drawn on the chooser wall and at the head of its page. Its own
   folder rather than talents/, because a lineage is not a set and an id could
   collide with one. */
const LINEAGE_OUT = path.join(ROOT, 'public', 'lineages');
/* And the same again for a background: 640 square behind `background.art`, drawn
   on the trade wall and at the head of its page. */
const BACKGROUND_OUT = path.join(ROOT, 'public', 'backgrounds');

/* The plate on a dealt card is 360x270 CSS pixels and `background-size: cover`.
   720 is that at 2x, which is as much as any screen can show of it. Quality 78
   is where the card art stops getting visibly better and the file keeps
   growing.

   A brief's plate is 92px wide, and 58px in a list. Sending it the same 720px
   picture is 47 KB to draw 92 pixels, and a wall of two dozen briefs is the
   commonest thing on the sheet — so every card also gets a thumbnail, cut from
   the full one rather than downloaded twice. */
const WIDTH = 720;
const THUMB_WIDTH = 200;
const QUALITY = 78;

const FORCE = process.argv.includes('--force');

/* ---------------------------------------------------------- the two sources

   Card art arrives two ways, and the only difference is where the bytes start.
   The sheets carry postimg links in an Image column, which is what everything
   below "postimg" is for. A *set* can also arrive as a folder: the Mycomancer's
   seven pictures landed as `data/Mycomancer/` on 2026-08-20, 2400x1792 apiece,
   against an Image column left empty. Then the folder is the original and
   nothing is downloaded at all.

   The folder pass runs first, and a card it placed is not asked for a link
   afterwards — a picture in the drop is the picture, and the sheet has nothing
   to add about a card whose art is already sitting in `data/`.

   Only folders named for a talent set are claimed, the same way
   pull-item-art.mjs claims only folders named for an inventory shelf.
   `data/Armor/` is that script's and stays that script's, and a folder that is
   neither is left alone rather than reported as art nobody can place. */

const IMAGE_FILE = /\.(?:jpe?g|png|webp)$/i;

/**
 * Names are compared with punctuation and case flattened, because
 * "Mycomancer overivew.jpg" and "Sporatic Infusion.jpg" both have to survive
 * being read by a machine that is not allowed to correct the designer.
 */
const flatten = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

/** A filename with its extension dropped, flattened. */
const bare = (file) => flatten(file.replace(IMAGE_FILE, ''));

/**
 * Pictures whose filename is not the name the sheet prints, keyed by the codex
 * name and valued by the file on disk, so the sheet stays the authority on what
 * a card is called.
 *
 * One so far. `Sporatic Infusion.jpg` was drawn while the card was still spelled
 * that way; the 2026-08-20 Ability tab prints SPORADIC INFUSION and the picture
 * did not get renamed with it. This table is a record of that mismatch, not a
 * naming scheme — putting the filename in the sheet's own Image column retires
 * the entry, because a file the sheet names is read from there first.
 */
const ALIASES = {
  'Sporadic Infusion': 'Sporatic Infusion.jpg',
  /* 2026-08-20, from data/Draconic Bond/. The sheet prints EMPOWERED BOND. */
  'Empowered Bond': 'Empowred Bond.png',
  /* Two files claim this one: `Dragon's Favor.png` matches the printed name on
     its own, and `Dragon Favor.jpg` is the redraw that landed nineteen minutes
     later. Both resolve, and the newest wins — see "one card, two files" below.
     Deleting the older file from the folder retires this entry. */
  'Dragon’s Favor': 'Dragon Favor.jpg',

  /* Five from data/Berserker/, 2026-08-23. Four are spellings the sheet does not
     use — GOING BERSERK, UNSTOPPABLE and AVATAR OF CARNAGE are each a letter or
     two out, and `Berserker Rage.jpg` is missing the apostrophe the card prints.
     That last one is the entry that has to be here rather than left to be
     noticed: without it the file matches no card, and the plate branch below
     claims any leftover file whose name starts with the set's, so BERSERKER'S
     RAGE would quietly overwrite the Berserker's overview plate.

     `Master of Rage.jpg` is the fifth and is a different thing: not a misspelling
     but another name for the card. The sheet prints MASTER OF PAIN on the Ability
     tab and in the V4 sheet's own rank list, so the sheet is what the codex
     follows. Worth asking about, since the picture is the newer artifact. */
  'Going Berserk': 'Going Bersek.jpg',
  'Berserker’s Rage': 'Berserker Rage.jpg',
  'Master of Pain': 'Master of Rage.jpg',
  Unstoppable: 'Instappable.jpg',
  'Avatar of Carnage': 'Avatarr of Carnage.jpg',

  /* Two from data/Colossus/, 2026-08-23, and both are plain misspellings:
     `Matrtial Training.jpg` has a letter too many, and `Paracticed Move.jpg` has
     one too many and a plural too few. The set's other five files match the names
     the Ability tab prints, punctuation and case aside, which is all `flatten`
     asks of them. */
  'Martial Training': 'Matrtial Training.jpg',
  'Practiced Moves': 'Paracticed Move.jpg',

  /* Three from data/Ethereal/, 2026-08-25, and the drop's Image column is empty
     so there is nowhere else for them to be named. `Celestail Edict.jpg` is two
     letters out of the sheet's CELESTIAL EDICT; the other two are a word short
     of the name the sheet prints, LIGHTSTRIDER GATEWAY and THEON PERFECT
     REPLICANTS. The school's other ten match, punctuation and case aside, which
     is all `flatten` asks of them.

     None of the three can quietly land on something else the way BERSERKER'S
     RAGE could: Ethereal is not a talent set, so the plate branch has no set to
     claim a leftover file for. Unaliased they would simply be reported. */
  'Celestial Edict': 'Celestail Edict.jpg',
  'Lightstrider Gateway': 'Lightstrider Gate.jpg',
  'Theon Perfect Replicants': 'Theon Perfect replicant.jpg',

  /* One from data/Shadow/, 2026-08-25, and that drop's Image column is empty as
     well. `Hauting shadows.jpg` is an n short of HAUNTING SHADOWS.

     The other eleven land without help, including the two that looked like they
     would not. `Jules Absolute Edict.jpg` matches JULES' ABSOLUTE EDICT because
     `flatten` drops the apostrophe, and `Cognitive Distortion.jpg` matches
     because the card is COGNITIVE DISTORTION: the sheet prints "Cognite" and the
     codex reads it as the word the picture was named for. See "one name" in the
     Shadow section of spells.js. */
  'Haunting Shadows': 'Hauting shadows.jpg',

  /* One from data/Time/, 2026-08-25, and a third drop with an empty Image column.
     `Temporall Collapse.jpg` has an l too many for the sheet's TEMPORAL COLLAPSE,
     and the sheet is what the codex prints. See "one name" in the Time section of
     spells.js.

     The other eleven land without help, `TIme Skip.jpg` included: `flatten`
     lowercases before it compares, so the capital I costs nothing. */
  'Temporal Collapse': 'Temporall Collapse.jpg',

  /* Two from data/Life/, 2026-08-26, and they are the two different reasons a
     file ends up here rather than one reason twice.

     `Agony.jpg` is not a misspelling of anything. AGONY is what the sheet and the
     plate both call the card and EXPOSED NERVES is what Jules renamed it to on the
     day of the drop, so this is the first entry in the table that records a rename
     rather than a typo. It is also the trade the STAMPED note in spells.js was
     written to describe, taken for the first time: one line in the codex, one line
     here, and the picture keeps its old name on disk.

     `Ressurection.jpg` is the ordinary kind. The sheet's cell spells it REssurection
     and the file spells it Ressurection, which is two different misspellings of one
     English word, and the codex prints RESURRECTION. See "the readings" in the Life
     section of spells.js.

     The other six land without help. */
  'Exposed Nerves': 'Agony.jpg',
  Resurrection: 'Ressurection.jpg',

  /* Three from data/Earth/, 2026-08-26, and a fourth drop with an empty Image
     column. All three are one word joined or split the way the sheet does not
     join or split it: the sheet prints STONEFLESH and the file is `Stone
     Flesh.jpg`, the sheet prints EARTHQUAKE and the file is `Earth Quake.jpg`.

     `Aegiis of stone.jpg` is the odd one and is the RESURRECTION case again: the
     Name cell says "Aegis of Stron" and the picture says "Aegiis", which is two
     different misspellings of one English phrase rather than a name, so the codex
     prints AEGIS OF STONE and neither side of the drop matches it.

     The other six land without help, `Mountain s Weight.jpg` included: `flatten`
     turns the sheet's apostrophe into a space and the file already has one there.

     Nothing in this drop can quietly land on something else the way BERSERKER'S
     RAGE could. Earth is not a talent set, so the plate branch has no set to claim
     a leftover file for, and unaliased these three would simply be reported. */
  Stoneflesh: 'Stone Flesh.jpg',
  Earthquake: 'Earth Quake.jpg',
  'Aegis of Stone': 'Aegiis of stone.jpg',

  /* One from data/Storm/, 2026-08-27, and the plainest kind of entry in this
     table. The picture is `Downpou.jpg` and the sheet prints DOWNPOUR: a dropped
     letter on the file with nothing wrong with the row. The other two land
     without help, `Eye of the Storm.jpg` included. */
  Downpour: 'Downpou.jpg',
};

/**
 * A *set's* overview plate whose filename is not the set's name, keyed by talent
 * id. The same record ALIASES is, for the other plate this script writes.
 *
 * One so far. `Draonic Bon Overview.png` is Draconic Bond's, and the folder rule
 * below claims a plate by the set's own name, which two dropped letters defeat.
 */
const PLATE_ALIASES = {
  'draconic-bond': 'Draonic Bon Overview.png',
  /* And `Colossal Overview.jpg` in data/Colossus/, which is the set's plate under
     the adjective rather than under the set's name. Two letters apart is enough:
     the folder rule claims a plate by the set's own name, and "colossal" does not
     start with "colossus". */
  colossus: 'Colossal Overview.jpg',
};

/* ----------------------------------------------------------------- the sheets */

function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i += 1; } else quoted = false;
      } else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field.replace(/\r$/, '')); rows.push(row); row = []; field = ''; }
    else field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((v) => v.trim()));
}

/**
 * Every sheet drop in data/, as objects keyed by their header row.
 *
 * One level of subfolder deep as well as the top: a set that arrives as a
 * folder brings its own tab in with it, and `data/Mycomancer/Talent Set -
 * Mycomancer - Ability.csv` is as much a drop as the ones sitting loose.
 *
 * `data/templates/` is the exception, and the only one. Those CSVs are the
 * importer's *contract* — what a sheet should look like on the way in, tracked
 * in git for exactly that reason — not game data that arrived. Reading them
 * would have `templates/armor.csv` asking the card codex for 27 pieces of
 * armor it has never heard of.
 */
const NOT_A_DROP = new Set(['templates']);

/**
 * Which tab a row came from, and whether that tab carries a link anywhere.
 *
 * A Symbol so it can never be mistaken for a column: a header row is the
 * designer's to name, and any string key here would be a name they are not
 * allowed to use.
 *
 * A tab with no links at all has no art yet, which is a different thing from a
 * row that lost the link it had. See the link pass, which warns about the second
 * and stays quiet about the first.
 */
const TAB = Symbol('tab');

function sheets() {
  if (!existsSync(DATA)) return [];

  const read = (file) => {
    const rows = parseCSV(readFileSync(file, 'utf8'));
    const head = rows[0].map((h) => h.trim());
    const out = rows
      .slice(1)
      .map((r) => Object.fromEntries(head.map((h, i) => [h, (r[i] ?? '').trim()])));

    const linked = out.some((row) => /^https?:\/\//i.test(row.Image ?? ''));
    for (const row of out) row[TAB] = { name: path.basename(file), linked };
    return out;
  };

  const csv = (dir) => readdirSync(dir).filter((f) => f.toLowerCase().endsWith('.csv'));

  return readdirSync(DATA, { withFileTypes: true }).flatMap((entry) => {
    const here = path.join(DATA, entry.name);
    if (entry.isDirectory()) {
      if (NOT_A_DROP.has(entry.name.toLowerCase())) return [];
      return csv(here).flatMap((f) => read(path.join(here, f)));
    }
    return entry.name.toLowerCase().endsWith('.csv') ? read(here) : [];
  });
}

/* ------------------------------------------------------------------ the codex */

/** Printed name -> card id, so the sheet never has to carry ids it does not have. */
async function cardIds() {
  const load = (file) =>
    import(path.join(ROOT, file).replace(/\\/g, '/').replace(/^/, 'file:///'));

  const { SPELLS } = await load('src/lib/spells.js');
  const { BASIC_ACTIONS } = await load('src/lib/actions.js');
  /* A weapon's two moves, an enchantment and a belt item's one card could not carry
     a picture at all until the one-off drop on 2026-08-20 brought some, and the
     three modules were wrapped in `withArt` the same day. Reached here so that a
     file dropped for one of them is placed rather than silently lost — before this
     the only registries loaded were the four below, and "Prepared.png" would have
     been reported as a name the codex has never heard of. */
  const { WEAPON_ABILITIES, ACTION_CARDS } = await load('src/lib/weapons.js');
  const { ENCHANTMENTS } = await load('src/lib/enchantments.js');
  const { UTILITY_CARDS } = await load('src/lib/utility.js');
  /* A talent set's own sheet carries Image links too, and a Cauldron Keeper's
     Ingredients are cards like any other. TALENTS is reached for its cards rather
     than the sets themselves: a set's overview picture is a different plate that
     lives in public/talents/ and this script does not own it. */
  const { INGREDIENTS } = await load('src/lib/ingredients.js');
  const { TALENT_CARDS } = await load('src/lib/talents.js');

  /* Not the whole of `CARDS`, and the two that are missing are missing for two
     different reasons now.

     A background skill is the old one: backgrounds.js hands the same object out
     twice, once flattened into BACKGROUND_CARDS and once on the background, and
     `withArt` spreads, so dressing the flattened copy would give the picture to the
     codex and not to the sheet. Until it is wrapped the way talents.js wraps its
     sets, a file named for one is better reported than half-placed.

     A lineage card is wrapped as of 2026-08-21 and is placed — just not from here.
     It resolves against `lineageNames` instead, because two cards are printed DRAGON
     BREATH: the Draconic Bond's, which the ally breathes, and the Draconic
     lineage’s, which you do. Both have a picture, and both files are called
     `Dragon Breath`. One flat name map cannot hold both, so each folder answers to
     its own. */
  return new Map(
    [
      ...SPELLS,
      ...BASIC_ACTIONS,
      ...INGREDIENTS,
      ...TALENT_CARDS,
      ...WEAPON_ABILITIES,
      ...ACTION_CARDS,
      ...ENCHANTMENTS,
      ...UTILITY_CARDS,
    ].map((c) => [c.name.toLowerCase(), c.id])
  );
}

/**
 * Every printed item name, so the shared folder can tell whose file is whose.
 *
 * Only `data/OF/` needs it. A set folder holds cards and a plate and nothing
 * else, so a name it cannot place there is a real problem and is still reported as
 * one.
 */
async function itemNames() {
  const { ITEMS } = await import(
    path.join(ROOT, 'src/lib/items.js').replace(/\\/g, '/').replace(/^/, 'file:///')
  );
  return new Set(ITEMS.map((item) => flatten(item.name)));
}

/**
 * The lineage folder resolves against lineages and nothing else, and that is the
 * point of two maps of its own.
 *
 * DRAGON BREATH is printed twice in the codex: the Draconic Bond’s Adept ability,
 * which the ally breathes, and the Draconic lineage’s, which you do. They are two
 * cards with one name, so a name looked up against the *whole* codex would place
 * `data/Lineage/Lineage Cards/Dragon Breath.jpg` on whichever of the two the map
 * happened to keep. Scoped to the folder, there is no question: a file in there is
 * a lineage card, and a file in `data/Draconic Bond/` is the set’s.
 */
async function lineageNames() {
  const { LINEAGES, LINEAGE_CARDS } = await import(
    path.join(ROOT, 'src/lib/lineages.js').replace(/\\/g, '/').replace(/^/, 'file:///')
  );
  return {
    plates: new Map(LINEAGES.map((l) => [flatten(l.name), l.id])),
    cards: new Map(LINEAGE_CARDS.map((c) => [flatten(c.name), c.id])),
  };
}

/**
 * The spells alone, for the same reason the lineage folder and the background
 * family have their own maps: a school folder holds spells and nothing else, so
 * a name in one is looked up against the spell codex rather than against all
 * 355 cards.
 *
 * `cardIds` is one flat printed-name map and the last registry spread into it
 * wins, which is the failure the DRAGON BREATH note above describes. BARRIER is
 * the case that made it real: the Ethereal spell and a Novice enchantment both
 * print that name, ENCHANTMENTS is spread after SPELLS, and `Barrier.jpg` from
 * `data/Ethereal/` duly landed on the enchantment — a picture of a warded dwarf
 * on a card about maximum Health, and the spell left with no art at all.
 *
 * Consulted after the sheet's own Image column and before the codex-wide map, so
 * nothing that already resolved resolves differently: a school drop that names
 * its files in the sheet is still placed by the sheet.
 */
async function spellNames() {
  const { SPELLS } = await import(
    path.join(ROOT, 'src/lib/spells.js').replace(/\\/g, '/').replace(/^/, 'file:///')
  );
  return new Map(SPELLS.map((spell) => [flatten(spell.name), spell.id]));
}

/**
 * The background family's two maps, for the same reason the lineage folder has
 * its own: a name is looked up against backgrounds and skills alone, and never
 * against the whole codex. `Cunning` is a skill and there is a Trickster ability
 * a name like that could land on tomorrow; scoped here there is no question.
 */
async function backgroundNames() {
  const { BACKGROUNDS, SKILLS } = await import(
    path.join(ROOT, 'src/lib/backgrounds.js').replace(/\\/g, '/').replace(/^/, 'file:///')
  );
  return {
    plates: new Map(BACKGROUNDS.map((b) => [flatten(b.name), b.id])),
    cards: new Map(SKILLS.map((s) => [flatten(s.name), s.id])),
  };
}

/** Printed set name -> talent id, for the Overview row of a Talent Set sheet. */
async function talentIds() {
  const { TALENTS } = await import(
    path.join(ROOT, 'src/lib/talents.js').replace(/\\/g, '/').replace(/^/, 'file:///')
  );
  return new Map(TALENTS.map((t) => [t.name.toLowerCase(), t.id]));
}

/* -------------------------------------------------------------------- postimg */

/** A postimg page URL serves HTML; the picture itself is in its og:image tag. */
async function directLink(url) {
  if (/^https:\/\/i\.postimg\.cc\//.test(url)) return url;
  const res = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0' }, redirect: 'follow' });
  if (!res.ok) throw new Error(`page returned HTTP ${res.status}`);
  const html = await res.text();
  const og = /<meta property="og:image" content="([^"]+)"/i.exec(html);
  if (og) return og[1];
  const any = /https:\/\/i\.postimg\.cc\/[A-Za-z0-9]+\/[^"'\s)]+\.(?:png|jpg|jpeg|webp|gif)/i.exec(html);
  if (any) return any[0];
  throw new Error('no image on the page');
}

/** postimg stalls now and then, so a slow file is retried rather than lost. */
async function download(url, tries = 3) {
  for (let attempt = 1; ; attempt += 1) {
    try {
      const res = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return Buffer.from(await res.arrayBuffer());
    } catch (err) {
      if (attempt >= tries) throw err;
      await new Promise((r) => setTimeout(r, 2000 * attempt));
    }
  }
}

/* --------------------------------------------------------------- talent plates */

/** One set's overview picture: square, 640px, beside Guardian's and Mycomancer's. */
async function pullTalentArt(setId, name, link) {
  const file = path.join(TALENT_OUT, `${setId}.jpg`);
  if (existsSync(file) && !FORCE) {
    talentSkipped += 1;
    return;
  }
  try {
    const out = await writeTalentPlate(setId, await download(await directLink(link)));
    talentFetched += 1;
    console.log(
      `${setId.padEnd(20)} talent plate ${TALENT_SIZE}x${TALENT_SIZE} jpeg ${(out.length / 1024).toFixed(0)} KB`
    );
  } catch (err) {
    problems.push(`${name}: ${err.message}`);
  }
}

let talentFetched = 0;
let talentSkipped = 0;

/* ------------------------------------------------------------ the folder pass */

/** The folder both scripts walk. Kept in step with pull-item-art.mjs. */
const ONE_OFF = 'of';

/**
 * Every picture under a `data/` subfolder this script owns, as
 * `{ set, file, name, card }`. A folder is claimed by the set it belongs to, so
 * dropping `data/Enchanter/` in beside it needs no line here.
 *
 * ------------------------------------------------------------------ the one-off
 * `data/OF/` is claimed as well, and pull-item-art.mjs claims it too. It is where
 * a one-off lands: a sword, a trident, a tome, and the cards two of them carry.
 * Those arrive one at a time rather than as a set, so there is no set folder they
 * could go in.
 *
 * Both scripts walking one folder is the point, and each stays quiet about the
 * other's files — see `itemNames` above. It is not a set folder, so the talent
 * plate branch never fires for it: there is no set called OF for a plate to belong
 * to. A name that is both a card and an item, which "Druidic Tome" is, is placed by
 * both on purpose — the card plate and the belt tile are different crops.
 *
 * ------------------------------------------------------------------- the schools
 * A spell *school* arrives as a folder too — `data/Elemental/` landed 2026-08-20,
 * a family per subfolder and every file a whole card render rather than an art
 * plate. A school folder is claimed by name, walked into its family folders, and
 * its files are marked `card` so the plate is cut out of the render (see
 * `cardPlate` below). Which card a file belongs to is the *sheet's* business: the
 * drop's Image column names each file, so a misnamed render — VOLTAIC JOLT lives
 * in a file called LIGHTNING STRIKE — is placed by the sheet rather than by an
 * alias here, and a file no row names is reported, which is how the stray copy of
 * HURL in `Steam/` announces itself on every run until somebody deletes it.
 *
 * A drop with no Image column filled in falls back on the filename, and then a
 * render whose name is not the card's needs an ALIASES entry after all. That is
 * how `data/Ethereal/` arrived on 2026-08-25 and why three of its thirteen are
 * in that table, `data/Shadow/` the same afternoon for one of twelve,
 * `data/Time/` that evening for one of twelve more and `data/Earth/` on
 * 2026-08-26 for three of nine. See
 * PLATE_FOLDERS below for the other thing those drops settled, and FAMILY_FOLDERS
 * for the folder that is not a school at all.
 */
const SCHOOL_FOLDERS = new Set(['elemental', 'primal', 'arcane', 'nature', 'ethereal']);

/**
 * A spell *family* dropped at the top of `data/` rather than under its school.
 *
 * `data/Shadow/` landed 2026-08-25 with the Ethereal school's second family, and
 * Shadow is a family and not a school: the sheet beside it is `Spells - Ethereal -
 * Shadow.csv`, and the banner on all twelve cards reads Ethereal third-word
 * Shadow. So it is claimed on its own rather than added to SCHOOL_FOLDERS, which
 * would have put a word in that set that the codex does not use that way.
 *
 * Everything else about it is a school folder's behaviour, because what the two
 * sets are really for is the same: a folder whose files are spell art. That is
 * SPELL_FOLDERS below, and it is what every predicate reads.
 *
 * Moving the folder to `data/Ethereal/Shadow/` would retire this entry outright.
 * A family under its school is the shape `data/Elemental/Fire/` already has and
 * needs no claim of its own, since a school folder is walked into whatever
 * subfolders it brings. Left where the drop put it.
 *
 * `data/Time/` landed the same day with the school's third family and is the same
 * shape again: `Spells - Ethereal - Time.csv` beside it, and Ethereal third-word
 * Time on the banner of all twelve. Two entries make this a pattern rather than
 * one drop's exception, and the fix for both is the same one folder move.
 *
 * `data/Space/` is the fourth family and the one entry here that is not named for
 * the family it holds. The sheet beside it is `Spells - Ethreal - Spacial.csv` and
 * the banner on all twelve reads Ethereal third-word **Spacial**, with a c; the
 * folder is Space. Nothing here compares the folder's name to a tag, so the
 * mismatch costs nothing: the name is only how the folder is claimed, and the
 * cards inside it are resolved against the codex by their own filenames. See "the
 * spelling" in the Spacial section of spells.js.
 *
 * `data/Death/` landed 2026-08-26 and is the fourth, the first of them under a
 * school other than Ethereal: the sheet beside it is `Spells - Primal - Death.csv`
 * and the banner on all eleven reads Primal third-word Death. Same shape, same one
 * folder move that would retire it (`data/Primal/Death/`), and the same reason it
 * was left where the drop put it.
 *
 * `data/Flora/` is the fifth, the same day, and the first that names a family the
 * codex has held since its opening drop: the sheet beside it is `Spells - Primal -
 * Flora.csv`, all twelve of its rows read Primal third-word Flora, and only the
 * four Master ones brought a picture. So a folder here is not a new family any
 * more than it is a new school — it is only where a drop's files happened to land.
 *
 * `data/Wild/` is the sixth, later the same day, and it is the Flora drop twice
 * over: a family the codex has held from the beginning, a sheet of twelve rows
 * reading Primal third-word Wild, and a picture on the four Master ones alone. Its
 * sheet sits at the top of `data/` as `Spells - Primal - Wild.csv` rather than
 * inside the folder, which is the one thing about it that differs and the one thing
 * nothing here reads.
 *
 * `data/Life/` is the seventh, the same day again, and the first whose drop is not
 * a Master rung: its sheet is twelve rows reading Primal third-word Life and the
 * pictures cover eight of them, the whole Adept rung as well as the whole Master
 * one. Nothing here counts them, which is the point of saying so: a folder is
 * claimed by name and its files are resolved one at a time against the codex, so a
 * drop of eight costs exactly what a drop of four does.
 *
 * `data/Fire/` and `data/Earth/` are the eighth and ninth, 2026-08-26, and they
 * are the first two under Elemental rather than Ethereal or Primal. Both are
 * something none of the seven above them were: **a redraw of art this script has
 * already placed once**. Elemental arrived on 2026-08-20 as whole card renders in
 * `data/Elemental/<family>/`, and these nineteen files are the paintings those
 * renders were built out of, dropped as plates. So both folders name a family that
 * is not new, in a school whose own folder is still claimed and still walked.
 *
 * That means every file in them claims a card a file in `data/Elemental/` also
 * claims, which is exactly what "one card, two files" below is for: the newest
 * file wins, the older is named in the run's report, and deleting
 * `data/Elemental/FIRE/` and the two loose renders at the top of that folder is
 * what makes the report go quiet. Nothing here needs to know which of the two is
 * the plate — the mtime decides, and the drop is the newer artifact by seven
 * months.
 *
 * `data/Storm/` is the tenth, 2026-08-27, and the third under Elemental. It is the
 * one that shows what the two above it cost: Storm has no card in the codex before
 * this drop, so nothing in `data/Elemental/` claims any of its three, no file is
 * shadowed and the run says nothing about them. The shape is the Space drop’s,
 * three plates at the top of the folder with the sheet beside them at the top of
 * `data/`.
 *
 * `data/Mud/` is the eleventh, later on 2026-08-27, and Storm's shape exactly:
 * three plates for a family with no card in the codex before the drop, so nothing
 * is shadowed and nothing goes in `ALIASES` either, since all three filenames are
 * already the card names.
 */
const FAMILY_FOLDERS = new Set([
  'shadow',
  'time',
  'space',
  'death',
  'flora',
  'wild',
  'life',
  'fire',
  'earth',
  'storm',
  'mud',
]);


/** Every folder whose files are spell art, whether it names a school or a family. */
const SPELL_FOLDERS = new Set([...SCHOOL_FOLDERS, ...FAMILY_FOLDERS]);

/**
 * The spell folders whose files are art plates and must not be cut.
 *
 * A spell folder's files are card renders by default, because that is how the
 * first one arrived. `data/Ethereal/` landed 2026-08-25 as thirteen 2400x1792
 * plates instead — no white border, no banner, the painting and nothing else,
 * which is what the lineage and background drops are — and all thirteen sit at
 * the top of the folder rather than in a family subfolder. `data/Shadow/` is
 * twelve more of the same, later the same day, and `data/Time/` twelve more after
 * that. The Time drop is the first to arrive at two sizes, 2400x1792 for two of
 * them and 1200x896 for the other ten, and neither is cut: the resize below takes
 * whatever it is handed down to 720. `data/Space/` is twelve more at 1200x896,
 * which is the size the Time drop settled, `data/Death/` is eleven back at
 * 2400x1792, `data/Flora/` and `data/Wild/` are four more each at the same, and
 * `data/Life/` is eight more still. `data/Fire/` and `data/Earth/` are nine each
 * on 2026-08-26, mixed 2400x1792 and 1200x896 within one folder, which is the Time
 * drop's shape and costs nothing for the same reason.
 *
 * `data/Storm/` is three more at 2400x1792 on 2026-08-27, one a pixel narrow at
 * 2398, which costs nothing for the same reason: the resize takes whatever it is
 * handed down to 720. `data/Mud/` is three more the same day, all three square on
 * 2400x1792.
 *
 * Cutting one of these would take the top 45% of a painting that is already
 * only the painting. So the crop is what the exception turns off, and nothing
 * else about the folder changes: it is still claimed by name, still walked into
 * any family folder a later drop brings, and still resolved against the codex
 * the same way.
 */
const PLATE_FOLDERS = new Set([
  'ethereal',
  'shadow',
  'time',
  'space',
  'death',
  'flora',
  'wild',
  'life',
  'fire',
  'earth',
  'storm',
  'mud',
]);

/**
 * The ancestries, which arrive as one folder with a folder inside it.
 *
 * `data/Lineage/` landed 2026-08-21 with the two new tabs: thirteen ancestry
 * plates at the top and twenty-two card plates in `Lineage Cards` under them.
 * Both are 2400x1792 art plates rather than whole card renders, so neither is
 * cut — a school folder's files are the only ones this script crops.
 *
 * It nests the way a school folder does, and is the only other folder that does.
 */
const LINEAGE_FOLDER = 'lineage';
const LINEAGE_CARD_FOLDER = flatten('Lineage/Lineage Cards');

/**
 * The backgrounds and their skills, which arrive the way the ancestries do.
 *
 * `data/Background/` landed 2026-08-21: ten background plates at the top and the
 * Skills tab's own pictures in `Skills/` under them. `data/Skills/` arrived in
 * the same drop holding a copy of that subfolder, so both are claimed and both
 * resolve against the same two maps — a name is either a background or a skill
 * and never both, so where the file happens to sit decides nothing. That is what
 * lets the two stray background plates sitting in the skills folder land
 * correctly instead of being reported.
 *
 * The pictures are 2400x1792 art plates rather than whole card renders, like the
 * lineage drop, so nothing here is cut.
 */
const BACKGROUND_FOLDER = 'background';
const SKILL_FOLDER = 'skills';

/** A folder in the background family: `data/Background/`, or `data/Skills/`. */
const isBackgroundFamily = (name) =>
  flatten(name) === BACKGROUND_FOLDER || flatten(name) === SKILL_FOLDER;

/**
 * A duplicate Windows made rather than a picture somebody drew.
 *
 * `Heavy Armor Mastery - Copy.jpg` sits beside `Heavy Armor Mastery.jpg` in the
 * skills drop. Explorer names a copy that way, so a name ending in "copy" is
 * skipped in silence: reported, it would be two lines of noise on every run
 * saying only that Windows exists.
 */
const isCopy = (name) => /\bcopy$/.test(flatten(name));

function pictures(setIds) {
  if (!existsSync(DATA)) return [];

  const mine = (name) => setIds.has(flatten(name)) || flatten(name) === ONE_OFF;
  const spells = (name) => SPELL_FOLDERS.has(flatten(name));
  /* A spell folder whose files are whole cards, which is every one but the ones
     in PLATE_FOLDERS. This is the flag the crop reads, not the claim. */
  const render = (name) => spells(name) && !PLATE_FOLDERS.has(flatten(name));
  const lineage = (name) => flatten(name) === LINEAGE_FOLDER;

  const walk = (dir, set, card, nest) =>
    readdirSync(path.join(DATA, dir), { withFileTypes: true }).flatMap((entry) => {
      if (entry.isDirectory()) {
        /* A school folder, the lineage folder and the background folder nest —
           a set folder's subfolder is not art. */
        return nest ? walk(path.join(dir, entry.name), `${set}/${entry.name}`, card, nest) : [];
      }
      if (!IMAGE_FILE.test(entry.name)) return [];
      const name = entry.name.replace(IMAGE_FILE, '');
      if (isCopy(name)) return [];
      return [
        {
          set,
          file: path.join(DATA, dir, entry.name),
          name,
          card,
        },
      ];
    });

  return readdirSync(DATA, { withFileTypes: true })
    .filter(
      (entry) =>
        entry.isDirectory() &&
        (mine(entry.name) ||
          spells(entry.name) ||
          lineage(entry.name) ||
          isBackgroundFamily(entry.name))
    )
    .flatMap((dir) =>
      walk(
        dir.name,
        dir.name,
        render(dir.name),
        spells(dir.name) || lineage(dir.name) || isBackgroundFamily(dir.name)
      )
    );
}

/**
 * A file anywhere in a spell folder, at either depth. `set` is the folder it came
 * from and carries the family under it when there is one, so the folder that was
 * claimed is the first word of it: `Elemental/Fire` flattens to "elemental fire",
 * and `Shadow` to "shadow".
 */
const inSpellFolder = (picture) => SPELL_FOLDERS.has(flatten(picture.set).split(' ')[0]);

/** A file at the top of `data/Lineage/`: one of the thirteen ancestry plates. */
const isLineagePlate = (picture) => flatten(picture.set) === LINEAGE_FOLDER;

/** A file in `data/Lineage/Lineage Cards/`: art for one of the lineage cards. */
const isLineageCard = (picture) => flatten(picture.set) === LINEAGE_CARD_FOLDER;

/**
 * A file anywhere in the background family, at either depth. Which of the two
 * maps answers for it is decided by its *name* rather than by its folder — see
 * the note over `BACKGROUND_FOLDER`.
 */
const inBackgroundFamily = (picture) =>
  flatten(picture.set).split(' ').some((word) => word === BACKGROUND_FOLDER || word === SKILL_FOLDER);

/**
 * Lineage card files whose name is not the name the codex prints, flattened on
 * both sides. The same record ALIASES is, for the folder with its own map.
 *
 * All four are reads the codex already made and wrote down: the tab prints
 * CANIBALISM, VENEMOUS, UNDEATH RESILLIENCE and DRACONIC SCALE, the pictures were
 * drawn from the tab, and lineages.js corrected the spelling. Renaming a file
 * retires its entry here.
 */
const LINEAGE_ALIASES = {
  canibalism: 'cannibalism',
  venemous: 'venomous',
  'undeath resillience': 'undeath resilience',
  'draconic scale': 'draconic scales',
};

/**
 * Skill files whose name is not the name the codex prints, flattened on both
 * sides. The same record LINEAGE_ALIASES is, for the background family's map.
 *
 * Five, and every one is a read the codex already made and wrote down. The tab
 * prints Haggler, Helpful, Inquisitor and three Innate Spell rows; the pictures
 * were drawn from working names. `Cultist` is Occultist's: it is the only file in
 * the drop with no row of its own and the only row in the tab with no file, and
 * the two are one word apart. Renaming a file retires its entry here.
 */
const SKILL_ALIASES = {
  haggle: 'haggler',
  helper: 'helpful',
  inquistor: 'inquisitor',
  cultist: 'occultist',
  'inate spell novice': 'innate spell novice',
  'inate spell adept': 'innate spell adept',
  'inate spell master': 'innate spell master',
};

/** The same, for a background plate. One so far: `Mercanery.jpg` is Mercenary's. */
const BACKGROUND_ALIASES = {
  mercanery: 'mercenary',
};

/**
 * One picture, six cards.
 *
 * INNATE X is a modular row: the lineage tab names a school for each of six
 * ancestries and the codex builds six cards from the one row. The designer drew
 * one picture for it, so it is encoded once per id rather than reported as five
 * files that were never going to exist.
 */
const LINEAGE_MODULAR = {
  'innate x': [
    'innate-light',
    'innate-shadow',
    'innate-fire',
    'innate-wind',
    'innate-water',
    'innate-earth',
  ],
};

/**
 * The art plate cut out of a whole card render.
 *
 * A school folder's files are the finished card — 1055x1496 portrait, a white
 * border, the painting in the top half and the banner across its foot. The plate
 * wants the painting alone, so this cuts past the border and stops above the
 * banner. The box is proportional rather than in pixels, so a render at another
 * size still cuts clean.
 */
async function cardPlate(buf) {
  const meta = await sharp(buf).metadata();
  return sharp(buf)
    .extract({
      left: Math.round(meta.width * 0.015),
      top: Math.round(meta.height * 0.012),
      width: Math.round(meta.width * 0.97),
      height: Math.round(meta.height * 0.45),
    })
    .toBuffer();
}

/**
 * Whether a folder's picture has anything new to say to what is already
 * encoded from it.
 *
 * A downloaded picture is skipped on existence alone, because checking would
 * cost the download the check is meant to save. A folder is different: the
 * original is right there, its mtime is free to read, and a picture *redrawn*
 * under the same name is the normal way this drop arrives — `Mycomancer
 * overivew.jpg` landed on 2026-08-20 over a plate pulled from postimg three
 * days earlier. Skipping on existence would have quietly kept the old one.
 */
function stale(source, out) {
  if (!existsSync(out)) return true;
  return statSync(source).mtimeMs > statSync(out).mtimeMs;
}

/**
 * A square 640px plate, from bytes already in hand.
 *
 * A set's overview picture and an ancestry's are the same thing drawn in the same
 * two places, a tile on a chooser wall and the head of a page, so they are cut the
 * same way into folders of their own.
 */
async function writeSquarePlate(dir, id, buf) {
  const out = await sharp(buf)
    .resize({ width: TALENT_SIZE, height: TALENT_SIZE, fit: 'cover', position: 'centre' })
    .jpeg({ quality: TALENT_QUALITY, mozjpeg: true })
    .toBuffer();
  writeFileSync(path.join(dir, `${id}.jpg`), out);
  return out;
}

/** One set's overview picture. */
const writeTalentPlate = (setId, buf) => writeSquarePlate(TALENT_OUT, setId, buf);

/* ---------------------------------------------------------------------- main */

const ids = await cardIds();
const sets = await talentIds();
const items = await itemNames();
const lineages = await lineageNames();
const backgrounds = await backgroundNames();
const spells = await spellNames();
mkdirSync(OUT, { recursive: true });
mkdirSync(TALENT_OUT, { recursive: true });
mkdirSync(LINEAGE_OUT, { recursive: true });
mkdirSync(BACKGROUND_OUT, { recursive: true });

let plateFetched = 0;
let plateSkipped = 0;

const art = new Map();
const problems = [];
let fetched = 0;
let skipped = 0;
let sourceBytes = 0;
let outBytes = 0;
let encoded = 0;

/* --------------------------------------------------------------- the folders

   First, because a picture sitting in `data/` is the original and beats
   anything a link could fetch, and because placing it here is what lets the
   sheet pass below stay quiet about a card whose Image column is empty on
   purpose. */

const setIdByFolder = new Map([...sets].map(([name, id]) => [flatten(name), id]));
const idBySheetFile = new Map(
  sheets()
    .filter((row) => row.Name && row.Image && !/^https?:\/\//i.test(row.Image))
    .map((row) => [bare(row.Image), ids.get(row.Name.toLowerCase())])
    .filter(([, id]) => id)
);
const idByFlatName = new Map([...ids].map(([name, id]) => [flatten(name), id]));
const idByAliasFile = new Map(
  Object.entries(ALIASES)
    .map(([name, file]) => [bare(file), ids.get(name.toLowerCase())])
    .filter(([, id]) => id)
);

/* ------------------------------------------------------- one card, two files

   A folder is a working folder: a picture redrawn under a slightly different
   name arrives *beside* the one it replaces rather than over it. Left alone,
   which of the two ends up on the card is whichever `readdirSync` happened to
   return last, which is alphabetical order and has nothing to do with intent.

   So the newest file wins, and the one it beat is named in the run's report.
   The fix is always to delete the older file; this only stops the wrong one
   being published in the meantime. */

/* A lineage card file resolves against lineage cards and nothing else, and one of
   them serves six. Both are settled here so every loop below stays
   one-picture-one-card: `lineageId` is the answer, already found. A background
   family file is settled here too, against its own two maps: `skillId` when the
   name is a skill's, `plateId` when it is a background's. */
const folder = pictures(setIdByFolder).flatMap((picture) => {
  const flat = flatten(picture.name);

  if (inBackgroundFamily(picture)) {
    const skillId = backgrounds.cards.get(SKILL_ALIASES[flat] ?? flat);
    if (skillId) return [{ ...picture, skillId }];
    const plateId = backgrounds.plates.get(BACKGROUND_ALIASES[flat] ?? flat);
    // Nothing matched: left whole so the report below names the file.
    return [plateId ? { ...picture, plateId, into: BACKGROUND_OUT, kind: 'background' } : picture];
  }

  /* A spell folder holds spells, so it answers to the spell codex. See
     spellNames: two cards print BARRIER and only one of them is a spell. */
  if (inSpellFolder(picture)) {
    const spellId = spells.get(flat);
    return [spellId ? { ...picture, spellId } : picture];
  }

  if (!isLineageCard(picture)) return [picture];
  const found =
    LINEAGE_MODULAR[flat] ??
    [lineages.cards.get(LINEAGE_ALIASES[flat] ?? flat)].filter(Boolean);
  return found.length === 0 ? [picture] : found.map((id) => ({ ...picture, lineageId: id }));
});

/**
 * Which card a file is for, or null. Family answers first, since those resolve
 * against their own maps and must never be looked up codex-wide.
 */
function cardIdFor(picture) {
  const flat = flatten(picture.name);
  return (
    picture.lineageId ??
    picture.skillId ??
    idBySheetFile.get(flat) ??
    picture.spellId ??
    idByFlatName.get(flat) ??
    idByAliasFile.get(flat) ??
    null
  );
}

/**
 * The same picture in two places rather than two pictures.
 *
 * `data/Skills/` and `data/Background/Skills/` are a folder and a copy of it, and
 * both are claimed. A copy is the same bytes at the same moment, so a duplicate
 * that matches on both size and mtime is one file the drop happens to hold twice
 * and is settled in silence. Anything that differs is a redraw, and a redraw is
 * exactly what the report below is for.
 */
function sameFile(a, b) {
  const one = statSync(a.file);
  const two = statSync(b.file);
  return one.size === two.size && one.mtimeMs === two.mtimeMs;
}

const claims = new Map();
for (const picture of folder) {
  const id = cardIdFor(picture);
  if (!id) continue;

  const held = claims.get(id);
  if (!held) { claims.set(id, picture); continue; }

  const [win, lose] =
    statSync(picture.file).mtimeMs > statSync(held.file).mtimeMs
      ? [picture, held]
      : [held, picture];
  claims.set(id, win);
  if (sameFile(win, lose)) continue;
  console.log(`${id.padEnd(20)} two files claim it — using ${win.set}/${win.name}, not ${lose.name}`);
}

for (const picture of folder) {
  const flat = flatten(picture.name);
  const id = cardIdFor(picture);

  // Beaten by a newer file for the same card. Already reported above.
  if (id && claims.get(id) !== picture) continue;

  /* Not a card in this folder, and named for the set that owns the folder:
     this is the set's overview picture, the square plate behind `talent.art`.
     Cards are resolved first, so a card that happened to share the set's name
     would still be dealt as a card. */
  if (!id) {
    /* An ancestry plate: a file at the top of data/Lineage/, named for one of the
       thirteen. Its cards live one folder down and were resolved before the loop. */
    if (isLineagePlate(picture)) {
      const lineageId = lineages.plates.get(flat);
      if (!lineageId) {
        problems.push(`${picture.set}/${picture.name}: the codex has no lineage by that name`);
        continue;
      }
      const plate = path.join(LINEAGE_OUT, `${lineageId}.jpg`);
      if (!stale(picture.file, plate) && !FORCE) {
        plateSkipped += 1;
        continue;
      }
      try {
        const out = await writeSquarePlate(LINEAGE_OUT, lineageId, readFileSync(picture.file));
        plateFetched += 1;
        console.log(
          `${lineageId.padEnd(20)} lineage plate ${TALENT_SIZE}x${TALENT_SIZE} jpeg ${(out.length / 1024).toFixed(0)} KB`
        );
      } catch (err) {
        problems.push(`${picture.set}/${picture.name}: ${err.message}`);
      }
      continue;
    }

    /* A file in Lineage Cards/ that no lineage card answers to. Its own message,
       because that folder resolves against lineage cards alone: "no card by that
       name" would send a reader looking through the whole codex. */
    if (isLineageCard(picture)) {
      problems.push(
        `${picture.set}/${picture.name}: the codex has no lineage card by that name`
      );
      continue;
    }

    /* A background plate: a file in the background family named for one of the
       ten. Its skills resolved before the loop, so anything reaching here with a
       `plateId` is a plate, and anything without is a name neither map answers
       to. */
    if (inBackgroundFamily(picture)) {
      if (!picture.plateId) {
        problems.push(
          `${picture.set}/${picture.name}: the codex has no skill and no background by that name`
        );
        continue;
      }
      const plate = path.join(BACKGROUND_OUT, `${picture.plateId}.jpg`);
      if (!stale(picture.file, plate) && !FORCE) {
        plateSkipped += 1;
        continue;
      }
      try {
        const out = await writeSquarePlate(
          BACKGROUND_OUT,
          picture.plateId,
          readFileSync(picture.file)
        );
        plateFetched += 1;
        console.log(
          `${picture.plateId.padEnd(20)} background plate ${TALENT_SIZE}x${TALENT_SIZE} jpeg ${(out.length / 1024).toFixed(0)} KB`
        );
      } catch (err) {
        problems.push(`${picture.set}/${picture.name}: ${err.message}`);
      }
      continue;
    }

    /* In the shared folder, an item's picture is not this script's to place and not
       this script's to complain about. A name that is neither a card nor an item
       still is: that is a misspelling, and both scripts will say so, which is the
       right number of times for a file nobody can place. */
    if (flatten(picture.set) === ONE_OFF) {
      if (items.has(flat)) continue;
      problems.push(`${picture.set}/${picture.name}: the codex has no card by that name (nor an item)`);
      continue;
    }

    const setId = setIdByFolder.get(flatten(picture.set));
    const named = setId && bare(PLATE_ALIASES[setId] ?? '') === flat;
    if (setId && (named || flat.startsWith(flatten(picture.set)))) {
      const plate = path.join(TALENT_OUT, `${setId}.jpg`);
      if (!stale(picture.file, plate) && !FORCE) { talentSkipped += 1; continue; }
      try {
        const source = readFileSync(picture.file);
        const out = await writeTalentPlate(setId, source);
        talentFetched += 1;
        console.log(
          `${setId.padEnd(20)} talent plate ${TALENT_SIZE}x${TALENT_SIZE} jpeg ${(out.length / 1024).toFixed(0)} KB`
        );
      } catch (err) {
        problems.push(`${picture.set}/${picture.name}: ${err.message}`);
      }
      continue;
    }
    problems.push(`${picture.set}/${picture.name}: the codex has no card by that name`);
    continue;
  }

  const full = path.join(OUT, `${id}.webp`);
  const thumb = path.join(OUT, `${id}-thumb.webp`);

  if (!stale(picture.file, full) && existsSync(thumb) && !FORCE) {
    art.set(id, `/cards/${id}.webp`);
    outBytes += statSync(full).size;
    skipped += 1;
    continue;
  }

  try {
    // A whole card render gives up its painting first; an art plate is used whole.
    const source = picture.card
      ? await cardPlate(readFileSync(picture.file))
      : readFileSync(picture.file);
    const meta = await sharp(source).metadata();

    /* Both cuts come from the original. A downloaded card's thumbnail is cut
       from its 720px copy because the original is a download away; here it
       is right there, and 2400 -> 200 in one step keeps the detail
       that 2400 -> 720 -> 200 throws away twice. Width only,
       no crop: the plate is 360x270 and these arrive 4:3 already. */
    const cut = (width) =>
      sharp(source).resize({ width, withoutEnlargement: true }).webp({ quality: QUALITY }).toBuffer();

    const [big, small] = await Promise.all([cut(WIDTH), cut(THUMB_WIDTH)]);
    writeFileSync(full, big);
    writeFileSync(thumb, small);

    art.set(id, `/cards/${id}.webp`);
    sourceBytes += source.length;
    outBytes += big.length;
    encoded += 1;
    console.log(
      `${id.padEnd(20)} ${meta.width}x${meta.height} ${(source.length / 1024 / 1024).toFixed(2)} MB ${meta.format}` +
        `  ->  ${WIDTH}px webp ${(big.length / 1024).toFixed(0)} KB + ${THUMB_WIDTH}px ${(small.length / 1024).toFixed(1)} KB`
    );
  } catch (err) {
    problems.push(`${picture.set}/${picture.name}: ${err.message}`);
  }
}

/* ----------------------------------------------------------------- the links */

/**
 * A row that says on its own face that it is a spell, off the Tags column the
 * drop already carries: "Ethereal, Novice Spell, Light".
 *
 * The other end of the BARRIER collision spellNames documents. The Ethereal
 * drop's Barrier row is a spell and `ids` answers with the enchantment, so the
 * row read as a card with no art and reported a missing link for a picture that
 * had just been placed. The sheet's own tags settle it rather than the filename
 * or the fold order.
 */
const isSpellRow = (row) => /\bSpells?\b/i.test(row.Tags ?? '');

for (const row of sheets()) {
  const name = row.Name;
  const link = row.Image;
  if (!name) continue;

  const id =
    (isSpellRow(row) ? spells.get(flatten(name)) : null) ?? ids.get(name.toLowerCase());

  /* A Talent Set sheet's Overview row names the *set*, not a card, and its picture
     is the square plate behind talent.art. Placed here, then done with. */
  const setId = sets.get(name.toLowerCase());
  if (!id && setId) {
    if (link) await pullTalentArt(setId, name, link);
    continue;
  }

  /* A row this importer does not own: nothing in the card codex by that name, and
     no picture asked for either. Warning about it on every run would only train the
     reader to skip the list. A row with a *link* and no card still warns, because
     that is how a renamed spell announces itself. */
  if (!id && !link) continue;

  if (!id) {
    problems.push(`${name}: the codex has no card by that name (${row[TAB]?.name ?? 'a drop in data/'})`);
    continue;
  }
  /* A filename in the Image column is the folder pass's business — it says
     which file is whose, and there is nothing here to download. */
  if (link && !/^https?:\/\//i.test(link)) continue;
  /* Already placed from a folder, and its Image column is empty because the
     picture never went to postimg in the first place. Nothing to report. */
  if (!link && art.has(id)) continue;
  if (!link) {
    /* A tab that carries no link at all is waiting on its art rather than missing
       it, and every row in it would otherwise say the same thing — the
       Enchantments tab alone is 23 rows, which is exactly the wall of noise this
       list is meant not to become. What still warns is a row with no link on a tab
       where other rows have one, because that is a picture that went missing.

       Before the registry widened on 2026-08-20 these rows were quiet for the
       wrong reason: an enchantment's name resolved to nothing, so the row read as
       one this importer did not own. It owns them now. */
    if (!row[TAB]?.linked) continue;
    problems.push(`${name}: no link in the Image column`);
    continue;
  }

  const file = path.join(OUT, `${id}.webp`);

  if (existsSync(file) && !FORCE) {
    art.set(id, `/cards/${id}.webp`);
    outBytes += statSync(file).size;
    skipped += 1;
    continue;
  }

  try {
    const buf = await download(await directLink(link));
    const image = sharp(buf);
    const meta = await image.metadata();
    const webp = await image.resize({ width: WIDTH, withoutEnlargement: true }).webp({ quality: QUALITY }).toBuffer();
    writeFileSync(file, webp);

    art.set(id, `/cards/${id}.webp`);
    sourceBytes += buf.length;
    outBytes += webp.length;
    fetched += 1;
    console.log(
      `${id.padEnd(20)} ${meta.width}x${meta.height} ${(buf.length / 1024 / 1024).toFixed(2)} MB ${meta.format}` +
        `  ->  ${WIDTH}px webp ${(webp.length / 1024).toFixed(0)} KB`
    );
  } catch (err) {
    problems.push(`${name}: ${err.message}`);
  }
}

/* ---------------------------------------------------------------- thumbnails */

/* Cut from the local full-size copy rather than downloaded again: at 200px for
   a 92px plate there is nothing left for the original to give that the 720px
   WebP has already lost. */
let thumbBytes = 0;
let thumbsMade = 0;
for (const id of art.keys()) {
  const full = path.join(OUT, `${id}.webp`);
  const thumb = path.join(OUT, `${id}-thumb.webp`);
  if (existsSync(thumb) && !FORCE) { thumbBytes += statSync(thumb).size; continue; }
  const buf = await sharp(full).resize({ width: THUMB_WIDTH, withoutEnlargement: true }).webp({ quality: QUALITY }).toBuffer();
  writeFileSync(thumb, buf);
  thumbBytes += buf.length;
  thumbsMade += 1;
}

/* ------------------------------------------------------ the version on a URL

   A redraw keeps the filename and changes the pixels, which is the one shape of
   change a cache cannot see. `/cards/blazing-suns.webp` was the same URL before
   and after the Fire drop of 2026-08-26, so every browser and every Cloudflare
   edge holding the old painting went on serving it: the drop reached the disk,
   the lookup and the build, and readers still saw what they already had. Jules
   reported it the next morning as the spell preview showing the old picture, and
   it was not the preview. It was every surface that draws card art.

   So the URL carries eight characters of the file's own content hash. Same bytes,
   same URL, and a run that changes nothing changes nothing in the diff; new bytes,
   new URL, and every cache in the chain misses on it at once, with no purge to
   remember and nothing to do by hand.

   A query string rather than a hashed filename, because the file on disk keeps
   the name a person would look for and Cloudflare's default cache key already
   includes the query. A hashed *filename* would also work and would leave the old
   file behind on every redraw, which is a second thing to clean up.

   **The thumbnail rides the full picture's hash rather than carrying its own.**
   The two are cut from one source in the same pass and are only ever written
   together, so they cannot disagree, and one token per card keeps the lookup one
   flat map of one string. */
const version = (file) =>
  createHash('sha256').update(readFileSync(file)).digest('hex').slice(0, 8);

/* ------------------------------------------------------------ write the lookup */

const rows = [...art.entries()]
  .sort((a, b) => a[0].localeCompare(b[0]))
  .map(([id, src]) => `  '${id}': '${src}?v=${version(path.join(OUT, `${id}.webp`))}',`)
  .join('\n');

writeFileSync(
  path.join(ROOT, 'src/lib/cardArt.js'),
  `/**
 * Card art, keyed by card id.
 *
 * Generated by scripts/pull-card-art.mjs — do not edit by hand. Run \`npm run
 * art\` after changing an Image column in the sheets.
 *
 * The pictures are the designer's, and the sheets point at postimg. They are
 * not served from postimg: the originals are up to 3 MB at 1280x956, arriving
 * at 200-450 KB/s from a host that sometimes stalls for minutes, and the plate
 * that shows them is 360x270. The script resizes each one to ${WIDTH}px of WebP
 * and puts it in public/cards/, so they ship with the site and Cloudflare
 * serves them from the edge.
 *
 * Two sizes, because there are two plates. A dealt card gets the \${WIDTH}px
 * one; a brief's plate is 92 CSS pixels wide and gets the \${THUMB_WIDTH}px cut
 * of it, which matters because a wall of two dozen briefs is the commonest
 * sight on the sheet.
 *
 * ------------------------------------------------------------- the ?v=
 * Every URL carries eight characters of its file's content hash. A redraw
 * keeps the filename and changes the pixels, which no cache can see, so
 * without this a reader who had already loaded a picture kept the old one
 * until their browser felt like asking again. Same bytes, same URL; new
 * bytes, new URL, and every cache misses at once. See the note over the
 * version helper in scripts/pull-card-art.mjs.
 *
 * ------------------------------------------------------------------ the gate
 * Nothing here decides who *sees* a picture. Card art is a paid capability
 * (see \`showsArt\` in tiers.js), checked at the moment of drawing in
 * useCodexArt.js. This file only says what the picture is.
 */

const CARD_ART = {
${rows}
};

/** The art for one card, or null for a card that has none yet. */
export function artFor(id) {
  return CARD_ART[id] ?? null;
}

/** The small cut of it, for the 92px plate a brief draws. */
export function thumbFor(id) {
  const full = CARD_ART[id];
  return full ? full.replace(/\\.webp(\\?|$)/, '-thumb.webp$1') : null;
}

/**
 * The same list of cards with their art attached, for the codex modules to
 * wrap their own arrays in. A card that has no picture keeps \`art_url: null\`
 * rather than losing the field, so a reader never has to guess whether the
 * absence is missing art or a missing lookup.
 */
export function withArt(cards) {
  return cards.map((card) => ({
    ...card,
    art_url: artFor(card.id),
    art_thumb: thumbFor(card.id),
  }));
}
`,
  'utf8'
);

/* ------------------------------------------------------------------ the report */

console.log(
  `\n${fetched} fetched, ${encoded} encoded from a folder, ${skipped} already on disk,` +
    ` ${art.size} in the lookup`
);
if (talentFetched || talentSkipped) {
  console.log(`${talentFetched} talent plate(s) fetched, ${talentSkipped} already on disk`);
}
if (plateFetched || plateSkipped) {
  console.log(`${plateFetched} lineage plate(s) cut, ${plateSkipped} already on disk`);
}
console.log(`${thumbsMade} thumbnail(s) cut, ${(thumbBytes / 1024).toFixed(0)} KB across ${art.size}`);
if (fetched > 0 || encoded > 0) {
  console.log(
    `downloaded ${(sourceBytes / 1024 / 1024).toFixed(1)} MB, wrote ${((outBytes + thumbBytes) / 1024 / 1024).toFixed(2)} MB` +
      ` (${(sourceBytes / (outBytes + thumbBytes)).toFixed(0)}x smaller)`
  );
} else {
  console.log(`public/cards is ${((outBytes + thumbBytes) / 1024 / 1024).toFixed(2)} MB`);
}
if (problems.length) console.log(`\n${problems.length} problem(s):\n` + problems.map((p) => `  ${p}`).join('\n'));
