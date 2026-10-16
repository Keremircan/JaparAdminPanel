import "server-only";

import { requireSession } from "@/lib/auth/guard";
import type { LogType } from "@/lib/data/overview";
import { createAdminClient } from "@/lib/supabase/server";
import { LOG_VIOLATION_EMBED, toLogViolation, type LogViolation } from "@/lib/violations/types";

import {
  parseEmployeeDocuments,
  type Employee,
  type EmployeeFilters,
  type EmployeeStatusFilter,
} from "./types";

const EMPLOYEE_COLUMNS =
  "id, employee_code, full_name, is_active, department, job, shift, shift_type, hire_date, device_bound_at, device_label, device_public_key, drive_links";

const LIST_LIMIT = 1000;

type EmployeeRow = Omit<Employee, "is_device_bound" | "documents" | "is_active"> & {
  is_active: boolean | null;
  device_public_key: string | null;
  drive_links: unknown;
};

export type EmployeeLog = {
  id: number;
  type: LogType;
  createdAt: string;
  gate: string | null;
  factory: string | null;
  violation: LogViolation | null;
};

function toEmployee({ device_public_key, drive_links, ...row }: EmployeeRow): Employee {
  return {
    ...row,
    // PWA girişi yalnızca is_active === false olanları reddeder.
    is_active: row.is_active !== false,
    is_device_bound: device_public_key !== null,
    documents: parseEmployeeDocuments(drive_links),
  };
}

/** PostgREST `or` sözdizimini bozabilecek karakterleri aramadan çıkarır. */
function sanitizeSearch(query: string): string {
  return query.replace(/[,()"'\\*%:]/g, " ").trim().slice(0, 100);
}

export function parseEmployeeFilters(
  searchParams: Record<string, string | string[] | undefined>,
): EmployeeFilters {
  const pick = (key: string) => {
    const value = searchParams[key];
    return (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
  };
  const status = pick("durum");
  const statusFilter: EmployeeStatusFilter =
    status === "aktif" ? "active" : status === "pasif" ? "inactive" : "all";

  return { query: pick("q"), department: pick("departman"), status: statusFilter };
}

export async function listEmployees(filters: EmployeeFilters): Promise<Employee[]> {
  await requireSession();

  let request = createAdminClient()
    .from("employees")
    .select(EMPLOYEE_COLUMNS)
    .order("full_name")
    .limit(LIST_LIMIT);

  const search = sanitizeSearch(filters.query);
  if (search) {
    request = request.or(`full_name.ilike.%${search}%,employee_code.ilike.%${search}%`);
  }
  if (filters.department) request = request.eq("department", filters.department);
  if (filters.status === "active") request = request.not("is_active", "is", false);
  if (filters.status === "inactive") request = request.eq("is_active", false);

  const { data, error } = await request.overrideTypes<EmployeeRow[], { merge: false }>();
  if (error) throw new Error(`Çalışan listesi okunamadı: ${error.message}`);

  return (data ?? []).map(toEmployee);
}

export async function listDepartments(): Promise<string[]> {
  await requireSession();

  const { data, error } = await createAdminClient()
    .from("employees")
    .select("department")
    .not("department", "is", null)
    .limit(LIST_LIMIT)
    .overrideTypes<{ department: string }[], { merge: false }>();

  if (error) throw new Error(`Departmanlar okunamadı: ${error.message}`);

  return [...new Set((data ?? []).map((row) => row.department.trim()).filter(Boolean))].sort(
    (a, b) => a.localeCompare(b, "tr"),
  );
}

export async function getEmployee(code: string): Promise<Employee | null> {
  await requireSession();

  const { data, error } = await createAdminClient()
    .from("employees")
    .select(EMPLOYEE_COLUMNS)
    .eq("employee_code", code)
    .maybeSingle()
    .overrideTypes<EmployeeRow, { merge: false }>();

  if (error) throw new Error(`Çalışan okunamadı: ${error.message}`);

  return data ? toEmployee(data) : null;
}

export async function getEmployeeLogs(code: string, limit = 10): Promise<EmployeeLog[]> {
  await requireSession();

  const { data, error } = await createAdminClient()
    .from("attendance_logs")
    .select(`id, log_type, created_at, gate_id, factory_id, ${LOG_VIOLATION_EMBED}`)
    .eq("employee_code", code)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(limit)
    .overrideTypes<
      {
        id: number;
        log_type: LogType;
        created_at: string;
        gate_id: string | null;
        factory_id: string | null;
        violation: unknown;
      }[],
      { merge: false }
    >();

  if (error) throw new Error(`Hareket kayıtları okunamadı: ${error.message}`);

  return (data ?? []).map((row) => ({
    id: row.id,
    type: row.log_type,
    createdAt: row.created_at,
    gate: row.gate_id,
    factory: row.factory_id,
    violation: toLogViolation(row.violation),
  }));
}
