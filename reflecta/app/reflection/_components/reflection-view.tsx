"use client";

import { useEffect, useMemo, useState } from "react";
import IdentityShiftTimeline from "./identity-shift-timeline";
import MomentsThatMattered from "./moments-that-mattered";
import { supabase } from "../../../lib/supabase-browser";
import {
  formatDayLabel,
  formatMonthLabel,
  getMonthKey,
} from "../../../lib/reflection/date-utils";
import type { AnalysisEntry, TimelinePoint } from "../../../lib/reflection/types";

function filterPointsByMonth(points: TimelinePoint[], monthKey: string) {
  return points.filter((point) => getMonthKey(point.isoDate) === monthKey);
}

function getAvailableMonths(entries: AnalysisEntry[]) {
  const monthKeys = Array.from(
    new Set(entries.map((entry) => getMonthKey(entry.entryDate))),
  );
  return monthKeys.sort((a, b) => (a < b ? 1 : -1));
}

function getDefaultMonthKey(entries: AnalysisEntry[], now = new Date()) {
  const currentKey = `${now.getFullYear()}-${String(
    now.getMonth() + 1,
  ).padStart(2, "0")}`;
  const available = getAvailableMonths(entries);
  if (available.includes(currentKey)) return currentKey;
  return available[0];
}

function mapAnalysisToTimeline(entries: AnalysisEntry[]): TimelinePoint[] {
  return entries.map((entry) => {
    const kind =
      entry.delta !== null && entry.delta !== undefined
        ? entry.delta >= 0
          ? "positive"
          : "negative"
        : undefined;

    return {
      journalId: entry.journalId,
      isoDate: entry.entryDate,
      date: formatDayLabel(entry.entryDate),
      stability: entry.mhf,
      isShift: entry.isCoreMemory,
      label:
        entry.coreLabel ??
        (kind === "positive"
          ? "Positive Shift"
          : kind === "negative"
            ? "Heavier Day"
            : undefined),
      kind,
      delta: entry.delta,
      stress: entry.stress,
      instability: entry.instability,
      intensity: entry.intensity,
      fatigue: entry.fatigue,
      negSentiment: entry.negSentiment,
    };
  });
}

