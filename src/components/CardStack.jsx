import { useCallback, useEffect, useMemo, useState } from 'react';
import AbilityCard from './AbilityCard.jsx';
import CardText, { CardLine } from './CardText.jsx';
import CostOrbs from './CostOrbs.jsx';
import { CardStackContext } from '../context/card-stack.js';
import { lockScroll } from '../lib/scrollLock.js';
import { formatNumber } from '../lib/characterModel.js';
import { ARMOR_SETS } from '../lib/items.js';
import { forgedRecord } from '../lib/forged.js';
import { cardTitle } from '../lib/cardText.js';
import { getCard, itemEnchantments } from '../lib/weapons.js';
import { wieldModifiers } from '../lib/items.js';
import { ItemCarry, ItemIcon, ItemStats, ItemTags, StatText } from './sheet/itemParts.jsx';
import ShareCode from './sheet/ShareCode.jsx';
import useCodexArt from './useCodexArt.js';

/**
 * The card stack — the sheet's answer to "what does this actually do?".
 *
 * Tapping an ability, an enchantment, an item or a live value deals that card
 * onto a pile in front of the sheet. Cards opened from a card land on top of
 * it, so a weapon leads to its enchantment and on to the spell that
 * enchantment carries; each one closes on its own × or with Escape, and
 * nothing moves under the pointer the way a hover panel would.
 *
 * A card opened from a weapon is dealt with that weapon's `modifiers`, so the
 * one shared card prints this weapon's damage type and empowered dice.
 */

let nextKey = 0;

export function CardStackProvider({ character, children }) {
  const [stack, setStack] = useState([]);

  const close = useCallback((key) => {
    setStack((entries) =>
      key === undefined ? entries.slice(0, -1) : entries.filter((entry) => entry.key !== key)
    );
  }, []);

  const push = useCallback((entry) => {
    nextKey += 1;
    setStack((entries) => [...entries, { ...entry, key: nextKey }]);
  }, []);

  const openCard = useCallback(
    (card, modifiers = null) => {
      const resolved = typeof card === 'string' ? getCard(card) : card;
      if (resolved) push({ type: 'card', card: resolved, modifiers });
    },
    [push]
  );

  const openItem = useCallback((item) => item && push({ type: 'item', item }), [push]);
  const openValue = useCallback((value) => push({ type: 'value', value }), [push]);

  const api = useMemo(
    () => ({ openCard, openItem, openValue, close, depth: stack.length }),
    [openCard, openItem, openValue, close, stack.length]
  );

  // Escape peels the top card off; the page behind never scrolls under the pile.
  useEffect(() => {
    if (stack.length === 0) return undefined;

    /* Caught on the way down rather than the way up. A card can be dealt from
       inside a chooser dialog, and that dialog is listening for Escape too, so
       a plain listener would close both at once. The capture phase runs before
       every one of them, and stopping the event dead there leaves the dialog
       exactly where it was. */
    function onKeyDown(event) {
      if (event.key === 'Escape') {
        event.stopImmediatePropagation();
        close();
      }
    }
    document.addEventListener('keydown', onKeyDown, true);
    const unlock = lockScroll();

    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      unlock();
    };
  }, [stack.length, close]);

  return (
    <CardStackContext.Provider value={api}>
      {children}

      {stack.length > 0 && (
        <div
          className="card-stack"
          onMouseDown={(event) => event.target === event.currentTarget && close()}
        >
          {stack.map((entry, index) => (
            <div
              key={entry.key}
              className={`card-window${index === stack.length - 1 ? ' is-top' : ''}`}
              style={{ '--depth': index }}
            >
              <button
                type="button"
                className="card-window-close"
                onClick={() => close(entry.key)}
                aria-label="Close card"
              >
                ×
              </button>

              {entry.type === 'card' && (
                <AbilityCard
                  ability={entry.card}
                  character={character}
                  modifiers={entry.modifiers}
                  onValue={openValue}
                  onLink={(name) => openCard(name)}
                  footer={cardFooter(entry.card)}
                  fit
                />
              )}

              {entry.type === 'item' && (
                <ItemCard
                  item={entry.item}
                  character={character}
                  onCard={openCard}
                  onValue={openValue}
                />
              )}

              {entry.type === 'value' && <ValueCard value={entry.value} />}
            </div>
          ))}
        </div>
      )}
    </CardStackContext.Provider>
  );
}

/** An enchantment prints what it costs to carry along the bottom of its card. */
function cardFooter(card) {
  if (!card?.burden && !card?.cost) return null;
  return (
    <>
      <span className="ac-foot-item">
        <b>{card.burden}</b> Magic Burden
      </span>
      <span className="ac-foot-item">
        <b>{formatNumber(card.cost)}</b> Coin
      </span>
    </>
  );
}

/**
 * The long look at a piece of gear: what it is, what it reads like, what has
 * been worked into it, and what it teaches. Every enchantment and card named
 * here opens on top of it.
 */
