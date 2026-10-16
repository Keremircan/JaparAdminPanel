import { formatDuration } from "@/lib/date-utils";

/**
 * Vardiya ihlalleri `public.shift_violations` tablosunda tutulur ve mobil
 * uygulama tarafından (JaparQrNext/app/api/verify, lib/shiftTiming.ts) yazılır.
 * Her ihlal tek bir harekete bağlıdır (attendance_log_id benzersiz); hareket
 * silinirse ihlal de silinir. action_date vardiyanın başladığı Türkiye günüdür.
 */

/**
 * Mobil uygulamanın ihlal kaydetmeye başladığı gün (shift_violations tablosu ve
 * JaparQrNext "geç giriş erken çıkış" sürümü, 16.10.2026). Daha önceki günler
 * değerlendirilmediği için "zamanında" sayılmaz.
 */
export const VIOLATIONS_TRACKED_SINCE = "2026-10-16";

export type ViolationReason = "geç geldi" | "erken çıktı";

export type ViolationKind = "late" | "early_leave";

/** Bir harekete iliştirilmiş ihlal özeti. */
export type LogViolation = {
  kind: ViolationKind;
  minutes: number;
};

export type ShiftViolation = LogViolation & {
  id: number;
  employeeCode: string;
  /** İhlal anındaki ad soyad (sonradan değişse de korunur). */
  fullName: string;
  /** Vardiyanın başladığı gün: `2026-10-16` */
  actionDate: string;
  attendanceLogId: number;
  createdAt: string;
  /** İhlale yol açan hareketin anı; yalnızca personel geçmişinde doldurulur. */
  occurredAt?: string | null;
};

/** PostgREST birleştirmesinde kullanılacak alanlar (`attendance_logs` → ihlal). */
export const LOG_VIOLATION_EMBED = "violation:shift_violations(duration_minutes, reason)";

export function toViolationKind(reason: unknown): ViolationKind | null {
  if (reason === "geç geldi") return "late";
  if (reason === "erken çıktı") return "early_leave";
  return null;
}

/**
 * Birleştirmeden gelen değeri çevirir. attendance_log_id benzersiz olduğu için
 * PostgREST tek nesne döndürür; yine de dizi gelirse ilk eleman alınır.
 */
export function toLogViolation(value: unknown): LogViolation | null {
  const row = Array.isArray(value) ? value[0] : value;
  if (!row || typeof row !== "object") return null;
  const { duration_minutes, reason } = row as Record<string, unknown>;
  const kind = toViolationKind(reason);
  const minutes = Number(duration_minutes);
  return kind && Number.isFinite(minutes) && minutes > 0 ? { kind, minutes } : null;
}

export const VIOLATION_LABELS: Record<ViolationKind, string> = {
  late: "Geç geldi",
  early_leave: "Erken çıktı",
};

/** `14 dk geç geldi`, `1 sa 5 dk erken çıktı` */
export function describeViolation({ kind, minutes }: LogViolation): string {
  return `${formatDuration(minutes * 60_000)} ${VIOLATION_LABELS[kind].toLocaleLowerCase("tr")}`;
}

/**
 * Mobil uygulamanın vardiya metnini ihlal için değerlendirip değerlendiremeyeceği
 * (JaparQrNext/lib/shiftTiming.ts parseShift ile aynı biçim: `08:00 - 18:00`).
 */
export function hasEvaluableShift(shift: string | null | undefined): boolean {
  const match = /^\s*(\d{1,2})[:.](\d{2})\s*[-–—]\s*(\d{1,2})[:.](\d{2})\s*$/.exec(shift ?? "");
  if (!match) return false;
  const [startH, startM, endH, endM] = match.slice(1).map(Number);
  return startH <= 23 && endH <= 23 && startM <= 59 && endM <= 59 && (startH !== endH || startM !== endM);
}
