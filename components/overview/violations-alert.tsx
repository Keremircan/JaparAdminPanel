import Link from "next/link";
import { CircleCheck, TriangleAlert } from "lucide-react";

import type { TodayViolations } from "@/lib/data/overview";

/** Bugün vardiyası başlayan personelin geç gelme ve erken çıkma özeti. */
export function ViolationsAlert({ violations }: { violations: TodayViolations }) {
  if (violations.total === 0) {
    return (
      <p className="flex items-center gap-2.5 rounded-xl border border-line bg-surface/80 px-4 py-3 text-sm text-ink-soft">
        <CircleCheck aria-hidden className="size-4 shrink-0 text-ok" />
        Bugün geç gelen veya erken çıkan personel yok.
      </p>
    );
  }

  const parts = [
    violations.lateEmployees > 0 &&
      `${violations.lateEmployees.toLocaleString("tr-TR")} personel geç geldi`,
    violations.earlyLeaveEmployees > 0 &&
      `${violations.earlyLeaveEmployees.toLocaleString("tr-TR")} personel erken çıktı`,
  ].filter(Boolean);

  return (
    <section
      aria-label="Bugünkü vardiya ihlalleri"
      className="flex flex-col gap-3 rounded-xl border border-danger/25 bg-danger/[0.06] px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-start gap-3">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-danger/10 text-danger">
          <TriangleAlert aria-hidden className="size-4" />
        </span>
        <div>
          <p className="text-sm font-semibold text-ink">
            Bugün {parts.join(", ")}
          </p>
          <p className="text-sm text-ink-soft">
            Toplam {violations.total.toLocaleString("tr-TR")} ihlal kaydı. Ayrıntılar hareket
            listesinde saatin yanında görünür.
          </p>
        </div>
      </div>
      <Link
        href="/attendance"
        className="shrink-0 self-start text-sm font-medium text-danger underline-offset-4 hover:underline sm:self-auto"
      >
        Bugünün hareketlerini aç
      </Link>
    </section>
  );
}
