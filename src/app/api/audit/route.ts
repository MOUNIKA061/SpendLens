import { NextRequest, NextResponse } from 'next/server'
import { auditTools } from '@/lib/auditEngine'
import { generateSummary } from '@/lib/summaryGenerator'
import { generateId } from '@/lib/storage'
import { AuditInput, FullAudit } from '@/types'

const VALID_USE_CASES: AuditInput['useCase'][] = ['coding', 'writing', 'data', 'research', 'mixed']

function isAuditInput(value: unknown): value is AuditInput {
  if (!value || typeof value !== 'object') return false

  const candidate = value as AuditInput
  if (!Array.isArray(candidate.tools) || typeof candidate.teamSize !== 'number' || !VALID_USE_CASES.includes(candidate.useCase)) {
    return false
  }

  return candidate.tools.every(tool => {
    return (
      tool &&
      typeof tool.toolId === 'string' &&
      typeof tool.plan === 'string' &&
      // seats is optional for API billing
      (tool.seats === undefined || typeof tool.seats === 'number') &&
      typeof tool.monthlySpend === 'number'
    )
  })
}

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as unknown

    if (!isAuditInput(payload)) {
      return NextResponse.json({ error: 'Invalid audit input' }, { status: 400 })
    }

    const input: AuditInput = payload
    const results = auditTools(input)
    const totalMonthlySavings = results.reduce((sum, r) => sum + r.monthlySavings, 0)
    const totalAnnualSavings = totalMonthlySavings * 12
    
    // Calculate total current spend for relative savings
    const totalCurrentSpend = input.tools.reduce((sum, t) => sum + t.monthlySpend, 0)
    const totalSavingsPercent = totalCurrentSpend > 0 ? (totalMonthlySavings / totalCurrentSpend) * 100 : 0

    const id = generateId()

    const audit: FullAudit = {
      id,
      input,
      results,
      totalMonthlySavings,
      totalAnnualSavings,
      totalSavingsPercent,
      summary: '',
      createdAt: new Date().toISOString(),
    }

    audit.summary = await generateSummary(audit)

    return NextResponse.json(audit)
  } catch (error) {
    console.error('Audit error:', error)
    return NextResponse.json({ error: 'Failed to create audit' }, { status: 500 })
  }
}
