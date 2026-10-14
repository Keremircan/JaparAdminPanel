"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, Search, X } from "lucide-react";

import { input } from "@/components/ui/styles";
import type { EmployeeFilters as Filters, EmployeeStatusFilter } from "@/lib/employees/types";

const SEARCH_DEBOUNCE_MS = 300;

const STATUS_OPTIONS: { value: EmployeeStatusFilter; label: string; param: string }[] = [
  { value: "all", label: "Tümü", param: "" },
  { value: "active", label: "Aktif", param: "aktif" },
  { value: "inactive", label: "Pasif", param: "pasif" },
];

function toSearch(filters: Filters): string {
  const params = new URLSearchParams();
  if (filters.query) params.set("q", filters.query);
  if (filters.department) params.set("departman", filters.department);
  const status = STATUS_OPTIONS.find((option) => option.value === filters.status)?.param;
  if (status) params.set("durum", status);
  const search = params.toString();
  return search ? `?${search}` : "";
}

/** Filtreleri URL'de tutar; sayfa yenilense veya paylaşılsa da aynı liste açılır. */
export function EmployeeFilters({
  filters,
  departments,
}: {
  filters: Filters;
  departments: string[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState(filters.query);
  const apply = (next: Partial<Filters>) =>
    startTransition(() => {
      router.replace(`/employees${toSearch({ ...filters, ...next })}`, { scroll: false });
    });

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed === filters.query) return;
    const id = window.setTimeout(
      () =>
        startTransition(() => {
          router.replace(`/employees${toSearch({ ...filters, query: trimmed })}`, {
            scroll: false,
          });
        }),
      SEARCH_DEBOUNCE_MS,
    );
    return () => window.clearTimeout(id);
  }, [query, filters, router]);

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center">
      <div className="relative md:max-w-xs md:flex-1">
        <Search
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-faint"
        />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Ad veya sicil no ara"
          aria-label="Ad veya sicil numarasına göre ara"
          className={`${input} pr-9 pl-9 [&::-webkit-search-cancel-button]:hidden`}
        />
        {isPending ? (
          <LoaderCircle
            aria-hidden
            className="absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-ink-faint"
          />
        ) : (
          query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Aramayı temizle"
              className="absolute top-1/2 right-2 flex size-6 -translate-y-1/2 items-center justify-center rounded-md text-ink-faint transition-colors hover:bg-sunken hover:text-ink"
            >
              <X aria-hidden className="size-3.5" />
            </button>
          )
        )}
      </div>

      <select
        value={filters.department}
        onChange={(event) => apply({ department: event.target.value })}
        aria-label="Departman"
        className={`${input} md:w-48`}
      >
        <option value="">Tüm departmanlar</option>
        {departments.map((department) => (
          <option key={department} value={department}>
            {department}
          </option>
        ))}
      </select>

      <div
        role="radiogroup"
        aria-label="Durum"
        className="inline-flex h-10 shrink-0 items-center gap-0.5 self-start rounded-lg border border-line bg-sunken/60 p-1 md:self-auto"
      >
        {STATUS_OPTIONS.map((option) => {
          const isSelected = filters.status === option.value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => apply({ status: option.value })}
              className={`h-full rounded-md px-3 text-sm font-medium transition-all duration-200 ease-in-out focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none ${
                isSelected
                  ? "bg-surface text-ink shadow-xs"
                  : "text-ink-soft hover:text-ink"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
