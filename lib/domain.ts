// Expected pieces for one component: 50 garments x 2 cuffs = 100
export function expectedQty(targetQty: number, piecesPerGarment: number): number {
  return targetQty * piecesPerGarment;
}

// Expected fabric for the whole batch, rounded to 2 decimals
export function expectedFabricYds(targetQty: number, stdFabricYards: number): number {
  return Math.round(targetQty * stdFabricYards * 100) / 100;
}