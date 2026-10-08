import { Role } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole, handleError, HttpError } from "@/lib/rbac";
import { parseId } from "@/lib/http";
import { blockingItems, itemStatus, wastagePct } from "@/lib/domain";

// The request body is ignored on purpose. Verifier identity comes from the JWT,
// counts come from the database, and the timestamp comes from the server.
export async function POST(_req: Request, { params }: { params: Promise<{ orderId: string }> }) {
  try {
    // 1. Role check (401 / 403)
    const session = await requireRole([Role.cutting_verifier]);
    const orderId = parseId((await params).orderId);

    const log = await prisma.$transaction(async (tx) => {
      const order = await tx.cuttingOrder.findUnique({
        where: { id: orderId },
        include: { recipe: true, items: { include: { component: true } } },
      });
      if (!order) throw new HttpError(404, "Order not found");

      // 2. State machine check (409)
      if (order.status !== "PENDING_VERIFICATION") {
        throw new HttpError(409, `Order is ${order.status}. Only PENDING_VERIFICATION orders can be approved`);
      }

      // 3. HARD STOP (422): any RED, missing or uncounted component blocks approval.
      // Recomputed from the numbers in the DB, not from the stored status column.
      const blocking = blockingItems(order.items);
      if (order.items.length === 0 || blocking.length > 0) {
        throw new HttpError(422, "Approval blocked: shortage or uncounted components", {
          blocking: blocking.map((i) => ({
            component: i.component.componentName,
            expected: i.expectedQty,
            actual: i.actualQty,
            state: itemStatus(i.actualQty, i.expectedQty),
          })),
        });
      }

      const wastage = wastagePct(
        Number(order.actualFabricYds),
        order.targetQty,
        Number(order.recipe.stdFabricYards),
      );

      // 4. Atomic claim: only one request can move PENDING -> VERIFIED
      const claimed = await tx.cuttingOrder.updateMany({
        where: { id: orderId, status: "PENDING_VERIFICATION" },
        data: { status: "VERIFIED" },
      });
      if (claimed.count !== 1) throw new HttpError(409, "Order was changed by someone else. Reload and try again");

      // 5. Audit row: verifier from session, timestamp default now() in the DB
      return tx.verificationLog.create({
        data: { orderId, verifierId: session.userId, decision: "APPROVED", wastagePct: wastage },
      });
    });

    return Response.json({
      ok: true,
      status: "VERIFIED",
      verifiedBy: log.verifierId,
      verifiedAt: log.timestamp,
      wastagePct: Number(log.wastagePct),
    });
  } catch (e) {
    return handleError(e);
  }
}