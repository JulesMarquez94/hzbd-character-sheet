import { Link } from 'react-router-dom';
import { LEGAL_PAGES, SELLER } from '../lib/legal.js';
import './SiteFooter.css';

/**
 * The footer that carries the legal links.
 *
 * It exists because of a card network rule rather than a design decision: terms,
 * privacy and a refund policy have to be reachable from the page that sells the
 * subscription, and reachable from the site generally, or the account is a
 * compliance problem waiting for its first dispute.
 *
 * It reads LEGAL_PAGES rather than listing three <Link>s, so a fourth document
 * added to src/lib/legal.js appears here without anybody remembering to come
 * back for it — and, more to the point, so a document that is removed cannot
 * leave a dead link on every page of the site.
 */
export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <p className="site-footer-line">
        © {new Date().getFullYear()} {SELLER.brand} Chronicles. All mechanical layouts and assets
        reserved.
      </p>
      <nav className="site-footer-nav" aria-label="Site information">
        {LEGAL_PAGES.map((page) => (
          <Link key={page.slug} to={page.path}>
            {page.label}
          </Link>
        ))}
        <Link to="/faq">FAQ</Link>
        <Link to="/premium">Premium</Link>
        <a href={`mailto:${SELLER.email}`}>Contact</a>
      </nav>
    </footer>
  );
}
