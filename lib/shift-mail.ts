import { createServiceClient } from "@/lib/supabase/server";
import { buildIcs } from "@/lib/ics";
import { esc, layout, sendMail, table } from "@/lib/email";
import { formatSlot, siteUrl } from "@/lib/format";
import type { Profile } from "@/lib/auth";

export type ShiftDetails = {
  id: string;
  shift_date: string;
  start_time: string;
  end_time: string;
  task: string;
  capacity: number;
  note: string | null;
  location: string | null;
  area: {
    id: string;
    name: string;
    leader_name: string | null;
    leader_email: string | null;
    leader_phone: string | null;
  };
};

export async function loadShift(shiftId: string): Promise<ShiftDetails | null> {
  const db = createServiceClient();
  const { data } = await db
    .from("shifts")
    .select("id, shift_date, start_time, end_time, task, capacity, note, location, area:areas(id, name, leader_name, leader_email, leader_phone)")
    .eq("id", shiftId)
    .single();
  return (data as unknown as ShiftDetails) ?? null;
}

export function shiftIcs(s: ShiftDetails, userId: string, method: "PUBLISH" | "CANCEL" = "PUBLISH") {
  const leader = s.area.leader_name ? `Bereichsleitung: ${s.area.leader_name}` : "";
  return buildIcs({
    uid: `${s.id}-${userId}@helfer-ostern-2027`,
    date: s.shift_date,
    start: s.start_time,
    end: s.end_time,
    title: `Helfereinsatz Ostern: ${s.task} (${s.area.name})`,
    description: [
      `Bereich: ${s.area.name}`,
      `Aufgabe: ${s.task}`,
      s.note ? `Hinweis: ${s.note}` : "",
      leader,
      s.area.leader_phone ? `Telefon: ${s.area.leader_phone}` : "",
      `Meine Einsätze: ${siteUrl()}/meine-einsaetze`,
    ]
      .filter(Boolean)
      .join("\n"),
    location: s.location || process.env.EVENT_LOCATION || null,
    organizerName: s.area.leader_name,
    organizerEmail: emails(s.area.leader_email)[0] ?? null,
    method,
  });
}

// Mehrere Leiter-Adressen sind mit Komma getrennt möglich
function emails(v: string | null | undefined) {
  return (v ?? "").split(/[,;\s]+/).map((e) => e.trim()).filter((e) => e.includes("@"));
}

function leaderRecipient(s: ShiftDetails) {
  const list = emails(s.area.leader_email);
  if (list.length) return list;
  const fb = emails(process.env.MAIL_FALLBACK);
  return fb.length ? fb : null;
}

export async function sendSignupMails(s: ShiftDetails, helper: Profile, taken: number) {
  const slot = formatSlot(s);
  const ics = shiftIcs(s, helper.id);
  const leaderName = s.area.leader_name || "die Bereichsleitung";

  // 1) Bestätigung an den Helfer, mit Kalendereintrag
  await sendMail({
    to: helper.email,
    subject: `Danke! Du bist eingetragen: ${s.task} – ${slot}`,
    replyTo: emails(s.area.leader_email).join(", ") || null,
    html: layout(
      "Danke, es hat geklappt!",
      `<p>Hallo ${esc(helper.name)}</p>
       <p>Du bist für folgenden Helfereinsatz an Ostern 2027 eingetragen:</p>
       ${table([
         ["Bereich", s.area.name],
         ["Aufgabe", s.task],
         ["Wann", slot],
         ["Hinweis", s.note],
         ["Ort", s.location || process.env.EVENT_LOCATION],
       ])}
       <p><strong>${esc(leaderName)}</strong> meldet sich noch bei dir mit weiteren Infos.</p>
       <p>Im Anhang findest du einen Kalendereintrag (<em>einsatz.ics</em>). Einfach öffnen und in deinen Kalender übernehmen.
       Du kannst ihn auch hier herunterladen:
       <a href="${siteUrl()}/api/ics/${s.id}">Kalendereintrag herunterladen</a>.</p>
       <p>Falls du doch nicht kannst, trage dich bitte unter
       <a href="${siteUrl()}/meine-einsaetze">Meine Einsätze</a> wieder aus.</p>
       <p>Herzlichen Dank für deine Mithilfe!</p>`
    ),
    attachments: [{ filename: "einsatz.ics", content: ics, contentType: "text/calendar; charset=utf-8; method=PUBLISH" }],
  });

  // 2) Meldung an die Bereichsleitung
  const to = leaderRecipient(s);
  if (to) {
    await sendMail({
      to,
      subject: `Neue Helfer-Anmeldung: ${helper.name} – ${s.task} (${slot})`,
      replyTo: helper.email,
      html: layout(
        "Neue Helfer-Anmeldung",
        `<p>Hallo ${esc(s.area.leader_name || "Bereichsleitung")}</p>
         ${!s.area.leader_email ? `<p style="color:#b4541a">Hinweis: Für den Bereich „${esc(s.area.name)}“ ist keine Leiter-E-Mail hinterlegt. Diese Meldung geht deshalb an die Organisation.</p>` : ""}
         <p>Für deinen Bereich hat sich jemand gemeldet:</p>
         ${table([
           ["Name", helper.name],
           ["E-Mail", helper.email],
           ["Telefon", helper.phone],
           ["Bereich", s.area.name],
           ["Aufgabe", s.task],
           ["Wann", slot],
           ["Belegung", `${taken} von ${s.capacity} Plätzen vergeben`],
         ])}
         <p>Bitte melde dich bei ${esc(helper.name)} mit den weiteren Infos. Du kannst direkt auf diese E-Mail antworten.</p>`
      ),
    });
  }
}

export async function sendCancelMails(s: ShiftDetails, helper: Profile) {
  const slot = formatSlot(s);
  await sendMail({
    to: helper.email,
    subject: `Abgemeldet: ${s.task} – ${slot}`,
    html: layout(
      "Du bist abgemeldet",
      `<p>Hallo ${esc(helper.name)}</p>
       <p>Du hast dich von diesem Einsatz abgemeldet:</p>
       ${table([["Bereich", s.area.name], ["Aufgabe", s.task], ["Wann", slot]])}
       <p>Mit dem Anhang kannst du den Termin aus deinem Kalender entfernen.</p>`
    ),
    attachments: [
      { filename: "absage.ics", content: shiftIcs(s, helper.id, "CANCEL"), contentType: "text/calendar; charset=utf-8; method=CANCEL" },
    ],
  });

  const to = leaderRecipient(s);
  if (to) {
    await sendMail({
      to,
      subject: `Abmeldung: ${helper.name} – ${s.task} (${slot})`,
      replyTo: helper.email,
      html: layout(
        "Ein Helfer hat sich abgemeldet",
        `<p>Hallo ${esc(s.area.leader_name || "Bereichsleitung")}</p>
         <p>Folgende Person hat sich abgemeldet. Der Platz ist wieder frei.</p>
         ${table([
           ["Name", helper.name],
           ["E-Mail", helper.email],
           ["Telefon", helper.phone],
           ["Bereich", s.area.name],
           ["Aufgabe", s.task],
           ["Wann", slot],
         ])}`
      ),
    });
  }
}
