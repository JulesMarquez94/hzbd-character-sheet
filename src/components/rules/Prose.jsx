import { StatText } from '../sheet/itemParts.jsx';

/**
 * The rulebook, set on a page.
 *
 * It draws the blocks `src/lib/rulebook.js` parses out of `docs/rulebook.md`
 * and nothing else: there is no copy in this file, so a rule can only be
 * changed by changing the book.
 *
 * Plain runs of text go through `StatText`, which is what colours Willpower
 * violet and Physique orange everywhere else on the site. A rulebook that
 * spells Shield in a different colour from the sheet's Shield is two games, so
 * the prose reads in the app's own palette rather than in a document's.
 */

/* Bold, code and italic, in that order. Bold has to be tried before italic or
   `**a**` is read as an empty italic wrapping a bold. */
const INLINE = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g;

/** One run of markdown text, with its emphasis and its stat colours. */
export function Line({ text }) {
  if (!text) return null;

  return (
    <>
      {String(text)
        .split(INLINE)
        .filter((part) => part !== '')
        .map((part, index) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return (
              <strong key={index}>
                <StatText text={part.slice(2, -2)} />
              </strong>
            );
          }
          if (part.startsWith('`') && part.endsWith('`')) {
            return (
              <code key={index} className="rule-code">
                {part.slice(1, -1)}
              </code>
            );
          }
          if (part.startsWith('*') && part.endsWith('*')) {
            return (
              <em key={index}>
                <StatText text={part.slice(1, -1)} />
              </em>
            );
          }
          return <StatText key={index} text={part} />;
        })}
    </>
  );
}

/**
 * A table, which is most of what a rules book is.
 *
 * The first column is the thing being named and every column after it is what
 * it costs or what it does, so the first is set brighter and the rest are set
 * as data. A table with no header row is the book's own `| | |`: two columns of
 * a thing and its price, where naming them would say less than the rows do.
 */
function Table({ block }) {
  return (
    <div className="rule-table-wrap">
      <table className="rule-table">
        {block.head && (
          <thead>
            <tr>
              {block.head.map((cell, index) => (
                <th key={index}>
                  <Line text={cell} />
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {block.rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {Array.from({ length: block.columns }, (unused, index) => (
                <td key={index} className={index === 0 ? 'rule-cell-lead' : undefined}>
                  <Line text={row[index] ?? ''} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * An aside: "At the table" walks an example through, "Designer's note" says
 * which numbers are the writer's rather than the designer's. Both are set off
 * from the rules so neither can be mistaken for one.
 */
function Note({ block }) {
  const kind = /^\*\*Designer'?s note/.test(block.paragraphs[0] ?? '') ? ' rule-note-designer' : '';

  return (
    <aside className={`rule-note${kind}`}>
      {block.paragraphs.map((text, index) => (
        <p key={index}>
          <Line text={text} />
        </p>
      ))}
    </aside>
  );
}

export function Block({ block }) {
  switch (block.type) {
    case 'heading':
      return (
        <h3 className="rule-heading" id={block.id}>
          <Line text={block.text} />
        </h3>
      );

    case 'text':
      return (
        <p className="rule-text">
          <Line text={block.text} />
        </p>
      );

    case 'list':
      return block.ordered ? (
        <ol className="rule-list rule-list-numbered">
          {block.items.map((item, index) => (
            <li key={index}>
              <Line text={item} />
            </li>
          ))}
        </ol>
      ) : (
        <ul className="rule-list">
          {block.items.map((item, index) => (
            <li key={index}>
              <Line text={item} />
            </li>
          ))}
        </ul>
      );

    case 'table':
      return <Table block={block} />;

    case 'note':
      return <Note block={block} />;

    case 'divider':
      return <hr className="rule-divider" />;

    default:
      return null;
  }
}

/** Every block of one section, in the order the book writes them. */
export default function Prose({ blocks }) {
  return (
    <>
      {blocks.map((block, index) => (
        <Block key={index} block={block} />
      ))}
    </>
  );
}
