"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const DEMO_PASSWORD = "Demo@1234";
const DEMO_USERS = [
  { label: "Cutting Supervisor", email: "supervisor@apparelflow.test" },
  { label: "Cutting Verifier", email: "verifier@apparelflow.test" },
  { label: "Sewing Supervisor", email: "sewing@apparelflow.test" },
];

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Email and password are required.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Login failed.");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">ApparelFlow ERP</h1>
        <p className="text-sm text-gray-700">Cutting Gatekeeper Verification Terminal</p>

        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-900 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-400 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
              autoComplete="username"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-900 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-400 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
              autoComplete="current-password"
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-red-700 bg-red-50 border border-red-300 rounded px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-700 hover:bg-blue-800 text-white font-medium rounded py-2 disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-1">Demo credentials</h2>
        <p className="text-xs text-gray-700 mb-3">
          Click a role to fill the form. Password for all: <code className="font-mono">{DEMO_PASSWORD}</code>
        </p>
        <div className="space-y-2">
          {DEMO_USERS.map((u) => (
            <button
              key={u.email}
              type="button"
              onClick={() => {
                setEmail(u.email);
                setPassword(DEMO_PASSWORD);
                setError("");
              }}
              className="w-full text-left border border-gray-400 rounded px-3 py-2 hover:bg-gray-100"
            >
              <span className="block text-sm font-medium text-gray-900">{u.label}</span>
              <span className="block text-xs text-gray-700">{u.email}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}