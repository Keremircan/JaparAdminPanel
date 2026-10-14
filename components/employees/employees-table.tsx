import Link from "next/link";
import { Eye, Pencil, SearchX, UserPlus } from "lucide-react";

import { buttonPrimary, card, iconButton } from "@/components/ui/styles";
import { formatDate } from "@/lib/date-utils";
import { employeePath, type Employee } from "@/lib/employees/types";

import { DeviceBadge, StatusBadge } from "./badges";
import { DeleteEmployeeButton, StatusToggleButton } from "./employee-actions";

const headerCell =
  "px-4 py-2.5 text-left text-xs font-medium whitespace-nowrap text-ink-faint first:pl-5 last:pr-5";
const bodyCell = "px-4 py-3 align-middle whitespace-nowrap first:pl-5 last:pr-5";

export function EmployeesTable({
  employees,
  isFiltered,
}: {
  employees: Employee[];
  isFiltered: boolean;
}) {
  if (employees.length === 0) {
    return (
      <section className={`${card} flex flex-col items-center px-6 py-16 text-center`}>
        <span className="flex size-11 items-center justify-center rounded-xl border border-line bg-sunken text-ink-soft">
          {isFiltered ? (
            <SearchX aria-hidden className="size-5" strokeWidth={1.75} />
          ) : (
            <UserPlus aria-hidden className="size-5" strokeWidth={1.75} />
          )}
        </span>
        <p className="mt-4 text-base font-medium text-ink">
          {isFiltered ? "Filtrelere uyan çalışan yok" : "Henüz çalışan eklenmedi"}
        </p>
        <p className="mt-1.5 max-w-[44ch] text-sm leading-relaxed text-ink-soft">
          {isFiltered
            ? "Aramayı veya departman ve durum filtrelerini değiştirip tekrar deneyin."
            : "İlk çalışanı ekleyin; sicil numarası ve parolasıyla mobil uygulamaya giriş yapabilir."}
        </p>
        {!isFiltered && (
          <Link href="/employees/new" className={`${buttonPrimary} mt-6`}>
            <UserPlus aria-hidden className="size-4" />
            Yeni çalışan ekle
          </Link>
        )}
      </section>
    );
  }

  return (
    <section className={`${card} overflow-hidden`}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] text-sm">
          <thead className="bg-sunken/50">
            <tr>
              <th scope="col" className={headerCell}>Ad soyad</th>
              <th scope="col" className={headerCell}>Sicil no</th>
              <th scope="col" className={headerCell}>Departman</th>
              <th scope="col" className={headerCell}>Durum</th>
              <th scope="col" className={headerCell}>Cihaz</th>
              <th scope="col" className={headerCell}>İşe giriş</th>
              <th scope="col" className={`${headerCell} text-right`}>
                <span className="sr-only">İşlemler</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {employees.map((employee) => {
              const ref = { code: employee.employee_code, name: employee.full_name };
              const path = employeePath(employee.employee_code);

              return (
                <tr
                  key={employee.id}
                  className="transition-colors duration-200 hover:bg-sunken/40"
                >
                  <td className={bodyCell}>
                    <Link
                      href={path}
                      className="font-medium text-ink decoration-ink-faint/50 underline-offset-4 hover:underline focus-visible:underline focus-visible:outline-none"
                    >
                      {employee.full_name}
                    </Link>
                  </td>
                  <td className={`${bodyCell} font-mono text-[13px] text-ink-soft`}>
                    {employee.employee_code}
                  </td>
                  <td className={`${bodyCell} text-ink-soft`}>
                    {employee.department ?? <span className="text-ink-faint">—</span>}
                  </td>
                  <td className={bodyCell}>
                    <StatusBadge isActive={employee.is_active} />
                  </td>
                  <td className={bodyCell}>
                    <DeviceBadge
                      isBound={employee.is_device_bound}
                      boundAt={employee.device_bound_at}
                    />
                  </td>
                  <td className={`${bodyCell} text-ink-soft tabular-nums`}>
                    {formatDate(employee.hire_date)}
                  </td>
                  <td className={bodyCell}>
                    <div className="flex items-center justify-end gap-0.5">
                      <Link
                        href={path}
                        aria-label={`${employee.full_name}: Detay`}
                        title="Detay"
                        className={iconButton}
                      >
                        <Eye aria-hidden className="size-4" />
                      </Link>
                      <Link
                        href={`${path}/edit`}
                        aria-label={`${employee.full_name}: Düzenle`}
                        title="Düzenle"
                        className={iconButton}
                      >
                        <Pencil aria-hidden className="size-4" />
                      </Link>
                      <StatusToggleButton employee={ref} isActive={employee.is_active} compact />
                      <DeleteEmployeeButton employee={ref} compact />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
