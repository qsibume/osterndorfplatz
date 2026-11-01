import { createServerClient } from "@supabase/ssr";
import { createClient as createJsClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { SUPABASE_URL, SUPABASE_ANON_KEY, serviceRoleKey } from "@/lib/env";

/** Supabase-Client im Namen des eingeloggten Helfers (respektiert Zugriffsrechte). */
export function createClient() {
  const cookieStore = cookies();
  return createServerClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(list) {
          try {
            list.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // In Server Components nicht erlaubt – die Middleware erneuert die Session.
          }
        },
      },
    }
  );
}

/** Voller Zugriff (nur serverseitig, z. B. für E-Mails und den Admin-Bereich). */
export function createServiceClient() {
  return createJsClient(
    SUPABASE_URL,
    serviceRoleKey(),
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
