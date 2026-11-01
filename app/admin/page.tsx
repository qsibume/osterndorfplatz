import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createArea } from "./actions";
import AreaFields from "./area-form";
import ConfirmButton from "@/components/confirm-button";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  name: string;
  leader_name: string | null;
  leader_email: string | null;
  sort_order: number;
  shifts: { capacity: number; signups: { id: string }[] }[];
};

export default async function AdminPage({ searchParams }: { searchParams: { msg?: string } }) {
  const { db } = await requireAdmin();
  const { data } = await db
    .from("areas")
    .select("id, name, leader_name, leader_email, sort_order, shifts(capacity, signups(id))")
    .order("sort_order")
    .order("name");
  const areas = (data as unknown as Row[]) ?? [];
  const { count: helpers } = await db.from("profiles").select("id", { count: "exact", head: true });
  let total = 0;
  let taken = 0;
  for (const a of areas)
    for (const s of a.shifts) {
      total += s.capacity;
      taken += s.signups.length;
    }

  return (
    <>
      <h1>Admin</h1>
      <p className="lead">
        {helpers ?? 0} registrierte Helfer · {taken} von {total} Plätzen vergeben ·{" "}
        <a href="/admin/export">Alle Anmeldungen als Excel-Datei (CSV)</a>
      </p>
      {searchParams.msg === "deleted" && <div className="notice info">Bereich gelöscht.</div>}

      <div className="card scroll">
        <table className="list">
          <thead>
            <tr>
              <th>Bereich</th>
              <th>Leitung</th>
              <th>Einsätze</th>
              <th>Belegung</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {areas.map((a) => {
              const cap = a.shifts.reduce((n, s) => n + s.capacity, 0);
              const tk = a.shifts.reduce((n, s) => n + s.signups.length, 0);
              return (
                <tr key={a.id}>
                  <td>
                    <strong>{a.name}</strong>
                  </td>
                  <td>
                    {a.leader_name || <span className="muted">–</span>}
                    <br />
                    {a.leader_email ? (
                      <span className="muted">{a.leader_email}</span>
                    ) : (
                      <span style={{ color: "var(--red)" }}>⚠ keine E-Mail</span>
                    )}
                  </td>
                  <td>{a.shifts.length}</td>
                  <td>
                    {tk} / {cap}
                  </td>
                  <td>
                    <Link href={`/admin/bereich/${a.id}`} className="btn ghost small">
                      Bearbeiten
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <h2>Neuen Bereich erfassen</h2>
      <form action={createArea} className="card">
        <AreaFields />
        <div className="field">
          <ConfirmButton className="btn primary">Bereich anlegen</ConfirmButton>
        </div>
      </form>
    </>
  );
}
