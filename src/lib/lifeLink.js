/**
 * LIFE LINK as arithmetic: who is in the link, and what each of them takes.
 *
 * The card (spells.js) says "Health any linked entity loses or restores is split
 * evenly between all of them, rounding down." Until 2026-10-10 that was a
 * sentence on a card and nothing else: the cast laid a five turn row on each
 * target and no number ever moved through it.
 *
 * ----------------------------------------------------------------- the reading
 * The row carries its own roll call. A cast is the one moment the whole group is
 * known, so the caster writes the members onto the row they lay (`linkFor`), and
 * every member's row says the same five names. Whichever body is struck then
 * knows who else shares it without asking anybody, which is what lets this work
 * across sheets that may not write to one another.
 *
 *   damage    **Health lost**, which is what is left after Armor and Shield. A
 *             linked body is still struck the ordinary way (Armor and Shield do
 *             their work on the body hit), and the Health that got through is
 *             what the link divides. Each member loses the whole-number share.
 *   healing   The Health rolled, divided the same way. Not what the body hit
 *             could actually take: a full body healed still shares the heal with
 *             a hurt one, which is the whole use of the spell.
 *   rounding  Down, per the card. The remainder is simply not lost or restored.
 *
 * A share that arrives (`link: true` on the delivery) is never divided again.
 * That one flag is what keeps five bodies from splitting each other's shares
 * forever.
 *
 * What nothing here can do: the leash. "More than 12 meters at its Turn End
 * leaves the link" needs positions the sheet does not have, so the table drops
 * the row by hand, and the other members keep counting the one who left until
 * the spell is recast. Flagged in data/README.md.
 */

export const LIFE_LINK = 'life-link';
export const LINK_MAX = 5;

/** The roll call as stored: `[{ kind, id, name }]`, five at most, two at least. */
export function normalizeLink(raw) {
  if (!Array.isArray(raw)) return null;

  const seen = new Set();
  const members = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== 'object') continue;
    const kind = entry.kind === 'member' ? 'member' : entry.kind === 'foe' ? 'foe' : null;
    const id = String(entry.id ?? '').slice(0, 80);
    if (!kind || !id || seen.has(`${kind}:${id}`)) continue;
    seen.add(`${kind}:${id}`);
    members.push({ kind, id, name: String(entry.name ?? '').slice(0, 60) });
  }

  return members.length >= 2 ? members.slice(0, LINK_MAX) : null;
}

/**
 * The roll call a cast writes onto the row it lays, or null when the row is not
 * a Life Link or has fewer than two bodies to link.
 */
export function linkFor(row, targets = []) {
  if (row?.card !== LIFE_LINK) return null;
  return normalizeLink(
    (targets ?? []).map((body) => ({
      kind: body.kind === 'member' ? 'member' : 'foe',
      id: body.id,
      name: body.name,
    }))
  );
}

/** The row, with the roll call written on it where it should carry one. */
export function withLink(row, targets = []) {
  const link = linkFor(row, targets);
  return link ? { ...row, link } : row;
}

/** The roll call this body stands in, or null when it is in no link. */
export function standingLink(effects) {
  if (!Array.isArray(effects)) return null;
  for (const row of effects) {
    if (row?.card === LIFE_LINK) {
      const link = normalizeLink(row.link);
      if (link) return link;
    }
  }
  return null;
}

/** One member's whole-number share of `total`, over `n` bodies. */
export function shareOf(total, n) {
  const count = Math.max(1, Math.floor(Number(n) || 1));
  return Math.floor(Math.max(0, Math.floor(Number(total) || 0)) / count);
}

/** Everybody in the roll call but the body named. */
export function othersOf(link, self) {
  return (link ?? []).filter((one) => !(one.kind === self.kind && one.id === self.id));
}
