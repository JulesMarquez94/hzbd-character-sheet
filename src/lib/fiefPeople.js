import { hash } from './fiefIsland.js';

/**
 * The Fief's people: the few the party talks to, and the names on its
 * buildings.
 *
 * Jules, 2026-10-18: "most of them are numbers and you don't need to assign ...
 * Instead, when you build a key building ... you will have like a key person in
 * it. So the woodcutter has like the main woodcutter ... In the keep, you have
 * uh, an advisor and you have um, like a foreman ... if you have a castle, then
 * you have a chief of the guard. And if you have a temple, then you have a high
 * priest and so on."
 *
 * So the town's population is one number, and the only people with names are
 * the ones who come with a building: one per building, two at the Keep and a
 * third when it becomes a Castle. Houses and walls bring nobody.
 *
 * ------------------------------------------------------------- generated
 * Everything here is worked out from where a building stands, never stored: the
 * same hex gives the same Head farmer called the same thing with the same line
 * about them on every screen at the table. Only what the Game Master rewrites is
 * stored, on `fief.cards` and `fief.people` (see src/lib/fief.js), and a
 * rewrite always wins over what was generated.
 *
 * No art is generated. Every card has an empty picture slot the Game Master
 * fills with an upload.
 */

/** Who comes with each building: their role and a few lines to pick from. */
export const KEY = {
  keep: [
    ['Advisor', [
      'Keeps the ledgers and most of the secrets. Ask what the town needs next, what it can afford and who is unhappy about it.',
      'Has served three stewards and outlived two of them. Knows what every building costs and what every guild wants.',
      "Writes everything down, twice. The first one to ask about the town's money, its debts and its rumours.",
    ]],
    ['Foreman', [
      'Runs every build in town. Talk here about what is going up, how long it will take and what it would cost to change it.',
      'Has a pencil behind one ear and a schedule for everything. Ask for a project to go faster and hear exactly what it would take.',
      'Knows every builder by name and every scaffold by its creak. The one to see about building, moving or tearing down.',
    ]],
  ],
  castle: [
    ['Chief of the guard', [
      'Commands the walls, the gates and the watch. Ask about raids, patrols and who has been seen on the roads.',
      'An old soldier who sleeps in boots. Wants more towers and fewer open gates, and will say so.',
      'Knows which gate creaks and which guard drinks. The one to see about a threat, a prisoner or an escort.',
    ]],
  ],
  farm: [['Head farmer', [
    'Reads the weather in an aching knee. Ask about the harvest, the granary and what the crows have been up to.',
    'Up before the roosters and proud of it. Knows every field and every quarrel over a boundary stone.',
  ]]],
  hunter: [['Huntmaster', [
    'Can tell a stag from a story at a hundred paces. Ask about game, tracks and what else hunts in the woods.',
    'Quiet, patient and never lost. The one to see about a guide, a trail or a beast that should not be there.',
  ]]],
  tavern: [['Innkeeper', [
    'Pours with one hand and settles fights with the other. Ask about rooms, meals and every rumour that came through the door.',
    'Remembers every face and most debts. Keeps the best room for the party and the best gossip for whoever asks nicely.',
  ]]],
  woodcutter: [['Head woodcutter', [
    'Sings at the axe and swears at the weather. Knows every path in the woods and what walks them.',
    'Came with the first grant and never left the treeline. Ask about timber, trails and the wolves.',
  ]]],
  fisher: [['Boatmaster', [
    'Reads the sea by its colour and the sky by its smell. Ask about the catch, the tides and the wrecks.',
    'Has never once fallen in, by their own telling. Knows every cove from here to the cliffs.',
  ]]],
  quarry: [['Quarry foreman', [
    'Can split a block along a hair. Ask about stone, cave ins and what the last blast turned up.',
    'Deaf in one ear from the hammers and proud of it. Knows the heights better than the goats do.',
  ]]],
  mine: [['Pit foreman', [
    'Listens to the rock before anyone digs. Ask about ore, the deep tunnels and the noises down there.',
    'Counts every miner in at dawn and out at dusk. The first to hear when something under the hill wakes.',
  ]]],
  docks: [['Harbormaster', [
    'Reads a ship by its wake and a captain by their boots. Ask about cargo, prices and who came in on the tide.',
    'Keeps the tally of every crate that lands. Knows the trade routes and the smugglers who use them.',
  ]]],
  market: [['Market factor', [
    'Knows the price of everything on three rivers. Ask what is for sale, what is scarce and who is buying.',
    'Settles every quarrel between stallholders and remembers every debt. The one to see about a special order.',
  ]]],
  armorsmith: [['Master smith', [
    'Will hit your shield with a hammer to prove it. Ask about armor, weapons and repairs.',
    'Forearms like hams and a voice like a lark. Takes commissions and holds grudges about bad steel.',
  ]]],
  alchemist: [['Alchemist', [
    'Eyebrows grow back eventually. Ask about potions, ingredients and what not to drink.',
    'Smells of smoke and lavender. Sells the remedies and buys strange things the party brings home.',
  ]]],
  enchanter: [['Enchanter', [
    'Prices are written in a script only buyers can read. Ask about commissions, runes and old relics.',
    'Talks to the lamps and listens to the answers. Takes commissions for enchanted gear, at a price.',
  ]]],
  temple: [['High priest', [
    "Rings the bell a minute early, every day. Ask for a blessing, a burial or a word about the town's mood.",
    'Knows every confession in town and keeps every one. The one to see about the faith, the poor and the dead.',
  ]]],
  casern: [['Sergeant of the watch', [
    'Shouts in a whisper, somehow louder. Ask about recruits, patrols and trouble in the streets.',
    'Drills the guards at dawn and dices with them at dusk. Knows every brawl before it starts.',
  ]]],
  cemetery: [['Keeper of the dead', [
    'Talks to the graves, and some talk back. Ask about the dead at work and the rites they need.',
    'Pale, polite and always cold. Keeps the undead labourers in line and the living at a distance.',
  ]]],
  park: [['Gardener', ['Knows every pine by its first name. Ask about the gardens, the seasons and who meets there at night.']]],
  square: [['Town crier', ['Has the loudest voice in town and the latest news. Ask what is being said, and pay to have something said.']]],
  fountain: [['Water warden', ['Tastes the water every morning. Ask about the wells, the springs and the wishes thrown in.']]],
  tower: [['Lookout', ['Sharpest eyes in the town. Ask what was seen on the road, the sea or the treeline.']]],
};

