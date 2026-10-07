import { Role } from "@/app/generated/prisma/client";
import { requireRole, handleError } from "@/lib/rbac";
import { getPendingOrders } from "@/lib/verify-queries";

export async function GET() {
  try {
    await requireRole([Role.cutting_verifier]);
    return Response.json({ orders: await getPendingOrders() });
  } catch (e) {
    return handleError(e);
  }
}