import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "一键生成旅行行程",
  description: "输入目的地和偏好，AI帮你排出不折返的每日行程",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
