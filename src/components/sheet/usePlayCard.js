import { useCallback, useEffect, useRef } from 'react';
import { useDiceTray } from '../../context/dice-tray.js';
import { useCampaignLog } from '../../context/campaign-log.js';
import { aimHits, aimOutcomes, applyPlan, armCheck } from '../../lib/combatApply.js';
import { isCriticalSuccess, isFailure } from '../../lib/dice.js';
import { newChain } from '../../lib/logChain.js';
import {
  appliedEvent,
  effectLaidEvent,
  playEvent,
  reactionFailedEvent,
  verdictEvent,
} from '../../lib/campaignLog.js';
import { rollPlan } from '../../lib/rollPlan.js';
import { subscribeToTable } from '../../lib/realtime.js';
import { castEffect, spendUse } from '../../lib/combatBar.js';
import { addEffect } from '../../lib/combatTurn.js';
import { openingEffect } from '../../lib/tricks.js';

/**
 * How long the table gets to react before the first dice can be thrown, in
 * seconds. "When an entity does an action there should be a 6 second time
 * before the dice roll happens, offering all entities with reaction to take a
 * reaction" (Jules, 2026-09-01). The window is the reaction gate's countdown —
 * see ReactionGate.jsx — raised only for a use made with a fight standing
 * (`options.react`, set by the prompt), and held open past it while anybody is
 * mid-reaction: the stack resolves before the action does.
 */
const REACTION_HOLD = 6;

/**
 * Playing a card: paying for it, telling the table, and rolling what it asks
 * for.
 *
 * `spendUse` then `patch` then `log(playEvent(...))` was the same three lines in
 * five blocks: the quick bar, the loadout, a creature's action bar, and the
 * brewing and enchanting windows. They are one function now, because a fourth
 * step is being added and five copies of a four-step sequence is four copies too
 * many.
 *
 * ------------------------------------------------------------------ the order
 * The order is Jules's, from 2026-08-30, and every part of it is load-bearing:
 *
 *   1. the price is paid, and the sheet is patched
 *   2. the table is told what was played
 *   3. the DC is asked for, if the card asks for a check
 *   4. the dice appear, and the player throws them
 *   5. the verdict, by the DC or by the table's own call
 *   6. and on to whatever the card rolls next
 *
 * The first two happen before this function's first `await`, which is not an
 * accident: a caller can start a play and immediately close its own prompt
 * without waiting, and the points have already left the pool by the time it
 * does. That is why none of the five call sites awaits anything.
 *
 * Payment is unconditional. The points go whether or not the dice are ever
 * thrown, because pressing use is the decision and the roll is its consequence.
 * A player who closes the surface has still spent the Action Points, the same
 * way you have still swung if you knock your dice on the floor.
 *
 * ------------------------------------------------------------------- the chain
 * What gets rolled is read off the card by `rollPlan`, so no card needed a new
 * field for any of this. The links run in printed order, and a check ends the
 * chain two ways: closing the surface stops it where the player stopped it, and
 * *missing* stops it outright. Almost every card that rolls damage says "On a
 * hit" before it, so a miss has nothing left to roll and a number put on the
 * table there would be one the card never offered.
 *
 * A critical success maximises the damage after it, every landing of it, until
 * the next check. That is the one place a link is changed by the link before it.
 *
 * **An abandoned chain stays open**, on Jules's call. The use is in the log and
 * so is whatever was thrown, and the block simply has fewer rows under it than
 * it might have had. A half-finished chain is the honest picture of a
 * half-finished action, and timing one out would invent an ending nobody played.
 *
 * ------------------------------------------------------- what does not roll
 * `roll: false` is for the two windows that pay for an act of *creation* rather
 * than for a card resolving now. Brewing a potion and laying an enchantment both
 * charge for a thing that will be used later, and the card they charge against
 * describes that later moment: SPELLED SHIELD reads "when the wielder enters
 * combat, they start it with [[2d6]] Shield", and rolling that at the workbench
 * would roll a Shield nobody is wearing yet.
 *
 * They still come through here so that the paying and the telling cannot drift
 * from the other three. Only the dice are skipped, and the flag says why.
 */
