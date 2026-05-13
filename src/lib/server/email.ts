import { Resend } from 'resend'

import type { FullAudit } from '@/types'

type LeadRecord = {
  email: string
  companyName?: string
  role?: string
  teamSize?: number
  auditId?: string
}

function getPublicBaseUrl(): string {
  const configuredUrl =
    process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL

  if (!configuredUrl) return 'https://spendlens.app'

  if (configuredUrl.startsWith('http://') || configuredUrl.startsWith('https://')) {
    return configuredUrl.replace(/\/$/, '')
  }

  return `https://${configuredUrl.replace(/\/$/, '')}`
}

function buildConfirmationHtml(lead: LeadRecord, audit: FullAudit): string {
  const publicBaseUrl = getPublicBaseUrl()
  const auditUrl = lead.auditId ? `${publicBaseUrl}/results/${lead.auditId}` : publicBaseUrl

  // Format savings with thousands separator
  const formatCurrency = (num: number) => `$${Math.round(num).toLocaleString()}`

  // Credex callout for high-savings audits
  const credexSection =
    audit.totalMonthlySavings > 500
      ? `
      <tr>
        <td style="padding:0">
          <table width="100%" style="margin-top:24px;border-collapse:collapse">
            <tr>
              <td style="background:#0f172a;border:1px solid #1f2937;border-left:4px solid #10b981;padding:16px;border-radius:8px">
                <p style="margin:0 0 8px;font-size:14px;font-weight:600;color:#d1fae5">💼 Credex Consultation</p>
                <p style="margin:0;font-size:13px;color:#cbd5e1;line-height:1.5">At your savings scale, Credex can help unlock additional value through procurement optimization and cloud credit strategies. <strong><a href="https://credex.ai" style="color:#6ee7b7;text-decoration:underline">Learn more →</a></strong></p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    `
      : ''

  // AI summary section (the core "tips")
  const summarySection = audit.summary
    ? `
      <tr>
        <td style="padding:0">
          <table width="100%" style="margin-top:24px;border-collapse:collapse">
            <tr>
              <td style="padding:0 0 12px 0">
                <p style="margin:0;font-size:14px;font-weight:600;color:#a7f3d0">📋 Audit Insights</p>
              </td>
            </tr>
            <tr>
              <td style="background:#0f172a;padding:16px;border-radius:8px;border:1px solid #1f2937;border-left:3px solid #10b981">
                <p style="margin:0;font-size:14px;line-height:1.6;color:#e2e8f0">${audit.summary}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    `
    : `
      <tr>
        <td style="padding:0">
          <table width="100%" style="margin-top:24px;border-collapse:collapse">
            <tr>
              <td style="padding:0 0 12px 0">
                <p style="margin:0;font-size:14px;font-weight:600;color:#a7f3d0">📋 Key Findings</p>
              </td>
            </tr>
            <tr>
              <td style="background:#0f172a;padding:16px;border-radius:8px;border:1px solid #1f2937;border-left:3px solid #10b981">
                <p style="margin:0;font-size:14px;line-height:1.6;color:#e2e8f0">Your current AI tool stack shows several optimization opportunities. By consolidating redundant tools and negotiating better rates on your highest-spend services, you could reduce costs while maintaining or improving productivity.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    `

  // Top 3 recommendations with better formatting
  const topThreeHtml = audit.results
    .slice(0, 3)
    .map(
      (tool, idx) => `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid #e2e8f0">
        <table width="100%" style="border-collapse:collapse">
          <tr>
            <td style="vertical-align:top;padding-right:12px;width:24px;font-weight:700;color:#6ee7b7;font-size:16px">${idx + 1}</td>
            <td style="vertical-align:top">
              <p style="margin:0 0 4px;font-size:14px;font-weight:600;color:#f8fafc">${tool.toolName}</p>
              <p style="margin:0;font-size:13px;color:#cbd5e1">${tool.recommendedAction}</p>
              <p style="margin:4px 0 0;font-size:13px;font-weight:600;color:#6ee7b7">Save ${formatCurrency(tool.monthlySavings)}/month</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `,
    )
    .join('')

  // Low confidence note if applicable
  const lowConfidenceTools = audit.results.filter((r) => r.confidence === 'low')
  const confidenceNote =
    lowConfidenceTools.length > 0
      ? `
      <tr>
        <td style="padding:0">
          <table width="100%" style="margin-top:16px;border-collapse:collapse">
            <tr>
              <td style="background:#1f2937;padding:12px 14px;border-radius:8px;border:1px solid #334155;border-left:3px solid #f59e0b">
                <p style="margin:0;font-size:12px;color:#f8fafc"><strong>⚠ Note:</strong> ${lowConfidenceTools.map((t) => t.toolName).join(', ')} have lower confidence estimates. Validate with your team before acting.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    `
      : ''

  // Message for very low savings
  const lowSavingsMessage =
    audit.totalMonthlySavings < 50
      ? `
      <tr>
        <td style="padding:0">
          <table width="100%" style="margin-top:24px;border-collapse:collapse">
            <tr>
              <td style="background:#0f172a;padding:16px;border-radius:8px;border:1px solid #1f2937;border-left:3px solid #10b981">
                <p style="margin:0;font-size:14px;line-height:1.5;color:#d1fae5"><strong>✓ Well Optimized</strong><br />Your current stack appears to be well-balanced for your use case. Focus on monitoring for new tools or price changes.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    `
      : ''

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Your SpendLens Audit Report</title>
      </head>
      <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Roboto','Oxygen','Ubuntu','Cantarell','Fira Sans','Droid Sans','Helvetica Neue',sans-serif;line-height:1.6;color:#e2e8f0;margin:0;padding:0;background:#020617">
        <table width="100%" style="border-collapse:collapse;background:#020617">
          <tr>
            <td style="padding:40px 20px">
              <table width="100%" style="max-width:600px;margin:0 auto;border-collapse:collapse;background:#0b1220;border:1px solid #1f2937;border-radius:16px;box-shadow:0 20px 50px rgba(4,8,20,0.45)">
                <!-- Header -->
                <tr>
                  <td style="background:linear-gradient(135deg,#052e16 0%,#0f172a 100%);padding:32px 24px;text-align:center;border-radius:16px 16px 0 0;border-bottom:1px solid #1f2937">
                    <p style="margin:0;font-size:28px">🎯</p>
                    <h1 style="margin:8px 0 4px;font-size:24px;font-weight:700;color:#fff">Your Audit is Ready</h1>
                    <p style="margin:0;font-size:14px;color:#a7f3d0">AI-Powered Spending Analysis</p>
                  </td>
                </tr>

                <!-- Main Content -->
                <tr>
                  <td style="padding:32px 24px">
                    <table width="100%" style="border-collapse:collapse">
                      <!-- Greeting -->
                      <tr>
                        <td style="padding:0 0 24px 0">
                          <p style="margin:0;font-size:15px;line-height:1.6;color:#e2e8f0">Hi${lead.companyName ? ` ${lead.companyName.split(' ')[0]}` : ''},</p>
                          <p style="margin:12px 0 0;font-size:15px;line-height:1.6;color:#cbd5e1">We've completed your AI tool audit and discovered some meaningful optimization opportunities for your stack.</p>
                        </td>
                      </tr>

                      <!-- Big Numbers Section -->
                      <tr>
                        <td style="padding:0">
                          <table width="100%" style="border-collapse:collapse">
                            <tr>
                              <td style="padding:16px;text-align:center;background:#0f172a;border:1px solid #1f2937;border-radius:10px;width:33.3%">
                                <p style="margin:0;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;color:#6ee7b7">Monthly Savings</p>
                                <p style="margin:6px 0 0;font-size:28px;font-weight:700;color:#fff">${formatCurrency(audit.totalMonthlySavings)}</p>
                              </td>
                              <td style="padding:16px;text-align:center;background:#0f172a;border:1px solid #1f2937;border-radius:10px;width:33.3%">
                                <p style="margin:0;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;color:#6ee7b7">Annual Impact</p>
                                <p style="margin:6px 0 0;font-size:28px;font-weight:700;color:#fff">${formatCurrency(audit.totalAnnualSavings)}</p>
                              </td>
                              <td style="padding:16px;text-align:center;background:#0f172a;border:1px solid #1f2937;border-radius:10px;width:33.3%">
                                <p style="margin:0;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;color:#6ee7b7">% of Spend</p>
                                <p style="margin:6px 0 0;font-size:28px;font-weight:700;color:#fff">${audit.totalSavingsPercent?.toFixed(1) || '—'}%</p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>

                      <!-- AI Summary / Insights -->
                      ${summarySection}

                      <!-- Top 3 Recommendations -->
                      <tr>
                        <td style="padding:0">
                          <table width="100%" style="margin-top:24px;border-collapse:collapse">
                            <tr>
                              <td style="padding:0 0 16px 0">
                                <p style="margin:0;font-size:14px;font-weight:600;color:#1e293b">🚀 Top Opportunities</p>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding:0">
                                <table width="100%" style="border-collapse:collapse">
                                  ${topThreeHtml}
                                </table>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>

                      <!-- Confidence Note -->
                      ${confidenceNote}

                      <!-- Low Savings Message -->
                      ${lowSavingsMessage}

                      <!-- Credex Section -->
                      ${credexSection}

                      <!-- CTA -->
                      <tr>
                        <td style="padding:0">
                          <table width="100%" style="margin-top:28px;border-collapse:collapse">
                            <tr>
                              <td style="text-align:center;padding-top:24px;border-top:1px solid #1f2937">
                                <a href="${auditUrl}" style="display:inline-block;padding:12px 32px;background:#10b981;color:#052e16;text-decoration:none;border-radius:999px;font-weight:700;font-size:14px">View Your Audit Results</a>
                              </td>
                            </tr>
                            <tr>
                              <td style="text-align:center;padding:16px 0 0 0">
                                <p style="margin:0;font-size:12px;color:#94a3b8">Share your secure results link with your team or reopen the full report anytime.</p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding:24px;text-align:center;border-top:1px solid #1f2937;background:#0b1220;border-radius:0 0 16px 16px">
                    <p style="margin:0;font-size:12px;color:#94a3b8">
                      <strong>SpendLens</strong> — Optimize your AI tool spending<br />
                      <a href="${publicBaseUrl}" style="color:#6ee7b7;text-decoration:none">spendlens.app</a>
                    </p>
                    <p style="margin:8px 0 0;font-size:11px;color:#cbd5e1">
                      Questions? <a href="mailto:hello@spendlens.app" style="color:#6ee7b7;text-decoration:none">Contact us</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `
}

/**
 * Send audit confirmation email via Resend
 *
 * ARCHITECTURE:
 * - Email delivery is NON-BLOCKING: failures never interrupt the audit or lead capture flow
 * - Lead and audit are persisted to Supabase BEFORE email is sent
 * - Email failures are logged server-side for debugging, but always return success to client
 * - User always sees success UI, regardless of email delivery status
 *
 * RESILIENCE:
 * - Missing RESEND_API_KEY: Skipped gracefully
 * - Unverified domain: Request blocked by Resend API, logged, not fatal
 * - Rate limits (429): Detected and logged
 * - Network timeouts: Caught and logged
 * - API errors: Caught and logged
 *
 * PRODUCTION SETUP:
 * When Resend domain is ready, update RESEND_FROM_EMAIL:
 *   1. Go to https://resend.com/domains
 *   2. Add your domain (e.g., noreply@spendlens.app)
 *   3. Verify DNS records (Resend provides CNAME/MX records)
 *   4. Once verified, update .env:
 *      RESEND_FROM_EMAIL=SpendLens <noreply@spendlens.app>
 *   5. No code changes needed - this function will automatically send from verified domain
 *
 * TROUBLESHOOTING:
 * - Check logs for [EMAIL] prefix to see delivery status
 * - If using onboarding@resend.dev: works immediately (Resend's default)
 * - If custom domain: must be verified in Resend dashboard first
 * - Domain unverified error typically: "Invalid from address" or "domain not verified"
 */
export async function sendAuditConfirmationEmail(
  lead: LeadRecord,
  audit: FullAudit,
): Promise<{
  success: boolean
  error?: string
  isDomainIssue?: boolean
}> {
  const apiKey = process.env.RESEND_API_KEY
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'SpendLens <onboarding@resend.dev>'

  // DEBUG: Log API key presence
  console.log(
    '[EMAIL] DEBUG: API Key loaded?',
    !!apiKey,
    apiKey ? `(${apiKey.substring(0, 10)}...)` : 'UNDEFINED',
  )
  console.log('[EMAIL] DEBUG: From email:', fromEmail)

  if (!apiKey) {
    console.warn('[EMAIL] ⚠️ RESEND_API_KEY not configured, skipping email delivery')
    return { success: false, error: 'RESEND_API_KEY not configured' }
  }

  console.info('[EMAIL] 📧 Preparing email...', {
    to: lead.email,
    from: fromEmail,
    auditId: lead.auditId,
    subject: `SpendLens Audit: $${audit.totalMonthlySavings}/month in savings identified`,
    summaryLength: audit.summary?.length || 0,
    toolsCount: audit.results.length,
  })

  try {
    const resend = new Resend(apiKey)
    const htmlContent = buildConfirmationHtml(lead, audit)

    console.info('[EMAIL] 📤 Calling Resend API...', {
      to: lead.email,
      from: fromEmail,
      htmlLength: htmlContent.length,
    })

    const result = await resend.emails.send({
      from: fromEmail,
      to: lead.email,
      subject: `SpendLens Audit: $${audit.totalMonthlySavings}/month in savings identified`,
      html: htmlContent,
    })

    if (result.error) {
      const errorMsg = result.error.message
      const isDomainError =
        errorMsg.includes('domain') ||
        errorMsg.includes('from address') ||
        errorMsg.includes('verified') ||
        errorMsg.toLowerCase().includes('unverified')

      console.error('[EMAIL] ❌ Resend API error:', {
        to: lead.email,
        auditId: lead.auditId,
        error: errorMsg,
        isDomainIssue: isDomainError,
        fromEmail,
        fullError: result.error,
      })

      return {
        success: false,
        error: errorMsg,
        isDomainIssue: isDomainError,
      }
    }

    console.info('[EMAIL] ✅ Resend API response received', {
      to: lead.email,
      auditId: lead.auditId,
      emailId: result.data?.id,
      from: fromEmail,
    })

    console.info('[EMAIL] ✅ Email sent successfully', {
      to: lead.email,
      auditId: lead.auditId,
      emailId: result.data?.id,
    })

    return { success: true }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorStack = error instanceof Error ? error.stack : undefined
    const isDomainError =
      errorMessage.includes('domain') ||
      errorMessage.includes('from address') ||
      errorMessage.includes('verified') ||
      errorMessage.toLowerCase().includes('unverified')

    console.error('[EMAIL] ❌ Email delivery failed (exception):', {
      to: lead.email,
      auditId: lead.auditId,
      error: errorMessage,
      isDomainIssue: isDomainError,
      fromEmail,
      stack: errorStack,
      errorType: error?.constructor?.name,
    })

    // Distinguish between rate limiting and other errors
    if (errorMessage.includes('429') || errorMessage.includes('rate limit')) {
      console.warn('[EMAIL] ⏱️ Rate limited by Resend, will retry later')
      return { success: false, error: 'Rate limited' }
    }

    return {
      success: false,
      error: errorMessage,
      isDomainIssue: isDomainError,
    }
  }
}
