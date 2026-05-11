import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatKrw } from "@/lib/format";
import type { Profile, ExpenseRecordWithRelations, FandomWithArtist } from "@/lib/types";

export const metadata = { title: "대시보드" };

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profileData } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  const profile = profileData as Profile | null;

  // Total stats
  const { data: allRecords } = await supabase
    .from("expense_records")
    .select("amount")
    .eq("user_id", user.id);
  const totalAmount = (allRecords ?? []).reduce((s, r) => s + Number(r.amount), 0);
  const recordCount = (allRecords ?? []).length;

  // Primary fandom
  const { data: primaryFandomData } = await supabase
    .from("fandoms")
    .select("artist_id, artists(id, slug, name_ko, name_en)")
    .eq("user_id", user.id)
    .eq("is_primary", true)
    .single();
  const primaryFandom = primaryFandomData as FandomWithArtist | null;

  // Primary artist total
  let primaryTotal: number | null = null;
  if (primaryFandom) {
    const { data: artistTotals } = await supabase
      .from("v_user_artist_total")
      .select("total")
      .eq("user_id", user.id)
      .eq("artist_id", primaryFandom.artist_id)
      .single();
    if (artistTotals) primaryTotal = Number(artistTotals.total);
  }

  // Recent 5 expense records
  const { data: recentData } = await supabase
    .from("expense_records")
    .select(
      "id, amount, title, spent_on, artist_id, category_id, artists(name_ko), expense_categories(icon, name, slug)"
    )
    .eq("user_id", user.id)
    .order("spent_on", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(5);
  const recent = (recentData ?? []) as unknown as ExpenseRecordWithRelations[];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-duck-500">안녕하세요,</p>
        <h1 className="text-2xl font-black">{profile?.nickname ?? "팬"} 님 👋</h1>
      </div>

      {/* Total stats card */}
      <div className="card">
        <p className="mb-1 text-xs text-duck-900/60">나의 총 덕력</p>
        <p className="text-3xl font-black text-duck-700">{formatKrw(totalAmount)}</p>
        <p className="mt-1 text-xs text-duck-900/50">총 {recordCount}건</p>
        {primaryFandom && primaryTotal !== null && (
          <div className="mt-3 border-t border-duck-100 pt-3">
            <p className="text-xs text-duck-900/60">{primaryFandom.artists?.name_ko} 덕력</p>
            <p className="text-xl font-bold text-duck-600">{formatKrw(primaryTotal)}</p>
          </div>
        )}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/expenses/new" className="card text-center transition hover:bg-duck-50">
          <p className="mb-1 text-2xl">📒</p>
          <p className="text-sm font-semibold">기록 추가</p>
        </Link>
        <Link
          href={profile?.handle ? `/card/${profile.handle}` : "/onboarding"}
          className="card text-center transition hover:bg-duck-50"
        >
          <p className="mb-1 text-2xl">🎴</p>
          <p className="text-sm font-semibold">내 카드</p>
        </Link>
        <Link href="/inventory" className="card text-center transition hover:bg-duck-50">
          <p className="mb-1 text-2xl">🧸</p>
          <p className="text-sm font-semibold">굿즈 인벤</p>
        </Link>
        <Link href="/ranking" className="card text-center transition hover:bg-duck-50">
          <p className="mb-1 text-2xl">🏆</p>
          <p className="text-sm font-semibold">랭킹</p>
        </Link>
      </div>

      {/* Recent records */}
      <div>
        <h2 className="mb-3 text-base font-bold">최근 기록</h2>
        {recent.length > 0 ? (
          <div className="space-y-2">
            {recent.map((r) => (
              <Link
                key={r.id}
                href={`/expenses/${r.id}/edit`}
                className="card flex items-center justify-between py-3 transition hover:bg-duck-50"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{r.expense_categories?.icon ?? "✨"}</span>
                  <div>
                    <p className="text-sm font-medium">{r.title}</p>
                    <p className="text-xs text-duck-900/50">
                      {r.artists?.name_ko} · {r.spent_on}
                    </p>
                  </div>
                </div>
                <p className="text-sm font-bold text-duck-700">{formatKrw(Number(r.amount))}</p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="card py-8 text-center text-sm text-duck-900/50">
            아직 기록이 없어요.{" "}
            <Link href="/expenses/new" className="font-semibold text-duck-600 underline">
              첫 기록 추가하기
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