export function usePlayCard({ character, patch }) {
  const tray = useDiceTray();
  const { tables, log } = useCampaignLog();

  /* The freshest character this component has been rendered with, for the one
     write that happens after the dice rather than before them. A chain takes as
     long as the table takes, and the character the press captured may have been
     handed a delivered effect since: a patch built on that stale list would
     write the tracker back to how it looked a minute ago. See TurnCall.jsx,
     which holds the same ref for the same reason. */
  const liveRef = useRef(character);
  useEffect(() => {
    liveRef.current = character;
  });

  return useCallback(
    (asked, mode, amount, options = {}, extra = {}) => {
      const {
        /* Who acted. A creature plays its own cards off its own attributes and
           signs the log with its own name, so its block hands one in. See
           minions.js: one use paid from two sheets is one line at the table. */
        actor = character,
        /* What the spend becomes before it is written. A creature's spend has to
           be folded back into its row on the bonded sheet, and an enchantment
           adds the effect it just laid. */
        write = (body) => body,
        roll = true,
        tell = true,
        /* What the chain came to, handed back once the dice stop. The encounter
           page is the caller that cares: a use aimed at targets wants the rolled
           damage back so it can be landed on them. Called with every value that
           actually settled — a chain closed halfway hands back the half that
           happened, and a missed check hands back nothing, because a miss has
           nothing to land. See ApplyWindow.jsx. */
        onSettled = null,
        /* And the word that the whole use is over, dice and all, for a caller
           that only needs the moment: a reaction window posts its `done` here,
           so the actor it interrupted waits for the reaction to actually
           resolve rather than merely be paid for. Called exactly once, after
           everything else, whether the chain rolled, was abandoned or never
           existed. */
        afterSettled = null,
        /* The id this whole use is filed under: the use, every throw beneath it
           and every row written about it, which is what lets the log draw them
           as one block. Minted here, before the first write, unless the caller
           has rows of its own to write against it and hands one in. The
           encounter page is that caller. See `newChain` in logChain.js. */
        chain = newChain(),
      } = extra;

      /* ---- what the prompt decided about the card itself ----
         A Skill Check is rolled off an attribute the player picks and with
         whatever skill they brought to it, and both of those are answers to a
         question asked inside the prompt rather than anything the codex printed.
         They arrive as modifiers and are folded onto the request here, once, so
         that every reader below — the roll plan, the spend and the log line —
         sees one request and cannot disagree about which attribute was rolled.
         See CheckPick.jsx. */
      const request = options?.modifiers
        ? { ...asked, modifiers: { ...asked?.modifiers, ...options.modifiers } }
        : asked;

      /* ---- who it was aimed at, and who is going to land it ----
         Targets arrive off the prompt as bodies (kind, id, name). A page with
         its own hands — the encounter view, which writes enemies directly and
         opens its own apply window — passes `onSettled` and takes over. Every
         other caller is a player's sheet, and a player's aim is *delivered*:
         the effect their cast lays and the numbers their chain rolls go on the
         table log, and each named body's own client applies its own share. The
         Game Master's open encounter page is the client for the enemies. See
         TurnCall.jsx and the delivery consumer in EncounterTab.jsx. */
      const targets = options?.targets ?? [];
      const delivering = targets.length > 0 && !onSettled;

      /* The row this cast lays, headed for the targets' trackers instead of the
         caster's. Never when the request already carries a deliberate effects
         write of its own (a Martial Move or an AMBUSH is a rider on the caster,
         not a thing aimed at anybody), which is the same guard spendUse keeps. */
      const cast = delivering && !request?.extra?.effects ? castEffect(request) : null;

      /* Every check aimed at the picked targets carries what it is judged by:
         one shared number opens the surface saying "against 15", and differing
         numbers are judged per body once the total lands. See combatApply.js. */
      const plan = (
        roll && tray
          ? rollPlan(request?.card, actor, request?.modifiers, {
              /* A paid second half rolls too. Eleven halves in the codex carry
                 dice and none of them repeats the base card's, so the half adds
                 links rather than replacing them. `price` is what says it was
                 taken, exactly as in playEvent. */
              half: Boolean(options.price),
            })
          : []
      ).map((link) => armCheck(link, targets));

      /* Whether a check stands between the cast and its landing. "On a hit" is
         most of the codex, so an aimed effect behind a check waits for the
         verdict and lands on whoever was actually hit; one with no check to
         pass lays the moment it is paid for, as it always has. */
      const checky = plan.some((link) => link.shape === 'check');

      /* ---- 1. the price ---- */
      const body = write(stripCast(spendUse(request, actor, mode, amount, options), cast));
      if (Object.keys(body).length > 0) patch(body);

      /* ---- 2. the table ----
         Chained when there is something to hang under it: dice to throw, bodies
         to land on, or a row to lay on them. A use with none of the three is a
         plain line — a Move, an Interact — and an id nothing ever joins would
         leave a block waiting forever for a throw that was never coming.

         Aim counts as well as dice, which it did not until 2026-09-02. An aimed
         cast that rolls nothing still writes a delivery, and a delivery whose
         head carried no chain was the second of the two entries Jules asked to
         see folded into one. */
      if (tell) {
        log(
          playEvent(request, actor, mode, amount, {
            ...options,
            chain: plan.length > 0 || cast || targets.length > 0 ? chain : null,
          })
        );
      }

      const speaker = {
        name: actor?.name ?? '',
        portrait: actor?.portrait_url ?? null,
        card: request?.card ?? null,
      };

      /* Whether the stack stands between this action and its dice: a use made
         with a fight standing, that actually rolls something to hold. A use
         made *as* a reaction is never gated itself — it is already the
         interrupt, and a window on the window would stack the table into a
         corridor of held rolls. */
      const gating =
        Boolean(options?.react) &&
        mode !== 'reaction' &&
        plan.length > 0 &&
        Boolean(tray?.gate);

      /* ---- the effect with nothing to pass, delivered now ----
         Held back while the gate stands, though: an action the table then
         fails must not have already laid its row on anybody. */
      if (cast && !checky && !gating) log(effectLaidEvent(speaker, cast, targets, { chain }));

      /* ---- and the rest, once the dice have spoken ----
         The chain hands back what landed and, for an aimed check, who it landed
         on. The verdicts go on the log for the whole table; the effect held
         back above lays on whoever was hit; each kind of rolled value goes out
         as one delivery carrying the raw landings, hit targets only — Armor
         belongs to whoever is hit, so nothing is subtracted here. A page with
         its own hands (the encounter view) takes over from the verdict row on,
         handed the surviving targets in `meta.targets` and the action's own id
         in `meta.chain`, so the rows it writes land in this block too. */
      const settleWith = (live) => (thrown, meta = {}) => {
        try {
          /* ---- what a critical hit opened ----
             A Trickster's SKULK: land one and the next Hide costs nothing. Here
             rather than at the moment the die stopped, because landing one is a
             verdict and the verdict is what this callback is handed.

             Only for a player playing their own card on their own sheet. A
             minion and an enemy both come through here with an `actor` that is
             not the sheet `patch` writes to, and neither of them has a talent
             set. See `openingEffect` in tricks.js, which refuses a second row
             while one is standing. */
          if (meta.crit && actor === character) {
            const held = liveRef.current;
            const opened = openingEffect(held);
            if (opened) patch({ effects: addEffect(held?.effects, opened) });
          }

          if (meta.outcomes && meta.outcomes.length > 0) {
            log(verdictEvent(speaker, request?.name ?? '', meta.outcomes, { chain }));
          }

          if (onSettled) {
            onSettled(thrown, { ...meta, targets: live, chain });
            return;
          }
          if (!delivering) return;

          const landed = meta.outcomes
            ? live.filter((entry) =>
                aimHits(meta.outcomes).some((outcome) => outcome.id === entry.id)
              )
            : live;
          if (landed.length === 0) return;

          if (cast && checky && meta.hit) log(effectLaidEvent(speaker, cast, landed, { chain }));

          for (const delta of applyPlan(thrown)) {
            log(
              appliedEvent(
                speaker,
                delta,
                landed.map((entry) => ({ ...entry, landings: delta.landings })),
                { chain }
              )
            );
          }
        } finally {
          afterSettled?.(thrown, meta);
        }
      };

      /* ---- 3 to 6. the dice, behind the stack ----
         Deliberately not awaited by the caller. Everything above has already
         happened; what follows is a conversation with the table that may take
         as long as it likes, and the block that started it has a prompt to
         close in the meantime.

         The gate runs first when the fight is standing: six seconds for
         reactions, held open while any are being taken, then the fail question
         if any were. An action failed there never rolls — the price stayed
         spent at the press — and one failed against *some* targets rolls
         against the rest, its checks re-aimed at the numbers that survive. */
      if (plan.length > 0) {
        void (async () => {
          let live = targets;
          let armed = plan;

          if (gating) {
            const verdict = await tray.gate({
              name: request?.name ?? 'An action',
              note: actor?.name ?? '',
              art: request?.card?.art_url ?? null,
              hold: REACTION_HOLD,
              targets,
              subscribe: watchStack(tables, chain),
            });

            if (verdict?.failed) {
              log(
                reactionFailedEvent(actor, request?.name ?? 'The action', {
                  failed: targets.map((entry) => entry.name),
                  chain,
                })
              );
              settleWith([])([], { failed: true });
              return;
            }

            if ((verdict?.dropped ?? []).length > 0) {
              live = verdict.targets;
              log(
                reactionFailedEvent(actor, request?.name ?? 'The action', {
                  failed: verdict.dropped.map((entry) => entry.name),
                  chain,
                })
              );
              armed = (roll && tray
                ? rollPlan(request?.card, actor, request?.modifiers, {
                    half: Boolean(options.price),
                  })
                : []
              ).map((link) => armCheck(link, live));
            }

            /* The held-back checkless effect, laid now that the action stands. */
            if (cast && !checky) log(effectLaidEvent(speaker, cast, live, { chain }));
          }

          await throwChain(tray, armed, { request, actor, chain, onSettled: settleWith(live) });
        })();
      } else {
        /* A use with no dice is over the moment it is paid, and the caller
           waiting on that word gets it now. */
        afterSettled?.([], {});
      }

      return body;
    },
    [tray, character, patch, tables, log]
  );
}

