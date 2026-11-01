type ShiftRow = {
  id?: string;
  shift_date?: string;
  start_time?: string;
  end_time?: string;
  task?: string;
  capacity?: number;
  note?: string | null;
  location?: string | null;
};

export default function ShiftFields({ areaId, shift }: { areaId: string; shift?: ShiftRow }) {
  return (
    <>
      <input type="hidden" name="area_id" value={areaId} />
      {shift?.id && <input type="hidden" name="id" value={shift.id} />}
      <div className="row">
        <div>
          <label>Datum</label>
          <input name="shift_date" type="date" defaultValue={shift?.shift_date ?? "2027-03-26"} required />
        </div>
        <div>
          <label>Von</label>
          <input name="start_time" type="time" defaultValue={shift?.start_time?.slice(0, 5) ?? ""} required />
        </div>
        <div>
          <label>Bis</label>
          <input name="end_time" type="time" defaultValue={shift?.end_time?.slice(0, 5) ?? ""} required />
        </div>
        <div>
          <label>Anzahl Personen</label>
          <input name="capacity" type="number" min={1} defaultValue={shift?.capacity ?? 1} required />
        </div>
      </div>
      <div className="row field">
        <div>
          <label>Aufgabe</label>
          <input name="task" defaultValue={shift?.task ?? ""} required />
        </div>
        <div>
          <label>Hinweis (optional)</label>
          <input name="note" defaultValue={shift?.note ?? ""} />
        </div>
        <div>
          <label>Ort (optional)</label>
          <input name="location" defaultValue={shift?.location ?? ""} />
        </div>
      </div>
    </>
  );
}
