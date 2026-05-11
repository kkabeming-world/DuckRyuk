import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { ExpenseCategory, FandomWithArtist, GoodsStatus } from "@/lib/types";

export const metadata = { title: "굿즈 수동 추가" };

const STATUS_OPTIONS: { value: GoodsStatus; label: string }[] = [
  { value: "owned", label: "보유" },
  { value: "want_to_sell", label: "판매희망" },
  { value: "want_to_buy", label: "구매희망" },
];

export default async function NewInventoryPage({
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

  const { data: fandomsData } = await supabase
    .from("fandoms")
    .select("artist_id, is_primary, artists(id, slug, name_ko, name_en)")
    .eq("user_id", user.id)
    .order("is_primary", { ascending: false });
  const fandoms = (fandomsData ?? []) as unknown as FandomWithArtist[];

  if (fandoms.length === 0) redirect("/onboarding");

  const { data: categoriesData } = await supabase
    .from("expense_categories")
    .select("*")
    .is("user_id", null)
    .eq("is_goods", true)
    .order("sort_order");
  const categories = (categoriesData ?? []) as ExpenseCategory[];

  async function addItem(formData: FormData) {
    "use server";
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const artistId = String(formData.get("artist_id") ?? "").trim();
    const name = String(formData.get("name") ?? "").trim();
    const categorySlug = String(formData.get("category_slug") ?? "goods");
    const statusRaw = String(formData.get("status") ?? "owned");
    const acquiredOn = String(formData.get("acquired_on") ?? "").trim() || null;

    if (!name || name.length > 80) {
      redirect("/inventory/new?error=" + encodeURIComponent("이름은 1~80자여야 해요"));
    }
    if (!["owned", "want_to_sell", "want_to_buy"].includes(statusRaw)) {
      redirect("/inventory/new?error=" + encodeURIComponent("올바른 상태를 선택해주세요"));
    }
    const status = statusRaw as GoodsStatus;

    const { error } = await supabase.from("goods_items").insert({
      user_id: user.id,
      artist_id: artistId,
      name,
      category_slug: categorySlug,
      status,
      acquired_on: acquiredOn,
    });

    if (error) {
      redirect("/inventory/new?error=" + encodeURIComponent(error.message));
    }

    redirect(`/inventory?tab=${status}`);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Link href="/inventory" className="btn-ghost text-xs">
          ← 목록
        </Link>
        <h1 className="text-xl font-black">굿즈 수동 추가</h1>
      </div>
      {sp.error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {sp.error}
        </div>
      )}
      <form action={addItem} className="card space-y-4">
        <div>
          <label className="label" htmlFor="artist_id">
            아티스트
          </label>
          <select id="artist_id" name="artist_id" required className="input">
            {fandoms.map((f) => (
              <option key={f.artist_id} value={f.artist_id}>
                {f.artists?.name_ko}
                {f.is_primary ? " ★" : ""}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="name">
            이름
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            maxLength={80}
            className="input"
            placeholder="예: 아이브 포토카드 SET"
          />
        </div>
        <div>
          <label className="label" htmlFor="category_slug">
            카테고리
          </label>
          <select
            id="category_slug"
            name="category_slug"
            className="input"
            defaultValue="goods"
          >
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.icon} {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="status">
            상태
          </label>
          <select id="status" name="status" className="input" defaultValue="owned">
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="acquired_on">
            취득일 (선택)
          </label>
          <input id="acquired_on" name="acquired_on" type="date" className="input" />
        </div>
        <button type="submit" className="btn-primary w-full">
          추가
        </button>
      </form>
    </div>
  );
}
