import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import { UsageSummaryCards } from './usage-summary'
import type { UsageSummary } from '@appdistillery/core/ledger'

describe('UsageSummaryCards', () => {
  const mockSummary: UsageSummary = {
    totalTokens: 125000,
    totalUnits: 350,
    eventCount: 42,
    byAction: [
      { action: 'agency:scope:generate', count: 15, tokensTotal: 50000, units: 150 },
      { action: 'agency:proposal:draft', count: 10, tokensTotal: 40000, units: 100 },
      { action: 'agency:lead:create', count: 17, tokensTotal: 35000, units: 100 },
    ],
  }

  it('renders all four usage cards', () => {
    render(<UsageSummaryCards summary={mockSummary} />)

    expect(screen.getByText('Total Tokens')).toBeInTheDocument()
    expect(screen.getByText('Brain Units')).toBeInTheDocument()
    expect(screen.getByText('Total Events')).toBeInTheDocument()
    expect(screen.getByText('Top Action')).toBeInTheDocument()
  })

  it('displays formatted token count', () => {
    render(<UsageSummaryCards summary={mockSummary} />)

    // 125000 should be formatted as "125.0K"
    expect(screen.getByText('125.0K')).toBeInTheDocument()
    expect(screen.getByLabelText('125,000 tokens')).toBeInTheDocument()
  })

  it('displays formatted brain units', () => {
    render(<UsageSummaryCards summary={mockSummary} />)

    // 350 should be displayed as is (no K/M suffix)
    expect(screen.getByText('350')).toBeInTheDocument()
    expect(screen.getByLabelText('350 Brain Units')).toBeInTheDocument()
  })

  it('displays formatted event count', () => {
    render(<UsageSummaryCards summary={mockSummary} />)

    // 42 should be displayed as is
    expect(screen.getByText('42')).toBeInTheDocument()
    expect(screen.getByLabelText('42 events')).toBeInTheDocument()
  })

  it('formats large numbers with K suffix correctly', () => {
    const largeSummary: UsageSummary = {
      totalTokens: 5500,
      totalUnits: 1200,
      eventCount: 3400,
      byAction: [],
    }

    render(<UsageSummaryCards summary={largeSummary} />)

    expect(screen.getByText('5.5K')).toBeInTheDocument()
    expect(screen.getByText('1.2K')).toBeInTheDocument()
    expect(screen.getByText('3.4K')).toBeInTheDocument()
  })

  it('formats numbers with M suffix for millions', () => {
    const hugeSummary: UsageSummary = {
      totalTokens: 2500000,
      totalUnits: 1000000,
      eventCount: 500,
      byAction: [],
    }

    render(<UsageSummaryCards summary={hugeSummary} />)

    expect(screen.getByText('2.5M')).toBeInTheDocument()
    expect(screen.getByText('1.0M')).toBeInTheDocument()
  })

  it('handles zero values correctly', () => {
    const zeroSummary: UsageSummary = {
      totalTokens: 0,
      totalUnits: 0,
      eventCount: 0,
      byAction: [],
    }

    render(<UsageSummaryCards summary={zeroSummary} />)

    // Should display "0" for all metrics
    const zeros = screen.getAllByText('0')
    expect(zeros.length).toBeGreaterThanOrEqual(3)

    // Top action should show "None"
    expect(screen.getByText('None')).toBeInTheDocument()
    expect(screen.getByText('No activity yet')).toBeInTheDocument()
  })

  it('displays top action name formatted correctly', () => {
    render(<UsageSummaryCards summary={mockSummary} />)

    // "agency:scope:generate" should be formatted as "Scope Generate"
    expect(screen.getByText('Scope Generate')).toBeInTheDocument()
  })

  it('displays top action call count', () => {
    render(<UsageSummaryCards summary={mockSummary} />)

    // Top action has 15 calls
    expect(screen.getByText('15 calls')).toBeInTheDocument()
  })

  it('shows "None" when no actions exist', () => {
    const noActionsSummary: UsageSummary = {
      totalTokens: 100,
      totalUnits: 50,
      eventCount: 0,
      byAction: [],
    }

    render(<UsageSummaryCards summary={noActionsSummary} />)

    expect(screen.getByText('None')).toBeInTheDocument()
    expect(screen.getByText('No activity yet')).toBeInTheDocument()
  })

  it('displays correct icons for each metric', () => {
    render(<UsageSummaryCards summary={mockSummary} />)

    // Icons are aria-hidden, so we verify by checking the card structure
    expect(screen.getByText('Total Tokens')).toBeInTheDocument()
    expect(screen.getByText('Input + output tokens')).toBeInTheDocument()

    expect(screen.getByText('Brain Units')).toBeInTheDocument()
    expect(screen.getByText('Credits consumed')).toBeInTheDocument()

    expect(screen.getByText('Total Events')).toBeInTheDocument()
    expect(screen.getByText('AI operations')).toBeInTheDocument()
  })

  it('applies custom className to container', () => {
    const { container } = render(
      <UsageSummaryCards summary={mockSummary} className="custom-class" />
    )

    const gridContainer = container.querySelector('.custom-class')
    expect(gridContainer).toBeInTheDocument()
  })

  it('displays full action name in title attribute', () => {
    render(<UsageSummaryCards summary={mockSummary} />)

    // The full action name should be in the title attribute
    const topActionElement = screen.getByText('Scope Generate')
    expect(topActionElement).toHaveAttribute('title', 'agency:scope:generate')
  })

  it('formats action names with multiple parts correctly', () => {
    const customSummary: UsageSummary = {
      totalTokens: 1000,
      totalUnits: 100,
      eventCount: 10,
      byAction: [
        { action: 'agency:proposal:draft', count: 10, tokensTotal: 1000, units: 100 },
      ],
    }

    render(<UsageSummaryCards summary={customSummary} />)

    // "agency:proposal:draft" should be "Proposal Draft"
    expect(screen.getByText('Proposal Draft')).toBeInTheDocument()
  })

  it('handles malformed action names gracefully', () => {
    const malformedSummary: UsageSummary = {
      totalTokens: 1000,
      totalUnits: 100,
      eventCount: 10,
      byAction: [
        // Action without proper format
        { action: 'invalid', count: 10, tokensTotal: 1000, units: 100 },
      ],
    }

    render(<UsageSummaryCards summary={malformedSummary} />)

    // Should display the raw action name
    expect(screen.getByText('invalid')).toBeInTheDocument()
  })

  it('uses toLocaleString for accessibility labels', () => {
    render(<UsageSummaryCards summary={mockSummary} />)

    // Verify aria-labels use proper locale formatting
    expect(screen.getByLabelText('125,000 tokens')).toBeInTheDocument()
    expect(screen.getByLabelText('350 Brain Units')).toBeInTheDocument()
    expect(screen.getByLabelText('42 events')).toBeInTheDocument()
  })

  it('displays small numbers without suffix', () => {
    const smallSummary: UsageSummary = {
      totalTokens: 500,
      totalUnits: 25,
      eventCount: 3,
      byAction: [{ action: 'test:action:run', count: 3, tokensTotal: 500, units: 25 }],
    }

    render(<UsageSummaryCards summary={smallSummary} />)

    // Numbers under 1000 should not have K suffix
    expect(screen.getByText('500')).toBeInTheDocument()
    expect(screen.getByText('25')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('formats numbers at exactly 1000', () => {
    const exactThousand: UsageSummary = {
      totalTokens: 1000,
      totalUnits: 1000,
      eventCount: 1000,
      byAction: [],
    }

    render(<UsageSummaryCards summary={exactThousand} />)

    // 1000 should be "1.0K"
    const kSuffixes = screen.getAllByText('1.0K')
    expect(kSuffixes.length).toBeGreaterThanOrEqual(3)
  })
})
