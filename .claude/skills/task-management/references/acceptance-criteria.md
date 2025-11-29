# Acceptance Criteria Best Practices

Acceptance criteria (AC) define the conditions that must be met for a task to be considered complete. Well-written AC eliminate ambiguity, enable effective testing, and ensure shared understanding across all agents and team members.

## Table of Contents

1. [SMART Principles](#smart-principles)
2. [AC Formats](#ac-formats)
3. [Writing Guidelines](#writing-guidelines)
4. [Common Patterns by Domain](#common-patterns-by-domain)
5. [Anti-Patterns to Avoid](#anti-patterns-to-avoid)
6. [Integration with Testing](#integration-with-testing)
7. [Examples Gallery](#examples-gallery)

---

## SMART Principles

Every acceptance criterion should be **SMART**:

### S - Specific
❌ "The system should be fast"
✅ "API endpoint responds in <200ms at p95 for product search queries with 1000+ results"

**Why:** Removes interpretation. Everyone understands the exact requirement.

### M - Measurable
❌ "Users should have a good experience"
✅ "User completes checkout flow in ≤3 steps with ≤2 clicks per step"

**Why:** Enables objective pass/fail verification. No room for argument.

### A - Achievable
❌ "System has zero bugs"
✅ "Critical path (login, search, checkout) has 95% test coverage and zero P0 bugs"

**Why:** Sets realistic expectations. Focuses on high-impact quality.

### R - Relevant
❌ "Database uses PostgreSQL 16"
✅ "Search query returns results in <100ms for 10k product catalog"

**Why:** Focuses on outcomes, not implementation. Gives flexibility on approach.

### T - Testable
❌ "Code should be well-structured"
✅ "Code passes linter with zero errors, cyclomatic complexity <10 per function"

**Why:** Enables automated or manual verification. Clear pass/fail.

---

## AC Formats

Choose the format that best fits your task type.

### Format 1: Given-When-Then (Behavior-Driven)

**Use when:** Task has clear user scenarios, interaction flows, or state transitions.

**Structure:**
```
Given [initial context/preconditions]
When [action or trigger]
Then [expected outcome]
And [additional outcomes]
```

**Example:**
```
Given a user with an unpaid invoice in their account
When they click the "Pay Now" button
Then they are redirected to Stripe Checkout
And the invoice status updates to "pending_payment"
And a ledger event "invoice.payment_initiated" is recorded
And the payment amount is displayed in the user's currency
```

**Strengths:**
- Natural language, readable by non-technical stakeholders
- Maps directly to test cases
- Captures context, action, and outcome explicitly

**When to use:**
- User-facing features
- API endpoint behaviors
- State machine transitions
- Integration scenarios

### Format 2: Checklist (Rule-Based)

**Use when:** Task has independent requirements or validation rules without sequential flow.

**Structure:**
```
- [ ] [Specific requirement 1]
- [ ] [Specific requirement 2]
- [ ] [Specific requirement 3]
```

**Example:**
```
- [ ] System validates email format matches RFC 5322 standard
- [ ] Password must be ≥12 characters with mixed case, number, and symbol
- [ ] Error messages display in user's selected language
- [ ] Audit log captures all authentication attempts (success and failure)
- [ ] API response time <200ms at p95 for login endpoint
- [ ] Failed login attempts limited to 5 per hour per IP address
```

**Strengths:**
- Clear pass/fail for each requirement
- Easy to track completion
- No sequential dependency implied
- Good for non-functional requirements

**When to use:**
- Data validation rules
- Performance requirements
- Security requirements
- Accessibility requirements
- Quality gates

### Format 3: Table (Multi-Scenario)

**Use when:** Multiple scenarios with varying inputs/outputs need clear comparison.

**Structure:**
```
| Input | Expected Output | Notes |
|-------|-----------------|-------|
| [Input 1] | [Output 1] | [Context] |
| [Input 2] | [Output 2] | [Context] |
```

**Example:**

| User Status | Cart Value | Discount Applied | Final Price | Notes |
|-------------|------------|------------------|-------------|-------|
| New customer | $100 | 10% | $90 | Welcome discount |
| Returning | $100 | 0% | $100 | Standard pricing |
| Premium member | $100 | 15% | $85 | Premium tier benefit |
| Premium + promo code "SAVE20" | $100 | 20% | $80 | Max discount applies |
| New + promo code "SAVE20" | $100 | 20% | $80 | Promo overrides welcome |

**Strengths:**
- Clear comparison of scenarios
- Easy to spot missing edge cases
- Compact representation
- Good for complex business logic

**When to use:**
- Discount/pricing logic
- Permission matrices
- Complex conditional logic
- Multiple input combinations

### Format 4: Acceptance Test Cases (Test-First)

**Use when:** Task is complex and test cases are the clearest specification.

**Structure:**
```
**Test Case 1: [Scenario name]**
- Setup: [Initial state]
- Action: [What to do]
- Assertion: [What to verify]
```

**Example:**
```
**Test Case 1: Successful payment processing**
- Setup: User has valid credit card, cart total $50, Stripe test mode enabled
- Action: Submit payment form with valid card data
- Assertions:
  - Stripe charge succeeds with amount $50
  - Order status updates to "paid"
  - User receives email confirmation within 30 seconds
  - Ledger shows "payment.completed" event with correct amount

**Test Case 2: Payment fails - insufficient funds**
- Setup: User attempts payment with card having insufficient funds
- Action: Submit payment form
- Assertions:
  - Stripe returns error "insufficient_funds"
  - User sees message "Your card has insufficient funds"
  - Order status remains "pending_payment"
  - Ledger shows "payment.failed" with reason
  - Support notification sent if 3+ failures for same user

**Test Case 3: Payment timeout**
- Setup: Simulate Stripe API delay >30 seconds
- Action: Submit payment form
- Assertions:
  - Frontend shows "Payment processing..." spinner
  - Backend queues payment for verification
  - User receives email "Payment is being processed"
  - Webhook handler updates status when Stripe responds
```

**Strengths:**
- Extremely detailed and unambiguous
- Maps 1:1 to automated tests
- Captures edge cases explicitly
- Forces thinking about test setup

**When to use:**
- Complex algorithms
- Integration with external services
- Critical payment/financial logic
- Scenarios with many edge cases

---

## Writing Guidelines

### Guideline 1: Focus on Outcomes, Not Implementation

❌ **Too prescriptive (specifies HOW):**
```
- [ ] Use PostgreSQL JSONB column with GIN index for product search
- [ ] Implement bcrypt password hashing with cost factor 12
- [ ] Use React hooks (useState, useEffect) for form state
```

✅ **Outcome-focused (specifies WHAT):**
```
- [ ] Product search returns results in <100ms for catalog of 10k items
- [ ] Passwords stored using industry-standard hashing (no plaintext)
- [ ] Form state persists correctly when user navigates away and returns
```

**Why:** Gives flexibility on implementation approach while ensuring the right outcome.

### Guideline 2: Be Specific and Quantitative

❌ **Too vague:**
```
- System should be fast
- UI should be responsive
- Code should be maintainable
```

✅ **Specific and measurable:**
```
- API response time <200ms at p95 for search queries
- UI renders search results in <1 second on 3G network
- Code complexity <10 cyclomatic complexity per function, test coverage >80%
```

**Why:** Eliminates interpretation. Anyone can verify pass/fail.

### Guideline 3: Include Edge Cases and Error Handling

❌ **Only happy path:**
```
Given user enters product name
When they submit search
Then results display
```

✅ **With edge cases:**
```
**Scenario 1: Successful search**
Given user enters "laptop" in search box
When they click Search
Then results display with 10 items per page
And results are sorted by relevance

**Scenario 2: No results found**
Given user enters "xyznonexistent"
When they click Search
Then "No results found" message displays
And search suggestions are shown based on similar terms

**Scenario 3: Search with special characters**
Given user enters "laptop & tablet"
When they click Search
Then search treats "&" as AND operator
And results include items matching both terms

**Scenario 4: Empty search**
Given user clicks Search without entering text
Then validation error "Please enter search term" displays
And search is not executed
```

**Why:** Real-world usage involves errors and edge cases. AC should cover them.

### Guideline 4: Avoid Technical Jargon When Possible

❌ **Technical language:**
```
- Implement OAuth 2.0 authorization code grant flow with PKCE
- Use Redux Toolkit for state management with RTK Query
- Configure PostgreSQL connection pooling with pgBouncer
```

✅ **Outcome-focused language:**
```
- Users can sign in with Google/GitHub without entering password
- Application state persists correctly across page refreshes
- Database can handle 100 concurrent connections without performance degradation
```

**Why:** Non-technical stakeholders can understand and verify. Focus on business value.

### Guideline 5: One Concern Per Criterion

❌ **Multiple concerns:**
```
- [ ] System validates user input, logs all access, sends email notifications, and updates the cache
```

✅ **Separate concerns:**
```
- [ ] System validates all user input against schema before processing
- [ ] System logs all access attempts (successful and failed) to audit log
- [ ] System sends email notification within 30 seconds of status change
- [ ] System updates cache immediately after successful database write
```

**Why:** Each criterion can be tested independently. Clear what passed/failed.

### Guideline 6: Make Criteria Testable

Ask: "Can I write a pass/fail test for this?"

❌ **Not testable:**
```
- Code should be well-designed
- UI should look good
- System should be user-friendly
```

✅ **Testable:**
```
- Code passes linter (ESLint) with zero errors
- UI matches approved Figma designs (pixel-perfect within 2px tolerance)
- User completes signup flow in ≤2 minutes in usability testing (n≥5 users)
```

**Why:** If you can't test it, you can't verify it's done.

---

## Common Patterns by Domain

### Authentication & Authorization

```
**Successful login:**
Given a user with valid credentials
When they submit login form
Then they are redirected to dashboard
And JWT token is stored in secure cookie (httpOnly, secure, sameSite)
And session expires after 24 hours of inactivity

**Failed login:**
Given a user enters invalid credentials
When they submit login form
Then error message "Invalid email or password" displays
And login attempts are rate-limited (5 attempts per hour per IP)
And account locks after 10 failed attempts in 24 hours
And user receives email notification of suspicious activity
```

### Form Validation

```
- [ ] Email field validates format against RFC 5322
- [ ] Phone number field accepts multiple formats (US, international)
- [ ] Password strength indicator updates in real-time as user types
- [ ] Form prevents submission if required fields are empty
- [ ] Validation errors display inline next to relevant field
- [ ] Error messages are specific (not generic "Invalid input")
```

### API Endpoints

```
**GET /api/products**

Successful request (200 OK):
- Returns array of products with id, name, price, image_url
- Supports pagination (?page=1&limit=20)
- Supports filtering (?category=electronics&min_price=100)
- Response time <200ms at p95
- Results sorted by relevance (or specified sort param)

Error cases:
- Returns 400 Bad Request if limit >100
- Returns 404 Not Found if page exceeds available pages
- Returns 500 Internal Server Error and logs error if database unavailable
- All error responses include {error: {code, message}} structure
```

### Data Processing

```
- [ ] CSV file parsing handles up to 100k rows
- [ ] Invalid rows are logged with line number and reason
- [ ] Processing completes in <5 minutes for 10k rows
- [ ] Progress indicator updates every 1000 rows processed
- [ ] Transaction rolls back completely if any validation error
- [ ] Summary report generated showing success/failure counts
```

### Email Notifications

```
Given user completes purchase
When order is confirmed
Then user receives email within 30 seconds
And email includes order number, items, total, and tracking link
And email template matches brand guidelines
And email is sent to user's registered email address
And email delivery is logged in system
And email contains unsubscribe link (CAN-SPAM compliance)
```

### Search Functionality

```
- [ ] Search returns results in <1 second for queries with 1000+ matches
- [ ] Search supports fuzzy matching (typo tolerance)
- [ ] Search highlights matched terms in results
- [ ] Search respects user's language preference
- [ ] Search results are ranked by relevance (configurable algorithm)
- [ ] Search indexes update within 5 minutes of data changes
- [ ] Empty search query shows helpful suggestions or popular items
```

### Performance Requirements

```
- [ ] Page load time <2 seconds on 3G network (Lighthouse score >80)
- [ ] API endpoint responds in <200ms at p95 under normal load
- [ ] System handles 1000 concurrent users without degradation
- [ ] Database queries execute in <50ms at p95
- [ ] Memory usage <512MB per instance under peak load
- [ ] Frontend bundle size <500KB gzipped
```

### Accessibility

```
- [ ] All interactive elements keyboard-accessible (tab navigation)
- [ ] Screen reader announces all page elements correctly
- [ ] Color contrast ratio ≥4.5:1 for all text (WCAG AA)
- [ ] Form fields have associated labels (for attribute)
- [ ] Error messages are announced by screen readers
- [ ] Focus indicators visible on all interactive elements
- [ ] Page structure uses semantic HTML (header, nav, main, footer)
```

### Security

```
- [ ] Passwords hashed using bcrypt (or Argon2) before storage
- [ ] SQL injection prevented (parameterized queries only)
- [ ] XSS prevented (all user input sanitized before rendering)
- [ ] CSRF tokens required for state-changing operations
- [ ] Rate limiting applied to all public endpoints (100 req/min per IP)
- [ ] Sensitive data encrypted at rest (AES-256)
- [ ] HTTPS enforced (HTTP redirects to HTTPS)
- [ ] Security headers set (CSP, X-Frame-Options, etc.)
```

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Implementation Details as AC

❌ **Bad:**
```
- [ ] Use React Context API for global state
- [ ] Implement repository pattern for data access
- [ ] Use WebSockets for real-time updates
```

**Why bad:** These are implementation decisions, not acceptance criteria. They constrain the solution unnecessarily.

✅ **Better:**
```
- [ ] User's cart state persists across page refreshes and browser restarts
- [ ] Data access layer supports swapping databases without business logic changes
- [ ] Dashboard updates reflect new data within 2 seconds without page refresh
```

**Why better:** Focuses on outcomes. Implementation approach is flexible.

### Anti-Pattern 2: Overly Broad or Vague

❌ **Bad:**
```
- System should be secure
- Code should be maintainable
- UI should be intuitive
```

**Why bad:** Too subjective. No way to objectively verify.

✅ **Better:**
```
- [ ] System passes OWASP Top 10 security audit (no critical/high findings)
- [ ] Code complexity <10 per function, test coverage >85%
- [ ] New users complete first task in ≤5 minutes (usability test, n≥5)
```

**Why better:** Specific, measurable, testable.

### Anti-Pattern 3: Mixing Business Logic with UI Details

❌ **Bad:**
```
- [ ] Blue button labeled "Submit" in bottom-right corner
- [ ] Error message displays in red Comic Sans font
- [ ] Logo is 100px wide and links to homepage
```

**Why bad:** Conflates visual design with functional requirements.

✅ **Better:**
```
- [ ] Submit button is clearly identifiable and accessible
- [ ] Error messages are visually distinct from normal text
- [ ] Brand logo is present and navigates to homepage when clicked
```

**Why better:** Separates functional requirements from visual design. Design can evolve.

### Anti-Pattern 4: "Should" Language

❌ **Bad:**
```
- System should probably validate input
- Might want to add error handling
- Could use caching for performance
```

**Why bad:** Ambiguous commitment level. Is it required or optional?

✅ **Better:**
```
- [ ] System validates all input against schema before processing
- [ ] System handles all error cases and displays appropriate messages
- [ ] System caches search results for 5 minutes to improve response time
```

**Why better:** Clear, definitive requirements. No ambiguity.

### Anti-Pattern 5: Negative Testing Omitted

❌ **Bad:**
```
Given valid user input
When form is submitted
Then data is saved successfully
```

**Why bad:** Only covers happy path. Real world has errors.

✅ **Better:**
```
**Scenario 1: Valid input**
Given all required fields filled correctly
When form is submitted
Then data saves successfully
And user sees confirmation message

**Scenario 2: Missing required field**
Given email field is empty
When form is submitted
Then validation error displays: "Email is required"
And form is not submitted
And email field is highlighted

**Scenario 3: Invalid format**
Given email field contains "notanemail"
When form is submitted
Then validation error displays: "Please enter a valid email"
And form is not submitted

**Scenario 4: Duplicate entry**
Given user email already exists in database
When form is submitted
Then error displays: "An account with this email already exists"
And user is prompted to login or use different email
```

**Why better:** Covers error cases. Specifies error handling behavior.

### Anti-Pattern 6: No Quantitative Thresholds

❌ **Bad:**
```
- System should be fast
- Should handle many concurrent users
- Should not use too much memory
```

**Why bad:** "Fast", "many", "too much" are subjective.

✅ **Better:**
```
- [ ] API responds in <200ms at p95
- [ ] System handles 1000 concurrent users with <5% error rate
- [ ] Memory usage <512MB per instance
```

**Why better:** Specific thresholds enable objective verification.

---

## Integration with Testing

Acceptance criteria should map directly to tests.

### Mapping AC to Test Types

| AC Type | Test Type | Example |
|---------|-----------|---------|
| Business logic | Unit test | "Calculate discount correctly" |
| User interaction | Integration test | "User can complete checkout" |
| API behavior | API test | "Endpoint returns 200 with valid token" |
| Performance | Load test | "API responds in <200ms at p95" |
| UI rendering | E2E test | "Error message displays on invalid input" |
| Accessibility | Accessibility test | "Tab navigation works for all elements" |

### Test-First Approach

**Step 1: Write AC**
```
Given user cart total is $100
When they apply promo code "SAVE20"
Then discount of $20 is applied
And final total is $80
And order summary shows "Promo: SAVE20 (-$20)"
```

**Step 2: Write Test Before Implementation**
```typescript
test('applies 20% discount with promo code SAVE20', () => {
  const cart = { total: 100 };
  const result = applyPromoCode(cart, 'SAVE20');
  
  expect(result.discount).toBe(20);
  expect(result.finalTotal).toBe(80);
  expect(result.summary).toContain('Promo: SAVE20 (-$20)');
});
```

**Step 3: Implement to Pass Test**
```typescript
function applyPromoCode(cart, code) {
  if (code === 'SAVE20') {
    const discount = cart.total * 0.20;
    return {
      discount,
      finalTotal: cart.total - discount,
      summary: `Promo: ${code} (-$${discount})`
    };
  }
  // ... other codes
}
```

**Step 4: Verify AC Met**
- Run test → passes ✓
- Verify behavior manually → matches AC ✓
- Mark AC as complete ✓

---

## Examples Gallery

### Example 1: E-commerce Checkout

```
## Acceptance Criteria

**Scenario 1: Guest checkout (happy path)**
```
Given a guest user with items in cart
When they complete checkout form (email, shipping, payment)
Then order is created with status "pending_payment"
And they are redirected to Stripe Checkout
And order confirmation email is queued
And cart is cleared after successful payment
```

**Scenario 2: Logged-in user checkout**
```
Given a logged-in user with saved payment method
When they click "Checkout"
Then shipping address pre-fills from account
And saved payment method is pre-selected
And they can complete checkout in 1 click
```

**Scenario 3: Promo code applied**
```
Given user enters promo code "SAVE10"
When they apply the code
Then 10% discount is applied to subtotal
And order summary shows "Promo: SAVE10 (-$X.XX)"
And discount is persisted if user leaves and returns
```

**Scenario 4: Checkout fails - out of stock**
```
Given product goes out of stock during checkout
When user attempts to complete payment
Then error displays "Product X is no longer available"
And product is removed from cart
And user is returned to cart page to review
```

**Additional requirements:**
- [ ] Checkout flow completes in ≤3 steps
- [ ] All form fields validated before payment submission
- [ ] SSL/TLS enforced on checkout pages
- [ ] Checkout page load time <2 seconds
- [ ] Cart persists for 7 days (guest) or indefinitely (logged-in)
```

### Example 2: Admin Dashboard Analytics

```
## Acceptance Criteria

**Data Display:**
- [ ] Dashboard shows key metrics: total users, revenue, orders (last 30 days)
- [ ] Metrics update in real-time (within 5 minutes of event)
- [ ] Dashboard loads in <3 seconds with 1 year of historical data
- [ ] Date range selector allows custom date ranges (last 7/30/90 days, custom)
- [ ] Charts render correctly at all viewport sizes (320px to 4K)

**Export Functionality:**
- [ ] Export button downloads data as CSV
- [ ] CSV includes all visible data with correct formatting
- [ ] Export completes in <10 seconds for 10k rows
- [ ] Filename includes date range (e.g., "analytics_2025-01-01_2025-01-31.csv")

**Permissions:**
- [ ] Only admin users can access dashboard (401 for non-admin)
- [ ] Sensitive data (PII) is redacted for support staff role
- [ ] Access attempts are logged to audit trail

**Performance:**
- [ ] Dashboard queries execute in <500ms at p95
- [ ] Dashboard supports 50 concurrent admin users
- [ ] Charts animate smoothly (60fps) on modern browsers
```

### Example 3: Real-time Chat Application

```
## Acceptance Criteria

**Message Sending:**
```
Given two users in the same chat room
When user A sends a message "Hello"
Then user B receives "Hello" within 1 second
And message displays with sender name and timestamp
And message persists in chat history
```

**Connection Handling:**
```
Given user is connected to chat
When their internet disconnects
Then "Reconnecting..." indicator displays
And messages queue locally
When connection restores within 30 seconds
Then queued messages send automatically
And user sees "Connected" status
```

**Typing Indicators:**
```
Given user A is typing
When they type in message box
Then user B sees "User A is typing..."
And indicator disappears after 3 seconds of no typing
```

**Additional requirements:**
- [ ] Message history loads last 50 messages on room join
- [ ] Scroll to load older messages (infinite scroll)
- [ ] Images/files upload and display inline (max 10MB)
- [ ] Emoji picker available with common emojis
- [ ] Read receipts show "Seen by X users"
- [ ] Notifications trigger for @mentions
```

### Example 4: API Rate Limiting

```
## Acceptance Criteria

**Rate Limit Enforcement:**
- [ ] Public endpoints limited to 100 requests per minute per IP
- [ ] Authenticated endpoints limited to 1000 requests per minute per user
- [ ] Rate limit resets every 60 seconds (sliding window)
- [ ] Exceeding limit returns 429 Too Many Requests
- [ ] Response headers include X-RateLimit-Remaining, X-RateLimit-Reset

**Error Response:**
```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Try again in 45 seconds.",
    "retry_after": 45
  }
}
```

**Bypass for Critical Operations:**
- [ ] Payment endpoints exempt from rate limiting
- [ ] Admin users have 10x higher limits (10,000 req/min)
- [ ] Rate limit bypass configurable per endpoint

**Monitoring:**
- [ ] Rate limit violations logged with IP, user, endpoint
- [ ] Alerts trigger if single IP exceeds limit 10+ times in 1 hour
- [ ] Dashboard shows rate limit metrics (requests, violations, top users)
```

---

## Summary Checklist

When writing acceptance criteria, ensure:

- [ ] **SMART** - Specific, Measurable, Achievable, Relevant, Testable
- [ ] **Outcome-focused** - Specify what, not how
- [ ] **Complete** - Covers happy path, error cases, edge cases
- [ ] **Quantitative** - Uses numbers for performance/quality requirements
- [ ] **Independent** - Each criterion testable separately
- [ ] **Clear language** - Understandable by all stakeholders
- [ ] **Maps to tests** - Each AC becomes a test case
- [ ] **Realistic** - Can be implemented within task scope

---

*Well-crafted acceptance criteria are the foundation of effective task management. They eliminate ambiguity, enable objective verification, and ensure everyone—human and AI—understands what "done" means.*
