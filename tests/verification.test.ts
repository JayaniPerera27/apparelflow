import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { Role } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { POST as approve } from "@/app/api/verify/[orderId]/approve/route";
import { POST as reject } from "@/app/api/verify/[orderId]/reject/route";
import { POST as saveCounts } from "@/app/api/verify/[orderId]/count/route";
import { GET as sewingQueue } from "@/app/api/sewing/queue/route";
import { POST as startSewing } from "@/app/api/sewing/[orderId]/start/route";
import { POST as createOrderApi } from "@/app/api/orders/route";
import { QTY, createOrder, ctx, loggedOut, loginAs, post, setupFixtures, statusOf, type Fixtures } from "./helpers";

// Replace only the session lookup. requireRole and every route handler stay real.
vi.mock("@/lib/auth", () => ({ getSession: vi.fn() }));

let fx: Fixtures;

beforeAll(async () => {
  fx = await setupFixtures();
});

afterAll(async () => {
  await prisma.$disconnect();
});

beforeEach(() => {
  loggedOut();
});

const approveOrder = (id: number, body?: unknown) => approve(post(`/api/verify/${id}/approve`, body), ctx(id));
const rejectOrder = (id: number, body?: unknown) => reject(post(`/api/verify/${id}/reject`, body), ctx(id));
const logsOf = (orderId: number) => prisma.verificationLog.findMany({ where: { orderId } });

describe("Test 1: approval of a fully counted order", () => {
  it("approves when every component is GREEN", async () => {
    const order = await createOrder(fx, [10, 20]);
    loginAs(fx, Role.cutting_verifier);

    const res = await approveOrder(order.id);

    expect(res.status).toBe(200);
    expect(await statusOf(order.id)).toBe("VERIFIED");

    const [log] = await logsOf(order.id);
    expect(log.decision).toBe("APPROVED");
    expect(log.verifierId).toBe(fx.users.cutting_verifier.id);
    expect(Number(log.wastagePct)).toBe(0);
    expect(log.timestamp).toBeInstanceOf(Date);
  });

  it("allows YELLOW (excess) components", async () => {
    const order = await createOrder(fx, [12, 25]);
    loginAs(fx, Role.cutting_verifier);

    expect((await approveOrder(order.id)).status).toBe(200);
    expect(await statusOf(order.id)).toBe("VERIFIED");
  });

  it("returns 409 on a second approval", async () => {
    const order = await createOrder(fx, [10, 20]);
    loginAs(fx, Role.cutting_verifier);

    expect((await approveOrder(order.id)).status).toBe(200);
    expect((await approveOrder(order.id)).status).toBe(409);
    expect(await logsOf(order.id)).toHaveLength(1);
  });

  it("ignores a verifierId sent in the request body", async () => {
    const order = await createOrder(fx, [10, 20]);
    loginAs(fx, Role.cutting_verifier);

    await approveOrder(order.id, { verifierId: fx.users.cutting_supervisor.id, status: "VERIFIED" });

    const [log] = await logsOf(order.id);
    expect(log.verifierId).toBe(fx.users.cutting_verifier.id);
  });
});

describe("Test 2: hard stop on shortage", () => {
  it("returns 422 and keeps the order pending when one component is RED", async () => {
    const order = await createOrder(fx, [10, 18]); // cuffs: 18 of 20
    loginAs(fx, Role.cutting_verifier);

    const res = await approveOrder(order.id);
    const body = await res.json();

    expect(res.status).toBe(422);
    expect(body.blocking).toHaveLength(1);
    expect(body.blocking[0].state).toBe("RED");
    expect(await statusOf(order.id)).toBe("PENDING_VERIFICATION");
    expect(await logsOf(order.id)).toHaveLength(0);
  });

  it("returns 422 when a component is uncounted", async () => {
    const order = await createOrder(fx, [10, null]);
    loginAs(fx, Role.cutting_verifier);

    expect((await approveOrder(order.id)).status).toBe(422);
    expect(await statusOf(order.id)).toBe("PENDING_VERIFICATION");
  });

  it("returns 422 when nothing was counted", async () => {
    const order = await createOrder(fx, [null, null]);
    loginAs(fx, Role.cutting_verifier);

    expect((await approveOrder(order.id)).status).toBe(422);
  });

  it("does not trust a tampered status column", async () => {
    const order = await createOrder(fx, [10, 18]);
    // someone edits the stored status to GREEN, but the numbers still show a shortage
    await prisma.verificationItem.updateMany({ where: { orderId: order.id }, data: { status: "GREEN" } });
    loginAs(fx, Role.cutting_verifier);

    expect((await approveOrder(order.id)).status).toBe(422);
  });
});

