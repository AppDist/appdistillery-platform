# Context7 MCP Optimization Guide

Advanced strategies for maximizing Context7 MCP efficiency while minimizing token usage and maintaining high-quality results.

## Token Optimization Fundamentals

### Understanding Token Costs

Context7 MCP has three token cost points:

1. **Tool metadata**: Loaded at session start (~100-200 tokens)
2. **Tool responses**: Variable based on parameters
3. **Documentation content**: Actual docs fetched (controlled by `tokens` parameter)

**Key insight**: Only the documentation content (point 3) is user-controllable through optimization.

### Cost-Benefit Analysis

| Strategy | Token Savings | Quality Impact | When to Use |
|----------|---------------|----------------|-------------|
| Specific topics | 50-70% | None (improves focus) | Always when topic is known |
| Lower token limits | 20-60% | May miss details | Simple queries only |
| Skip resolution | ~500 tokens | None | When ID is known |
| Cache IDs | ~500 per reuse | None | Multi-query sessions |

## Advanced Topic Optimization

### Topic Specificity Spectrum

**Most Specific** (best token efficiency):
```
"server components data fetching with cache revalidation"
"middleware authentication jwt verification"
"database connection pooling postgres"
```

**Moderately Specific** (good token efficiency):
```
"server components"
"middleware auth"
"database setup"
```

**Too Vague** (poor token efficiency):
```
"usage"
"setup"
"docs"
```

### Multi-Topic Queries

For complex queries spanning multiple topics, make separate calls:

```
# Instead of one broad call:
get-library-docs(/vercel/next.js, tokens: 15000)

# Do multiple focused calls:
get-library-docs(/vercel/next.js, topic: "routing", tokens: 5000)
get-library-docs(/vercel/next.js, topic: "data fetching", tokens: 5000)
get-library-docs(/vercel/next.js, topic: "api routes", tokens: 5000)

Total tokens: 15000 (same)
Quality: Higher (more focused, less noise)
```

### Topic Keyword Selection

**Effective keywords**:
- Feature names: "routing", "authentication", "caching"
- Action verbs: "fetching", "validation", "rendering"
- Technology terms: "jwt", "oauth", "postgres", "redis"
- Architecture terms: "middleware", "components", "hooks"

**Ineffective keywords**:
- Meta terms: "documentation", "guide", "tutorial"
- Question words: "how", "what", "when"
- Generic terms: "basic", "advanced", "best"

## Token Limit Strategies

### Query Complexity Matrix

| Complexity | Characteristics | Recommended Tokens | Example |
|------------|----------------|-------------------|---------|
| **Simple** | Single API call, known pattern | 5000 | "How to make a GET request?" |
| **Medium** | Multiple APIs, standard setup | 7000-9000 | "Set up authentication middleware" |
| **Complex** | Integration, custom config | 10000-12000 | "Integrate multiple auth providers" |
| **Comprehensive** | Full feature implementation | 13000-15000 | "Complete e-commerce checkout flow" |

### Progressive Token Loading

Start small, expand as needed:

```
Iteration 1: 5000 tokens
  - Provides overview and basic examples
  - Sufficient for 70% of queries

Iteration 2 (if needed): 8000 tokens
  - Adds advanced examples
  - Covers edge cases

Iteration 3 (rarely): 12000+ tokens
  - Comprehensive documentation
  - Multiple integration patterns
```

### Token Budget Management

For conversations with multiple library lookups:

```
Total context budget: 200k tokens
Reserved for conversation: 50k tokens
Available for documentation: 150k tokens

Example allocation:
- Next.js routing: 8k tokens
- Supabase auth: 6k tokens
- Tailwind styling: 5k tokens
- Type definitions: 4k tokens
Total used: 23k (well within budget)
```

## Caching and Reuse Strategies

### Library ID Caching

Within a single conversation:

```
First mention: "Next.js"
Action: resolve-library-id("Next.js") → /vercel/next.js
Cache: store mapping "Next.js" → "/vercel/next.js"

Subsequent mentions: "Next.js"
Action: Use cached /vercel/next.js (no resolution needed)
Savings: ~500 tokens per reuse
```

