import { leaveShift, takeShift } from "@/app/actions";
import { formatTime, type Shift } from "@/lib/format";
import ConfirmButton from "./confirm-button";

export default function ShiftCard({ shift, back, areaName }: { shift: Shift; back: string; areaName?: string }) {
  const free = Math.max(shift.capacity - shift.taken, 0);
  const full = free === 0;
  const seats = Array.from({ length: shift.capacity }, (_, i) =>
    shift.mine && i === 0 ? "me" : i < shift.taken ? "taken" : "free"
  );

  return (
    <div className={`card shift ${shift.mine ? "is-mine" : full ? "is-full" : ""}`}>
      <div className="shift-main">
        <div className="shift-time">
          {formatTime(shift.start_time)}–{formatTime(shift.end_time)} Uhr
          {areaName && <span className="muted" style={{ fontWeight: 400 }}> · {areaName}</span>}
        </div>
        <div className="shift-task">{shift.task}</div>
        {shift.note && <div className="shift-note">{shift.note}</div>}
        {shift.location && <div className="shift-note">📍 {shift.location}</div>}
        <div className="seats" aria-label={`${shift.taken} von ${shift.capacity} Plätzen vergeben`}>
          {seats.map((s, i) => (
            <span key={i} className={`seat ${s === "free" ? "" : s}`} />
          ))}
          <small>
            {shift.taken} von {shift.capacity} vergeben
          </small>
        </div>
      </div>
      <div className="shift-actions">
        {shift.mine ? (
          <>
            <span className="pill mine">✓ Du bist eingetragen</span>
            <a className="btn ghost small" href={`/api/ics/${shift.id}`}>
              📅 Kalender
            </a>
            <form action={leaveShift}>
              <input type="hidden" name="shiftId" value={shift.id} />
              <input type="hidden" name="back" value={back} />
              <ConfirmButton className="btn danger small" message="Möchtest du dich wirklich von diesem Einsatz abmelden?">
                Austragen
              </ConfirmButton>
            </form>
          </>
        ) : full ? (
          <span className="pill full">Vergeben</span>
        ) : (
          <>
            <span className="pill open">
              {free} {free === 1 ? "Platz" : "Plätze"} frei
            </span>
            <form action={takeShift}>
              <input type="hidden" name="shiftId" value={shift.id} />
              <input type="hidden" name="back" value={back} />
              <ConfirmButton className="btn primary" message={`Für „${shift.task}“ eintragen?`}>
                Ich helfe mit
              </ConfirmButton>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
