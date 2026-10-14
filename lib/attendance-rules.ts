/**
 * Bir vardiyanın sürebileceği azami süre. Mobil uygulamadaki kuralla
 * (JaparQrNext/lib/attendance.ts) aynı tutulmalı: son hareketi bundan eski
 * olan personel, çıkış okutmayı unutmuş sayılır ve içeride gösterilmez.
 * Takvim günü yerine süre kullanıldığı için gece vardiyası bölünmez.
 */
export const MAX_SHIFT_HOURS = 16;
export const MAX_SHIFT_MS = MAX_SHIFT_HOURS * 60 * 60 * 1000;
