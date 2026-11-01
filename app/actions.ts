"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { loadShift, sendCancelMails, sendSignupMails } from "@/lib/shift-mail";

const ERRORS: Record<string, string> = {
  shift_full: "full",
  already_signed_up: "already",
  shift_not_found: "notfound",
};

function back(formData: FormData) {
  const to = String(formData.get("back") || "/bereiche");
  return to.startsWith("/") ? to : "/bereiche";
}

function withParam(path: string, key: string, value: string) {
  return path + (path.includes("?") ? "&" : "?") + `${key}=${encodeURIComponent(value)}`;
}

export async function takeShift(formData: FormData) {
  const shiftId = String(formData.get("shiftId"));
  const { supabase, profile } = await requireUser();
  const target = back(formData);

  if (!profile.phone) redirect(withParam("/profil", "missing", "phone"));

  const { data, error } = await supabase.rpc("take_shift", { p_shift: shiftId });
  if (error) {
    const code = Object.keys(ERRORS).find((k) => error.message.includes(k));
    redirect(withParam(target, "error", code ? ERRORS[code] : "unknown"));
  }

  const shift = await loadShift(shiftId);
  if (shift) {
    try {
      await sendSignupMails(shift, profile, Number(data) || 1);
    } catch (e) {
      console.error("[mail] Anmeldung", e);
    }
  }
  revalidatePath("/", "layout");
  redirect(withParam(target, "ok", shiftId));
}

export async function leaveShift(formData: FormData) {
  const shiftId = String(formData.get("shiftId"));
  const { supabase, profile } = await requireUser();
  const target = back(formData);

  const { data, error } = await supabase.rpc("leave_shift", { p_shift: shiftId });
  if (error) redirect(withParam(target, "error", "unknown"));

  if (data) {
    const shift = await loadShift(shiftId);
    if (shift) {
      try {
        await sendCancelMails(shift, profile);
      } catch (e) {
        console.error("[mail] Abmeldung", e);
      }
    }
  }
  revalidatePath("/", "layout");
  redirect(withParam(target, "left", shiftId));
}

export async function updateProfile(formData: FormData) {
  const { supabase, user } = await requireUser();
  const name = String(formData.get("name") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  if (!name || !phone) redirect("/profil?error=required");
  await supabase.from("profiles").update({ name, phone }).eq("id", user.id);
  revalidatePath("/", "layout");
  redirect("/profil?saved=1");
}

export async function logout() {
  const { supabase } = await requireUser();
  await supabase.auth.signOut();
  redirect("/");
}
