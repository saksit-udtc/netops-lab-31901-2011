"use client";

import { browserClient } from "@/lib/supabase/browser";
import { useState } from "react";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);

  async function signIn() {
    const supabase = browserClient();
    const redirectTo = `${location.origin}/auth/callback`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        queryParams: {
          hd: process.env.NEXT_PUBLIC_ALLOWED_EMAIL_DOMAIN || "",
          prompt: "select_account",
        },
      },
    });
    if (error) setError(error.message);
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow p-8 text-center space-y-4">
        <h1 className="text-xl font-bold text-slate-800">
          ระบบเรียน + ส่งใบงาน
        </h1>
        <p className="text-slate-500 text-sm">
          วิชา 31901-2011 การจัดการระบบเครือข่าย
        </p>
        <button
          onClick={signIn}
          className="w-full flex items-center justify-center gap-2 border rounded-lg py-2.5 font-medium hover:bg-slate-50"
        >
          เข้าสู่ระบบด้วยบัญชี Google (@udontech.ac.th)
        </button>
        {error && <p className="text-red-600 text-sm">{error}</p>}
      </div>
    </main>
  );
}
