import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { formatDate, type Area, type Shift } from "@/lib/format";
import ShiftCard from "@/components/shift-card";
import Notices from "@/components/notices";

export const dynamic = "force-dynamic";

export default async function AreaPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { ok?: string; left?: string; error?: string; filter?: string };
}) {
  const { supabase } = await requireUser();
  const { data: area } = await supabase
    .from("areas")
    .select("id, name, description, leader_name, sort_order")
    .eq("id", params.id)
    .maybeSingle();
  if (!area) notFound();
  const { data } = await supabase.rpc("shift_overview", { p_area: params.id });
  const all = (data as Shift[] | null) ?? [];
  const onlyOpen = searchParams.filter === "offen";
  const shifts = onlyOpen ? all.filter((s) => s.mine || s.taken < s.capacity) : all;
  const byDay = new Map<string, Shift[]>();
  for (const s of shifts) byDay.set(s.shift_date, [...(byDay.get(s.shift_date) ?? []), s]);
  const back = `/bereiche/${params.id}`;
  const a = area as Area;

  return (
    <>
      <Link href="/bereiche" className="back">
        ← Anderen Bereich wählen
      </Link>
      <div className="steps">
        <span className="off">1 · Bereich: <b>{a.name}</b></span>
        <span className="on">2 · Einsatz wählen</span>
      </div>
      <h1>{a.name}</h1>
      <p className="lead">
        {a.leader_name ? <>Bereichsleitung: {a.leader_name}. </> : null}
        Wähle einen freien Einsatz. Vergebene Einsätze siehst du grau.
      </p>
      <Notices params={searchParams} shifts={all} />

      {all.length > 0 && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Link className={`btn small ${onlyOpen ? "ghost" : "primary"}`} href={back}>
            Alle ({all.length})
          </Link>
          <Link className={`btn small ${onlyOpen ? "primary" : "ghost"}`} href={`${back}?filter=offen`}>
            Nur offene ({all.filter((s) => s.taken < s.capacity).length})
          </Link>
        </div>
      )}

      {all.length === 0 && (
        <div className="card" style={{ marginTop: 18 }}>
          Für diesen Bereich sind noch keine Einsätze ausgeschrieben. Schau später nochmals vorbei oder wähle einen anderen
          Bereich.
        </div>
      )}
      {all.length > 0 && shifts.length === 0 && (
        <div className="card" style={{ marginTop: 18 }}>
          Alle Einsätze in diesem Bereich sind vergeben. Vielen Dank! 🙏
        </div>
      )}

      {[...byDay.entries()].map(([day, list]) => (
        <section key={day} className="day">
          <h2>{formatDate(day)}</h2>
          <div className="stack">
            {list.map((s) => (
              <ShiftCard key={s.id} shift={s} back={back} />
            ))}
          </div>
        </section>
      ))}
    </>
  );
}
