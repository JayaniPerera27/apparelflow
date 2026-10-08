"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { canApprove, expectedFabricYds, itemStatus, wastagePct } from "@/lib/domain";
import type { PendingOrderDTO } from "@/lib/types";
import TrafficLight from "@/components/TrafficLight";
import RejectModal from "@/components/RejectModal";

const MAX_COUNT = 10_000_000;

export default function OrderVerifyCard({
  order,
  onDone,
}: {
  order: PendingOrderDTO;
  onDone: (message: string) => void;
}) {
  const router = useRouter();
  const [raw, setRaw] = useState<Record<number, string>>(
    Object.fromEntries(order.items.map((i) => [i.componentId, i.actualQty === null ? "" : String(i.actualQty)])),
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [rejectOpen, setRejectOpen] = useState(false);

  const rows = order.items.map((i) => {
    const text = (raw[i.componentId] ?? "").trim();
    const valid = /^\d+$/.test(text) && Number(text) <= MAX_COUNT;
    const actual = valid ? Number(text) : null;
    return {
      ...i,
      valid,
      actual,
      state: itemStatus(actual, i.expectedQty),
      inputError: text !== "" && !valid,
    };
  });

  const approvable = canApprove(rows.map((r) => ({ expectedQty: r.expectedQty, actualQty: r.actual })));
  const blockers = rows.filter((r) => r.state === "RED" || r.state === "UNCOUNTED");

  const expectedYds = expectedFabricYds(order.targetQty, order.stdFabricYards);
  const pct = wastagePct(order.actualFabricYds, order.targetQty, order.stdFabricYards);
  const overCap = pct > order.wastageCap;

  async function post(path: string, body?: unknown) {
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (res.status === 401) router.push("/login");
    return { res, data };
  }

  async function saveCounts(): Promise<boolean> {
    const counts = rows.filter((r) => r.valid).map((r) => ({ componentId: r.componentId, actualQty: r.actual }));
    if (counts.length === 0) return true;
    const { res, data } = await post(`/api/verify/${order.id}/count`, { counts });
    if (!res.ok) {
      setError(data.error ?? "Could not save counts");
      return false;
    }
    return true;
  }

  async function onSave() {
    setBusy(true);
    setError("");
    setInfo("");
    try {
      if (await saveCounts()) setInfo("Counts saved.");
    } finally {
      setBusy(false);
    }
  }

  async function onApprove() {
    setBusy(true);
    setError("");
    setInfo("");
    try {
      if (!(await saveCounts())) return;
      const { res, data } = await post(`/api/verify/${order.id}/approve`);
      if (!res.ok) {
        setError(data.error ?? "Approval failed");
        return;
      }
      onDone(`${order.orderNo} verified and released to the Sewing Queue.`);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 bg-slate-50 p-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">{order.orderNo}</h2>
          <p className="text-sm text-slate-700">
            {order.recipeName} ({order.recipeCode}) · {order.targetQty} garments · Roll {order.fabricRollId}
          </p>
        </div>
        <div className="text-sm text-slate-900 sm:text-right">
          <p>
            Fabric: {order.actualFabricYds.toFixed(2)} yds used, {expectedYds.toFixed(2)} expected
          </p>
          <p>
            Wastage: <span className="font-semibold">{pct.toFixed(2)}%</span> (cap {order.wastageCap.toFixed(2)}%)
          </p>
          {overCap && <p className="font-semibold text-amber-900">Wastage is above the recipe cap</p>}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="text-left text-slate-900">
            <tr>
              <th className="px-4 py-2.5 font-semibold">Component</th>
              <th className="px-4 py-2.5 text-right font-semibold">Expected</th>
              <th className="px-4 py-2.5 text-right font-semibold">Actual count</th>
              <th className="px-4 py-2.5 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {rows.map((r) => (
              <tr key={r.componentId} className="align-top">
                <td className="px-4 py-3 text-slate-900">{r.componentName}</td>
                <td className="px-4 py-3 text-right font-semibold text-slate-900">{r.expectedQty}</td>
                <td className="px-4 py-3 text-right">
                  <input
                    value={raw[r.componentId] ?? ""}
                    onChange={(e) => {
                      setRaw((p) => ({ ...p, [r.componentId]: e.target.value }));
                      setInfo("");
                    }}
                    inputMode="numeric"
                    autoComplete="off"
                    aria-label={`Actual count for ${r.componentName}`}
                    aria-invalid={r.inputError}
                    className={`input max-w-28 text-right ${r.inputError ? "border-red-600" : ""}`}
                  />
                  {r.inputError && <p className="mt-1 text-xs text-red-700">Whole numbers only</p>}
                </td>
                <td className="px-4 py-3">
                  <TrafficLight state={r.state} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 border-t border-slate-200 p-4">
        {blockers.length > 0 && (
          <p className="text-sm text-red-800">
            <span className="font-semibold">Approve is blocked: </span>
            {blockers
              .map((b) => `${b.componentName} (${b.state === "RED" ? "shortage" : "not counted"})`)
              .join(", ")}
            . A shortage batch can only be rejected.
          </p>
        )}
        {error && (
          <p role="alert" className="alert-error">
            {error}
          </p>
        )}
        {info && (
          <p role="status" className="text-sm text-emerald-900">
            {info}
          </p>
        )}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={onSave} disabled={busy} className="btn-secondary">
            Save counts
          </button>
          <button
            type="button"
            onClick={() => setRejectOpen(true)}
            disabled={busy}
            className="btn-secondary border-red-700 text-red-800"
          >
            Reject batch
          </button>
          <span title={approvable ? undefined : "Shortage detected or components not counted"}>
            <button
              type="button"
              onClick={onApprove}
              disabled={!approvable || busy}
              className="btn-primary w-full sm:w-auto"
            >
              {busy ? "Working..." : "Approve batch"}
            </button>
          </span>
        </div>
      </div>

      {rejectOpen && (
        <RejectModal
          orderId={order.id}
          orderNo={order.orderNo}
          onClose={() => setRejectOpen(false)}
          onDone={onDone}
        />
      )}
    </section>
  );
}