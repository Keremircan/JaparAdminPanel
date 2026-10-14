import { MAX_SHIFT_MS } from "@/lib/attendance-rules";
import {
  getIstanbulDayKey,
  getIstanbulDayStart,
  parseTimestamp,
  shiftDayKey,
} from "@/lib/date-utils";

/**
 * Puantaj hesabı. Saf fonksiyondur: veritabanına dokunmaz, böylece sayfa ve
 * Excel çıktısı aynı sonucu üretir.
 *
 * Kurallar (mobil uygulamayla aynı):
 * - Her GİRİŞ bir oturum açar; sonraki ÇIKIŞ, girişten en fazla
 *   MAX_SHIFT_HOURS sonra gelirse oturumu kapatır.
 * - Oturum, girişin yapıldığı Türkiye günü için sayılır. Gece vardiyası
 *   (23:00 → 07:00) böylece tek bir günün satırında görünür.
 * - Çıkışı olmayan giriş: süre penceresi dolmadıysa "İçeride", dolduysa
 *   "Çıkış eksik". Açık oturumların süresi toplama eklenmez.
 * - Eşleşecek girişi olmayan çıkış "Giriş eksik" olarak işaretlenir.
 */

export type TimesheetLog = {
  id: number;
  employee_code: string;
  log_type: "IN" | "OUT";
  created_at: string;
};

export type TimesheetEmployee = {
  employee_code: string;
  full_name: string;
  department: string | null;
};

export type DayStatus = "complete" | "inside" | "missing_exit" | "missing_entry";

export type TimesheetRow = {
  dayKey: string;
  employeeCode: string;
  fullName: string;
  department: string | null;
  /** İlk girişin anı (ISO, UTC). */
  firstEntry: string | null;
  /** Kapanan oturumların son çıkışı (ISO, UTC); ertesi güne taşabilir. */
  lastExit: string | null;
  workedMs: number;
  status: DayStatus;
};

export type TimesheetSummary = {
  workedMs: number;
  movementCount: number;
  insideCount: number;
  missingExitCount: number;
  missingEntryCount: number;
  employeeCount: number;
};

export type Timesheet = { rows: TimesheetRow[]; summary: TimesheetSummary };

type Session =
  | { kind: "closed"; inAt: number; outAt: number }
  | { kind: "inside"; inAt: number }
  | { kind: "missing_exit"; inAt: number }
  | { kind: "missing_entry"; outAt: number };

const STATUS_PRIORITY: DayStatus[] = ["missing_exit", "inside", "missing_entry", "complete"];

/** Rapor aralığından önce ve sonra okunması gereken pay (eşleştirme bağlamı). */
export function getTimesheetFetchWindow(startKey: string, endKey: string, now: Date) {
  const rangeStart = getIstanbulDayStart(startKey).getTime();
  const rangeEnd = getIstanbulDayStart(shiftDayKey(endKey, 1)).getTime();
  return {
    from: new Date(rangeStart - MAX_SHIFT_MS),
    to: new Date(Math.min(rangeEnd + MAX_SHIFT_MS, now.getTime() + 1)),
  };
}

function buildSessions(logs: { type: "IN" | "OUT"; at: number }[], now: number): Session[] {
  const sessions: Session[] = [];
  let openAt: number | null = null;

  for (const log of logs) {
    if (log.type === "IN") {
      if (openAt !== null) sessions.push({ kind: "missing_exit", inAt: openAt });
      openAt = log.at;
      continue;
    }

    if (openAt !== null && log.at - openAt <= MAX_SHIFT_MS) {
      sessions.push({ kind: "closed", inAt: openAt, outAt: log.at });
    } else {
      if (openAt !== null) sessions.push({ kind: "missing_exit", inAt: openAt });
      sessions.push({ kind: "missing_entry", outAt: log.at });
    }
    openAt = null;
  }

  if (openAt !== null) {
    sessions.push({
      kind: now - openAt <= MAX_SHIFT_MS ? "inside" : "missing_exit",
      inAt: openAt,
    });
  }

  return sessions;
}

export function computeTimesheet({
  logs,
  employees,
  startKey,
  endKey,
  now,
}: {
  logs: TimesheetLog[];
  employees: Map<string, TimesheetEmployee>;
  startKey: string;
  endKey: string;
  now: Date;
}): Timesheet {
  const rangeStart = getIstanbulDayStart(startKey).getTime();
  const rangeEnd = getIstanbulDayStart(shiftDayKey(endKey, 1)).getTime();
  const inRange = (at: number) => at >= rangeStart && at < rangeEnd;

  const logsByEmployee = new Map<string, { id: number; type: "IN" | "OUT"; at: number }[]>();
  let movementCount = 0;

  for (const log of logs) {
    if (!employees.has(log.employee_code)) continue;
    const at = parseTimestamp(log.created_at)?.getTime();
    if (at === undefined) continue;

    if (inRange(at)) movementCount += 1;
    const list = logsByEmployee.get(log.employee_code) ?? [];
    list.push({ id: log.id, type: log.log_type, at });
    logsByEmployee.set(log.employee_code, list);
  }

  const rows = new Map<string, TimesheetRow>();
  const summary: TimesheetSummary = {
    workedMs: 0,
    movementCount,
    insideCount: 0,
    missingExitCount: 0,
    missingEntryCount: 0,
    employeeCount: 0,
  };
  const employeesWithRows = new Set<string>();

  for (const [code, employeeLogs] of logsByEmployee) {
    const employee = employees.get(code)!;
    employeeLogs.sort((a, b) => a.at - b.at || a.id - b.id);

    for (const session of buildSessions(employeeLogs, now.getTime())) {
      const anchor = session.kind === "missing_entry" ? session.outAt : session.inAt;
      if (!inRange(anchor)) continue;

      const dayKey = getIstanbulDayKey(new Date(anchor));
      const key = `${dayKey}|${code}`;
      const row: TimesheetRow = rows.get(key) ?? {
        dayKey,
        employeeCode: code,
        fullName: employee.full_name,
        department: employee.department,
        firstEntry: null,
        lastExit: null,
        workedMs: 0,
        status: "complete",
      };

      if (session.kind !== "missing_entry") {
        const inAt = new Date(session.inAt).toISOString();
        if (!row.firstEntry || inAt < row.firstEntry) row.firstEntry = inAt;
      }

      let status: DayStatus = "complete";
      if (session.kind === "closed") {
        const outAt = new Date(session.outAt).toISOString();
        if (!row.lastExit || outAt > row.lastExit) row.lastExit = outAt;
        row.workedMs += session.outAt - session.inAt;
        summary.workedMs += session.outAt - session.inAt;
      } else if (session.kind === "inside") {
        status = "inside";
        summary.insideCount += 1;
      } else if (session.kind === "missing_exit") {
        status = "missing_exit";
        summary.missingExitCount += 1;
      } else {
        status = "missing_entry";
        summary.missingEntryCount += 1;
      }

      if (STATUS_PRIORITY.indexOf(status) < STATUS_PRIORITY.indexOf(row.status)) {
        row.status = status;
      }
      rows.set(key, row);
      employeesWithRows.add(code);
    }
  }

  summary.employeeCount = employeesWithRows.size;

  return {
    rows: [...rows.values()].sort(
      (a, b) =>
        a.dayKey.localeCompare(b.dayKey) || a.fullName.localeCompare(b.fullName, "tr"),
    ),
    summary,
  };
}

export const DAY_STATUS_LABELS: Record<DayStatus, string> = {
  complete: "Tamamlandı",
  inside: "İçeride",
  missing_exit: "Çıkış eksik",
  missing_entry: "Giriş eksik",
};
