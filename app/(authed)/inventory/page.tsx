import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { GoodsItemWithArtist, GoodsStatus } from "@/lib/types";
import StatusSelect from "./StatusSelect";

export const metadata = { title: "굿즈 인벤토리" };

const TABS: { key: GoodsStatus[]; label: string; param: string }[] = [
  { key: ["owned"], label: "보유", param: "owned" },
  { key: ["want_to_sell"], label: "판매희망", param: "want_to_sell" },
  { key: ["want_to_buy"], label: "구매희망", param: "want_to_buy" },
  { key: ["sold", "gone"], label: "처분", param: "disposed" },
];

const STATUS_BADGE: Record<GoodsStatus, string> = {
  owned: "bg-duck-100 text-duck-700",
  want_to_sell: "bg-yellow-100 text-yellow-700",
  want_to_buy: "bg-blue-100 text-blue-700",
  sold: "bg-gray-100 text-gray-600",
  gone: "bg-gray-100 text-gray-600",
};

const STATUS_LABELS: Record<GoodsStatus, string> = {
  owned: "보유",
  want_to_sell: "판매희망",
  want_to_buy: "구매희망",
  sold: "판매됨",
  gone: "처분",
};

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const activeParam = sp.tab ?? "owned";
  const activeTab = TABS.find((t) => t.param === activeParam) ?? TABS[0]!;

  const { data: itemsData } = await supabase
    .from("goods_items")
    .select("*, artists(name_ko)")
    .eq("user_id", user.id)
    .in("status", activeTab.key)
    .order("created_at", { ascending: false });
  const items = (itemsData ?? []) as GoodsItemWithArtist[];

  async function updateStatus(formData: FormData) {
    "use server";
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const id = String(formData.get("id") ?? "");
    const status = String(formData.get("status") ?? "") as GoodsStatus;
    await supabase
      .from("goods_items")
      .update({ status })
      .eq("id", id)
      .eq("user_id", user.id);

    redirect(`/inventory?tab=${activeParam}`);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-black">굿즈 인벤토리</h1>
        <Link href="/inventory/new" className="btn-primary text-xs">
          + 수동 추가
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-duck-100">
        {TABS.map((t) => (
          <Link
            key={t.param}
            href={`/inventory?tab=${t.param}`}
            className={`px-3 py-2 text-sm font-semibold transition ${
              t.param === activeParam
                ? "border-b-2 border-duck-500 text-duck-700"
                : "text-duck-900/50 hover:text-duck-700"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {/* Items */}
      {items.length > 0 ? (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="card flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">{item.name}</p>
                <p className="mt-0.5 text-xs text-duck-900/60">
                  {item.artists?.name_ko ?? ""}
                  {item.acquired_on ? ` · ${item.acquired_on}` : ""}
                </p>
                <span
                  className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[item.status]}`}
                >
                  {STATUS_LABELS[item.status]}
                </span>
              </div>
              <StatusSelect
                itemId={item.id}
                currentStatus={item.status}
                action={updateStatus}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="card py-10 text-center text-sm text-duck-900/50">
          이 탭에 굿즈가 없어요.
        </div>
      )}
    </div>
  );
}
