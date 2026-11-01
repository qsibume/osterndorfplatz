import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { loadShift, shiftIcs } from "@/lib/shift-mail";

// Kalenderdatei zum Herunterladen
export async function GET(request: Request, { params }: { params: { shiftId: string } }) {
  const supabase = createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return NextResponse.redirect(new URL("/", request.url));
  const shift = await loadShift(params.shiftId);
  if (!shift) return new NextResponse("Einsatz nicht gefunden", { status: 404 });
  return new NextResponse(shiftIcs(shift, data.user.id), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="einsatz-ostern-2027.ics"`,
    },
  });
}
