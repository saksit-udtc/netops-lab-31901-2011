"use client";

import { useMemo, useState } from "react";

type StudentOpt = {
  id: string;
  full_name: string | null;
  email: string;
  student_code: string | null;
  class_group: string | null;
};

type GroupWithMembers = {
  id: string;
  name: string;
  class_group: string | null;
  members: StudentOpt[];
};

export default function GroupManager({
  unitId,
  allStudents,
  initialGroups,
}: {
  unitId: number;
  allStudents: StudentOpt[];
  initialGroups: GroupWithMembers[];
}) {
  const [groups, setGroups] = useState(initialGroups);
  const [name, setName] = useState("");
  const [classGroup, setClassGroup] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const assignedIds = useMemo(
    () => new Set(groups.flatMap((g) => g.members.map((m) => m.id))),
    [groups]
  );
  const unassigned = allStudents.filter((s) => !assignedIds.has(s.id));

  function toggle(id: string) {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function createGroup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError("กรุณาระบุชื่อกลุ่ม");
      return;
    }
    if (selected.size === 0) {
      setError("กรุณาเลือกสมาชิกอย่างน้อย 1 คน");
      return;
    }
    setSaving(true);
    const res = await fetch("/api/admin/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        unitId,
        name,
        classGroup: classGroup || null,
        studentIds: Array.from(selected),
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error || "สร้างกลุ่มไม่สำเร็จ");
      return;
    }
    const members = allStudents.filter((s) => selected.has(s.id));
    setGroups((gs) => [...gs, { id: data.group.id, name, class_group: classGroup || null, members }]);
    setName("");
    setClassGroup("");
    setSelected(new Set());
  }

  async function removeGroup(id: string) {
    await fetch(`/api/admin/groups?id=${id}`, { method: "DELETE" });
    setGroups((gs) => gs.filter((g) => g.id !== id));
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {groups.map((g) => (
          <div key={g.id} className="bg-slate-50 rounded-lg px-3 py-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="font-medium">
                {g.name}
                {g.class_group ? ` · ${g.class_group}` : ""}
              </span>
              <button onClick={() => removeGroup(g.id)} className="text-red-500 text-xs">
                ลบกลุ่ม
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {g.members.map((m) => m.full_name || m.email).join(", ")}
            </p>
          </div>
        ))}
        {groups.length === 0 && <p className="text-sm text-slate-400">ยังไม่มีกลุ่ม</p>}
      </div>

      <form onSubmit={createGroup} className="space-y-2 pt-2 border-t">
        <div className="flex flex-wrap gap-2">
          <input
            placeholder="ชื่อกลุ่ม (เช่น กลุ่ม 1)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border rounded-lg px-2 py-1 text-sm w-40"
          />
          <input
            placeholder="กลุ่มเรียน (ไม่บังคับ)"
            value={classGroup}
            onChange={(e) => setClassGroup(e.target.value)}
            className="border rounded-lg px-2 py-1 text-sm w-40"
          />
        </div>
        <div className="max-h-48 overflow-y-auto border rounded-lg p-2 space-y-1">
          {unassigned.map((s) => (
            <label key={s.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={selected.has(s.id)}
                onChange={() => toggle(s.id)}
              />
              <span>
                {s.student_code ?? "-"} · {s.full_name ?? s.email}
                {s.class_group ? ` (${s.class_group})` : ""}
              </span>
            </label>
          ))}
          {unassigned.length === 0 && (
            <p className="text-xs text-slate-400">นักศึกษาทุกคนถูกจัดกลุ่มแล้ว</p>
          )}
        </div>
        {error && <p className="text-red-600 text-xs">{error}</p>}
        <button
          disabled={saving}
          className="bg-slate-800 text-white rounded-lg px-3 py-1.5 text-sm disabled:opacity-50"
        >
          สร้างกลุ่ม
        </button>
      </form>
    </div>
  );
}
