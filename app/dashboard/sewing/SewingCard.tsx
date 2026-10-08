"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import TrafficLight from "@/components/TrafficLight";
import { itemStatus } from "@/lib/domain";
import type { SewingOrderDTO } from "@/lib/types";

const dateFmt = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Colombo",
});

function variance(actual: number | null, expected: number) {
  if (actual === null) return "-";
  const d = actual - expected;
  return d > 0 ? `+${d}` : String(d);
}

export default function SewingCard({ order, canStart }: { order: SewingOrderDTO; canStart: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const overCap = order.wastagePct !== null && order.wastagePct > order.wastageCap;
  const rejections = order.history.filter((h) => h.decision === "REJECTED");

  async function start() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/sewing/${order.id}/start`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (!res.ok) {
        setError(data.error ?? "Could not start sewing");
        return;
      }
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="card overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 bg-slate-50 p-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900">{order.orderNo}</h3>
          <p className="text-sm text-slate-700">
            {order.recipeName} ({order.recipeCode}) · {order.targetQty} garments · Roll {order.fabricRollId}
          </p>
        </div>
        <span className="rounded-full border border-emerald-400 bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-900">
          {order.status === "VERIFIED" ? "Verified" : "Sewing started"}
        </span>
      </div>

      <dl className="grid gap-4 border-b border-slate-200 p-4 text-sm sm:grid-cols-4">
        <div>
          <dt className="text-slate-700">Verified by</dt>
          <dd className="font-semibold text-slate-900">{order.verifiedByName ?? "-"}</dd>
        </div>
        <div>
          <dt className="text-slate-700">Verified at</dt>
          <dd className="font-semibold text-slate-900">
            {order.verifiedAt ? dateFmt.format(new Date(order.verifiedAt)) : "-"}
          </dd>
        </div>
        <div>
          <dt className="text-slate-700">Fabric used</dt>
          <dd className="font-semibold text-slate-900">{order.actualFabricYds.toFixed(2)} yds</dd>
        </div>
        <div>
          <dt className="text-slate-700">Fabric wastage</dt>
          <dd className="font-semibold text-slate-900">
            {order.wastagePct === null ? "-" : `${order.wastagePct.toFixed(2)}%`}{" "}
            <span className="font-normal text-slate-700">(cap {order.wastageCap.toFixed(2)}%)</span>
          </dd>
          {overCap && <dd className="font-semibold text-amber-900">Above the recipe cap</dd>}
        </div>
      </dl>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="text-left text-slate-900">
            <tr>
              <th className="px-4 py-2.5 font-semibold">Component</th>
              <th className="px-4 py-2.5 text-right font-semibold">Expected</th>
              <th className="px-4 py-2.5 text-right font-semibold">Counted</th>
              <th className="px-4 py-2.5 text-right font-semibold">Variance</th>
              <th className="px-4 py-2.5 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {order.items.map((i) => (
              <tr key={i.componentName}>
                <td className="px-4 py-2.5 text-slate-900">{i.componentName}</td>
                <td className="px-4 py-2.5 text-right text-slate-900">{i.expectedQty}</td>
                <td className="px-4 py-2.5 text-right font-semibold text-slate-900">{i.actualQty ?? "-"}</td>
                <td className="px-4 py-2.5 text-right text-slate-900">{variance(i.actualQty, i.expectedQty)}</td>
                <td className="px-4 py-2.5">
                  <TrafficLight state={itemStatus(i.actualQty, i.expectedQty)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {rejections.length > 0 && (
        <div className="border-t border-slate-200 p-4 text-sm">
          <p className="font-semibold text-slate-900">Earlier rejections of this batch</p>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-slate-900">
            {rejections.map((h) => (
              <li key={h.at}>
                {dateFmt.format(new Date(h.at))}, {h.byName}: {h.note}
              </li>
            ))}
          </ul>
        </div>
      )}

      {canStart && (
        <div className="space-y-3 border-t border-slate-200 p-4">
          {error && (
            <p role="alert" className="alert-error">
              {error}
            </p>
          )}
          <div className="flex sm:justify-end">
            <button type="button" onClick={start} disabled={busy} className="btn-primary w-full sm:w-auto">
              {busy ? "Starting..." : "Start Sewing Assembly"}
            </button>
          </div>
        </div>
      )}
    </article>
  );
}