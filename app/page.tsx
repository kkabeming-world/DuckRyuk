import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";

export default async function Home() {
  let isLoggedIn = false;
  if (env.supabaseUrl && env.supabaseAnonKey) {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    isLoggedIn = !!data.user;
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col px-6 py-16">
      <div className="mb-12 text-center">
        <p className="mb-2 text-xs font-semibold tracking-widest text-duck-500">
          기록하고 → 자랑하고 → 거래한다
        </p>
        <h1 className="text-5xl font-black tracking-tight">덕력</h1>
        <p className="mt-4 text-sm text-duck-900/70">
          K-pop 팬을 위한 덕질 기록 + 카드 자랑 + 굿즈 인벤토리
        </p>
      </div>

      <div className="card mb-6">
        <h2 className="mb-3 text-base font-bold">이런 게 가능해요</h2>
        <ul className="space-y-2 text-sm text-duck-900/80">
          <li>📒 굿즈·콘서트·앨범 지출 기록 → 카테고리별 자동 합산</li>
          <li>🎴 내 덕력을 카드 이미지로 자랑 (트위터/인스타 공유 최적화)</li>
          <li>🏆 아이돌별 팬 덕력 랭킹</li>
          <li>🧸 구매한 굿즈 인벤토리 자동 정리</li>
        </ul>
      </div>

      <div className="mt-auto flex flex-col gap-3">
        {isLoggedIn ? (
          <Link href="/dashboard" className="btn-primary w-full">대시보드 가기</Link>
        ) : (
          <>
            <Link href="/signup" className="btn-primary w-full">시작하기</Link>
            <Link href="/login" className="btn-ghost w-full">이미 계정이 있어요</Link>
          </>
        )}
      </div>
    </main>
  );
}
