export type Shift = {
  id: string;
  area_id: string;
  shift_date: string;
  start_time: string;
  end_time: string;
  task: string;
  capacity: number;
  note: string | null;
  location: string | null;
  taken: number;
  mine: boolean;
};

export type Area = {
  id: string;
  name: string;
  description: string | null;
  leader_name: string | null;
  sort_order: number;
};

const dateFmt = new Intl.DateTimeFormat("de-CH", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

export function formatDate(isoDate: string) {
  return dateFmt.format(new Date(isoDate + "T00:00:00Z"));
}

export function formatTime(t: string) {
  return t.slice(0, 5);
}

export function formatSlot(s: { shift_date: string; start_time: string; end_time: string }) {
  return `${formatDate(s.shift_date)}, ${formatTime(s.start_time)}–${formatTime(s.end_time)} Uhr`;
}

export function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
}
