# Context Optimization for Task Management

This guide provides strategies for maintaining effective task specifications while optimizing for AI context windows and token efficiency.

## Core Principles

### 1. Progressive Disclosure
Load information only when needed. Not every detail needs to be in every task.

### 2. Reference, Don't Duplicate
Link to project docs rather than copying information into tasks.

### 3. Front-Load Critical Info
Most important information first (title, priority, acceptance criteria).

### 4. Use Templates Consistently
Consistent structure reduces cognitive load across sessions.

---

## Token-Efficient Task Structure

### Minimal Structure (Small Tasks)

For simple tasks (<3 complexity units), use minimal format:

```markdown
## Task: [Action-Oriented Title]

**ID:** TASK-XXX | **Priority:** P1 | **Complexity:** 2 units | **Status:** TODO

### Acceptance Criteria
1. [Criterion 1]
2. [Criterion 2]
3. [Criterion 3]

### Test Coverage
1. [Test 1]
2. [Test 2]
```

**Tokens saved:** ~40% compared to full template

### Standard Structure (Medium Tasks)

For medium tasks (3-5 complexity units):

```markdown
## Task: [Action-Oriented Title]

**ID:** TASK-XXX | **Priority:** P1 | **Complexity:** 4 units | **Module:** auth | **Status:** TODO

### Context
[2-3 sentence overview OR link to detailed spec]

### Acceptance Criteria
[3-5 clear criteria]

### Dependencies
**Blocked by:** [TASK-XXX]

### Test Coverage
[Key tests only]
```

**Tokens saved:** ~25% compared to full template

### Full Structure (Complex Tasks)

For complex tasks (>5 complexity units), use full template with all sections. The extra detail is worth the tokens for complex work.

---

## Context-Saving Strategies

### Strategy 1: Link to Project Docs

❌ **Token-heavy (duplicates project info):**
```markdown
### Technical Approach

Our authentication system uses JWT tokens with RS256 signing.
Tokens expire after 24 hours. We store refresh tokens in Redis
with a 30-day TTL. All passwords are hashed with bcrypt (cost 12).
The auth flow follows OAuth 2.0 authorization code grant with PKCE.
We use the following libraries: jsonwebtoken, bcrypt, ioredis.
```

✅ **Token-efficient (references project docs):**
```markdown
### Technical Approach

Follow authentication patterns from `docs/ARCHITECTURE.md` section 3.2.
Use standard JWT implementation (see `docs/AUTH_PATTERNS.md`).
```

**Tokens saved:** ~70% (from ~80 tokens to ~25 tokens)

### Strategy 2: Use Abbreviations for Repeated Concepts

Define abbreviations in project config, use consistently:

```yaml
# .task-config.yaml
abbreviations:
  AC: Acceptance Criteria
  E2E: End-to-End
  API: Application Programming Interface
  DB: Database
  UI: User Interface
  P0: Priority 0 (Critical)
```

Then in tasks:
```markdown
### AC
1. API returns 200 OK
2. DB record created
3. UI updates within 1s
```

**Tokens saved:** ~10-15% across all tasks

### Strategy 3: Table Format for Dense Information

❌ **Verbose:**
```markdown
The login endpoint accepts POST requests at /api/auth/login.
It requires an email field (string, required, validated).
It requires a password field (string, required, min 8 chars).
It returns a JWT token on success (200 OK).
It returns an error message on failure (401 Unauthorized).
```

✅ **Compact:**
```markdown
| Endpoint | Method | Request | Response Success | Response Failure |
|----------|--------|---------|------------------|------------------|
| /api/auth/login | POST | email (string), password (string, min 8) | 200 + JWT token | 401 + error |
```

**Tokens saved:** ~50%

### Strategy 4: Bullet Lists Over Prose

❌ **Prose (verbose):**
```markdown
The system should validate user input to ensure the email field
contains a valid email address following RFC 5322 standards.
Additionally, the system needs to check that the password meets
our security requirements, which include a minimum length of 12
characters, at least one uppercase letter, one lowercase letter,
one number, and one special symbol. Furthermore, the system must
log all authentication attempts, both successful and failed, to
our audit trail for security compliance purposes.
```

✅ **Bullets (concise):**
```markdown
Input Validation:
- Email: RFC 5322 format
- Password: ≥12 chars, mixed case, number, symbol

Logging:
- Log all auth attempts (success + failure) to audit trail
```

**Tokens saved:** ~60%

---

## Referencing Techniques

### Technique 1: Project Context Files

Create central reference docs:

**`docs/ARCHITECTURE.md`** - System architecture
**`docs/CODING_STANDARDS.md`** - Code patterns
**`docs/TESTING_STRATEGY.md`** - Testing requirements
**`docs/API_CONVENTIONS.md`** - API design patterns

