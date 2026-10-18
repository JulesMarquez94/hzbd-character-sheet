/**
 * The Fief, held to the rules that make one town the same town on every screen.
 *
 * Four things are easy to break by tidying and hard to notice when broken:
 *
 *   **The island is the kit's.** Every hex is drawn with one KayKit tile, so a
 *   shore the kit cannot draw is sea, and the ground counts are the plan's.
 *
 *   **The book replays the same.** The town is never stored. Every screen folds
 *   the same orders into the same town, so the fold must not care what order the
 *   rows arrived in, must refuse a clash the same way twice, and must name a
 *   building after the order that raised it, so a rule changed earlier in the
 *   book never moves a card the Game Master rewrote.
 *
 *   **Only the Game Master's hand is the Game Master's.** Destroy, award, the
 *   rules and a custom building are refused from a sheet.
 *
 *   **The pace.** The plan settled on 2026-10-17 that the Castle is 90 campaign
 *   days away or more. A greedy player is run against the numbers, and a tuning
 *   that lets them get there sooner fails here.
 *
 *   node scripts/check-fief.mjs        report and exit 1 on any finding
 *   node scripts/check-fief.mjs --list print every case, then exit 0
 */

import {
  CAT,
  FOUNDING,
  KEEP_UP,
  createTown,
  foldFief,
  foundFief,
  normalizeFief,
  townRest,
  townRestWords,
  unfoundFief,
  upCost,
  wallRun,
} from '../src/lib/fief.js';
import { ALL, ISLANDS, STEP, fitCrossing, fitMask, hdist, hk, inmap, islandOf, nb, ring } from '../src/lib/fiefIsland.js';
import { keyPeopleOf } from '../src/lib/fiefPeople.js';
import { restPlan } from '../src/lib/rest.js';
import { normalizePay, payWords } from '../src/lib/calendar.js';
import { BLANK_CHARACTER } from '../src/lib/characterModel.js';

const LIST = process.argv.includes('--list');
const findings = [];
const notes = [];
const check = (ok, what) => {
  if (!ok) findings.push(what);
  else if (LIST) notes.push(`ok   ${what}`);
};
const say = (line) => notes.push(`     ${line}`);

/* ------------------------------------------------------------------ the islands */

check(ALL.length === 331, `an island is 331 hexes (it is ${ALL.length})`);
check(ISLANDS.length === 6, 'there are six islands to found a town on');
for (const spec of ISLANDS) {
  const isl = islandOf(spec.id);
  const name = spec.name;
  const counts = {};
  for (const h of ALL) {
    const t = isl.terr(h) || 'grass';
    counts[t] = (counts[t] || 0) + 1;
  }
  say(`${name}: ${Object.entries(counts).map(([t, n]) => `${n} ${t}`).join(', ')}`);
  let shores = true;
  let rivers = true;
  let steps = true;
  for (const h of ALL) {
    const t = isl.terr(h);
    if (t === 'C' && !fitMask('coast', isl.seaEdges(h))) shores = false;
    if (t !== 'S' && t !== 'C' && t !== 'V' && isl.seaEdges(h).length) shores = false;
    if (t === 'V' && !fitMask('river', isl.riverEdges[hk(h)] ?? [])) rivers = false;
    if (t !== 'H') {
      for (let i = 0; i < 6; i += 1) {
        const n = nb(h, i);
        if (inmap(n) && isl.terr(n) !== 'H' && Math.abs(isl.level(h) - isl.level(n)) > STEP) steps = false;
      }
    }
  }
  check(shores, `${name}: every shore is one the kit can draw`);
  check(rivers, `${name}: every river hex is one the kit can draw`);
  check(steps, `${name}: no two neighbours stand more than a terrace apart, so a street can climb anywhere`);
  check(ring(1).every((h) => !isl.terr(h) && isl.level(h) === 0), `${name}: the Keep is ringed by flat grass, so its first streets can be laid`);
  for (const [site, what] of [['F', 'woods'], ['H', 'heights'], ['S', 'water for the docks']]) {
    check(ALL.some((h) => isl.siteOK(site, h)), `${name}: there are ${what}`);
  }
  const town = foldFief(foundFief('Test', 1, spec.id), [], 1);
  check(town.state.buildings.some((b) => b.type === 'farm'), `${name}: a town founded here gets its farm`);
  for (const type of ['woodcutter', 'quarry', 'fisher', 'docks', 'hunter', 'mine']) {
    check(!!town.nearestFree(type, [0, 0]), `${name}: a ${CAT[type].name} has somewhere to go`);
  }
  for (const h of ALL) {
    if (isl.riverAxis(h) < 0) continue;
    const axis = isl.riverAxis(h);
    for (const cross of [0, 1, 2].filter((c) => c !== axis)) {
      if (!fitCrossing(isl.riverEdges[hk(h)], cross)) findings.push(`${name}: the straight river at ${hk(h)} has no crossing tile for axis ${cross}`);
    }
  }
}

