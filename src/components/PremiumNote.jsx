import { Link } from 'react-router-dom';
import { useAuth } from '../context/auth-context.js';
import { alreadyHasPremium } from '../lib/premium.js';

/**
 * One line, at the exact moment somebody runs out of room.
 *
 * There are three places in the app where a ceiling is reached: the vault is
 * full, the campaign slots are used up, or the forge is closed because a free
 * account has no creature slots at all. Each of those is a person who has just
 * been told no, and it is the only honest moment to mention that there is a
 * paid tier. Nowhere else does: the sheet itself never asks anybody for money,
 * and there is no advertising anywhere on the site.
 *
 * It shows itself only to accounts that would gain something. Anyone who
 * already has Premium, or was given it, sees nothing, so the line cannot become
 * the thing a paying supporter reads every time their vault fills up.
 *
 * The caller writes the sentence, because a good one names the number that was
 * just hit and a generic one is noise.
 */
export default function PremiumNote({ children }) {
  const { tier } = useAuth();
  if (alreadyHasPremium(tier)) return null;

  return (
    <p className="premium-note">
      {children} <Link to="/premium">See what Premium adds</Link>.
    </p>
  );
}
