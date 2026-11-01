// Versand über Gmail/SMTP (SMTP_USER + SMTP_PASS) oder Resend (RESEND_API_KEY).
// Ist beides nicht eingerichtet, werden E-Mails nur ins Log geschrieben.
import nodemailer from "nodemailer";

type Attachment = { filename: string; content: string; contentType?: string };

const clean = (v?: string) => (v ?? "").trim();

export function mailMode() {
  if (clean(process.env.SMTP_USER) && clean(process.env.SMTP_PASS)) return "smtp" as const;
  if (clean(process.env.RESEND_API_KEY)) return "resend" as const;
  return "none" as const;
}

let transport: nodemailer.Transporter | null = null;
function smtp() {
  if (!transport) {
    const port = Number(process.env.SMTP_PORT || 465);
    transport = nodemailer.createTransport({
      host: clean(process.env.SMTP_HOST) || "smtp.gmail.com",
      port,
      secure: port === 465,
      // Google zeigt App-Passwörter mit Leerzeichen an – die werden hier entfernt
      auth: { user: clean(process.env.SMTP_USER), pass: clean(process.env.SMTP_PASS).replace(/\s+/g, "") },
    });
  }
  return transport;
}

export async function sendMail(opts: {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string | null;
  attachments?: Attachment[];
}) {
  const mode = mailMode();
  if (mode === "none") {
    console.log("[mail] Kein E-Mail-Versand eingerichtet – nicht gesendet:", opts.subject, "->", opts.to);
    return;
  }
  if (mode === "smtp") {
    const user = clean(process.env.SMTP_USER);
    await smtp().sendMail({
      from: clean(process.env.MAIL_FROM) || `"Ostern 2027 Helfer" <${user}>`,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      replyTo: opts.replyTo || undefined,
      attachments: opts.attachments?.map((a) => ({
        filename: a.filename,
        content: a.content,
        contentType: a.contentType,
      })),
    });
    return;
  }
  const key = clean(process.env.RESEND_API_KEY);
  const from = clean(process.env.MAIL_FROM) || "Ostern 2027 <onboarding@resend.dev>";
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
