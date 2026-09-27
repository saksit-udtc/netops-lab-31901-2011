import { NextRequest, NextResponse } from "next/server";
import { requireTeacher } from "@/lib/auth";
import { serviceClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const teacher = await requireTeacher();
  if (!teacher) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const body = await req.json();
  const unitId = Number(body.unitId);
  const name = String(body.name ?? "").trim();
  const classGroup = body.classGroup ? String(body.classGroup) : null;
  const studentIds: string[] = Array.isArray(body.studentIds) ? body.studentIds : [];

  if (!unitId || !name) {
    return NextResponse.json({ error: "กรุณาระบุหน่วยและชื่อกลุ่ม" }, { status: 400 });
  }
  if (studentIds.length === 0) {
    return NextResponse.json({ error: "กรุณาเลือกสมาชิกอย่างน้อย 1 คน" }, { status: 400 });
  }

  const db = serviceClient();
  const { data: group, error } = await db
    .from("groups")
    .insert({ unit_id: unitId, name, class_group: classGroup, created_by: teacher.id })
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { error: memErr } = await db
    .from("group_members")
    .insert(studentIds.map((sid) => ({ group_id: group.id, student_id: sid })));
  if (memErr) {
    await db.from("groups").delete().eq("id", group.id);
    return NextResponse.json({ error: memErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, group });
}

export async function DELETE(req: NextRequest) {
  const teacher = await requireTeacher();
  if (!teacher) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "missing id" }, { status: 400 });

  const db = serviceClient();
  const { error } = await db.from("groups").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
