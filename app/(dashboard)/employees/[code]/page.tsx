import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ChevronLeft,
  ExternalLink,
  FileCheck,
  FileText,
  FolderOpen,
  HeartPulse,
  History,
  Link2Off,
  Pencil,
  type LucideIcon,
} from "lucide-react";

import { LogTypeBadge } from "@/components/log-type-badge";
import { ViolationBadge } from "@/components/violation-badge";
import { ViolationsCard } from "@/components/employees/violations-card";
import { DeviceBadge, StatusBadge } from "@/components/employees/badges";
import {
  DeleteEmployeeButton,
  ResetDeviceButton,
  StatusToggleButton,
} from "@/components/employees/employee-actions";
import { DetailSkeleton } from "@/components/employees/skeletons";
import { buttonSecondary, card } from "@/components/ui/styles";
import {
  formatDate,
  formatDateTime,
  formatMonthYear,
  formatTime,
  getIstanbulDayKey,
} from "@/lib/date-utils";
import { getEmployee, getEmployeeLogs, type EmployeeLog } from "@/lib/employees/queries";
import { getEmployeeViolations } from "@/lib/violations/queries";
import { hasEvaluableShift } from "@/lib/violations/types";
import {
  DRIVE_LINK_KINDS,
  DRIVE_LINK_LABELS,
  employeePath,
  type DriveLinkKind,
  type Employee,
} from "@/lib/employees/types";

export const metadata: Metadata = {
  title: "Çalışan Detayı",
};

const DRIVE_LINK_ICONS: Record<DriveLinkKind, LucideIcon> = {
  folder: FolderOpen,
  health_report: HeartPulse,
  leave_permit: FileCheck,
  other: FileText,
};

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toLocaleUpperCase("tr");
}

function hostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function CardHeader({ title, description }: { title: string; description?: string }) {
  return (
    <header className="px-5 pt-4 pb-3">
      <h2 className="text-base font-semibold tracking-tight text-ink">{title}</h2>
      {description && <p className="mt-0.5 text-sm text-ink-faint">{description}</p>}
    </header>
  );
}

