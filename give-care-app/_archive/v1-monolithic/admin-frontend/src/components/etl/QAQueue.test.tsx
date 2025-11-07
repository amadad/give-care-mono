import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QAQueue } from './QAQueue'

describe('QAQueue', () => {
  const mockRecords = [
    {
      _id: 'record-1',
      title: 'NY Caregiver Respite Program',
      providerName: 'NY State Health Department',
      website: 'https://health.ny.gov/caregiver',
      serviceTypes: ['respite_care', 'counseling'],
      qualityScore: 9.2,
      validatedAt: new Date('2025-01-15T10:00:00Z').getTime()
    },
    {
      _id: 'record-2',
      title: 'Community Support Services',
      providerName: 'Albany Community Center',
      website: 'https://albany.org/support',
      serviceTypes: ['support_groups', 'financial_assistance'],
      qualityScore: 8.5,
      validatedAt: new Date('2025-01-14T15:30:00Z').getTime()
    }
  ]

  it('should render QA queue with records', () => {
    render(<QAQueue records={mockRecords} />)

    expect(screen.getByText('NY Caregiver Respite Program')).toBeInTheDocument()
    expect(screen.getByText('Community Support Services')).toBeInTheDocument()
  })

  it('should display provider names', () => {
    render(<QAQueue records={mockRecords} />)

    expect(screen.getByText('NY State Health Department')).toBeInTheDocument()
    expect(screen.getByText('Albany Community Center')).toBeInTheDocument()
  })

  it('should display quality scores', () => {
    render(<QAQueue records={mockRecords} />)

    expect(screen.getByText('9.2/10')).toBeInTheDocument()
    expect(screen.getByText('8.5/10')).toBeInTheDocument()
  })

  it('should display service type badges', () => {
    render(<QAQueue records={mockRecords} />)

    expect(screen.getByText('respite_care')).toBeInTheDocument()
    expect(screen.getByText('counseling')).toBeInTheDocument()
    expect(screen.getByText('support_groups')).toBeInTheDocument()
    expect(screen.getByText('financial_assistance')).toBeInTheDocument()
  })

  it('should display website links', () => {
    render(<QAQueue records={mockRecords} />)

    const links = screen.getAllByRole('link')
    expect(links.length).toBe(2)
    expect(links[0]).toHaveAttribute('href', 'https://health.ny.gov/caregiver')
    expect(links[1]).toHaveAttribute('href', 'https://albany.org/support')
  })

  it('should open links in new tab', () => {
    render(<QAQueue records={mockRecords} />)

    const links = screen.getAllByRole('link')
    links.forEach(link => {
      expect(link).toHaveAttribute('target', '_blank')
      expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    })
  })

  it('should display validated date', () => {
    render(<QAQueue records={mockRecords} />)

    expect(screen.getByText('1/15/2025')).toBeInTheDocument()
    expect(screen.getByText('1/14/2025')).toBeInTheDocument()
  })

  it('should show empty state when no records', () => {
    render(<QAQueue records={[]} />)

    expect(screen.getByText('No records pending QA')).toBeInTheDocument()
  })

  it('should limit display to maxDisplay prop', () => {
    const manyRecords = Array.from({ length: 10 }, (_, i) => ({
      _id: `record-${i}`,
      title: `Record ${i}`,
      providerName: `Provider ${i}`,
      website: `https://example.com/${i}`,
      serviceTypes: ['respite_care'],
      qualityScore: 8,
      validatedAt: Date.now()
    }))

    render(<QAQueue records={manyRecords} maxDisplay={5} />)

    expect(screen.getByText('Record 0')).toBeInTheDocument()
    expect(screen.getByText('Record 4')).toBeInTheDocument()
    expect(screen.queryByText('Record 5')).not.toBeInTheDocument()
    expect(screen.getByText('+ 5 more records')).toBeInTheDocument()
  })

  it('should not show "more records" message when all records displayed', () => {
    render(<QAQueue records={mockRecords} maxDisplay={5} />)

    expect(screen.queryByText(/more records/)).not.toBeInTheDocument()
  })

  it('should render with default maxDisplay of 5', () => {
    const sixRecords = Array.from({ length: 6 }, (_, i) => ({
      _id: `record-${i}`,
      title: `Record ${i}`,
      providerName: `Provider ${i}`,
      website: `https://example.com/${i}`,
      serviceTypes: ['respite_care'],
      qualityScore: 8,
      validatedAt: Date.now()
    }))

    render(<QAQueue records={sixRecords} />)

    expect(screen.getByText('+ 1 more records')).toBeInTheDocument()
  })

  it('should have hover effects on record cards', () => {
    const { container } = render(<QAQueue records={mockRecords} />)

    const cards = container.querySelectorAll('[class*="hover"]')
    expect(cards.length).toBeGreaterThan(0)
  })

  it('should display quality label', () => {
    render(<QAQueue records={mockRecords} />)

    const qualityLabels = screen.getAllByText('quality')
    expect(qualityLabels.length).toBe(2)
  })

  it('should handle records with multiple service types', () => {
    const record = {
      _id: 'record-multi',
      title: 'Multi-Service Provider',
      providerName: 'Comprehensive Care',
      website: 'https://example.com',
      serviceTypes: ['respite_care', 'counseling', 'support_groups', 'financial_assistance', 'legal_assistance'],
      qualityScore: 9,
      validatedAt: Date.now()
    }

    render(<QAQueue records={[record]} />)

    expect(screen.getByText('respite_care')).toBeInTheDocument()
    expect(screen.getByText('counseling')).toBeInTheDocument()
    expect(screen.getByText('support_groups')).toBeInTheDocument()
    expect(screen.getByText('financial_assistance')).toBeInTheDocument()
    expect(screen.getByText('legal_assistance')).toBeInTheDocument()
  })

  it('should format quality score to one decimal place', () => {
    const record = {
      _id: 'record-decimal',
      title: 'Test Record',
      providerName: 'Test Provider',
      website: 'https://example.com',
      serviceTypes: ['respite_care'],
      qualityScore: 7.8765,
      validatedAt: Date.now()
    }

    render(<QAQueue records={[record]} />)

    expect(screen.getByText('7.9/10')).toBeInTheDocument()
  })
})
