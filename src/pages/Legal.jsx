import { Link } from 'react-router-dom';
import { CAMPAIGN_SLOTS, CHARACTER_SLOTS, CREATURE_SLOTS } from '../lib/tiers.js';
import { LOCAL_CHARACTER_SLOTS } from '../lib/localCharacters.js';
import { LEGAL_PAGES, SELLER, UPDATED, sellerAddress, sellerIsConfigured } from '../lib/legal.js';
import SiteFooter from '../components/SiteFooter.jsx';
import './Legal.css';

/**
 * Terms, privacy and refunds, from one component and one stylesheet.
 *
 * They are together because they are the same object: three views of the deal
 * between a player and whoever is taking the money. Splitting them into three
 * files meant three headers, three "last updated" lines and three chances for
 * one of them to name a different company than the other two.
 *
 * The numbers in the prose are read out of src/lib/tiers.js exactly as the
 * pricing page reads them. A terms page that hard-codes "three characters" is a
 * promise that breaks silently the day the ceiling moves.
 *
 * `**bold**` is the only markup these documents use. See `Rich` at the bottom.
 */

/* ------------------------------------------------------------------- the terms */

const TERMS = [
  {
    heading: 'Who you are dealing with',
    body: [
      `${SELLER.brand} is operated by ${SELLER.entity}, a corporation registered in the State of Florida, United States. Where these terms say "we", that is who they mean. Where they say "you", they mean the person using the site. If you are under 18, they mean you with a parent or guardian's agreement.`,
      'Using the site at all means accepting these terms. Paying for Premium means accepting them and the refund policy together.',
    ],
  },
  {
    heading: 'What the site does',
    body: [
      `${SELLER.brand} is a character sheet and campaign tool for a tabletop role-playing game of the same name. It stores characters, campaigns and encounters, does the arithmetic a sheet would otherwise ask you to do by hand and shows the rules text alongside them.`,
      'It is offered as it stands. The game is in open playtest, rules change between sessions and a change to the rules can change what your character sheet computes. That is the nature of a playtest tool and it is not a fault in the service.',
    ],
  },
  {
    heading: 'Accounts',
    body: [
      `You can make characters without an account: up to ${LOCAL_CHARACTER_SLOTS} are kept in your own browser's storage and never reach us. They live in that browser only. Clearing your site data deletes them and we cannot recover them, because we never had them.`,
      `An account needs a working email address. Keep the password to yourself; anything done through your account is treated as done by you. Tell us at ${SELLER.email} if you think somebody else is in it.`,
      'We can suspend or close an account that is being used to break these terms, to attack the service or to upload material we are not willing to host. Where the reason allows it, we will say what it was and give you a chance to get your data out first.',
    ],
  },
  {
    heading: 'What Premium is',
    body: [
      `A free account can hold ${CHARACTER_SLOTS.free} characters and ${CAMPAIGN_SLOTS.free} campaign. Premium raises those to ${CHARACTER_SLOTS.premium} characters and ${CAMPAIGN_SLOTS.premium} campaigns, and adds up to ${CREATURE_SLOTS.premium} forged creatures per campaign. The pricing page is the current statement of what it costs and what it includes.`,
      'Premium is a subscription. It renews at the interval shown at checkout until it is cancelled, and you can cancel any time from your account page. Cancelling stops the next renewal; it does not shorten the period you have already paid for.',
      'If a subscription lapses, nothing you have made is deleted. Characters, campaigns and creatures over the free ceiling stay in your account and stay readable. What you cannot do is create new ones past the free limit until you are paying again.',
      'We may change the price. An existing subscription keeps its price until we have given you notice by email, and a price change never applies to a period already paid for.',
      'Payment is taken by **Link**, Stripe’s merchant-of-record service, which is the seller on your receipt and handles any sales tax or VAT. Prices are shown inclusive of that tax: the figure on the pricing page is the whole of what your card is charged. Link may present it converted into your own currency. The cancellation and refund terms are on their own page and form part of these terms.',
    ],
  },
  {
    heading: 'What you make, and what we own',
    body: [
      'Your characters, campaigns, encounters and notes are yours. We claim no ownership of them. We store and display them because that is the service you asked for, and we look at them only where we have to in order to run or fix the site, or where the law requires it.',
      'The game rules, the written text, the card art, the layouts and the software are ours or our licensors’, and are not yours to republish or resell. Playing the game, running it for your table and quoting from it in the ordinary course of doing that are all fine.',
      'Pictures you upload stay yours. By uploading one you are telling us you have the right to use it, so a picture that infringes somebody else’s copyright is your responsibility rather than ours. We convert and cap what you upload so that we can serve it, and we show it only on your own pages: a portrait on a character sheet can be opened by anybody holding that sheet’s link, exactly like the rest of the sheet.',
    ],
  },
  {
    heading: 'What we do not promise',
    body: [
      'The site is provided as-is and as-available. We do not promise it will be uninterrupted, that it will never lose data, or that it will suit any particular purpose. Keep your own copy of anything you would be upset to lose.',
      'To the fullest extent the law allows, our total liability to you for anything arising out of the site or these terms is limited to what you actually paid us in the twelve months before the claim. Nothing here limits liability that cannot lawfully be limited, and if you are a consumer, your statutory rights are unaffected by any of this.',
    ],
  },
  {
    heading: 'Changes, and which law applies',
    body: [
      'We can change these terms. A change that materially affects a paying subscriber will be sent to the email on the account before it takes effect, and continuing to use the site after that is acceptance. The date at the top of this page is when it last changed.',
      `These terms are governed by the laws of the State of Florida, and the courts of ${SELLER.county} County, Florida have jurisdiction. If you are a consumer resident in the EU or the UK, this does not deprive you of the protection of your own country’s mandatory consumer law or of the right to bring proceedings where you live.`,
    ],
  },
];

