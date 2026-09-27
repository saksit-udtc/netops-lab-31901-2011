"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ProfileForm({
  initialCode,
  initialGroup,
}: {
  initialCode: string | null;
  initialGroup: string | null;
}) {
  const [studentCode, setStudentCode] = useState(initialCode ?? "");
  const [classGroup, setClassGroup] = useState(initialGroup ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentCode, classGroup }),
    });
    setSaving(false);
    if (!res.ok) {
      setError("บันทึกไม่สำเร็จ กรุณาลองใหม่");
      return;
    }
    router.refresh();
  }

  return (
    <form
      onSubmit={save}
      className="bg-amber-50 border border-amber-200 rounded-xl p-5 space-y-3"
    >
      <p className="font-medium text-amber-800">
        กรุณากรอกข้อมูลนักศึกษาก่อนเริ่มใช้งาน
      </p>
      <div className="flex gap-3 flex-wrap">
        <input
          required
          placeholder="รหัสนักศึกษา"
          value={studentCode}
          onChange={(e) => setStudentCode(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm flex-1 min-w-[160px]"
        />
        <input
          required
          placeholder="กลุ่มเรียน เช่น ปวส.1/1"
          value={classGroup}
          onChange={(e) => setClassGroup(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm flex-1 min-w-[160px]"
        />
        <button
          disabled={saving}
          className="bg-amber-600 text-white rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50"
        >
          บันทึก
        </button>
      </div>
      {error && <p className="text-red-600 text-sm">{error}</p>}
    </form>
  );
}