/* A street over the river: on Two Banks a building on the far bank is reached by a bridge. */
{
  const fief = foundFief('Bridgeford', 1, 'rivercross');
  const town = createTown(fief);
  town.apply({ seq: 1, day: 1, kind: 'award', data: { wood: 600, stone: 600 }, actor: 'GM', character_id: null });
  const isl = town.island;
  const far = ALL.filter((h) => !isl.terr(h) && h[0] >= 4 && hdist(h, [0, 0]) <= 6 && !town.placeWhy('park', h))
    .sort((p, q) => hdist(p, [0, 0]) - hdist(q, [0, 0]))[0];
  const path = far ? town.streetPath(far, 4) : null;
  check(!!far && !!path && path.some((h) => h.length > 2), 'Two Banks: a building on the far bank is reached over a bridge');
  if (far) {
    town.apply({ seq: 2, day: 1, kind: 'build', data: { type: 'park', at: far }, actor: 'Kael', character_id: 'c-kael' });
    const spans = Object.keys(town.state.bridges);
    check(spans.length >= 1 && spans.every((k) => isl.terr(k.split(',').map(Number)) === 'V'), 'and the bridge is laid on the river and kept as one');
    check(town.state.log.some((l) => /bridge/.test(l.text)), 'and the log says a bridge was laid');
    const span = spans[0]?.split(',').map(Number);
    check(span && town.roadEdges(span).length === 2, 'and a bridge joins the streets along its own line only');
  }
}

/* ---------------------------------------------------------------- the founding */

const FIEF = foundFief('Ashford', 1, 'seaward');
const founded = foldFief(FIEF, [], 1);
check(founded.keep().level === 1, 'a town is founded with a Town Hall');
check(founded.state.buildings.some((b) => b.id === 'f1' && b.type === 'farm'), 'and its first Farm, named f1');
check(founded.state.pop === FOUNDING.pop && FOUNDING.pop === 10, `and ${FOUNDING.pop} people`);
check(founded.holds() >= founded.state.pop, 'who all have food and room on the first day');
check(founded.state.houses.length === Math.ceil(FOUNDING.pop / FIEF.rules.perHouse), 'with houses enough for them');
const roles = founded.people().map((p) => p.role);
check(['Advisor', 'Foreman', 'Head farmer'].every((r) => roles.includes(r)), 'the Keep has its Advisor and Foreman, the Farm its Head farmer');
check(foldFief({}, [], 5) === null, 'a campaign with no town folds to nothing');

/* --------------------------------------------------------------------- orders */

let seq = 0;
const row = (day, kind, data, actor = 'Kael', character_id = 'c-kael') => ({ seq: (seq += 1), day, kind, data, actor, character_id });
const gmRow = (day, kind, data) => row(day, kind, data, 'The Game Master', null);

