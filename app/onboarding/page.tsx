import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Artist, Profile } from "@/lib/types";

export const metadata = { title: "시작하기" };

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profileData } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  const profile = profileData as Profile | null;

  // Already onboarded → redirect to dashboard
  if (profile?.handle) {
    const { data: primaryFandom } = await supabase
      .from("fandoms")
      .select("id")
      .eq("user_id", user.id)
      .eq("is_primary", true)
      .single();

    if (primaryFandom) redirect("/dashboard");
  }

  const { data: artistsData } = await supabase
    .from("artists")
    .select("id, slug, name_ko, name_en")
    .order("name_ko");
  const artists = (artistsData ?? []) as Pick<Artist, "id" | "slug" | "name_ko" | "name_en">[];

  async function save(formData: FormData) {
    "use server";
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const nickname = String(formData.get("nickname") ?? "").trim();
    const handle = String(formData.get("handle") ?? "")
      .trim()
      .toLowerCase();
    const isAnonymous = formData.get("is_anonymous_ranking") === "on";
    const artistId = String(formData.get("artist_id") ?? "").trim();

    if (!nickname) {
      redirect("/onboarding?error=" + encodeURIComponent("닉네임을 입력해주세요"));
    }
    if (!handle || !/^[a-z0-9_]{3,20}$/.test(handle)) {
      redirect(
        "/onboarding?error=" +
          encodeURIComponent("핸들은 영문소자·숫자·_ 로 3~20자여야 해요")
      );
    }
    if (!artistId) {
      redirect("/onboarding?error=" + encodeURIComponent("최애 아티스트를 선택해주세요"));
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .update({ nickname, handle, is_anonymous_ranking: isAnonymous })
      .eq("id", user.id);

    if (profileError) {
      const msg =
        profileError.code === "23505"
          ? "이미 사용 중인 핸들이에요"
          : profileError.message;
      redirect("/onboarding?error=" + encodeURIComponent(msg));
    }

    // Clear existing primary
    await supabase
      .from("fandoms")
      .update({ is_primary: false })
      .eq("user_id", user.id)
      .eq("is_primary", true);

    const { error: fandomError } = await supabase.from("fandoms").upsert(
      { user_id: user.id, artist_id: artistId, is_primary: true },
      { onConflict: "user_id,artist_id" }
    );

    if (fandomError) {
      redirect("/onboarding?error=" + encodeURIComponent(fandomError.message));
    }

    redirect("/dashboard");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
      <h1 className="mb-2 text-2xl font-black">덕력 시작하기</h1>
      <p className="mb-6 text-sm text-duck-900/70">기본 정보를 설정해요.</p>

      {sp.error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {sp.error}
        </div>
      )}

      <form action={save} className="card space-y-4">
        <div>
          <label className="label" htmlFor="nickname">
            닉네임
          </label>
          <input
            id="nickname"
            name="nickname"
            type="text"
            defaultValue={profile?.nickname ?? ""}
            required
            maxLength={30}
            className="input"
          />
        </div>
        <div>
          <label className="label" htmlFor="handle">
            핸들 (@ 주소)
          </label>
          <input
            id="handle"
            name="handle"
            type="text"
            defaultValue={profile?.handle ?? ""}
            required
            pattern="[a-z0-9_]{3,20}"
            placeholder="예: fan_name123"
            className="input"
          />
          <p className="mt-1 text-xs text-duck-900/50">
            영문소자·숫자·_ 만 가능 (3~20자)
          </p>
        </div>
        <div>
          <label className="label" htmlFor="artist_id">
            최애 아티스트
          </label>
          <select id="artist_id" name="artist_id" required className="input">
            <option value="">아티스트 선택</option>
            {artists.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name_ko}
                {a.name_en ? ` (${a.name_en})` : ""}
              </option>
            ))}
          </select>
        </div>
        <label className="flex cursor-pointer items-center gap-2">
          <input type="checkbox" name="is_anonymous_ranking" className="rounded" />
          <span className="text-sm text-duck-900/80">랭킹에 익명으로 표시</span>
        </label>
        <button type="submit" className="btn-primary w-full">
          저장하고 시작하기
        </button>
      </form>
    </main>
  );
}
