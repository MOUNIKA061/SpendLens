import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { auditTools } from './auditEngine'

describe('auditTools', () => {
  afterEach(() => {
    // restore timers if we change system time in a test
    vi.useRealTimers()
  })

  it('detects underutilization and suggests eliminating unused licenses', () => {
    const input = {
      teamSize: 10,
      useCase: 'coding',
      tools: [
        {
          toolId: 'cursor',
          plan: 'business',
          seats: 10,
          monthlySpend: 400,
          activeUsers: 4,
          billingType: 'subscription',
        },
      ],
    } as any

    const res = auditTools(input)
    expect(res.length).toBeGreaterThan(0)
    const first = res[0]
    expect(first.recommendedAction).toMatch(/Eliminate unused licenses/i)
    expect(first.monthlySavings).toBeGreaterThanOrEqual(240)
  })

  it('recommends right-sizing to a cheaper plan when available', () => {
    const input = {
      teamSize: 1,
      useCase: 'coding',
      tools: [
        {
          toolId: 'cursor',
          plan: 'business',
          seats: 1,
          monthlySpend: 40,
          billingType: 'subscription',
        },
      ],
    } as any

    const res = auditTools(input)
    expect(res.length).toBeGreaterThan(0)
    const first = res[0]
    expect(first.recommendedAction).toMatch(/Downgrade to/i)
    expect(first.monthlySavings).toBeGreaterThanOrEqual(20)
  })

  it('suggests downgrading to a free plan when usage is occasional', () => {
    const input = {
      teamSize: 1,
      useCase: 'writing',
      tools: [
        {
          toolId: 'claude',
          plan: 'pro',
          seats: 1,
          monthlySpend: 50,
          usageFrequency: 'occasionally',
          billingType: 'subscription',
        },
      ],
    } as any

    const res = auditTools(input)
    expect(res.length).toBeGreaterThan(0)
    const first = res[0]
    expect(first.recommendedAction).toMatch(/Free/i)
    expect(first.monthlySavings).toBeGreaterThanOrEqual(50)
  })

  it('for API-billed tools suggests subscription alternatives when subscription is much cheaper', () => {
    const input = {
      teamSize: 1,
      useCase: 'writing',
      tools: [
        {
          toolId: 'claude',
          plan: 'pro',
          seats: 1,
          monthlySpend: 100,
          billingType: 'api',
        },
      ],
    } as any

    const res = auditTools(input)
    expect(res.length).toBeGreaterThan(0)
    const first = res[0]
    // Should recommend considering a subscription alternative (e.g., ChatGPT Plus)
    expect(first.recommendedAction).toMatch(/Consider switching to|Consider switching/i)
    expect(first.monthlySavings).toBeGreaterThan(0)
  })

  it('flags pricing data as stale when system time is advanced', () => {
    // Move system time far into the future so verifiedAt dates are stale (>30 days)
    vi.setSystemTime(new Date('2028-01-01'))

    const input = {
      teamSize: 2,
      useCase: 'research',
      tools: [
        {
          toolId: 'chatgpt',
          plan: 'plus',
          seats: 1,
          monthlySpend: 20,
          billingType: 'subscription',
        },
      ],
    } as any

    const res = auditTools(input)
    expect(res.length).toBeGreaterThan(0)
    const first = res[0]
    expect(first.pricingWarning).toBe(true)
    expect(first.reason).toMatch(/Pricing data from/) 
  })
})
