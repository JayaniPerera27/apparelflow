import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import LoginForm from "./LoginForm";

const STEPS = [
  { n: "1", title: "Cut", text: "Supervisor prepares the cutting order" },
  { n: "2", title: "Verify", text: "Verifier counts every component" },
  { n: "3", title: "Sew", text: "Only verified batches reach the sewing floor" },
];

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect("/dashboard");

  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <section className="hidden flex-col justify-between bg-slate-900 p-12 text-white lg:flex">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-indigo-300">
            ApparelFlow ERP
          </p>
          <h1 className="mt-6 max-w-md text-4xl font-bold leading-tight">
            No unverified batch reaches the sewing floor.
          </h1>
          <p className="mt-4 max-w-md text-slate-300">
            Cutting Operations and Gatekeeper Verification Terminal.
          </p>
        </div>

        <ol className="space-y-5">
          {STEPS.map((s) => (
            <li key={s.n} className="flex items-start gap-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-500 text-sm font-bold text-white">
                {s.n}
              </span>
              <div>
                <p className="font-semibold">{s.title}</p>
                <p className="text-sm text-slate-300">{s.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="flex items-center justify-center bg-slate-50 p-6">
        <LoginForm />
      </section>
    </main>
  );
}