import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Artist, FandomWithArtist } from "@/lib/types";

export const metadata = { title: "랭킹" };

export default async function RankingPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: fandomsData } = await supabase
    .from("fandoms")
    .select("artist_id, is_primary, artists(id, slug, name_ko, name_en)")
    .eq("user_id", user.id)
    .order("is_primary", { ascending: false });
  const fandoms = (fandomsData ?? []) as unknown as FandomWithArtist[];

  const q = sp.q?.trim() ?? "";
  let searchResults: Pick<Artist, "id" | "slug" | "name_ko" | "name_en">[] = [];
  if (q) {
    const { data } = await supabase
      .from("artists")
      .select("id, slug, name_ko, name_en")
      .or(`name_ko.ilike.%${q}%,name_en.ilike.%${q}%,slug.ilike.%${q}%`)
      .limit(20);
    searchResults = (data ?? []) as Pick<Artist, "id" | "slug" | "name_ko" | "name_en">[];
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-black">랭킹</h1>

      {/* My fandoms */}
      {fandoms.length > 0 ? (
        <div>
          <h2 className="mb-3 text-sm font-bold text-duck-900/60">내 최애 아티스트</h2>
          <div className="grid grid-cols-2 gap-3">
            {fandoms.map((f) => (
              <Link
                key={f.artist_id}
                href={`/ranking/${f.artists?.slug ?? ""}`}
                className="card text-center transition hover:bg-duck-50"
              >
                <p className="text-sm font-bold">{f.artists?.name_ko}</p>
                {f.is_primary && (
                  <p className="mt-0.5 text-xs text-duck-500">★ 최애</p>
                )}
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <div className="card py-8 text-center text-sm text-duck-900/50">
          아직 관심 아티스트가 없어요.{" "}
          <Link href="/onboarding" className="font-semibold text-duck-600 underline">
            지금 추가하기
          </Link>
        </div>
      )}

      {/* Artist search */}
      <div>
        <h2 className="mb-3 text-sm font-bold text-duck-900/60">아티스트 검색</h2>
        <form method="GET" className="flex gap-2">
          <input
            type="text"
            name="q"
            defaultValue={q}
            className="input flex-1"
            placeholder="아티스트 이름 또는 슬러그"
          />
          <button type="submit" className="btn-primary text-sm">
            검색
          </button>
        </form>

        {q && (
          <div className="mt-3 space-y-2">
            {searchResults.length > 0 ? (
              searchResults.map((a) => (
                <Link
                  key={a.id}
                  href={`/ranking/${a.slug}`}
                  className="card flex items-center justify-between py-3 transition hover:bg-duck-50"
                >
                  <div>
                    <p className="text-sm font-semibold">{a.name_ko}</p>
                    {a.name_en && (
                      <p className="text-xs text-duck-900/50">{a.name_en}</p>
                    )}
                  </div>
                  <span className="text-xs text-duck-400">랭킹 보기 →</span>
                </Link>
              ))
            ) : (
              <div className="card py-6 text-center text-sm text-duck-900/50">
                검색 결과가 없어요.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
