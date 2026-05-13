# ECONOMICS.md — SpendLens Unit Economics

All numbers below are estimates with explicit reasoning. Where I don't have
real data, I say so and use conservative benchmarks from comparable B2B SaaS
tools. Rough inputs are better than no inputs.

---

## What Is a Converted Lead Worth to Credex?

SpendLens surfaces founders who are actively overspending on AI tools. A
"converted lead" means a founder who books a Credex consultation and
purchases discounted AI credits through Credex.

**Reasoning the LTV:**

Assume the average SpendLens user who triggers the Credex callout (savings
> $500/month) is spending ~$800/month on AI tools. The audit identifies
~$300/month in potential savings. Credex offers a 15% discount on AI credits
via procurement — so on $800/month of spend, Credex can save the founder
$120/month.

If Credex takes a margin of ~20% on credits purchased through them:

```
Monthly AI spend per customer:        $800
Credex margin (20%):                  $160/month
Annual revenue per customer:          $160 × 12 = $1,920/year
Assumed churn (annual):               25% (conservative for cost-saving tools)
LTV = $1,920 / 0.25 =                 $7,680
```

That is a conservative LTV. If the founder's team grows and AI spend increases
to $2,000/month over 18 months (common for scaling startups), LTV compounds
significantly. Using $7,680 as the floor.

---

## CAC at Each Channel

**Channel 1 — Hacker News Show HN (Organic)**

```
Cost:                   $0 (time only — ~3 hours to write and monitor)
Estimated visits:       400 from a mid-tier Show HN
Audit completion rate:  12% (form has 4 steps, typical drop-off)
Audits completed:       48
Email capture rate:     85% of completions (email required for report)
Leads generated:        41
Credex callout shown:   ~30% of leads have savings > $500 → 12 leads
Consultation booked:    15% of those → 2 consultations
Credit purchase:        50% of consultations → 1 customer

CAC = $0 / 1 customer = $0 cash, ~$300 in time cost (3 hrs × $100/hr)
```

**Channel 2 — Reddit (r/SaaS, r/startups)**

```
Cost:                   $0 (time: ~2 hours per post including replies)
Estimated visits:       200 per post (conservative for data-led post)
Audit completion rate:  10% (Reddit traffic is more casual than HN)
Audits completed:       20 per post
Leads (email):          17
Credex-eligible leads:  5
Consultations booked:   1 per 2 posts
Credit purchases:       1 per 4 posts

Time cost per customer: 8 hours × $100/hr = $800 time-CAC
Cash CAC:               $0
```

**Channel 3 — Credex Warm Network Email**

```
Cost:                   $0 (sent by Credex to existing portfolio/network)
List size:              200 founders (conservative estimate)
Open rate:              45% (warm list, founder-to-founder trust)
Click-through rate:     30% of openers → 27 visitors
Audit completion rate:  35% (high-intent, warm traffic)
Audits completed:       9
Credex-eligible:        5 (warm leads likely higher-spend founders)
Consultations booked:   40% → 2
Credit purchases:       60% of consultations → 1–2 customers

CAC: ~$0 cash. This is the most efficient channel by a large margin.
```

**Channel 4 — X (Twitter) Reply Strategy**

```
Cost:                   $0 cash, ~1 hour/day monitoring pricing tweets
Estimated clicks/week:  50–100 (replies under high-impression threads)
Audit completion rate:  8% (cold social traffic, lowest intent)
Audits completed:       4–8/week
Credex-eligible:        1–2/week
Consultations booked:   1 per 2–3 weeks
Credit purchases:       1 per month

Time-CAC: ~20 hours × $100/hr = $2,000
Cash CAC: $0
Best used for brand awareness, not primary conversion channel.
```

---

## The Conversion Funnel

```
Stage                           Rate        Running total (per 1,000 visitors)
─────────────────────────────────────────────────────────────────────────────
Visitors                        100%        1,000
Audit started                    25%          250
Audit completed                  12%          120
Email captured                   85%          102
Savings > $500 (Credex shown)    30%           31
Credex CTA clicked               20%            6
Consultation booked              40%            2.4
Credit purchase                  50%            1.2

Visitor → Customer:              0.12%
Audit completed → Customer:      1.0%
```

