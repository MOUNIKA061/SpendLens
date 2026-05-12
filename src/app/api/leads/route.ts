import { NextRequest, NextResponse } from 'next/server'

import { getAuditRecord, saveLeadRecord } from '@/lib/server/persistence'
import { sendAuditConfirmationEmail } from '@/lib/server/email'
import type { LeadSubmission } from '@/types'

const recentSubmissions = new Map<string, number>()

function getClientKey(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'anonymous'
}

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

    // Save lead record
    const saveResult = await saveLeadRecord({
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

    // Retrieve audit for email
    const audit = await getAuditRecord(payload.auditId)

    if (audit) {
      // Send confirmation email (non-blocking, failures don't interrupt flow)
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

      // Log email status but don't fail the request
      if (!emailResult.success) {
        console.warn('[LEADS] Email delivery skipped', {
          email: payload.email,
          auditId: payload.auditId,
          reason: emailResult.error,
        })
      }
    } else {
      console.warn('[LEADS] Audit not found for email', { auditId: payload.auditId })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('[LEADS] Lead submission error', {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    })
    return NextResponse.json({ error: 'Failed to process lead submission' }, { status: 500 })
  }
}
