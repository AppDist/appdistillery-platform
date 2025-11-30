---
id: TASK-2-04
title: Agency pipeline & integration
priority: P2-Medium
complexity: 3
module: agency
status: BACKLOG
type: EPIC
created: 2024-11-30
---

# TASK-2-04: Agency pipeline & integration

## Description

Create the Agency module pipeline view and integrate with Core module registry.

## Epic Overview

This epic covers pipeline visualization and module integration. Will be decomposed into sub-tasks when Phase 2 begins.

## Sub-tasks (to be created)

- [ ] Pipeline/Kanban view for leads
- [ ] Lead status workflow (new → scoped → proposed → won/lost)
- [ ] Module manifest definition
- [ ] Module installation in org_modules
- [ ] Navigation integration (sidebar)
- [ ] Agency routes configuration

## Acceptance Criteria (Epic Level)

- [ ] Pipeline displays all leads in columns by status
- [ ] Drag-and-drop to change status
- [ ] Module manifest registers with Core
- [ ] Agency appears in org sidebar when enabled
- [ ] Routes under /agency/* work

## Technical Notes

Pipeline and integration:

```typescript
// Pipeline View
export function Pipeline({ orgId }: { orgId: string }) {
  const leads = await getLeadsByStatus(orgId)

  return (
    <div className="flex gap-4 overflow-x-auto">
      {STATUSES.map(status => (
        <Column key={status} status={status}>
          {leads[status].map(lead => (
            <LeadCard key={lead.id} lead={lead} />
          ))}
        </Column>
      ))}
    </div>
  )
}

// Module Manifest
export const agencyManifest: ModuleManifest = {
  id: 'agency',
  name: 'Agency',
  description: 'Consultancy proposal generator',
  version: '1.0.0',
  routes: [
    { path: '/agency', icon: 'Briefcase', label: 'Pipeline' },
    { path: '/agency/leads', icon: 'Users', label: 'Leads' },
    { path: '/agency/proposals', icon: 'FileText', label: 'Proposals' },
  ],
  usageActions: [
    'agency:scope:generate',
    'agency:proposal:generate',
  ],
}
```

### Navigation Integration

```typescript
// Sidebar reads installed modules
async function Sidebar({ orgId }: { orgId: string }) {
  const modules = await getInstalledModules(orgId)

  return (
    <nav>
      {/* Core routes */}
      <NavLink href="/dashboard">Dashboard</NavLink>
      <NavLink href="/usage">Usage</NavLink>

      {/* Module routes */}
      {modules.map(mod => (
        <div key={mod.id}>
          {mod.routes.map(route => (
            <NavLink key={route.path} href={route.path}>
              <Icon name={route.icon} />
              {route.label}
            </NavLink>
          ))}
        </div>
      ))}
    </nav>
  )
}
```

### Patterns to Follow

- Module manifest in modules/agency/manifest.ts
- Routes registered dynamically from manifest
- Pipeline uses optimistic updates for drag-drop
- Sidebar reads from org_modules

## Dependencies

- **Blocked by**: TASK-1-06 (Module helpers), TASK-2-03 (UI components)
- **Blocks**: None (completes Agency module)

## Progress Log

| Date | Update |
|------|--------|
| 2024-11-30 | Epic created - will decompose when starting Phase 2 |
