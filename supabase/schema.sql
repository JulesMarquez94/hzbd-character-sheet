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
  -- { "head": "iron-helm", "torso": null, "legs": null, "main_hand": null, "off_hand": null }.
  -- Ids point into the item codex in src/lib/items.js.
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
  lore         jsonb not null default '{}'::jsonb,  -- { appearance, personality, backstory, allies, notes }
  -- Session logs, newest first. A title and a note, plus the session it belongs
  -- to when the table counts them:
  --   [{ id, ts, session: "12", title: "The drowned vault", body: "..." }]
  journal      jsonb not null default '[]'::jsonb,
  -- XP / coin / supply transaction history, newest first:
  -- [{ id, ts, kind: 'xp' | 'wealth' | 'supplies', delta, note, balance }]
  ledger       jsonb not null default '[]'::jsonb,
  -- Left-to-right order of the six Character-tab blocks, e.g. [3,1,2,6,4,5].
  -- The app repairs anything malformed on read, so no constraint here.
  block_order  jsonb not null default '[1,2,3,4,5,6]'::jsonb,

  -- Left-to-right order of the Abilities tab's blocks, by source id
  -- ("lineage", "talent:mycomancer", "gear"). No fixed length: a source
  -- appears when it is taken and goes when it is handed back.
  ability_order jsonb not null default '[]'::jsonb,

  -- Left-to-right order of the Inventory tab's three fixed blocks, by block id
  -- ("armor", "weapons", "belt"). The inventory itself is not in the list: it
  -- is a row wide and always sits under the other three.
  inventory_order jsonb not null default '[]'::jsonb,

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

-- ----------------------------------------------------------------------------
--  REALTIME
--  Lets viewers see a sheet update without reloading. Realtime still honours
--  RLS, so subscribers only receive rows they are allowed to read.
--
--  REPLICA IDENTITY FULL is needed so DELETE events carry the whole old row —
--  without it the payload holds only the primary key, and a subscription
--  filtered on character_id would never match a delete.
-- ----------------------------------------------------------------------------
alter table public.characters      replica identity full;
alter table public.abilities       replica identity full;
alter table public.inventory_items replica identity full;

do $$
declare
  t text;
begin
  foreach t in array array['characters', 'abilities', 'inventory_items'] loop
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
