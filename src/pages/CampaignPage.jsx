import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/auth-context.js';
import SiteMenu from '../components/SiteMenu.jsx';
import BlockArrange from '../components/sheet/BlockArrange.jsx';
import BlockTrays from '../components/sheet/BlockTrays.jsx';
import { MinionStatsBlock } from '../components/sheet/MinionBlock.jsx';
import PartyBlock from '../components/campaign/PartyBlock.jsx';
import LogBlock from '../components/campaign/LogBlock.jsx';
import LogCall from '../components/campaign/LogCall.jsx';
import DiceWatch from '../components/campaign/DiceWatch.jsx';
import { CardStackProvider } from '../components/CardStack.jsx';
import CampaignDetails from '../components/campaign/CampaignDetails.jsx';
import BestiaryTab from '../components/campaign/BestiaryTab.jsx';
import EncounterTab from '../components/campaign/EncounterTab.jsx';
import {
  addMember,
  getCampaign,
  listMembers,
  removeMember,
  updateCampaign,
} from '../lib/campaigns.js';
import {
  levelForXp,
  liveCharacter,
  normalizeGridColumns,
  normalizeSourceOrder,
  normalizeTrays,
  trayedIds,
} from '../lib/characterModel.js';
import { loadForgedCreatures } from '../lib/customCreatures.js';
import { minionState } from '../lib/minions.js';
import { statMath } from '../lib/statMath.js';
import { subscribeToTable } from '../lib/realtime.js';
import '../components/sheet/sheet.css';
import './Campaigns.css';

/**
 * Four tabs, and two of them are the Game Master's alone.
 *
 * The Bestiary and the Encounters are not hidden out of tidiness: half of what
 * is on an encounter is the answer to "how much has the boss got left", and
 * Jules's ruling of 2026-08-31 is that the players do not get to read that yet.
 * The schema keeps the same line (see the encounters policies), so this is a tab
 * that is absent rather than a tab that is empty.
 */
const TABS = ['Overview', 'Details'];
const DM_TABS = ['Bestiary', 'Encounters'];

/** localStorage can throw where site data is blocked; a preference is not
    worth a white screen. Same key the sheet reads, so the two agree. */
function readStoredUnit() {
  try {
    return localStorage.getItem('hzbd-unit') || 'metric';
  } catch {
    return 'metric';
  }
}

const STILL = () => {};

/**
 * One campaign, worn like a sheet: the same tab bar, the same canvas, the same
 * block grid. The Overview is one block per linked character (plus one per
 * creature they control), live off the same subscription the sheet's Live View
 * runs on; Details is where the DM edits what the campaign is.
 *
 * Nothing on this page ever writes to a character. The campaign row is the only
 * thing the DM's pen touches, which is why the party can be streamed to
 * everyone at the table without stepping on anybody's autosave.
 */
