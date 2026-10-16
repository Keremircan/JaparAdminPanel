-- Yönetim paneli: çalışan belgeleri (drive_links nesne → dizi)
--
-- ELLE ÇALIŞTIRILIR (Supabase > SQL Editor). Tekrar çalıştırılması güvenlidir.
--
-- Eski biçim: { folder?, health_report?, leave_permit?, other? }
-- Yeni biçim: [{ id, url, title?, category, created_at? }, ...]
--   category: 'sağlık raporu' | 'izin belgesi' | 'diğer'
-- Eski kayıtlardaki bağlantılar korunur; eklenme tarihleri bilinmediği için
-- created_at alanı boş kalır.

-- 1) 20261014120000 migration'ındaki "yalnızca nesne" kısıtını kaldır
alter table public.employees
  drop constraint if exists employees_drive_links_is_object;

-- 2) Eski nesneleri diziye çevir
update public.employees e
   set drive_links = coalesce((
         select jsonb_agg(
                  jsonb_strip_nulls(jsonb_build_object(
                    'id',       gen_random_uuid()::text,
                    'url',      e.drive_links ->> k.key,
                    'title',    k.title,
                    'category', k.category))
                  order by k.ord)
           from (values (1, 'folder',        'diğer',         'Drive klasörü'),
                        (2, 'health_report', 'sağlık raporu', null),
                        (3, 'leave_permit',  'izin belgesi',  null),
                        (4, 'other',         'diğer',         null))
                as k(ord, key, category, title)
          where coalesce(e.drive_links ->> k.key, '') <> ''
       ), '[]'::jsonb)
 where e.drive_links is null or jsonb_typeof(e.drive_links) = 'object';

alter table public.employees
  alter column drive_links set default '[]'::jsonb,
  alter column drive_links set not null;

alter table public.employees
  drop constraint if exists employees_drive_links_is_array;
alter table public.employees
  add constraint employees_drive_links_is_array
  check (jsonb_typeof(drive_links) = 'array');

comment on column public.employees.drive_links is
  'Çalışan belgeleri: [{ id, url, title?, category, created_at? }]. category: sağlık raporu | izin belgesi | diğer';

-- 3) Atomik ekleme / silme. Panel aynı anda iki pencereden belge eklese de
--    satır kilidi sayesinde hiçbir değişiklik kaybolmaz.

-- Personel yoksa false döner.
create or replace function public.add_employee_document(p_employee_code text, p_document jsonb)
returns boolean
language plpgsql
set search_path = public
as $$
begin
  if jsonb_typeof(p_document) <> 'object' then
    raise exception 'p_document bir JSON nesnesi olmalı';
  end if;

  update employees
     set drive_links = drive_links || jsonb_build_array(p_document)
   where employee_code = p_employee_code;

  return found;
end;
$$;

-- Silinen belge sayısını döner (0: belge zaten yok); personel yoksa NULL.
create or replace function public.remove_employee_document(p_employee_code text, p_document_id text)
returns integer
language plpgsql
set search_path = public
as $$
declare
  v_documents jsonb;
  v_remaining jsonb;
begin
  select drive_links into v_documents
    from employees
   where employee_code = p_employee_code
     for update;

  if not found then
    return null;
  end if;

  select coalesce(jsonb_agg(doc order by position), '[]'::jsonb)
    into v_remaining
    from jsonb_array_elements(v_documents) with ordinality as t(doc, position)
   where doc ->> 'id' is distinct from p_document_id;

  update employees
     set drive_links = v_remaining
   where employee_code = p_employee_code;

  return jsonb_array_length(v_documents) - jsonb_array_length(v_remaining);
end;
$$;

-- Yalnızca sunucu (service_role) çağırabilir.
revoke execute on function public.add_employee_document(text, jsonb) from public, anon, authenticated;
revoke execute on function public.remove_employee_document(text, text) from public, anon, authenticated;
