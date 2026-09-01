import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Modal from '../Modal.jsx';
import ApplyWindow from './ApplyWindow.jsx';
import DiceTable from './DiceTable.jsx';
import EnemyBlock from './EnemyBlock.jsx';
import FoeTurnPrompt from './FoeTurnPrompt.jsx';
import LogBlock from './LogBlock.jsx';
import RunBlock from './RunBlock.jsx';
import { CampaignLogContext } from '../../context/campaign-log.js';
import { useDiceTray } from '../../context/dice-tray.js';
import {
  appliedEvent,
  effectLaidEvent,
  fightOverEvent,
  initiativeEvent,
  postEvent,
  turnCallEvent,
} from '../../lib/campaignLog.js';
import { levelForXp, liveCharacter } from '../../lib/characterModel.js';
import { aimHits, applyPlan, clauseAim } from '../../lib/combatApply.js';
import { dropEffect, layEffect, tickEffects } from '../../lib/combatTurn.js';
import {
  CREATURE_MAX_LEVEL,
  RANKS,
  bestiary,
  clampCreatureLevel,
  creatureStats,
  difficultyLine,
} from '../../lib/creatures.js';
import {
  FOES_MAX,
  addFoes,
  advanceRun,
  applyToFoes,
  createEncounter,
  crossTurn,
  deleteEncounter,
  dropFoe,
  dropFromOrder,
  encounterState,
  encounterTally,
  endRun,
  foeActor,
  foeTurnStart,
  layOnFoes,
  listEncounters,
  normalizeFoes,
  normalizeRun,
  resetEncounter,
  rollInitiative,
  setFoeEffects,
  stepFoePool,
  updateEncounter,
} from '../../lib/encounters.js';
import { turnTriggers } from '../../lib/turnTriggers.js';
import { getCard } from '../../lib/weapons.js';
import { subscribeToTable } from '../../lib/realtime.js';

/**
 * The encounters a Game Master has prepared for this campaign, and the fights
 * they become.
 *
 * Jules, 2026-09-01: "the encounters page should show encounter blocks, which
 * are a type of block that show the enemies in it and notes from the DM.
 * Clicking it should then open the encounter view, and from there the DM
 * should be able to start combat."
 *
 * So the tab is two views now. The **shelf**: one block per encounter, the
 * name, the notes and the pile at a glance, and nothing on it is live. The
 * **encounter view** behind a click: the head that edits it, the initiative
 * and turn manager block beside the DM Log block, and the double blocks of
 * everybody in the pile. Start combat lives in the view, because a fight is a
 * thing you start looking at the bodies in it.
 *
 * ---------------------------------------------------------------- the manager
 * Once a fight is live the view manages it rather than merely counting it:
 *
 *   targeting   a use that reaches other bodies offers the fight's roster in
 *               the prompt, capped at what the card's own text counts, raised
 *               by a Multicast as it is dialled. See targeting.js.
 *   effects     a card that lays something lays it on whoever was picked — an
 *               enemy's tracker directly, a player's by delivery over the log,
 *               their own client writing their own sheet. See TurnCall.jsx.
 *   the rolls   when the chain settles, the apply window opens over the picked
 *               targets and lands the numbers: Armor per landing, Shield
 *               soaking, Health taking the rest. Enemies in one patch, players
 *               by delivery.
 *   boundaries  Next stops at an enemy's turn boundary when anything running
 *               on it names one, exactly as a player's own sheet stops, with a
 *               Roll beside every clause that rolls. See FoeTurnPrompt.jsx.
 *
 * ---------------------------------------------------------------- the writing
 * The encounter row is this tab's to save and the campaign row is the page's,
 * so this keeps its own debounced pipeline rather than borrowing the page's: a
 * Health step is one write per press and a typed name is one per pause, and
 * neither should ever be batched into the other row's patch.
 *
 * Writes leave one at a time behind a promise chain, exactly as the sheet's do,
 * so a slow link cannot land two Health steps in the wrong order.
 *
 * -------------------------------------------------------------- and the table
 * An enemy playing a card writes to the campaign log, and it writes as the
 * *table* rather than as a character: `character_id` null, which the schema
 * allows the Game Master alone. The provider below is what makes the enemy
 * block's `usePlayCard` find a log at all, and DiceTable is what makes its
 * dice land in the feed the way a player's do.
 */

/** The one press per player turn: the Overlord's own rule. */
const TURN_LABEL = 'A player took a turn';

