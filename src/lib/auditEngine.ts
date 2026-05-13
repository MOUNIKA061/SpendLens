import { TOOLS } from './pricingData'
import {
  AuditInput,
  ToolAuditResult,
  UseCase,
  OnboardingFriction,
  ToolCapabilities,
  RecommendationConfidence,
  RecommendationPriority,
  BillingType,
} from '@/types'

type ToolId = keyof typeof TOOLS
type PlanConfig = { label: string; pricePerSeat: number | null; maxSeats: number | null }

const CREDEX_DISCOUNT = 0.15
const CREDEX_MIN_MONTHLY_THRESHOLD = 50
const CAPABILITY_COMPATIBILITY_THRESHOLD = 0.75
const HOURLY_RATE_DEFAULT = 100
const ONBOARDING_HOURS = { low: 2, medium: 6, high: 12 }

/**
 * Dynamic capability weighting per use case.
 * Different use cases prioritize different capabilities.
 * Example: coding prioritizes agentEditing, research prioritizes longContext.
 */
const CAPABILITY_WEIGHTS_BY_USE_CASE: Record<UseCase, Record<keyof ToolCapabilities, number>> = {
  coding: {
    codingDepth: 0.25,
    autocompleteQuality: 0.2,
    agentEditing: 0.25,
    longContextSupport: 0.1,
    enterpriseFeatures: 0.08,
    workflowAutomation: 0.07,
    dataAnalysisStrength: 0.05,
  },
  writing: {
    workflowAutomation: 0.2,
    longContextSupport: 0.25,
    autocompleteQuality: 0.15,
    codingDepth: 0.05,
    agentEditing: 0.08,
    enterpriseFeatures: 0.12,
    dataAnalysisStrength: 0.15,
  },
  research: {
    longContextSupport: 0.3,
    dataAnalysisStrength: 0.25,
    workflowAutomation: 0.15,
    enterpriseFeatures: 0.1,
    codingDepth: 0.05,
    autocompleteQuality: 0.05,
    agentEditing: 0.1,
  },
  data: {
    dataAnalysisStrength: 0.35,
    longContextSupport: 0.25,
    codingDepth: 0.15,
    workflowAutomation: 0.15,
    enterpriseFeatures: 0.05,
    autocompleteQuality: 0.03,
    agentEditing: 0.02,
  },
  customer_support: {
    workflowAutomation: 0.25,
    longContextSupport: 0.2,
    codingDepth: 0.05,
    autocompleteQuality: 0.05,
    dataAnalysisStrength: 0.1,
    enterpriseFeatures: 0.2,
    agentEditing: 0.15,
  },
  automation: {
    codingDepth: 0.2,
    agentEditing: 0.2,
    workflowAutomation: 0.3,
    dataAnalysisStrength: 0.1,
    longContextSupport: 0.1,
    enterpriseFeatures: 0.08,
    autocompleteQuality: 0.02,
  },
  mixed: {
    codingDepth: 0.15,
    autocompleteQuality: 0.12,
    longContextSupport: 0.15,
    enterpriseFeatures: 0.1,
    agentEditing: 0.15,
    workflowAutomation: 0.15,
    dataAnalysisStrength: 0.18,
  },
}

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

interface Candidate {
  action: string
  savings: number
  reason: string
  compatibilityScore?: number
  switchingCost?: number
  netAnnualSavings?: number
  confidence: RecommendationConfidence
  priority: RecommendationPriority
  riskLevel: 'low' | 'medium' | 'high'
}

function getPlanCost(toolId: ToolId, planKey: string, seats: number): number | null {
  const plans = TOOLS[toolId].plans as Record<string, PlanConfig>
  const plan = plans[planKey]
  if (!plan) return null
  if (plan.pricePerSeat === null) return null
  return plan.pricePerSeat * seats
}

