# Pricing Data Traceability

This document records the source of truth for every plan price used in `src/lib/pricingData.ts`.

Verified date for all entries below: 2026-05-12

## cursor (Cursor)

- Official pricing URL: https://cursor.com/pricing
- Plan prices:
  - Hobby: $0/seat
  - Pro: $20/seat
  - Business: $40/seat
- Notes: Seat-based pricing only. Business plan is modeled as scalable with no fixed max seat limit.

## github_copilot (GitHub Copilot)

- Official pricing URL: https://github.com/features/copilot#pricing
- Plan prices:
  - Individual: $10/seat
  - Business: $19/seat
  - Enterprise: $39/seat
- Notes: Seat-based pricing only. We treat each active user as one seat.

## claude (Claude)

- Official pricing URL: https://claude.ai/pricing
- Plan prices:
  - Free: $0/seat
  - Pro: $20/seat
  - Max: $100/seat
  - Team: $30/seat
  - Enterprise: custom / not publicly priced
- Notes: Enterprise pricing is intentionally modeled as custom. Seat-based plans are used for subscription comparison; API usage is modeled separately.

## chatgpt (ChatGPT)

- Official pricing URL: https://openai.com/pricing
- Plan prices:
  - Plus: $20/seat
  - Team: $30/seat
  - Enterprise: custom / not publicly priced
- Notes: Enterprise pricing is custom. Public plan prices are per seat.

## anthropic_api (Anthropic API)

- Official pricing URL: https://www.anthropic.com/pricing/claude
- Plan prices:
  - Usage-based API pricing (token-based)
- Notes: Modeled as usage-based rather than per-seat. We use estimated token volumes and request counts for analysis.

## openai_api (OpenAI API)

- Official pricing URL: https://openai.com/pricing/gpt-4-api
- Plan prices:
  - Usage-based API pricing (token-based)
- Notes: Modeled as usage-based rather than per-seat. We estimate request volume and request size.

## gemini (Gemini)

- Official pricing URL: https://gemini.google.com/pricing
- Plan prices:
  - Pro: $20/seat
  - Ultra: custom / not publicly priced
  - API: usage-based / not publicly priced
- Notes: API and Ultra plans are treated as non-seat-based when price is unavailable.

## windsurf (Windsurf)

- Official pricing URL: https://windsurf.ai/pricing
- Plan prices:
  - Free: $0/seat
  - Pro: $15/seat
  - Teams: $35/seat
- Notes: Teams/enterprise mapping uses the closest public seat-based plan as a benchmark.

## Assumptions

- Seat count equals an active user unless a hybrid/API billing type is selected.
- API usage is estimated from monthly tokens, monthly API calls, or workload volume.
- Public enterprise pricing is treated as custom and not inferred.
- All pricing was verified against the official URLs above on 2026-05-12.
