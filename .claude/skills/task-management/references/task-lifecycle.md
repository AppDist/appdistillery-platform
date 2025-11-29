# Task Lifecycle Management

This guide covers task state management, transitions, and best practices for maintaining task health throughout their lifecycle.

## State Definitions

### TODO
**Description:** Task is ready to start. All blockers resolved, requirements clear.

**Entry criteria:**
- [ ] Specification complete with clear acceptance criteria
- [ ] All blocking dependencies resolved
- [ ] Resources/context available
- [ ] Priority assigned
- [ ] Complexity estimated

**Indicators:**
- Task appears in backlog or sprint planning
- No active work has started
- Can be picked up immediately

**Best practices:**
- Prioritize within TODO based on value and dependencies
- Keep TODO list manageable (< 20 tasks per person/agent)
- Review TODO tasks regularly to ensure relevance

---

### IN_PROGRESS
**Description:** Active work is happening on this task.

**Entry criteria:**
- [ ] Task assigned to person/agent
- [ ] Work has actually started (not just planned)
- [ ] Workspace/environment ready

**Indicators:**
- Task appears on active work board
- Code changes in progress or discussion ongoing
- Regular updates being made

**Best practices:**
- Limit WIP (work in progress) to maintain focus
- Update status regularly (at least daily)
- Flag blockers immediately, don't let tasks stall
- Move to BLOCKED if stuck >24 hours

**Transition to BLOCKED:**
If you encounter:
- Missing information or unclear requirements
- Dependency not actually ready
- Technical blocker (infrastructure, access, etc.)
- Waiting for decision or approval

**DO:** Move to BLOCKED immediately and document the blocker
**DON'T:** Leave in IN_PROGRESS when no progress is happening

---

### BLOCKED
**Description:** Cannot proceed due to external dependency or issue.

