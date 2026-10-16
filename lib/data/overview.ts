import "server-only";

import { MAX_SHIFT_HOURS } from "@/lib/attendance-rules";
import { requireSession } from "@/lib/auth/guard";
import {
  formatDayMonth,
  formatWeekdayShort,
  getIstanbulDayKey,
  getIstanbulDayStart,
  parseTimestamp,
  shiftDayKey,
} from "@/lib/date-utils";
import { fetchAllPages } from "@/lib/supabase/paginate";
import { createAdminClient } from "@/lib/supabase/server";

export type LogType = "IN" | "OUT";

export type OverviewStats = {
  /** Vardiya penceresi içindeki son hareketi GİRİŞ olan aktif personel. */
  inside: number;
  /** Son hareketi ÇIKIŞ olan veya penceresinde hareketi bulunmayan aktif personel. */
  outside: number;
  /** Dışarıda olup bugün hiç okutma yapmamış aktif personel. */
  noActivityToday: number;
  todayTotal: number;
  todayEntries: number;
  todayExits: number;
  activeEmployees: number;
  inactiveEmployees: number;
};

export type RecentLog = {
  id: number;
  employeeCode: string;
  fullName: string | null;
  type: LogType;
  createdAt: string;
  gate: string | null;
  factory: string | null;
};

export type DailyEntryCount = {
  dayKey: string;
  /** `Sal` */
  label: string;
  /** `13 Ekim Salı` */
  fullLabel: string;
  entries: number;
  isToday: boolean;
};

export type OverviewData = {
  fetchedAt: string;
  stats: OverviewStats;
  recentLogs: RecentLog[];
  weeklyEntries: DailyEntryCount[];
};

const RECENT_LOG_LIMIT = 10;
const WEEK_DAYS = 7;

type EmployeeRow = { employee_code: string; is_active: boolean };

type ActivityRow = {
  employee_code: string;
  log_type: LogType;
  created_at: string;
};

type RecentLogRow = {
  id: number;
  employee_code: string;
  log_type: LogType;
  created_at: string;
  gate_id: string | null;
  factory_id: string | null;
  employee: { full_name: string | null } | null;
};

type AdminClient = ReturnType<typeof createAdminClient>;

function fetchEmployees(supabase: AdminClient): Promise<EmployeeRow[]> {
  return fetchAllPages<EmployeeRow>(
    (from, to) =>
      supabase
        .from("employees")
        .select("employee_code, is_active")
        .order("id")
        .range(from, to)
        .overrideTypes<EmployeeRow[], { merge: false }>(),
    "Personel listesi",
  );
}

/** `since` anından itibaren tüm hareketler, yeniden eskiye. */
function fetchActivity(
  supabase: AdminClient,
  since: Date,
): Promise<ActivityRow[]> {
  return fetchAllPages<ActivityRow>(
    (from, to) =>
      supabase
        .from("attendance_logs")
        .select("employee_code, log_type, created_at")
        .gte("created_at", since.toISOString())
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .range(from, to)
        .overrideTypes<ActivityRow[], { merge: false }>(),
    "Hareket kayıtları",
  );
}

async function fetchRecentLogs(supabase: AdminClient): Promise<RecentLog[]> {
  // attendance_logs.employee_code → employees.employee_code üzerinden birleştirir.
  const { data, error } = await supabase
    .from("attendance_logs")
    .select(
      "id, employee_code, log_type, created_at, gate_id, factory_id, employee:employees(full_name)",
    )
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(RECENT_LOG_LIMIT)
    .overrideTypes<RecentLogRow[], { merge: false }>();

  if (error) throw new Error(`Son hareketler okunamadı: ${error.message}`);

  return (data ?? []).map((row) => ({
    id: row.id,
    employeeCode: row.employee_code,
    fullName: row.employee?.full_name ?? null,
    type: row.log_type,
    createdAt: row.created_at,
    gate: row.gate_id,
    factory: row.factory_id,
  }));
}

async function countEntries(
  supabase: AdminClient,
  from: Date,
  to: Date,
): Promise<number> {
  const { count, error } = await supabase
    .from("attendance_logs")
    .select("id", { count: "exact", head: true })
    .eq("log_type", "IN")
    .gte("created_at", from.toISOString())
    .lt("created_at", to.toISOString());

  if (error) throw new Error(`Günlük giriş sayısı okunamadı: ${error.message}`);

  return count ?? 0;
}

function buildStats(
  employees: EmployeeRow[],
  activity: ActivityRow[],
  todayStart: Date,
  shiftWindowStart: Date,
): OverviewStats {
  const activeCodes = new Set(
    employees.filter((e) => e.is_active).map((e) => e.employee_code),
  );

  const lastTypeInWindow = new Map<string, LogType>();
  const seenToday = new Set<string>();
  let todayEntries = 0;
  let todayExits = 0;

  // activity yeniden eskiye sıralı: personelin ilk görülen kaydı son hareketidir.
  for (const log of activity) {
    const createdAt = parseTimestamp(log.created_at);
    if (!createdAt) continue;

    if (createdAt >= shiftWindowStart && !lastTypeInWindow.has(log.employee_code)) {
      lastTypeInWindow.set(log.employee_code, log.log_type);
    }

    if (createdAt >= todayStart) {
      seenToday.add(log.employee_code);
      if (log.log_type === "IN") todayEntries += 1;
      else todayExits += 1;
    }
  }

  let inside = 0;
  let noActivityToday = 0;

  for (const code of activeCodes) {
    if (lastTypeInWindow.get(code) === "IN") inside += 1;
    else if (!seenToday.has(code)) noActivityToday += 1;
  }

  return {
    inside,
    outside: activeCodes.size - inside,
    noActivityToday,
    todayTotal: todayEntries + todayExits,
    todayEntries,
    todayExits,
    activeEmployees: activeCodes.size,
    inactiveEmployees: employees.length - activeCodes.size,
  };
}

export async function getOverview(): Promise<OverviewData> {
  await requireSession();

  const supabase = createAdminClient();
  const now = new Date();

  const todayKey = getIstanbulDayKey(now);
  const todayStart = getIstanbulDayStart(todayKey);
  const shiftWindowStart = new Date(
    now.getTime() - MAX_SHIFT_HOURS * 60 * 60 * 1000,
  );
  const activitySince =
    shiftWindowStart < todayStart ? shiftWindowStart : todayStart;

  const dayKeys = Array.from({ length: WEEK_DAYS }, (_, index) =>
    shiftDayKey(todayKey, index - (WEEK_DAYS - 1)),
  );

  const [employees, activity, recentLogs, entryCounts] = await Promise.all([
    fetchEmployees(supabase),
    fetchActivity(supabase, activitySince),
    fetchRecentLogs(supabase),
    Promise.all(
      dayKeys.map((dayKey) =>
        countEntries(
          supabase,
          getIstanbulDayStart(dayKey),
          getIstanbulDayStart(shiftDayKey(dayKey, 1)),
        ),
      ),
    ),
  ]);

  return {
    fetchedAt: now.toISOString(),
    stats: buildStats(employees, activity, todayStart, shiftWindowStart),
    recentLogs,
    weeklyEntries: dayKeys.map((dayKey, index) => {
      const dayStart = getIstanbulDayStart(dayKey);
      return {
        dayKey,
        label: formatWeekdayShort(dayStart),
        fullLabel: formatDayMonth(dayStart),
        entries: entryCounts[index],
        isToday: dayKey === todayKey,
      };
    }),
  };
}
