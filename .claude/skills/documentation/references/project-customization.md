# Project Customization Guide

This guide helps you adapt the documentation skill to your specific project's needs, conventions, and domain.

---

## Initial Setup Checklist

When introducing this skill to a new project:

- [ ] Review existing documentation structure
- [ ] Identify documentation gaps and duplication
- [ ] Create base directories (`/docs`, `/docs/.tmp`, `/.ai`)
- [ ] Set up CLAUDE.md with project context
- [ ] Create/update memory file (`/.ai/memory.md`)
- [ ] Adapt templates to project conventions
- [ ] Document project-specific patterns
- [ ] Train team on temporary documentation workflow

## Directory Structure Options

### Option 1: Centralized `/docs`

Best for: Monorepo, centralized documentation needs

```
project-root/
├── docs/
│   ├── architecture/
│   ├── api/
│   ├── database/
│   ├── guides/
│   └── .tmp/
├── .ai/
│   ├── memory.md
│   └── instructions/
└── modules/
    └── [module]/
        └── README.md  # Module-specific only
```

### Option 2: Distributed Per-Module

Best for: Microservices, independent modules

```
project-root/
├── modules/
│   ├── module-a/
│   │   ├── docs/
│   │   │   ├── api.md
│   │   │   ├── schema.md
│   │   │   └── .tmp/
│   │   └── README.md
│   └── module-b/
│       ├── docs/
│       └── README.md
├── docs/
│   └── architecture/  # Cross-cutting concerns only
└── .ai/
    └── memory.md
```

### Option 3: Hybrid Approach

Best for: Complex projects with shared and module-specific docs

```
project-root/
├── docs/                    # Cross-cutting documentation
│   ├── architecture/
│   ├── infrastructure/
│   └── .tmp/
├── .ai/
│   └── memory.md
└── modules/
    └── [module]/
        ├── docs/            # Module-specific
        │   ├── api.md
        │   └── .tmp/
        └── README.md
```

Choose based on your project's structure and team workflow.

## CLAUDE.md Customization

### Essential Sections

```markdown
# [Project Name]

## Project Context
- Type: [Web app, API, CLI tool, Library]
- Stack: [Core technologies]
- Architecture: [Monorepo, Microservices, Monolith]

## Quick Commands
# Only the most essential commands
- `[build command]`
- `[test command]`
- `[dev command]`

## Code Conventions
[Project-specific patterns only, not general best practices]

## Important Constraints
[Technical limitations, business rules, performance requirements]

## Common Patterns
[Links to pattern documentation, not full details]
```

### Project-Specific Examples

#### Example 1: Next.js SaaS Project

```markdown
# SaaSCo Platform

## Project Context
- Type: Multi-tenant SaaS web application
- Stack: Next.js 15 App Router, PostgreSQL, TypeScript
- Architecture: Modular monolith with feature modules

## Quick Commands
- `pnpm dev` - Development server (http://localhost:3000)
- `pnpm test` - Run unit tests
- `pnpm db:migrate` - Apply database migrations
- `pnpm build` - Production build

## Code Conventions
- Server Actions: Use 'use server' directive, located in `/actions`
- API Routes: Only for webhooks and external integrations
- Database: Always use org_id for multi-tenancy, RLS enabled
- Imports: Use '@/' alias for project root imports

## Important Constraints
- All user-facing features must respect org-based RLS
- Q-Units must be checked before AI operations
- API rate limits: 100 req/min per org
- Database queries must use indexes (explain plans required)

## Key Modules
- See `/docs/architecture/module-overview.md`
- Auth: `/modules/auth`
- Proposals: `/modules/proposal-builder`
- Billing: `/modules/billing`

## Documentation
- Architecture decisions: `/docs/architecture/`
- API documentation: `/docs/api/`
- Database schemas: `/docs/database/`
```

#### Example 2: Python Data Pipeline

```markdown
# DataFlow ETL Pipeline

## Project Context
- Type: Data processing pipeline
- Stack: Python 3.11, Apache Airflow, PostgreSQL, Spark
- Architecture: DAG-based workflows

## Quick Commands
- `poetry run airflow dags test [dag_id]` - Test DAG
- `poetry run pytest` - Run tests
- `make validate-dags` - Validate all DAGs

## Code Conventions
- DAGs: Located in `/dags`, one file per DAG
- Operators: Custom operators in `/plugins/operators`
- Utils: Shared utilities in `/utils`
- Tests: Mirror structure in `/tests`

## Important Constraints
- DAGs must be idempotent
- All data sources must support incremental loads
- Max memory per task: 8GB
- Execution time: <30 minutes per task

## Data Sources
- See `/docs/data-sources.md` for connection details
- Credentials: Managed via Airflow Variables
```

