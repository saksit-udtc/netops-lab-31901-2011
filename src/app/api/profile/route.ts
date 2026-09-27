import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { serviceClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const profile = await getCurrentUser();
  if (!profile) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const studentCode = String(body.studentCode ?? "").trim();
  const classGroup = String(body.classGroup ?? "").trim();
  if (!studentCode || !classGroup) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }

  const db = serviceClient();
  const { error } = await db
    .from("profiles")
    .update({ student_code: studentCode, class_group: classGroup })
    .eq("id", profile.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
