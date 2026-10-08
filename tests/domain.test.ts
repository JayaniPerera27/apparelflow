import { describe, expect, it } from "vitest";
import {
  blockingItems,
  canApprove,
  expectedFabricYds,
  expectedQty,
  itemStatus,
  wastagePct,
} from "@/lib/domain";

describe("multiplier engine", () => {
  it("multiplies garments by pieces per garment", () => {
    expect(expectedQty(50, 2)).toBe(100);
    expect(expectedQty(50, 1)).toBe(50);
  });

  it("derives expected fabric", () => {
    expect(expectedFabricYds(50, 1.8)).toBe(90);
    expect(expectedFabricYds(50, 1.1)).toBe(55);
  });
});

describe("traffic light", () => {
  it("is GREEN on an exact match", () => expect(itemStatus(100, 100)).toBe("GREEN"));
  it("is YELLOW on excess", () => expect(itemStatus(101, 100)).toBe("YELLOW"));
  it("is RED on shortage", () => expect(itemStatus(99, 100)).toBe("RED"));
  it("treats zero as a real count (RED)", () => expect(itemStatus(0, 100)).toBe("RED"));
  it("is UNCOUNTED for null and undefined", () => {
    expect(itemStatus(null, 100)).toBe("UNCOUNTED");
    expect(itemStatus(undefined, 100)).toBe("UNCOUNTED");
  });
});

describe("approval rule", () => {
  it("allows GREEN and YELLOW", () => {
    expect(canApprove([{ expectedQty: 10, actualQty: 10 }, { expectedQty: 20, actualQty: 25 }])).toBe(true);
  });

  it("blocks when any component is RED", () => {
    expect(canApprove([{ expectedQty: 10, actualQty: 10 }, { expectedQty: 20, actualQty: 19 }])).toBe(false);
  });

  it("blocks when any component is uncounted", () => {
    expect(canApprove([{ expectedQty: 10, actualQty: 10 }, { expectedQty: 20, actualQty: null }])).toBe(false);
  });

  it("blocks an order with no items", () => {
    expect(canApprove([])).toBe(false);
  });

  it("lists the blocking items", () => {
    const items = [
      { expectedQty: 10, actualQty: 10 },
      { expectedQty: 20, actualQty: 19 },
      { expectedQty: 5, actualQty: null },
    ];
    expect(blockingItems(items)).toHaveLength(2);
  });
});

describe("fabric wastage", () => {
  it("is 0 when actual equals expected", () => expect(wastagePct(18, 10, 1.8)).toBe(0));
  it("is positive when more fabric was used", () => expect(wastagePct(19.8, 10, 1.8)).toBe(10));
  it("is negative when less fabric was used", () => expect(wastagePct(17.1, 10, 1.8)).toBe(-5));
});