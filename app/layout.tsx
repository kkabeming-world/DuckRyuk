import type { Metadata } from "next";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "덕력 — 나의 덕질을 숫자로",
    template: "%s · 덕력",
  },
  description:
    "K-pop 팬을 위한 덕질 기록 + 카드 자랑 + 굿즈 인벤토리 + 랭킹 서비스",
  openGraph: {
    title: "덕력",
    description: "기록하고 → 자랑하고 → 거래한다",
    type: "website",
    locale: "ko_KR",
    siteName: "덕력",
  },
  twitter: {
    card: "summary_large_image",
    title: "덕력",
    description: "기록하고 → 자랑하고 → 거래한다",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="min-h-screen font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
