import type { LogType } from "@/lib/data/overview";
import { toLogViolation, type LogViolation } from "@/lib/violations/types";

/** `attendance_logs` satırı. source/note/edited_at migration öncesinde bulunmayabilir. */
export type AttendanceLog = {
  id: number;
  employee_code: string;
  log_type: LogType;
  created_at: string;
  gate_id: string | null;
  factory_id: string | null;
  hardware_id: string | null;
  source: "app" | "manual";
  note: string | null;
  edited_at: string | null;
  /**
   * Hareketin yol açtığı geç gelme / erken çıkma. undefined: henüz bilinmiyor
   * (Realtime olayı ihlal bilgisi taşımaz; sunucudan tamamlanır).
   */
  violation?: LogViolation | null;
};

export type AttendanceEmployee = {
  employee_code: string;
  full_name: string;
  department: string | null;
  is_active: boolean;
  /** Bağlı cihazın açık anahtarı; logdaki hardware_id ile eşleştirmek için. */
  device_key: string | null;
  /** `device_label` (User-Agent) bilgisinden kısaltılmış cihaz adı. */
  device_name: string | null;
};

/** Realtime veya REST'ten gelen ham satırı güvenli biçimde AttendanceLog'a çevirir. */
export function toAttendanceLog(row: Record<string, unknown>): AttendanceLog | null {
  const id = Number(row.id);
  const type = row.log_type;
  if (!Number.isFinite(id) || (type !== "IN" && type !== "OUT")) return null;
  if (typeof row.employee_code !== "string" || typeof row.created_at !== "string") return null;

  const text = (value: unknown) => (typeof value === "string" && value ? value : null);
  return {
    id,
    employee_code: row.employee_code,
    log_type: type,
    created_at: row.created_at,
    gate_id: text(row.gate_id),
    factory_id: text(row.factory_id),
    hardware_id: text(row.hardware_id),
    source: row.source === "manual" ? "manual" : "app",
    note: text(row.note),
    edited_at: text(row.edited_at),
    violation: "violation" in row ? toLogViolation(row.violation) : undefined,
  };
}

/** User-Agent metninden okunabilir kısa cihaz adı: `iPhone, iOS 18.7` */
export function shortDeviceName(userAgent: string | null): string | null {
  if (!userAgent) return null;

  const ios = userAgent.match(/\b(iPhone|iPad|iPod)\b.*?OS (\d+)[_.](\d+)/);
  if (ios) return `${ios[1]}, ${ios[1] === "iPad" ? "iPadOS" : "iOS"} ${ios[2]}.${ios[3]}`;

  const android = userAgent.match(/Android (\d+(?:\.\d+)?)(?:; ([^;)]+))?/);
  if (android) {
    const model = android[2]?.trim();
    return model && model !== "K" ? `${model}, Android ${android[1]}` : `Android ${android[1]}`;
  }

  if (/Windows/.test(userAgent)) return "Windows bilgisayar";
  if (/Macintosh|Mac OS X/.test(userAgent)) return "Mac bilgisayar";
  return "Bilinmeyen cihaz";
}
