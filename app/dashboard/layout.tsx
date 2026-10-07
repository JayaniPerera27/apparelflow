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
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white border-b border-gray-300">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="font-bold text-gray-900">
              ApparelFlow
            </Link>
            <nav className="flex gap-4">
              {NAV[session.role].map((item) => (
                <Link key={item.href} href={item.href} className="text-sm text-blue-800 hover:underline">
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-900">
              {session.fullName} <span className="text-gray-700">({ROLE_LABEL[session.role]})</span>
            </span>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto p-4">{children}</main>
    </div>
  );
}