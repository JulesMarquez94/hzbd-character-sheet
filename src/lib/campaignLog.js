import { requireSupabase, supabase } from './supabaseClient.js';
import { castLine } from './combatBar.js';
import { isFailure } from './dice.js';
import { isWeaponAttack } from './tricks.js';

/**
 * The event log: what happened at the table, as it happens.
 *
 * A sheet has always been a private thing. You cast a spell, four points left
 * your own pool, and the only person who knew was you and whoever was looking
 * over your shoulder. Sit that sheet at a campaign and the same cast becomes a
 * thing the table saw: "Kaelen cast Fireball", on every open copy of the party,
 * a second after the button was pressed.
 *
 * That is all this file is. One row per thing that happened, written by the
 * client that did it, read by everyone sitting at the same campaign.
 *
 * -------------------------------------------------------------- what a row is
 * An event is written down the way a card is: a name, a line under it and the
 * receipt behind it.
 *
 *   kind     'use', 'rest' or 'turn'. What sort of thing happened.
 *   actor    the name that did it, copied at the time. See the schema: a
 *            character can be renamed or deleted and the log still has to read.
 *   title    what was done: "Fireball", "Long Rest", "Turn 3".
 *   detail   the one line under it: what it cost, and where it was tapped.
 *   data     the receipt. The card id the row opens, the pools that moved, and
 *            whether the table waved the cost through.
 *
 * Nothing here is arithmetic and nothing reads it back to change a sheet. The
 * log is an account of writes that already happened, which is why writing one
 * can fail silently: a table that loses an event has lost a line of history,
 * and a sheet that refused to spend points because the log was unreachable
 * would have lost the game.
 *
 * ------------------------------------------------------- one action, N tables
 * A character may sit at any number of campaigns, so an action is written once
 * per table it is being played at. Each row is its own insert with its own
 * campaign on it, because every policy in the schema is about one campaign and
 * a row belonging to two would have nowhere to live.
 *
 * ---------------------------------------------------------------- the writers
 * Only the places that already spend something write here, and each of them
 * writes after its own patch has gone in: the quick bar, the loadout, a
 * creature's action bar, the brewing and enchanting windows, the two rests and
 * the turn button. That is the whole list, and it is the same list as the
 * places a player presses a button and something leaves a pool.
 */

/* --------------------------------------------------------------- the tables */

/**
 * Every campaign this character sits at, as `{ id, name }`.
 *
 * Read through the membership rather than through campaigns, because that is
 * the row the reader is allowed to see: a player reads the tables they sit at
 * and nobody else's. A viewer looking at somebody else's public sheet gets
 * nothing back, which is exactly right. The log is the table's, not the
 * internet's.
 */
export async function listTables(characterId) {
  if (!supabase || !characterId) return [];

  const { data, error } = await supabase
    .from('campaign_members')
    .select('campaign_id, campaigns ( id, name )')
    .eq('character_id', characterId);
  if (error) throw error;

  return (data ?? [])
    .filter((row) => row.campaigns)
    .map((row) => ({ id: row.campaign_id, name: row.campaigns.name }));
}

/* ---------------------------------------------------------------- the feed */

/** How many events a block holds before it asks for more. */
export const FEED_PAGE = 60;

/**
 * The newest events at a table, newest first.
 *
 * `before` is the seq of the oldest row already held, for the next page down.
 * Paged on seq rather than on the clock: two players acting in the same
 * millisecond must page consistently, and the count is the only thing every
 * reader agrees on.
 */
