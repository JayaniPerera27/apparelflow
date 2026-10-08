import { z } from "zod";
import { HttpError } from "@/lib/rbac";

// { field: "first error message" } so the UI can show inline errors
export function validationError(error: z.ZodError) {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "_");
    fields[key] ??= issue.message;
  }
  return Response.json({ error: "Validation failed", fields }, { status: 400 });
}

// URL ids must be plain positive integers
export function parseId(raw: string): number {
  if (!/^\d+$/.test(raw)) throw new HttpError(400, "Invalid id");
  const n = Number(raw);
  if (!Number.isSafeInteger(n) || n < 1 || n > 2147483647) throw new HttpError(400, "Invalid id");
  return n;
}