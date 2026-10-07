import { z } from "zod";

// { field: "first error message" } so the UI can show inline errors
export function validationError(error: z.ZodError) {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "_");
    fields[key] ??= issue.message;
  }
  return Response.json({ error: "Validation failed", fields }, { status: 400 });
}