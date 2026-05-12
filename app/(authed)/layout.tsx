import { createClient } from "@/lib/supabase/server";
import Topbar from "@/components/Topbar";
import type { Profile } from "@/lib/types";
import { brandStyleVars } from "@/lib/theme";

export default async function AuthedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let profile: Profile | null = null;
  let primaryColor: string | null = null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    profile = data as Profile | null;

    const { data: primaryFandom } = await supabase
      .from("fandoms")
      .select("artists(primary_color)")
      .eq("user_id", user.id)
      .eq("is_primary", true)
      .single();
    primaryColor =
      (primaryFandom?.artists as unknown as { primary_color: string | null } | null)
        ?.primary_color ?? null;
  }

  return (
    <div style={brandStyleVars(primaryColor)}>
      <Topbar profile={profile} />
      <main className="mx-auto max-w-2xl px-4 py-6">{children}</main>
    </div>
  );
}
