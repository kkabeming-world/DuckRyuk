-- 덕력 (Duckryuk) — 초기 스키마
-- Phase 1~2: 기록 + 카드 + 인벤토리 + 랭킹

set check_function_bodies = off;
create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────────────────────────
-- 1. profiles : auth.users 1:1 확장
-- ─────────────────────────────────────────────────────────────
create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  nickname     text not null,
  handle       text unique,
  avatar_url   text,
  bio          text,
  is_anonymous_ranking boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index profiles_handle_idx on public.profiles(handle);

-- 회원가입 시 profile 자동 생성
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, nickname)
  values (new.id, coalesce(new.raw_user_meta_data->>'nickname', split_part(new.email, '@', 1)));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ─────────────────────────────────────────────────────────────
-- 2. artists : 아이돌/그룹 마스터
-- ─────────────────────────────────────────────────────────────
create table public.artists (
  id           uuid primary key default gen_random_uuid(),
  slug         text unique not null,
  name_ko      text not null,
  name_en      text,
  agency       text,
  kind         text not null default 'group' check (kind in ('group', 'solo')),
  debut_year   int,
  image_url    text,
  created_at   timestamptz not null default now()
);

create index artists_name_ko_idx on public.artists(name_ko);

-- ─────────────────────────────────────────────────────────────
-- 3. fandoms : 유저-아티스트 N:M (최애 + 입덕시점)
-- ─────────────────────────────────────────────────────────────
create table public.fandoms (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  artist_id    uuid not null references public.artists(id) on delete cascade,
  is_primary   boolean not null default false,
  joined_at    date,
  created_at   timestamptz not null default now(),
  unique (user_id, artist_id)
);

create index fandoms_user_id_idx on public.fandoms(user_id);
create index fandoms_artist_id_idx on public.fandoms(artist_id);

-- 사용자당 최애(primary)는 최대 1개
create unique index fandoms_one_primary_per_user
  on public.fandoms(user_id) where is_primary;

-- ─────────────────────────────────────────────────────────────
-- 4. expense_categories : 지출 카테고리 (시스템 기본 + 유저 커스텀)
-- ─────────────────────────────────────────────────────────────
create table public.expense_categories (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references public.profiles(id) on delete cascade,
  slug         text not null,
  name         text not null,
  icon         text,
  is_goods     boolean not null default false,
  sort_order   int not null default 100,
  created_at   timestamptz not null default now(),
  unique (user_id, slug)
);

-- 시스템 기본 카테고리 (user_id = null)
insert into public.expense_categories (slug, name, icon, is_goods, sort_order) values
  ('album',    '앨범',     '💿', true,  10),
  ('photocard','포카',     '🎴', true,  20),
  ('goods',    '굿즈',     '🧸', true,  30),
  ('lightstick','응원봉',  '🪄', true,  40),
  ('concert',  '콘서트',   '🎤', false, 50),
  ('fanmeet',  '팬미팅',   '💞', false, 60),
  ('streaming','스밍',     '🎧', false, 70),
  ('vote',     '투표',     '🗳️', false, 80),
  ('etc',      '기타',     '✨', false, 99);

