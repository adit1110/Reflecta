"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import type {
  NameType,
  ValueType,
  Payload,
  Formatter,
} from "recharts/types/component/DefaultTooltipContent";
import type { TimelinePoint } from "../_data/mock-timeline";

type IdentityShiftTimelineProps = {
  points: TimelinePoint[];
  selectedIsoDate?: string | null;
  onSelectShift?: (isoDate: string) => void;
};

function formatTooltipLabel(value: string | number) {
  return String(value);
}

const formatTooltipValue: Formatter<ValueType, NameType> = (
  value,
  _name,
  item,
) => {
  if (value === undefined || value === null) return ["-", "Stability"];
  const point = (item as Payload<ValueType, NameType>)?.payload as
    | TimelinePoint
    | undefined;
  const suffix = point?.isShift ? ` - ${point.label ?? "Identity Shift"}` : "";
  return [`${value}${suffix}`, "Stability"];
};

type ShiftDotProps = {
  selectedIsoDate?: string | null;
  onSelectShift?: (isoDate: string) => void;
};

function ShiftDot(
  props: ShiftDotProps & { cx?: number; cy?: number; payload?: TimelinePoint },
) {
  const { cx, cy, payload, onSelectShift, selectedIsoDate } = props;

  if (!cx || !cy || !payload) return null;

  const isShift = Boolean(payload.isShift);
  const isSelected = isShift && selectedIsoDate === payload.isoDate;

  const size = isShift ? 8 : 3;
  const fill = isShift ? "#FF9F1C" : "#CB997E";
  const stroke = isSelected ? "#FF9F1C" : "#FFBF69";
  const strokeWidth = isShift ? 3 : 0;

  if (!isShift) {
    return <circle cx={cx} cy={cy} r={size} fill={fill} opacity={0.7} />;
  }

  return (
    <circle
      cx={cx}
      cy={cy}
      r={size}
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
      style={{ cursor: "pointer" }}
      onClick={() => onSelectShift?.(payload.isoDate)}
    />
  );
}

export default function IdentityShiftTimeline({
  points,
  selectedIsoDate,
  onSelectShift,
}: IdentityShiftTimelineProps) {
  return (
    <div className="h-[280px] w-full sm:h-[340px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={points}
          margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
        >
          <CartesianGrid strokeDasharray="4 8" opacity={0.25} />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12 }}
            interval="preserveStartEnd"
            minTickGap={18}
          />
          <YAxis
            domain={[0, 100]}
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12 }}
            width={32}
          />
          <Tooltip
            labelFormatter={formatTooltipLabel}
            formatter={formatTooltipValue}
            contentStyle={{
              borderRadius: 12,
              border: "1px solid rgba(0,0,0,0.08)",
              background: "rgba(255, 255, 255, 0.95)",
              boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
            }}
          />
          <Line
            type="monotone"
            dataKey="stability"
            stroke="#CB997E"
            strokeWidth={3}
            dot={
              <ShiftDot
                selectedIsoDate={selectedIsoDate}
                onSelectShift={onSelectShift}
              />
            }
            activeDot={{ r: 7 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
