import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { serviceClient } from "@/lib/supabase/server";
import { getWindowsForUnit, isWindowOpenNow } from "@/lib/windows";

export async function GET(req: NextRequest) {
  const profile = await getCurrentUser();
  if (!profile) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const unitNo = Number(req.nextUrl.searchParams.get("unit"));
  const db = serviceClient();
  const { data: unit } = await db
    .from("units")
    .select("id")
    .eq("unit_no", unitNo)
    .maybeSingle();
  if (!unit) return NextResponse.json({ error: "not found" }, { status: 404 });

  const windows = await getWindowsForUnit(unit.id);
  if (!isWindowOpenNow(windows, profile.class_group)) {
    return NextResponse.json({ error: "ช่วงเวลาทำแบบทดสอบปิดแล้ว" }, { status: 403 });
  }

  const { data: existing } = await db
    .from("quiz_attempts")
    .select("id")
    .eq("unit_id", unit.id)
    .eq("student_id", profile.id)
    .maybeSingle();
  if (existing) {
    return NextResponse.json({ error: "ทำแบบทดสอบไปแล้ว" }, { status: 409 });
  }

  const { data: questions } = await db
    .from("quiz_questions")
    .select("id,order_no,question,choice_a,choice_b,choice_c,choice_d")
    .eq("unit_id", unit.id)
    .order("order_no");

  return NextResponse.json({ unitId: unit.id, questions: questions ?? [] });
}
