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

type BillingType = 'subscription' | 'api-usage' | 'hybrid'
type UsageFrequency = 'daily' | 'weekly' | 'occasionally'
type UsageFocus = UseCase | 'customer-support' | 'automation'

type RichToolEntry = {
  id: string
  providerId: keyof typeof TOOL_CONFIG
  planId: string
  monthlySpend: number
  seats: number
  billingType: BillingType
  useCases: UsageFocus[]
  usageFrequency: UsageFrequency
  notes: string
}

type ProviderPlan = {
  id: string
  label: string
  auditPlan: string
}

type ProviderConfig = {
  label: string
  toolId: string
  plans: ProviderPlan[]
}

const TOOL_CONFIG = {
  cursor: {
    label: 'Cursor',
    toolId: 'cursor',
    plans: [
      { id: 'hobby', label: 'Hobby', auditPlan: 'hobby' },
      { id: 'pro', label: 'Pro', auditPlan: 'pro' },
      { id: 'business', label: 'Business', auditPlan: 'business' },
      { id: 'enterprise', label: 'Enterprise', auditPlan: 'business' },
    ],
  },
  github_copilot: {
    label: 'GitHub Copilot',
    toolId: 'github_copilot',
    plans: [
      { id: 'individual', label: 'Individual', auditPlan: 'individual' },
      { id: 'business', label: 'Business', auditPlan: 'business' },
      { id: 'enterprise', label: 'Enterprise', auditPlan: 'enterprise' },
    ],
  },
  claude: {
    label: 'Claude',
    toolId: 'claude',
    plans: [
      { id: 'free', label: 'Free', auditPlan: 'free' },
      { id: 'pro', label: 'Pro', auditPlan: 'pro' },
      { id: 'max', label: 'Max', auditPlan: 'max' },
      { id: 'team', label: 'Team', auditPlan: 'team' },
      { id: 'enterprise', label: 'Enterprise', auditPlan: 'enterprise' },
      { id: 'api_direct', label: 'API Direct', auditPlan: 'enterprise' },
    ],
  },
  chatgpt: {
    label: 'ChatGPT',
    toolId: 'chatgpt',
    plans: [
      { id: 'plus', label: 'Plus', auditPlan: 'plus' },
      { id: 'team', label: 'Team', auditPlan: 'team' },
      { id: 'enterprise', label: 'Enterprise', auditPlan: 'enterprise' },
      { id: 'api_direct', label: 'API Direct', auditPlan: 'enterprise' },
    ],
  },
  anthropic_api: {
    label: 'Anthropic API',
    toolId: 'anthropic_api',
    plans: [{ id: 'api_direct', label: 'API Direct', auditPlan: 'usage' }],
  },
  openai_api: {
    label: 'OpenAI API',
    toolId: 'openai_api',
    plans: [{ id: 'api_direct', label: 'API Direct', auditPlan: 'usage' }],
  },
  gemini: {
    label: 'Gemini',
    toolId: 'gemini',
    plans: [
      { id: 'pro', label: 'Pro', auditPlan: 'pro' },
      { id: 'ultra', label: 'Ultra', auditPlan: 'ultra' },
      { id: 'api', label: 'API', auditPlan: 'api' },
    ],
  },
  windsurf: {
    label: 'Windsurf',
    toolId: 'windsurf',
    plans: [
      { id: 'free', label: 'Free', auditPlan: 'free' },
      { id: 'pro', label: 'Pro', auditPlan: 'pro' },
      { id: 'teams', label: 'Teams', auditPlan: 'teams' },
      { id: 'enterprise', label: 'Enterprise', auditPlan: 'teams' },
    ],
  },
} satisfies Record<string, ProviderConfig>

const BILLING_TYPES: Array<{ id: BillingType; label: string; description: string }> = [
  { id: 'subscription', label: 'Subscription', description: 'Fixed recurring seats' },
  { id: 'api-usage', label: 'API Usage', description: 'Usage-based billing' },
  { id: 'hybrid', label: 'Hybrid', description: 'Mix of seats and API usage' },
]

