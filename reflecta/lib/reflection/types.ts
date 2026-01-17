// lib/reflection/types.ts
export type ShiftKind = "positive" | "negative";

export type AnalysisEntry = {
  journalId: string;
  entryDate: string;
  mhf: number;
  delta: number | null;
  isCoreMemory: boolean;
  coreLabel: string | null;
};

export type TimelinePoint = {
  journalId: string;
  isoDate: string;
  date: string;
  stability: number;
  isShift: boolean;
  label?: string;
  kind?: ShiftKind;
  delta?: number | null;
};
