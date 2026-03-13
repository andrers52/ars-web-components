export function getDaysInMonth(month, year) {
  return new Date(year, month + 1, 0).getDate();
}

export function getFirstDayOfMonth(month, year) {
  return new Date(year, month).getDay();
}

export function createEmptySlots(size) {
  return new Array(size).fill(null);
}

export function getEventsByDate(events, day, month, year) {
  return events.filter(
    (event) =>
      event.day === day && event.month === month && event.year === year,
  );
}

export function getColorsForDate(events, day, month, year) {
  return getEventsByDate(events, day, month, year).map((event) => event.color);
}

export function parseStringArrayAttribute(value, expectedLength = null) {
  if (!value) return null;

  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return null;
    if (expectedLength !== null && parsed.length !== expectedLength) return null;
    return parsed.every((item) => typeof item === "string") ? parsed : null;
  } catch {
    return null;
  }
}

export function parseObjectAttribute(value) {
  if (!value) return {};

  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed
      : {};
  } catch {
    return {};
  }
}
