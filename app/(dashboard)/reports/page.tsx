import type { Metadata } from "next";
import { FileSpreadsheet } from "lucide-react";

import { PagePlaceholder } from "@/components/dashboard/page-placeholder";

export const metadata: Metadata = {
  title: "Raporlar & Puantaj",
};

export default function ReportsPage() {
  return (
    <PagePlaceholder
      title="Raporlar & Puantaj"
      description="Dönemsel devam raporları ve puantaj çıktıları."
      icon={FileSpreadsheet}
      upcoming="Seçilen tarih aralığı için çalışan bazlı puantaj tablosu ve dışa aktarma seçenekleri burada yer alacak."
    />
  );
}
