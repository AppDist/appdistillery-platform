# Context7 MCP API Reference

Complete reference for Context7 MCP tools and parameters.

## Tools Overview

Context7 MCP provides two tools:

1. **resolve-library-id**: Convert library names to Context7-compatible IDs
2. **get-library-docs**: Fetch documentation for specific libraries

## Tool: resolve-library-id

Resolves a package/product name to a Context7-compatible library ID.

### When to Use

- User mentions a library by name without providing an explicit ID
- Need to find the correct library among multiple matches
- Want to discover available versions
- Unsure of exact library path format

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `libraryName` | string | Yes | Library name to search for (e.g., "Next.js", "Supabase", "React") |

### Response Format

Returns a list of matching libraries with the following information for each:

```
- Title: Library or package name
- Context7-compatible library ID: Format /org/project or /org/project/version
- Description: Short summary of the library
- Code Snippets: Number of available code examples
- Trust Score: Authority indicator (0-10, higher is better)
- Versions: List of available versions (if applicable)
```

### Selection Process

When multiple libraries match, select based on:

1. **Name similarity**: Exact matches prioritized
2. **Description relevance**: How well description matches query intent
3. **Code snippet count**: Higher counts indicate more comprehensive documentation
4. **Trust score**: Scores of 7-10 are more authoritative

### Examples

#### Basic Library Search

```
Input: libraryName: "Next.js"

Output:
- Title: Next.js
- Context7-compatible library ID: /vercel/next.js
- Description: The React Framework for Production
- Code Snippets: 1247
- Trust Score: 9.5
- Versions: v15.1.8, v14.3.0, v13.5.6
```

#### Multiple Matches

```
Input: libraryName: "React Query"

Output includes:
- /tanstack/query (TanStack Query - main library)
- /tanstack/react-query (React Query specific)
- /react-query/react-query (legacy)

Selection: Choose /tanstack/query (highest trust score + most snippets)
```

### Error Handling

**No matches found**:
- Verify spelling
- Try alternative names (e.g., "NextJS" vs "Next.js")
- Suggest related libraries from broader search

**Too many matches**:
- Present top 3-5 options to user
- Include trust scores and snippet counts for comparison
- Ask user to clarify which specific library they need

## Tool: get-library-docs

Fetches up-to-date documentation for a library.

### When to Use

- After resolving library ID with resolve-library-id
- User provides explicit library ID (format: /org/project or /org/project/version)
- Need current, version-specific documentation
- Require code examples for specific features

### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `context7CompatibleLibraryID` | string | Yes | - | Exact ID from resolve-library-id or user-provided (e.g., `/vercel/next.js`) |
| `topic` | string | No | - | Specific topic to focus on (e.g., "routing", "authentication") |
| `tokens` | number | No | 5000 | Maximum tokens to retrieve (minimum 5000) |

### Parameter Details

#### context7CompatibleLibraryID

**Format**: `/org/project` or `/org/project/version`

**Examples**:
- `/vercel/next.js` - Latest version
- `/vercel/next.js/v15.1.8` - Specific version
- `/supabase/supabase` - Latest Supabase
- `/upstash/ratelimit` - Upstash Rate Limit library

**Version specification**:
- Omit version for latest documentation
- Include version for specific release (useful for legacy projects)
- Version format varies by library (check resolve-library-id response)

#### topic

**Purpose**: Filter documentation to relevant sections, reducing token usage.

**Best practices**:
- Be specific: "server components data fetching" vs "data"
- Combine related terms: "middleware authentication"
- Avoid overly broad terms: "setup", "usage", "docs"

**Examples of good topics**:
- "routing" - For navigation/URL handling
- "authentication jwt" - For JWT-based auth
- "database connection pooling" - For database setup
- "form validation" - For form handling
- "api routes" - For API endpoint creation

**Examples of vague topics** (avoid):
- "usage" - Too broad
- "docs" - Not specific
- "help" - Unclear intent

#### tokens

**Purpose**: Control documentation size to balance comprehensiveness with token efficiency.

**Guidelines**:

| Query Type | Recommended Tokens | Example |
|------------|-------------------|---------|
| Quick reference | 5000 (default) | "How do I make a GET request?" |
| Medium complexity | 8000-10000 | "Set up authentication with middleware" |
| Comprehensive setup | 12000-15000 | "Complete Next.js App Router migration guide" |
| Deep integration | 15000+ | "Multi-library integration with custom config" |

**Notes**:
- Values below 5000 are automatically increased to 5000
- Higher values consume more of your context window
- Start with default, increase only if information is insufficient

### Response Format

Returns structured documentation content including:

```
- Formatted markdown text
- Headings and section organization
- Embedded code snippets with syntax
- API usage examples
- Configuration samples
```

### Examples

#### Basic Documentation Request

