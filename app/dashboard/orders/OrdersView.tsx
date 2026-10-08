"use client";

import { useState } from "react";
import CreateOrderModal from "@/components/CreateOrderModal";
import ResubmitModal from "@/components/ResubmitModal";
import StatusBadge from "@/components/StatusBadge";
import type { OrderDTO, RecipeDTO } from "@/lib/types";

const dateFmt = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Colombo", // fixed zone, so server and browser render the same text
});

export default function OrdersView({ orders, recipes }: { orders: OrderDTO[]; recipes: RecipeDTO[] }) {
  const [open, setOpen] = useState(false);
  const [resubmitFor, setResubmitFor] = useState<OrderDTO | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Cutting orders</h1>
          <p className="text-sm text-slate-700">Create batches and track their verification status.</p>
        </div>
        <button type="button" onClick={() => setOpen(true)} className="btn-primary">
          New cutting order
        </button>
      </div>

      <div className="card overflow-x-auto">
        {orders.length === 0 ? (
          <p className="p-8 text-center text-slate-700">No cutting orders yet. Create the first one.</p>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-slate-100 text-left text-slate-900">
              <tr>
                <th className="px-4 py-3 font-semibold">Order</th>
                <th className="px-4 py-3 font-semibold">Recipe</th>
                <th className="px-4 py-3 text-right font-semibold">Qty</th>
                <th className="px-4 py-3 font-semibold">Fabric roll</th>
                <th className="px-4 py-3 text-right font-semibold">Fabric used</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {orders.map((o) => (
                <tr key={o.id} className="align-top">
                  <td className="px-4 py-3 font-semibold text-slate-900">{o.orderNo}</td>
                  <td className="px-4 py-3 text-slate-900">
                    {o.recipeName}
                    <span className="block text-xs text-slate-700">{o.recipeCode}</span>
                  </td>
                  <td className="px-4 py-3 text-right text-slate-900">{o.targetQty}</td>
                  <td className="px-4 py-3 text-slate-900">{o.fabricRollId}</td>
                  <td className="px-4 py-3 text-right text-slate-900">{o.actualFabricYds.toFixed(2)} yds</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={o.status} />
                    {o.rejectionNote && (
                      <p className="mt-2 max-w-xs text-xs text-red-800">
                        <span className="font-semibold">Verifier note:</span> {o.rejectionNote}
                      </p>
                    )}
                    {o.status === "REJECTED" && (
                      <button
                        type="button"
                        onClick={() => setResubmitFor(o)}
                        className="btn-secondary mt-2 px-3 py-1 text-xs"
                      >
                        Re-cut and resubmit
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-slate-900">
                    {dateFmt.format(new Date(o.createdAt))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {open && <CreateOrderModal recipes={recipes} onClose={() => setOpen(false)} />}
      {resubmitFor && <ResubmitModal order={resubmitFor} onClose={() => setResubmitFor(null)} />}
    </div>
  );
}