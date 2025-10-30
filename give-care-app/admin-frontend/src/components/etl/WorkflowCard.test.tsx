import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { WorkflowCard } from './WorkflowCard'
import { useQuery } from 'convex/react'

// Mock convex/react
vi.mock('convex/react', () => ({
  useQuery: vi.fn()
}))

// Mock constants
vi.mock('@/lib/constants', () => ({
  getWorkflowStatusVariant: vi.fn((status: string) => ({
    label: status === 'completed' ? 'Completed' : 'Running',
    className: 'mock-class',
    icon: () => null
  }))
}))

describe('WorkflowCard', () => {
  const mockWorkflow = {
    _id: 'workflow-123',
    sessionId: 'session-abc',
    task: 'discover_caregiver_resources',
    status: 'completed',
    state: 'NY',
    currentStep: 'validation',
    startedAt: new Date('2025-01-15T10:00:00Z').getTime(),
    durationMs: 45000,
    sourcesCount: 5,
    extractedCount: 15,
    validatedCount: 12,
    errorCount: 1
  }

  it('should render workflow summary', () => {
    vi.mocked(useQuery).mockReturnValue(undefined)

    render(<WorkflowCard workflow={mockWorkflow} />)

    expect(screen.getByText('discover_caregiver_resources')).toBeInTheDocument()
    expect(screen.getByText('NY')).toBeInTheDocument()
    expect(screen.getByText('validation')).toBeInTheDocument()
  })

  it('should display workflow status badge', () => {
    vi.mocked(useQuery).mockReturnValue(undefined)

    render(<WorkflowCard workflow={mockWorkflow} />)

    expect(screen.getByText('Completed')).toBeInTheDocument()
  })

  it('should show counts for sources, extracted, and validated', () => {
    vi.mocked(useQuery).mockReturnValue(undefined)

    render(<WorkflowCard workflow={mockWorkflow} />)

    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getByText('sources')).toBeInTheDocument()
    expect(screen.getByText('15')).toBeInTheDocument()
    expect(screen.getByText('extracted')).toBeInTheDocument()
    expect(screen.getByText('12')).toBeInTheDocument()
    expect(screen.getByText('validated')).toBeInTheDocument()
  })

  it('should display error count when errors exist', () => {
    vi.mocked(useQuery).mockReturnValue(undefined)

    render(<WorkflowCard workflow={mockWorkflow} />)

    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('errors')).toBeInTheDocument()
  })

  it('should not display error section when errorCount is 0', () => {
    vi.mocked(useQuery).mockReturnValue(undefined)

    const workflowNoErrors = { ...mockWorkflow, errorCount: 0 }
    render(<WorkflowCard workflow={workflowNoErrors} />)

    // Check that error count is not displayed in stats section
    expect(screen.queryByText('errors')).not.toBeInTheDocument()
  })

  it('should display duration in seconds', () => {
    vi.mocked(useQuery).mockReturnValue(undefined)

    render(<WorkflowCard workflow={mockWorkflow} />)

    expect(screen.getByText('45.0s')).toBeInTheDocument()
  })

  it('should show "Running..." when durationMs is null', () => {
    vi.mocked(useQuery).mockReturnValue(undefined)

    const runningWorkflow = { ...mockWorkflow, durationMs: null, status: 'running' }
    render(<WorkflowCard workflow={runningWorkflow} />)

    expect(screen.getByText('Running...')).toBeInTheDocument()
  })

  it('should toggle expanded state on click', () => {
    vi.mocked(useQuery).mockReturnValue(undefined)

    const { container } = render(<WorkflowCard workflow={mockWorkflow} />)

    const button = container.querySelector('button')
    expect(button).toBeTruthy()

    const chevronDown = screen.getByTestId('chevron-down')
    expect(chevronDown).toBeInTheDocument()

    fireEvent.click(button!)

    const chevronUp = screen.getByTestId('chevron-up')
    expect(chevronUp).toBeInTheDocument()
  })

  it('should load workflow details when expanded', () => {
    const mockUseQuery = vi.fn()
    mockUseQuery.mockReturnValueOnce(undefined)
    vi.mocked(useQuery).mockImplementation(mockUseQuery)

    const { container } = render(<WorkflowCard workflow={mockWorkflow} />)

    expect(mockUseQuery).toHaveBeenCalledWith(expect.anything(), 'skip')

    const button = container.querySelector('button')
    fireEvent.click(button!)

    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.anything(),
      { sessionId: 'session-abc' }
    )
  })

  it('should display loading state when fetching details', () => {
    const mockUseQuery = vi.fn()
    mockUseQuery
      .mockReturnValueOnce(undefined)
      .mockReturnValueOnce(undefined)
    vi.mocked(useQuery).mockImplementation(mockUseQuery)

    const { container } = render(<WorkflowCard workflow={mockWorkflow} />)

    const button = container.querySelector('button')
    fireEvent.click(button!)

    expect(screen.getByText('Loading details...')).toBeInTheDocument()
  })

  it('should display discovered sources when details loaded', () => {
    const mockDetails = {
      sources: [
        {
          _id: 'source-1',
          title: 'NY Caregiver Support',
          url: 'https://example.com/support',
          sourceType: 'government',
          trustScore: 8
        }
      ],
      validatedRecords: [],
      errors: []
    }

    const mockUseQuery = vi.fn()
    mockUseQuery
      .mockReturnValueOnce(undefined)
      .mockReturnValueOnce(mockDetails)
    vi.mocked(useQuery).mockImplementation(mockUseQuery)

    const { container } = render(<WorkflowCard workflow={mockWorkflow} />)

    const button = container.querySelector('button')
    fireEvent.click(button!)

    expect(screen.getByText('Discovered Sources (1)')).toBeInTheDocument()
    expect(screen.getByText('NY Caregiver Support')).toBeInTheDocument()
    expect(screen.getByText('Trust: 8/10')).toBeInTheDocument()
  })

  it('should display validated records when details loaded', () => {
    const mockDetails = {
      sources: [],
      validatedRecords: [
        {
          _id: 'record-1',
          title: 'Respite Care Program',
          providerName: 'Community Services',
          website: 'https://example.com',
          serviceTypes: ['respite_care', 'counseling'],
          qualityScore: 8.5
        }
      ],
      errors: []
    }

    const mockUseQuery = vi.fn()
    mockUseQuery
      .mockReturnValueOnce(undefined)
      .mockReturnValueOnce(mockDetails)
    vi.mocked(useQuery).mockImplementation(mockUseQuery)

    const { container } = render(<WorkflowCard workflow={mockWorkflow} />)

    const button = container.querySelector('button')
    fireEvent.click(button!)

    expect(screen.getByText('Validated Records (1)')).toBeInTheDocument()
    expect(screen.getByText('Respite Care Program')).toBeInTheDocument()
    expect(screen.getByText('Community Services')).toBeInTheDocument()
    expect(screen.getByText('8.5/10')).toBeInTheDocument()
  })

  it('should display errors when present in details', () => {
    const mockDetails = {
      sources: [],
      validatedRecords: [],
      errors: ['Failed to extract data from source', 'Invalid phone number format']
    }

    const mockUseQuery = vi.fn()
    mockUseQuery
      .mockReturnValueOnce(undefined)
      .mockReturnValueOnce(mockDetails)
    vi.mocked(useQuery).mockImplementation(mockUseQuery)

    const { container } = render(<WorkflowCard workflow={mockWorkflow} />)

    const button = container.querySelector('button')
    fireEvent.click(button!)

    expect(screen.getByText('Errors (2)')).toBeInTheDocument()
    expect(screen.getByText('Failed to extract data from source')).toBeInTheDocument()
    expect(screen.getByText('Invalid phone number format')).toBeInTheDocument()
  })

  it('should show empty state when no details available', () => {
    const mockDetails = {
      sources: [],
      validatedRecords: [],
      errors: []
    }

    const mockUseQuery = vi.fn()
    mockUseQuery
      .mockReturnValueOnce(undefined)
      .mockReturnValueOnce(mockDetails)
    vi.mocked(useQuery).mockImplementation(mockUseQuery)

    const { container } = render(<WorkflowCard workflow={mockWorkflow} />)

    const button = container.querySelector('button')
    fireEvent.click(button!)

    expect(screen.getByText('No details available yet')).toBeInTheDocument()
  })

  it('should format startedAt date correctly', () => {
    vi.mocked(useQuery).mockReturnValue(undefined)

    render(<WorkflowCard workflow={mockWorkflow} />)

    const dateElement = screen.getByText(/1\/15\/2025/)
    expect(dateElement).toBeInTheDocument()
  })
})