function calculateCapabilityScore(
  currentToolCaps: ToolCapabilities | undefined,
  altToolCaps: ToolCapabilities | undefined,
  useCase: UseCase,
): number {
  if (!currentToolCaps || !altToolCaps) return 0.5

  // Use dynamic weights based on the specific use case
  const weights = CAPABILITY_WEIGHTS_BY_USE_CASE[useCase] || CAPABILITY_WEIGHTS_BY_USE_CASE['mixed']
  let totalScore = 0

  for (const [cap, weight] of Object.entries(weights)) {
    const current = currentToolCaps[cap as keyof ToolCapabilities] || 5
    const alt = altToolCaps[cap as keyof ToolCapabilities] || 5
    // For critical capabilities, shortfalls are more severe (punish inadequate scores)
    const capScore =
      weight > 0.2
        ? Math.pow(Math.min(alt / Math.max(current, 1), 1), 1.2)
        : Math.min(alt / Math.max(current, 1), 1)
    totalScore += capScore * weight
  }

  return Math.min(totalScore, 1)
}

function estimateSwitchingCost(
  seats: number,
  onboardingFriction: OnboardingFriction | undefined,
): number {
  const hours = ONBOARDING_HOURS[onboardingFriction || 'low']
  return Math.round(seats * hours * HOURLY_RATE_DEFAULT)
}

function validatePricingFreshness(verifiedAt: string | undefined): {
  isStale: boolean
  daysSince: number
} {
  if (!verifiedAt) return { isStale: true, daysSince: 999 }
  const verifiedDate = new Date(verifiedAt)
  const today = new Date()
  const daysSince = Math.floor((today.getTime() - verifiedDate.getTime()) / (1000 * 60 * 60 * 24))
  return { isStale: daysSince > 30, daysSince }
}

/**
 * Validates that the billing type is used with appropriate seat counts.
 * - 'subscription' and 'hybrid': seats should reflect actual users
 * - 'api': seats should be 1 (usage-based, not seat-based)
 * Returns { valid, message? }
 */
function validateBillingTypeSeats(
  billingType: BillingType,
  seats: number,
): { valid: boolean; message?: string } {
  if (billingType === 'api' && seats !== 1) {
    return {
      valid: false,
      message: `API billing should have seats=1 (usage-based). You provided seats=${seats}. API recommendations will not use seat-based logic.`,
    }
  }
  if ((billingType === 'subscription' || billingType === 'hybrid') && seats < 1) {
    return {
      valid: false,
      message: `Subscription/Hybrid billing requires seats≥1. You provided seats=${seats}.`,
    }
  }
  return { valid: true }
}

function detectUnderutilization(
  seats: number,
  activeUsers: number | undefined,
  utilizationPercent: number | undefined,
): { isUnderutilized: boolean; reason?: string; waste?: number } {
  if (activeUsers !== undefined && activeUsers < seats * 0.5) {
    return {
      isUnderutilized: true,
      reason: `Only ${activeUsers} of ${seats} seats actively used (${Math.round((activeUsers / seats) * 100)}% utilization)`,
      waste: seats - activeUsers,
    }
  }
  if (utilizationPercent !== undefined && utilizationPercent < 50) {
    return {
      isUnderutilized: true,
      reason: `Tool utilization at only ${utilizationPercent}% of purchased capacity`,
      waste: undefined,
    }
  }
  return { isUnderutilized: false }
}

function calculateRecommendationScore(candidate: Candidate): number {
  const savingsScore = Math.min(candidate.savings / 100, 1) * 0.4
  const confidenceScore = { high: 1, medium: 0.6, low: 0.3 }[candidate.confidence] * 0.3
  const riskScore = { low: 0, medium: -0.15, high: -0.3 }[candidate.riskLevel]
  return savingsScore + confidenceScore + riskScore
}

function checkRightSize(
  toolId: ToolId,
  currentPlanKey: string,
  seats: number,
  currentSpend: number,
  billingType: BillingType,
): Candidate | null {
  // Right-sizing only applies to subscription-based billing (seats have meaning)
  // API billing is usage-based with no seat concept; compareApiBillingToSubscription handles that case
  if (billingType === 'api') return null

  const toolDef = TOOLS[toolId]
  const plans = toolDef.plans as Record<string, PlanConfig>
  let bestSavings = 0
  let bestPlan: { label: string; cost: number; key: string } | null = null

  for (const [planKey, planConfig] of Object.entries(plans)) {
    if (planKey === currentPlanKey) continue
    if (planConfig.pricePerSeat === null) continue
    const supportsSeats = planConfig.maxSeats === null || planConfig.maxSeats >= seats
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
    confidence: 'high',
    priority: 'high',
    riskLevel: 'low',
  }
}

