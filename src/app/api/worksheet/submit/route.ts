import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { serviceClient } from "@/lib/supabase/server";
import { getWindowsForUnit, isWindowOpenNow } from "@/lib/windows";

export async function POST(req: NextRequest) {
  const profile = await getCurrentUser();
  if (!profile) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const form = await req.formData();
  const unitNo = Number(form.get("unitNo"));
  const itemsRaw = String(form.get("items") ?? "[]");
  const reflection = String(form.get("reflection") ?? "");
  const file = form.get("evidence") as File | null;

  let items: unknown[];
  try {
    items = JSON.parse(itemsRaw);
  } catch {
    return NextResponse.json({ error: "invalid items" }, { status: 400 });
  }
  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "กรุณากรอกรายการอุปกรณ์อย่างน้อย 1 รายการ" }, { status: 400 });
  }

  const db = serviceClient();
  const { data: unit } = await db.from("units").select("id").eq("unit_no", unitNo).maybeSingle();
  if (!unit) return NextResponse.json({ error: "not found" }, { status: 404 });

  const windows = await getWindowsForUnit(unit.id);
  if (!isWindowOpenNow(windows, profile.class_group)) {
    return NextResponse.json({ error: "ช่วงเวลาส่งใบงานปิดแล้ว" }, { status: 403 });
  }

  let evidencePath: string | null = null;
  if (file && file.size > 0) {
    if (file.size > 8 * 1024 * 1024) {
      return NextResponse.json({ error: "ไฟล์ใหญ่เกิน 8MB" }, { status: 400 });
    }
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const path = `${unit.id}/${profile.id}-${Date.now()}.${ext}`;
    const bytes = new Uint8Array(await file.arrayBuffer());
    const { error: upErr } = await db.storage
      .from("worksheet-evidence")
      .upload(path, bytes, { contentType: file.type || "image/jpeg", upsert: false });
    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });
    evidencePath = path;
  }

  const { error } = await db.from("worksheet_submissions").upsert(
    {
      unit_id: unit.id,
      student_id: profile.id,
      items,
      reflection,
      evidence_path: evidencePath,
      status: "submitted",
      submitted_at: new Date().toISOString(),
    },
    { onConflict: "unit_id,student_id" }
  );
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
