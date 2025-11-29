---
name: context7
description: Provides up-to-date, version-specific documentation and code examples for libraries and frameworks using the Context7 MCP. Use when working with external libraries, frameworks, or APIs, especially when needing current documentation for Next.js, React, Supabase, Tailwind, TypeScript, or any other library. Essential for avoiding outdated APIs and hallucinated code. Use whenever code generation, setup steps, or library documentation is needed. (project)
---

# Context7 MCP Usage

Context7 MCP fetches up-to-date documentation and code examples directly from official sources, ensuring accurate and version-specific information for library integrations.

## Core Workflow

Use Context7 in two steps:

1. **Resolve Library ID**: Convert a library name to a Context7-compatible ID
2. **Fetch Documentation**: Retrieve targeted documentation using the resolved ID

### Step 1: Resolve Library ID

Always call `Context7:resolve-library-id` first unless the user provides an explicit library ID in format `/org/project` or `/org/project/version`.

**When to resolve**:
- User mentions a library by name ("Next.js", "Supabase", "React Query")
- Need to find the correct library when multiple matches exist
- Want to discover available versions

**Selection criteria**:
1. Name similarity to query (exact matches prioritized)
2. Description relevance to user's intent
3. Code snippet count (higher = more comprehensive)
4. Trust score (7-10 = more authoritative)

**Example usage**:
```
User: "How do I set up authentication with Supabase?"
Action: Call Context7:resolve-library-id with libraryName: "Supabase"
```

### Step 2: Fetch Documentation

Call `Context7:get-library-docs` with the resolved library ID to retrieve documentation.

**Parameters**:
- `context7CompatibleLibraryID` (required): ID from resolve-library-id or user-provided
- `topic` (optional): Focus on specific feature (e.g., "routing", "authentication")
- `tokens` (optional): Limit response size (default: 5000, min: 5000)

**Best practices**:
- Use `topic` parameter to narrow results and reduce tokens
- Start with default token limit; increase only if needed
- Specify versions when working with older/specific releases

## Token Optimization Strategies

### 1. Use Specific Topics

Narrow documentation retrieval to relevant sections:

```
# Instead of:
get-library-docs(/vercel/next.js)

# Do this:
get-library-docs(/vercel/next.js, topic: "middleware")
```

This reduces token usage by 50-70% by filtering out irrelevant sections.

### 2. Adjust Token Limits

Control documentation size based on query complexity:

- **Simple queries**: 5000 tokens (default)
- **Medium complexity**: 8000-10000 tokens
- **Complex integrations**: 15000+ tokens

**Example**:
```
# For quick reference:
get-library-docs(/supabase/supabase, topic: "auth sign in", tokens: 5000)

# For comprehensive setup:
get-library-docs(/vercel/next.js, topic: "app router", tokens: 12000)
```

### 3. Cache Frequently Used Documentation

For libraries you use repeatedly in a session:
- Store resolved library IDs from first call
- Reference the same documentation without re-fetching
- Only re-fetch when switching topics or needing different sections

### 4. Combine with Direct Library IDs

Skip resolution step when you know the exact library:

```
# User provides: "Use library /vercel/next.js for setup"
# Action: Directly call get-library-docs(/vercel/next.js) - saves one tool call
```

## Common Patterns

### Pattern 1: Quick API Reference

User asks: "How do I make a GET request with Axios?"

```
1. resolve-library-id("axios")
2. get-library-docs(/axios/axios, topic: "get request", tokens: 5000)
3. Provide concise answer with code example
```

### Pattern 2: Framework Setup

User asks: "Set up Next.js 15 with App Router"

```
1. resolve-library-id("Next.js")
2. Select version: /vercel/next.js/v15.0.0 (if v15 specified)
3. get-library-docs(/vercel/next.js/v15.0.0, topic: "getting started app router", tokens: 8000)
4. Provide setup instructions
```

### Pattern 3: Version-Specific Code

User asks: "How did middleware work in Next.js 13?"

```
1. resolve-library-id("Next.js")
2. Note available versions in response
3. get-library-docs(/vercel/next.js/v13.5.6, topic: "middleware", tokens: 6000)
4. Explain version-specific implementation
```

### Pattern 4: Multi-Library Integration

User asks: "Integrate Supabase auth with Next.js"

```
1. resolve-library-id("Next.js") → /vercel/next.js
2. resolve-library-id("Supabase") → /supabase/supabase
3. get-library-docs(/vercel/next.js, topic: "middleware authentication")
4. get-library-docs(/supabase/supabase, topic: "auth client setup")
5. Synthesize integration approach
```

## Advanced Usage

### Working with Specific Versions

When user mentions a version:
```
User: "Show me Tailwind CSS v4 configuration"
1. resolve-library-id("Tailwind CSS")
2. Check available versions in response
3. get-library-docs(/tailwindcss/tailwindcss/v4.0.0, topic: "configuration")
```

### Handling Version Pinning

For projects requiring specific versions:
```
# User specifies: "Use Next.js 14.3.0 for this project"
# Store preference and always use: /vercel/next.js/v14.3.0
```

### Topic Filtering Best Practices

Choose specific, focused topics:

**Good topics**:
- "middleware authentication"
- "server components data fetching"
- "form validation"
- "database connection"

**Avoid vague topics**:
- "usage"
- "docs"
- "setup" (too broad)

## Error Handling

### Rate Limiting

If you encounter rate limit errors:
- Documentation mentions getting an API key at context7.com/dashboard
- Inform user they may need an API key for higher limits
- Continue with available information from previous calls

### Library Not Found

If resolve-library-id returns no matches:
- Verify spelling and try alternative names
- Suggest similar or related libraries from results
- Ask user for clarification on exact library

### Ambiguous Libraries

When multiple libraries match:
- Present top 3-5 options to user
- Include trust scores and snippet counts
- Ask user to specify which library they meant

## When NOT to Use Context7

**Skip Context7 for**:
- Well-established, stable concepts in your training data
- Questions not requiring current API/library specifics
- General programming concepts (algorithms, patterns)
- Basic language syntax (unless library-specific)

**Always use Context7 for**:
- Fast-moving frameworks (Next.js, React, Tailwind)
- Newer library versions (< 1 year old)
- API-specific integration questions
- Version-specific implementation differences

## Best Practices Summary

1. **Always resolve first** (unless explicit ID provided)
2. **Use topic parameter** to reduce token usage
3. **Match token limit to complexity** (5K-15K range)
4. **Prioritize trust score** (7-10) and snippet count (>100)
5. **Specify versions** when relevant to user's context
6. **Cache library IDs** within a conversation
7. **Combine results** from multiple libraries for integrations

## References

For detailed information on:
- Tool parameters and API details: [references/api-reference.md](references/api-reference.md)
- Advanced token optimization: [references/optimization-guide.md](references/optimization-guide.md)
- Common libraries and their IDs: [references/common-libraries.md](references/common-libraries.md)