/** The people the Game Master can add from a list, before rewriting them. */
export const TEMPLATES = [
  ['Merchant', 'Sells what the shops do not, and asks no questions about where it goes.'],
  ['Traveller', 'Arrived on the last road with dust on the boots and a story nobody can check.'],
  ['Noble', 'Visits from the capital, expects a room at the Keep and notices everything.'],
  ['Priest', 'Tends a small shrine of their own and the people the temple forgets.'],
  ['Guard', 'Off duty more than on, and knows every tavern on the way home.'],
  ['Healer', 'Sets bones for a coin and stitches for a story.'],
  ['Scholar', 'Copies the old stones by the cemetery and asks too many questions.'],
  ['Spy', 'Seems harmless. Writes letters every night to someone far away.'],
  ['Bard', 'Knows a song about every one of the party. None of them true.'],
  ['Elder', 'Remembers the town before the walls, and before the Keep.'],
  ['Child', 'Runs errands for anyone with a copper and hears everything.'],
  ['Stranger', 'Nobody knows where they came from. The Game Master does.'],
];

/** A building's own name, picked by its hex. {L} is its key person's last name. */
const TITLES = {
  farm: ["{L}'s Fields", 'Goldenrow Farm', 'The Long Acre', 'Millbrook Farm'],
  hunter: ["{L}'s Lodge", 'The Antler Hut', 'The Green Arrow', 'Wolfwatch Lodge'],
  tavern: ['The Drowsy Gryphon', 'The Crooked Lantern', "{L}'s Rest", 'The Last Hearth'],
  woodcutter: ["{L}'s Lumber Camp", 'The Pine Cut', 'Greenfell Camp', 'The Axe and Stump'],
  fisher: ['The {L} Nets', 'Gull Rock Landing', 'The Salt Hook', 'Brine Steps'],
  quarry: ['{L} Quarry', 'The Grey Cut', 'Hammerstone Pit', 'The White Face'],
  mine: ['The {L} Delve', 'Deepvein', 'The Iron Throat', 'Old Lantern Mine'],
  docks: ['{T} Quay', 'The Long Pier', 'Saltgate Wharf', 'The Merchant Steps'],
  market: ['The Market Cross', 'Copper Square Market', 'The Covered Stalls', '{T} Market'],
  armorsmith: ['{L} Armorers', 'The Iron Glove', 'The Red Anvil', 'Hammer and Hauberk'],
  alchemist: ['The Green Phial', "{L}'s Remedies", 'The Bubbling Still', 'The Last Drop'],
  enchanter: ['The Violet Lantern', "{L}'s Sigilworks", 'The Whispering Rune', 'The Bright Thread'],
  temple: ['The Temple of the Dawn', 'The Old Chapel', 'The House of Candles', 'The Bell Temple'],
  casern: ['The Watch House', 'The Iron Barracks', 'The Gate Guard Hall', 'The Casern'],
  cemetery: ['{T} Yard', 'The Quiet Acre', 'The Lantern Field', 'Gallows Rest'],
  park: ['The Green', '{L} Gardens', 'The Pine Walk', 'Elder Green'],
  square: ['Crown Square', 'Lantern Square', 'The Market Cross', 'Bell Square'],
  fountain: ['The Old Well', "{L}'s Fountain", 'The Moss Spring', 'The Wishing Well'],
  tower: ['The Crow Tower', 'The Gull Tower', 'The Lantern Tower', 'The Watch Tower'],
  wall: ['The Town Wall'],
};

