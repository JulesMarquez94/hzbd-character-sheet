/**
 * The four ways to make a character.
 *
 * Making a character is one row and a pile of level choices, and there is more
 * than one reasonable way to walk somebody through them. A player on their
 * first character wants to be asked one thing at a time, with the rule beside
 * it. Some people would rather answer questions about a life than tick boxes
 * on a sheet, and find out what that made. A player joining a table that is
 * already under way wants every chooser from level 1 up to tonight's level
 * open at once. And a table starting tonight wants a drifter that is already
 * built.
 *
 * All four end in the same place: the same row, with the same columns filled
 * in. Nothing here is a different kind of character, only a different way of
 * arriving at one, so a character made on any path can be finished on any
 * other. The path is a URL parameter on `/characters/:id/new` rather than a
 * column on the row, because it is how you got here and not something the
 * character is.
 *
 * The order below is the order the chooser deals them, and the first card is
 * the way in for a first character. Jules, 2026-09-12: "make the walkthrough
 * the main first choice for character creation. Then we are going to change
 * the freehand pick to be made when you are creating character above level 1."
 * So the Walkthrough leads and is what a URL naming no path opens, and the
 * Free Hand asks which level to start at: see `asksLevel` here and
 * src/lib/startingLevel.js for what a level above 1 hands over.
 *
 * `ready` is what the chooser reads: an unbuilt path shows what it will be and
 * cannot be taken. Building one means writing its screen, listing it in
 * `PATH_VIEWS` in CreationWizard.jsx and flipping the flag here. The router
 * falls back to the "not built yet" screen when a flag is flipped without a
 * view behind it, so the two can never disagree into a blank page.
 */
export const CREATION_PATHS = [
  {
    key: 'guided',
    title: 'Walkthrough',
    line: 'One choice at a time, with the rules beside it.',
    blurb:
      'The four choices of level 1, asked in order, with what each one does to your numbers spelled out as you go. Made for a first character, and for anyone who would rather be told why.',
    accent: 'var(--vital-green)',
    ready: true,
    /* The card the chooser marks "Start here". One path carries it. */
    recommended: true,
  },
  {
    key: 'crossroads',
    title: 'Crossroads',
    line: 'Answer at every fork, and meet who you became.',
    blurb:
      'Eight moments from a life, and what you did in each. Your lineage, background, talents and attributes fall out of the answers, and a level 2 drifter is waiting for you at the end of them.',
    accent: 'var(--haze-glow)',
    ready: true,
  },
  {
    key: 'freeform',
    title: 'Free Hand',
    line: 'Start above level 1, with every choice at once.',
    blurb:
      'For a character joining a table already under way. Choose the level they start at, and every chooser from level 1 up to it opens at once, with the coins, potions, armor and ring the road would have given them.',
    accent: 'var(--level-amber)',
    ready: true,
    /* The enlist box asks which level to start at, and hands over what that
       level grants before the row exists. Only this path does. */
    asksLevel: true,
  },
  {
    key: 'premade',
    title: 'Ready-Made',
    line: 'Start from a drifter already built.',
    blurb:
      'Take one off the roster and level 1 is already spent: lineage, background, a talent set, attributes and the kit they carry. Keep them exactly as they came, or change anything you like once the sheet opens.',
    accent: 'var(--focus-cyan)',
    ready: false,
  },
];

/** The path a creation screen takes when the URL names none, or names one that
    no longer exists. The Walkthrough, because it is the way in for anyone who
    does not yet know which way in they want. */
export const DEFAULT_PATH = 'guided';

/** Never null: an unknown key falls back to the default rather than leaving the
    creation screen with nothing to render. */
export function creationPath(key) {
  return (
    CREATION_PATHS.find((path) => path.key === key) ??
    CREATION_PATHS.find((path) => path.key === DEFAULT_PATH)
  );
}
