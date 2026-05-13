# Database Schema

SpendLens is designed to use Supabase Postgres in production.

## `audits`

Stores the full persisted audit payload.

Suggested columns:

- `id` text primary key
- `input` jsonb not null
- `results` jsonb not null
- `total_monthly_savings` numeric not null
- `total_annual_savings` numeric not null
- `total_savings_percent` numeric null
- `summary` text not null
- `created_at` timestamptz not null

## `public_audits`

Stores the public share snapshot.

Suggested columns:

- `id` text primary key
- `results` jsonb not null
- `total_monthly_savings` numeric not null
- `total_annual_savings` numeric not null
- `total_savings_percent` numeric null
- `summary` text not null
- `created_at` timestamptz not null

## `leads`

Stores notify-me and Credex signups.

Suggested columns:

- `id` uuid primary key default gen_random_uuid()
- `email` text not null
- `company_name` text null
- `role` text null
- `team_size` integer null
- `audit_id` text null references audits(id)
- `source` text null
- `honeypot` text null
- `created_at` timestamptz not null default now()

## Notes

- Add a unique index on `audits.id` and `public_audits.id`.
- Consider a unique or dedupe index on `leads.email` if you want one lead row per email.
- Store only public-safe fields in `public_audits`.

---

## Transactional Email Configuration (Resend)

SpendLens sends confirmation emails after lead capture via Resend.

### Current Status

**Development:** Using Resend's default domain (`onboarding@resend.dev`)

- Works immediately, no verification needed
- Subject line: "SpendLens Audit: $X/month in savings identified"
- Email template includes audit summary and Credex follow-up CTA

**Production:** Waiting for custom domain verification

### Production Setup: Custom Domain

When ready to use your own domain (e.g., `noreply@spendlens.app`):

1. **Go to Resend Dashboard**
   - Visit https://resend.com/domains
   - Click "Add domain"

2. **Enter Your Domain**
   - Example: `noreply.spendlens.app` or just `spendlens.app`

3. **Add DNS Records**
   - Resend provides CNAME and MX records
   - Add them to your domain's DNS provider

4. **Verify Status**
   - Status changes to "Verified" when DNS records are recognized
   - Typically takes 5-60 minutes

5. **Update Environment Variable**
   - Edit `.env.local` (or production environment):
     ```env
     RESEND_FROM_EMAIL=SpendLens <noreply@spendlens.app>
     ```
   - No code changes needed

### Email Behavior

**If domain is unverified:**

- API returns error: "Invalid from address" or "domain not verified"
- Lead is still saved to Supabase ✅
- Audit result is still shown to user ✅
- Error is logged server-side for debugging
- User sees success UI (email is optional)

**If domain is verified:**

- Email sends successfully ✅
- Lead receives confirmation with audit summary
- Includes monthly savings, annual impact, top 3 opportunities
- Includes Credex follow-up note (if savings > $500/month)

### Architecture: Email is Non-Blocking

- Lead capture does NOT require email to succeed
- Email failures never break the audit flow
- Lead data is persisted BEFORE email is sent
- Email service failures are caught and logged
- No user-facing errors for email issues

This resilient design allows rolling out email without risk of breaking core functionality.
