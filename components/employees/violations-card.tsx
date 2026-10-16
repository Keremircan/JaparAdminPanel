import { CircleAlert, ShieldCheck } from "lucide-react";

import { card } from "@/components/ui/styles";
import { formatDate, formatDuration, formatTime } from "@/lib/date-utils";
import {
  VIOLATION_LABELS,
  type ShiftViolation,
  type ViolationKind,
} from "@/lib/violations/types";

const KIND_STYLES: Record<ViolationKind, string> = {
  late: "border-danger/20 bg-danger/10 text-danger",
  early_leave: "border-danger/20 bg-danger/10 text-danger",
};

function MonthTotal({ label, minutes, count }: { label: string; minutes: number; count: number }) {
  return (
    <div className="bg-surface px-5 py-4">
      <dt className="text-sm text-ink-faint">{label}</dt>
      <dd className="mt-1 flex items-baseline gap-2">
        <span
          className={`text-2xl font-semibold tracking-tight ${minutes > 0 ? "text-danger" : "text-ink"}`}
        >
          {formatDuration(minutes * 60_000)}
        </span>
        <span className="text-sm text-ink-faint">{count.toLocaleString("tr-TR")} kez</span>
      </dd>
    </div>
  );
}

/** Personelin geç gelme ve erken çıkma geçmişi ile bu ayki toplamlar. */
export function ViolationsCard({
  violations,
  monthKey,
  monthLabel,
  hasShift,
}: {
  violations: ShiftViolation[];
  /** `2026-10` */
  monthKey: string;
  /** `Ekim 2026` */
  monthLabel: string;
  /** Vardiya saatleri ihlal hesaplanabilecek biçimde tanımlı mı? */
  hasShift: boolean;
}) {
  const thisMonth = violations.filter((v) => v.actionDate.startsWith(monthKey));
  const totals = (kind: ViolationKind) => {
    const items = thisMonth.filter((v) => v.kind === kind);
    return { minutes: items.reduce((sum, v) => sum + v.minutes, 0), count: items.length };
  };
  const late = totals("late");
  const earlyLeave = totals("early_leave");

  return (
    <section className={`${card} overflow-hidden`}>
      <header className="px-5 pt-4 pb-3">
        <h2 className="text-base font-semibold tracking-tight text-ink">
          İhlal ve disiplin geçmişi
        </h2>
        <p className="mt-0.5 text-sm text-ink-faint">
          Vardiya saatine göre geç gelme ve erken çıkma kayıtları. Tarih, vardiyanın
          başladığı gündür.
        </p>
      </header>

      <dl className="grid gap-px border-t border-line bg-line sm:grid-cols-2">
        <MonthTotal label={`${monthLabel} geç kalma`} {...late} />
        <MonthTotal label={`${monthLabel} erken çıkma`} {...earlyLeave} />
      </dl>

      {!hasShift && (
        <p className="flex items-start gap-2 border-t border-line bg-sunken/50 px-5 py-3 text-sm text-ink-soft">
          <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0 text-ink-faint" />
          Vardiya saatleri &quot;08:00 - 18:00&quot; biçiminde tanımlı olmadığı için bu personel
          için ihlal hesaplanmıyor. Çalışanı düzenleyerek vardiya saatlerini girin.
        </p>
      )}

      {violations.length === 0 ? (
        <div className="flex flex-col items-center border-t border-line px-6 py-12 text-center">
          <span className="flex size-11 items-center justify-center rounded-xl border border-line bg-sunken text-ok">
            <ShieldCheck aria-hidden className="size-5" strokeWidth={1.75} />
          </span>
          <p className="mt-4 text-base font-medium text-ink">Kayıtlı ihlal yok</p>
          <p className="mt-1.5 max-w-[44ch] text-sm leading-relaxed text-ink-soft">
            Personel bugüne kadar vardiyasına geç kalmadı ve erken çıkmadı.
          </p>
        </div>
      ) : (
        <div className="max-h-96 overflow-auto border-t border-line">
          <table className="w-full min-w-[480px] text-sm">
            <thead className="sticky top-0 bg-sunken">
              <tr>
                {["Vardiya günü", "Hareket saati", "İhlal", "Süre"].map((label) => (
                  <th
                    key={label}
                    scope="col"
                    className={`px-5 py-2.5 text-xs font-medium whitespace-nowrap text-ink-faint ${
                      label === "Süre" ? "text-right" : "text-left"
                    }`}
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {violations.map((violation) => (
                <tr key={violation.id} className="transition-colors duration-200 hover:bg-sunken/40">
                  <td className="px-5 py-3 whitespace-nowrap text-ink tabular-nums">
                    {formatDate(violation.actionDate)}
                  </td>
                  <td className="px-5 py-3 font-mono text-[13px] whitespace-nowrap text-ink-soft tabular-nums">
                    {violation.occurredAt
                      ? `${formatTime(violation.occurredAt)}, ${formatDate(violation.occurredAt)}`
                      : "—"}
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${KIND_STYLES[violation.kind]}`}
                    >
                      {VIOLATION_LABELS[violation.kind]}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right font-medium whitespace-nowrap text-ink tabular-nums">
                    {formatDuration(violation.minutes * 60_000)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
