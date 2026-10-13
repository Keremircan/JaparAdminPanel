import type { Metadata } from "next";
import { Users } from "lucide-react";

import { PagePlaceholder } from "@/components/dashboard/page-placeholder";

export const metadata: Metadata = {
  title: "Çalışanlar",
};

export default function EmployeesPage() {
  return (
    <PagePlaceholder
      title="Çalışanlar"
      description="Çalışan kayıtları ve cihaz eşleştirmeleri."
      icon={Users}
      upcoming="employees tablosundaki kayıtlar ve device_binding_events geçmişi burada listelenecek."
    />
  );
}
