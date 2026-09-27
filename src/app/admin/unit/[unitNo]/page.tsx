import { redirect, notFound } from "next/navigation";
import { requireTeacher } from "@/lib/auth";
import { serviceClient } from "@/lib/supabase/server";
import NavHeader from "@/components/NavHeader";
import GradeRow from "./GradeRow";
import GroupManager from "./GroupManager";
import ActivityGradeRow from "./ActivityGradeRow";

export default async function AdminUnitPage({ params }: PageProps<"/admin/unit/[unitNo]">) {
  const { unitNo } = await params;
  const teacher = await requireTeacher();
  if (!teacher) redirect("/");

  const db = serviceClient();
  const { data: unit } = await db.from("units").select("*").eq("unit_no", Number(unitNo)).maybeSingle();
  if (!unit) notFound();

  const { data: submissions } = await db
    .from("worksheet_submissions")
    .select("*, profiles!worksheet_submissions_student_id_fkey(full_name,email,student_code,class_group)")
    .eq("unit_id", unit.id)
    .order("submitted_at", { ascending: false });

  const { data: attempts } = await db
    .from("quiz_attempts")
    .select("student_id,score,total,profiles!quiz_attempts_student_id_fkey(full_name,email,student_code)")
    .eq("unit_id", unit.id)
    .order("submitted_at", { ascending: false });

  const { data: allStudents } = await db
    .from("profiles")
    .select("id,full_name,email,student_code,class_group")
    .eq("role", "student")
    .order("class_group", { ascending: true })
    .order("student_code", { ascending: true });

  const { data: groupsRaw } = await db
    .from("groups")
    .select("id,name,class_group,group_members(student_id,profiles(id,full_name,email,student_code,class_group))")
    .eq("unit_id", unit.id)
    .order("created_at", { ascending: true });

  type RawGroup = {
    id: string;
    name: string;
    class_group: string | null;
    group_members: { profiles: unknown }[] | null;
  };
  const groups = ((groupsRaw ?? []) as unknown as RawGroup[]).map((g) => ({
    id: g.id,
    name: g.name,
    class_group: g.class_group,
    members: (g.group_members ?? [])
      .map((m) => m.profiles)
      .flat()
      .filter(Boolean) as {
      id: string;
      full_name: string | null;
      email: string;
      student_code: string | null;
      class_group: string | null;
    }[],
  }));

  const { data: activitySubs } = await db
    .from("activity_submissions")
    .select("*, groups(name,class_group,group_members(profiles(full_name,email)))")
    .eq("unit_id", unit.id)
    .order("submitted_at", { ascending: false });

  return (
    <>
      <NavHeader name={teacher.full_name || teacher.email} role={teacher.role} />
      <main className="max-w-4xl mx-auto w-full px-4 py-8 space-y-8">
        <a href="/admin" className="text-sm text-blue-600 hover:underline">
          ← กลับหน้าครู
        </a>
        <h1 className="text-lg font-bold text-slate-800">
          หน่วยที่ {unit.unit_no}: {unit.title}
        </h1>

        <section className="space-y-3">
          <h2 className="font-semibold">คะแนนแบบทดสอบ ({attempts?.length ?? 0} คน)</h2>
          <div className="bg-white border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr className="text-left">
                  <th className="p-2">รหัสนักศึกษา</th>
                  <th className="p-2">ชื่อ</th>
                  <th className="p-2">คะแนน</th>
                </tr>
              </thead>
              <tbody>
                {(attempts ?? []).map((a, i) => (
                  <tr key={i} className="border-t">
                    {/* @ts-expect-error joined relation shape */}
                    <td className="p-2">{a.profiles?.student_code ?? "-"}</td>
                    {/* @ts-expect-error joined relation shape */}
                    <td className="p-2">{a.profiles?.full_name ?? a.profiles?.email}</td>
                    <td className="p-2">
                      {a.score}/{a.total}
                    </td>
                  </tr>
                ))}
                {(attempts ?? []).length === 0 && (
                  <tr>
                    <td className="p-2 text-slate-400" colSpan={3}>
                      ยังไม่มีนักศึกษาทำแบบทดสอบ
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="font-semibold">ใบงานที่ส่งมา ({submissions?.length ?? 0} คน)</h2>
          <div className="space-y-3">
            {(submissions ?? []).map((s) => (
              <GradeRow key={s.id} submission={s} />
            ))}
            {(submissions ?? []).length === 0 && (
              <p className="text-slate-400 text-sm">ยังไม่มีนักศึกษาส่งใบงาน</p>
            )}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="font-semibold">จัดกลุ่มนักศึกษา (สำหรับใบกิจกรรม)</h2>
          <div className="bg-white border rounded-xl p-4">
            <GroupManager unitId={unit.id} allStudents={allStudents ?? []} initialGroups={groups} />
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="font-semibold">ใบกิจกรรมที่ส่งมา ({activitySubs?.length ?? 0} กลุ่ม)</h2>
          <div className="space-y-3">
            {(activitySubs ?? []).map((s) => (
              <ActivityGradeRow
                key={s.id}
                submission={s as unknown as React.ComponentProps<typeof ActivityGradeRow>["submission"]}
              />
            ))}
            {(activitySubs ?? []).length === 0 && (
              <p className="text-slate-400 text-sm">ยังไม่มีกลุ่มส่งใบกิจกรรม</p>
            )}
          </div>
        </section>
      </main>
    </>
  );
}
