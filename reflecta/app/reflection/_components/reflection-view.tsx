"use client";

import { useEffect, useMemo, useState } from "react";
import IdentityShiftTimeline from "./identity-shift-timeline";
import MomentsThatMattered from "./moments-that-mattered";
import {
  MOCK_TIMELINE,
  formatMonthLabel,
  getAvailableMonths,
  getDefaultMonthKey,
  getMonthKey,
  type TimelinePoint,
} from "../_data/mock-timeline";

function filterPointsByMonth(points: TimelinePoint[], monthKey: string) {
  return points.filter((point) => getMonthKey(point.isoDate) === monthKey);
}

export default function ReflectionView() {
  const availableMonths = useMemo(() => getAvailableMonths(MOCK_TIMELINE), []);
  const [selectedMonthKey, setSelectedMonthKey] = useState(() =>
    getDefaultMonthKey(MOCK_TIMELINE),
  );
  const [selectedShiftIsoDate, setSelectedShiftIsoDate] = useState<
    string | null
  >(null);

  const monthPoints = useMemo(
    () => filterPointsByMonth(MOCK_TIMELINE, selectedMonthKey),
    [selectedMonthKey],
  );

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
              value={selectedMonthKey}
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