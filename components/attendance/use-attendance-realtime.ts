"use client";

import { useEffect, useEffectEvent, useState } from "react";

import { toAttendanceLog, type AttendanceLog } from "@/lib/attendance/types";
import { createBrowserClient } from "@/lib/supabase/client";

export type RealtimeStatus = "connecting" | "live" | "offline";

export type RealtimeChange =
  | { kind: "upsert"; log: AttendanceLog }
  | { kind: "delete"; id: number };

/**
 * `attendance_logs` tablosundaki INSERT, UPDATE ve DELETE olaylarını dinler.
 * Tablo Realtime yayınına ekli değilse veya bağlantı koparsa durum "offline"
 * olur; çağıran taraf bu durumda periyodik yenilemeye geçer.
 */
export function useAttendanceRealtime(
  enabled: boolean,
  onChange: (change: RealtimeChange) => void,
): RealtimeStatus {
  const [status, setStatus] = useState<RealtimeStatus>("connecting");
  const handleChange = useEffectEvent(onChange);

  useEffect(() => {
    if (!enabled) return;

    let supabase: ReturnType<typeof createBrowserClient>;
    try {
      supabase = createBrowserClient();
    } catch {
      // Ortam değişkenleri eksik: canlı akış olmadan devam et.
      queueMicrotask(() => setStatus("offline"));
      return;
    }

    const channel = supabase
      .channel("attendance-logs-live")
      .on("system", {}, (payload: { extension?: string; status?: string }) => {
        if (payload.extension !== "postgres_changes") return;
        setStatus(payload.status === "ok" ? "live" : "offline");
      })
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "attendance_logs" },
        (payload) => {
          if (payload.eventType === "DELETE") {
            const id = Number((payload.old as { id?: unknown }).id);
            if (Number.isFinite(id)) handleChange({ kind: "delete", id });
            return;
          }
          const log = toAttendanceLog(payload.new as Record<string, unknown>);
          if (log) handleChange({ kind: "upsert", log });
        },
      )
      .subscribe((channelStatus) => {
        if (channelStatus === "SUBSCRIBED") return; // "live" sistem onayıyla gelir.
        setStatus(
          channelStatus === "CHANNEL_ERROR" ||
            channelStatus === "TIMED_OUT" ||
            channelStatus === "CLOSED"
            ? "offline"
            : "connecting",
        );
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [enabled]);

  return status;
}
