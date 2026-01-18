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

function scorePositive(point: TimelinePoint) {
  const neg = point.negSentiment ?? 0;
  const stress = point.stress ?? 0;
  const fatigue = point.fatigue ?? 0;
  const mhf = point.stability ?? 0;
  return (
    (1 - neg) * 0.6 +
    (1 - stress) * 0.2 +
    (1 - fatigue) * 0.2 +
    (mhf / 100) * 0.2
  );
}

function scoreHeavier(point: TimelinePoint) {
  const neg = point.negSentiment ?? 0;
  const stress = point.stress ?? 0;
  const fatigue = point.fatigue ?? 0;
  return neg * 0.6 + stress * 0.25 + fatigue * 0.15;
}

function getMoments(points: TimelinePoint[]): MomentGroup {
  const base = points.map((point) => ({ ...point, id: point.journalId }));
  const positive = [...base]
    .sort((a, b) => scorePositive(b) - scorePositive(a))
    .slice(0, 3)
    .map((moment) => ({ ...moment, kind: "positive", label: "Positive Shift" }));

  const positiveIds = new Set(positive.map((moment) => moment.id));

  const negative = [...base]
    .filter((moment) => !positiveIds.has(moment.id))
    .sort((a, b) => scoreHeavier(b) - scoreHeavier(a))
    .slice(0, 3)
    .map((moment) => ({ ...moment, kind: "negative", label: "Heavier Day" }));

  return {
    positive,
    negative,
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
          <div className="text-lg font-medium text-[#CB997E]">
            {moment.date}
          </div>
          <div className="mt-1.5 text-base text-[#CB997E]/70 font-light">
            {moment.label ?? "Moment That Mattered"}
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${badge.bg} ${badge.text}`}
          >
            {badge.label}
          </span>
          <div className="text-sm text-[#CB997E]/70 font-light">
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
          <h3 className="text-2xl font-light text-[#CB997E]">
            Moments that mattered
          </h3>
          <p className="mt-2 text-base text-[#CB997E]/70 font-light">
            Not every day is highlighted - just the shifts that stood out.
          </p>
        </div>

        <div className="hidden text-base text-[#CB997E]/70 font-light sm:block">
          {totalCount} highlighted
        </div>
      </div>

      <div className="mt-4 grid gap-5 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="text-base font-medium text-[#CB997E] tracking-wide">
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
            <div className="rounded-2xl bg-white/50 backdrop-blur-sm p-5 text-base text-[#CB997E]/70 font-light border border-[#CB997E]/20">
              No positive shifts yet.
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="text-base font-medium text-[#CB997E] tracking-wide">
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
            <div className="rounded-2xl bg-white/50 backdrop-blur-sm p-5 text-base text-[#CB997E]/70 font-light border border-[#CB997E]/20">
              No heavier shifts yet.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}