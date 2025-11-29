# Architecture Decision Record (ADR) Template

Use this template when documenting significant architectural decisions. Keep ADRs focused and concise.

---

## Template Structure

```markdown
# ADR-[NNN]: [Decision Title]

**Status**: [Proposed | Accepted | Deprecated | Superseded by ADR-###]  
**Date**: YYYY-MM-DD  
**Deciders**: [Name(s) or role(s)]

## Context

[2-3 paragraphs describing the problem, constraints, and forces at play]

Key questions to answer:
- What problem are we solving?
- What constraints exist? (technical, business, time)
- What forces are in tension? (speed vs quality, simplicity vs flexibility)
- What's the current situation and its limitations?

## Decision

[Clear, one-sentence statement of the decision]

We will [specific decision].

[1-2 paragraphs elaborating on the decision with key implementation details]

## Rationale

[Why this decision was made]

**Benefits**:
- [Specific benefit with reasoning]
- [Specific benefit with reasoning]

**Trade-offs**:
- [What we're giving up or accepting]

## Consequences

### Positive
- [Positive outcome]
- [Positive outcome]

### Negative
- [Trade-off or limitation]
- [Trade-off or limitation]

### Neutral
- [Change that's neither clearly positive nor negative]

## Alternatives Considered

### Alternative 1: [Name]

[Brief description]

**Pros**:
- [Advantage]

**Cons**:
- [Disadvantage]

**Why rejected**: [Specific reason]

### Alternative 2: [Name]

[Similar structure]

## Implementation

[Optional: Implementation plan or migration path if needed]

## References

- [Link to related ADRs]
- [Link to technical documentation]
- [Link to discussions or RFCs]
```

---

## Example: Real ADR

### ADR-042: Use PostgreSQL JSONB for Flexible Metadata

**Status**: Accepted  
**Date**: 2025-01-15  
**Deciders**: Backend Team Lead, CTO

## Context

Our modules need to store varying metadata for different entity types. Currently, we create new columns for each metadata field, leading to:

1. **Schema bloat**: The `proposals` table has 47 columns, many sparsely populated
2. **Migration friction**: Each new metadata field requires a migration
3. **Flexibility limitations**: Partners can't extend entities with custom fields
4. **Query complexity**: Filtering on metadata requires complex joins

We've seen similar patterns across 5 modules (proposals, invoices, clients, projects, tasks). The problem is systemic, not isolated.

Technical constraints:
- Must support efficient querying of metadata
- Must maintain data integrity
- Must work with our existing RLS (Row-Level Security) setup
- Performance cannot degrade for common queries

## Decision

We will use PostgreSQL JSONB columns for flexible metadata storage.

Each entity table will have a standardized `metadata` JSONB column for optional fields, while keeping frequently-queried fields as regular columns. We'll use GIN indexes on JSONB columns for query performance and JSON Schema validation at the application layer.

## Rationale

**Benefits**:
- **Schema flexibility**: Add metadata fields without migrations
- **Partner extensibility**: Partners can add custom fields
- **Reduced complexity**: Fewer columns = simpler schema
- **Performance**: JSONB with GIN indexes performs well for our query patterns
- **Type safety**: JSON Schema validation catches issues at runtime

**Trade-offs**:
- Slightly slower queries on JSONB vs. regular columns (~10-20% for indexed queries)
- Less type safety at database level (mitigated by application-layer validation)
- More complex queries (JSONB operators vs. simple column references)

**Technical reasoning**:

PostgreSQL's JSONB offers:
- Efficient binary storage (not stored as text)
- GIN indexing for fast querying
- Rich query operators (`->>`, `@>`, `?`, etc.)
- Partial indexes for specific keys

Our benchmarks show:
- JSONB indexed query: ~15ms
- Regular column query: ~12ms
- Trade-off acceptable for flexibility gained

## Consequences

### Positive
- Schema migrations reduced by ~70% (measured over last 6 months)
- Partner custom fields now supported without schema changes
- Database backup size reduced by 25% (fewer sparse columns)
- Query debugging easier (fewer JOINs)

### Negative
- JSONB queries slightly slower than regular columns
- Developers must learn JSONB operators
- JSON Schema validation adds application complexity
- Migration path required for existing data

### Neutral
- Database-level type checking moves to application layer
- ORM queries become more complex for metadata fields

## Alternatives Considered

### Alternative 1: EAV (Entity-Attribute-Value) Pattern

Use separate tables for metadata: `entity_metadata(entity_id, key, value)`

**Pros**:
- Fully normalized
- Strong type safety per attribute
- Works with any database

