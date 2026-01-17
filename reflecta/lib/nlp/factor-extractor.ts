// lib/nlp/factor-extractor.ts
export type FactorScores = {
  stress: number;
  instability: number;
  intensity: number;
  fatigue: number;
  neg_sentiment: number;
};

export type FactorDebug = {
  wordCount: number;
  matches: Record<keyof FactorScores, number>;
  matchedWords: Record<keyof FactorScores, string[]>;
  matchedPhrases: Record<keyof FactorScores, string[]>;
  boosts: Record<keyof FactorScores, number>;
};

type Lexicon = {
  words: string[];
  phrases: string[];
};

const LEXICONS: Record<keyof FactorScores, Lexicon> = {
  stress: {
    words: [
      "anxious",
      "anxiety",
      "stressed",
      "stress",
      "overwhelmed",
      "pressure",
      "tense",
      "panic",
      "panicking",
      "deadline",
      "worry",
      "worried",
      "nervous",
    ],
    phrases: ["tight chest", "can't breathe", "on edge"],
  },
  instability: {
    words: [
      "spiral",
      "spiraling",
      "unstable",
      "confused",
      "conflict",
      "conflicted",
      "inconsistent",
      "unpredictable",
      "restless",
      "flipping",
    ],
    phrases: [
      "up and down",
      "all over the place",
      "can't decide",
      "mood swings",
    ],
  },
  intensity: {
    words: [
      "devastated",
      "terrified",
      "furious",
      "hate",
      "ashamed",
      "hopeless",
      "amazing",
      "incredible",
      "extreme",
      "overwhelming",
      "unbearable",
    ],
    phrases: ["so much", "really", "very"],
  },
  fatigue: {
    words: [
      "tired",
      "exhausted",
      "drained",
      "burnout",
      "fatigued",
      "sleepy",
      "insomnia",
      "sluggish",
    ],
    phrases: [
      "burned out",
      "low energy",
      "can't focus",
      "unfocused",
      "can't sleep",
      "restless night",
      "no motivation",
    ],
  },
  neg_sentiment: {
    words: [
      "sad",
      "down",
      "depressed",
      "hopeless",
      "worthless",
      "guilty",
      "shame",
      "angry",
      "frustrated",
      "lonely",
      "empty",
      "numb",
      "scared",
      "afraid",
    ],
    phrases: [],
  },
};

const TUNING = {
  stress: 6,
  instability: 6,
  intensity: 5,
  fatigue: 6,
  neg_sentiment: 5,
} as const;

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function normalizeText(text: string) {
  return text.toLowerCase().replace(/[’]/g, "'");
}

function tokenizeWords(text: string) {
  return text.match(/[a-z']+/g) ?? [];
}

function countPhrase(text: string, phrase: string) {
  const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`\\b${escaped}\\b`, "g");
  return (text.match(regex) ?? []).length;
}

function countPattern(text: string, pattern: RegExp) {
  return (text.match(pattern) ?? []).length;
}

function getMatches(
  tokens: string[],
  text: string,
  lexicon: Lexicon,
  phrasePatterns: RegExp[],
) {
  const wordMatches: string[] = [];
  const phraseMatches: string[] = [];
  const wordSet = new Set(lexicon.words);

  tokens.forEach((token) => {
    if (wordSet.has(token)) {
      wordMatches.push(token);
    }
  });

  lexicon.phrases.forEach((phrase) => {
    const count = countPhrase(text, phrase);
    if (count > 0) {
      for (let i = 0; i < count; i += 1) {
        phraseMatches.push(phrase);
      }
    }
  });

  phrasePatterns.forEach((pattern) => {
    const count = countPattern(text, pattern);
    if (count > 0) {
      for (let i = 0; i < count; i += 1) {
        phraseMatches.push(pattern.source);
      }
    }
  });

  return {
    matchCount: wordMatches.length + phraseMatches.length,
    wordMatches,
    phraseMatches,
  };
}

export function extractFactorScores(
  rawText: string,
  withDebug = false,
): FactorScores & { debug?: FactorDebug } {
  const normalized = normalizeText(rawText);
  const tokens = tokenizeWords(normalized);
  const wordCount = tokens.length;
  const denom = Math.max(wordCount, 40);

  const stressPatterns = [/\bpanic(?:king)?\b/g, /\bcan(?:'|’)?t breathe\b/g];
  const fatiguePatterns = [/\bcan(?:'|’)?t sleep\b/g];
  const instabilityPatterns = [
    /\bup and down\b/g,
    /\ball over the place\b/g,
    /\bcan(?:'|’)?t decide\b/g,
  ];

  const factors = {
    stress: getMatches(tokens, normalized, LEXICONS.stress, stressPatterns),
    instability: getMatches(
      tokens,
      normalized,
      LEXICONS.instability,
      instabilityPatterns,
    ),
    intensity: getMatches(tokens, normalized, LEXICONS.intensity, []),
    fatigue: getMatches(tokens, normalized, LEXICONS.fatigue, fatiguePatterns),
    neg_sentiment: getMatches(tokens, normalized, LEXICONS.neg_sentiment, []),
  };

  const exclamations = countPattern(rawText, /!/g);
  const allCaps = countPattern(rawText, /\b[A-Z]{3,}\b/g);

  const boosts = {
    stress: factors.stress.matchCount > 0 ? 0.05 : 0,
    instability: 0,
    intensity: clamp(exclamations * 0.02 + allCaps * 0.04, 0, 0.15),
    fatigue: factors.fatigue.matchCount > 0 ? 0.05 : 0,
    neg_sentiment: 0,
  };

  const stress = clamp(
    (factors.stress.matchCount / denom) * TUNING.stress + boosts.stress,
  );
  const instability = clamp(
    (factors.instability.matchCount / denom) * TUNING.instability +
      boosts.instability,
  );
  const intensity = clamp(
    (factors.intensity.matchCount / denom) * TUNING.intensity +
      boosts.intensity,
  );
  const fatigue = clamp(
    (factors.fatigue.matchCount / denom) * TUNING.fatigue + boosts.fatigue,
  );
  const neg_sentiment = clamp(
    (factors.neg_sentiment.matchCount / denom) * TUNING.neg_sentiment +
      boosts.neg_sentiment,
  );

  const scores: FactorScores = {
    stress,
    instability,
    intensity,
    fatigue,
    neg_sentiment,
  };

  if (!withDebug) {
    return scores;
  }

  return {
    ...scores,
    debug: {
      wordCount,
      matches: {
        stress: factors.stress.matchCount,
        instability: factors.instability.matchCount,
        intensity: factors.intensity.matchCount,
        fatigue: factors.fatigue.matchCount,
        neg_sentiment: factors.neg_sentiment.matchCount,
      },
      matchedWords: {
        stress: factors.stress.wordMatches,
        instability: factors.instability.wordMatches,
        intensity: factors.intensity.wordMatches,
        fatigue: factors.fatigue.wordMatches,
        neg_sentiment: factors.neg_sentiment.wordMatches,
      },
      matchedPhrases: {
        stress: factors.stress.phraseMatches,
        instability: factors.instability.phraseMatches,
        intensity: factors.intensity.phraseMatches,
        fatigue: factors.fatigue.phraseMatches,
        neg_sentiment: factors.neg_sentiment.phraseMatches,
      },
      boosts,
    },
  };
}
