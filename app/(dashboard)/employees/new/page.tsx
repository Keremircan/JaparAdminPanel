import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import { EMPTY_FORM_VALUES, EmployeeForm } from "@/components/employees/employee-form";
import { FormSkeleton } from "@/components/employees/skeletons";
import { listDepartments } from "@/lib/employees/queries";

export const metadata: Metadata = {
  title: "Yeni Çalışan",
};

async function NewEmployeeForm() {
  const departments = await listDepartments();
  return (
    <EmployeeForm mode="create" defaultValues={EMPTY_FORM_VALUES} departments={departments} />
  );
}

export default function NewEmployeePage() {
  return (
    <>
      <Link
        href="/employees"
        className="inline-flex items-center gap-1 text-sm text-ink-soft transition-colors hover:text-ink"
      >
        <ChevronLeft aria-hidden className="size-4" />
        Çalışanlar
      </Link>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight text-ink">
        Yeni çalışan ekle
      </h1>
      <p className="mt-1.5 mb-8 max-w-[65ch] text-[15px] leading-relaxed text-ink-soft">
        Kayıttan sonra çalışan, sicil numarası ve bu parolayla mobil uygulamaya giriş
        yapabilir.
      </p>

      <Suspense fallback={<FormSkeleton />}>
        <NewEmployeeForm />
      </Suspense>
    </>
  );
}
