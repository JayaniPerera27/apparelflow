import { Role } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole, handleError, HttpError } from "@/lib/rbac";
import { resubmitSchema } from "@/lib/schemas";
import { validationError, parseId } from "@/lib/http";

export async function POST(req: Request, { params }: { params: Promise<{ orderId: string }> }) {
  try {
    await requireRole([Role.cutting_supervisor]);
    const orderId = parseId((await params).orderId);

    const body = await req.json().catch(() => null);
    const parsed = resubmitSchema.safeParse(body);
    if (!parsed.success) return validationError(parsed.error);

    await prisma.$transaction(async (tx) => {
      const order = await tx.cuttingOrder.findUnique({ where: { id: orderId } });
      if (!order) throw new HttpError(404, "Order not found");

      const claimed = await tx.cuttingOrder.updateMany({
        where: { id: orderId, status: "REJECTED" },
        data: { status: "PENDING_VERIFICATION", actualFabricYds: parsed.data.actualFabricYds },
      });
      if (claimed.count !== 1) {
        throw new HttpError(409, `Order is ${order.status}. Only REJECTED orders can be resubmitted`);
      }

      // New cut means new counts. Old audit logs stay untouched.
      await tx.verificationItem.updateMany({
        where: { orderId },
        data: { actualQty: null, status: null },
      });
    });

    return Response.json({ ok: true, status: "PENDING_VERIFICATION" });
  } catch (e) {
    return handleError(e);
  }
}