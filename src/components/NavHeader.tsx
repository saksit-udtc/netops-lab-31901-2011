"use client";

import { browserClient } from "@/lib/supabase/browser";
import { useRouter } from "next/navigation";

export default function NavHeader({
  name,
  role,
}: {
  name: string;
  role: "student" | "teacher";
}) {
  const router = useRouter();

  async function signOut() {
    const supabase = browserClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="bg-white border-b sticky top-0 z-10">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        <a href="/" className="font-bold text-slate-800">
          31901-2011 การจัดการระบบเครือข่าย
        </a>
        <div className="flex items-center gap-3 text-sm">
          {role === "teacher" && (
            <a href="/admin" className="text-blue-600 hover:underline">
              หน้าครู
            </a>
          )}
          <span className="text-slate-500">{name}</span>
          <button onClick={signOut} className="text-slate-400 hover:text-slate-700">
            ออกจากระบบ
          </button>
        </div>
      </div>
    </header>
  );
}