-- ─────────────────────────────────────────────────────────────
-- 5. expense_records : 지출 기록 (덕력의 원본)
-- ─────────────────────────────────────────────────────────────
create table public.expense_records (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  artist_id     uuid not null references public.artists(id) on delete restrict,
  category_id   uuid not null references public.expense_categories(id) on delete restrict,
  amount        bigint not null check (amount >= 0),
  title         text not null,
  memo          text,
  spent_on      date not null default current_date,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index expense_records_user_artist_date_idx
  on public.expense_records(user_id, artist_id, spent_on desc);
create index expense_records_user_date_idx
  on public.expense_records(user_id, spent_on desc);
create index expense_records_artist_idx
  on public.expense_records(artist_id);

-- ─────────────────────────────────────────────────────────────
-- 6. goods_items : 굿즈 인벤토리
--    expense_record에서 자동 생성되거나 수동 추가됨
-- ─────────────────────────────────────────────────────────────
create table public.goods_items (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  artist_id       uuid not null references public.artists(id) on delete restrict,
  expense_id      uuid references public.expense_records(id) on delete set null,
  name            text not null,
  category_slug   text not null default 'goods',
  image_url       text,
  status          text not null default 'owned'
                  check (status in ('owned', 'want_to_sell', 'want_to_buy', 'sold', 'gone')),
  note            text,
  acquired_on     date,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index goods_items_user_idx on public.goods_items(user_id);
create index goods_items_status_idx on public.goods_items(status);
create index goods_items_artist_idx on public.goods_items(artist_id);

-- ─────────────────────────────────────────────────────────────
-- 7. 집계 뷰 : 랭킹 + 카드 데이터
-- ─────────────────────────────────────────────────────────────

-- 유저 × 아티스트 × 월별 합산
create view public.v_user_artist_monthly as
select
  user_id,
  artist_id,
  date_trunc('month', spent_on)::date as month,
  sum(amount)::bigint as total,
  count(*) as record_count
from public.expense_records
group by user_id, artist_id, date_trunc('month', spent_on);

-- 유저 × 아티스트 전체 합산 (덕력 카드 핵심 데이터)
create view public.v_user_artist_total as
select
  user_id,
  artist_id,
  sum(amount)::bigint as total,
  count(*) as record_count,
  min(spent_on) as first_spent_on,
  max(spent_on) as last_spent_on
from public.expense_records
group by user_id, artist_id;

-- 아티스트별 팬 전체 랭킹 (덕력 랭킹 페이지용)
create view public.v_artist_ranking as
select
  r.artist_id,
  r.user_id,
  p.nickname,
  p.handle,
  p.avatar_url,
  p.is_anonymous_ranking,
  sum(r.amount)::bigint as total,
  count(*) as record_count,
  rank() over (partition by r.artist_id order by sum(r.amount) desc) as rnk
from public.expense_records r
join public.profiles p on p.id = r.user_id
group by r.artist_id, r.user_id, p.nickname, p.handle, p.avatar_url, p.is_anonymous_ranking;

-- ─────────────────────────────────────────────────────────────
-- 8. RLS (Row Level Security)
-- ─────────────────────────────────────────────────────────────
alter table public.profiles            enable row level security;
alter table public.fandoms             enable row level security;
alter table public.expense_categories  enable row level security;
alter table public.expense_records     enable row level security;
alter table public.goods_items         enable row level security;
alter table public.artists             enable row level security;

-- profiles : 본인만 수정, 다른 사람도 조회 가능 (랭킹에서 노출되니까)
create policy "profiles select all"  on public.profiles for select using (true);
create policy "profiles update self" on public.profiles for update using (auth.uid() = id);
create policy "profiles insert self" on public.profiles for insert with check (auth.uid() = id);

-- artists : 모두 조회 가능, 수정은 service_role만 (관리자)
create policy "artists select all" on public.artists for select using (true);

-- fandoms : 본인 것만
create policy "fandoms self all" on public.fandoms
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- expense_categories : 시스템(null) + 본인 것만 조회 / 본인 것만 쓰기
create policy "categories select"
  on public.expense_categories for select
  using (user_id is null or user_id = auth.uid());
create policy "categories modify self"
  on public.expense_categories for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- expense_records : 본인만 (랭킹은 view를 통해 집계만 노출)
create policy "expenses self all" on public.expense_records
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- goods_items : 본인만 + 판매희망은 다른 유저도 조회 가능 (Phase 2)
create policy "goods select self or for_sale"
  on public.goods_items for select
  using (auth.uid() = user_id or status = 'want_to_sell');
create policy "goods modify self"
  on public.goods_items for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- 9. 시드 데이터 : 인기 아티스트 일부 (필요시 어드민에서 추가)
-- ─────────────────────────────────────────────────────────────
insert into public.artists (slug, name_ko, name_en, agency, kind, debut_year) values
  ('qwer',         'QWER',      'QWER',          '타마고프로덕션', 'group', 2023),
  ('ive',          '아이브',     'IVE',           '스타쉽',         'group', 2021),
  ('newjeans',     '뉴진스',     'NewJeans',      'ADOR',          'group', 2022),
  ('lesserafim',   '르세라핌',   'LE SSERAFIM',   '쏘스뮤직',       'group', 2022),
  ('aespa',        '에스파',     'aespa',         'SM',            'group', 2020),
  ('itzy',         '있지',       'ITZY',          'JYP',           'group', 2019),
  ('twice',        '트와이스',    'TWICE',         'JYP',           'group', 2015),
  ('bts',          '방탄소년단',  'BTS',           '하이브',         'group', 2013),
  ('seventeen',    '세븐틴',     'SEVENTEEN',     '플레디스',       'group', 2015),
  ('stray-kids',   '스트레이키즈','Stray Kids',    'JYP',           'group', 2018),
  ('txt',          '투모로우바이투게더','TXT',     '빅히트',         'group', 2019),
  ('enhypen',      '엔하이픈',   'ENHYPEN',       '빌리프랩',       'group', 2020),
  ('riize',        '라이즈',     'RIIZE',         'SM',            'group', 2023),
  ('boynextdoor',  '보이넥스트도어','BOYNEXTDOOR', '한솝뮤직',      'group', 2023),
  ('illit',        '아일릿',     'ILLIT',         '빌리프랩',       'group', 2024)
on conflict (slug) do nothing;

-- ─────────────────────────────────────────────────────────────
-- 10. helper RPC : 지출 기록 + 굿즈 자동 생성을 한 트랜잭션으로
-- ─────────────────────────────────────────────────────────────
create or replace function public.add_expense_with_goods(
  p_artist_id   uuid,
  p_category_id uuid,
  p_amount      bigint,
  p_title       text,
  p_memo        text,
  p_spent_on    date,
  p_make_goods  boolean default false
)
returns public.expense_records
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_record  public.expense_records;
  v_is_goods boolean;
begin
  if v_user_id is null then
    raise exception 'not authenticated';
  end if;

  insert into public.expense_records
    (user_id, artist_id, category_id, amount, title, memo, spent_on)
  values
    (v_user_id, p_artist_id, p_category_id, p_amount, p_title, p_memo, coalesce(p_spent_on, current_date))
  returning * into v_record;

  select is_goods into v_is_goods from public.expense_categories where id = p_category_id;

  if p_make_goods or coalesce(v_is_goods, false) then
    insert into public.goods_items
      (user_id, artist_id, expense_id, name, category_slug, acquired_on)
    select
      v_user_id, p_artist_id, v_record.id, p_title, c.slug, v_record.spent_on
    from public.expense_categories c where c.id = p_category_id;
  end if;

  return v_record;
end;
$$;

grant execute on function public.add_expense_with_goods(uuid, uuid, bigint, text, text, date, boolean) to authenticated;
