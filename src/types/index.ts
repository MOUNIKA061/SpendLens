export type UseCase =
  | 'coding'
  | 'writing'
  | 'research'
  | 'data'
  | 'customer_support'
  | 'automation'
  | 'mixed'

export type BillingType = 'subscription' | 'api' | 'hybrid'

export type UsageFrequency = 'daily' | 'weekly' | 'occasionally'

export type ToolInput = {
  toolId: string
  plan: string
  seats: number
  monthlySpend: number
  billingType: BillingType
  useCase: UseCase
  usageFrequency: UsageFrequency
}

export type AuditInput = {
  tools: ToolInput[]
  teamSize: number
  useCase: UseCase
}

export type ToolAuditResult = {
  toolId: string
  toolName: string
  currentSpend: number
  recommendedAction: string
  monthlySavings: number
  reason: string
}

export type FullAudit = {
  id: string
  input: AuditInput
  results: ToolAuditResult[]
  totalMonthlySavings: number
  totalAnnualSavings: number
  summary: string
  createdAt: string
}

export type SpendFormDraft = {
  step: number
  selectedTools: string[]
  tools: ToolInput[]
  teamSize: number
  useCase: UseCase
}

export type ToolPlanConfig = {
  label: string
  pricePerSeat: number | null
  maxSeats: number | null
}

export type ToolDefinition = {
  name: string
  plans: Record<string, ToolPlanConfig>
}
