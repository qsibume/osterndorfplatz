import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { formatDate, formatTime } from "@/lib/format";
import { createShift, deleteArea, deleteShift, removeSignup, updateArea, updateShift } from "../../actions";
import AreaFields from "../../area-form";
import ShiftFields from "../../shift-form";
import ConfirmButton from "@/components/confirm-button";

export const dynamic = "force-dynamic";

type ShiftRow = {
  id: string;
  shift_date: string;
  start_time: string;
  end_time: string;
  task: string;
  capacity: number;
  note: string | null;
  location: string | null;
  signups: { id: string; created_at: string; user_id: string }[];
};

const MSG: Record<string, string> = {
  saved: "Gespeichert.",
  deleted: "Einsatz gelöscht.",
  removed: "Helfer aus dem Einsatz entfernt.",
};

export default async function AdminArea({ params, searchParams }: { params: { id: string }; searchParams: { msg?: string } }) {
  const { db } = await requireAdmin();
  const { data: area } = await db.from("areas").select("*").eq("id", params.id).maybeSingle();
  if (!area) notFound();
  const { data } = await db
    .from("shifts")
    .select("id, shift_date, start_time, end_time, task, capacity, note, location, signups(id, created_at, user_id)")
    .eq("area_id", params.id)
    .order("shift_date")
    .order("start_time");
  const shifts = (data as unknown as ShiftRow[]) ?? [];
  const userIds = [...new Set(shifts.flatMap((s) => s.signups.map((x) => x.user_id)))];
  const { data: people } = userIds.length
    ? await db.from("profiles").select("id, name, email, phone").in("id", userIds)
    : { data: [] as { id: string; name: string; email: string; phone: string }[] };
  const byId = new Map((people ?? []).map((p) => [p.id, p]));

  return (
    <>
      <Link href="/admin" className="back">
        ← Alle Bereiche
      </Link>
      <h1>{area.name}</h1>
      {searchParams.msg && <div className="notice ok">{MSG[searchParams.msg] ?? "Gespeichert."}</div>}
      {!area.leader_email && (
        <div className="notice err">
          Für diesen Bereich ist keine Leiter-E-Mail hinterlegt. Meldungen gehen an die Ersatz-Adresse (MAIL_FALLBACK).
        </div>
      )}

      <form action={updateArea} className="card">
        <AreaFields area={area} />
        <div className="field" style={{ display: "flex", gap: 8 }}>
          <ConfirmButton className="btn primary">Bereich speichern</ConfirmButton>
        </div>
      </form>

      <h2>Einsätze ({shifts.length})</h2>
      <div className="stack">
        {shifts.map((s) => (
          <div key={s.id} className="card">
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <div>
                <strong>
                  {formatDate(s.shift_date)}, {formatTime(s.start_time)}–{formatTime(s.end_time)}
                </strong>
                <div>
                  {s.task}
                  {s.note && <span className="muted"> · {s.note}</span>}
                </div>
              </div>
              <span className={`pill ${s.signups.length >= s.capacity ? "full" : "open"}`}>
                {s.signups.length} / {s.capacity} vergeben
              </span>
            </div>
            {s.signups.length > 0 && (
              <div className="scroll" style={{ marginTop: 10 }}>
                <table className="list">
                  <tbody>
                    {s.signups.map((x) => {
                      const p = byId.get(x.user_id);
                      return (
                        <tr key={x.id}>
                          <td>{p?.name}</td>
                          <td>
                            <a href={`mailto:${p?.email}`}>{p?.email}</a>
                          </td>
                          <td>
                            <a href={`tel:${p?.phone}`}>{p?.phone}</a>
                          </td>
                          <td style={{ textAlign: "right" }}>
                            <form action={removeSignup}>
                              <input type="hidden" name="id" value={x.id} />
                              <input type="hidden" name="area_id" value={params.id} />
                              <ConfirmButton className="btn danger small" message={`${p?.name} aus diesem Einsatz entfernen?`}>
                                Entfernen
                              </ConfirmButton>
                            </form>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            <details className="edit" style={{ marginTop: 10 }}>
              <summary>Einsatz bearbeiten</summary>
              <form action={updateShift} style={{ marginTop: 10 }}>
                <ShiftFields areaId={params.id} shift={s} />
                <div className="field" style={{ display: "flex", gap: 8 }}>
                  <ConfirmButton className="btn primary small">Speichern</ConfirmButton>
                </div>
              </form>
              <form action={deleteShift} style={{ marginTop: 8 }}>
                <input type="hidden" name="id" value={s.id} />
                <input type="hidden" name="area_id" value={params.id} />
                <ConfirmButton
                  className="btn danger small"
                  message={
                    s.signups.length
                      ? `Achtung: ${s.signups.length} Helfer sind eingetragen. Einsatz trotzdem löschen?`
                      : "Einsatz löschen?"
                  }
                >
                  Einsatz löschen
                </ConfirmButton>
              </form>
            </details>
          </div>
        ))}
      </div>

      <h2>Neuen Einsatz erfassen</h2>
      <form action={createShift} className="card">
        <ShiftFields areaId={params.id} />
        <div className="field">
          <ConfirmButton className="btn primary">Einsatz anlegen</ConfirmButton>
        </div>
      </form>

      <h2>Bereich löschen</h2>
      <form action={deleteArea} className="card">
        <input type="hidden" name="id" value={params.id} />
        <p style={{ marginTop: 0 }} className="muted">Löscht den Bereich mit allen Einsätzen und Anmeldungen.</p>
        <ConfirmButton className="btn danger" message={`Bereich „${area.name}“ mit allen Einsätzen löschen?`}>
          Bereich löschen
        </ConfirmButton>
      </form>
    </>
  );
}
