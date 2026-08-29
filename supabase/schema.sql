-- =============================================================================
--  HAZEBOUND — Supabase schema
--  Run this in the Supabase Dashboard -> SQL Editor (it is safe to re-run).
-- =============================================================================

-- ----------------------------------------------------------------------------
--  PROFILES  (one row per auth user, holds the display name)
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id         uuid primary key references auth.users on delete cascade,
  username   text unique,
  role       text not null default 'user',   -- 'user' | 'admin'
  created_at timestamptz not null default now()
);

-- For databases created before the role column existed.
alter table public.profiles add column if not exists role text not null default 'user';

-- ----------------------------------------------------------------------------
--  ACCOUNT TIERS
--  `role` is the tier. Four of them, as a ladder: free < premium < friend <
--  admin. Rows written before tiers say 'user', which reads as 'free'
--  everywhere (see normalizeTier in src/lib/tiers.js), so nothing needs
--  migrating. 'user' stays allowed for exactly that reason.
-- ----------------------------------------------------------------------------
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('user', 'free', 'premium', 'friend', 'admin'));

alter table public.profiles enable row level security;

-- SECURITY DEFINER so it bypasses RLS on profiles — a policy on profiles that
-- queried profiles directly would recurse infinitely.
create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  );
$$;

drop policy if exists "profiles: read own" on public.profiles;
create policy "profiles: read own" on public.profiles
  for select using (auth.uid() = id or public.is_admin());

drop policy if exists "profiles: insert own" on public.profiles;
create policy "profiles: insert own" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "profiles: update own" on public.profiles;
create policy "profiles: update own" on public.profiles
  for update using (auth.uid() = id or public.is_admin());

-- The tier a caller has, normalised, for policies that need to gate on it.
-- SECURITY DEFINER for the same reason is_admin() is: it reads profiles from
-- inside a policy's own table.
create or replace function public.account_tier()
returns text
language sql stable security definer set search_path = public
as $$
  select case coalesce((select p.role from public.profiles p where p.id = auth.uid()), 'free')
           when 'user' then 'free'
           else coalesce((select p.role from public.profiles p where p.id = auth.uid()), 'free')
         end;
$$;

-- ----------------------------------------------------------------------------
--  A tier must not be self-assignable.
--
--  "profiles: update own" lets you write your own row, which is right for a
--  display name and very wrong for the column that decides what you have paid
--  for: without this, any account could promote itself to admin in one call.
--  A policy cannot restrict a single column, so the guard is a trigger.
--
--  It guards INSERT too: an account whose profile row is missing (created
--  before the signup trigger existed, say) could otherwise insert its own row
--  with role = 'admin' and walk straight up the ladder.
--
--  `auth.uid() is null` means nobody is signed in — the SQL editor, or the
--  service role. That is how tiers are actually handed out, so it is allowed
--  through deliberately.
-- ----------------------------------------------------------------------------
create or replace function public.guard_account_tier()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;
  if tg_op = 'INSERT' then
    if new.role not in ('user', 'free') then
      raise exception 'Only an admin may set an account tier.';
    end if;
  elsif new.role is distinct from old.role then
    raise exception 'Only an admin may change an account tier.';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_guard_tier on public.profiles;
create trigger profiles_guard_tier
  before insert or update on public.profiles
  for each row execute function public.guard_account_tier();

-- Create the profile row automatically when a user signs up.
-- The username comes from the `data: { username }` passed to supabase.auth.signUp.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  begin
    insert into public.profiles (id, username)
    values (new.id, coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1)))
    on conflict (id) do nothing;
  exception when unique_violation then
    -- The username is already taken. Failing here would roll the whole signup
    -- back with an opaque "Database error saving new user" — a nameless
    -- profile row is better: the display name falls back to the email handle
    -- until one is chosen in Account Settings.
    insert into public.profiles (id) values (new.id) on conflict (id) do nothing;
  end;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ----------------------------------------------------------------------------
