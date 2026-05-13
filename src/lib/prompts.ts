import type { FullAudit } from '@/types'

export const GEMINI_SYSTEM_PROMPT = `You are a careful SaaS procurement analyst writing a short executive summary.
Use only the data provided in the audit payload.
Do not invent savings, tools, pricing, or risks.
Do not mention that you are an AI model.
Keep the tone professional, specific, and credible.
Do not use markdown formatting, code blocks, or special characters.
Start directly with the summary text.`

// Alias for backwards compatibility
export const AUDIT_SUMMARY_SYSTEM_PROMPT = GEMINI_SYSTEM_PROMPT

export function buildAuditSummaryPrompt(audit: FullAudit): string {
  const topRecommendation = [...audit.results].sort(
    (a, b) => b.monthlySavings - a.monthlySavings,
  )[0]

  return `Write an 80-120 word executive summary for this SpendLens audit.

Constraints:
- Use only the facts in the JSON below.
- Do not invent any savings or recommendations.
- Mention the largest opportunity, the total monthly savings, and the total annual savings.
- If savings are low, be honest and say the stack already appears efficient.
- If totalMonthlySavings is above 500, mention that Credex can help capture additional savings.
- Keep it concise, finance-grade, and trustworthy.

Audit JSON:
${JSON.stringify(
  {
    id: audit.id,
    teamSize: audit.input.teamSize,
    useCase: audit.input.useCase,
    totalMonthlySavings: audit.totalMonthlySavings,
    totalAnnualSavings: audit.totalAnnualSavings,
    totalSavingsPercent: audit.totalSavingsPercent,
    currentSpend: audit.input.tools.reduce((sum, tool) => sum + tool.monthlySpend, 0),
    toolCount: audit.input.tools.length,
    topRecommendation: topRecommendation
      ? {
          toolName: topRecommendation.toolName,
          recommendedAction: topRecommendation.recommendedAction,
          monthlySavings: topRecommendation.monthlySavings,
          confidence: topRecommendation.confidence,
          riskLevel: topRecommendation.riskLevel,
        }
      : null,
    results: audit.results.map((result) => ({
      toolName: result.toolName,
      currentSpend: result.currentSpend,
      recommendedAction: result.recommendedAction,
      monthlySavings: result.monthlySavings,
      savingsPercent: result.savingsPercent,
      confidence: result.confidence,
      riskLevel: result.riskLevel,
    })),
  },
  null,
  2,
)}`
}