export default function CampaignPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin, tier, can, loading: authLoading } = useAuth();

  const [campaign, setCampaign] = useState(null);
  const [members, setMembers] = useState([]);
  /* The creatures this account can read that were forged rather than printed.
     Held here rather than in the Bestiary tab because both Game Master tabs read
     them: the shelf on the Encounters tab offers whatever `bestiary()` holds, and
     what it holds is filled by the load below. */
  const [forged, setForged] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [chosenTab, setTab] = useState('Overview');
  const [arranging, setArranging] = useState(false);
  const [saveState, setSaveState] = useState('idle'); // idle | saving | saved | error
  const [unit] = useState(readStoredUnit);

  // The sheet's own save pipeline, without the derived-stat pass: edits are
  // batched so typing a description does not fire a write per keystroke, and
  // writes leave one at a time so a slow link cannot land them reversed.
  const pendingRef = useRef({});
  const timerRef = useRef(null);
  const flightRef = useRef(Promise.resolve());

  const userId = user?.id;

  useEffect(() => {
    // Wait for the session restore: the campaign row is only readable by its
    // table, so fetching before the session arrives reads as "not found".
    if (authLoading) return undefined;

    let active = true;

    /* The forged creatures are part of the same gate rather than a load of their
       own, and that is a correctness point rather than tidiness: `normalizeFoes`
       drops an enemy whose creature it cannot find, and the next write to the
       encounter would persist the drop. So nothing that could name a creature is
       allowed to render until the registry is filled. See loadForgedCreatures. */
    Promise.all([getCampaign(id), listMembers(id), loadForgedCreatures(userId ?? null)])
      .then(([camp, roster, made]) => {
        if (!active) return;
        setCampaign(camp);
        setMembers(roster);
        setForged(made);
        setError('');
      })
      .catch((err) => active && setError(err.message))
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, [id, authLoading, userId]);

  /**
   * Read the forged shelf again, and put it back in the registry.
   *
   * What the forge calls after a save, a publish or a removal. It reloads rather
   * than patching the list it already has, because the row that came back is not
   * the only thing that changed: the registry every other reader resolves ids
   * against is module state, and the honest way to keep the two in step is one
   * read that fills both.
   */
  const loadForged = useCallback(async () => {
    setForged(await loadForgedCreatures(userId ?? null));
  }, [userId]);

  // The campaign page owns the whole viewport the way the sheet does, so its
  // blocks hold their size and the canvas is the thing that scrolls.
  useEffect(() => {
    document.body.classList.add('sheet-fixed');
    return () => document.body.classList.remove('sheet-fixed');
  }, []);

  const canEdit = Boolean(campaign && userId && (userId === campaign.dm_user_id || isAdmin));

  /* Which tabs this reader has, and which one they are actually on. Derived
     rather than stored, because `canEdit` settles a beat after the page mounts
     (the campaign row has to arrive first) and a Game Master who deep-linked
     themselves onto a tab that did not exist yet must not be stranded on it. A
     tab that is not on offer reads as the Overview. */
  const tabs = canEdit ? [...TABS, ...DM_TABS] : TABS;
  const tab = tabs.includes(chosenTab) ? chosenTab : 'Overview';

  const flush = useCallback(async () => {
    const patch = pendingRef.current;
    pendingRef.current = {};
    if (Object.keys(patch).length === 0) return;

    setSaveState('saving');
    const write = flightRef.current.then(() => updateCampaign(id, patch));
    flightRef.current = write.catch(() => {});
    try {
      await write;
      setSaveState('saved');
      setError('');
    } catch (err) {
      // Put the failed fields back so the next flush retries them. Anything
      // edited while the write was in flight wins over the failed value.
      pendingRef.current = { ...patch, ...pendingRef.current };
      setSaveState('error');
      setError(err.message);
    }
  }, [id]);

  /** Optimistic local update + debounced persistence. No-op for players. */
  const patch = useCallback(
    (partial) => {
      if (!canEdit || !campaign) return;
      setCampaign((prev) => (prev ? { ...prev, ...partial } : prev));
      pendingRef.current = { ...pendingRef.current, ...partial };
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(flush, 700);
    },
    [flush, canEdit, campaign]
  );

  // Never lose the last keystrokes when navigating away.
  useEffect(() => {
    return () => {
      clearTimeout(timerRef.current);
      if (Object.keys(pendingRef.current).length > 0) flush();
    };
  }, [flush]);

  const refetchMembers = useCallback(() => {
    listMembers(id)
      .then(setMembers)
      .catch(() => {});
  }, [id]);

  /* The campaign row itself, live, for everyone who is not holding the pen.
     The DM's screen is authoritative over their own edits, exactly like an
     owner's sheet. */
  useEffect(() => {
    if (loading || !campaign || canEdit) return undefined;

    const applyIfNewer = (row) =>
      setCampaign((prev) =>
        prev?.updated_at && row?.updated_at && String(row.updated_at) < String(prev.updated_at)
          ? prev
          : row
      );

    return subscribeToTable({
      table: 'campaigns',
      filter: `id=eq.${id}`,
      onChange: (payload) => {
        if (payload.eventType === 'DELETE') {
          setError('This campaign was deleted.');
          return;
        }
        applyIfNewer(payload.new);
      },
      onResync: () => {
        getCampaign(id)
          .then(applyIfNewer)
          .catch(() => {});
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, loading, canEdit, Boolean(campaign)]);

  /* The roster, live: a player redeeming the join code appears on every open
     copy of this page without a reload. */
  useEffect(() => {
    if (loading || !campaign) return undefined;

    return subscribeToTable({
      table: 'campaign_members',
      filter: `campaign_id=eq.${id}`,
      onChange: refetchMembers,
      onResync: refetchMembers,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, loading, Boolean(campaign), refetchMembers]);

  /* And every linked sheet, live. One channel with an `in` filter rather than
     one per member. Nobody edits a character from this page, so unlike the
     sheet there is no owner to protect from their own subscription. */
  const memberCharIds = useMemo(
    () =>
      members
        .map((member) => member.character_id)
        .sort()
        .join(','),
    [members]
  );

  useEffect(() => {
    if (!memberCharIds) return undefined;

    const applyRow = (row) =>
      setMembers((prev) =>
        prev.map((member) => {
          if (member.character_id !== row.id) return member;
          // A reconnect refetch races the change events; never let an older
          // row land on top of a newer one.
          const held = member.characters?.updated_at;
          if (held && row.updated_at && String(row.updated_at) < String(held)) return member;
          return { ...member, characters: row };
        })
      );

    return subscribeToTable({
      table: 'characters',
      filter: `id=in.(${memberCharIds})`,
      onChange: (payload) => {
        if (payload.eventType === 'DELETE') return;
        applyRow(payload.new);
      },
      onResync: refetchMembers,
    });
  }, [memberCharIds, refetchMembers]);

  /* ---------------------------------------------------------- the blocks */

  /* One block per member and one per creature they control: the party block is
     the sheet's blocks 1 and 2 folded together, and a creature's block is the
     sheet's own first minion page, read only. Drawn off the character as the
     sheet would *show* them (liveCharacter), so a worn enchantment's Instinct
     is Instinct here too. */
  const blocks = useMemo(() => {
    const list = [];
    for (const member of members) {
      const shown = liveCharacter(member.characters);
      list.push({
        id: `member:${member.character_id}`,
        kind: 'member',
        member,
        shown,
        // The hover arithmetic, worked out once per member per roster change
        // rather than once per render of the block.
        math: statMath(shown),
      });
      for (const minion of minionState(shown)) {
        list.push({
          id: `minion:${member.character_id}:${minion.id}`,
          kind: 'minion',
          member,
          shown,
          minion,
        });
      }
    }

    /* And the table's own block: what everyone has been doing, as they do it.
       Only once there is somebody to do it, so an empty campaign still gets the
       empty state with the join code on it rather than a log of nothing. */
    if (list.length > 0) list.push({ id: 'log', kind: 'log' });

    return list;
  }, [members]);

  const byId = useMemo(() => new Map(blocks.map((block) => [block.id, block])), [blocks]);

  /* Which blocks the Game Master pinned to a tray rather than leaving on the
     grid: the table log within reach of every row of the party, most likely.
     See normalizeTrays and BlockTrays.jsx. */
  const trays = useMemo(
    () =>
      normalizeTrays(
        campaign?.overview_trays,
        blocks.map((block) => block.id)
      ),
    [campaign?.overview_trays, blocks]
  );

  /* The stored order is matched against the blocks that actually exist right
     now, the way the Abilities tab matches its sources: a character who leaves
     takes their blocks out, one who joins is appended, and nobody's
     arrangement is scrambled by either. */
  const order = useMemo(
    () =>
      normalizeSourceOrder(
        campaign?.overview_order,
        blocks.map((block) => block.id),
        trayedIds(trays)
      ),
    [campaign?.overview_order, blocks, trays]
  );

  const columns = normalizeGridColumns(campaign?.overview_columns);

  /* Who played the card a log row names, so a spell opened out of the feed
     prints the caster's numbers rather than nobody's. The page has every linked
     sheet in hand; the same block on a character sheet has only its own. */
  /* Which of the characters at this table are the reader's own, so their own
     rolls are not replayed back at them a second after they threw them. A Game
     Master watching this page has none here, and gets to watch everything. */
  const mine = useMemo(
    () =>
      members
        .filter((member) => member.characters?.user_id === user?.id)
        .map((member) => member.character_id),
    [members, user]
  );

  const actorFor = useCallback(
    (event) => byId.get(`member:${event?.character_id}`)?.shown ?? null,
    [byId]
  );

  /* One block's contents, wherever it is standing: in the grid, or pinned to a
     tray down the side of the window. A block is the same block either way. */
  const renderBlock = useCallback(
    (blockId) => {
      const block = byId.get(blockId);
      if (!block) return null;
      if (block.kind === 'log') {
        /* The clear is the Game Master's alone, and only from this page: a
           player reading the same block on their sheet is a guest at this
           table, not its keeper. See clearLog in campaignLog.js. */
        return (
          <LogBlock campaignId={id} title="Table Log" actorFor={actorFor} canClear={canEdit} />
        );
      }
      if (block.kind === 'minion') {
        return (
          <MinionStatsBlock
            character={block.shown}
            minion={block.minion}
            patch={STILL}
            readOnly
            unit={unit}
          />
        );
      }
      return <PartyBlock character={block.shown} math={block.math} unit={unit} />;
    },
    [byId, id, actorFor, unit, canEdit]
  );

  const describeBlock = useCallback(
    (blockId) => {
      const block = byId.get(blockId);
      if (!block) return { name: String(blockId), note: null };
      if (block.kind === 'log') {
        return { name: 'Table Log', note: 'Everything that has happened at this table' };
      }
      if (block.kind === 'minion') {
        return {
          name: block.minion.title,
          note: `${block.shown.name}'s ${block.minion.spec.label}`,
        };
      }
      return {
        name: block.shown.name,
        note: `Level ${levelForXp(block.shown.xp)} · the sheet at a glance`,
      };
    },
    [byId]
  );

  /* ---------------------------------------------------------- the roster */

  const handleAdd = useCallback(
    async (characterId) => {
      const added = await addMember(id, characterId);
      setMembers((prev) => (prev.some((m) => m.id === added.id) ? prev : [...prev, added]));
      return added;
    },
    [id]
  );

  const handleRemove = useCallback(
    async (member) => {
      await removeMember(member.id);
      setMembers((prev) => prev.filter((m) => m.id !== member.id));

      /* A player who just withdrew their last character can no longer read the
         campaign at all, so the page under them is about to go dark. Send them
         home instead of letting it error. */
      if (!canEdit && member.user_id === userId) {
        const stillSeated = members.some((m) => m.user_id === userId && m.id !== member.id);
        if (!stillSeated) navigate('/campaigns');
      }
    },
    [canEdit, userId, members, navigate]
  );

  /* ------------------------------------------------------------ rendering */

  if (loading) return <div className="loading-veil">Gathering the table…</div>;

  if (error && !campaign) {
    return (
      <main className="container page">
        <div className="empty-state">
          <h2 style={{ marginBottom: '0.75rem' }}>Campaign Unavailable</h2>
          <p>{error}</p>
          <Link to="/campaigns" className="btn btn-minimal btn-sm" style={{ marginTop: '1.5rem' }}>
            Back to Campaigns
          </Link>
        </div>
      </main>
    );
  }

  const saveLabel = {
    idle: '',
    saving: 'Saving…',
    saved: 'All changes saved',
    error: 'Save failed',
  }[saveState];

  /* The Overview lays blocks on the campaign's own canvas; Details is prose
     and keeps the three-column measure everything else is drawn against.

     Encounters takes four, because everything on it is a double block: four
     tracks is two enemies side by side, which is the same measure the
     Overview's three single blocks make.

     The Bestiary used to take four for the same reason and does not any more
     (2026-09-04). It is a wall of summaries now, and a wall of summaries is
     three columns wide everywhere else on the site, because everywhere else it
     is drawn inside a page-width dialog. Three tracks here comes to the same
     column and the same brief, which is the whole of what "the same size as a
     spell summary" asks for. It is also the width the block itself opens at,
     so the dialog lands about where the shelf edges are. See BestiaryTab. */
  const canvasColumns = tab === 'Overview' ? columns : tab === 'Encounters' ? 4 : 3;

  return (
    <div
      className="sheet camp-sheet"
      style={{ '--sheet-cols': canvasColumns }}
      data-columns={canvasColumns}
    >
      {/* Somebody else's dice, on the page a Game Master spends the evening on.
          Renders nothing; it puts rolls on the tray as they are written. The
          Game Master's own enemy rolls carry no character, so `table` is what
          keeps them from replaying at the screen that threw them. */}
      <DiceWatch tables={[{ id }]} mine={mine} table={canEdit} />
      {/* And what the table did, said in the corner: the log block is on one tab
          and a Game Master running a fight is usually on another. Same skips as
          the dice above, for the same reason. See LogCall.jsx. */}
      <LogCall tables={[{ id }]} mine={mine} table={canEdit} />
      <div className="sheet-tabbar">
        <div className="sheet-tabbar-inner">
          <span className="camp-title" title={campaign.name}>
            {campaign.name}
          </span>

          <nav className="sheet-tabs">
            {tabs.map((name) => (
              <button
                key={name}
                type="button"
                className={`sheet-tab${tab === name ? ' active' : ''}`}
                onClick={() => setTab(name)}
              >
                {name}
              </button>
            ))}
          </nav>

          <div className="sheet-tabbar-right">
            {!canEdit && (
              <span className="view-badge live" title="Viewing live · changes appear without reloading">
                <span className="live-dot" />
                Live View
              </span>
            )}

            {canEdit && saveLabel && (
              <span
                className={`save-indicator save-${saveState}`}
                role="img"
                aria-label={saveLabel}
                title={saveLabel}
              >
                <span className="save-dot" />
              </span>
            )}

            <SiteMenu />
          </div>
        </div>
      </div>

      <main className="sheet-canvas">
        {error && <div className="form-error">{error}</div>}

        {tab === 'Overview' && (
          <>
            {canEdit && blocks.length > 1 && (
              <div className="sheet-arrange-bar">
                <button
                  type="button"
                  className="btn btn-minimal btn-sm"
                  onClick={() => setArranging(true)}
                >
                  Arrange blocks
                </button>
              </div>
            )}

            {blocks.length === 0 ? (
              <div className="empty-state camp-empty">
                <h2>An Empty Table</h2>
                {canEdit ? (
                  <>
                    <p>
                      No characters are linked yet. Link them by sheet link on the Details tab, or
                      hand your players the join code.
                    </p>
                    <div className="camp-code-row camp-code-centered">
                      <code className="camp-code">{campaign.code}</code>
                    </div>
                  </>
                ) : (
                  <p>No characters are linked yet.</p>
                )}
              </div>
            ) : (
              /* The pile of cards a log row deals, over the whole overview. No
                 character of its own: which sheet a card is printed against is
                 decided per row by `actorFor`. See CardStack.jsx. */
              <CardStackProvider character={null}>
                {/* Pinned to the window rather than laid on the grid: the log
                    within reach of every row of the party. See BlockTrays. */}
                <BlockTrays trays={trays} render={renderBlock} describe={describeBlock} />

                <div className="sheet-grid-6">
                  {order.map((blockId, at) => {
                    if (blockId === null) {
                      return <div key={`gap-${at}`} className="cell-gap" aria-hidden="true" />;
                    }
                    const block = byId.get(blockId);
                    if (!block) return null;
                    return (
                      <section
                        key={blockId}
                        className={`sheet-cell${block.kind === 'minion' ? ' cell-minion' : ''}`}
                      >
                        {renderBlock(blockId)}
                      </section>
                    );
                  })}
                </div>
              </CardStackProvider>
            )}

            {arranging && (
              <BlockArrange
                order={order}
                describe={describeBlock}
                onChange={(next) => patch({ overview_order: next })}
                columns={columns}
                onColumns={(count) => patch({ overview_columns: count })}
                trays={trays}
                onTrays={(next) => patch({ overview_trays: next })}
                onClose={() => setArranging(false)}
                title="Arrange the overview"
              />
            )}
          </>
        )}

        {tab === 'Details' && (
          <CampaignDetails
            campaign={campaign}
            members={members}
            patch={patch}
            canEdit={canEdit}
            userId={userId}
            onAdd={handleAdd}
            onRemove={handleRemove}
          />
        )}

        {/* The two Game Master tabs. Both lay their blocks on the same canvas
            the Overview does and both are drawn inside the card stack, because a
            creature's card is dealt exactly like a player's: an enemy's Withering
            Word opens against the *enemy*, which is what `modifiers.actor` on
            each chip carries. See EnemyBlock.jsx. */}
        {tab === 'Bestiary' && canEdit && (
          <CardStackProvider character={null}>
            <BestiaryTab
              unit={unit}
              forged={forged}
              tier={tier}
              userId={userId}
              canPublish={can('forgeCodex')}
              onChanged={loadForged}
            />
          </CardStackProvider>
        )}

        {tab === 'Encounters' && canEdit && (
          <CardStackProvider character={null}>
            <EncounterTab campaign={campaign} members={members} canEdit={canEdit} unit={unit} />
          </CardStackProvider>
        )}
      </main>
    </div>
  );
}