const USAGE_FREQUENCIES: Array<{ id: UsageFrequency; label: string }> = [
  { id: 'daily', label: 'Daily' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'occasionally', label: 'Occasionally' },
]

const TOOL_USE_CASES: Array<{ id: UsageFocus; label: string }> = [
  { id: 'coding', label: 'Coding' },
  { id: 'writing', label: 'Writing' },
  { id: 'research', label: 'Research' },
  { id: 'data', label: 'Data Analysis' },
  { id: 'customer-support', label: 'Customer Support' },
  { id: 'automation', label: 'Automation' },
  { id: 'mixed', label: 'Mixed' },
]

const INDUSTRIES = ['Software', 'SaaS', 'AI', 'Fintech', 'Healthtech', 'E-commerce', 'Media', 'Consulting', 'Other'] as const

function getDefaultProviderPlan(providerId: keyof typeof TOOL_CONFIG): ProviderPlan {
  return TOOL_CONFIG[providerId].plans[0]
}

function createRichToolEntry(providerId: keyof typeof TOOL_CONFIG = 'cursor'): RichToolEntry {
  const defaultPlan = getDefaultProviderPlan(providerId)
  return {
    id: crypto.randomUUID(),
    providerId,
    planId: defaultPlan.id,
    monthlySpend: 0,
    seats: 1,
    billingType: 'subscription',
    useCases: ['mixed'],
    usageFrequency: 'daily',
    notes: '',
  }
}

function normalizeRichToolEntry(entry: Partial<RichToolEntry> & { id?: string }): RichToolEntry {
  const providerId = entry.providerId && entry.providerId in TOOL_CONFIG ? entry.providerId : 'cursor'
  const config = TOOL_CONFIG[providerId as keyof typeof TOOL_CONFIG]
  const planExists = entry.planId ? config.plans.some(plan => plan.id === entry.planId) : false
  const defaultPlan = getDefaultProviderPlan(providerId as keyof typeof TOOL_CONFIG)

  return {
    id: entry.id || crypto.randomUUID(),
    providerId: providerId as keyof typeof TOOL_CONFIG,
    planId: planExists ? (entry.planId as string) : defaultPlan.id,
    monthlySpend: Number(entry.monthlySpend ?? 0),
    seats: Math.max(1, Number(entry.seats ?? 1)),
    billingType: entry.billingType === 'api-usage' || entry.billingType === 'hybrid' ? entry.billingType : 'subscription',
    useCases: Array.isArray(entry.useCases) && entry.useCases.length > 0 ? Array.from(new Set(entry.useCases)) as UsageFocus[] : ['mixed'],
    usageFrequency: entry.usageFrequency === 'weekly' || entry.usageFrequency === 'occasionally' ? entry.usageFrequency : 'daily',
    notes: typeof entry.notes === 'string' ? entry.notes : '',
  }
}

function richToolEntryToAuditTool(entry: RichToolEntry): ToolInput {
  const provider = TOOL_CONFIG[entry.providerId]
  const plan = provider.plans.find(option => option.id === entry.planId) ?? getDefaultProviderPlan(entry.providerId)

  return {
    toolId: provider.toolId,
    plan: plan.auditPlan,
    seats: entry.seats,
    monthlySpend: entry.monthlySpend,
  }
}

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

