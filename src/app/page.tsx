import Link from 'next/link'
import { ArrowRight, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react'

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.2),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(34,197,94,0.14),_transparent_28%),linear-gradient(180deg,#020617_0%,#050816_52%,#020617_100%)] text-slate-100">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:84px_84px] opacity-40" />
      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-8 lg:px-8">
        <header className="flex items-center justify-between gap-4 rounded-full border border-white/10 bg-white/5 px-5 py-3 backdrop-blur">
          <div>
            <p className="text-sm font-semibold tracking-[0.24em] text-emerald-200 uppercase">
              SpendLens
            </p>
            <p className="text-xs text-slate-400">Free AI spend audit for startup founders</p>
          </div>
          <Link
            href="/audit"
            className="inline-flex items-center gap-2 rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
          >
            Audit my AI spend
            <ArrowRight className="h-4 w-4" />
          </Link>
        </header>

        <section className="grid flex-1 items-center gap-12 py-16 lg:grid-cols-[1.15fr_0.85fr] lg:py-24">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold tracking-[0.24em] text-emerald-200 uppercase">
              <Sparkles className="h-3.5 w-3.5" />
              Fintech-grade spend analysis
            </div>
            <h1 className="mt-6 text-5xl font-semibold tracking-tight text-white sm:text-6xl lg:text-7xl">
              Find out where your AI budget is leaking.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300 sm:text-xl">
              Free audit for startups. No signup needed. See which tools are overpriced, which plans
              are wrong-sized, and what you could save every month.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/audit"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-400 px-6 py-3 text-base font-semibold text-slate-950 transition hover:bg-emerald-300"
              >
                Audit my AI spend
                <ArrowRight className="h-4 w-4" />
              </Link>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm text-slate-200">
                <ShieldCheck className="h-4 w-4 text-emerald-300" />
                No login, no external API calls
              </div>
            </div>

            <div className="mt-10 grid gap-3 sm:grid-cols-3">
              {['Instant analysis', 'No login needed', 'Shareable report'].map((feature) => (
                <div
                  key={feature}
                  className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 backdrop-blur"
                >
                  <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                  {feature}
                </div>
              ))}
            </div>
          </div>

          <aside className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-2xl shadow-emerald-950/20 backdrop-blur">
            <div className="rounded-[1.5rem] border border-emerald-400/20 bg-slate-950/60 p-6">
              <p className="text-xs tracking-[0.24em] text-emerald-200/70 uppercase">
                Typical leak
              </p>
              <div className="mt-4 text-5xl font-semibold tracking-tight text-white">$780</div>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Average monthly savings surfaced when teams right-size AI tooling.
              </p>
            </div>

            <div className="mt-5 space-y-3 text-sm text-slate-200">
              <div className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3">
                Cursor, Copilot, Claude, ChatGPT, and API tools in one audit.
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3">
                Built for founders who want the budget answer, not another dashboard.
              </div>
            </div>
          </aside>
        </section>

        <footer className="border-t border-white/10 py-6 text-sm text-slate-400">
          Built by GitHub Copilot for Credex Web Dev Assignment
        </footer>
      </div>
    </main>
  )
}