## Template Customization

### Adapting API Template

If your project uses:

**GraphQL instead of REST**:
```markdown
## [Query/Mutation] [OperationName]

**Type**: Query | Mutation

**Purpose**: [Description]

**GraphQL**:
\`\`\`graphql
query GetUser($id: ID!) {
  user(id: $id) {
    id
    name
    email
  }
}
\`\`\`

**Variables**:
\`\`\`json
{
  "id": "user-123"
}
\`\`\`

**Response**:
\`\`\`json
{
  "data": {
    "user": {
      "id": "user-123",
      "name": "John Doe",
      "email": "john@example.com"
    }
  }
}
\`\`\`
```

**gRPC**:
```markdown
## [ServiceName].[MethodName]

**Purpose**: [Description]

**Proto Definition**:
\`\`\`protobuf
service UserService {
  rpc GetUser (GetUserRequest) returns (UserResponse);
}

message GetUserRequest {
  string user_id = 1;
}

message UserResponse {
  string user_id = 1;
  string name = 2;
  string email = 3;
}
\`\`\`

**Example**:
\`\`\`python
stub = UserServiceStub(channel)
response = stub.GetUser(GetUserRequest(user_id='user-123'))
\`\`\`
```

### Adapting Schema Template

If your project uses:

**MongoDB/NoSQL**:
```markdown
# [Collection] Schema

**Database**: MongoDB  
**Collection**: `collection_name`  
**Last Updated**: YYYY-MM-DD

## Document Structure

\`\`\`javascript
{
  _id: ObjectId,           // MongoDB ID
  orgId: String,           // Organization (required)
  name: String,            // Name (required)
  status: String,          // active|archived|deleted
  metadata: Object,        // Flexible nested object
  createdAt: ISODate,      // Creation timestamp
  updatedAt: ISODate       // Last update timestamp
}
\`\`\`

## Indexes

\`\`\`javascript
db.collection.createIndex({ orgId: 1, status: 1 })
db.collection.createIndex({ createdAt: -1 })
db.collection.createIndex({ "metadata.customField": 1 })
\`\`\`

## Common Queries

\`\`\`javascript
// Find active documents
db.collection.find({ 
  orgId: "org-123",
  status: "active" 
}).sort({ createdAt: -1 })

// Search metadata
db.collection.find({
  "metadata.type": "premium"
})
\`\`\`
```

## Domain-Specific Patterns

### Financial/Accounting Projects

Add to CLAUDE.md:
```markdown
## Financial Rules
- All monetary values stored in cents (integer)
- Currency stored separately (ISO 4217 codes)
- Never use floating point for money calculations
- Always record transactions in audit log
- Immutable records: use soft deletes only

## Compliance
- PCI-DSS compliant: No card data in logs
- SOC 2 requirements: See `/docs/compliance/soc2.md`
- Audit trails: All changes must be traceable
```

### Healthcare Projects

Add to CLAUDE.md:
```markdown
## Healthcare Compliance
- HIPAA compliant: PHI must be encrypted at rest and in transit
- Minimum necessary standard: Only access required PHI
- Audit logging: All PHI access must be logged
- De-identification: Use safe harbor method for analytics

## Data Handling
- PHI stored in separate schema with restricted access
- Use patient_id (anonymized) in analytics schema
- Never log PHI in application logs
```

### E-commerce Projects

Add to CLAUDE.md:
```markdown
## E-commerce Patterns
- Inventory: Always use row-level locking for stock updates
- Pricing: Store original price + active discounts separately
- Orders: Immutable after 15-minute window
- Payment: Idempotency keys required for all payment operations

## State Machines
- Order states: pending → paid → fulfilled → completed
- Returns: requested → approved → received → refunded
- See `/docs/state-machines.md` for full diagrams
```

## Team-Specific Conventions

### Naming Conventions

Document in CLAUDE.md:
```markdown
## Naming Conventions
- Files: kebab-case (`user-profile.tsx`)
- Functions: camelCase (`getUserProfile`)
- Components: PascalCase (`UserProfile`)
- Constants: UPPER_SNAKE_CASE (`MAX_RETRY_COUNT`)
- Database tables: snake_case (`user_profiles`)
- API endpoints: kebab-case (`/api/user-profiles`)
```