### Documentation Reuse

For related questions about same topic:

```
Question 1: "How do I create Next.js middleware?"
Action: get-library-docs(/vercel/next.js, topic: "middleware", tokens: 6000)

Question 2: "Can I redirect in middleware?"
Action: Refer to previously fetched middleware docs
No additional call needed

Question 3: "How do I set middleware headers?"
Action: May need additional fetch with topic: "middleware headers"
```

### Session-Level Patterns

Identify recurring libraries early:

```
User mentions multiple Next.js questions
Strategy:
1. Resolve Next.js ID once
2. Fetch comprehensive docs (10k tokens) upfront
3. Answer multiple questions from cached docs
4. Only fetch new topics when needed
```

## Multi-Library Optimization

### Sequential vs Parallel Fetching

**Sequential** (better for related topics):
```
1. Fetch Next.js middleware docs
2. Read and understand context
3. Fetch Supabase auth docs
4. Synthesize integration

Advantage: Can tailor second fetch based on first
```

**Parallel** (better for independent topics):
```
1. Fetch Next.js docs
2. Fetch Supabase docs (simultaneously)
3. Combine information

Advantage: Faster if libraries are independent
```

### Integration-Focused Topics

When combining libraries:

```
# Good: Integration-focused topics
Next.js: topic "middleware authentication"
Supabase: topic "client setup browser"

# Less efficient: Generic topics
Next.js: topic "middleware"
Supabase: topic "getting started"
```

## Performance Patterns

### Quick Reference Pattern

**Use case**: User needs single API method or function

```
Strategy:
- resolve-library-id (if needed)
- get-library-docs with specific topic, 5000 tokens
- Extract relevant method, provide answer

Token cost: ~5500 total
Time: 1-2 tool calls
```

### Framework Setup Pattern

**Use case**: User setting up new project with framework

```
Strategy:
- Resolve library ID with version check
- get-library-docs with "getting started" topic, 9000 tokens
- Follow-up calls for specific features as needed

Token cost: ~10000 initial, +5000 per feature
Time: 2-4 tool calls
```

### Deep Integration Pattern

**Use case**: Complex multi-library integration

```
Strategy:
- Resolve all library IDs upfront
- Fetch targeted docs for each (topic-specific)
- Combine documentation intelligently
- Only re-fetch if integration gaps appear

Token cost: ~25000-35000 total
Time: 4-8 tool calls
```

## Version-Specific Optimization

### Latest Version Strategy

Default approach:
```
Use /org/project (no version)
Advantages:
- Always current
- Fewer tokens in ID
- Simpler maintenance
```

### Pinned Version Strategy

For production code:
```
Use /org/project/v1.2.3
Advantages:
- Guaranteed consistency
- Version-specific examples
- Reproducible builds

Trade-off:
- Slightly longer IDs
- Must track versions
```

### Version Comparison

Efficient way to compare versions:

```
Question: "What changed in Next.js 15?"

Strategy:
1. get-library-docs(/vercel/next.js/v14.3.0, topic: "breaking changes", tokens: 6000)
2. get-library-docs(/vercel/next.js/v15.0.0, topic: "new features", tokens: 6000)
3. Synthesize differences

Total: 12000 tokens (vs 25000+ for full docs)
```

## Error Recovery Optimization

### Rate Limit Management

When hitting rate limits:

```
Immediate action:
1. Note the retryAfterSeconds from error
2. Inform user about temporary limit
3. Use information from previous successful calls

Proactive measures:
1. Inform user about API key option (context7.com/dashboard)
2. Adjust token limits downward for remaining queries
3. Prioritize most important documentation fetches
```

### Failed Resolution Recovery

If library not found:

```
Optimization:
1. Try common variations (Next.js → nextjs → next)
2. Search broader term (Next.js → React framework)
3. Present alternatives from search results
4. Avoid repeated failed attempts
```

## Monitoring and Metrics

### Track Token Usage

Monitor within conversation:

```
Running total:
- Tool calls made: 5
- Total tokens used: 28,000
- Average per call: 5,600
- Context remaining: 172,000

Optimization check:
- Are calls focused? (topic parameter used)
- Are token limits appropriate? (not always max)
- Is information being reused? (cache hits)
```

