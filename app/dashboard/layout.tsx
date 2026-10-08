"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import LogoutButton from "@/components/LogoutButton";

type Role = "cutting_supervisor" | "cutting_verifier" | "sewing_supervisor";

const ROLE_LABEL: Record<Role, string> = {
  cutting_supervisor: "Cutting Supervisor",
  cutting_verifier: "Cutting Verifier",
  sewing_supervisor: "Sewing Supervisor",
};

// Nā tab no kēlā me kēia role
const NAV: Record<Role, { href: string; label: string }[]> = {
  cutting_supervisor: [{ href: "/dashboard/orders", label: "Cutting Orders" }],
  cutting_verifier: [{ href: "/dashboard/verify", label: "Verification Terminal" }],
  sewing_supervisor: [{ href: "/dashboard/sewing", label: "Sewing Queue" }],
};

type Session = {
  fullName: string;
  role: Role;
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    async function loadSession() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          setSession(data);
        }
      } catch (err) {
        console.error("Hewa i ka hoʻouka ʻana i ka session", err);
      }
    }
    loadSession();
  }, []);

  const isDashboardActive = pathname === "/dashboard";

  return (
    <div className="min-h-screen bg-slate-50/80 flex flex-col font-sans">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-6 py-3.5">
          {/* Brand Logo & Navigation Tabs */}
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center font-bold text-white text-lg shadow-sm">
                A
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-900">
                Apparel<span className="text-indigo-600">Flow</span>
              </span>
            </Link>

            <nav className="flex items-center gap-2">
              {/* Dashboard Tab */}
              <Link
                href="/dashboard"
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  isDashboardActive
                    ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30"
                    : "text-slate-700 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                Dashboard
              </Link>

              {/* Nā Tab e pili ana i kēlā me kēia Role */}
              {session &&
                NAV[session.role]?.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                        isActive
                          ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30"
                          : "text-slate-700 hover:text-slate-900 hover:bg-slate-100"
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
            </nav>
          </div>

          {/* Profile & Logout Button */}
          <div className="flex items-center gap-4">
            {session && (
              <div className="text-right leading-tight">
                <p className="text-sm font-semibold text-slate-900">{session.fullName}</p>
                <p className="text-xs font-medium text-slate-500">{ROLE_LABEL[session.role]}</p>
              </div>
            )}
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto max-w-7xl w-full p-6 sm:p-8 flex-1">{children}</main>
    </div>
  );
}