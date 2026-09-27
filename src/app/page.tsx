import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { serviceClient } from "@/lib/supabase/server";
import { getWindowsForUnit, nextOrCurrentWindow } from "@/lib/windows";
import NavHeader from "@/components/NavHeader";
import ProfileForm from "./ProfileForm";

function fmt(dt: string) {
  return new Date(dt).toLocaleString("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Bangkok",
  });
}

export default async function Home() {
  const profile = await getCurrentUser();
  if (!profile) redirect("/login");

  const db = serviceClient();
  const { data: units } = await db
    .from("units")
    .select("*")
    .eq("is_published", true)
    .order("unit_no");

  const rows = await Promise.all(
    (units ?? []).map(async (u) => {
      const windows = await getWindowsForUnit(u.id);
      const status = nextOrCurrentWindow(windows, profile.class_group);
      return { unit: u, status };
    })
  );

  return (
    <>
      <NavHeader name={profile.full_name || profile.email} role={profile.role} />
      <main className="max-w-4xl mx-auto w-full px-4 py-8 space-y-6">
        {(!profile.student_code || !profile.class_group) && profile.role === "student" && (
          <ProfileForm initialCode={profile.student_code} initialGroup={profile.class_group} />
        )}

        <h1 className="text-lg font-bold text-slate-800">หน่วยการเรียนรู้</h1>

        <div className="grid gap-4">
          {rows.map(({ unit, status }) => (
            <a
              key={unit.id}
              href={`/unit/${unit.unit_no}`}
              className="block bg-white rounded-xl shadow-sm border p-5 hover:shadow-md transition"
            >
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-slate-800">
                  หน่วยที่ {unit.unit_no}: {unit.title}
                </h2>
                {status.status === "open" && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                    เปิดทำใบงาน/แบบทดสอบ
                  </span>
                )}
                {status.status === "upcoming" && (
                  <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">
                    ยังไม่เปิด
                  </span>
                )}
                {status.status === "closed" && (
                  <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded-full">
                    ปิดรับแล้ว
                  </span>
                )}
                {status.status === "none" && (
                  <span className="text-xs bg-slate-100 text-slate-400 px-2 py-1 rounded-full">
                    ครูยังไม่กำหนดช่วงเวลา
                  </span>
                )}
              </div>
              {status.window && (
                <p className="text-xs text-slate-400 mt-1">
                  {status.status === "open" ? "ปิดรับ " : status.status === "upcoming" ? "เปิด " : "ปิดรับไปแล้วเมื่อ "}
                  {status.status === "upcoming" ? fmt(status.window.opens_at) : fmt(status.window.closes_at)}
                </p>
              )}
            </a>
          ))}
          {rows.length === 0 && (
            <p className="text-slate-400 text-sm">ยังไม่มีหน่วยการเรียนรู้ที่เผยแพร่</p>
          )}
        </div>
      </main>
    </>
  );
}
