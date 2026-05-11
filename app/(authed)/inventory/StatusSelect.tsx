"use client";

import type { GoodsStatus } from "@/lib/types";

const STATUS_LABELS: Record<GoodsStatus, string> = {
  owned: "보유",
  want_to_sell: "판매희망",
  want_to_buy: "구매희망",
  sold: "판매됨",
  gone: "처분",
};

type Props = {
  itemId: string;
  currentStatus: GoodsStatus;
  action: (formData: FormData) => Promise<void>;
};

export default function StatusSelect({ itemId, currentStatus, action }: Props) {
  return (
    <form action={action}>
      <input type="hidden" name="id" value={itemId} />
      <select
        name="status"
        defaultValue={currentStatus}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="rounded-lg border border-duck-200 bg-white px-2 py-1 text-xs focus:border-duck-400 focus:outline-none"
      >
        {(Object.keys(STATUS_LABELS) as GoodsStatus[]).map((s) => (
          <option key={s} value={s}>
            {STATUS_LABELS[s]}
          </option>
        ))}
      </select>
    </form>
  );
}
