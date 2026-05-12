import Image from "next/image";
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
        <Image src="/logo.svg" alt="덕력 로고" width={420} height={126} className="mx-auto mb-4 h-auto w-full max-w-[420px]" priority />
        <p className="text-sm text-duck-900/70">
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
