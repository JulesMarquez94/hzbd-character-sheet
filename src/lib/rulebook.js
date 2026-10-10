/**
 * The rulebook, read off the book itself.
 *
 * `docs/rulebook.md` is the game's rules as written on 2026-09-02, and this
 * module is the whole of how the site knows them: the file is imported raw and
 * parsed here, so the page and the document can never drift apart. Nothing in
 * the Rules page retypes a rule. Edit the markdown and the site changes with it.
 *
 * That is the same law the codex keeps for a design sheet: what the designer
 * wrote is what is shown, and a transcription that lives in two places is a
 * transcription that is wrong in one of them.
 *
 * ------------------------------------------------------------- what it parses
 * The subset the book actually uses, and nothing else. There are no links, no
 * code fences, no nested lists and no images in it, so there is no parser here
 * for any of those. If the book grows one, this grows with it rather than the
 * book being written around a limitation.
 *
 *   ##      a section: a chapter, an appendix or a front-matter heading
 *   ###     a rule inside it, numbered (`1.7 Exploding dice`)
 *   ---     a rule off between sections
 *   |       a table, with or without a header row
 *   -  1.   a list, with wrapped continuation lines folded back in
 *   >       an aside: "At the table", "Designer's note"
 *   ** ` *  bold, code and italic
 *
 * Everything before the first `##` is the book's own title page. The site has a
 * header of its own, so it is parsed and left unused rather than printed twice.
 */

import source from '../../docs/rulebook.md?raw';

/* ------------------------------------------------------------------- naming */

function slug(text) {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/**
 * A section heading cut into the two halves the contents rail reads it as.
 *
 * "Chapter Five · The Fight" is a number and a name, and the rail wants them
 * apart: the number is the thing you scan down and the name is the thing you
 * pick. Anything that is neither a chapter nor an appendix (the front matter)
 * has no lead and is all name.
 *
 * The id is short on purpose. It ends up in the URL as `#chapter-five`, which
 * somebody may well type, and `#chapter-five-the-fight` is not a thing anybody
 * types.
 */
function headingParts(text) {
  const chapter = /^Chapter\s+(\S+)\s+·\s+(.+)$/.exec(text);
  if (chapter) return { id: `chapter-${slug(chapter[1])}`, lead: chapter[1], title: chapter[2] };

  const appendix = /^Appendix\s+(\S+)\s+·\s+(.+)$/.exec(text);
  if (appendix) return { id: `appendix-${slug(appendix[1])}`, lead: appendix[1], title: appendix[2] };

  return { id: slug(text), lead: null, title: text };
}

/* ------------------------------------------------------------------ blocks */

const HEADING = /^(#{3,6})\s+(.*)$/;
const BULLET = /^-\s+/;
const NUMBER = /^\d+\.\s+/;
const DIVIDER = /^-{3,}$/;
/* A markdown table's second row: pipes, dashes, colons and space, and nothing
   else. It is what tells a header row from a first body row. */
const SEPARATOR = /^\|[\s:|-]+\|$/;

/** Whether a line ends the paragraph above it by starting something of its own. */
function opensBlock(line) {
  const text = line.trim();
  if (!text) return true;
  if (text.startsWith('|') || text.startsWith('>') || text.startsWith('#')) return true;
  return DIVIDER.test(text) || BULLET.test(text) || NUMBER.test(text);
}

function cells(row) {
  return row
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim());
}

/**
 * A table, and whether it has a header at all.
 *
 * Several tables in the book open `| | |`: two columns of a thing and its
 * price, where naming the columns would say less than the rows already do. The
 * separator row is still there, so the header is detected and then dropped when
 * every cell in it is blank.
 */
function parseTable(rows) {
  const head = cells(rows[0]);
  const headed = rows.length > 1 && SEPARATOR.test(rows[1]);
  const body = rows.slice(headed ? 2 : 1).map(cells);
  const named = headed && head.some((cell) => cell !== '');

  return {
    type: 'table',
    head: named ? head : null,
    rows: body,
    columns: Math.max(head.length, ...body.map((row) => row.length), 1),
  };
}

/**
 * Lines split into paragraphs on blank lines, each one run back onto a single
 * line.
 *
 * The book is wrapped at 90 characters, which is a shape for reading a file and
 * not a shape for reading a page. Every hard wrap has to come out or the page
 * prints the file's line breaks.
 */
function joinParagraphs(lines) {
  const out = [];
  let run = [];

  for (const line of lines) {
    if (line.trim()) {
      run.push(line.trim());
      continue;
    }
    if (run.length > 0) out.push(run.join(' '));
    run = [];
  }
  if (run.length > 0) out.push(run.join(' '));

  return out;
}

function parseBlocks(lines) {
  const blocks = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) {
      i += 1;
      continue;
    }

    if (DIVIDER.test(line.trim())) {
      blocks.push({ type: 'divider' });
      i += 1;
      continue;
    }

    const heading = HEADING.exec(line);
    if (heading) {
      const text = heading[2].trim();
      blocks.push({ type: 'heading', level: heading[1].length, text, id: slug(text) });
      i += 1;
      continue;
    }

    // An aside: "At the table", "Designer's note". Its own paragraphs inside.
    if (line.startsWith('>')) {
      const body = [];
      while (i < lines.length && lines[i].startsWith('>')) {
        body.push(lines[i].replace(/^>\s?/, ''));
        i += 1;
      }
      blocks.push({ type: 'note', paragraphs: joinParagraphs(body) });
      continue;
    }

    if (line.startsWith('|')) {
      const rows = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        rows.push(lines[i].trim());
        i += 1;
      }
      blocks.push(parseTable(rows));
      continue;
    }

    if (BULLET.test(line) || NUMBER.test(line)) {
      const ordered = NUMBER.test(line);
      const opener = ordered ? NUMBER : BULLET;
      const items = [];

      while (i < lines.length) {
        const at = lines[i];
        if (opener.test(at)) {
          items.push(at.replace(opener, '').trim());
          i += 1;
          continue;
        }
        /* A wrapped item, indented under the one it belongs to. Folded back
           onto it rather than started as a paragraph of its own. */
        if (items.length > 0 && /^\s{2,}\S/.test(at)) {
          items[items.length - 1] += ` ${at.trim()}`;
          i += 1;
          continue;
        }
        break;
      }

      blocks.push({ type: 'list', ordered, items });
      continue;
    }

    const text = [];
    while (i < lines.length && !opensBlock(lines[i])) {
      text.push(lines[i].trim());
      i += 1;
    }
    blocks.push({ type: 'text', text: text.join(' ') });
  }

  return blocks;
}

