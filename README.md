# 🎯 SpendLens — AI Spend Audit for Founders, Teams, and Individuals

**SpendLens** is an AI-powered spend auditing web app that helps founders, teams, and individuals identify wasteful, redundant, or overpriced AI tool subscriptions in minutes. You enter your current AI tool stack, and SpendLens runs a defensible audit across four check types — right-sizing, cross-tool alternatives, Credex credits, and API vs. subscription comparisons — then emails you a personalized savings report.

---

## 🖥️ Screenshots / Demo

Landing Page

<img width="2843" height="1632" alt="Screenshot 2026-05-13 181728" src="https://github.com/user-attachments/assets/70faf19b-d1ad-48c9-9a5a-62dc0fe6b920" />

Audit step 1

<img width="874" height="1257" alt="Screenshot 2026-05-13 182026" src="https://github.com/user-attachments/assets/ca67c053-7d44-4d31-b6a4-93080cb52933" />

Audit step 2 

<img width="2212" height="1243" alt="Screenshot 2026-05-13 182319" src="https://github.com/user-attachments/assets/ec1d7393-961c-4aa3-9e89-11428ac7935c" />

Resend Email

<img width="2085" height="1603" alt="Screenshot 2026-05-13 182401" src="https://github.com/user-attachments/assets/866cee25-3866-4f90-9c43-d14719e84374" />

Result Page

<img width="1655" height="1609" alt="Screenshot 2026-05-13 182424" src="https://github.com/user-attachments/assets/57b5d288-b511-4eb2-a4f9-383747dd706f" />

Email Send 

<img width="2642" height="1070" alt="Screenshot 2026-05-13 182915" src="https://github.com/user-attachments/assets/a1ebb8c2-58b6-48d6-9297-35890baeb20b" />

> 🎥 **Demo Recording:** Not included in this repository snapshot

## ✨ What It Does

