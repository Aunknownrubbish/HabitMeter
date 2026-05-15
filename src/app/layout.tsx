import type { Metadata } from "next";
import { Providers } from "@/components/Providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "寻栖 - 居住环境决策工具",
  description: "透视意向居住地周边配套及通勤效率",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="h-screen overflow-hidden bg-[var(--color-bg-page)] text-[var(--color-text-main)] antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
