import { prisma } from "@/lib/prisma";
import type { SewingOrderDTO } from "@/lib/types";

// The status is a typed argument chosen in code. It never comes from a request.
export type SewingStatus = "VERIFIED" | "SEWING_STARTED";

export async function getSewingOrders(status: SewingStatus): Promise<SewingOrderDTO[]> {
  const rows = await prisma.cuttingOrder.findMany({
    where: { status },
    orderBy: { updatedAt: "asc" },
    include: {
      recipe: true,
      items: { include: { component: true }, orderBy: { id: "asc" } },
      logs: {
        orderBy: { timestamp: "asc" },
        // only the name, never the email or password hash
        include: { verifier: { select: { fullName: true } } },
      },
    },
  });

  return rows.map((o) => {
    const approved = [...o.logs].reverse().find((l) => l.decision === "APPROVED") ?? null;

    return {
      id: o.id,
      orderNo: o.orderNo,
      status,
      recipeCode: o.recipe.recipeCode,
      recipeName: o.recipe.name,
      targetQty: o.targetQty,
      fabricRollId: o.fabricRollId,
      actualFabricYds: Number(o.actualFabricYds),
      wastageCap: Number(o.recipe.wastageCap),
      // audit values stored at approval time, not recomputed
      verifiedById: approved?.verifierId ?? null,
      verifiedByName: approved?.verifier.fullName ?? null,
      verifiedAt: approved ? approved.timestamp.toISOString() : null,
      wastagePct: approved?.wastagePct != null ? Number(approved.wastagePct) : null,
      items: o.items.map((i) => ({
        componentName: i.component.componentName,
        expectedQty: i.expectedQty,
        actualQty: i.actualQty,
      })),
      history: o.logs.map((l) => ({
        decision: l.decision,
        note: l.rejectionNote,
        byName: l.verifier.fullName,
        at: l.timestamp.toISOString(),
      })),
    };
  });
}