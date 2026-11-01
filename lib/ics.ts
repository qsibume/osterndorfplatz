// Erstellt eine Kalenderdatei (.ics), die Outlook, Apple- und Google-Kalender verstehen.

const VTIMEZONE = [
  "BEGIN:VTIMEZONE",
  "TZID:Europe/Zurich",
  "BEGIN:DAYLIGHT",
  "TZOFFSETFROM:+0100",
  "TZOFFSETTO:+0200",
  "TZNAME:CEST",
  "DTSTART:19700329T020000",
  "RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU",
  "END:DAYLIGHT",
  "BEGIN:STANDARD",
  "TZOFFSETFROM:+0200",
  "TZOFFSETTO:+0100",
  "TZNAME:CET",
  "DTSTART:19701025T030000",
  "RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU",
  "END:STANDARD",
  "END:VTIMEZONE",
];

function esc(s: string) {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

// Zeilen länger als 75 Zeichen müssen umgebrochen werden (RFC 5545)
function fold(line: string) {
  const out: string[] = [];
  let rest = line;
  while (rest.length > 74) {
    out.push(rest.slice(0, 74));
    rest = " " + rest.slice(74);
  }
  out.push(rest);
  return out.join("\r\n");
}

function local(date: string, time: string) {
  return date.replace(/-/g, "") + "T" + time.slice(0, 5).replace(":", "") + "00";
}

export type IcsInput = {
  uid: string;
  date: string;
  start: string;
  end: string;
  title: string;
  description: string;
  location?: string | null;
  organizerName?: string | null;
  organizerEmail?: string | null;
  method?: "PUBLISH" | "CANCEL";
};

export function buildIcs(e: IcsInput) {
  const now = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
  const method = e.method ?? "PUBLISH";
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Ostern 2027//Helfer-App//DE",
    "CALSCALE:GREGORIAN",
    `METHOD:${method}`,
    ...VTIMEZONE,
    "BEGIN:VEVENT",
    `UID:${e.uid}`,
    `DTSTAMP:${now}`,
    `DTSTART;TZID=Europe/Zurich:${local(e.date, e.start)}`,
    `DTEND;TZID=Europe/Zurich:${local(e.date, e.end)}`,
    `SUMMARY:${esc(e.title)}`,
    `DESCRIPTION:${esc(e.description)}`,
    ...(e.location ? [`LOCATION:${esc(e.location)}`] : []),
    ...(e.organizerEmail
      ? [`ORGANIZER;CN=${esc(e.organizerName || e.organizerEmail)}:mailto:${e.organizerEmail}`]
      : []),
    method === "CANCEL" ? "STATUS:CANCELLED" : "STATUS:CONFIRMED",
    "SEQUENCE:" + (method === "CANCEL" ? "1" : "0"),
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    "DESCRIPTION:Erinnerung Helfereinsatz",
    "TRIGGER:-P1D",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.map(fold).join("\r\n") + "\r\n";
}
