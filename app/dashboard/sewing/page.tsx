import { redirect } from "next/navigation";
import { Role } from "@/app/generated/prisma/client";
import { getSession } from "@/lib/auth";
import { getSewingOrders } from "@/lib/sewing-queries";
import SewingView from "./SewingView";

export default async function SewingPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== Role.sewing_supervisor) redirect("/dashboard");

  const [queue, inAssembly] = await Promise.all([
    getSewingOrders("VERIFIED"),
    getSewingOrders("SEWING_STARTED"),
  ]);

  return <SewingView queue={queue} inAssembly={inAssembly} />;
}