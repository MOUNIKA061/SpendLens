/*
  COPILOT INSTRUCTIONS — update auditTools() to use ALL intake fields:

  1. BILLING TYPE (tool.billingType: 'subscription' | 'api' | 'hybrid')
     - If 'subscription': run right-size check + cross-tool check as normal
     - If 'api': skip plan checks entirely. Instead compare tool.monthlySpend
       against the cheapest subscription equivalent for the same use case.
       If subscription would be cheaper, recommend switching. If API is cheaper, say so.
     - If 'hybrid': run both checks, note in reason that costs may vary month to month.

  2. PER-TOOL USE CASE (tool.useCase: 'coding'|'writing'|'research'|'data'|'customer_support'|'automation'|'mixed')
     - Each tool now has its OWN useCase, not just a global one.
     - Use tool.useCase (not input.useCase) inside getCheaperAlternative() and checkApiVsSubscription().
     - Keep input.useCase as a fallback if tool.useCase is undefined.

  3. USAGE FREQUENCY (tool.usageFrequency: 'daily' | 'weekly' | 'occasionally')
     - 'daily': user is a heavy user — subscription plans are likely worth it.
       Only recommend API if spend > $100/mo.
     - 'weekly': moderate user — compare subscription vs API breakeven point.
       Flag API if spend > $50/mo.
     - 'occasionally': light user — subscriptions are almost always wasteful.
       Always recommend API or free tier if available. Add to reason:
       "You're paying for a full subscription but using it occasionally —
        consider downgrading to free tier or switching to pay-per-use API."

  4. SEATS vs TEAM SIZE overpurchase check
     - If tool.seats > input.teamSize:
         waste = tool.seats - input.teamSize
         savings = waste * planConfig.pricePerSeat
         flag: "You have {waste} unused seats. Reducing to {input.teamSize} seats
                saves ${savings}/mo."
     - If tool.seats < input.teamSize and plan has maxSeats: null (unlimited):
         no action needed
     - If tool.seats < input.teamSize and plan has maxSeats: 1 (individual plan):
         flag: "You have {input.teamSize} people but only {tool.seats} individual license.
                Consider upgrading to a team plan or adding seats."

  ALSO update the ToolInput type to include:
    billingType: 'subscription' | 'api' | 'hybrid'
    useCase: 'coding' | 'writing' | 'research' | 'data' | 'customer_support' | 'automation' | 'mixed'
    usageFrequency: 'daily' | 'weekly' | 'occasionally'

  Keep all existing checks (right-size, cross-tool, credits, api-vs-subscription).
  All reason strings must include actual dollar amounts, not vague descriptions.
*/



import { TOOLS } from './pricingData'
import { AuditInput, ToolAuditResult, UseCase } from '@/types'

type ToolId = keyof typeof TOOLS
type PlanConfig = { label: string; pricePerSeat: number | null; maxSeats: number | null }

const CREDEX_DISCOUNT = 0.15
const CREDEX_MIN_MONTHLY_THRESHOLD = 50

const USE_CASE_ALTERNATIVES: Record<
  UseCase,
  { toolId: ToolId; planKey: string; reason: string }[]
