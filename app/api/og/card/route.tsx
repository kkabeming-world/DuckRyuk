import { ImageResponse } from "next/og";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "edge";

const W = 1200;
const H = 630;

function formatKrwOg(n: number): string {
  return `${n.toLocaleString("ko-KR")}원`;
}

function NotFound() {
  return (
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        justifyContent: "center",
        alignItems: "center",
        background: "#fff8d6",
        fontFamily: "sans-serif",
      }}
    >
      <span style={{ fontSize: 40, fontWeight: 700, color: "#7a5e00" }}>덕력 카드 없음</span>
    </div>
  );
}

function Unavailable() {
  return (
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        justifyContent: "center",
        alignItems: "center",
        background: "#fff8d6",
        fontFamily: "sans-serif",
      }}
    >
      <span style={{ fontSize: 40, fontWeight: 700, color: "#7a5e00" }}>준비 중</span>
    </div>
  );
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const handle = searchParams.get("handle");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return new ImageResponse(<Unavailable />, { width: W, height: H, status: 503 });
  }

  if (!handle) {
    return new ImageResponse(<NotFound />, { width: W, height: H, status: 404 });
  }

  const supabase = createAdminClient();

  const { data: profileData } = await supabase
    .from("profiles")
    .select("id, nickname, is_anonymous_ranking")
    .eq("handle", handle)
    .single();

  if (!profileData) {
    return new ImageResponse(<NotFound />, { width: W, height: H, status: 404 });
  }

  const profile = profileData as { id: string; nickname: string; is_anonymous_ranking: boolean };
  const displayName = profile.is_anonymous_ranking ? "익명 팬" : profile.nickname;

  const { data: primaryFandom } = await supabase
    .from("fandoms")
    .select("artists(name_ko)")
    .eq("user_id", profile.id)
    .eq("is_primary", true)
    .single();
  const primaryArtistName =
    (primaryFandom?.artists as unknown as { name_ko: string } | null)?.name_ko ?? null;

  const { data: totalsData } = await supabase
    .from("v_user_artist_total")
    .select("total, first_spent_on, last_spent_on")
    .eq("user_id", profile.id);

  const rows = (totalsData ?? []) as Array<{
    total: unknown;
    first_spent_on: string | null;
    last_spent_on: string | null;
  }>;

  const grandTotal = rows.reduce((s, r) => s + Number(r.total), 0);
  const firstSpentOn =
    rows
      .map((r) => r.first_spent_on)
      .filter((d): d is string => d !== null)
      .sort()[0] ?? null;
  const lastSpentOn =
    rows
      .map((r) => r.last_spent_on)
      .filter((d): d is string => d !== null)
      .sort()
      .reverse()[0] ?? null;

  const periodText =
    firstSpentOn && lastSpentOn
      ? `${firstSpentOn.slice(0, 7)} ~ ${lastSpentOn.slice(0, 7)}`
      : null;

  const totalText = formatKrwOg(grandTotal);

  return new ImageResponse(
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        background: "linear-gradient(135deg, #fff8d6 0%, #ffe26b 100%)",
        padding: "72px 80px",
        fontFamily: "sans-serif",
        justifyContent: "space-between",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column" }}>
        <span style={{ fontSize: 22, color: "#bf9200", fontWeight: 700 }}>덕력 카드</span>
        <span style={{ fontSize: 60, fontWeight: 900, color: "#3d2c00", marginTop: 12 }}>
          {displayName}
        </span>
        {primaryArtistName && (
          <span style={{ fontSize: 26, color: "#7a5e00", marginTop: 8 }}>
            {primaryArtistName} 팬
          </span>
        )}
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          background: "rgba(255,255,255,0.65)",
          borderRadius: 24,
          padding: "32px 40px",
        }}
      >
        <span style={{ fontSize: 18, color: "#7a5e00" }}>총 덕력</span>
        <span style={{ fontSize: 72, fontWeight: 900, color: "#bf1644", lineHeight: 1.1 }}>
          {totalText}
        </span>
        {periodText && (
          <span style={{ fontSize: 18, color: "#7a5e00", marginTop: 8 }}>{periodText}</span>
        )}
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <span style={{ fontSize: 22, color: "#bf9200", fontWeight: 700 }}>#나의덕력</span>
      </div>
    </div>,
    {
      width: W,
      height: H,
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    }
  );
}