export default function EncounterTab({ campaign, members = [], canEdit, unit = 'metric' }) {
  const campaignId = campaign?.id;
  const tray = useDiceTray();

  const [encounters, setEncounters] = useState([]);
  const [openId, setOpenId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(false);
  const [gains, setGains] = useState(null);
  /* An enemy's turn boundary with something waiting on it, held while the
     prompt is up. See handleNext. */
  const [boundary, setBoundary] = useState(null);
  /* A settled chain waiting to land on bodies. See handleResults. */
  const [apply, setApply] = useState(null);

  /* One pending patch per encounter id, because a Game Master can move between
     two of them faster than the debounce, and a patch that followed the
     selection would land on the wrong pile. */
  const pendingRef = useRef(new Map());
  const timerRef = useRef(null);
  const flightRef = useRef(Promise.resolve());

  /**
   * The rows again, held in a ref that moves on the write rather than on the
   * render.
   *
   * Every writer in encounters.js takes an encounter and hands back a whole new
   * `foes` list built from it, which is only correct if it is handed the newest
   * one. Three taps of +1 in the shelf land in a single React batch: read the
   * encounter off the render and all three build their list from the same
   * starting point, so two of the three adds are silently lost. Found by
   * pressing it.
   *
   * So `setRows` is the only way the list moves, and it moves the ref first.
   * `patchEncounter` reads the ref, which is always the answer to the press
   * before this one.
   */
  const rowsRef = useRef([]);
  const setRows = useCallback((next) => {
    rowsRef.current = typeof next === 'function' ? next(rowsRef.current) : next;
    setEncounters(rowsRef.current);
  }, []);

  const read = useCallback(() => {
    if (!campaignId) return;
    listEncounters(campaignId)
      .then((rows) => {
        /* The server's copy, except where this screen is still holding an edit
           it has not written yet. The Game Master is the only writer *and* the
           only reader here, so their own writes echo back over the
           subscription: a refetch triggered by the echo of the *previous* write
           would land the older `foes` on top of the Health step still sitting in
           the debounce, and the block would visibly jump back before jumping
           forward again. The sheet keeps the same guard by not subscribing an
           editor at all; this one needs the subscription for the second screen,
           so it guards on the pending write instead. */
        setRows((prev) =>
          rows.map((row) => {
            if (!pendingRef.current.has(row.id)) return row;
            const held = prev.find((entry) => entry.id === row.id);
            return held ? { ...row, ...pendingRef.current.get(row.id) } : row;
          })
        );
        setError('');
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [campaignId, setRows]);

  useEffect(read, [read]);

  /* Live, so a Game Master with the fight open on a tablet and the map on a
     laptop is looking at the same Health on both. */
  useEffect(() => {
    if (!campaignId) return undefined;
    return subscribeToTable({
      table: 'encounters',
      filter: `campaign_id=eq.${campaignId}`,
      onChange: read,
      onResync: read,
    });
  }, [campaignId, read]);

  const flush = useCallback(async () => {
    const pending = pendingRef.current;
    pendingRef.current = new Map();
    if (pending.size === 0) return;

    for (const [id, patch] of pending) {
      const write = flightRef.current.then(() => updateEncounter(id, patch));
      flightRef.current = write.catch(() => {});
      try {
        await write;
      } catch (err) {
        // Put the failed fields back so the next flush retries them. Anything
        // edited while the write was in flight wins over the failed value.
        const held = pendingRef.current.get(id) ?? {};
        pendingRef.current.set(id, { ...patch, ...held });
        setError(err.message);
      }
    }
  }, []);

  /**
   * Optimistic local update plus a debounced write, keyed on the encounter.
   *
   * `partial` may be an object or **a function of the current row**, and every
   * writer that builds a new `foes` list has to use the second form: see the
   * note on `rowsRef`. A function that hands back nothing is a write that turned
   * out to have nothing to do, which is what the writers return when a press
   * changes nothing.
   */
  const patchEncounter = useCallback(
    (id, partial) => {
      if (!canEdit || !id) return;

      const current = rowsRef.current.find((row) => row.id === id);
      if (!current) return;

      const body = typeof partial === 'function' ? partial(current) : partial;
      if (!body || Object.keys(body).length === 0) return;

      setRows((prev) => prev.map((row) => (row.id === id ? { ...row, ...body } : row)));

      const held = pendingRef.current.get(id) ?? {};
      pendingRef.current.set(id, { ...held, ...body });
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(flush, 500);
    },
    [canEdit, flush, setRows]
  );

  // Never lose the last press when leaving the tab.
  useEffect(
    () => () => {
      clearTimeout(timerRef.current);
      if (pendingRef.current.size > 0) flush();
    },
    [flush]
  );

  /* Which encounter is open. The shelf when none is: an encounter deleted on
     another screen closes this view rather than leaving it drawing nothing. */
  const open = useMemo(
    () => encounters.find((row) => row.id === openId) ?? null,
    [encounters, openId]
  );

  const foes = useMemo(() => (open ? encounterState(open) : []), [open]);
  const patch = useCallback((partial) => patchEncounter(open?.id, partial), [patchEncounter, open]);

  /* The table's own voice. An enemy's use and every announcement the runner
     makes are written with no character on them, which is what the schema calls
     the table speaking. `canEdit` is the guard: only the Game Master may write
     one, and the trigger refuses anybody else anyway. */
  const log = useCallback(
    (event) => {
      if (!canEdit || !event || !campaignId) return;
      postEvent([{ id: campaignId, name: campaign?.name ?? '' }], { ...event, characterId: null });
    },
    [campaignId, campaign?.name, canEdit]
  );

  const logValue = useMemo(
    () => ({
      tables: campaignId ? [{ id: campaignId, name: campaign?.name ?? '' }] : [],
      log,
    }),
    [campaignId, campaign?.name, log]
  );

  const handleCreate = async () => {
    try {
      const row = await createEncounter(campaignId, {
        name: `Encounter ${encounters.length + 1}`,
      });
      setRows((prev) => [...prev, row]);
      setOpenId(row.id);
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (row) => {
    try {
      await deleteEncounter(row.id);
      setRows((prev) => prev.filter((entry) => entry.id !== row.id));
      pendingRef.current.delete(row.id);
      setOpenId(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleTurn = () => {
    /* Worked out against the row the patch is about to be applied to, not
       against the render's, and the lines it reports come back out of the same
       call. See the note on `rowsRef`. */
    let said = null;
    patch((row) => {
      const rolled = crossTurn(row, { tick: tickEffects });
      said = rolled?.gains ?? null;
      return rolled?.patch ?? null;
    });
    setGains(said ?? ['Nothing to give. No Overlord here, or every one of them is full.']);
  };

  /* ------------------------------------------------------------- the fight */

  const run = useMemo(() => normalizeRun(open?.run), [open?.run]);
  const up = run.live ? (run.order[run.at] ?? null) : null;

  /** Everybody at the table, as the order and the roster want them. Off
      `liveCharacter`, so a worn enchantment's Instinct counts — and the pools
      too, because their chips are their Health bars now. */
  const seats = useMemo(
    () =>
      (members ?? [])
        .filter((member) => member.characters)
        .map((member) => {
          const shown = liveCharacter(member.characters);
          return {
            character_id: member.character_id,
            name: shown.name,
            initiative: shown.initiative,
            xp: shown.xp,
            health: Number(shown.health) || 0,
            health_max: Math.max(0, Number(shown.health_max) || 0),
            shield: Math.max(0, Number(shown.shield) || 0),
            armor: Math.max(0, Number(shown.defense) || 0),
            /* The three numbers a roll against them is judged by. They ride
               into the rolled order, and from there to every seated sheet, so
               an aimed check can carry its own DC. See rollInitiative. */
            avoid: Math.max(0, Number(shown.avoid) || 0),
            reflex: Math.max(0, Number(shown.reflex) || 0),
            grit: Math.max(0, Number(shown.grit) || 0),
          };
        }),
    [members]
  );

  /**
   * Everybody in the fight, as chips and as targets: enemies wearing their
   * rank, the party wearing its cyan, each one's Health as the chip's own
   * background. This is the one list the prompt, the order, the apply window
   * and the deliveries all read, so "which chip is Kaelen" has one answer.
   */
  const roster = useMemo(
    () => [
      ...foes.map((foe) => ({
        id: foe.key,
        kind: 'foe',
        name: foe.title,
        tone: foe.rank.color,
        health01: foe.stats.health_max > 0 ? foe.health / foe.stats.health_max : 0,
        shield01: foe.stats.health_max > 0 ? foe.shield / foe.stats.health_max : 0,
        down: foe.down,
        armor: foe.stats.defense,
        shieldNow: foe.shield,
        defenses: { avoid: foe.stats.avoid, reflex: foe.stats.reflex, grit: foe.stats.grit },
      })),
      ...seats.map((seat) => ({
        id: seat.character_id,
        kind: 'member',
        name: seat.name,
        tone: 'var(--focus-cyan)',
        health01: seat.health_max > 0 ? Math.max(0, seat.health) / seat.health_max : 0,
        shield01: seat.health_max > 0 ? seat.shield / seat.health_max : 0,
        down: seat.health <= 0,
        armor: seat.armor,
        shieldNow: seat.shield,
        defenses: { avoid: seat.avoid, reflex: seat.reflex, grit: seat.grit },
      })),
    ],
    [foes, seats]
  );

  /* Who played the card a log row names, so a spell opened out of the feed
     prints the caster's numbers rather than nobody's. Same read the campaign
     page's own log block gets. */
  const actorFor = useCallback(
    (event) => {
      const member = (members ?? []).find(
        (entry) => entry.character_id === event?.character_id
      );
      return member?.characters ? liveCharacter(member.characters) : null;
    },
    [members]
  );

  /* What level the party is standing at, rounded down, so the shelf opens on the
     level a Game Master almost certainly wants. Null for an empty table, which
     the shelf reads as "each one as written". */
  const partyLevel = useMemo(() => {
    const levels = seats.map((seat) => levelForXp(seat.xp));
    if (levels.length === 0) return null;
    return clampCreatureLevel(Math.round(levels.reduce((a, b) => a + b, 0) / levels.length));
  }, [seats]);

  const handleRoll = () => {
    let rolled = null;
    patch((row) => {
      rolled = rollInitiative(row, seats);
      return rolled;
    });
    if (!rolled) {
      setGains(['Nobody is in this fight. Add an enemy, or link a character to the campaign.']);
      return;
    }

    /* The order goes on the log as well as on the row, so a player who has no
       read on the encounter still knows what the order is and where they are in
       it. Then the first turn is called at once: rolling initiative *is* the
       start of the fight, and a Game Master should not have to press twice. */
    log(initiativeEvent(rolled.run.order, { encounter: open.id }));
    log(turnCallEvent(rolled.run.order[0], 1, { encounter: open.id }));
  };

  /**
   * On to the next in the order, on a named encounter.
   *
   * Three things happen and the order of them is the rule: the pointer moves,
   * every Overlord is paid for a player's turn passing, and then the turn is
   * announced. The Overlord's grant has to land *before* the announcement,
   * because the announcement is what starts a player acting and a boss that
   * gains its reactions afterwards has spent the turn unable to answer.
   *
   * Keyed by encounter id rather than bound to whichever one is open, because
   * more than the Next button advances a fight now: a player's End Turn lands
   * as an event whatever this screen is showing, and the runner must move the
   * fight it belongs to — not the view.
   */
  const advanceEncounter = useCallback(
    (encounterId) => {
      let called = null;
      patchEncounter(encounterId, (row) => {
        const moved = advanceRun(row);
        if (!moved) return null;

        let body = moved.patch;

        /* "whenever a player take a turn they gain 3 rection points". The runner
           is what knows a player's turn has come round, so it is the runner that
           pays it: the button below stays for a table running the fight by hand. */
        if (moved.entry.kind === 'member') {
          const paid = crossTurn({ ...row, ...body }, { tick: tickEffects });
          if (paid) body = { ...body, ...paid.patch };
        } else {
          /* And an enemy's own turn gives it its Action Points back and ticks what
             is running on it, which is the half of a Start Turn an enemy has. */
          const started = foeTurnStart({ ...row, ...body }, moved.entry.ref, { tick: tickEffects });
          if (started) body = { ...body, ...started };
        }

        called = moved;
        return body;
      });

      if (called) log(turnCallEvent(called.entry, called.round, { encounter: encounterId }));
    },
    [patchEncounter, log]
  );

  /**
   * Next, with the stop the sheet's own turn button has had all along: an
   * enemy's boundary with something waiting on it opens the prompt first, and
   * the confirm is the advance the press was always going to make.
   *
   * Both boundaries of one press are read — the enemy whose turn is ending and
   * the one whose turn is about to start — because "when an entity starts a
   * turn, it should prompt needed rolls, same at end turn" (Jules, 2026-09-01).
   * A player's boundaries are deliberately not read here: their own sheet
   * stops for them, on their own screen, where their own dice are.
   */
  const nextFor = useCallback(
    (encounterId) => {
      const row = rowsRef.current.find((entry) => entry.id === encounterId);
      if (!row) return;
      const now = normalizeRun(row.run);
      if (!now.live || now.order.length === 0) return;

      const state = encounterState(row);
      const sideFor = (entry, when) => {
        if (!entry || entry.kind !== 'foe') return null;
        const foe = state.find((held) => held.key === entry.ref);
        if (!foe || foe.down) return null;
        const triggers = turnTriggers(foeActor(foe), when);
        return triggers.any ? { foe, when, triggers } : null;
      };

      const at = (now.at + 1) % now.order.length;
      const leaving = sideFor(now.order[now.at], 'end');
      const coming = sideFor(now.order[at], 'start');

      if (leaving || coming) {
        setBoundary({
          encounterId,
          leaving,
          coming,
          entry: now.order[at],
          round: at === 0 ? now.round + 1 : now.round,
        });
        return;
      }

      advanceEncounter(encounterId);
    },
    [advanceEncounter]
  );

  const handleNext = () => {
    if (open) nextFor(open.id);
  };

  const handleEndFight = () => {
    let rounds = 0;
    patch((row) => {
      const stopped = endRun(row);
      if (!stopped) return null;
      rounds = normalizeRun(row.run).round;
      return stopped;
    });
    if (rounds > 0) log(fightOverEvent({ encounter: open.id, rounds }));
  };

  /* --------------------------------------------------- landing what was used */

  /**
   * An effect a use aimed at bodies, laid on every one of them.
   *
   * `targets` arrive off the prompt as bodies (kind, id, name). Enemies get
   * theirs written straight onto the encounter row, in one patch. Players get
   * theirs *delivered*: an event names them, and each one's own client lays
   * the row through its own patch, because nothing else may write a sheet. The
   * event is written either way — it is also the table's record that the thing
   * was laid.
   */
  const layTargets = useCallback(
    (foe, targets, cast) => {
      if (targets.length === 0) return;

      const keys = targets.filter((body) => body.kind === 'foe').map((body) => body.id);
      if (keys.length > 0) patch((row) => layOnFoes(row, keys, cast, { lay: layEffect }));

      log(
        effectLaidEvent(
          { name: foe.title, portrait: foe.creature?.portrait_url ?? null },
          cast,
          targets
        )
      );
    },
    [patch, log]
  );

  /**
   * A settled chain from an aimed use: the verdicts read, the held-back effect
   * laid on whoever was hit, and the apply window over them.
   *
   * `outcomes` is the check's total judged per body; with one in hand the
   * window preselects the hits and lists the misses, so a volley against three
   * different Defenses lands on exactly who it caught. Without one (no check,
   * or a check judged by hand) everyone picked is offered, as before. The
   * window still opens on outcomes alone — everybody dodging is an answer the
   * Game Master should see, not a silence.
   */
  const handleResults = useCallback(
    ({ foe, request, targets, thrown, outcomes = null, hit = null, cast = null }) => {
      const landed = outcomes
        ? targets.filter((entry) => aimHits(outcomes).some((won) => won.id === entry.id))
        : targets;

      /* The effect that waited on the verdict: "On a hit, the spore embeds" is
         a row for whoever was hit and for nobody else. */
      if (cast && hit && landed.length > 0) layTargets(foe, landed, cast);

      const deltas = applyPlan(thrown);
      if (deltas.length === 0 && !outcomes) return;
      setApply({
        caster: {
          name: foe.title,
          portrait: foe.creature?.portrait_url ?? null,
          card: request.card ?? null,
        },
        title: request.name,
        deltas,
        outcomes,
        preselect: landed.map((entry) => entry.id),
      });
    },
    [layTargets]
  );

  /**
   * A tracked effect rolled off its row: the wall of fire, clicked the moment
   * something walks into it. The card's value links are thrown in printed
   * order, and whatever landed goes to the apply window with nobody picked,
   * because only the table knows who walked in.
   */
  const rollEffect = useCallback(
    (foe, effect, links) => {
      if (!tray) return;
      void (async () => {
        const thrown = [];
        for (const link of links) {
          const result = await tray.present({
            ...link,
            name: effect.name,
            note: foe.title,
            log: true,
          });
          if (!result) break;
          thrown.push({ kind: link.kind, total: result.total, damage: link.damage ?? [] });
        }

        const deltas = applyPlan(thrown);
        if (deltas.length === 0) return;
        setApply({
          caster: {
            name: foe.title,
            portrait: foe.creature?.portrait_url ?? null,
            card: getCard(effect.card) ?? null,
          },
          title: effect.name,
          deltas,
          preselect: [],
        });
      })();
    },
    [tray]
  );

  /**
   * A boundary clause rolled from the turn prompt. The apply window opens with
   * the boundary's own enemy picked when the clause is about the body holding
   * the row — a burn burns its carrier — and with nobody picked when it points
   * away, for the Game Master to say who.
   */
  const throwBoundary = useCallback(
    (foe, row, clause, spec) => {
      if (!tray) return;
      void (async () => {
        const kind = spec.kind === 'roll' ? 'damage' : spec.kind;
        const result = await tray.present({
          ...spec,
          shape: 'value',
          kind,
          name: row.name,
          note: foe.title,
          log: true,
        });
        if (!result) return;

        setApply({
          caster: {
            name: foe.title,
            portrait: foe.creature?.portrait_url ?? null,
            card: getCard(row.card) ?? null,
          },
          title: row.name,
          deltas: applyPlan([{ kind, total: result.total, damage: [] }]),
          preselect: clauseAim(clause) === 'self' ? [foe.key] : [],
        });
      })();
    },
    [tray]
  );

  /**
   * Land it: the window's numbers onto the chosen bodies.
   *
   * Enemies land in one patch — five goblins catching one Fireball is one
   * write. Players land by delivery, one event per kind, every landing still
   * as rolled: Armor is the target's own and is read where the pools live. The
   * event carries the enemies too, because it is also the record.
   */
  const handleApply = useCallback(
    (chosen) => {
      const current = apply;
      setApply(null);
      if (!current) return;

      const bodies = chosen
        .map((id) => roster.find((body) => body.id === id))
        .filter(Boolean);
      if (bodies.length === 0) return;

      for (const delta of current.deltas) {
        const keys = bodies
          .filter((body) => body.kind === 'foe')
          .map((body) => ({ key: body.id, kind: delta.kind, landings: delta.landings }));
        if (keys.length > 0) patch((row) => applyToFoes(row, keys));

        log(
          appliedEvent(
            {
              name: current.caster.name,
              portrait: current.caster.portrait,
              card: current.caster.card,
            },
            delta,
            bodies.map((body) => ({
              kind: body.kind,
              id: body.id,
              name: body.name,
              landings: delta.landings,
            }))
          )
        );
      }
    },
    [apply, roster, patch, log]
  );

  /**
   * An Upkeep answered from the boundary prompt: the toll paid out of the
   * enemy's own pools, or the row let go. "Upkeep abilities should ask you if
   * you want to keep it up or drop it" — asked where the toll comes due, and
   * done with one press instead of two blocks of hand edits.
   */
  const payUpkeep = useCallback(
    (foe, row) => {
      patch((enc) => {
        const toll = row.toll ?? {};
        let body = null;
        let held = enc;
        if (toll.ap > 0) {
          body = stepFoePool(held, foe, 'ap', -toll.ap);
          if (body) held = { ...held, ...body };
        }
        if (toll.wp > 0) {
          const more = stepFoePool(held, foe, 'willpower', -toll.wp);
          if (more) body = { ...(body ?? {}), ...more };
        }
        return body;
      });
    },
    [patch]
  );

  const dropUpkeep = useCallback(
    (foe, row) => {
      patch((enc) => {
        const held = normalizeFoes(enc.foes).find((entry) => entry.key === foe.key);
        if (!held) return null;
        return setFoeEffects(enc, foe.key, dropEffect(held.effects ?? [], row.id));
      });
    },
    [patch]
  );

  /* What every enemy block reaches the fight through. Only on the encounter
     view, and only while this Game Master can edit: the Bestiary hands its
     blocks nothing and stays a reference page. */
  const combat = useMemo(
    () => ({ roster, layEffect: layTargets, onResults: handleResults, rollEffect }),
    [roster, layTargets, handleResults, rollEffect]
  );

  /**
   * The bodies below, in the fight's own order.
   *
   * "The enemies there should be ordered by initiative, the current turn's
   * block should be highlighted and the order should change as initiative
   * moves" — so while a fight runs, the blocks stand in turn order *from
   * whoever is up*: the acting enemy first, then everyone in the order the
   * fight will reach them, wrapping. An enemy added mid-fight and not yet in
   * the order keeps to the tail, and with no fight running the pile stays the
   * order it was laid down in, which is the Game Master's own.
   */
  const orderedFoes = useMemo(() => {
    if (!run.live) return foes;

    const rank = new Map();
    run.order.forEach((entry, at) => {
      if (entry.kind !== 'foe') return;
      rank.set(entry.ref, (at - run.at + run.order.length) % run.order.length);
    });

    return [...foes].sort(
      (a, b) =>
        (rank.get(a.key) ?? Number.MAX_SAFE_INTEGER) -
        (rank.get(b.key) ?? Number.MAX_SAFE_INTEGER)
    );
  }, [foes, run]);

  /**
   * The other half of the loop: a player has ended their turn, so the order
   * moves on by itself.
   *
   * This is what makes the fight run rather than being clicked round. The Game
   * Master presses Next for an enemy, because an enemy's turn is theirs to play;
   * a player's turn ends when the player says it does, and the table should not
   * wait on somebody noticing.
   *
   * Always on while this tab is up, whatever it is showing: the listener used
   * to exist only while the *open* encounter was awaiting somebody, so an End
   * Turn arriving while the Game Master browsed the shelf, or on a fight in
   * some other encounter, moved nothing. The fight the row belongs to is found
   * by who it is waiting on, and only that fight moves — an End Turn from a
   * player nobody is waiting on still ends only their own sheet.
   *
   * Read through a ref for the same reason TurnCall does: `nextFor` is remade
   * when its dependencies move, and re-subscribing on every render would tear
   * the channel down while the Game Master types a name.
   */
  const nextRef = useRef(nextFor);
  useEffect(() => {
    nextRef.current = nextFor;
  });

  useEffect(() => {
    if (!campaignId || !canEdit) return undefined;

    return subscribeToTable({
      table: 'campaign_events',
      filter: `campaign_id=eq.${campaignId}`,
      onChange: (payload) => {
        if (payload.eventType !== 'INSERT') return;
        const row = payload.new;
        if (row?.kind !== 'turn' || row?.data?.move !== 'ended') return;
        if (!row.character_id) return;

        const home = rowsRef.current.find((enc) => {
          const running = normalizeRun(enc.run);
          return running.live && running.awaiting === row.character_id;
        });
        if (home) nextRef.current(home.id);
      },
    });
  }, [campaignId, canEdit]);

  /**
   * The other direction of delivery: a player's aim, landing on enemies.
   *
   * A player cannot write the encounter row, so their targeted cast posts what
   * it laid and what it rolled to the table log (see usePlayCard.js), and this
   * page — the only client with the pen — applies the enemy share. The
   * players named in the same row apply their own share themselves, so nothing
   * is written twice: this consumer reads only rows a *character* signed,
   * because the table's own writes were applied directly before they were
   * posted.
   *
   * Landed on whichever encounter actually holds the named bodies rather than
   * on whichever one is open: the foe refs are the address, and the Game
   * Master browsing the shelf mid-fight is not a reason for a Fireball to
   * miss. Guarded by row id, exactly as the turn call guards, so a resync
   * cannot land one twice.
   */
  const deliveredRef = useRef(new Set());

  useEffect(() => {
    if (!campaignId || !canEdit) return undefined;

    return subscribeToTable({
      table: 'campaign_events',
      filter: `campaign_id=eq.${campaignId}`,
      onChange: (payload) => {
        if (payload.eventType !== 'INSERT') return;
        const row = payload.new;
        if (!row?.character_id) return;
        if (row.kind !== 'effect' && row.kind !== 'apply') return;

        const named = (row.data?.targets ?? []).filter(
          (entry) => entry?.kind === 'foe' && entry.ref
        );
        if (named.length === 0) return;
        if (deliveredRef.current.has(row.id)) return;
        deliveredRef.current.add(row.id);

        const keys = named.map((entry) => entry.ref);
        const home = rowsRef.current.find((enc) =>
          normalizeFoes(enc.foes).some((held) => keys.includes(held.key))
        );
        if (!home) return;

        if (row.kind === 'effect' && row.data?.effect) {
          patchEncounter(home.id, (enc) =>
            layOnFoes(enc, keys, row.data.effect, { lay: layEffect })
          );
        }

        if (row.kind === 'apply') {
          patchEncounter(home.id, (enc) =>
            applyToFoes(
              enc,
              named.map((entry) => ({
                key: entry.ref,
                kind: row.data?.kind,
                landings: entry.landings,
              }))
            )
          );
        }
      },
    });
  }, [campaignId, canEdit, patchEncounter]);

  if (!canEdit) {
    return (
      <div className="empty-state camp-empty">
        <h2>The Game Master&rsquo;s Table</h2>
        <p>Encounters are prepared and read by whoever runs this campaign.</p>
      </div>
    );
  }

  if (loading) return <div className="loading-veil">Setting the table…</div>;

  /* ------------------------------------------------------------- the shelf */

  if (!open) {
    return (
      <CampaignLogContext.Provider value={logValue}>
        {error && <div className="form-error">{error}</div>}

        {encounters.length === 0 ? (
          <div className="empty-state camp-empty">
            <h2>Nothing Prepared</h2>
            <p>
              An encounter is a group of enemies you put together now and put on the table later.
              Make one, then fill it out of the bestiary.
            </p>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              style={{ marginTop: '1.25rem' }}
              onClick={handleCreate}
            >
              + New encounter
            </button>
          </div>
        ) : (
          <div className="enc-shelf-grid">
            {encounters.map((row) => (
              <EncounterBlock key={row.id} row={row} onOpen={() => setOpenId(row.id)} />
            ))}

            <button type="button" className="enc-block enc-block-new" onClick={handleCreate}>
              <span className="enc-block-name">+ New encounter</span>
              <span className="enc-block-notes">A named pile of enemies, filled from the bestiary.</span>
            </button>
          </div>
        )}
      </CampaignLogContext.Provider>
    );
  }

  /* ---------------------------------------------------------------- the view */

  const count = normalizeFoes(open.foes).length;
  const tally = encounterTally(open);

  return (
    <CampaignLogContext.Provider value={logValue}>
      {/* The table's dice voice: every logged roll made on this page is written
          as the table, signed by whichever enemy threw. Renders nothing. */}
      <DiceTable campaignId={campaignId} campaignName={campaign?.name ?? ''} />

      {error && <div className="form-error">{error}</div>}

      <div className="enc-head panel">
        <div className="enc-head-fields">
          <button
            type="button"
            className="btn btn-minimal btn-sm enc-back"
            onClick={() => setOpenId(null)}
            title="Back to the shelf of encounters"
          >
            &larr; Encounters
          </button>

          <div className="form-group">
            <label className="form-label" htmlFor="enc-name">
              Name
            </label>
            <input
              className="form-input"
              id="enc-name"
              value={open.name ?? ''}
              maxLength={80}
              onChange={(event) => patch({ name: event.target.value })}
              placeholder="The Vault Door"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="enc-notes">
              Notes
            </label>
            <input
              className="form-input"
              id="enc-notes"
              value={open.notes ?? ''}
              maxLength={300}
              placeholder="Where it happens, and what sets it off"
              onChange={(event) => patch({ notes: event.target.value })}
            />
          </div>
        </div>

        <div className="enc-head-foot">
          <span className="enc-tally">
            {count === 0 ? (
              'Empty'
            ) : (
              <>
                {tally.map(({ rank, count: many }) => (
                  <span key={rank.id} className="enc-tally-chip" style={{ '--rank-tone': rank.color }}>
                    {many} {many === 1 ? rank.label : `${rank.label}s`}
                  </span>
                ))}
              </>
            )}
          </span>

          <span className="spacer" />

          <button type="button" className="btn btn-minimal btn-sm" onClick={() => setAdding(true)}>
            Add enemies
          </button>

          {/* The Overlord's rule, as the one press that carries it out. The
              runner fires it by itself the moment the order lands on a
              player; this is the button for a table running the fight by
              hand, and it is hidden while the runner is doing it so nobody
              pays the boss twice. */}
          {!run.live && (
            <button
              type="button"
              className="btn btn-minimal btn-sm"
              onClick={handleTurn}
              title="Every Overlord here gains 3 Reaction Points, and what is running on it ticks"
            >
              {TURN_LABEL}
            </button>
          )}

          <button
            type="button"
            className="btn btn-minimal btn-sm"
            onClick={() => {
              patch((row) => resetEncounter(row));
            }}
            title="Full pools, nothing running, every ward back up"
          >
            Reset
          </button>

          <button
            type="button"
            className="btn btn-minimal btn-sm btn-danger"
            onClick={() => handleDelete(open)}
          >
            Delete
          </button>
        </div>
      </div>

      <div className="sheet-grid-6">
        {/* ---------- THE FIGHT AND THE FEED ----------
            The two blocks a Game Master reads between every press, side by
            side above the bodies: the order with its three presses, and the
            table log with every roll and delivery as it lands. Single cells,
            not doubles (Jules, 2026-09-01: half the width): together they take
            the footprint of one enemy, and the bodies start one row down. */}
        <section className="sheet-cell cell-run">
          <RunBlock
            run={run}
            up={up}
            ready={foes.length > 0 || seats.length > 0}
            roster={roster}
            onRoll={handleRoll}
            onNext={handleNext}
            onEnd={handleEndFight}
          />
        </section>

        <section className="sheet-cell cell-enc-log">
          <LogBlock campaignId={campaignId} title="DM Log" actorFor={actorFor} />
        </section>

        {orderedFoes.map((foe) => (
          <section
            key={foe.key}
            className={`sheet-cell sheet-cell-wide cell-foe${
              run.live && up?.kind === 'foe' && up.ref === foe.key ? ' is-up' : ''
            }`}
          >
            <EnemyBlock
              foe={foe}
              patch={patch}
              unit={unit}
              combat={combat}
              onRemove={() => {
                /* Off the table and out of the order, in one write. An
                   enemy taken off mid-fight that stayed in the order would
                   be a turn the runner announced for a body that is not
                   there, and `dropFromOrder` keeps whoever is up up. */
                patch((row) => {
                  const gone = dropFoe(row, foe.key);
                  if (!gone) return null;
                  return { ...gone, ...(dropFromOrder(row, foe.key) ?? {}) };
                });
              }}
            />
          </section>
        ))}
      </div>

      {foes.length === 0 && (
        <div className="empty-state camp-empty">
          <h2>No Enemies Yet</h2>
          <p>Add them out of the bestiary. The same creature can go in as many times as you like.</p>
        </div>
      )}

      {adding && (
        <AddFoes
          encounter={open}
          partyLevel={partyLevel}
          onAdd={(creatureId, many, level) =>
            patch((row) => addFoes(row, creatureId, many, level))
          }
          onClose={() => setAdding(false)}
        />
      )}

      {gains && (
        <Modal title={TURN_LABEL} onClose={() => setGains(null)}>
          {gains.length === 0 ? (
            <p className="pick-line">Nothing moved.</p>
          ) : (
            <ul className="enc-gains">
              {gains.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          )}
        </Modal>
      )}

      {boundary && (
        <FoeTurnPrompt
          boundary={boundary}
          onThrow={throwBoundary}
          onUpkeep={(foe, row, act) => (act === 'pay' ? payUpkeep(foe, row) : dropUpkeep(foe, row))}
          onConfirm={() => {
            setBoundary(null);
            advanceEncounter(boundary.encounterId);
          }}
          onClose={() => setBoundary(null)}
        />
      )}

      {apply && (
        <ApplyWindow
          apply={apply}
          roster={roster}
          onApply={handleApply}
          onClose={() => setApply(null)}
        />
      )}
    </CampaignLogContext.Provider>
  );
}

/**
 * One prepared encounter, as a block on the shelf: the name, the Game Master's
 * note, the ranks in it and the bodies by name.
 *
 * Jules, 2026-09-01: "the encounters page should show encounter blocks, which
 * are a type of block that show the enemies in it and notes from the DM." The
 * whole block is the button, because the block *is* the way in: everything on
 * it is a reading, and the one thing to do with a reading is open it.
 */
function EncounterBlock({ row, onOpen }) {
  const foes = encounterState(row);
  const run = normalizeRun(row.run);
  const tally = encounterTally(row);

  const names = foes.slice(0, 8).map((foe) => foe.title);
  const rest = foes.length - names.length;

  return (
    <button type="button" className="enc-block" onClick={onOpen}>
      <span className="enc-block-head">
        <span className="enc-block-name">{row.name || 'Unnamed Encounter'}</span>
        {run.live && (
          <span className="enc-block-live" title="A fight is running in this one">
            Round {run.round}
          </span>
        )}
      </span>

      {row.notes && <span className="enc-block-notes">{row.notes}</span>}

      <span className="enc-tally">
        {tally.length === 0 ? (
          <span className="enc-block-empty">Empty. Open it and add enemies.</span>
        ) : (
          tally.map(({ rank, count }) => (
            <span key={rank.id} className="enc-tally-chip" style={{ '--rank-tone': rank.color }}>
              {count} {count === 1 ? rank.label : `${rank.label}s`}
            </span>
          ))
        )}
      </span>

      {names.length > 0 && (
        <span className="enc-block-foes">
          {names.join(' · ')}
          {rest > 0 ? ` and ${rest} more` : ''}
        </span>
      )}

      <span className="enc-block-open">Open the encounter &rarr;</span>
    </button>
  );
}

/**
 * The shelf: the whole bestiary, with a count beside each one.
 *
 * A shelf rather than a chooser, which is the width rule Modal keeps: this is a
 * menu you browse and not a question you answer, so it takes the three-block
 * measure and flows into columns.
 *
 * The counter is what "their number is the danger" needs. Adding six
 * Blightgeists one tap at a time is not a thing anybody does twice, so the row
 * carries 1, 2 and 5 and the shelf stays open for the next creature.
 */
function AddFoes({ encounter, onAdd, onClose, partyLevel = null }) {
  const [rank, setRank] = useState(null);
  /* Null means "the level each one was written at", which is the honest default
     for a shelf holding creatures written across eleven levels. Choosing a level
     applies to everything added from then on, because a Game Master filling a
     fight is filling it *for* a party. It opens on the party's own level where
     there is one, which is the answer nine times in ten. */
  const [level, setLevel] = useState(partyLevel);

  const held = normalizeFoes(encounter?.foes);
  const room = Math.max(0, FOES_MAX - held.length);

  const counts = useMemo(() => {
    const map = new Map();
    for (const row of held) map.set(row.creature, (map.get(row.creature) ?? 0) + 1);
    return map;
  }, [held]);

  const list = useMemo(() => bestiary(rank), [rank]);

  return (
    <Modal
      title="Add enemies"
      onClose={onClose}
      size="page"
      footer={
        <span className="pick-line">
          {room === 0
            ? `This encounter is full at ${FOES_MAX} enemies.`
            : `Room for ${room} more.`}
        </span>
      }
    >
      <div className="foe-filter foe-filter-shelf">
        <button
          type="button"
          className={`foe-filter-btn${rank === null ? ' is-on' : ''}`}
          onClick={() => setRank(null)}
        >
          Everything
        </button>
        {RANKS.map((entry) => (
          <button
            key={entry.id}
            type="button"
            className={`foe-filter-btn${rank === entry.id ? ' is-on' : ''}`}
            style={{ '--rank-tone': entry.color }}
            onClick={() => setRank(entry.id)}
          >
            {entry.label}
          </button>
        ))}

        <span className="spacer" />

        {/* What level everything goes in at. Beside the filter rather than on
            every row, because a Game Master picks a level for the fight and then
            fills it: setting it nine times would be the same answer nine times. */}
        <span className="foe-shelf-level">
          <span className="foe-shelf-level-label">Add at</span>
          <button
            type="button"
            className={`foe-filter-btn${level === null ? ' is-on' : ''}`}
            onClick={() => setLevel(null)}
            title="Each one at the level its own page was written at"
          >
            As written
          </button>
          <button
            type="button"
            className="foe-level-step"
            onClick={() => setLevel(clampCreatureLevel((level ?? 1) - 1))}
            disabled={level !== null && level <= 1}
            aria-label="A level lower"
          >
            &minus;
          </button>
          <button
            type="button"
            className={`foe-filter-btn${level !== null ? ' is-on' : ''}`}
            onClick={() => setLevel(level ?? partyLevel ?? 1)}
          >
            Lvl {level === null ? '—' : String(level).padStart(2, '0')}
          </button>
          <button
            type="button"
            className="foe-level-step"
            onClick={() => setLevel(clampCreatureLevel((level ?? 0) + 1))}
            disabled={level !== null && level >= CREATURE_MAX_LEVEL}
            aria-label="A level higher"
          >
            +
          </button>
        </span>
      </div>

      <div className="foe-shelf">
        {list.map((creature) => {
          const have = counts.get(creature.id) ?? 0;
          const at = level ?? creature.level;
          const stats = creatureStats(creature, at);

          return (
            <div key={creature.id} className="foe-shelf-row">
              <span className="foe-shelf-body">
                <span className="foe-shelf-name">
                  {creature.name}
                  {have > 0 && <span className="foe-shelf-have">×{have} in</span>}
                </span>
                <span className="foe-shelf-line">
                  {creature.type} · {difficultyLine(creature, at)}
                </span>
                {/* The stat line at the level it is about to go in at, so a Game
                    Master sizing a fight is reading the numbers they will get
                    rather than the ones on the page. */}
                <span className="foe-shelf-line foe-shelf-stats">
                  DEF {stats.avoid} · HP {stats.health_max} ({stats.hit_die}) · WP{' '}
                  {stats.willpower_max}
                </span>
              </span>

              <span className="foe-shelf-adds">
                {[1, 2, 5].map((many) => (
                  <button
                    key={many}
                    type="button"
                    className="minion-step is-up"
                    disabled={room < many}
                    onClick={() => onAdd(creature.id, many, level)}
                    title={`Add ${many} ${creature.name} at level ${at}`}
                  >
                    +{many}
                  </button>
                ))}
              </span>
            </div>
          );
        })}
      </div>
    </Modal>
  );
}
