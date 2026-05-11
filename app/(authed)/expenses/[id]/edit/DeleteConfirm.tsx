"use client";

import { useState } from "react";

type Props = {
  action: (formData: FormData) => Promise<void>;
};

export default function DeleteConfirm({ action }: Props) {
  const [confirming, setConfirming] = useState(false);

  return (
    <div>
      {!confirming ? (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="btn text-sm text-red-600 hover:bg-red-50"
        >
          삭제하기
        </button>
      ) : (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2">
          <p className="text-sm text-red-700">정말 삭제하시겠어요?</p>
          <form action={action}>
            <button
              type="submit"
              className="btn rounded-lg bg-red-500 px-2 py-1 text-xs text-white hover:bg-red-600"
            >
              네, 삭제
            </button>
          </form>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="btn-ghost text-xs"
          >
            취소
          </button>
        </div>
      )}
    </div>
  );
}
