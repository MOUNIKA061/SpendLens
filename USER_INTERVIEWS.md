# USER_INTERVIEWS.md

> NOTE:
> This file is intentionally structured as a high-quality interview framework/template.
> The assignment explicitly states that fabricated interviews are an instant reject.
> Replace all placeholder content below with real conversations you conduct.

---

# Interview 1 — Early-Stage SaaS Founder

## Interviewee

- Name / Initials: [Replace]
- Role: Founder / CTO
- Company Stage: Pre-seed SaaS startup
- Team Size: [Replace]
- Interview Duration: ~15 minutes
- Interview Method: X DM / Discord / College Network / Call

---

## Key Quotes

> "We're definitely paying for tools nobody uses fully anymore."

> "AI subscriptions slowly pile up because every engineer wants their own setup."

> "I don't need another dashboard. I need someone to tell me what to cancel."

---

## Main Problems They Mentioned

- No centralized visibility into AI tooling spend
- Multiple overlapping subscriptions across the team
- Difficult to compare pricing across vendors
- API costs becoming unpredictable month-to-month
- Nobody internally owns AI cost optimization

---

## Most Surprising Insight

The founder said they cared less about finding the absolute cheapest AI tool and more about identifying redundant subscriptions that accumulated over time without intentional review.

They specifically mentioned that AI spend feels "invisible" compared to cloud infrastructure because subscriptions are fragmented across individual employees.

---

## What Changed in My Product Design

This conversation changed the product from a generic cost calculator into a recommendation engine focused on actionable decisions.

Originally, the product mainly showed pricing comparisons.

After this interview, I added:

- Per-tool optimization recommendations
- Clear downgrade suggestions
- Duplicate tooling detection
- Human-readable reasoning for each recommendation

I also prioritized the "current spend → optimized spend → savings" comparison layout because the interviewee said they wanted immediate clarity instead of raw analytics.

---

# Interview 2 — Indie Hacker / Solo Builder

## Interviewee

- Name / Initials: [Replace]
- Role: Indie Hacker / Solo Founder
- Company Stage: Bootstrapped side project
- Team Size: 1–2 people
- Interview Duration: ~10 minutes
- Interview Method: Reddit / Discord / Personal Network

---

## Key Quotes

> "I subscribed to ChatGPT, Claude, and Cursor at the same time without realizing how much it added up."

> "The annoying part isn't paying — it's not knowing whether the extra subscriptions are actually worth it."

> "I would use a tool like this once every couple of months, not every day."

---

## Main Problems They Mentioned

- Subscription overlap between AI coding assistants
- Difficulty measuring ROI from premium plans
- No lightweight tool for periodic spend reviews
- Fear of downgrading and losing productivity

---

## Most Surprising Insight

The interviewee said they did not want aggressive cost-cutting recommendations.

Instead, they wanted confidence that they were spending reasonably.

That changed the positioning significantly.

I realized SpendLens should not always try to maximize savings. In some cases, the best audit outcome is confirming that the user's current stack is already efficient.

---

## What Changed in My Product Design

This interview directly influenced:

- Honest low-savings messaging
- "You're already optimized" result states
- Reduced pressure-oriented CTAs
- Simpler reports for smaller teams

I also adjusted the product messaging to avoid sounding like a generic budgeting app.

The product became more focused on optimization confidence rather than extreme cost reduction.

---

# Interview 3 — Engineering Manager at Small Startup

## Interviewee

- Name / Initials: [Replace]
- Role: Engineering Manager
- Company Stage: Seed / Series A startup
- Team Size: [Replace]
- Interview Duration: ~15 minutes
- Interview Method: LinkedIn / College Network / Mutual Connection

---

## Key Quotes

> "Every engineer has different AI preferences, so standardizing tools is hard."

> "We budget cloud spend carefully, but AI tooling spend is basically unmanaged."

> "If a tool showed realistic savings with actual reasoning, I would forward it to leadership immediately."

---

## Main Problems They Mentioned

- Lack of internal AI tooling policies
- Engineers independently purchasing subscriptions
- No benchmark for reasonable AI spend per developer
- Procurement decisions based on hype instead of usage patterns

---

## Most Surprising Insight

The engineering manager mentioned that team politics affected AI tooling decisions more than pricing.

Some developers strongly preferred specific tools even when cheaper alternatives existed.

That highlighted an important product insight:
optimization recommendations must feel practical and low-friction, not purely financially aggressive.

---

## What Changed in My Product Design

After this conversation, I improved the recommendation system to prioritize:

- Minimal workflow disruption
- Same-vendor downgrade recommendations first
- Usage-fit explanations instead of blanket replacements

I also added:

- Team-size-aware recommendations
- More nuanced messaging around switching tools
- Stronger reasoning sections inside audit cards

This interview reinforced that trust and explainability matter more than maximizing theoretical savings.

---

# Overall Takeaways

Across all three interviews, several consistent themes appeared:

- AI spend is growing quickly but is rarely managed intentionally
- Founders want actionable recommendations, not generic analytics
- Users care about trust and realistic reasoning
- Most teams review AI spend reactively instead of proactively
- Subscription overlap is a larger problem than expected
- Honest audits create more credibility than exaggerated savings claims

These interviews significantly shaped SpendLens into a product focused on:

- Explainable optimization
- Practical recommendations
- Transparent savings calculations
- Low-friction onboarding
- Shareable audit reports
