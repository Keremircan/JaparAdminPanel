export type DateInput = string | number | Date | null | undefined;

const TIME_ZONE = "Europe/Istanbul";
const LOCALE = "tr-TR";
const EMPTY = "—";

const dateFormatter = new Intl.DateTimeFormat(LOCALE, {
  timeZone: TIME_ZONE,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const longDateFormatter = new Intl.DateTimeFormat(LOCALE, {
  timeZone: TIME_ZONE,
  day: "numeric",
  month: "long",
  year: "numeric",
  weekday: "long",
});

const timeFormatter = new Intl.DateTimeFormat(LOCALE, {
  timeZone: TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

const timeWithSecondsFormatter = new Intl.DateTimeFormat(LOCALE, {
  timeZone: TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

const TIMESTAMP_PATTERN =
  /^(\d{4}-\d{2}-\d{2})(?:[T ](\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?))?\s*(Z|[+-]\d{2}(?::?\d{2})?)?$/i;

/**
 * Postgres/Supabase zaman damgalarını (`2026-10-13 08:30:00+00`,
 * `2026-10-13T08:30:00.123456+00:00` vb.) Date'e çevirir.
 * Saat dilimi belirtilmemiş değerler UTC kabul edilir.
 */
export function parseTimestamp(value: DateInput): Date | null {
  if (value === null || value === undefined || value === "") return null;

  let date: Date;

  if (typeof value === "string") {
    const match = value.trim().match(TIMESTAMP_PATTERN);

    if (!match) {
      date = new Date(value);
    } else {
      const [, day, time, zone] = match;

      if (!time) {
        date = new Date(`${day}T00:00:00Z`);
      } else {
        let offset = "Z";
        if (zone && zone.toUpperCase() !== "Z") {
          const digits = zone.replace(":", "");
          offset = `${digits.slice(0, 3)}:${digits.slice(3) || "00"}`;
        }
        // Postgres mikrosaniye döndürür; Date en fazla milisaniye tutar.
        const trimmedTime = time.replace(/(\.\d{3})\d+$/, "$1");
        date = new Date(`${day}T${trimmedTime}${offset}`);
      }
    }
  } else {
    date = new Date(value);
  }

  return Number.isNaN(date.getTime()) ? null : date;
}

/** `13.10.2026` */
export function formatDate(value: DateInput): string {
  const date = parseTimestamp(value);
  return date ? dateFormatter.format(date) : EMPTY;
}

/** `13 Ekim 2026 Salı` */
export function formatLongDate(value: DateInput): string {
  const date = parseTimestamp(value);
  return date ? longDateFormatter.format(date) : EMPTY;
}

/** `08:30`, `seconds: true` ile `08:30:15` */
export function formatTime(
  value: DateInput,
  options: { seconds?: boolean } = {},
): string {
  const date = parseTimestamp(value);
  if (!date) return EMPTY;
  return (options.seconds ? timeWithSecondsFormatter : timeFormatter).format(
    date,
  );
}

/** `13.10.2026 08:30` */
export function formatDateTime(
  value: DateInput,
  options: { seconds?: boolean } = {},
): string {
  const date = parseTimestamp(value);
  if (!date) return EMPTY;
  return `${formatDate(date)} ${formatTime(date, options)}`;
}

// Türkiye 2016'dan beri kalıcı olarak UTC+3'te; yaz saati uygulaması yok.
const ISTANBUL_UTC_OFFSET = "+03:00";

const dayKeyFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const weekdayShortFormatter = new Intl.DateTimeFormat(LOCALE, {
  timeZone: TIME_ZONE,
  weekday: "short",
});

const dayMonthFormatter = new Intl.DateTimeFormat(LOCALE, {
  timeZone: TIME_ZONE,
  day: "numeric",
  month: "long",
  weekday: "long",
});

/** Verilen anın Türkiye'deki takvim günü: `2026-10-13` */
export function getIstanbulDayKey(value: Date): string {
  return dayKeyFormatter.format(value);
}

/** Türkiye takvim gününün başladığı an (00:00:00 Europe/Istanbul). */
export function getIstanbulDayStart(dayKey: string): Date {
  return new Date(`${dayKey}T00:00:00${ISTANBUL_UTC_OFFSET}`);
}

/** Gün anahtarını ileri/geri kaydırır: `("2026-10-01", -1)` → `2026-09-30` */
export function shiftDayKey(dayKey: string, days: number): string {
  const date = new Date(`${dayKey}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/** `Sal` */
export function formatWeekdayShort(value: DateInput): string {
  const date = parseTimestamp(value);
  return date ? weekdayShortFormatter.format(date) : EMPTY;
}

/** `13 Ekim Salı` */
export function formatDayMonth(value: DateInput): string {
  const date = parseTimestamp(value);
  return date ? dayMonthFormatter.format(date) : EMPTY;
}

const DAY_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** `2026-10-14` biçiminde ve takvimde var olan bir gün mü? */
export function isValidDayKey(value: string): boolean {
  if (!DAY_KEY_PATTERN.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

/** İki gün anahtarı arasındaki gün farkı (`b - a`). */
export function diffDayKeys(a: string, b: string): number {
  return Math.round(
    (Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000,
  );
}

/** Haftanın pazartesi günü (Türkiye'de hafta pazartesi başlar). */
export function getWeekStartDayKey(dayKey: string): string {
  const weekday = new Date(`${dayKey}T00:00:00Z`).getUTCDay(); // 0 = pazar
  return shiftDayKey(dayKey, -((weekday + 6) % 7));
}

/** Ayın ilk günü: `2026-10-14` → `2026-10-01` */
export function getMonthStartDayKey(dayKey: string): string {
  return `${dayKey.slice(0, 8)}01`;
}

/** `8 sa 30 dk`, `45 dk`, `0 dk` */
export function formatDuration(ms: number): string {
  const totalMinutes = Math.max(0, Math.floor(ms / 60_000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes} dk`;
  return minutes === 0
    ? `${hours.toLocaleString("tr-TR")} sa`
    : `${hours.toLocaleString("tr-TR")} sa ${minutes} dk`;
}

const dateTimePartsFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

const DATETIME_INPUT_PATTERN = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})$/;

/** `<input type="datetime-local">` değeri, Türkiye saatiyle: `2026-10-14T08:05` */
export function toIstanbulDateTimeInput(value: DateInput): string {
  const date = parseTimestamp(value);
  if (!date) return "";
  const parts = Object.fromEntries(
    dateTimePartsFormatter.formatToParts(date).map((part) => [part.type, part.value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

/** Türkiye saatiyle girilmiş `2026-10-14T08:05` değerini UTC ana çevirir. */
export function fromIstanbulDateTimeInput(value: string): Date | null {
  const match = value.trim().match(DATETIME_INPUT_PATTERN);
  if (!match || !isValidDayKey(match[1])) return null;
  const date = new Date(`${match[1]}T${match[2]}:00${ISTANBUL_UTC_OFFSET}`);
  return Number.isNaN(date.getTime()) ? null : date;
}
