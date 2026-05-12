import { NextRequest, NextResponse } from 'next/server'

import { saveAuditRecord } from '@/lib/server/persistence'
import type { FullAudit } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const audit = (await request.json()) as FullAudit
    if (!audit?.id) {
      return NextResponse.json({ error: 'Invalid audit payload' }, { status: 400 })
    }

    await saveAuditRecord(audit)
    return NextResponse.json({ ok: true, id: audit.id })
  } catch (error) {
    console.error('Persist audit error:', error)
    return NextResponse.json({ error: 'Failed to persist audit' }, { status: 500 })
  }
}
