import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/auth-context.js';
import {
  COMPARISON,
  PLAN_NOTE,
  PREMIUM_EXCLUDES,
  alreadyHasPremium,
  confirmCheckout,
  offeredPlans,
  openPortalUrl,
  startCheckout,
} from '../lib/premium.js';
import SiteFooter from '../components/SiteFooter.jsx';
import './Premium.css';

/**
 * The one page where money is asked for.
 *
 * It is four states rather than one, and which it shows is read off the tier and
 * the query string:
 *
 *   the offer      the ordinary case. What Premium is, beside what Free is.
 *   coming back    `?session_id=` on the URL, meaning Stripe has just sent them
 *                  back from a checkout. See the note on confirming below.
 *   changed mind   `?checkout=cancelled`, which is not an error and is not
 *                  worth an apology. Say nothing much and leave the offer up.
 *   already paid   the tier is already premium or better, so there is nothing
 *                  to sell. Offer the billing portal instead.
 *
 * ------------------------------------------------------- what this page cannot do
 * It cannot grant anything. Nothing on this page writes a tier, because nothing
 * a browser does is allowed to: the Stripe webhook writes it as the service
 * role and every ceiling is enforced again by a trigger in Postgres. So a
 * player who edits this component, or types the return URL by hand, ends up
 * exactly where they started. See supabase/functions/stripe-webhook.
 */