/* ----------------------------------------------------------------- the privacy */

const PRIVACY = [
  {
    heading: 'The short version',
    body: [
      'We collect the least we can get away with: an email address so you can sign in, whatever you type into your characters and campaigns, and a customer id from Stripe if you pay. There is no advertising on this site, no tracking pixels, and nothing about you is sold or shared for marketing by anyone.',
    ],
  },
  {
    heading: 'What we hold',
    body: [
      '**Your email address and password.** The password is stored hashed by our authentication provider and is not readable by us.',
      '**What you make.** Characters, campaigns, encounters, creatures and notes, plus any pictures you upload. An uploaded picture is converted, capped in size and kept with your account. It is served from an address anyone holding it can open, exactly like the character sheet it sits on. Deleting it on your pictures page deletes the file.',
      '**Billing identifiers.** If you subscribe, we store a Stripe customer id, a subscription id and its status, so the site knows which tier your account is on. **No card number, expiry or security code ever reaches this site.** Card details are entered on Stripe’s own domain, which is why the payment button is a redirect rather than a form.',
      '**Ordinary server logs.** Our hosts keep short-lived records of requests, including IP addresses, for security and debugging.',
      '**Nothing at all, for a device-only character.** Characters made without an account are written to your own browser’s storage and are never sent to us.',
    ],
  },
  {
    heading: 'Why we are allowed to hold it',
    body: [
      'To provide the service you asked for, which for an account and its contents is performance of our contract with you. To take payment, likewise. To keep the site up and secure, which is our legitimate interest. To meet tax and accounting obligations, which is a legal duty. We do not rely on consent for any of it, because we do not do anything with your data that would need consent.',
    ],
  },
  {
    heading: 'Who else touches it',
    body: [
      '**Supabase** hosts the database and handles sign-in. **Cloudflare** serves the site. **Stripe** processes payments and holds the card details we never see. **Google Fonts** serves the typefaces, which means Google receives the IP address of anyone loading a page here. That is the entire list. None of them is permitted to use your data for their own purposes.',
      'These providers are in the United States and the European Union, so your data crosses borders. Transfers out of the EEA and the UK rely on the standard contractual clauses in those providers’ terms.',
    ],
  },
  {
    heading: 'How long',
    body: [
      `Account data stays until you delete the account. Ask at ${SELLER.email} and we will delete the account and everything in it. Billing records are kept for as long as tax law requires us to keep them, which is longer than the account itself and is not something we can shorten on request.`,
    ],
  },
  {
    heading: 'What you can ask for',
    body: [
      `A copy of what we hold about you, a correction, a deletion or a machine-readable export. If you are in the EEA or the UK you also have the right to object to processing and to complain to your national data protection authority. Write to ${SELLER.email} and we will answer within 30 days.`,
      'We do not sell personal information and we do not share it for cross-context behavioural advertising, as those terms are used in United States state privacy law.',
    ],
  },
  {
    heading: 'Children',
    body: [
      `The site is not directed at children under 13 and we do not knowingly hold their data. If you believe a child under 13 has made an account, write to ${SELLER.email} and we will remove it.`,
    ],
  },
];

/* ----------------------------------------------------------------- the refunds */