> = {
  coding: [
    {
      toolId: 'windsurf',
      planKey: 'pro',
      reason:
        'Windsurf Pro ($15/seat) is a strong coding assistant with full autocomplete and chat - cheaper than most alternatives for solo developers.',
    },
    {
      toolId: 'github_copilot',
      planKey: 'individual',
      reason:
        'GitHub Copilot Individual ($10/seat) integrates directly into your editor and is purpose-built for code completion.',
    },
    {
      toolId: 'cursor',
      planKey: 'pro',
      reason:
        'Cursor Pro ($20/seat) offers deep codebase awareness and agent-mode editing, worth it if you need more than autocomplete.',
    },
  ],
  writing: [
    {
      toolId: 'claude',
      planKey: 'pro',
      reason:
        'Claude Pro ($20/seat) excels at long-form writing, editing, and document drafting with a 200K context window.',
    },
    {
      toolId: 'chatgpt',
      planKey: 'plus',
      reason:
        'ChatGPT Plus ($20/seat) covers general writing tasks well and includes GPT-4o access.',
    },
  ],
  research: [
    {
      toolId: 'claude',
      planKey: 'pro',
      reason:
        'Claude Pro ($20/seat) handles long documents and research synthesis with a 200K token context window - ideal for reading and summarising papers.',
    },
    {
      toolId: 'chatgpt',
      planKey: 'plus',
      reason:
        'ChatGPT Plus ($20/seat) includes web browsing and can pull current sources - useful for live research tasks.',
    },
  ],
  data: [
    {
      toolId: 'chatgpt',
      planKey: 'plus',
      reason:
        'ChatGPT Plus ($20/seat) includes the Code Interpreter/Advanced Data Analysis tool - good for ad-hoc data work without an API.',
    },
    {
      toolId: 'anthropic_api',
      planKey: 'usage',
      reason:
        'Anthropic API (usage-based) is cheaper than a flat subscription if your data workloads are bursty - you only pay per token used.',
    },
  ],
  customer_support: [
    {
      toolId: 'chatgpt',
      planKey: 'plus',
      reason:
        'ChatGPT Plus ($20/seat) can be integrated into support workflows for quick ticket triage and suggested replies.',
    },
    {
      toolId: 'claude',
      planKey: 'pro',
      reason:
        'Claude Pro ($20/seat) is strong at conversational flows and safety-sensitive summarization for support teams.',
    },
  ],
  automation: [
    {
      toolId: 'anthropic_api',
      planKey: 'usage',
      reason:
        'Anthropic API (usage-based) is often the most cost-effective for automation that runs programmatically.',
    },
    {
      toolId: 'openai_api',
      planKey: 'usage',
      reason:
        'OpenAI API (usage-based) can be cheaper for automation-heavy workloads where token usage is predictable and optimized.',
    },
  ],
  mixed: [
    {
      toolId: 'claude',
      planKey: 'pro',
      reason:
        'Claude Pro ($20/seat) handles writing, research, and some coding tasks - a solid general-purpose choice if your team uses AI for varied work.',
    },
    {
      toolId: 'chatgpt',
      planKey: 'plus',
      reason:
        'ChatGPT Plus ($20/seat) covers mixed workloads well across writing, coding help, and data analysis.',
    },
  ],
}

function getPlanCost(toolId: ToolId, planKey: string, seats: number): number | null {
  const plans = TOOLS[toolId].plans as Record<string, PlanConfig>
  const plan = plans[planKey]
  if (!plan) return null
  if (plan.pricePerSeat === null) return null
  return plan.pricePerSeat * seats
}

function checkRightSize(
  toolId: ToolId,
  currentPlanKey: string,
  seats: number,
  currentSpend: number
): { action: string; savings: number; reason: string } | null {
  const toolDef = TOOLS[toolId]
  const plans = toolDef.plans as Record<string, PlanConfig>

  let bestSavings = 0
  let bestPlan: { label: string; cost: number; key: string } | null = null

  for (const [planKey, planConfig] of Object.entries(plans)) {
    if (planKey === currentPlanKey) continue
    if (planConfig.pricePerSeat === null) continue

    const supportsSeats =
      planConfig.maxSeats === null || planConfig.maxSeats >= seats

    if (!supportsSeats) continue

    const cost = planConfig.pricePerSeat * seats
    const savings = currentSpend - cost

    if (savings > bestSavings) {
      bestSavings = savings
      bestPlan = { label: planConfig.label, cost, key: planKey }
    }
  }

  if (!bestPlan || bestSavings <= 10) return null

  const currentPlan = plans[currentPlanKey]
  return {
    action: `Downgrade to ${toolDef.name} ${bestPlan.label}`,
    savings: bestSavings,
    reason: `You're paying $${currentSpend}/mo on ${currentPlan?.label ?? currentPlanKey} for ${seats} seat${seats > 1 ? 's' : ''}. ${toolDef.name} ${bestPlan.label} covers ${seats} seat${seats > 1 ? 's' : ''} at $${bestPlan.cost}/mo - saving $${bestSavings}/mo.`,
  }
}

