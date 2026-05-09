import { FullAudit, SpendFormDraft } from '@/types'

const AUDITS_KEY = 'audits'
const DRAFT_KEY = 'spendform_draft'

export function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `audit_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}

export function saveAudit(audit: FullAudit): void {
  if (typeof window === 'undefined') return
  
  const audits = getAllAudits()
  audits[audit.id] = audit
  localStorage.setItem(AUDITS_KEY, JSON.stringify(audits))
}

export function getAudit(id: string): FullAudit | null {
  if (typeof window === 'undefined') return null
  
  const audits = getAllAudits()
  return audits[id] || null
}

export function getAllAudits(): Record<string, FullAudit> {
  if (typeof window === 'undefined') return {}

  const stored = localStorage.getItem(AUDITS_KEY)
  if (!stored) return {}

  try {
    return JSON.parse(stored) as Record<string, FullAudit>
  } catch {
    return {}
  }
}

export function saveDraft(draft: SpendFormDraft): void {
  if (typeof window === 'undefined') return

  localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
}

export function getDraft(): SpendFormDraft | null {
  if (typeof window === 'undefined') return null

  const stored = localStorage.getItem(DRAFT_KEY)
  if (!stored) return null

  try {
    return JSON.parse(stored) as SpendFormDraft
  } catch {
    return null
  }
}

export function clearDraft(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(DRAFT_KEY)
}
