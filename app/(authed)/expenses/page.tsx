import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatKrw, formatYearMonth } from "@/lib/format";
import type { ExpenseRecordWithRelations, FandomWithArtist } from "@/lib/types";

export const metadata = { title: "지출 기록" };

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ artist_id?: string; month?: string }>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // User's fandoms for artist chips
  const { data: fandomsData } = await supabase
    .from("fandoms")
    .select("artist_id, is_primary, artists(id, slug, name_ko, name_en)")
    .eq("user_id", user.id)
    .order("is_primary", { ascending: false });
  const fandoms = (fandomsData ?? []) as unknown as FandomWithArtist[];

  const currentMonth = formatYearMonth(new Date());
  const activeMonth = sp.month ?? currentMonth;
  const activeArtistId = sp.artist_id ?? "";

  // Build query
  let query = supabase
    .from("expense_records")
    .select(
      "id, amount, title, spent_on, artist_id, category_id, artists(name_ko), expense_categories(icon, name, slug)"
    )
    .eq("user_id", user.id)
    .gte("spent_on", `${activeMonth}-01`)
    .lte("spent_on", `${activeMonth}-31`)
    .order("spent_on", { ascending: false })
    .order("created_at", { ascending: false });

  if (activeArtistId) {
    query = query.eq("artist_id", activeArtistId);
  }

  const { data: recordsData } = await query;
  const records = (recordsData ?? []) as unknown as ExpenseRecordWithRelations[];
  const totalAmount = records.reduce((s, r) => s + Number(r.amount), 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-black">지출 기록</h1>
        <Link href="/expenses/new" className="btn-primary text-xs">
          + 기록 추가
        </Link>
      </div>

      {/* Month filter */}
      <form method="GET" className="flex items-center gap-2">
        {activeArtistId && (
          <input type="hidden" name="artist_id" value={activeArtistId} />
        )}
        <input
          type="month"
          name="month"
          defaultValue={activeMonth}
          className="input w-auto text-sm"
        />
        <button type="submit" className="btn-ghost text-xs">
          적용
        </button>
      </form>

      {/* Artist chips */}
      <div className="flex flex-wrap gap-2">
        <Link
          href={`/expenses?month=${activeMonth}`}
          className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
            !activeArtistId
              ? "bg-duck-500 text-white"
              : "bg-duck-100 text-duck-700 hover:bg-duck-200"
          }`}
        >
          전체
        </Link>
        {fandoms.map((f) => (
          <Link
            key={f.artist_id}
            href={`/expenses?artist_id=${f.artist_id}&month=${activeMonth}`}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
              activeArtistId === f.artist_id
                ? "bg-duck-500 text-white"
                : "bg-duck-100 text-duck-700 hover:bg-duck-200"
            }`}
          >
            {f.artists?.name_ko}
          </Link>
        ))}
      </div>

      {/* Summary */}
      {records.length > 0 && (
        <div className="rounded-xl bg-duck-50 px-4 py-3 text-sm">
          <span className="text-duck-900/60">{records.length}건 합계: </span>
          <span className="font-bold text-duck-700">{formatKrw(totalAmount)}</span>
        </div>
      )}

      {/* Records list */}
      {records.length > 0 ? (
        <div className="space-y-2">
          {records.map((r) => (
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
        <div className="card py-10 text-center text-sm text-duck-900/50">
          이 기간엔 기록이 없어요.
        </div>
      )}
    </div>
  );
}
