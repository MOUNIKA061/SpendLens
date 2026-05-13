import fs from 'node:fs/promises'
import path from 'node:path'

import { createClient, SupabaseClient } from '@supabase/supabase-js'

import type { FullAudit } from '@/types'

type LeadRecord = {
  email: string
  companyName?: string
  role?: string
  teamSize?: number
  auditId?: string
  source?: string
  honeypot?: string
  createdAt?: string
}

const AUDITS_PATH = path.join(process.cwd(), 'data', 'audits.json')
const LEADS_PATH = path.join(process.cwd(), 'data', 'leads.json')
const isProductionRuntime = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production'

let supabaseClient: SupabaseClient | null = null
let supabaseInitialized = false
let supabaseError: string | null = null

function getSupabaseClient(): SupabaseClient | null {
  if (supabaseInitialized) return supabaseClient

  supabaseInitialized = true
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY

  if (!url || !key) {
    supabaseError = 'SUPABASE_URL or SUPABASE_*_KEY not configured'
    if (isProductionRuntime) {
      console.error('[PERSISTENCE] Supabase not configured in production', {
        urlConfigured: Boolean(url),
        keyConfigured: Boolean(key),
      })
    } else {
      console.warn('[PERSISTENCE] Supabase not configured, using JSON fallback')
    }
    return null
  }

  try {
    supabaseClient = createClient(url, key)
    console.info('[PERSISTENCE] Supabase client initialized')
    return supabaseClient
  } catch (error) {
    supabaseError = error instanceof Error ? error.message : String(error)
    console.error('[PERSISTENCE] Failed to initialize Supabase:', supabaseError)
    return null
  }
}

async function ensureDataDir(): Promise<void> {
  try {
    await fs.mkdir(path.dirname(AUDITS_PATH), { recursive: true })
  } catch (error) {
    console.warn(
      '[PERSISTENCE] Failed to create data directory:',
      error instanceof Error ? error.message : String(error),
    )
  }
}

async function readJsonFile<T>(filePath: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(filePath, 'utf8')
    return JSON.parse(raw || JSON.stringify(fallback)) as T
  } catch (error) {
    console.debug('[PERSISTENCE] JSON read fallback:', {
      file: filePath,
      error: error instanceof Error ? error.message : String(error),
    })
    return fallback
  }
}

async function writeJsonFile(filePath: string, value: unknown): Promise<void> {
  try {
    await ensureDataDir()
    await fs.writeFile(filePath, JSON.stringify(value, null, 2), 'utf8')
  } catch (error) {
    console.error('[PERSISTENCE] Failed to write JSON file:', {
      file: filePath,
      error: error instanceof Error ? error.message : String(error),
    })
    throw error
  }
}

