import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { serviceClient } from "@/lib/supabase/server";
import { getWindowsForUnit, nextOrCurrentWindow } from "@/lib/windows";
import NavHeader from "@/components/NavHeader";

function fmt(dt: string) {
  return new Date(dt).toLocaleString("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Bangkok",
  });
}

export default async function UnitPage({ params }: PageProps<"/unit/[unitNo]">) {
  const { unitNo } = await params;
  const profile = await getCurrentUser();
  if (!profile) redirect("/login");

  const db = serviceClient();
  const { data: unit } = await db
    .from("units")
    .select("*")
    .eq("unit_no", Number(unitNo))
    .eq("is_published", true)
    .maybeSingle();
  if (!unit) notFound();

  const windows = await getWindowsForUnit(unit.id);
  const status = nextOrCurrentWindow(windows, profile.class_group);

  const { data: attempt } = await db
    .from("quiz_attempts")
    .select("score,total,submitted_at")
    .eq("unit_id", unit.id)
    .eq("student_id", profile.id)
    .maybeSingle();

  const { data: submission } = await db
    .from("worksheet_submissions")
    .select("status,score,submitted_at")
    .eq("unit_id", unit.id)
    .eq("student_id", profile.id)
    .maybeSingle();

  return (
    <>
      <NavHeader name={profile.full_name || profile.email} role={profile.role} />
      <main className="max-w-3xl mx-auto w-full px-4 py-8 space-y-6">
        <a href="/" className="text-sm text-blue-600 hover:underline">
          ← กลับหน้าหลัก
        </a>
        <h1 className="text-xl font-bold text-slate-800">
          หน่วยที่ {unit.unit_no}: {unit.title}
        </h1>

        <article
          className="prose prose-slate max-w-none bg-white rounded-xl border p-6"
          dangerouslySetInnerHTML={{ __html: unit.lesson_html ?? "<p>ยังไม่มีเนื้อหา</p>" }}
        />

        <div className="bg-white rounded-xl border p-6 space-y-3">
          <h2 className="font-semibold text-slate-800">แบบทดสอบท้ายหน่วย (30 ข้อ)</h2>
          {attempt ? (
            <p className="text-sm text-slate-600">
              ทำแล้ว: {attempt.score}/{attempt.total} คะแนน (ส่งเมื่อ {fmt(attempt.submitted_at)})
            </p>
          ) : status.status === "open" ? (
            <a
              href={`/unit/${unit.unit_no}/quiz`}
              className="inline-block bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium"
            >
              เริ่มทำแบบทดสอบ
            </a>
          ) : (
            <p className="text-sm text-slate-400">
              {status.status === "upcoming"
                ? `จะเปิดให้ทำในวันที่ ${fmt(status.window!.opens_at)}`
                : "ยังไม่เปิดหรือปิดรับแล้ว"}
            </p>
          )}
        </div>

        <div className="bg-white rounded-xl border p-6 space-y-3">
          <h2 className="font-semibold text-slate-800">
            {unit.worksheet_title ?? "ใบงาน"}
          </h2>
          <div
            className="prose prose-sm prose-slate max-w-none"
            dangerouslySetInnerHTML={{ __html: unit.worksheet_instructions ?? "" }}
          />
          {submission ? (
            <p className="text-sm text-slate-600">
              ส่งงานแล้วเมื่อ {fmt(submission.submitted_at)} —{" "}
              {submission.status === "graded"
                ? `ตรวจแล้ว ${submission.score ?? "-"}/40 คะแนน`
                : "รอครูตรวจ"}
            </p>
          ) : status.status === "open" ? (
            <a
              href={`/unit/${unit.unit_no}/worksheet`}
              className="inline-block bg-green-600 text-white rounded-lg px-4 py-2 text-sm font-medium"
            >
              ทำและส่งใบงาน
            </a>
          ) : (
            <p className="text-sm text-slate-400">
              {status.status === "upcoming"
                ? `จะเปิดให้ส่งในวันที่ ${fmt(status.window!.opens_at)}`
                : "ยังไม่เปิดหรือปิดรับแล้ว"}
            </p>
          )}
          {status.window && (
            <p className="text-xs text-slate-400">
              ช่วงเวลา: {fmt(status.window.opens_at)} – {fmt(status.window.closes_at)}
              {status.window.label ? ` (${status.window.label})` : ""}
            </p>
          )}
        </div>
      </main>
    </>
  );
}
