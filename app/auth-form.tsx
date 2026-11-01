"use client";

import { useState } from "react";
import { requestLoginLink } from "./auth-actions";

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
    let res;
    try {
      res = await requestLoginLink({ mode, email, name, phone });
    } catch (err) {
      res = { ok: false as const, code: "other" as const, message: String(err) };
    }
    setBusy(false);
    if (!res.ok) {
      if (res.code === "not_registered") {
        setError("Diese E-Mail ist noch nicht registriert. Bitte registriere dich zuerst.");
        setMode("register");
      } else if (res.code === "rate_limit") {
        setError("Bitte warte kurz, bevor du einen neuen Link anforderst.");
      } else {
        setError("Das hat nicht geklappt: " + res.message);
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
