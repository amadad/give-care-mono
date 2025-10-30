import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StatsCards } from './StatsCards'

describe('StatsCards', () => {
  const mockStats = {
    workflows: {
      total: 10,
      running: 2,
      completed: 7,
      failed: 1
    },
    records: {
      sources: 45,
      extracted: 120,
      validated: 95
    },
    qa: {
      pending: 15,
      approved: 80,
      rejected: 5
    }
  }

  it('should render all stat cards', () => {
    render(<StatsCards stats={mockStats} />)

    expect(screen.getByText('Workflows')).toBeInTheDocument()
    expect(screen.getByText('Sources Discovered')).toBeInTheDocument()
    expect(screen.getByText('Records Extracted')).toBeInTheDocument()
    expect(screen.getByText('QA Queue')).toBeInTheDocument()
  })

  it('should display workflow stats correctly', () => {
    render(<StatsCards stats={mockStats} />)

    expect(screen.getByText('10')).toBeInTheDocument()
    expect(screen.getByText('2 running, 7 completed')).toBeInTheDocument()
  })

  it('should display sources count', () => {
    render(<StatsCards stats={mockStats} />)

    expect(screen.getByText('45')).toBeInTheDocument()
    expect(screen.getByText('Authoritative sources found')).toBeInTheDocument()
  })

  it('should display extracted and validated records', () => {
    render(<StatsCards stats={mockStats} />)

    expect(screen.getByText('120')).toBeInTheDocument()
    expect(screen.getByText('95 validated')).toBeInTheDocument()
  })

  it('should display QA queue stats', () => {
    render(<StatsCards stats={mockStats} />)

    expect(screen.getByText('15')).toBeInTheDocument()
    expect(screen.getByText('80 approved')).toBeInTheDocument()
  })

  it('should render with zero values', () => {
    const emptyStats = {
      workflows: { total: 0, running: 0, completed: 0, failed: 0 },
      records: { sources: 0, extracted: 0, validated: 0 },
      qa: { pending: 0, approved: 0, rejected: 0 }
    }

    render(<StatsCards stats={emptyStats} />)

    expect(screen.getByText('0 running, 0 completed')).toBeInTheDocument()
  })

  it('should format large numbers with locale string', () => {
    const largeStats = {
      workflows: { total: 1500, running: 50, completed: 1400, failed: 50 },
      records: { sources: 10000, extracted: 50000, validated: 45000 },
      qa: { pending: 5000, approved: 40000, rejected: 5000 }
    }

    render(<StatsCards stats={largeStats} />)

    expect(screen.getByText('1,500')).toBeInTheDocument()
    expect(screen.getByText('10,000')).toBeInTheDocument()
  })

  it('should render icons for each stat card', () => {
    const { container } = render(<StatsCards stats={mockStats} />)

    const icons = container.querySelectorAll('svg')
    expect(icons.length).toBeGreaterThanOrEqual(4)
  })

  it('should have proper card structure', () => {
    const { container } = render(<StatsCards stats={mockStats} />)

    const cards = container.querySelectorAll('[class*="grid"]')
    expect(cards.length).toBeGreaterThan(0)
  })
})
