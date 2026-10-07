import type { OrderStatusDTO } from "@/lib/types";

const STYLES: Record<OrderStatusDTO, string> = {
  PENDING_VERIFICATION: "bg-amber-100 text-amber-900 border-amber-300",
  REJECTED: "bg-red-100 text-red-900 border-red-300",
  VERIFIED: "bg-emerald-100 text-emerald-900 border-emerald-300",
  SEWING_STARTED: "bg-indigo-100 text-indigo-900 border-indigo-300",
};

const LABELS: Record<OrderStatusDTO, string> = {
  PENDING_VERIFICATION: "Pending verification",
  REJECTED: "Rejected",
  VERIFIED: "Verified",
  SEWING_STARTED: "Sewing started",
};

export default function StatusBadge({ status }: { status: OrderStatusDTO }) {
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STYLES[status]}`}
    >
      {LABELS[status]}
    </span>
  );
}