const wood = founded.nearestFree('woodcutter', [-5, 4]);
const fish = founded.nearestFree('fisher', [5, -5]);
const book = [
  row(1, 'build', { type: 'woodcutter', at: wood }),
  row(1, 'build', { type: 'fisher', at: fish }),
  row(1, 'build', { type: 'fisher', at: fish }, 'Sera', 'c-sera'),
];
const t5 = foldFief(FIEF, book, 5);
check(t5.bById('o1')?.type === 'woodcutter', 'a building is named after the order that raised it');
check(t5.state.log.some((l) => l.kind === 'refused' && /^Sera's Fisher could not go ahead: Something already stands there/.test(l.text)), 'a clash is refused in the replay, with the reason in the log');

const shuffled = [...book].reverse();
check(JSON.stringify(foldFief(FIEF, shuffled, 5).state) === JSON.stringify(t5.state), 'the fold does not care what order the rows arrived in');
check(JSON.stringify(foldFief(FIEF, book, 5).state) === JSON.stringify(t5.state), 'the same book folds to the same town twice');

const ahead = [...book, row(9, 'build', { type: 'park', at: founded.nearestFree('park', [-1, 2]) })];
check(!foldFief(FIEF, ahead, 5).state.projects.some((p) => p.type === 'park'), 'an order from a day still to come waits for its day');

/* A rule changed early in the book must not move a building's name. */
const rulesFirst = [gmRow(1, 'rules', { rules: { builders: 3 } }), ...book.map((r) => ({ ...r, seq: r.seq + 100 }))];
const ruled = foldFief(FIEF, rulesFirst, 5);
check(ruled.state.rules.builders === 3, 'the Game Master changes a rule through the book');
check(ruled.bById('o101')?.type === 'woodcutter', 'and the buildings ordered after it keep the names of their orders');

for (const kind of ['destroy', 'award', 'custom', 'rules']) {
  const t = foldFief(FIEF, [row(1, kind, { building: 'f1', wood: 50, at: [2, 2], rules: { builders: 1 } })], 1);
  check(t.state.log.some((l) => l.kind === 'refused' && /Only the Game Master/.test(l.text)), `a sheet cannot ${kind}`);
}

/* Cancel: all of it back before the first day's work, half after. */
{
  const before = foldFief(FIEF, [row(1, 'build', { type: 'woodcutter', at: wood })], 1);
  const paid = 60 - before.state.stock.wood;
  const now = foldFief(FIEF, [row(1, 'build', { type: 'woodcutter', at: wood }), row(1, 'cancel', { project: 'o' + seq })], 1);
  check(now.state.stock.wood === 60 && paid === CAT.woodcutter.cost.wood, 'a project cancelled before work starts is refunded in full');
}
{
  const first = seq + 1;
  const t = foldFief(FIEF, [row(1, 'build', { type: 'farm', at: founded.nearestFree('farm', [2, 4]) }), row(2, 'cancel', { project: `o${first}` })], 2);
  check(t.state.stock.wood === 60 - CAT.farm.cost.wood + CAT.farm.cost.wood / 2, 'and by half once the builders have started');
}

check(foldFief(FIEF, [row(1, 'upgrade', { building: 'f1' })], 1).state.log.some((l) => /needs the Keep/.test(l.text)), 'no tier passes the Keep level');
check(foldFief(FIEF, [row(1, 'trade', { res: 'wood', n: 1 })], 1).state.log.some((l) => /Trade docks need a dockhand/.test(l.text)), 'goods trade only at a staffed Trade docks');

{
  const spot = founded.nearestFree('park', [-3, 3]);
  const raised = gmRow(1, 'custom', { at: spot, title: 'The Drowned Lantern', model: 'crypt', shop: true });
  const t = foldFief(FIEF, [raised], 1);
  const b = t.state.buildings.find((x) => x.type === 'custom');
  check(b && t.titleOf(b) === 'The Drowned Lantern' && t.isShop(b) && t.shopOpen(b), 'the Game Master raises a custom building that is a shop');
  const card = normalizeFief({ ...FIEF, cards: { [b.id]: { title: 'The Lantern', shop: false } } });
  const t2 = foldFief(card, [raised], 1);
  const b2 = t2.bById(b.id);
  check(t2.titleOf(b2) === 'The Lantern' && !t2.isShop(b2), 'and a rewrite of its card wins over the order');
}
{
  const t = foldFief(FIEF, [gmRow(1, 'destroy', { building: 'f1' })], 1);
  check(t.bById('f1').ruined, 'the Game Master leaves a building as rubble');
  const r = foldFief(FIEF, [gmRow(1, 'destroy', { building: 'f1' }), row(1, 'rebuild', { building: 'f1' })], 1);
  check(r.state.stock.wood === 60 - Math.ceil(CAT.farm.cost.wood / 2), 'and rubble rebuilds at half the price');
  check(foldFief(FIEF, [gmRow(1, 'destroy', { building: 'keep' })], 1).state.log.some((l) => l.kind === 'refused'), 'the Keep cannot be destroyed');
}
{
  const t = foldFief(FIEF, [gmRow(1, 'award', { wood: 5000, note: 'A caravan' })], 1);
  check(t.state.stock.wood === t.storeCap().wood, 'a gift fills the stores no further than they hold');
}
{
  const cells = wallRun([3, -5], [3, -1]);
  check(cells.length === 5 && cells.every((c, i) => c[0] === 3 && c[1] === -5 + i), 'a run of wall follows a hex line');
}

/* Deleting a town and founding another: the book is closed, never emptied. */
{
  const old = foldFief(FIEF, book, 5);
  const lastSeq = Math.max(...book.map((r) => r.seq));
  const gone = unfoundFief(FIEF, lastSeq);
  check(foldFief(gone, book, 5) === null, 'a deleted town folds to nothing');
  check(gone.since === lastSeq && !Object.keys(gone.cards).length && !gone.events.length && !gone.extras.length, 'and keeps only the mark where its book was closed');
  const again = foundFief('Newport', 7, 'rivercross', undefined, gone.since);
  const fresh = foldFief(again, book, 7);
  check(fresh && fresh.island.id === 'rivercross' && fresh.state.founded === 7, 'a new town can be founded on another island');
  check(fresh.state.buildings.length === 2 && !fresh.state.log.some((l) => l.seq !== undefined), "and none of the old town's orders reach it");
  const next = { seq: lastSeq + 1, day: 7, kind: 'build', data: { type: 'woodcutter', at: fresh.nearestFree('woodcutter', [-5, 4]) }, actor: 'Kael', character_id: 'c-kael' };
  check(foldFief(again, [...book, next], 7).pById(`o${next.seq}`)?.type === 'woodcutter', 'while its own orders do');
  check(old.state.buildings.length > 2, 'and the old book is still there to be read');
  check(unfoundFief(gone, 1).since === lastSeq, 'a mark never moves back');
}

/* People: ids from the building, and a Castle brings its Chief. */
{
  const b = { id: 'o7', type: 'keep', q: 0, r: 0, level: 3 };
  const people = keyPeopleOf(b);
  check(people.length === 3 && people[2].role === 'Chief of the guard' && people[2].id === 'o7:2', 'the Castle brings a Chief of the guard');
  check(JSON.stringify(keyPeopleOf(b)) === JSON.stringify(people), 'the same building generates the same people every time');
}

/* The rest. */
check(townRest(1).karma === 0 && townRest(2).karma === 1 && townRest(2).shieldPerLevel === 0 && townRest(3).shieldPerLevel === 5, 'the Tavern: nothing at tier 1, Karma at 2, a Shield of five times the level at 3');
check(townRestWords(0).length > 0, 'a rest with no Tavern still says what it gives');

/* And the sheet's own rest applies it, which is the only place it lands. */
{
  const sleeper = { ...BLANK_CHARACTER, name: 'Fixture', level: 4, health: 10, health_max: 200, willpower_max: 20, supplies: 40, wealth: 1000, karma: 1, mind: 4, shield: 0 };
  const night = (town, extra = {}, kind = 'long') => restPlan(sleeper, kind, [], null, [], null, { pay: { mode: 'free', town, ...extra } });
  check(night({ tavern: 1 }).patch.karma === undefined, 'a tier 1 Tavern gives no Karma');
  check(night({ tavern: 2 }).patch.karma === 2, 'a tier 2 Tavern gives a Karma point');
  check(night({ tavern: 2 }).patch.shield === undefined, 'and no Shield');
  check(night({ tavern: 3 }).patch.shield === 20, 'a tier 3 Tavern wakes the character with a Shield of five times their level');
  check(night({ tavern: 3 }, {}, 'short').patch.karma === undefined && night({ tavern: 3 }, {}, 'short').patch.shield === undefined, 'a Short Rest in the town gives nothing on top');
  const both = restPlan(sleeper, 'long', [], null, [], null, { pay: { mode: 'coins', coins: 0, roof: 'fine', town: { tavern: 3 } } });
  check(both.patch.karma === 2 && both.patch.shield === 20, 'a roof and the Tavern never stack: one Karma point and the larger Shield');
  check(restPlan(sleeper, 'long', [], null, [], null, { pay: { mode: 'free' } }).patch.karma === undefined, 'a rest away from the town is an ordinary rest');
  check(normalizePay({ mode: 'supplies', town: { tavern: 9 } }).town.tavern === 3 && !normalizePay({ mode: 'free' }).town, 'a call keeps the tier it was called with, and only when it names the town');
  check(payWords({ mode: 'free', town: { tavern: 2 } }) === 'In the town · Free', 'and says it is in the town');
}

/* --------------------------------------------------------------------- the pace */

/**
 * A greedy player: every day, the Keep's next level the moment it can be paid
 * for, else whatever the stores are shortest of for it, food when the people
 * run short of it and comfort when they run short of room. Not clever, just
 * never idle, so a tuning that lets this reach the Castle early is too fast.
 */
function greedy(fief = FIEF, limit = 365) {
  const town = createTown(fief);
  const orders = [];
  let n = 0;
  let castle = null;
  const order = (kind, data) => {
    n += 1;
    const o = { seq: n, day: town.state.day, kind, data, actor: 'Bot', character_id: 'c-bot' };
    const res = town.apply(o);
    orders.push(o);
    return !res.err;
  };
  const where = (type, near) => town.nearestFree(type, near);
  const build = (type, near) => {
    const at = where(type, near);
    return at && !town.placeWhy(type, at) && !town.shortOf(town.cut(CAT[type].cost)) && order('build', { type, at });
  };
  const NEAR = { fisher: [5, -5], farm: [1, 4], hunter: [-6, 6], woodcutter: [-5, 4], quarry: [0, -5], mine: [-2, -4], docks: [7, -1], park: [-1, 2], fountain: [-2, 3], temple: [2, -3], cemetery: [-6, 2] };
  /* A site further than a street reaches is reached the way a player reaches
     it: a park laid on the way, which lays its street a little further out. A
     site that is only too dear is saved for, never walked towards. */
  const toward = (type) => {
    const far = town.nearestFree(type, [0, 0]);
    if (!far || town.shortOf(town.cut(CAT.park.cost))) return false;
    let best = null;
    for (const h of ALL) {
      if (town.placeWhy('park', h)) continue;
      const d = hdist(h, far);
      if (!best || d < best.d) best = { h, d };
    }
    return !!best && order('build', { type: 'park', at: best.h });
  };
  const site = (type) => {
    if (town.shortOf(town.cut(CAT[type].cost))) return true;
    let best = null;
    for (const h of ALL) {
      if (town.placeWhy(type, h)) continue;
      const d = hdist(h, [0, 0]);
      if (!best || d < best.d) best = { h, d };
    }
    return best ? order('build', { type, at: best.h }) : toward(type);
  };

  for (let guard = 0; guard < limit; guard += 1) {
    const S = town.staffing();
    const keep = town.keep();
    if (keep.level === 3 && castle === null) castle = town.state.day;
    if (castle !== null) break;
    const busy = town.state.projects.length >= town.projectSlots();

    const next = keep.level < 3 && !town.upgradeOf('keep') ? town.cut(KEEP_UP[keep.level + 1].cost) : null;
    if (next && !town.shortOf(next)) order('upgrade', { building: 'keep' });
    else if (!busy) {
      const room = town.comfortCap(S);
      const food = town.foodCap(S);
      const y = town.production(S);
      const need = next ?? {};
      const short = (res) => Math.max(0, (need[res] ?? 0) - town.state.stock[res]) / Math.max(1, y[res]);
      if (town.state.pop >= town.holds(S) - 4 && food <= room) build('fisher', NEAR.fisher) || build('farm', NEAR.farm) || build('hunter', NEAR.hunter);
      else if (town.state.pop >= town.holds(S) - 4) build('park', NEAR.park) || build('fountain', NEAR.fountain) || build('temple', NEAR.temple);
      else if (S.idle > 2) {
        const want = ['wood', 'stone', 'metal', 'empyrium'].sort((a, b) => short(b) - short(a))[0];
        const type = { wood: 'woodcutter', stone: 'quarry', metal: 'mine', empyrium: 'docks' }[want];
        /* An island short of a site trades for what it lacks instead. */
        if (!site(type) && !(town.standing('docks') ? false : site('docks'))) build('woodcutter', NEAR.woodcutter);
      } else {
        const up = town.state.buildings.find((b) => CAT[b.type].crew && !CAT[b.type].shop && !town.tierWhy(b) && !town.upgradeOf(b.id) && !town.shortOf(town.cut(upCost(b.type, b.level + 1).cost)));
        if (up) order('upgrade', { building: up.id });
      }
    }
    if (next && town.standing('docks')) {
      for (const res of ['empyrium', 'metal', 'stone', 'wood']) {
        const lack = (next[res] ?? 0) - town.state.stock[res];
        if (lack > 0 && town.state.stock.goods >= town.state.rules.goods[res]) order('trade', { res, n: Math.min(lack, 50) });
      }
    }
    town.passDay();
  }
  return { town, orders, castle };
}

const run = greedy();
for (const spec of ISLANDS) {
  const fief = spec.id === 'seaward' ? FIEF : foundFief('Pace', 1, spec.id);
  const played = spec.id === 'seaward' ? run : greedy(fief);
  const days = played.castle === null ? null : played.castle - fief.founded;
  say(`${spec.name}: the greedy player raised the Castle ${days === null ? 'never, in a year' : `on day ${days}`}, with ${played.town.state.pop} people`);
  check(days === null || days >= 90, `${spec.name}: the Castle is 90 days away or more (the greedy player made it in ${days})`);
  check(days !== null && days <= 365, `${spec.name}: and it can be reached inside a year`);
}
{
  const again = foldFief(FIEF, run.orders, run.town.state.day);
  check(JSON.stringify(again.state) === JSON.stringify(run.town.state), "the book the greedy player wrote replays into the town they played");
}
{
  /* A town of ten can build from its first day without starving. */
  const t = createTown(FIEF);
  t.apply({ seq: 1, day: 1, kind: 'build', data: { type: 'woodcutter', at: t.nearestFree('woodcutter', [-5, 4]) }, actor: 'Kael', character_id: 'c-kael' });
  for (let d = 0; d < 10; d += 1) t.passDay();
  check(t.state.pop >= FOUNDING.pop && t.state.buildings.some((b) => b.type === 'woodcutter'), 'a town of ten builds its first workplace and does not shrink doing it');
}

/* --------------------------------------------------------------------- the words */

const lines = run.town.state.log.map((l) => l.text).concat(t5.state.log.map((l) => l.text));
check(!lines.some((t) => /[–—]/.test(t)), 'no log line has an em or en dash');
const oxford = lines.filter((t) => /\w+, \w+(?: \w+)*, and /.test(t));
check(!oxford.length, `no log line has an Oxford comma${oxford.length ? `: ${oxford[0]}` : ''}`);

/* ---------------------------------------------------------------------- report */

if (LIST) console.log(notes.join('\n'));
if (findings.length) {
  console.error(`check-fief: ${findings.length} finding${findings.length === 1 ? '' : 's'}`);
  for (const f of findings) console.error(`  - ${f}`);
  if (!LIST) process.exit(1);
} else {
  const paces = notes.map((n) => /raised the Castle on day (\d+)/.exec(n)?.[1]).filter(Boolean).map(Number);
  console.log(`check-fief: six islands, the book, the hand and the pace hold. The greedy player raised the Castle in ${Math.min(...paces)} to ${Math.max(...paces)} days (--list for each island).`);
}
