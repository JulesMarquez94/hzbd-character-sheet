/**
 * The function secrets, measured before they are sent. Covers one promise:
 * **a malformed Stripe key is caught here rather than in a failed checkout.**
 *
 *   node scripts/check-function-secrets.mjs .env.functions
 *
 * The risk is not a typo. It is that every wrong key fails identically — the
 * function throws, the page says "something went wrong reaching the payment
 * provider", and the real message goes to a dashboard log. A key eight
 * characters too long because its prefix got pasted twice looks perfectly
 * plausible in a text editor and costs an hour to find.
 *
 * So the shape is checked against what a real key looks like: a prefix Stripe
 * actually issues, a length, and an alphabet.
 */
import { readFileSync } from 'node:fs';

const file = process.argv[2] ?? '.env.functions';
const findings = [];

let text;
try {
  text = readFileSync(file, 'utf8');
} catch {
  console.error(`check-function-secrets: cannot read ${file}`);
  process.exit(1);
}

const values = new Map();
for (const line of text.split(/\r?\n/)) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const at = trimmed.indexOf('=');
  if (at > 0) values.set(trimmed.slice(0, at).trim(), trimmed.slice(at + 1).trim());
}

if (values.size === 0) findings.push(`${file} sets nothing. Fill in a value.`);

/* Observed on a real restricted test key for this account: 107 characters.
   Stripe has changed key lengths before, so this is a window rather than an
   equality — wide enough to survive a format change, narrow enough to catch a
   doubled prefix (+8) or a truncated paste. */
const KEY_RULES = {
  STRIPE_SECRET_KEY: { prefixes: ['rk_test_', 'rk_live_', 'sk_test_', 'sk_live_'], min: 100, max: 112 },
  STRIPE_WEBHOOK_SECRET: { prefixes: ['whsec_'], min: 32, max: 80 },
};

for (const [name, rule] of Object.entries(KEY_RULES)) {
  if (!values.has(name)) continue;
  const value = values.get(name);

  if (!value) {
    findings.push(`${name} is empty.`);
    continue;
  }
  if (!rule.prefixes.some((p) => value.startsWith(p))) {
    findings.push(
      `${name} starts "${value.slice(0, 12)}…", which is none of ${rule.prefixes.join(', ')}.`
    );
    continue;
  }
  const prefix = rule.prefixes.find((p) => value.startsWith(p));
  if (value.slice(prefix.length).startsWith(prefix)) {
    findings.push(
      `${name} begins with "${prefix}" twice, so it is ${prefix.length} characters too long. ` +
        'Paste the key over the whole value, not after the prefix.'
    );
    continue;
  }
  if (value.length < rule.min || value.length > rule.max) {
    findings.push(
      `${name} is ${value.length} characters; a real one is ${rule.min}-${rule.max}. ` +
        (value.length > rule.max ? 'Something was pasted twice.' : 'The paste was cut short.')
    );
    continue;
  }
  if (!/^[A-Za-z0-9_]+$/.test(value)) {
    findings.push(`${name} holds a character no Stripe key contains — probably a stray quote or space.`);
    continue;
  }
  console.log(`  ${name.padEnd(22)} ${prefix}… ${value.length} chars — looks well formed`);
}

if (findings.length) {
  console.error(`\ncheck-function-secrets: ${findings.length} finding(s)\n`);
  for (const f of findings) console.error(`  - ${f}`);
  console.error('');
  process.exit(1);
}

console.log('\ncheck-function-secrets: ready to send.');
