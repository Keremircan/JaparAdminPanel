import ExcelJS from "exceljs";
import type { NextRequest } from "next/server";

import { formatDate, formatTime, getIstanbulDayKey } from "@/lib/date-utils";
import { reportFileName } from "@/lib/reports/filters";
import { getTimesheetReport } from "@/lib/reports/queries";
import { DAY_STATUS_LABELS } from "@/lib/reports/timesheet";

const HOUR_MS = 60 * 60 * 1000;

function toHours(ms: number): number {
  return Math.round((ms / HOUR_MS) * 100) / 100;
}

/** Son çıkış ertesi güne taştıysa (gece vardiyası) saatin yanına not düşülür. */
function exitLabel(dayKey: string, lastExit: string | null): string {
  if (!lastExit) return "";
  const time = formatTime(lastExit);
  return getIstanbulDayKey(new Date(lastExit)) === dayKey
    ? time
    : `${time} (${formatDate(lastExit)})`;
}

export async function GET(request: NextRequest) {
  const report = await getTimesheetReport(Object.fromEntries(request.nextUrl.searchParams));

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Japar PDKS Yönetim Paneli";
  workbook.created = new Date(report.generatedAt);

  const sheet = workbook.addWorksheet("Puantaj", {
    views: [{ state: "frozen", ySplit: 1 }],
  });
  sheet.columns = [
    { header: "Tarih", key: "date", width: 12, style: { numFmt: "dd.mm.yyyy" } },
    { header: "Sicil No", key: "code", width: 12 },
    { header: "Ad Soyad", key: "name", width: 28 },
    { header: "Departman", key: "department", width: 18 },
    { header: "İlk Giriş", key: "firstEntry", width: 11 },
    { header: "Son Çıkış", key: "lastExit", width: 20 },
    { header: "Toplam Süre (Saat)", key: "hours", width: 19, style: { numFmt: "0.00" } },
    { header: "Geç Kalma Süresi (Dk)", key: "lateMinutes", width: 22 },
    { header: "Erken Çıkma Süresi (Dk)", key: "earlyLeaveMinutes", width: 24 },
    { header: "Durum", key: "status", width: 14 },
  ];

  for (const row of report.rows) {
    sheet.addRow({
      // Excel tarihleri saat diliminden bağımsızdır; günü UTC gece yarısı olarak yazarız.
      date: new Date(`${row.dayKey}T00:00:00Z`),
      code: row.employeeCode,
      name: row.fullName,
      department: row.department ?? "",
      firstEntry: row.firstEntry ? formatTime(row.firstEntry) : "",
      lastExit: exitLabel(row.dayKey, row.lastExit),
      hours: toHours(row.workedMs),
      // Vardiyası tanımsız personelde veya ihlal kaydı tutulmaya başlanmadan
      // önceki günlerde değerlendirme yapılmadı; 0 yerine boş bırakılır.
      lateMinutes: row.hasShift && !row.beforeTracking ? row.lateMinutes : null,
      earlyLeaveMinutes: row.hasShift && !row.beforeTracking ? row.earlyLeaveMinutes : null,
      status: DAY_STATUS_LABELS[row.status],
    });
  }

  const header = sheet.getRow(1);
  header.font = { bold: true, color: { argb: "FFFFFFFF" } };
  header.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F172A" } };
  header.alignment = { vertical: "middle" };
  header.height = 20;

  if (report.rows.length > 0) {
    sheet.autoFilter = { from: "A1", to: { row: report.rows.length + 1, column: 10 } };
    const total = sheet.addRow({
      name: "Toplam",
      hours: toHours(report.summary.workedMs),
      lateMinutes: report.summary.lateMinutes,
      earlyLeaveMinutes: report.summary.earlyLeaveMinutes,
    });
    total.font = { bold: true };
    total.getCell("hours").numFmt = "0.00";
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const fileName = reportFileName(report.filters);

  return new Response(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${fileName}"; filename*=UTF-8''${encodeURIComponent(fileName)}`,
      "Cache-Control": "no-store",
    },
  });
}
