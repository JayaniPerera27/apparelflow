import { Role } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole, handleError, HttpError } from "@/lib/rbac";
import { createOrderSchema } from "@/lib/schemas";
import { validationError } from "@/lib/http";
import { expectedQty } from "@/lib/domain";

export async function POST(req: Request) {
  try {
    // 1. Authorization first (401 / 403)
    const session = await requireRole([Role.cutting_supervisor]);

    // 2. Validation (400)
    const body = await req.json().catch(() => null);
    if (body === null || typeof body !== "object") {
      throw new HttpError(400, "Request body must be valid JSON");
    }
    const parsed = createOrderSchema.safeParse(body);
    if (!parsed.success) return validationError(parsed.error);
    const { recipeId, targetQty, fabricRollId, actualFabricYds } = parsed.data;

    // 3. Recipe must exist (404)
    const recipe = await prisma.recipe.findUnique({
      where: { id: recipeId },
      include: { components: true },
    });
    if (!recipe) throw new HttpError(404, "Recipe not found");

    // 4. Create order + verification items in ONE transaction
    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.cuttingOrder.create({
        data: {
          orderNo: `TMP-${crypto.randomUUID()}`, // replaced below
          recipeId,
          targetQty,
          fabricRollId,
          actualFabricYds,
          status: "PENDING_VERIFICATION",
          createdById: session.userId, // from JWT, never from the body
          items: {
            create: recipe.components.map((c) => ({
              componentId: c.id,
              expectedQty: expectedQty(targetQty, c.piecesPerGarment),
            })),
          },
        },
      });

      // order_no derived from the unique id, so no duplicates under concurrency
      return tx.cuttingOrder.update({
        where: { id: created.id },
        data: { orderNo: `CUT-${String(created.id).padStart(4, "0")}` },
        include: {
          recipe: true,
          items: { include: { component: true }, orderBy: { id: "asc" } },
        },
      });
    });

    return Response.json({ order }, { status: 201 });
  } catch (e) {
    return handleError(e);
  }
}

export async function GET() {
  try {
    await requireRole([Role.cutting_supervisor]);

    const orders = await prisma.cuttingOrder.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        recipe: true,
        // latest decision, so the supervisor can see the rejection note
        logs: { orderBy: { timestamp: "desc" }, take: 1 },
      },
    });

    return Response.json({ orders });
  } catch (e) {
    return handleError(e);
  }
}