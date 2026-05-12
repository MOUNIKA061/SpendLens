# SpendLens AI Summary Prompt

## Overview

SpendLens generates personalized audit summaries using **Google Gemini API** (gemini-1.5-flash).

**Fallback Behavior:** If the Gemini API is unavailable (missing key, rate limited, or returns an error), the system automatically returns a deterministic templated summary without any user-facing interruption.

## Gemini API Configuration

- **Model:** `gemini-1.5-flash`
- **Environment Variable:** `GEMINI_API_KEY`
- **Response Length:** 80–120 words (constrained by system prompt)
- **Timeout:** Standard HTTP request timeout (30 seconds default)

## System Instruction (Sent to Gemini)

```
You are a careful SaaS procurement analyst writing a short executive summary.
Use only the data provided in the audit payload.
Do not invent savings, tools, pricing, or risks.
Do not mention that you are an AI model.
Keep the tone professional, specific, and credible.
Do not use markdown formatting, code blocks, or special characters.
Start directly with the summary text.
```

## User Prompt Template (Sent with Audit Data)

```
Write an 80-120 word executive summary for this SpendLens audit.

Constraints:
- Use only the facts in the JSON below.
- Do not invent any savings or recommendations.
- Mention the largest opportunity, the total monthly savings, and the total annual savings.
- If savings are low, be honest and say the stack already appears efficient.
- If totalMonthlySavings is above 500, mention that Credex can help capture additional savings.
- Keep it concise, finance-grade, and trustworthy.

Audit JSON:
{{AUDIT_JSON}}
```

## Anti-Hallucination Constraints

1. **Data Grounding:** Only tools and metrics present in the audit JSON are referenced.
2. **No Fabrication:** Savings numbers must match audit totals exactly—never inflated.
3. **Attribution:** Every financial claim traces back to a field in the audit JSON.
4. **Boundary:** System prompt explicitly forbids inventing tools, plans, or recommendations.
5. **Format Strictness:** System prompt rejects markdown and special characters to prevent prompt injection.

## Error Handling & Fallback Logic

**Missing GEMINI_API_KEY:**
- Logs: `"GEMINI_API_KEY not set, using fallback summary"`
- Returns: Deterministic templated summary

**Rate Limited (HTTP 429):**
- Logs: `"Rate limited, returning fallback summary"`
- Returns: Fallback immediately without retry

**API Error or Timeout:**
- Logs: Error message for debugging
- Returns: Fallback summary

**Empty Response:**
- Detects zero-length text from Gemini
- Logs: `"Gemini returned empty response, using fallback summary"`
- Returns: Fallback

**Fallback Summary Function**

```typescript
function buildFallbackSummary(audit: FullAudit): string
```

Defined in `src/lib/summaryGenerator.ts` (or inline in `src/lib/server/aiSummary.ts`):
- ~80-word templated summary using: team size, primary use case, tool count, top savings opportunity, annual savings projection, Credex eligibility
- Deterministic: No external API calls, always succeeds
- Language quality: Professional, finance-grade tone (same as Gemini target)