--  CHARACTERS
-- ----------------------------------------------------------------------------
create table if not exists public.characters (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users on delete cascade,

  -- identity
  name         text not null default 'Unnamed Drifter',
  level        int  not null default 1,
  xp           int  not null default 0,
  xp_max       int  not null default 1000,
  wealth       int  not null default 0,
  -- Rations, powder, reagents, spare rope. A running total like wealth, moved
  -- only through its own ledger.
  supplies     int  not null default 0,
  lineage      text not null default '',
  background   text not null default '',
  campaign     text not null default '',
  blurb        text not null default '',
  portrait_url text,

  -- attributes
  -- Every attribute starts at 4 and is moved only by advancement: the +2 / +1
  -- spread chosen at level 1, and one point at every odd level after. The app
  -- rebuilds all three from `level_picks` on every change.
  physique     int not null default 4,
  instinct     int not null default 4,
  mind         int not null default 4,

  -- derived combat stats
  -- NOTE: `avoid` is displayed on the sheet as "Defense" (hard to hit) and
  -- `defense` is displayed as "Armor" (flat damage reduction) — the columns
  -- predate that relabel and are kept as-is to avoid a data migration.
  -- Defaults below match the level-1, base-4 baseline used by the app
  -- (avoid = instinct, initiative = instinct + level, speed_m = 3 + instinct/2).
  avoid        int not null default 4,
  defense      int not null default 0,
  speed_m      numeric(4,1) not null default 5,
  initiative   int not null default 5,
  reflex       int not null default 8,   -- suggested: physique + instinct
  grit         int not null default 8,   -- suggested: instinct + mind

  -- resources
  -- health/willpower defaults match the level-1, base-4 baseline:
  -- health_max = 10*level + 10*physique, willpower_max = 2*level + 2*mind + 10
  -- `health` is the only pool that may be negative: it runs down to -health_max,
  -- and reaching that floor is death. Deliberately no non-negative check.
  health       int not null default 50,
  health_max   int not null default 50,
  shield       int not null default 0,
  -- Not read by the app — shield's cap is always computed as half of
  -- health_max. Kept in sync here only so a raw row reads sensibly.
  shield_max   int not null default 25,
  ap           int not null default 6,
  ap_max       int not null default 6,
  reaction     int not null default 0,
  reaction_max int not null default 6,
  willpower    int not null default 20,
  willpower_max int not null default 20,
  karma        int not null default 0,

  -- flexible bags
  -- Worn / wielded gear: one item id (or null) per slot, e.g.
  -- { "head": "iron-helm", "torso": null, "legs": null, "main_hand": null,
  --   "off_hand": null, "bag": "leather-rucksack" }.
  -- Ids point into the item codex in src/lib/items.js. `bag` is in here rather
  -- than in a column of its own for the reason the map exists: there is one of
  -- it and it is one place. What it holds is not stored anywhere, because a bag
  -- holds nothing -- it raises the weight the whole sheet may come to. See
  -- carryCapacity in src/lib/items.js. A row saved before the slot existed has
  -- no key and reads as no bag.
  equipment    jsonb not null default '{}'::jsonb,
  -- Item ids carried in the pack — where unequipped gear goes.
  pack         jsonb not null default '[]'::jsonb,
  -- The utility belt: one entry per loop, e.g.
  -- [{ "id": "healing-potion", "used": 1 }, { "id": "grappling-hook", "used": 0 }, null].
  -- `used` is how many of that item's charges have been spent.
  belt         jsonb not null default '[]'::jsonb,
  -- How many of the five belt loops are open to this character.
  belt_slots   int   not null default 3,
  -- Talent sets, the rank held in each, and the advancement level each of
  -- those ranks was chosen at, e.g.
  -- [{ "id": "guardian", "name": "Guardian", "rank": 2, "taken": [1, 4] }].
  -- `taken` is ascending and always as long as `rank`; ids point into the
  -- talent codex in src/lib/talents.js, and `name` is stored alongside so the
  -- Character tab's tags read without a lookup. Older rows carrying only
  -- `name`/`rank` are matched back and given slots on read.
  talents      jsonb not null default '[]'::jsonb,
  -- The background taken at level 1. Its plain name is in `background` above;
  -- these hold what it handed out. Skill ids point into src/lib/backgrounds.js:
  --   ["negotiator", "fence"]
  -- and the kit is the receipt for the outfitting once taken. A kit stocks the
  -- pack and never equips, so `pack` is every id it added -- codex ids and
  -- minted custom- ones alike -- and handing back removes exactly those:
  --   { "armorSet": "Light Armor", "weapons": ["daggers"],
  --     "pack": ["leather-helm", ..., "custom-9f2a"],
  --     "coins": 120, "supplies": 40, "ts": "..." }
  -- null until the kit is taken.
  background_skills jsonb not null default '[]'::jsonb,
  background_kit    jsonb,
  -- Everything a level handed out that is not a talent, keyed by the level
  -- that granted it. Level 1 records the attribute spread, and every odd level
  -- after it records that level's point and the skill learned there:
  --   { "1": { "major": "physique", "minor": "mind" },
  --     "3": { "attribute": "instinct", "skill": "apothecary" } }
  -- `physique` / `instinct` / `mind` above stay the numbers the sheet derives
  -- from; the app rebuilds all three from this record on every change, so the
  -- two can never drift apart. Skill ids point into src/lib/backgrounds.js.
  level_picks  jsonb not null default '{}'::jsonb,
  -- Choices a card leaves to the player, keyed by the card that asks:
  -- { "chromatic-resistance": "red", "dark-bargain": "mind" }.
  choices      jsonb not null default '{}'::jsonb,
  -- How much of a limited card has been spent, keyed by the card:
  -- { "sprout-wings": 1 }. A card that says you must rest before using it again
  -- carries `uses` and `recharge` in the codex, and a rest empties this.
  card_uses    jsonb not null default '{}'::jsonb,
  lore         jsonb not null default '{}'::jsonb,  -- { appearance, personality, backstory, allies, notes }
  -- Session logs, newest first. A title and a note, plus the session it belongs
  -- to when the table counts them:
  --   [{ id, ts, session: "12", title: "The drowned vault", body: "..." }]
  journal      jsonb not null default '[]'::jsonb,
  -- XP / coin / supply transaction history, newest first:
  -- [{ id, ts, kind: 'xp' | 'wealth' | 'supplies', delta, note, balance }]
  ledger       jsonb not null default '[]'::jsonb,
  -- The creatures a talent set put on the board, keyed by the set that granted
  -- one: { "draconic-bond": { name, scale, portrait_url, health, shield, ap,
  -- reaction, effects } }. A pool that is absent reads as full, and `effects`
  -- is the creature's own tracker in the same shape as the character's own
  -- `effects` column below. See src/lib/minions.js.
  minions      jsonb not null default '{}'::jsonb,
  -- The bargains a talent set struck, keyed by the set that granted one:
  -- { "pactbound": { kind, form, weapon, progress, picks, extra, missions,
  -- log } }. Which of the two pacts it is, what shape the pact-bound weapon
  -- wears, the lifetime progress fed into it, every boon claimed off it, the
  -- standing missions and the feeding log. See src/lib/pact.js.
  pact         jsonb not null default '{}'::jsonb,

  -- Left-to-right order of the Character-tab blocks, e.g. [3,1,2,6,4,5]. The
  -- six numbered ones are every character's; a set that grants a creature adds
  -- "minion:<set>" and "minion:<set>:bar" to the list, so it is no longer a
  -- fixed length. The app repairs anything malformed on read.
  block_order  jsonb not null default '[1,2,3,4,5,6]'::jsonb,

  -- And how many columns that tab lays them out in, 1 to 9. A ceiling rather
  -- than a promise: the grid takes this many or as many as the window is wide
  -- enough for, whichever is fewer.
  block_columns int not null default 3,

  -- Left-to-right order of the Abilities tab's blocks, by source id
  -- ("lineage", "talent:mycomancer", "gear"). No fixed length: a source
  -- appears when it is taken and goes when it is handed back.
  ability_order jsonb not null default '[]'::jsonb,
  ability_columns int not null default 3,

  -- Left-to-right order of the Inventory tab's three fixed blocks, by block id
  -- ("armor", "weapons", "belt"). The inventory itself is not in the list: it
  -- is a row wide and always sits under the other three.
  inventory_order jsonb not null default '[]'::jsonb,
  inventory_columns int not null default 3,

  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- For databases created before these columns existed.
alter table public.characters add column if not exists background text  not null default '';
alter table public.characters add column if not exists ledger     jsonb not null default '[]'::jsonb;
alter table public.characters add column if not exists reflex     int   not null default 8;
alter table public.characters add column if not exists grit       int   not null default 8;
alter table public.characters add column if not exists block_order jsonb not null default '[1,2,3,4,5,6]'::jsonb;
alter table public.characters add column if not exists ability_order jsonb not null default '[]'::jsonb;
alter table public.characters add column if not exists inventory_order jsonb not null default '[]'::jsonb;
alter table public.characters add column if not exists block_columns int not null default 3;
alter table public.characters add column if not exists ability_columns int not null default 3;
alter table public.characters add column if not exists inventory_columns int not null default 3;
alter table public.characters add column if not exists equipment  jsonb not null default '{}'::jsonb;
alter table public.characters add column if not exists pack       jsonb not null default '[]'::jsonb;
alter table public.characters add column if not exists belt       jsonb not null default '[]'::jsonb;
alter table public.characters add column if not exists belt_slots int   not null default 3;
alter table public.characters add column if not exists choices    jsonb not null default '{}'::jsonb;
alter table public.characters add column if not exists supplies   int   not null default 0;
alter table public.characters add column if not exists background_skills jsonb not null default '[]'::jsonb;
alter table public.characters add column if not exists background_kit    jsonb;
alter table public.characters add column if not exists level_picks jsonb not null default '{}'::jsonb;
alter table public.characters add column if not exists journal     jsonb not null default '[]'::jsonb;
-- The turn manager on block 6: which of your turns you are on, and whether you
-- are in it. Everything running on you right now sits beside it in `effects`.
alter table public.characters add column if not exists turn_state  jsonb not null default '{}'::jsonb;
alter table public.characters add column if not exists effects     jsonb not null default '[]'::jsonb;
-- A talent set that hands you a body rather than a card: the Draconic Bond's
-- draconic ally, and whatever follows it.
alter table public.characters add column if not exists minions     jsonb not null default '{}'::jsonb;
-- And one that hands you a second shape of your own rather than a second body:
-- the Feral Curse's feral form, keyed by the set that granted it —
-- { "feral-curse": { beast, name, portrait_url, dc, on } }. `dc` is where the
-- Feral Rage difficulty has climbed to and `on` is whether they have given in.
-- The form's *clock* is not in here: it is the `shield` column above, because the
-- card says the form lasts "until all Shield is gone".
alter table public.characters add column if not exists feral       jsonb not null default '{}'::jsonb;
-- And one that hands you a debt: the Pact of Ordenance's bargain, keyed by the
-- set that granted it. Which pact was struck, the weapon's current form, the
-- lifetime progress fed into it and the boons claimed off it.
alter table public.characters add column if not exists pact        jsonb not null default '{}'::jsonb;
-- Rings, chains and cloaks. A plain list of item ids with no ceiling on it, which
-- is why it is not in the `equipment` map: that has one key per place and a fixed
-- set of keys, and a character wearing nine rings is wearing nine rings.
alter table public.characters add column if not exists trinkets    jsonb not null default '[]'::jsonb;
-- Items this player made, keyed by the instance id the rest of the row points at:
-- { "forged-a1b2": { base, ench, name, art } }. The base is a codex id and is the
-- whole of what the thing *is*, so nothing mechanical is copied in here and a
-- piece the designer reprices is repriced in every ring made out of it. This is
-- the item instance: two silver rings with different workings, a named piece, and
-- one handed to another player as a code.
alter table public.characters add column if not exists forged      jsonb not null default '{}'::jsonb;
-- What a card that limits itself has spent, keyed by the card id. "Once per long
-- rest" is a codex rider of `uses: 1, recharge: 'Long Rest'`, the same pair a
-- flask on the belt carries, and this counts what has gone. The rest that the
-- card names is what empties it again.
alter table public.characters add column if not exists card_uses   jsonb not null default '{}'::jsonb;

create index if not exists characters_user_id_idx on public.characters (user_id);

alter table public.characters enable row level security;

-- Sheets are public to read: anyone with the link, signed in or not, can view.
-- Writing stays with the owner (or an admin).
drop policy if exists "characters: owner all" on public.characters;

drop policy if exists "characters: public read" on public.characters;
create policy "characters: public read" on public.characters
  for select using (true);

drop policy if exists "characters: owner insert" on public.characters;
create policy "characters: owner insert" on public.characters
  for insert with check (auth.uid() = user_id);

drop policy if exists "characters: owner or admin update" on public.characters;
create policy "characters: owner or admin update" on public.characters
  for update using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id or public.is_admin());

