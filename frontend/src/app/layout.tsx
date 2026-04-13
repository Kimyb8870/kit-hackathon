import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import { NavHeader } from "@/components/shared/nav-header";
import { SupabaseAuthProvider } from "@/components/shared/supabase-auth-provider";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Clover — 교육의 행운을 모두에게",
  description:
    "Clover는 학습자, 강사, 플랫폼 운영자를 위한 3-Agent AI 오케스트레이터입니다.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistMono.variable} h-full antialiased`}
    >
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body
        className="min-h-full flex flex-col bg-background text-foreground"
        suppressHydrationWarning
      >
        <SupabaseAuthProvider>
          <NavHeader />
          <main className="flex flex-1 flex-col">{children}</main>
          <Toaster position="bottom-right" expand={false} visibleToasts={3} />
        </SupabaseAuthProvider>
      </body>
    </html>
  );
}
