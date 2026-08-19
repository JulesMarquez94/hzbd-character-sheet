/**
 * The colour each choice on the Advancement tab wears.
 *
 * A choice takes the accent of the cards it deals — amber for talents, violet
 * for lineage, cyan for a background — so the panel, its buttons and the dialog
 * it opens are all one colour, and you always know which one you are inside.
 * A skill learned at an odd level keeps the background's cyan on purpose: it is
 * the same card out of the same codex, however it was come by.
 *
 * Attributes are the exception, and get their own green. They deal no cards at
 * all — there is nothing for them to borrow a colour from.
 *
 * Kept apart from the component so the constant can be imported without
 * dragging a component along with it.
 */
export const PICK_ACCENTS = {
  talent: 'var(--level-amber)',
  lineage: 'var(--haze-glow)',
  background: 'var(--focus-cyan)',
  skill: 'var(--focus-cyan)',
  attribute: 'var(--vital-green)',

  /* The Lore tab borrows the same panels. Nothing there is a choice between
     things, so nothing there takes a choice colour: copper, the site's own
     primary, which is exactly what it is for. */
  lore: 'var(--copper)',
  journal: 'var(--copper)',
};