drop policy if exists "characters: owner or admin delete" on public.characters;
create policy "characters: owner or admin delete" on public.characters
  for delete using (auth.uid() = user_id or public.is_admin());

-- ----------------------------------------------------------------------------
--  ABILITIES  (the cards)
-- ----------------------------------------------------------------------------
create table if not exists public.abilities (
  id           uuid primary key default gen_random_uuid(),
  character_id uuid not null references public.characters on delete cascade,
  sort_order   int  not null default 0,

  name         text not null default 'New Ability',
  type_line    text not null default 'SKILL',      -- banner text, e.g. "NOVICE SPELL - NATURE - BLOOD"
  kind         text not null default 'ability',    -- ability | spell | talent | skill  (drives card accent)
  ap_cost      int,                                -- null = no fist badge
  wp_cost      int,                                -- null = no willpower badge
  body         text not null default '',
  sub_name     text,                               -- optional second heading, e.g. "BLOOD TITHE"
  sub_body     text,
  art_url      text,
  created_at   timestamptz not null default now()
);

create index if not exists abilities_character_id_idx on public.abilities (character_id);

alter table public.abilities enable row level security;

-- A public sheet is useless without its cards, so reads are public too.
drop policy if exists "abilities: owner all" on public.abilities;

drop policy if exists "abilities: public read" on public.abilities;
create policy "abilities: public read" on public.abilities
  for select using (true);

