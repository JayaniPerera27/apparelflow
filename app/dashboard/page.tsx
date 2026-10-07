import { getSession } from "@/lib/auth";

export default async function DashboardHome() {
  const session = await getSession();
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h1 className="text-xl font-bold text-gray-900">Welcome, {session?.fullName}</h1>
      <p className="text-gray-700 mt-1">Use the navigation above to open your workspace.</p>
    </div>
  );
}