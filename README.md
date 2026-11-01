# Helfer-App Ostern 2027

Webapp, in der sich Helfer für die Einsätze an Ostern 2027 eintragen.

**Ablauf für Helfer**

1. Registrieren mit Name, E-Mail und Telefon. Sie erhalten einen Login-Link per E-Mail und brauchen kein Passwort.
2. Bereich wählen (z. B. Gastro, Living Bus und Gebet, Aufbau …).
3. Einsätze ansehen: freie Plätze sind grün, vergebene grau. Namen anderer Helfer sind nie sichtbar.
4. „Ich helfe mit“ klicken. Danach:
   - Der Helfer erhält eine Bestätigung per E-Mail mit Kalendereintrag (.ics) im Anhang. Den Termin kann er auch in der App herunterladen.
   - Die Bereichsleitung erhält eine E-Mail mit Name, E-Mail und Telefon des Helfers.
5. Unter „Meine Einsätze“ kann sich der Helfer wieder austragen. Die Bereichsleitung wird dann informiert.

**Admin-Bereich** (`/admin`): Bereiche und Bereichsleitungen (inkl. E-Mail) pflegen, Einsätze erfassen, ändern und löschen, eingetragene Helfer sehen und entfernen, alle Anmeldungen als CSV für Excel exportieren.

---

## Einrichtung (ca. 30 Minuten, alles gratis)

### 1. Supabase (Datenbank + Login)

1. Auf [supabase.com](https://supabase.com) ein Konto und ein neues Projekt erstellen (Region: Zürich oder Frankfurt).
2. Links auf **SQL Editor**, dann den Inhalt von `supabase/schema.sql` einfügen und auf **Run** klicken.
3. Danach `supabase/seed.sql` gleich ausführen. Damit werden die Bereiche und Einsätze aus der Excel-Datei übernommen.
4. Unter **Project Settings → API** diese drei Werte notieren:
   `Project URL`, `anon public` Key und `service_role` Key (der `service_role` Key ist geheim).

### 2. Resend (E-Mail-Versand)

1. Auf [resend.com](https://resend.com) ein Konto erstellen (gratis bis 3000 E-Mails/Monat).
2. Unter **Domains** eure Domain hinzufügen (z. B. `ostern-xyz.ch`) und die angezeigten DNS-Einträge beim Domain-Anbieter eintragen.
3. Unter **API Keys** einen Key erstellen.
4. **Wichtig, damit die Login-Links zuverlässig ankommen:** In Supabase unter **Authentication → Emails → SMTP Settings** „Custom SMTP“ aktivieren:
   - Host `smtp.resend.com`, Port `465`, User `resend`, Passwort = Resend API Key
   - Absender z. B. `helfer@eure-domain.ch`

   Ohne eigenes SMTP verschickt Supabase nur ganz wenige E-Mails pro Stunde.
5. Optional: Unter **Authentication → Emails → Templates → Magic Link** den Text auf Deutsch anpassen, z. B.:
   ```html
   <h2>Dein Login für die Helfer-App Ostern 2027</h2>
   <p><a href="{{ .ConfirmationURL }}">Hier klicken zum Einloggen</a></p>
   ```
   Auch die Vorlage **Confirm signup** gleich anpassen, denn diese E-Mail erhalten neue Helfer.

### 3. Vercel (Hosting)

1. Diesen Ordner in ein GitHub-Repository hochladen.
2. Auf [vercel.com](https://vercel.com) mit GitHub anmelden, **Add New → Project** wählen und das Repository importieren.
3. Unter **Environment Variables** die Werte aus `.env.example` eintragen:

| Variable | Wert |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL aus Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon Key |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role Key |
| `RESEND_API_KEY` | API Key aus Resend |
| `MAIL_FROM` | z. B. `Ostern 2027 <helfer@eure-domain.ch>` |
| `MAIL_FALLBACK` | E-Mail der Organisation. Sie erhält die Meldungen für Bereiche ohne Leiter-E-Mail. |
| `NEXT_PUBLIC_SITE_URL` | Adresse der App, z. B. `https://helfer-ostern.vercel.app` |
| `EVENT_LOCATION` | Standard-Ort für die Kalendereinträge |

4. **Deploy** klicken.
5. In Supabase unter **Authentication → URL Configuration**:
   - **Site URL** = Adresse der App
   - **Redirect URLs**: `https://eure-app.vercel.app/auth/callback` hinzufügen

### 4. Admin festlegen

1. Selbst in der App registrieren.
2. In Supabase im **SQL Editor** ausführen (E-Mail anpassen):
   ```sql
   insert into public.admins (user_id)
   select id from auth.users where email = 'deine@email.ch';
   ```
3. Neu laden. Oben erscheint jetzt der Menüpunkt **Admin**.

---

## Vor dem Start prüfen

- **Leiter-E-Mails fehlen** bei: Familienweg, Kunstweg, Eier Färben, Oster Gärtli, Gastro Bereich, Planung & Konzept, Sicherheit, Aufbau, Abbau. Bitte im Admin-Bereich ergänzen, sonst gehen die Meldungen an `MAIL_FALLBACK`.
- **Familienweg:** In der Excel steht „Samstag, 23. März 2027“. Der 23. März 2027 ist aber ein Dienstag. Ich habe den 23. März übernommen. Bitte im Admin-Bereich korrigieren, falls Samstag gemeint war.
- **Eier Färben, „1 Mann und 1 Frau“ zum Beten:** Das ist als Einsatz „Gebet“ mit 2 Plätzen erfasst, mit dem Hinweis „1 Mann und 1 Frau“.
- In vielen Bereichen sind noch keine Einsätze erfasst. Helfer sehen dort „Noch keine Einsätze“.

## Lokal starten (für Entwickler)

```bash
cp .env.example .env.local   # Werte eintragen
npm install
npm run dev                  # http://localhost:3000
```
In Supabase muss dann auch `http://localhost:3000/auth/callback` als Redirect URL eingetragen sein. Ohne `RESEND_API_KEY` werden die E-Mails nur im Terminal ausgegeben.

## Technik

- Next.js 14 (App Router) und Supabase (Postgres, Login per Magic Link, Row Level Security)
- E-Mails über die Resend-API, Kalendereinträge als `.ics` (Zeitzone Europe/Zurich, Erinnerung 1 Tag vorher)
- Die Plätze werden in der Datenbank gezählt (`take_shift`). So kann ein Einsatz nicht überbucht werden, auch wenn sich zwei Personen gleichzeitig eintragen.
- Helfer sehen nur die Anzahl vergebener Plätze. Namen, Kontakte und Leiter-E-Mails sind nur für Admins sichtbar.