export default function Premium() {
  const { user, tier, tierInfo, refreshProfile } = useAuth();
  const [params, setParams] = useSearchParams();

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [landed, setLanded] = useState(false);

  const paid = alreadyHasPremium(tier);
  const sessionId = params.get('session_id');
  const cancelled = params.get('checkout') === 'cancelled';

  /* Not state. The session id is on the URL while the check is running and is
     taken off the moment it finishes, so "are we still checking" is a question
     the URL already answers and a second copy of it could only disagree. */
  const settling = Boolean(sessionId);

  /**
   * Coming back from a finished checkout.
   *
   * The redirect is not proof of payment and is not treated as any: this asks
   * the Edge Function, which asks Stripe, which is the only thing that knows.
   * Meanwhile the tier is very likely already correct without it, because the
   * webhook usually lands first and AuthContext is watching the profile row
   * over Realtime. So this is the belt to that pair of braces, and its real job
   * is the rare morning when the webhook is slow.
   *
   * The session id is taken off the URL either way, so a reload is not a second
   * round trip and the id does not sit in the address bar to be copied.
   */
  useEffect(() => {
    if (!sessionId) return undefined;
    let live = true;

    (async () => {
      try {
        await confirmCheckout(sessionId);
        await refreshProfile();
        if (live) setLanded(true);
      } catch (err) {
        if (live) setError(err.message);
      } finally {
        // Clearing the query string is also what ends the settling state, so it
        // happens whichever way the check went.
        if (live) setParams({}, { replace: true });
      }
    })();

    return () => {
      live = false;
    };
  }, [sessionId, refreshProfile, setParams]);

  async function subscribe(planKey) {
    setBusy(true);
    setError('');
    try {
      // A whole-page move rather than a new tab: a payment page opened in a
      // popup is a payment page a phone will lose behind the keyboard.
      window.location.assign(await startCheckout(planKey));
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  async function manage() {
    setBusy(true);
    setError('');
    try {
      window.location.assign(await openPortalUrl());
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  const plans = offeredPlans();

  return (
    <main className="container page prem-page">
      <h2 className="section-title">
        <span>Support Hazebound</span>
        {user && (
          <span className={`tier-badge tier-${tierInfo.id}`}>{tierInfo.label}</span>
        )}
      </h2>

      {settling && <div className="loading-veil">Confirming your payment…</div>}

      {landed && (
        <div className="form-success">
          Thank you. Your account is Premium. Everything below is open to you now.
        </div>
      )}

      {cancelled && !landed && (
        <p className="muted prem-cancelled">
          Nothing was charged. The offer is still here whenever you want it.
        </p>
      )}

      {error && <div className="form-error">{error}</div>}

      <p className="prem-lead">
        The sheet is free. Every card, the whole rulebook and a seat at any table cost nothing, and
        they are going to stay that way. Premium is for the Game Master running more than one table
        and for anyone who wants to keep the lights on.
      </p>

      <div className="prem-plans">
        <article className="prem-card">
          <h3 className="prem-name">Free</h3>
          <p className="prem-price">
            <b>0</b>
            <span>for as long as the site stands</span>
          </p>
          <p className="prem-note">No card, no clock, no advertising.</p>
          <dl className="prem-rows">
            {COMPARISON.map((row) => (
              <div className="prem-row" key={row.id}>
                <dt>{row.label}</dt>
                <dd>{row.free}</dd>
              </div>
            ))}
          </dl>
          {!user && (
            <Link to="/register" className="btn btn-sm btn-block">
              Create a free account
            </Link>
          )}
        </article>

        <article className="prem-card is-premium">
          <h3 className="prem-name">Premium</h3>

          {/* The headline price is the first offered plan, and any others are
              named in the note rather than given a price line of their own. The
              two cards are stretched to the same height so their comparison
              rows sit level, and a second 2.1rem price line in this one alone
              would push its rows out of step with Free's. The note already
              reserves two lines, so the yearly offer costs no height at all. */}
          {plans[0] && (
            <p className="prem-price">
              <b>
                {plans[0].currency}
                {plans[0].price}
              </b>
              <span>{plans[0].per}</span>
            </p>
          )}
          <p className="prem-note">
            {plans.length > 1 &&
              `Or ${plans[1].currency}${plans[1].price} ${plans[1].per}${
                plans[1].saving ? `, ${plans[1].saving}` : ''
              }. `}
            {PLAN_NOTE}
          </p>

          <dl className="prem-rows">
            {COMPARISON.map((row) => (
              <div className="prem-row" key={row.id}>
                <dt>{row.label}</dt>
                <dd className="is-premium-value">{row.premium}</dd>
              </div>
            ))}
          </dl>

          {paid ? (
            <>
              <p className="prem-have">
                You already have this. Thank you.
              </p>
              {tier === 'premium' && (
                <button
                  type="button"
                  className="btn btn-sm btn-block"
                  onClick={manage}
                  disabled={busy}
                >
                  {busy ? 'Opening…' : 'Manage subscription'}
                </button>
              )}
            </>
          ) : user ? (
            plans.map((plan) => (
              <button
                key={plan.key}
                type="button"
                className="btn btn-copper btn-sm btn-block"
                onClick={() => subscribe(plan.key)}
                disabled={busy || settling}
              >
                {busy ? 'Opening the checkout…' : `Go Premium · ${plan.currency}${plan.price} ${plan.per}`}
              </button>
            ))
          ) : (
            <Link to="/login" state={{ from: '/premium' }} className="btn btn-copper btn-sm btn-block">
              Sign in to subscribe
            </Link>
          )}
        </article>
      </div>

      <div className="prem-detail">
        {COMPARISON.filter((row) => row.note).map((row) => (
          <p className="prem-gloss" key={row.id}>
            <b>{row.label}.</b> {row.note}
          </p>
        ))}
      </div>

      <section className="panel prem-honest">
        <div className="frame">
          <h3 className="frame-heading">What this is not</h3>
          <ul className="prem-list">
            {PREMIUM_EXCLUDES.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>

        <div className="frame prem-why">
          <h3 className="frame-heading">Where the money goes</h3>
          <p>
            Hazebound runs on one database and one static host, and both of them send a bill. A
            subscription pays that bill first, buys the time to keep building after it and goes
            towards an artist after that. That is the whole of the business plan, and it is set out
            at more length on the <Link to="/faq">FAQ</Link>.
          </p>
          <p className="muted prem-fine">
            Payments are handled by Stripe. No card detail is ever entered on this site or stored by
            it. Cancel any time from your account, and the subscription runs to the end of the
            period you have already paid for. Nothing you have made is ever deleted for not paying:
            a lapsed account keeps every character and campaign it has and simply cannot start new
            ones past the free ceiling.
          </p>
          {/* At the point of sale rather than only in the footer. A cardholder
              has to be able to read what they are agreeing to without leaving
              the page that is asking for the card. */}
          <p className="muted prem-fine prem-legal">
            Subscribing means agreeing to the <Link to="/terms">Terms</Link>, the{' '}
            <Link to="/privacy">Privacy Policy</Link> and the{' '}
            <Link to="/refunds">Cancellation and Refunds</Link> policy.
          </p>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
