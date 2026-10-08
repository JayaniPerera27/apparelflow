import { randomUUID } from "node:crypto";
import { vi } from "vitest";
import { Role, type OrderStatus } from "@/app/generated/prisma/client";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { countedStatus } from "@/lib/domain";

export const QTY = 10;
export const ACTUAL_FABRIC = 18; // 10 x 1.8 yds = 18 expected, so 0% wastage

export type Fixtures = Awaited<ReturnType<typeof setupFixtures>>;

// Users and one recipe, created once and reused (upsert, so safe to run again)
export async function setupFixtures() {
  const users = {} as Record<Role, { id: number; email: string; fullName: string }>;

  for (const role of Object.values(Role)) {
    const email = `test-${role}@apparelflow.test`;
    const u = await prisma.user.upsert({
      where: { email },
      update: {},
      create: { email, passwordHash: "not-a-real-hash", role, fullName: `Test ${role}` },
    });
    users[role] = { id: u.id, email, fullName: u.fullName };
  }

  const recipe = await prisma.recipe.upsert({
    where: { recipeCode: "TEST-REC" },
    update: {},
    create: {
      recipeCode: "TEST-REC",
      name: "Test Garment",
      category: "Test",
      stdFabricYards: 1.8,
      wastageCap: 5,
      components: {
        create: [
          { componentName: "Front Panel", piecesPerGarment: 1 },
          { componentName: "Sleeve Cuffs", piecesPerGarment: 2 },
        ],
      },
    },
    include: { components: { orderBy: { id: "asc" } } },
  });

  return { users, recipe };
}

export function loginAs(fx: Fixtures, role: Role) {
  const u = fx.users[role];
  vi.mocked(getSession).mockResolvedValue({ userId: u.id, role, email: u.email, fullName: u.fullName });
}

export function loggedOut() {
  vi.mocked(getSession).mockResolvedValue(null);
}

// counts: one entry per component in recipe order (null = not counted yet)
// expected counts for QTY=10 are [10, 20]
export async function createOrder(
  fx: Fixtures,
  counts: (number | null)[],
  status: OrderStatus = "PENDING_VERIFICATION",
) {
  return prisma.cuttingOrder.create({
    data: {
      orderNo: `TEST-${randomUUID().slice(0, 8)}`,
      recipeId: fx.recipe.id,
      targetQty: QTY,
      fabricRollId: "TEST-ROLL",
      actualFabricYds: ACTUAL_FABRIC,
      status,
      createdById: fx.users.cutting_supervisor.id,
      items: {
        create: fx.recipe.components.map((c, i) => {
          const expected = QTY * c.piecesPerGarment;
          const actual = counts[i] ?? null;
          return {
            componentId: c.id,
            expectedQty: expected,
            actualQty: actual,
            status: actual === null ? null : countedStatus(actual, expected),
          };
        }),
      },
    },
  });
}

export const ctx = (id: number) => ({ params: Promise.resolve({ orderId: String(id) }) });

export const post = (path: string, body?: unknown) =>
  new Request(`http://localhost${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

export const statusOf = async (id: number) =>
  (await prisma.cuttingOrder.findUniqueOrThrow({ where: { id } })).status;