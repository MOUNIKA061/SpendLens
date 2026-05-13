'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  BadgeDollarSign,
  CheckCircle2,
  Sparkles,
  TrendingDown,
  Users,
  Wallet,
} from 'lucide-react'

import { TOOLS } from '@/lib/pricingData'
import { getAudit } from '@/lib/storage'
import { FullAudit } from '@/types'

import { LeadCapture } from './LeadCapture'
import { ShareButton } from './ShareButton'
import { Mail } from 'lucide-react'

function formatMoney(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

export function AuditResults({ auditId }: { auditId: string }) {
  const [audit, setAudit] = useState<FullAudit | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    let cancelled = false
    let timeoutId: ReturnType<typeof setTimeout> | null = null

    const tryLoad = async (attempt = 0) => {
      try {
        const res = await fetch(`/api/audits/${auditId}`)
        if (res.ok) {
          const json = (await res.json()) as FullAudit
          if (!cancelled) {
            setAudit(json)
            setIsReady(true)
          }
          return
        }
      } catch (error) {
        console.error('fetch audit', error)
      }

      const cached = getAudit(auditId)
      if (cached) {
        if (!cancelled) {
          setAudit(cached)
          setIsReady(true)
        }
        return
      }

      if (attempt < 4) {
        if (!cancelled) setRetryCount(attempt + 1)
        timeoutId = setTimeout(() => {
          void tryLoad(attempt + 1)
        }, 500)
        return
      }

      if (!cancelled) {
        setAudit(null)
        setIsReady(true)
      }
    }

    void tryLoad()

    return () => {
      cancelled = true
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [auditId])

  const totalSpend = useMemo(() => {
    if (!audit) return 0
    return audit.input.tools.reduce((sum, tool) => sum + tool.monthlySpend, 0)
  }, [audit])

  if (!isReady) {
    return (
      <div className="min-h-screen bg-[#050816] px-6 py-10 text-slate-100 lg:px-8" role="status" aria-live="polite" aria-label="Loading audit results">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
          <div className="h-10 w-40 rounded-full bg-white/10 animate-pulse" />
          <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
            <div className="h-72 rounded-[2rem] border border-white/10 bg-white/5 animate-pulse" />
            <div className="h-72 rounded-[2rem] border border-white/10 bg-white/5 animate-pulse" />
          </div>
          <p className="text-sm text-slate-400">
            Loading audit results… {retryCount > 0 ? `retry ${retryCount}/4` : ''}
          </p>
        </div>
      </div>
    )
  }

  if (!audit) {
    return (
      <div className="min-h-screen bg-[#050816] px-6 py-10 text-slate-100 lg:px-8">
        <div className="mx-auto flex min-h-[70vh] w-full max-w-3xl items-center justify-center">
          <div className="w-full rounded-[2rem] border border-white/10 bg-white/5 p-8 text-center shadow-2xl shadow-emerald-950/20 backdrop-blur">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-400/15 text-amber-300">
              <Sparkles className="h-7 w-7" />
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-white">Audit not found</h1>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              This audit isn't saved locally. Run a new audit or wait for the results page to load.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/audit"
                className="inline-flex items-center justify-center rounded-full bg-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-slate-950"
              >
                Start new audit
              </Link>
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20 focus:ring-offset-2 focus:ring-offset-slate-950"
              >
                Reload page
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const savingsColor = audit.totalMonthlySavings > 0 ? 'text-emerald-300' : 'text-white'
  const positiveResults = audit.results.filter((result) => result.monthlySavings > 0)
  const lowSavings = audit.totalMonthlySavings < 100 || positiveResults.length === 0

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.22),_transparent_38%),linear-gradient(180deg,#050816_0%,#04060f_100%)] text-slate-100">
      <LeadCapture auditId={auditId} source="credex" />
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-8 lg:px-8 lg:py-10">
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/audit"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-emerald-400/40 hover:bg-emerald-400/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:ring-offset-2 focus:ring-offset-slate-950"
            aria-label="Go back to audit form"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to audit
          </Link>
          <ShareButton className="border border-white/10 bg-white/5 text-slate-100 hover:border-emerald-400/40 hover:bg-emerald-400/10 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:ring-offset-2 focus:ring-offset-slate-950" />
        </div>

        <section className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl shadow-emerald-950/20 backdrop-blur">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 text-xs font-semibold tracking-[0.24em] text-emerald-200 uppercase">
              <Sparkles className="h-3.5 w-3.5" />
              SpendLens audit
            </div>
            <h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              You could save{' '}
              <span className="bg-gradient-to-r from-emerald-300 to-lime-300 bg-clip-text text-transparent">
                {formatMoney(audit.totalMonthlySavings)}
              </span>{' '}
              per month.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
              {audit.input.teamSize}-person team, {audit.input.useCase} focus,{' '}
              {audit.results.length} tool
              {audit.results.length === 1 ? '' : 's'} analyzed. The current stack spends{' '}
              {formatMoney(totalSpend)} per month.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Wallet className="h-4 w-4 text-emerald-300" />
                  Monthly spend
                </div>
                <div className="mt-2 text-2xl font-semibold text-white">
                  {formatMoney(totalSpend)}
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <BadgeDollarSign className="h-4 w-4 text-emerald-300" />
                  Annual savings
                </div>
                <div className="mt-2 text-2xl font-semibold text-white">
                  {formatMoney(audit.totalAnnualSavings)}
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Users className="h-4 w-4 text-emerald-300" />
                  Team size
                </div>
                <div className="mt-2 text-2xl font-semibold text-white">{audit.input.teamSize}</div>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-emerald-400/20 bg-emerald-400/10 p-6 shadow-lg shadow-emerald-950/20 backdrop-blur">
            <div className={`text-5xl font-semibold tracking-tight ${savingsColor}`}>
              {formatMoney(audit.totalMonthlySavings)}
            </div>
            <p className="mt-3 text-sm tracking-[0.2em] text-emerald-100/70 uppercase">
              saved per month
            </p>
            {audit.totalMonthlySavings > 500 ? (
              <div className="mt-5 rounded-2xl border border-emerald-300/20 bg-emerald-300/10 p-4 text-sm leading-6 text-emerald-50">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="font-semibold">
                      Credex can help you capture more of these savings.
                    </div>
                    <div className="mt-1 text-sm text-emerald-50/80">
                      We can help operationalize and capture additional vendor discounts and
                      switching ROI.
                    </div>
                  </div>
                  <a
                    href={`mailto:sales@spendlens.com?subject=Credex%20savings%20help%20for%20audit%20${auditId}`}
                    className="inline-flex items-center gap-2 rounded-full bg-emerald-900/30 px-3 py-2 text-sm font-semibold text-emerald-50 shadow-md hover:bg-emerald-900/40"
                  >
                    <Mail className="h-4 w-4" /> Get Credex help
                  </a>
                </div>
              </div>
            ) : lowSavings ? (
              <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-6 text-slate-200">
                <div className="font-semibold">You’re spending efficiently.</div>
                <div className="mt-1">
                  Your current AI stack already appears well optimized. We won’t manufacture
                  savings.
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <input
                    type="email"
                    placeholder="your@email.com"
                    id="notify-email"
                    className="rounded-lg border border-white/10 bg-white/5 p-2 text-white placeholder:text-slate-500"
                  />
                  <button
                    onClick={() => {
                      const el = document.getElementById('notify-email') as HTMLInputElement | null
                      const email = el?.value ?? ''
                      if (!email) return

                      void fetch('/api/leads', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          email,
                          auditId,
                          source: 'low-savings',
                          honeypot: '',
                        }),
                      }).finally(() => {
                        if (el) {
                          el.value = ''
                        }
                        alert('Thanks — we will notify you when new optimizations are available.')
                      })
                    }}
                    className="rounded-md bg-emerald-400 px-3 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-300"
                  >
                    Notify me
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-6 text-slate-200">
                There are still a few meaningful savings opportunities left on the table.
              </div>
            )}
          </div>
        </section>

        {positiveResults.length > 0 ? (
          <section className="grid gap-4">
            <div className="flex items-center gap-2 text-sm font-medium text-emerald-200/90">
              <TrendingDown className="h-4 w-4" />
              Highest-impact recommendations
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              {audit.results.map((result) => {
                const recommendedSpend = Math.max(0, result.currentSpend - result.monthlySavings)
                const hasSavings = result.monthlySavings > 0
                const toolConfig = TOOLS[result.toolId as keyof typeof TOOLS]

                return (
                  <article
                    key={result.toolId}
                    className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5 shadow-lg shadow-black/10 backdrop-blur"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm tracking-[0.2em] text-slate-400 uppercase">
                          {toolConfig?.name ?? result.toolName}
                        </p>
                        <h2 className="mt-1 text-2xl font-semibold text-white">
                          {result.recommendedAction}
                        </h2>
                      </div>
                      <div className="flex items-center gap-3">
                        <div
                          className={`rounded-full px-3 py-1 text-sm font-semibold ${
                            hasSavings
                              ? 'bg-emerald-400/15 text-emerald-200'
                              : 'bg-white/5 text-slate-300'
                          }`}
                        >
                          {hasSavings
                            ? `${formatMoney(result.monthlySavings)} saved`
                            : 'No savings'}
                        </div>
                        {result.pricingWarning ? (
                          <div className="rounded-full bg-yellow-500/10 px-2 py-0.5 text-xs font-medium text-yellow-200">
                            Pricing may be stale
                          </div>
                        ) : null}
                        <div className="rounded-full bg-white/5 px-2 py-0.5 text-xs font-medium text-slate-300">
                          {result.confidence}
                        </div>
                        <div className="rounded-full bg-white/5 px-2 py-0.5 text-xs font-medium text-slate-300">
                          {result.riskLevel}
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                        <p className="text-xs tracking-[0.18em] text-slate-500 uppercase">
                          Current
                        </p>
                        <p className="mt-2 text-xl font-semibold text-white">
                          {formatMoney(result.currentSpend)}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                        <p className="text-xs tracking-[0.18em] text-slate-500 uppercase">
                          Recommended
                        </p>
                        <p className="mt-2 text-xl font-semibold text-emerald-200">
                          {hasSavings ? formatMoney(recommendedSpend) : 'Keep as-is'}
                        </p>
                      </div>
                    </div>

                    <p className="mt-4 text-sm leading-6 text-slate-300">{result.reason}</p>
                    {hasSavings && (
                      <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-sm font-medium text-emerald-200">
                        <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                        {formatMoney(result.monthlySavings)} monthly savings
                      </div>
                    )}
                  </article>
                )
              })}
            </div>
          </section>
        ) : null}

        <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-lg shadow-black/10 backdrop-blur">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-300">
            <Sparkles className="h-4 w-4 text-emerald-300" />
            Summary
          </div>
          <p className="mt-4 max-w-4xl text-base leading-7 text-slate-200">{audit.summary}</p>
        </section>
      </div>
    </div>
  )
}
