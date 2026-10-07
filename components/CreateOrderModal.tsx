"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { expectedQty, expectedFabricYds } from "@/lib/domain";
import type { RecipeDTO } from "@/lib/types";

type Field = "recipeId" | "targetQty" | "fabricRollId" | "actualFabricYds";
type Errors = Partial<Record<Field | "form", string>>;

const FIELDS: Field[] = ["recipeId", "targetQty", "fabricRollId", "actualFabricYds"];

function check(name: Field, value: string): string | undefined {
  const v = value.trim();
  switch (name) {
    case "recipeId":
      return v ? undefined : "Select a recipe";
    case "targetQty":
      if (!v) return "Quantity is required";
      if (!/^\d+$/.test(v)) return "Whole numbers only (no negatives, decimals or letters)";
      if (Number(v) <= 0) return "Quantity must be greater than 0";
      if (Number(v) > 100000) return "Quantity is too large";
      return undefined;
    case "fabricRollId":
      if (!v) return "Fabric roll ID is required";
      if (!/^[A-Za-z0-9_-]{3,50}$/.test(v)) return "3 to 50 characters: letters, numbers, - or _";
      return undefined;
    case "actualFabricYds":
      if (!v) return "Fabric used is required";
      if (!/^\d+(\.\d{1,2})?$/.test(v)) return "Positive number, up to 2 decimal places";
      if (Number(v) <= 0) return "Fabric used must be greater than 0";
      return undefined;
  }
}

function Row({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="label">
        {label}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1.5 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

export default function CreateOrderModal({
  recipes,
  onClose,
}: {
  recipes: RecipeDTO[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [v, setV] = useState({ recipeId: "", targetQty: "", fabricRollId: "", actualFabricYds: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const recipe = recipes.find((r) => String(r.id) === v.recipeId);
  const qty = /^\d+$/.test(v.targetQty) && Number(v.targetQty) > 0 ? Number(v.targetQty) : 0;

  function change(name: Field, value: string) {
    setV((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((e) => ({ ...e, [name]: check(name, value) }));
  }

  function blur(name: Field) {
    setErrors((e) => ({ ...e, [name]: check(name, v[name]) }));
  }

  function inputProps(name: Field) {
    return {
      id: name,
      value: v[name],
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => change(name, e.target.value),
      onBlur: () => blur(name),
      "aria-invalid": !!errors[name],
      "aria-describedby": errors[name] ? `${name}-error` : undefined,
      className: `input ${errors[name] ? "border-red-600" : ""}`,
    };
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();

    const next: Errors = {};
    for (const f of FIELDS) {
      const msg = check(f, v[f]);
      if (msg) next[f] = msg;
    }
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipeId: Number(v.recipeId),
          targetQty: Number(v.targetQty),
          fabricRollId: v.fabricRollId.trim(),
          actualFabricYds: Number(v.actualFabricYds),
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (!res.ok) {
        setErrors({
          ...(data.fields ?? {}),
          form: data.fields ? undefined : (data.error ?? "Could not create the order"),
        });
        return;
      }

      onClose();
      router.refresh();
    } catch {
      setErrors({ form: "Network error. Please try again." });
    } finally {
      setSubmitting(false);
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
        aria-labelledby="order-modal-title"
        className="card my-2 w-full max-w-2xl p-4 sm:my-8 sm:p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="order-modal-title" className="text-xl font-bold text-slate-900">
              New cutting order
            </h2>
            <p className="mt-1 text-sm text-slate-700">Submitting sends the batch to the Verifier.</p>
          </div>
          <button type="button" onClick={onClose} className="btn-secondary" aria-label="Close">
            Close
          </button>
        </div>

        <form onSubmit={submit} noValidate className="mt-6 space-y-5">
          <fieldset className="min-w-0">
            <legend className="label">Recipe</legend>
            <div role="radiogroup" className="grid gap-3 sm:grid-cols-2">
              {recipes.map((r) => {
                const selected = v.recipeId === String(r.id);
                return (
                  <label
                    key={r.id}
                    className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 focus-within:ring-2 focus-within:ring-indigo-200 ${
                      selected
                        ? "border-indigo-700 bg-indigo-50"
                        : errors.recipeId
                          ? "border-red-600 bg-white"
                          : "border-slate-400 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="recipeId"
                      value={r.id}
                      checked={selected}
                      onChange={() => change("recipeId", String(r.id))}
                      className="mt-1 h-4 w-4 accent-indigo-700"
                    />
                    <span>
                      <span className="block text-sm font-semibold text-slate-900">{r.name}</span>
                      <span className="block text-xs text-slate-700">
                        {r.recipeCode} · {r.stdFabricYards} yds per piece
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
            {errors.recipeId && (
              <p id="recipeId-error" role="alert" className="mt-1.5 text-sm text-red-700">
                {errors.recipeId}
              </p>
            )}
          </fieldset>

          <div className="grid gap-5 sm:grid-cols-2">
            <Row id="targetQty" label="Target batch quantity (garments)" error={errors.targetQty}>
              <input {...inputProps("targetQty")} inputMode="numeric" autoComplete="off" placeholder="e.g. 50" />
            </Row>
            <Row id="actualFabricYds" label="Actual fabric used (yards)" error={errors.actualFabricYds}>
              <input
                {...inputProps("actualFabricYds")}
                inputMode="decimal"
                autoComplete="off"
                placeholder="e.g. 92.5"
              />
            </Row>
          </div>

          <Row id="fabricRollId" label="Fabric roll ID" error={errors.fabricRollId}>
            <input {...inputProps("fabricRollId")} autoComplete="off" placeholder="e.g. FAB-ROLL-882" />
          </Row>

          {recipe && (
            <div className="overflow-hidden rounded-lg border border-slate-300">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-300 bg-slate-100 px-4 py-2.5">
                <p className="text-sm font-semibold text-slate-900">Expected component counts</p>
                <p className="text-sm text-slate-900">
                  Expected fabric:{" "}
                  <span className="font-semibold">
                    {qty ? `${expectedFabricYds(qty, recipe.stdFabricYards).toFixed(2)} yds` : "-"}
                  </span>
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-900">
                      <th className="px-4 py-2 font-semibold">Component</th>
                      <th className="px-4 py-2 text-right font-semibold">Pcs / garment</th>
                      <th className="px-4 py-2 text-right font-semibold">Expected</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {recipe.components.map((c) => (
                      <tr key={c.id}>
                        <td className="px-4 py-2 text-slate-900">{c.componentName}</td>
                        <td className="px-4 py-2 text-right text-slate-900">{c.piecesPerGarment}</td>
                        <td className="px-4 py-2 text-right font-semibold text-slate-900">
                          {qty ? expectedQty(qty, c.piecesPerGarment) : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {errors.form && (
            <p role="alert" className="alert-error">
              {errors.form}
            </p>
          )}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button type="button" onClick={onClose} className="btn-secondary w-full sm:w-auto">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="btn-primary w-full sm:w-auto">
              {submitting ? "Submitting..." : "Submit for verification"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}