Then in tasks:
```markdown
### Technical Approach
Follow error handling patterns from `docs/CODING_STANDARDS.md#error-handling`.
Use testing patterns from `docs/TESTING_STRATEGY.md#integration-tests`.
```

**Benefits:**
- Single source of truth
- Update once, applies to all tasks
- Massive token savings

### Technique 2: Task Templates by Type

Store templates in `tasks/templates/`:
- `feature-template.md`
- `bug-template.md`
- `refactor-template.md`

Reference them:
```markdown
## Task: Add User Profile Feature

_Using: tasks/templates/feature-template.md_

[Fill in only project-specific details]
```

### Technique 3: Acceptance Criteria Shortcuts

For common patterns, use shorthand:

**Standard patterns defined in `.task-config.yaml`:**
```yaml
ac_patterns:
  api_success: "API returns 200 OK with expected data"
  api_auth: "API requires valid JWT token (401 if missing/invalid)"
  api_validation: "API validates input, returns 400 with specific errors"
  db_transactional: "DB operations are transactional (rollback on error)"
  test_coverage: "Unit tests >80% coverage, integration tests for happy path + errors"
```

**In tasks:**
```markdown
### Acceptance Criteria
- [x] `api_success`
- [x] `api_auth`
- [x] `api_validation`
- [x] `db_transactional`
- [x] `test_coverage`
- [ ] Response time <200ms at p95
```

**Tokens saved:** ~50% for repetitive criteria

---

## Session Continuity

### Problem: Context Loss Between Sessions

AI agents lose context between sessions. Tasks must be self-contained yet efficient.

### Solution: Structured Headers with Key Info

**Format:**
```markdown
## Task: [Title]

**Quick Ref:** ID: TASK-XXX | P1 | 5 units | auth module | IN_PROGRESS since 2025-01-15

[Quick summary paragraph of task goal and current state]

### Last Session Context
**Date:** 2025-01-16
**Completed:** Database schema created, tests passing
**Next:** Implement API endpoints
**Blockers:** None
**Files:** `src/auth/schema.sql`, `tests/auth/schema.test.ts`
```

**Benefits:**
- Agent can resume quickly
- No need to re-read entire task history
- Clear handoff between sessions

---

## Module/Area Tagging

### Benefits of Clear Module Tags

**Enables:**
- Quick filtering ("show all auth tasks")
- Impact analysis ("what changes affect payment module?")
- Ownership assignment
- Parallel work coordination

**Format:**
```markdown
**Module:** auth
**Affected Modules:** auth, database, frontend
```

### Module Configuration

Define in `.task-config.yaml`:
```yaml
modules:
  - name: auth
    path: src/auth
    owner: team-platform
    docs: docs/modules/auth.md
  
  - name: payment
    path: src/payment
    owner: team-commerce
    docs: docs/modules/payment.md
```

Then tasks can reference:
```markdown
**Module:** auth
**See:** `docs/modules/auth.md` for architecture details
```

---

## Dependency Management

### Explicit vs. Implicit Dependencies

❌ **Implicit (requires reading other tasks):**
```markdown
## Task: Build Checkout Flow
This needs the payment system and cart to be done first.
```

✅ **Explicit (clear dependencies):**
```markdown
## Task: Build Checkout Flow

### Dependencies
**Blocked by:**
- TASK-042: Payment Processing (IN_PROGRESS, ETA: 2025-01-20)
- TASK-038: Shopping Cart (DONE)

**Blocks:**
- TASK-045: Order Confirmation
- TASK-047: Receipt Generation
```

**Benefits:**
- Dependency graph is clear
- Can track blocker resolution
- Enables parallelization planning

---

## Task Size Guidelines

### Right-Sizing by Complexity

| Complexity | Token Budget | When to Split |
|------------|--------------|---------------|
| 1-2 units | 500-1000 tokens | Never (too small to split) |
| 3-5 units | 1000-2000 tokens | If >2000 tokens, consider splitting |
| 6-10 units | 2000-3000 tokens | If >3000 tokens, MUST split |
| >10 units | N/A | ALWAYS split before creating task |

### Splitting Strategies

**When a task specification exceeds token budget:**

1. **Horizontal split (by layer):**
   - Task A: Database layer
   - Task B: API layer
   - Task C: Frontend layer

2. **Vertical split (by feature slice):**
   - Task A: Happy path only
   - Task B: Error handling
   - Task C: Edge cases

3. **Sequential split (by phase):**
   - Task A: Core functionality
   - Task B: Testing & edge cases
   - Task C: Performance optimization

---

## Template Customization for Token Efficiency

### Minimal Template (1-2 units)

```markdown
## Task: [Title]
**ID:** X | **P:** X | **C:** X | **M:** X | **S:** X

### AC
1. [AC 1]
2. [AC 2]

