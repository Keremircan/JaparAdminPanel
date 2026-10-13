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
