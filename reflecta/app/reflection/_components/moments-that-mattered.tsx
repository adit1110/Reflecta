"use client";

import type { TimelinePoint } from "../_data/mock-timeline";

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
    .map((point) => ({ ...point, id: point.isoDate }))
    .sort((a, b) => (a.isoDate < b.isoDate ? 1 : -1));

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
          bg: "bg-[#FFBF69]/60",
          text: "text-neutral-900",
        }
      : {
          label: "Heavier day",
          bg: "bg-[#CB997E]/45",
          text: "text-neutral-900",
        };

  const deltaText =
    typeof moment.delta === "number"
      ? `${moment.delta > 0 ? "+" : ""}${moment.delta}`
      : null;

  return (
    <button
      type="button"
      className={[
        "w-full rounded-2xl bg-white/70 p-4 text-left shadow-sm ring-1 ring-black/5 transition sm:p-5",
        "hover:bg-white/80 focus:outline-none focus:ring-2 focus:ring-[#FF9F1C]/40",
        isSelected ? "ring-2 ring-[#FF9F1C]/50 bg-white/90" : "",
      ].join(" ")}
      onClick={() => onSelect(moment)}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-medium text-neutral-900">
            {moment.date}
          </div>
          <div className="mt-1 text-sm text-neutral-700">
            {moment.label ?? "Identity Shift"}
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs ${badge.bg} ${badge.text}`}
          >
            {badge.label}
          </span>
          <div className="text-xs text-neutral-600">
            Stability:{" "}
            <span className="font-medium text-neutral-900">
              {moment.stability}
            </span>
            {deltaText ? (
              <span className="ml-2 text-neutral-600">Delta {deltaText}</span>
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
  const { positive, negative } = getMoments(points);
  const totalCount = positive.length + negative.length;

  return (
    <section className="mt-6">
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <h3 className="text-base font-medium text-neutral-900">
            Moments that mattered
          </h3>
          <p className="mt-1 text-sm text-neutral-700">
            Not every day is highlighted - just the shifts that stood out.
          </p>
        </div>

        <div className="hidden text-xs text-neutral-600 sm:block">
          {totalCount} highlighted
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="space-y-3">
          <div className="text-xs font-medium uppercase tracking-wide text-neutral-700">
            Positive
          </div>
          {positive.length ? (
            positive.map((moment) => (
              <MomentCard
                key={moment.id}
                moment={moment}
                isSelected={moment.isoDate === selectedIsoDate}
                onSelect={(selected) => onSelectShift?.(selected.isoDate)}
              />
            ))
          ) : (
            <div className="rounded-2xl bg-white/50 p-4 text-sm text-neutral-700 ring-1 ring-black/5">
              No positive shifts yet.
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div className="text-xs font-medium uppercase tracking-wide text-neutral-700">
            Heavier
          </div>
          {negative.length ? (
            negative.map((moment) => (
              <MomentCard
                key={moment.id}
                moment={moment}
                isSelected={moment.isoDate === selectedIsoDate}
                onSelect={(selected) => onSelectShift?.(selected.isoDate)}
              />
            ))
          ) : (
            <div className="rounded-2xl bg-white/50 p-4 text-sm text-neutral-700 ring-1 ring-black/5">
              No heavier shifts yet.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
