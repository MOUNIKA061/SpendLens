import { NextRequest, NextResponse } from 'next/server'

import { getAuditRecord, saveLeadRecord } from '@/lib/server/persistence'
import { sendAuditConfirmationEmail } from '@/lib/server/email'
import type { LeadSubmission } from '@/types'

const recentSubmissions = new Map<string, number>()

function getClientKey(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'anonymous'
  )
}

/**
 * LEAD CAPTURE API
 *
 * ARCHITECTURE:
 * 1. Validate lead submission (honeypot, rate limit, required fields)
 * 2. Save lead to Supabase or JSON fallback
 * 3. Send confirmation email (async, non-blocking)
 * 4. ALWAYS return success (200 OK) to client
 *
 * RESILIENCE:
 * - Email failures do NOT prevent lead from being saved
 * - Email failures do NOT return error to client
 * - Email failures are logged server-side for debugging
 * - User sees success UI regardless of email delivery status
 * - Lead/audit data is persisted even if email fails
 *
 * TRANSACTIONAL EMAIL STATUS:
 * - Currently: Non-critical (best-effort delivery)
 * - Can be enabled on demand by updating Resend domain verification
 * - No architecture changes needed when enabling
 * - All errors already handled gracefully
 */
export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as LeadSubmission
    const honeypot = payload.honeypot?.trim()
    const clientKey = getClientKey(request)
    const now = Date.now()
    const lastSeen = recentSubmissions.get(clientKey) ?? 0

    if (honeypot) {
      console.warn('[LEADS] Honeypot triggered', { clientKey })
      return NextResponse.json({ ok: true })
    }

    if (now - lastSeen < 30_000) {
      console.warn('[LEADS] Rate limit exceeded', { clientKey, timeSinceLastSeen: now - lastSeen })
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    recentSubmissions.set(clientKey, now)

    if (!payload.email || !payload.auditId) {
      console.warn('[LEADS] Invalid submission', { email: payload.email, auditId: payload.auditId })
      return NextResponse.json({ error: 'Invalid lead submission' }, { status: 400 })
    }

    // STEP 1: Save lead record to Supabase or JSON
    // This MUST succeed for the flow to continue
    await saveLeadRecord({
      email: payload.email,
      companyName: payload.companyName,
      role: payload.role,
      teamSize: payload.teamSize,
      auditId: payload.auditId,
      source: payload.source,
      honeypot,
    })

    console.info('[LEADS] Lead saved', {
      email: payload.email,
      auditId: payload.auditId,
      companyName: payload.companyName,
    })

    // STEP 2: Retrieve audit for email template
    const audit = await getAuditRecord(payload.auditId)

    if (audit) {
      // STEP 3: Send confirmation email (non-blocking, failures are tolerated)
      // This is wrapped in try-catch so that any email error doesn't propagate
      // User will see success (200 OK) even if email fails
      console.info('[LEADS] Starting email send...', {
        email: payload.email,
        auditId: payload.auditId,
        summaryLength: audit.summary?.length || 0,
        totalSavings: audit.totalMonthlySavings,
      })

      try {
        const emailResult = await sendAuditConfirmationEmail(
          {
            email: payload.email,
            companyName: payload.companyName,
            role: payload.role,
            teamSize: payload.teamSize,
            auditId: payload.auditId,
          },
          audit,
        )

        // Log email status for debugging (but don't fail the request)
        if (emailResult.success) {
          console.info('[LEADS] ✅ Email sent successfully', {
            email: payload.email,
            auditId: payload.auditId,
          })
        } else {
          const reason = emailResult.isDomainIssue
            ? 'Resend domain not verified (waiting for production setup)'
            : emailResult.error

          console.warn('[LEADS] ⚠️ Email delivery failed', {
            email: payload.email,
            auditId: payload.auditId,
            reason,
            isDomainIssue: emailResult.isDomainIssue,
            error: emailResult.error,
          })
        }
      } catch (emailError) {
        // Email service failed entirely - log but continue
        console.error('[LEADS] ❌ Email service error', {
          email: payload.email,
          auditId: payload.auditId,
          error: emailError instanceof Error ? emailError.message : String(emailError),
          stack: emailError instanceof Error ? emailError.stack : undefined,
        })
      }
    } else {
      console.warn('[LEADS] Audit not found for email', { auditId: payload.auditId })
    }

    // STEP 4: Always return success to client
    // Lead was saved to database, user flow is not interrupted
    return NextResponse.json({ ok: true })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('[LEADS] Lead submission error', {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    })
    // Even on error, we try to be resilient
    // but in this case, lead persistence failed so we must return error
    return NextResponse.json({ error: 'Failed to process lead submission' }, { status: 500 })
  }
}
