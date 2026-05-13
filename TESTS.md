# TESTS.md

This project uses Vitest for the audit engine. The test suite is focused on the recommendation logic because that is the core product value and the most important part to keep deterministic.

## Automated Tests

### `src/lib/auditEngine.test.ts`

This file contains 5 automated tests covering the audit engine:

1. Detects underutilization and suggests eliminating unused licenses.
2. Recommends right-sizing to a cheaper same-vendor plan.
3. Suggests downgrading to a free plan when usage is occasional.
4. Recommends subscription alternatives when API spend is much higher than the flat plan.
5. Flags stale pricing data when the pricing verification date is old.

## How to Run

```bash
npm test
```

To run only the audit engine test file:

```bash
npx vitest src/lib/auditEngine.test.ts
```

## Why These Tests Matter

The audit engine is a rules-based system, so these tests protect the core behavior from regressions. They verify that the app keeps making financially defensible recommendations instead of drifting toward vague or incorrect savings advice.
