"use client";

import type { SewingOrderDTO } from "@/lib/types";
import SewingCard from "./SewingCard";

export default function SewingView({
  queue,
  inAssembly,
}: {
  queue: SewingOrderDTO[];
  inAssembly: SewingOrderDTO[];
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Sewing queue</h1>
        <p className="text-sm text-slate-700">
          Only batches verified by the Cutting Verifier appear here. Review the audit details, then start assembly.
        </p>
      </div>

      <section className="space-y-4">
        {queue.length === 0 ? (
          <div className="card p-8 text-center text-slate-700">No verified batches are waiting.</div>
        ) : (
          queue.map((o) => <SewingCard key={o.id} order={o} canStart />)
        )}
      </section>

      {inAssembly.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900">In assembly</h2>
          {inAssembly.map((o) => (
            <SewingCard key={o.id} order={o} canStart={false} />
          ))}
        </section>
      )}
    </div>
  );
}