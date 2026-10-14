-- Yönetim paneli: çalışan doküman bağlantıları ve aktiflik varsayılanı
--
-- ELLE ÇALIŞTIRILIR (Supabase > SQL Editor). Tekrar çalıştırılması güvenlidir.
-- Panel bu dosya çalıştırılmadan da çalışır: NULL drive_links boş kabul edilir.

alter table public.employees
  add column if not exists drive_links jsonb;

update public.employees set drive_links = '{}'::jsonb where drive_links is null;

alter table public.employees
  alter column drive_links set default '{}'::jsonb,
  alter column drive_links set not null;

alter table public.employees
  drop constraint if exists employees_drive_links_is_object;
alter table public.employees
  add constraint employees_drive_links_is_object
  check (jsonb_typeof(drive_links) = 'object');

comment on column public.employees.drive_links is
  'Google Drive bağlantıları: { folder?, health_report?, leave_permit?, other? }';

alter table public.employees
  alter column is_active set default true;
