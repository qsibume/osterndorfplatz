import { requireUser } from "@/lib/auth";
import { updateProfile } from "@/app/actions";

export const dynamic = "force-dynamic";

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: { saved?: string; error?: string; missing?: string };
}) {
  const { profile } = await requireUser();
  return (
    <div className="auth">
      <h1>Mein Profil</h1>
      <p className="lead">Diese Angaben erhält die Bereichsleitung, wenn du dich für einen Einsatz einträgst.</p>
      {searchParams.saved && <div className="notice ok">Gespeichert.</div>}
      {searchParams.missing && <div className="notice info">Bitte ergänze zuerst deine Telefonnummer.</div>}
      {searchParams.error && <div className="notice err">Bitte Name und Telefon ausfüllen.</div>}
      <form action={updateProfile} className="card">
        <div className="field">
          <label htmlFor="name">Vor- und Nachname</label>
          <input id="name" name="name" defaultValue={profile.name} required />
        </div>
        <div className="field">
          <label htmlFor="email">E-Mail</label>
          <input id="email" value={profile.email} disabled />
        </div>
        <div className="field">
          <label htmlFor="phone">Telefon</label>
          <input id="phone" name="phone" type="tel" defaultValue={profile.phone} required />
        </div>
        <div className="field">
          <button className="btn primary">Speichern</button>
        </div>
      </form>
    </div>
  );
}
