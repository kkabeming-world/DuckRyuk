import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "이메일 인증 확인 중" };

export default async function VerifyPendingPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; sent?: string; error?: string }>;
}) {
  const sp = await searchParams;
  const email = (sp.email ?? "").trim();

  async function resend(formData: FormData) {
    "use server";
    const address = String(formData.get("email") ?? "").trim();
    if (!address) {
      redirect(`/auth/verify-pending?error=${encodeURIComponent("이메일이 없어요. 다시 로그인해주세요.")}`);
    }
    const supabase = await createClient();
    const { error } = await supabase.auth.resend({ type: "signup", email: address });
    if (error) {
      redirect(
        `/auth/verify-pending?email=${encodeURIComponent(address)}&error=${encodeURIComponent(error.message)}`
      );
    }
    redirect(`/auth/verify-pending?email=${encodeURIComponent(address)}&sent=1`);
  }

  const maskedEmail = email
    ? email.replace(/^(.).+(.@.+)$/, (_, a: string, b: string) => `${a}***${b}`)
    : "";

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
      <div className="card space-y-4 text-center">
        <p className="text-4xl">📬</p>
        <h1 className="text-xl font-black">이메일 인증 확인 중이에요</h1>
        <p className="text-sm text-duck-900/70 leading-relaxed">
          {email ? (
            <>
              <span className="font-semibold">{maskedEmail}</span> 로 보낸<br />
              가입 확인 메일을 아직 클릭하지 않은 상태예요.<br />
              받은 편지함(스팸함도)에서 링크를 눌러 인증을 완료해주세요.
            </>
          ) : (
            <>
              가입 확인 메일을 아직 클릭하지 않은 상태예요.<br />
              받은 편지함에서 링크를 눌러 인증을 완료해주세요.
            </>
          )}
        </p>

        {sp.sent && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            확인 메일을 다시 보냈어요. 잠시 후 받은 편지함을 확인해주세요.
          </div>
        )}

        {sp.error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {sp.error}
          </div>
        )}

        {email && (
          <form action={resend} className="pt-2">
            <input type="hidden" name="email" value={email} />
            <button type="submit" className="btn-primary w-full">
              확인 메일 다시 보내기
            </button>
          </form>
        )}

        <div className="flex flex-col gap-2 pt-1">
          <Link href="/login" className="btn-ghost w-full">
            로그인으로 돌아가기
          </Link>
          {!email && (
            <Link href="/signup" className="text-sm text-duck-600 underline">
              아직 가입 전이라면 가입하기
            </Link>
          )}
        </div>

        <p className="pt-2 text-xs text-duck-900/50 leading-relaxed">
          메일이 안 보이면 도메인 차단 설정이나 스팸함을 한 번 더 확인해주세요.
          그래도 못 받았으면 위 버튼으로 다시 보내볼 수 있어요.
        </p>
      </div>
    </main>
  );
}
