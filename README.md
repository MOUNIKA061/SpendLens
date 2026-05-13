# SpendLens

**SpendLens** is a free AI spend audit web app for founders, teams, and individuals who want a fast second opinion on their AI tool stack. It helps users identify wasteful subscriptions, right-size plans, compare alternatives, and share a clear results page with a public link.

**Live app:** https://spend-lens-tawny.vercel.app

---

## What It Does

- Multi-step spend form for AI tools, plans, monthly spend, seats, team size, and use case
- Rules-based audit engine that evaluates right-sizing, cross-tool alternatives, credits, and API vs. subscription fit
- Instant results page with monthly savings, annual savings, and top recommendations
- Email capture after value is shown, never before
- Shareable public audit URLs with Open Graph previews
- Resilient lead storage and confirmation email delivery

---

## Screenshots / Demo

> Add 3 screenshots here or link a short demo video.
>
> - Spend form
> - Audit results page
> - Confirmation email

---

## Quick Start

### Prerequisites

- Node.js 18+
- Resend account
- Supabase project
- Google AI Studio API key

### Install

```bash
git clone https://github.com/MOUNIKA061/SpendLens.git
cd SpendLens
npm install
```

### Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment variables

```env
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_key
RESEND_API_KEY=re_xxxxxxxxxxxx
RESEND_FROM_EMAIL=SpendLens <onboarding@resend.dev>
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Test

```bash
npm test
```

### Build

```bash
npm run build
```

### Deploy

```bash
npm i -g vercel
vercel --prod
```

Add the same environment variables in your deployment platform.

---

## Tech Stack

| Layer      | Technology                    |
| ---------- | ----------------------------- |
| Framework  | Next.js 16 App Router         |
| Language   | TypeScript                    |
| Styling    | Tailwind CSS v4               |
| AI Summary | Google Gemini (AI Studio API) |
| Email      | Resend                        |
| Database   | Supabase (PostgreSQL)         |
| Testing    | Vitest                        |
| Deployment | Vercel                        |

---

## Architecture

### High-level flow

1. A user lands on the home page and opens the audit form.
2. They enter tool, plan, spend, seat, and use-case details.
3. The API runs the audit engine and generates a summary.
4. Results are stored and rendered at a public shareable URL.
5. A confirmation email is sent after the user sees value.

### Project structure

```text
src/
├── app/
│   ├── api/
│   │   ├── audits/[id]/
│   │   ├── leads/
│   │   └── og/[id]/
│   └── results/[id]/
├── components/
│   ├── SpendForm.tsx
│   └── AuditResults.tsx
└── lib/
    ├── auditEngine.ts
    ├── pricingData.ts
    └── server/
        └── email.ts
```

---

## Decisions

### 1. Non-blocking email delivery

Email failures never block the audit flow. The core product value is the audit result, so email is best-effort.

### 2. Separate recommendation checks

The engine uses named checks instead of one opaque score so the reasoning stays auditable and easy to debug.

### 3. Dynamic capability weighting

Different use cases value different capabilities. A single global score would produce misleading recommendations.

### 4. Billing type as a first-class field

Subscription, API, and hybrid tools need different optimization logic, so billing type controls which checks run.

### 5. Gemini only for the summary

The audit math is rule-based. AI is used only for the human-readable summary, which keeps the core logic deterministic.

---

## Notes

- Pricing data is documented in [PRICING_DATA.md](PRICING_DATA.md).
- The audit engine has dedicated tests in [src/lib/auditEngine.test.ts](src/lib/auditEngine.test.ts).
- The app is designed for founders, teams, and individuals, not just startup companies.
