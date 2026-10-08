"use client";

import { useState } from "react";
import type { PendingOrderDTO } from "@/lib/types";
import OrderVerifyCard from "./OrderVerifyCard";

export default function VerifyView({ orders }: { orders: PendingOrderDTO[] }) {
  const [notice, setNotice] = useState("");

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Verification terminal</h1>
        <p className="text-sm text-slate-700">
          Count every component. A shortage (RED) blocks approval, and the batch must be rejected with a reason.
        </p>
      </div>

      {notice && (
        <p role="status" className="rounded-lg border border-emerald-300 bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-900">
          {notice}
        </p>
      )}

      {orders.length === 0 ? (
        <div className="card p-8 text-center text-slate-700">No batches are waiting for verification.</div>
      ) : (
        orders.map((o) => <OrderVerifyCard key={o.id} order={o} onDone={setNotice} />)
      )}
    </div>
  );
}