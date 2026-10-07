"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const DEMO_PASSWORD = "Demo@1234";
const DEMO_USERS = [
  { label: "Cutting Supervisor", email: "supervisor@apparelflow.test", badge: "bg-blue-100 text-blue-900" },
  { label: "Cutting Verifier", email: "verifier@apparelflow.test", badge: "bg-emerald-100 text-emerald-900" },
  { label: "Sewing Supervisor", email: "sewing@apparelflow.test", badge: "bg-amber-100 text-amber-900" },
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
    <div className="card p-8">
      <h2 className="text-2xl font-bold text-slate-900">Sign in</h2>
      <p className="mt-1 text-sm text-slate-700">Use your factory account to continue.</p>

      <form onSubmit={onSubmit} className="mt-6 space-y-5" noValidate>
        <div>
          <label htmlFor="email" className="label">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
            placeholder="name@apparelflow.test"
            autoComplete="username"
          />
        </div>

        <div>
          <label htmlFor="password" className="label">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input"
            placeholder="Enter your password"
            autoComplete="current-password"
          />
        </div>

        {error && (
          <p role="alert" className="alert-error">
            {error}
          </p>
        )}

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </div>

    <div className="card p-6">
      <h3 className="text-sm font-semibold text-slate-900">Demo credentials</h3>
      <p className="mt-1 text-xs text-slate-700">
        Click a role to fill the form. Password for all:{" "}
        <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-slate-900">{DEMO_PASSWORD}</code>
      </p>

      <div className="mt-4 space-y-2">
        {DEMO_USERS.map((u) => (
          <button
            key={u.email}
            type="button"
            onClick={() => {
              setEmail(u.email);
              setPassword(DEMO_PASSWORD);
              setError("");
            }}
            className="flex w-full items-center justify-between rounded-lg border border-slate-300 px-3.5 py-2.5 text-left hover:border-indigo-600 hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          >
            <span>
              <span className="block text-sm font-medium text-slate-900">{u.label}</span>
              <span className="block text-xs text-slate-700">{u.email}</span>
            </span>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${u.badge}`}>
              Demo
            </span>
          </button>
        ))}
      </div>
    </div>
  </div>
);
}