-- ====================================================================
-- SMASH LEAGUE v2 — Schema with auth, roles, scheduling
-- ⚠️ ถ้าเคยรัน v1 แล้ว ให้สร้าง Supabase project ใหม่ หรือ DROP ตารางเก่าก่อน
-- รัน SQL นี้ใน Supabase SQL Editor ทั้งหมดในครั้งเดียว
-- ====================================================================

create extension if not exists pgcrypto;

-- ====================================================================
-- TABLES
-- ====================================================================

-- ผู้เล่น = บัญชี (1:1)
create table if not exists public.players (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  emoji text default '🏸',
  pin_hash text not null,
  role text not null default 'player' check (role in ('player', 'admin', 'manager')),
  rating integer not null default 1000,
  wins integer not null default 0,
  losses integer not null default 0,
  created_at timestamptz not null default now()
);

-- การตั้งค่าระบบ (มี row เดียว)
create table if not exists public.settings (
  id integer primary key default 1,
  k_factor integer not null default 32,
  starting_rating integer not null default 1000,
  updated_at timestamptz not null default now(),
  constraint single_row check (id = 1)
);
insert into public.settings (id) values (1) on conflict do nothing;

-- แมตช์ที่ admin จัดคู่ไว้แต่ยังไม่เล่น
create table if not exists public.scheduled_matches (
  id uuid primary key default gen_random_uuid(),
  player1_id uuid not null references public.players(id) on delete cascade,
  player2_id uuid not null references public.players(id) on delete cascade,
  round_label text,
  status text not null default 'pending'
    check (status in ('pending', 'completed', 'cancelled')),
  scheduled_at timestamptz,
  created_at timestamptz not null default now(),
  created_by uuid references public.players(id),
  constraint sm_different_players check (player1_id <> player2_id)
);
create index if not exists sm_status_idx on public.scheduled_matches (status);
create index if not exists sm_p1_idx on public.scheduled_matches (player1_id);
create index if not exists sm_p2_idx on public.scheduled_matches (player2_id);

-- แมตช์ที่เล่นจบแล้ว
create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  scheduled_match_id uuid references public.scheduled_matches(id) on delete set null,
  player1_id uuid not null references public.players(id) on delete cascade,
  player2_id uuid not null references public.players(id) on delete cascade,
  winner_id uuid not null references public.players(id) on delete cascade,
  game_scores jsonb not null,
  rating_change_p1 integer not null,
  rating_change_p2 integer not null,
  p1_rating_before integer not null,
  p2_rating_before integer not null,
  recorded_by uuid references public.players(id),
  played_at timestamptz not null default now(),
  constraint m_different_players check (player1_id <> player2_id),
  constraint m_valid_winner check (winner_id = player1_id or winner_id = player2_id)
);
create index if not exists m_played_at_idx on public.matches (played_at desc);
create index if not exists m_p1_idx on public.matches (player1_id);
create index if not exists m_p2_idx on public.matches (player2_id);

-- Audit log สำหรับการ override rating
create table if not exists public.rating_audits (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  old_rating integer not null,
  new_rating integer not null,
  reason text,
  changed_by uuid references public.players(id),
  changed_at timestamptz not null default now()
);

