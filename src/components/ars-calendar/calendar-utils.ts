export function getDaysInMonth(month: number, year: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function getFirstDayOfMonth(month: number, year: number): number {
  return new Date(year, month).getDay();
}

export function createEmptySlots(size: number): null[] {
  return new Array(size).fill(null);
}

export interface CalendarEvent {
  day: number;
  month: number;
  year: number;
  color: string;
  [key: string]: unknown;
}

export function getEventsByDate(
  events: CalendarEvent[],
  day: number,
  month: number,
  year: number,
): CalendarEvent[] {
  return events.filter(
    (event) =>
      event.day === day && event.month === month && event.year === year,
  );
}

export function getColorsForDate(
  events: CalendarEvent[],
  day: number,
  month: number,
  year: number,
): string[] {
  return getEventsByDate(events, day, month, year).map((event) => event.color);
}

export function parseStringArrayAttribute(
  value: string | null,
  expectedLength: number | null = null,
): string[] | null {
  if (!value) return null;

  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return null;
    if (expectedLength !== null && parsed.length !== expectedLength) return null;
    return parsed.every((item: unknown) => typeof item === "string") ? parsed : null;
  } catch {
    return null;
  }
}

export function parseObjectAttribute(value: string | null): Record<string, unknown> {
  if (!value) return {};

  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}
