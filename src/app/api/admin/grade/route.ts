import { NextRequest, NextResponse } from "next/server";
import { requireTeacher } from "@/lib/auth";
import { serviceClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const teacher = await requireTeacher();
  if (!teacher) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const body = await req.json();
  const submissionId = String(body.submissionId);
  const score = Number(body.score);
  const comment = body.comment ? String(body.comment) : null;

  const db = serviceClient();
  const { error } = await db
    .from("worksheet_submissions")
    .update({
      status: "graded",
      score,
      teacher_comment: comment,
      graded_at: new Date().toISOString(),
      graded_by: teacher.id,
    })
    .eq("id", submissionId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