function checkCrossToolAlternative(
  toolId: ToolId,
  seats: number,
  currentSpend: number,
  useCase: UseCase,
  billingType: BillingType,
): Candidate | null {
  // Cross-tool switching for seat-based subscription alternatives only
  // API billing (usage-based) is handled separately by compareApiBillingToSubscription
  if (billingType === 'api') return null

  const currentTool = TOOLS[toolId]
  const currentCaps = currentTool.capabilities
  const alternatives = USE_CASE_ALTERNATIVES[useCase] ?? []
  let bestSavings = 0
  let bestAlt: {
    toolId: ToolId
    planKey: string
    cost: number
    reason: string
    compatibilityScore: number
  } | null = null

  for (const alt of alternatives) {
    if (alt.toolId === toolId) continue
    const altCost = getPlanCost(alt.toolId, alt.planKey, seats)
    if (altCost === null) continue
    const savings = currentSpend - altCost
    const altTool = TOOLS[alt.toolId]
    // Use dynamic capability weighting based on use case for accurate compatibility scoring
    const compatScore = calculateCapabilityScore(currentCaps, altTool.capabilities, useCase)

    if (compatScore < CAPABILITY_COMPATIBILITY_THRESHOLD) continue
    if (savings > bestSavings) {
      bestSavings = savings
      bestAlt = {
        toolId: alt.toolId,
        planKey: alt.planKey,
        cost: altCost,
        reason: alt.reason,
        compatibilityScore: compatScore,
      }
    }
  }

  if (!bestAlt || bestSavings <= 10) return null

  const altTool = TOOLS[bestAlt.toolId]
  const altPlans = altTool.plans as Record<string, PlanConfig>
  const altPlan = altPlans[bestAlt.planKey]
  if (!altPlan) return null

  const switchingCost = estimateSwitchingCost(seats, altTool.onboardingFriction)
  const annualSavings = bestSavings * 12
  // Net annual savings = (monthly savings × 12) - switching cost.
  // Only recommend if net positive: ensures short-term onboarding pain is offset by long-term gain.
  const netAnnualSavings = annualSavings - switchingCost

  if (netAnnualSavings <= 0) return null

  const confidence =
    bestAlt.compatibilityScore > 0.85
      ? 'high'
      : bestAlt.compatibilityScore > 0.75
        ? 'medium'
        : 'low'
  const priority = netAnnualSavings > 500 ? 'high' : 'medium'

  return {
    action: `Switch to ${altTool.name} ${altPlan.label}`,
    savings: bestSavings,
    reason: `For ${useCase} work, ${altTool.name} ${altPlan.label} costs $${bestAlt.cost}/mo for ${seats} seat${seats > 1 ? 's' : ''} vs your current $${currentSpend}/mo — saving $${bestSavings}/mo. Estimated onboarding cost: $${switchingCost}. Net annual savings: $${netAnnualSavings}. Capability compatibility: ${Math.round(bestAlt.compatibilityScore * 100)}%.`,
    compatibilityScore: bestAlt.compatibilityScore,
    switchingCost,
    netAnnualSavings,
    confidence,
    priority,
    riskLevel: switchingCost > annualSavings * 0.5 ? 'high' : 'low',
  }
}

function checkCreditsOpportunity(toolName: string, currentSpend: number): Candidate | null {
  if (currentSpend < CREDEX_MIN_MONTHLY_THRESHOLD) return null
  const savings = Math.round(currentSpend * CREDEX_DISCOUNT)
  if (savings <= 10) return null
  return {
    action: `Purchase ${toolName} credits through Credex`,
    savings,
    reason: `You're paying $${currentSpend}/mo at retail. Credex sources discounted AI credits - a ~${Math.round(CREDEX_DISCOUNT * 100)}% discount would save approximately $${savings}/mo ($${savings * 12}/yr) on this tool alone.`,
    confidence: 'medium',
    priority: 'low',
    riskLevel: 'low',
  }
}

