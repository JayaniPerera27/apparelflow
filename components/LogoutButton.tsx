"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={logout}
      className="text-sm border border-gray-400 rounded px-3 py-1 text-gray-900 hover:bg-gray-100"
    >
      Log out
    </button>
  );
}