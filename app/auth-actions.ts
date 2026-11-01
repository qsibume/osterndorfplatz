"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { siteUrl } from "@/lib/format";

export type LinkResult = { ok: true } | { ok: false; code: "not_registered" | "rate_limit" | "other"; message: string };

// Login-Link anfordern – läuft auf dem Server, nicht im Browser
export async function requestLoginLink(input: {
  mode: "register" | "login";
  email: string;
  name?: string;
  phone?: string;
}): Promise<LinkResult> {
  const h = headers();
  const origin = h.get("origin") || siteUrl();
  try {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: input.email.trim().toLowerCase(),
      options: {
        emailRedirectTo: `${origin}/auth/callback`,
        shouldCreateUser: input.mode === "register",
        data: input.mode === "register" ? { name: input.name?.trim(), phone: input.phone?.trim() } : undefined,
      },
    });
    if (!error) return { ok: true };
    const msg = error.message || String(error);
    if (/signups not allowed|not found|otp_disabled/i.test(msg)) return { ok: false, code: "not_registered", message: msg };
    if (/rate|seconds/i.test(msg)) return { ok: false, code: "rate_limit", message: msg };
    console.error("[login] Fehler:", msg);
    return { ok: false, code: "other", message: msg };
  } catch (e) {
    const msg = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
    console.error("[login] Ausnahme:", msg);
    return { ok: false, code: "other", message: msg };
  }
}
