import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import { EmployeeForm } from "@/components/employees/employee-form";
import { FormSkeleton } from "@/components/employees/skeletons";
import { getEmployee, listDepartments } from "@/lib/employees/queries";
import { employeePath } from "@/lib/employees/types";

export const metadata: Metadata = {
  title: "Çalışanı Düzenle",
};

type Params = PageProps<"/employees/[code]/edit">["params"];

async function EditEmployee({ params }: { params: Params }) {
  const { code } = await params;
  const [employee, departments] = await Promise.all([
    getEmployee(decodeURIComponent(code)),
    listDepartments(),
  ]);
  if (!employee) notFound();

  return (
    <>
      <Link
        href={employeePath(employee.employee_code)}
        className="inline-flex items-center gap-1 text-sm text-ink-soft transition-colors hover:text-ink"
      >
        <ChevronLeft aria-hidden className="size-4" />
        {employee.full_name}
      </Link>
      <h1 className="mt-3 mb-8 text-2xl font-semibold tracking-tight text-ink">
        Çalışanı düzenle
      </h1>

      <EmployeeForm
        mode="edit"
        departments={departments}
        defaultValues={{
          full_name: employee.full_name,
          employee_code: employee.employee_code,
          department: employee.department ?? "",
          job: employee.job ?? "",
          shift_type: employee.shift_type?.trim() ?? "",
          shift: employee.shift?.trim() ?? "",
          hire_date: employee.hire_date ?? "",
          is_active: employee.is_active,
          drive_links: {
            folder: employee.drive_links.folder ?? "",
            health_report: employee.drive_links.health_report ?? "",
            leave_permit: employee.drive_links.leave_permit ?? "",
            other: employee.drive_links.other ?? "",
          },
        }}
      />
    </>
  );
}

export default function EditEmployeePage({ params }: PageProps<"/employees/[code]/edit">) {
  return (
    <Suspense fallback={<FormSkeleton />}>
      <EditEmployee params={params} />
    </Suspense>
  );
}
