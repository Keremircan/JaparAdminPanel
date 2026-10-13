import type { Metadata } from "next";
import { LayoutDashboard } from "lucide-react";

import { PagePlaceholder } from "@/components/dashboard/page-placeholder";

export const metadata: Metadata = {
  title: "Genel Bakış",
};

export default function OverviewPage() {
  return (
    <PagePlaceholder
      title="Genel Bakış"
      description="Bugünkü devam durumunun ve son hareketlerin özeti."
      icon={LayoutDashboard}
      upcoming="Bugün gelen, geç kalan ve gelmeyen çalışan sayıları ile son giriş-çıkış kayıtları burada görünecek."
    />
  );
}
