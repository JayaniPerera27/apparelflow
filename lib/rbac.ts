import { Role } from "@/app/generated/prisma/client";
import { getSession, Session } from "@/lib/auth";

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

// 401 = not logged in, 403 = logged in but wrong role
export async function requireRole(allowed: Role[]): Promise<Session> {
  const session = await getSession();
  if (!session) throw new HttpError(401, "Not authenticated");
  if (!allowed.includes(session.role)) throw new HttpError(403, "Forbidden");
  return session;
}

export function handleError(e: unknown) {
  if (e instanceof HttpError) {
    return Response.json({ error: e.message }, { status: e.status });
  }
  console.error(e);
  return Response.json({ error: "Internal server error" }, { status: 500 });
}