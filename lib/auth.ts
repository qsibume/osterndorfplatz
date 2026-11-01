import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export type Profile = { id: string; name: string; email: string; phone: string };

/** Liefert den eingeloggten Helfer oder leitet zur Startseite um. */
export async function requireUser() {
  const supabase = createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/");
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, name, email, phone")
    .eq("id", data.user.id)
    .single();
  const { data: admin } = await supabase.from("admins").select("user_id").eq("user_id", data.user.id).maybeSingle();
  return {
    supabase,
    user: data.user,
    profile: (profile as Profile | null) ?? {
      id: data.user.id,
      name: data.user.email ?? "",
      email: data.user.email ?? "",
      phone: "",
    },
    isAdmin: !!admin,
  };
}

export async function requireAdmin() {
  const ctx = await requireUser();
  if (!ctx.isAdmin) redirect("/bereiche");
  return { ...ctx, db: createServiceClient() };
}
