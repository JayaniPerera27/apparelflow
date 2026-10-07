import { prisma } from "@/lib/prisma";
import type { PendingOrderDTO } from "@/lib/types";

export async function getPendingOrders(): Promise<PendingOrderDTO[]> {
  const rows = await prisma.cuttingOrder.findMany({
    where: { status: "PENDING_VERIFICATION" },
    orderBy: { createdAt: "asc" },
    include: {
      recipe: true,
      items: { include: { component: true }, orderBy: { id: "asc" } },
    },
  });

  return rows.map((o) => ({
    id: o.id,
    orderNo: o.orderNo,
    recipeCode: o.recipe.recipeCode,
    recipeName: o.recipe.name,
    targetQty: o.targetQty,
    fabricRollId: o.fabricRollId,
    actualFabricYds: Number(o.actualFabricYds),
    stdFabricYards: Number(o.recipe.stdFabricYards),
    wastageCap: Number(o.recipe.wastageCap),
    createdAt: o.createdAt.toISOString(),
    items: o.items.map((i) => ({
      componentId: i.componentId,
      componentName: i.component.componentName,
      expectedQty: i.expectedQty,
      actualQty: i.actualQty,
    })),
  }));
}