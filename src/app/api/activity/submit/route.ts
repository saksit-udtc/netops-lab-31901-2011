import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { serviceClient } from "@/lib/supabase/server";
import { getWindowsForUnit, isWindowOpenNow } from "@/lib/windows";

export async function POST(req: NextRequest) {
  const profile = await getCurrentUser();
  if (!profile) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const form = await req.formData();
  const unitNo = Number(form.get("unitNo"));
  const summary = String(form.get("summary") ?? "").trim();
  const file = form.get("evidence") as File | null;

  if (!summary) {
    return NextResponse.json({ error: "กรุณากรอกสรุปผลกิจกรรม" }, { status: 400 });
  }

  const db = serviceClient();
  const { data: unit } = await db.from("units").select("id").eq("unit_no", unitNo).maybeSingle();
  if (!unit) return NextResponse.json({ error: "not found" }, { status: 404 });

  const windows = await getWindowsForUnit(unit.id);
  if (!isWindowOpenNow(windows, profile.class_group)) {
    return NextResponse.json({ error: "ช่วงเวลาส่งใบกิจกรรมปิดแล้ว" }, { status: 403 });
  }

  // Find the group this student belongs to for this unit.
  const { data: membership } = await db
    .from("group_members")
    .select("group_id, groups!inner(id, unit_id)")
    .eq("student_id", profile.id)
    .eq("groups.unit_id", unit.id)
    .maybeSingle();

  if (!membership) {
    return NextResponse.json({ error: "คุณยังไม่ได้อยู่ในกลุ่มสำหรับหน่วยนี้ กรุณาติดต่อครู" }, { status: 403 });
  }
  const groupId = membership.group_id as string;

  const { data: existing } = await db
    .from("activity_submissions")
    .select("id")
    .eq("group_id", groupId)
    .maybeSingle();
  if (existing) {
    return NextResponse.json({ error: "กลุ่มนี้ส่งใบกิจกรรมไปแล้ว" }, { status: 409 });
  }

  let evidencePath: string | null = null;
  if (file && file.size > 0) {
    if (file.size > 8 * 1024 * 1024) {
      return NextResponse.json({ error: "ไฟล์ใหญ่เกิน 8MB" }, { status: 400 });
    }
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const path = `activity/${unit.id}/${groupId}-${Date.now()}.${ext}`;
    const bytes = new Uint8Array(await file.arrayBuffer());
    const { error: upErr } = await db.storage
      .from("worksheet-evidence")
      .upload(path, bytes, { contentType: file.type || "image/jpeg", upsert: false });
    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });
    evidencePath = path;
  }

  const { error } = await db.from("activity_submissions").insert({
    unit_id: unit.id,
    group_id: groupId,
    summary,
    evidence_path: evidencePath,
    submitted_by: profile.id,
    status: "submitted",
    submitted_at: new Date().toISOString(),
  });
  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "กลุ่มนี้ส่งใบกิจกรรมไปแล้ว" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
