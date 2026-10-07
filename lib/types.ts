export type RecipeDTO = {
  id: number;
  recipeCode: string;
  name: string;
  stdFabricYards: number;
  components: { id: number; componentName: string; piecesPerGarment: number }[];
};

export type OrderStatusDTO = "PENDING_VERIFICATION" | "REJECTED" | "VERIFIED" | "SEWING_STARTED";

export type OrderDTO = {
  id: number;
  orderNo: string;
  recipeCode: string;
  recipeName: string;
  targetQty: number;
  fabricRollId: string;
  actualFabricYds: number;
  status: OrderStatusDTO;
  createdAt: string;
  rejectionNote: string | null;
};