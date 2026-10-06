import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Role } from "../app/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  // ---- Users (demo credentials) ----
  const password = await bcrypt.hash("Demo@1234", 10);

  const users = [
    { email: "supervisor@apparelflow.test", fullName: "Nimal Cutting Supervisor", role: Role.cutting_supervisor },
    { email: "verifier@apparelflow.test", fullName: "Kamala Cutting Verifier", role: Role.cutting_verifier },
    { email: "sewing@apparelflow.test", fullName: "Sunil Sewing Supervisor", role: Role.sewing_supervisor },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: { ...u, passwordHash: password },
    });
  }

  // ---- Recipes ----
  const recipes = [
    {
      recipeCode: "REC-BL01",
      name: "Casual Blouse",
      category: "Blouse",
      stdFabricYards: 1.8,
      wastageCap: 5.0,
      components: [
        { componentName: "Front Body Panel", piecesPerGarment: 1 },
        { componentName: "Back Body Panel", piecesPerGarment: 1 },
        { componentName: "Sleeves (Left & Right)", piecesPerGarment: 2 },
        { componentName: "Collar & Stand", piecesPerGarment: 1 },
        { componentName: "Sleeve Cuffs", piecesPerGarment: 2 },
      ],
    },
    {
      recipeCode: "REC-CT02",
      name: "Crop Top",
      category: "Crop Top",
      stdFabricYards: 1.1,
      wastageCap: 8.0,
      components: [
        { componentName: "Front Chest Panel", piecesPerGarment: 1 },
        { componentName: "Back Support Panel", piecesPerGarment: 1 },
        { componentName: "Neck Binding Strip", piecesPerGarment: 1 },
        { componentName: "Hem Elastic Casing", piecesPerGarment: 1 },
        { componentName: "Side Strap Accents", piecesPerGarment: 2 },
      ],
    },
  ];

  for (const r of recipes) {
    const { components, ...data } = r;
    const existing = await prisma.recipe.findUnique({ where: { recipeCode: data.recipeCode } });
    if (existing) continue; // already seeded

    await prisma.recipe.create({
      data: { ...data, components: { create: components } },
    });
  }

  console.log("Seed complete");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());