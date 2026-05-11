import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { ExpenseCategory, ExpenseRecord, FandomWithArtist } from "@/lib/types";
import DeleteConfirm from "./DeleteConfirm";

export const metadata = { title: "기록 수정" };

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
};

export default async function EditExpensePage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: recordData } = await supabase
    .from("expense_records")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();
  if (!recordData) notFound();
  const record = recordData as ExpenseRecord;

  const { data: fandomsData } = await supabase
    .from("fandoms")
    .select("artist_id, is_primary, artists(id, slug, name_ko, name_en)")
    .eq("user_id", user.id)
    .order("is_primary", { ascending: false });
  const fandoms = (fandomsData ?? []) as FandomWithArtist[];

  const { data: categoriesData } = await supabase
    .from("expense_categories")
    .select("*")
    .or(`user_id.is.null,user_id.eq.${user.id}`)
    .order("sort_order");
  const categories = (categoriesData ?? []) as ExpenseCategory[];

  async function updateExpense(formData: FormData) {
    "use server";
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const artistId = String(formData.get("artist_id") ?? "");
    const categoryId = String(formData.get("category_id") ?? "");
    const amountRaw = Number(formData.get("amount"));
    const title = String(formData.get("title") ?? "").trim();
    const memo = String(formData.get("memo") ?? "").trim() || null;
    const spentOn = String(formData.get("spent_on") ?? "");

    if (!title) {
      redirect(`/expenses/${id}/edit?error=` + encodeURIComponent("제목을 입력해주세요"));
    }
    if (!Number.isInteger(amountRaw) || amountRaw < 0) {
      redirect(
        `/expenses/${id}/edit?error=` + encodeURIComponent("금액은 0 이상의 정수여야 해요")
      );
    }

    const { error } = await supabase
      .from("expense_records")
      .update({ artist_id: artistId, category_id: categoryId, amount: amountRaw, title, memo, spent_on: spentOn })
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      redirect(`/expenses/${id}/edit?error=` + encodeURIComponent(error.message));
    }

    redirect("/expenses");
  }

  async function deleteExpense() {
    "use server";
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    await supabase
      .from("expense_records")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    redirect("/expenses");
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Link href="/expenses" className="btn-ghost text-xs">
          ← 목록
        </Link>
        <h1 className="text-xl font-black">기록 수정</h1>
      </div>

      {sp.error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {sp.error}
        </div>
      )}

      <form action={updateExpense} className="card space-y-4">
        <div>
          <label className="label" htmlFor="artist_id">
            아티스트
          </label>
          <select id="artist_id" name="artist_id" required className="input">
            {fandoms.map((f) => (
              <option
                key={f.artist_id}
                value={f.artist_id}
                selected={f.artist_id === record.artist_id}
              >
                {f.artists?.name_ko}
                {f.is_primary ? " ★" : ""}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="category_id">
            카테고리
          </label>
          <select id="category_id" name="category_id" required className="input">
            {categories.map((c) => (
              <option
                key={c.id}
                value={c.id}
                selected={c.id === record.category_id}
              >
                {c.icon} {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="amount">
            금액 (원)
          </label>
          <input
            id="amount"
            name="amount"
            type="number"
            min={0}
            step={1}
            required
            defaultValue={record.amount}
            className="input"
          />
        </div>
        <div>
          <label className="label" htmlFor="title">
            제목
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            maxLength={100}
            defaultValue={record.title}
            className="input"
          />
        </div>
        <div>
          <label className="label" htmlFor="memo">
            메모 (선택)
          </label>
          <input
            id="memo"
            name="memo"
            type="text"
            maxLength={200}
            defaultValue={record.memo ?? ""}
            className="input"
          />
        </div>
        <div>
          <label className="label" htmlFor="spent_on">
            날짜
          </label>
          <input
            id="spent_on"
            name="spent_on"
            type="date"
            required
            defaultValue={record.spent_on}
            className="input"
          />
        </div>
        <button type="submit" className="btn-primary w-full">
          저장
        </button>
      </form>

      <div className="card">
        <p className="mb-3 text-sm font-semibold text-duck-900/70">위험 구역</p>
        <DeleteConfirm action={deleteExpense} />
      </div>
    </div>
  );
}
