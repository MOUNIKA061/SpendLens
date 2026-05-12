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
