import "server-only";

import { requireSession } from "@/lib/auth/guard";
import { fetchAllPages } from "@/lib/supabase/paginate";
import { createAdminClient } from "@/lib/supabase/server";

import { toViolationKind, type ShiftViolation } from "./types";

type ViolationRow = {
  id: number;
  employee_code: string;
  full_name: string;
  duration_minutes: number;
  reason: string;
  action_date: string;
  attendance_log_id: number;
  created_at: string;
  log?: { created_at: string } | null;
};

const VIOLATION_COLUMNS =
  "id, employee_code, full_name, duration_minutes, reason, action_date, attendance_log_id, created_at";

function toViolations(rows: ViolationRow[]): ShiftViolation[] {
  return rows.flatMap((row) => {
    const kind = toViolationKind(row.reason);
    if (!kind) return [];
    return [
      {
        id: row.id,
        employeeCode: row.employee_code,
        fullName: row.full_name,
        kind,
        minutes: row.duration_minutes,
        actionDate: row.action_date,
        attendanceLogId: row.attendance_log_id,
        createdAt: row.created_at,
        occurredAt: row.log === undefined ? undefined : (row.log?.created_at ?? null),
      },
    ];
  });
}

/**
 * Vardiya başlangıç günü [startKey, endKey] aralığında olan ihlaller.
 * employeeCode verilirse yalnızca o personelinkiler.
 */
export async function getViolationsInRange(
  startKey: string,
  endKey: string,
  employeeCode?: string,
): Promise<ShiftViolation[]> {
  await requireSession();

  const supabase = createAdminClient();
  const rows = await fetchAllPages((from, to) => {
    let request = supabase
      .from("shift_violations")
      .select(VIOLATION_COLUMNS)
      .gte("action_date", startKey)
      .lte("action_date", endKey);
    if (employeeCode) request = request.eq("employee_code", employeeCode);
    return request
      .order("action_date", { ascending: false })
      .order("id", { ascending: false })
      .range(from, to)
      .overrideTypes<ViolationRow[], { merge: false }>();
  }, "Vardiya ihlalleri");

  return toViolations(rows);
}

/** Personelin tüm ihlal geçmişi, yeniden eskiye. */
export async function getEmployeeViolations(employeeCode: string): Promise<ShiftViolation[]> {
  await requireSession();

  const supabase = createAdminClient();
  const rows = await fetchAllPages(
    (from, to) =>
      supabase
        .from("shift_violations")
        // Hareket saati için attendance_logs ile birleştirilir (tek sorgu).
        .select(`${VIOLATION_COLUMNS}, log:attendance_logs(created_at)`)
        .eq("employee_code", employeeCode)
        .order("action_date", { ascending: false })
        .order("id", { ascending: false })
        .range(from, to)
        .overrideTypes<ViolationRow[], { merge: false }>(),
    "Vardiya ihlalleri",
  );

  return toViolations(rows);
}
