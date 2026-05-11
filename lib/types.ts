export type Profile = {
  id: string;
  nickname: string;
  handle: string | null;
  avatar_url: string | null;
  bio: string | null;
  is_anonymous_ranking: boolean;
  created_at: string;
  updated_at: string;
};

export type Artist = {
  id: string;
  slug: string;
  name_ko: string;
  name_en: string | null;
  agency: string | null;
  kind: 'group' | 'solo';
  debut_year: number | null;
  image_url: string | null;
  created_at: string;
};

export type ArtistBasic = Pick<Artist, 'id' | 'slug' | 'name_ko' | 'name_en'>;

export type Fandom = {
  id: string;
  user_id: string;
  artist_id: string;
  is_primary: boolean;
  joined_at: string | null;
  created_at: string;
};

export type FandomWithArtist = Fandom & {
  artists: ArtistBasic;
};

export type ExpenseCategory = {
  id: string;
  user_id: string | null;
  slug: string;
  name: string;
  icon: string | null;
  is_goods: boolean;
  sort_order: number;
  created_at: string;
};

export type ExpenseRecord = {
  id: string;
  user_id: string;
  artist_id: string;
  category_id: string;
  amount: number;
  title: string;
  memo: string | null;
  spent_on: string;
  created_at: string;
  updated_at: string;
};

export type ExpenseRecordWithRelations = ExpenseRecord & {
  artists: Pick<Artist, 'name_ko'> | null;
  expense_categories: Pick<ExpenseCategory, 'icon' | 'name' | 'slug'> | null;
};

export type GoodsItem = {
  id: string;
  user_id: string;
  artist_id: string;
  expense_id: string | null;
  name: string;
  category_slug: string;
  image_url: string | null;
  status: 'owned' | 'want_to_sell' | 'want_to_buy' | 'sold' | 'gone';
  note: string | null;
  acquired_on: string | null;
  created_at: string;
  updated_at: string;
};

export type GoodsStatus = GoodsItem['status'];

export type GoodsItemWithArtist = GoodsItem & {
  artists: Pick<Artist, 'name_ko'> | null;
};

export type UserArtistTotal = {
  user_id: string;
  artist_id: string;
  total: number;
  record_count: number;
  first_spent_on: string | null;
  last_spent_on: string | null;
};

export type UserArtistMonthly = {
  user_id: string;
  artist_id: string;
  month: string;
  total: number;
  record_count: number;
};

export type ArtistRankingRow = {
  artist_id: string;
  user_id: string;
  nickname: string;
  handle: string | null;
  avatar_url: string | null;
  is_anonymous_ranking: boolean;
  total: number;
  record_count: number;
  rnk: number;
};

export type ArtistRankingMonthlyRow = ArtistRankingRow & {
  month: string;
};
