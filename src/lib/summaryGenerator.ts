import type { FullAudit } from '@/types'

import { generateAuditSummary } from '@/lib/server/aiSummary'

export async function generateSummary(audit: FullAudit): Promise<string> {
  return generateAuditSummary(audit)
}
