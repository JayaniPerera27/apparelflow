"use client";

import { useMemo, useState } from "react";
import type { SewingOrderDTO } from "@/lib/types";
import SewingCard from "./SewingCard";

function matches(o: SewingOrderDTO, q: string) {
  if (!q) return true;
  return [o.orderNo, o.recipeName, o.recipeCode, o.fabricRollId, String(o.targetQty), o.verifiedByName ?? ""].some(
    (v) => v.toLowerCase().includes(q),
  );
}

function BatchTable({
  rows,
  actionLabel,
  onOpen,
}: {
  rows: SewingOrderDTO[];
  actionLabel: string;
  onOpen: (id: number) => void;
}) {
  return (
    <div className="card overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-100 text-left text-slate-900">
          <tr>
            <th className="px-4 py-3 font-semibold">Order</th>
            <th className="px-4 py-3 font-semibold">Recipe</th>
            <th className="px-4 py-3 text-right font-semibold">Qty</th>
            <th className="px-4 py-3 font-semibold">Fabric roll</th>
            <th className="px-4 py-3 text-right font-semibold">Fabric used</th>
            <th className="px-4 py-3 font-semibold">Verified by</th>
            <th className="px-4 py-3 text-right font-semibold">Wastage</th>
            <th className="px-4 py-3 font-semibold">
              <span className="sr-only">Action</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {rows.map((o) => (
            <tr key={o.id} onClick={() => onOpen(o.id)} className="cursor-pointer align-top hover:bg-indigo-50">
              <td className="px-4 py-3 font-semibold text-slate-900">{o.orderNo}</td>
              <td className="px-4 py-3 text-slate-900">
                {o.recipeName}
                <span className="block text-xs text-slate-700">{o.recipeCode}</span>
              </td>
              <td className="px-4 py-3 text-right text-slate-900">{o.targetQty}</td>
              <td className="px-4 py-3 text-slate-900">{o.fabricRollId}</td>
              <td className="px-4 py-3 text-right text-slate-900">{o.actualFabricYds.toFixed(2)} yds</td>
              <td className="px-4 py-3 text-slate-900">{o.verifiedByName ?? "-"}</td>
              <td className="px-4 py-3 text-right text-slate-900">
                {o.wastagePct === null ? "-" : `${o.wastagePct.toFixed(2)}%`}
              </td>
              <td className="px-4 py-3 text-right">
                {/* The click bubbles up to the row handler, so keyboard users can open a batch too */}
                <button type="button" className="btn-primary px-3 py-1.5" aria-label={`${actionLabel} ${o.orderNo}`}>
                  {actionLabel}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function SewingView({
  queue,
  inAssembly,
}: {
  queue: SewingOrderDTO[];
  inAssembly: SewingOrderDTO[];
}) {
  const [notice, setNotice] = useState("");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);

  // Becomes null if the order disappears from both lists
  const selected = [...queue, ...inAssembly].find((o) => o.id === selectedId) ?? null;

  const q = query.trim().toLowerCase();
  const filteredQueue = useMemo(() => queue.filter((o) => matches(o, q)), [queue, q]);
  const filteredAssembly = useMemo(() => inAssembly.filter((o) => matches(o, q)), [inAssembly, q]);
  const total = queue.length + inAssembly.length;

  function open(id: number) {
    setNotice("");
    setSelectedId(id);
    window.scrollTo({ top: 0 });
  }

  // Detail view: audit details for one batch
  if (selected) {
    return (
      <div className="space-y-4">
        <button type="button" onClick={() => setSelectedId(null)} className="btn-secondary">
          Back to batches
        </button>
        <SewingCard
          key={selected.id}
          order={selected}
          canStart={selected.status === "VERIFIED"}
          onStarted={(message) => {
            setNotice(message);
            setSelectedId(null);
          }}
        />
      </div>
    );
  }

  // List view
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Sewing queue</h1>
        <p className="text-sm text-slate-700">
          Only batches verified by the Cutting Verifier appear here. Select a batch to review its audit details and
          start assembly.
        </p>
      </div>

      {notice && (
        <p
          role="status"
          className="rounded-lg border border-emerald-300 bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-900"
        >
          {notice}
        </p>
      )}

      {total > 0 && (
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
              placeholder="Order no, recipe, fabric roll, quantity or verifier"
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
            Showing {filteredQueue.length + filteredAssembly.length} of {total} batches
          </p>
        </div>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900">Waiting in the queue</h2>
        {queue.length === 0 ? (
          <div className="card p-8 text-center text-slate-700">No verified batches are waiting.</div>
        ) : filteredQueue.length === 0 ? (
          <div className="card p-8 text-center text-slate-700">No queued batches match your search.</div>
        ) : (
          <BatchTable rows={filteredQueue} actionLabel="Review" onOpen={open} />
        )}
      </section>

      {inAssembly.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900">In assembly</h2>
          {filteredAssembly.length === 0 ? (
            <div className="card p-8 text-center text-slate-700">No batches in assembly match your search.</div>
          ) : (
            <BatchTable rows={filteredAssembly} actionLabel="View" onOpen={open} />
          )}
        </section>
      )}
    </div>
  );
}