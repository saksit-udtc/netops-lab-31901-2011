"use client";

import { useState } from "react";
import type { OpenWindow } from "@/lib/windows";

function fmt(dt: string) {
  return new Date(dt).toLocaleString("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Bangkok",
  });
}

export default function WindowManager({
  unitId,
  initialWindows,
}: {
  unitId: number;
  initialWindows: OpenWindow[];
}) {
  const [windows, setWindows] = useState(initialWindows);
  const [label, setLabel] = useState("");
  const [classGroup, setClassGroup] = useState("");
  const [opensAt, setOpensAt] = useState("");
  const [closesAt, setClosesAt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function addWindow(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await fetch("/api/admin/windows", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        unitId,
        label: label || null,
        classGroup: classGroup || null,
        opensAt: new Date(opensAt).toISOString(),
        closesAt: new Date(closesAt).toISOString(),
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error || "เพิ่มไม่สำเร็จ");
      return;
    }
    setWindows((w) => [
      ...w,
      {
        id: crypto.randomUUID(),
        unit_id: unitId,
        label: label || null,
        class_group: classGroup || null,
        opens_at: new Date(opensAt).toISOString(),
        closes_at: new Date(closesAt).toISOString(),
      },
    ]);
    setLabel("");
    setClassGroup("");
    setOpensAt("");
    setClosesAt("");
  }

  async function removeWindow(id: string) {
    await fetch(`/api/admin/windows?id=${id}`, { method: "DELETE" });
    setWindows((w) => w.filter((x) => x.id !== id));
  }

  return (
    <div className="space-y-2">
      {windows.map((w) => (
        <div
          key={w.id}
          className="flex items-center justify-between text-sm bg-slate-50 rounded-lg px-3 py-2"
        >
          <span>
            {fmt(w.opens_at)} – {fmt(w.closes_at)}
            {w.label ? ` · ${w.label}` : ""}
            {w.class_group ? ` · เฉพาะกลุ่ม ${w.class_group}` : " · ทุกกลุ่มเรียน"}
          </span>
          <button onClick={() => removeWindow(w.id)} className="text-red-500 text-xs">
            ลบ
          </button>
        </div>
      ))}
      {windows.length === 0 && <p className="text-sm text-slate-400">ยังไม่มีช่วงเวลาเปิด</p>}

      <form onSubmit={addWindow} className="flex flex-wrap gap-2 items-end pt-2 border-t">
        <div>
          <label className="block text-xs text-slate-500">เปิด</label>
          <input required type="datetime-local" value={opensAt}
            onChange={(e) => setOpensAt(e.target.value)}
            className="border rounded-lg px-2 py-1 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-slate-500">ปิด</label>
          <input required type="datetime-local" value={closesAt}
            onChange={(e) => setClosesAt(e.target.value)}
            className="border rounded-lg px-2 py-1 text-sm" />
        </div>
        <input placeholder="ป้ายกำกับ (ไม่บังคับ)" value={label}
          onChange={(e) => setLabel(e.target.value)}
          className="border rounded-lg px-2 py-1 text-sm w-32" />
        <input placeholder="เฉพาะกลุ่มเรียน (ว่าง=ทุกกลุ่ม)" value={classGroup}
          onChange={(e) => setClassGroup(e.target.value)}
          className="border rounded-lg px-2 py-1 text-sm w-40" />
        <button disabled={saving} className="bg-slate-800 text-white rounded-lg px-3 py-1.5 text-sm disabled:opacity-50">
          เพิ่มช่วงเวลา
        </button>
      </form>
      {error && <p className="text-red-600 text-xs">{error}</p>}
    </div>
  );
}
