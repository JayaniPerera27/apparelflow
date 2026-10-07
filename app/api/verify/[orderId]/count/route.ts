import { Role } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole, handleError, HttpError } from "@/lib/rbac";
import { countSchema } from "@/lib/schemas";
import { validationError, parseId } from "@/lib/http";
import { countedStatus } from "@/lib/domain";

export async function POST(req: Request, { params }: { params: Promise<{ orderId: string }> }) {
  try {
    await requireRole([Role.cutting_verifier]);
    const orderId = parseId((await params).orderId);

    const body = await req.json().catch(() => null);
    const parsed = countSchema.safeParse(body);
    if (!parsed.success) return validationError(parsed.error);
    const { counts } = parsed.data;

    const ids = counts.map((c) => c.componentId);
    if (new Set(ids).size !== ids.length) throw new HttpError(400, "Duplicate component in counts");

    await prisma.$transaction(async (tx) => {
      const order = await tx.cuttingOrder.findUnique({
        where: { id: orderId },
        include: { items: true },
      });
      if (!order) throw new HttpError(404, "Order not found");
      if (order.status !== "PENDING_VERIFICATION") {
        throw new HttpError(409, `Order is ${order.status}. Counts can only change while pending verification`);
      }

      const byComponent = new Map(order.items.map((i) => [i.componentId, i]));
      for (const c of counts) {
        const item = byComponent.get(c.componentId);
        if (!item) throw new HttpError(400, `Component ${c.componentId} does not belong to this order`);

        await tx.verificationItem.update({
          where: { id: item.id },
          // status is computed here on the server, never taken from the client
          data: { actualQty: c.actualQty, status: countedStatus(c.actualQty, item.expectedQty) },
        });
      }
    });

    return Response.json({ ok: true });
  } catch (e) {
    return handleError(e);
  }
}