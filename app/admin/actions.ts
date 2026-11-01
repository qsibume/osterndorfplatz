"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";

function str(f: FormData, k: string) {
  const v = String(f.get(k) ?? "").trim();
  return v === "" ? null : v;
}

function areaFields(f: FormData) {
  return {
    name: str(f, "name") ?? "Neuer Bereich",
    description: str(f, "description"),
    leader_name: str(f, "leader_name"),
    leader_email: str(f, "leader_email")?.toLowerCase() ?? null,
    leader_phone: str(f, "leader_phone"),
    sort_order: Number(f.get("sort_order") || 0),
  };
}

function shiftFields(f: FormData) {
  return {
    shift_date: str(f, "shift_date")!,
    start_time: str(f, "start_time")!,
    end_time: str(f, "end_time")!,
    task: str(f, "task") ?? "Einsatz",
    capacity: Math.max(1, Number(f.get("capacity") || 1)),
    note: str(f, "note"),
    location: str(f, "location"),
  };
}

function done(areaId?: string, msg = "saved") {
  revalidatePath("/", "layout");
  redirect(areaId ? `/admin/bereich/${areaId}?msg=${msg}` : `/admin?msg=${msg}`);
}

export async function createArea(f: FormData) {
  const { db } = await requireAdmin();
  const { data } = await db.from("areas").insert(areaFields(f)).select("id").single();
  done(data?.id);
}

export async function updateArea(f: FormData) {
  const { db } = await requireAdmin();
  const id = String(f.get("id"));
  await db.from("areas").update(areaFields(f)).eq("id", id);
  done(id);
}

export async function deleteArea(f: FormData) {
  const { db } = await requireAdmin();
  await db.from("areas").delete().eq("id", String(f.get("id")));
  done(undefined, "deleted");
}

export async function createShift(f: FormData) {
  const { db } = await requireAdmin();
  const areaId = String(f.get("area_id"));
  await db.from("shifts").insert({ area_id: areaId, ...shiftFields(f) });
  done(areaId);
}

export async function updateShift(f: FormData) {
  const { db } = await requireAdmin();
  const areaId = String(f.get("area_id"));
  await db.from("shifts").update(shiftFields(f)).eq("id", String(f.get("id")));
  done(areaId);
}

export async function deleteShift(f: FormData) {
  const { db } = await requireAdmin();
  const areaId = String(f.get("area_id"));
  await db.from("shifts").delete().eq("id", String(f.get("id")));
  done(areaId, "deleted");
}

export async function removeSignup(f: FormData) {
  const { db } = await requireAdmin();
  const areaId = String(f.get("area_id"));
  await db.from("signups").delete().eq("id", String(f.get("id")));
  done(areaId, "removed");
}