/**
 * The table's word about one action's stack, wired for as long as its gate
 * stands: who opened a reaction against it, and each hold lifted as a take or
 * a pass. Matched on the action's own chain id, so two actions gated at once
 * cannot hear each other's reactors.
 */
function watchStack(tables, chain) {
  return (handlers) => {
    const drops = (tables ?? []).map((table) =>
      subscribeToTable({
        table: 'campaign_events',
        filter: `campaign_id=eq.${table.id}`,
        onChange: (payload) => {
          if (payload.eventType !== 'INSERT') return;
          const row = payload.new;
          if (row?.kind !== 'react' || row.data?.chain !== chain) return;
          if (row.data.move === 'open') handlers.onOpen(row.data.key ?? row.id, row.actor);
          else if (row.data.move === 'done') handlers.onDone(row.data.key ?? null, true);
          else if (row.data.move === 'pass') handlers.onDone(row.data.key ?? null, false);
        },
      })
    );
    return () => drops.forEach((off) => off());
  };
}

/**
 * The spend, minus the row it laid on the caster.
 *
 * A cast aimed at bodies lays its row on them, so the copy `spendUse` put on
 * the caster's own tracker comes back off before the patch: filtered by the
 * card rather than deleted wholesale, because on a weapon swing `body.effects`
 * is also where a spent AMBUSH was just cleared and a wholesale delete would
 * un-spend it. A standing row of the same card goes with it — a redirected
 * recast is the spell moving, and it must not run in two places off one
 * source.
 */