export default function ReflectionView() {
  const [analysisEntries, setAnalysisEntries] = useState<AnalysisEntry[]>([]);
  const [selectedMonthKey, setSelectedMonthKey] = useState<string | null>(null);
  const [selectedShiftIsoDate, setSelectedShiftIsoDate] = useState<
    string | null
  >(null);

  useEffect(() => {
    let isMounted = true;
    const loadEntries = async () => {
      if (!supabase) return;
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user || !isMounted) return;

      const { data, error } = await supabase
        .from("journal_analysis")
        .select(
          "journal_id, entry_date, mhf, delta, is_core_memory, core_label, stress, instability, intensity, fatigue, neg_sentiment",
        )
        .eq("user_id", user.id)
        .order("entry_date", { ascending: true });

      if (error || !data || !isMounted) return;

      const mapped: AnalysisEntry[] = data.map((row) => ({
        journalId: row.journal_id,
        entryDate: row.entry_date,
        mhf: row.mhf,
        delta: row.delta,
        isCoreMemory: row.is_core_memory,
        coreLabel: row.core_label,
        stress: row.stress,
        instability: row.instability,
        intensity: row.intensity,
        fatigue: row.fatigue,
        negSentiment: row.neg_sentiment,
      }));

      setAnalysisEntries(mapped);
    };

    loadEntries();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!analysisEntries.length) return;
    const defaultKey = getDefaultMonthKey(analysisEntries);
    setSelectedMonthKey((current) => current ?? defaultKey);
  }, [analysisEntries]);

  const availableMonths = useMemo(
    () => getAvailableMonths(analysisEntries),
    [analysisEntries],
  );

  const monthPoints = useMemo(() => {
    if (!selectedMonthKey) return [];
    const points = mapAnalysisToTimeline(analysisEntries);
    return filterPointsByMonth(points, selectedMonthKey);
  }, [analysisEntries, selectedMonthKey]);

  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [videoNarrative, setVideoNarrative] = useState<string | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);

  const selectedPoint = useMemo(() => {
    if (!selectedShiftIsoDate) return null;
    return monthPoints.find((point) => point.isoDate === selectedShiftIsoDate);
  }, [monthPoints, selectedShiftIsoDate]);

  const narrativeText = selectedPoint?.label ?? "A quiet shift in perspective that shaped the day.";

  const generateReflectionVideo = async () => {
  if (!narrativeText) return;

  setIsGeneratingVideo(true);
  setVideoUrl(null);
  setVideoError(null);

  try {
    const res = await fetch("/api/video/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ narrativeText }),
    });

    const data = await res.json();

    if (data.videoUrl) {
      setVideoUrl(data.videoUrl);
      setVideoNarrative(narrativeText);
    } else if (data.error) {
      setVideoError(data.error);
    } else {
      setVideoError("Video could not be generated.");
    }
  } catch (err) {
    setVideoError("Network error while generating video.");
  } finally {
    setIsGeneratingVideo(false);
  }
};

  useEffect(() => {
    if (!selectedShiftIsoDate) return;
    const stillVisible = monthPoints.some(
      (point) => point.isoDate === selectedShiftIsoDate,
    );
    if (!stillVisible) setSelectedShiftIsoDate(null);
  }, [monthPoints, selectedShiftIsoDate]);

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-white/60 backdrop-blur-md p-6 shadow-2xl border border-[#CB997E]/20">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-light text-[#CB997E]">
              Month view
            </h2>
            <p className="mt-1 text-sm text-[#CB997E]/70 font-light">
              Choose a month to see the shifts that stood out.
            </p>
          </div>
          <label className="text-sm text-[#CB997E]">
            <span className="sr-only">Select month</span>
            <select
              value={selectedMonthKey ?? ""}
              onChange={(event) => setSelectedMonthKey(event.target.value)}
              className="w-full min-w-[220px] rounded-xl border border-[#CB997E]/30 bg-white/80 px-4 py-2.5 text-sm text-[#CB997E] font-light outline-none transition focus:border-[#FF9F1C] focus:ring-2 focus:ring-[#FF9F1C]/30"
            >
              {availableMonths.map((monthKey) => (
                <option key={monthKey} value={monthKey}>
                  {formatMonthLabel(monthKey)}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      {selectedPoint && (
          <section className="rounded-3xl bg-white/60 backdrop-blur-md p-6 shadow-2xl border border-[#CB997E]/20">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="text-base font-medium text-[#CB997E]">
                  {selectedPoint.date}
                </p>
                <p className="text-sm text-[#CB997E]/70 font-light mt-1">
                  {selectedPoint.label}
                </p>
              </div>

              <button
                onClick={generateReflectionVideo}
                disabled={isGeneratingVideo}
                className="px-6 py-3 rounded-full bg-[#FF9F1C] text-white font-medium hover:bg-[#FFBF69] transition-all shadow-lg hover:shadow-xl hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {isGeneratingVideo ? "Generating…" : "Generate Reflection Video"}
              </button>
            </div>
          </section>
        )}


      <section className="min-w-0 rounded-3xl bg-white/60 backdrop-blur-md p-6 shadow-2xl border border-[#CB997E]/20">
        <h2 className="text-xl font-light text-[#CB997E]">
          Identity Shift Timeline
        </h2>
        <p className="mt-2 text-sm text-[#CB997E]/70 font-light">
          Hover for details. Click a highlighted day to focus it.
        </p>

        <div className="mt-6 min-w-0">
          <IdentityShiftTimeline
            points={monthPoints}
            selectedIsoDate={selectedShiftIsoDate}
            onSelectShift={setSelectedShiftIsoDate}
          />
        </div>
      </section>

      <MomentsThatMattered
        points={monthPoints}
        selectedIsoDate={selectedShiftIsoDate}
        onSelectShift={setSelectedShiftIsoDate}
      />

      {videoError && (
  <div className="fixed inset-0 z-50 flex items-center justify-center">
    {/* Background overlay */}
    <div
      className="absolute inset-0 bg-black/30 backdrop-blur-sm"
      onClick={() => setVideoError(null)}
    />

    {/* Error modal */}
    <div className="relative z-10 w-full max-w-md mx-4 rounded-3xl bg-white/90 backdrop-blur-md shadow-2xl border border-[#CB997E]/20 p-8 animate-in fade-in zoom-in duration-200">
      <p className="text-xl font-light text-[#CB997E] text-center">
        Reflection video not available
      </p>

      <p className="mt-4 text-base text-[#CB997E]/70 font-light text-center leading-relaxed">
        {videoError}
      </p>

      <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3">
        <button
          onClick={generateReflectionVideo}
          className="px-6 py-3 rounded-full bg-[#FF9F1C] text-white font-medium hover:bg-[#FFBF69] transition-all shadow-lg hover:shadow-xl hover:scale-105"
        >
          Try again
        </button>

        <button
          onClick={() => setVideoError(null)}
          className="px-6 py-3 rounded-full border border-[#CB997E]/40 text-[#CB997E] font-medium hover:bg-[#CB997E] hover:text-[#FFE8D6] transition-all duration-300"
        >
          Dismiss
        </button>
      </div>
    </div>
  </div>
)}


      {videoUrl && !videoError && (
        <section className="fixed inset-x-4 bottom-6 z-50 sm:right-6 sm:left-auto sm:w-[440px]">
          <div className="rounded-3xl bg-white/95 backdrop-blur-md shadow-2xl border border-[#CB997E]/20 overflow-hidden">
            <div className="p-5 border-b border-[#CB997E]/20 bg-gradient-to-r from-[#FFF5EC] to-[#FFE8D6]">
              <p className="text-base font-medium text-[#CB997E]">
                Reflection Video
              </p>

              {videoNarrative && (
                <p className="mt-2 text-sm text-[#CB997E]/70 font-light leading-relaxed">
                  {videoNarrative}
                </p>
              )}
            </div>

            <video
              src={videoUrl}
              controls
              className="w-full h-auto bg-black"
            />
            
            <div className="p-4 bg-white/50 border-t border-[#CB997E]/10">
              <button
                onClick={() => setVideoUrl(null)}
                className="w-full px-4 py-2.5 rounded-full border border-[#CB997E]/40 text-[#CB997E] text-sm font-medium hover:bg-[#CB997E] hover:text-[#FFE8D6] transition-all duration-300"
              >
                Close
              </button>
            </div>
          </div>
        </section>
      )}
          </div>
  );
}
