import { characterLinked } from '../../lib/combatApply.js';
import { appliedEvent } from '../../lib/campaignLog.js';
import { LIFE_LINK } from '../../lib/lifeLink.js';
import { getCard } from '../../lib/weapons.js';

/**
 * A change landing on this sheet, with a Life Link honoured.
 *
 * The one door for a delivered hit or heal and for a number taken off a boundary
 * clause, so a linked body divides the same way from either. The sheet writes
 * its own share through `patch`, and what the rest of the link is owed goes on
 * the table log as one delivery marked `link`, which each member's own client
 * (or the Game Master's page, for an enemy) lands for itself. A sheet can write
 * nobody else's pools, which is why the share is posted and not applied. See
 * lifeLink.js and `characterLinked` in combatApply.js.
 *
 * `link` is true for a delivery that is itself a share: it lands as it stands.
 */
export function landLinked(character, args, { patch, log, link = false }) {
  const { body, shares } = characterLinked(
    character,
    args,
    { kind: 'member', id: character?.id },
    { link }
  );

  if (body) patch?.(body);

  if (shares && shares.to.length > 0 && log) {
    log(
      appliedEvent(
        {
          name: character?.name ?? '',
          portrait: character?.portrait_url ?? null,
          owner: null,
          card: getCard(LIFE_LINK) ?? null,
        },
        { kind: shares.kind, total: shares.each, types: [] },
        shares.to.map((one) => ({
          kind: one.kind,
          id: one.id,
          name: one.name,
          landings: [shares.each],
        })),
        { link: true }
      )
    );
  }
}
