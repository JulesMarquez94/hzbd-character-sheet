/**
 * What each of the Character tab's six blocks is, in words.
 *
 * The arranger shows a list of rows rather than the blocks themselves, so it
 * needs a name for each one, and these are the names the block comments in
 * CharacterTab.jsx use. The Walkthrough reads the same six on its last step,
 * where it walks a new player through the sheet they are about to open, so the
 * two can never describe a block two different ways.
 *
 * The six are every character's. A talent set that puts a creature on the board
 * adds two more that are not in this table, and one that turns its holder into
 * something adds a third, because all three of those are named after the thing
 * rather than after the block: see `describeBlock` in CharacterTab.jsx.
 *
 * Kept apart from the component so the constant can be imported without
 * dragging the whole tab along with it, the same reason pickAccents.js sits on
 * its own.
 */
export const BLOCK_NAMES = {
  1: { name: 'Identity & Attributes', note: 'Name, lineage, background, the three attributes' },
  2: { name: 'Combat Profile', note: 'Defense, Armor, Reflex, Grit, Initiative, Speed' },
  3: { name: 'Loadout', note: 'What you are holding, and what it lets you do' },
  4: { name: 'Quick Bar', note: 'Everything you can spend points on, in reaching order' },
  5: { name: 'Always On', note: 'The passives you never have to play' },
  6: { name: 'Turn & Effects', note: 'The clock, and what is currently on you' },
};
