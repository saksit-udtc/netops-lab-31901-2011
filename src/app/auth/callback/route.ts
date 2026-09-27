import { NextRequest, NextResponse } from "next/server";
import { ssrServerClient } from "@/lib/supabase/ssrServer";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await ssrServerClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    const allowedDomain = process.env.ALLOWED_EMAIL_DOMAIN;
    const email = data?.user?.email?.toLowerCase() ?? "";
    if (!error && allowedDomain && !email.endsWith("@" + allowedDomain)) {
      // Reject non-college accounts immediately.
      await supabase.auth.signOut();
      return NextResponse.redirect(
        `${origin}/login?error=` +
          encodeURIComponent(`กรุณาเข้าสู่ระบบด้วยอีเมล @${allowedDomain} ของวิทยาลัยเท่านั้น`)
      );
    }
    if (!error) {
      return NextResponse.redirect(`${origin}/`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=` + encodeURIComponent("เข้าสู่ระบบไม่สำเร็จ"));
}
