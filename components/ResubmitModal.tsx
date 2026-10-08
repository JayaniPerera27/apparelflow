"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { OrderDTO } from "@/lib/types";

export default function ResubmitModal({ order, onClose }: { order: OrderDTO; onClose: () => void }) {
  const router = useRouter();
  const [yds, setYds] = useState(String(order.actualFabricYds));
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const v = yds.trim();
    if (!/^\d+(\.\d{1,2})?$/.test(v) || Number(v) <= 0) {
      setError("Positive number, up to 2 decimal places");
      return;
    }

    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/orders/${order.id}/resubmit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actualFabricYds: Number(v) }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (!res.ok) {
        setError(data.fields?.actualFabricYds ?? data.error ?? "Could not resubmit");
        return;
      }
      onClose();
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/60 p-2 sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="resubmit-title"
        className="card my-2 w-full max-w-lg p-4 sm:my-8 sm:p-6"
      >
        <h2 id="resubmit-title" className="text-xl font-bold text-slate-900">
          Resubmit {order.orderNo}
        </h2>
        {order.rejectionNote && (
          <p className="mt-3 rounded-lg border border-red-300 bg-red-50 px-3.5 py-2.5 text-sm text-red-900">
            <span className="font-semibold">Verifier note:</span> {order.rejectionNote}
          </p>
        )}
        <p className="mt-3 text-sm text-slate-700">
          After re-cutting, confirm the total fabric used. The Verifier will count the components again.
        </p>

        <form onSubmit={submit} noValidate className="mt-5 space-y-4">
          <div>
            <label htmlFor="resubmit-yds" className="label">
              Actual fabric used (yards)
            </label>
            <input
              id="resubmit-yds"
              value={yds}
              onChange={(e) => {
                setYds(e.target.value);
                if (error) setError("");
              }}
              inputMode="decimal"
              autoComplete="off"
              autoFocus
              aria-invalid={!!error}
              className={`input ${error ? "border-red-600" : ""}`}
            />
            {error && (
              <p role="alert" className="mt-1.5 text-sm text-red-700">
                {error}
              </p>
            )}
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button type="button" onClick={onClose} className="btn-secondary w-full sm:w-auto">
              Cancel
            </button>
            <button type="submit" disabled={busy} className="btn-primary w-full sm:w-auto">
              {busy ? "Submitting..." : "Resubmit for verification"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}