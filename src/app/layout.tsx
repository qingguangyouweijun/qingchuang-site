import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "轻创 Qintra",
  description: "让便捷融入生活",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased min-h-screen">
        {children}
      </body>
    </html>
  )
}
