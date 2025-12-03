---
id: TASK-1-38
title: Improve chart accessibility
priority: P3-Low
complexity: 2
module: web
status: BACKLOG
created: 2025-12-02
review-id: L3
fix-phase: 5
---

# TASK-1-38: Improve Chart Accessibility

## Description

The usage chart relies solely on color differentiation, making it inaccessible to colorblind users. Add pattern fills, text labels, or other non-color differentiators.

## Acceptance Criteria

- [ ] Chart is understandable in grayscale
- [ ] WCAG 2.1 AA compliance for data visualization
- [ ] Patterns or shapes differentiate data series
- [ ] Legend is accessible
- [ ] Contrast ratio meets 4.5:1 minimum

## Technical Notes

### Current Problem

Chart uses only color to differentiate between usage types (tokens, units, etc.). Users with color blindness cannot distinguish between series.

### Solution Options

1. **Pattern fills** - Add stripes, dots, or crosshatch patterns
2. **Direct labels** - Add text labels on chart segments
3. **Line styles** - Use dashed/dotted lines for different series
4. **Shape markers** - Use different shapes for data points

### Files to Modify

- `apps/web/src/app/(dashboard)/usage/usage-chart.tsx` - Add accessibility features
- May need to update chart library configuration

### Patterns to Follow

- Use Recharts accessibility features if available
- Add aria-label to chart container
- Include data table as alternative
- Test with colorblind simulation tools

## Implementation Agent

- **Implement**: `ux-ui`
- **Review**: `code-reviewer`

## Execution

- **Mode**: Parallel with L1, L2, M3
- **Phase**: Fix Phase 5 (UX & Documentation)

## Dependencies

- **Blocked by**: None
- **Blocks**: None

## Progress Log

| Date | Update |
|------|--------|
| 2025-12-02 | Task created from Phase 0/1 review finding L3 |
