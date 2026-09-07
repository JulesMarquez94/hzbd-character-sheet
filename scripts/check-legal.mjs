/**
 * The paperwork behind the money, proved. Covers one promise:
 * **the site cannot ship a checkout that links to an unfinished contract.**
 *
 *   node scripts/check-legal.mjs         report and exit 1 on any finding
 *   node scripts/check-legal.mjs --list  print what the documents currently say
 *
 * The risk here is not a bug. It is the ordinary sequence of events where the
 * legal pages get written with placeholders, the placeholders are meant to be
 * filled in "before launch", and launch is a Tuesday afternoon six weeks later
 * when nobody remembers they were ever there. The result is a live checkout
 * whose terms name "[Entity name], Inc." as the contracting party — which is
 * not a contract, and is exactly the thing a cardholder's bank reads during a
 * dispute.
 *
 * So this refuses to pass while any TODO placeholder is left in SELLER, and it
 * refuses on the two things that go stale quietly instead of loudly: a document
 * the router does not serve, and a price on the pricing page in a currency the
 * seller's country would not plausibly bill in.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

import { LEGAL_PAGES, SELLER, UPDATED, sellerIsConfigured } from '../src/lib/legal.js';
import { PLANS } from '../src/lib/premium.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const findings = [];
const fail = (what) => findings.push(what);

/* ------------------------------------------------------- the placeholders */

if (!sellerIsConfigured()) {
  const left = Object.entries({
    entity: SELLER.entity,
    email: SELLER.email,
    county: SELLER.county,
    ...SELLER.address,
  })
    .filter(([, value]) => typeof value === 'string' && value.includes('['))
    .map(([key, value]) => `${key} = ${value}`);

  fail(
    `src/lib/legal.js still holds ${left.length} placeholder${left.length === 1 ? '' : 's'}:\n` +
      left.map((line) => `      ${line}`).join('\n') +
      '\n      Fill these in before a live checkout. The legal pages show a draft banner ' +
      'until you do.'
  );
}

/* ---------------------------------------------------------- the routing */

/* A document nobody can open is the same as a document that does not exist, and
   this is the failure mode that survives review: the page is written, the link
   is in the footer, and the route was never added. */
const app = readFileSync(resolve(root, 'src/App.jsx'), 'utf8');
for (const page of LEGAL_PAGES) {
  if (!app.includes(`path="${page.path}"`)) {
    fail(`src/App.jsx has no route for ${page.path}, so the ${page.label} page cannot be opened.`);
  }
}

/* And the reverse: the footer is generated from LEGAL_PAGES, so a document that
   exists but is not listed there is one no reader will ever find. */
const footer = readFileSync(resolve(root, 'src/components/SiteFooter.jsx'), 'utf8');
if (!footer.includes('LEGAL_PAGES')) {
  fail(
    'src/components/SiteFooter.jsx no longer builds its links from LEGAL_PAGES. ' +
      'Hand-listed links go stale; put it back.'
  );
}

/* ----------------------------------------------------------- the money */

/* The pricing page is display copy and the till is a Stripe price id, so these
   two can disagree without anything crashing. Nothing here can check the id,
   but a euro sign on a Florida corporation's checkout is worth a shout. */
const currencies = [...new Set(PLANS.map((plan) => plan.currency))];
if (currencies.length > 1) {
  fail(
    `src/lib/premium.js prices plans in more than one currency (${currencies.join(' and ')}). ` +
      'One Stripe price is one currency; the page would be advertising a charge it cannot make.'
  );
}
if (SELLER.address.country === 'United States' && currencies.some((c) => c !== '$')) {
  fail(
    `The seller is in ${SELLER.address.country} but the pricing page reads ` +
      `${currencies.join(', ')}. Change src/lib/premium.js, or the Stripe price, so they agree.`
  );
}

/* --------------------------------------------------------- the dates */

for (const [slug, date] of Object.entries(UPDATED)) {
  if (!Number.isFinite(Date.parse(date))) {
    fail(`UPDATED.${slug} is "${date}", which is not a date a reader or a court could parse.`);
  }
}

/* ------------------------------------------------------------ report */

if (process.argv.includes('--list')) {
  console.log(`Seller   ${SELLER.entity}`);
  console.log(`Address  ${[SELLER.address.line1, SELLER.address.city].filter(Boolean).join(', ')}`);
  console.log(`Contact  ${SELLER.email}`);
  console.log(`Pages    ${LEGAL_PAGES.map((p) => p.path).join('  ')}`);
  console.log(`Plans    ${PLANS.map((p) => `${p.currency}${p.price} ${p.per}`).join('  ')}`);
  console.log('');
}

if (findings.length) {
  console.error(`check-legal: ${findings.length} finding${findings.length === 1 ? '' : 's'}\n`);
  for (const finding of findings) console.error(`  - ${finding}\n`);
  process.exit(1);
}

console.log('check-legal: the paperwork is filled in, routed and reachable.');
