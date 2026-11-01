// Öffentliche Supabase-Werte. Sie sind nicht geheim (sie stehen ohnehin im Browser-Code),
// deshalb dürfen sie hier stehen. Gültige Werte aus Vercel haben Vorrang.
const DEFAULT_URL = "https://ackrhbcsflveljlyxsmz.supabase.co";
const DEFAULT_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFja3JoYmNzZmx2ZWxqbHl4c216Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM1NTkxNzYsImV4cCI6MjEwOTEzNTE3Nn0.nd6AwtlXGBxctFbuvBLNMJDbYu--jd0TEyKhFC_B8OI";

// Entfernt versehentlich mitkopierte Leerzeichen, Zeilenumbrüche und Anführungszeichen.
function clean(v: string | undefined) {
  return (v ?? "").replace(/\s+/g, "").replace(/^["']|["']$/g, "");
}

// Nur sichtbare ASCII-Zeichen (z. B. keine "•" aus verdeckt kopierten Schlüsseln)
const isAscii = (v: string) => /^[\x21-\x7e]+$/.test(v);

const envUrl = clean(process.env.NEXT_PUBLIC_SUPABASE_URL).replace(/\/+$/, "");
const envAnon = clean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export const SUPABASE_URL = /^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(envUrl) ? envUrl : DEFAULT_URL;
export const SUPABASE_ANON_KEY = isAscii(envAnon) && envAnon.split(".").length === 3 ? envAnon : DEFAULT_ANON_KEY;
export const serviceRoleKey = () => clean(process.env.SUPABASE_SERVICE_ROLE_KEY);
