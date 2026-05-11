import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatKrw } from "@/lib/format";
import type { Artist, ArtistRankingRow } from "@/lib/types";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ month?: string }>;
};

type RankedRow = {
  user_id: string;
  nickname: string;
  handle: string | null;
  is_anonymous_ranking: boolean;
  total: number;
  record_count: number;
  rnk: number;
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return { title: `${slug} 랭킹` };
}

export default async function ArtistRankingPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;

  const supabase = await createClient();
  const adminClient = createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const currentUserId = user?.id ?? null;

  const { data: artistData } = await adminClient
    .from("artists")
    .select("id, slug, name_ko, name_en, agency, kind, debut_year, image_url, created_at")
    .eq("slug", slug)
    .single();

  if (!artistData) notFound();
  const artist = artistData as Artist;

  const month = sp.month ?? "";

  let rows: RankedRow[] = [];

  if (month) {
    const monthDate = `${month}-01`;

    const { data: monthlyData } = await adminClient
      .from("v_user_artist_monthly")
      .select("user_id, total, record_count")
      .eq("artist_id", artist.id)
      .eq("month", monthDate);

    const sorted = [...((monthlyData ?? []) as Array<{ user_id: unknown; total: unknown; record_count: unknown }>)]
      .sort((a, b) => Number(b.total) - Number(a.total))
      .slice(0, 100);

    const userIds = sorted.map((r) => String(r.user_id));

    let profileMap: Map<string, { nickname: string; handle: string | null; is_anonymous_ranking: boolean }> =
      new Map();

    if (userIds.length > 0) {
      const { data: profilesData } = await adminClient
        .from("profiles")
        .select("id, nickname, handle, is_anonymous_ranking")
        .in("id", userIds);
      profileMap = new Map(
        ((profilesData ?? []) as Array<{ id: string; nickname: string; handle: string | null; is_anonymous_ranking: boolean }>).map(
          (p) => [p.id, p]
        )
      );
    }

    rows = sorted.map((r, i) => {
      const p = profileMap.get(String(r.user_id));
      return {
        user_id: String(r.user_id),
        nickname: p?.nickname ?? "알 수 없음",
        handle: p?.handle ?? null,
        is_anonymous_ranking: p?.is_anonymous_ranking ?? false,
        total: Number(r.total),
        record_count: Number(r.record_count),
        rnk: i + 1,
      };
    });
  } else {
    const { data: rankingData } = await adminClient
      .from("v_artist_ranking")
      .select(
        "artist_id, user_id, nickname, handle, avatar_url, is_anonymous_ranking, total, record_count, rnk"
      )
      .eq("artist_id", artist.id)
      .order("rnk", { ascending: true })
      .limit(100);

    rows = ((rankingData ?? []) as ArtistRankingRow[]).map((r) => ({
      user_id: r.user_id,
      nickname: r.nickname,
      handle: r.handle,
      is_anonymous_ranking: r.is_anonymous_ranking,
      total: Number(r.total),
      record_count: Number(r.record_count),
      rnk: r.rnk,
    }));
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Link href="/ranking" className="btn-ghost text-xs">
          ← 랭킹 목록
        </Link>
        <h1 className="text-xl font-black">{artist.name_ko} 랭킹</h1>
      </div>

      {/* Month filter */}
      <form method="GET" className="flex items-center gap-2">
        <input
          type="month"
          name="month"
          defaultValue={month}
          className="input w-auto text-sm"
        />
        <button type="submit" className="btn-ghost text-xs">
          적용
        </button>
        {month && (
          <Link href={`/ranking/${slug}`} className="btn-ghost text-xs">
            초기화
          </Link>
        )}
      </form>

      {month && (
        <p className="text-xs text-duck-900/50">{month} 월간 랭킹</p>
      )}

      {/* Ranking table */}
      {rows.length > 0 ? (
        <div className="space-y-2">
          {rows.map((row) => {
            const displayName = row.is_anonymous_ranking ? "익명 팬" : row.nickname;
            const isMine = row.user_id === currentUserId;
            return (
              <div
                key={row.user_id}
                className={`card flex items-center gap-3 py-3 ${isMine ? "bg-duck-100" : ""}`}
              >
                <span
                  className={`w-8 text-center text-sm font-black ${
                    row.rnk <= 3 ? "text-duck-600" : "text-duck-900/40"
                  }`}
                >
                  {row.rnk}
                </span>
                <div className="flex-1">
                  <p className="text-sm font-semibold">
                    {displayName}
                    {isMine && (
                      <span className="ml-1 text-xs text-duck-500">나</span>
                    )}
                  </p>
                  <p className="text-xs text-duck-900/50">{row.record_count}건</p>
                </div>
                <p className="text-sm font-bold text-duck-700">{formatKrw(row.total)}</p>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card py-10 text-center text-sm text-duck-900/50">
          {month ? "이 달엔 기록이 없어요." : "아직 기록이 없어요."}
        </div>
      )}
    </div>
  );
}
