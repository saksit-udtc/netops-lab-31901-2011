"use client";

import { useState, use } from "react";

export default function ActivityPage({ params }: PageProps<"/unit/[unitNo]/activity">) {
  const { unitNo } = use(params);
  const [summary, setSummary] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const fd = new FormData();
    fd.append("unitNo", unitNo);
    fd.append("summary", summary);
    if (file) fd.append("evidence", file);

    const res = await fetch(`/api/activity/submit`, { method: "POST", body: fd });
    const data = await res.json().catch(() => ({}));
    setSubmitting(false);
    if (!res.ok) {
      setError(data.error || "ส่งไม่สำเร็จ");
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <main className="max-w-2xl mx-auto p-6 text-center space-y-4">
        <h1 className="text-xl font-bold">ส่งใบกิจกรรมสำเร็จ</h1>
        <a href={`/unit/${unitNo}`} className="text-blue-600 hover:underline">
          กลับไปหน้าหน่วยการเรียน
        </a>
      </main>
    );
  }

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-xl font-bold text-slate-800">ใบกิจกรรม: กิจกรรมกลุ่ม (Gallery Walk)</h1>
      <p className="text-sm text-slate-500">
        ตัวแทนกลุ่มส่งใบกิจกรรมนี้เพียงครั้งเดียว โดยคะแนนที่ครูให้จะใช้ร่วมกันทั้งกลุ่ม
      </p>
      <form onSubmit={submit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium mb-1">สรุปผลกิจกรรม</label>
          <textarea
            required
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm w-full"
            rows={6}
            placeholder="สรุปผลการศึกษามาตรฐาน การตรวจสอบอุปกรณ์ บัญชีทรัพย์สิน และผลจาก Gallery Walk ของกลุ่ม"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">แนบรูปถ่ายหลักฐาน (ถ้ามี)</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="text-sm"
          />
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button
          disabled={submitting}
          className="w-full bg-purple-600 text-white rounded-lg py-3 font-medium disabled:opacity-50"
        >
          {submitting ? "กำลังส่ง..." : "ส่งใบกิจกรรม"}
        </button>
      </form>
    </main>
  );
}
