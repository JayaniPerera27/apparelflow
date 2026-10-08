import { Role } from "@/app/generated/prisma/client";

export const ROLE_HOME: Record<Role, string> = {
  cutting_supervisor: "/dashboard/orders",
  cutting_verifier: "/dashboard/verify",
  sewing_supervisor: "/dashboard/sewing",
};

export const ROLE_LABEL: Record<Role, string> = {
  cutting_supervisor: "Cutting Supervisor",
  cutting_verifier: "Cutting Verifier",
  sewing_supervisor: "Sewing Supervisor",
};

export const ROLE_WORKSPACE: Record<Role, string> = {
  cutting_supervisor: "Open cutting orders",
  cutting_verifier: "Open verification terminal",
  sewing_supervisor: "Open sewing queue",
};