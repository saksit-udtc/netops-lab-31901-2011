import "server-only";
import { serviceClient } from "./supabase/server";

export type OpenWindow = {
  id: string;
  unit_id: number;
  label: string | null;
  class_group: string | null;
  opens_at: string;
  closes_at: string;
};

/** All open windows for a unit (any class group), ordered by opens_at. */
export async function getWindowsForUnit(unitId: number): Promise<OpenWindow[]> {
  const db = serviceClient();
  const { data } = await db
    .from("open_windows")
    .select("*")
    .eq("unit_id", unitId)
    .order("opens_at", { ascending: true });
  return (data as OpenWindow[]) ?? [];
}

/**
 * Whether "now" falls inside at least one window for this unit that also
 * applies to this student's class_group (a window with class_group = null
 * applies to everyone).
 */
export function isWindowOpenNow(windows: OpenWindow[], classGroup: string | null) {
  const now = Date.now();
  return windows.some((w) => {
    if (w.class_group && w.class_group !== classGroup) return false;
    return now >= new Date(w.opens_at).getTime() && now <= new Date(w.closes_at).getTime();
  });
}

export function nextOrCurrentWindow(windows: OpenWindow[], classGroup: string | null) {
  const applicable = windows.filter((w) => !w.class_group || w.class_group === classGroup);
  const now = Date.now();
  const current = applicable.find(
    (w) => now >= new Date(w.opens_at).getTime() && now <= new Date(w.closes_at).getTime()
  );
  if (current) return { status: "open" as const, window: current };
  const upcoming = applicable
    .filter((w) => new Date(w.opens_at).getTime() > now)
    .sort((a, b) => new Date(a.opens_at).getTime() - new Date(b.opens_at).getTime())[0];
  if (upcoming) return { status: "upcoming" as const, window: upcoming };
  const past = applicable.sort(
    (a, b) => new Date(b.closes_at).getTime() - new Date(a.closes_at).getTime()
  )[0];
  return { status: past ? ("closed" as const) : ("none" as const), window: past };
}
