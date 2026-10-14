"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarRange, LoaderCircle } from "lucide-react";

import { input } from "@/components/ui/styles";
import { isValidDayKey } from "@/lib/date-utils";
import {
  toReportSearch,
  type ReportFilters as Filters,
  type ReportPreset,
  type ReportPresets,
} from "@/lib/reports/filters";
import type { ReportEmployee } from "@/lib/reports/queries";

const PRESET_LABELS: Record<ReportPreset, string> = {
  today: "Bugün",
  week: "Bu hafta",
  month: "Bu ay",
};

type ReportFiltersProps = {
  filters: Filters;
  presets: ReportPresets;
  departments: string[];
  employees: ReportEmployee[];
};

export function ReportFilters({ filters, presets, departments, employees }: ReportFiltersProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Her filtre değişikliği ilk sayfaya döner.
  const apply = (next: Partial<Omit<Filters, "page">>) =>
    startTransition(() => {
      router.replace(`/reports${toReportSearch({ ...filters, ...next, page: 1 })}`, {
        scroll: false,
      });
    });

  const employeeOptions = employees.filter(
    (employee) =>
      (filters.includeInactive || employee.is_active) &&
      (!filters.department || employee.department === filters.department),
  );
  const isEmployeeVisible = (code: string, department: string, includeInactive: boolean) =>
    employees.some(
      (employee) =>
        employee.employee_code === code &&
        (includeInactive || employee.is_active) &&
        (!department || employee.department === department),
    );

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div
          role="radiogroup"
          aria-label="Hızlı tarih aralığı"
          className="inline-flex h-10 shrink-0 items-center gap-0.5 self-start rounded-lg border border-line bg-sunken/60 p-1"
        >
          {(Object.keys(PRESET_LABELS) as ReportPreset[]).map((preset) => {
            const range = presets[preset];
            const isSelected = filters.start === range.start && filters.end === range.end;
            return (
              <button
                key={preset}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => apply(range)}
                className={`h-full rounded-md px-3 text-sm font-medium transition-all duration-200 ease-in-out focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none ${
                  isSelected ? "bg-surface text-ink shadow-xs" : "text-ink-soft hover:text-ink"
                }`}
              >
                {PRESET_LABELS[preset]}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <CalendarRange aria-hidden className="hidden size-4 shrink-0 text-ink-faint lg:block" />
          <input
            type="date"
            aria-label="Başlangıç tarihi"
            value={filters.start}
            max={presets.today.end}
            onChange={(event) => {
              if (isValidDayKey(event.target.value)) apply({ start: event.target.value });
            }}
            className={`${input} sm:w-40`}
          />
          <span aria-hidden className="text-ink-faint">
            –
          </span>
          <input
            type="date"
            aria-label="Bitiş tarihi"
            value={filters.end}
            max={presets.today.end}
            onChange={(event) => {
              if (isValidDayKey(event.target.value)) apply({ end: event.target.value });
            }}
            className={`${input} sm:w-40`}
          />
        </div>

        {isPending && (
          <span className="flex items-center gap-2 text-sm text-ink-faint" role="status">
            <LoaderCircle aria-hidden className="size-4 animate-spin" />
            Hesaplanıyor
          </span>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <select
          value={filters.department}
          onChange={(event) => {
            const department = event.target.value;
            apply({
              department,
              employee: isEmployeeVisible(filters.employee, department, filters.includeInactive)
                ? filters.employee
                : "",
            });
          }}
          aria-label="Departman"
          className={input}
        >
          <option value="">Tüm departmanlar</option>
          {departments.map((department) => (
            <option key={department} value={department}>
              {department}
            </option>
          ))}
        </select>

        <select
          value={filters.employee}
          onChange={(event) => apply({ employee: event.target.value })}
          aria-label="Çalışan"
          className={input}
        >
          <option value="">Tüm çalışanlar</option>
          {employeeOptions.map((employee) => (
            <option key={employee.employee_code} value={employee.employee_code}>
              {employee.full_name} ({employee.employee_code})
            </option>
          ))}
        </select>

        <select
          value={filters.includeInactive ? "all" : "active"}
          onChange={(event) => {
            const includeInactive = event.target.value === "all";
            apply({
              includeInactive,
              employee: isEmployeeVisible(filters.employee, filters.department, includeInactive)
                ? filters.employee
                : "",
            });
          }}
          aria-label="Çalışan durumu"
          className={input}
        >
          <option value="active">Yalnızca aktif çalışanlar</option>
          <option value="all">Aktif ve pasif çalışanlar</option>
        </select>
      </div>
    </div>
  );
}