function stripCast(body, cast) {
  if (!cast || !Array.isArray(body.effects)) return body;
  return { ...body, effects: body.effects.filter((row) => row.card !== cast.card) };
}

/**
 * The chain itself, one link at a time.
 *
 * Its own function because it is the only part that waits, and because a promise
 * nobody is holding must not be able to throw: a rejected float here would land
 * as an unhandled rejection in the console of a player whose dice worked fine.
 */
async function throwChain(tray, plan, { request, actor, chain, onSettled = null }) {
  /* Set by a critical success and held until the next check. Every landing of
     the damage maximises, not just the first: a Flurry's three landings are one
     attack's damage, and maximising only the first of them would be arbitrary.
     Damage only, because the ruling is about the damage dealt, so a card that
     heals or shields on the same breath rolls those honestly. */
  let maximize = false;

  /* Every value that actually landed, for the caller that asked to hear, plus
     the check's word: `outcomes` is the total judged per aimed body, `hit` is
     whether anything connected at all. Built whatever happens to the chain, so
     a surface closed after the second of three landings still hands back the
     two that were thrown. */
  const thrown = [];
  /* `crit` is the one of these that is about the *kind* of roll as well as its
     verdict: a critical hit is an attack landing six over, and a Skill Check
     rolled that high is a critical success at picking a lock. See `isAttack`. */
  const meta = { outcomes: null, hit: null, crit: false };
  const settle = () => {
    if (onSettled) onSettled(thrown, meta);
  };

  try {
    for (const link of plan) {
      const result = await tray.present({
        ...link,
        name: request?.name ?? 'A roll',
        note: actor?.name ?? '',
        card: request?.card?.id ?? null,
        /* The face on the surface's header: the card being played, so a roll
           reads as the action it is. */
        art: request?.card?.art_url ?? null,
        chain,
        log: true,
        maximize: maximize && link.kind === 'damage',
      });

      // Closed without throwing. The chain stops where the player stopped it.
      if (!result) return settle();

      if (link.shape === 'value') {
        thrown.push({ kind: link.kind, total: result.total, damage: link.damage ?? [] });
      }

      if (link.shape !== 'check') continue;

      /* An aimed check: the one total, judged against each body it was thrown
         at. Everybody dodging ends the chain exactly as a plain miss does, and
         a critical against anybody maximises the damage that follows — the
         single-target rule read across a volley, flagged as a ruling in
         data/README.md. */
      if (link.judged) {
        meta.outcomes = aimOutcomes(result.total, link.judged);
        const connected = aimHits(meta.outcomes);
        meta.hit = connected.length > 0;
        if (connected.length === 0) return settle();
        maximize = meta.outcomes.some((outcome) => isCriticalSuccess(outcome.verdict));
        if (maximize && isAttack(link)) meta.crit = true;
        continue;
      }

      /* A miss ends it. Almost every card that rolls damage says "On a hit"
         before it, so there is nothing left to roll and a number put on the
         table here would be one the card never offered. Jules's call of
         2026-08-30. */
      if (isFailure(result.verdict)) {
        meta.hit = false;
        return settle();
      }

      meta.hit = true;
      maximize = isCriticalSuccess(result.verdict);
      if (maximize && isAttack(link)) meta.crit = true;
    }
  } catch (error) {
    console.warn('The dice stopped mid-chain:', error);
  }

  settle();
}

/**
 * Whether a check is an attack, which is what makes a critical success a
 * critical *hit*.
 *
 * The two kinds `rollPlan` gives an attacking check: `weapon` for either of the
 * attacks a weapon teaches, `attack` for a card whose own sentence says it makes
 * one. A `skill` or a plain `check` is neither, so a lock picked six over the DC
 * is not a hit and opens nothing.
 */
function isAttack(link) {
  return link?.kind === 'weapon' || link?.kind === 'attack';
}