function ProfileCard({ employee }: { employee: Employee }) {
  const ref = { code: employee.employee_code, name: employee.full_name };
  const details: [string, string][] = [
    ["Departman", employee.department ?? "—"],
    ["Görev", employee.job ?? "—"],
    ["Vardiya", [employee.shift_type, employee.shift].filter(Boolean).join(", ") || "—"],
    ["İşe giriş", formatDate(employee.hire_date)],
  ];

  return (
    <section className={`${card} overflow-hidden`}>
      <div className="flex flex-col gap-5 p-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <span
            aria-hidden
            className="flex size-14 shrink-0 items-center justify-center rounded-full bg-sunken text-lg font-semibold text-ink-soft"
          >
            {initials(employee.full_name)}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl font-semibold tracking-tight text-ink">
                {employee.full_name}
              </h1>
              <StatusBadge isActive={employee.is_active} />
            </div>
            <p className="mt-1 font-mono text-sm text-ink-soft">{employee.employee_code}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link href={`${employeePath(employee.employee_code)}/edit`} className={buttonSecondary}>
            <Pencil aria-hidden className="size-4" />
            Düzenle
          </Link>
          <StatusToggleButton employee={ref} isActive={employee.is_active} />
          <DeleteEmployeeButton employee={ref} redirectTo="/employees" />
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-px border-t border-line bg-line md:grid-cols-4">
        {details.map(([label, value]) => (
          <div
            key={label}
            className="bg-surface px-6 py-4"
          >
            <dt className="text-sm text-ink-faint">{label}</dt>
            <dd className="mt-1 truncate text-sm font-medium text-ink">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function DeviceCard({ employee }: { employee: Employee }) {
  return (
    <section className={`${card} flex flex-col`}>
      <CardHeader
        title="Cihaz"
        description="Çalışan yalnızca bağlı telefonundan giriş ve okutma yapabilir."
      />
      <dl className="flex-1 space-y-3 border-t border-line px-5 py-4 text-sm">
        <div className="flex items-center justify-between gap-4">
          <dt className="text-ink-faint">Durum</dt>
          <dd>
            <DeviceBadge isBound={employee.is_device_bound} boundAt={null} />
          </dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-ink-faint">Bağlanma</dt>
          <dd className="text-ink tabular-nums">{formatDateTime(employee.device_bound_at)}</dd>
        </div>
        <div className="space-y-1">
          <dt className="text-ink-faint">Cihaz bilgisi</dt>
          <dd
            title={employee.device_label ?? undefined}
            className="line-clamp-3 font-mono text-xs leading-relaxed break-all text-ink-soft"
          >
            {employee.device_label ?? "—"}
          </dd>
        </div>
      </dl>
      <div className="border-t border-line px-5 py-4">
        <ResetDeviceButton
          employee={{ code: employee.employee_code, name: employee.full_name }}
          disabled={!employee.is_device_bound}
        />
        {!employee.is_device_bound && (
          <p className="mt-2 text-sm text-ink-faint">
            Bağlı cihaz yok. İlk girişte kullanılan telefon kendiliğinden bağlanır.
          </p>
        )}
      </div>
    </section>
  );
}

function DocumentsCard({ employee }: { employee: Employee }) {
  const present = DRIVE_LINK_KINDS.filter((kind) => employee.drive_links[kind]);
  const missing = DRIVE_LINK_KINDS.filter((kind) => !employee.drive_links[kind]);
  const editHref = `${employeePath(employee.employee_code)}/edit`;

  return (
    <section className={`${card} lg:col-span-2`}>
      <CardHeader title="Drive dokümanları" description="Bağlantılar yeni sekmede açılır." />
      <div className="border-t border-line p-5">
        {present.length === 0 ? (
          <div className="flex flex-col items-center py-6 text-center">
            <span className="flex size-11 items-center justify-center rounded-xl border border-line bg-sunken text-ink-soft">
              <Link2Off aria-hidden className="size-5" strokeWidth={1.75} />
            </span>
            <p className="mt-4 text-base font-medium text-ink">
              Doküman bağlantısı eklenmedi
            </p>
            <p className="mt-1.5 max-w-[44ch] text-sm leading-relaxed text-ink-soft">
              Drive klasörü, sağlık raporu ve izin belgesi bağlantılarını çalışanı
              düzenleyerek ekleyebilirsiniz.
            </p>
            <Link href={editHref} className={`${buttonSecondary} mt-5`}>
              <Pencil aria-hidden className="size-4" />
              Bağlantı ekle
            </Link>
          </div>
        ) : (
          <>
            <ul className="grid gap-3 sm:grid-cols-2">
              {present.map((kind) => {
                const url = employee.drive_links[kind]!;
                const Icon = DRIVE_LINK_ICONS[kind];
                return (
                  <li key={kind}>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3 transition-all duration-200 ease-in-out hover:border-accent/40 hover:bg-accent/5 focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none"
                    >
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
                        <Icon aria-hidden className="size-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium text-ink">
                          {DRIVE_LINK_LABELS[kind]}
                        </span>
                        <span className="block truncate text-xs text-ink-faint">
                          {hostname(url)}
                        </span>
                      </span>
                      <ExternalLink
                        aria-hidden
                        className="size-4 shrink-0 text-ink-faint transition-colors group-hover:text-accent"
                      />
                      <span className="sr-only">(yeni sekmede açılır)</span>
                    </a>
                  </li>
                );
              })}
            </ul>
            {missing.length > 0 && (
              <p className="mt-4 text-sm text-ink-faint">
                Eklenmemiş: {missing.map((kind) => DRIVE_LINK_LABELS[kind]).join(", ")}.{" "}
                <Link href={editHref} className="text-accent hover:underline">
                  Bağlantı ekle
                </Link>
              </p>
            )}
          </>
        )}
      </div>
    </section>
  );
}

function LogsCard({ logs }: { logs: EmployeeLog[] }) {
  return (
    <section className={`${card} overflow-hidden`}>
      <CardHeader title="Son hareketler" description="En son 10 giriş ve çıkış okutması" />
      {logs.length === 0 ? (
        <div className="flex flex-col items-center border-t border-line px-6 py-12 text-center">
          <span className="flex size-11 items-center justify-center rounded-xl border border-line bg-sunken text-ink-soft">
            <History aria-hidden className="size-5" strokeWidth={1.75} />
          </span>
          <p className="mt-4 text-base font-medium text-ink">Henüz hareket kaydı bulunmuyor</p>
          <p className="mt-1.5 max-w-[44ch] text-sm leading-relaxed text-ink-soft">
            Çalışan kapıdaki karekodu okuttuğunda kayıtlar burada görünür.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto border-t border-line">
          <table className="w-full min-w-[480px] text-sm">
            <thead className="bg-sunken/50">
              <tr>
                {["Hareket", "Saat", "Tarih", "Kapı"].map((label) => (
                  <th
                    key={label}
                    scope="col"
                    className="px-5 py-2.5 text-left text-xs font-medium whitespace-nowrap text-ink-faint"
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {logs.map((log) => (
                <tr key={log.id} className="transition-colors duration-200 hover:bg-sunken/40">
                  <td className="px-5 py-3 whitespace-nowrap">
                    <LogTypeBadge type={log.type} />
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap">
                    <span className="flex items-center gap-2">
                      <span className="font-mono text-[13px] font-medium text-ink tabular-nums">
                        {formatTime(log.createdAt, { seconds: true })}
                      </span>
                      {log.violation && <ViolationBadge violation={log.violation} />}
                    </span>
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap text-ink-soft tabular-nums">
                    {formatDate(log.createdAt)}
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap">
                    <span className="text-ink">{log.gate || "—"}</span>
                    {log.factory && <span className="ml-2 text-ink-faint">{log.factory}</span>}
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

type Params = PageProps<"/employees/[code]">["params"];

async function EmployeeDetail({ params }: { params: Params }) {
  const code = decodeURIComponent((await params).code);
  const [employee, logs, violations] = await Promise.all([
    getEmployee(code),
    getEmployeeLogs(code, 10),
    getEmployeeViolations(code),
  ]);
  if (!employee) notFound();

  const todayKey = getIstanbulDayKey(new Date());

  return (
    <div className="space-y-6">
      <Link
        href="/employees"
        className="inline-flex items-center gap-1 text-sm text-ink-soft transition-colors hover:text-ink"
      >
        <ChevronLeft aria-hidden className="size-4" />
        Çalışanlar
      </Link>
      <ProfileCard employee={employee} />
      <div className="grid items-start gap-6 lg:grid-cols-3">
        <DeviceCard employee={employee} />
        <DocumentsCard employee={employee} />
      </div>
      <LogsCard logs={logs} />
      <ViolationsCard
        violations={violations}
        monthKey={todayKey.slice(0, 7)}
        monthLabel={formatMonthYear(`${todayKey}T12:00:00Z`)}
        hasShift={hasEvaluableShift(employee.shift)}
      />
    </div>
  );
}

export default function EmployeeDetailPage({ params }: PageProps<"/employees/[code]">) {
  return (
    <Suspense fallback={<DetailSkeleton />}>
      <EmployeeDetail params={params} />
    </Suspense>
  );
}
