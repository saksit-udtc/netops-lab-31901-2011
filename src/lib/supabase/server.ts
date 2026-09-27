import "server-only";
import { createClient } from "@supabase/supabase-js";

// Service-role client: server-only, full access, bypasses RLS.
// All authorization logic must be done in the calling API route BEFORE
// using this client (see src/lib/auth.ts).
export function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
