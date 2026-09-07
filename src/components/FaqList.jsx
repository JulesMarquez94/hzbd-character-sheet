import { DISCORD_INVITE, FAQ } from '../lib/faq.js';
import './FaqList.css';

/**
 * The FAQ, as one accordion, wherever it is asked for.
 *
 * Two pages render it: the strip at the bottom of the landing page and the
 * whole of /faq. It is a component rather than markup on each because the
 * words come from src/lib/faq.js and the *behaviour* should not fork either. A
 * question that opens on one page and not the other is a bug nobody files.
 *
 * ------------------------------------------------------ why <details> and not state
 * No `useState`. `<details>` already remembers whether it is open, the browser
 * animates nothing and it works before React has hydrated, which on the
 * landing page is the point: the accordion is below four sections a first-time
 * visitor may never scroll to, and it should cost them nothing.
 *
 * `open` is passed as a constant (`openFirst` is fixed per page), so React
 * writes the attribute once at mount and never again. That matters: the landing
 * page re-renders when the stored session finishes restoring, and an `open`
 * that React re-applied on every render would slam every answer shut under
 * somebody mid-sentence.
 */
export default function FaqList({ openFirst = false }) {
  return (
    <div className="faq-list">
      {FAQ.map((item, index) => (
        <details className="faq-item" key={item.id} open={index === 0 && openFirst}>
          <summary>{item.q}</summary>
          <div className="faq-answer">
            {item.a.map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
        </details>
      ))}
    </div>
  );
}

/**
 * The way to reach a person, under the list that promised it.
 *
 * The last answer says "the Discord, linked below", so this travels with the
 * list rather than being pasted under it twice. Anywhere FaqList appears
 * without this, that answer is a lie.
 */
export function DiscordCta() {
  return (
    <div className="faq-discord">
      <p>
        Something broke, or a rule did not survive your table? That is the useful kind of feedback
        and it goes here.
      </p>
      <a
        className="btn btn-purple-outline"
        href={DISCORD_INVITE}
        target="_blank"
        rel="noreferrer noopener"
      >
        Join The Discord
      </a>
    </div>
  );
}