describe("Test 3: rejection needs a reason", () => {
  it("rejects an empty body, a blank reason and a too-short reason", async () => {
    const order = await createOrder(fx, [10, 18]);
    loginAs(fx, Role.cutting_verifier);

    expect((await rejectOrder(order.id, {})).status).toBe(400);
    expect((await rejectOrder(order.id, { reason: "     " })).status).toBe(400);
    expect((await rejectOrder(order.id, { reason: "abc" })).status).toBe(400);

    expect(await statusOf(order.id)).toBe("PENDING_VERIFICATION");
    expect(await logsOf(order.id)).toHaveLength(0);
  });

  it("rejects the batch when a reason is given", async () => {
    const order = await createOrder(fx, [10, 18]);
    loginAs(fx, Role.cutting_verifier);

    const res = await rejectOrder(order.id, { reason: "2 sleeve cuffs short" });

    expect(res.status).toBe(200);
    expect(await statusOf(order.id)).toBe("REJECTED");
    const [log] = await logsOf(order.id);
    expect(log.decision).toBe("REJECTED");
    expect(log.rejectionNote).toBe("2 sleeve cuffs short");
    expect(log.verifierId).toBe(fx.users.cutting_verifier.id);
  });
});

describe("Test 4: role enforcement", () => {
  it("returns 403 when a non-verifier tries to approve", async () => {
    const order = await createOrder(fx, [10, 20]);

    for (const role of [Role.cutting_supervisor, Role.sewing_supervisor]) {
      loginAs(fx, role);
      expect((await approveOrder(order.id)).status).toBe(403);
    }

    expect(await statusOf(order.id)).toBe("PENDING_VERIFICATION");
  });

  it("returns 403 when a non-verifier tries to reject or save counts", async () => {
    const order = await createOrder(fx, [10, 20]);
    loginAs(fx, Role.cutting_supervisor);

    expect((await rejectOrder(order.id, { reason: "not allowed" })).status).toBe(403);
    const counts = { counts: [{ componentId: fx.recipe.components[0].id, actualQty: 1 }] };
    expect((await saveCounts(post(`/api/verify/${order.id}/count`, counts), ctx(order.id))).status).toBe(403);
  });

  it("returns 401 when nobody is logged in", async () => {
    const order = await createOrder(fx, [10, 20]);
    expect((await approveOrder(order.id)).status).toBe(401);
  });

  it("returns 403 when a verifier tries to create a cutting order", async () => {
    loginAs(fx, Role.cutting_verifier);
    const body = { recipeId: fx.recipe.id, targetQty: QTY, fabricRollId: "TEST-ROLL", actualFabricYds: 18 };
    expect((await createOrderApi(post("/api/orders", body))).status).toBe(403);
  });
});

describe("Input validation", () => {
  it("rejects negative, decimal and string counts", async () => {
    const order = await createOrder(fx, [null, null]);
    const componentId = fx.recipe.components[0].id;
    loginAs(fx, Role.cutting_verifier);

    for (const actualQty of [-1, 2.5, "5"]) {
      const res = await saveCounts(post(`/api/verify/${order.id}/count`, { counts: [{ componentId, actualQty }] }), ctx(order.id));
      expect(res.status).toBe(400);
    }

    const items = await prisma.verificationItem.findMany({ where: { orderId: order.id } });
    expect(items.every((i) => i.actualQty === null)).toBe(true);
  });

  it("saves valid counts and computes the status on the server", async () => {
    const order = await createOrder(fx, [null, null]);
    const [front, cuffs] = fx.recipe.components;
    loginAs(fx, Role.cutting_verifier);

    const res = await saveCounts(
      post(`/api/verify/${order.id}/count`, {
        counts: [
          { componentId: front.id, actualQty: 10 },
          { componentId: cuffs.id, actualQty: 19 },
        ],
      }),
      ctx(order.id),
    );

    expect(res.status).toBe(200);
    const items = await prisma.verificationItem.findMany({ where: { orderId: order.id }, orderBy: { id: "asc" } });
    expect(items.map((i) => i.status)).toEqual(["GREEN", "RED"]);
  });

  it("rejects unknown keys such as status when creating an order", async () => {
    loginAs(fx, Role.cutting_supervisor);
    const body = { recipeId: fx.recipe.id, targetQty: QTY, fabricRollId: "TEST-ROLL", actualFabricYds: 18, status: "VERIFIED" };
    expect((await createOrderApi(post("/api/orders", body))).status).toBe(400);
  });

  it("rejects negative, decimal, string and empty order input", async () => {
    loginAs(fx, Role.cutting_supervisor);
    const good = { recipeId: fx.recipe.id, targetQty: QTY, fabricRollId: "TEST-ROLL", actualFabricYds: 18 };

    for (const bad of [{}, { ...good, targetQty: -5 }, { ...good, targetQty: 2.5 }, { ...good, targetQty: "10" }, { ...good, actualFabricYds: 0 }]) {
      expect((await createOrderApi(post("/api/orders", bad))).status).toBe(400);
    }
  });

  it("creates an order with server-derived expected counts", async () => {
    loginAs(fx, Role.cutting_supervisor);
    const body = { recipeId: fx.recipe.id, targetQty: QTY, fabricRollId: "TEST-ROLL", actualFabricYds: 18 };

    const res = await createOrderApi(post("/api/orders", body));
    const { order } = await res.json();

    expect(res.status).toBe(201);
    expect(order.status).toBe("PENDING_VERIFICATION");
    expect(order.createdById).toBe(fx.users.cutting_supervisor.id);
    expect(order.items.map((i: { expectedQty: number }) => i.expectedQty)).toEqual([10, 20]);
  });
});

