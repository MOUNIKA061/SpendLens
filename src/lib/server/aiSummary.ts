import { GoogleGenerativeAI } from '@google/generative-ai'

import type { FullAudit } from '@/types'

import { GEMINI_SYSTEM_PROMPT, buildAuditSummaryPrompt } from '@/lib/prompts'

function buildFallbackSummary(audit: FullAudit): string {
  const positiveResults = audit.results.filter((result) => result.monthlySavings > 0)
  const topResult = [...positiveResults].sort((a, b) => b.monthlySavings - a.monthlySavings)[0]

  if (audit.totalMonthlySavings <= 0) {
    return `Your current AI stack appears well optimized for a ${audit.input.teamSize}-person team focused on ${audit.input.useCase}. SpendLens did not find meaningful monthly savings, which suggests your current tool mix is already reasonably efficient.`
  }

  const annualSavings = audit.totalAnnualSavings || audit.totalMonthlySavings * 12
  const opener = `SpendLens found approximately $${audit.totalMonthlySavings}/month in potential savings and $${annualSavings}/year overall.`
  const recommendationLine = topResult
    ? `The largest opportunity is ${topResult.toolName}, where ${topResult.reason}`
    : 'The largest opportunity is concentrated in your highest-spend tool and appears low-risk to evaluate.'
  const credexLine =
    audit.totalMonthlySavings > 500
      ? 'At this scale, Credex can help your team capture more of the savings through procurement and credit optimization.'
      : ''

  return [opener, recommendationLine, credexLine].filter(Boolean).join(' ')
}

export async function generateAuditSummary(audit: FullAudit): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    console.log('GEMINI_API_KEY not set, using fallback summary')
    return buildFallbackSummary(audit)
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction: GEMINI_SYSTEM_PROMPT,
    })

    const userMessage = buildAuditSummaryPrompt(audit)
    const result = await model.generateContent(userMessage)
    const response = await result.response
    const text = response.text().trim()

    if (!text || text.length === 0) {
      console.warn('Gemini returned empty response, using fallback summary')
      return buildFallbackSummary(audit)
    }

    return text
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('Gemini summary generation failed:', errorMessage)
    if (errorMessage.includes('429') || errorMessage.includes('rate limit')) {
      console.warn('Rate limited, returning fallback summary')
    }
    return buildFallbackSummary(audit)
  }
}
