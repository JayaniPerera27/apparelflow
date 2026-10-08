import { Role } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole, handleError, HttpError } from "@/lib/rbac";
import { rejectSchema } from "@/lib/schemas";
import { validationError, parseId } from "@/lib/http";

export async function POST(req: Request, { params }: { params: Promise<{ orderId: string }> }) {
  try {
    const session = await requireRole([Role.cutting_verifier]);
    const orderId = parseId((await params).orderId);

    const body = await req.json().catch(() => null);
    const parsed = rejectSchema.safeParse(body);
    if (!parsed.success) return validationError(parsed.error);

    await prisma.$transaction(async (tx) => {
      const order = await tx.cuttingOrder.findUnique({ where: { id: orderId } });
      if (!order) throw new HttpError(404, "Order not found");
      if (order.status !== "PENDING_VERIFICATION") {
        throw new HttpError(409, `Order is ${order.status}. Only PENDING_VERIFICATION orders can be rejected`);
      }

      const claimed = await tx.cuttingOrder.updateMany({
        where: { id: orderId, status: "PENDING_VERIFICATION" },
        data: { status: "REJECTED" },
      });
      if (claimed.count !== 1) throw new HttpError(409, "Order was changed by someone else. Reload and try again");

      await tx.verificationLog.create({
        data: {
          orderId,
          verifierId: session.userId,
          decision: "REJECTED",
          rejectionNote: parsed.data.reason,
        },
      });
    });

    return Response.json({ ok: true, status: "REJECTED" });
  } catch (e) {
    return handleError(e);
  }
}