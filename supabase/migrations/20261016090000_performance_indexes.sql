-- Yönetim paneli ve mobil uygulama sorguları için indeksler
--
-- ELLE ÇALIŞTIRILIR (Supabase > SQL Editor). Tekrar çalıştırılması güvenlidir.
-- Tablo büyüdüğünde yoğun saatlerde çalıştırılacaksa her satırı ayrı ayrı ve
-- `create index concurrently` ile çalıştırın; böylece yazmalar kilitlenmez.

-- Tarih aralığı sorguları: Genel Bakış (son 10 hareket, bugünkü sayımlar,
-- haftalık grafik), Canlı Hareketler (günün kayıtları) ve Raporlar (puantaj).
create index if not exists idx_attendance_logs_created_at
  on public.attendance_logs (created_at desc);

-- Personel bazlı sorgular: mobil uygulamada "son hareket" kontrolü (her
-- okutmada çalışır), çalışan detayındaki son 10 hareket ve tek çalışan raporu.
-- employee_code ile başladığı için yalnızca employee_code'a göre yapılan
-- aramaları da (ör. silmeden önceki hareket kontrolü) karşılar.
create index if not exists idx_attendance_logs_employee_created_at
  on public.attendance_logs (employee_code, created_at desc);

-- Bilinçli olarak eklenmeyenler:
-- * attendance_logs(log_type): yalnızca IN/OUT değerini alır; tek başına
--   seçici değildir ve bu sütunla yapılan her sorgu zaten created_at aralığıyla
--   daraltılıyor. (Not: sütunun adı "type" değil "log_type".)
-- * employees(is_active): iki değerli boolean; planlayıcı tablo taramasını
--   tercih eder. employees.employee_code zaten benzersiz kısıtla indeksli.

analyze public.attendance_logs;
