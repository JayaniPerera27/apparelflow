import Link from "next/link";
import { redirect } from "next/navigation";
import { Role } from "@/app/generated/prisma/client";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ROLE_HOME, ROLE_LABEL, ROLE_WORKSPACE } from "@/lib/roles";

type Stat = { label: string; value: number; hint: string; alert?: boolean };

async function getStats(role: Role, userId: number): Promise<Stat[]> {
  const count = (status: "PENDING_VERIFICATION" | "REJECTED" | "VERIFIED" | "SEWING_STARTED") =>
    prisma.cuttingOrder.count({ where: { status } });

  switch (role) {
    case Role.cutting_supervisor: {
      const [pending, rejected, verified, sewing] = await Promise.all([
        count("PENDING_VERIFICATION"),
        count("REJECTED"),
        count("VERIFIED"),
        count("SEWING_STARTED"),
      ]);
      return [
        { label: "Waiting for verification", value: pending, hint: "Batches at the QC station" },
        { label: "Rejected", value: rejected, hint: "Need re-cutting and resubmission", alert: rejected > 0 },
        { label: "Verified", value: verified, hint: "Released to the sewing queue" },
        { label: "Sewing started", value: sewing, hint: "On the assembly floor" },
      ];
    }

    case Role.cutting_verifier: {
      const [pending, approved, rejected] = await Promise.all([
        count("PENDING_VERIFICATION"),
        prisma.verificationLog.count({ where: { verifierId: userId, decision: "APPROVED" } }),
        prisma.verificationLog.count({ where: { verifierId: userId, decision: "REJECTED" } }),
      ]);
      return [
        { label: "Waiting for you", value: pending, hint: "Batches to count and verify", alert: pending > 0 },
        { label: "Approved by you", value: approved, hint: "All time" },
        { label: "Rejected by you", value: rejected, hint: "All time" },
      ];
    }

    case Role.sewing_supervisor: {
      // Only verified lineage. Pending and rejected counts are never queried for this role.
      const [queue, sewing] = await Promise.all([count("VERIFIED"), count("SEWING_STARTED")]);
      return [
        { label: "In the sewing queue", value: queue, hint: "Verified and ready to start", alert: queue > 0 },
        { label: "In assembly", value: sewing, hint: "Sewing already started" },
      ];
    }
  }
}

export default async function DashboardHome() {
  const session = await getSession();
  if (!session) redirect("/login");

  const stats = await getStats(session.role, session.userId);

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-indigo-700">
          {ROLE_LABEL[session.role]}
        </p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">Welcome, {session.fullName}</h1>
        <p className="mt-1 text-slate-700">Here is where things stand on the factory floor.</p>
        <Link href={ROLE_HOME[session.role]} className="btn-primary mt-4">
          {ROLE_WORKSPACE[session.role]}
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className={`card p-5 ${s.alert ? "border-amber-400" : ""}`}>
            <p className="text-sm font-medium text-slate-900">{s.label}</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{s.value}</p>
            <p className="mt-1 text-xs text-slate-700">{s.hint}</p>
          </div>
        ))}
      </div>
    </div>
  );
}