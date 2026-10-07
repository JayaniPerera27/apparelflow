import { Role } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole, handleError } from "@/lib/rbac";

export async function GET() {
  try {
    await requireRole([Role.cutting_supervisor]);

    const recipes = await prisma.recipe.findMany({
      orderBy: { recipeCode: "asc" },
      include: { components: { orderBy: { id: "asc" } } },
    });

    return Response.json({ recipes });
  } catch (e) {
    return handleError(e);
  }
}