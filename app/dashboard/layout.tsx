import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Role } from "@/app/generated/prisma/client";
import LogoutButton from "@/components/LogoutButton";

const ROLE_LABEL: Record<Role, string> = {
  cutting_supervisor: "Cutting Supervisor",
  cutting_verifier: "Cutting Verifier",
  sewing_supervisor: "Sewing Supervisor",
};

// UI convenience only. Real security is requireRole() on the server.
const NAV: Record<Role, { href: string; label: string }[]> = {
  cutting_supervisor: [{ href: "/dashboard/orders", label: "Cutting Orders" }],
  cutting_verifier: [{ href: "/dashboard/verify", label: "Verification Terminal" }],
  sewing_supervisor: [{ href: "/dashboard/sewing", label: "Sewing Queue" }],
};

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
  <div className="min-h-screen bg-slate-50">
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="text-lg font-bold text-slate-900">
            Apparel<span className="text-indigo-700">Flow</span>
          </Link>
          <nav className="flex gap-5">
  <Link href="/dashboard" className="text-sm font-medium text-slate-800 hover:text-indigo-700">
    Dashboard
  </Link>
  {NAV[session.role].map((item) => (
    <Link
      key={item.href}
      href={item.href}
      className="text-sm font-medium text-slate-800 hover:text-indigo-700"
    >
      {item.label}
    </Link>
  ))}
</nav>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right leading-tight">
            <p className="text-sm font-medium text-slate-900">{session.fullName}</p>
            <p className="text-xs text-slate-700">{ROLE_LABEL[session.role]}</p>
          </div>
          <LogoutButton />
        </div>
      </div>
    </header>
    <main className="mx-auto max-w-6xl p-4 sm:p-6">{children}</main>
  </div>
);
}