**What conversion rate makes this profitable?**

At LTV of $7,680 and cash CAC of $0 (organic channels only):

Any positive conversion is profitable on a cash basis. The question is
whether the time investment is worth it.

At 5 hours/week of founder time ($100/hr assumed opportunity cost):

```
Time cost per month:    ~$2,000
Customers needed to break even on time: $2,000 / $7,680 LTV = 0.26 customers/month
= 1 customer every 4 months minimum to justify time spent
```

At the funnel rates above, 1,000 visitors/month → 1.2 customers/month.
That is already above break-even. The tool pays for itself at ~850 monthly
visitors if all other assumptions hold.

---

## What Would Have to Be True for $1M ARR in 18 Months

$1M ARR at $1,920 revenue per customer per year = **521 active customers.**

That means acquiring 521 customers in 18 months, net of churn, or roughly
**29 new customers per month** from month 1 (assumes linear ramp; a realistic
S-curve would mean ~10/month early, ~50/month by month 18).

**Working backwards:**

```
Target: 29 new customers/month (steady state, month 9+)
Conversion: visitor → customer = 0.12%
Monthly visitors needed: 29 / 0.0012 = 24,167 visitors/month
```

Is 24k visitors/month achievable in 18 months with $0 paid budget?

```
Channel breakdown (month 9+ target):
─────────────────────────────────────────────────
Hacker News (2 posts/month, avg 400 visits):    800/month
Reddit (4 posts/month, avg 300 visits):       1,200/month
X reply strategy (daily, 100 clicks/day):     3,000/month
Credex network (ongoing warm outreach):         500/month
SEO / organic search (cumulative):            2,500/month
Referral (audited users sharing results):     1,500/month
─────────────────────────────────────────────────
Total:                                        9,500/month
```

At 9,500 visitors/month, the model produces ~11 customers/month — enough for
~$211K ARR at month 18, not $1M.

**To hit $1M ARR, at least one of the following would have to be true:**

1. **Credex closes the loop faster.** If Credex sales converts warm SpendLens
   leads at 30% instead of 10% (feasible for a warm inbound tool), the
   customer rate triples without more traffic. That alone gets to ~$600K ARR.

2. **Average revenue per customer is higher.** If the average Credex customer
   spends $3,000/month on AI tools (larger seed-stage teams) instead of $800,
   LTV climbs to ~$28,800 and the math works at far fewer customers — 35
   customers would hit $1M ARR.

3. **Paid distribution is added.** $5,000/month in LinkedIn ads targeted to
   "Co-Founder" + "SaaS" + company size 1–10 at a $3 CPC = ~1,667 additional
   clicks/month. At 0.12% conversion = 2 additional customers/month. Small
   but additive.

4. **The tool goes viral once.** One tweet from a founder with 50k+ followers
   sharing their audit result — "SpendLens found I was paying for 3 tools that
   do the same thing, saving $400/month" — could drive 5,000–15,000 visits in
   48 hours. One viral moment at month 3 resets the growth curve.

**Realistic 18-month ARR with organic only and current assumptions: $180K–$300K.**
To reach $1M, Credex needs to either bring paid distribution or use the tool
as a top-of-funnel lead qualifier inside an existing sales motion where the
closing rate is already high.

---

## Summary Table

```
Metric                              Conservative    Optimistic
──────────────────────────────────────────────────────────────
LTV per customer                    $7,680          $28,800
Cash CAC (organic)                  $0              $0
Time-CAC (organic)                  $800            $300
Visitor → customer rate             0.12%           0.35%
Monthly visitors needed ($1M ARR)   24,167          8,056
Realistic month-18 ARR              $180K           $650K
Customers needed for $1M ARR        521             35
```

The tool is economically sound as a lead-generation surface for Credex.
It is not, by itself, a $1M ARR product on organic channels alone —
but as a conversion tool inside an existing Credex sales motion, the
unit economics are strong at any positive closing rate.