/** What each building is like, before the Game Master says otherwise. */
export const LORE = {
  keep: "The seat of the town and the home of the party. Its hall holds the town's ledgers, its strongroom and a long table where the party is always expected.",
  farm: 'Rows of grain to the edge of the hex and a barn that smells of hay. The town eats what grows here.',
  hunter: 'A low lodge hung with antlers and drying pelts, with a target worn ragged behind it.',
  tavern: 'Low beams, a long fire and a cellar that is never quite empty. The party sleeps here when it rests in the town.',
  woodcutter: 'A clearing at the edge of the woods, loud with axes from first light. The logs are stacked to dry before they reach the town.',
  fisher: 'Nets drying on poles, boats pulled up on the shingle and gulls arguing over the gutting table.',
  quarry: "A pale scar in the hillside, ringed with ladders and loose stone. Every block that leaves it carries the quarry's mark.",
  mine: 'A dark mouth in the heights, timbered against the weight of the hill. Carts rattle out full and come back empty.',
  docks: 'Where the ships tie up and the town meets the world. Crates, sailors and news come ashore here first.',
  market: 'Stalls under bright awnings, haggling from dawn and a crier at noon. Whatever the town has, it sells here.',
  armorsmith: 'A forge that never quite goes cold, a rack of blades by the door and the ring of hammers half the night.',
  alchemist: 'Shelves of coloured glass and a smell that changes by the hour. The door is painted green so nobody walks in by mistake.',
  enchanter: 'A narrow tower with runes over the door and a lamp that burns without oil. Commissions are taken at the top of the stairs.',
  temple: 'Bells, candles and cool stone. The town marries, mourns and gives thanks here.',
  casern: 'Bunks, a drill yard and an armory. The guards live here between watches.',
  cemetery: 'Iron railings, crooked stones and lanterns that never go out. Some of those buried here still work for the town.',
  park: 'Lawns, pines and benches, where the town walks on a rest day.',
  square: 'Paving, lamps and benches, where the town gathers to hear the news.',
  fountain: 'Clear water from a deep spring, and coins at the bottom from every wish.',
  tower: 'A stone tower on the wall with a lamp at the top and a lookout who never sits down.',
  wall: 'Stone, battlements and gates. It keeps the town in and everything else out.',
  custom: 'A building the Game Master raised for the story.',
};