function normalizeDraft(draft: unknown) {
  const fallbackEntry = createRichToolEntry()

  if (!draft || typeof draft !== 'object') {
    return {
      step: 1,
      companyName: '',
      industry: 'Other' as (typeof INDUSTRIES)[number],
      estimatedMonthlyBudget: 0,
      teamSize: 5,
      useCase: 'mixed' as UseCase,
      toolEntries: [fallbackEntry],
    }
  }

  const candidate = draft as Record<string, unknown>
  const rawToolEntries = Array.isArray(candidate.toolEntries) ? candidate.toolEntries : null

  if (rawToolEntries) {
    return {
      step: Math.min(Math.max(Number(candidate.step || 1), 1), 3),
      companyName: typeof candidate.companyName === 'string' ? candidate.companyName : '',
      industry:
        typeof candidate.industry === 'string' && INDUSTRIES.includes(candidate.industry as (typeof INDUSTRIES)[number])
          ? (candidate.industry as (typeof INDUSTRIES)[number])
          : ('Other' as (typeof INDUSTRIES)[number]),
      estimatedMonthlyBudget: Number(candidate.estimatedMonthlyBudget || 0),
      teamSize: Math.max(1, Number(candidate.teamSize || 5)),
      useCase: USE_CASES.includes(candidate.useCase as UseCase) ? (candidate.useCase as UseCase) : 'mixed',
      toolEntries: rawToolEntries.map(entry => normalizeRichToolEntry(entry as Partial<RichToolEntry> & { id?: string })),
    }
  }

  const legacySelectedTools = Array.isArray(candidate.selectedTools) ? candidate.selectedTools : []
  const legacyTools = Array.isArray(candidate.tools) ? candidate.tools : []

  const toolEntries = legacySelectedTools
    .map((toolIdValue: unknown) => {
      const toolId = typeof toolIdValue === 'string' ? toolIdValue : ''
      const legacyTool = legacyTools.find((tool: unknown) => {
        return tool && typeof tool === 'object' && (tool as Record<string, unknown>).toolId === toolId
      }) as Record<string, unknown> | undefined

      if (!toolId || !Object.prototype.hasOwnProperty.call(TOOLS, toolId)) {
        return null
      }

      const providerId = toolId as keyof typeof TOOL_CONFIG
      const planName = typeof legacyTool?.plan === 'string' ? legacyTool.plan : getDefaultProviderPlan(providerId).id
      const normalizedPlan = TOOL_CONFIG[providerId].plans.find(plan => plan.id === planName) ? planName : getDefaultProviderPlan(providerId).id

      return normalizeRichToolEntry({
        id: typeof legacyTool?.toolId === 'string' ? `${legacyTool.toolId}_${toolId}` : undefined,
        providerId,
        planId: normalizedPlan,
        monthlySpend: Number(legacyTool?.monthlySpend || 0),
        seats: Number(legacyTool?.seats || 1),
        billingType: 'subscription',
        useCases: ['mixed'],
        usageFrequency: 'daily',
        notes: '',
      })
    })
    .filter((entry): entry is RichToolEntry => Boolean(entry))

  return {
    step: Math.min(Math.max(Number(candidate.step || 1), 1), 3),
    companyName: '',
    industry: 'Other' as (typeof INDUSTRIES)[number],
    estimatedMonthlyBudget: 0,
    teamSize: Math.max(1, Number(candidate.teamSize || 5)),
    useCase: USE_CASES.includes(candidate.useCase as UseCase) ? (candidate.useCase as UseCase) : 'mixed',
    toolEntries: toolEntries.length > 0 ? toolEntries : [fallbackEntry],
  }
}

