import Link from "next/link";
import { ChevronLeft, ChevronRight, FileSpreadsheet, History } from "lucide-react";

import { buttonSecondary, card } from "@/components/ui/styles";
import { formatDate, formatTime, getIstanbulDayKey, formatDuration } from "@/lib/date-utils";
import {
  REPORT_PAGE_SIZE,
  reportFileName,
  toReportSearch,
  type ReportFilters,
} from "@/lib/reports/filters";
import { DAY_STATUS_LABELS, type DayStatus, type TimesheetRow } from "@/lib/reports/timesheet";

const STATUS_STYLES: Record<DayStatus, string> = {
  complete: "border-ok/20 bg-ok/10 text-ok",
  inside: "border-accent/20 bg-accent/10 text-accent",
  missing_exit: "border-danger/20 bg-danger/10 text-danger",
  missing_entry: "border-danger/20 bg-danger/10 text-danger",
};

const headerCell =
  "px-4 py-2.5 text-left text-xs font-medium whitespace-nowrap text-ink-faint first:pl-5 last:pr-5";
const bodyCell = "px-4 py-3 align-middle whitespace-nowrap first:pl-5 last:pr-5";
const pagerLink = `${buttonSecondary} h-8 px-2.5`;

function StatusBadge({ status }: { status: DayStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}`}
    >
      {status === "inside" && (
        <span className="relative flex size-1.5">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent opacity-60" />
          <span className="relative inline-flex size-1.5 rounded-full bg-accent" />
        </span>
      )}
      {DAY_STATUS_LABELS[status]}
    </span>
  );
}

export function ReportTable({
  rows,
  filters,
}: {
  rows: TimesheetRow[];
  filters: ReportFilters;
}) {
  const pageCount = Math.max(1, Math.ceil(rows.length / REPORT_PAGE_SIZE));
  const page = Math.min(filters.page, pageCount);
  const firstIndex = (page - 1) * REPORT_PAGE_SIZE;
  const pageRows = rows.slice(firstIndex, firstIndex + REPORT_PAGE_SIZE);
  const exportHref = `/reports/export${toReportSearch({ ...filters, page: undefined })}`;
  const pageHref = (target: number) => `/reports${toReportSearch({ ...filters, page: target })}`;

  return (
    <section className={`${card} overflow-hidden`}>
      <header className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-ink">Puantaj</h2>
          <p className="mt-0.5 text-sm text-ink-faint">
            {formatDate(filters.start)} – {formatDate(filters.end)} arası,{" "}
            {rows.length.toLocaleString("tr-TR")} günlük kayıt
          </p>
        </div>
        {rows.length > 0 ? (
          <a
            href={exportHref}
            download={reportFileName(filters)}
            className={`${buttonSecondary} self-start sm:self-auto`}
          >
            <FileSpreadsheet aria-hidden className="size-4 text-ok" />
            Excel indir (.xlsx)
          </a>
        ) : (
          <span
            aria-disabled
            className={`${buttonSecondary} pointer-events-none self-start opacity-50 sm:self-auto`}
          >
            <FileSpreadsheet aria-hidden className="size-4" />
            Excel indir (.xlsx)
          </span>
        )}
      </header>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center border-t border-line px-6 py-14 text-center">
          <span className="flex size-11 items-center justify-center rounded-xl border border-line bg-sunken text-ink-soft">
            <History aria-hidden className="size-5" strokeWidth={1.75} />
          </span>
          <p className="mt-4 text-base font-medium text-ink">
            Seçilen aralıkta hareket kaydı bulunmuyor
          </p>
          <p className="mt-1.5 max-w-[46ch] text-sm leading-relaxed text-ink-soft">
            Tarih aralığını genişletin veya departman ve çalışan filtrelerini kaldırıp tekrar
            deneyin.
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto border-t border-line">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="bg-sunken/50">
                <tr>
                  <th scope="col" className={headerCell}>Tarih</th>
                  <th scope="col" className={headerCell}>Sicil no</th>
                  <th scope="col" className={headerCell}>Ad soyad</th>
                  <th scope="col" className={headerCell}>Departman</th>
                  <th scope="col" className={headerCell}>İlk giriş</th>
                  <th scope="col" className={headerCell}>Son çıkış</th>
                  <th scope="col" className={`${headerCell} text-right`}>Toplam süre</th>
                  <th scope="col" className={headerCell}>Durum</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {pageRows.map((row) => {
                  const exitsNextDay =
                    row.lastExit !== null &&
                    getIstanbulDayKey(new Date(row.lastExit)) !== row.dayKey;
                  return (
                    <tr
                      key={`${row.dayKey}|${row.employeeCode}`}
                      className="transition-colors duration-200 hover:bg-sunken/40"
                    >
                      <td className={`${bodyCell} text-ink tabular-nums`}>
                        {formatDate(row.dayKey)}
                      </td>
                      <td className={`${bodyCell} font-mono text-[13px] text-ink-soft`}>
                        {row.employeeCode}
                      </td>
                      <td className={`${bodyCell} font-medium text-ink`}>{row.fullName}</td>
                      <td className={`${bodyCell} text-ink-soft`}>{row.department ?? "—"}</td>
                      <td className={`${bodyCell} font-mono text-[13px] text-ink tabular-nums`}>
                        {formatTime(row.firstEntry)}
                      </td>
                      <td className={`${bodyCell} font-mono text-[13px] text-ink tabular-nums`}>
                        {formatTime(row.lastExit)}
                        {exitsNextDay && (
                          <span
                            title={`Çıkış ${formatDate(row.lastExit)} tarihinde`}
                            className="ml-1.5 font-sans text-xs text-ink-faint"
                          >
                            ertesi gün
                          </span>
                        )}
                      </td>
                      <td className={`${bodyCell} text-right font-medium text-ink tabular-nums`}>
                        {row.workedMs > 0 ? formatDuration(row.workedMs) : "—"}
                      </td>
                      <td className={bodyCell}>
                        <StatusBadge status={row.status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {pageCount > 1 && (
            <nav
              aria-label="Sayfalar"
              className="flex items-center justify-between gap-4 border-t border-line px-5 py-3"
            >
              <p className="text-sm text-ink-faint tabular-nums">
                {(firstIndex + 1).toLocaleString("tr-TR")}–
                {(firstIndex + pageRows.length).toLocaleString("tr-TR")} /{" "}
                {rows.length.toLocaleString("tr-TR")}
              </p>
              <div className="flex items-center gap-2">
                {page > 1 ? (
                  <Link href={pageHref(page - 1)} scroll={false} className={pagerLink}>
                    <ChevronLeft aria-hidden className="size-4" />
                    Önceki
                  </Link>
                ) : (
                  <span aria-disabled className={`${pagerLink} pointer-events-none opacity-50`}>
                    <ChevronLeft aria-hidden className="size-4" />
                    Önceki
                  </span>
                )}
                <span className="text-sm text-ink-soft tabular-nums">
                  {page} / {pageCount}
                </span>
                {page < pageCount ? (
                  <Link href={pageHref(page + 1)} scroll={false} className={pagerLink}>
                    Sonraki
                    <ChevronRight aria-hidden className="size-4" />
                  </Link>
                ) : (
                  <span aria-disabled className={`${pagerLink} pointer-events-none opacity-50`}>
                    Sonraki
                    <ChevronRight aria-hidden className="size-4" />
                  </span>
                )}
              </div>
            </nav>
          )}
        </>
      )}
    </section>
  );
}
