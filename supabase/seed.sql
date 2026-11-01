-- Startdaten aus 'Detailplan_Ostern_2027_Endversion.xlsx' (Blatt 'Bereichsleiter und Helfer')
-- Nach schema.sql einmal ausführen. Danach alles im Admin-Bereich der App pflegen.

insert into public.areas (name, leader_name, leader_email, leader_phone, sort_order) values ('Familienweg', 'Kira Frei / Martina Häsler', null, '077 225 99 17', 10);
insert into public.shifts (area_id, shift_date, start_time, end_time, task, capacity, note) select id, '2027-03-23', '08:00', '12:00', 'Mithilfe aufstellen', 2, null from public.areas where name = 'Familienweg';

insert into public.areas (name, leader_name, leader_email, leader_phone, sort_order) values ('Kunstweg', 'Erika Jakob', null, null, 20);

insert into public.areas (name, leader_name, leader_email, leader_phone, sort_order) values ('Tiny Kunsthaus', 'Mark Fels', 'mark@fels.ch', '079 509 30 19', 30);

insert into public.areas (name, leader_name, leader_email, leader_phone, sort_order) values ('Eier Färben', 'Rahel Horvath', null, null, 40);
insert into public.shifts (area_id, shift_date, start_time, end_time, task, capacity, note) select id, '2027-03-26', '14:00', '16:00', 'Gebet', 2, '1 Mann und 1 Frau' from public.areas where name = 'Eier Färben';
insert into public.shifts (area_id, shift_date, start_time, end_time, task, capacity, note) select id, '2027-03-26', '14:00', '16:00', 'Betreuung Eierfärben', 2, null from public.areas where name = 'Eier Färben';
insert into public.shifts (area_id, shift_date, start_time, end_time, task, capacity, note) select id, '2027-03-26', '13:00', '14:00', 'Aufbau', 2, null from public.areas where name = 'Eier Färben';

insert into public.areas (name, leader_name, leader_email, leader_phone, sort_order) values ('Oster Gärtli', 'Markus Baumann', null, '079 906 96 29', 50);

insert into public.areas (name, leader_name, leader_email, leader_phone, sort_order) values ('Konzert', 'Leona Leuenberger', 'leona.leuenberger@gmx.ch', '079 823 47 71', 60);

insert into public.areas (name, leader_name, leader_email, leader_phone, sort_order) values ('Gastro Bereich', 'Adi Kolb', null, null, 70);

insert into public.areas (name, leader_name, leader_email, leader_phone, sort_order) values ('Living Bus und Gebet', 'Niklaus Leuenberger', 'nikko@gmx.ch', '079 787 45 12', 80);
insert into public.shifts (area_id, shift_date, start_time, end_time, task, capacity, note) select id, '2027-03-24', '14:00', '16:30', 'Betreuung, Aufsicht Livingbus', 3, null from public.areas where name = 'Living Bus und Gebet';
insert into public.shifts (area_id, shift_date, start_time, end_time, task, capacity, note) select id, '2027-03-25', '14:00', '16:30', 'Betreuung, Aufsicht Livingbus', 3, null from public.areas where name = 'Living Bus und Gebet';
insert into public.shifts (area_id, shift_date, start_time, end_time, task, capacity, note) select id, '2027-03-26', '14:00', '16:30', 'Betreuung, Aufsicht Livingbus', 3, null from public.areas where name = 'Living Bus und Gebet';
insert into public.shifts (area_id, shift_date, start_time, end_time, task, capacity, note) select id, '2027-03-27', '14:00', '16:30', 'Betreuung, Aufsicht Livingbus', 3, null from public.areas where name = 'Living Bus und Gebet';

insert into public.areas (name, leader_name, leader_email, leader_phone, sort_order) values ('Kommunikation', 'Salome / Markus Baumann', 'wuthrichsalome@gmail.com', '076 411 99 89', 90);

insert into public.areas (name, leader_name, leader_email, leader_phone, sort_order) values ('Planung & Konzept', 'Marg und Marisa', null, null, 100);

insert into public.areas (name, leader_name, leader_email, leader_phone, sort_order) values ('Sicherheit', null, null, null, 110);

insert into public.areas (name, leader_name, leader_email, leader_phone, sort_order) values ('Aufbau', null, null, null, 120);

insert into public.areas (name, leader_name, leader_email, leader_phone, sort_order) values ('Abbau', null, null, null, 130);
