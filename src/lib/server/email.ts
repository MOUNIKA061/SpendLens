import { Resend } from 'resend'

import type { FullAudit } from '@/types'

type LeadRecord = {
  email: string
  companyName?: string
  role?: string
  teamSize?: number
  auditId?: string
}

function buildConfirmationHtml(lead: LeadRecord, audit: FullAudit): string {
  const credexNote = audit.totalMonthlySavings > 500
    ? '<p style="margin-top:16px;padding:12px;background:#f0f9ff;border-left:3px solid #0ea5e9"><strong>Credex Follow-up:</strong> At this savings scale, Credex can help capture more value through procurement optimization and credit strategies.</p>'
    : ''

  const confidenceNote = audit.results
    .filter(r => r.confidence === 'low')
    .length > 0
    ? '<p style="margin-top:12px;color:#78350f"><em>Note: Some recommendations have lower confidence. Evaluate carefully before implementation.</em></p>'
    : ''

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body style="font-family:Inter,Arial,sans-serif;line-height:1.6;color:#0f172a;margin:0;padding:0">
        <div style="max-width:600px;margin:0 auto;padding:20px">
          <h1 style="font-size:24px;font-weight:700;margin:0 0 16px">Your SpendLens Audit is Ready</h1>
          <p>Thanks for sharing your email${lead.companyName ? ` from <strong>${lead.companyName}</strong>` : ''}. We've analyzed your AI tool spending and found meaningful opportunities.</p>
          
          <div style="background:#f8fafc;padding:16px;border-radius:8px;margin:16px 0">
            <h2 style="font-size:18px;font-weight:600;margin:0 0 12px;color:#1e293b">Savings Summary</h2>
            <p style="margin:0;font-size:16px"><strong>Monthly Savings:</strong> <span style="color:#059669;font-size:20px;font-weight:700">$${audit.totalMonthlySavings}</span></p>
            <p style="margin:8px 0 0;font-size:16px"><strong>Annual Impact:</strong> <span style="color:#059669;font-size:18px;font-weight:700">$${audit.totalAnnualSavings}/year</span></p>
            ${audit.totalSavingsPercent ? `<p style="margin:8px 0 0;font-size:14px;color:#64748b">${audit.totalSavingsPercent.toFixed(1)}% of current spend</p>` : ''}
          </div>

          <div style="background:#f0f9ff;padding:16px;border-radius:8px;margin:16px 0">
            <h3 style="font-size:14px;font-weight:600;margin:0 0 8px;color:#0369a1">Top Opportunities</h3>
            <p style="margin:0;color:#0c4a6e">${audit.results.slice(0, 3).map(r => `<strong>${r.toolName}:</strong> $${r.monthlySavings}/month by ${r.recommendedAction}`).join('<br />')}</p>
          </div>

          ${credexNote}
          ${confidenceNote}

          <p style="margin-top:20px;color:#475569;font-size:14px">You can access your full audit details and share results with your team via your personal audit link.</p>
          
          <div style="margin-top:20px;padding-top:16px;border-top:1px solid #e2e8f0;text-align:center;font-size:12px;color:#94a3b8">
            <p style="margin:0">SpendLens — Optimize your AI tool spend</p>
          </div>
        </div>
      </body>
    </html>
  `
}

/**
 * Send audit confirmation email via Resend
 * Gracefully handles: missing API key, Resend API errors, rate limits
 * Failures are logged but do not interrupt the audit flow
 */
export async function sendAuditConfirmationEmail(lead: LeadRecord, audit: FullAudit): Promise<{
  success: boolean
  error?: string
}> {
  const apiKey = process.env.RESEND_API_KEY
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'SpendLens <onboarding@resend.dev>'

  if (!apiKey) {
    console.warn('[EMAIL] RESEND_API_KEY not configured, skipping email delivery')
    return { success: false, error: 'RESEND_API_KEY not configured' }
  }

  try {
    const resend = new Resend(apiKey)
    const result = await resend.emails.send({
      from: fromEmail,
      to: lead.email,
      subject: `SpendLens Audit: $${audit.totalMonthlySavings}/month in savings identified`,
      html: buildConfirmationHtml(lead, audit),
    })

    if (result.error) {
      console.error('[EMAIL] Resend API error:', {
        to: lead.email,
        auditId: lead.auditId,
        error: result.error.message,
      })
      return { success: false, error: result.error.message }
    }

    console.info('[EMAIL] Confirmation email sent successfully', {
      to: lead.email,
      auditId: lead.auditId,
      emailId: result.data?.id,
    })
    return { success: true }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('[EMAIL] Email delivery failed:', {
      to: lead.email,
      auditId: lead.auditId,
      error: errorMessage,
    })

    // Distinguish between rate limiting and other errors
    if (errorMessage.includes('429') || errorMessage.includes('rate limit')) {
      console.warn('[EMAIL] Rate limited by Resend, will retry later')
      return { success: false, error: 'Rate limited' }
    }

    return { success: false, error: errorMessage }
  }
}
