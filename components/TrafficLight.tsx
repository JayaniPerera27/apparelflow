import type { ItemState } from "@/lib/domain";

const STYLES: Record<ItemState, string> = {
  GREEN: "bg-emerald-100 text-emerald-900 border-emerald-500",
  YELLOW: "bg-amber-100 text-amber-900 border-amber-500",
  RED: "bg-red-100 text-red-900 border-red-500",
  UNCOUNTED: "bg-slate-100 text-slate-900 border-slate-400",
};

const LABELS: Record<ItemState, string> = {
  GREEN: "GREEN - Match",
  YELLOW: "YELLOW - Excess",
  RED: "RED - Shortage",
  UNCOUNTED: "Not counted",
};

const DOTS: Record<ItemState, string> = {
  GREEN: "bg-emerald-600",
  YELLOW: "bg-amber-500",
  RED: "bg-red-600",
  UNCOUNTED: "bg-slate-500",
};

export default function TrafficLight({ state }: { state: ItemState }) {
  return (
    <span
      className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STYLES[state]}`}
    >
      <span aria-hidden className={`h-2.5 w-2.5 rounded-full ${DOTS[state]}`} />
      {LABELS[state]}
    </span>
  );
}