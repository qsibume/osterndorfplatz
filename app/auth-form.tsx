"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AuthForm() {
  const [mode, setMode] = useState<"register" | "login">("register");
  const [busy, setBusy] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const f = new FormData(e.currentTarget);
    const email = String(f.get("email") || "").trim().toLowerCase();
    const name = String(f.get("name") || "").trim();
    const phone = String(f.get("phone") || "").trim();
    if (mode === "register" && (!name || !phone)) {
      setError("Bitte Name und Telefon ausfüllen.");
      return;
    }
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        shouldCreateUser: mode === "register",
        data: mode === "register" ? { name, phone } : undefined,
      },
    });
    setBusy(false);
    if (error) {
      if (/signups not allowed|not found|otp_disabled/i.test(error.message)) {
        setError("Diese E-Mail ist noch nicht registriert. Bitte registriere dich zuerst.");
        setMode("register");
      } else if (/rate|seconds/i.test(error.message)) {
        setError("Bitte warte kurz, bevor du einen neuen Link anforderst.");
      } else if (/type ?error|load failed|failed to fetch|network/i.test(error.message)) {
        setError("Keine Verbindung zum Server. Bitte versuche es nochmals oder mit einem anderen Browser. (" + error.message + ")");
      } else {
        setError("Das hat nicht geklappt: " + error.message);
      }
      return;
    }
    setSentTo(email);
  }

  if (sentTo) {
    return (
      <div className="card stack">
        <h2 style={{ marginTop: 0 }}>📬 Schau in dein Postfach</h2>
        <p>
          Wir haben dir einen Login-Link an <strong>{sentTo}</strong> geschickt. Klicke auf den Link, um zu den Helfereinsätzen zu kommen.
        </p>
        <p className="muted">Keine E-Mail erhalten? Schau im Spam-Ordner nach.</p>
        <button className="btn ghost" onClick={() => setSentTo(null)}>
          Andere E-Mail verwenden
        </button>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="tabs" role="tablist">
        <button type="button" className={mode === "register" ? "active" : ""} onClick={() => setMode("register")}>
          Registrieren
        </button>
        <button type="button" className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>
          Ich bin schon registriert
        </button>
      </div>
      {error && <div className="notice err">{error}</div>}
      <form onSubmit={onSubmit}>
        {mode === "register" && (
          <div className="field">
            <label htmlFor="name">Vor- und Nachname</label>
            <input id="name" name="name" autoComplete="name" required />
          </div>
        )}
        <div className="field">
          <label htmlFor="email">E-Mail</label>
          <input id="email" name="email" type="email" autoComplete="email" required />
        </div>
        {mode === "register" && (
          <div className="field">
            <label htmlFor="phone">Telefon</label>
            <input id="phone" name="phone" type="tel" autoComplete="tel" placeholder="079 123 45 67" required />
          </div>
        )}
        <div className="field">
          <button className="btn primary" style={{ width: "100%" }} disabled={busy}>
            {busy ? "Wird gesendet …" : mode === "register" ? "Registrieren" : "Login-Link senden"}
          </button>
        </div>
        <p className="muted" style={{ fontSize: 14, marginBottom: 0 }}>
          Du erhältst einen Link per E-Mail. Ein Passwort brauchst du nicht.
        </p>
      </form>
    </div>
  );
}
