import { redirect } from "next/navigation";
import { requireTeacher } from "@/lib/auth";
import { serviceClient } from "@/lib/supabase/server";
import { getWindowsForUnit } from "@/lib/windows";
import NavHeader from "@/components/NavHeader";
import WindowManager from "./WindowManager";

export default async function AdminPage() {
  const teacher = await requireTeacher();
  if (!teacher) redirect("/");

  const db = serviceClient();
  const { data: units } = await db.from("units").select("*").order("unit_no");

  const rows = await Promise.all(
    (units ?? []).map(async (u) => ({ unit: u, windows: await getWindowsForUnit(u.id) }))
  );

  return (
    <>
      <NavHeader name={teacher.full_name || teacher.email} role={teacher.role} />
      <main className="max-w-4xl mx-auto w-full px-4 py-8 space-y-6">
        <h1 className="text-lg font-bold text-slate-800">หน้าครู: จัดการช่วงเวลาและตรวจงาน</h1>
        <div className="space-y-4">
          {rows.map(({ unit, windows }) => (
            <div key={unit.id} className="bg-white rounded-xl border p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-slate-800">
                  หน่วยที่ {unit.unit_no}: {unit.title}
                  {!unit.is_published && (
                    <span className="ml-2 text-xs text-slate-400">(ยังไม่เผยแพร่)</span>
                  )}
                </h2>
                {unit.is_published && (
                  <a
                    href={`/admin/unit/${unit.unit_no}`}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    ดูงานที่ส่งมา →
                  </a>
                )}
              </div>
              <WindowManager unitId={unit.id} initialWindows={windows} />
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
