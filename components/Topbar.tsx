import Link from "next/link";
import type { Profile } from "@/lib/types";

type Props = {
  profile: Profile | null;
};

export default function Topbar({ profile }: Props) {
  return (
    <header className="sticky top-0 z-10 border-b border-duck-100 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
        <Link href="/dashboard" className="text-lg font-black tracking-tight text-duck-700">
          덕력
        </Link>
        <div className="flex items-center gap-1">
          <Link href="/expenses/new" className="btn-ghost text-xs">
            +기록
          </Link>
          <Link href="/inventory" className="btn-ghost text-xs">
            인벤
          </Link>
          <Link href="/ranking" className="btn-ghost text-xs">
            랭킹
          </Link>
          {profile?.handle && (
            <Link href={`/card/${profile.handle}`} className="btn-ghost text-xs">
              내카드
            </Link>
          )}
          <form action="/logout" method="POST">
            <button type="submit" className="btn-ghost text-xs">
              로그아웃
            </button>
          </form>
        </div>
      </nav>
    </header>
  );
}