### Quality vs Efficiency Balance

Find the sweet spot:

```
Under-optimized:
- Fetching full docs every time
- No topic filtering
- Always maximum tokens
→ Wastes context window

Over-optimized:
- Token limits too low
- Topics too narrow
- Missing essential information
→ Requires multiple fetch rounds

Optimal:
- Topic-specific fetches
- Appropriate token limits
- Strategic caching
→ Balanced efficiency and quality
```

## Best Practices Checklist

### Before Each Tool Call

- [ ] Is library ID already cached? (reuse if possible)
- [ ] Can I specify a topic? (always if known)
- [ ] What's the appropriate token limit? (match complexity)
- [ ] Do I need a specific version? (use if specified by user)

### During Conversation

- [ ] Track which libraries have been resolved
- [ ] Note which documentation has been fetched
- [ ] Reuse information before fetching again
- [ ] Monitor total token usage

### Optimization Priorities

1. **Always use topic parameter** (highest impact)
2. **Match token limit to query** (medium-high impact)
3. **Cache library IDs** (medium impact)
4. **Reuse documentation** (medium impact)
5. **Skip resolution when possible** (low-medium impact)

## Anti-Patterns to Avoid

### ❌ Always Fetching Full Documentation

```
# Wasteful:
get-library-docs(/vercel/next.js, tokens: 15000)
# For every single question

# Efficient:
get-library-docs(/vercel/next.js, topic: "specific feature", tokens: 6000)
```

### ❌ Ignoring Topic Parameter

```
# Wasteful:
get-library-docs(/supabase/supabase, tokens: 10000)
# Returns everything, user only needs auth

# Efficient:
get-library-docs(/supabase/supabase, topic: "authentication", tokens: 5000)
```

### ❌ Re-resolving Known Libraries

```
# Wasteful:
User mentions "Next.js" 5 times
You call resolve-library-id 5 times

# Efficient:
Resolve once, cache ID, reuse
```

### ❌ Fetching When Answer is Known

```
# Wasteful:
User: "Does Next.js support TypeScript?"
Action: Fetch Next.js docs

# Efficient:
Answer from training data: "Yes, Next.js has built-in TypeScript support"
Only fetch docs if user needs specific configuration
```

## Real-World Optimization Examples

### Example 1: Authentication Setup

```
User: "Set up Supabase authentication in Next.js"

Optimized approach:
1. resolve-library-id("Next.js") → cache ID
2. resolve-library-id("Supabase") → cache ID
3. get-library-docs(/vercel/next.js, topic: "middleware auth", tokens: 6000)
4. get-library-docs(/supabase/supabase, topic: "auth client setup", tokens: 6000)

Total: 12000 tokens, 4 tool calls
```

### Example 2: Multiple Related Questions

```
User asks 3 questions about Next.js routing:
1. "How do I create dynamic routes?"
2. "Can I have nested routes?"
3. "How do I redirect in routes?"

Optimized approach:
1. First question: get-library-docs(/vercel/next.js, topic: "routing", tokens: 8000)
2. Second question: Answer from cached docs
3. Third question: Answer from cached docs

Total: 8000 tokens, 1 tool call (vs 3 separate calls)
```

### Example 3: Framework Comparison

```
User: "Compare Next.js and Remix for SSR"

Optimized approach:
1. get-library-docs(/vercel/next.js, topic: "server rendering", tokens: 6000)
2. get-library-docs(/remix-run/remix, topic: "server rendering", tokens: 6000)
3. Synthesize comparison

Total: 12000 tokens (focused comparison)
vs: 30000+ tokens (full documentation)
```

## Summary

Key optimization principles:

1. **Specificity over breadth**: Use topics to narrow focus
2. **Appropriate sizing**: Match token limits to query complexity
3. **Smart caching**: Reuse library IDs and documentation
4. **Strategic fetching**: Only fetch what's needed, when needed
5. **Continuous monitoring**: Track usage and adjust approach

Master these techniques to maximize Context7 MCP value while maintaining efficient token usage.
