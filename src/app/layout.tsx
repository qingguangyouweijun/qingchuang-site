import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "晴窗葳蕤 - 大学生交友平台",
  description: "遇见你的怦然心动 - 真实、安全、浪漫的校园社交体验",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
