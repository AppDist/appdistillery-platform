# Task Templates

This file provides complete task templates for different work types. Each template includes all optional sections that may be relevant. Remove sections not applicable to your specific task.

## Template Selection Guide

| Task Type | Use When | Template |
|-----------|----------|----------|
| Feature | Implementing new functionality | [Feature Task](#feature-task-template) |
| Bug Fix | Fixing defects or errors | [Bug Fix](#bug-fix-task-template) |
| Refactoring | Improving code without changing behavior | [Refactoring](#refactoring-task-template) |
| Technical Debt | Addressing accumulated technical issues | [Technical Debt](#technical-debt-task-template) |
| Migration | Upgrading dependencies or moving systems | [Migration](#migration-task-template) |
| Performance | Optimizing speed or resource usage | [Performance](#performance-task-template) |
| Documentation | Creating or updating documentation | [Documentation](#documentation-task-template) |
| Research | Time-boxed investigation | [Research Spike](#research-spike-template) |

---

## Feature Task Template

```markdown
## Task: [Verb] [Feature] [Context]

**ID:** TASK-XXX
**Priority:** [P0-Critical | P1-High | P2-Medium | P3-Low]
**Complexity:** [X units]
**Module/Area:** [component-name]
**Status:** TODO
**Created:** YYYY-MM-DD
**Target:** YYYY-MM-DD (optional)

### User Story
As a [user type]
I want [goal/desire]
So that [benefit/value]

**Business Context:** [Link to PRD/spec OR brief description]

### Acceptance Criteria

**Scenario 1: [Primary happy path]**
```
Given [initial context]
When [user action]
Then [expected outcome]
And [additional outcome]
```

**Scenario 2: [Alternative flow]**
```
Given [different context]
When [user action]
Then [expected outcome]
```

**Scenario 3: [Error handling]**
```
Given [error condition]
When [trigger]
Then [appropriate error handling]
And [user receives clear feedback]
```

**Additional Requirements:**
- [ ] [Specific measurable criterion]
- [ ] [Performance requirement]
- [ ] [Security requirement]
- [ ] [Accessibility requirement]

### Technical Approach

**High-level strategy:**
[2-3 sentence overview of implementation approach]

**Key decisions:**
- [Decision 1 with rationale]
- [Decision 2 with rationale]

**Affected Components:**
- `module-a/component-x` - [Changes needed]
- `module-b/component-y` - [Integration point]

**Data Model Changes:**
[If applicable: new tables, fields, relationships]

**API Contract:** (if applicable)

**Request:**
```typescript
interface FeatureRequest {
  field1: string;
  field2: number;
  // ...
}
```

**Response:**
```typescript
interface FeatureResponse {
  result: ResultType;
  metadata: MetadataType;
}
```

### Dependencies

- **Blocks:** [TASK-XXX - Brief description]
- **Blocked by:** [TASK-XXX - Brief description]
- **Related:** [TASK-XXX - Brief description]

### Test Coverage

**Unit Tests:**
1. Test [component] handles [scenario 1]
2. Test [component] validates [input constraints]
3. Test [component] handles [error case]

**Integration Tests:**
1. Test end-to-end flow from [entry point] to [exit point]
2. Test integration with [external system]

**Edge Cases:**
1. Test behavior when [edge condition]
2. Test concurrent access scenario
3. Test with maximum/minimum values

### Complexity Breakdown

- Implementation: X units
- Testing: X units
- Code Review: X units
- Documentation: X units
**Total:** X units

### Approval Gates

- [ ] Security review required (before production)
- [ ] Performance testing required (load test with X concurrent users)
- [ ] Accessibility audit required
- [ ] Privacy review required

### Rollback Plan

**If issues arise in production:**
1. [Step to safely revert]
2. [How to restore previous state]
3. [Data recovery procedure if applicable]

**Feature flag:** `enable_feature_x` (default: false)

### Definition of Done

- [ ] Code complete and passes linting
- [ ] All unit tests written and passing (>80% coverage)
- [ ] Integration tests passing
- [ ] Code reviewed and approved
- [ ] Documentation updated (API docs, user guides)
- [ ] Deployed to staging and verified
- [ ] Acceptance criteria verified by [role]
- [ ] Performance benchmarks met
- [ ] Security checklist completed

### Notes

[Additional context, decisions made during implementation, gotchas discovered]
```

### Feature Task Example: Payment Processing Integration

```markdown
## Task: Implement Stripe Payment Processing Integration

**ID:** TASK-042
**Priority:** P0-Critical
**Complexity:** 25 units
**Module/Area:** payment
**Status:** IN_PROGRESS
**Created:** 2025-01-15
**Target:** 2025-01-22

### User Story
As a customer
I want to pay for my order using credit card
So that I can complete my purchase securely

**Business Context:** Part of Q1 revenue enablement initiative. Required for launch. See PRD Section 3.2 "Payment Processing".

### Acceptance Criteria

**Scenario 1: Successful payment**
```
Given a customer with valid credit card
When they submit payment for order
Then payment is processed through Stripe
And order status updates to "paid"
And customer receives email confirmation
And ledger event "payment.completed" is recorded
```

**Scenario 2: Payment fails**
```
Given a payment attempt that fails (insufficient funds, invalid card)
When Stripe returns error
Then user sees clear error message
And order status remains "pending_payment"
And ledger event "payment.failed" is recorded with reason
And support team is notified if multiple failures
```

**Scenario 3: Payment timeout**
```
Given a payment request that takes >30 seconds
When timeout occurs
Then user sees "processing" status
And payment is queued for verification
And webhook handler will update status when Stripe responds
```

**Additional Requirements:**
- [ ] PCI compliance maintained (no card data stored)
- [ ] Idempotency keys prevent duplicate charges
- [ ] Payment attempts retry with exponential backoff (max 3 attempts)
- [ ] All payment data logged for audit (excluding sensitive card data)
- [ ] Response time <2 seconds for payment initiation

### Technical Approach

**High-level strategy:**
Use Stripe Checkout for frontend, Stripe Payment Intents API for backend processing, webhook handler for async status updates. All payment logic in dedicated payment service module.

**Key decisions:**
- Use Payment Intents (not legacy Charges API) for SCA compliance
- Implement webhook handler for async updates to handle slow payment processing
- Store idempotency keys in Redis with 24-hour TTL
- Use feature flag to enable/disable Stripe (fallback to manual processing)

**Affected Components:**
- `src/payment/stripe-client.ts` - New Stripe API wrapper
- `src/payment/payment-service.ts` - Payment orchestration logic  
- `src/webhooks/stripe-handler.ts` - Async payment status updates
- `src/database/schema/payments.sql` - New payments table
- `src/frontend/checkout/payment-form.tsx` - UI integration

**Data Model Changes:**
```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY,
  order_id UUID REFERENCES orders(id),
  stripe_payment_intent_id VARCHAR(255) UNIQUE,
  amount_cents INTEGER NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  status VARCHAR(50), -- pending, processing, succeeded, failed
  failure_reason TEXT,
  idempotency_key VARCHAR(255) UNIQUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**API Contract:**

**Request:**
```typescript
interface CreatePaymentRequest {
  orderId: string;
  amount: number; // cents
  currency?: string; // default USD
  paymentMethodId: string; // from Stripe frontend
  idempotencyKey: string; // client-generated UUID
}
```

**Response:**
```typescript
interface CreatePaymentResponse {
  paymentId: string;
  status: 'succeeded' | 'processing' | 'requires_action';
  clientSecret?: string; // for 3DS authentication
}
```

### Dependencies

- **Blocks:** TASK-043 (Email receipts), TASK-044 (Order fulfillment)
- **Blocked by:** None
- **Related:** TASK-041 (Cart checkout flow)

### Test Coverage

**Unit Tests:**
1. Test Stripe client handles successful payment
2. Test Stripe client handles payment failures gracefully
3. Test idempotency key prevents duplicate charges
4. Test payment service validates amount and currency
5. Test retry logic with exponential backoff

**Integration Tests:**
1. Test end-to-end payment flow (cart → checkout → payment → confirmation)
2. Test webhook handler updates payment status correctly
3. Test 3DS authentication flow
4. Test payment failure handling and user notification

**Edge Cases:**
1. Test concurrent payment attempts for same order
2. Test webhook arrives before API response
3. Test payment with minimum ($0.50) and maximum amounts
4. Test behavior during Stripe API outage

### Complexity Breakdown

- Implementation: 15 units (Stripe integration, webhook handler, DB schema)
- Testing: 6 units (unit + integration tests)
- Code Review: 2 units
- Documentation: 2 units
**Total:** 25 units

### Approval Gates

- [ ] Security review required (PCI compliance verification)
- [ ] Load testing required (100 concurrent payments)
- [ ] Finance team approval for transaction fee structure

### Rollback Plan

**If issues arise in production:**
1. Disable feature flag `enable_stripe_payments` (reverts to manual processing)
2. Existing "processing" payments will be handled by webhook backlog
3. No data loss - all attempts logged in payments table
4. Switch Stripe API keys to test mode if needed

**Feature flag:** `enable_stripe_payments` (default: false in prod until approved)

### Definition of Done

- [ ] Code complete and passes linting
- [ ] All unit tests written and passing (>85% coverage)
- [ ] Integration tests passing (including webhook scenarios)
- [ ] Code reviewed and approved by payment team lead
- [ ] API documentation updated
- [ ] Stripe test mode verified with all card scenarios
- [ ] Deployed to staging and verified with test transactions
- [ ] Acceptance criteria verified by product owner
- [ ] Load test completed (100 concurrent users)
- [ ] Security checklist completed and PCI compliance verified
- [ ] Runbook created for payment failures

### Notes

- Stripe test mode uses test API keys (sk_test_...)
- Test cards: 4242424242424242 (success), 4000000000000002 (decline)
- Webhook secret stored in environment variable STRIPE_WEBHOOK_SECRET
- Payment intents auto-expire after 24 hours if not completed
```

---

## Bug Fix Task Template

```markdown
## Task: Fix [Problem] in [Component]

**ID:** TASK-XXX
**Priority:** [P0-Critical | P1-High | P2-Medium | P3-Low]
**Complexity:** [X units]
**Module/Area:** [component-name]
**Status:** TODO
**Severity:** [Critical | High | Medium | Low]
**Reported:** YYYY-MM-DD
**Reporter:** [Name/System]

### Bug Description

**Symptoms:**
[What users are experiencing - be specific]

**Expected Behavior:**
[What should happen]

**Actual Behavior:**
[What actually happens]

**Impact:**
- Users affected: [Number/percentage]
- Business impact: [Revenue loss, reputation, etc.]
- Frequency: [Always | Intermittent | Rare]

**Reproduction Steps:**
1. [Step 1]
2. [Step 2]
3. [Observe issue]

**Environment:**
- Platform: [Browser/OS/Device]
- Version: [Software version]
- Configuration: [Relevant settings]

**Error Logs:** (if applicable)
```
[Paste relevant error messages or stack traces]
```

### Root Cause Analysis

**Investigation findings:**
[What's causing the issue - be specific about the code/logic]

**Why it wasn't caught:**
[Testing gap, edge case, regression]

### Proposed Fix

**Approach:**
[How to fix the issue - high level]

**Code changes needed:**
- `file/path.ts` line XX - [Specific change]
- `file/path.ts` line YY - [Specific change]

**Alternative approaches considered:**
- [Option 1] - Rejected because [reason]
- [Option 2] - Rejected because [reason]

### Acceptance Criteria

- [ ] Bug no longer reproduces with original reproduction steps
- [ ] Fix handles [edge case 1]
- [ ] Fix handles [edge case 2]
- [ ] No regression in [related functionality]
- [ ] Error handling improved to prevent similar issues
- [ ] Logging added to aid future debugging

### Test Coverage

**Regression Tests:**
1. Test original reproduction steps no longer fail
2. Test [related workflow] still works correctly

**New Tests:**
1. Test fix handles [edge case discovered]
2. Test fix handles [error condition]

**Manual Verification:**
1. Verify on [platform 1]
2. Verify on [platform 2]

### Dependencies

- **Blocks:** [TASK-XXX if blocking other work]
- **Blocked by:** [TASK-XXX if needs infrastructure]
- **Related:** [Similar bugs or related work]

### Rollback Plan

**If fix causes new issues:**
1. Revert commit [commit-sha]
2. [Hotfix alternative if revert not possible]

### Definition of Done

- [ ] Bug fixed and verified
- [ ] Regression tests added
- [ ] Code reviewed
- [ ] Verified on all affected platforms
- [ ] Deployed to production
- [ ] Monitoring confirms fix (no errors in logs)
- [ ] Reporter/affected users notified

### Notes

[Additional context about the bug, related issues, etc.]
```

---

## Refactoring Task Template

```markdown
## Task: Refactor [Component] to [Improvement]

**ID:** TASK-XXX
**Priority:** [P1-High | P2-Medium | P3-Low]
**Complexity:** [X units]
**Module/Area:** [component-name]
**Status:** TODO
**Type:** [Code Quality | Architecture | Performance | Maintainability]

### Motivation

**Current problems:**
- [Problem 1 with current implementation]
- [Problem 2 with current implementation]

**Benefits of refactoring:**
- [Benefit 1 - be specific and measurable]
- [Benefit 2 - be specific and measurable]

**Trigger:** [What prompted this refactoring?]
- [ ] Code smell detected during review
- [ ] Preparing for new feature
- [ ] Performance bottleneck identified
- [ ] Technical debt reduction initiative

### Scope

**In scope:**
- [Component/module to refactor]
- [Specific aspects being changed]

**Out of scope:**
- [Related areas NOT being changed]
- [Future improvements to consider separately]

**Behavior changes:**
- [ ] No behavior changes (pure refactor)
- [ ] Minor behavior changes: [List changes]

### Acceptance Criteria

- [ ] Code structure matches [pattern/architecture]
- [ ] All existing tests still pass
- [ ] Code complexity reduced by [metric]
- [ ] Performance unchanged or improved
- [ ] No breaking changes to public API
- [ ] Documentation updated to reflect new structure
- [ ] Team reviewed and approved new structure

### Technical Approach

**Before:** (current structure)
```
[Pseudocode or diagram of current structure]
```

**After:** (target structure)
```
[Pseudocode or diagram of new structure]
```

**Migration strategy:**
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Risk mitigation:**
- [Risk 1] - Mitigated by [strategy]
- [Risk 2] - Mitigated by [strategy]

### Test Coverage

**Regression tests:**
- [ ] All existing tests pass without modification
- [ ] Performance benchmarks maintained or improved

**New tests:**
1. Test new structure handles [scenario]
2. Test edge cases in refactored code

### Dependencies

- **Blocks:** [TASK-XXX - features waiting for cleaner code]
- **Blocked by:** [TASK-XXX - if needs other work first]
- **Related:** [TASK-XXX - related refactoring work]

### Complexity Breakdown

- Analysis & Design: X units
- Implementation: X units
- Testing & Verification: X units
- Code Review: X units
**Total:** X units

### Definition of Done

- [ ] Refactoring complete
- [ ] All tests passing (100% of previous tests)
- [ ] Performance verified (no regression)
- [ ] Code reviewed and approved
- [ ] Documentation updated
- [ ] Deployed and monitored for issues

### Notes

[Architectural decisions, gotchas, lessons learned]
```

---

## Technical Debt Task Template

```markdown
## Task: Address [Technical Debt Issue]

**ID:** TASK-XXX
**Priority:** [P1-High | P2-Medium | P3-Low]
**Complexity:** [X units]
**Module/Area:** [component-name]
**Status:** TODO
**Debt Age:** [How long has this existed?]

### Debt Description

**Current situation:**
[What shortcuts or compromises exist?]

**How it accumulated:**
[Why was this approach taken? Time pressure, unknown requirements, etc.]

**Interest being paid:**
- Development velocity: [How it slows new work]
- Bugs: [Issues caused by this debt]
- Maintenance: [Extra effort required]
- Onboarding: [Confusion for new team members]

### Proposed Resolution

**Ideal state:**
[What proper implementation looks like]

**Approach:**
[How to get from current to ideal]

**Alternatives considered:**
- [Option 1] - [Pros/cons]
- [Option 2] - [Pros/cons]

### Acceptance Criteria

- [ ] [Debt item 1] resolved
- [ ] [Debt item 2] resolved
- [ ] No regression in functionality
- [ ] Code meets current standards
- [ ] Team knowledge shared (documentation, pairing)

### Impact Analysis

**Risk if NOT addressed:**
- Short term (1-3 months): [Impact]
- Medium term (3-6 months): [Impact]
- Long term (6+ months): [Impact]

**Benefits when addressed:**
- [Benefit 1 with metric]
- [Benefit 2 with metric]

### Dependencies

- **Blocks:** [Features that will be easier after this]
- **Blocked by:** [If needs other work first]

### Complexity Breakdown

- Investigation: X units
- Implementation: X units
- Testing: X units
- Documentation: X units
**Total:** X units

### Definition of Done

- [ ] Debt resolved
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] Team knowledge transfer complete
- [ ] Monitoring shows improvement

### Notes

[Context, history, lessons learned]
```

---

## Migration Task Template

```markdown
## Task: Migrate [System/Component] from [Old] to [New]

**ID:** TASK-XXX
**Priority:** [P0-Critical | P1-High | P2-Medium]
**Complexity:** [X units]
**Module/Area:** [affected-modules]
**Status:** TODO
**Target Date:** YYYY-MM-DD (if deadline driven)

### Migration Overview

**From:** [Current system/version]
**To:** [Target system/version]

**Reason:**
- [Driver 1 - e.g., security, EOL, performance]
- [Driver 2]

**Scope:**
- [Component 1] - [Changes needed]
- [Component 2] - [Changes needed]

### Breaking Changes

**API changes:**
- [Change 1] - [Migration strategy]
- [Change 2] - [Migration strategy]

**Data model changes:**
- [Change 1] - [Migration script needed]
- [Change 2] - [Migration script needed]

**Configuration changes:**
- [Change 1] - [Update required]
- [Change 2] - [Update required]

### Migration Strategy

**Approach:**
- [ ] Big bang (all at once)
- [ ] Phased (gradual rollout)
- [ ] Parallel run (both systems temporarily)

**Phases:** (if phased approach)
1. Phase 1: [Scope] - Target: [Date]
2. Phase 2: [Scope] - Target: [Date]
3. Phase 3: [Scope] - Target: [Date]

**Rollback triggers:**
- [Condition 1 that would require rollback]
- [Condition 2]

### Acceptance Criteria

- [ ] All components updated to new system
- [ ] Data successfully migrated (100% integrity verified)
- [ ] All tests passing on new system
- [ ] Performance equal or better than old system
- [ ] No data loss during migration
- [ ] Rollback plan tested and documented
- [ ] Team trained on new system

### Pre-Migration Checklist

- [ ] Backup all data
- [ ] Document current system state
- [ ] Test migration in staging environment
- [ ] Prepare rollback procedure
- [ ] Communicate timeline to stakeholders
- [ ] Schedule maintenance window (if needed)

### Migration Procedure

**Preparation:**
1. [Step 1]
2. [Step 2]

**Execution:**
1. [Step 1 with rollback point]
2. [Step 2 with rollback point]
3. [Step 3 with rollback point]

**Verification:**
1. [Verify data integrity]
2. [Verify functionality]
3. [Verify performance]

**Cleanup:**
1. [Remove old system after X days]
2. [Archive old data]

### Data Migration

**Volume:**
- Records: [X records]
- Size: [X GB]
- Estimated time: [X hours]

**Migration scripts:**
- `scripts/migrate-data.sql` - [Purpose]
- `scripts/verify-migration.py` - [Purpose]

**Validation:**
- [ ] Row counts match
- [ ] Data integrity checks pass
- [ ] Spot check [X%] of records

### Test Coverage

**Pre-migration tests:**
1. Test migration scripts in test environment
2. Verify rollback procedure works

**Post-migration tests:**
1. Test [critical path 1]
2. Test [critical path 2]
3. Load test with production-like traffic
4. Verify [integration 1]
5. Verify [integration 2]

### Dependencies

- **Blocks:** [Work that needs new system]
- **Blocked by:** [Infrastructure or prep work needed]
- **Related:** [Related migration tasks]

### Rollback Plan

**Rollback window:** [X hours after migration]

**Rollback procedure:**
1. [Step 1 - immediate action]
2. [Step 2 - restore data]
3. [Step 3 - switch back to old system]

**Data handling on rollback:**
- [How to handle data created during migration]

### Monitoring

**Key metrics to watch:**
- Error rate (should be <X%)
- Response time (should be <Xms)
- [System-specific metric]

**Alerting:**
- Alert if [condition 1]
- Alert if [condition 2]

### Complexity Breakdown

- Planning & Preparation: X units
- Migration execution: X units
- Testing & Verification: X units
- Documentation: X units
**Total:** X units

### Definition of Done

- [ ] Migration complete
- [ ] All acceptance criteria met
- [ ] Performance metrics stable
- [ ] Monitoring confirms success
- [ ] Documentation updated
- [ ] Old system decommissioned (after X days)
- [ ] Post-mortem completed

### Notes

[Migration-specific details, gotchas, lessons learned]
```

---

## Performance Task Template

```markdown
## Task: Optimize [Component] Performance

**ID:** TASK-XXX
**Priority:** [P0-Critical | P1-High | P2-Medium]
**Complexity:** [X units]
**Module/Area:** [component-name]
**Status:** TODO

### Performance Issue

**Current metrics:**
- [Metric 1]: [Current value]
- [Metric 2]: [Current value]

**Target metrics:**
- [Metric 1]: [Target value] (improvement: X%)
- [Metric 2]: [Target value] (improvement: X%)

**Impact:**
- User experience: [Specific impact]
- Business: [Revenue, conversion, etc.]
- Cost: [Infrastructure costs if applicable]

**Bottleneck identified:**
[What profiling/analysis revealed]

### Acceptance Criteria

- [ ] [Metric 1] improves to [target]
- [ ] [Metric 2] improves to [target]
- [ ] No regression in functionality
- [ ] Memory usage unchanged or improved
- [ ] Changes pass performance benchmarks
- [ ] Optimization documented for future reference

### Optimization Strategy

**Approach:**
[High-level optimization approach]

**Techniques:**
- [Technique 1] - Expected improvement: [X%]
- [Technique 2] - Expected improvement: [X%]

**Before/After comparison:**
```
Before: [Pseudocode or metrics]
After: [Pseudocode or metrics]
```

### Test Coverage

**Performance benchmarks:**
1. Benchmark [scenario 1] - Target: <Xms
2. Benchmark [scenario 2] - Target: <Xms
3. Load test with [X] concurrent users

**Regression tests:**
- [ ] All functionality tests still pass
- [ ] No new bugs introduced

### Dependencies

- **Blocks:** [Work waiting for better performance]
- **Blocked by:** [Infrastructure changes needed]

### Complexity Breakdown

- Profiling & Analysis: X units
- Implementation: X units
- Benchmarking: X units
- Code Review: X units
**Total:** X units

### Definition of Done

- [ ] Target metrics achieved
- [ ] No functionality regression
- [ ] Performance benchmarks pass
- [ ] Changes deployed to production
- [ ] Monitoring confirms improvement
- [ ] Documentation updated

### Notes

[Profiling findings, optimization decisions, trade-offs]
```

---

## Documentation Task Template

```markdown
## Task: Document [Topic/Feature]

**ID:** TASK-XXX
**Priority:** [P1-High | P2-Medium | P3-Low]
**Complexity:** [X units]
**Module/Area:** [docs]
**Status:** TODO
**Doc Type:** [API | Architecture | User Guide | Runbook | Tutorial]

### Purpose

**Audience:** [Developers | Users | Operations | New team members]

**Goal:** [What reader should be able to do after reading]

**Context:** [Why this documentation is needed]

### Scope

**Topics to cover:**
1. [Topic 1]
2. [Topic 2]
3. [Topic 3]

**Out of scope:**
- [Topics explicitly NOT covered]

### Acceptance Criteria

- [ ] Documentation covers all required topics
- [ ] Examples are clear and tested
- [ ] Screenshots/diagrams included where helpful
- [ ] Documentation reviewed by [target audience]
- [ ] Documentation is discoverable (linked from main docs)
- [ ] Code samples execute correctly
- [ ] No broken links

### Structure

**Outline:**
1. Introduction/Overview
2. [Section 1]
3. [Section 2]
4. [Section 3]
5. Examples
6. Troubleshooting
7. Related Resources

### Test Coverage

**Documentation validation:**
- [ ] All code samples tested
- [ ] All links verified
- [ ] Screenshots current
- [ ] Technical accuracy reviewed

### Dependencies

- **Blocks:** [User onboarding if user guide]
- **Blocked by:** [Feature completion if documenting new feature]

### Complexity Breakdown

- Research & Outline: X units
- Writing: X units
- Review & Revision: X units
- Publishing: X units
**Total:** X units

### Definition of Done

- [ ] Documentation complete
- [ ] Reviewed by subject matter expert
- [ ] Reviewed by target audience representative
- [ ] Published and discoverable
- [ ] Feedback incorporated

### Notes

[Key decisions about docs structure, style, etc.]
```

---

## Research Spike Template

```markdown
## Task: Research [Topic/Question]

**ID:** TASK-XXX
**Priority:** [P1-High | P2-Medium | P3-Low]
**Complexity:** [X units]
**Module/Area:** [research]
**Status:** TODO
**Time Box:** [X hours/days - Research is time-boxed]

### Research Question

**Core question:**
[What specific question needs answering?]

**Context:**
[Why is this question important? What decision depends on this?]

**Success criteria:**
[What would make this research successful?]

### Research Approach

**Method:**
- [ ] Literature review
- [ ] Prototype/POC
- [ ] Performance testing
- [ ] User research
- [ ] Competitive analysis
- [ ] Technical investigation

**Sources:**
- [Source 1]
- [Source 2]
- [Source 3]

### Acceptance Criteria

- [ ] Research question answered or path forward identified
- [ ] Findings documented clearly
- [ ] Recommendations provided
- [ ] Risks and trade-offs identified
- [ ] Next steps defined
- [ ] Stakeholders reviewed findings

### Deliverables

1. Research document with findings
2. [POC/prototype if applicable]
3. Recommendation with justification
4. Next steps if further work needed

### Time Box

**Duration:** [X hours/days]
**If question not answered:** [What happens? Extend? Choose default? Escalate?]

### Definition of Done

- [ ] Time box reached OR question answered
- [ ] Findings documented
- [ ] Presented to stakeholders
- [ ] Decision made or next steps defined

### Notes

[Research approach, key findings, open questions]
```

---

## Template Customization Guide

### Project-Specific Customization

Each template can be customized for your project's needs:

1. **Add project-specific sections:**
   - Approval gates specific to your workflow
   - Compliance requirements (SOC2, HIPAA, etc.)
   - Cost estimates if tracking budget
   - Custom metrics (Q-Units, story points, etc.)

2. **Remove unnecessary sections:**
   - Not every task needs every section
   - Start minimal, add sections as needed

3. **Standardize naming conventions:**
   - Replace `[Module/Area]` with your project's module names
   - Define priority levels for your project (P0-P3 or custom)

4. **Define complexity units:**
   - Story points, hours, Q-Units, T-shirt sizes
   - Document estimation guidelines

### Template Selection Decision Tree

```
Is this new functionality? → Feature Task
Is this fixing a bug? → Bug Fix Task
Is this improving code quality? → Refactoring Task
Is this upgrading dependencies? → Migration Task
Is this addressing tech debt? → Technical Debt Task
Is this improving speed? → Performance Task
Is this creating documentation? → Documentation Task
Is this investigating a question? → Research Spike
```

### Using Templates in Practice

1. **Copy template** from this file
2. **Fill in all required fields** (ID, priority, complexity, etc.)
3. **Remove optional sections** not needed for this specific task
4. **Customize language** to match your project's terminology
5. **Save to project task directory** with standard naming

---

*These templates ensure consistent, comprehensive task specifications that maintain context across sessions and enable effective agent coordination.*
