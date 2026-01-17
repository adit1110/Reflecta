"use client";

import { useRouter } from "next/navigation";
import type { TimelinePoint } from "../../../lib/reflection/types";

type Moment = TimelinePoint & {
  id: string;
};

type MomentsThatMatteredProps = {
  points: TimelinePoint[];
  selectedIsoDate?: string | null;
  onSelectShift?: (isoDate: string) => void;
};

type MomentCardProps = {
  moment: Moment;
  isSelected: boolean;
  onSelect: (moment: Moment) => void;
};

type MomentGroup = {
  positive: Moment[];
  negative: Moment[];
};

function getMoments(points: TimelinePoint[]): MomentGroup {
  const moments = points
    .filter((point) => point.isShift)
    .map((point) => ({ ...point, id: point.journalId }))
    .sort((a, b) => Math.abs(b.delta ?? 0) - Math.abs(a.delta ?? 0));

  return {
    positive: moments.filter((moment) => moment.kind === "positive"),
    negative: moments.filter((moment) => moment.kind === "negative"),
  };
}

function MomentCard({ moment, isSelected, onSelect }: MomentCardProps) {
  const badge =
    moment.kind === "positive"
      ? {
          label: "Positive shift",
          bg: "bg-[#FFBF69]/70",
          text: "text-[#CB997E]",
        }
      : {
          label: "Heavier day",
          bg: "bg-[#CB997E]/50",
          text: "text-white",
        };

  const deltaText =
    typeof moment.delta === "number"
      ? `${moment.delta > 0 ? "+" : ""}${moment.delta}`
      : null;

  return (
    <button
      type="button"
      className={[
        "w-full rounded-2xl bg-white/70 backdrop-blur-sm p-5 text-left shadow-lg border border-[#CB997E]/20 transition-all",
        "hover:bg-white/90 hover:shadow-xl hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-[#FF9F1C]/40",
        isSelected ? "ring-2 ring-[#FF9F1C]/60 bg-white/90 shadow-xl" : "",
      ].join(" ")}
      onClick={() => onSelect(moment)}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-base font-medium text-[#CB997E]">
            {moment.date}
          </div>
          <div className="mt-1.5 text-sm text-[#CB997E]/70 font-light">
            {moment.label ?? "Moment That Mattered"}
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${badge.bg} ${badge.text}`}
          >
            {badge.label}
          </span>
          <div className="text-xs text-[#CB997E]/70 font-light">
            Stability:{" "}
            <span className="font-medium text-[#CB997E]">
              {moment.stability}
            </span>
            {deltaText ? (
              <span className="ml-2 text-[#CB997E]/70">Delta {deltaText}</span>
            ) : null}
          </div>
        </div>
      </div>
    </button>
  );
}

export default function MomentsThatMattered({
  points,
  selectedIsoDate,
  onSelectShift,
}: MomentsThatMatteredProps) {
  const router = useRouter();
  const { positive, negative } = getMoments(points);
  const totalCount = positive.length + negative.length;

  const handleSelect = (moment: Moment) => {
    onSelectShift?.(moment.isoDate);
    if (moment.journalId) {
      router.push(`/journal/${moment.journalId}`);
    }
  };

  return (
    <section className="mt-6">
      <div className="flex items-baseline justify-between gap-4 mb-6">
        <div>
          <h3 className="text-xl font-light text-[#CB997E]">
            Moments that mattered
          </h3>
          <p className="mt-2 text-sm text-[#CB997E]/70 font-light">
            Not every day is highlighted - just the shifts that stood out.
          </p>
        </div>

        <div className="hidden text-sm text-[#CB997E]/70 font-light sm:block">
          {totalCount} highlighted
        </div>
      </div>

      <div className="mt-4 grid gap-5 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="text-sm font-medium text-[#CB997E] tracking-wide">
            Positive Shifts
          </div>
          {positive.length ? (
            positive.map((moment) => (
              <MomentCard
                key={moment.id}
                moment={moment}
                isSelected={moment.isoDate === selectedIsoDate}
                onSelect={handleSelect}
              />
            ))
          ) : (
            <div className="rounded-2xl bg-white/50 backdrop-blur-sm p-5 text-sm text-[#CB997E]/70 font-light border border-[#CB997E]/20">
              No positive shifts yet.
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="text-sm font-medium text-[#CB997E] tracking-wide">
            Heavier Days
          </div>
          {negative.length ? (
            negative.map((moment) => (
              <MomentCard
                key={moment.id}
                moment={moment}
                isSelected={moment.isoDate === selectedIsoDate}
                onSelect={handleSelect}
              />
            ))
          ) : (
            <div className="rounded-2xl bg-white/50 backdrop-blur-sm p-5 text-sm text-[#CB997E]/70 font-light border border-[#CB997E]/20">
              No heavier shifts yet.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}