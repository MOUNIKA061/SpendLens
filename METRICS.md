# METRICS.md

# SpendLens Metrics Strategy

SpendLens is not a daily-use SaaS product. It is a high-intent lead-generation tool that people use when they are already thinking about AI spend. Because of that, the right metrics are about conversion quality, not engagement volume. A high session count is less important than whether the audit produced a believable recommendation, captured a lead, and surfaced a consultation-worthy opportunity for Credex.

---

# North Star Metric

## Qualified Audit Completion Rate

### Definition

The percentage of completed audits that:

- Generate meaningful savings opportunities
- Capture contact information
- Result in a high-intent lead for Credex

Formula:

```text
Qualified Audit Completions / Total Audit Starts
```

This is the best single North Star metric because it captures the full value chain of the product: a user must complete the audit, see an outcome worth acting on, and leave contact details so Credex can follow up. If this metric rises, the product is becoming more useful and more commercially effective at the same time.

## Input Metrics

1. Audit start rate: the percentage of landing page visitors who begin the spend form. This tells me whether the messaging and hero section are convincing enough to earn attention.
2. Form completion rate: the percentage of people who finish the tool-input flow after starting it. This shows whether the audit form is too long, confusing, or intimidating.
3. Lead capture rate after results: the percentage of completed audits that submit an email or consultation request. This measures whether the results page creates enough trust and urgency to convert.

## What I Would Instrument First

I would track the audit funnel at four steps: landing page visit, form start, audit completion, and lead submission. I would also instrument the size of the recommended savings, the type of recommendation shown, and whether the user sees a Credex consultation callout. Those events would help separate product-quality problems from funnel-design problems.

## Pivot Threshold

If fewer than 10% of completed audits produce a qualified lead after a reasonable traffic sample, I would consider a pivot. That would suggest the value proposition is not strong enough or the audit output is not trusted enough to support the Credex sales motion. If audits convert but do not create Credex-intent leads, the product may still be useful, but it would need a different monetization strategy.

The goal is not to maximize raw usage. The goal is to create a tool that reliably turns high-intent visitors into qualified, credible business opportunities.
