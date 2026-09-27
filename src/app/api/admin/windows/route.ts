import { NextRequest, NextResponse } from "next/server";
import { requireTeacher } from "@/lib/auth";
import { serviceClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const teacher = await requireTeacher();
  if (!teacher) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const body = await req.json();
  const unitId = Number(body.unitId);
  const label = body.label ? String(body.label) : null;
  const classGroup = body.classGroup ? String(body.classGroup) : null;
  const opensAt = String(body.opensAt);
  const closesAt = String(body.closesAt);

  if (!unitId || !opensAt || !closesAt) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }
  if (new Date(closesAt).getTime() <= new Date(opensAt).getTime()) {
    return NextResponse.json({ error: "closesAt ต้องหลัง opensAt" }, { status: 400 });
  }

  const db = serviceClient();
  const { error } = await db.from("open_windows").insert({
    unit_id: unitId,
    label,
    class_group: classGroup,
    opens_at: opensAt,
    closes_at: closesAt,
    created_by: teacher.id,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const teacher = await requireTeacher();
  if (!teacher) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "missing id" }, { status: 400 });

  const db = serviceClient();
  const { error } = await db.from("open_windows").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
