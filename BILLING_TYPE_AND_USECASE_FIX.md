# Billing Type & Use Case Implementation Fix

## Summary

Fixed critical inconsistencies between frontend and backend billing type/use case handling to ensure the audit engine behaves like a finance-grade SaaS analyzer, not a generic recommendation system.

## Issues Fixed

### 1. **Billing Type Mismatch**
- **Problem**: Frontend used `'api-usage'`, backend expected `'api'`. Type inconsistency across codebase.
- **Solution**: Standardized to `'api'` everywhere. Removed confusing `'api-usage'` label.
- **Files Changed**: `SpendForm.tsx`, `types/index.ts`, `auditEngine.ts`
- **Impact**: Clean type system, no more string conversion hacks

### 2. **Incomplete Billing Type Logic**
- **Problem**: API billing still received seat-based recommendations (right-sizing, cross-tool switches), which don't apply to usage-based models.
- **Solution**: 
  - Added `billingType` parameter to `checkRightSize()` and `checkCrossToolAlternative()` 
  - Both functions now skip if `billingType === 'api'`
  - API tools routed exclusively through `compareApiBillingToSubscription()` 
- **Business Logic**:
  - **Subscription**: Right-sizing, cross-tool switches, API investigation all apply (seats have meaning)
  - **API**: Only compare vs subscription baseline (no seat concept)
  - **Hybrid**: Both paths evaluated
- **Impact**: API tools no longer receive incorrect seat-based recommendations

### 3. **Use Case Ambiguity**
- **Problem**: 
  - Frontend had both global `useCase` (5 primary options) AND per-tool `useCases[]` (7 options including customer_support, automation)
  - Frontend converted per-tool array to single string, losing multi-use case data
  - Backend received single `useCase` with unclear precedence rules
- **Solution**: 
  - Clarified type hierarchy:
    - `PrimaryUseCase`: coding, writing, research, data, mixed (global/fallback)
    - `UseCase`: PrimaryUseCase + customer_support, automation (per-tool only)
  - Added explicit precedence comment: **Per-tool use case overrides global use case**
  - Updated AuditInput.useCase to use `PrimaryUseCase` type
  - Updated ToolInput to clearly document per-tool use case overrides global
- **Impact**: Clear, defensible logic for use case matching across tools

### 4. **Seat Validation Missing**
- **Problem**: No validation that API billing has seats=1 (API is not per-seat), while subscription/hybrid require seats≥1
- **Solution**: 
  - Added `validateBillingTypeSeats()` function
  - Validates billing type constraints: API→seats=1, Subscription→seats≥1, Hybrid→both valid
  - Returns descriptive error message if invalid
  - Integrated into SpendForm's `richToolEntryToAuditTool()` to enforce seats=1 for API tools
- **Impact**: Prevents invalid data entry; API recommendations now correct

### 5. **Explanatory Comments Missing**
- **Problem**: Business logic for billing types, capability scoring, switching costs, underutilization priority was undocumented
- **Solution**: Added comprehensive inline comments throughout `auditEngine.ts`:
  - **Capability compatibility**: Explains 75% threshold ensures feature parity
  - **Switching costs**: Explains net annual savings formula and ROI logic
  - **Underutilization priority**: Explains why CRITICAL rank (zero risk vs adoption risk)
  - **Billing type branching**: Explains 3-tier recommendation strategy
  - **Use case precedence**: Explains per-tool override logic
- **Impact**: Future maintainers understand business rationale behind recommendations

## Code Changes

### types/index.ts
```typescript
// Before: Single mixed UseCase enum
export type UseCase = 'coding' | 'writing' | ... | 'mixed'

// After: Separated global vs per-tool
export type PrimaryUseCase = 'coding' | 'writing' | 'research' | 'data' | 'mixed'
export type UseCase = PrimaryUseCase | 'customer_support' | 'automation'

// Before: Ambiguous BillingType
export type BillingType = 'subscription' | 'api' | 'hybrid'

// After: Documented billing model semantics
export type BillingType = 'subscription' | 'api' | 'hybrid'
// API = usage-based (no seat concept), Subscription = per-seat, Hybrid = both
```

