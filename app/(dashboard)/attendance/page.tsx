import type { Metadata } from "next";
import { Activity } from "lucide-react";

import { PagePlaceholder } from "@/components/dashboard/page-placeholder";

export const metadata: Metadata = {
  title: "Canlı Hareketler",
};

export default function AttendancePage() {
  return (
    <PagePlaceholder
      title="Canlı Hareketler"
      description="Giriş ve çıkış kayıtlarının anlık akışı."
      icon={Activity}
      upcoming="attendance_logs tablosuna düşen her kayıt, Türkiye saatiyle burada anlık olarak akacak."
    />
  );
}
