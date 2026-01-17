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
      label: entry.coreLabel ?? undefined,
      kind,
      delta: entry.delta,
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
        .select("journal_id, entry_date, mhf, delta, is_core_memory, core_label")
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

  useEffect(() => {
    if (!selectedShiftIsoDate) return;
    const stillVisible = monthPoints.some(
      (point) => point.isoDate === selectedShiftIsoDate,
    );
    if (!stillVisible) setSelectedShiftIsoDate(null);
  }, [monthPoints, selectedShiftIsoDate]);

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-white/60 backdrop-blur-md p-4 shadow-2xl border border-[#CB997E]/20 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-medium text-[#CB997E]">
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
              className="w-full min-w-[220px] rounded-xl border border-[#CB997E]/30 bg-white/80 px-3 py-2 text-sm text-[#CB997E] outline-none transition focus:border-[#FF9F1C] focus:ring-2 focus:ring-[#FF9F1C]/30"
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

      <section className="min-w-0 rounded-3xl bg-white/60 backdrop-blur-md p-4 shadow-2xl border border-[#CB997E]/20 sm:p-6">
        <h2 className="text-lg font-light text-[#CB997E]">
          Identity Shift Timeline
        </h2>
        <p className="mt-1 text-sm text-[#CB997E]/70 font-light">
          Hover for details. Click a highlighted day to focus it.
        </p>

        <div className="mt-4 min-w-0">
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
    </div>
  );
}