export function SpendForm() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [companyName, setCompanyName] = useState('')
  const [industry, setIndustry] = useState<(typeof INDUSTRIES)[number]>('Other')
  const [teamSize, setTeamSize] = useState(5)
  const [useCase, setUseCase] = useState<UseCase>('mixed')
  const [estimatedMonthlyBudget, setEstimatedMonthlyBudget] = useState(0)
  const [toolEntries, setToolEntries] = useState<RichToolEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [hydrated, setHydrated] = useState(false)

  const tools = useMemo(() => toolEntries.map(entry => richToolEntryToAuditTool(entry)), [toolEntries])
  const totalMonthlySpend = useMemo(
    () => toolEntries.reduce((sum, entry) => sum + entry.monthlySpend, 0),
    [toolEntries],
  )

  useEffect(() => {
    const draft = normalizeDraft(getDraft())
    setStep(draft.step)
    setCompanyName(draft.companyName)
    setIndustry(draft.industry)
    setEstimatedMonthlyBudget(draft.estimatedMonthlyBudget)
    setTeamSize(draft.teamSize)
    setUseCase(draft.useCase)
    setToolEntries(draft.toolEntries)
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return

    saveDraft({
      step,
      companyName,
      industry,
      estimatedMonthlyBudget,
      teamSize,
      useCase,
      toolEntries,
    } as any)
  }, [hydrated, step, companyName, industry, estimatedMonthlyBudget, teamSize, useCase, toolEntries])

  const addToolEntry = () => {
    setToolEntries(prev => [...prev, createRichToolEntry(prev.length === 0 ? 'cursor' : 'github_copilot')])
  }

  const removeToolEntry = (entryId: string) => {
    setToolEntries(prev => {
      const nextEntries = prev.filter(entry => entry.id !== entryId)
      return nextEntries.length > 0 ? nextEntries : [createRichToolEntry()]
    })
  }

  const updateToolEntry = <K extends keyof RichToolEntry>(entryId: string, field: K, value: RichToolEntry[K]) => {
    setToolEntries(prev =>
      prev.map(entry => {
        if (entry.id !== entryId) {
          return entry
        }

        if (field === 'providerId') {
          const nextProviderId = value as keyof typeof TOOL_CONFIG
          return {
            ...entry,
            providerId: nextProviderId,
            planId: getDefaultProviderPlan(nextProviderId).id,
            monthlySpend: 0,
          }
        }

        return {
          ...entry,
          [field]: value,
        }
      }),
    )
  }

  const updateTool = <K extends keyof ToolInput>(toolId: string, field: K, value: ToolInput[K]) => {
    setToolEntries(prev =>
      prev.map(entry => {
        const auditTool = richToolEntryToAuditTool(entry)
        if (auditTool.toolId !== toolId) {
          return entry
        }

        if (field === 'plan') {
          const providerPlans = TOOL_CONFIG[entry.providerId].plans
          const matchedPlan = providerPlans.find(plan => plan.auditPlan === value || plan.id === value)
          return {
            ...entry,
            planId: matchedPlan?.id ?? entry.planId,
          }
        }

        if (field === 'seats') {
          return {
            ...entry,
            seats: Math.max(1, Number(value) || 1),
          }
        }

        if (field === 'monthlySpend') {
          return {
            ...entry,
            monthlySpend: Math.max(0, Number(value) || 0),
          }
        }

        return entry
      }),
    )
  }

  const goToToolDetails = () => {
    if (companyName.trim().length === 0) {
      window.alert('Please enter a team or company name')
      return
    }

    if (toolEntries.length === 0) {
      window.alert('Please add at least one tool')
      return
    }

    setStep(2)
  }

  const handleSubmit = async () => {
    if (tools.length === 0) {
      window.alert('Please add at least one tool')
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
                <h2 className="mt-1 text-2xl font-semibold text-white">Spend Intake</h2>
                <p className="mt-2 text-sm text-slate-400">
                  Capture the company profile and every AI tool in use before the audit runs.
                </p>
              </div>
              <p className="hidden text-sm text-slate-400 sm:block">Auto-saves on every change.</p>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-[0.95fr_1.25fr]">
              <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/40 p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white">Company profile</h3>
                    <p className="mt-1 text-sm text-slate-400">Foundational details for the spend audit.</p>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <label className="space-y-2 text-sm text-slate-300 sm:col-span-2">
                    <span className="block text-xs uppercase tracking-[0.18em] text-slate-500">Team / company name</span>
                    <input
                      type="text"
                      value={companyName}
                      onChange={event => setCompanyName(event.target.value)}
                      placeholder="e.g. Northstar AI"
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-emerald-400/40"
                    />
                  </label>

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

                  <label className="space-y-2 text-sm text-slate-300">
                    <span className="block text-xs uppercase tracking-[0.18em] text-slate-500">Industry</span>
                    <select
                      value={industry}
                      onChange={event => setIndustry(event.target.value as (typeof INDUSTRIES)[number])}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-white outline-none transition focus:border-emerald-400/40"
                    >
                      {INDUSTRIES.map(industryOption => (
                        <option key={industryOption} value={industryOption} className="bg-slate-950 text-white">
                          {industryOption}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="space-y-2 text-sm text-slate-300">
                    <span className="block text-xs uppercase tracking-[0.18em] text-slate-500">Primary AI usage</span>
                    <select
                      value={useCase}
                      onChange={event => setUseCase(event.target.value as UseCase)}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-white outline-none transition focus:border-emerald-400/40"
                    >
                      {USE_CASES.map(caseOption => (
                        <option key={caseOption} value={caseOption} className="bg-slate-950 text-white">
                          {caseOption.charAt(0).toUpperCase() + caseOption.slice(1)}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="space-y-2 text-sm text-slate-300 sm:col-span-2">
                    <span className="block text-xs uppercase tracking-[0.18em] text-slate-500">Estimated monthly AI budget</span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={estimatedMonthlyBudget}
                      onChange={event => setEstimatedMonthlyBudget(Math.max(0, Number(event.target.value) || 0))}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-white outline-none transition focus:border-emerald-400/40"
                    />
                    <p className="text-xs text-slate-500">Current estimate: {formatMoney(estimatedMonthlyBudget)}</p>
                  </label>
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/40 p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white">AI tool stack</h3>
                    <p className="mt-1 text-sm text-slate-400">Add every tool and model the current billing setup.</p>
                  </div>
                  <button
                    type="button"
                    onClick={addToolEntry}
                    className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-sm font-semibold text-emerald-200 transition hover:border-emerald-400/40 hover:bg-emerald-400/15"
                  >
                    + Add tool
                  </button>
                </div>

                <div className="mt-5 space-y-4">
                  {toolEntries.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 px-4 py-8 text-center text-sm text-slate-400">
                      Add a tool entry to start modeling your spend.
                    </div>
                  ) : (
                    toolEntries.map(entry => {
                      const provider = TOOL_CONFIG[entry.providerId]

                      return (
                        <article key={entry.id} className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 shadow-sm">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Tool entry</p>
                              <h4 className="mt-1 text-base font-semibold text-white">{provider.label}</h4>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeToolEntry(entry.id)}
                              className="text-sm text-slate-400 transition hover:text-white"
                            >
                              Remove
                            </button>
                          </div>

                          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            <label className="space-y-2 text-sm text-slate-300">
                              <span className="block text-xs uppercase tracking-[0.18em] text-slate-500">AI provider</span>
                              <select
                                value={entry.providerId}
                                onChange={event => updateToolEntry(entry.id, 'providerId', event.target.value as keyof typeof TOOL_CONFIG)}
                                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-white outline-none transition focus:border-emerald-400/40"
                              >
                                {Object.entries(TOOL_CONFIG).map(([providerId, providerOption]) => (
                                  <option key={providerId} value={providerId} className="bg-slate-950 text-white">
                                    {providerOption.label}
                                  </option>
                                ))}
                              </select>
                            </label>

                            <label className="space-y-2 text-sm text-slate-300">
                              <span className="block text-xs uppercase tracking-[0.18em] text-slate-500">Plan</span>
                              <select
                                value={entry.planId}
                                onChange={event => updateToolEntry(entry.id, 'planId', event.target.value)}
                                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-white outline-none transition focus:border-emerald-400/40"
                              >
                                {provider.plans.map(plan => (
                                  <option key={plan.id} value={plan.id} className="bg-slate-950 text-white">
                                    {plan.label}
                                  </option>
                                ))}
                              </select>
                            </label>

                            <label className="space-y-2 text-sm text-slate-300">
                              <span className="block text-xs uppercase tracking-[0.18em] text-slate-500">Monthly spend</span>
                              <input
                                type="number"
                                min="0"
                                step="1"
                                value={entry.monthlySpend}
                                onChange={event => updateToolEntry(entry.id, 'monthlySpend', Math.max(0, Number(event.target.value) || 0))}
                                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-white outline-none transition focus:border-emerald-400/40"
                              />
                              <p className="text-xs text-slate-500">Recorded as {formatMoney(entry.monthlySpend)} / month</p>
                            </label>

                            <label className="space-y-2 text-sm text-slate-300">
                              <span className="block text-xs uppercase tracking-[0.18em] text-slate-500">Number of seats</span>
                              <input
                                type="number"
                                min="1"
                                step="1"
                                value={entry.seats}
                                onChange={event => updateToolEntry(entry.id, 'seats', Math.max(1, Number(event.target.value) || 1))}
                                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-white outline-none transition focus:border-emerald-400/40"
                              />
                            </label>

                            <div className="space-y-2 text-sm text-slate-300 md:col-span-2 lg:col-span-2">
                              <span className="block text-xs uppercase tracking-[0.18em] text-slate-500">Billing type</span>
                              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
                                {BILLING_TYPES.map(option => (
                                  <button
                                    key={option.id}
                                    type="button"
                                    onClick={() => updateToolEntry(entry.id, 'billingType', option.id)}
                                    className={`rounded-xl border px-3 py-3 text-left transition ${
                                      entry.billingType === option.id
                                        ? 'border-emerald-400/40 bg-emerald-400/10 text-white'
                                        : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:bg-white/10'
                                    }`}
                                  >
                                    <span className="block text-sm font-medium">{option.label}</span>
                                    <span className="mt-1 block text-[11px] text-slate-500">{option.description}</span>
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div className="space-y-2 text-sm text-slate-300 md:col-span-2 lg:col-span-3">
                              <span className="block text-xs uppercase tracking-[0.18em] text-slate-500">Primary use case</span>
                              <div className="flex flex-wrap gap-2">
                                {TOOL_USE_CASES.map(useCaseOption => {
                                  const isActive = entry.useCases.includes(useCaseOption.id)

                                  return (
                                    <button
                                      key={useCaseOption.id}
                                      type="button"
                                      onClick={() => {
                                        const nextUseCases = isActive
                                          ? entry.useCases.filter(value => value !== useCaseOption.id)
                                          : [...entry.useCases, useCaseOption.id]

                                        updateToolEntry(entry.id, 'useCases', nextUseCases.length > 0 ? nextUseCases : ['mixed'])
                                      }}
                                      className={`rounded-full border px-3 py-2 text-sm transition ${
                                        isActive
                                          ? 'border-emerald-400/40 bg-emerald-400/10 text-white'
                                          : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:bg-white/10'
                                      }`}
                                    >
                                      {useCaseOption.label}
                                    </button>
                                  )
                                })}
                              </div>
                            </div>

                            <div className="space-y-2 text-sm text-slate-300 md:col-span-2 lg:col-span-3">
                              <span className="block text-xs uppercase tracking-[0.18em] text-slate-500">Usage frequency</span>
                              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                                {USAGE_FREQUENCIES.map(option => (
                                  <button
                                    key={option.id}
                                    type="button"
                                    onClick={() => updateToolEntry(entry.id, 'usageFrequency', option.id)}
                                    className={`rounded-xl border px-3 py-3 text-left transition ${
                                      entry.usageFrequency === option.id
                                        ? 'border-emerald-400/40 bg-emerald-400/10 text-white'
                                        : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:bg-white/10'
                                    }`}
                                  >
                                    <span className="block text-sm font-medium">{option.label}</span>
                                  </button>
                                ))}
                              </div>
                            </div>

                            <label className="space-y-2 text-sm text-slate-300 md:col-span-2 lg:col-span-3">
                              <span className="block text-xs uppercase tracking-[0.18em] text-slate-500">Optional notes</span>
                              <textarea
                                rows={3}
                                value={entry.notes}
                                onChange={event => updateToolEntry(entry.id, 'notes', event.target.value)}
                                placeholder="Context like seat mix, billing quirks, or special contract terms."
                                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-emerald-400/40"
                              />
                            </label>
                          </div>
                        </article>
                      )
                    })
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={goToToolDetails}
                className="inline-flex items-center gap-2 rounded-full bg-emerald-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:bg-slate-600 disabled:text-slate-300"
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
