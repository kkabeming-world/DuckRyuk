import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "로그인" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string; error?: string }>;
}) {
  const sp = await searchParams;

  async function action(formData: FormData) {
    "use server";
    const supabase = await createClient();
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      redirect(`/login?error=${encodeURIComponent(error.message)}&redirect=${encodeURIComponent(sp.redirect ?? "")}`);
    }
    redirect(sp.redirect && sp.redirect.startsWith("/") ? sp.redirect : "/dashboard");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
      <h1 className="mb-6 text-2xl font-black">로그인</h1>
      {sp.error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {sp.error}
        </div>
      )}
      <form action={action} className="card space-y-3">
        <div>
          <label className="label" htmlFor="email">이메일</label>
          <input id="email" name="email" type="email" required autoComplete="email" className="input" />
        </div>
        <div>
          <label className="label" htmlFor="password">비밀번호</label>
          <input id="password" name="password" type="password" required autoComplete="current-password" className="input" />
        </div>
        <button type="submit" className="btn-primary w-full">로그인</button>
      </form>
      <p className="mt-6 text-center text-sm text-duck-900/70">
        계정이 없어요?{" "}
        <Link href="/signup" className="font-semibold text-duck-600 underline">가입하기</Link>
      </p>
    </main>
  );
}
