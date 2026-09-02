import { useMemo, useState } from 'react';
import Modal from '../Modal.jsx';
import AbilityCard from '../AbilityCard.jsx';
import CheckPick from './CheckPick.jsx';
import RollArrow from '../RollArrow.jsx';
import TargetChip from '../TargetChip.jsx';
import { CostOrb } from '../CostOrbs.jsx';
import { AmmoPips } from './itemParts.jsx';
import { useCardStack } from '../../context/card-stack.js';
import { useFight } from '../../context/fight.js';
import { VARIABLE_CAP } from '../../lib/actions.js';
import { castLine } from '../../lib/combatBar.js';
import { getKeyword } from '../../lib/keywords.js';
import { characterCheckSkills } from '../../lib/levelPicks.js';
import { normalizeEffects } from '../../lib/combatTurn.js';
import { cardAccent } from '../../lib/tagColors.js';
import { getCard } from '../../lib/weapons.js';
import {
  aimingMoves,
  effectAdvantage,
  moveAllowance,
  moveCost,
  offeredMoves,
  ridingLine,
  withMoves,
} from '../../lib/moves.js';
import { riderLine } from '../../lib/riders.js';
import { sourceWords } from '../../lib/attribution.js';
import { targetPlan } from '../../lib/targeting.js';
import { triggerLine } from '../../lib/onUse.js';
import { costWords, halfPrice, halfRoom, secondHalf } from '../../lib/overcast.js';

/**
 * The one question every use on the Character tab has to ask: was that an
 * action, or a reaction?
 *
 * Nothing else about the use changes — the same card, the same Willpower, the
 * same charge off the flask. Only where the points come from moves: an action
 * is paid out of Action Points, a reaction out of Reaction Points.
 *
 * Both ways are always offered and both are always clickable. Picking one you
 * cannot pay for is exactly the case the notice is here for: it says which
 * pool came up short and by how much, and nothing at all is spent. The pools
 * are only ever emptied by the sheet's own maths, never dragged below zero to
 * make a use fit.
 *
 * The notice lands directly under the two ways rather than at the foot of the
 * dialog. This prompt is a whole card tall, and a refusal printed below that
 * card is a refusal nobody reads — it belongs beside the tap that earned it.
 *
 * It carries the way out with it. "Use it anyway" is the table's override, for
 * the ruling that a use stands whatever the sheet thinks of it: the use goes
 * through exactly as a paid one does, and not one point leaves a pool. Still
 * nothing dragged below zero — a cost forgiven rather than a cost paid.
 *
 * ------------------------------------------------------------- two columns
 * Beside all of it sits the card itself, printed for this character — the
 * rolls it asks for, the numbers it deals. Nobody should have to spend points
 * on something and only afterwards go looking for what it did.
 *
 * Beside, and no longer under. Everything you decide is in the left column and
 * the card is in the right, because the card is what the decisions are *about*:
 * take a Multicast and the card's second half is right there saying what each
 * extra target buys. Stacked, that half was 640 pixels below the control that
 * priced it. Under 760 pixels there is no room for two columns of anything, so
 * the card drops back under the choices and the old single file returns.
 *
 * -------------------------------------------------------- the second half
 * Most spells carry an optional second half, and until now the sheet printed it
 * and charged nothing for it. Now it is offered here as a thing you take, with
 * its price added to the way you tap:
 *
 *   Overcast     spend more to do more
 *   Multicast    spend more to catch more targets, any number of times
 *   Blood Tithe  pay in Health, which no card prints as a cost
 *
 * What each one costs is read off the card's own prose rather than restated
 * anywhere — see src/lib/overcast.js. Two things about it show up here:
 *
 *   any number   a half that may be taken repeatedly gets a dial under it, and
 *                every step moves the orbs on both ways. The dial goes past
 *                what the pools hold on purpose, the same way the two ways stay
 *                clickable when you cannot afford them: the hint says how many
 *                you can actually pay for, and the notice says what came short.
 *   instead of   an Overcast written as its own later spend ("You can spend 2
 *                Action Points and 4 Willpower to hurl the flame") is paid in
 *                place of the printed cost, not on top of it. The cast it rides
 *                on was paid for on some earlier turn.
 *
 * Upkeep is the fourth name and it is not offered, because it is not a choice
 * made while casting: it is a toll at every Turn Start. It is printed as a line
 * so the player knows what they are signing up for, and combatTurn.js goes on
 * tracking it as the running effect it is.
 *
 * ------------------------------------------------------------ who did this to it
 * And under the two ways, **every source changing this card, and what each one
 * changed.** Jules, 2026-08-28, testing: "My finesse pact bound weapon as two
 * adventage and on the action view I dont see the source. It is also empowred and
 * I dont see the source below the action buttons. Everything that is modified need
 * to be seen but only what modifies it. So if my spells are empowerd because of
 * talents I should see on the side below the action buttons. No exceptions."
 *
 * The sheet always folded these in correctly and almost never said whose they
 * were. The arrow in a card's corner carries names and has room for nothing else;
 * an Empowered die carried not even that. So every fold keeps a receipt now, they
 * ride on the modifiers object as `sources`, and this is where they are read. See
 * attribution.js, which is where the shape lives.
 *
 * "only what modifies it" is the other half and the harder one. A Duelist's AGILE
 * grants a point of Defense for the same Finesse weapon DEXTEROUS lends an arrow
 * for, and a list crediting AGILE on an attack would be pointing at a number that
 * never moved. So a row is written where a source actually gave something to
 * *this* card, and nowhere else.
 *
 * ------------------------------------------------------- what else is on you
 * Under that, the rows on the tracker the list above did not account for. "it
 * should list all the active effect on under the use buttons", the day before.
 * Half of what the tracker holds changes the thing you are about to do and is
 * credited above; the other half is a Grappled or a mark somebody laid on you,
 * which changes no number here and is still worth having in front of you at the
 * moment you decide. Nothing is printed twice.
 *
 * Both lists are reminders and not controls. Nothing here is spent, dropped or
 * nudged. The block is where a tracker is edited, and a dialog that let you edit
 * one while paying for something else would be two decisions wearing one Cancel.
 *
 * ------------------------------------------------------ and what this one starts
 * Above them, when the card lasts, the row this use is about to write. A sheet
 * that quietly starts counting things is a sheet you stop trusting, so it is said
 * before the tap rather than found on the block afterwards. See `castEffect` in
 * combatBar.js.
 *
 * Two things on the sheet do not have a printed cost, and both are standard
 * actions (see actions.js):
 *
 *   variable   Interact costs whatever the Game Master says it costs, so the
 *              prompt asks for the number instead of assuming one. Everything
 *              after that is the ordinary question.
 *   converts   Anticipate does not spend anything at all: Action Points move
 *              into the Reaction pool one for one. There is no action-or-
 *              reaction to ask about, so it is offered as the one thing it is,
 *              and the dial cannot be turned past what the pools can hold.
 *
 * ------------------------------------------------------- the Martial Moves
 * And, on a weapon attack, **the moves this character can add to it.** Jules,
 * 2026-09-02: "When you have marital moves and you make a weapon attack (or later
 * special weapon attack). Then you should see list of your martial move on the
 * action preview before you pay the cost so you can add one, or two later on."
 *
 * A move used to be its own use: you paid for one at the quick bar, it sat on the
 * effects tracker and the next swing carried it. It is a thing you add here now,
 * which puts the decision where the information is. Everything about the offer
 * follows from that:
 *
 *   priced here     the Willpower joins the orbs on both ways, and the one move
 *                   that cuts the swing's cost (RIPOSTE) takes a point off them.
 *   folded here     the card in the right-hand column shows the swing with the
 *                   moves on it, so a RECKLESS ticked on is a d4 that appears in
 *                   the corner and a die that appears in the damage.
 *   capped here     one to a swing, or two once a set has bought the second, and
 *                   the cap says whose rule it is.
 *
 * The list is the character's own hand, off `offeredMoves`, which is also where
 * the two narrowings live: whether this character's moves reach a Special Weapon
 * Attack at all, and whether this swing is the reaction RIPOSTE needs. A prompt
 * for anything that is not a weapon attack is handed an empty list and draws
 * nothing, which is almost every prompt.
 *
 * ---------------------------------------------------------------- the targets
 * On the encounter page the prompt is handed `combat`: everybody in the fight,
 * as chips. A card whose text lands on other bodies ("against an entity", "up
 * to 3 targets") then offers them here, *before* the pay buttons, because who
 * it hits is decided before what it costs is paid (Jules, 2026-09-01). How many
 * may be picked is the card's own count, read off its prose by targetPlan, and
 * a Multicast raises it as it is dialled — that is the whole of what "catch
 * more targets" means. Picking is optional: a use with nobody picked pays and
 * rolls exactly as it always did, and the Game Master lands the numbers by
 * hand. What was picked rides out on the confirm as `options.targets`, and the
 * encounter page is what does something with it — this prompt still spends
 * points and nothing else.
 */

