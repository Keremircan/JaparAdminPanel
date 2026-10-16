"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  History,
  LoaderCircle,
  PenLine,
  Pencil,
  Plus,
  Search,
  Smartphone,
  StickyNote,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { LogTypeBadge } from "@/components/log-type-badge";
import { ViolationBadge } from "@/components/violation-badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { buttonPrimary, buttonSecondary, card, iconButton, input } from "@/components/ui/styles";
import { deleteLog } from "@/lib/attendance/actions";
import type { AttendanceEmployee, AttendanceLog } from "@/lib/attendance/types";
import {
  formatDateTime,
  formatLongDate,
  formatTime,
  getIstanbulDayKey,
  isValidDayKey,
  shiftDayKey,
} from "@/lib/date-utils";

import { LogFormDialog, type LogDialogTarget } from "./log-form-dialog";
import { useAttendanceRealtime, type RealtimeStatus } from "./use-attendance-realtime";

type TypeFilter = "all" | "IN" | "OUT";

const TYPE_OPTIONS: { value: TypeFilter; label: string }[] = [
  { value: "all", label: "Tümü" },
  { value: "IN", label: "Girişler" },
  { value: "OUT", label: "Çıkışlar" },
];

const FALLBACK_REFRESH_MS = 15_000;
const FLASH_MS = 2_400;
const REALTIME_REFRESH_DELAY_MS = 500;

const headerCell =
  "px-4 py-2.5 text-left text-xs font-medium whitespace-nowrap text-ink-faint first:pl-5 last:pr-5";
const bodyCell = "px-4 py-3 align-middle whitespace-nowrap first:pl-5 last:pr-5";

function normalize(value: string) {
  return value.toLocaleLowerCase("tr").trim();
}

function LiveBadge({ status, isToday }: { status: RealtimeStatus; isToday: boolean }) {
  if (!isToday) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md border border-line bg-sunken px-2 py-1 text-xs font-medium text-ink-soft">
        <History aria-hidden className="size-3.5" />
        Geçmiş gün
      </span>
    );
  }
  if (status === "live") {
    return (
      <span className="inline-flex items-center gap-2 rounded-md border border-ok/20 bg-ok/10 px-2 py-1 text-xs font-medium text-ok">
        <span className="relative flex size-2">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-ok opacity-60" />
          <span className="relative inline-flex size-2 rounded-full bg-ok" />
        </span>
        Canlı akış aktif
      </span>
    );
  }
  if (status === "connecting") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md border border-line bg-sunken px-2 py-1 text-xs font-medium text-ink-soft">
        <LoaderCircle aria-hidden className="size-3.5 animate-spin" />
        Bağlanıyor
      </span>
    );
  }
  return (
    <span
      title="Supabase Realtime bağlantısı kurulamadı. Liste 15 saniyede bir yenileniyor."
      className="inline-flex items-center gap-1.5 rounded-md border border-line bg-sunken px-2 py-1 text-xs font-medium text-ink-soft"
    >
      <span aria-hidden className="size-2 rounded-full bg-ink-faint" />
      Canlı akış kapalı, 15 sn&apos;de bir yenileniyor
    </span>
  );
}