export async function listEvents(campaignId, { before = null, limit = FEED_PAGE } = {}) {
  const sb = requireSupabase();

  let query = sb
    .from('campaign_events')
    .select('*')
    .eq('campaign_id', campaignId)
    .order('seq', { ascending: false })
    .limit(limit);
  if (before) query = query.lt('seq', before);

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

/**
 * The newest words about the fight itself, however deep the feed has grown.
 *
 * A sheet reconstructing the running fight needs three moves and no others:
 * the last initiative (the order), the last fight-over (whether it still
 * stands) and the last turn call (who is up). Scanning the feed for them broke
 * the moment a table had a long evening — sixty rows of casts and throws
 * buried the initiative that was still live — so they are asked for by name,
 * newest first, straight off the move the row carries. See FightProvider.jsx.
 */
export async function listFightWords(campaignId, { limit = 12 } = {}) {
  const sb = requireSupabase();

  const { data, error } = await sb
    .from('campaign_events')
    .select('*')
    .eq('campaign_id', campaignId)
    .eq('kind', 'turn')
    .in('data->>move', ['initiative', 'fight-over', 'your-turn'])
    .order('seq', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

/**
 * Empty a table's log, and hand back how many rows went.
 *
 * The one deliberate hole in "insert only", and the Game Master's alone: see
 * `clear_campaign_log` in the schema, where the check lives. A table that has
 * played six sessions carries six sessions of arithmetic, and starting a new
 * chapter should not mean scrolling past the last one forever.
 *
 * This one does *not* swallow its failure, unlike every write above it. A use
 * whose log row is lost has still happened; a clear that quietly did nothing
 * leaves somebody looking at a log they just asked to be rid of.
 */
export async function clearLog(campaignId) {
  const sb = requireSupabase();
  const { data, error } = await sb.rpc('clear_campaign_log', { campaign: campaignId });
  if (error) throw error;
  return Number(data) || 0;
}

/**
 * The line the cleared log opens with, so an empty block says who emptied it.
 *
 * Written after the delete rather than by it, as an ordinary event: every open
 * copy of the block hears the same insert everything else arrives on, and reads
 * itself again on the strength of it. That is what clears the other screens at
 * the table, since a delete sends no word of its own.
 */
export function logClearedEvent(by, gone = 0) {
  return {
    kind: 'turn',
    actor: by || 'The table',
    title: 'The log was cleared',
    detail:
      gone > 0
        ? `${gone} ${gone === 1 ? 'entry' : 'entries'} went. Everything from here is new.`
        : 'Everything from here is new.',
    data: { move: 'log-cleared', gone },
  };
}

/**
 * Write one event to every table a character sits at.
 *
 * Swallows its own failure on purpose. See the note at the top: the points have
 * already left the pool by the time this runs, and an unreachable log must not
 * turn a use that happened into an error the player has to read.
 */
export async function postEvent(tables, event) {
  if (!supabase || !event || tables.length === 0) return;

  const rows = tables.map((table) => eventRow(table.id, event));

  const { error } = await supabase.from('campaign_events').insert(rows);
  if (error) console.warn('The table log refused an event:', error.message);
}

/** One event as the row the table stores. The only place the shape is written. */
function eventRow(campaignId, event) {
  return {
    campaign_id: campaignId,
    character_id: event.characterId ?? null,
    kind: event.kind,
    actor: event.actor ?? '',
    title: event.title ?? '',
    detail: event.detail ?? '',
    data: event.data ?? {},
  };
}

/**
 * Take the one reaction slot an action has, or find it already taken.
 *
 * "Don't allow more than 1 reaction per action. As soon as someone reacts, that
 * person takes his reaction" (Jules, 2026-09-01). Everybody else's banner clears
 * the moment an open lands, which settles it whenever one person is a second
 * ahead of another. This settles the other case, where two readers press at the
 * same instant and neither has seen the other yet.
 *
 * The claim is the log's own count. The row goes in, and then the *oldest* open
 * against this action is read back: the sequence the table already agrees on is
 * the arbiter, so exactly one of the two pressers is told they have it and the
 * other stands back. Nothing new is stored and nothing is locked.
 *
 * Comes back true for the reader who has the reaction, false for the one who
 * lost it by a hair. A log that cannot be read at all answers true: a table
 * whose network is failing should not be a table where nobody may react.
 */
export async function claimReaction(campaignId, event) {
  if (!supabase || !campaignId || !event?.data?.chain) return true;

  const { error } = await supabase.from('campaign_events').insert([eventRow(campaignId, event)]);
  if (error) {
    console.warn('The table log refused a reaction:', error.message);
    return true;
  }

  const { data, error: read } = await supabase
    .from('campaign_events')
    .select('data')
    .eq('campaign_id', campaignId)
    .eq('kind', 'react')
    .eq('data->>chain', event.data.chain)
    .eq('data->>move', 'open')
    .order('seq', { ascending: true })
    .limit(1);
  if (read) return true;

  const first = data?.[0]?.data?.key ?? null;
  return first === null || first === event.data.key;
}

/* ------------------------------------------------------------ what happened */

/**
 * A confirmed use, as an event.
 *
 * Built from the same `request` the prompt was raised with and the same numbers
 * `spendUse` charged, so the log cannot say a different thing happened than the
 * one the sheet paid for. `price` is what the card's second half settled on
 * where there was one, exactly as in combatBar.js.
 *
 * `moves` is the Martial Moves added to a weapon attack, by name. They are part
 * of what was done rather than a separate act: since 2026-09-02 a move is not its
 * own use, so it writes no row of its own and "Strike" alone would be the log
 * losing the half of the swing the player chose. See UsePrompt.jsx.
 */
export function playEvent(
  request,
  character,
  mode,
  amount,
  { free = false, price = null, chain = null, targets = [], moves = [] } = {}
) {
  const ap = Number(price?.ap ?? amount ?? request?.ap) || 0;
  const wp = Number(price?.wp ?? request?.wp) || 0;
  const health = Math.max(0, Number(price?.health) || 0);

  const spent = [];
  if (ap > 0) spent.push(`${ap} ${mode === 'reaction' ? 'Reaction' : 'Action'} ${ap === 1 ? 'Point' : 'Points'}`);
  if (wp > 0) spent.push(`${wp} Willpower`);
  if (health > 0) spent.push(`${health} Health`);

  /* Anticipate spends nothing at all: the points cross from one pool into the
     other. A log that called that a spend would be the only place on the site
     that misreads it. See `converts` in actions.js. */
  const moved = request?.converts === 'reaction';

  const lasts = castLine(request);
  const detail = [
    /* What rode the swing, first, because it is the only part of this line that
       is about *what happened* rather than about what it cost. */
    moves.length > 0 ? `with ${listAnd(moves)}` : null,
    free
      ? 'Waved through by the table'
      : moved
        ? `Moved ${ap} Action ${ap === 1 ? 'Point' : 'Points'} into Reaction`
        : spent.length > 0
          ? `Spent ${listAnd(spent)}`
          : 'Spent nothing',
    /* Who it was aimed at, when the prompt was told. The row is the table's
       account of the act, and "at 2.Fenrat" is half of what happened. */
    targets.length > 0 ? `at ${listAnd(targets.map((entry) => entry.name))}` : null,
    lasts ? `lasts ${lasts}` : null,
    request?.source ?? null,
  ]
    .filter(Boolean)
    .join(' · ');

  return {
    kind: 'use',
    actor: character?.name ?? '',
    title: request?.name ?? 'Something',
    detail,
    data: {
      /* Set when this use is about to raise dice, so the throws that follow can
         be gathered back under it. Null when nothing is going to be rolled, and
         a head with no throws is simply a row. See newChain. */
      chain,
      /* Copied in for the same reason `actor` is, and the schema's note about
         that covers this too: a character can be renamed, redrawn or deleted, and
         a log that then shows the wrong face beside the right name has lost the
         only thing worth keeping. Rows written before this read as initials. */
      portrait: character?.portrait_url ?? null,
      card: request?.card?.id ?? null,
      verb: verbFor(request?.card),
      mode,
      ap,
      wp,
      health,
      free: Boolean(free),
      ...(targets.length > 0
        ? {
            targets: targets.map((entry) => ({
              kind: entry.kind,
              ref: entry.kind === 'member' ? null : entry.id,
              character: entry.kind === 'member' ? entry.id : null,
              name: entry.name,
            })),
          }
        : {}),
    },
  };
}

/**
 * Which word the feed uses for a card being played.
 *
 * Three, and no more: a spell is cast, a weapon attack is swung, and everything
 * else is used. The distinction is worth having because the log is read at a
 * glance in the middle of a fight, and "cast" and "attacked with" are the two
 * things anybody scanning it is looking for.
 */
function verbFor(card) {
  if (card?.kind === 'spell') return 'cast';
  if (isWeaponAttack(card)) return 'attacked with';
  return 'used';
}

/** A rest taken, as an event. What it cost is on the plan, not worked out here. */
export function restEvent(kind, character, { action = null, supplies = 0 } = {}) {
  const label = kind === 'long' ? 'Long Rest' : 'Short Rest';
  const detail = [
    supplies > 0 ? `${supplies} Supplies` : 'No Supplies',
    action ? `spent the night on ${action}` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return {
    kind: 'rest',
    actor: character?.name ?? '',
    title: label,
    detail,
    data: { rest: kind, action, supplies },
  };
}

/**
 * A turn boundary crossed, as an event.
 *
 * The one kind of event that is about the clock rather than about a card, and
 * the reason the log reads as a fight rather than as a list: "Turn 3" between
 * two casts is what tells a reader they were on the same turn.
 */
export function turnEvent(move, character, turn) {
  /* The count as the press *leaves* it, not as it found it: starting a turn is
     the count going up, so a log written off `turn.n` would name the turn that
     just finished. See startTurn in combatTurn.js. */
  const now = Math.max(0, Math.floor(Number(turn?.n) || 0));
  const count = move === 'turn' ? now + 1 : now;

  const said = {
    combat: { title: 'Entered combat', detail: 'The count starts' },
    turn: { title: `Turn ${count}`, detail: 'Points back, effects ticked' },
    end: { title: `Ended turn ${count}`, detail: 'Whatever ends here, ends' },
    reset: { title: 'Left combat', detail: 'The count goes back to nothing' },
  }[move];
  if (!said) return null;

  return {
    kind: 'turn',
    actor: character?.name ?? '',
    title: said.title,
    detail: said.detail,
    data: { move, count },
  };
}

/* ------------------------------------------------------ the fight, announced
 *
 * "when you have built an encounter you can run it which will take control of
 * the character turn start and end", Jules, 2026-08-31.
 *
 * A Game Master cannot write to a player's sheet. RLS says so and so does every
 * page on this site: a sheet is the only writer of its own numbers. So the
 * runner does not push a turn onto anybody, it **announces** one, here, on the
 * table log every seated sheet is already reading. The player's own client sees
 * its own id go by, starts its own turn through its own patch, and puts the call
 * on the screen.
 *
 * Four rows, and the order they appear in is the fight:
 *
 *   initiative  the order, rolled. Written by the Game Master as the table.
 *   your-turn   whose turn it is now. Also the table's, with the character it
 *               names in `data` rather than on the row: a Game Master may not
 *               write a row *as* somebody else's character, and must not be able
 *               to. `claim_event_actor` in schema.sql is what enforces that.
 *   ended       a player saying they are done. Written by the player, as
 *               themselves, which is the one row in the fight that is.
 *   fight-over  the run stopped.
 *
 * All four are `kind: 'turn'`, so the log block draws them with the rows the
 * sheet's own turn button already writes, and `groupEvents` gathers everything
 * that happened during one of them underneath it. See bundleTurns in
 * logChain.js.
 */

/** The order, rolled. `order` is the run's own, already sorted. */
export function initiativeEvent(order = [], { encounter = null } = {}) {
  const names = order.slice(0, 4).map((entry) => entry.name);
  const rest = order.length - names.length;

  return {
    kind: 'turn',
    actor: 'The table',
    title: 'Initiative',
    detail:
      order.length === 0
        ? 'Nobody is in the fight'
        : `${listAnd(names)}${rest > 0 ? ` and ${rest} more` : ''}`,
    data: {
      move: 'initiative',
      encounter,
      /* `ref` rides along so a later reader can point back at a body in this
         fight — a foe's key, a character's id — not just say its name, the
         rank is what colours its chip on a sheet that cannot read the
         encounter row, and `defenses` is what arms an aimed check with its own
         DC. That last one is a ruling as much as a field: the three numbers a
         roll is judged by cross to the players' clients, the pools still do
         not. Rows written before these were here simply have less to point
         with. See FightProvider.jsx, which is the reader. */
      order: order.map((entry) => ({
        kind: entry.kind,
        ref: entry.ref,
        name: entry.name,
        init: entry.init,
        ...(entry.rank ? { rank: entry.rank } : {}),
        ...(entry.defenses ? { defenses: entry.defenses } : {}),
      })),
    },
  };
}

/**
 * Whose turn it is now.
 *
 * The character is in `data` and never on the row, for the reason above. A
 * player's client matches on `data.character`; everybody else reads a line
 * saying whose turn it is, which is worth having on its own.
 */
export function turnCallEvent(entry, round, { encounter = null } = {}) {
  const isPlayer = entry?.kind === 'member';

  return {
    kind: 'turn',
    actor: entry?.name ?? 'Someone',
    title: `Turn ${round}`,
    detail: isPlayer ? 'It is their turn' : 'The Game Master is playing this one',
    data: {
      move: 'your-turn',
      encounter,
      round,
      /* Only for a player. A foe's turn is announced so the log reads as a
         fight, and there is no sheet for it to reach. */
      character: isPlayer ? entry.ref : null,
      side: entry?.kind ?? 'foe',
    },
  };
}

/** A player saying they are done. Written by the player, as themselves. */
export function turnDoneEvent(character, round) {
  return {
    kind: 'turn',
    actor: character?.name ?? '',
    title: `Ended turn ${round}`,
    detail: 'Whatever ends here, ends',
    data: { move: 'ended', round, character: character?.id ?? null },
  };
}

/* ---------------------------------------------------------------- the stack
 *
 * "If a reaction is clicked on, it opens a window to choose the action they
 * want to take, and pauses the roll of the reacted action. Actions resolve in
 * the order they are put on the stack; movement is the only exception, as it
 * happens last." Jules, 2026-09-01.
 *
 * Three rows carry the whole of it, tied to the reacted action by its chain id
 * — the same client-minted id its own throws hang under:
 *
 *   open    somebody stepped in. The actor's gate pauses its countdown and
 *           says who. `key` names this one reaction, so two reactors can hold
 *           one action and release it one at a time.
 *   done    the reaction was taken (its price paid). One fewer hold; when the
 *           last lifts, the actor's gate asks the fail question.
 *   pass    the reactor stepped back out without acting, or picked a movement
 *           — movement resolves after the action, so it never holds it. A
 *           pass lifts the hold without earning a fail question.
 *
 * And the verdict the question can end in:
 *
 *   failed  the action is off. The cost stays spent — pressing use was the
 *           decision, the reaction is what undid the consequence — and the
 *           row says so for the whole table.
 *
 * ------------------------------------------------- the chain is the address
 * All four ride in `data.chain`, which is the reacted action's own id and not
 * this row's. That is the field the gate matches on (see watchStack), the field
 * the one-reaction claim counts on (see claimReaction), and the field the log
 * groups on — so "reacting" is part of the action's block rather than three
 * loose rows beside it, which is what Jules asked for on 2026-09-02. One id,
 * one meaning: it used to be `data.to` here and `data.chain` everywhere else,
 * and rows written before the rename are the one thing that will not gather.
 */

export function reactEvent(move, { chain = null, key = null, by = '' } = {}) {
  const said = {
    open: { title: 'Reacting', detail: 'The roll holds while they choose' },
    done: { title: 'Reaction taken', detail: 'The stack resolves it first' },
    pass: { title: 'Stood back', detail: 'The roll is released' },
  }[move];
  if (!said) return null;

  return {
    kind: 'react',
    actor: by || 'Someone',
    title: said.title,
    detail: said.detail,
    data: { move, chain, key },
  };
}

/** The fail question answered against the action: it fizzles, the cost stays. */
export function reactionFailedEvent(character, name, { failed = [], chain = null } = {}) {
  return {
    kind: 'react',
    actor: character?.name ?? '',
    title: failed.length > 0 ? `${name} fails against ${listAnd(failed)}` : `${name} fails`,
    detail: 'Undone by the reaction · the cost stays spent',
    data: { move: 'failed', chain, card: null, failed },
  };
}

/**
 * The curtain moved: enemy health shown to the table, or hidden again.
 *
 * Written when the Game Master flips the encounter's checkbox, for two readers:
 * the table, which deserves the announcement, and every seated sheet's
 * FightProvider, which refetches what it may see on hearing it — a row that
 * stops being readable sends no realtime word of its own, so this is the word.
 */
export function shareEvent(on, { encounter = null } = {}) {
  return {
    kind: 'turn',
    actor: 'The table',
    title: on ? 'Enemy health shown' : 'Enemy health hidden',
    detail: on
      ? 'The chips on every seated sheet carry the enemies’ bars now'
      : 'The enemies’ bars are the Game Master’s again',
    data: { move: 'share', encounter, on: Boolean(on) },
  };
}

/** The run stopped, either because it is over or because it was called off. */
export function fightOverEvent({ encounter = null, rounds = 0 } = {}) {
  return {
    kind: 'turn',
    actor: 'The table',
    title: 'The fight ends',
    detail: rounds > 0 ? `After ${rounds} ${rounds === 1 ? 'round' : 'rounds'}` : 'Called off',
    data: { move: 'fight-over', encounter, rounds },
  };
}

/* ------------------------------------------------------ the fight, delivered
 *
 * "When an ability is cast that affects an entity with an effect, this effect
 * needs to populate on the target trackers", and "Health, shield and other
 * changes by spells and abilities need to be auto applied based on the result."
 * Jules, 2026-09-01.
 *
 * The same wall stands here that stood for the turn call: a Game Master cannot
 * write a player's sheet. So what lands on a player is **delivered** the way a
 * turn is — an event on the table log, with the characters it names in `data`,
 * and each named player's own client applies it through its own patch. The
 * schema planned for exactly this ("the channel the plan builds targeted
 * casting on later"): an event is already the whole account of an action, so a
 * delivery is a reader of these rows rather than a second table.
 *
 * A delivery names every body it landed on, players and enemies alike, because
 * the row is also the table's record of what happened. Only the players in the
 * list are *deliveries*; the enemies were written directly onto the encounter
 * row by the Game Master's own page before this row was posted.
 *
 * Double delivery is harmless by construction. An effect lands through
 * `layEffect`, which refreshes a row rather than doubling it, and a pool change
 * is guarded by the row id the way a turn call is: a client that has seen this
 * event id acts on it once.
 */

/* ------------------------------------------------------- and where they sit
 *
 * Every row below takes the `chain` of the use that caused it, and every one of
 * them used to take none. That was the whole of "an attack should not be 3
 * entries in the log" (Jules, 2026-09-02): the verdicts, the deliveries and the
 * effect are all rows *about* one action, and a row with no chain on it is a row
 * the log has to draw as an action of its own. With the id on them they gather
 * into the block the use already heads. See UNDER in logChain.js.
 *
 * Null is still allowed and still means what it says: a tracked effect rolled
 * off its own row on the encounter page has no use above it, so its delivery is
 * genuinely its own entry.
 */

/**
 * An effect laid on somebody's tracker.
 *
 * `effect` is the same entry `castEffect` would have laid on the caster —
 * name, card, turns, until, from — relaid at the far end by whoever it names.
 */
export function effectLaidEvent(caster, effect, targets = [], { chain = null } = {}) {
  const lasts = effect?.turns
    ? `${effect.turns} ${effect.turns === 1 ? 'turn' : 'turns'}`
    : effect?.until
      ? `until a ${effect.until} rest`
      : 'until it ends';

  return {
    kind: 'effect',
    actor: caster?.name ?? '',
    title: effect?.name ?? 'An effect',
    detail: `On ${listAnd(targets.map((entry) => entry.name))} · ${lasts}`,
    data: {
      move: 'effect',
      chain,
      portrait: caster?.portrait ?? null,
      card: effect?.card ?? null,
      effect,
      targets: targets.map((entry) => ({
        kind: entry.kind,
        ref: entry.kind === 'member' ? null : entry.id,
        character: entry.kind === 'member' ? entry.id : null,
        name: entry.name,
      })),
    },
  };
}

/**
 * One roll, judged per body: who was hit, who was critically hit, who dodged.
 *
 * "On multiple targets, the roll goes against all the different entities. So
 * it should show a list of hit entities, critically hit entities and missed"
 * (Jules, 2026-09-01). The roll row above this one carries the total; this row
 * is the total read against everybody it was aimed at, which is the sentence
 * somebody says out loud at the table.
 */
export function verdictEvent(caster, name, outcomes = [], { chain = null } = {}) {
  const crits = outcomes.filter((entry) => entry.verdict === 'critical-success');
  const hits = outcomes.filter((entry) => entry.verdict === 'success');
  const missed = outcomes.filter((entry) => isFailure(entry.verdict));

  const parts = [];
  if (crits.length > 0) parts.push(`critically hit ${listAnd(crits.map((entry) => entry.name))}`);
  if (hits.length > 0) parts.push(`hit ${listAnd(hits.map((entry) => entry.name))}`);
  if (missed.length > 0) parts.push(`missed ${listAnd(missed.map((entry) => entry.name))}`);
  const said = parts.join(', ') || 'landed on nobody';

  return {
    kind: 'verdict',
    actor: caster?.name ?? '',
    title: said[0].toUpperCase() + said.slice(1),
    detail: [name, 'one roll, judged against each'].filter(Boolean).join(' · '),
    data: {
      move: 'verdict',
      chain,
      portrait: caster?.portrait ?? null,
      card: caster?.card?.id ?? null,
      outcomes: outcomes.map((entry) => ({
        kind: entry.kind,
        ref: entry.kind === 'member' ? null : entry.id,
        character: entry.kind === 'member' ? entry.id : null,
        name: entry.name,
        dc: entry.dc,
        verdict: entry.verdict,
      })),
    },
  };
}

/**
 * A rolled result landed on bodies: the pools that moved, per body.
 *
 * `targets` is `[{ kind, id, name, landings }]` — the landings are the rolled
 * numbers with the caster's arithmetic *not* done, because Armor belongs to
 * whoever is hit and each client reads its own. What the row prints is the
 * rolled total; what each body loses is that body's own business, worked out
 * where its pools live.
 */
export function appliedEvent(caster, delta, targets = [], { chain = null } = {}) {
  const verb = delta.kind === 'damage' ? 'dealt' : 'gave';
  const words =
    delta.kind === 'damage'
      ? [delta.total, delta.types?.join(' or '), 'damage'].filter(Boolean).join(' ')
      : `${delta.total} ${delta.kind === 'healing' ? 'Health' : 'Shield'}`;

  return {
    kind: 'apply',
    actor: caster?.name ?? '',
    title: words,
    detail: `To ${listAnd(targets.map((entry) => entry.name))}${caster?.card ? ` · ${caster.card.name}` : ''}`,
    data: {
      move: 'apply',
      chain,
      portrait: caster?.portrait ?? null,
      card: caster?.card?.id ?? null,
      verb,
      kind: delta.kind,
      types: delta.types ?? [],
      targets: targets.map((entry) => ({
        kind: entry.kind,
        ref: entry.kind === 'member' ? null : entry.id,
        character: entry.kind === 'member' ? entry.id : null,
        name: entry.name,
        landings: entry.landings,
      })),
    },
  };
}

/* ------------------------------------------------------------- reading it */

/** "17:42" for today, "Aug 29, 17:42" for anything older. */
export function eventStamp(event) {
  const date = new Date(event?.created_at ?? '');
  if (Number.isNaN(date.getTime())) return '';

  const time = date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  const today = new Date();
  const sameDay =
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();
  if (sameDay) return time;

  return `${date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}, ${time}`;
}

/** The sentence a row prints: who, what they did to it, and what it was. */
export function eventWords(event) {
  if (event?.kind === 'use') return event.data?.verb ?? 'used';
  if (event?.kind === 'rest') return 'took a';
  /* Only ever read for a row standing on its own: a throw nested under its use
     is drawn by the chain and takes the step's name rather than a sentence. */
  if (event?.kind === 'roll') return 'rolled';
  // The two delivery rows: "2.Fenrat laid Withering Mark", "2.Fenrat dealt 14
  // Fire damage". The verb was decided when the row was written.
  if (event?.kind === 'effect') return 'laid';
  if (event?.kind === 'apply') return event.data?.verb ?? 'dealt';
  // The stack's rows carry their whole sentence in the title: "Kaelen —
  // Reacting", "Lark — Fireball fails".
  if (event?.kind === 'react') return '';
  return '';
}

/** "a, b and c". No Oxford comma, the way every list on the sheet is written. */
function listAnd(words) {
  if (words.length <= 1) return String(words[0] ?? '');
  return `${words.slice(0, -1).join(', ')} and ${words[words.length - 1]}`;
}
