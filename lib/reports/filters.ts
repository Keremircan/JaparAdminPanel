import {
  diffDayKeys,
  getMonthStartDayKey,
  getWeekStartDayKey,
  isValidDayKey,
  shiftDayKey,
} from "@/lib/date-utils";

/** Bir raporun kapsayabileceği en uzun aralık; daha uzunu kırpılır. */
export const MAX_RANGE_DAYS = 92;
export const REPORT_PAGE_SIZE = 50;

export type ReportFilters = {
  start: string;
  end: string;
  department: string;
  employee: string;
  includeInactive: boolean;
  page: number;
};

export type ReportPreset = "today" | "week" | "month";

export type ReportPresets = Record<ReportPreset, { start: string; end: string }>;

export function getReportPresets(todayKey: string): ReportPresets {
  return {
    today: { start: todayKey, end: todayKey },
    week: { start: getWeekStartDayKey(todayKey), end: todayKey },
    month: { start: getMonthStartDayKey(todayKey), end: todayKey },
  };
}

export type ParsedReportFilters = {
  filters: ReportFilters;
  /** Aralık MAX_RANGE_DAYS'i aştığı için kırpıldıysa true. */
  wasClamped: boolean;
};

export function parseReportFilters(
  searchParams: Record<string, string | string[] | undefined>,
  todayKey: string,
): ParsedReportFilters {
  const pick = (key: string) => {
    const value = searchParams[key];
    return (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
  };

  const fallback = getReportPresets(todayKey).month;
  let start = isValidDayKey(pick("baslangic")) ? pick("baslangic") : fallback.start;
  let end = isValidDayKey(pick("bitis")) ? pick("bitis") : fallback.end;
  if (start > end) [start, end] = [end, start];

  let wasClamped = false;
  if (diffDayKeys(start, end) >= MAX_RANGE_DAYS) {
    end = shiftDayKey(start, MAX_RANGE_DAYS - 1);
    wasClamped = true;
  }

  const page = Number.parseInt(pick("sayfa"), 10);

  return {
    filters: {
      start,
      end,
      department: pick("departman"),
      employee: pick("calisan"),
      includeInactive: pick("durum") === "tum",
      page: Number.isFinite(page) && page > 1 ? page : 1,
    },
    wasClamped,
  };
}

/** Filtreleri URL sorgusuna çevirir; varsayılan değerler yazılmaz. */
export function toReportSearch(
  filters: Omit<ReportFilters, "page"> & { page?: number },
): string {
  const params = new URLSearchParams({ baslangic: filters.start, bitis: filters.end });
  if (filters.department) params.set("departman", filters.department);
  if (filters.employee) params.set("calisan", filters.employee);
  if (filters.includeInactive) params.set("durum", "tum");
  if (filters.page && filters.page > 1) params.set("sayfa", String(filters.page));
  return `?${params.toString()}`;
}

export function reportFileName(filters: Pick<ReportFilters, "start" | "end">): string {
  return `japar_pdks_rapor_${filters.start}_${filters.end}.xlsx`;
}
