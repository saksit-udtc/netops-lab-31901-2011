import { NextRequest, NextResponse } from "next/server";
import { requireTeacher } from "@/lib/auth";
import { serviceClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const teacher = await requireTeacher();
  if (!teacher) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const body = await req.json();
  const groupId = String(body.groupId ?? "");
  const studentId = String(body.studentId ?? "");
  if (!groupId || !studentId) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }

  const db = serviceClient();
  const { error } = await db.from("group_members").insert({ group_id: groupId, student_id: studentId });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const teacher = await requireTeacher();
  if (!teacher) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const groupId = req.nextUrl.searchParams.get("groupId");
  const studentId = req.nextUrl.searchParams.get("studentId");
  if (!groupId || !studentId) return NextResponse.json({ error: "missing fields" }, { status: 400 });

  const db = serviceClient();
  const { error } = await db
    .from("group_members")
    .delete()
    .eq("group_id", groupId)
    .eq("student_id", studentId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
