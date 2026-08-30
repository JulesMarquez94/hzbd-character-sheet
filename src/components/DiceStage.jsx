import { useEffect, useRef, useState } from 'react';
import DiceBox from '@drdreo/dice-box-threejs';
import { predeterminedNotation as notationFor } from '../lib/dice.js';

/**
 * The physics table: the same dice, tumbling.
 *
 * This replaces the floor of the surface and nothing else. The name, the DC
 * question, the total, the verdict and every button around it are still
 * DiceSurface's, because none of them are about how a die is drawn. What
 * changes is thirty pixels of the middle.
 *
 * ------------------------------------------------------- it decides nothing
 * The single most important thing about this file is what it does not do. It
 * does not roll. Every face was settled by dice.js before this component
 * mounted, and this throws dice that are *told where to land*, using the
 * predetermined notation the library was forked to provide:
 *
 *   Box.roll('2d6@5,3')   two dice that will come to rest showing 5 and 3
 *
 * That is what lets a Premium sheet and a free one show the same roll, and what
 * lets the same faces land on every screen at the table. A physics engine that
 * decided its own numbers could do neither: two clients would disagree, and a
 * replay would be a different roll wearing the same name. See dice.js.
 *
 * ------------------------------------------------------------------ colour
 * Jules asked for advantage in green and disadvantage in red on the first day,
 * and this library has one colorset for the whole table rather than one per die.
 * So the dice go on in waves: set the colour, throw that colour's dice, set the
 * next. Dice already on the table keep the material they were built with, which
 * is what makes the trick work and is the reason `updateConfig` is safe to call
 * between waves.
 *
 * Three waves at most, and usually one:
 *
 *   the roll itself   copper, the house colour
 *   the swing         green or red, never both. Advantage and Disadvantage
 *                     cancel before anything is rolled, so only one survives.
 *   each burst        amber, one at a time, so a cascade arrives as a cascade
 *                     rather than as eight dice appearing at once.
 *
 * ------------------------------------------------------------------ failure
 * Anything that goes wrong here calls `onFail` and the surface falls back to the
 * flat floor mid-roll. A physics engine is a lot of machinery to put between a
 * player and a number they have already been given, so it is never allowed to be
 * the reason a roll cannot be seen.
 */

/** The house colours, as the library wants them: a face and a body. */
const SETS = {
  base: { name: 'hzb-base', foreground: '#EAF2F8', background: '#C88A4B', texture: 'none', material: 'plastic' },
  advantage: { name: 'hzb-adv', foreground: '#07130b', background: '#2ECC71', texture: 'none', material: 'plastic' },
  disadvantage: { name: 'hzb-dis', foreground: '#F6E9E9', background: '#B30000', texture: 'none', material: 'plastic' },
  explosion: { name: 'hzb-burst', foreground: '#1A1206', background: '#FFB300', texture: 'none', material: 'plastic' },
};

/** How long between one burst landing and the next being thrown. */
const BURST_GAP_MS = 380;

export default function DiceStage({ dice, onLanded, onFail }) {
  const mount = useRef(null);
  const box = useRef(null);
  const alive = useRef(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    alive.current = true;
    let made = null;

    async function run() {
      try {
        made = new DiceBox(mount.current, {
          /* Nothing is fetched. The faces are drawn onto a canvas from the
             colorset, so with no texture and no sound there is no asset folder
             to ship and nothing to 404. */
          theme_texture: '',
          theme_material: 'plastic',
          theme_customColorset: SETS.base,
          sounds: false,
          shadows: true,
          light_intensity: 0.9,
          gravity_multiplier: 400,
          baseScale: 72,
          strength: 1.1,
        });
        box.current = made;
        await made.initialize();
        if (!alive.current) return;

        const base = dice.filter((die) => die.role === 'base');
        const swing = dice.filter(
          (die) => die.role === 'advantage' || die.role === 'disadvantage'
        );
        const bursts = dice.filter((die) => die.role === 'explosion');

        /* Wave one: the roll itself. `roll` rather than `add`, because it is the
           one that clears whatever was on the table before. */
        if (base.length > 0) await made.roll(notationFor(base));
        if (!alive.current) return;

        if (swing.length > 0) {
          await made.updateConfig({ theme_customColorset: SETS[swing[0].role] });
          if (!alive.current) return;
          await made.add(notationFor(swing));
          if (!alive.current) return;
        }

        if (bursts.length > 0) {
          await made.updateConfig({ theme_customColorset: SETS.explosion });
          for (const burst of bursts) {
            if (!alive.current) return;
            await made.add(notationFor([burst]));
            await new Promise((done) => setTimeout(done, BURST_GAP_MS));
          }
        }

        if (alive.current) onLanded();
      } catch (error) {
        console.warn('The physics table would not set up:', error);
        if (!alive.current) return;
        setFailed(true);
        onFail();
      }
    }

    run();

    return () => {
      alive.current = false;
      /* Three.js holds a WebGL context and cannon-es holds a world. A surface
         opened once a turn all evening would leak both, and a browser gives out
         a small number of contexts before it starts dropping the oldest. */
      try {
        box.current?.clearDice?.();
      } catch {
        // A box that never finished initialising has nothing to clear.
      }
      box.current = null;
    };
    // Built once per roll. The surface is keyed per roll, so this is per mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (failed) return null;
  return <div className="dice-table" ref={mount} aria-hidden="true" />;
}
