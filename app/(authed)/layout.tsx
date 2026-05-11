import { createClient } from "@/lib/supabase/server";
import Topbar from "@/components/Topbar";
import type { Profile } from "@/lib/types";

export default async function AuthedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let profile: Profile | null = null;

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
  }

  return (
    <>
      <Topbar profile={profile} />
      <main className="mx-auto max-w-2xl px-4 py-6">{children}</main>
    </>
  );
}
