"use client";

import { useState, use } from "react";

type Item = {
  device_name: string;
  brand: string;
  model: string;
  serial_no: string;
  port_std: string;
  condition: string;
  notes: string;
};

const emptyItem: Item = {
  device_name: "",
  brand: "",
  model: "",
  serial_no: "",
  port_std: "",
  condition: "",
  notes: "",
};

export default function WorksheetPage({ params }: PageProps<"/unit/[unitNo]/worksheet">) {
  const { unitNo } = use(params);
  const [items, setItems] = useState<Item[]>([{ ...emptyItem }]);
  const [reflection, setReflection] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  function updateItem(i: number, field: keyof Item, value: string) {
    setItems((rows) => rows.map((r, idx) => (idx === i ? { ...r, [field]: value } : r)));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    // We need unitId; look it up from the unit page context via unitNo -> fetch quiz-questions-style endpoint is overkill,
    // so we just pass unitNo and resolve server-side instead.
    const fd = new FormData();
    fd.append("unitNo", unitNo);
    fd.append("items", JSON.stringify(items));
    fd.append("reflection", reflection);
    if (file) fd.append("evidence", file);

    const res = await fetch(`/api/worksheet/submit?unitNo=${unitNo}`, {
      method: "POST",
      body: fd,
    });
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
        <h1 className="text-xl font-bold">ส่งใบงานสำเร็จ</h1>
        <a href={`/unit/${unitNo}`} className="text-blue-600 hover:underline">
          กลับไปหน้าหน่วยการเรียน
        </a>
      </main>
    );
  }

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-xl font-bold text-slate-800">
        ใบงานที่ 1: รายงานผลการตรวจรับอุปกรณ์เครือข่ายและบัญชีคุมทรัพยากร
      </h1>
      <form onSubmit={submit} className="space-y-5">
        <div className="space-y-4">
          {items.map((item, i) => (
            <div key={i} className="bg-white border rounded-xl p-4 space-y-2">
              <div className="flex justify-between items-center">
                <p className="text-sm font-medium text-slate-600">อุปกรณ์ที่ {i + 1}</p>
                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setItems((rows) => rows.filter((_, idx) => idx !== i))}
                    className="text-xs text-red-500"
                  >
                    ลบ
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input required placeholder="ประเภทอุปกรณ์ (เช่น Switch)" value={item.device_name}
                  onChange={(e) => updateItem(i, "device_name", e.target.value)}
                  className="border rounded-lg px-3 py-2 text-sm" />
                <input required placeholder="ยี่ห้อ" value={item.brand}
                  onChange={(e) => updateItem(i, "brand", e.target.value)}
                  className="border rounded-lg px-3 py-2 text-sm" />
                <input required placeholder="รุ่น" value={item.model}
                  onChange={(e) => updateItem(i, "model", e.target.value)}
                  className="border rounded-lg px-3 py-2 text-sm" />
                <input required placeholder="หมายเลขประจำเครื่อง (Serial Number)" value={item.serial_no}
                  onChange={(e) => updateItem(i, "serial_no", e.target.value)}
                  className="border rounded-lg px-3 py-2 text-sm" />
                <input placeholder="มาตรฐานพอร์ต (เช่น Gigabit Ethernet)" value={item.port_std}
                  onChange={(e) => updateItem(i, "port_std", e.target.value)}
                  className="border rounded-lg px-3 py-2 text-sm" />
                <input required placeholder="สภาพเมื่อได้รับ" value={item.condition}
                  onChange={(e) => updateItem(i, "condition", e.target.value)}
                  className="border rounded-lg px-3 py-2 text-sm" />
              </div>
              <textarea placeholder="หมายเหตุ / ผลการวัดสัญญาณ" value={item.notes}
                onChange={(e) => updateItem(i, "notes", e.target.value)}
                className="border rounded-lg px-3 py-2 text-sm w-full" rows={2} />
            </div>
          ))}
          <button
            type="button"
            onClick={() => setItems((rows) => [...rows, { ...emptyItem }])}
            className="text-sm text-blue-600 hover:underline"
          >
            + เพิ่มอุปกรณ์อีกชิ้น
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">สรุป/สะท้อนคิด</label>
          <textarea
            required
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm w-full"
            rows={4}
            placeholder="สิ่งที่ได้เรียนรู้ ปัญหาที่พบ และแนวทางแก้ไข"
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
          className="w-full bg-green-600 text-white rounded-lg py-3 font-medium disabled:opacity-50"
        >
          {submitting ? "กำลังส่ง..." : "ส่งใบงาน"}
        </button>
      </form>
    </main>
  );
}
