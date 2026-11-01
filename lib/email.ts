// Versand über Resend (https://resend.com). Ohne API-Key werden E-Mails nur ins Log geschrieben.

type Attachment = { filename: string; content: string; contentType?: string };

export async function sendMail(opts: {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string | null;
  attachments?: Attachment[];
}) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM || "Ostern 2027 <onboarding@resend.dev>";
  if (!key) {
    console.log("[mail] RESEND_API_KEY fehlt – E-Mail nicht gesendet:", opts.subject, "->", opts.to);
    return;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: Array.isArray(opts.to) ? opts.to : [opts.to],
      subject: opts.subject,
      html: opts.html,
      ...(opts.replyTo ? { reply_to: opts.replyTo } : {}),
      ...(opts.attachments
        ? {
            attachments: opts.attachments.map((a) => ({
              filename: a.filename,
              content: Buffer.from(a.content, "utf8").toString("base64"),
              ...(a.contentType ? { content_type: a.contentType } : {}),
            })),
          }
        : {}),
    }),
  });
  if (!res.ok) console.error("[mail] Fehler beim Senden:", res.status, await res.text());
}

export function esc(s: string | null | undefined) {
  return (s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

export function layout(title: string, body: string) {
  return `<!doctype html><html><body style="margin:0;background:#f6f3ee;font-family:Arial,Helvetica,sans-serif;color:#2b2a28">
<div style="max-width:560px;margin:0 auto;padding:24px">
  <div style="background:#fff;border-radius:12px;padding:28px;border:1px solid #e8e1d6">
    <p style="margin:0 0 4px;color:#9a6b1f;font-size:13px;letter-spacing:.04em;text-transform:uppercase">Ostern 2027 · Helfer</p>
    <h1 style="margin:0 0 18px;font-size:22px">${esc(title)}</h1>
    ${body}
  </div>
</div></body></html>`;
}

export function table(rows: [string, string | null | undefined][]) {
  return `<table style="border-collapse:collapse;width:100%;margin:12px 0 18px">${rows
    .filter(([, v]) => v)
    .map(
      ([k, v]) =>
        `<tr><td style="padding:6px 12px 6px 0;color:#6b665e;vertical-align:top;white-space:nowrap">${esc(k)}</td><td style="padding:6px 0">${esc(v)}</td></tr>`
    )
    .join("")}</table>`;
}
