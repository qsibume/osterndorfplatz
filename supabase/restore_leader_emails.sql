-- Nach der Vorführung: Original-Leiter-E-Mails wiederherstellen.
-- Während der Vorführung gingen alle Leiter-Meldungen an Niklaus und Leona.
-- Hinweis: Überschreibt Leiter-E-Mails, die in der Zwischenzeit im Admin-Bereich geändert wurden.
update public.areas a
set leader_email = b.leader_email
from public.leader_email_backup b
where b.area_id = a.id;

drop table public.leader_email_backup;