**Cons**:
- Requires complex JOINs for every query
- Terrible query performance (measured 10x slower)
- Schema still needs updates for new attribute types
- ORM integration difficult

**Why rejected**: Performance unacceptable, complexity outweighs benefits.

### Alternative 2: NoSQL Database (MongoDB)

Use MongoDB for entities needing flexible schemas.

**Pros**:
- Native flexible schema support
- No JSONB overhead
- Horizontal scaling

**Cons**:
- Adds another database to maintain
- No ACID transactions across Postgres + Mongo
- Team lacks MongoDB expertise
- RLS patterns don't translate
- Increased infrastructure cost

**Why rejected**: Too much complexity, doesn't solve core problem elegantly.

### Alternative 3: Keep Current Approach

Continue adding columns as needed.

**Pros**:
- No changes required
- Full type safety
- Best query performance

**Cons**:
- Schema bloat continues
- Migration friction remains
- Partner extensibility impossible
- Maintenance burden increasing

**Why rejected**: Problem is getting worse, not better.

## Implementation

### Phase 1: New Tables
- All new entity tables use `metadata JSONB` from the start
- Create JSON Schema definitions for validation
- Update ORM models and types

### Phase 2: Existing Tables
- Add `metadata` column to existing tables
- Migrate sparse columns to JSONB (low-priority fields)
- Keep high-frequency query fields as regular columns
- Create GIN indexes: `CREATE INDEX idx_proposals_metadata ON proposals USING GIN (metadata);`

### Phase 3: Application Layer
- Implement JSON Schema validation
- Update API documentation
- Create helper functions for JSONB queries
- Update TypeScript types

### Migration Example
```sql
-- Add metadata column
ALTER TABLE proposals ADD COLUMN metadata JSONB DEFAULT '{}';

-- Migrate sparse columns to JSONB
UPDATE proposals SET metadata = jsonb_build_object(
  'customField1', custom_field_1,
  'customField2', custom_field_2
);

-- Create GIN index
CREATE INDEX idx_proposals_metadata ON proposals USING GIN (metadata);

-- Drop old columns after validation
ALTER TABLE proposals DROP COLUMN custom_field_1, DROP COLUMN custom_field_2;
```

### Rollback Plan
If performance issues arise:
1. Keep old columns alongside JSONB during migration
2. Monitor query performance metrics
3. Rollback by dropping JSONB column if needed (within 30 days)

## References

- [PostgreSQL JSONB Documentation](https://www.postgresql.org/docs/current/datatype-json.html)
- [JSON Schema Validation Library](link)
- Related: ADR-028 (Database Schema Evolution)
- Discussion: [Slack thread link]
```

---

## ADR Numbering

### Sequential Numbering

Use sequential numbering: ADR-001, ADR-002, etc.

- Keep a master list in `/docs/architecture/README.md`
- Include status in the list (Proposed, Accepted, Deprecated)

Example list:
```markdown
# Architecture Decision Records

| # | Title | Status | Date |
|---|-------|--------|------|
| 001 | Use Monorepo Structure | Accepted | 2024-01-10 |
| 002 | PostgreSQL for Primary Database | Accepted | 2024-01-15 |
| 003 | Redis for Caching | Superseded by 028 | 2024-02-01 |
| ... | ... | ... | ... |
| 042 | Use JSONB for Metadata | Accepted | 2025-01-15 |
```

## When to Write an ADR

Write an ADR when:
- Decision affects system architecture
- Decision is difficult to reverse
- Decision has significant trade-offs
- Team needs alignment on approach
- Future developers need context

**Don't write an ADR for**:
- Routine implementation choices
- Obvious decisions with no alternatives
- Temporary solutions (document in code comments instead)
- Decisions easily reversible

## ADR Lifecycle

### Proposed
- Initial draft
- Under discussion
- Not yet implemented

### Accepted
- Team agrees
- Implementation underway or complete
- Default state for most ADRs

### Deprecated
- No longer recommended
- Better approach found
- Link to newer ADR if applicable

### Superseded
- Replaced by newer ADR
- Explicitly reference replacement

## Context Efficiency Tips

### Keep It Focused

- One decision per ADR
- 500-1000 words typical
- Reference other docs instead of duplicating

### Use Cross-References

Instead of:
```markdown
As mentioned in ADR-028, we use PostgreSQL...
[Copy entire ADR-028 content here]
```

Do:
```markdown
See ADR-028 for database selection rationale. This builds on that decision by...
```

### Avoid Over-Documentation

- Don't document obvious choices
- Don't include implementation details better suited for code comments
- Don't duplicate information from other documentation

### Regular Review

- Archive old ADRs that are no longer relevant
- Update status field when superseded
- Link to replacement ADRs
