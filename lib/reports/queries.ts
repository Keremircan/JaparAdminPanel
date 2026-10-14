import "server-only";

import { requireSession } from "@/lib/auth/guard";
import { getIstanbulDayKey } from "@/lib/date-utils";
import { fetchAllPages } from "@/lib/supabase/paginate";
import { createAdminClient } from "@/lib/supabase/server";

import { parseReportFilters, type ParsedReportFilters, type ReportFilters } from "./filters";
import {
  computeTimesheet,
  getTimesheetFetchWindow,
  type Timesheet,
  type TimesheetEmployee,
  type TimesheetLog,
} from "./timesheet";

export type ReportEmployee = TimesheetEmployee & { is_active: boolean };

export type TimesheetReport = Timesheet & {
  filters: ReportFilters;
  wasClamped: boolean;
  employees: ReportEmployee[];
  generatedAt: string;
};

async function fetchEmployees(): Promise<ReportEmployee[]> {
  const supabase = createAdminClient();
  const rows = await fetchAllPages(
    (from, to) =>
      supabase
        .from("employees")
        .select("employee_code, full_name, department, is_active")
        .order("full_name")
        .range(from, to)
        .overrideTypes<(TimesheetEmployee & { is_active: boolean | null })[], { merge: false }>(),
    "Personel listesi",
  );
  return rows.map((row) => ({ ...row, is_active: row.is_active !== false }));
}

function fetchLogs(from: Date, to: Date, employeeCode: string): Promise<TimesheetLog[]> {
  const supabase = createAdminClient();
  return fetchAllPages((rangeFrom, rangeTo) => {
    let request = supabase
      .from("attendance_logs")
      .select("id, employee_code, log_type, created_at")
      .gte("created_at", from.toISOString())
      .lt("created_at", to.toISOString());
    if (employeeCode) request = request.eq("employee_code", employeeCode);
    return request
      .order("created_at")
      .order("id")
      .range(rangeFrom, rangeTo)
      .overrideTypes<TimesheetLog[], { merge: false }>();
  }, "Hareket kayıtları");
}

/** Sayfa ve Excel dışa aktarma için ortak giriş noktası. */
export async function getTimesheetReport(
  searchParams: Record<string, string | string[] | undefined>,
): Promise<TimesheetReport> {
  await requireSession();

  const now = new Date();
  const { filters, wasClamped }: ParsedReportFilters = parseReportFilters(
    searchParams,
    getIstanbulDayKey(now),
  );
  const window = getTimesheetFetchWindow(filters.start, filters.end, now);

  const [employees, logs] = await Promise.all([
    fetchEmployees(),
    fetchLogs(window.from, window.to, filters.employee),
  ]);

  const included = new Map<string, TimesheetEmployee>();
  for (const employee of employees) {
    if (!filters.includeInactive && !employee.is_active) continue;
    if (filters.department && employee.department !== filters.department) continue;
    if (filters.employee && employee.employee_code !== filters.employee) continue;
    included.set(employee.employee_code, employee);
  }

  return {
    ...computeTimesheet({
      logs,
      employees: included,
      startKey: filters.start,
      endKey: filters.end,
      now,
    }),
    filters,
    wasClamped,
    employees,
    generatedAt: now.toISOString(),
  };
}
