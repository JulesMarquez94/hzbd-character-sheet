/**
 * The four ways to make a character.
 *
 * Making a character is one row and a pile of level-1 choices, and there is
 * more than one reasonable way to walk somebody through them. A player who
 * knows the game wants every chooser open at once. A player on their first
 * character wants to be asked one thing at a time. A table starting tonight
 * wants a drifter that is already built. And some people would rather answer
 * questions about a life than tick boxes on a sheet, and find out what that
 * made.
 *
 * All four end in the same place: the same row, with the same columns filled
 * in. Nothing here is a different kind of character, only a different way of
 * arriving at one, so a character made on any path can be finished on any
 * other. The path is a URL parameter on `/characters/:id/new` rather than a
 * column on the row, because it is how you got here and not something the
 * character is.
 *
 * `ready` is what the chooser reads: an unbuilt path shows what it will be and
 * cannot be taken. Building one means writing its screen, listing it in
 * `PATH_VIEWS` in CreationWizard.jsx and flipping the flag here. The router
 * falls back to the "not built yet" screen when a flag is flipped without a
 * view behind it, so the two can never disagree into a blank page.
 */
export const CREATION_PATHS = [
  {
    key: 'freeform',
    title: 'Free Hand',
    line: 'Every choice at once.',
    blurb:
      'The level-1 block with nothing hidden: your lineage, your background, a talent set and your attributes, taken in whatever order suits you. The quickest way in when you already know what you are making.',
    accent: 'var(--level-amber)',
    ready: true,
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
  {
    key: 'guided',
    title: 'Walkthrough',
    line: 'One choice at a time, with the rules beside it.',
    blurb:
      'The same choices as the free hand, asked in order, with what each one does to your numbers spelled out as you go. Made for a first character, and for anyone who would rather be told why.',
    accent: 'var(--vital-green)',
    ready: false,
  },
  {
    key: 'adventure',
    title: 'The Long Road',
    line: 'Answer for yourself and meet who you became.',
    blurb:
      'A run of questions about where you came from and what you did about it. Your lineage, background, talents and attributes fall out of the answers, and the drifter is waiting for you at the end of them.',
    accent: 'var(--haze-glow)',
    ready: false,
  },
];

/** The path a creation screen takes when the URL names none, or names one that
    no longer exists. The free hand, because it is the one that asks nothing of
    the player that the sheet does not ask anyway. */
export const DEFAULT_PATH = 'freeform';

/** Never null: an unknown key falls back to the default rather than leaving the
    creation screen with nothing to render. */
export function creationPath(key) {
  return (
    CREATION_PATHS.find((path) => path.key === key) ??
    CREATION_PATHS.find((path) => path.key === DEFAULT_PATH)
  );
}
