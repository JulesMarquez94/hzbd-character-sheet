import { Link } from 'react-router-dom';
import FaqList, { DiscordCta } from '../components/FaqList.jsx';
import SiteFooter from '../components/SiteFooter.jsx';
import './Faq.css';

/**
 * Common questions, on their own page.
 *
 * The same list sits at the bottom of the landing page, and this exists anyway
 * for three reasons: the footer needs somewhere stable to point, the pricing
 * page needs to answer "where does my money go" in more than a paragraph, and
 * somebody sent this link by a friend should land on the answers rather than
 * halfway down a sales pitch.
 *
 * The words live in src/lib/faq.js and the accordion in FaqList, so this file
 * is only the page around them.
 */
export default function Faq() {
  return (
    <main className="faq-page">
      <article className="faq-sheet">
        <header className="faq-head">
          <h1 className="heading-page">Common Questions</h1>
          <p className="faq-lede">
            What Hazebound is, what it costs, what is still missing and who is behind it. If the
            answer you want is not here, ask on the Discord.
          </p>
        </header>

        <FaqList openFirst />

        <DiscordCta />

        <nav className="faq-nav" aria-label="Elsewhere on this site">
          <Link to="/rules">How To Play</Link>
          <Link to="/dashboard">Make A Character</Link>
          <Link to="/premium">Premium</Link>
        </nav>
      </article>

      <SiteFooter />
    </main>
  );
}
