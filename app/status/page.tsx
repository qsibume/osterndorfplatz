import { SUPABASE_ANON_KEY, SUPABASE_URL, serviceRoleKey } from "@/lib/env";
import { siteUrl } from "@/lib/format";
import { mailMode } from "@/lib/email";

export const dynamic = "force-dynamic";

// Diagnose: prüft die Einstellungen, ohne geheime Werte anzuzeigen
function describeKey(k: string) {
  if (!k) return "❌ fehlt";
  const nonAscii = [...k].filter((c) => c.charCodeAt(0) > 126 || c.charCodeAt(0) < 33);
  const parts = k.split(".").length;
  return [
    `${k.length} Zeichen`,
    k.startsWith("eyJ") ? "beginnt mit eyJ ✅" : k.startsWith("sb_") ? `beginnt mit ${k.slice(0, 10)}… ⚠️` : "unerwarteter Anfang ❌",
    parts === 3 ? "Format ok ✅" : `${parts} Teile ⚠️`,
    nonAscii.length ? `❌ ${nonAscii.length} ungültige Zeichen` : "keine ungültigen Zeichen ✅",
  ].join(" · ");
}

export default async function Status() {
  let health = "";
  try {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/settings`, { headers: { apikey: SUPABASE_ANON_KEY }, cache: "no-store" });
    health = `${r.status} ${r.ok ? "✅" : "❌ " + (await r.text()).slice(0, 200)}`;
  } catch (e) {
    health = "❌ " + (e instanceof Error ? `${e.name}: ${e.message}` : String(e));
  }
  const rows: [string, string][] = [
    ["Supabase URL", SUPABASE_URL ? `${SUPABASE_URL} ${/^https:\/\/[a-z0-9]+\.supabase\.co$/.test(SUPABASE_URL) ? "✅" : "⚠️"}` : "❌ fehlt"],
    ["Anon Key", describeKey(SUPABASE_ANON_KEY)],
    ["Service Role Key", describeKey(serviceRoleKey())],
    ["Site URL", siteUrl()],
    ["Verbindung zu Supabase", health],
    [
      "E-Mail-Versand",
      mailMode() === "smtp"
        ? `Gmail/SMTP über ${process.env.SMTP_USER} ✅`
        : mailMode() === "resend"
          ? "Resend ✅"
          : "noch nicht eingerichtet",
    ],
    ["Ersatz-Adresse (MAIL_FALLBACK)", process.env.MAIL_FALLBACK || "nicht gesetzt"],
  ];
  return (
    <div className="card scroll">
      <h1>Status</h1>
      <table className="list">
        <tbody>
          {rows.map(([k, v]) => (
            <tr key={k}>
              <th>{k}</th>
              <td style={{ wordBreak: "break-all" }}>{v}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
