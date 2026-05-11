"use client";

import { useEffect, useRef, useState } from "react";
import { formatYearMonth } from "@/lib/format";
import type { ExpenseCategory, FandomWithArtist } from "@/lib/types";

type Props = {
  fandoms: FandomWithArtist[];
  categories: ExpenseCategory[];
  action: (formData: FormData) => Promise<void>;
  error?: string;
};

export default function ExpenseForm({ fandoms, categories, action, error }: Props) {
  const today = new Date().toISOString().split("T")[0] ?? "";
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [makeGoods, setMakeGoods] = useState(categories[0]?.is_goods ?? false);
  const formRef = useRef<HTMLFormElement>(null);

  const selectedCat = categories.find((c) => c.id === categoryId);

  useEffect(() => {
    setMakeGoods(selectedCat?.is_goods ?? false);
  }, [categoryId, selectedCat?.is_goods]);

  return (
    <>
      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}
      <form ref={formRef} action={action} className="card space-y-4">
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
          <label className="label" htmlFor="category_id">
            카테고리
          </label>
          <select
            id="category_id"
            name="category_id"
            required
            className="input"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
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
            className="input"
            placeholder="0"
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
            className="input"
            placeholder="예: 아이브 앨범 IVE MINE"
          />
        </div>
        <div>
          <label className="label" htmlFor="memo">
            메모 (선택)
          </label>
          <input id="memo" name="memo" type="text" maxLength={200} className="input" />
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
            defaultValue={today}
            className="input"
          />
        </div>
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            name="make_goods"
            checked={makeGoods}
            onChange={(e) => setMakeGoods(e.target.checked)}
            className="rounded"
          />
          <span className="text-sm text-duck-900/80">굿즈 인벤토리에 자동 추가</span>
        </label>
        <button type="submit" className="btn-primary w-full">
          기록 추가
        </button>
      </form>
    </>
  );
}
