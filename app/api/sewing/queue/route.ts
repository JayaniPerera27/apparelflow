import { Role } from "@/app/generated/prisma/client";
import { requireRole, handleError } from "@/lib/rbac";
import { getSewingOrders } from "@/lib/sewing-queries";

// Query params are ignored on purpose. The VERIFIED filter is fixed in code.
export async function GET(_req: Request) {
  try {
    await requireRole([Role.sewing_supervisor]);
    return Response.json({ orders: await getSewingOrders("VERIFIED") });
  } catch (e) {
    return handleError(e);
  }
}