/** The kit models a custom building may be drawn as, with what each one looks like. */
export const CUSTOM_MODELS = [
  ['building_tavern_red', 'A tavern'],
  ['building_home_B_yellow', 'A tall house'],
  ['building_home_A_green', 'A cottage'],
  ['building_church_red', 'A chapel'],
  ['building_tower_B_blue', 'A wizard tower'],
  ['building_tower_A_yellow', 'A tower'],
  ['building_windmill_yellow', 'A windmill'],
  ['building_watermill_green', 'A watermill'],
  ['building_archeryrange_blue', 'An archery range'],
  ['building_well_red', 'A well'],
  ['building_market_red', 'A stall'],
  ['building_stage_C', 'Scaffolding'],
  ['building_destroyed', 'A ruin'],
  ['tent', 'A tent'],
  ['crypt', 'A crypt'],
  ['shrine_candles', 'A shrine'],
];

const FIRST = ['Aldric', 'Mira', 'Ida', 'Lorn', 'Tobin', 'Hesta', 'Corin', 'Rolf', 'Sela', 'Odo', 'Tamsin', 'Nell', 'Piet', 'Gwen', 'Edda', 'Wynn', 'Joss', 'Liesl', 'Cade', 'Runa', 'Wat', 'Fen', 'Ysolde', 'Hob', 'Agna', 'Merrit', 'Brisa', 'Osk', 'Tilda', 'Emric'];
const LAST = ['Venn', 'Reed', 'Ash', 'Tanner', 'Brook', 'Crane', 'Hale', 'Barrow', 'Holm', 'Thatch', 'Moss', 'Carver', 'Wick', 'Ward', 'Bellow', 'Flint', 'Miller', 'Harrow', 'Marsh', 'Tallow', 'Quill', 'Dunn', 'Cole', 'Rook', 'Sedge'];

/** The houses' quarter names, handed out in the order the houses go up. */
export const QUARTERS = ['Old Quarter', 'Keepside', 'South Lanes', 'Wellside', 'Mill Row', 'Lantern Lane', 'Far End', 'Hollow Row', 'New Quarter', 'Edge Street', 'Smoke Lane', 'Last Light', 'Pine Row', 'Shore Lane', 'Gallows Hill', 'Bell Street', 'Tanner Yard', 'Saltgate', 'Crown Walk', 'Rook Lane'];

const pickOf = (list, n) => list[n % list.length];

export function personName(seed) {
  const a = hash(seed, 7);
  return `${FIRST[a % FIRST.length]} ${LAST[(a >>> 8) % LAST.length]}`;
}

/** The roles a building brings at a level. The Castle adds its Chief. */
export function keyRoles(type, level) {
  const roles = [...(KEY[type] ?? [])];
  if (type === 'keep' && level >= 3) roles.push(...KEY.castle);
  return roles;
}

/**
 * The key people a building has at its level, as generated. Their ids are the
 * building's and the role's place, so a rewrite stored against one finds the
 * same person on every screen and after every tier.
 */
export function keyPeopleOf(building) {
  const seed = hash(building.q * 13 + 101, building.r * 7 + 211);
  return keyRoles(building.type, building.level).map(([role, notes], i) => ({
    id: `${building.id}:${i}`,
    bid: building.id,
    role,
    note: pickOf(notes, seed >>> (i * 3)),
    name: personName(seed + i * 977),
    img: null,
    custom: false,
  }));
}

/** A building's generated name, from its hex and its key person. */
export function generatedTitle(building, townName, lead) {
  const list = TITLES[building.type];
  if (!list) return null;
  const last = lead?.name?.split(' ')[1] ?? townName;
  return pickOf(list, hash(building.q + 40, building.r + 40))
    .replace('{L}', last)
    .replace('{T}', townName);
}
