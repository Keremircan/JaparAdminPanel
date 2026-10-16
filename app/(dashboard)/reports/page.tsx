import { Suspense } from "react";
import type { Metadata } from "next";
import { ArrowLeftRight, CircleAlert, Clock, Timer } from "lucide-react";

import { TableSkeleton } from "@/components/employees/skeletons";
import { StatCard } from "@/components/overview/stat-card";
import { ReportFilters } from "@/components/reports/report-filters";
import { ReportTable } from "@/components/reports/report-table";
import { formatDuration, getIstanbulDayKey } from "@/lib/date-utils";
import { getReportPresets, MAX_RANGE_DAYS } from "@/lib/reports/filters";
import { getTimesheetReport } from "@/lib/reports/queries";

export const metadata: Metadata = {
  title: "Raporlar & Puantaj",
};

async function ReportContent({
  searchParams,
}: {
  searchParams: PageProps<"/reports">["searchParams"];
}) {
  const report = await getTimesheetReport(await searchParams);
  const { summary, filters } = report;
  const departments = [
    ...new Set(report.employees.map((e) => e.department?.trim()).filter((d): d is string => !!d)),
  ].sort((a, b) => a.localeCompare(b, "tr"));
  const openCount = summary.insideCount + summary.missingExitCount;

  return (
    <div className="space-y-6">
      <ReportFilters
        filters={filters}
        presets={getReportPresets(getIstanbulDayKey(new Date(report.generatedAt)))}
        departments={departments}
        employees={report.employees}
      />

      {report.wasClamped && (
        <p
          role="status"
          className="flex items-start gap-2 rounded-xl border border-line bg-sunken/60 px-4 py-3 text-sm text-ink-soft"
        >
          <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0 text-ink-faint" />
          Rapor en fazla {MAX_RANGE_DAYS} günü kapsayabilir; bitiş tarihi buna göre kısaltıldı.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Toplam çalışma süresi"
          value={formatDuration(summary.workedMs)}
          hint={`${summary.employeeCount.toLocaleString("tr-TR")} çalışan, tamamlanan vardiyalar`}
          icon={Clock}
          tone="ok"
        />
        <StatCard
          label="Toplam hareket"
          value={summary.movementCount}
          hint="Seçilen aralıktaki giriş ve çıkış okutmaları"
          icon={ArrowLeftRight}
        />
        <StatCard
          label="Çıkışı olmayan giriş"
          value={openCount}
          hint={
            openCount === 0
              ? "Açık kalan hareket yok"
              : `${summary.insideCount.toLocaleString("tr-TR")} içeride, ${summary.missingExitCount.toLocaleString("tr-TR")} çıkışı eksik`
          }
          icon={CircleAlert}
        />
        <StatCard
          label="Geç kalma ve erken çıkma"
          value={formatDuration((summary.lateMinutes + summary.earlyLeaveMinutes) * 60_000)}
          hint={`${formatDuration(summary.lateMinutes * 60_000)} geç kalma, ${formatDuration(summary.earlyLeaveMinutes * 60_000)} erken çıkma`}
          icon={Timer}
        />
      </div>

      <ReportTable rows={report.rows} filters={filters} />
    </div>
  );
}

export default function ReportsPage({ searchParams }: PageProps<"/reports">) {
  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight text-ink">Raporlar & Puantaj</h1>
      <p className="mt-1.5 mb-8 max-w-[65ch] text-[15px] leading-relaxed text-ink-soft">
        Giriş ve çıkış okutmalarından hesaplanan günlük çalışma süreleri. Gece vardiyaları
        girişin yapıldığı güne yazılır.
      </p>

      <Suspense fallback={<TableSkeleton rows={8} />}>
        <ReportContent searchParams={searchParams} />
      </Suspense>
    </>
  );
}
