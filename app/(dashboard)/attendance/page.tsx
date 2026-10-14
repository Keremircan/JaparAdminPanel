import { Suspense } from "react";
import type { Metadata } from "next";

import { AttendanceBoard } from "@/components/attendance/attendance-board";
import { TableSkeleton } from "@/components/employees/skeletons";
import { getAttendanceEmployees, getDayLogs } from "@/lib/attendance/queries";
import { requireSession } from "@/lib/auth/guard";
import { getIstanbulDayKey, isValidDayKey } from "@/lib/date-utils";

export const metadata: Metadata = {
  title: "Canlı Hareketler",
};

async function AttendanceContent({
  searchParams,
}: {
  searchParams: PageProps<"/attendance">["searchParams"];
}) {
  // Bugünü hesaplamadan önce isteğe bağlan (Cache Components şimdiki zamanı bekler).
  await requireSession();
  const todayKey = getIstanbulDayKey(new Date());

  const requested = (await searchParams).tarih;
  const candidate = Array.isArray(requested) ? requested[0] : requested;
  const dayKey =
    candidate && isValidDayKey(candidate) && candidate <= todayKey ? candidate : todayKey;

  const [logs, employees] = await Promise.all([getDayLogs(dayKey), getAttendanceEmployees()]);

  return (
    <AttendanceBoard
      key={dayKey}
      dayKey={dayKey}
      todayKey={todayKey}
      initialLogs={logs}
      employees={employees}
    />
  );
}

export default function AttendancePage({ searchParams }: PageProps<"/attendance">) {
  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight text-ink">Canlı Hareketler</h1>
      <p className="mt-1.5 mb-8 max-w-[65ch] text-[15px] leading-relaxed text-ink-soft">
        Günün tüm giriş ve çıkış okutmaları. Eksik veya hatalı kayıtları buradan elle
        ekleyip düzeltebilirsiniz.
      </p>

      <Suspense fallback={<TableSkeleton rows={8} />}>
        <AttendanceContent searchParams={searchParams} />
      </Suspense>
    </>
  );
}