/* ----------------------------------------------------------------- the book */

function parse(markdown) {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const sections = [];
  let current = null;
  const front = [];

  for (const line of lines) {
    const opening = /^##\s+(.*)$/.exec(line);
    if (opening) {
      if (current) sections.push(current);
      current = { heading: opening[1].trim(), lines: [] };
      continue;
    }
    (current ? current.lines : front).push(line);
  }
  if (current) sections.push(current);

  return sections.map(({ heading, lines: body }) => ({
    ...headingParts(heading),
    heading,
    blocks: parseBlocks(body),
  }));
}

/** Every `##` section of the book, in the order it is written. */
export const RULEBOOK = parse(source);

/** One section by its id, or null. */
export function chapter(id) {
  return RULEBOOK.find((section) => section.id === id) ?? null;
}

/**
 * The blocks under one rule of a section: everything after its `###` heading
 * and before the next one. The primer draws its tables from the book this way
 * rather than retyping them, so the page and the book cannot disagree about a
 * rung or a name. Empty when the section or the rule is not there, which is
 * what a renamed heading looks like from here.
 */
export function rule(sectionId, ruleId) {
  const blocks = chapter(sectionId)?.blocks ?? [];
  const start = blocks.findIndex((block) => block.type === 'heading' && block.id === ruleId);
  if (start === -1) return [];
  const rest = blocks.slice(start + 1);
  const end = rest.findIndex((block) => block.type === 'heading');
  return end === -1 ? rest : rest.slice(0, end);
}

/**
 * The rules a section names, for the contents rail: `1.7 Exploding dice` and
 * the rest of the `###` headings under it, so a chapter can be opened at the
 * rule somebody is arguing about rather than at its top.
 */
export function rulesOf(section) {
  return (section?.blocks ?? [])
    .filter((block) => block.type === 'heading' && block.level === 3)
    .map(({ id, text }) => ({ id, text }));
}
