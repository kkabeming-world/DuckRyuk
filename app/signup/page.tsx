import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "가입하기" };

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; confirm?: string }>;
}) {
  const sp = await searchParams;

  async function action(formData: FormData) {
    "use server";
    const supabase = await createClient();
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");
    const nickname = String(formData.get("nickname") ?? "").trim();

    if (!nickname) {
      redirect("/signup?error=" + encodeURIComponent("닉네임을 입력해주세요"));
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { nickname } },
    });

    if (error) {
      redirect("/signup?error=" + encodeURIComponent(error.message));
    }

    if (data.session) {
      redirect("/onboarding");
    }

    redirect("/signup?confirm=1");
  }

  if (sp.confirm) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
        <div className="card text-center space-y-3">
          <p className="text-4xl">📬</p>
          <h1 className="text-xl font-black">메일 확인해주세요</h1>
          <p className="text-sm text-duck-900/70">
            가입 확인 이메일을 보냈어요. 받은 편지함을 확인하고 링크를 클릭하면 시작할 수 있어요.
          </p>
          <Link href="/login" className="btn-ghost w-full mt-2">로그인으로 가기</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
      <h1 className="mb-6 text-2xl font-black">가입하기</h1>
      {sp.error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {sp.error}
        </div>
      )}
      <form action={action} className="card space-y-3">
        <div>
          <label className="label" htmlFor="nickname">닉네임</label>
          <input
            id="nickname"
            name="nickname"
            type="text"
            required
            maxLength={30}
            className="input"
            placeholder="팬활동 닉네임"
          />
        </div>
        <div>
          <label className="label" htmlFor="email">이메일</label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="input"
          />
        </div>
        <div>
          <label className="label" htmlFor="password">비밀번호</label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            className="input"
          />
        </div>
        <button type="submit" className="btn-primary w-full">시작하기</button>
      </form>
      <p className="mt-6 text-center text-sm text-duck-900/70">
        이미 계정이 있어요?{" "}
        <Link href="/login" className="font-semibold text-duck-600 underline">
          로그인
        </Link>
      </p>
    </main>
  );
}