describe("Test 5: sewing queue isolation", () => {
  it("lists only VERIFIED orders and ignores URL parameters", async () => {
    const pending = await createOrder(fx, [10, 20]);
    const rejected = await createOrder(fx, [10, 18]);
    const verified = await createOrder(fx, [10, 20]);

    loginAs(fx, Role.cutting_verifier);
    expect((await approveOrder(verified.id)).status).toBe(200);
    expect((await rejectOrder(rejected.id, { reason: "2 cuffs short" })).status).toBe(200);

    loginAs(fx, Role.sewing_supervisor);
    const res = await sewingQueue(new Request("http://localhost/api/sewing/queue?status=PENDING_VERIFICATION"));
    const { orders } = await res.json();
    const ids = orders.map((o: { id: number }) => o.id);

    expect(res.status).toBe(200);
    expect(ids).toContain(verified.id);
    expect(ids).not.toContain(pending.id);
    expect(ids).not.toContain(rejected.id);
    expect(orders.every((o: { status: string }) => o.status === "VERIFIED")).toBe(true);

    const entry = orders.find((o: { id: number }) => o.id === verified.id);
    expect(entry.verifiedById).toBe(fx.users.cutting_verifier.id);
    expect(entry.wastagePct).toBe(0);
  });

  it("blocks other roles and anonymous users from the queue", async () => {
    for (const role of [Role.cutting_supervisor, Role.cutting_verifier]) {
      loginAs(fx, role);
      expect((await sewingQueue(new Request("http://localhost/api/sewing/queue"))).status).toBe(403);
    }

    loggedOut();
    expect((await sewingQueue(new Request("http://localhost/api/sewing/queue"))).status).toBe(401);
  });
});

describe("Sewing start", () => {
  it("starts sewing only for VERIFIED orders", async () => {
    const order = await createOrder(fx, [10, 20], "VERIFIED");
    loginAs(fx, Role.sewing_supervisor);

    expect((await startSewing(post(`/api/sewing/${order.id}/start`), ctx(order.id))).status).toBe(200);
    expect(await statusOf(order.id)).toBe("SEWING_STARTED");
    expect((await startSewing(post(`/api/sewing/${order.id}/start`), ctx(order.id))).status).toBe(409);
  });

  it("answers 404 for unverified orders so their existence is not leaked", async () => {
    const pending = await createOrder(fx, [10, 20]);
    const rejected = await createOrder(fx, [10, 18], "REJECTED");
    loginAs(fx, Role.sewing_supervisor);

    for (const o of [pending, rejected]) {
      expect((await startSewing(post(`/api/sewing/${o.id}/start`), ctx(o.id))).status).toBe(404);
    }
    expect(await statusOf(pending.id)).toBe("PENDING_VERIFICATION");
  });

  it("returns 403 for other roles", async () => {
    const order = await createOrder(fx, [10, 20], "VERIFIED");
    loginAs(fx, Role.cutting_verifier);

    expect((await startSewing(post(`/api/sewing/${order.id}/start`), ctx(order.id))).status).toBe(403);
    expect(await statusOf(order.id)).toBe("VERIFIED");
  });
});