function checkApiVsSubscription(
  toolId: ToolId,
  currentSpend: number,
  useCase: UseCase,
  usageFrequency: 'daily' | 'weekly' | 'occasionally',
): Candidate | null {
  const hasApiEquivalent = toolId === 'claude' || toolId === 'chatgpt'
  if (!hasApiEquivalent) return null

  if (usageFrequency === 'daily') {
    if (currentSpend <= 100) return null
  }

  if (usageFrequency === 'weekly') {
    if (currentSpend <= 50) return null
  }

  if (usageFrequency === 'occasionally') {
    const plans = TOOLS[toolId].plans as Record<string, PlanConfig>
    const freePlanKey = Object.keys(plans).find((k) => plans[k].pricePerSeat === 0)
    if (freePlanKey) {
      const freeCost = 0
      const savings = Math.round(currentSpend - freeCost)
      if (savings > 10) {
        return {
          action: `Downgrade to ${TOOLS[toolId].name} ${plans[freePlanKey].label}`,
          savings,
          reason: `You're paying $${currentSpend}/mo but using ${usageFrequency} — downgrading to ${plans[freePlanKey].label} at $${freeCost}/mo saves $${savings}/mo.`,
          confidence: 'high',
          priority: 'critical',
          riskLevel: 'low',
        }
      }
    }

    const apiToolId: ToolId = toolId === 'claude' ? 'anthropic_api' : 'openai_api'
    const apiTool = TOOLS[apiToolId]
    return {
      action: `Evaluate switching to ${apiTool.name} (usage-based)`,
      savings: 0,
      reason: `You're paying $${currentSpend}/mo but using this tool ${usageFrequency} — consider switching to ${apiTool.name} (pay-per-use) or a free tier to avoid overpaying.`,
      confidence: 'medium',
      priority: 'medium',
      riskLevel: 'medium',
    }
  }

  const apiToolId: ToolId = toolId === 'claude' ? 'anthropic_api' : 'openai_api'
  const apiTool = TOOLS[apiToolId]
  return {
    action: `Evaluate switching to ${apiTool.name} (usage-based)`,
    savings: 0,
    reason: `At $${currentSpend}/mo on a flat subscription for ${useCase} work, consider whether ${apiTool.name} (pay-per-token) could lower costs during slow weeks.`,
    confidence: 'low',
    priority: 'low',
    riskLevel: 'low',
  }
}

function compareApiBillingToSubscription(
  toolId: ToolId,
  currentSpend: number,
  useCase: UseCase,
): Candidate | null {
  // API cost-benefit: Compare current API spend vs cheapest subscription alternative
  // Note: For API tools, DO NOT use seat-based comparison.
  // Instead, evaluate if subscription usage pattern would be more economical.
  const alternatives = USE_CASE_ALTERNATIVES[useCase] ?? []
  let cheapest: { toolId: ToolId; planKey: string; cost: number; label: string } | null = null

  // For API comparison, assume 1 user (since API is pay-per-use, not per-seat)
  const estimatedSeatsForUsage = 1

  for (const alt of alternatives) {
    const cost = getPlanCost(alt.toolId, alt.planKey, estimatedSeatsForUsage)
    if (cost === null) continue
    if (!cheapest || cost < cheapest.cost) {
      const altTool = TOOLS[alt.toolId]
      const altPlans = altTool.plans as Record<string, PlanConfig>
      const altPlan = altPlans[alt.planKey]
      if (!altPlan) continue
      cheapest = { toolId: alt.toolId, planKey: alt.planKey, cost, label: altPlan.label }
    }
  }

  if (!cheapest) return null

  const subscriptionCost = cheapest.cost

  // Significant savings threshold: subscription is at least 20% cheaper
  if (subscriptionCost < currentSpend * 0.8) {
    return {
      action: `Consider switching to ${TOOLS[cheapest.toolId].name} ${cheapest.label}`,
      savings: Math.round(currentSpend - subscriptionCost),
      reason: `Your API spend is $${currentSpend}/mo. A ${TOOLS[cheapest.toolId].name} ${cheapest.label} subscription costs $${subscriptionCost}/mo — if your usage patterns fit a flat subscription, switching would save $${Math.round(currentSpend - subscriptionCost)}/mo.`,
      confidence: 'high',
      priority: 'high',
      riskLevel: 'low',
    }
  }

  // API is cost-effective: don't force subscription unless significant savings
  return {
    action: `Keep API (cost-effective for your usage)`,
    savings: 0,
    reason: `Your API spend at $${currentSpend}/mo is cost-effective compared to the cheapest subscription at $${subscriptionCost}/mo. API model remains optimal for your ${useCase} workload.`,
    confidence: 'high',
    priority: 'low',
    riskLevel: 'low',
  }
}

