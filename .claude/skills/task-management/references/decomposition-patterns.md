# Task Decomposition Patterns

Breaking down complex work into manageable tasks is essential for agentic coding. This guide provides 7 proven decomposition patterns, anti-patterns to avoid, and practical examples.

## Table of Contents

1. [Decomposition Principles](#decomposition-principles)
2. [Seven Core Patterns](#seven-core-patterns)
3. [Pattern Selection Guide](#pattern-selection-guide)
4. [Real-World Examples](#real-world-examples)
5. [Anti-Patterns](#anti-patterns)
6. [Decomposition Checklist](#decomposition-checklist)

---

## Decomposition Principles

### Right-Sizing Tasks

**Too Large (>10 units):**
- Creates ambiguity
- Difficult to estimate accurately
- High risk of scope creep
- Long feedback cycles

**Too Small (<1 unit):**
- Excessive overhead
- Context switching costs
- Loses big picture
- Over-fragmentation

**Right-Sized (1-5 units):**
- Clear scope and boundaries
- Predictable completion
- Manageable complexity
- Good feedback loops

### Key Principles

1. **Minimize dependencies** - Independent tasks can be parallelized
2. **Maintain cohesion** - Keep related work together
3. **Preserve context** - Each task should be understandable alone
4. **Enable incrementalism** - Each task delivers value
5. **Respect boundaries** - Don't cross module/system boundaries unnecessarily

---

## Seven Core Patterns

### Pattern 1: Layered Decomposition (Technology Stack)

**Description:** Break by technology layers (data → API → UI → tests).

**Use when:**
- Full-stack feature requiring all layers
- Clear separation of concerns
- Each layer can be implemented independently
- Team has specialized expertise by layer

**Structure:**
```
Feature: User Authentication
├── Task 1: Database Layer
│   └── Auth tables, indexes, RLS policies
├── Task 2: API Layer
│   └── Auth endpoints, middleware, JWT
├── Task 3: Frontend Layer
│   └── Login UI, form validation, session management
└── Task 4: Testing Layer
    └── Integration tests, E2E tests
```

**Pros:**
- Clear separation of concerns
- Specialists can work in parallel
- Easy to track progress by layer

**Cons:**
- Integration happens late
- May duplicate effort across layers
- Requires coordination at integration

**Example:**
```markdown
## Task 1: Database Schema for User Authentication
**Complexity:** 3 units
**Module:** database

### Acceptance Criteria
- [ ] Create users table with email, password_hash, created_at
- [ ] Create sessions table with user_id, token, expires_at
- [ ] Add indexes on email (unique), token (unique)
- [ ] Implement RLS policies for user data access
- [ ] Migration scripts tested on staging

## Task 2: Authentication API Endpoints
**Complexity:** 4 units
**Module:** api
**Blocked by:** TASK-1 (database schema)

### Acceptance Criteria
- [ ] POST /api/auth/register - create user account
- [ ] POST /api/auth/login - authenticate and return JWT
- [ ] POST /api/auth/logout - invalidate session
- [ ] GET /api/auth/me - get current user
- [ ] All endpoints validate input, return proper errors
- [ ] JWT tokens expire after 24 hours

## Task 3: Authentication UI Components
**Complexity:** 3 units
**Module:** frontend
**Blocked by:** TASK-2 (API endpoints)

### Acceptance Criteria
- [ ] Login form with email/password fields
- [ ] Register form with email/password/confirm
- [ ] Form validation (client-side)
- [ ] Error messages display clearly
- [ ] Loading states during API calls
- [ ] Redirect to dashboard after successful login
```

---

### Pattern 2: Sequential Decomposition (Dependency Chain)

**Description:** Break into steps where each depends on the previous.

**Use when:**
- Clear dependency chain
- Each step builds on previous
- Linear workflow
- Risk of premature parallelization

**Structure:**
```
Feature: Payment Processing
├── Task 1: Stripe Integration (foundation)
├── Task 2: Invoice Generation (depends on 1)
├── Task 3: Payment Webhooks (depends on 2)
└── Task 4: Email Notifications (depends on 3)
```

**Pros:**
- Clear sequence
- No coordination overhead
- Each step validates previous

**Cons:**
- No parallelization
- Slower overall completion
- Blocking if one task delayed

**Example:**
```markdown
## Task 1: Integrate Stripe Payment API
**Complexity:** 5 units
**Blocks:** TASK-2, TASK-3, TASK-4

### Acceptance Criteria
- [ ] Stripe client configured with API keys
- [ ] Create payment intent endpoint working
- [ ] Payment confirmation handling implemented
- [ ] Error handling for failed payments
- [ ] Test mode verified with test cards

## Task 2: Generate PDF Invoices
**Complexity:** 3 units
**Blocked by:** TASK-1

### Acceptance Criteria
- [ ] Invoice generated after successful payment
- [ ] PDF includes order details, payment info, date
- [ ] Invoice stored in database with unique ID
- [ ] Invoice accessible via /api/invoices/:id

## Task 3: Handle Payment Webhooks
**Complexity:** 4 units
**Blocked by:** TASK-2

### Acceptance Criteria
- [ ] Webhook endpoint /webhooks/stripe configured
- [ ] Signature verification implemented
- [ ] payment_intent.succeeded updates order status
- [ ] payment_intent.failed triggers notification
- [ ] Idempotency handling prevents duplicates

## Task 4: Send Payment Confirmation Emails
**Complexity:** 2 units
**Blocked by:** TASK-3

### Acceptance Criteria
- [ ] Email sent within 30 seconds of payment success
- [ ] Email includes invoice link
- [ ] Email template matches brand guidelines
- [ ] Failed email attempts logged and retried
```

---

### Pattern 3: Parallel Decomposition (Independent Streams)

**Description:** Break into independent pieces that can be built simultaneously.

**Use when:**
- Work can be parallelized
- Multiple independent subsystems
- Want to maximize velocity
- Have sufficient resources

**Structure:**
```
Feature: Analytics Dashboard
├── Task A: Data Collection Module (independent)
├── Task B: Chart Visualization Module (independent)
├── Task C: Export Functionality (independent)
└── Task D: Integration & Polish (depends on A, B, C)
```

**Pros:**
- Maximum parallelization
- Fastest completion time
- Independent progress tracking

**Cons:**
- Requires coordination for integration
- Risk of inconsistency
- Integration complexity

**Example:**
```markdown
## Task A: Implement Data Collection Pipeline
**Complexity:** 5 units
**Blocks:** TASK-D
**Related:** TASK-B, TASK-C

### Acceptance Criteria
- [ ] Event tracking captures user actions
- [ ] Events stored in database with timestamp
- [ ] Aggregation queries return metrics by date range
- [ ] API endpoints: /api/analytics/events
- [ ] Performance: queries <500ms for 1M events

## Task B: Build Chart Visualization Components
**Complexity:** 4 units
**Blocks:** TASK-D
**Related:** TASK-A, TASK-C

### Acceptance Criteria
- [ ] Line chart component for time-series data
- [ ] Bar chart component for categorical data
- [ ] Pie chart component for proportions
- [ ] Charts responsive and accessible
- [ ] Charts support date range filtering

## Task C: Add Export Functionality
**Complexity:** 2 units
**Blocks:** TASK-D
**Related:** TASK-A, TASK-B

### Acceptance Criteria
- [ ] Export button downloads data as CSV
- [ ] CSV includes selected date range
- [ ] Export completes in <10s for 10k rows
- [ ] Filename includes date range

## Task D: Integrate Dashboard Components
**Complexity:** 3 units
**Blocked by:** TASK-A, TASK-B, TASK-C

### Acceptance Criteria
- [ ] Dashboard displays charts with live data
- [ ] Date range selector updates all components
- [ ] Export uses filtered data
- [ ] Loading states for async operations
- [ ] Error handling for failed requests
```

---

### Pattern 4: Functional Decomposition (By Capability)

**Description:** Break by distinct functional modules or capabilities.

**Use when:**
- Clear functional boundaries
- Domain-driven design
- Microservices architecture
- Each capability is self-contained

**Structure:**
```
Feature: Content Management System
├── Task 1: Article Management Module
├── Task 2: Media Library Module
├── Task 3: User Permissions Module
└── Task 4: Publishing Workflow Module
```

**Pros:**
- Clear ownership
- Loose coupling
- Easy to assign to specialists

**Cons:**
- May need cross-module integration
- Risk of duplication

**Example:**
```markdown
## Task 1: Article Management
**Complexity:** 5 units
**Module:** articles

### Acceptance Criteria
- [ ] CRUD operations for articles (create, read, update, delete)
- [ ] Article schema: title, body, author, status, tags
- [ ] Rich text editor with formatting support
- [ ] Draft/published status workflow
- [ ] Article listing with search and filters

## Task 2: Media Library
**Complexity:** 4 units
**Module:** media

### Acceptance Criteria
- [ ] Upload images/files (max 10MB)
- [ ] Media organized by folders
- [ ] Image processing (resize, optimize)
- [ ] Media browser with search
- [ ] Delete/replace media files

## Task 3: User Permissions
**Complexity:** 3 units
**Module:** permissions

### Acceptance Criteria
- [ ] Role-based access control (admin, editor, viewer)
- [ ] Permission checks on all operations
- [ ] Admins can manage user roles
- [ ] Audit log of permission changes
```

---

### Pattern 5: Risk-Based Decomposition (Mitigate Unknowns)

**Description:** Tackle high-risk or unknown areas first.

**Use when:**
- Technical uncertainty
- External dependencies
- Performance concerns
- Integration with unfamiliar systems

**Structure:**
```
Feature: Third-Party API Integration
├── Task 1: Research Spike (de-risk API unknowns)
├── Task 2: Proof of Concept (validate approach)
├── Task 3: Core Integration (build on POC)
└── Task 4: Error Handling & Polish (low risk)
```

**Pros:**
- Reduces risk early
- Validates assumptions
- Avoids rework

**Cons:**
- May delay some work
- Research tasks harder to estimate

**Example:**
```markdown
## Task 1: Research External Payment API
**Complexity:** 2 units (time-boxed: 4 hours)
**Type:** Research Spike

### Acceptance Criteria
- [ ] Document API authentication approach
- [ ] Identify rate limits and quotas
- [ ] List required API endpoints
- [ ] Note any breaking limitations
- [ ] Recommend integration strategy

## Task 2: Build Payment API Proof of Concept
**Complexity:** 3 units
**Blocked by:** TASK-1

### Acceptance Criteria
- [ ] Single payment flow working end-to-end
- [ ] Authentication validated
- [ ] Error handling tested
- [ ] Performance acceptable (<2s)
- [ ] Limitations documented

## Task 3: Implement Full Payment Integration
**Complexity:** 5 units
**Blocked by:** TASK-2

### Acceptance Criteria
- [ ] All payment scenarios supported
- [ ] Webhook handling implemented
- [ ] Retry logic for failures
- [ ] Logging and monitoring
- [ ] Production-ready error handling
```

---

### Pattern 6: Infrastructure-First Decomposition

**Description:** Build foundational infrastructure before features.

**Use when:**
- Features depend on shared infrastructure
- Multiple features need common capabilities
- Want to avoid rework
- Infrastructure complexity is high

**Structure:**
```
Feature: Multi-Tenant SaaS Platform
├── Task 1: Tenant Isolation Infrastructure
├── Task 2: Authentication & Authorization Framework
├── Task 3: Billing & Subscription System
└── Task 4-N: Feature Modules (depend on 1-3)
```

**Pros:**
- Avoids rework
- Consistent patterns
- Easier feature development

**Cons:**
- Delayed feature delivery
- Risk of over-engineering
- Harder to validate assumptions

**Example:**
```markdown
## Task 1: Implement Tenant Isolation
**Complexity:** 5 units
**Blocks:** TASK-2, TASK-3, TASK-4+

### Acceptance Criteria
- [ ] Database schema supports multi-tenancy (tenant_id everywhere)
- [ ] Row-level security policies enforce isolation
- [ ] API middleware injects tenant context
- [ ] Tests verify data isolation
- [ ] Migration script adds tenant_id to existing tables

## Task 2: Build Auth Framework
**Complexity:** 4 units
**Blocked by:** TASK-1
**Blocks:** TASK-4+

### Acceptance Criteria
- [ ] JWT-based authentication
- [ ] Role-based access control
- [ ] Tenant-scoped permissions
- [ ] API middleware for auth checks
- [ ] Login/logout/refresh flows
```

---

### Pattern 7: Feature Flag Decomposition (Incremental Rollout)

**Description:** Break features behind feature flags for incremental delivery.

**Use when:**
- Want to ship code before fully ready
- Need to test in production safely
- Gradual rollout to users
- A/B testing different approaches

**Structure:**
```
Feature: New Recommendation Engine
├── Task 1: Build New Engine (behind flag)
├── Task 2: A/B Test Framework
├── Task 3: Gradual Rollout (1%, 10%, 50%, 100%)
└── Task 4: Remove Old Engine (after validation)
```

**Pros:**
- Ship continuously
- Safe rollout
- Easy rollback

**Cons:**
- Flag management overhead
- Complexity from dual paths

**Example:**
```markdown
## Task 1: Implement New Recommendation Algorithm
**Complexity:** 5 units
**Feature Flag:** enable_new_recommendations (default: false)

### Acceptance Criteria
- [ ] New algorithm returns 10 recommendations
- [ ] Recommendations based on user history
- [ ] Performance <200ms at p95
- [ ] Feature flag controls which algorithm runs
- [ ] Metrics logged for both algorithms

## Task 2: Set Up A/B Testing Framework
**Complexity:** 3 units
**Blocked by:** TASK-1

### Acceptance Criteria
- [ ] Randomly assign users to control/treatment (50/50)
- [ ] Assignment persists across sessions
- [ ] Metrics tracked separately by group
- [ ] Dashboard shows performance by group

## Task 3: Gradual Rollout
**Complexity:** 2 units
**Blocked by:** TASK-2

### Acceptance Criteria
- [ ] Week 1: 1% of users see new algorithm
- [ ] Week 2: 10% if metrics acceptable
- [ ] Week 3: 50% if metrics acceptable
- [ ] Week 4: 100% if metrics acceptable
- [ ] Rollback plan if metrics degrade
```

---

## Pattern Selection Guide

### Decision Matrix

| Pattern | When to Use | Key Benefit | Main Risk |
|---------|-------------|-------------|-----------|
| **Layered** | Full-stack feature, specialized team | Clear separation | Late integration |
| **Sequential** | Strong dependencies, linear flow | Clear sequence | No parallelization |
| **Parallel** | Independent subsystems | Maximum speed | Integration complexity |
| **Functional** | Domain-driven, microservices | Loose coupling | Cross-module work |
| **Risk-Based** | Technical uncertainty, unknowns | Reduce risk early | Research overhead |
| **Infrastructure-First** | Shared foundation needed | Consistent patterns | Delayed features |
| **Feature Flag** | Incremental rollout, A/B testing | Safe deployment | Flag management |

### Quick Selection Flowchart

```
Start here:
│
├─ High technical uncertainty? → Risk-Based
├─ Need shared infrastructure first? → Infrastructure-First
├─ Want gradual rollout? → Feature Flag
├─ Strong sequential dependencies? → Sequential
├─ Can work in parallel? → Parallel or Functional
└─ Full-stack with layers? → Layered
```

---

## Real-World Examples

### Example 1: E-commerce Checkout (Parallel + Sequential Hybrid)

**Phase 1: Parallel Foundation (Weeks 1-2)**
```
├── Task A: Shopping Cart API (independent)
├── Task B: Stripe Payment Integration (independent)
└── Task C: Email Notification Service (independent)
```

**Phase 2: Sequential Integration (Weeks 3-4)**
```
├── Task D: Cart → Payment Flow (depends on A, B)
└── Task E: Payment → Confirmation Email (depends on D, C)
```

### Example 2: Analytics Dashboard (Infrastructure-First + Layered)

**Phase 1: Infrastructure (Week 1)**
```
├── Task 1: Event Tracking Infrastructure
└── Task 2: Data Pipeline & Storage
```

**Phase 2: Layered Feature (Week 2-3)**
```
├── Task 3: Analytics API Endpoints (depends on 1, 2)
├── Task 4: Dashboard UI Components (depends on 3)
└── Task 5: Export & Filtering (depends on 3, 4)
```

### Example 3: Migration Project (Risk-Based + Sequential)

**Phase 1: De-Risk (Week 1)**
```
├── Task 1: Research New Database Capabilities
└── Task 2: POC Migration Script (depends on 1)
```

**Phase 2: Execute (Week 2-4)**
```
├── Task 3: Backup & Migration Scripts (depends on 2)
├── Task 4: Execute Migration (depends on 3)
├── Task 5: Verify Data Integrity (depends on 4)
└── Task 6: Cleanup & Optimization (depends on 5)
```

---

## Anti-Patterns

### Anti-Pattern 1: Over-Fragmentation

❌ **Bad:**
```
├── Task 1: Create database table (0.5 units)
├── Task 2: Add index to table (0.5 units)
├── Task 3: Write INSERT query (0.5 units)
├── Task 4: Write SELECT query (0.5 units)
├── Task 5: Write UPDATE query (0.5 units)
└── Task 6: Write DELETE query (0.5 units)
```

**Problem:** Too granular, excessive overhead, loses context.

✅ **Better:**
```
└── Task: Implement User CRUD Operations (3 units)
    - Database schema with indexes
    - All CRUD queries (INSERT, SELECT, UPDATE, DELETE)
    - Basic validation and error handling
```

### Anti-Pattern 2: Under-Decomposition

❌ **Bad:**
```
└── Task: Build Entire E-commerce Platform (200 units)
```

**Problem:** Too large, unclear scope, impossible to estimate.

✅ **Better:**
```
├── Epic: E-commerce Platform
│   ├── Feature 1: Product Catalog (20 units)
│   ├── Feature 2: Shopping Cart (15 units)
│   ├── Feature 3: Checkout & Payment (25 units)
│   ├── Feature 4: Order Management (20 units)
│   └── Feature 5: Admin Dashboard (30 units)
```

### Anti-Pattern 3: Artificial Parallelization

❌ **Bad:**
```
├── Task A: Build API endpoints
├── Task B: Build frontend (CANNOT start until A is done)
└── Mark as "parallel" to look more efficient
```

**Problem:** Creates false impression of parallelizability, leads to blocking.

✅ **Better:**
```
├── Task A: Build API endpoints (5 units)
└── Task B: Build frontend (3 units, BLOCKED BY A)
```

### Anti-Pattern 4: Ignoring Module Boundaries

❌ **Bad:**
```
├── Task: Update user authentication AND add product search
```

**Problem:** Crosses unrelated modules, unclear scope, hard to test.

✅ **Better:**
```
├── Task 1: Update user authentication (auth module)
└── Task 2: Add product search (search module)
```

### Anti-Pattern 5: Decomposing by Implementation Detail

❌ **Bad:**
```
├── Task 1: Write controller code
├── Task 2: Write service code
├── Task 3: Write repository code
└── Task 4: Write tests
```

**Problem:** Artificial separation, no deliverable value until all done.

✅ **Better:**
```
└── Task: Implement user registration feature (5 units)
    - Controller, service, repository layers
    - Comprehensive test coverage
    - Ready for deployment
```

### Anti-Pattern 6: Premature Optimization Split

❌ **Bad:**
```
├── Task 1: Build feature
└── Task 2: Optimize feature for performance
```

**Problem:** May not need optimization, wastes effort.

✅ **Better:**
```
└── Task: Build feature with performance requirements
    - Feature works correctly
    - Meets performance SLA (<200ms at p95)
    - Optimize only if needed during implementation
```

---

## Decomposition Checklist

### Before Decomposition

- [ ] Understand the complete scope
- [ ] Identify all requirements and constraints
- [ ] Assess technical complexity and risks
- [ ] Consider available resources and timeline
- [ ] Review module/system boundaries

### During Decomposition

- [ ] Each task is 1-5 units of complexity
- [ ] Each task has clear acceptance criteria
- [ ] Dependencies are explicit and necessary
- [ ] Tasks respect module boundaries
- [ ] Tasks can be tested independently
- [ ] Each task delivers incremental value
- [ ] Parallel work is truly independent
- [ ] Sequential work has clear dependency rationale

### After Decomposition

- [ ] Total complexity matches original estimate
- [ ] Critical path identified
- [ ] Risks and unknowns addressed early
- [ ] Integration points planned
- [ ] Review with team/stakeholders
- [ ] Adjust based on feedback

### Red Flags

- [ ] Too many dependencies (>50% of tasks blocked)
- [ ] Extreme size variance (1 unit task next to 20 unit task)
- [ ] Unclear boundaries between tasks
- [ ] No incremental value delivery
- [ ] Too many or too few tasks for the scope

---

## Summary

**Key Takeaways:**

1. **Match pattern to context** - No one-size-fits-all approach
2. **Right-size tasks** - 1-5 units is the sweet spot
3. **Minimize dependencies** - Enable parallelization where possible
4. **Maintain context** - Each task should be understandable alone
5. **Deliver incrementally** - Each task should add value
6. **Validate early** - Test integration points and assumptions
7. **Be flexible** - Adjust decomposition as you learn more

**Practical Advice:**

- Start with one pattern, adapt as needed
- Combine patterns for complex projects
- Validate with team before execution
- Re-decompose if tasks prove too large/small
- Track what works for your team and iterate

---

*Effective task decomposition is both art and science. These patterns provide proven starting points, but adapt them to your project's unique needs and constraints.*
