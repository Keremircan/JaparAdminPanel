import { Suspense } from "react";
import type { Metadata } from "next";
import { ArrowLeftRight, Building2, DoorOpen, Users } from "lucide-react";

import { OverviewSkeleton } from "@/components/overview/overview-skeleton";
import { RecentLogsTable } from "@/components/overview/recent-logs-table";
import { StatCard } from "@/components/overview/stat-card";
import { WeeklyEntriesChart } from "@/components/overview/weekly-entries-chart";
import { getOverview } from "@/lib/data/overview";

export const metadata: Metadata = {
  title: "Genel Bakış",
};

async function OverviewContent() {
  const { stats, recentLogs, weeklyEntries, fetchedAt } = await getOverview();

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="İçerideki personel"
          value={stats.inside}
          hint="Son hareketi giriş olanlar"
          icon={Building2}
          tone="ok"
          isLive
        />
        <StatCard
          label="Vardiya dışındaki personel"
          value={stats.outside}
          hint={
            stats.noActivityToday > 0
              ? `${stats.noActivityToday.toLocaleString("tr-TR")} kişinin bugün hareketi yok`
              : "Hepsi bugün okutma yaptı"
          }
          icon={DoorOpen}
        />
        <StatCard
          label="Bugünkü toplam hareket"
          value={stats.todayTotal}
          hint={`${stats.todayEntries.toLocaleString("tr-TR")} giriş, ${stats.todayExits.toLocaleString("tr-TR")} çıkış`}
          icon={ArrowLeftRight}
        />
        <StatCard
          label="Kayıtlı toplam personel"
          value={stats.activeEmployees}
          hint={
            stats.inactiveEmployees > 0
              ? `Aktif kayıtlar, ${stats.inactiveEmployees.toLocaleString("tr-TR")} pasif kayıt hariç`
              : "Tüm kayıtlar aktif"
          }
          icon={Users}
        />
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-3">
        <div className="min-w-0 xl:col-span-2">
          <RecentLogsTable logs={recentLogs} fetchedAt={fetchedAt} />
        </div>
        <WeeklyEntriesChart data={weeklyEntries} />
      </div>
    </div>
  );
}

export default function OverviewPage() {
  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight text-ink">
        Genel Bakış
      </h1>
      <p className="mt-1.5 mb-8 max-w-[65ch] text-[15px] leading-relaxed text-ink-soft">
        Fabrikadaki anlık devam durumu, son okutmalar ve haftalık giriş trendi.
      </p>

      <Suspense fallback={<OverviewSkeleton />}>
        <OverviewContent />
      </Suspense>
    </>
  );
}
