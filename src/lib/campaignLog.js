import { requireSupabase, supabase } from './supabaseClient.js';
import { castLine } from './combatBar.js';
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
 * Write one event to every table a character sits at.
 *
 * Swallows its own failure on purpose. See the note at the top: the points have
 * already left the pool by the time this runs, and an unreachable log must not
 * turn a use that happened into an error the player has to read.
 */
export async function postEvent(tables, event) {
  if (!supabase || !event || tables.length === 0) return;

  const rows = tables.map((table) => ({
    campaign_id: table.id,
    character_id: event.characterId ?? null,
    kind: event.kind,
    actor: event.actor ?? '',
    title: event.title ?? '',
    detail: event.detail ?? '',
    data: event.data ?? {},
  }));

  const { error } = await supabase.from('campaign_events').insert(rows);
  if (error) console.warn('The table log refused an event:', error.message);
}

/* ------------------------------------------------------------ what happened */

/**
 * A confirmed use, as an event.
 *
 * Built from the same `request` the prompt was raised with and the same numbers
 * `spendUse` charged, so the log cannot say a different thing happened than the
 * one the sheet paid for. `price` is what the card's second half settled on
 * where there was one, exactly as in combatBar.js.
 */
export function playEvent(
  request,
  character,
  mode,
  amount,
  { free = false, price = null, chain = null } = {}
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
    free
      ? 'Waved through by the table'
      : moved
        ? `Moved ${ap} Action ${ap === 1 ? 'Point' : 'Points'} into Reaction`
        : spent.length > 0
          ? `Spent ${listAnd(spent)}`
          : 'Spent nothing',
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
      card: request?.card?.id ?? null,
      verb: verbFor(request?.card),
      mode,
      ap,
      wp,
      health,
      free: Boolean(free),
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
  return '';
}

/** "a, b and c". No Oxford comma, the way every list on the sheet is written. */
function listAnd(words) {
  if (words.length <= 1) return String(words[0] ?? '');
  return `${words.slice(0, -1).join(', ')} and ${words[words.length - 1]}`;
}
