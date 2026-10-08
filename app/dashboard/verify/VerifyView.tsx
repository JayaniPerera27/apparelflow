"use client";

import { useMemo, useState } from "react";
import type { PendingOrderDTO } from "@/lib/types";
import OrderVerifyCard from "./OrderVerifyCard";

export default function VerifyView({ orders }: { orders: PendingOrderDTO[] }) {
  const [notice, setNotice] = useState("");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);

  // If the selected order is no longer pending (approved or rejected), this becomes null
  const selected = orders.find((o) => o.id === selectedId) ?? null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter((o) =>
      [o.orderNo, o.recipeName, o.recipeCode, o.fabricRollId, String(o.targetQty)].some((v) =>
        v.toLowerCase().includes(q),
      ),
    );
  }, [orders, query]);

  function open(id: number) {
    setNotice("");
    setSelectedId(id);
    window.scrollTo({ top: 0 });
  }

  const noticeBox = notice && (
    <p
      role="status"
      className="rounded-lg border border-emerald-300 bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-900"
    >
      {notice}
    </p>
  );

  // Detail view: the verification card for one batch
  if (selected) {
    return (
      <div className="space-y-4">
        <button type="button" onClick={() => setSelectedId(null)} className="btn-secondary">
          Back to batches
        </button>
        <OrderVerifyCard
          key={selected.id}
          order={selected}
          onDone={(message) => {
            setNotice(message);
            setSelectedId(null);
          }}
        />
      </div>
    );
  }

  // List view: all pending batches with search
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Verification terminal</h1>
        <p className="text-sm text-slate-700">
          Select a batch to count its components. A shortage (RED) blocks approval, and the batch must be rejected
          with a reason.
        </p>
      </div>

      {noticeBox}

      {orders.length === 0 ? (
        <div className="card p-8 text-center text-slate-700">No batches are waiting for verification.</div>
      ) : (
        <>
          <div className="card p-4">
            <label htmlFor="batch-search" className="label">
              Search batches
            </label>
            <div className="flex gap-3">
              <input
                id="batch-search"
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Order no, recipe, fabric roll or quantity"
                autoComplete="off"
                className="input"
              />
              {query && (
                <button type="button" onClick={() => setQuery("")} className="btn-secondary shrink-0">
                  Clear
                </button>
              )}
            </div>
            <p className="mt-2 text-sm text-slate-700" aria-live="polite">
              Showing {filtered.length} of {orders.length} batches
            </p>
          </div>

          <div className="card overflow-x-auto">
            {filtered.length === 0 ? (
              <p className="p-8 text-center text-slate-700">No batches match your search.</p>
            ) : (
              <table className="min-w-full text-sm">
                <thead className="bg-slate-100 text-left text-slate-900">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Order</th>
                    <th className="px-4 py-3 font-semibold">Recipe</th>
                    <th className="px-4 py-3 text-right font-semibold">Qty</th>
                    <th className="px-4 py-3 font-semibold">Fabric roll</th>
                    <th className="px-4 py-3 text-right font-semibold">Fabric used</th>
                    <th className="px-4 py-3 font-semibold">
                      <span className="sr-only">Action</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filtered.map((o) => (
                    <tr
                      key={o.id}
                      onClick={() => open(o.id)}
                      className="cursor-pointer align-top hover:bg-indigo-50"
                    >
                      <td className="px-4 py-3 font-semibold text-slate-900">{o.orderNo}</td>
                      <td className="px-4 py-3 text-slate-900">
                        {o.recipeName}
                        <span className="block text-xs text-slate-700">{o.recipeCode}</span>
                      </td>
                      <td className="px-4 py-3 text-right text-slate-900">{o.targetQty}</td>
                      <td className="px-4 py-3 text-slate-900">{o.fabricRollId}</td>
                      <td className="px-4 py-3 text-right text-slate-900">{o.actualFabricYds.toFixed(2)} yds</td>
                      <td className="px-4 py-3 text-right">
                        {/* A click on this button bubbles up to the row handler, so keyboard users can open a batch too */}
                        <button type="button" className="btn-primary px-3 py-1.5" aria-label={`Verify ${o.orderNo}`}>
                          Verify
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}