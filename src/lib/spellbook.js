/**
 * The spellbook: what a library set is worth to the sheet's own numbers.
 *
 * The Arcanist keeps a *library* rather than a prepared hand, and almost all of
 * that lives in loadouts.js, which is generic: `capacity`, `start`, `research`
 * and `boost` are spec fields any set could carry. This file is the one part
 * that is not generic, because it is not about spells at all.
 *
 * SPELLBOOK: "Your spellbook grants you 4 Additional Willpower per Rank in
 * Arcanist." That is a flat rider on a derived stat, bought by holding a rank
 * and by nothing else, and it has to be summed in the two places a Willpower
 * maximum is worked out: `deriveStats` in characterModel.js, which is what gets
 * written to the column, and `statMath` in statMath.js, which is what the tile's
 * breakdown promises adds up to it. A rider that landed in one and not the other
 * would make the tooltip lie, which is what scripts/check-stat-math.mjs exists to
 * catch.
 *
 * ---------------------------------------------------------------- the shape
 * Read off the set's own `spellbook` spec in talents.js rather than hard-coded
 * here, the same way `feralArmor` reads a form's `armorShare` and `pointCeilings`
 * reads a Trickster's rank. So a second library set with a book worth something
 * different is a number in the codex and no change here.
 *
 * Summed across sets rather than taking the highest, unlike the ceiling rules in
 * feral.js and moves.js. Those are two cards raising *one* ceiling, which the
 * stacking law says happens once. This is two different books, each bound to its
 * own holder and each worth its own Willpower, which is the same shape as two
 * enchantments granting Willpower: they add. Moot until a second such set exists.
 *
 * This file imports talents.js and nothing else, so it stays as cheap to read as
 * the numbers it hands back.
 */

import { getTalent, normalizeTalents } from './talents.js';

/**
 * Every set this character holds that keeps a book worth Willpower, with what
 * each one's rank comes to.
 *
 * The shape `weaponRiders` and `feralArmorFrom` both hand their credits back in:
 * `{ talent, willpower }`, one row per set actually granting any, so a reader can
 * be told which book lent it. A rank of 0 is a set not taken and grants nothing.
 */
export function spellbookWillpowerFrom(talents) {
  const rows = [];

  for (const entry of normalizeTalents(talents)) {
    const talent = getTalent(entry.id);
    const per = Math.floor(Number(talent?.spellbook?.willpower) || 0);
    const rank = Math.max(0, Math.floor(Number(entry.rank) || 0));
    if (per <= 0 || rank <= 0) continue;

    rows.push({ talent, willpower: per * rank });
  }

  return rows;
}

/**
 * The same, summed. This is the number `deriveStats` bakes into the column, and
 * 0 for everybody whose sets say nothing about a book.
 */
export function spellbookWillpower(talents) {
  return spellbookWillpowerFrom(talents).reduce((total, row) => total + row.willpower, 0);
}
