import { redirect } from "next/navigation";
import { Role } from "@/app/generated/prisma/client";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { OrderDTO, RecipeDTO } from "@/lib/types";
import OrdersView from "./OrdersView";

export default async function OrdersPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== Role.cutting_supervisor) redirect("/dashboard");

  const [orderRows, recipeRows] = await Promise.all([
    prisma.cuttingOrder.findMany({
      orderBy: { createdAt: "desc" },
      include: { recipe: true, logs: { orderBy: { timestamp: "desc" }, take: 1 } },
    }),
    prisma.recipe.findMany({
      orderBy: { recipeCode: "asc" },
      include: { components: { orderBy: { id: "asc" } } },
    }),
  ]);

  // Decimal and Date are not serializable, so convert them first
  const orders: OrderDTO[] = orderRows.map((o) => ({
    id: o.id,
    orderNo: o.orderNo,
    recipeCode: o.recipe.recipeCode,
    recipeName: o.recipe.name,
    targetQty: o.targetQty,
    fabricRollId: o.fabricRollId,
    actualFabricYds: Number(o.actualFabricYds),
    status: o.status,
    createdAt: o.createdAt.toISOString(),
    rejectionNote: o.status === "REJECTED" ? (o.logs[0]?.rejectionNote ?? null) : null,
  }));

  const recipes: RecipeDTO[] = recipeRows.map((r) => ({
    id: r.id,
    recipeCode: r.recipeCode,
    name: r.name,
    stdFabricYards: Number(r.stdFabricYards),
    components: r.components.map((c) => ({
      id: c.id,
      componentName: c.componentName,
      piecesPerGarment: c.piecesPerGarment,
    })),
  }));

  return <OrdersView orders={orders} recipes={recipes} />;
}