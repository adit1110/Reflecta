// lib/nlp/core-memory.ts
export type CoreMemoryLabel = "Emotional Dip" | "Recovery Spike";

export type CoreMemoryResult = {
  delta: number | null;
  is_core_memory: boolean;
  core_label: CoreMemoryLabel | null;
};

export type CoreMemoryOptions = {
  threshold?: number;
};

function clampMhf(value: number) {
  return Math.min(100, Math.max(0, Math.round(value)));
}

export function detectCoreMemory(
  mhfToday: number,
  mhfYesterday?: number | null,
  options: CoreMemoryOptions = {},
): CoreMemoryResult {
  if (mhfYesterday === undefined || mhfYesterday === null) {
    return {
      delta: null,
      is_core_memory: false,
      core_label: null,
    };
  }

  const threshold = options.threshold ?? 15;
  const today = clampMhf(mhfToday);
  const yesterday = clampMhf(mhfYesterday);
  const delta = today - yesterday;

  if (delta >= threshold) {
    return {
      delta,
      is_core_memory: true,
      core_label: "Recovery Spike",
    };
  }

  if (delta <= -threshold) {
    return {
      delta,
      is_core_memory: true,
      core_label: "Emotional Dip",
    };
  }

  return {
    delta,
    is_core_memory: false,
    core_label: null,
  };
}
