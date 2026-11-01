import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { logout } from "./actions";

export const metadata: Metadata = {
  title: "Helfer Ostern 2027",
  description: "Melde dich für einen Helfereinsatz an Ostern 2027.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data } = await supabase.auth.getUser();
  let isAdmin = false;
  if (data.user) {
    const { data: a } = await supabase.from("admins").select("user_id").eq("user_id", data.user.id).maybeSingle();
    isAdmin = !!a;
  }
  return (
    <html lang="de-CH">
      <body>
        <header className="top">
          <div className="wrap">
            <Link href={data.user ? "/bereiche" : "/"} className="brand">
              🥚 Ostern 2027 <span>Helfer</span>
            </Link>
            {data.user && (
              <nav className="menu">
                <Link href="/bereiche">Einsätze</Link>
                <Link href="/meine-einsaetze">Meine Einsätze</Link>
                <Link href="/profil">Profil</Link>
                {isAdmin && <Link href="/admin">Admin</Link>}
                <form action={logout}>
                  <button type="submit">Abmelden</button>
                </form>
              </nav>
            )}
          </div>
        </header>
        <main>
          <div className="wrap">{children}</div>
        </main>
      </body>
    </html>
  );
}
