import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { ExpenseCategory, FandomWithArtist } from "@/lib/types";
import ExpenseForm from "./ExpenseForm";

export const metadata = { title: "기록 추가" };

export default async function NewExpensePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Check fandoms — if none, redirect to onboarding
  const { data: fandomsData } = await supabase
    .from("fandoms")
    .select("artist_id, is_primary, artists(id, slug, name_ko, name_en)")
    .eq("user_id", user.id)
    .order("is_primary", { ascending: false });
  const fandoms = (fandomsData ?? []) as unknown as FandomWithArtist[];

  if (fandoms.length === 0) {
    redirect("/onboarding");
  }

  // Categories: system + user custom
  const { data: categoriesData } = await supabase
    .from("expense_categories")
    .select("*")
    .or(`user_id.is.null,user_id.eq.${user.id}`)
    .order("sort_order");
  const categories = (categoriesData ?? []) as ExpenseCategory[];

  async function addExpense(formData: FormData) {
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
    const makeGoods = formData.get("make_goods") === "on";

    if (!artistId || !categoryId) {
      redirect("/expenses/new?error=" + encodeURIComponent("아티스트와 카테고리를 선택해주세요"));
    }
    if (!Number.isInteger(amountRaw) || amountRaw < 0) {
      redirect("/expenses/new?error=" + encodeURIComponent("금액은 0 이상의 정수여야 해요"));
    }
    if (!title) {
      redirect("/expenses/new?error=" + encodeURIComponent("제목을 입력해주세요"));
    }
    if (!spentOn) {
      redirect("/expenses/new?error=" + encodeURIComponent("날짜를 선택해주세요"));
    }

    const { error } = await supabase.rpc("add_expense_with_goods", {
      p_artist_id: artistId,
      p_category_id: categoryId,
      p_amount: amountRaw,
      p_title: title,
      p_memo: memo,
      p_spent_on: spentOn,
      p_make_goods: makeGoods,
    });

    if (error) {
      redirect("/expenses/new?error=" + encodeURIComponent(error.message));
    }

    redirect("/expenses");
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Link href="/expenses" className="btn-ghost text-xs">
          ← 목록
        </Link>
        <h1 className="text-xl font-black">기록 추가</h1>
      </div>
      <ExpenseForm
        fandoms={fandoms}
        categories={categories}
        action={addExpense}
        error={sp.error}
      />
    </div>
  );
}
