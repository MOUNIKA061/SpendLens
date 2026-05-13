This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Phase 1 Master Checklist (Verification)

Use this checklist before shipping updates:

- Product direction finalized: name, positioning, target user, pricing/audit strategy
- Engineering setup complete: Next.js + TypeScript + Tailwind + ESLint + Prettier
- CI active: lint, format check, and build on pull requests
- Backend integrated: Supabase schema, API routes, Resend email, rate limiting/honeypot
- Environments configured: `SUPABASE_*`, `GEMINI_API_KEY`, `RESEND_*`

## Local Validation

Run these commands before pushing:

```bash
npm run format:check
npm run lint
npm run build
```

## Deployment Verification

After connecting GitHub to Vercel:

1. Confirm all required environment variables are set in Vercel project settings.
2. Open a pull request and verify GitHub Actions CI passes.
3. Merge to `main` and verify Vercel production deployment succeeds.
4. Smoke test these routes: `/`, `/audit`, `/results/[id]`, `/api/leads`, `/api/audit`.
