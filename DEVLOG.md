```md id="n5x2fk"
## Day 1 — 2026-05-06

**Hours worked:** 7

**What I did:**  
Read the full Credex assignment carefully and broke down the requirements into engineering, product, and documentation sections. Spent time researching how AI infrastructure credits work and how startups currently pay for tools like ChatGPT, Claude, Cursor, and Copilot. Also explored similar SaaS cost optimization tools to understand what already exists and where SpendLens could differentiate itself.

Created an initial project plan covering:

- MVP features
- Required documentation files
- Backend requirements
- Deployment requirements
- Audit logic structure

Spent the next day organizing the project structure before implementation. Planned the folder architecture for:

- components
- audit engine logic
- pricing configuration
- API routes
- utilities
- database integration

Researched:

- Supabase schema design
- Resend email flow
- Open Graph preview generation in Next.js
- Best practices for storing audit reports publicly while protecting sensitive data

Also sketched the full user journey from landing page → audit form → results → lead capture → shareable report.

Created rough wireframes and content structure for the landing page and audit results page.

Started thinking through how the audit engine should work without relying too heavily on AI-generated reasoning.

**What I learned:**  
I realized this assignment is much more about product thinking and execution discipline than frontend coding alone. The audit recommendations need to feel financially believable, not just technically functional. I also learned that the documentation and git history are heavily weighted in evaluation.

I also realized the hardest part is not collecting spend information — it is generating recommendations that feel trustworthy and actionable. Separating pricing data from recommendation logic early would make the audit engine easier to maintain.

**Blockers / what I'm stuck on:**  
Still unclear on the best structure for representing pricing plans and recommendation rules in a scalable way. I was also still deciding how aggressive the optimization recommendations should be without reducing trust.

**Plan for tomorrow:**  
Finalize the tech stack and begin the Next.js project setup, repository structure, and initial UI architecture.

## Day 2 — 2026-05-08

**Hours worked:** 5

**What I did:**  
Focused on refining the product structure and planning the implementation order before writing major features.

Worked on:

- naming decisions
- landing page messaging
- audit result structure
- CTA strategy
- information hierarchy for the results page

Spent time researching official pricing pages for:

- ChatGPT
- Claude
- Cursor
- GitHub Copilot
- Gemini

Started building the pricing dataset format and deciding how recommendations should map to team size and use case.

Also reviewed Lighthouse optimization considerations early to avoid performance problems later.

Prepared documentation outlines for:

- ARCHITECTURE.md
- PRICING_DATA.md
- PROMPTS.md
- GTM.md

**What I learned:**  
I learned that the recommendation explanations matter almost as much as the savings calculations themselves. A recommendation without clear reasoning feels unreliable, even if technically correct.

I also realized that honest “already optimized” results are important for credibility.

**Blockers / what I'm stuck on:**  
Balancing simplicity vs flexibility in the audit engine logic. It’s easy to overcomplicate recommendation systems too early.

**Plan for tomorrow:**  
Begin implementing the spend input flow, reusable form components, and the first version of the audit calculation engine.

## Day 3 — 2026-05-09

**Hours worked:** 3
**What I did:** Made the first tracked commit and established the initial project baseline.
**What I learned:** A small, clean starting point makes later fixes easier to reason about.
**Blockers / what I'm stuck on:** None.
**Plan for tomorrow:** Tighten configuration and continue the project setup.

## Day 4 — 2026-05-10

**Hours worked:** 4
**What I did:** Updated project configuration in multiple commits and kept the setup moving forward.
**What I learned:** Configuration work compounds quickly, so it helps to keep changes small and verifiable.
**Blockers / what I'm stuck on:** None.
**Plan for tomorrow:** Validate the setup and test the app-facing workflow.

## Day 5 — 2026-05-11

**Hours worked:** 3
**What I did:** Tested contribution visibility behavior and refined project configuration again.
**What I learned:** Small verification commits are useful when you are checking environment or repo behavior.
**Blockers / what I'm stuck on:** None.
**Plan for tomorrow:** Improve the audit engine and pricing data.

## Day 6 — 2026-05-12

**Hours worked:** 4
**What I did:** Improved the pricing data and the audit engine to make recommendations more accurate.
**What I learned:** Pricing and audit logic need to stay aligned, or the recommendation output loses trust.
**Blockers / what I'm stuck on:** None.
**Plan for tomorrow:** Fix formatting, lint issues, and verify the build.

## Day 7 — 2026-05-13

**Hours worked:** 5
**What I did:** Fixed formatting, resolved lint errors, validated the production build, and checked the deployed results page to trace a 404 coming from the audit API endpoint.
**What I learned:** The app could render correctly even when the deployed persistence layer missed an audit record, so the results page needed a cache-first fetch path.
**Blockers / what I'm stuck on:** The deployed audit API returned 404 for a missing record, which needed a client-side fallback.
**Plan for tomorrow:** Keep monitoring the deployed flow and clean up any remaining persistence issues.
```
