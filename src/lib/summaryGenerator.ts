import { FullAudit } from '@/types'

export function generateSummary(audit: FullAudit): string {
  const positiveResults = audit.results.filter(r => r.monthlySavings > 0)
  const topSaving = [...positiveResults].sort((a, b) => b.monthlySavings - a.monthlySavings)[0]
  const toolCount = positiveResults.length
  const totalInput = audit.input.tools.reduce((sum, tool) => sum + tool.monthlySpend, 0)

  if (audit.totalMonthlySavings === 0) {
    return `Your AI stack looks well-optimized for a ${audit.input.teamSize}-person team focused on ${audit.input.useCase}. You're on the right plans across ${audit.results.length} tools. Keep an eye on usage as your team grows — plan thresholds shift quickly.`
  }

  let summary = `Your team of ${audit.input.teamSize} is spending $${totalInput}/month on AI tools. We found $${audit.totalMonthlySavings}/month in savings across ${toolCount} tool${toolCount > 1 ? 's' : ''}. `

  if (topSaving) {
    summary += `The biggest opportunity is ${topSaving.toolName}: ${topSaving.reason} That's $${topSaving.monthlySavings * 12}/year back in your budget. `
  }

  if (audit.totalMonthlySavings > 500) {
    summary += 'At this spend level, Credex discounted credits could save you an additional 20–40%.'
  }

  return summary
}
