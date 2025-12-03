---
id: TASK-1-38
title: Improve chart accessibility
priority: P3-Low
complexity: 2
module: web
status: DONE
created: 2025-12-02
completed: 2025-12-03
review-id: L3
fix-phase: 5
---

# TASK-1-38: Improve Chart Accessibility

## Description

The usage chart relies solely on color differentiation, making it inaccessible to colorblind users. Add pattern fills, text labels, or other non-color differentiators.

## Acceptance Criteria

- [x] Chart is understandable in grayscale
- [x] WCAG 2.1 AA compliance for data visualization
- [x] Patterns or shapes differentiate data series
- [x] Legend is accessible
- [x] Contrast ratio meets 4.5:1 minimum

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
| 2025-12-03 | Implemented comprehensive accessibility improvements |

## Implementation Summary

### Changes Made to `apps/web/src/app/(dashboard)/usage/usage-chart.tsx`

1. **Pattern Fills for Non-Color Differentiation**
   - Tokens area: Diagonal line pattern (`rotate(45)`) with solid stroke
   - Brain Units area: Dot pattern with dashed stroke (`strokeDasharray="6 3"`)

2. **Shape Markers on Data Points**
   - Tokens: Filled circles with background stroke
   - Brain Units: Hollow circles (background fill with colored stroke)
   - Different visual appearance even without color

3. **Accessible Legend**
   - Shows pattern samples matching the chart areas
   - Includes stroke style (solid vs dashed)
   - Descriptive labels: "Tokens (solid line, diagonal pattern)" and "Brain Units (dashed line, dot pattern)"
   - Uses `role="group"` with `aria-label="Chart legend"`

4. **Screen Reader Data Table**
   - Hidden visually (`sr-only` class) but accessible to screen readers
   - Full data table with all chart data points
   - Includes totals row for summary
   - Uses semantic table markup

5. **Improved ARIA Attributes**
   - Chart container uses `role="figure"` with `aria-labelledby` and `aria-describedby`
   - Unique IDs generated via `useId()` to prevent conflicts
   - Chart includes descriptive `aria-label` with total values

### Accessibility Features

| Feature | Implementation |
|---------|----------------|
| Pattern fills | Diagonal lines (tokens) vs dots (units) |
| Stroke styles | Solid line vs dashed line |
| Shape markers | Filled circles vs hollow circles |
| Legend patterns | Visual samples with text descriptions |
| Data table | Screen-reader accessible alternative |
| ARIA roles | `figure`, `group` with proper labeling |

### Grayscale Test

The chart is distinguishable in grayscale because:
- Different pattern types (lines vs dots) create visual texture difference
- Stroke styles (solid vs dashed) are visible regardless of color
- Shape markers have different fill states (filled vs hollow)
- Legend includes textual descriptions of differentiators