function checkCrossToolAlternative(
  toolId: ToolId,
  seats: number,
  currentSpend: number,
  useCase: UseCase
): { action: string; savings: number; reason: string } | null {
  const alternatives = USE_CASE_ALTERNATIVES[useCase] ?? []

  let bestSavings = 0
  let bestAlt: { toolId: ToolId; planKey: string; cost: number; reason: string } | null = null

  for (const alt of alternatives) {
    if (alt.toolId === toolId) continue

    const altCost = getPlanCost(alt.toolId, alt.planKey, seats)
    if (altCost === null) continue

    const savings = currentSpend - altCost
    if (savings > bestSavings) {
      bestSavings = savings
      bestAlt = { ...alt, cost: altCost }
    }
  }

  if (!bestAlt || bestSavings <= 10) return null

  const altTool = TOOLS[bestAlt.toolId]
  const altPlans = altTool.plans as Record<string, PlanConfig>
  const altPlan = altPlans[bestAlt.planKey]
  if (!altPlan) return null

  return {
    action: `Switch to ${altTool.name} ${altPlan.label}`,
    savings: bestSavings,
    reason: `For ${useCase} work, ${altTool.name} ${altPlan.label} costs $${bestAlt.cost}/mo for ${seats} seat${seats > 1 ? 's' : ''} vs your current $${currentSpend}/mo - saving $${bestSavings}/mo. ${bestAlt.reason}`,
  }
}

function checkCreditsOpportunity(
  toolName: string,
  currentSpend: number
): { action: string; savings: number; reason: string } | null {
  if (currentSpend < CREDEX_MIN_MONTHLY_THRESHOLD) return null

  const savings = Math.round(currentSpend * CREDEX_DISCOUNT)
  if (savings <= 10) return null

  return {
    action: `Purchase ${toolName} credits through Credex`,
    savings,
    reason: `You're paying $${currentSpend}/mo at retail. Credex sources discounted AI credits - a ~${Math.round(CREDEX_DISCOUNT * 100)}% discount would save approximately $${savings}/mo ($${savings * 12}/yr) on this tool alone.`,
  }
}

function checkApiVsSubscription(
  toolId: ToolId,
  currentSpend: number,
  useCase: UseCase
): { action: string; savings: number; reason: string } | null {
  if (useCase !== 'data' && useCase !== 'mixed') return null
  if (currentSpend < 40) return null

  const hasApiEquivalent =
    (toolId === 'claude' || toolId === 'chatgpt')

  if (!hasApiEquivalent) return null

  const apiToolId: ToolId = toolId === 'claude' ? 'anthropic_api' : 'openai_api'
  const apiTool = TOOLS[apiToolId]

  return {
    action: `Evaluate switching to ${apiTool.name} (usage-based)`,
    savings: 0,
    reason: `At $${currentSpend}/mo on a flat subscription for ${useCase} work, you may save by switching to ${apiTool.name} (pay-per-token). This is worth investigating if your usage is uneven across the month - flat plans overpay during slow weeks.`,
  }
}

export function auditTools(input: AuditInput): ToolAuditResult[] {
  const results: ToolAuditResult[] = []

  for (const tool of input.tools) {
    const toolId = tool.toolId as ToolId
    const toolConfig = TOOLS[toolId]
    if (!toolConfig) continue

    const plans = toolConfig.plans as Record<string, PlanConfig>
    const planConfig = plans[tool.plan]
    if (!planConfig) continue

    const currentSpend = tool.monthlySpend
    const seats = tool.seats

    const candidates: { action: string; savings: number; reason: string }[] = []

    const rightSize = checkRightSize(toolId, tool.plan, seats, currentSpend)
    if (rightSize) candidates.push(rightSize)

    const crossTool = checkCrossToolAlternative(toolId, seats, currentSpend, input.useCase)
    if (crossTool) candidates.push(crossTool)

    const apiCheck = checkApiVsSubscription(toolId, currentSpend, input.useCase)
    if (apiCheck) candidates.push(apiCheck)

    const best = candidates.sort((a, b) => b.savings - a.savings)[0]

    let recommendedAction = 'No change needed'
    let monthlySavings = 0
    let reason = `Your current ${toolConfig.name} ${planConfig.label} plan appears well-matched to your usage.`

    if (best) {
      recommendedAction = best.action
      monthlySavings = best.savings
      reason = best.reason
    }

    const creditsNote = checkCreditsOpportunity(toolConfig.name, currentSpend)
    if (creditsNote) {
      if (!best) {
        recommendedAction = creditsNote.action
        monthlySavings = creditsNote.savings
        reason = creditsNote.reason
      } else {
        reason += ` Additionally, ${creditsNote.reason.toLowerCase()}`
      }
    }

    results.push({
      toolId,
      toolName: toolConfig.name,
      currentSpend,
      recommendedAction,
      monthlySavings,
      reason,
    })
  }

  return results.sort((a, b) => b.monthlySavings - a.monthlySavings)
}
