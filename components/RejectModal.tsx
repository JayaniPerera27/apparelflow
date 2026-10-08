"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function RejectModal({
  orderId,
  orderNo,
  onClose,
  onDone,
}: {
  orderId: number;
  orderNo: string;
  onClose: () => void;
  onDone: (message: string) => void;
}) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const text = reason.trim();
    if (text.length < 5) {
      setError("Enter a reason of at least 5 characters");
      return;
    }

    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/verify/${orderId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: text }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (!res.ok) {
        setError(data.fields?.reason ?? data.error ?? "Could not reject the batch");
        return;
      }
      onDone(`${orderNo} rejected and returned to the Cutting Supervisor.`);
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
        aria-labelledby="reject-title"
        className="card my-2 w-full max-w-lg p-4 sm:my-8 sm:p-6"
      >
        <h2 id="reject-title" className="text-xl font-bold text-slate-900">
          Reject {orderNo}
        </h2>
        <p className="mt-1 text-sm text-slate-700">The batch goes back to the Supervisor for re-cutting.</p>

        <form onSubmit={submit} noValidate className="mt-5 space-y-4">
          <div>
            <label htmlFor="reason" className="label">
              Reason (required)
            </label>
            <textarea
              id="reason"
              rows={4}
              autoFocus
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError("");
              }}
              aria-invalid={!!error}
              aria-describedby={error ? "reason-error" : undefined}
              placeholder="e.g. 4 sleeve cuffs short, fabric defect on roll edge"
              className={`input ${error ? "border-red-600" : ""}`}
            />
            {error && (
              <p id="reason-error" role="alert" className="mt-1.5 text-sm text-red-700">
                {error}
              </p>
            )}
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button type="button" onClick={onClose} className="btn-secondary w-full sm:w-auto">
              Cancel
            </button>
            <button type="submit" disabled={busy} className="btn-primary w-full sm:w-auto">
              {busy ? "Rejecting..." : "Reject batch"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}