import type { Shift } from "@/lib/format";
import { formatSlot } from "@/lib/format";

const ERR: Record<string, string> = {
  full: "Leider war jemand schneller – dieser Einsatz ist inzwischen vergeben.",
  already: "Du bist für diesen Einsatz bereits eingetragen.",
  notfound: "Dieser Einsatz existiert nicht mehr.",
  unknown: "Da ist etwas schiefgelaufen. Bitte versuche es nochmals.",
};

export default function Notices({
  params,
  shifts,
}: {
  params: { ok?: string; left?: string; error?: string };
  shifts: Shift[];
}) {
  const ok = params.ok && shifts.find((s) => s.id === params.ok);
  return (
    <>
      {ok && (
        <div className="notice ok">
          <strong>Danke, es hat geklappt!</strong> Du bist eingetragen für „{ok.task}“ am {formatSlot(ok)}. Du erhältst eine
          Bestätigung per E-Mail, und die Bereichsleitung meldet sich noch mit weiteren Infos.{" "}
          <a href={`/api/ics/${ok.id}`}>📅 Termin in den Kalender laden</a>
        </div>
      )}
      {params.left && <div className="notice info">Du hast dich abgemeldet. Die Bereichsleitung wurde informiert.</div>}
      {params.error && <div className="notice err">{ERR[params.error] ?? ERR.unknown}</div>}
    </>
  );
}
