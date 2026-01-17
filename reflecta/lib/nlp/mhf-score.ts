// lib/nlp/mhf-score.ts
import type { FactorScores } from "./factor-extractor";

export type MhfWeights = {
  stress: number;
  instability: number;
  intensity: number;
  fatigue: number;
  neg_sentiment: number;
};

export type MhfResult = {
  mhf: number;
  raw: number;
  contributions: Record<keyof FactorScores, number>;
  weights: MhfWeights;
  version: "v1";
};

const WEIGHTS: MhfWeights = {
  stress: 22,
  instability: 18,
  intensity: 12,
  fatigue: 18,
  neg_sentiment: 20,
};

function clamp(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

export function computeMhfFromFactors(
  factors: FactorScores,
  customWeights?: Partial<MhfWeights>,
): MhfResult {
  const weights = { ...WEIGHTS, ...customWeights };

  const stress = clamp01(factors.stress);
  const instability = clamp01(factors.instability);
  const intensity = clamp01(factors.intensity);
  const fatigue = clamp01(factors.fatigue);
  const neg_sentiment = clamp01(factors.neg_sentiment);

  const contributions = {
    stress: stress * weights.stress,
    instability: instability * weights.instability,
    intensity: intensity * weights.intensity,
    fatigue: fatigue * weights.fatigue,
    neg_sentiment: neg_sentiment * weights.neg_sentiment,
  };

  const raw =
    100 -
    (contributions.stress +
      contributions.instability +
      contributions.intensity +
      contributions.fatigue +
      contributions.neg_sentiment);

  const mhf = Math.round(clamp(raw, 0, 100));

  return {
    mhf,
    raw: clamp(raw, 0, 100),
    contributions,
    weights,
    version: "v1",
  };
}

export function smoothMhf(
  today: number,
  yesterday?: number,
  alpha = 0.7,
) {
  if (yesterday === undefined) return Math.round(today);
  const blended = alpha * today + (1 - alpha) * yesterday;
  return Math.round(clamp(blended, 0, 100));
}
