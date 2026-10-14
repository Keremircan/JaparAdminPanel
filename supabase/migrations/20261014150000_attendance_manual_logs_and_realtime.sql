-- Yönetim paneli: manuel hareket kaydı, düzeltme izi ve canlı akış
--
-- ELLE ÇALIŞTIRILIR (Supabase > SQL Editor). Tekrar çalıştırılması güvenlidir.
-- Mobil uygulama etkilenmez: INSERT'leri source kolonunu vermediği için
-- varsayılan 'app' değerini alır.

-- 1) Kaydın kaynağı, amir notu ve son düzeltme zamanı
alter table public.attendance_logs
  add column if not exists source    varchar(20)  not null default 'app',
  add column if not exists note      varchar(500),
  add column if not exists edited_at timestamptz;

alter table public.attendance_logs
  drop constraint if exists attendance_logs_source_check;
alter table public.attendance_logs
  add constraint attendance_logs_source_check check (source in ('app', 'manual'));

comment on column public.attendance_logs.source is
  'app = mobil uygulamadan okutma, manual = yönetim panelinden elle girildi';
comment on column public.attendance_logs.edited_at is
  'Saat veya tip yönetim panelinden en son ne zaman düzeltildi (NULL = hiç düzeltilmedi)';

-- 2) Canlı Hareketler ekranı için Supabase Realtime yayını
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
     where pubname = 'supabase_realtime'
       and schemaname = 'public'
       and tablename = 'attendance_logs'
  ) then
    alter publication supabase_realtime add table public.attendance_logs;
  end if;
end
$$;

-- NOT: Panel canlı akışı anon anahtarla dinler. attendance_logs tablosunda RLS
-- kapalı olduğu sürece bu çalışır; RLS açılırsa canlı akış olay almaz ve panel
-- kendiliğinden periyodik yenilemeye geçer.
