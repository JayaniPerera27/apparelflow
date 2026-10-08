// Expected pieces for one component: 50 garments x 2 cuffs = 100
export function expectedQty(targetQty: number, piecesPerGarment: number): number {
  return targetQty * piecesPerGarment;
}

// Expected fabric for the whole batch, rounded to 2 decimals
export function expectedFabricYds(targetQty: number, stdFabricYards: number): number {
  return Math.round(targetQty * stdFabricYards * 100) / 100;
}

export type ItemStatus = "GREEN" | "YELLOW" | "RED";
export type ItemState = ItemStatus | "UNCOUNTED";

// Only for numbers that really were counted
export function countedStatus(actual: number, expected: number): ItemStatus {
  if (actual < expected) return "RED"; // shortage
  if (actual === expected) return "GREEN"; // exact match
  return "YELLOW"; // excess
}

export function itemStatus(actual: number | null | undefined, expected: number): ItemState {
  if (actual === null || actual === undefined) return "UNCOUNTED";
  return countedStatus(actual, expected);
}

type CountItem = { expectedQty: number; actualQty: number | null | undefined };

// Items that stop approval: RED or not counted yet
export function blockingItems<T extends CountItem>(items: T[]): T[] {
  return items.filter((i) => {
    const s = itemStatus(i.actualQty, i.expectedQty);
    return s === "RED" || s === "UNCOUNTED";
  });
}

export function canApprove(items: CountItem[]): boolean {
  return items.length > 0 && blockingItems(items).length === 0;
}

// ((actual - expected) / expected) x 100, rounded to 2 decimals
export function wastagePct(actualYds: number, qty: number, stdYds: number): number {
  const expected = qty * stdYds;
  return Math.round(((actualYds - expected) / expected) * 10000) / 100;
}