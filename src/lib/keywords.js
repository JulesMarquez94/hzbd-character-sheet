/**
 * The glossary — the words on a card that mean something exact.
 *
 * Exactly four things on a card are allowed to stand out from the prose, and
 * this file holds the third:
 *
 *   an attribute    Mind, Instinct, Physique, in that attribute's colour
 *   a damage type   Sharp, Decay, Force, in its own
 *   a keyword       a *defined term*. It wears its colour and answers what it
 *                   means when you point at it.
 *   a **parameter** how far, at whom, for how long. Weight, never colour.
 *
 * ------------------------------------------------------------------- the bold
 * The fourth is new, and it is narrow on purpose. Card bodies once carried
 * `**bold**` for emphasis in general — whatever clause the writer thought
 * mattered — and that emphasis was removed from the codex outright, because a
 * card with thirty emphasised phrases has nothing emphasised at all.
 *
 * On Jules's instruction of 2026-08-25 it is back, spending its one mark on the
 * three things a player scans a card for and on nothing else:
 *
 *   range      "within **9 meters (30 feet)**", "a **6-meter (20-foot)** radius"
 *   targeting  the target the card *declares* — "**an entity**", "**all
 *              entities**", "**up to two entities**". Never a back-reference:
 *              "the target" and "the entity" point at something already named
 *              and are prose.
 *   duration   "for **10 turns (1 minute)**", "**until your next Long Rest**".
 *              A measured span, or the rest or turn it runs to. A condition is
 *              not a duration: "until it is destroyed" stays plain.
 *
 * A phrase already lit is not bolded on top of being lit: MOVE prints
 * "[[speed]] meters" and the live value is louder than any weight. A term
 * inside a bolded phrase keeps its own colour, which is the point of the two
 * marks being different — "**all entities**" is a scope wearing a defined word.
 *
 * If you are tempted to bold anything else, either it is a defined term and
 * belongs in this file, or it is prose and belongs plain.
 *
 * Every parser that reads card prose takes the markers off first, in one place:
 * see `cardProse` in cardText.js. A marker in the middle of a phrase is
 * invisible to a reader and fatal to a regex.
 *
 * A keyword is matched wherever it appears, so Willpower is violet every time
 * it is printed and never violet in one card and plain in the next. The
 * colours are the sheet's own: a resource keyword wears exactly the colour its
 * bar, orb or pip wears on the Character tab.
 *
 * ------------------------------------------------------------- writing cards
 * Because a keyword carries its own explanation, a card must NOT spell one out
 * in parentheses. Write "you gain advantage", never "you gain advantage (roll
 * twice and take the higher)" — the reader points at the word. If a term needs
 * explaining and is not in this file, the fix is to add it here, not to gloss
 * it in the card body.
 *
 * A term is lit wherever it appears, which cuts both ways: a card must not use
 * a defined word to mean an ordinary one. "Something critical" lit the
 * natural-20 rule, "give up the initiative" lit turn order, and a card naming
 * itself lit Armor inside Gore Armor and touch inside Vampiric Touch. All four
 * were reworded rather than exempted, because an exemption would have to be
 * remembered every time and a rewording never does.
 *
 * `detail` is a sentence or two, written to be read in a tooltip while
 * something else is happening at the table. Not rules lawyering — the shape of
 * the thing.
 *
 * `provisional: true` marks a term whose wording here is a best reading of what
 * the cards using it imply, rather than something transcribed from a rules sheet.
 *
 * **Most of those are gone.** The designer's General Rules · Status & Terms tab
 * arrived on 2026-08-19 with 26 definitions, and every term it covers now carries
 * their wording verbatim. Three of them corrected the codex rather than filling a
 * blank, and they are worth knowing about:
 *
 *   Advantage    is a d4 added to the roll, not a reroll kept high. Disadvantage
 *                is the same d4 subtracted. Both stack and cancel 1-to-1.
 *   Empowered    adds a die (2d6 becomes 3d6). **Elevate** is the one that grows
 *                the die (d6 becomes d8). The codex had one doing the other's job;
 *                see the note in cardText.js.
 *   Critical Hit is a Roll landing 6 or more above the DC, and a Critical Failure
 *                is one landing 6 or more below it. It cannot be "a natural 20":
 *                a Roll in this game is 2d6 plus an attribute. Until 2026-08-30
 *                this entry read "a maximum result on an Attack Roll", which was
 *                the rule before Jules settled the four bands the roller judges
 *                against. See the bands in dice.js.
 *
 * What is still provisional is what no sheet has covered yet: asleep, marked
 * and unconscious. **Stunned left that list on 2026-08-20** — ICE BLOCK spells
 * it out at its own foot, and its entry below is that sentence word for word,
 * which also settles what Amber Shard had been leaning on.
 */

