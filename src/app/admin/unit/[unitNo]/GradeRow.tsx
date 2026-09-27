"use client";

import { useState } from "react";

type Submission = {
  id: string;
  items: {
    device_name: string;
    brand: string;
    model: string;
    serial_no: string;
    port_std: string;
    condition: string;
    notes: string;
  }[];
  reflection: string | null;
  evidence_path: string | null;
  status: "submitted" | "graded";
  score: number | null;
  teacher_comment: string | null;
  submitted_at: string;
  profiles: { full_name: string | null; email: string; student_code: string | null; class_group: string | null } | null;
};

function fmt(dt: string) {
  return new Date(dt).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Bangkok" });
}

export default function GradeRow({ submission }: { submission: Submission }) {
  const [open, setOpen] = useState(false);
  const [score, setScore] = useState(submission.score?.toString() ?? "");
  const [comment, setComment] = useState(submission.teacher_comment ?? "");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(submission.status);
  const [evidenceUrl, setEvidenceUrl] = useState<string | null>(null);

  async function viewEvidence() {
    if (!submission.evidence_path) return;
    const res = await fetch(`/api/admin/evidence-url?path=${encodeURIComponent(submission.evidence_path)}`);
    const data = await res.json();
    if (res.ok) setEvidenceUrl(data.url);
  }

  async function save() {
    setSaving(true);
    const res = await fetch("/api/admin/grade", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ submissionId: submission.id, score: Number(score), comment }),
    });
    setSaving(false);
    if (res.ok) setStatus("graded");
  }

  return (
    <div className="bg-white border rounded-xl p-4">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between text-left"
      >
        <span className="font-medium text-sm">
          {submission.profiles?.student_code ?? "-"} · {submission.profiles?.full_name ?? submission.profiles?.email}
          {submission.profiles?.class_group ? ` (${submission.profiles.class_group})` : ""}
        </span>
        <span className={`text-xs px-2 py-1 rounded-full ${status === "graded" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
          {status === "graded" ? `ตรวจแล้ว ${submission.score}/40` : "รอตรวจ"}
        </span>
      </button>

      {open && (
        <div className="mt-3 space-y-3 text-sm">
          <p className="text-slate-400 text-xs">ส่งเมื่อ {fmt(submission.submitted_at)}</p>
          <table className="w-full text-xs border">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-1 border">อุปกรณ์</th>
                <th className="p-1 border">ยี่ห้อ</th>
                <th className="p-1 border">รุ่น</th>
                <th className="p-1 border">S/N</th>
                <th className="p-1 border">สภาพ</th>
                <th className="p-1 border">หมายเหตุ</th>
              </tr>
            </thead>
            <tbody>
              {submission.items.map((it, i) => (
                <tr key={i}>
                  <td className="p-1 border">{it.device_name}</td>
                  <td className="p-1 border">{it.brand}</td>
                  <td className="p-1 border">{it.model}</td>
                  <td className="p-1 border">{it.serial_no}</td>
                  <td className="p-1 border">{it.condition}</td>
                  <td className="p-1 border">{it.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {submission.reflection && (
            <p className="bg-slate-50 rounded-lg p-2">
              <b>สะท้อนคิด:</b> {submission.reflection}
            </p>
          )}
          {submission.evidence_path && (
            <div>
              <button onClick={viewEvidence} className="text-blue-600 hover:underline text-xs">
                ดูรูปหลักฐาน
              </button>
              {evidenceUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={evidenceUrl} alt="หลักฐาน" className="mt-2 max-h-64 rounded-lg border" />
              )}
            </div>
          )}
          <div className="flex flex-wrap gap-2 items-center pt-2 border-t">
            <input
              type="number"
              min={0}
              max={40}
              placeholder="คะแนน /40"
              value={score}
              onChange={(e) => setScore(e.target.value)}
              className="border rounded-lg px-2 py-1 w-24"
            />
            <input
              placeholder="ความเห็นครู (ไม่บังคับ)"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="border rounded-lg px-2 py-1 flex-1 min-w-[160px]"
            />
            <button
              onClick={save}
              disabled={saving || score === ""}
              className="bg-slate-800 text-white rounded-lg px-3 py-1.5 disabled:opacity-50"
            >
              บันทึกคะแนน
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