drop policy if exists "abilities: owner insert" on public.abilities;
create policy "abilities: owner insert" on public.abilities
  for insert with check (
    exists (select 1 from public.characters c
            where c.id = abilities.character_id
              and (c.user_id = auth.uid() or public.is_admin()))
  );

drop policy if exists "abilities: owner update" on public.abilities;
create policy "abilities: owner update" on public.abilities
  for update using (
    exists (select 1 from public.characters c
            where c.id = abilities.character_id
              and (c.user_id = auth.uid() or public.is_admin()))
  );

drop policy if exists "abilities: owner delete" on public.abilities;
create policy "abilities: owner delete" on public.abilities
  for delete using (
    exists (select 1 from public.characters c
            where c.id = abilities.character_id
              and (c.user_id = auth.uid() or public.is_admin()))
  );

-- ----------------------------------------------------------------------------
--  INVENTORY
-- ----------------------------------------------------------------------------
create table if not exists public.inventory_items (
  id           uuid primary key default gen_random_uuid(),
  character_id uuid not null references public.characters on delete cascade,
  sort_order   int  not null default 0,

  name         text not null default 'New Item',
  category     text not null default 'Gear',   -- Weapon | Armour | Gear | Consumable | Relic
  quantity     int  not null default 1,
  weight       numeric(6,2) not null default 0,
  equipped     boolean not null default false,
  notes        text not null default '',
  created_at   timestamptz not null default now()
);

