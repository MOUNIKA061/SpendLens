import { TOOLS } from './pricingData'
import { AuditInput, ToolAuditResult } from '@/types'

type ToolId = keyof typeof TOOLS
type PlanConfig = {
  label: string
  pricePerSeat: number | null
  maxSeats: number | null
}

function getRightSizePlanKey(toolId: ToolId, seats: number): string | null {
  if (seats > 2) return null

  switch (toolId) {
    case 'cursor':
      return seats === 1 ? 'hobby' : 'pro'
    case 'github_copilot':
      return 'individual'
    case 'claude':
      return 'pro'
    case 'chatgpt':
      return 'plus'
    case 'gemini':
      return 'pro'
    case 'windsurf':
      return seats === 1 ? 'free' : 'pro'
    default:
      return null
  }
}

function getCheaperAlternative(input: AuditInput, toolId: ToolId, currentSpend: number): ToolAuditResult | null {
  if (input.useCase === 'coding' && toolId === 'chatgpt') {
    const options = [
      { action: 'Switch to GitHub Copilot Individual', cost: 10, reason: 'GitHub Copilot is more specialized for coding workflows.' },
      { action: 'Switch to Cursor Pro', cost: 20, reason: 'Cursor Pro is more specialized for coding workflows.' },
    ]

    const bestOption = options
      .map(option => ({ ...option, savings: currentSpend - option.cost }))
      .filter(option => option.savings > 10)
      .sort((a, b) => b.savings - a.savings)[0]

    if (bestOption) {
      return {
        toolId,
        toolName: TOOLS[toolId].name,
        currentSpend,
        recommendedAction: bestOption.action,
        monthlySavings: bestOption.savings,
        reason: bestOption.reason,
      }
    }
  }

  if (input.useCase === 'writing' && (toolId === 'cursor' || toolId === 'github_copilot')) {
    const savings = currentSpend - 20
    if (savings > 10) {
      return {
        toolId,
        toolName: TOOLS[toolId].name,
        currentSpend,
        recommendedAction: 'Switch to Claude Pro',
        monthlySavings: savings,
        reason: 'Claude Pro is a stronger fit for writing and long-form drafting.',
      }
    }
  }

  if (input.useCase === 'research' && toolId === 'cursor') {
    const savings = currentSpend - 20
    if (savings > 10) {
      return {
        toolId,
        toolName: TOOLS[toolId].name,
        currentSpend,
        recommendedAction: 'Switch to Claude Pro or ChatGPT Plus',
        monthlySavings: savings,
        reason: 'Claude Pro or ChatGPT Plus are usually better for research synthesis and analysis.',
      }
    }
  }

  if (input.useCase === 'data' && currentSpend > 100) {
    const savings = Math.round(currentSpend * 0.2)
    if (savings > 10) {
      return {
        toolId,
        toolName: TOOLS[toolId].name,
        currentSpend,
        recommendedAction: 'Split workloads with direct API usage',
        monthlySavings: savings,
        reason: 'At this spend level, splitting workloads with API direct pricing can reduce subscription overhead.',
      }
    }
  }

  return null
}

export function auditTools(input: AuditInput): ToolAuditResult[] {
  const results: ToolAuditResult[] = []

  for (const tool of input.tools) {
    const toolId = tool.toolId as ToolId
    const toolConfig = TOOLS[toolId]
    if (!toolConfig) continue

    const toolPlans = toolConfig.plans as Record<string, PlanConfig>
    const planConfig = toolPlans[tool.plan]
    if (!planConfig) continue

    let monthlySavings = 0
    let recommendedAction = 'No change needed'
    let reason = 'Your plan fits your usage.'

    const currentSpend = tool.monthlySpend
    const suggestions: ToolAuditResult[] = []

    if (planConfig.maxSeats === null && tool.seats <= 2) {
      const rightSizePlanKey = getRightSizePlanKey(toolId, tool.seats)
      if (rightSizePlanKey) {
        const rightSizePlan = toolPlans[rightSizePlanKey]
        if (rightSizePlan?.pricePerSeat !== null) {
          const savings = currentSpend - rightSizePlan.pricePerSeat * tool.seats
          if (savings > 10) {
            suggestions.push({
              toolId,
              toolName: toolConfig.name,
              currentSpend,
              recommendedAction: `Downgrade to ${rightSizePlan.label}`,
              monthlySavings: savings,
              reason: `You only need ${tool.seats} seat${tool.seats > 1 ? 's' : ''} — ${rightSizePlan.label} is a better fit.`,
            })
          }
        }
      }
    }

    const useCaseSuggestion = getCheaperAlternative(input, toolId, currentSpend)
    if (useCaseSuggestion) {
      suggestions.push(useCaseSuggestion)
    }

    const bestSuggestion = suggestions.sort((a, b) => b.monthlySavings - a.monthlySavings)[0]

    if (bestSuggestion) {
      monthlySavings = bestSuggestion.monthlySavings
      recommendedAction = bestSuggestion.recommendedAction
      reason = bestSuggestion.reason
    }

    if (currentSpend > 50) {
      reason = `${reason} Credex may offer discounted credits for this tool.`
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
