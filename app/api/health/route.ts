import { prisma } from "@/lib/prisma";

export async function GET() {
  const recipes = await prisma.recipe.count();
  return Response.json({ ok: true, recipes });
}