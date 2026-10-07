import { Role } from "@/app/generated/prisma/client";

export const ROLE_HOME: Record<Role, string> = {
  cutting_supervisor: "/dashboard/orders",
  cutting_verifier: "/dashboard/verify",
  sewing_supervisor: "/dashboard/sewing",
};