-- Sessions สำหรับ custom auth
create table if not exists public.sessions (
  token text primary key,
  player_id uuid not null references public.players(id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists sessions_expires_idx on public.sessions (expires_at);

-- ====================================================================
-- RPC FUNCTIONS — Authentication
-- ====================================================================

create or replace function public.signup_player(
  p_name text, p_pin text, p_emoji text default '🏸'
) returns json
language plpgsql security definer set search_path = public, extensions as $$
declare
  v_player_id uuid;
  v_token text;
  v_start_rating integer;
begin
  if length(p_pin) < 4 or length(p_pin) > 6 then raise exception 'PIN ต้องมี 4-6 หลัก'; end if;
  if p_pin !~ '^[0-9]+$' then raise exception 'PIN ต้องเป็นตัวเลขเท่านั้น'; end if;
  if length(trim(p_name)) < 1 then raise exception 'กรุณาใส่ชื่อ'; end if;

  select starting_rating into v_start_rating from public.settings where id = 1;

  insert into public.players (name, emoji, pin_hash, rating)
  values (trim(p_name), p_emoji, crypt(p_pin, gen_salt('bf', 8)), v_start_rating)
  returning id into v_player_id;

  v_token := encode(gen_random_bytes(24), 'hex');
  insert into public.sessions (token, player_id, expires_at)
  values (v_token, v_player_id, now() + interval '30 days');

  return json_build_object('token', v_token, 'player_id', v_player_id);
exception when unique_violation then raise exception 'ชื่อนี้ถูกใช้แล้ว';
end; $$;

create or replace function public.login_player(p_name text, p_pin text)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare
  v_player_id uuid;
  v_pin_hash text;
  v_token text;
begin
  select id, pin_hash into v_player_id, v_pin_hash from public.players where name = trim(p_name);
  if v_player_id is null then raise exception 'ไม่พบผู้ใช้'; end if;
  if v_pin_hash <> crypt(p_pin, v_pin_hash) then raise exception 'PIN ไม่ถูกต้อง'; end if;

  v_token := encode(gen_random_bytes(24), 'hex');
  insert into public.sessions (token, player_id, expires_at)
  values (v_token, v_player_id, now() + interval '30 days');

  return json_build_object('token', v_token, 'player_id', v_player_id);
end; $$;

create or replace function public.get_session_user(p_token text)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare v_result json;
begin
  select json_build_object(
    'id', p.id, 'name', p.name, 'emoji', p.emoji, 'role', p.role,
    'rating', p.rating, 'wins', p.wins, 'losses', p.losses
  ) into v_result
  from public.sessions s join public.players p on p.id = s.player_id
  where s.token = p_token and s.expires_at > now();

  if v_result is null then raise exception 'Session หมดอายุ'; end if;
  return v_result;
end; $$;

create or replace function public.logout(p_token text)
returns void language plpgsql security definer set search_path = public, extensions as $$
begin delete from public.sessions where token = p_token; end; $$;

create or replace function public.change_pin(p_token text, p_old_pin text, p_new_pin text)
returns void language plpgsql security definer set search_path = public, extensions as $$
declare
  v_player_id uuid;
  v_pin_hash text;
begin
  select s.player_id, p.pin_hash into v_player_id, v_pin_hash
  from public.sessions s join public.players p on p.id = s.player_id
  where s.token = p_token and s.expires_at > now();
  if v_player_id is null then raise exception 'Session ไม่ถูกต้อง'; end if;
  if v_pin_hash <> crypt(p_old_pin, v_pin_hash) then raise exception 'PIN เดิมไม่ถูกต้อง'; end if;
  if length(p_new_pin) < 4 or length(p_new_pin) > 6 or p_new_pin !~ '^[0-9]+$' then
    raise exception 'PIN ใหม่ต้องเป็นตัวเลข 4-6 หลัก';
  end if;
  update public.players set pin_hash = crypt(p_new_pin, gen_salt('bf', 8)) where id = v_player_id;
end; $$;

-- ====================================================================
-- RPC FUNCTIONS — Admin
-- ====================================================================

create or replace function public._require_admin(p_token text)
returns uuid language plpgsql security definer set search_path = public, extensions as $$
declare v_id uuid; v_role text;
begin
  select s.player_id, p.role into v_id, v_role
  from public.sessions s join public.players p on p.id = s.player_id
  where s.token = p_token and s.expires_at > now();
  if v_id is null then raise exception 'ต้อง login ก่อน'; end if;
  if v_role not in ('admin', 'manager') then raise exception 'ต้องเป็น admin'; end if;
  return v_id;
end; $$;

create or replace function public.schedule_match(
  p_token text, p_player1_id uuid, p_player2_id uuid, p_round_label text default null
) returns uuid language plpgsql security definer set search_path = public, extensions as $$
declare v_admin_id uuid; v_match_id uuid;
begin
  v_admin_id := public._require_admin(p_token);
  if p_player1_id = p_player2_id then raise exception 'ผู้เล่นต้องคนละคน'; end if;
  insert into public.scheduled_matches (player1_id, player2_id, round_label, created_by)
  values (p_player1_id, p_player2_id, p_round_label, v_admin_id)
  returning id into v_match_id;
  return v_match_id;
end; $$;

create or replace function public.record_match(
  p_token text, p_player1_id uuid, p_player2_id uuid,
  p_winner_id uuid, p_game_scores jsonb, p_scheduled_match_id uuid default null
) returns json language plpgsql security definer set search_path = public, extensions as $$
declare
  v_admin_id uuid; v_k integer;
  v_r1 integer; v_r2 integer;
  v_w1 integer; v_l1 integer; v_w2 integer; v_l2 integer;
  v_expected1 numeric; v_result1 numeric;
  v_delta1 integer; v_delta2 integer; v_match_id uuid;
begin
  v_admin_id := public._require_admin(p_token);
  if p_player1_id = p_player2_id then raise exception 'ผู้เล่นต้องคนละคน'; end if;
  if p_winner_id not in (p_player1_id, p_player2_id) then raise exception 'ผู้ชนะต้องเป็นหนึ่งในสองผู้เล่น'; end if;

  select k_factor into v_k from public.settings where id = 1;
  select rating, wins, losses into v_r1, v_w1, v_l1 from public.players where id = p_player1_id for update;
  select rating, wins, losses into v_r2, v_w2, v_l2 from public.players where id = p_player2_id for update;

  v_expected1 := 1.0 / (1.0 + power(10.0, (v_r2 - v_r1)::numeric / 400.0));
  v_result1 := case when p_winner_id = p_player1_id then 1.0 else 0.0 end;
  v_delta1 := round(v_k * (v_result1 - v_expected1));
  v_delta2 := -v_delta1;

  insert into public.matches (
    scheduled_match_id, player1_id, player2_id, winner_id, game_scores,
    rating_change_p1, rating_change_p2, p1_rating_before, p2_rating_before, recorded_by
  ) values (
    p_scheduled_match_id, p_player1_id, p_player2_id, p_winner_id, p_game_scores,
    v_delta1, v_delta2, v_r1, v_r2, v_admin_id
  ) returning id into v_match_id;

  update public.players set rating = v_r1 + v_delta1,
    wins = v_w1 + case when p_winner_id = p_player1_id then 1 else 0 end,
    losses = v_l1 + case when p_winner_id = p_player1_id then 0 else 1 end
  where id = p_player1_id;

  update public.players set rating = v_r2 + v_delta2,
    wins = v_w2 + case when p_winner_id = p_player2_id then 1 else 0 end,
    losses = v_l2 + case when p_winner_id = p_player2_id then 0 else 1 end
  where id = p_player2_id;

  if p_scheduled_match_id is not null then
    update public.scheduled_matches set status = 'completed' where id = p_scheduled_match_id;
  end if;

  return json_build_object('match_id', v_match_id, 'delta1', v_delta1, 'delta2', v_delta2);
end; $$;

create or replace function public.override_rating(
  p_token text, p_player_id uuid, p_new_rating integer, p_reason text
) returns void language plpgsql security definer set search_path = public, extensions as $$
declare v_admin_id uuid; v_old integer;
begin
  v_admin_id := public._require_admin(p_token);
  select rating into v_old from public.players where id = p_player_id for update;
  update public.players set rating = p_new_rating where id = p_player_id;
  insert into public.rating_audits (player_id, old_rating, new_rating, reason, changed_by)
  values (p_player_id, v_old, p_new_rating, p_reason, v_admin_id);
end; $$;

create or replace function public.update_settings(
  p_token text, p_k_factor integer, p_starting_rating integer
) returns void language plpgsql security definer set search_path = public, extensions as $$
begin
  perform public._require_admin(p_token);
  if p_k_factor < 1 or p_k_factor > 100 then raise exception 'K-factor ต้องอยู่ระหว่าง 1-100'; end if;
  update public.settings set k_factor = p_k_factor, starting_rating = p_starting_rating, updated_at = now() where id = 1;
end; $$;

create or replace function public.set_role(p_token text, p_player_id uuid, p_role text)
returns void language plpgsql security definer set search_path = public, extensions as $$
begin
  perform public._require_admin(p_token);
  if p_role not in ('player', 'admin', 'manager') then raise exception 'role ไม่ถูกต้อง'; end if;
  update public.players set role = p_role where id = p_player_id;
end; $$;

create or replace function public.cancel_scheduled_match(p_token text, p_id uuid)
returns void language plpgsql security definer set search_path = public, extensions as $$
begin
  perform public._require_admin(p_token);
  update public.scheduled_matches set status = 'cancelled' where id = p_id;
end; $$;

create or replace function public.delete_player(p_token text, p_player_id uuid)
returns void language plpgsql security definer set search_path = public, extensions as $$
begin
  perform public._require_admin(p_token);
  delete from public.players where id = p_player_id;
end; $$;

-- ====================================================================
-- ROW LEVEL SECURITY
-- ====================================================================
alter table public.players enable row level security;
alter table public.matches enable row level security;
alter table public.scheduled_matches enable row level security;
alter table public.settings enable row level security;
alter table public.rating_audits enable row level security;
alter table public.sessions enable row level security;

-- อ่านได้สาธารณะ (ยกเว้น sessions/audits ที่ปิดทั้งหมด)
drop policy if exists "read_players_public" on public.players;
create policy "read_players_public" on public.players for select using (true);

drop policy if exists "read_matches_public" on public.matches;
create policy "read_matches_public" on public.matches for select using (true);

drop policy if exists "read_scheduled_public" on public.scheduled_matches;
create policy "read_scheduled_public" on public.scheduled_matches for select using (true);

drop policy if exists "read_settings_public" on public.settings;
create policy "read_settings_public" on public.settings for select using (true);

-- ไม่มี policy สำหรับ insert/update/delete = บล็อกทั้งหมด ต้องผ่าน RPC

-- ====================================================================
-- REALTIME
-- ====================================================================
alter publication supabase_realtime add table public.players;
alter publication supabase_realtime add table public.matches;
alter publication supabase_realtime add table public.scheduled_matches;

-- ====================================================================
-- BOOTSTRAP ADMIN — อ่านนะ!
--
-- หลังรัน schema แล้ว:
--   1) เปิดเว็บ → สมัครบัญชีแรกของคุณตามปกติ (เลือก emoji, ตั้ง PIN)
--   2) กลับมาที่ SQL Editor นี้แล้วรัน:
--
--        update public.players set role = 'admin' where name = 'ชื่อที่คุณตั้ง';
--
--   3) Logout แล้ว login ใหม่ → จะเห็นเมนู Admin
--
-- จากนั้น admin คนถัดไปสามารถ promote ได้จากหน้าเว็บ
-- ====================================================================
