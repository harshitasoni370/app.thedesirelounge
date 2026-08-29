const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export function getCurrentDayOfWeek(date: Date = new Date()): number {
  return date.getDay();
}

export function getDayName(dayIndex: number): string {
  return DAY_NAMES[dayIndex] ?? "Unknown";
}

export function getCurrentTime(date: Date = new Date()): string {
  const h = String(date.getHours()).padStart(2, "0");
  const m = String(date.getMinutes()).padStart(2, "0");
  const s = String(date.getSeconds()).padStart(2, "0");
  return `${h}:${m}:${s}`;
}
