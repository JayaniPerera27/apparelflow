import { redirect } from "next/navigation";
import { Role } from "@/app/generated/prisma/client";
import { getSession } from "@/lib/auth";
import { getPendingOrders } from "@/lib/verify-queries";
import VerifyView from "./VerifyView";

export default async function VerifyPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== Role.cutting_verifier) redirect("/dashboard");

  const orders = await getPendingOrders();
  return <VerifyView orders={orders} />;
}