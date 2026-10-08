import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export default async function Home() {
  const session = await getSession();

  // Redirect to dashboard if session exists
  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="relative min-h-screen bg-[#090d16] text-slate-100 selection:bg-indigo-500 selection:text-white overflow-hidden">
      {/* Background Gradient Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-600/30 blur-[120px] pointer-events-none animate-glow" />
      <div className="absolute top-[20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-purple-600/20 blur-[140px] pointer-events-none animate-glow" />
      <div className="absolute bottom-[-10%] left-[30%] w-[500px] h-[500px] rounded-full bg-pink-600/20 blur-[130px] pointer-events-none animate-glow" />

      {/* Grid Pattern Overlay */}
      <div 
        className="absolute inset-0 bg-[linear-gradient(to_right,#1f293715_1px,transparent_1px),linear-gradient(to_bottom,#1f293715_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" 
      />

      {/* Navigation Bar */}
      <header className="sticky top-0 z-50 w-full glass-nav">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center font-black text-xl text-white shadow-lg shadow-indigo-500/30">
              A
            </div>
            <span className="text-xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
              ApparelFlow
            </span>
          </div>

          <nav className="flex items-center space-x-4">
            <Link href="/login" className="btn-secondary py-2 px-4 text-xs sm:text-sm">
              Sign In
            </Link>
            <Link href="/login" className="btn-primary py-2 px-4 text-xs sm:text-sm">
              Get Started
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-16 md:pt-32 md:pb-24 px-6 max-w-6xl mx-auto text-center flex flex-col items-center">
        {/* Glowing Badge */}
        {/* <div className="animate-fade-in inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-card border border-indigo-500/30 text-xs sm:text-sm font-medium text-indigo-300 mb-8 shadow-inner shadow-indigo-500/10">
          <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          Apparel Production OS v2.0
        </div> */}

        {/* Hero Title */}
        <h1 className="animate-fade-in text-4xl sm:text-6xl md:text-7xl font-black tracking-tight leading-none max-w-4xl">
          Revolutionize Your{" "}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400">
            Apparel Workflow
          </span>
        </h1>

        {/* Subtitle */}
        <p className="animate-fade-in-delay-1 mt-6 text-lg sm:text-xl text-slate-400 max-w-2xl font-light leading-relaxed">
          Streamline order lifecycles, manage real-time recipe approvals, and enforce transparent verification logs across every production batch.
        </p>

        {/* CTA Buttons */}
        <div className="animate-fade-in-delay-2 mt-10 flex flex-col sm:flex-row gap-4 justify-center w-full sm:w-auto">
          <Link href="/login" className="btn-primary text-base">
            Launch Dashboard →
          </Link>
          <a href="#features" className="btn-secondary text-base">
            Explore Capabilities
          </a>
        </div>

        {/* Preview Card Mockup */}
        {/* <div className="animate-fade-in-delay-2 mt-16 w-full max-w-4xl glass-card rounded-2xl p-4 sm:p-6 border border-slate-700/50 shadow-2xl shadow-indigo-950/50 animate-float">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
            <div className="flex space-x-2">
              <div className="w-3 h-3 rounded-full bg-rose-500/80" />
              <div className="w-3 h-3 rounded-full bg-amber-500/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
            </div>
            <div className="text-xs font-mono text-slate-500">apparelflow.internal/orders</div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="text-xs text-slate-400 mb-1">Active Batch</div>
              <div className="text-lg font-bold text-indigo-400">#ORD-8921</div>
              <div className="mt-2 text-xs text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Verified & Queued
              </div>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="text-xs text-slate-400 mb-1">Color Recipe</div>
              <div className="text-lg font-bold text-pink-400">Cyan Teal #4A90</div>
              <div className="mt-2 text-xs text-indigo-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span> 98.4% Match Rate
              </div>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="text-xs text-slate-400 mb-1">Audit Log</div>
              <div className="text-lg font-bold text-purple-400">Append-Only</div>
              <div className="mt-2 text-xs text-slate-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span> Immutable History
              </div>
            </div>
          </div>
        </div> */}
      </section>

      {/* Features Grid */}
      <section id="features" className="relative px-6 py-24 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white">
            Engineered for <span className="text-indigo-400">Precision</span>
          </h2>
          <p className="text-slate-400 mt-3 text-base sm:text-lg">
            Purpose-built tools designed to eliminate bottlenecks in textile production.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="group glass-card p-8 rounded-2xl border border-slate-800 hover:border-indigo-500/50 transition-all duration-300 hover:-translate-y-2">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center text-xl font-bold mb-6 group-hover:bg-indigo-500 group-hover:text-white transition-all duration-300">
              ⚡
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Instant Order Routing</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Automate order resubmissions and state updates across production teams with real-time status visibility.
            </p>
          </div>

          {/* Card 2 */}
          <div className="group glass-card p-8 rounded-2xl border border-slate-800 hover:border-purple-500/50 transition-all duration-300 hover:-translate-y-2">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center text-xl font-bold mb-6 group-hover:bg-purple-500 group-hover:text-white transition-all duration-300">
              🛡️
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Verification Guardrails</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Dedicated quality control cards ensure orders are verified and recipes strictly inspected before manufacturing.
            </p>
          </div>

          {/* Card 3 */}
          <div className="group glass-card p-8 rounded-2xl border border-slate-800 hover:border-pink-500/50 transition-all duration-300 hover:-translate-y-2">
            <div className="w-12 h-12 rounded-xl bg-pink-500/10 border border-pink-500/20 text-pink-400 flex items-center justify-center text-xl font-bold mb-6 group-hover:bg-pink-500 group-hover:text-white transition-all duration-300">
              🔒
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Immutable Audit Logs</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Maintain full data integrity with append-only log databases and fine-grained role-based permission control.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Footer Section */}
      <section className="relative px-6 py-20 text-center">
        <div className="max-w-4xl mx-auto glass-card p-10 sm:p-16 rounded-3xl border border-indigo-500/30 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 pointer-events-none" />
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4 relative z-10">
            Ready to optimize your apparel flow?
          </h2>
          <p className="text-slate-400 mb-8 max-w-xl mx-auto text-sm sm:text-base relative z-10">
            Sign in now to access your dashboard and start managing active orders.
          </p>
          <Link href="/login" className="btn-primary text-base py-3.5 px-8 relative z-10">
            Get Started Now
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#060910] py-8 px-6 text-sm text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <p>© {new Date().getFullYear()} ApparelFlow Systems Inc. All rights reserved.</p>
          <div className="flex space-x-6">
            <Link href="/login" className="hover:text-indigo-400 transition-colors">
              Portal Access
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}