export function auditTools(input: AuditInput): ToolAuditResult[] {
  const results: ToolAuditResult[] = []
  let totalCurrentSpend = 0

  for (const tool of input.tools) {
    const toolId = tool.toolId as ToolId
    const toolConfig = TOOLS[toolId]
    if (!toolConfig) continue

    const plans = toolConfig.plans as Record<string, PlanConfig>
    const planConfig = plans[tool.plan]
    if (!planConfig) continue

    const currentSpend = tool.monthlySpend
    totalCurrentSpend += currentSpend

    const billingType: BillingType = tool.billingType ?? 'subscription'

    // Per-tool use case overrides global use case for capability matching
    const toolUseCase = tool.useCase ?? input.useCase
    const usageFrequency = tool.usageFrequency ?? 'daily'

    // Subscription/Hybrid: use seat-based metrics
    const seats = tool.seats ?? 1
    const activeUsers = tool.activeUsers
    const utilizationPercent = tool.utilizationPercent

    // API/Hybrid: use usage-based metrics
    const candidates: Candidate[] = []

    // Validate pricing freshness and surface warning if stale
    const freshness = validatePricingFreshness(toolConfig.pricingVerifiedAt)
    const pricingWarning = freshness.isStale
    const billingTypeValid = validateBillingTypeSeats(billingType, seats)
    if (!billingTypeValid.valid) {
      // Log validation message for debugging but continue processing
      console.debug('[AUDIT] Billing type validation:', billingTypeValid.message)
    }

    // UNDERUTILIZATION DETECTION - HIGHEST PRIORITY
    // Unused seats are pure waste with zero risk (unlike vendor switches which carry adoption risk).
    if (
      (billingType === 'subscription' || billingType === 'hybrid') &&
      (activeUsers !== undefined || utilizationPercent !== undefined)
    ) {
      const underutil = detectUnderutilization(seats, activeUsers, utilizationPercent)
      if (underutil.isUnderutilized) {
        const wastedSeats = underutil.waste ?? Math.round(seats * 0.5)
        const wastedSpend = Math.round((wastedSeats / seats) * currentSpend)
        candidates.push({
          action: `Eliminate unused licenses (${wastedSeats} seats)`,
          savings: wastedSpend,
          reason:
            underutil.reason ||
            `You have ${wastedSeats} unused seat${wastedSeats > 1 ? 's' : ''}. Reducing to active usage saves $${wastedSpend}/mo.`,
          confidence: 'high',
          priority: 'critical',
          riskLevel: 'low',
        })
      }
    }

    // BILLING TYPE-BASED RECOMMENDATION LOGIC
    // Different billing models require different optimization strategies:
    // - SUBSCRIPTION: Fixed cost per seat. Optimize via right-sizing, cross-tool switches, API investigation.
    // - API: Usage-based, no seat concept. Optimize via cost-benefit vs subscription baseline.
    // - HYBRID: Both models present. Evaluate both paths separately.

    if (billingType === 'subscription' || billingType === 'hybrid') {
      // Right-sizing: Switch to cheaper plan within same vendor (low risk, high confidence)
      const rightSize = checkRightSize(toolId, tool.plan, seats, currentSpend, billingType)
      if (rightSize) candidates.push(rightSize)

      // Cross-tool alternative: Find cheaper equivalent tool with compatible capabilities
      // Uses dynamic weighting based on use case for accurate compatibility
      const crossTool = checkCrossToolAlternative(
        toolId,
        seats,
        currentSpend,
        toolUseCase,
        billingType,
      )
      if (crossTool) candidates.push(crossTool)

      // API investigation: For frequently-used tools, check if API model is more cost-effective
      const apiCheck = checkApiVsSubscription(toolId, currentSpend, toolUseCase, usageFrequency)
      if (apiCheck) candidates.push(apiCheck)
    }

    if (billingType === 'api' || billingType === 'hybrid') {
      // API cost-benefit: Compare current API spend vs cheapest subscription alternative
      // Does NOT use seat count for API comparisons (API is usage-based, not per-seat)
      const compare = compareApiBillingToSubscription(toolId, currentSpend, toolUseCase)
      if (compare) candidates.push(compare)
    }

    // SEAT WASTE CHECKS - Only applies to subscription/hybrid with per-seat pricing
    if (
      (billingType === 'subscription' || billingType === 'hybrid') &&
      planConfig.pricePerSeat !== null
    ) {
      if (seats > input.teamSize) {
        const waste = seats - input.teamSize
        const savings = Math.round(waste * (planConfig.pricePerSeat ?? 0))
        if (savings > 10) {
          candidates.push({
            action: `Reduce to ${input.teamSize} seats`,
            savings,
            reason: `You have ${waste} unused seat${waste > 1 ? 's' : ''}. Reducing to ${input.teamSize} seats saves $${savings}/mo.`,
            confidence: 'high',
            priority: 'high',
            riskLevel: 'low',
          })
        }
      }

      if (seats < input.teamSize && planConfig.maxSeats === 1) {
        candidates.push({
          action: `Upgrade to a team plan or add seats`,
          savings: 0,
          reason: `You have ${input.teamSize} people but only ${seats} individual license${seats > 1 ? 's' : ''}. Consider upgrading to a team plan or adding seats.`,
          confidence: 'medium',
          priority: 'medium',
          riskLevel: 'low',
        })
      }
    }

    // Sort by calculated score (prioritizes: critical priority, high confidence, high savings, relative savings)
    candidates.sort((a, b) => calculateRecommendationScore(b) - calculateRecommendationScore(a))

    let recommendedAction = 'No change needed'
    let monthlySavings = 0
    let savingsPercent: number | undefined
    let reason = `Your current ${toolConfig.name} ${planConfig.label} plan appears well-matched to your usage.`
    let confidence: RecommendationConfidence = 'high'
    let priority: RecommendationPriority = 'low'
    let riskLevel: 'low' | 'medium' | 'high' = 'low'
    let compatibilityScore: number | undefined
    let switchingCost: number | undefined
    let netAnnualSavings: number | undefined

    const best = candidates[0]
    if (best) {
      recommendedAction = best.action
      monthlySavings = best.savings
      savingsPercent = currentSpend > 0 ? (best.savings / currentSpend) * 100 : 0
      reason = best.reason
      confidence = best.confidence
      priority = best.priority
      riskLevel = best.riskLevel
      compatibilityScore = best.compatibilityScore
      switchingCost = best.switchingCost
      netAnnualSavings = best.netAnnualSavings
    }

    // Credits opportunity: If no better recommendation found, suggest credit purchasing for bulk discounts
    const creditsNote = checkCreditsOpportunity(toolConfig.name, currentSpend)
    if (creditsNote && !best) {
      recommendedAction = creditsNote.action
      monthlySavings = creditsNote.savings
      savingsPercent = currentSpend > 0 ? (creditsNote.savings / currentSpend) * 100 : 0
      reason = creditsNote.reason
      confidence = creditsNote.confidence
      priority = creditsNote.priority
      riskLevel = creditsNote.riskLevel
    }

    // Surface stale pricing warning if applicable
    if (pricingWarning && !reason.includes('pricing data')) {
      reason += ` [Pricing data from ${freshness.daysSince} days ago — may have changed.]`
    }

    results.push({
      toolId,
      toolName: toolConfig.name,
      currentSpend,
      recommendedAction,
      monthlySavings,
      savingsPercent,
      reason,
      pricingWarning,
      compatibilityScore,
      switchingCost,
      netAnnualSavings,
      confidence,
      priority,
      riskLevel,
    })
  }

  // Calculate relative savings for total audit
  const finalResults = results.sort((a, b) => {
    const priorityOrder: Record<RecommendationPriority, number> = {
      critical: 0,
      high: 1,
      medium: 2,
      low: 3,
    }
    const priorityDiff = priorityOrder[a.priority || 'low'] - priorityOrder[b.priority || 'low']
    if (priorityDiff !== 0) return priorityDiff
    return (b.savingsPercent || 0) - (a.savingsPercent || 0)
  })

  // Store total spend for percentage calculations in caller
  const resultsWithTotal = finalResults as (typeof finalResults) & { _totalCurrentSpend: number }
  resultsWithTotal._totalCurrentSpend = totalCurrentSpend

  return resultsWithTotal
}
