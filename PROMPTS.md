# PROMPTS.md — SpendLens LLM Prompt Design

## What SpendLens Uses Gemini For

One task only: generating an 80–120 word plain-English executive summary after
the audit engine finishes. The audit engine itself is fully deterministic — no
LLM is involved in calculating savings, scoring candidates, or making
recommendations. Gemini only writes the human-readable paragraph at the end.

---

## The Final Prompt (What Ships)

### System Instruction

```
You are a careful SaaS procurement analyst writing a short executive summary.
Use only the data provided in the audit payload.
Do not invent savings, tools, pricing, or risks.
Do not mention that you are an AI model.
Keep the tone professional, specific, and credible.
Do not use markdown formatting, code blocks, or special characters.
Start directly with the summary text.
```

### User Prompt

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

**Model:** `gemini-1.5-flash`  
**Environment variable:** `GEMINI_API_KEY`  
**Target length:** 80–120 words

---

## Why I Wrote It This Way

### 1. Separate system instruction and user prompt

Early versions put everything in one prompt block. The model would sometimes
ignore the tone constraints when the audit JSON was large — the data crowded
out the instructions. Splitting into system + user gives the constraints
priority in the model's attention. The system instruction is always "above"
the data.

### 2. "Use only the facts in the JSON below" — repeated twice

This constraint appears in both the system instruction and the user prompt.
Redundant by design. In early testing, a single mention wasn't enough —
Gemini would occasionally add qualitative observations ("this team appears
to be scaling rapidly") that weren't grounded in the audit data. Repeating
the grounding constraint in both positions eliminated this.

### 3. Explicit word count range (80–120), not a vague instruction

Telling the model to "be concise" produced responses ranging from 40 to 300
words depending on how large the audit was. An 8-tool audit would get a long
essay; a 2-tool audit would get two sentences. Pinning the range to 80–120
words gives consistent output that fits the email template without overflow
or truncation.

### 4. "Do not mention that you are an AI model"

Without this, Gemini prefixed responses with phrases like "As an AI
assistant, I can see that..." — which looks unprofessional in a
client-facing audit email. One instruction line removed it entirely.

### 5. "Do not use markdown formatting"

The summary text is injected directly into an HTML email template. Markdown
asterisks and backticks rendered as literal characters in the email body.
Adding this constraint to the system instruction stopped it immediately.

### 6. Credex eligibility condition ($500 threshold)

The Credex mention is conditional — only triggered when
`totalMonthlySavings > 500`. Without the threshold, Gemini would mention
Credex for audits saving $12/month, which felt like spam and undermined
trust. The threshold ensures the mention only appears when it's actually
relevant to the user's scale.

---

## What I Tried That Didn't Work

### ❌ Attempt 1 — Single freeform prompt, no JSON structure

First version:

```
Summarize this AI tool audit. The company spends ${{totalSpend}} per month
on AI tools and could save ${{savings}} per month by following these
recommendations: {{recommendations}}.
```

**Problem:** String interpolation of recommendations produced run-on
sentences. When there were 6+ tools, the prompt became 800+ tokens of
unstructured text and Gemini would hallucinate tool names or mix up which
savings belonged to which tool.

**Fix:** Switched to passing the full structured audit JSON and letting
Gemini parse it, rather than flattening it into a string template.

---

### ❌ Attempt 2 — Asking for bullet points

```
Summarize the top 3 recommendations as bullet points.
```

**Problem:** Bullet points in the email template looked broken — the HTML
`<p>` tags didn't handle newlines, so bullets ran together as one line.
Also, bullet format felt more like a chatbot response than a finance-grade
summary.

**Fix:** Changed to "write a paragraph" with explicit instruction to avoid
markdown. Moved the structured recommendations to a separate hardcoded
section in the email template (the "Top Opportunities" table), leaving the
AI summary as pure prose context.

---

### ❌ Attempt 3 — Asking Gemini to also generate the recommendation

Early design had Gemini generate both the summary _and_ the recommendation
action for each tool. Prompt:

```
For each tool, identify the best cost-saving action and explain why.
```

**Problem:** Gemini would invent plan names, wrong prices, and
non-existent alternatives. It confidently stated "switch to Cursor Business
at $25/seat" when the actual price is $40. There was no way to reliably
ground it in the pricing data.

**Fix:** Removed LLM from recommendation logic entirely. The audit engine
(`auditEngine.ts`) is 100% deterministic and uses only verified pricing
from `pricingData.ts`. Gemini only summarises what the engine already
calculated — it never makes the recommendation itself.

---

### ❌ Attempt 4 — Temperature tuning for creativity

Tried setting temperature to 0.7 to make summaries feel less robotic.

**Problem:** At higher temperature, the model started varying the savings
figures slightly ("approximately $450/month" when the actual figure was
$412). In a financial tool, approximate numbers erode trust.

**Fix:** Kept temperature at default (0) / not set — Gemini's default for
structured output tasks is conservative enough. The prompt constraint
("use only the facts in the JSON") does more work than temperature tuning.

---

## Fallback Behavior

If Gemini is unavailable (missing key, rate limited, empty response, or any
API error), the system returns a deterministic templated summary built from
the audit data — no external call, always succeeds, same professional tone.

```typescript
function buildFallbackSummary(audit: FullAudit): string
```

This means users always get a complete audit report even if the Gemini API
is down. The fallback was designed to be indistinguishable in quality from
a real Gemini response for straightforward audits.

| Failure Mode             | Log Message                                                | Response                       |
| ------------------------ | ---------------------------------------------------------- | ------------------------------ |
| Missing `GEMINI_API_KEY` | `"GEMINI_API_KEY not set, using fallback summary"`         | Fallback                       |
| Rate limited (429)       | `"Rate limited, returning fallback summary"`               | Fallback immediately, no retry |
| API error / timeout      | Error message logged                                       | Fallback                       |
| Empty response           | `"Gemini returned empty response, using fallback summary"` | Fallback                       |

---

## Anti-Hallucination Summary

| Risk                      | Mitigation                                                         |
| ------------------------- | ------------------------------------------------------------------ |
| Invented savings figures  | Grounding instruction in both system + user prompt                 |
| Wrong tool names          | Pass full JSON; model reads names from data, doesn't generate them |
| Markdown in email body    | Explicit format prohibition in system instruction                  |
| AI self-reference         | Explicit prohibition in system instruction                         |
| Irrelevant Credex mention | Conditional $500/mo threshold in user prompt                       |
| Approximate numbers       | Deterministic engine calculates all figures; Gemini only narrates  |
