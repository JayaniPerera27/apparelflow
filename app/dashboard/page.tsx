import Link from "next/link";
import { redirect } from "next/navigation";
import { Role } from "@/app/generated/prisma/client";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ROLE_HOME, ROLE_LABEL, ROLE_WORKSPACE } from "@/lib/roles";

type Stat = { label: string; value: number; hint: string; alert?: boolean; colorTheme?: string };

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
        { 
          label: "Waiting for verification", 
          value: pending, 
          hint: "Batches at the QC station",
          colorTheme: "amber"
        },
        { 
          label: "Rejected", 
          value: rejected, 
          hint: "Need re-cutting and resubmission", 
          alert: rejected > 0,
          colorTheme: "rose"
        },
        { 
          label: "Verified", 
          value: verified, 
          hint: "Released to the sewing queue",
          colorTheme: "emerald"
        },
        { 
          label: "Sewing started", 
          value: sewing, 
          hint: "On the assembly floor",
          colorTheme: "indigo"
        },
      ];
    }

    case Role.cutting_verifier: {
      const [pending, approved, rejected] = await Promise.all([
        count("PENDING_VERIFICATION"),
        prisma.verificationLog.count({ where: { verifierId: userId, decision: "APPROVED" } }),
        prisma.verificationLog.count({ where: { verifierId: userId, decision: "REJECTED" } }),
      ]);
      return [
        { 
          label: "Waiting for you", 
          value: pending, 
          hint: "Batches to count and verify", 
          alert: pending > 0,
          colorTheme: "amber"
        },
        { 
          label: "Approved by you", 
          value: approved, 
          hint: "All time",
          colorTheme: "emerald"
        },
        { 
          label: "Rejected by you", 
          value: rejected, 
          hint: "All time",
          colorTheme: "rose"
        },
      ];
    }

    case Role.sewing_supervisor: {
      const [queue, sewing] = await Promise.all([count("VERIFIED"), count("SEWING_STARTED")]);
      return [
        { 
          label: "In the sewing queue", 
          value: queue, 
          hint: "Verified and ready to start", 
          alert: queue > 0,
          colorTheme: "emerald"
        },
        { 
          label: "In assembly", 
          value: sewing, 
          hint: "Sewing already started",
          colorTheme: "indigo"
        },
      ];
    }
  }
}

// Color mapping helper for dynamic card highlights
const cardStyles: Record<string, { cardBg: string; textVal: string; badgeBg: string; icon: string }> = {
  amber: {
    cardBg: "border-amber-200/80 bg-gradient-to-br from-amber-50/60 via-white to-amber-50/20",
    textVal: "text-amber-950",
    badgeBg: "bg-amber-100 border-amber-200 text-amber-800",
    icon: "⏳",
  },
  rose: {
    cardBg: "border-rose-200/80 bg-gradient-to-br from-rose-50/60 via-white to-rose-50/20",
    textVal: "text-rose-950",
    badgeBg: "bg-rose-100 border-rose-200 text-rose-800",
    icon: "⚠️",
  },
  emerald: {
    cardBg: "border-emerald-200/80 bg-gradient-to-br from-emerald-50/60 via-white to-emerald-50/20",
    textVal: "text-emerald-950",
    badgeBg: "bg-emerald-100 border-emerald-200 text-emerald-800",
    icon: "✓",
  },
  indigo: {
    cardBg: "border-indigo-200/80 bg-gradient-to-br from-indigo-50/60 via-white to-indigo-50/20",
    textVal: "text-indigo-950",
    badgeBg: "bg-indigo-100 border-indigo-200 text-indigo-800",
    icon: "🧵",
  },
};

export default async function DashboardHome() {
  const session = await getSession();
  if (!session) redirect("/login");

  const stats = await getStats(session.role, session.userId);

  return (
    <div className="space-y-8">
      {/* Welcome Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 p-8 text-white shadow-xl shadow-indigo-950/10">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl">
          <span className="inline-block px-3 py-1 text-xs font-semibold uppercase tracking-wider text-indigo-300 bg-indigo-950/70 rounded-full border border-indigo-700/50 mb-3">
            {ROLE_LABEL[session.role]}
          </span>
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Welcome, {session.fullName}
          </h1>
          <p className="mt-2 text-indigo-200/80 text-sm sm:text-base font-normal">
            Here is where things stand on the factory floor.
          </p>
          <div className="mt-6">
            <Link
              href={ROLE_HOME[session.role]}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all duration-200 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98]"
            >
              {ROLE_WORKSPACE[session.role]} →
            </Link>
          </div>
        </div>
      </div>

      {/* Dynamic Metric Cards Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => {
          const themeKey = s.colorTheme || (s.alert ? "rose" : "indigo");
          const style = cardStyles[themeKey] || cardStyles.indigo;

          return (
            <div
              key={s.label}
              className={`relative overflow-hidden rounded-2xl border p-6 shadow-sm hover:shadow-md transition-all duration-200 ${
                s.alert ? "border-amber-400 ring-2 ring-amber-400/20" : style.cardBg
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-semibold text-slate-800">{s.label}</span>
                <div className={`w-9 h-9 rounded-xl border flex items-center justify-center font-semibold text-sm ${style.badgeBg}`}>
                  {style.icon}
                </div>
              </div>
              <div className={`text-4xl font-extrabold ${style.textVal}`}>{s.value}</div>
              <p className="mt-2 text-xs font-medium text-slate-600">{s.hint}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}