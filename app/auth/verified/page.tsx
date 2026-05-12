import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

export const metadata = { title: "이메일 인증 완료" };

export default async function AuthVerifiedPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let nextHref = "/login";
  let nextLabel = "로그인하러 가기";

  if (user) {
    nextHref = "/onboarding";
    nextLabel = "시작하러 가기";

    const { data: profileData } = await supabase
      .from("profiles")
      .select("handle")
      .eq("id", user.id)
      .single();

    const profile = profileData as Pick<Profile, "handle"> | null;

    if (profile?.handle) {
      nextHref = "/dashboard";
      nextLabel = "대시보드로 가기";
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
      <div className="card space-y-4 text-center">
        <p className="text-4xl">✅</p>
        <h1 className="text-xl font-black">이메일 인증이 완료됐어요</h1>
        <p className="text-sm leading-relaxed text-duck-900/70">
          메일 확인이 끝났어요.
          <br />
          이제 바로 덕력 서비스를 시작하면 돼요.
        </p>

        <div className="pt-2">
          <Link href={nextHref} className="btn-primary w-full">
            {nextLabel}
          </Link>
        </div>
      </div>
    </main>
  );
}
