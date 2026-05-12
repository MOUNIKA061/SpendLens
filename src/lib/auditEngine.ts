import { TOOLS } from './pricingData'
import { AuditInput, ToolAuditResult, UseCase, OnboardingFriction, ToolCapabilities, RecommendationConfidence, RecommendationPriority } from '@/types'

type ToolId = keyof typeof TOOLS
type PlanConfig = { label: string; pricePerSeat: number | null; maxSeats: number | null }

const CREDEX_DISCOUNT = 0.15
const CREDEX_MIN_MONTHLY_THRESHOLD = 50
const CAPABILITY_COMPATIBILITY_THRESHOLD = 0.75
const MIN_SWITCHING_ROI_THRESHOLD = 50
const HOURLY_RATE_DEFAULT = 100
const ONBOARDING_HOURS = { low: 2, medium: 6, high: 12 }

const USE_CASE_ALTERNATIVES: Record<UseCase, { toolId: ToolId; planKey: string; reason: string }[]> = {
  coding: [
    { toolId: 'windsurf', planKey: 'pro', reason: 'Windsurf Pro ($15/seat) is a strong coding assistant with full autocomplete and chat - cheaper than most alternatives for solo developers.' },
    { toolId: 'github_copilot', planKey: 'individual', reason: 'GitHub Copilot Individual ($10/seat) integrates directly into your editor and is purpose-built for code completion.' },
    { toolId: 'cursor', planKey: 'pro', reason: 'Cursor Pro ($20/seat) offers deep codebase awareness and agent-mode editing, worth it if you need more than autocomplete.' },
  ],
  writing: [
    { toolId: 'claude', planKey: 'pro', reason: 'Claude Pro ($20/seat) excels at long-form writing, editing, and document drafting with a 200K context window.' },
    { toolId: 'chatgpt', planKey: 'plus', reason: 'ChatGPT Plus ($20/seat) covers general writing tasks well and includes GPT-4o access.' },
  ],
  research: [
    { toolId: 'claude', planKey: 'pro', reason: 'Claude Pro ($20/seat) handles long documents and research synthesis with a 200K token context window - ideal for reading and summarising papers.' },
    { toolId: 'chatgpt', planKey: 'plus', reason: 'ChatGPT Plus ($20/seat) includes web browsing and can pull current sources - useful for live research tasks.' },
  ],
  data: [
    { toolId: 'chatgpt', planKey: 'plus', reason: 'ChatGPT Plus ($20/seat) includes the Code Interpreter/Advanced Data Analysis tool - good for ad-hoc data work without an API.' },
    { toolId: 'anthropic_api', planKey: 'usage', reason: 'Anthropic API (usage-based) is cheaper than a flat subscription if your data workloads are bursty - you only pay per token used.' },
  ],
  customer_support: [
    { toolId: 'chatgpt', planKey: 'plus', reason: 'ChatGPT Plus ($20/seat) can be integrated into support workflows for quick ticket triage and suggested replies.' },
    { toolId: 'claude', planKey: 'pro', reason: 'Claude Pro ($20/seat) is strong at conversational flows and safety-sensitive summarization for support teams.' },
  ],
  automation: [
    { toolId: 'anthropic_api', planKey: 'usage', reason: 'Anthropic API (usage-based) is often the most cost-effective for automation that runs programmatically.' },
    { toolId: 'openai_api', planKey: 'usage', reason: 'OpenAI API (usage-based) can be cheaper for automation-heavy workloads where token usage is predictable and optimized.' },
  ],
  mixed: [
    { toolId: 'claude', planKey: 'pro', reason: 'Claude Pro ($20/seat) handles writing, research, and some coding tasks - a solid general-purpose choice if your team uses AI for varied work.' },
    { toolId: 'chatgpt', planKey: 'plus', reason: 'ChatGPT Plus ($20/seat) covers mixed workloads well across writing, coding help, and data analysis.' },
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

function calculateCapabilityScore(currentToolCaps: ToolCapabilities | undefined, altToolCaps: ToolCapabilities | undefined): number {
  if (!currentToolCaps || !altToolCaps) return 0.5
  
  const weights = { codingDepth: 0.2, autocompleteQuality: 0.15, longContextSupport: 0.15, enterpriseFeatures: 0.1, agentEditing: 0.15, workflowAutomation: 0.15, dataAnalysisStrength: 0.1 }
  let totalScore = 0
  
  for (const [cap, weight] of Object.entries(weights)) {
    const current = currentToolCaps[cap as keyof ToolCapabilities] || 5
    const alt = altToolCaps[cap as keyof ToolCapabilities] || 5
    const capScore = Math.min(alt / Math.max(current, 1), 1)
    totalScore += capScore * weight
  }
  
  return Math.min(totalScore, 1)
}

function estimateSwitchingCost(seats: number, onboardingFriction: OnboardingFriction | undefined): number {
  const hours = ONBOARDING_HOURS[onboardingFriction || 'low']
  return Math.round(seats * hours * HOURLY_RATE_DEFAULT)
}

function validatePricingFreshness(verifiedAt: string | undefined): { isStale: boolean; daysSince: number } {
  if (!verifiedAt) return { isStale: true, daysSince: 999 }
  const verifiedDate = new Date(verifiedAt)
  const today = new Date()
  const daysSince = Math.floor((today.getTime() - verifiedDate.getTime()) / (1000 * 60 * 60 * 24))
  return { isStale: daysSince > 30, daysSince }
}

function detectUnderutilization(seats: number, activeUsers: number | undefined, utilizationPercent: number | undefined): { isUnderutilized: boolean; reason?: string; waste?: number } {
  if (activeUsers !== undefined && activeUsers < seats * 0.5) {
    return { isUnderutilized: true, reason: `Only ${activeUsers} of ${seats} seats actively used (${Math.round((activeUsers / seats) * 100)}% utilization)`, waste: seats - activeUsers }
  }
  if (utilizationPercent !== undefined && utilizationPercent < 50) {
    return { isUnderutilized: true, reason: `Tool utilization at only ${utilizationPercent}% of purchased capacity`, waste: undefined }
  }
  return { isUnderutilized: false }
}

function calculateRecommendationScore(candidate: Candidate): number {
  const savingsScore = Math.min(candidate.savings / 100, 1) * 0.4
  const confidenceScore = { high: 1, medium: 0.6, low: 0.3 }[candidate.confidence] * 0.3
  const riskScore = { low: 0, medium: -0.15, high: -0.3 }[candidate.riskLevel]
  return savingsScore + confidenceScore + riskScore
}

function checkRightSize(toolId: ToolId, currentPlanKey: string, seats: number, currentSpend: number): Candidate | null {
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

function checkCrossToolAlternative(toolId: ToolId, seats: number, currentSpend: number, useCase: UseCase): Candidate | null {
  const currentTool = TOOLS[toolId]
  const currentCaps = currentTool.capabilities
  const alternatives = USE_CASE_ALTERNATIVES[useCase] ?? []
  let bestSavings = 0
  let bestAlt: { toolId: ToolId; planKey: string; cost: number; reason: string; compatibilityScore: number } | null = null

  for (const alt of alternatives) {
    if (alt.toolId === toolId) continue
    const altCost = getPlanCost(alt.toolId, alt.planKey, seats)
    if (altCost === null) continue
    const savings = currentSpend - altCost
    const altTool = TOOLS[alt.toolId]
    const compatScore = calculateCapabilityScore(currentCaps, altTool.capabilities)
    
    if (compatScore < CAPABILITY_COMPATIBILITY_THRESHOLD) continue
    if (savings > bestSavings) {
      bestSavings = savings
      bestAlt = { toolId: alt.toolId, planKey: alt.planKey, cost: altCost, reason: alt.reason, compatibilityScore: compatScore }
    }
  }

  if (!bestAlt || bestSavings <= 10) return null

  const altTool = TOOLS[bestAlt.toolId]
  const altPlans = altTool.plans as Record<string, PlanConfig>
  const altPlan = altPlans[bestAlt.planKey]
  if (!altPlan) return null

  const switchingCost = estimateSwitchingCost(seats, altTool.onboardingFriction)
  const annualSavings = bestSavings * 12
  const netAnnualSavings = annualSavings - switchingCost
  
  if (netAnnualSavings <= 0) return null

  const confidence = bestAlt.compatibilityScore > 0.85 ? 'high' : bestAlt.compatibilityScore > 0.75 ? 'medium' : 'low'
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

function checkApiVsSubscription(toolId: ToolId, currentSpend: number, useCase: UseCase, usageFrequency: 'daily' | 'weekly' | 'occasionally'): Candidate | null {
  const hasApiEquivalent = (toolId === 'claude' || toolId === 'chatgpt')
  if (!hasApiEquivalent) return null

  if (usageFrequency === 'daily') {
    if (currentSpend <= 100) return null
  }

  if (usageFrequency === 'weekly') {
    if (currentSpend <= 50) return null
  }

  if (usageFrequency === 'occasionally') {
    const plans = TOOLS[toolId].plans as Record<string, PlanConfig>
    const freePlanKey = Object.keys(plans).find(k => plans[k].pricePerSeat === 0)
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

function compareApiBillingToSubscription(toolId: ToolId, seats: number, currentSpend: number, useCase: UseCase): Candidate | null {
  const alternatives = USE_CASE_ALTERNATIVES[useCase] ?? []
  let cheapest: { toolId: ToolId; planKey: string; cost: number; label: string } | null = null

  for (const alt of alternatives) {
    const cost = getPlanCost(alt.toolId, alt.planKey, seats)
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
  const savings = Math.round(subscriptionCost - currentSpend)

  if (subscriptionCost + 10 < currentSpend) {
    return {
      action: `Switch to ${TOOLS[cheapest.toolId].name} ${cheapest.label}`,
      savings: Math.round(currentSpend - subscriptionCost),
      reason: `Your API spend is $${currentSpend}/mo. A ${TOOLS[cheapest.toolId].name} ${cheapest.label} subscription costs $${subscriptionCost}/mo for ${seats} seat${seats > 1 ? 's' : ''} — switching would save $${Math.round(currentSpend - subscriptionCost)}/mo.`,
      confidence: 'high',
      priority: 'high',
      riskLevel: 'low',
    }
  }

  return {
    action: `Keep API (cost-effective)`,
    savings: 0,
    reason: `Your API spend is $${currentSpend}/mo which compares favorably to the cheapest subscription option at $${subscriptionCost}/mo for ${seats} seat${seats > 1 ? 's' : ''}.`,
    confidence: 'high',
    priority: 'low',
    riskLevel: 'low',
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
    const billingType = (tool as any).billingType ?? 'subscription'
    const toolUseCase = ((tool as any).useCase as UseCase) ?? input.useCase
    const usageFrequency = (tool as any).usageFrequency ?? 'daily'
    const activeUsers = tool.activeUsers
    const utilizationPercent = tool.utilizationPercent

    const candidates: Candidate[] = []

    // Check pricing freshness
    const freshness = validatePricingFreshness(toolConfig.pricingVerifiedAt)
    if (freshness.isStale) {
      // Still proceed, but will note staleness
    }

    // Detect underutilization - HIGHEST PRIORITY
    const underutil = detectUnderutilization(seats, activeUsers, utilizationPercent)
    if (underutil.isUnderutilized) {
      const wastedSeats = underutil.waste ?? Math.round(seats * 0.5)
      const wastedSpend = Math.round((wastedSeats / seats) * currentSpend)
      candidates.push({
        action: `Eliminate unused licenses (${wastedSeats} seats)`,
        savings: wastedSpend,
        reason: underutil.reason || `You have ${wastedSeats} unused seat${wastedSeats > 1 ? 's' : ''}. Reducing to active usage saves $${wastedSpend}/mo.`,
        confidence: 'high',
        priority: 'critical',
        riskLevel: 'low',
      })
    }

    // Check plan right-sizing
    if (billingType === 'subscription' || billingType === 'hybrid') {
      const rightSize = checkRightSize(toolId, tool.plan, seats, currentSpend)
      if (rightSize) candidates.push(rightSize)

      const crossTool = checkCrossToolAlternative(toolId, seats, currentSpend, toolUseCase)
      if (crossTool) candidates.push(crossTool)

      const apiCheck = checkApiVsSubscription(toolId, currentSpend, toolUseCase, usageFrequency)
      if (apiCheck) candidates.push(apiCheck)
    }

    if (billingType === 'api') {
      const compare = compareApiBillingToSubscription(toolId, seats, currentSpend, toolUseCase)
      if (compare) candidates.push(compare)
    }

    // Seat waste checks
    if (planConfig.pricePerSeat !== null) {
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

    // Sort by calculated score (takes into account priority, confidence, risk, savings)
    candidates.sort((a, b) => calculateRecommendationScore(b) - calculateRecommendationScore(a))

    let recommendedAction = 'No change needed'
    let monthlySavings = 0
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
      reason = best.reason
      confidence = best.confidence
      priority = best.priority
      riskLevel = best.riskLevel
      compatibilityScore = best.compatibilityScore
      switchingCost = best.switchingCost
      netAnnualSavings = best.netAnnualSavings
    }

    const creditsNote = checkCreditsOpportunity(toolConfig.name, currentSpend)
    if (creditsNote && !best) {
      recommendedAction = creditsNote.action
      monthlySavings = creditsNote.savings
      reason = creditsNote.reason
      confidence = creditsNote.confidence
      priority = creditsNote.priority
      riskLevel = creditsNote.riskLevel
    }

    results.push({
      toolId,
      toolName: toolConfig.name,
      currentSpend,
      recommendedAction,
      monthlySavings,
      reason,
      compatibilityScore,
      switchingCost,
      netAnnualSavings,
      confidence,
      priority,
      riskLevel,
    })
  }

  return results.sort((a, b) => {
    const priorityOrder: Record<RecommendationPriority, number> = { critical: 0, high: 1, medium: 2, low: 3 }
    const priorityDiff = priorityOrder[a.priority || 'low'] - priorityOrder[b.priority || 'low']
    if (priorityDiff !== 0) return priorityDiff
    return (b.monthlySavings || 0) - (a.monthlySavings || 0)
  })
}