create index if not exists inventory_character_id_idx on public.inventory_items (character_id);

alter table public.inventory_items enable row level security;

drop policy if exists "inventory: owner all" on public.inventory_items;

drop policy if exists "inventory: public read" on public.inventory_items;
create policy "inventory: public read" on public.inventory_items
  for select using (true);

drop policy if exists "inventory: owner insert" on public.inventory_items;
create policy "inventory: owner insert" on public.inventory_items
  for insert with check (
    exists (select 1 from public.characters c
            where c.id = inventory_items.character_id
              and (c.user_id = auth.uid() or public.is_admin()))
  );

drop policy if exists "inventory: owner update" on public.inventory_items;
create policy "inventory: owner update" on public.inventory_items
  for update using (
    exists (select 1 from public.characters c
            where c.id = inventory_items.character_id
              and (c.user_id = auth.uid() or public.is_admin()))
  );

drop policy if exists "inventory: owner delete" on public.inventory_items;
create policy "inventory: owner delete" on public.inventory_items
  for delete using (
    exists (select 1 from public.characters c
            where c.id = inventory_items.character_id
              and (c.user_id = auth.uid() or public.is_admin()))
  );

-- ----------------------------------------------------------------------------
--  CAMPAIGNS
--  One row per table being run. The creator is the DM and the only writer;
--  players link a character to it through campaign_members below.
-- ----------------------------------------------------------------------------
create table if not exists public.campaigns (
  id            uuid primary key default gen_random_uuid(),
  dm_user_id    uuid not null references auth.users on delete cascade,

  name          text not null default 'Unnamed Campaign',
  -- A sentence for the card on the Campaigns page.
  description   text not null default '',
  -- The picture on that card, as a plain link the way portraits are.
  thumbnail_url text,
  -- The join code handed to players. Generated by the app (see makeJoinCode in
  -- src/lib/campaigns.js); join_campaign below is how it is spent, so nobody
  -- ever has to be able to *read* a campaign they are not yet in.
  code          text not null unique,

  -- Left-to-right order of the Overview tab's blocks, by block id
  -- ("member:<character_id>", "minion:<character_id>:<set>"). No fixed length:
  -- a block appears when a character is linked and goes when they leave, so the
  -- app repairs the list against what actually exists on read, the way the
  -- Abilities tab does (see normalizeSourceOrder).
  overview_order   jsonb not null default '[]'::jsonb,
  -- And how many columns that tab lays them out in, 1 to 9. A ceiling rather
  -- than a promise, exactly as on the character sheet.
  overview_columns int   not null default 3,

  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists campaigns_dm_user_id_idx on public.campaigns (dm_user_id);

alter table public.campaigns enable row level security;

-- One row per character sitting at a table. `user_id` is the character's owner,
-- written by the trigger below rather than trusted from the client, so "which
-- campaigns am I in" is always answered by the truth.
create table if not exists public.campaign_members (
  id           uuid primary key default gen_random_uuid(),
  campaign_id  uuid not null references public.campaigns  on delete cascade,
  character_id uuid not null references public.characters on delete cascade,
  user_id      uuid not null references auth.users        on delete cascade,
  joined_at    timestamptz not null default now(),
  unique (campaign_id, character_id)
);

create index if not exists campaign_members_campaign_id_idx on public.campaign_members (campaign_id);
create index if not exists campaign_members_user_id_idx     on public.campaign_members (user_id);

alter table public.campaign_members enable row level security;

-- SECURITY DEFINER for the same reason is_admin() is: policies on campaigns and
-- campaign_members both ask it, and a policy that queried campaign_members from
-- inside campaign_members would recurse.
create or replace function public.is_campaign_member(cid uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.campaign_members m
    where m.campaign_id = cid and m.user_id = auth.uid()
  );
$$;

-- ----------------------------------------------------------------------------
--  How many campaigns each tier may run. The ladder's twin lives in
--  src/lib/tiers.js (campaignSlots), which is what the interface offers;
--  this pair is what actually enforces it, because the client is not trusted
--  with a ceiling. Counted per DM on insert.
-- ----------------------------------------------------------------------------
create or replace function public.campaign_slots(tier text)
returns int
language sql immutable
as $$
  select case tier
           when 'admin'   then 20
           when 'friend'  then 10
           when 'premium' then 10
           else 1
         end;
$$;

create or replace function public.guard_campaign_slots()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  -- The SQL editor and the service role pass, the way the tier guard lets them.
  if auth.uid() is null then
    return new;
  end if;
  if (select count(*) from public.campaigns c where c.dm_user_id = new.dm_user_id)
     >= public.campaign_slots(public.account_tier()) then
    raise exception 'Every campaign slot on this account is full.';
  end if;
  return new;
end;
$$;

drop trigger if exists campaigns_guard_slots on public.campaigns;
create trigger campaigns_guard_slots
  before insert on public.campaigns
  for each row execute function public.guard_campaign_slots();

-- ----------------------------------------------------------------------------
--  A membership row always names the character's real owner. The client never
--  sends user_id at all: whatever it claimed is overwritten with the owner of
--  the character being linked, so a forged row cannot put a campaign in
--  somebody else's list.
-- ----------------------------------------------------------------------------
create or replace function public.claim_member_owner()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  select ch.user_id into new.user_id
  from public.characters ch
  where ch.id = new.character_id;

  if new.user_id is null then
    raise exception 'No character exists at that link.';
  end if;
  return new;
end;
$$;

drop trigger if exists campaign_members_claim_owner on public.campaign_members;
create trigger campaign_members_claim_owner
  before insert on public.campaign_members
  for each row execute function public.claim_member_owner();

-- A campaign is read by the table sitting at it: the DM, its members, an admin.
drop policy if exists "campaigns: table read" on public.campaigns;
create policy "campaigns: table read" on public.campaigns
  for select using (
    dm_user_id = auth.uid()
    or public.is_campaign_member(id)
    or public.is_admin()
  );

drop policy if exists "campaigns: dm insert" on public.campaigns;
create policy "campaigns: dm insert" on public.campaigns
  for insert with check (dm_user_id = auth.uid());

drop policy if exists "campaigns: dm update" on public.campaigns;
create policy "campaigns: dm update" on public.campaigns
  for update using (dm_user_id = auth.uid() or public.is_admin())
  with check (dm_user_id = auth.uid() or public.is_admin());

drop policy if exists "campaigns: dm delete" on public.campaigns;
create policy "campaigns: dm delete" on public.campaigns
  for delete using (dm_user_id = auth.uid() or public.is_admin());

-- The roster is read by the same table that reads the campaign.
drop policy if exists "campaign_members: table read" on public.campaign_members;
create policy "campaign_members: table read" on public.campaign_members
  for select using (
    public.is_campaign_member(campaign_id)
    or exists (select 1 from public.campaigns c
               where c.id = campaign_members.campaign_id
                 and c.dm_user_id = auth.uid())
    or public.is_admin()
  );

-- Only the DM links characters directly (by sheet link). A player joining with
-- the code goes through join_campaign below, which is SECURITY DEFINER and so
-- needs no policy of its own.
drop policy if exists "campaign_members: dm insert" on public.campaign_members;
create policy "campaign_members: dm insert" on public.campaign_members
  for insert with check (
    exists (select 1 from public.campaigns c
            where c.id = campaign_members.campaign_id
              and c.dm_user_id = auth.uid())
    or public.is_admin()
  );

-- The DM removes anyone; a player removes their own character.
drop policy if exists "campaign_members: dm or own delete" on public.campaign_members;
create policy "campaign_members: dm or own delete" on public.campaign_members
  for delete using (
    user_id = auth.uid()
    or exists (select 1 from public.campaigns c
               where c.id = campaign_members.campaign_id
                 and c.dm_user_id = auth.uid())
    or public.is_admin()
  );

-- ----------------------------------------------------------------------------
--  Joining by code. SECURITY DEFINER so the lookup can see a campaign the
--  caller cannot yet read: the code is the invitation, and holding it is the
--  whole of the proof. The dash in a printed code is decoration, so it is
--  ignored on both sides of the comparison.
-- ----------------------------------------------------------------------------
create or replace function public.join_campaign(join_code text, sheet_id uuid)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  camp_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Sign in to join a campaign.';
  end if;

  select c.id into camp_id
  from public.campaigns c
  where upper(replace(c.code, '-', '')) = upper(replace(trim(join_code), '-', ''));

  if camp_id is null then
    raise exception 'No campaign answers to that code.';
  end if;

  if not exists (select 1 from public.characters ch
                 where ch.id = sheet_id and ch.user_id = auth.uid()) then
    raise exception 'Only a character you own can be linked.';
  end if;

  insert into public.campaign_members (campaign_id, character_id, user_id)
  values (camp_id, sheet_id, auth.uid())
  on conflict (campaign_id, character_id) do nothing;

  return camp_id;
end;
$$;

-- ----------------------------------------------------------------------------
--  THE EVENT LOG
--  What happened at the table, one row per thing that happened, insert only.
--
--  A character sitting at a campaign writes here every time it does something:
--  a card played, a rest taken, a turn crossed. Every member reads the whole
--  log, so a player watching their own sheet sees the fight going on around it
--  without anybody having to say it out loud.
--
--  Insert only, deliberately. Nothing updates a row and nothing deletes one but
--  the sweep at the bottom, because a log that can be edited after the fact is
--  not a log. It is also the channel the plan builds targeted casting on later
--  (see data/README.md): an event is already the whole account of an action, so
--  a future delivery is a reader of these rows rather than a second table.
-- ----------------------------------------------------------------------------
create table if not exists public.campaign_events (
  id           uuid primary key default gen_random_uuid(),
  -- A gapless-enough count for reading in order and for a cursor later. The
  -- clock is not enough on its own: two players acting in the same millisecond
  -- must still land in some order, and every reader must agree which.
  seq          bigint generated always as identity,

  campaign_id  uuid not null references public.campaigns  on delete cascade,
  -- Null for an event the table itself raised rather than a character. Set
  -- null rather than cascade on a deleted sheet: what happened still happened.
  character_id uuid references public.characters on delete set null,
  user_id      uuid not null references auth.users on delete cascade,

  -- 'use' | 'rest' | 'turn'. Kept as text rather than an enum so a new kind is
  -- a deploy of the app and not a migration.
  kind         text not null,
  -- The name that acted, copied at the time. Denormalized on purpose: a
  -- character can be renamed or deleted, and a log that then reads "someone
  -- cast Fireball" has lost the only thing worth keeping.
  actor        text not null default '',
  -- What was done, and the one line under it. "Fireball", "2 Action Points and
  -- 4 Willpower · Quick Bar".
  title        text not null default '',
  detail       text not null default '',
  -- The receipt: the card id the row opens, what it cost, how it was tapped.
  -- Read by the block for the tap-through and by nothing for arithmetic.
  data         jsonb not null default '{}'::jsonb,

  created_at   timestamptz not null default now()
);

-- The one query there is: this campaign, newest first.
create index if not exists campaign_events_feed_idx
  on public.campaign_events (campaign_id, seq desc);
-- And the one the sweep runs.
create index if not exists campaign_events_age_idx
  on public.campaign_events (campaign_id, created_at);

alter table public.campaign_events enable row level security;

-- The actor is taken from the session, never from the client, exactly as
-- campaign_members takes its owner. Two things are checked rather than trusted:
-- the character is one you own, and it is actually sitting at this table. A DM
-- may write an event with no character on it; that is the table speaking.
create or replace function public.claim_event_actor()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  is_dm boolean;
begin
  if auth.uid() is null then
    raise exception 'Sign in to write to a campaign log.';
  end if;

  new.user_id = auth.uid();

  select c.dm_user_id = auth.uid() into is_dm
  from public.campaigns c where c.id = new.campaign_id;

  if new.character_id is not null then
    -- An admin edits any sheet on this site, so an admin may speak for one.
    if not exists (select 1 from public.characters ch
                   where ch.id = new.character_id
                     and (ch.user_id = auth.uid() or public.is_admin())) then
      raise exception 'Only a character you own can act in a log.';
    end if;
    if not exists (select 1 from public.campaign_members m
                   where m.campaign_id = new.campaign_id
                     and m.character_id = new.character_id) then
      raise exception 'That character does not sit at this table.';
    end if;
  elsif not coalesce(is_dm, false) then
    raise exception 'Only the Game Master can write a table event.';
  end if;

  return new;
end;
$$;

drop trigger if exists campaign_events_claim_actor on public.campaign_events;
create trigger campaign_events_claim_actor
  before insert on public.campaign_events
  for each row execute function public.claim_event_actor();

-- Read by the table sitting at the campaign, the same reach that reads the
-- roster.
drop policy if exists "campaign_events: table read" on public.campaign_events;
create policy "campaign_events: table read" on public.campaign_events
  for select using (
    public.is_campaign_member(campaign_id)
    or exists (select 1 from public.campaigns c
               where c.id = campaign_events.campaign_id
                 and (c.dm_user_id = auth.uid() or public.is_admin()))
  );

-- Written by the same table. The trigger above is what makes this safe: the
-- policy answers "may you speak here", the trigger answers "as whom".
drop policy if exists "campaign_events: table insert" on public.campaign_events;
create policy "campaign_events: table insert" on public.campaign_events
  for insert with check (
    public.is_campaign_member(campaign_id)
    or exists (select 1 from public.campaigns c
               where c.id = campaign_events.campaign_id
                 and (c.dm_user_id = auth.uid() or public.is_admin()))
  );

-- There is deliberately no update policy and no delete policy. A log nobody can
-- rewrite is the whole point, and the sweep below runs as its owner.

-- ----------------------------------------------------------------------------
--  How long an event lives. Ninety days: long enough that a campaign meeting
--  once a fortnight can still read back over half a year of sessions, short
--  enough that a table playing weekly for years does not carry every arrow it
--  ever loosed.
--
--  Swept on insert rather than on a schedule, because there is no scheduler
--  here. One insert in fifty pays for it, which on a table mid-fight is a sweep
--  every few minutes and on a quiet one is a sweep whenever somebody plays.
--  SECURITY DEFINER because the policies above give nobody a delete.
-- ----------------------------------------------------------------------------
create or replace function public.trim_campaign_events()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if random() < 0.02 then
    delete from public.campaign_events e
    where e.campaign_id = new.campaign_id
      and e.created_at < now() - interval '90 days';
  end if;
  return null;
end;
$$;

drop trigger if exists campaign_events_trim on public.campaign_events;
create trigger campaign_events_trim
  after insert on public.campaign_events
  for each row execute function public.trim_campaign_events();

-- ----------------------------------------------------------------------------
--  updated_at housekeeping
-- ----------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists characters_touch_updated_at on public.characters;
create trigger characters_touch_updated_at
  before update on public.characters
  for each row execute function public.touch_updated_at();

drop trigger if exists campaigns_touch_updated_at on public.campaigns;
create trigger campaigns_touch_updated_at
  before update on public.campaigns
  for each row execute function public.touch_updated_at();

-- ----------------------------------------------------------------------------
--  REALTIME
--  Lets viewers see a sheet update without reloading. Realtime still honours
--  RLS, so subscribers only receive rows they are allowed to read.
--
--  REPLICA IDENTITY FULL is needed so DELETE events carry the whole old row —
--  without it the payload holds only the primary key, and a subscription
--  filtered on character_id would never match a delete.
-- ----------------------------------------------------------------------------
alter table public.characters       replica identity full;
alter table public.abilities        replica identity full;
alter table public.inventory_items  replica identity full;
alter table public.campaigns        replica identity full;
alter table public.campaign_members replica identity full;
-- The log is insert only for everyone; the sweep is the only delete and no
-- client cares about one. Full identity all the same, so it matches its
-- neighbours and a filtered delete would carry its campaign if one ever mattered.
alter table public.campaign_events  replica identity full;

do $$
declare
  t text;
begin
  foreach t in array array['characters', 'abilities', 'inventory_items',
                          'campaigns', 'campaign_members', 'campaign_events'] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

-- ----------------------------------------------------------------------------
--  SCHEMA CACHE
--  PostgREST answers from a cached copy of the schema. Adding a column without
--  telling it produces
--      "Could not find the 'background' column of 'characters' in the schema cache"
--  on the next insert, so every run of this file ends by reloading the cache.
-- ----------------------------------------------------------------------------
notify pgrst, 'reload schema';

-- ----------------------------------------------------------------------------
--  GRANTING ADMIN
--  Admins can edit and delete any character. Promote yourself by email:
--
--    update public.profiles set role = 'admin'
--    where id = (select id from auth.users where email = 'you@example.com');
--
--  Demote with role = 'user'. There is deliberately no way to self-promote
--  from the app — it has to happen here.
-- ----------------------------------------------------------------------------
