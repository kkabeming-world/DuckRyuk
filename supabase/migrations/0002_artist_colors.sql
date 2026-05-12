-- 덕력 (Duckryuk) — Artist 컬러/팬덤명/상태 확장
-- 목적: 아티스트별 팬덤 컬러를 앱 키컬러로 사용 + 팬덤명/활동상태 노출

-- ─────────────────────────────────────────────────────────────
-- 1. artists 컬럼 추가
-- ─────────────────────────────────────────────────────────────
alter table public.artists
  add column if not exists fandom_name      text,
  add column if not exists primary_color    text,
  add column if not exists secondary_color  text,
  add column if not exists status           text not null default 'active',
  add column if not exists debut_date       date;

-- 컬러는 #RRGGBB 6자리 hex만 허용 (대소문자 무관, null 허용)
alter table public.artists
  drop constraint if exists artists_primary_color_format,
  add  constraint artists_primary_color_format
    check (primary_color is null or primary_color ~* '^#[0-9a-f]{6}$');

alter table public.artists
  drop constraint if exists artists_secondary_color_format,
  add  constraint artists_secondary_color_format
    check (secondary_color is null or secondary_color ~* '^#[0-9a-f]{6}$');

alter table public.artists
  drop constraint if exists artists_status_check,
  add  constraint artists_status_check
    check (status in ('active', 'hiatus', 'disbanded'));

-- ─────────────────────────────────────────────────────────────
-- 2. 기존 15개 시드 컬러/팬덤명 채우기
--    공식 컬러가 명확하지 않은 팀은 대표 이미지 색상으로 추정. 후속 보정 가능.
-- ─────────────────────────────────────────────────────────────
update public.artists set fandom_name = 'ARMY',    primary_color = '#BEA7E5' where slug = 'bts';
update public.artists set fandom_name = 'DIVE',    primary_color = '#0055FF' where slug = 'ive';
update public.artists set fandom_name = 'Bunnies', primary_color = '#8ECAE6' where slug = 'newjeans';
update public.artists set fandom_name = 'CTRL',    primary_color = '#FF4444' where slug = 'qwer';
update public.artists set fandom_name = 'MY',      primary_color = '#00D4AA' where slug = 'aespa';
update public.artists set fandom_name = 'FEARNOT', primary_color = '#C2A0D8' where slug = 'lesserafim';
update public.artists set fandom_name = 'MIDZY',   primary_color = '#ABCAFC' where slug = 'itzy';
update public.artists set fandom_name = 'ONCE',    primary_color = '#FE7AAF' where slug = 'twice';
update public.artists set fandom_name = 'CARAT',   primary_color = '#FFCFE2' where slug = 'seventeen';
update public.artists set fandom_name = 'STAY',    primary_color = '#1A1A1A' where slug = 'stray-kids';
update public.artists set fandom_name = 'MOA',     primary_color = '#B0E1FF' where slug = 'txt';
update public.artists set fandom_name = 'ENGENE',  primary_color = '#D4252A' where slug = 'enhypen';
update public.artists set fandom_name = 'BRIIZE',  primary_color = '#4A6FA5' where slug = 'riize';
update public.artists set fandom_name = 'ONEDOOR', primary_color = '#FF6F61' where slug = 'boynextdoor';
update public.artists set fandom_name = 'GLLIT',   primary_color = '#B7D7E6' where slug = 'illit';

-- ─────────────────────────────────────────────────────────────
-- 3. v_artist_ranking 뷰 갱신: 컬러/팬덤명도 같이 노출 (랭킹/카드에서 사용)
-- ─────────────────────────────────────────────────────────────
drop view if exists public.v_artist_ranking;
create view public.v_artist_ranking as
select
  r.artist_id,
  a.name_ko       as artist_name_ko,
  a.fandom_name   as artist_fandom_name,
  a.primary_color as artist_primary_color,
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
join public.artists  a on a.id = r.artist_id
group by r.artist_id, a.name_ko, a.fandom_name, a.primary_color,
         r.user_id, p.nickname, p.handle, p.avatar_url, p.is_anonymous_ranking;
