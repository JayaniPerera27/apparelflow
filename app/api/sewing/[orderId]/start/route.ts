import { Role } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole, handleError, HttpError } from "@/lib/rbac";
import { parseId } from "@/lib/http";

export async function POST(_req: Request, { params }: { params: Promise<{ orderId: string }> }) {
  try {
    await requireRole([Role.sewing_supervisor]);
    const orderId = parseId((await params).orderId);

    await prisma.$transaction(async (tx) => {
      // Sewing can only "see" verified orders. Anything else looks like it does not exist.
      const order = await tx.cuttingOrder.findFirst({
        where: { id: orderId, status: { in: ["VERIFIED", "SEWING_STARTED"] } },
      });
      if (!order) throw new HttpError(404, "Order not found");
      if (order.status === "SEWING_STARTED") throw new HttpError(409, "Sewing already started for this order");

      const claimed = await tx.cuttingOrder.updateMany({
        where: { id: orderId, status: "VERIFIED" },
        data: { status: "SEWING_STARTED" },
      });
      if (claimed.count !== 1) throw new HttpError(409, "Order was changed by someone else. Reload and try again");
    });

    return Response.json({ ok: true, status: "SEWING_STARTED" });
  } catch (e) {
    return handleError(e);
  }
}