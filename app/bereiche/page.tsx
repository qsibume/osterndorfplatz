import Link from "next/link";
import { requireUser } from "@/lib/auth";
import type { Area, Shift } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AreasPage() {
  const { supabase, profile } = await requireUser();
  const [{ data: areas }, { data: shifts }] = await Promise.all([
    supabase.from("areas").select("id, name, description, leader_name, sort_order").order("sort_order").order("name"),
    supabase.rpc("shift_overview", { p_area: null }),
  ]);
  const list = (shifts as Shift[] | null) ?? [];
  const stats = new Map<string, { open: number; total: number; mine: number }>();
  for (const s of list) {
    const st = stats.get(s.area_id) ?? { open: 0, total: 0, mine: 0 };
    st.total += 1;
    st.open += Math.max(s.capacity - s.taken, 0);
    st.mine += s.mine ? 1 : 0;
    stats.set(s.area_id, st);
  }
  const sorted = ((areas as Area[] | null) ?? []).sort(
    (a, b) => Number(!!stats.get(b.id)) - Number(!!stats.get(a.id))
  );

  return (
    <>
      <div className="steps">
        <span className="on">1 · Bereich wählen</span>
        <span className="off">2 · Einsatz wählen</span>
      </div>
      <h1>Hallo {profile.name.split(" ")[0]} 👋</h1>
      <p className="lead">In welchem Bereich möchtest du an Ostern 2027 mithelfen?</p>
      <div className="grid">
        {sorted.map((a) => {
          const st = stats.get(a.id);
          return (
            <Link key={a.id} href={`/bereiche/${a.id}`} className="card area-card">
              <h3>{a.name}</h3>
              {a.leader_name && <div className="meta">Leitung: {a.leader_name}</div>}
              {a.description && <div className="meta">{a.description}</div>}
              <div style={{ marginTop: 10, display: "flex", gap: 6, flexWrap: "wrap" }}>
                {!st ? (
                  <span className="pill none">Noch keine Einsätze</span>
                ) : st.open > 0 ? (
                  <span className="pill open">
                    {st.open} {st.open === 1 ? "Platz" : "Plätze"} frei
                  </span>
                ) : (
                  <span className="pill full">Alles vergeben</span>
                )}
                {st && st.mine > 0 && <span className="pill mine">✓ {st.mine} von dir</span>}
              </div>
            </Link>
          );
        })}
      </div>
    </>
  );
}