/**
 * `terms` are the printed forms, matched whole-word and case-insensitively, so
 * one entry covers "Long Rest" and "long rest". List plurals explicitly rather
 * than guessing at suffixes.
 */
export const KEYWORDS = [
  /* ---------------------------------------------------------- what you spend */
  {
    id: 'willpower',
    terms: ['Willpower'],
    color: 'var(--stat-wp)',
    detail:
      'Your reserve of nerve and focus. Spent to power abilities and to bend rolls in your favour. Comes back on a Long Rest.',
  },
  {
    id: 'action-point',
    terms: ['Action Points', 'Action Point'],
    color: 'var(--stat-ap)',
    detail:
      'What a turn is made of. Every action costs some, and you get six back at the start of each of your turns.',
  },
  {
    id: 'reaction-point',
    terms: ['Reaction Points', 'Reaction Point'],
    color: 'var(--stat-rp)',
    detail:
      'Earned during a round and spent outside your own turn. A reaction can be paid from these instead of your Action Points.',
  },
  {
    id: 'reaction',
    terms: ['reaction'],
    color: 'var(--stat-rp)',
    detail:
      'Something you do on somebody else’s turn, in answer to what they did. Costs the same as it would on your turn. You just pay it from a different pool.',
  },
  {
    id: 'karma',
    terms: ['Karma'],
    color: 'var(--stat-karma)',
    detail: 'Spend 1 after seeing a die result to add 1d4 to it.',
  },
  {
    id: 'supplies',
    terms: ['Supplies'],
    color: 'var(--stat-supply)',
    detail:
      'The crate you travel on: rations, powder, reagents, rope. Spent on the road and on anything crafted during a rest.',
  },
  {
    id: 'coins',
    terms: ['Coins'],
    color: 'var(--stat-coin)',
    detail: 'Money. What you spend on people rather than on the road.',
  },

  /* ------------------------------------------------------ what keeps you up */
  {
    id: 'health',
    terms: ['Health'],
    color: 'var(--stat-health)',
    detail:
      'How much you have left. Past zero you are bleeding out, and a second full bar of damage kills you outright.',
  },
  {
    id: 'shield',
    terms: ['Shield'],
    color: 'var(--stat-shield)',
    detail:
      'Damage soaked before it reaches Health, and whatever it cannot absorb carries straight through. Caps at half your maximum Health, or all of it for a Feral Cursed.',
  },
  {
    id: 'bleeding-out',
    terms: ['bleeding out'],
    color: 'var(--stat-health)',
    detail:
      'At 0 Health or below. You are still on the table, and a second full bar of damage is death.',
  },

  /* ------------------------------------------------------ the six defences */
  {
    id: 'defense',
    terms: ['Defense'],
    color: 'var(--focus-cyan)',
    detail: 'How hard you are to hit. Every attack is rolled against it.',
  },
  {
    id: 'armor',
    terms: ['Armor'],
    color: 'var(--stat-armor)',
    detail: 'Flat damage reduction, taken off every hit that lands. It comes from gear alone.',
  },
  {
    id: 'reflex',
    terms: ['Reflex'],
    color: 'var(--stat-rp)',
    detail:
      'How fast you answer sudden danger: diving clear of a blast. Physique + Instinct.',
  },
  {
    id: 'grit',
    terms: ['Grit'],
    color: 'var(--stat-wp)',
    detail:
      'How well you withstand what gets inside you: poison, fear, a mental attack. Instinct + Mind.',
  },
  {
    id: 'initiative',
    terms: ['Initiative'],
    color: 'var(--stat-init)',
    detail: 'Added to your roll for turn order when a fight starts.',
  },
  {
    id: 'movement-speed',
    terms: ['Movement Speed'],
    color: 'var(--stat-speed)',
    detail:
      'The maximum distance in meters (or feet) you can cover when taking the Move or Jump ' +
      'action.',
  },

  /* ------------------------------------------------- what happens to a roll */
  {
    id: 'advantage',
    terms: ['advantage'],
    color: 'var(--def-healing)',
    detail:
      'When making a roll with Advantage, roll a d4 and add the value to your total result. ' +
      'Advantage stacks (each instance adds an additional d4). Advantage and Disadvantage ' +
      'cancel each other out on a 1-to-1 basis.',
  },
  {
    id: 'disadvantage',
    terms: ['disadvantage'],
    color: 'var(--stat-health)',
    detail:
      'When making a roll with Disadvantage, roll a d4 and subtract the value from your ' +
      'total result. Disadvantage stacks (each instance adds an additional d4 subtraction). ' +
      'Disadvantage and Advantage cancel each other out on a 1-to-1 basis.',
  },
  {
    id: 'reroll',
    terms: ['reroll'],
    color: 'var(--copper)',
    detail: 'Roll the same check again and take the new result, whether it is better or worse.',
  },
  {
    id: 'skill-check',
    terms: ['skill check', 'skill checks'],
    color: 'var(--copper)',
    detail:
      'A Roll made to determine the success or failure of a non-combat or specialized task, ' +
      'adding the appropriate Attribute to the result.',
  },
  {
    id: 'contested-roll',
    terms: ['contested rolls', 'contested roll'],
    color: 'var(--copper)',
    detail: 'Both sides roll and the higher result wins.',
  },
  {
    id: 'empowered',
    terms: ['Empowered'],
    color: 'var(--level-amber)',
    detail:
      'Increases the total number of your Damage Dice and Healing Dice by 1. Whenever a ' +
      'spell or ability calls for rolling dice, you roll 1 additional die of that same type ' +
      '(2d6 becomes 3d6).',
  },
  {
    /**
     * The rule Jules gave on 2026-08-30, in his own words as far as they go:
     * "when you roll max value on a damage or healing dice that dice explode
     * and you roll a dice of a category above. So if you roll an 8 on a d8 you
     * roll an additional d10 and add to the total." The two edges after it are
     * his rulings from the same day: the chain keeps going, and the ladder caps.
     *
     * `Exploding Dice` rather than `explodes`, which is not a spare choice. Three
     * spells already say a corpse or a seed "explodes", and a term that matched
     * those would hang a dice rule off a body going off. No card states this rule
     * yet, so the entry lights nothing today and is here for when one does. Where
     * a player actually meets it is the roller: see dieTitle in DiceSurface.jsx.
     */
    id: 'exploding',
    terms: ['Exploding Dice'],
    color: 'var(--level-amber)',
    detail:
      'When you roll the maximum value on a damage or healing die, that die explodes: roll an ' +
      'additional die of the category above and add it to the total. An 8 on a d8 throws a d10. ' +
      'A die that explodes into another maximum explodes again, and a d12 throws another d12.',
  },
  {
    id: 'critical',
    terms: ['Critical Hit', 'critical'],
    color: 'var(--level-amber)',
    detail:
      'A Roll that lands 6 or more above the DC. It guarantees a hit and maximizes the damage ' +
      'dealt, and a maximized damage die explodes the way any other one does. A Roll that lands ' +
      '6 or more below the DC is a Critical Failure.',
  },

  /* --------------------------------------------------------- what you swing */
  {
    id: 'melee-attack',
    terms: ['Melee Attack'],
    color: 'var(--dmg-sharp)',
    detail: 'An attack made within reach, rolled against the target’s Defense.',
  },
  {
    id: 'ranged-attack',
    terms: ['Ranged Attacks', 'Ranged Attack'],
    color: 'var(--dmg-sharp)',
    detail: 'An attack made at distance, rolled against the target’s Defense.',
  },
  {
    id: 'weapon-attack',
    terms: ['weapon attack', 'weapon attacks'],
    color: 'var(--dmg-sharp)',
    detail: 'Either of the two attacks the weapon in your hands teaches you.',
  },
  {
    id: 'martial-move',
    terms: ['Martial Moves', 'Martial Move'],
    color: 'var(--level-amber)',
    detail:
      'A trained manoeuvre bought with a talent, used alongside a weapon attack rather than instead of one.',
  },

  /* ------------------------------------------------------------ the clock */
  {
    id: 'long-rest',
    terms: ['Long Rest'],
    color: 'var(--copper)',
    detail:
      'An 8-hour break that consumes 10 Supplies. Successfully completing a Long Rest fully ' +
      'restores your Health and Willpower, and allows you to perform 1 Long Rest Action.',
  },
  {
    id: 'short-rest',
    terms: ['Short Rest'],
    color: 'var(--copper)',
    detail:
      'A 1-hour break that consumes 5 Supplies. If completed uninterrupted, you regain half ' +
      'of your maximum Health.',
  },

  /* ------------------------------------------------------------ the world */
  {
    id: 'entity',
    terms: ['entity', 'entities'],
    color: 'var(--text-silver)',
    detail: 'Anything that can be targeted: a person, a beast, a construct, a thing that is awake.',
  },
  {
    id: 'magic-burden',
    terms: ['Magic Burden'],
    color: 'var(--haze-glow)',
    detail:
      'How much worked magic you can carry before it starts to weigh. Capacity is Level + Mind + 10.',
  },

  /* ------------------------------------------------------------- statuses
   * The game has barely any yet. When it gets them they go here — one entry
   * each — and every card that names one lights up without being rewritten.
   */
  {
    id: 'marked',
    terms: ['marked'],
    color: 'var(--dmg-psychic)',
    detail: 'Singled out. Whoever marked it knows where it is and hits it more easily.',
  },
  {
    id: 'blinded',
    terms: ['Blinded', 'blinded'],
    color: 'var(--dmg-psychic)',
    /* Not on the Status & Terms tab. BLIND defines it outright at the foot of
       its own card, in a parenthesis, and that sentence is quoted here word for
       word rather than paraphrased — the same trade FRIGHTFUL ROAR made. The
       gloss then came off the card body, because a term that carries its own
       explanation must never be spelled out in prose as well.

       The card's own name is deliberately not a term here. BLIND opens with "You
       attempt to Blind a target", and lighting a card's title inside its own
       first sentence is noise rather than a definition. */
    detail:
      'The entity cannot see, as such cannot use any ability or spell that rely on ' +
      'being able to see.',
  },
  {
    id: 'frightened',
    terms: ['Frightened', 'frightened'],
    color: 'var(--danger-rose)',
    /* Not on the Status & Terms tab. FRIGHTFUL ROAR defines it outright at the
       foot of its own card, in a parenthesis, and that sentence is quoted here
       word for word rather than paraphrased — the same trade the Cauldron
       Keeper's four nouns made. The gloss then came off the card body, because
       a term that carries its own explanation must never be spelled out in
       prose as well. */
    detail:
      'Affected entities have Disadvantage on all Actions against the one frightening them.',
  },
  {
    id: 'poisoned',
    terms: ['poisoned'],
    color: 'var(--dmg-decay)',
    detail:
      'A Poisoned entity suffers Disadvantage on all actions until they complete a Long ' +
      'Rest or regain any amount of Health.',
  },
  {
    /* SICKNESS's own foot, word for word: the Death sheet (pulled 2026-08-26)
       spells it out under the card as "Diseased: The afflicted entity receives -1
       to all attributes until they take a long rest". The gloss then came off the
       card, which is the trade BURN, BLIND and SHADOW BIND all made before it.

       It is the only state in the codex that moves every attribute at once, and
       the one card that inflicts it is the one card that spreads it. */
    id: 'diseased',
    terms: ['diseased'],
    color: 'var(--dmg-decay)',
    detail:
      'The afflicted entity receives -1 to all attributes until they take a Long Rest.',
  },
  {
    /* The Elemental cards' own parenthesis, word for word — CLOAK OF FLAMES and
       SLAG SHOT both spell it out at their foot, and a defined term is never
       glossed in prose as well. Pulled 2026-08-20. */
    id: 'burn',
    terms: ['burn'],
    color: 'var(--dmg-fire)',
    detail: 'The entity becomes vulnerable to Fire damage until they take a Short Rest.',
  },
  {
    /* Here because BURN above has been defined in terms of it since 2026-08-20 and
       the word was never lit, and because ENBRITTLE on the Death sheet (pulled
       2026-08-26) closes with the gloss outright: "(note vulnerable means takes
       double damage from the damage type.)". A parenthesis on a card is what this
       file exists to absorb, so the sentence moved here and the parenthesis went.

       It lights in three places now rather than one: ENBRITTLE, BURN's own detail
       and the Nightmare Curse in enchantments.js, which has said "You are
       vulnerable to the damage dealt by your own Nightmare Wall spell" with
       nothing behind the word since the school arrived. All three mean the
       doubling. */
    id: 'vulnerable',
    terms: ['vulnerable'],
    color: 'var(--stat-health)',
    detail: 'A vulnerable entity takes double damage from that damage type.',
  },
  {
    /* STONEFLESH's own parenthesis, pulled 2026-08-26. The Earth cell glosses the
       word inside its own sentence, "(reistance means halved damaged)", and a
       defined term is never glossed in prose as well. The trade BURN made when the
       Elemental school arrived and VULNERABLE above made on the Death sheet.

       It lands beside VULNERABLE on purpose: the two are one rule read from both
       ends, doubled against halved, and only one end of it was written down. Five
       card bodies have printed this word with nothing behind it since each of them
       arrived — UMBRAL FORM's resistance to all damage, DRACONIC SCALES' chosen
       type, AMPHIBIAN's Cold, the Cauldron Keeper's hardened scale and now
       STONEFLESH. All five light. */
    id: 'resistance',
    terms: ['resistance', 'resistant'],
    color: 'var(--stat-shield)',
    detail: 'A resistant entity takes half damage from that damage type.',
  },
  {
    id: 'rooted',
    terms: ['rooted'],
    color: 'var(--dmg-decay)',
    detail:
      'A Rooted entity cannot take the Move or Jump action and is immune to any effect that ' +
      'would push or pull it.',
  },
  {
    id: 'asleep',
    terms: ['asleep'],
    color: 'var(--dmg-psychic)',
    detail:
      'Out cold, and unaware. Any damage wakes you, and so does an entity spending an action to shake you.',
  },
  {
    id: 'prone',
    terms: ['prone'],
    color: 'var(--stat-health)',
    detail:
      'The target is on the ground, attacks are made with disadvantage and move action ' +
      'costs are doubled. When the entity uses a move action the prone condition ends.',
  },
  {
    id: 'grappled',
    terms: ['grappled'],
    color: 'var(--stat-health)',
    detail:
      'A Grappled entity cannot use movement actions and has disadvantage on attacks. Once ' +
      'per turn a grappled entity can make a Physique roll against the grappler\'s Reflex. ' +
      'On a success they free themselves.',
  },
  {
    /* No longer provisional: ICE BLOCK (pulled 2026-08-20) spells Stunned out at
       its own foot, and this is that sentence word for word. */
    id: 'stunned',
    terms: ['stunned'],
    color: 'var(--dmg-lightning)',
    detail: 'The entity cannot take Actions or Reactions until the effect ends.',
  },
  {
    /* Not provisional, and never was in doubt: SHADOW BIND (pulled 2026-08-25)
       spells Constrained out at its own foot, and this is that sentence word for
       word. The same trade ICE BLOCK made for Stunned above.

       The Trickster's AMBUSH has named this status since 2026-08-23, beside
       Stunned and Grappled, with nothing behind the word. It is lit now. */
    id: 'constrained',
    terms: ['constrained'],
    color: 'var(--stat-health)',
    detail:
      'Constrained entities cannot take actions but are still aware of their surroundings.',
  },
  {
    /* Not provisional either, and this one was asked for outright: UNDO's cell on
       the Time sheet (pulled 2026-08-25) ends with a note to the developer rather
       than card text, "lets add the interrupted key word whcih means the next
       action in question does not happen but the cost is still spent". So the
       definition is the designer's and the note came off the card, which is the
       same trade SHADOW BIND made for Constrained above.

       Interrupted is not Stunned and the difference is the bill. A stunned entity
       takes no Actions at all; an interrupted one loses the Action it was taking
       and has already paid for it.

       It is printed on a card body as of 2026-09-03: CONCUSS was rewritten that
       day into a reaction that stops what it answered, and this is the word for
       what it does. Until then the term appeared once outside the Time family, in
       the old CONCUSS's *summary*, where it meant the ordinary English thing — a
       summary is plain text and never goes through CardText, so it was never lit
       and never needed rewording. Now the term and the card agree. */
    id: 'interrupted',
    terms: ['interrupted'],
    color: 'var(--stat-ap)',
    detail:
      'The Action in question does not happen, but its cost is still spent.',
  },
  {
    id: 'incapacitated',
    terms: ['incapacitated'],
    color: 'var(--stat-health)',
    detail: 'An Incapacitated entity cannot move, take Actions or spend Reaction Points.',
  },
  {
    id: 'unconscious',
    terms: ['unconscious'],
    color: 'var(--stat-health)',
    provisional: true,
    detail: 'Down and unaware. You act at all only once somebody brings you round.',
  },
  {
    id: 'dying',
    terms: ['dying'],
    color: 'var(--stat-health)',
    detail:
      'Below 0 Health and going. Stabilize stops it, and a second full bar of damage ends it.',
  },
  {
    /* **New on 2026-09-02, and it took Wound's old job.** Jules, redesigning the
       Martial Move system: "Bleed: stackable status that deal 1d6 damage at the
       start turn of entities. Remove 1 stack when receive 1 heal." That is the
       designer's own sentence, tidied for grammar and nothing else, the same
       trade every term on this shelf has made.

       Two things in it are worth reading twice. It is **stackable**, which the
       old Wound was, and each stack is its own 1d6 — REND lays one per Damage
       Die the swing rolled, so a big hit bleeds badly. And healing takes **one
       stack**, not the whole effect: the old Wound came off entirely at the
       first point of Health, which made any healing at all a full cure.

       The damage has no type, which is the designer's word for it: "deal 1d6
       damage". The old Wound's was Decay, and a bleed is not decay. Untyped
       damage is not new in this codex (four Primal Masters deal it) and a type
       nobody stated would be this file inventing one. Flagged in
       data/README.md. Coloured with Health rather than with a damage type for
       the same reason.

       CAUTERIZE has named this status since the Fire family was written ("this
       removes any Bleed or Poison effect") with nothing behind the word. It is
       lit now, which is the same thing that happened to Constrained when SHADOW
       BIND finally defined it. */
    id: 'bleed',
    terms: ['Bleed'],
    color: 'var(--stat-health)',
    detail:
      'Stackable effect. The entity takes 1d6 damage at every one of its Turn Starts. ' +
      'It loses one stack whenever it receives healing.',
  },
  {
    id: 'wound',
    terms: ['Wounds', 'Wound'],
    color: 'var(--dmg-decay)',
    /* **Redefined on 2026-09-02**, in the same breath as the Martial Move
       redesign: "Wound: singular status that make weapon and speacial weapon
       attack again the target empowred." So a Wound is no longer damage over
       time, it is an opening: everything that comes at the target with a weapon
       in its hands hits harder. Bleed above is what took over the old job, and
       the pair of them swapped roles rather than one being added.

       The old sentence was the WOUND plate's own, quoted word for word off the
       foot of the card. This one is the designer's own too, and the plate it
       came off is a line in chat rather than a cell in a sheet.

       **The clock is the old card's and the ruling is open.** Jules gave the
       effect and no duration, and the sentence it replaced ended "until they
       receive healing or they take a rest". That clause is kept rather than
       reinvented: it is the only clock this term has ever had, the tracker
       already understands both halves of it, and a status with no end is a
       status that never comes off. Flagged in data/README.md.

       **Singular** is the word Jules used and it is the difference that matters
       at a table: two Wounds are one Wound, so WOUND laid twice on the same
       target buys nothing the second time. It is also the stacking law this
       codex already keeps — an effect does not stack with itself from the same
       source — said on the term instead of on the card.

       Unlike BLIND and FRIGHTFUL ROAR, the card's own name *is* the term, and
       that is fine: "inflicts a Wound on the target" is the word being used for
       what it means. Gore Armor and Vampiric Touch were reworded because their
       titles collided with an unrelated stat and an unrelated range, which is a
       different fault from a card named after the thing it does. */
    detail:
      'Singular effect. Weapon attacks made against the entity are Empowered. It lasts until ' +
      'the entity receives healing or takes a rest.',
  },
  {
    /* GORE BLAST's own foot on the Death sheet (pulled 2026-08-26), and the same
       trade WOUND above made: the card named a compound effect and then spent
       three lines explaining it, so the explanation is here and the card keeps
       only what it grants.

       **What it does is the term and how long is the card's.** GORE BLAST prints
       "for 5 turns", the way BLIND prints "until their next Turn End" over the top
       of the blinded keyword. That split is not cosmetic: effectDuration in
       combatTurn.js reads a duration off the card's own prose, so a count that
       moved in here would leave the tracker with nothing to count.

       The damage is the caster's attribute and is written out rather than lit,
       because a detail is one static sentence and has no card under it to resolve
       a live value against. It is the first term in this file whose number is not
       its own, and it is worth a look. */
    id: 'corpse-carrion',
    terms: ['Corpse Carrion'],
    color: 'var(--dmg-decay)',
    detail:
      'The afflicted entity takes the caster’s attribute in Decay damage at every one of ' +
      'its Turn Starts.',
  },

  /* ------------------------------------------------------------- distances
   * The two ranges the cards name instead of a number. Everything else prints
   * its metres, so these are the only two a reader has to be told.
   */
  {
    id: 'touch',
    terms: ['touch'],
    color: 'var(--focus-cyan)',
    detail: 'Refers to an entity or object adjacent to you that you can physically touch.',
  },
  {
    id: 'reach',
    terms: ['reach'],
    color: 'var(--focus-cyan)',
    detail:
      'As far as you can strike without moving your feet. Yours unless the thing in your hands says otherwise.',
  },
  {
    id: 'line-of-sight',
    terms: ['line of sight'],
    color: 'var(--focus-cyan)',
    detail: 'An unbroken view of the target. Total cover breaks it, and so does darkness.',
  },
  {
    id: 'total-cover',
    terms: ['total cover'],
    color: 'var(--focus-cyan)',
    detail: 'Something solid entirely between you and it. Nothing that needs to see it can reach it.',
  },

  /* ---------------------------------------------------------- when it happens
   * The two moments a card can hang an effect on. Both are named on cards that
   * tick, and neither means "some time during your turn".
   */
  {
    id: 'turn-start',
    terms: ['Turn Starts', 'Turn Start'],
    color: 'var(--stat-ap)',
    detail:
      'The moment your turn opens, before you have spent anything. Upkeeps are paid here and effects that tick, tick here.',
  },
  {
    id: 'turn-end',
    terms: ['Turn End'],
    color: 'var(--stat-ap)',
    detail: 'The moment your turn closes, after everything you chose to do with it.',
  },

  /* ------------------------------------------------------- what a Keeper mixes
   * The Cauldron Keeper's nouns. None of them are on the Status & Terms tab, but
   * all four are defined outright by BREW's own card text, which is quoted here
   * rather than paraphrased. They wear the green of what you carry and spend,
   * which is the colour their cards wear (see .ac-kind-brew).
   *
   * The Cauldron itself is deliberately not here. It would light inside the set's
   * own name every time a card said "Cauldron keeper", which is the fault Gore
   * Armor and Vampiric Touch were reworded for.
   */
  {
    id: 'brew',
    terms: ['Brews', 'Brew'],
    color: 'var(--def-healing)',
    detail:
      'Ingredients combined to unleash a magical effect: at least 1 Essence, exactly 1 Catalyst and any number of Infusions. It costs the combined Action Point and Willpower cost of everything in it, and takes effect immediately.',
  },
  {
    id: 'ingredient',
    terms: ['Ingredients', 'Ingredient'],
    color: 'var(--def-healing)',
    detail:
      'What a Brew is made of. A Keeper gains access to Novice Ingredients at Rank 1, Adept at Rank 2 and Master at Rank 3.',
  },
  {
    id: 'essence',
    terms: ['Essences', 'Essence'],
    color: 'var(--def-healing)',
    detail:
      'The Ingredient that decides what a Brew does. Every Brew needs at least one, and Improved Recipes allows two that are not the same.',
  },
  {
    id: 'catalyst',
    terms: ['Catalysts', 'Catalyst'],
    color: 'var(--def-healing)',
    detail: 'The Ingredient that decides who a Brew reaches. Exactly one in every Brew.',
  },
  {
    id: 'infusion',
    terms: ['Infusions', 'Infusion'],
    color: 'var(--def-healing)',
    detail: 'An Ingredient stirred in on top. A Brew may take any number of them.',
  },

  /* -------------------------------------------------------------- the riders
   * The optional second half a card can carry. The names are the designer's
   * and they mean four different things, which is exactly why they are terms.
   */
  {
    id: 'overcast',
    terms: ['Overcast'],
    color: 'var(--haze-glow)',
    detail: 'Spend more than the spell asks to make it do more. Always optional, always your call.',
  },
  {
    id: 'multicast',
    terms: ['Multicast'],
    color: 'var(--haze-glow)',
    detail: 'Spend more than the spell asks to catch more targets with it.',
  },
  {
    id: 'upkeep',
    terms: ['Upkeep'],
    color: 'var(--haze-glow)',
    detail:
      'A toll paid at every Turn Start to keep a spell running. Miss one and the spell ends there.',
  },
  {
    id: 'blood-tithe',
    terms: ['Blood Tithe'],
    color: 'var(--stat-health)',
    detail:
      'A price paid in Health rather than Willpower, and always in Physique whatever you cast with.',
  },
  {
    id: 'elevated',
    terms: ['Elevated', 'elevates', 'elevated', 'elevate'],
    color: 'var(--level-amber)',
    detail:
      'Increases the die size category of your Damage Dice and Healing Dice by one step (a ' +
      'd6 becomes a d8). Elevate stacks, but cannot increase a die size beyond a d12.',
  },
  /* ------------------------------------------------- the rest of the rules sheet
   * Added when the designer's General Rules · Status & Terms tab arrived. Every
   * detail here is their own wording.
   *
   * ROLL is deliberately absent. It is on their sheet ("roll 2d6 and add the
   * appropriate Attribute") and it is a real defined term, but the word appears on
   * 49 of the codex's cards, and lighting a third of every card is the exact
   * failure this file's own header warns about. Worth a decision rather than a
   * default.
   */
  {
    id: 'damage-dice',
    terms: ['Damage Dice'],
    color: 'var(--dmg-sharp)',
    detail: 'Refers to the dice you indicated by ability to deal damage.',
  },
  {
    id: 'healing-dice',
    terms: ['Healing Dice'],
    color: 'var(--def-healing)',
    detail: 'The specific dice indicated by an ability or spell used to determine Health restored.',
  },
  {
    id: 'see',
    terms: ['see'],
    color: 'var(--focus-cyan)',
    detail:
      'Refers to an entity, object or location to which you have a direct and clear line ' +
      'of sight.',
  },
  {
    id: 'turn',
    terms: ['Turn'],
    color: 'var(--stat-ap)',
    detail:
      'Indicates the active phase in combat assigned to a specific entity. Each turn ' +
      'features a Turn Start and Turn End. Effects measured in turns lose 1 turn of ' +
      'duration at each Turn Start.',
  },
  {
    id: 'jump-distance',
    terms: ['Jump Distance'],
    color: 'var(--stat-speed)',
    detail:
      'The maximum horizontal distance in meters (or feet) you can cover when taking the ' +
      'Jump action.',
  },
  {
    id: 'jump-height',
    terms: ['Jump Height'],
    color: 'var(--stat-speed)',
    detail:
      'The maximum vertical distance in meters (or feet) you can clear when taking the Jump ' +
      'action.',
  },
  {
    id: 'melee',
    terms: ['Melee'],
    color: 'var(--dmg-sharp)',
    detail:
      'An attack or spell range targeting entities that are directly adjacent to you or ' +
      'within physical reach.',
  },
  {
    id: 'ranged',
    terms: ['Ranged'],
    color: 'var(--dmg-sharp)',
    detail:
      'An attack or spell range targeting entities at a distance up to the maximum ' +
      'specified range in meters (or feet).',
  },
  {
    id: 'attack-roll',
    terms: ['Attack Rolls', 'Attack Roll'],
    color: 'var(--copper)',
    detail:
      'A Roll made to hit a target. The attack succeeds if the total result equals or ' +
      'exceeds the target\'s Defense or targeted Attribute.',
  },
  {
    id: 'sacrifice',
    terms: ['Sacrifice', 'Sacrificing'],
    color: 'var(--stat-health)',
    detail:
      'When Sacrificing a resource or value (such as Health or Willpower), you ignore all ' +
      'reduction, mitigation or prevention effects to directly subtract the indicated ' +
      'amount.',
  },
];

/* ------------------------------------------------------------ the matcher */

/**
 * One alternation over every printed form, longest first so that "Reaction
 * Point" is never eaten by "reaction", and "skill checks" never by "skill
 * check". Word-anchored, so "advantage" cannot fire inside "disadvantage".
 */
const ENTRIES = KEYWORDS.flatMap((keyword) =>
  keyword.terms.map((term) => ({ term, keyword }))
).sort((a, b) => b.term.length - a.term.length);

const BY_TERM = new Map(ENTRIES.map(({ term, keyword }) => [term.toLowerCase(), keyword]));

/**
 * Every printed form is plain letters and spaces, so none of them needs regex
 * escaping — keep it that way. A keyword is a word.
 */
const SOURCE = `\\b(${ENTRIES.map(({ term }) => term).join("|")})\\b`;

/** A fresh regex each call — a shared one carries `lastIndex` between splits. */
export function keywordPattern() {
  return new RegExp(SOURCE, 'gi');
}

/** The keyword a matched run of text names, or null when it names none. */
export function getKeyword(text) {
  return BY_TERM.get(String(text ?? '').toLowerCase()) ?? null;
}
