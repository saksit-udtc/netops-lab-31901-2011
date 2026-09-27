import { NextRequest, NextResponse } from "next/server";
import { requireTeacher } from "@/lib/auth";
import { serviceClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const teacher = await requireTeacher();
  if (!teacher) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const path = req.nextUrl.searchParams.get("path");
  if (!path) return NextResponse.json({ error: "missing path" }, { status: 400 });

  const db = serviceClient();
  const { data, error } = await db.storage
    .from("worksheet-evidence")
    .createSignedUrl(path, 60 * 10);
  if (error || !data) return NextResponse.json({ error: error?.message }, { status: 500 });
  return NextResponse.json({ url: data.signedUrl });
}
