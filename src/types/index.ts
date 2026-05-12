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
  activeUsers?: number
  utilizationPercent?: number
  avgSessionsPerWeek?: number
  monthlyPromptVolume?: number
}

export type AuditInput = {
  tools: ToolInput[]
  teamSize: number
  useCase: UseCase
}

export type RecommendationConfidence = 'high' | 'medium' | 'low'

export type RecommendationPriority = 'critical' | 'high' | 'medium' | 'low'

export type ToolAuditResult = {
  toolId: string
  toolName: string
  currentSpend: number
  recommendedAction: string
  monthlySavings: number
  reason: string
  compatibilityScore?: number
  switchingCost?: number
  netAnnualSavings?: number
  confidence?: RecommendationConfidence
  priority?: RecommendationPriority
  riskLevel?: 'low' | 'medium' | 'high'
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

export type ToolCapabilities = {
  codingDepth: number
  autocompleteQuality: number
  longContextSupport: number
  enterpriseFeatures: number
  agentEditing: number
  workflowAutomation: number
  dataAnalysisStrength: number
}

export type OnboardingFriction = 'low' | 'medium' | 'high'

export type ToolPlanConfig = {
  label: string
  pricePerSeat: number | null
  maxSeats: number | null
}

export type ToolDefinition = {
  name: string
  plans: Record<string, ToolPlanConfig>
  capabilities?: ToolCapabilities
  pricingSourceUrl?: string
  pricingVerifiedAt?: string
  onboardingFriction?: OnboardingFriction
}
