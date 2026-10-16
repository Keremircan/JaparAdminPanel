import { Inbox } from "lucide-react";

import { LogTypeBadge } from "@/components/log-type-badge";
import { ViolationBadge } from "@/components/violation-badge";
import type { RecentLog } from "@/lib/data/overview";
import { formatDate, formatTime } from "@/lib/date-utils";

import { RefreshButton } from "./refresh-button";

const headerCell =
  "px-5 py-2.5 text-left text-xs font-medium whitespace-nowrap text-ink-faint";
const bodyCell = "px-5 py-3 align-middle whitespace-nowrap";

type RecentLogsTableProps = {
  logs: RecentLog[];
  fetchedAt: string;
};

export function RecentLogsTable({ logs, fetchedAt }: RecentLogsTableProps) {
  return (
    <section className="overflow-hidden rounded-2xl border border-line bg-surface/80 shadow-card backdrop-blur-md">
      <header className="flex items-center justify-between gap-4 px-5 py-4">
        <div className="min-w-0">
          <h2 className="text-base font-semibold tracking-tight text-ink">
            Son hareketler
          </h2>
          <p className="mt-0.5 text-sm text-ink-faint">
            En son {logs.length > 0 ? logs.length : ""} giriş ve çıkış okutması
          </p>
        </div>
        <RefreshButton fetchedAt={fetchedAt} />
      </header>

      {logs.length === 0 ? (
        <div className="flex flex-col items-center border-t border-line px-6 py-14 text-center">
          <span className="flex size-11 items-center justify-center rounded-xl border border-line bg-sunken text-ink-soft">
            <Inbox aria-hidden className="size-5" strokeWidth={1.75} />
          </span>
          <p className="mt-4 text-base font-medium text-ink">
            Henüz hareket kaydı bulunmuyor
          </p>
          <p className="mt-1.5 max-w-[44ch] text-sm leading-relaxed text-ink-soft">
            Personel kapıdaki karekodu okuttuğunda giriş ve çıkışlar burada
            listelenir.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto border-t border-line">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="bg-sunken/50">
              <tr>
                <th scope="col" className={headerCell}>
                  Personel
                </th>
                <th scope="col" className={headerCell}>
                  Sicil no
                </th>
                <th scope="col" className={headerCell}>
                  Hareket
                </th>
                <th scope="col" className={headerCell}>
                  Saat ve tarih
                </th>
                <th scope="col" className={headerCell}>
                  Kapı
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {logs.map((log) => (
                <tr
                  key={log.id}
                  className="transition-colors duration-200 hover:bg-sunken/40"
                >
                  <td className={`${bodyCell} font-medium text-ink`}>
                    {log.fullName ?? (
                      <span className="font-normal text-ink-faint">
                        Kayıtlı olmayan personel
                      </span>
                    )}
                  </td>
                  <td className={`${bodyCell} font-mono text-[13px] text-ink-soft`}>
                    {log.employeeCode}
                  </td>
                  <td className={bodyCell}>
                    <LogTypeBadge type={log.type} />
                  </td>
                  <td className={bodyCell}>
                    <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="font-mono text-[13px] font-medium text-ink tabular-nums">
                        {formatTime(log.createdAt, { seconds: true })}
                      </span>
                      {log.violation && <ViolationBadge violation={log.violation} />}
                    </span>
                    <span className="block text-xs text-ink-faint tabular-nums">
                      {formatDate(log.createdAt)}
                    </span>
                  </td>
                  <td className={bodyCell}>
                    <span className="block text-ink">{log.gate || "—"}</span>
                    {log.factory && (
                      <span className="block text-xs text-ink-faint">{log.factory}</span>
                    )}
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
