type AreaRow = {
  id?: string;
  name?: string | null;
  description?: string | null;
  leader_name?: string | null;
  leader_email?: string | null;
  leader_phone?: string | null;
  sort_order?: number | null;
};

export default function AreaFields({ area }: { area?: AreaRow }) {
  return (
    <>
      {area?.id && <input type="hidden" name="id" value={area.id} />}
      <div className="row">
        <div>
          <label>Name des Bereichs</label>
          <input name="name" defaultValue={area?.name ?? ""} required />
        </div>
        <div>
          <label>Reihenfolge</label>
          <input name="sort_order" type="number" defaultValue={area?.sort_order ?? 0} />
        </div>
      </div>
      <div className="field">
        <label>Beschreibung (optional, für Helfer sichtbar)</label>
        <input name="description" defaultValue={area?.description ?? ""} />
      </div>
      <div className="row field">
        <div>
          <label>Bereichsleitung</label>
          <input name="leader_name" defaultValue={area?.leader_name ?? ""} />
        </div>
        <div>
          <label>E-Mail Leitung (mehrere mit Komma)</label>
          <input name="leader_email" type="email" multiple defaultValue={area?.leader_email ?? ""} />
        </div>
        <div>
          <label>Telefon Leitung</label>
          <input name="leader_phone" defaultValue={area?.leader_phone ?? ""} />
        </div>
      </div>
    </>
  );
}