### Tests
1. [Test 1]
```

**~200 tokens**

### Standard Template (3-5 units)

```markdown
## Task: [Title]
**ID:** X | **Priority:** X | **Complexity:** X | **Module:** X | **Status:** X

### Context
[Link to spec OR 2-3 sentence summary]

### AC
[3-5 criteria]

### Dependencies
**Blocked by:** [IDs]

### Tests
[Key tests]
```

**~500 tokens**

### Full Template (6+ units)

Use complete template with all sections. At this complexity, comprehensive spec is worth the tokens.

**~1500+ tokens**

---

## Practical Examples

### Example 1: Token-Heavy Task (Before)

```markdown
## Task: Implement User Authentication System

**Priority:** P0-Critical
**Complexity:** 8 units
**Module:** authentication
**Status:** TODO

### Background and Context
We need to implement a comprehensive user authentication system for our application.
This is a critical feature that will allow users to securely log in and access
protected resources. The authentication system should be secure, scalable, and
follow industry best practices.

The system will use JSON Web Tokens (JWT) for authentication. When a user logs in
with valid credentials, the server will generate a JWT token that the client can
use for subsequent authenticated requests. The token should contain the user's ID
and basic profile information.

We will store user passwords using bcrypt hashing with a cost factor of 12. This
ensures that even if our database is compromised, user passwords remain secure.

The authentication flow will follow these steps:
1. User submits login credentials (email and password)
2. Server validates credentials against database
3. If valid, server generates JWT token with 24-hour expiration
4. Server returns token to client
5. Client includes token in Authorization header for protected requests
6. Server validates token on each request

We also need to implement a refresh token mechanism to allow users to stay logged in
for longer periods. Refresh tokens will be stored in Redis with a 30-day TTL.

### Technical Approach

**Database Schema:**
We need a users table with the following columns:
- id (UUID, primary key)
- email (string, unique, not null)
- password_hash (string, not null)
- created_at (timestamp, default now)
- updated_at (timestamp, default now)

We also need a sessions table:
- id (UUID, primary key)
- user_id (UUID, foreign key to users)
- refresh_token (string, unique)
- expires_at (timestamp)
- created_at (timestamp, default now)

**API Endpoints:**
We need to create the following endpoints:
- POST /api/auth/register - Register new user
- POST /api/auth/login - Authenticate user and return tokens
- POST /api/auth/refresh - Refresh access token using refresh token
- POST /api/auth/logout - Invalidate refresh token
- GET /api/auth/me - Get current user info (requires authentication)

... (continues for 2000+ more tokens)
```

**Total: ~2500 tokens**

### Example 1: Token-Efficient Task (After)

```markdown
## Task: Implement User Authentication

**ID:** TASK-042 | **Priority:** P0 | **Complexity:** 8 units | **Module:** auth | **Status:** TODO

### Context
JWT-based auth with refresh tokens. See `docs/AUTH_ARCHITECTURE.md` for full design.

### AC
```
Given valid credentials (email + password)
When user submits login
Then JWT access token returned (24h TTL)
And refresh token stored in Redis (30d TTL)
And user record created/updated in DB
```

**Error cases:**
- Invalid credentials → 401 with clear message
- Missing fields → 400 with validation errors
- Rate limiting → 429 (5 attempts per hour per IP)

**Additional:**
- [ ] Passwords hashed (bcrypt, cost 12)
- [ ] Tokens signed with RS256
- [ ] Response time <200ms at p95

### Technical Approach
Follow auth patterns from `docs/AUTH_ARCHITECTURE.md` section 2.
Database schema in `docs/DATABASE_SCHEMA.md#users-table`.
API conventions from `docs/API_CONVENTIONS.md`.

### Dependencies
**Blocked by:** TASK-040 (Redis setup)

### Test Coverage
See `docs/TESTING_STRATEGY.md#auth-tests` for full test matrix.
- Unit: Password hashing, token generation
- Integration: Full login flow, token validation
- E2E: Login via UI, access protected routes
```

**Total: ~400 tokens (84% reduction!)**

---

## Summary

**Key Strategies:**

1. **Use minimal templates** for simple tasks
2. **Reference project docs** instead of duplicating
3. **Front-load critical info** (title, priority, AC)
4. **Use tables and bullets** over prose
5. **Define abbreviations** for repeated concepts
6. **Split large tasks** when spec >3000 tokens
7. **Provide session context** for continuity

**Token Budgets:**

- Minimal task (1-2 units): ~200-500 tokens
- Standard task (3-5 units): ~500-1000 tokens
- Complex task (6+ units): ~1500-2500 tokens

**Quality vs. Efficiency:**

Don't sacrifice clarity for token savings. The goal is:
- **Clear** - Unambiguous, testable requirements
- **Complete** - All necessary information present
- **Efficient** - No redundancy or unnecessary detail

---

*Effective context optimization enables AI agents to work efficiently across sessions while maintaining comprehensive task specifications.*
