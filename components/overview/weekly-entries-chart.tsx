"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from "recharts";
import { ChartNoAxesColumn } from "lucide-react";

import type { DailyEntryCount } from "@/lib/data/overview";

const CHART_HEIGHT = 240;
const axisTick = { fill: "var(--ink-faint)", fontSize: 12 };

function ChartTooltip({ active, payload }: TooltipContentProps) {
  const day = payload?.[0]?.payload as DailyEntryCount | undefined;
  if (!active || !day) return null;

  return (
    <div className="rounded-lg border border-white/10 bg-slate-900 px-3 py-2 shadow-float">
      <p className="text-xs text-slate-400">
        {day.fullLabel}
        {day.isToday ? " (bugün)" : ""}
      </p>
      <p className="mt-1 flex items-center gap-2 text-sm font-medium text-white">
        <span aria-hidden className="size-2 rounded-xs bg-(--chart-bar)" />
        {day.entries.toLocaleString("tr-TR")} giriş
      </p>
    </div>
  );
}

export function WeeklyEntriesChart({ data }: { data: DailyEntryCount[] }) {
  const total = data.reduce((sum, day) => sum + day.entries, 0);

  return (
    <section className="rounded-2xl border border-line bg-surface/80 shadow-card backdrop-blur-md">
      <header className="px-5 py-4">
        <h2 className="text-base font-semibold tracking-tight text-ink">
          Haftalık katılım
        </h2>
        <p className="mt-0.5 text-sm text-ink-faint">
          Son 7 günde {total.toLocaleString("tr-TR")} giriş okutması
        </p>
      </header>

      {total === 0 ? (
        <div className="flex flex-col items-center border-t border-line px-6 py-14 text-center">
          <span className="flex size-11 items-center justify-center rounded-xl border border-line bg-sunken text-ink-soft">
            <ChartNoAxesColumn aria-hidden className="size-5" strokeWidth={1.75} />
          </span>
          <p className="mt-4 text-base font-medium text-ink">
            Henüz hareket kaydı bulunmuyor
          </p>
          <p className="mt-1.5 max-w-[40ch] text-sm leading-relaxed text-ink-soft">
            Son 7 günde giriş okutması yapılmadı. İlk girişle birlikte grafik
            oluşur.
          </p>
        </div>
      ) : (
        <div className="border-t border-line px-3 pt-5 pb-3">
          <div aria-hidden style={{ height: CHART_HEIGHT }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{ top: 4, right: 8, bottom: 0, left: 0 }}
              >
                <CartesianGrid vertical={false} stroke="var(--line)" />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tick={axisTick}
                />
                <YAxis
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                  width={36}
                  tick={axisTick}
                  tickFormatter={(value: number) => value.toLocaleString("tr-TR")}
                />
                <Tooltip
                  content={ChartTooltip}
                  cursor={{ fill: "var(--sunken)" }}
                  isAnimationActive={false}
                />
                <Bar
                  dataKey="entries"
                  fill="var(--chart-bar)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={24}
                  isAnimationActive={false}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <table className="sr-only">
            <caption>Son 7 günün günlük giriş sayıları</caption>
            <thead>
              <tr>
                <th scope="col">Gün</th>
                <th scope="col">Giriş sayısı</th>
              </tr>
            </thead>
            <tbody>
              {data.map((day) => (
                <tr key={day.dayKey}>
                  <th scope="row">{day.fullLabel}</th>
                  <td>{day.entries}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
