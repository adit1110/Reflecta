"use client";

import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";

type AISummaryProps = {
  journalEntry: string;
};

export default function AISummary({ journalEntry }: AISummaryProps) {
  const [summary, setSummary] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const generateSummary = async () => {
    if (!journalEntry.trim()) {
      setError("No journal entry to summarize");
      return;
    }

    setIsLoading(true);
    setError("");
    setSummary("");

    try {
      const response = await fetch("/api/summarize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ journalEntry }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate summary");
      }

      setSummary(data.summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="rounded-3xl bg-white/60 backdrop-blur-md p-6 shadow-2xl border border-[#CB997E]/20">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[#FF9F1C]" />
          <h2 className="text-lg font-light text-[#CB997E]">AI Summary</h2>
        </div>

        <button
          onClick={generateSummary}
          disabled={isLoading || !journalEntry.trim()}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#FF9F1C] text-white font-medium hover:bg-[#FFBF69] transition-all shadow-lg hover:shadow-xl hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Generate Summary
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {summary && (
        <div className="p-5 rounded-xl bg-gradient-to-br from-[#FFF5EC] to-[#FFE8D6] border border-[#CB997E]/20">
          <p className="text-base text-[#CB997E] leading-relaxed font-light">
            {summary}
          </p>
        </div>
      )}

      {!summary && !error && !isLoading && (
        <div className="p-5 rounded-xl bg-white/50 border border-[#CB997E]/20">
          <p className="text-sm text-[#CB997E]/70 font-light italic text-center">
            Click "Generate Summary" to get AI insights about this entry
          </p>
        </div>
      )}
    </section>
  );
}