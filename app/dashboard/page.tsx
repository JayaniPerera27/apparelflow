import { getSession } from "@/lib/auth";

export default async function DashboardHome() {
  const session = await getSession();
  return (
    <div className="card p-6">
      <h1 className="text-xl font-bold text-slate-900">Welcome, {session?.fullName}</h1>
      <p className="mt-1 text-slate-700">Use the navigation above to open your workspace.</p>
    </div>
  );
}