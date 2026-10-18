/**
 * What a night in the party's own town is worth, by its best open Tavern.
 *
 * Jules, 2026-10-18: "maybe add in the interface when the town is activated
 * that you can say if you're resting in the town ... based on the tier of the
 * tavern ... at tier one, um, nothing. At tier two, uh, whenever they rest in
 * their town, they get a karma point. And at tier three ... start the day with
 * uh, a shield uh, equal to five times their level."
 *
 * Its own small file, because three places read it and none of them should
 * have to carry the whole town to do so: the Fief tab that shows it, the
 * calendar that stamps it on a rest call, and the rest that applies it. The
 * town itself never touches a sheet. A call carries `town: { tavern }` and each
 * sheet's own rest reads it (see `restPlan` in rest.js).
 *
 * A Long Rest's alone, like a roof's, and never stacked with one: a night gives
 * one better night's Karma, and wakes with the larger of the two Shields.
 */

export function townRest(tier) {
  const t = Math.min(3, Math.max(0, Math.floor(Number(tier) || 0)));
  return { tavern: t, karma: t >= 2 ? 1 : 0, shieldPerLevel: t >= 3 ? 5 : 0 };
}

/** What it gives, in a line for a panel. */
export function townRestWords(tier) {
  const t = townRest(tier);
  if (!t.tavern) return 'No Tavern is open, so the town gives a bed and nothing more.';
  if (t.tavern === 1) return 'The Tavern at tier 1 gives a meal and a bed, and nothing more.';
  if (t.tavern === 2) return 'The Tavern at tier 2: a Karma point for every character.';
  return 'The Tavern at tier 3: a Karma point, and a Shield of five times their level to start the day.';
}

/** And in a few words, for the end of a sentence: "a Karma point". '' for nothing. */
export function townGiftWords(tier) {
  const t = townRest(tier);
  if (t.shieldPerLevel) return 'a Karma point and a Shield of five times their level';
  if (t.karma) return 'a Karma point';
  return '';
}
