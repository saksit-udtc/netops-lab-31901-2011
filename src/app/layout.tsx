import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "31901-2011 การจัดการระบบเครือข่าย",
  description: "ระบบเรียน + ส่งใบงาน วิชาการจัดการระบบเครือข่าย",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="th" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900">
        {children}
      </body>
    </html>
  );
}
