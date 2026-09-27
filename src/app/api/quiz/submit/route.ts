import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { serviceClient } from "@/lib/supabase/server";
import { getWindowsForUnit, isWindowOpenNow } from "@/lib/windows";

export async function POST(req: NextRequest) {
  const profile = await getCurrentUser();
  if (!profile) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const unitId = Number(body.unitId);
  const answers: Record<string, string> = body.answers ?? {};

  const db = serviceClient();
  const { data: unit } = await db.from("units").select("id,unit_no").eq("id", unitId).maybeSingle();
  if (!unit) return NextResponse.json({ error: "not found" }, { status: 404 });

  const windows = await getWindowsForUnit(unit.id);
  if (!isWindowOpenNow(windows, profile.class_group)) {
    return NextResponse.json({ error: "ช่วงเวลาทำแบบทดสอบปิดแล้ว" }, { status: 403 });
  }

  const { data: questions } = await db
    .from("quiz_questions")
    .select("id,correct_choice")
    .eq("unit_id", unit.id);
  if (!questions || questions.length === 0) {
    return NextResponse.json({ error: "no questions" }, { status: 400 });
  }

  let score = 0;
  for (const q of questions) {
    if (answers[q.id] === q.correct_choice) score += 1;
  }

  const { error } = await db.from("quiz_attempts").insert({
    unit_id: unit.id,
    student_id: profile.id,
    answers,
    score,
    total: questions.length,
  });
  // unique(unit_id, student_id) -> 23505 if they already submitted (race / double click)
  if (error) {
    if ((error as { code?: string }).code === "23505") {
      return NextResponse.json({ error: "ทำแบบทดสอบไปแล้ว" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ score, total: questions.length });
}