- **Multi-step spend form** — enter your AI tools, billing type (`subscription` / `api` / `hybrid`), use case, team size, and usage frequency
- **4-check audit engine** — runs right-sizing, cross-tool alternatives, Credex credits, and API vs. subscription analysis per tool
- **Capability compatibility scoring** — uses dynamic per-use-case weightings to ensure alternatives are fit for purpose before recommending them
- **Underutilization detection** — flags unused seats and licenses as the highest-priority savings
- **AI-generated summary** — powered by Google Gemini (AI Studio API)
- **Shareable results page** — persistent audit at `/results/[id]`
- **Audit confirmation email** — sent via Resend with full savings breakdown
- **Supabase persistence** — leads and audits stored in PostgreSQL

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- [Resend](https://resend.com) account (free tier works for dev)
- [Supabase](https://supabase.com) project
- [Google AI Studio](https://aistudio.google.com) API key (Gemini)

### Install & Run Locally

```bash
# 1. Clone the repo
git clone https://github.com/MOUNIKA061/SpendLens.git
cd SpendLens

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Fill in values (see below)

# 4. Run the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment Variables

```env
# AI — Google Gemini (AI Studio)
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_key

# Email — Resend
RESEND_API_KEY=re_xxxxxxxxxxxx
RESEND_FROM_EMAIL=SpendLens <onboarding@resend.dev>

# Database — Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

> ⚠️ `onboarding@resend.dev` only delivers to your own Resend signup email. To send to anyone, verify a custom domain at [resend.com/domains](https://resend.com/domains) and update `RESEND_FROM_EMAIL`.

### Run Tests

```bash
npm test
```

### Deploy to Vercel

```bash
npm i -g vercel
vercel --prod
```

Add all `.env.local` variables under **Vercel → Settings → Environment Variables**.

**🌐 Deployed URL:** https://spend-lens-tawny.vercel.app

---

## 🏗️ Tech Stack

| Layer      | Technology                         |
| ---------- | ---------------------------------- |
| Framework  | Next.js 16 (App Router, Turbopack) |
| Language   | TypeScript                         |
| Styling    | Tailwind CSS v4                    |
| AI         | Google Gemini (AI Studio API)      |
| Email      | Resend                             |
| Database   | Supabase (PostgreSQL)              |
| Testing    | Vitest                             |
| Deployment | Vercel                             |

---

## 🧠 Architecture

```
src/
├── app/
│   ├── api/
│   │   ├── audits/[id]/     → Fetch saved audit by ID
│   │   ├── leads/           → Capture lead + run audit + send email
│   │   └── og/[id]/         → OG image generation for social sharing
│   └── results/[id]/        → Shareable audit results page
├── components/
│   ├── SpendForm.tsx         → Multi-step form (tool entry)
│   └── AuditResults.tsx      → Results dashboard
└── lib/
    ├── auditEngine.ts        → Core 4-check savings logic
    ├── pricingData.ts        → Tool pricing + capability definitions
    └── server/
        └── email.ts          → Resend email delivery (non-blocking)
```

**Data flow:**

1. User fills SpendForm → submits tool stack with billing/usage metadata
2. `/api/leads` captures lead, runs `auditTools()`, persists to Supabase
3. Results rendered at `/results/[id]` with shareable link
4. Confirmation email sent via Resend (non-blocking — never interrupts audit flow)

---

## ⚙️ Audit Engine — How It Works

The core `auditTools()` function in `auditEngine.ts` runs **4 checks per tool**, picks the best candidate by score, and returns ranked results:

| Check                      | When it runs                           | What it finds                                |
| -------------------------- | -------------------------------------- | -------------------------------------------- |
| **Right-sizing**           | `subscription` / `hybrid` billing      | Cheaper plan within same vendor              |
| **Cross-tool alternative** | `subscription` / `hybrid` billing      | Compatible cheaper tool for your use case    |
| **API vs. subscription**   | `subscription` billing, Claude/ChatGPT | Whether pay-per-use would be cheaper         |
| **API cost-benefit**       | `api` / `hybrid` billing               | Whether a flat subscription would be cheaper |

Underutilized seats (< 50% active users) are flagged as **critical priority** before any of the above — unused licenses are pure waste with zero switching risk.

Capability compatibility uses **dynamic per-use-case weightings** — e.g. `coding` heavily weights `agentEditing` and `codingDepth`, while `research` weights `longContextSupport` and `dataAnalysisStrength`. Alternatives below 75% compatibility are filtered out.

---

## ⚖️ Decisions — 5 Trade-offs & Why

### 1. Non-blocking email delivery

**Decision:** Email failures never interrupt the audit. Leads and audits are persisted to Supabase first; email is fire-and-forget with full error logging.  
**Why:** A Resend quota limit or unverified domain shouldn't mean users lose their results. The core value — audit + results page — always works regardless of email status.

### 2. Four separate check functions over one black-box scorer

**Decision:** Named check functions (`checkRightSize`, `checkCrossToolAlternative`, `checkApiVsSubscription`, `compareApiBillingToSubscription`) rather than a single scoring model.  
**Why:** Each check has different logic, inputs, and confidence levels. Keeping them separate makes recommendations auditable, testable, and easy to extend — a reviewer can trace exactly why a recommendation was made.

### 3. Dynamic capability weighting per use case

**Decision:** Compatibility scores use different weights depending on whether the use case is `coding`, `research`, `data`, `writing`, etc.  
**Why:** A tool that scores 90% for writing might score 60% for coding. A single global weight would generate misleading compatibility scores and bad recommendations. The added complexity is justified by accuracy.

### 4. Billing type as a first-class input field

**Decision:** Every tool entry has an explicit `billingType` (`subscription` / `api` / `hybrid`) which gates which checks run.  
**Why:** Seat-based and usage-based tools need fundamentally different optimization strategies. Applying seat-count logic to an API tool produces nonsensical recommendations. Explicit billing type prevents this at the data layer.

### 5. Google Gemini (AI Studio) for the AI summary

**Decision:** AI-generated audit summaries use Google Gemini via the AI Studio API rather than OpenAI or Anthropic.  
**Why:** Google AI Studio's free tier is generous for demo-scale usage with no credit card required. For a hard-deadline internship project, unblocking development immediately mattered more than provider preference. The call is isolated to one function — swapping providers later is a one-line change.
