import "server-only";
import { ssrServerClient } from "./supabase/ssrServer";
import { serviceClient } from "./supabase/server";

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  role: "student" | "teacher";
  student_code: string | null;
  class_group: string | null;
};

/**
 * Verifies the current request's Supabase Auth session, enforces the
 * college email-domain allowlist, and ensures a matching row exists in
 * public.profiles (creating it on first login). Returns null if there is
 * no valid session.
 */
export async function getCurrentUser(): Promise<Profile | null> {
  const ssr = await ssrServerClient();
  const {
    data: { user },
  } = await ssr.auth.getUser();
  if (!user || !user.email) return null;

  const allowedDomain = process.env.ALLOWED_EMAIL_DOMAIN;
  if (allowedDomain && !user.email.toLowerCase().endsWith("@" + allowedDomain)) {
    // Not a college account -- do not create a profile, do not authorize.
    return null;
  }

  const db = serviceClient();
  const { data: existing } = await db
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (existing) return existing as Profile;

  // A row may have been pre-seeded by email (e.g. to grant teacher role
  // before that person's first login). Claim it by moving it onto the
  // real auth.users id instead of creating a duplicate student row.
  const { data: byEmail } = await db
    .from("profiles")
    .select("*")
    .eq("email", user.email)
    .maybeSingle();
  if (byEmail) {
    const { data: claimed } = await db
      .from("profiles")
      .update({ id: user.id, full_name: byEmail.full_name ?? (user.user_metadata?.full_name as string) ?? null })
      .eq("email", user.email)
      .select("*")
      .single();
    return (claimed as Profile) ?? (byEmail as Profile);
  }

  const { data: created, error } = await db
    .from("profiles")
    .insert({
      id: user.id,
      email: user.email,
      full_name: (user.user_metadata?.full_name as string) ?? null,
    })
    .select("*")
    .single();

  if (error) {
    // Race with another request creating the same row concurrently.
    const { data: retry } = await db
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();
    return (retry as Profile) ?? null;
  }
  return created as Profile;
}

export async function requireTeacher(): Promise<Profile | null> {
  const profile = await getCurrentUser();
  if (!profile || profile.role !== "teacher") return null;
  return profile;
}
