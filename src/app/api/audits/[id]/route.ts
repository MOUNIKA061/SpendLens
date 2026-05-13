import { NextResponse } from 'next/server'

import { deleteAuditRecord, getAuditRecord } from '@/lib/server/persistence'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(_req: Request, context: RouteContext) {
  try {
    const params = await context?.params
    const id = typeof params?.id === 'string' ? params.id : ''
    const audit = await getAuditRecord(id)
    if (!audit) return NextResponse.json({ error: 'not found' }, { status: 404 })
    return NextResponse.json(audit)
  } catch (err) {
    console.error('read audit error', err)
    return NextResponse.json({ error: 'failed to read audit' }, { status: 500 })
  }
}

export async function DELETE(_req: Request, context: RouteContext) {
  try {
    const params = await context?.params
    const id = typeof params?.id === 'string' ? params.id : ''
    await deleteAuditRecord(id)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('delete audit error', err)
    return NextResponse.json({ error: 'failed to delete audit' }, { status: 500 })
  }
}
