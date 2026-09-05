/**
 * Text style checker. Enforces docs/text-style.md on user-facing text only:
 * strings, JSX text, Markdown prose. Comments are deliberately out of scope,
 * they are internal notes and still use em dashes throughout the repo.
 *
 *   node scripts/lint-text.mjs          report and exit 1 on any finding
 *   node scripts/lint-text.mjs --list   report every finding, exit 0
 */
import fs from 'node:fs';
import path from 'node:path';

const BS = String.fromCharCode(92);
const TICK = String.fromCharCode(96);
const SQ = String.fromCharCode(39);
const DQ = String.fromCharCode(34);
const ROOTS = ['src', 'README.md', 'index.html', 'docs/rulebook.md'];
const EXT = /\.(jsx?|css|md|html)$/;

/**
 * A bare dash alone in a slot means "no value yet". That is a table glyph, not
 * punctuation, and docs/text-style.md keeps it. Every other dash is a finding.
 */
const NIL_GLYPH = /['"`>]\s*—\s*['"`<]/;

function walk(p, out = []) {
  const st = fs.statSync(p);
  if (st.isDirectory()) {
    for (const e of fs.readdirSync(p)) walk(path.join(p, e), out);
    return out;
  }
  if (EXT.test(p)) out.push(p);
  return out;
}

/**
 * Per line, mark which columns are comment rather than copy.
 *
 * Two deliberate choices keep this from desyncing across a whole file:
 *
 * - A quote only opens a string when it closes on the same line. Plain JS
 *   quotes cannot span lines anyway, and without this an apostrophe in prose
 *   ("the build's codex") swallows the rest of the file and real comments start
 *   getting reported as copy.
 * - Template literals are a stack, not a flag. A nested template inside an
 *   interpolation used to close the outer one, which left every later line
 *   looking like a string.
 */
function commentMask(lines, ext) {
  const canLine = ext !== 'css' && ext !== 'md';
  const canBlock = ext !== 'md';
  const htmlBlock = ext === 'html' || ext === 'md';
  let inBlock = false;
  let inHtml = false;
  const stack = [];

  return lines.map((line) => {
    const mask = new Uint8Array(line.length);
    let i = 0;
    let quote = '';

    while (i < line.length) {
      const c = line[i];
      const rest = line.slice(i);

      if (inBlock) {
        mask[i] = 1;
        if (rest.startsWith('*/')) { mask[i + 1] = 1; inBlock = false; i += 2; continue; }
        i += 1; continue;
      }
      if (inHtml) {
        mask[i] = 1;
        if (rest.startsWith('-->')) { mask[i + 1] = mask[i + 2] = 1; inHtml = false; i += 3; continue; }
        i += 1; continue;
      }
      if (quote) {
        if (c === BS) { i += 2; continue; }
        if (c === quote) quote = '';
        i += 1; continue;
      }

      const top = stack[stack.length - 1];

      if (top === 'template') {
        if (c === BS) { i += 2; continue; }
        if (c === '$' && line[i + 1] === '{') { stack.push('interp'); i += 2; continue; }
        if (c === TICK) { stack.pop(); i += 1; continue; }
        i += 1; continue;
      }

      // Plain code, or inside an interpolation, which is also code.
      if (canLine && rest.startsWith('//')) { mask.fill(1, i); break; }
      if (canBlock && rest.startsWith('/*')) {
        const close = line.indexOf('*/', i + 2);
        if (close === -1) { mask.fill(1, i); inBlock = true; break; }
        mask.fill(1, i, close + 2); i = close + 2; continue;
      }
      if (htmlBlock && rest.startsWith('<!--')) {
        const close = line.indexOf('-->', i + 4);
        if (close === -1) { mask.fill(1, i); inHtml = true; break; }
        mask.fill(1, i, close + 3); i = close + 3; continue;
      }
      if (c === TICK) { stack.push('template'); i += 1; continue; }
      if (top === 'interp' && c === '{') { stack.push('interp'); i += 1; continue; }
      if (top === 'interp' && c === '}') { stack.pop(); i += 1; continue; }
      if (c === SQ || c === DQ) {
        if (line.indexOf(c, i + 1) !== -1) quote = c;
        i += 1; continue;
      }
      i += 1;
    }
    return mask;
  });
}

/**
 * A serial comma is ", and X" with an earlier comma in the same sentence. A
 * ", and" joining two independent clauses is not one, so the trailing fragment
 * is checked for its own subject and verb before it is reported.
 */
const CLAUSE_START = new RegExp(
  '^(you|it|they|we|i|he|she|there|that|this|nothing|everything|each|every)[^a-z]'
  + '|^(the|a|an|his|her|their|its|your|my|two|three) [a-z’]+ (is|are|was|were|has|have|does|do|did|will|can|could|would|may|might|must|goes|comes|stays|leaves|takes|gives|makes|counts|costs|reads|sits|never|always)[^a-z]'
  + '|^[a-z’]+ (is|are|was|were|has|have|does|do|did|will|can|could|would|may|might|must|hardly|never|always)[^a-z]',
  'i',
);

function findings(file) {
  const src = fs.readFileSync(file, 'utf8');
  const ext = file.split('.').pop();
  const lines = src.split('\n');
  const masks = ext === 'md' ? null : commentMask(lines, ext);
  const out = [];

  lines.forEach((line, li) => {
    // An explicit opt-out for the cases the rules themselves keep: an
    // appositive between commas, a comma joining two clauses the heuristic
    // cannot see. Marked, not silently tolerated, so it stays reviewable.
    if (line.includes('text-style-ok')) return;
    const isCopy = (idx) => (masks ? masks[li][idx] === 0 : true);

    for (const m of line.matchAll(/[—–]/g)) {
      if (!isCopy(m.index)) continue;
      if (NIL_GLYPH.test(line.slice(Math.max(0, m.index - 3), m.index + 4))) continue;
      out.push({ file, line: li + 1, rule: m[0] === '—' ? 'em dash' : 'en dash', text: line.trim() });
    }

    for (const m of line.matchAll(/, (and|or) /g)) {
      if (!isCopy(m.index)) continue;
      const before = line.slice(0, m.index);
      // Bound the lookback to the enclosing literal. Without this, the comma in
      // `{ name: 'Loadout', note: 'a list, and a thing' }` counts as an earlier
      // comma in the sentence and every such object literal reads as a serial.
      const bound = Math.max(
        before.lastIndexOf(SQ), before.lastIndexOf(DQ), before.lastIndexOf(TICK),
        before.lastIndexOf('${'), before.lastIndexOf('}'), before.lastIndexOf('>'),
        before.lastIndexOf('. '), before.lastIndexOf('! '), before.lastIndexOf('? '),
      );
      const clause = before.slice(bound + 1);
      if (!clause.includes(',')) continue;
      // Only the LAST conjunction in a sentence can be the serial one. Where
      // every item carries its own conjunction ("land, or money, or at minimum
      // a grievance") the commas are correct and the rhythm is deliberate.
      const after = line.slice(m.index + m[0].length);
      const tail = after.split(/[.!?] /)[0];
      if (/, (and|or) /.test(tail)) continue;
      // Keep the comma when the item before it already contains a conjunction.
      // Dropping it there fuses two levels of list into nonsense: "a plant,
      // venom or disease or predict how it behaves".
      const lastItem = clause.slice(clause.lastIndexOf(',') + 1);
      if (/ (and|or) /.test(lastItem)) continue;
      // A comma joining two independent clauses is not a serial comma.
      if (CLAUSE_START.test(after.replace(/^[^A-Za-z]+/, ''))) continue;
      out.push({ file, line: li + 1, col: m.index, rule: 'serial comma', text: line.trim() });
    }
  });
  return out;
}

const files = ROOTS.filter((r) => fs.existsSync(r)).flatMap((r) => walk(r));
const all = files.flatMap(findings);
const listing = process.argv.includes('--list');

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(all));
  process.exit(0);
}

if (all.length === 0) {
  console.log(`text style: clean across ${files.length} files`);
  process.exit(0);
}

const byRule = {};
for (const f of all) byRule[f.rule] = (byRule[f.rule] || 0) + 1;

for (const f of all.slice(0, listing ? all.length : 40)) {
  console.log(`${f.file.split(BS).join('/')}:${f.line}  ${f.rule}`);
  console.log(`    ${f.text.slice(0, 160)}`);
}
if (!listing && all.length > 40) console.log(`... ${all.length - 40} more, run with --list`);

console.log(`\ntext style: ${all.length} findings ${JSON.stringify(byRule)}`);
console.log('see docs/text-style.md');
process.exit(listing ? 0 : 1);
