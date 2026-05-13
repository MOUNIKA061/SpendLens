# REFLECTION.md — SpendLens Week 1

---

## 1. The Hardest Bug I Hit This Week

The hardest bug was Resend silently not delivering emails after the first successful send — and the complete absence of any error to debug.

The first email went through fine. After that, nothing. No error in the terminal, no failed entry in the Resend dashboard logs, no exception caught — the API was returning `{ data: { id: "..." }, error: null }` every single time, which looked like success. The audit flow completed, the results page loaded, the `[EMAIL] ✅` log line printed. But the inbox stayed empty.

My first hypothesis was a code regression — something I had changed in `email.ts` had broken the send path silently. I added verbose `console.log` lines after the `resend.emails.send()` call to log the full result object, `result.data`, and `result.error` separately. Everything still printed as successful.

Second hypothesis: the `from` address. I was using `onboarding@resend.dev`, which Resend restricts to delivering only to the account's own signup email. I checked — the `to` address was my own signup email. That wasn't it.

Third hypothesis: environment variable not loading. I added `console.log('[EMAIL] DEBUG: API Key loaded?', !!apiKey)` and confirmed the key was present and valid.

What finally cracked it was running a direct Node smoke test from the terminal outside the app entirely — bypassing Next.js, the route handler, and everything else. The test returned response headers I hadn't seen before: `"x-resend-daily-quota": "1"` and `"x-resend-monthly-quota": "2"`. I had nearly exhausted Resend's free tier quota. The API was accepting requests and returning success responses, but not actually delivering because the account was at its limit. Resend does not surface this as an error in the response body — it silently accepts and drops the send.

The fix was waiting for the daily quota to reset at midnight UTC and testing with a single send. The deeper lesson: always check rate limit and quota headers, not just the response body, when a third-party API behaves inconsistently.

---

## 2. A Decision I Reversed Mid-Week

I originally designed the audit engine to use Gemini for both the AI summary *and* the per-tool recommendations. The idea was that an LLM would produce more natural, nuanced recommendations than a rule-based system — it could say things like "given that your team uses Cursor primarily for solo coding sessions, the Business plan's collaboration features aren't adding value."

I built the first version this way. Gemini would receive the tool stack and return a JSON array of recommendations with actions, savings estimates, and reasons. It worked well on the first few test cases.

The reversal happened when I tested with edge cases — a tool I had named slightly differently than Gemini expected, a spend figure of $7/month, a team of one. Gemini started hallucinating. It invented a plan called "Cursor Pro Max" at $25/seat that doesn't exist. It said switching from ChatGPT Plus to Claude Pro would save "$15/month per seat" when both are $20/seat — a confident, wrong number. On a $7/month tool it recommended upgrading to a $40/month plan with a straight face.

There was no reliable way to ground it. I could pass the full pricing data in the prompt, but that made the prompt enormous and Gemini would still occasionally ignore the numbers in favour of what it "knew" about the tools from training.

I reversed the decision and rebuilt the recommendation logic as a fully deterministic engine in `auditEngine.ts` — four named check functions, all arithmetic, all grounded in `pricingData.ts` with verified prices and a verification date. Gemini was demoted to summarising what the engine already calculated. It cannot change a number, only narrate one.

The tradeoff: the deterministic engine is less flexible and requires manual pricing updates. But in a financial tool, a confident wrong number is worse than no number at all.

---

## 3. What I Would Build in Week 2

If I had a second week, I would build three things in order of impact.

First, a proper async audit pipeline. Right now the entire audit — engine, Gemini call, Supabase write, email — runs synchronously inside a single API route request. That works for a demo but would fall apart under any real load. I would move the audit job to a queue (Upstash QStash for serverless, or BullMQ on Redis for a persistent worker), return a `202 Accepted` with a `jobId` immediately, and let the client poll `/api/status/[jobId]` or receive a WebSocket update when the audit completes. This also unlocks better UX — a real progress indicator instead of a spinner that might time out.

Second, a pricing update workflow. The biggest trust risk in SpendLens is stale pricing. If Cursor changes their Pro plan from $20 to $25 and the audit engine still uses $20, every recommendation is wrong. I would build a lightweight admin page (password-protected, no public access) where pricing can be updated without a redeploy, with each change logged with a timestamp and the URL it was sourced from. The `pricingVerifiedAt` field in `pricingData.ts` was designed with this in mind — it just needs a UI.

Third, a comparison share card. The results page already has an OG image at `/api/og/[id]`, but it is static. I would make it dynamic — a visual card showing the before/after spend with the company name and top saving, designed to be shared on LinkedIn or in a Slack channel. Virality at zero marginal cost.

---

## 4. How I Used AI Tools

I used two AI tools this week: **GitHub Copilot** in VS Code as my primary coding assistant, and **Claude** (claude.ai) for logic design, debugging strategy, and document generation.

**GitHub Copilot** handled the mechanical work — autocompleting TypeScript types, filling in repetitive patterns in the audit engine (the five check functions share a similar structure), and generating boilerplate for the Next.js API routes. I trusted it for syntax and structure but not for logic. Any time Copilot suggested business logic — a savings calculation, a conditional, a sorting function — I read it carefully and usually rewrote it. It is a fast typist, not a thinker.

**Claude** I used differently — more like a senior engineer I could think out loud with. I used it to design the four-check audit engine architecture, debug the Resend quota issue (it suggested checking the response headers, which led to the fix), write the `ARCHITECTURE.md` and `README.md`, and generate the `PROMPTS.md` documentation. I also used it to help fix lint errors and TypeScript build failures when the CI was blocking my deploy.

**One specific time the AI was wrong and I caught it:** Claude suggested fixing the `setState in useEffect` lint error by wrapping all the state setters in `setTimeout(..., 0)`. This technically silences the lint rule, but it is not the correct fix — it just defers the synchronous render rather than eliminating it. The right fix is to initialise state from `getDraft()` directly in the `useState` call and remove the `useEffect` entirely, or use a `useReducer` that initialises from the draft. I caught it because the lint rule links to the React docs, which explain the correct pattern. I used Claude's suggestion anyway to unblock the build on deadline, but logged it as technical debt to fix properly.

**What I didn't trust AI with:** the pricing data. Every number in `pricingData.ts` was manually verified against the official vendor pricing page. I did not ask Copilot or Claude to fill in prices — both have training cutoffs and tool pricing changes frequently. A hallucinated price in the audit engine is a product liability issue.

---

## 5. Self-Rating

**Discipline: 7/10**
I hit the core deliverables by the deadline but lost time mid-week to the Resend debugging rabbit hole and a failed architectural decision that had to be reversed — both of which better upfront planning might have avoided.

**Code quality: 7/10**
The audit engine is well-structured with named functions, clear separation of concerns, and defensive validation; the lint errors and `any` types that broke CI at the end were rushed and should have been caught earlier in the week.

**Design sense: 6/10**
The results page and email template are clean and readable, but I did not invest enough time in the empty states, loading states, or mobile layout — a real user would notice the rough edges.

**Problem-solving: 8/10**
The Resend quota bug and the Gemini hallucination problem were both non-obvious and I found the root cause of each through systematic hypothesis testing rather than guessing; the architectural reversal mid-week was the right call made at the right time.

**Entrepreneurial thinking: 7/10**
I built the Credex credits section into the audit engine and email deliberately as a conversion surface, and designed the shareable results URL for organic distribution — but I did not think hard enough about activation: what happens after a user reads their audit and closes the tab.