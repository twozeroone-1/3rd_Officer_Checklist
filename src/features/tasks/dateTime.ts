function pad(value: number) {
  return String(value).padStart(2, '0');
}

function parseLocalDateTimeParts(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);

  if (!match) {
    throw new Error(`Invalid datetime-local value: ${value}`);
  }

  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
    hour: Number(match[4]),
    minute: Number(match[5]),
  };
}

function getOffsetForLocalDateTime(parts: ReturnType<typeof parseLocalDateTimeParts>) {
  return new Date(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, 0, 0).getTimezoneOffset();
}

function getOffsetForUtcIso(value: string) {
  return new Date(value).getTimezoneOffset();
}

export function parseDateTimeLocalToUtcIso(value: string, offsetMinutes = getOffsetForLocalDateTime(parseLocalDateTimeParts(value))) {
  const parts = parseLocalDateTimeParts(value);
  const utcMillis = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute) + offsetMinutes * 60_000;

  return new Date(utcMillis).toISOString();
}

export function formatUtcIsoForDateTimeLocal(value: string, offsetMinutes = getOffsetForUtcIso(value)) {
  const utcMillis = new Date(value).getTime();
  const localDate = new Date(utcMillis - offsetMinutes * 60_000);

  return [
    `${localDate.getUTCFullYear()}-${pad(localDate.getUTCMonth() + 1)}-${pad(localDate.getUTCDate())}`,
    `${pad(localDate.getUTCHours())}:${pad(localDate.getUTCMinutes())}`,
  ].join('T');
}