function SourceBadge({ log }: { log: AttendanceLog }) {
  const isManual = log.source === "manual";
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-xs font-medium ${
          isManual ? "border-accent/20 bg-accent/10 text-accent" : "border-line bg-sunken text-ink-soft"
        }`}
      >
        {isManual ? (
          <PenLine aria-hidden className="size-3" />
        ) : (
          <Smartphone aria-hidden className="size-3" />
        )}
        {isManual ? "Manuel" : "Otomatik"}
      </span>
      {log.edited_at && (
        <span
          title={`Son düzeltme: ${formatDateTime(log.edited_at)}`}
          className="text-xs text-ink-faint"
        >
          düzeltildi
        </span>
      )}
      {log.note && (
        <span title={log.note} className="text-ink-faint">
          <StickyNote aria-hidden className="size-3.5" />
          <span className="sr-only">Not: {log.note}</span>
        </span>
      )}
    </span>
  );
}

function DeviceCell({ log, employee }: { log: AttendanceLog; employee?: AttendanceEmployee }) {
  let device: string;
  if (log.source === "manual") device = "Elle girildi";
  else if (!log.hardware_id) device = "—";
  else if (employee?.device_key && log.hardware_id === employee.device_key)
    device = employee.device_name ?? "Bağlı cihaz";
  else device = "Önceki cihaz";

  return (
    <>
      <span className="block text-ink">{device}</span>
      {log.gate_id && <span className="block text-xs text-ink-faint">{log.gate_id}</span>}
    </>
  );
}

type AttendanceBoardProps = {
  dayKey: string;
  todayKey: string;
  initialLogs: AttendanceLog[];
  employees: AttendanceEmployee[];
};

export function AttendanceBoard({ dayKey, todayKey, initialLogs, employees }: AttendanceBoardProps) {
  const router = useRouter();
  const isToday = dayKey === todayKey;
  const [isNavigating, startNavigation] = useTransition();
  const [isDeleting, startDelete] = useTransition();

  const [query, setQuery] = useState("");
  const [department, setDepartment] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");

  // Canlı olaylar sunucudan gelen listenin üzerine uygulanır (id → satır veya silindi).
  const [changes, setChanges] = useState<Map<number, AttendanceLog | null>>(() => new Map());
  const [flashing, setFlashing] = useState<Set<number>>(() => new Set());

  const refreshTimer = useRef<number | undefined>(undefined);

  const [dialog, setDialog] = useState<LogDialogTarget | null>(null);
  const [pendingDelete, setPendingDelete] = useState<AttendanceLog | null>(null);

  const employeesByCode = useMemo(
    () => new Map(employees.map((employee) => [employee.employee_code, employee])),
    [employees],
  );
  const departments = useMemo(
    () =>
      [...new Set(employees.map((e) => e.department).filter((d): d is string => !!d))].sort(
        (a, b) => a.localeCompare(b, "tr"),
      ),
    [employees],
  );

  const realtimeStatus = useAttendanceRealtime(isToday, (change) => {
    if (change.kind === "delete") {
      setChanges((current) => new Map(current).set(change.id, null));
      return;
    }

    const { log } = change;
    const belongsToDay = getIstanbulDayKey(new Date(log.created_at)) === dayKey;
    setChanges((current) => new Map(current).set(log.id, belongsToDay ? log : null));
    if (!belongsToDay) return;

    setFlashing((current) => new Set(current).add(log.id));
    window.setTimeout(() => {
      setFlashing((current) => {
        const next = new Set(current);
        next.delete(log.id);
        return next;
      });
    }, FLASH_MS);

    // İhlal kaydı (geç gelme / erken çıkma) ve sayfa açıldıktan sonra eklenen
    // çalışanın adı Realtime olayında yoktur; art arda gelen olaylar tek
    // yenilemede toplanır.
    window.clearTimeout(refreshTimer.current);
    refreshTimer.current = window.setTimeout(() => router.refresh(), REALTIME_REFRESH_DELAY_MS);
  });

  // Realtime kullanılamıyorsa bugünün listesi periyodik olarak tazelenir.
  useEffect(() => {
    if (!isToday || realtimeStatus !== "offline") return;
    const id = window.setInterval(() => {
      if (!document.hidden) router.refresh();
    }, FALLBACK_REFRESH_MS);
    return () => window.clearInterval(id);
  }, [isToday, realtimeStatus, router]);

  const logs = useMemo(() => {
    const byId = new Map(initialLogs.map((log) => [log.id, log]));
    for (const [id, log] of changes) {
      if (!log) {
        byId.delete(id);
        continue;
      }
      // Realtime satırı ihlal bilgisi taşımaz; sunucudan gelen değer korunur.
      byId.set(id, { ...log, violation: log.violation ?? byId.get(id)?.violation });
    }
    return [...byId.values()].sort(
      (a, b) => b.created_at.localeCompare(a.created_at) || b.id - a.id,
    );
  }, [initialLogs, changes]);

  const needle = normalize(query);
  const visibleLogs = logs.filter((log) => {
    const employee = employeesByCode.get(log.employee_code);
    if (typeFilter !== "all" && log.log_type !== typeFilter) return false;
    if (department && employee?.department !== department) return false;
    if (!needle) return true;
    return (
      normalize(log.employee_code).includes(needle) ||
      normalize(employee?.full_name ?? "").includes(needle)
    );
  });
  const entryCount = logs.filter((log) => log.log_type === "IN").length;
  const isFiltered = Boolean(needle || department || typeFilter !== "all");

  const goToDay = (target: string) =>
    startNavigation(() => {
      router.push(target === todayKey ? "/attendance" : `/attendance?tarih=${target}`, {
        scroll: false,
      });
    });

  const confirmDelete = () => {
    const log = pendingDelete;
    if (!log) return;
    startDelete(async () => {
      const result = await deleteLog(log.id);
      if (result.ok) {
        toast.success(result.message);
        setChanges((current) => new Map(current).set(log.id, null));
        setPendingDelete(null);
      } else {
        toast.error(result.message);
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => goToDay(shiftDayKey(dayKey, -1))}
            aria-label="Önceki gün"
            className={`${iconButton} size-10 border border-line bg-surface`}
          >
            <ChevronLeft aria-hidden className="size-4" />
          </button>
          <input
            type="date"
            aria-label="Gün"
            value={dayKey}
            max={todayKey}
            onChange={(event) => {
              const value = event.target.value;
              if (isValidDayKey(value) && value <= todayKey) goToDay(value);
            }}
            className={`${input} w-40 tabular-nums`}
          />
          <button
            type="button"
            onClick={() => goToDay(shiftDayKey(dayKey, 1))}
            disabled={isToday}
            aria-label="Sonraki gün"
            className={`${iconButton} size-10 border border-line bg-surface`}
          >
            <ChevronRight aria-hidden className="size-4" />
          </button>
          {!isToday && (
            <button type="button" onClick={() => goToDay(todayKey)} className={`${buttonSecondary} h-10`}>
              Bugün
            </button>
          )}
          {isNavigating && (
            <LoaderCircle aria-label="Yükleniyor" className="size-4 animate-spin text-ink-faint" />
          )}
        </div>

        <div className="relative lg:ml-auto lg:w-64">
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
            className={`${input} pl-9`}
          />
        </div>
        <select
          value={department}
          onChange={(event) => setDepartment(event.target.value)}
          aria-label="Departman"
          className={`${input} lg:w-44`}
        >
          <option value="">Tüm departmanlar</option>
          {departments.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
        <div
          role="radiogroup"
          aria-label="Hareket tipi"
          className="inline-flex h-10 shrink-0 items-center gap-0.5 self-start rounded-lg border border-line bg-sunken/60 p-1 lg:self-auto"
        >
          {TYPE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={typeFilter === option.value}
              onClick={() => setTypeFilter(option.value)}
              className={`h-full rounded-md px-3 text-sm font-medium transition-all duration-200 ease-in-out focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none ${
                typeFilter === option.value
                  ? "bg-surface text-ink shadow-xs"
                  : "text-ink-soft hover:text-ink"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <section className={`${card} overflow-hidden`}>
        <header className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-base font-semibold tracking-tight text-ink">
              {isToday ? "Bugünün hareketleri" : formatLongDate(`${dayKey}T12:00:00Z`)}
            </h2>
            <p className="mt-0.5 text-sm text-ink-faint">
              {logs.length.toLocaleString("tr-TR")} hareket,{" "}
              {entryCount.toLocaleString("tr-TR")} giriş ve{" "}
              {(logs.length - entryCount).toLocaleString("tr-TR")} çıkış
              {isFiltered && `; ${visibleLogs.length.toLocaleString("tr-TR")} tanesi gösteriliyor`}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <LiveBadge status={realtimeStatus} isToday={isToday} />
            <button
              type="button"
              onClick={() => setDialog({ kind: "create", openedAt: new Date().toISOString() })}
              className={buttonPrimary}
            >
              <Plus aria-hidden className="size-4" />
              Manuel hareket ekle
            </button>
          </div>
        </header>

        {visibleLogs.length === 0 ? (
          <div className="flex flex-col items-center border-t border-line px-6 py-14 text-center">
            <span className="flex size-11 items-center justify-center rounded-xl border border-line bg-sunken text-ink-soft">
              <History aria-hidden className="size-5" strokeWidth={1.75} />
            </span>
            <p className="mt-4 text-base font-medium text-ink">
              {isFiltered ? "Filtrelere uyan hareket yok" : "Bu gün için hareket kaydı yok"}
            </p>
            <p className="mt-1.5 max-w-[46ch] text-sm leading-relaxed text-ink-soft">
              {isFiltered
                ? "Aramayı veya departman ve tip filtrelerini değiştirin."
                : isToday
                  ? "Personel karekod okuttuğunda hareketler burada anında belirir."
                  : "Başka bir gün seçin veya eksik bir hareketi elle ekleyin."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto border-t border-line">
            <table className="w-full min-w-[980px] text-sm">
              <thead className="bg-sunken/50">
                <tr>
                  <th scope="col" className={headerCell}>Saat</th>
                  <th scope="col" className={headerCell}>Personel</th>
                  <th scope="col" className={headerCell}>Sicil no</th>
                  <th scope="col" className={headerCell}>Departman</th>
                  <th scope="col" className={headerCell}>Tip</th>
                  <th scope="col" className={headerCell}>Cihaz</th>
                  <th scope="col" className={headerCell}>Kayıt türü</th>
                  <th scope="col" className={`${headerCell} text-right`}>
                    <span className="sr-only">İşlemler</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {visibleLogs.map((log) => {
                  const employee = employeesByCode.get(log.employee_code);
                  const name = employee?.full_name ?? "Kayıtlı olmayan personel";
                  return (
                    <tr
                      key={log.id}
                      className={`transition-colors duration-200 hover:bg-sunken/40 ${
                        flashing.has(log.id) ? "animate-row-flash" : ""
                      }`}
                    >
                      <td className={bodyCell}>
                        <span className="flex items-center gap-2">
                          <span className="font-mono text-[13px] font-medium text-ink tabular-nums">
                            {formatTime(log.created_at, { seconds: true })}
                          </span>
                          {log.violation && <ViolationBadge violation={log.violation} />}
                        </span>
                      </td>
                      <td className={`${bodyCell} font-medium ${employee ? "text-ink" : "text-ink-faint"}`}>
                        {name}
                      </td>
                      <td className={`${bodyCell} font-mono text-[13px] text-ink-soft`}>
                        {log.employee_code}
                      </td>
                      <td className={`${bodyCell} text-ink-soft`}>{employee?.department ?? "—"}</td>
                      <td className={bodyCell}>
                        <LogTypeBadge type={log.log_type} />
                      </td>
                      <td className={bodyCell}>
                        <DeviceCell log={log} employee={employee} />
                      </td>
                      <td className={bodyCell}>
                        <SourceBadge log={log} />
                      </td>
                      <td className={bodyCell}>
                        <div className="flex items-center justify-end gap-0.5">
                          <button
                            type="button"
                            onClick={() => setDialog({ kind: "edit", log, employee })}
                            aria-label={`${name}, ${formatTime(log.created_at)}: Düzenle`}
                            title="Düzenle"
                            className={iconButton}
                          >
                            <Pencil aria-hidden className="size-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setPendingDelete(log)}
                            aria-label={`${name}, ${formatTime(log.created_at)}: Sil`}
                            title="Sil"
                            className={`${iconButton} hover:bg-danger/10 hover:text-danger`}
                          >
                            <Trash2 aria-hidden className="size-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <LogFormDialog target={dialog} employees={employees} onClose={() => setDialog(null)} />

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Hareket silinsin mi?"
        description={
          pendingDelete && (
            <>
              <strong className="font-medium text-ink">
                {employeesByCode.get(pendingDelete.employee_code)?.full_name ??
                  pendingDelete.employee_code}
              </strong>{" "}
              için {formatDateTime(pendingDelete.created_at, { seconds: true })} tarihli{" "}
              {pendingDelete.log_type === "IN" ? "giriş" : "çıkış"} kaydı kalıcı olarak silinir.
              Puantaj hesapları bu kayda göre yeniden yapılır.
            </>
          )
        }
        confirmLabel="Sil"
        pendingLabel="Siliniyor"
        tone="danger"
        isPending={isDeleting}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