export async function saveAuditRecord(audit: FullAudit): Promise<void> {
  const supabase = getSupabaseClient()

  if (supabase) {
    try {
      // Save full audit to private audits table
      const { error: auditError } = await supabase.from('audits').upsert(
        {
          id: audit.id,
          input: audit.input,
          results: audit.results,
          total_monthly_savings: audit.totalMonthlySavings,
          total_annual_savings: audit.totalAnnualSavings,
          total_savings_percent: audit.totalSavingsPercent,
          summary: audit.summary,
          created_at: audit.createdAt,
        },
        { onConflict: 'id' },
      )

      if (auditError) {
        console.error('[PERSISTENCE] Supabase audit insert failed:', {
          auditId: audit.id,
          error: auditError.message,
        })
        throw auditError
      }

      // Save public snapshot to public_audits table
      const publicSnapshot = {
        id: audit.id,
        results: audit.results,
        total_monthly_savings: audit.totalMonthlySavings,
        total_annual_savings: audit.totalAnnualSavings,
        total_savings_percent: audit.totalSavingsPercent,
        summary: audit.summary,
        created_at: audit.createdAt,
      }

      const { error: publicError } = await supabase
        .from('public_audits')
        .upsert(publicSnapshot, { onConflict: 'id' })

      if (publicError) {
        console.error('[PERSISTENCE] Supabase public audit insert failed:', {
          auditId: audit.id,
          error: publicError.message,
        })
        throw publicError
      }

      console.info('[PERSISTENCE] Audit saved to Supabase', { auditId: audit.id })
      return
    } catch (error) {
      console.warn('[PERSISTENCE] Supabase save failed, falling back to JSON', {
        auditId: audit.id,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  if (isProductionRuntime) {
    console.error('[PERSISTENCE] JSON fallback disabled in production', {
      auditId: audit.id,
      reason: supabaseError ?? 'Supabase unavailable',
    })
    throw new Error(`Supabase persistence is not configured: ${supabaseError ?? 'unknown error'}`)
  }

  // JSON fallback
  try {
    const audits = await readJsonFile<Record<string, FullAudit>>(AUDITS_PATH, {})
    audits[audit.id] = audit
    await writeJsonFile(AUDITS_PATH, audits)
    console.info('[PERSISTENCE] Audit saved to JSON file', { auditId: audit.id })
  } catch (error) {
    console.error('[PERSISTENCE] JSON fallback also failed', {
      auditId: audit.id,
      error: error instanceof Error ? error.message : String(error),
    })
    throw new Error('Failed to persist audit to Supabase and JSON')
  }
}

export async function getAuditRecord(id: string): Promise<FullAudit | null> {
  const supabase = getSupabaseClient()

  if (supabase) {
    try {
      const { data, error } = await supabase.from('audits').select('*').eq('id', id).maybeSingle()

      if (error) {
        console.error('[PERSISTENCE] Supabase audit fetch failed:', {
          auditId: id,
          error: error.message,
        })
        throw error
      }

      if (data) {
        console.debug('[PERSISTENCE] Audit retrieved from Supabase', { auditId: id })
        // Map database column names to type names
        return {
          id: data.id,
          input: data.input,
          results: data.results,
          totalMonthlySavings: data.total_monthly_savings,
          totalAnnualSavings: data.total_annual_savings,
          totalSavingsPercent: data.total_savings_percent,
          summary: data.summary,
          createdAt: data.created_at,
        } as FullAudit
      }
    } catch (error) {
      console.warn('[PERSISTENCE] Supabase fetch failed, trying JSON fallback', {
        auditId: id,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  if (isProductionRuntime) {
    console.error('[PERSISTENCE] JSON fallback disabled in production for fetch', {
      auditId: id,
      reason: supabaseError ?? 'Supabase unavailable',
    })
    return null
  }

  // JSON fallback
  try {
    const audits = await readJsonFile<Record<string, FullAudit>>(AUDITS_PATH, {})
    const audit = audits[id] ?? null
    if (audit) {
      console.debug('[PERSISTENCE] Audit retrieved from JSON', { auditId: id })
    }
    return audit
  } catch (error) {
    console.error('[PERSISTENCE] JSON fallback also failed', {
      auditId: id,
      error: error instanceof Error ? error.message : String(error),
    })
    return null
  }
}

export async function saveLeadRecord(lead: LeadRecord): Promise<void> {
  const supabase = getSupabaseClient()

  if (supabase) {
    try {
      const { error } = await supabase.from('leads').insert({
        email: lead.email,
        company_name: lead.companyName,
        role: lead.role,
        team_size: lead.teamSize,
        audit_id: lead.auditId,
        source: lead.source,
        honeypot: lead.honeypot,
        created_at: lead.createdAt ?? new Date().toISOString(),
      })

      if (error) {
        console.error('[PERSISTENCE] Supabase lead insert failed:', {
          email: lead.email,
          error: error.message,
        })
        throw error
      }

      console.info('[PERSISTENCE] Lead saved to Supabase', {
        email: lead.email,
        auditId: lead.auditId,
      })
      return
    } catch (error) {
      console.warn('[PERSISTENCE] Supabase lead save failed, falling back to JSON', {
        email: lead.email,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  if (isProductionRuntime) {
    console.error('[PERSISTENCE] JSON fallback disabled in production for lead save', {
      email: lead.email,
      reason: supabaseError ?? 'Supabase unavailable',
    })
    throw new Error(`Supabase persistence is not configured: ${supabaseError ?? 'unknown error'}`)
  }

  // JSON fallback
  try {
    const leads = await readJsonFile<LeadRecord[]>(LEADS_PATH, [])
    leads.push({ ...lead, createdAt: lead.createdAt ?? new Date().toISOString() })
    await writeJsonFile(LEADS_PATH, leads)
    console.info('[PERSISTENCE] Lead saved to JSON file', { email: lead.email })
  } catch (error) {
    console.error('[PERSISTENCE] JSON fallback also failed', {
      email: lead.email,
      error: error instanceof Error ? error.message : String(error),
    })
    throw new Error('Failed to persist lead to Supabase and JSON')
  }
}

export async function deleteAuditRecord(id: string): Promise<void> {
  const supabase = getSupabaseClient()

  if (supabase) {
    try {
      const { error } = await supabase.from('audits').delete().eq('id', id)
      if (error) throw error

      const { error: publicError } = await supabase.from('public_audits').delete().eq('id', id)
      if (publicError) throw publicError

      console.info('[PERSISTENCE] Audit deleted from Supabase', { auditId: id })
      return
    } catch (error) {
      console.warn('[PERSISTENCE] Supabase delete failed, trying JSON fallback', {
        auditId: id,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  if (isProductionRuntime) {
    console.error('[PERSISTENCE] JSON fallback disabled in production for delete', {
      auditId: id,
      reason: supabaseError ?? 'Supabase unavailable',
    })
    throw new Error(`Supabase persistence is not configured: ${supabaseError ?? 'unknown error'}`)
  }

  // JSON fallback
  try {
    const audits = await readJsonFile<Record<string, FullAudit>>(AUDITS_PATH, {})
    delete audits[id]
    await writeJsonFile(AUDITS_PATH, audits)
    console.info('[PERSISTENCE] Audit deleted from JSON', { auditId: id })
  } catch (error) {
    console.error('[PERSISTENCE] JSON fallback delete also failed', {
      auditId: id,
      error: error instanceof Error ? error.message : String(error),
    })
    throw new Error('Failed to delete audit from Supabase and JSON')
  }
}
