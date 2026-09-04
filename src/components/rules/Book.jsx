import { useEffect, useRef, useState } from 'react';
import Prose from './Prose.jsx';
import { RULEBOOK, rulesOf } from '../../lib/rulebook.js';

/**
 * The whole rulebook on one page, with its contents down the side.
 *
 * One page rather than a chapter at a time, and that is the deliberate half: a
 * table mid-argument searches for a word, and the browser's own find is the
 * best search there is as long as everything is on the page. It also means a
 * link into `#chapter-five` lands somebody exactly where the argument is.
 *
 * The rail marks whichever chapter you are reading and opens its own rules
 * under it, so `5.6.1 Martial Moves` is one click from anywhere in the book.
 *
 * **The Contents chapter is not drawn.** It is a table of the same seventeen
 * rows this rail already is, and printing both would be the list twice. Nothing
 * else in the book is left out.
 */

/* Where "the top of the page" is, in pixels: clear of the site bar and of the
   sticky row of shelves under it. A shade lower than the `scroll-margin-top`
   Rules.css parks an anchored heading at, so a heading a link jumped to lands
   just *under* this line and the rail marks the chapter you were sent to. */
const READING_LINE = 170;

const SKIP = new Set(['contents']);

const SECTIONS = RULEBOOK.filter((section) => !SKIP.has(section.id));

export default function Book() {
  const [here, setHere] = useState(SECTIONS[0]?.id ?? null);
  const bodyRef = useRef(null);

  /* Which chapter is being read: the last heading to have passed under the two
     bars at the top of the window. A chapter can be twenty screens long, so it
     is the heading you went *past* rather than the heading you can see.

     A plain scroll listener, coalesced onto one animation frame. This was an
     IntersectionObserver first and the observer is the wrong tool: it reports a
     *change* of state, and a jump to `#chapter-five` from Chapter Two is not
     one. The heading never enters the observed box on its way, it is simply
     above it when the page settles, so nothing fires and the rail keeps marking
     the chapter you left.

     Seventeen rectangles a frame is not the expensive thing it sounds like:
     they are read in one batch with nothing written between them, so the
     browser lays the page out once and answers all seventeen off it. */
  useEffect(() => {
    const node = bodyRef.current;
    if (!node) return undefined;

    const marks = [...node.querySelectorAll('[data-section]')];
    if (marks.length === 0) return undefined;

    let frame = 0;

    function settle() {
      frame = 0;
      let found = marks[0];
      for (const mark of marks) {
        // Document order, so the tops only ever increase: the first heading
        // still below the line ends it.
        if (mark.getBoundingClientRect().top > READING_LINE) break;
        found = mark;
      }
      setHere(found.dataset.section);
    }

    function onScroll() {
      if (frame === 0) frame = requestAnimationFrame(settle);
    }

    settle();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    /* A rail link is a fragment, and following one moves the page without the
       reader scrolling it. The browser has already jumped by the time this
       fires, so the frame it books reads the page where it landed. */
    window.addEventListener('hashchange', onScroll);

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      window.removeEventListener('hashchange', onScroll);
      if (frame !== 0) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div className="book">
      <nav className="book-rail" aria-label="Rulebook contents">
        <span className="book-rail-label">The book</span>

        <ol className="book-rail-list">
          {SECTIONS.map((section) => (
            <li key={section.id} className={section.id === here ? 'is-here' : undefined}>
              <a href={`#${section.id}`} className="book-rail-link">
                {section.lead && <span className="book-rail-lead">{section.lead}</span>}
                <span className="book-rail-title">{section.title}</span>
              </a>

              {section.id === here && rulesOf(section).length > 0 && (
                <ul className="book-rail-rules">
                  {rulesOf(section).map((rule) => (
                    <li key={rule.id}>
                      <a href={`#${rule.id}`}>{rule.text}</a>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ol>
      </nav>

      <div className="book-body" ref={bodyRef}>
        {SECTIONS.map((section) => (
          <section className="book-section" key={section.id} id={section.id}>
            <h2 className="book-heading" data-section={section.id}>
              {section.lead && <span className="book-heading-lead">{section.lead}</span>}
              {section.title}
            </h2>
            <Prose blocks={section.blocks} />
          </section>
        ))}
      </div>
    </div>
  );
}
