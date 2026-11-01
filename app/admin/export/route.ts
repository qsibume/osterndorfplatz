import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { formatDate, formatTime } from "@/lib/format";

type Row = {
  shift_date: string;
  start_time: string;
  end_time: string;
  task: string;
  capacity: number;
  area: { name: string; leader_name: string | null };
  signups: { user_id: string; created_at: string }[];
};

// Alle Anmeldungen als CSV (öffnet in Excel)
export async function GET() {
  const { db } = await requireAdmin();
  const { data } = await db
    .from("shifts")
    .select("shift_date, start_time, end_time, task, capacity, area:areas(name, leader_name), signups(user_id, created_at)")
    .order("shift_date")
    .order("start_time");
  const shifts = (data as unknown as Row[]) ?? [];
  const { data: people } = await db.from("profiles").select("id, name, email, phone");
  const byId = new Map((people ?? []).map((p) => [p.id, p]));
  const cell = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines = [["Bereich", "Leitung", "Datum", "Zeit", "Aufgabe", "Plätze", "Helfer", "E-Mail", "Telefon", "Angemeldet am"]];
  for (const s of shifts) {
    const base = [s.area.name, s.area.leader_name, formatDate(s.shift_date), `${formatTime(s.start_time)}-${formatTime(s.end_time)}`, s.task, s.capacity];
    if (s.signups.length === 0) lines.push([...base, "(offen)", "", "", ""].map(String));
    for (const x of s.signups) {
      const p = byId.get(x.user_id);
      lines.push([...base, p?.name, p?.email, p?.phone, new Date(x.created_at).toLocaleString("de-CH", { timeZone: "Europe/Zurich" })].map((v) => String(v ?? "")));
    }
  }
  const csv = "﻿" + lines.map((l) => l.map(cell).join(";")).join("\r\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="helfer-ostern-2027.csv"',
    },
  });
}
