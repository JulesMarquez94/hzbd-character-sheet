import { Link } from 'react-router-dom';
import { useCampaignLog } from '../../context/campaign-log.js';
import { normalizeFief } from '../../lib/fief.js';

/**
 * The towns this sheet's tables have founded, as tabs on the sheet.
 *
 * Jules, 2026-10-22: the players never open the campaign page, so a town the
 * Game Master founded was nowhere they would look. "access to the campaign tabs
 * of the fief should pop up on their character sheet". So each table at which
 * this sheet sits grows a Fief tab once its town stands, and the tab opens the
 * campaign on its Fief tab, where the board and the order book already are.
 *
 * Read off the tables LogProvider holds, which carry the campaign's `fief` and
 * follow it live, so a founding reaches an open sheet without a reload. One
 * town reads "Fief"; a sheet at two towns names them.
 *
 * `as` is 'tab' for the tab row and 'menu' for the folded drawer below 820px.
 */
export default function FiefSheetTabs({ as = 'tab', onPick }) {
  const { tables } = useCampaignLog();
  const towns = tables
    .map((table) => ({ id: table.id, fief: normalizeFief(table.fief) }))
    .filter((t) => t.fief.founded !== null);
  if (towns.length === 0) return null;

  return towns.map((t) => (
    <Link
      key={t.id}
      to={`/campaigns/${t.id}?tab=Fief`}
      className={as === 'menu' ? 'dropdown-link' : 'sheet-tab'}
      title={`Open ${t.fief.name}`}
      onClick={onPick}
    >
      {towns.length > 1 ? `Fief: ${t.fief.name}` : 'Fief'}
    </Link>
  ));
}
