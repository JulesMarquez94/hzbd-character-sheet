import { useState } from 'react';
import PickBlock from './PickBlock.jsx';
import {
  JOURNAL_SESSION_MAX,
  JOURNAL_TITLE_MAX,
  addEntry,
  entryHeading,
  entryStamp,
  normalizeJournal,
  removeEntry,
  searchJournal,
  updateEntry,
} from '../../lib/journal.js';

/**
 * The journal: one log per session, kept as a title and a note.
 *
 * It is the only part of the sheet that grows without bound, so it is built to
 * be read months later rather than written once. Logs are shut by default and
 * open one at a time, newest at the top, and the search box looks through the
 * session, the title and the note together, because nobody remembers which of
 * the three they wrote a name in.
 *
 * Nothing here is a form to submit. A log is written straight onto the row the
 * way every other field on this sheet is, and the sheet's own autosave carries
 * it.
 */
export default function JournalBlock({ character, patch, step = null, readOnly = false }) {
  const [query, setQuery] = useState('');
  const [openId, setOpenId] = useState(null);
  const [drafting, setDrafting] = useState(false);
  const [confirming, setConfirming] = useState(null);

  const journal = normalizeJournal(character.journal);
  const shown = searchJournal(journal, query);

  function write(entry) {
    patch({ journal: addEntry(journal, entry) });
    setDrafting(false);
    setQuery('');
  }

  return (
    <PickBlock
      kind="journal"
      step={step}
      title="Journal"
      done={journal.length > 0}
      state={journal.length ? `${journal.length} logged` : 'Nothing logged'}
    >
      <p className="pick-lead">
        One log a session, or one whenever something happens worth remembering. A log is a{' '}
        <b>title</b> and a <b>note</b>, and the session it belongs to if your table counts them.
      </p>

      {journal.length > 0 && (
        <div className="journal-search">
          <input
            className="form-input"
            type="search"
            value={query}
            placeholder="Search titles, notes and sessions"
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <span className="journal-search-count">
              {shown.length} of {journal.length}
            </span>
          )}
        </div>
      )}

      {!readOnly && !drafting && (
        <div className="pick-tools">
          <button type="button" className="btn btn-pick btn-sm" onClick={() => setDrafting(true)}>
            Add a Log
          </button>
        </div>
      )}

      {drafting && <LogDraft onSave={write} onCancel={() => setDrafting(false)} />}

      {journal.length === 0 ? (
        <p className="pick-line">Nothing logged yet.</p>
      ) : shown.length === 0 ? (
        <p className="pick-line">No log says that.</p>
      ) : (
        <ul className="journal-list">
          {shown.map((entry) => (
            <LogRow
              key={entry.id}
              entry={entry}
              open={openId === entry.id}
              readOnly={readOnly}
              onToggle={() => setOpenId(openId === entry.id ? null : entry.id)}
              onChange={(changes) =>
                patch({ journal: updateEntry(journal, entry.id, changes) })
              }
              onDelete={() => setConfirming(entry)}
            />
          ))}
        </ul>
      )}

      {confirming && (
        <div
          className="ledger-alert-backdrop"
          onMouseDown={(e) => e.target === e.currentTarget && setConfirming(null)}
        >
          <div className="ledger-alert" role="alertdialog" aria-modal="true">
            <h3 className="ledger-alert-title">Delete this log?</h3>
            <p className="ledger-alert-body">
              &ldquo;{entryHeading(confirming)}&rdquo; goes for good. Nothing else on the sheet
              changes.
            </p>
            <div className="pick-tools">
              <button
                type="button"
                className="btn btn-minimal btn-sm"
                onClick={() => setConfirming(null)}
              >
                Keep it
              </button>
              <span className="spacer" />
              <button
                type="button"
                className="btn btn-minimal btn-sm talent-drop"
                onClick={() => {
                  patch({ journal: removeEntry(journal, confirming.id) });
                  setConfirming(null);
                }}
              >
                Delete it
              </button>
            </div>
          </div>
        </div>
      )}
    </PickBlock>
  );
}

/* ------------------------------------------------------------- one log */

/**
 * Shut, a log is its session, its title and the day it was written. Open, it is
 * an editor: there is no separate read mode, because a session note is amended
 * as often as it is read.
 */
function LogRow({ entry, open, readOnly, onToggle, onChange, onDelete }) {
  return (
    <li className={`journal-entry${open ? ' is-open' : ''}`}>
      <button type="button" className="journal-entry-head" onClick={onToggle} aria-expanded={open}>
        {entry.session && <span className="journal-session">{entry.session}</span>}
        <span className="journal-entry-title">{entryHeading(entry)}</span>
        <span className="journal-entry-stamp">{entryStamp(entry)}</span>
        <span className="level-block-chevron" aria-hidden="true" />
      </button>

      {open && (
        <div className="journal-entry-body">
          {readOnly ? (
            <p className="journal-read">{entry.body || 'Nothing written.'}</p>
          ) : (
            <>
              <div className="journal-fields">
                <label className="ledger-field">
                  <span className="ledger-field-label">Session</span>
                  <input
                    className="form-input"
                    value={entry.session}
                    maxLength={JOURNAL_SESSION_MAX}
                    placeholder="12"
                    onChange={(e) => onChange({ session: e.target.value })}
                  />
                </label>

                <label className="ledger-field journal-field-title">
                  <span className="ledger-field-label">Title</span>
                  <input
                    className="form-input"
                    value={entry.title}
                    maxLength={JOURNAL_TITLE_MAX}
                    placeholder="The drowned vault"
                    onChange={(e) => onChange({ title: e.target.value })}
                  />
                </label>
              </div>

              <textarea
                className="form-textarea"
                style={{ minHeight: 170 }}
                value={entry.body}
                placeholder="What happened, who you met, what you promised."
                onChange={(e) => onChange({ body: e.target.value })}
              />

              <div className="pick-tools pick-tools-tight">
                <span className="spacer" />
                <button
                  type="button"
                  className="btn btn-minimal btn-sm talent-drop"
                  onClick={onDelete}
                >
                  Delete this log
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </li>
  );
}

/** The new log, written before it joins the pile. */
function LogDraft({ onSave, onCancel }) {
  const [session, setSession] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  const empty = !title.trim() && !body.trim();

  return (
    <div className="journal-draft">
      <div className="journal-fields">
        <label className="ledger-field">
          <span className="ledger-field-label">Session</span>
          <input
            className="form-input"
            value={session}
            maxLength={JOURNAL_SESSION_MAX}
            placeholder="12"
            onChange={(e) => setSession(e.target.value)}
          />
        </label>

        <label className="ledger-field journal-field-title">
          <span className="ledger-field-label">Title</span>
          <input
            className="form-input"
            value={title}
            maxLength={JOURNAL_TITLE_MAX}
            placeholder="The drowned vault"
            autoFocus
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>
      </div>

      <textarea
        className="form-textarea"
        style={{ minHeight: 170 }}
        value={body}
        placeholder="What happened, who you met, what you promised."
        onChange={(e) => setBody(e.target.value)}
      />

      <div className="pick-tools pick-tools-tight">
        <button
          type="button"
          className="btn btn-take btn-sm"
          disabled={empty}
          title={empty ? 'Give it a title or a note first' : undefined}
          onClick={() => onSave({ session, title, body })}
        >
          Save this log
        </button>
        <button type="button" className="btn btn-minimal btn-sm" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}
