import { useCallback } from 'react';
import { useDiceTray } from '../../context/dice-tray.js';
import { useCampaignLog } from '../../context/campaign-log.js';
import { applyPlan } from '../../lib/combatApply.js';
import { isCriticalSuccess, isFailure } from '../../lib/dice.js';
import { newChain } from '../../lib/logChain.js';
import { appliedEvent, effectLaidEvent, playEvent } from '../../lib/campaignLog.js';
import { rollPlan } from '../../lib/rollPlan.js';
import { castEffect, spendUse } from '../../lib/combatBar.js';

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
  const { log } = useCampaignLog();

  return useCallback(
    (request, mode, amount, options = {}, extra = {}) => {
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
      } = extra;

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

      /* Minted before the first write so the use and every throw under it carry
         the same one, and the log can draw them as a block. See newChain. */
      const chain = newChain();

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

      /* ---- 1. the price ---- */
      const body = write(stripCast(spendUse(request, actor, mode, amount, options), cast));
      if (Object.keys(body).length > 0) patch(body);

      /* ---- 2. the table ----
         Chained only when there is something to hang under it. A use that rolls
         nothing is a plain row, and a chain id nothing ever joins would leave a
         block waiting forever for a throw that was never coming. */
      if (tell) {
        log(playEvent(request, actor, mode, amount, { ...options, chain: plan.length > 0 ? chain : null }));
      }

      /* ---- the effect, delivered ----
         The row stripped from the spend above, posted for whoever it was aimed
         at: a named player's client lays it through its own patch, and the Game
         Master's page lays it on the enemies. Posted whether or not anything
         rolls, because a cast that lays and misses nothing has still laid. */
      if (cast) {
        log(
          effectLaidEvent(
            { name: actor?.name ?? '', portrait: actor?.portrait_url ?? null },
            cast,
            targets
          )
        );
      }

      /* ---- and the numbers, once they exist ----
         The chain hands back what actually landed, and each kind goes out as
         one delivery carrying the raw landings: Armor belongs to whoever is
         hit, so nothing is subtracted here. A missed check hands back nothing
         and nothing is posted, which is what a miss is. */
      const settle =
        onSettled ??
        (delivering
          ? (thrown) => {
              for (const delta of applyPlan(thrown)) {
                log(
                  appliedEvent(
                    {
                      name: actor?.name ?? '',
                      portrait: actor?.portrait_url ?? null,
                      card: request?.card ?? null,
                    },
                    delta,
                    targets.map((entry) => ({ ...entry, landings: delta.landings }))
                  )
                );
              }
            }
          : null);

      /* ---- 3 to 6. the dice ----
         Deliberately not awaited by the caller. Everything above has already
         happened; what follows is a conversation with the player that may take
         as long as they like, and the block that started it has a prompt to
         close in the meantime. */
      if (plan.length > 0) void throwChain(tray, plan, { request, actor, chain, onSettled: settle });

      return body;
    },
    [tray, character, patch, log]
  );
}

/**
 * A check aimed at picked targets, carrying its own DC.
 *
 * "When selecting a target, there is no reason for the dice roller to ask for
 * a DC, as it should be known by the system" (Jules, 2026-09-01). The card
 * says which of the target's numbers the roll is judged by (`against`, read in
 * rollPlan.js) and the target chip carries those numbers, so the surface opens
 * saying "against 15" with the roll button ready and the question never asked.
 *
 * Only when every picked target answers with the same number. Three bodies
 * with three different Defenses is one throw judged three ways, and the tray
 * has one verdict to give — so the question stays the table's there, exactly
 * as it stays for a Skill Check against the world.
 */
function armCheck(link, targets) {
  if (link.shape !== 'check' || !link.against || targets.length === 0) return link;

  const values = targets.map((entry) => Number(entry.defenses?.[link.against]));
  if (values.length === 0 || values.some((value) => !Number.isFinite(value) || value <= 0)) {
    return link;
  }
  if (new Set(values).size !== 1) return link;

  return { ...link, dc: values[0], askDc: false };
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

  /* Every value that actually landed, for the caller that asked to hear. Built
     whatever happens to the chain, so a surface closed after the second of
     three landings still hands back the two that were thrown. */
  const thrown = [];
  const settle = () => {
    if (onSettled) onSettled(thrown);
  };

  try {
    for (const link of plan) {
      const result = await tray.present({
        ...link,
        name: request?.name ?? 'A roll',
        note: actor?.name ?? '',
        card: request?.card?.id ?? null,
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

      /* A miss ends it. Almost every card that rolls damage says "On a hit"
         before it, so there is nothing left to roll and a number put on the
         table here would be one the card never offered. Jules's call of
         2026-08-30. */
      if (isFailure(result.verdict)) return settle();

      maximize = isCriticalSuccess(result.verdict);
    }
  } catch (error) {
    console.warn('The dice stopped mid-chain:', error);
  }

  settle();
}
