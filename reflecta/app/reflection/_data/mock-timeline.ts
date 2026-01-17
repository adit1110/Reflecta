// src/app/reflection/_data/mock-timeline.ts
export type ShiftKind = "positive" | "negative" | "neutral";

export type TimelinePoint = {
  date: string; // "Jan 14"
  isoDate: string; // "2026-01-14"
  stability: number; // 0-100
  isShift?: boolean;
  label?: string; // "Identity Shift", "Positive Shift"
  kind?: ShiftKind;
  delta?: number;
};

export function getMonthKey(isoDate: string) {
  return isoDate.slice(0, 7);
}

export function formatMonthLabel(monthKey: string) {
  const date = new Date(`${monthKey}-01T00:00:00`);
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(date);
}

export function getAvailableMonths(points: TimelinePoint[]) {
  const monthKeys = Array.from(
    new Set(points.map((point) => getMonthKey(point.isoDate))),
  );
  return monthKeys.sort((a, b) => (a < b ? 1 : -1));
}

export function getDefaultMonthKey(points: TimelinePoint[], now = new Date()) {
  const currentKey = `${now.getFullYear()}-${String(
    now.getMonth() + 1,
  ).padStart(2, "0")}`;
  const available = getAvailableMonths(points);
  if (available.includes(currentKey)) return currentKey;
  return available[0];
}

export const MOCK_TIMELINE: TimelinePoint[] = [
  { date: "Jan 10", isoDate: "2026-01-10", stability: 72 },
  { date: "Jan 11", isoDate: "2026-01-11", stability: 70 },
  { date: "Jan 12", isoDate: "2026-01-12", stability: 68 },
  { date: "Jan 13", isoDate: "2026-01-13", stability: 66 },
  {
    date: "Jan 14",
    isoDate: "2026-01-14",
    stability: 52,
    isShift: true,
    label: "Identity Shift",
    kind: "negative",
    delta: -14,
  },
  { date: "Jan 15", isoDate: "2026-01-15", stability: 55 },
  { date: "Jan 16", isoDate: "2026-01-16", stability: 58 },
  { date: "Jan 17", isoDate: "2026-01-17", stability: 60 },
  { date: "Jan 18", isoDate: "2026-01-18", stability: 61 },
  {
    date: "Jan 19",
    isoDate: "2026-01-19",
    stability: 76,
    isShift: true,
    label: "Positive Shift",
    kind: "positive",
    delta: 15,
  },
  { date: "Jan 20", isoDate: "2026-01-20", stability: 74 },
  {
    date: "Jan 21",
    isoDate: "2026-01-21",
    stability: 69,
    isShift: true,
    label: "Grounding Dip",
    kind: "negative",
    delta: -5,
  },
  { date: "Jan 22", isoDate: "2026-01-22", stability: 71 },
  { date: "Jan 23", isoDate: "2026-01-23", stability: 73 },
  {
    date: "Jan 24",
    isoDate: "2026-01-24",
    stability: 80,
    isShift: true,
    label: "Energy Lift",
    kind: "positive",
    delta: 7,
  },
  { date: "Jan 25", isoDate: "2026-01-25", stability: 78 },
  {
    date: "Jan 26",
    isoDate: "2026-01-26",
    stability: 62,
    isShift: true,
    label: "Perspective Shift",
    kind: "negative",
    delta: -16,
  },
  { date: "Jan 27", isoDate: "2026-01-27", stability: 64 },
  { date: "Jan 28", isoDate: "2026-01-28", stability: 67 },
  {
    date: "Jan 29",
    isoDate: "2026-01-29",
    stability: 75,
    isShift: true,
    label: "Gentle Upturn",
    kind: "positive",
    delta: 8,
  },
  { date: "Jan 30", isoDate: "2026-01-30", stability: 73 },
  {
    date: "Jan 31",
    isoDate: "2026-01-31",
    stability: 58,
    isShift: true,
    label: "Quiet Drop",
    kind: "negative",
    delta: -15,
  },
  { date: "Feb 1", isoDate: "2026-02-01", stability: 61 },
  {
    date: "Feb 2",
    isoDate: "2026-02-02",
    stability: 70,
    isShift: true,
    label: "Steadying Moment",
    kind: "positive",
    delta: 9,
  },
  { date: "Feb 3", isoDate: "2026-02-03", stability: 72 },
  { date: "Feb 4", isoDate: "2026-02-04", stability: 74 },
  {
    date: "Feb 5",
    isoDate: "2026-02-05",
    stability: 63,
    isShift: true,
    label: "Weighty Day",
    kind: "negative",
    delta: -11,
  },
  { date: "Feb 6", isoDate: "2026-02-06", stability: 66 },
  {
    date: "Feb 7",
    isoDate: "2026-02-07",
    stability: 77,
    isShift: true,
    label: "Clearer Outlook",
    kind: "positive",
    delta: 11,
  },
  { date: "Feb 8", isoDate: "2026-02-08", stability: 76 },
  { date: "Feb 9", isoDate: "2026-02-09", stability: 73 },
  {
    date: "Feb 10",
    isoDate: "2026-02-10",
    stability: 60,
    isShift: true,
    label: "Heavier Dip",
    kind: "negative",
    delta: -13,
  },
  { date: "Feb 11", isoDate: "2026-02-11", stability: 62 },
  { date: "Feb 12", isoDate: "2026-02-12", stability: 65 },
  {
    date: "Feb 13",
    isoDate: "2026-02-13",
    stability: 74,
    isShift: true,
    label: "Lifted Morning",
    kind: "positive",
    delta: 9,
  },
  { date: "Feb 14", isoDate: "2026-02-14", stability: 72 },
  {
    date: "Feb 15",
    isoDate: "2026-02-15",
    stability: 64,
    isShift: true,
    label: "Quiet Pullback",
    kind: "negative",
    delta: -8,
  },
];