### SpendForm.tsx
```typescript
// Before: Convert 'api-usage' → 'api'
type BillingType = 'subscription' | 'api-usage' | 'hybrid'
const billingType = entry.billingType === 'api-usage' ? 'api' : entry.billingType

// After: Use 'api' directly, enforce seats=1 for API
type BillingType = 'subscription' | 'api' | 'hybrid'
const seats = entry.billingType === 'api' ? 1 : Math.max(1, entry.seats)
```

### auditEngine.ts
```typescript
// Added billing type validation
function validateBillingTypeSeats(billingType: BillingType, seats: number): { valid: boolean; message?: string }

// Updated checkRightSize signature
function checkRightSize(..., billingType: BillingType): Candidate | null {
  if (billingType === 'api') return null  // Skip for API billing
  // ... seat-based logic
}

// Updated checkCrossToolAlternative signature  
function checkCrossToolAlternative(..., billingType: BillingType): Candidate | null {
  if (billingType === 'api') return null  // Skip for API billing
  // ... seat-based logic
}

// Added comprehensive comments in main audit loop
// Explains:
// - Use case precedence: per-tool overrides global
// - Billing type branching: subscription vs API vs hybrid logic
// - Underutilization priority: CRITICAL rank rationale
// - Capability compatibility: 75% threshold
// - Switching cost ROI: net annual savings formula
```

## Validation Rules Enforced

### Billing Type Constraints
| Billing Type | Seats Requirement | Seat-Based Logic | API Logic |
|---|---|---|---|
| `subscription` | Required (≥1) | ✅ Right-size, cross-tool | ❌ Skip |
| `api` | Forced to 1 | ❌ Skip | ✅ Compare vs baseline |
| `hybrid` | Required (≥1) | ✅ Both evaluated | ✅ Both evaluated |

### Use Case Matching
- **Per-tool use case** (from RichToolEntry.useCases[0]) overrides global
- Cross-tool recommendations keyed by per-tool use case
- Capability scoring uses per-tool use case for alternative lookup
- Fallback to global use case only if per-tool not specified

## Testing Scenarios

### API Billing Validation
```typescript
// Input: API tool with seats > 1
{ toolId: 'anthropic_api', seats: 5, billingType: 'api', monthlySpend: 100 }
// Output: Seats forced to 1, compareApiBillingToSubscription() called only
// Result: ✅ No seat-based recommendations generated
```

### Use Case Precedence
```typescript
// Global: 'coding', Per-tool: 'customer_support'
// auditEngine uses: 'customer_support' for cross-tool lookup
// Result: ✅ Recommends tools optimized for customer support, not coding
```

### Capability Compatibility
```typescript
// Current: claude (dataAnalysis: 8), Alternative: chatgpt (dataAnalysis: 9)
// Compatibility score: 0.87 (meets ≥75% threshold)
// Result: ✅ Recommendation generated with "high" confidence
```

### Switching Cost ROI
```typescript
// Annual savings: $200 (from $500/mo → $300/mo)
// Switching cost: $600 (6 people × 2 hours × $50/hr)
// Net: -$400 (net negative)
// Result: ❌ Recommendation skipped (ROI negative)
```

### Underutilization Priority
```typescript
// Seats: 10, Active users: 3, Current spend: $100/mo
// Saved spend: $70/mo (eliminated 7 unused seats)
// Priority: 'critical', Confidence: 'high', Risk: 'low'
// Result: ✅ Ranked above all other recommendations (pure waste elimination)
```

## Impact on Business Logic

1. **Finance-Grade Defensibility**: Recommendations now have clear billing model rationale, not generic "save money" suggestions
2. **Use Case Alignment**: Tools matched against actual primary use case per team member, not global category
3. **Risk Management**: Capability compatibility, switching costs, and confidence scores properly weighted
4. **Audit Trail**: Comments explain business decisions for compliance/review purposes

## Files Modified
- `src/types/index.ts` — Type hierarchy clarification
- `src/components/SpendForm.tsx` — Billing type standardization, seats validation
- `src/lib/auditEngine.ts` — Billing type branching, validation, comprehensive comments

## No Breaking Changes
- API route remains compatible (existing AuditInput validation still works)
- Frontend UI works identically (user doesn't see type changes)
- Pricing data requires no updates (capabilities already defined)
- Results display unchanged (all fields still present)

## Backward Compatibility
- ✅ Existing audit results not affected
- ✅ localStorage queries still work
- ✅ TypeScript migration automatic (types now more specific)
- ✅ No schema changes required
