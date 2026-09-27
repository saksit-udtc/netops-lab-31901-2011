"use client";

import { useState } from "react";

type Submission = {
  id: string;
  summary: string | null;
  evidence_path: string | null;
  status: "submitted" | "graded";
  score: number | null;
  teacher_comment: string | null;
  submitted_at: string;
  groups: {
    name: string;
    class_group: string | null;
    group_members: { profiles: { full_name: string | null; email: string } | null }[];
  } | null;
};

function fmt(dt: string) {
  return new Date(dt).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Bangkok" });
}

export default function ActivityGradeRow({ submission }: { submission: Submission }) {
  const [open, setOpen] = useState(false);
  const [score, setScore] = useState(submission.score?.toString() ?? "");
  const [comment, setComment] = useState(submission.teacher_comment ?? "");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(submission.status);
  const [evidenceUrl, setEvidenceUrl] = useState<string | null>(null);

  const memberNames =
    submission.groups?.group_members
      .map((m) => m.profiles?.full_name || m.profiles?.email)
      .filter(Boolean)
      .join(", ") ?? "";

  async function viewEvidence() {
    if (!submission.evidence_path) return;
    const res = await fetch(`/api/admin/evidence-url?path=${encodeURIComponent(submission.evidence_path)}`);
    const data = await res.json();
    if (res.ok) setEvidenceUrl(data.url);
  }

  async function save() {
    setSaving(true);
    const res = await fetch("/api/admin/activity-grade", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ submissionId: submission.id, score: Number(score), comment }),
    });
    setSaving(false);
    if (res.ok) setStatus("graded");
  }

  return (
    <div className="bg-white border rounded-xl p-4">
      <button onClick={() => setOpen((o) => !o)} className="w-full flex items-center justify-between text-left">
        <span className="font-medium text-sm">
          {submission.groups?.name ?? "-"}
          {submission.groups?.class_group ? ` (${submission.groups.class_group})` : ""}
        </span>
        <span
          className={`text-xs px-2 py-1 rounded-full ${
            status === "graded" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
          }`}
        >
          {status === "graded" ? `ตรวจแล้ว ${submission.score}/40` : "รอตรวจ"}
        </span>
      </button>

      {open && (
        <div className="mt-3 space-y-3 text-sm">
          <p className="text-slate-400 text-xs">
            สมาชิก: {memberNames} · ส่งเมื่อ {fmt(submission.submitted_at)}
          </p>
          {submission.summary && (
            <p className="bg-slate-50 rounded-lg p-2">
              <b>สรุปผลกิจกรรม:</b> {submission.summary}
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
