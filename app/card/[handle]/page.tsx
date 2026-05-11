import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatKrw } from "@/lib/format";
import ShareButton from "./ShareButton";
import type { Profile, UserArtistTotal } from "@/lib/types";

type Props = {
  params: Promise<{ handle: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  const supabase = createAdminClient();

  const { data: profileData } = await supabase
    .from("profiles")
    .select("id, nickname, is_anonymous_ranking")
    .eq("handle", handle)
    .single();

  if (!profileData) return { title: "덕력 카드" };

  const profile = profileData as Pick<Profile, "id" | "nickname" | "is_anonymous_ranking">;
  const displayName = profile.is_anonymous_ranking ? "익명 팬" : profile.nickname;

  const { data: totalsData } = await supabase
    .from("v_user_artist_total")
    .select("total")
    .eq("user_id", profile.id);
  const total = (totalsData ?? []).reduce((s: number, r: { total: unknown }) => s + Number(r.total), 0);

  const title = `${displayName}의 덕력은 ${formatKrw(total)}`;
  const description = "#나의덕력 #덕력인증";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: `/api/og/card?handle=${handle}`, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`/api/og/card?handle=${handle}`],
    },
  };
}

export default async function CardPage({ params }: Props) {
  const { handle } = await params;
  const supabase = createAdminClient();

  const { data: profileData } = await supabase
    .from("profiles")
    .select("*")
    .eq("handle", handle)
    .single();

  if (!profileData) notFound();
  const profile = profileData as Profile;

  const displayName = profile.is_anonymous_ranking ? "익명 팬" : profile.nickname;

  const { data: primaryFandomData } = await supabase
    .from("fandoms")
    .select("artists(name_ko)")
    .eq("user_id", profile.id)
    .eq("is_primary", true)
    .single();
  const primaryArtistName =
    (primaryFandomData?.artists as unknown as { name_ko: string } | null)?.name_ko ?? null;

  const { data: totalsData } = await supabase
    .from("v_user_artist_total")
    .select("total, record_count, first_spent_on, last_spent_on")
    .eq("user_id", profile.id);
  const totals = (totalsData ?? []) as UserArtistTotal[];

  const grandTotal = totals.reduce((s, r) => s + Number(r.total), 0);
  const recordCount = totals.reduce((s, r) => s + Number(r.record_count), 0);
  const firstSpentOn =
    totals
      .map((r) => r.first_spent_on)
      .filter((d): d is string => d !== null)
      .sort()[0] ?? null;
  const lastSpentOn =
    totals
      .map((r) => r.last_spent_on)
      .filter((d): d is string => d !== null)
      .sort()
      .reverse()[0] ?? null;

  const { data: expRecords } = await supabase
    .from("expense_records")
    .select("category_id, amount")
    .eq("user_id", profile.id);

  const categoryTotals: Record<string, number> = {};
  for (const r of expRecords ?? []) {
    const catId = r.category_id as string;
    categoryTotals[catId] = (categoryTotals[catId] ?? 0) + Number(r.amount);
  }

  const sortedCatIds = Object.entries(categoryTotals)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([id]) => id);

  type CatRow = { id: string; icon: string | null; name: string; total: number };
  let topCategories: CatRow[] = [];
  if (sortedCatIds.length > 0) {
    const { data: catsData } = await supabase
      .from("expense_categories")
      .select("id, icon, name")
      .in("id", sortedCatIds);
    topCategories = ((catsData ?? []) as Array<{ id: string; icon: string | null; name: string }>)
      .map((c) => ({ ...c, total: categoryTotals[c.id] ?? 0 }))
      .sort((a, b) => b.total - a.total);
  }

  const periodText =
    firstSpentOn && lastSpentOn
      ? `${firstSpentOn.slice(0, 7)} ~ ${lastSpentOn.slice(0, 7)}`
      : null;

  return (
    <main className="min-h-screen bg-gradient-to-b from-duck-50 to-white px-4 py-12">
      <div className="mx-auto max-w-sm">
        <div className="card space-y-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-duck-500">
              덕력 카드
            </p>
            <h1 className="mt-1 text-2xl font-black text-duck-900">{displayName}</h1>
            {primaryArtistName && (
              <p className="mt-0.5 text-sm text-duck-900/60">{primaryArtistName} 팬</p>
            )}
          </div>

          <div className="rounded-2xl bg-duck-50 px-4 py-5">
            <p className="text-xs text-duck-900/60">총 덕력</p>
            <p className="text-4xl font-black text-duck-700">{formatKrw(grandTotal)}</p>
            <p className="mt-1 text-xs text-duck-900/50">총 {recordCount}건</p>
            {periodText && (
              <p className="mt-0.5 text-xs text-duck-900/40">{periodText}</p>
            )}
          </div>

          {topCategories.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold text-duck-900/60">TOP 카테고리</p>
              <div className="flex flex-wrap gap-2">
                {topCategories.map((cat) => (
                  <div
                    key={cat.id}
                    className="flex items-center gap-1 rounded-full bg-duck-100 px-3 py-1"
                  >
                    {cat.icon && <span>{cat.icon}</span>}
                    <span className="text-xs font-medium text-duck-800">{cat.name}</span>
                    <span className="text-xs text-duck-600">{formatKrw(cat.total)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="border-t border-duck-100 pt-3">
            <ShareButton />
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-duck-900/30">#나의덕력 #덕력인증</p>
      </div>
    </main>
  );
}
