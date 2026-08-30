import { useCallback } from 'react';
import { useDiceTray } from '../../context/dice-tray.js';
import { useCampaignLog } from '../../context/campaign-log.js';
import { isCriticalSuccess } from '../../lib/dice.js';
import { newChain } from '../../lib/logChain.js';
import { playEvent } from '../../lib/campaignLog.js';
import { rollPlan } from '../../lib/rollPlan.js';
import { spendUse } from '../../lib/combatBar.js';

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
 * field for any of this. The links run in printed order and stop dead if one is
 * abandoned: close the surface on the attack roll and you are not then asked for
 * damage, because the damage was conditional on a hit that never landed.
 *
 * A critical success maximises the damage roll after it. That is the one place a
 * link is changed by the link before it.
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
      } = extra;

      /* Minted before the first write so the use and every throw under it carry
         the same one, and the log can draw them as a block. See newChain. */
      const chain = newChain();

      const plan =
        roll && tray
          ? rollPlan(request?.card, actor, request?.modifiers, {
              /* A paid second half rolls too. Eleven halves in the codex carry
                 dice and none of them repeats the base card's, so the half adds
                 links rather than replacing them. `price` is what says it was
                 taken, exactly as in playEvent. */
              half: Boolean(options.price),
            })
          : [];

      /* ---- 1. the price ---- */
      const body = write(spendUse(request, actor, mode, amount, options));
      if (Object.keys(body).length > 0) patch(body);

      /* ---- 2. the table ----
         Chained only when there is something to hang under it. A use that rolls
         nothing is a plain row, and a chain id nothing ever joins would leave a
         block waiting forever for a throw that was never coming. */
      if (tell) {
        log(playEvent(request, actor, mode, amount, { ...options, chain: plan.length > 0 ? chain : null }));
      }

      /* ---- 3 to 6. the dice ----
         Deliberately not awaited by the caller. Everything above has already
         happened; what follows is a conversation with the player that may take
         as long as they like, and the block that started it has a prompt to
         close in the meantime. */
      if (plan.length > 0) void throwChain(tray, plan, { request, actor, chain });

      return body;
    },
    [tray, character, patch, log]
  );
}

/**
 * The chain itself, one link at a time.
 *
 * Its own function because it is the only part that waits, and because a promise
 * nobody is holding must not be able to throw: a rejected float here would land
 * as an unhandled rejection in the console of a player whose dice worked fine.
 */
async function throwChain(tray, plan, { request, actor, chain }) {
  let maximize = false;

  try {
    for (const link of plan) {
      const result = await tray.present({
        ...link,
        name: request?.name ?? 'A roll',
        note: actor?.name ?? '',
        card: request?.card?.id ?? null,
        chain,
        log: true,
        maximize: link.shape === 'value' ? maximize : false,
      });

      // Closed without throwing. The chain stops where the player stopped it.
      if (!result) return;

      /* A critical success maximises the damage that follows it, and only the
         one roll: a second damage link on the same card is its own throw. */
      maximize = link.shape === 'check' && isCriticalSuccess(result.verdict);
    }
  } catch (error) {
    console.warn('The dice stopped mid-chain:', error);
  }
}