/** The two pools a cost can come out of, and what each one is called. */
const WAYS = [
  {
    mode: 'action',
    label: 'As an Action',
    orb: 'ap',
    pool: 'ap',
    max: 'ap_max',
    resource: 'Action Points',
  },
  {
    mode: 'reaction',
    label: 'As a Reaction',
    orb: 'rp',
    pool: 'reaction',
    max: 'reaction_max',
    resource: 'Reaction Points',
  },
];

/** With nothing to pay in points, there is no question left to ask. */
const CONFIRM_ONLY = { ...WAYS[0], label: 'Use It' };

/** Anticipate: the points are not spent, they cross from one pool to the other. */
const CONVERT = { ...WAYS[0], mode: 'convert', label: 'Hold Back' };

/** Nothing owed, in the shape a price comes in. */
const NOTHING = { ap: 0, wp: 0, health: 0 };

export default function UsePrompt({
  request,
  character,
  onCancel,
  onConfirm,
  combat = null,
  /* Raised from a reaction window: the one question this prompt normally asks
     is already answered, so only the Reaction way is offered — a reaction paid
     out of Action Points would not be a reaction. */
  reaction = false,
}) {
  /* The pile the printed card deals onto. This prompt is a dialog, and the pile
     sits above every dialog (see the z scale in index.css), so a number tapped
     here opens its working over the prompt and closes back onto it. Optional
     because the hook answers null outside a provider, and a card with no pile to
     deal onto prints its numbers flat rather than as dead buttons. */
  const cards = useCardStack();

  // The way that was asked for and could not be paid, until another is tried.
  const [denied, setDenied] = useState(null);

  const converts = Boolean(request.converts);
  // How far the dial goes. A conversion is capped by both pools, since moving
  // a point that neither can hold is not a choice, it is a mistake.
  const ceiling = converts ? convertRoom(character) : VARIABLE_CAP;
  /* And where it opens: on what the card printed. Every variable action but one
     prints no cost at all and opens on 1, which is the smallest thing the Game
     Master is likely to charge. A SKILL CHECK prints 0, because "most attempts
     cost nothing" is the rule rather than the exception, and a dial that opened
     on 1 would charge an Action Point for asking a barman a question. */
  const [dialled, setDialled] = useState(() =>
    Math.max(0, Math.min(request.ap == null ? 1 : Number(request.ap) || 0, ceiling))
  );

  /* The card's second half, and how many times it has been taken. Zero is not
     taken at all, which is where every use starts: the printed cost is the cost
     until the player says otherwise. */
  const half = useMemo(() => secondHalf(request.card), [request.card]);
  const offer = half?.kind === 'option' ? half : null;
  const toll = half?.kind === 'toll' ? half : null;
  const [times, setTimes] = useState(0);

  /* Who this lands on, when there is anybody to land it on. The page hands the
     roster in on the encounter view; on a player's own sheet it is the fight
     the table log announced, which is how "in a combat encounter I should see
     all enemies I can target" reaches a sheet that cannot read the encounter
     row. See FightProvider.jsx. The plan is the card's own text and it moves
     with the dial: a Multicast taken twice is two more chips allowed. `chosen`
     is clamped on read rather than trimmed by an effect, so dialling the
     Multicast back down quietly releases the extra targets without a state
     write racing the render. */
  const fight = useFight();
  const roster = combat?.roster ?? fight?.roster ?? [];
  const offered = roster.length > 0;

  /* ---- the Martial Moves on offer, and the ones ticked ----
     The hand this character could add to this swing, and how many of it they are
     allowed. Both read off the character rather than off anything the dialog
     decides, so neither moves while a box is being ticked. `reaction` is the
     same flag that leaves only the Reaction way on offer: RIPOSTE may only ride a
     swing made as one, and a set that has not bought the reaction rule may not
     add a move to one at all. See offeredMoves in moves.js. */
  const martial = useMemo(
    () => offeredMoves(character, request.card, { reaction }),
    [character, request.card, reaction]
  );
  const allowance = useMemo(() => moveAllowance(character?.talents), [character?.talents]);

  /* Which ones, **by their place in the list and not by card id**: two sets can
     teach the same move and both copies were paid for, so two rows can wear one
     id and ticking either has to tick exactly one.

     Clamped on read rather than trimmed by an effect, exactly as the target list
     is: a rank lost while the dialog is open quietly releases the second move
     without a state write racing the render. */
  const [added, setAdded] = useState([]);
  const allowed = Math.max(1, Math.floor(Number(allowance.perAttack) || 1));
  const takenMoves = useMemo(
    () => added.slice(0, allowed).filter((at) => at < martial.length),
    [added, allowed, martial.length]
  );
  const moveCards = useMemo(
    () => takenMoves.map((at) => martial[at].card),
    [takenMoves, martial]
  );

  function toggleMove(at) {
    setAdded((was) => {
      const held = was.slice(0, allowed).filter((one) => one < martial.length);
      if (held.includes(at)) return held.filter((one) => one !== at);
      return held.length >= allowed ? held : [...held, at];
    });
    setDenied(null);
  }

  const plan = useMemo(
    () =>
      offered
        ? targetPlan(request.card, { times, riders: aimingMoves(moveCards) })
        : { some: false, count: 0 },
    [offered, request.card, times, moveCards]
  );
  const [chosen, setChosen] = useState([]);
  const reach = plan.count === null ? roster.length : Math.min(plan.count, roster.length);
  const picked = chosen.slice(0, reach);

  function toggleTarget(id) {
    setChosen((was) => {
      const held = was.slice(0, reach);
      if (held.includes(id)) return held.filter((entry) => entry !== id);
      return held.length >= reach ? held : [...held, id];
    });
  }

  /* ---- what this one asks before it can be priced ----
     A SKILL CHECK is rolled off an attribute the player picks, with whatever
     skill they say applies. Both are questions the codex cannot answer: there is
     no column anywhere saying that this attempt is about a map. So the card
     carries `picks: 'check'` and the two answers are collected here, above the
     ways, because what a skill costs in Willpower is part of what the button
     below is about to charge. See CheckPick.jsx and actions.js. */
  const picks = request.card?.picks === 'check';

  /* Whose numbers and whose skills. A creature plays the same basic actions off
     its own attributes and holds no background at all, so its picker offers the
     three attributes and says so. */
  const who = request.modifiers?.actor ?? character;

  const [attribute, setAttribute] = useState(() => request.card?.stat ?? 'instinct');
  const [brought, setBrought] = useState([]);

  const checkable = useMemo(
    () => (picks ? characterCheckSkills(who) : []),
    [picks, who]
  );
  /* What is actually riding: ticked, and wired. Read on render rather than
     trimmed by an effect, exactly as the target list is. */
  const riding = useMemo(
    () => checkable.filter((skill) => skill.advantage > 0 && brought.includes(skill.id)),
    [checkable, brought]
  );
  const bringWp = riding.reduce((sum, skill) => sum + skill.wp, 0);
  const bringSwing = riding.reduce((sum, skill) => sum + skill.advantage, 0);

  // What the card rolls with, for a tithe written off an attribute.
  const stat = picks ? attribute : request.modifiers?.stat ?? request.card?.stat ?? 'instinct';

  /* The card as it stands with every answer this dialog has collected on it, so
     the printed card beside the ways shows the attribute that is about to be
     rolled, the advantage the skills are lending and the Martial Moves that have
     been ticked. The same object goes out on the confirm, which is what makes the
     dice agree with the card the player was looking at.

     The moves are folded last and on top of what the caller handed in, because
     everything else on the swing was known before this dialog opened and they are
     the only part of it being decided in here. See withMoves in moves.js. */
  const modifiers = useMemo(() => {
    const asked = picks
      ? {
          ...request.modifiers,
          stat: attribute,
          advantage: (Number(request.modifiers?.advantage) || 0) + bringSwing,
        }
      : request.modifiers;
    return withMoves(asked, moveCards);
  }, [picks, request.modifiers, attribute, bringSwing, moveCards]);

  /* What is on this character right now, for the list under the ways, and how
     long this use will itself be on them. Both read off the request and the
     character rather than off anything the dialog decides, so neither moves while
     a half is being dialled. */
  const running = useMemo(
    () => normalizeEffects(character?.effects).filter((effect) => effect.turns !== 0),
    [character?.effects]
  );

  /* Everything changing this card, itemised and named. Read off the *folded*
     object rather than off the request, so a Martial Move ticked on in here is
     credited in the same list as the weapon and the bargain: they are all changing
     the same swing, and a list that named only the ones settled before the dialog
     opened would be missing the two the player just chose. See attribution.js. */
  const sources = useMemo(() => modifiers?.sources ?? [], [modifiers]);

  /* And what is running that this list has not already accounted for. A row
     credited above is a row the reader has read: printing it twice under two
     headings is the sheet padding itself. */
  const aside = useMemo(() => {
    const credited = new Set(sources.map((row) => row.from));
    return running.filter((effect) => !credited.has(effect.name));
  }, [running, sources]);
  const lasts = useMemo(() => castLine(request), [request]);
  /* And what the card writes on its own, for the two that write anything. See
     useTriggers.js: a sheet that quietly rewrites six columns because you drank
     something has to say so first. */
  const writes = useMemo(() => triggerLine(request.card, character), [request.card, character]);

  /* What the Martial Moves add: Willpower, and the one point RIPOSTE takes back
     off the swing. Floored at nothing where it lands, because a 1 Action Point
     attack with a Riposte on it is free rather than owed. See moveCost. */
  const cutBy = Math.max(0, Math.floor(Number(allowance.discount) || 0));
  const paid = moveCost(moveCards, cutBy);

  const base = {
    ap: Math.max(0, (request.variable ? dialled : Number(request.ap) || 0) + paid.ap),
    /* Plus whatever the skills brought to a check cost, and whatever the moves
       cost. A skill has no printed price of its own (see the note in
       backgrounds.js): it spends Willpower conditionally, inside its own sentence,
       and this is the condition. */
    wp: (Number(request.wp) || 0) + bringWp + paid.wp,
    health: 0,
  };
  const taken = Boolean(offer) && times > 0;
  const step = offer ? halfPrice(offer, character, 1, stat) : NOTHING;
  const extra = offer ? halfPrice(offer, character, times, stat) : NOTHING;

  /* The price as it stands. An "instead of" half replaces the printed cost
     rather than adding to it, because the cast it hangs off was paid for on an
     earlier turn. See the note above. */
  const price = !taken
    ? base
    : offer.instead
      ? extra
      : { ap: base.ap + extra.ap, wp: base.wp + extra.wp, health: extra.health };

  /* What the card printed, when something has already cut it. Two things can:
     an Arcanist at Rank 3 casts everything in their spellbook for one Action Point
     less, and a RIPOSTE added to a reaction attack gives a point back. Both are
     named on the one line, because an orb that quietly reads 1 where the card says
     2 is the only number on this dialog with no account of itself.

     Shown only while nothing else is being added on top, because an Overcast moves
     the same number for its own reasons and two revisions on one orb is a sum
     nobody can read. See cardCost in cardText.js. */
  const apPrinted =
    Number(request.apWas) > 0
      ? Number(request.apWas)
      : request.variable
        ? dialled
        : Number(request.ap) || 0;
  const apWas = !taken && apPrinted > price.ap ? apPrinted : null;
  const cutFrom = [
    ...(request.apCutFrom ?? []),
    ...moveCards.filter((card) => Number(card.rides?.ap) < 0).map((card) => card.name),
  ];

  const ways = reaction
    ? [price.ap > 0 ? WAYS[1] : { ...WAYS[1], label: 'Use It as a Reaction' }]
    : converts
      ? [CONVERT]
      : price.ap > 0
        ? WAYS
        : [CONFIRM_ONLY];

  /* How many more steps the pools could actually pay for. An "instead of" half
     is not stacked on the printed cost, so nothing is committed against it. */
  const room = halfRoom(offer, character, offer?.instead ? NOTHING : base, stat);

  /* Whole numbers rather than a card and a count: the number printed beside the
     way you tap is the number that leaves the sheet. See spendUse.

     A skill brought to a check settles a price the same way a second half does,
     and for the same reason: the card printed neither number, so the only
     honest account of the cost is the one the prompt just added up. */
  const settled = taken
    ? { ...price, note: `${offer.name}: ${request.name}` }
    : moveCards.length > 0
      ? { ...price, note: `${request.name}: ${listAnd(moveCards.map((card) => card.name))}` }
      : bringWp > 0
        ? { ...price, note: `${request.name}: ${listAnd(riding.map((skill) => skill.name))}` }
        : null;

  /* Whatever the tap decided, in one place: the price the second half settled
     on, and whoever was picked to catch it. Targets go out as bodies rather
     than ids — kind, id and name — because everything downstream of a confirm
     is building events and event rows carry names, not lookups. Undefined when
     neither happened, so every caller that never sees a fight sees the calls
     it always saw. */
  function decided(extra = {}) {
    const options = { ...extra };
    if (settled) options.price = settled;
    /* The attribute this check is rolled off and the advantage the skills
       brought to it. Out as modifiers rather than as two loose fields, because
       that is the shape everything downstream already reads a card with: the
       roll plan, the printed card and the log all take one `modifiers`. See
       usePlayCard.js, which folds it onto the request once. */
    if (picks) options.modifiers = modifiers;
    /* And the moves that were added, both the numbers and the names. The whole
       folded object, because the swing the dice are thrown for has to be the swing
       the card in this dialog printed: a RECKLESS ticked on is a d4 on the roll,
       and a roll plan built off the request alone would throw the unmodified one.
       `moves` beside it is what the log prints, since "Strike" and "Strike with
       Wound and Reckless" are not the same line at a table. */
    if (moveCards.length > 0) {
      options.modifiers = modifiers;
      options.moves = moveCards.map((card) => card.name);
    }
    /* An action taken with a fight standing invites reactions: the chain's
       first roll waits the reaction window before it can be thrown. See
       REACTION_HOLD in usePlayCard.js. */
    if (offered) options.react = true;
    if (picked.length > 0) {
      options.targets = picked
        .map((id) => roster.find((body) => body.id === id))
        .filter(Boolean)
        .map((body) => ({
          id: body.id,
          kind: body.kind,
          name: body.name,
          /* What a roll against them is judged by, so an aimed check carries
             its own DC instead of asking the table. See usePlayCard.js. */
          defenses: body.defenses ?? null,
        }));
    }
    return Object.keys(options).length > 0 ? options : undefined;
  }

  function attempt(way) {
    const short = shortfalls(character, price, way);
    if (short.length > 0) {
      setDenied({ way, short });
      return;
    }
    onConfirm(way.mode, price.ap, decided());
  }

  /* The table's override. Whatever came up short is left alone rather than
     driven below zero, and everything else about the use happens as it would
     have: the charge, the effect, the window it opens. See `free` in
     combatBar.js, which is where a use has always been turned into a write. */
  function waveThrough() {
    if (denied) onConfirm(denied.way.mode, price.ap, decided({ free: true }));
  }

  function dial(next) {
    setDialled(Math.max(0, Math.min(ceiling, next)));
    setDenied(null);
  }

  /* Any change to what is being bought clears the last refusal: it was a
     refusal of a different price. */
  function take(next) {
    setTimes(Math.max(0, Math.min(VARIABLE_CAP, next)));
    setDenied(null);
  }

  /* A skill brought to the check, or put back down. Every one of them is its
     own Willpower, so this moves the price and clears the refusal with it. */
  function bring(id) {
    setBrought((was) => (was.includes(id) ? was.filter((held) => held !== id) : [...was, id]));
    setDenied(null);
  }

  return (
    <Modal
      title={`Use: ${request.name}`}
      onClose={onCancel}
      wide
      footer={
        <>
          <span className="spacer" />
          <button type="button" className="btn btn-minimal btn-sm" onClick={onCancel}>
            Cancel
          </button>
        </>
      }
    >
      <div className="use-prompt">
        <div className="use-choices">
          <p className="use-source">{request.source}</p>

          {/* Said in words as well as drawn, because this is the one line that
              explains why the orbs below disagree with what the card was written
              with. The card in the right-hand column strikes the old number
              through in the same breath. */}
          {apWas !== null && (
            <p className="use-cut">
              {cutFrom.length > 0 && <b>{listAnd(cutFrom)}</b>}
              {cutFrom.length > 0 ? ' · ' : ''}
              {apWas} Action Points cut to {price.ap}.
            </p>
          )}

          <span className="use-question">
            {reaction
              ? 'A reaction is paid out of Reaction Points, so that is the one way offered.'
              : converts
                ? 'How many points do you want waiting on somebody else?'
                : picks
                  ? 'What are you rolling, and what are you bringing to it?'
                  : request.variable
                    ? 'How many Action Points is this worth? Your Game Master decides.'
                    : price.ap > 0
                      ? 'Is this your action, or are you reacting to something?'
                      : 'Nothing but the cost below leaves your sheet.'}
          </span>

          {/* The attribute and the skills, above everything, because they are
              what this roll *is* and one of them changes what it costs. */}
          {picks && (
            <CheckPick
              who={who}
              stat={attribute}
              onStat={(key) => {
                setAttribute(key);
                setDenied(null);
              }}
              skills={checkable}
              brought={brought}
              onBring={bring}
            />
          )}

          {/* The dial only appears for the actions with no fixed cost. */}
          {request.variable && (
            <Dial
              value={dialled}
              ceiling={ceiling}
              onChange={dial}
              label={converts ? 'Points held back' : 'Action Points'}
              hint={
                converts
                  ? convertHint(character, ceiling)
                  : picks
                    ? 'Most attempts cost nothing. Your Game Master says when one does.'
                    : null
              }
            />
          )}

          {/* What else the card offers, above the ways, so the orbs on a way are
              already final by the time they are read. */}
          {offer && (
            <HalfOffer
              half={offer}
              step={step}
              times={times}
              room={room}
              base={base}
              onTake={take}
            />
          )}

          {/* What you can add to the swing, above the targets because a move can
              change who it reaches, and above the ways because the Willpower it
              costs is on the orbs they print. Only on a weapon attack, and only
              for somebody who holds one. */}
          {martial.length > 0 && (
            <div className="use-moves">
              <span className="use-targets-head">
                Martial Moves
                <span className="use-targets-count">
                  {takenMoves.length} of {allowed}
                </span>
              </span>

              {martial.map(({ card, talent }, at) => (
                <MoveRow
                  key={`${card.id}-${at}`}
                  card={card}
                  talent={talent}
                  on={takenMoves.includes(at)}
                  full={!takenMoves.includes(at) && takenMoves.length >= allowed}
                  allowance={allowance}
                  cut={cutBy}
                  onToggle={() => toggleMove(at)}
                  stack={cards}
                />
              ))}

              {/* The one sentence that says what this swing will do, which is the
                  Duelist's Developpement Notes honoured where they asked for it:
                  "updating the attack text to say (not on the card) that this
                  attack will MARTIAL MOVE NAME". Not on the card, because the card
                  is the codex's and says what the attack always does. */}
              <span className="use-targets-note">
                {ridingLine(modifiers) ??
                  'Nothing added: the attack goes through exactly as the card beside this reads.'}
              </span>
            </div>
          )}

          {/* Who it lands on, before what it costs. Only on a page that knows
              who is in the fight, and only for a card whose own text reaches
              other bodies. Optional on purpose: nobody picked is the old flow,
              numbers landed by hand. */}
          {plan.some && roster.length > 0 && (
            <div className="use-targets">
              <span className="use-targets-head">
                Targets
                <span className="use-targets-count">
                  {picked.length} of {plan.count === null ? 'any' : reach}
                </span>
              </span>

              <div className="tgt-row">
                {roster.map((body) => {
                  const on = picked.includes(body.id);
                  return (
                    <TargetChip
                      key={body.id}
                      body={body}
                      on={on}
                      disabled={!on && picked.length >= reach}
                      onToggle={() => toggleTarget(body.id)}
                      title={
                        !on && picked.length >= reach
                          ? `The card reaches ${reach} ${reach === 1 ? 'target' : 'targets'}. Unpick one first${offer?.name === 'Multicast' ? ', or take the Multicast again' : ''}.`
                          : undefined
                      }
                    />
                  );
                })}
              </div>

              <span className="use-targets-note">
                {picked.length === 0
                  ? 'Nobody picked: the use goes through as it always has, and the numbers are landed by hand.'
                  : 'What this lays lands on their trackers, and what it rolls lands on them once the dice settle.'}
              </span>
            </div>
          )}

          <div className="use-ways">
            {ways.map((way) => {
              const pool = Number(character[way.pool]) || 0;
              const cap = Number(character[way.max]) || 0;

              return (
                <button
                  type="button"
                  key={way.mode}
                  className="use-way"
                  onClick={() => attempt(way)}
                  disabled={converts && price.ap === 0}
                  aria-label={`${way.label}: ${costLine(price, way.resource)}`}
                >
                  <span className="use-way-costs">
                    {price.ap > 0 && (
                      <CostOrb
                        kind={way.orb}
                        value={price.ap}
                        size={30}
                        was={apWas}
                        from={cutFrom}
                      />
                    )}
                    {/* A conversion shows both ends of the move, not one cost. */}
                    {converts && price.ap > 0 && <span className="use-way-arrow">&rarr;</span>}
                    {converts && price.ap > 0 && <CostOrb kind="rp" value={price.ap} size={30} />}
                    {price.wp > 0 && <CostOrb kind="wp" value={price.wp} size={30} />}
                    {price.health > 0 && <CostOrb kind="hp" value={price.health} size={30} />}
                    {price.ap === 0 && price.wp === 0 && price.health === 0 && (
                      <span className="use-way-free">{converts ? 'None' : 'Free'}</span>
                    )}
                  </span>

                  <span className="use-way-body">
                    <span className="use-way-label">{way.label}</span>
                    {converts ? (
                      <span className="use-way-pool">
                        {price.ap === 0
                          ? 'Nothing to move right now'
                          : `${pool} of ${cap} Action Points left, ${
                              (Number(character.reaction) || 0) + price.ap
                            } of ${Number(character.reaction_max) || 0} Reaction Points after`}
                      </span>
                    ) : (
                      price.ap > 0 && (
                        <span className="use-way-pool">
                          {pool} of {cap} {way.resource} left
                        </span>
                      )
                    )}
                    {price.ap === 0 && price.wp > 0 && (
                      <span className="use-way-pool">
                        {Number(character.willpower) || 0} of{' '}
                        {Number(character.willpower_max) || 0} Willpower left
                      </span>
                    )}
                    {/* A tithe is the one cost nothing else on the sheet says
                        out loud, so the way that charges it names the pool. */}
                    {price.health > 0 && (
                      <span className="use-way-pool">
                        {Number(character.health) || 0} Health now,{' '}
                        {Math.max(0, (Number(character.health) || 0) - price.health)} after
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Straight under the two ways, above the card: this is the answer to
              the tap, and the tap was up here. */}
          {denied && (
            <div className="use-denied" role="alert">
              <span className="use-denied-head">
                Not done: {denied.way.label.toLowerCase()} is beyond you right now.
              </span>
              {denied.short.map((entry) => (
                <span className="use-denied-line" key={entry.resource}>
                  <b>{entry.resource}</b> · {entry.need} needed, {entry.have} left
                </span>
              ))}
              <span className="use-denied-foot">Nothing was spent.</span>

              <button
                type="button"
                className="use-denied-anyway"
                onClick={waveThrough}
                aria-label="Use it anyway: it goes through and nothing is spent"
              >
                <span className="use-denied-anyway-label">Use it anyway</span>
                <span className="use-denied-anyway-note">
                  Goes through as written. No points leave your sheet.
                </span>
              </button>
            </div>
          )}

          {/* What is loaded, drawn rather than only said. "The preview to use
              should let you know as well", 2026-08-24: a round is the one cost the
              printed card cannot show, and this is the last moment before the
              trigger. The pips are what is in the weapon *now*, and the note under
              them is what will be in it after. */}
          {request.ammo && (
            <div className="use-ammo">
              <AmmoPips
                ammo={request.ammo}
                charges={request.ammoMax}
                used={request.ammoMax - request.ammoLeft}
              />
              <span className="use-ammo-line">
                {request.ammoLeft} of {request.ammoMax} {request.ammo.unit}
                {request.ammoMax === 1 ? '' : 's'} loaded
              </span>
            </div>
          )}

          {/* What the item itself loses, on top of the points. */}
          {request.note && <p className="use-note">{request.note}</p>}

          {/* What the card does to the sheet on its own, for the two cards that
              do anything. Above the tracking line, because it is the larger of
              the two writes by a long way. */}
          {writes && (
            <p className="use-writes">
              <b>This one writes your sheet</b> · {writes}
            </p>
          )}

          {/* And what this use starts counting. Said here rather than discovered
              on block 6 afterwards. See the note at the top. */}
          {lasts && (
            <p className="use-lasts">
              <b>Goes on the tracker</b> · {lasts}. Recasting it refreshes the same row.
            </p>
          )}

          {/* Everything that is changing this card, named. The first list is the
              one that matters and it is exhaustive on purpose: an arrow with a 2
              in it and no account of where it came from is a number the reader has
              to reconstruct. See the note at the top and attribution.js. */}
          {sources.length > 0 && (
            <div className="use-sources">
              <span className="use-sources-head">Changing this · {sources.length}</span>
              {sources.map((row, at) => (
                <SourceRow key={`${row.from}-${at}`} row={row} stack={cards} />
              ))}
            </div>
          )}

          {/* And what else is on you that this card is not being changed by. Only
              the rows the list above has not already credited, so nothing is said
              twice: a KINDLE WEAPON is up there lending a die, and a Grappled is
              down here doing nothing to a spell and still worth knowing about. */}
          {aside.length > 0 && (
            <div className="use-running">
              <span className="use-running-head">
                Also running · {aside.length}
              </span>
              {aside.map((effect) => (
                <RunningRow key={effect.id} effect={effect} />
              ))}
            </div>
          )}

          {/* And what this one keeps costing once it is running. Not an option,
              because nobody chooses an Upkeep: they owe it. */}
          {toll && (
            <p className="use-toll">
              <b>Upkeep</b> · {costWords(toll)} at every Turn Start once this is running. Miss one
              and it ends there.
            </p>
          )}
        </div>

        {/* What you are about to do, as the card reads for you, and readable the
            way any dealt card is: every live value on it opens its own working,
            and every {{link}} deals the card it names. The card printed here used
            to be the one card on the sheet that could not do either, which made
            "2d8 + 8" a number you had to take on faith at the exact moment you
            were being asked to pay for it. */}
        {request.card && (
          <div className="use-card">
            <AbilityCard
              ability={request.card}
              character={character}
              modifiers={modifiers}
              onValue={cards?.openValue}
              /* A linked card is cast as written, so it is dealt without this
                 one's modifiers — the same as a link on any other card. */
              onLink={cards ? (name) => cards.openCard(name) : null}
            />
          </div>
        )}
      </div>
    </Modal>
  );
}

/**
 * One source and what it did, with the source itself a way into its card.
 *
 * "I want to be able to click on the text block like dexterous to see the
 * associated card", 2026-08-28. Naming DEXTEROUS is only half an answer if
 * reading it means closing the prompt, walking to the Abilities tab and finding
 * the set: the name is the question, so the name is the button.
 *
 * The card deals onto the same pile every other card on the sheet deals onto,
 * which sits above every dialog, so it opens over the prompt and closes back onto
 * it with nothing spent and nothing lost.
 *
 * A row whose source the codex has no card for stays a plain name rather than
 * becoming a button that does nothing. A Feral Curse's form is the case today:
 * the source is the set, and a set is not a card.
 */
function SourceRow({ row, stack }) {
  const card = getCard(row.card ?? row.from);
  const open = card && stack ? () => stack.openCard(card) : null;

  return (
    <div className="use-source-row">
      {open ? (
        <button
          type="button"
          className="use-source-from is-card"
          onClick={open}
          title={`Read ${card.name}`}
        >
          {row.from}
        </button>
      ) : (
        <span className="use-source-from">{row.from}</span>
      )}
      <span className="use-source-gives">{sourceWords(row.gives)}</span>
    </div>
  );
}

/**
 * One thing already running, at the size a reminder is.
 *
 * The tracker's own row in miniature and deliberately so: same count on the left,
 * same school colour down the edge, same sentence about what it is doing to this
 * sheet, same arrow when it is bending a roll. A reader should recognise it as
 * the row on block 6 rather than have to work out what it is.
 *
 * What it drops is everything that acts: no nudges, no drop, no card to open. See
 * the note at the top.
 */
function RunningRow({ effect }) {
  const open = effect.turns === null;
  const accent = cardAccent(getCard(effect.card)?.tags);
  const arrow = effectAdvantage(effect);
  const does = riderLine(effect.card);

  return (
    <div
      className={`use-running-row${accent ? ' has-accent' : ''}`}
      style={accent ? { '--fx-accent': accent } : undefined}
    >
      <span className={`use-running-turns${open ? ' is-open' : ''}`}>
        {open ? '∞' : effect.turns}
      </span>

      <span className="use-running-body">
        <span className="use-running-name">
          {effect.name}
          {effect.from && <span className="use-running-from">{effect.from}</span>}
        </span>
        {/* What it is doing to the numbers on the card beside this. Only the rows
            that do anything: a note the table applies by hand has nothing to say
            here that its own row does not already say. */}
        {does && <span className="use-running-does">{does}</span>}
      </span>

      {arrow && <RollArrow {...arrow} size={18} />}
    </div>
  );
}

/**
 * One Martial Move, offered as a thing you add to the swing.
 *
 * Shaped like the second half below it, because it is the same kind of question
 * and is read in the same glance: what it costs on the left, what it is and what
 * it does on the right, one tap on, one tap off. It wears the amber a talent
 * wears everywhere else on the sheet, since a move is a thing a talent taught.
 *
 * It carries the set that taught it, because two sets can teach the same move and
 * a hand with WOUND twice in it needs to say which WOUND is which. And it carries
 * a way into the full card, on the same pile every other card on this dialog deals
 * onto: the summary is a line, and the rules are on the plate.
 *
 * The refusal is arithmetic rather than a sentence. A move that cannot be added
 * because the allowance is full says whose rule that is in its tooltip and goes
 * quiet rather than vanishing, which is the same call the belt makes for a flask
 * with no charges left.
 */
function MoveRow({ card, talent, on, full, allowance, cut, onToggle, stack }) {
  const printed = Math.max(0, Math.floor(Number(card.wp) || 0));
  const owed = Math.max(0, printed - cut);
  const ap = Math.floor(Number(card.rides?.ap) || 0);

  return (
    <div className="use-move">
      <button
        type="button"
        className={`use-move-take${on ? ' is-on' : ''}`}
        onClick={onToggle}
        disabled={full}
        aria-pressed={on}
        title={
          full
            ? allowance.perAttack === 1
              ? 'One Martial Move rides a swing. Untick the one you have added first.'
              : `${allowance.from?.name ?? 'Your set'} allows ${allowance.perAttack} on one swing, and ${allowance.perAttack} are added.`
            : card.summary
        }
      >
        <span className="use-move-costs">
          {/* What it costs *this* holder, with the printed number struck through
              when a set has cut it. MARTIAL SWIFTNESS is the one card that does,
              and an orb that quietly said 1 where the codex says 2 would be the
              only place on the sheet a revision was not shown as one. */}
          {owed > 0 && (
            <CostOrb
              kind="wp"
              value={owed}
              size={26}
              was={cut > 0 && printed > owed ? printed : null}
              from={cut > 0 ? [allowance.from?.name ?? 'Your set'] : []}
            />
          )}
          {owed === 0 && <span className="use-move-cut">Free</span>}
          {/* RIPOSTE, and nothing else: the one move that gives a point back
              rather than taking one. Drawn as what it does to the swing, since an
              orb saying 1 beside a cut would read as a cost. */}
          {ap !== 0 && (
            <span className="use-move-cut">
              {ap < 0 ? '−' : '+'}
              {Math.abs(ap)} AP
            </span>
          )}
        </span>

        <span className="use-move-body">
          <span className="use-move-name">
            {card.name}
            {talent?.name && <span className="use-move-from">{talent.name}</span>}
          </span>
          <span className="use-move-note">{card.summary}</span>
        </span>
      </button>

      <button
        type="button"
        className="use-move-read"
        onClick={() => stack?.openCard(card)}
        disabled={!stack}
        title={`Read ${card.name}`}
        aria-label={`Read the ${card.name} card`}
      >
        &#9432;
      </button>
    </div>
  );
}

/**
 * The card's second half, offered as a thing you take.
 *
 * One tap turns it on, one tap turns it back off, and a half the card lets you
 * take repeatedly grows a dial once it is on. Two controls rather than one
 * because they answer two questions: whether, and how many.
 *
 * It wears the colour its name wears in card text, straight out of the
 * glossary — haze violet for an Overcast or a Multicast, blood red for a Blood
 * Tithe — so the control and the words on the card beside it are visibly the
 * same thing. The glossary's own sentence is its tooltip for the same reason:
 * what Multicast means is defined in exactly one place.
 */
function HalfOffer({ half, step, times, room, base, onTake }) {
  const keyword = getKeyword(half.name);
  const on = times > 0;

  return (
    <div className="use-half" style={keyword ? { '--half-accent': keyword.color } : undefined}>
      <button
        type="button"
        className={`use-half-take${on ? ' is-on' : ''}`}
        onClick={() => onTake(on ? 0 : 1)}
        aria-pressed={on}
        aria-label={`${half.name}: ${costWords(step)}${half.each ? ' each time' : ''}`}
        title={keyword?.detail}
      >
        <span className="use-half-costs">
          {step.ap > 0 && <CostOrb kind="ap" value={step.ap} size={26} />}
          {step.wp > 0 && <CostOrb kind="wp" value={step.wp} size={26} />}
          {step.health > 0 && <CostOrb kind="hp" value={step.health} size={26} />}
        </span>

        <span className="use-half-body">
          <span className="use-half-name">{half.name}</span>
          <span className="use-half-note">{halfNote(half)}</span>
        </span>
      </button>

      {on && half.each && (
        <Dial
          value={times}
          ceiling={VARIABLE_CAP}
          onChange={onTake}
          label="Times"
          hint={roomHint(room, base, half)}
        />
      )}
    </div>
  );
}

/** Whether taking it adds to the printed cost or stands in for it. */
function halfNote(half) {
  if (half.instead) return 'Instead of the printed cost, not on top of it';
  return half.each ? 'On top of the cast, as often as you like' : 'On top of the cast';
}

/** How many steps the pools can really pay for, under a dial that goes further. */
function roomHint(room, base, half) {
  if (room > 0) return `${room} is as many as your pools can pay for.`;
  return half.instead
    ? 'Your pools cannot cover even one of these.'
    : `Your pools cannot cover one of these on top of ${costWords(base)}.`;
}

/**
 * The number an action with no printed cost is being used at, and how many
 * times a repeatable second half has been taken.
 *
 * Two steppers rather than a slider or a typed box: the numbers involved are
 * single digits, and this is read at a table with one hand on a die.
 */
function Dial({ value, ceiling, onChange, label, hint }) {
  return (
    <div className="use-dial">
      <div className="use-dial-row">
        <button
          type="button"
          className="use-dial-step"
          onClick={() => onChange(value - 1)}
          disabled={value <= 0}
          aria-label="One fewer"
        >
          &minus;
        </button>

        <span className="use-dial-value">
          <span className="use-dial-n">{value}</span>
          <span className="use-dial-label">{label}</span>
        </span>

        <button
          type="button"
          className="use-dial-step"
          onClick={() => onChange(value + 1)}
          disabled={value >= ceiling}
          aria-label="One more"
        >
          +
        </button>
      </div>

      {hint && <span className="use-dial-hint">{hint}</span>}
    </div>
  );
}

/**
 * How many points a conversion may move: what the Action pool actually holds,
 * and no further than the Reaction pool's own ceiling. Moving a point neither
 * end can take is not a choice the sheet should offer.
 */
function convertRoom(character) {
  const ap = Number(character?.ap) || 0;
  const room = (Number(character?.reaction_max) || 0) - (Number(character?.reaction) || 0);
  return Math.max(0, Math.min(ap, room));
}

/** Why the dial stops where it stops. */
function convertHint(character, ceiling) {
  if (ceiling > 0) return `${ceiling} is as many as both pools can take.`;
  return (Number(character?.ap) || 0) === 0
    ? 'You have no Action Points to hold back.'
    : 'Your Reaction Points are already full.';
}

/** The cost in words, for the readers who never see the orbs. */
function costLine({ ap, wp, health }, resource) {
  const parts = [];
  if (ap > 0) parts.push(`${ap} ${resource}`);
  if (wp > 0) parts.push(`${wp} Willpower`);
  if (health > 0) parts.push(`${health} Health`);
  if (parts.length === 0) return 'costs nothing';
  if (parts.length === 1) return parts[0];
  return `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`;
}

/**
 * Which pools cannot cover this use, paid this way. An empty list means it can
 * be paid; anything in it is what the notice reads out.
 *
 * Health is in here for the Blood Tithe halves, and it is checked the same way
 * the pools are: a tithe you can pay down to nothing is a tithe you may pay,
 * because how close a character wants to stand to dying is theirs to decide.
 * One you cannot cover at all is refused, and nothing is taken.
 */
function shortfalls(character, { ap, wp, health }, way) {
  const short = [];

  const points = Number(character[way.pool]) || 0;
  if (ap > points) short.push({ resource: way.resource, need: ap, have: points });

  const willpower = Number(character.willpower) || 0;
  if (wp > willpower) short.push({ resource: 'Willpower', need: wp, have: willpower });

  const blood = Number(character.health) || 0;
  if (health > blood) short.push({ resource: 'Health', need: health, have: blood });

  return short;
}

/** "Perfect Casting", "Perfect Casting and Overload". */
function listAnd(words) {
  if (words.length <= 1) return words[0] ?? '';
  return `${words.slice(0, -1).join(', ')} and ${words[words.length - 1]}`;
}
