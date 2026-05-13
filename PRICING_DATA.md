# Pricing Data Traceability

Source of truth for every plan price in `src/lib/pricingData.ts`.  
All prices verified: **2026-05-12**

---

## Cursor

- Hobby: $0/seat — https://cursor.com/pricing — verified 2026-05-12
- Pro: $20/seat — https://cursor.com/pricing — verified 2026-05-12
- Business: $40/seat — https://cursor.com/pricing — verified 2026-05-12

## GitHub Copilot

- Individual: $10/seat — https://github.com/features/copilot#pricing — verified 2026-05-12
- Business: $19/seat — https://github.com/features/copilot#pricing — verified 2026-05-12
- Enterprise: $39/seat — https://github.com/features/copilot#pricing — verified 2026-05-12

## Claude (claude.ai)

- Free: $0/seat — https://claude.ai/pricing — verified 2026-05-12
- Pro: $20/seat — https://claude.ai/pricing — verified 2026-05-12
- Max: $100/seat — https://claude.ai/pricing — verified 2026-05-12
- Team: $30/seat — https://claude.ai/pricing — verified 2026-05-12
- Enterprise: custom/not publicly priced — https://claude.ai/pricing — verified 2026-05-12

## ChatGPT (OpenAI)

- Free: $0/seat — https://openai.com/pricing — verified 2026-05-12
- Plus: $20/seat — https://openai.com/pricing — verified 2026-05-12
- Team: $30/seat — https://openai.com/pricing — verified 2026-05-12
- Enterprise: custom/not publicly priced — https://openai.com/pricing — verified 2026-05-12

## Anthropic API

- Usage-based (token pricing) — https://www.anthropic.com/pricing — verified 2026-05-12
- Example: claude-3-5-sonnet — $3.00/1M input tokens, $15.00/1M output tokens
- Modeled as usage-based; no seat count applied

## OpenAI API

- Usage-based (token pricing) — https://openai.com/pricing — verified 2026-05-12
- Example: gpt-4o — $2.50/1M input tokens, $10.00/1M output tokens
- Modeled as usage-based; no seat count applied

## Gemini (Google)

- Free: $0/seat — https://gemini.google.com/pricing — verified 2026-05-12
- Pro: $20/seat — https://gemini.google.com/pricing — verified 2026-05-12
- Ultra: custom/not publicly priced — https://gemini.google.com/pricing — verified 2026-05-12
- API: usage-based — https://ai.google.dev/pricing — verified 2026-05-12

## Windsurf

- Free: $0/seat — https://windsurf.ai/pricing — verified 2026-05-12
- Pro: $15/seat — https://windsurf.ai/pricing — verified 2026-05-12
- Teams: $35/seat — https://windsurf.ai/pricing — verified 2026-05-12

---

## Assumptions

- Seat count = active users unless `billingType` is `api` or `hybrid`
- API usage modeled from estimated monthly tokens/calls, not seats
- Enterprise pricing treated as custom and never inferred
- All numbers pulled directly from official vendor pricing pages on 2026-05-12
