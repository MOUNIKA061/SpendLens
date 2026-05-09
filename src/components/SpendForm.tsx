'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react'

import { TOOLS } from '@/lib/pricingData'
import { clearDraft, getDraft, saveAudit, saveDraft } from '@/lib/storage'
import { AuditInput, SpendFormDraft, ToolInput, UseCase } from '@/types'

const TOOL_IDS = Object.keys(TOOLS) as Array<keyof typeof TOOLS>
const USE_CASES: UseCase[] = ['coding', 'writing', 'data', 'research', 'mixed']
const DEFAULT_PLAN_ORDER = ['hobby', 'individual', 'free', 'pro', 'plus', 'team', 'business', 'enterprise', 'max', 'teams', 'usage', 'api', 'ultra']

function formatMoney(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

function getDefaultPlanKey(toolId: keyof typeof TOOLS): string {
  const planKeys = Object.keys(TOOLS[toolId].plans)
  return (
    DEFAULT_PLAN_ORDER.find(planKey => planKeys.includes(planKey)) ??
    planKeys[0] ??
    'pro'
  )
}

function createTool(toolId: keyof typeof TOOLS): ToolInput {
  const plan = getDefaultPlanKey(toolId)
  const planConfig = TOOLS[toolId].plans as Record<string, { pricePerSeat: number | null }>

  return {
    toolId,
    plan,
    seats: 1,
    monthlySpend: planConfig[plan]?.pricePerSeat ?? 0,
  }
}

function normalizeDraft(draft: SpendFormDraft | null) {
  if (!draft) {
    return {
      step: 1,
      selectedTools: [] as string[],
      tools: [] as ToolInput[],
      teamSize: 5,
      useCase: 'mixed' as UseCase,
    }
  }

  const selectedTools = draft.selectedTools.filter(toolId => TOOL_IDS.includes(toolId as keyof typeof TOOLS))
  const draftTools = draft.tools.filter(tool => TOOL_IDS.includes(tool.toolId as keyof typeof TOOLS))

  return {
    step: Math.min(Math.max(draft.step || 1, 1), 3),
    selectedTools,
    tools: selectedTools.map(toolId => draftTools.find(tool => tool.toolId === toolId) ?? createTool(toolId as keyof typeof TOOLS)),
    teamSize: Math.max(1, draft.teamSize || 5),
    useCase: USE_CASES.includes(draft.useCase) ? draft.useCase : 'mixed',
  }
}

export function SpendForm() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [selectedTools, setSelectedTools] = useState<string[]>([])
  const [tools, setTools] = useState<ToolInput[]>([])
  const [teamSize, setTeamSize] = useState(5)
  const [useCase, setUseCase] = useState<UseCase>('mixed')
  const [loading, setLoading] = useState(false)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const draft = normalizeDraft(getDraft())
    setStep(draft.step)
    setSelectedTools(draft.selectedTools)
    setTools(draft.tools)
    setTeamSize(draft.teamSize)
    setUseCase(draft.useCase)
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return

    const draft: SpendFormDraft = {
      step,
      selectedTools,
      tools,
      teamSize,
      useCase,
    }

    saveDraft(draft)
  }, [hydrated, step, selectedTools, tools, teamSize, useCase])

  const selectedToolSet = useMemo(() => new Set(selectedTools), [selectedTools])

  const totalMonthlySpend = useMemo(
    () => tools.reduce((sum, tool) => sum + tool.monthlySpend, 0),
    [tools],
  )

  const toggleTool = (toolId: string) => {
    const isSelected = selectedToolSet.has(toolId)

    if (isSelected) {
      setSelectedTools(prev => prev.filter(value => value !== toolId))
      setTools(prev => prev.filter(tool => tool.toolId !== toolId))
      return
    }

    const toolConfig = TOOLS[toolId as keyof typeof TOOLS]
    if (!toolConfig) return

    setSelectedTools(prev => [...prev, toolId])
    setTools(prev => {
      if (prev.some(tool => tool.toolId === toolId)) return prev
      return [...prev, createTool(toolId as keyof typeof TOOLS)]
    })
  }

  const updateTool = <K extends keyof ToolInput>(toolId: string, field: K, value: ToolInput[K]) => {
    setTools(prev =>
      prev.map(tool =>
        tool.toolId === toolId
          ? {
              ...tool,
              [field]: value,
            }
          : tool,
      ),
    )
  }

  const goToToolDetails = () => {
    if (selectedTools.length === 0) {
      window.alert('Please select at least one tool')
      return
    }

    setStep(2)
  }

  const handleSubmit = async () => {
    if (tools.length === 0) {
      window.alert('Please select at least one tool')
      return
    }

    setLoading(true)
    try {
      const input: AuditInput = {
        tools,
        teamSize,
        useCase,
      }

      const response = await fetch('/api/audit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      })

      if (!response.ok) {
        const errorPayload = (await response.json().catch(() => null)) as { error?: string } | null
        throw new Error(errorPayload?.error ?? 'Failed to create audit')
      }

      const audit = await response.json()
      saveAudit(audit)
      clearDraft()
      router.push(`/results/${audit.id}?saved=${audit.totalMonthlySavings}`)
    } catch (error) {
      console.error('Error creating audit:', error)
      window.alert('Failed to create audit. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.18),_transparent_35%),linear-gradient(180deg,#020617_0%,#040816_100%)] px-4 py-6 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/20 backdrop-blur">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-200">
                <Sparkles className="h-3.5 w-3.5" />
                Audit flow
              </div>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Audit your AI spend</h1>
              <p className="mt-2 text-sm text-slate-400">Step {step} of 3. Drafts save automatically to your browser.</p>
            </div>
            <div className="hidden rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-right sm:block">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Current monthly spend</p>
              <p className="mt-1 text-xl font-semibold text-white">{formatMoney(totalMonthlySpend)}</p>
            </div>
          </div>

          <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-lime-300 transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        {step === 1 ? (
          <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-xl shadow-black/15 backdrop-blur">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.18em] text-emerald-200/80">Step 1</p>
                <h2 className="mt-1 text-2xl font-semibold text-white">Which AI tools does your startup use?</h2>
              </div>
              <p className="hidden text-sm text-slate-400 sm:block">Select all that apply.</p>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {TOOL_IDS.map(toolId => {
                const toolConfig = TOOLS[toolId]
                const isSelected = selectedToolSet.has(toolId)

                return (
                  <button
                    key={toolId}
                    type="button"
                    onClick={() => toggleTool(toolId)}
                    className={`group rounded-2xl border p-4 text-left transition ${
                      isSelected
                        ? 'border-emerald-400/40 bg-emerald-400/10 text-white'
                        : 'border-white/10 bg-slate-950/40 text-slate-200 hover:border-emerald-400/25 hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-base font-semibold">{toolConfig.name}</p>
                        <p className="mt-1 text-sm text-slate-400">
                          {Object.values(toolConfig.plans)
                            .slice(0, 2)
                            .map(plan => plan.label)
                            .join(' • ')}
                        </p>
                      </div>
                      <div
                        className={`mt-1 flex h-5 w-5 items-center justify-center rounded-full border ${
                          isSelected ? 'border-emerald-300 bg-emerald-300 text-slate-950' : 'border-white/20'
                        }`}
                      >
                        {isSelected ? <CheckCircle2 className="h-4 w-4" /> : null}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={goToToolDetails}
                className="inline-flex items-center gap-2 rounded-full bg-emerald-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:bg-slate-600 disabled:text-slate-300"
                disabled={selectedTools.length === 0}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </section>
        ) : null}

        {step === 2 ? (
          <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-xl shadow-black/15 backdrop-blur">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.18em] text-emerald-200/80">Step 2</p>
                <h2 className="mt-1 text-2xl font-semibold text-white">Tell us how each tool is configured</h2>
              </div>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-white/20 hover:bg-white/10"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </button>
            </div>

            <div className="mt-6 grid gap-4">
              {tools.map(tool => {
                const toolConfig = TOOLS[tool.toolId as keyof typeof TOOLS]

                return (
                  <article key={tool.toolId} className="rounded-[1.5rem] border border-white/10 bg-slate-950/40 p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-white">{toolConfig.name}</h3>
                        <p className="mt-1 text-sm text-slate-400">Plan, seat count, and monthly spend for this tool.</p>
                      </div>
                      <div className="text-sm text-slate-400">
                        Est. current spend: <span className="font-semibold text-white">{formatMoney(tool.monthlySpend)}</span>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-4 md:grid-cols-3">
                      <label className="space-y-2 text-sm text-slate-300">
                        <span className="block text-xs uppercase tracking-[0.18em] text-slate-500">Plan</span>
                        <select
                          value={tool.plan}
                          onChange={event => updateTool(tool.toolId, 'plan', event.target.value)}
                          className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-white outline-none transition focus:border-emerald-400/40"
                        >
                          {Object.entries(toolConfig.plans).map(([planKey, plan]) => (
                            <option key={planKey} value={planKey} className="bg-slate-950 text-white">
                              {plan.label}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="space-y-2 text-sm text-slate-300">
                        <span className="block text-xs uppercase tracking-[0.18em] text-slate-500">Seats</span>
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={tool.seats}
                          onChange={event => updateTool(tool.toolId, 'seats', Math.max(1, Number(event.target.value) || 1))}
                          className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-white outline-none transition focus:border-emerald-400/40"
                        />
                      </label>

                      <label className="space-y-2 text-sm text-slate-300">
                        <span className="block text-xs uppercase tracking-[0.18em] text-slate-500">Monthly spend</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={tool.monthlySpend}
                          onChange={event => updateTool(tool.toolId, 'monthlySpend', Number(event.target.value) || 0)}
                          className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-white outline-none transition focus:border-emerald-400/40"
                        />
                      </label>
                    </div>
                  </article>
                )
              })}
            </div>

            <div className="mt-6 flex justify-between gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-3 font-medium text-slate-200 transition hover:border-white/20 hover:bg-white/10"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="inline-flex items-center gap-2 rounded-full bg-emerald-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-emerald-300"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </section>
        ) : null}

        {step === 3 ? (
          <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-xl shadow-black/15 backdrop-blur">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.18em] text-emerald-200/80">Step 3</p>
                <h2 className="mt-1 text-2xl font-semibold text-white">Team size and use case</h2>
              </div>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-white/20 hover:bg-white/10"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </button>
            </div>

            <div className="mt-6 grid gap-5 lg:grid-cols-[0.7fr_1.3fr]">
              <label className="space-y-2 text-sm text-slate-300">
                <span className="block text-xs uppercase tracking-[0.18em] text-slate-500">Team size</span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={teamSize}
                  onChange={event => setTeamSize(Math.max(1, Number(event.target.value) || 1))}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-white outline-none transition focus:border-emerald-400/40"
                />
              </label>

              <div>
                <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-slate-500">Primary use case</span>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                  {USE_CASES.map(caseOption => (
                    <button
                      key={caseOption}
                      type="button"
                      onClick={() => setUseCase(caseOption)}
                      className={`rounded-2xl border px-4 py-3 text-left capitalize transition ${
                        useCase === caseOption
                          ? 'border-emerald-400/40 bg-emerald-400/10 text-white'
                          : 'border-white/10 bg-slate-950/40 text-slate-200 hover:border-emerald-400/25 hover:bg-white/5'
                      }`}
                    >
                      <div className="font-medium">{caseOption}</div>
                      <div className="mt-1 text-xs text-slate-400">
                        {caseOption === 'coding'
                          ? 'Engineering and product build work'
                          : caseOption === 'writing'
                            ? 'Content, docs, and copy'
                            : caseOption === 'data'
                              ? 'Analysis, pipelines, and reporting'
                              : caseOption === 'research'
                                ? 'Synthesis and deep investigation'
                                : 'Mixed AI work across the team'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-between gap-3">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-3 font-medium text-slate-200 transition hover:border-white/20 hover:bg-white/10"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-full bg-emerald-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:bg-slate-600 disabled:text-slate-300"
              >
                {loading ? 'Analyzing...' : 'Get my audit'}
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </section>
        ) : null}
      </div>
    </div>
  )
}
