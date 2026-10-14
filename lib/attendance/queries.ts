import "server-only";

import { requireSession } from "@/lib/auth/guard";
import { getIstanbulDayStart, shiftDayKey } from "@/lib/date-utils";
import { fetchAllPages } from "@/lib/supabase/paginate";
import { createAdminClient } from "@/lib/supabase/server";

import {
  shortDeviceName,
  toAttendanceLog,
  type AttendanceEmployee,
  type AttendanceLog,
} from "./types";

/** Seçilen Türkiye gününün tüm hareketleri, yeniden eskiye. */
export async function getDayLogs(dayKey: string): Promise<AttendanceLog[]> {
  await requireSession();

  const supabase = createAdminClient();
  // `*`: source/note/edited_at kolonları migration çalıştırılmadan da sayfa açılsın.
  const rows = await fetchAllPages(
    (from, to) =>
      supabase
        .from("attendance_logs")
        .select("*")
        .gte("created_at", getIstanbulDayStart(dayKey).toISOString())
        .lt("created_at", getIstanbulDayStart(shiftDayKey(dayKey, 1)).toISOString())
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .range(from, to)
        .overrideTypes<Record<string, unknown>[], { merge: false }>(),
    "Hareket kayıtları",
  );

  return rows.map(toAttendanceLog).filter((log): log is AttendanceLog => log !== null);
}

export async function getAttendanceEmployees(): Promise<AttendanceEmployee[]> {
  await requireSession();

  const supabase = createAdminClient();
  const rows = await fetchAllPages(
    (from, to) =>
      supabase
        .from("employees")
        .select("employee_code, full_name, department, is_active, device_public_key, device_label")
        .order("full_name")
        .range(from, to)
        .overrideTypes<
          {
            employee_code: string;
            full_name: string;
            department: string | null;
            is_active: boolean | null;
            device_public_key: string | null;
            device_label: string | null;
          }[],
          { merge: false }
        >(),
    "Personel listesi",
  );

  return rows.map((row) => ({
    employee_code: row.employee_code,
    full_name: row.full_name,
    department: row.department?.trim() || null,
    is_active: row.is_active !== false,
    device_key: row.device_public_key,
    device_name: shortDeviceName(row.device_label),
  }));
}