### Git Workflow

Document in CLAUDE.md:
```markdown
## Git Workflow
- Branch naming: `feature/description`, `fix/description`, `docs/description`
- Commit format: `type(scope): description` (Conventional Commits)
- PR requirements: Tests passing, 1 approval, no conflicts
- Merge strategy: Squash and merge
```

### Documentation Triggers

When to create specific docs:

```markdown
## Documentation Requirements

**Create ADR when**:
- Technical decision affects >2 modules
- Decision has significant trade-offs
- Team needs alignment

**Update API docs when**:
- Adding/modifying endpoints
- Changing request/response format
- Adding new error codes

**Update schema docs when**:
- Adding/removing tables or columns
- Changing indexes
- Modifying RLS policies

**Create temporary docs when**:
- Task spans >1 day
- Multiple approaches being evaluated
- Complex debugging needed
```

## Project Lifecycle Stages

### New Project Setup

1. **Create structure**:
   ```bash
   mkdir -p docs/{architecture,api,database,guides}
   mkdir -p docs/.tmp
   mkdir -p .ai/instructions
   touch .ai/memory.md CLAUDE.md
   ```

2. **Initial documentation**:
   - Write CLAUDE.md with project context
   - Create ADR-001: Initial architecture decisions
   - Document initial schema
   - Set up CI/CD documentation

3. **Set conventions**:
   - Decide on directory structure (centralized vs distributed)
   - Establish ADR numbering system
   - Define when to use temporary docs

### Mature Project Migration

1. **Audit existing docs**:
   - Identify duplication
   - Find outdated content
   - Note missing documentation

2. **Reorganize**:
   - Move docs to standard structure
   - Create temporary folder for migration work
   - Update all cross-references

3. **Consolidate**:
   - Merge duplicate information
   - Archive obsolete docs
   - Update CLAUDE.md with consolidated structure

4. **Establish workflow**:
   - Document temporary docs workflow in CLAUDE.md
   - Create example temporary doc structure
   - Train team on new patterns

## Maintenance Patterns

### Monthly Review

```markdown
## Documentation Maintenance (Monthly)

- [ ] Review temporary docs older than 30 days
  - Extract valuable insights
  - Archive or delete
- [ ] Update memory.md
  - Archive completed work
  - Update current state
- [ ] Verify cross-references
  - Check for broken links
  - Update moved documents
- [ ] Review ADR statuses
  - Mark superseded ADRs
  - Link to replacements
```

### Quarterly Cleanup

```markdown
## Documentation Cleanup (Quarterly)

- [ ] Archive old temporary docs (>90 days)
- [ ] Review API documentation accuracy
- [ ] Update schema docs for any migrations
- [ ] Consolidate similar guides
- [ ] Update CLAUDE.md with new patterns
- [ ] Review and prune memory.md (keep <500 lines)
```

## Integration with CI/CD

### Documentation Checks

Add to your CI pipeline:

```yaml
# .github/workflows/docs-check.yml
name: Documentation Check

on: [pull_request]

jobs:
  check-docs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      # Check for broken links
      - name: Check documentation links
        run: |
          python scripts/check_links.py docs/
      
      # Validate ADR numbering
      - name: Validate ADR numbers
        run: |
          python scripts/validate_adrs.py docs/architecture/
      
      # Check CLAUDE.md size
      - name: Check CLAUDE.md size
        run: |
          lines=$(wc -l < CLAUDE.md)
          if [ $lines -gt 500 ]; then
            echo "CLAUDE.md is too large ($lines lines, max 500)"
            exit 1
          fi
```

### Auto-Generated Documentation

For auto-generated API docs:

```markdown
## Auto-Generated Documentation

- API docs: Generated from OpenAPI spec, don't edit manually
- Type docs: Generated from TypeScript types, don't edit manually
- Edit source: `/openapi.yaml` or TypeScript source files
- Regenerate: `pnpm docs:generate`
```

## Summary

Customize this skill for your project by:

1. Choose directory structure that fits your architecture
2. Adapt CLAUDE.md to your project's context
3. Customize templates for your tech stack (GraphQL, gRPC, NoSQL, etc.)
4. Add domain-specific patterns (finance, healthcare, e-commerce)
5. Document team conventions (naming, git workflow, documentation triggers)
6. Set up maintenance schedule (monthly reviews, quarterly cleanup)
7. Integrate with CI/CD for documentation validation

Start small: Set up basic structure, create CLAUDE.md, establish temporary docs workflow. Expand as needs emerge.
