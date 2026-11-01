import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AuthForm from "./auth-form";

export default async function Home({ searchParams }: { searchParams: { error?: string } }) {
  const supabase = createClient();
  const { data } = await supabase.auth.getUser();
  if (data.user) redirect("/bereiche");
  return (
    <div className="auth">
      <div className="hero">
        <div className="egg">🌿🥚🌸</div>
        <h1>Hilf mit an Ostern 2027</h1>
        <p className="lead">
          Registriere dich mit Name, E-Mail und Telefon. Danach siehst du alle Helfereinsätze und kannst dich direkt eintragen.
        </p>
      </div>
      {searchParams.error === "link" && (
        <div className="notice err">Der Login-Link ist abgelaufen oder ungültig. Bitte fordere einen neuen an.</div>
      )}
      <AuthForm />
    </div>
  );
}