const REFUNDS = [
  {
    heading: 'Cancelling',
    body: [
      'Cancel any time from your account page, which opens Stripe’s own portal. Cancelling stops the next renewal and leaves the current period running to its end. There is nothing to email us about and no retention script to sit through.',
      'A cancelled account keeps everything it has made. Characters and campaigns over the free ceiling stay readable; you simply cannot create new ones past the free limit.',
    ],
  },
  {
    heading: 'Who sells it, and who refunds it',
    body: [
      `Your subscription is sold through **Link**, which is Stripe's merchant-of-record service. ${SELLER.entity} makes ${SELLER.brand} and decides what Premium is; Link takes the payment, is the seller on the receipt and remits any sales tax or VAT. Your card statement will read **LINK.COM*** followed by our name, and your purchase shows in Link's own order history as "sold through Link".`,
      'That means there are two doors for a refund and both of them work. You can ask us, at the address at the foot of this page. Or you can ask Link, who handle payment and subscription support for every order they sell, and who can refund a charge within 60 days of it being taken. Link may also refund a charge on their own judgement without asking us first.',
      'You can manage the subscription from either side too: from your account page here, or from Link’s order management if you have a Link account.',
    ],
  },
  {
    heading: 'Refunds',
    body: [
      `If the site did not do what the pricing page said it does, write to ${SELLER.email} within 30 days of the charge and we will refund it. We would rather refund somebody who is unhappy than argue about a sum this size.`,
      'Beyond that window we generally do not refund a period that has already been used, because a subscription can be cancelled before it renews and cancelling is one click. A renewal you did not notice, on an account that plainly was not being used, is worth writing to us about anyway.',
      'A refund ends the subscription and returns the account to the free tier at once. Where sales tax was charged, the refund includes it.',
    ],
  },
  {
    heading: 'If you are in the EU or the UK',
    body: [
      'You have 14 days from the start of a subscription to change your mind and get your money back, and you do not have to give a reason. By starting to use Premium inside those 14 days you agree that we begin the service immediately, and you accept that once it is fully performed for that period the right to withdraw no longer applies. In practice we honour the 14 days regardless.',
    ],
  },
  {
    heading: 'Failed payments and disputes',
    body: [
      'If a card fails, Stripe retries it over a few days and Premium stays on while it does. If it never succeeds, the account returns to the free tier and nothing is deleted.',
      `If something looks wrong on your statement, please write to ${SELLER.email} before opening a dispute with your bank. A dispute takes weeks and costs a fee whatever the outcome; an email usually resolves it the same day. Bear in mind the line on your statement reads **LINK.COM*** rather than our name, which is the commonest reason a charge looks unfamiliar.`,
    ],
  },
];

const DOCS = {
  terms: { title: 'Terms of Service', updated: UPDATED.terms, sections: TERMS },
  privacy: { title: 'Privacy Policy', updated: UPDATED.privacy, sections: PRIVACY },
  refunds: { title: 'Cancellation and Refunds', updated: UPDATED.refunds, sections: REFUNDS },
};

/**
 * `**bold**` is the only markup the documents use, and this is all it takes to
 * render it. A markdown dependency for one emphasis rule would be a dependency
 * to keep patched forever.
 */
function Rich({ text }) {
  return (
    <>
      {text.split(/(\*\*[^*]+\*\*)/g).map((chunk, i) =>
        chunk.startsWith('**') && chunk.endsWith('**') ? (
          <b key={i}>{chunk.slice(2, -2)}</b>
        ) : (
          <span key={i}>{chunk}</span>
        )
      )}
    </>
  );
}

export default function Legal({ page }) {
  const doc = DOCS[page];
  if (!doc) return null;

  return (
    <main className="legal-page">
      <article className="legal-sheet">
        <header className="legal-head">
          <h1 className="heading-page">{doc.title}</h1>
          <p className="legal-updated">Last updated {doc.updated}</p>
        </header>

        {!sellerIsConfigured() && (
          <p className="legal-draft" role="status">
            <b>Draft.</b> The company name, address and contact email in this document are still
            placeholders. It is not in force, and it must not be linked from a live checkout until
            <code> src/lib/legal.js </code> is filled in.
          </p>
        )}

        {doc.sections.map((section) => (
          <section className="legal-section" key={section.heading}>
            <h2 className="heading-section">{section.heading}</h2>
            {section.body.map((para, i) => (
              <p key={i}>
                <Rich text={para} />
              </p>
            ))}
          </section>
        ))}

        <footer className="legal-foot">
          <p>
            {SELLER.entity}
            <br />
            {sellerAddress()}
            <br />
            <a href={`mailto:${SELLER.email}`}>{SELLER.email}</a>
          </p>
          <nav className="legal-nav">
            {LEGAL_PAGES.filter((p) => p.slug !== page).map((p) => (
              <Link key={p.slug} to={p.path}>
                {p.label}
              </Link>
            ))}
            <Link to="/premium">Premium</Link>
          </nav>
        </footer>
      </article>

      <SiteFooter />
    </main>
  );
}
