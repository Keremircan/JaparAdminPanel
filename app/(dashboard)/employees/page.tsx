import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { UserPlus } from "lucide-react";

import { EmployeeFilters } from "@/components/employees/employee-filters";
import { EmployeesTable } from "@/components/employees/employees-table";
import { TableSkeleton } from "@/components/employees/skeletons";
import { buttonPrimary } from "@/components/ui/styles";
import {
  listDepartments,
  listEmployees,
  parseEmployeeFilters,
} from "@/lib/employees/queries";

export const metadata: Metadata = {
  title: "Çalışanlar",
};

async function EmployeesContent({
  searchParams,
}: {
  searchParams: PageProps<"/employees">["searchParams"];
}) {
  const filters = parseEmployeeFilters(await searchParams);
  const [employees, departments] = await Promise.all([
    listEmployees(filters),
    listDepartments(),
  ]);
  const isFiltered = Boolean(filters.query || filters.department || filters.status !== "all");

  return (
    <div className="space-y-4">
      <EmployeeFilters filters={filters} departments={departments} />
      <p className="text-sm text-ink-faint" aria-live="polite">
        {employees.length.toLocaleString("tr-TR")} çalışan
        {isFiltered ? " filtrelere uyuyor" : " kayıtlı"}
      </p>
      <EmployeesTable employees={employees} isFiltered={isFiltered} />
    </div>
  );
}

export default function EmployeesPage({ searchParams }: PageProps<"/employees">) {
  return (
    <>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Çalışanlar</h1>
          <p className="mt-1.5 max-w-[65ch] text-[15px] leading-relaxed text-ink-soft">
            Çalışan kayıtları, cihaz eşleştirmeleri ve doküman bağlantıları.
          </p>
        </div>
        <Link href="/employees/new" className={`${buttonPrimary} self-start sm:self-auto`}>
          <UserPlus aria-hidden className="size-4" />
          Yeni çalışan ekle
        </Link>
      </div>

      <Suspense fallback={<TableSkeleton />}>
        <EmployeesContent searchParams={searchParams} />
      </Suspense>
    </>
  );
}
