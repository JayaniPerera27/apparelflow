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

// UI convenience navigation mapping
const NAV: Record<Role, { href: string; label: string }[]> = {
  cutting_supervisor: [{ href: "/dashboard/orders", label: "Cutting Orders" }],
  cutting_verifier: [{ href: "/dashboard/verify", label: "Verification Terminal" }],
  sewing_supervisor: [{ href: "/dashboard/sewing", label: "Sewing Queue" }],
};

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="min-h-screen bg-slate-50/80 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-6 py-3.5">
          {/* Brand Logo & Navigation */}
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center font-bold text-white text-lg shadow-sm">
                A
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-900">
                Apparel<span className="text-indigo-600">Flow</span>
              </span>
            </Link>

            <nav className="flex items-center gap-1">
              <Link
                href="/dashboard"
                className="px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              >
                Dashboard
              </Link>
              {NAV[session.role].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="px-3 py-2 rounded-lg text-sm font-semibold text-indigo-700 bg-indigo-50/80 hover:bg-indigo-100/80 transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* User Profile & Red Logout Button */}
          <div className="flex items-center gap-4">
            <div className="text-right leading-tight">
              <p className="text-sm font-semibold text-slate-900">{session.fullName}</p>
              <p className="text-xs font-medium text-slate-500">{ROLE_LABEL[session.role]}</p>
            </div>
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* Main Content Viewport */}
      <main className="mx-auto max-w-7xl w-full p-6 sm:p-8 flex-1">{children}</main>
    </div>
  );
}