function ItemCard({ item, character, onCard, onValue }) {
  /* The full picture, and the only plate that asks for it — everywhere else on
     the sheet an item is drawn at 40px and gets the thumbnail. One card is
     dealt at a time, so this is 26 KB on demand rather than 26 KB a row.

     Codex art is a paid capability (see useCodexArt.js), and an item card is a
     reference panel rather than a printed card, so with no picture to draw it
     grows no plate at all — the head keeps its glyph tile and the panel is
     exactly what it was before there were pictures. */
  const artUrl = useCodexArt()(item.art_url, item.artOwn ? 'lore' : 'codex');
  const enchantments = itemEnchantments(item);
  /* Null for everything the codex shipped. A piece this player made carries the
     code that reproduces it, and this card is the long look at an item, so this
     is where it belongs as well as on the equip prompt. */
  const made = forgedRecord(character, item.id);
  /* Equipped, this prints what the wielder's own enchantments do to it too;
     stowed, it prints only what is worked into the item. wieldModifiers decides
     which, because only items.js knows what is equipped. */
  const modifiers = wieldModifiers(character, item);

  // The weapon's own attacks are what an infusion changes; a spell bound into
  // it is cast as written, so it is dealt without the weapon's modifiers.
  const taught = (item.abilities ?? []).map(getCard).filter(Boolean);
  const carried = enchantments.map((entry) => getCard(entry.spell)).filter(Boolean);
  const cards = [
    ...taught.map((card) => ({ card, modifiers })),
    ...carried.map((card) => ({ card, modifiers: null })),
  ];
  const setBonus = item.set ? ARMOR_SETS[item.set] : null;

  return (
    <article className="item-card">
      {artUrl && (
        <div className="item-card-art" style={{ backgroundImage: `url("${artUrl}")` }} />
      )}

      <header className="item-card-head">
        {/* The plate is the tile, forty times bigger — printing both would be
            the same picture twice, an inch apart. Without one, the glyph tile
            stays exactly where it has always been. */}
        {!artUrl && <ItemIcon item={item} />}
        <div className="item-card-title">
          <h3>{item.name}</h3>
          <ItemTags item={item} />
        </div>
      </header>

      <div className="item-card-scroll">
        {item.blurb && <p className="item-card-blurb">{item.blurb}</p>}

        <ItemStats item={item} />
        <ItemCarry item={item} />

        {item.effect && (
          <p className="item-card-effect">
            <StatText text={item.effect} />
          </p>
        )}

        {/* Belt gear: whether using it costs you the thing itself. */}
        {item.use && <p className="item-card-effect">{usageNote(item)}</p>}

        {setBonus && (
          <p className="item-card-effect">
            <span className="setbonus-label">Set Bonus</span> <StatText text={setBonus.bonus} />
          </p>
        )}

        {enchantments.length > 0 && (
          <section className="item-card-section">
            <span className="item-card-label">Workings</span>
            {item.enchantText && (
              <p className="item-card-effect">
                <CardLine
                  text={item.enchantText}
                  character={character}
                  onLink={(name) => onCard(name)}
                />
              </p>
            )}
            <ul className="item-card-list">
              {enchantments.map(({ id, enchantment, spell }) => (
                <li key={id}>
                  <button type="button" className="item-card-link" onClick={() => onCard(enchantment)}>
                    {enchantment.name}
                  </button>
                  <span className="item-card-note">
                    {enchantment.effect}
                    {spell && getCard(spell) ? ` (${getCard(spell).name})` : ''}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {cards.length > 0 && (
          <section className="item-card-section">
            {/* A belt item's single card is what the item *is*, not something
                it lends you while you hold it. */}
            <span className="item-card-label">{item.use ? 'What It Does' : 'Cards It Teaches'}</span>
            <ul className="item-card-list">
              {cards.map(({ card, modifiers: cardModifiers }) => (
                <li key={card.id}>
                  <button
                    type="button"
                    className="item-card-link item-card-link-card"
                    onClick={() => onCard(card, cardModifiers)}
                  >
                    {/* The item is the heading of the card this list is on, so a
                        weapon card is named by its move here the way it is
                        everywhere else. See cardTitle in cardText.js. */}
                    {cardTitle(card)}
                  </button>
                  <CostOrbs ap={card.ap} wp={card.wp} size={20} className="item-card-costs" />
                </li>
              ))}
            </ul>
          </section>
        )}

        {item.lore && (
          <section className="item-card-section">
            <span className="item-card-label">Lore</span>
            <div className="item-card-lore">
              <CardText text={item.lore} character={character} onValue={onValue} onLink={onCard} />
            </div>
          </section>
        )}

        {/* Last, under everything the item *is*: a made piece carries the code
            that reproduces it, and handing it over is the last thing anybody
            does with an item rather than the first. */}
        {made && (
          <section className="item-card-section">
            <span className="item-card-label">Made by you</span>
            <ShareCode record={made} label="Hand it to somebody" />
          </section>
        )}
      </div>
    </article>
  );
}

/** What using a belt item costs you: the charge, or the item along with it. */
function usageNote(item) {
  if (item.use === 'consumable') {
    return item.charges > 1
      ? `A consumable. It holds ${item.charges} uses, and spending the last one destroys it.`
      : 'A consumable. Using it destroys it.';
  }
  if (item.recharge) {
    return `Not used up, but it must wait for a ${item.recharge} before it works again.`;
  }
  return 'Not used up. It stays on your belt however often you reach for it.';
}

/** The working behind a live value: which dice, which attribute, times what. */
function ValueCard({ value }) {
  const { resolved } = value;

  return (
    <article className="value-card">
      <span className="value-card-label">This number is</span>
      <span className="value-card-total">{resolved.text}</span>

      <ul className="value-card-parts">
        {resolved.parts.map((part, index) => (
          <li key={index}>
            <span className="value-part-num" style={part.color ? { color: part.color } : undefined}>
              {part.text}
            </span>
            <span className="value-part-detail">{part.detail}</span>
          </li>
        ))}
      </ul>

      <span className="value-card-source">Dice are rolled; the rest is already counted.</span>
    </article>
  );
}
