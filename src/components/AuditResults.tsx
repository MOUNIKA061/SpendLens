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

  useEffect(() => {
    setAudit(getAudit(auditId))
    setIsReady(true)
  }, [auditId])

  const totalSpend = useMemo(() => {
    if (!audit) return 0
    return audit.input.tools.reduce((sum, tool) => sum + tool.monthlySpend, 0)
  }, [audit])

  if (!isReady) {
    return (
      <div className="min-h-screen bg-[#050816] px-6 py-10 text-slate-100 lg:px-8">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
          <div className="h-10 w-40 rounded-full bg-white/10" />
          <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
            <div className="h-72 rounded-[2rem] border border-white/10 bg-white/5" />
            <div className="h-72 rounded-[2rem] border border-white/10 bg-white/5" />
          </div>
        </div>
      </div>
    )
  }

  if (!audit) {
    return (
      <div className="min-h-screen bg-[#050816] px-6 py-10 text-slate-100 lg:px-8">
        <div className="mx-auto flex min-h-[70vh] w-full max-w-3xl items-center justify-center">
          <div className="w-full rounded-[2rem] border border-white/10 bg-white/5 p-8 text-center shadow-2xl shadow-emerald-950/20 backdrop-blur">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-400/15 text-emerald-300">
              <Sparkles className="h-7 w-7" />
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-white">Audit not found</h1>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              This browser does not have the saved audit yet. Run a new audit to view the results here.
            </p>
            <Link
              href="/audit"
              className="mt-6 inline-flex items-center justify-center rounded-full bg-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
            >
              Start a new audit
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const savingsColor = audit.totalMonthlySavings > 0 ? 'text-emerald-300' : 'text-white'
  const positiveResults = audit.results.filter(result => result.monthlySavings > 0)

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.22),_transparent_38%),linear-gradient(180deg,#050816_0%,#04060f_100%)] text-slate-100">
      <LeadCapture />
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-8 lg:px-8 lg:py-10">
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/audit"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-emerald-400/40 hover:bg-emerald-400/10 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to audit
          </Link>
          <ShareButton className="border border-white/10 bg-white/5 text-slate-100 hover:border-emerald-400/40 hover:bg-emerald-400/10" />
        </div>

        <section className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl shadow-emerald-950/20 backdrop-blur">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-200">
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
              {audit.input.teamSize}-person team, {audit.input.useCase} focus, {audit.results.length} tool
              {audit.results.length === 1 ? '' : 's'} analyzed. The current stack spends {formatMoney(totalSpend)} per month.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Wallet className="h-4 w-4 text-emerald-300" />
                  Monthly spend
                </div>
                <div className="mt-2 text-2xl font-semibold text-white">{formatMoney(totalSpend)}</div>
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
            <p className="mt-3 text-sm uppercase tracking-[0.2em] text-emerald-100/70">saved per month</p>
            {audit.totalMonthlySavings > 500 ? (
              <div className="mt-5 rounded-2xl border border-emerald-300/20 bg-emerald-300/10 p-4 text-sm leading-6 text-emerald-50">
                Credex can help you save even more.
              </div>
            ) : audit.totalMonthlySavings < 100 ? (
              <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-6 text-slate-200">
                You&apos;re in good shape. The stack is already close to optimized.
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
              {audit.results.map(result => {
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
                        <p className="text-sm uppercase tracking-[0.2em] text-slate-400">
                          {toolConfig?.name ?? result.toolName}
                        </p>
                        <h2 className="mt-1 text-2xl font-semibold text-white">{result.recommendedAction}</h2>
                      </div>
                      <div
                        className={`rounded-full px-3 py-1 text-sm font-semibold ${
                          hasSavings
                            ? 'bg-emerald-400/15 text-emerald-200'
                            : 'bg-white/5 text-slate-300'
                        }`}
                      >
                        {hasSavings ? `${formatMoney(result.monthlySavings)} saved` : 'No savings'}
                      </div>
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Current</p>
                        <p className="mt-2 text-xl font-semibold text-white">{formatMoney(result.currentSpend)}</p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Recommended</p>
                        <p className="mt-2 text-xl font-semibold text-emerald-200">
                          {hasSavings ? formatMoney(recommendedSpend) : 'Keep as-is'}
                        </p>
                      </div>
                    </div>

                    <p className="mt-4 text-sm leading-6 text-slate-300">{result.reason}</p>
                    {hasSavings ? (
                      <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-sm font-medium text-emerald-200">
                        <CheckCircle2 className="h-4 w-4" />
                        {formatMoney(result.monthlySavings)} monthly savings
                      </div>
                    ) : null}
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
