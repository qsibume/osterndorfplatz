import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { formatDate, type Area, type Shift } from "@/lib/format";
import ShiftCard from "@/components/shift-card";
import Notices from "@/components/notices";

export const dynamic = "force-dynamic";

export default async function MyShifts({
  searchParams,
}: {
  searchParams: { ok?: string; left?: string; error?: string };
}) {
  const { supabase } = await requireUser();
  const [{ data }, { data: areas }] = await Promise.all([
    supabase.rpc("shift_overview", { p_area: null }),
    supabase.from("areas").select("id, name, description, leader_name, sort_order"),
  ]);
  const mine = ((data as Shift[] | null) ?? []).filter((s) => s.mine);
  const names = new Map(((areas as Area[] | null) ?? []).map((a) => [a.id, a.name]));
  const byDay = new Map<string, Shift[]>();
  for (const s of mine) byDay.set(s.shift_date, [...(byDay.get(s.shift_date) ?? []), s]);

  return (
    <>
      <h1>Meine Einsätze</h1>
      <p className="lead">Hier siehst du, wofür du eingetragen bist. Mit „📅 Kalender“ lädst du den Termin herunter.</p>
      <Notices params={searchParams} shifts={mine} />
      {mine.length === 0 ? (
        <div className="card stack">
          <p style={{ margin: 0 }}>Du bist noch für keinen Einsatz eingetragen.</p>
          <Link href="/bereiche" className="btn primary">
            Einsatz suchen
          </Link>
        </div>
      ) : (
        [...byDay.entries()].map(([day, list]) => (
          <section key={day} className="day">
            <h2>{formatDate(day)}</h2>
            <div className="stack">
              {list.map((s) => (
                <ShiftCard key={s.id} shift={s} back="/meine-einsaetze" areaName={names.get(s.area_id)} />
              ))}
            </div>
          </section>
        ))
      )}
    </>
  );
}
