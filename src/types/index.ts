/**
 * Primary use case for the entire team — applies when per-tool use case is not specified.
 * Guides cross-tool comparison and capability matching.
 */
export type PrimaryUseCase =
  | 'coding'
  | 'writing'
  | 'research'
  | 'data'
  | 'mixed'

/**
 * All possible use cases, including tool-specific ones.
 * Per-tool use case overrides primary use case for that tool only.
 */
export type UseCase =
  | PrimaryUseCase
  | 'customer_support'
  | 'automation'

/**
 * Billing model affects recommendation behavior:
 * - 'subscription': Fixed recurring cost per seat. Seat-based optimization applies.
 * - 'api': Usage-based, no seat concept. Cost varies monthly. Seats should be 1 for API tools.
 * - 'hybrid': Mix of subscription + API. Both seat optimization and usage analysis apply.
 */
export type BillingType = 'subscription' | 'api' | 'hybrid'

export type UsageFrequency = 'daily' | 'weekly' | 'occasionally'

export type ToolInput = {
  toolId: string
  plan: string
  monthlySpend: number
  /** Billing model: affects whether seat optimization or usage analysis applies. */
  billingType: BillingType
  /** Per-tool use case. Overrides global use case from AuditInput for cross-tool comparison. */
  useCase: UseCase
  usageFrequency: UsageFrequency
  
  // Subscription/Hybrid: seat-based metrics
  seats?: number
  activeUsers?: number
  utilizationPercent?: number
  
  // API/Hybrid: usage-based metrics (replaces seat model)
  monthlyTokens?: number      // For token-counting APIs (Claude, GPT)
  monthlyApiCalls?: number    // For call-counting APIs
  estimatedWorkloads?: number // Number of parallel/concurrent workloads
  avgRequestSize?: number     // Avg tokens/request for cost estimation
  
  // Optional intensity metrics
  avgSessionsPerWeek?: number
  monthlyPromptVolume?: number
}

export type AuditInput = {
  tools: ToolInput[]
  teamSize: number
  /** Global use case used only when tool.useCase is not specified. Per-tool use case takes precedence. */
  useCase: PrimaryUseCase
}

export type RecommendationConfidence = 'high' | 'medium' | 'low'

export type RecommendationPriority = 'critical' | 'high' | 'medium' | 'low'

export type ToolAuditResult = {
  toolId: string
  toolName: string
  currentSpend: number
  recommendedAction: string
  monthlySavings: number
  savingsPercent?: number  // Relative savings: savings / currentSpend
  reason: string
  pricingWarning?: boolean // True if pricing data is >30 days old
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
  totalSavingsPercent?: number // Relative to current total spend
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