```
Input:
  context7CompatibleLibraryID: "/vercel/next.js"
  topic: "middleware"
  tokens: 5000

Output: Markdown documentation focused on Next.js middleware including:
- Middleware function structure
- Request/response handling
- Configuration examples
- Common use cases
```

#### Version-Specific Documentation

```
Input:
  context7CompatibleLibraryID: "/vercel/next.js/v13.5.6"
  topic: "app router"
  tokens: 8000

Output: Next.js 13.5.6 specific App Router documentation
```

#### Comprehensive Library Setup

```
Input:
  context7CompatibleLibraryID: "/supabase/supabase"
  tokens: 12000

Output: Comprehensive Supabase documentation including:
- Installation
- Client setup
- Authentication
- Database operations
- Real-time subscriptions
```

### Error Handling

**401 Unauthorized**:
- Indicates API key issues (if using HTTP transport)
- User may need Context7 API key for higher rate limits
- Get key at context7.com/dashboard

**404 Not Found**:
- Library or version doesn't exist
- Verify library ID format
- Check available versions from resolve-library-id

**429 Too Many Requests**:
- Rate limit exceeded
- Response includes `retryAfterSeconds` field
- User may need API key for higher limits
- Inform user about context7.com/dashboard

**500 Internal Server Error**:
- Temporary server issue
- Retry after brief delay
- Report persistent issues to Context7 support

## Tool Call Patterns

### Pattern: Standard Two-Step

```
Step 1: resolve-library-id
  Input: { libraryName: "Supabase" }
  Output: /supabase/supabase

Step 2: get-library-docs
  Input: {
    context7CompatibleLibraryID: "/supabase/supabase",
    topic: "authentication",
    tokens: 6000
  }
  Output: Supabase authentication documentation
```

### Pattern: Skip Resolution

When user provides explicit ID:

```
User says: "Use library /vercel/next.js for this"

Direct call: get-library-docs
  Input: {
    context7CompatibleLibraryID: "/vercel/next.js",
    topic: "app router",
    tokens: 8000
  }
```

### Pattern: Version-Specific

```
User says: "Show me Next.js 14 routing"

Step 1: resolve-library-id
  Input: { libraryName: "Next.js" }
  Note versions: v15.1.8, v14.3.0, v13.5.6

Step 2: get-library-docs
  Input: {
    context7CompatibleLibraryID: "/vercel/next.js/v14.3.0",
    topic: "routing",
    tokens: 7000
  }
```

### Pattern: Multi-Library Integration

```
User says: "Integrate Supabase with Next.js"

Step 1: resolve-library-id (Next.js)
Step 2: resolve-library-id (Supabase)
Step 3: get-library-docs (/vercel/next.js, topic: "api routes database")
Step 4: get-library-docs (/supabase/supabase, topic: "client setup")
Step 5: Synthesize integration approach
```

## Rate Limits and Authentication

### Without API Key

- Lower rate limits
- Suitable for occasional use
- May encounter 429 errors during heavy usage

### With API Key

- Higher rate limits
- Required for production use
- Better performance
- Get key at: https://context7.com/dashboard

### Configuring API Key

For HTTP transport (remote):
```json
{
  "headers": {
    "CONTEXT7_API_KEY": "YOUR_API_KEY"
  }
}
```

For stdio transport (local):
```json
{
  "args": ["-y", "@upstash/context7-mcp", "--api-key", "YOUR_API_KEY"]
}
```

## Best Practices

### Token Efficiency

1. **Always use topic parameter** when possible
2. **Start with 5000 tokens**, increase only if needed
3. **Cache library IDs** within conversation
4. **Reuse documentation** for multiple related questions

### Library Selection

1. **Prioritize high trust scores** (7-10)
2. **Check code snippet count** (>100 for comprehensive docs)
3. **Verify version availability** when working with older projects
4. **Use exact versions** for consistency in production code

### Error Recovery

1. **Handle rate limits** gracefully with user communication
2. **Retry with alternative names** if library not found
3. **Present options** when multiple libraries match
4. **Inform users** about API key benefits when hitting limits

## Common Library IDs

Quick reference for frequently used libraries:

| Library | ID | Trust Score |
|---------|-------|-------------|
| Next.js | /vercel/next.js | 9.5 |
| React | /facebook/react | 10 |
| Supabase | /supabase/supabase | 9.0 |
| Tailwind CSS | /tailwindcss/tailwindcss | 9.8 |
| Prisma | /prisma/prisma | 9.2 |
| TypeScript | /microsoft/typescript | 10 |
| Zod | /colinhacks/zod | 8.5 |
| TanStack Query | /tanstack/query | 9.0 |
| shadcn/ui | /shadcn-ui/ui | 8.8 |

Note: Always use resolve-library-id to confirm current IDs and available versions.