**Entry criteria:**
- [ ] Specific blocker identified and documented
- [ ] Blocker is external (not within implementer's control)
- [ ] ETA for resolution known (if possible)

**Blocker documentation:**
```markdown
## Task: [Title]
**Status:** BLOCKED
**Blocker:** [Specific issue preventing progress]
**Blocked since:** YYYY-MM-DD
**Expected resolution:** YYYY-MM-DD (or "Unknown")
**Unblocking action:** [What needs to happen]
**Blocked by:** [Person/team/task that can unblock]
```

**Common blockers:**
- Waiting for another task to complete (BLOCKED BY: TASK-XXX)
- Waiting for decision or approval
- Missing access/credentials/infrastructure
- External dependency (third-party API, vendor)
- Unclear requirements (needs clarification)

**Best practices:**
- Document blocker immediately when identified
- Create unblocking task if needed
- Notify relevant parties
- Switch to other work while blocked
- Review blocked tasks daily

**Transition back to TODO/IN_PROGRESS:**
- Once blocker is resolved, update status immediately
- Add notes about resolution
- Resume work or re-assign if needed

---

### REVIEW
**Description:** Implementation complete, awaiting approval/verification.

**Entry criteria:**
- [ ] All acceptance criteria met (self-verified)
- [ ] All tests passing
- [ ] Code/work reviewed internally (if applicable)
- [ ] Documentation updated
- [ ] Ready for final approval/sign-off

**Review checklist:**
```markdown
### Pre-Review Checklist
- [ ] All acceptance criteria met
- [ ] Tests written and passing (unit + integration)
- [ ] Code linted and formatted
- [ ] No obvious bugs or issues
- [ ] Documentation updated
- [ ] Manual verification completed
- [ ] Performance acceptable
- [ ] Security considerations addressed
```

**Review types:**
- **Code review:** Peer review of code changes
- **QA review:** Testing team verification
- **Product review:** Product owner acceptance
- **Security review:** Security team approval (for sensitive changes)
- **Performance review:** Load testing verification

**Best practices:**
- Include review checklist in task description
- Tag reviewers explicitly
- Provide context for reviewers (what changed, why, how to test)
- Respond to feedback promptly
- Don't let tasks sit in REVIEW >48 hours

**Transition to DONE:**
- All reviewers approved
- All feedback addressed
- Final verification complete
- Deployed (if applicable)

**Transition to TODO:**
- Review identified issues requiring rework
- Changes requested that need significant work
- Acceptance criteria not met

---

### DONE
**Description:** Task complete, verified, and closed.

**Entry criteria:**
- [ ] All acceptance criteria met and verified
- [ ] All reviews/approvals complete
- [ ] Tests passing in production (if applicable)
- [ ] Deployed and monitored (if applicable)
- [ ] Documentation complete
- [ ] No outstanding issues

**Completion checklist:**
```markdown
### Definition of Done
- [ ] All acceptance criteria met
- [ ] Code reviewed and approved
- [ ] Tests passing (unit, integration, E2E)
- [ ] Documentation updated
- [ ] Deployed to production (if applicable)
- [ ] Monitoring confirms success
- [ ] Stakeholders notified
- [ ] Task moved to completed archive
```

**Best practices:**
- Archive completed tasks to `tasks/completed/`
- Update task index with completion date
- Add lessons learned or notes for future reference
- Celebrate wins! 🎉

**Post-completion:**
- Monitor for issues in production
- Address feedback if issues arise
- Reference completed tasks for similar future work

---

## State Transitions

### Allowed Transitions

```
TODO → IN_PROGRESS
     ↓
IN_PROGRESS → BLOCKED → TODO (after unblocked)
            ↓
IN_PROGRESS → REVIEW
            ↓
REVIEW → TODO (needs rework)
       ↓
REVIEW → DONE
       ↓
DONE (final state)
```

### Forbidden Transitions

❌ **TODO → DONE** (skipping work and review)
❌ **IN_PROGRESS → DONE** (skipping review)
❌ **BLOCKED → DONE** (blocker not resolved)
❌ **DONE → IN_PROGRESS** (reopening completed work)

**Exception:** If a completed task needs significant rework, create a new task instead of reopening.

---

## Transition Best Practices

### TODO → IN_PROGRESS
**When:** Starting active work

**Actions:**
1. Assign to yourself/agent
2. Update status to IN_PROGRESS
3. Add start date
4. Review acceptance criteria one more time
5. Set up workspace/environment

**Checklist:**
- [ ] Acceptance criteria clear
- [ ] No unresolved blockers
- [ ] Have all necessary access/resources

### IN_PROGRESS → BLOCKED
**When:** Encounter external blocker

**Actions:**
1. Document specific blocker
2. Update status to BLOCKED
3. Add blocked date
4. Notify relevant parties
5. Create unblocking task if needed
6. Switch to other work

**Checklist:**
- [ ] Blocker clearly documented
- [ ] Unblocking action identified
- [ ] Responsible party notified

### IN_PROGRESS → REVIEW
**When:** Implementation complete

**Actions:**
1. Self-verify all acceptance criteria
2. Run all tests
3. Update documentation
4. Add review notes/context
5. Update status to REVIEW
6. Tag reviewers

**Checklist:**
- [ ] All acceptance criteria met (self-verified)
- [ ] All tests passing
- [ ] Code linted and formatted
- [ ] Documentation updated
- [ ] Ready for external review

### REVIEW → TODO
**When:** Review identifies issues

**Actions:**
1. Document feedback clearly
2. Update task with required changes
3. Update status to TODO
4. Prioritize rework
5. Address feedback systematically

**Checklist:**
- [ ] All feedback documented
- [ ] Required changes clear
- [ ] Priority adjusted if needed

### REVIEW → DONE
**When:** All reviews pass

**Actions:**
1. Verify all approvals received
2. Deploy if applicable
3. Update documentation
4. Notify stakeholders
5. Move to completed archive
6. Update task index

**Checklist:**
- [ ] All reviews approved
- [ ] Deployed (if applicable)
- [ ] Stakeholders notified
- [ ] Archived properly

---

## Task Health Indicators

### Healthy Task
✅ Clear acceptance criteria
✅ Active progress (updated in last 24 hours)
✅ No blockers or blockers being actively resolved
✅ Estimated completion date realistic
✅ Tests passing

### At-Risk Task
⚠️ No updates in 48+ hours
⚠️ Multiple transitions between states
⚠️ Acceptance criteria changing frequently
⚠️ Blocked >5 days without resolution plan
⚠️ Growing scope during implementation

### Unhealthy Task
🚨 No updates in 7+ days
🚨 Unclear or missing acceptance criteria
🚨 Blocked indefinitely with no plan
🚨 Significant scope creep
🚨 Multiple failed reviews

**Action for unhealthy tasks:**
1. Stop work immediately
2. Review with team/lead
3. Re-scope or split if needed
4. Re-write acceptance criteria if unclear
5. Resolve blockers or cancel if not feasible

---

## Task Aging

### Age Thresholds

| State | Healthy Age | At-Risk Age | Unhealthy Age |
|-------|-------------|-------------|---------------|
| TODO | <7 days | 7-14 days | >14 days |
| IN_PROGRESS | <5 days | 5-10 days | >10 days |
| BLOCKED | <3 days | 3-7 days | >7 days |
| REVIEW | <2 days | 2-5 days | >5 days |

**Actions by age:**
- **Healthy:** Continue as planned
- **At-risk:** Review and adjust (add resources, re-scope, split)
- **Unhealthy:** Immediate intervention (cancel, restart, or major re-scope)

### Aging Automation

Consider automated alerts:
```yaml
# .task-config.yaml
aging_alerts:
  in_progress_threshold: 7  # days
  blocked_threshold: 3
  review_threshold: 2
  alert_channel: slack  # or email
```

---

## Multi-Agent State Management

### Agent Coordination

**Strategist/Planning Agent:**
- Creates tasks in TODO
- Ensures acceptance criteria clear
- Manages dependencies
- Monitors task health

**Main/Orchestrator Agent:**
- Assigns tasks to specialized agents
- Tracks overall progress
- Resolves blockers
- Updates task index

**Specialized Subagents:**
- Move tasks from TODO → IN_PROGRESS when starting
- Update task with progress
- Move to BLOCKED if stuck
- Move to REVIEW when complete
- Provide context/notes for handoffs

### Handoff Protocol

When passing tasks between agents:

```markdown
## Handoff Notes
**From:** [Agent A]
**To:** [Agent B]
**Date:** YYYY-MM-DD
**Context:** [What was completed, current state]
**Next steps:** [What needs to happen next]
**Blockers:** [Any issues to be aware of]
**Files changed:** [List of files if applicable]
```

---

## Task Cleanup

### When to Archive

Move to `tasks/completed/` when:
- Task is DONE for >7 days
- No issues reported in production
- All follow-up work complete

### When to Cancel

Some tasks should be cancelled rather than completed:
- Requirements changed and task no longer relevant
- Superseded by another approach
- No longer aligned with project goals
- Technical blocker makes it infeasible

**Cancellation process:**
1. Update status to CANCELLED
2. Document reason for cancellation
3. Archive to `tasks/cancelled/` (create if needed)
4. Update task index
5. Create new task if replacement needed

---

## Metrics & Monitoring

### Key Metrics

**Velocity:**
- Tasks completed per week/sprint
- Complexity units completed per week

**Cycle Time:**
- Average time from TODO → DONE
- Breakdown by state (time in IN_PROGRESS, REVIEW, etc.)

**Blocker Rate:**
- Percentage of tasks that become BLOCKED
- Average resolution time for blockers

**Review Time:**
- Average time in REVIEW state
- Review rejection rate

### Monitoring Dashboard

Consider tracking:
```
Current State:
- TODO: X tasks (Y complexity units)
- IN_PROGRESS: X tasks (Y complexity units)
- BLOCKED: X tasks (Y complexity units)
- REVIEW: X tasks (Y complexity units)

Health:
- At-risk tasks: X
- Unhealthy tasks: X
- Average task age: X days

Velocity:
- Last 7 days: X tasks completed
- Last 30 days: X tasks completed
- Trend: ↑ increasing | → stable | ↓ decreasing
```

---

## Summary

**Key Principles:**

1. **Clear transitions** - Only move to next state when criteria met
2. **Document blockers** - Be specific about what's blocking progress
3. **Regular updates** - Update status at least daily
4. **Don't let tasks stagnate** - Move stalled tasks to BLOCKED immediately
5. **Archive completed work** - Keep active task list clean

**State Flow:**
```
TODO → IN_PROGRESS → REVIEW → DONE
         ↓
      BLOCKED (temporary)
```

**Health checks:**
- Review task ages weekly
- Address at-risk tasks immediately
- Cancel unhealthy tasks that can't be rescued

---

*Effective task lifecycle management ensures work flows smoothly, blockers are resolved quickly, and completed work is properly archived.*
