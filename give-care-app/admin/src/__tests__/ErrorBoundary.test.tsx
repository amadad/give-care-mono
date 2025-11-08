import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ErrorBoundary } from '../components/ErrorBoundary'

// Component that throws an error
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error message')
  }
  return <div>No error</div>
}

describe('ErrorBoundary', () => {
  // Suppress console.error for these tests
  const originalError = console.error
  beforeEach(() => {
    console.error = vi.fn()
  })

  afterEach(() => {
    console.error = originalError
  })

  it('should render children when no error', () => {
    render(
      <ErrorBoundary>
        <div>Test content</div>
      </ErrorBoundary>
    )

    expect(screen.getByText('Test content')).toBeInTheDocument()
  })

  it('should render error UI when child throws', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByText('Test error message')).toBeInTheDocument()
  })

  it('should display error message', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText('Test error message')).toBeInTheDocument()
  })

  it('should render custom fallback when provided', () => {
    const customFallback = <div>Custom error UI</div>

    render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText('Custom error UI')).toBeInTheDocument()
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument()
  })

  it('should show reload button in default error UI', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    const reloadButton = screen.getByRole('button', { name: /reload page/i })
    expect(reloadButton).toBeInTheDocument()
  })

  it('should display generic message when error has no message', () => {
    const ThrowErrorWithoutMessage = () => {
      throw new Error()
    }

    render(
      <ErrorBoundary>
        <ThrowErrorWithoutMessage />
      </ErrorBoundary>
    )

    expect(screen.getByText('An unexpected error occurred')).toBeInTheDocument()
  })

  it('should log error to console', () => {
    const consoleSpy = vi.spyOn(console, 'error')

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(consoleSpy).toHaveBeenCalled()
  })

  it('should have proper styling for error container', () => {
    const { container } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    const errorContainer = container.querySelector('[class*="border"]')
    expect(errorContainer).toBeInTheDocument()
  })

  it('should handle errors in deeply nested components', () => {
    const NestedComponent = () => (
      <div>
        <div>
          <ThrowError shouldThrow={true} />
        </div>
      </div>
    )

    render(
      <ErrorBoundary>
        <NestedComponent />
      </ErrorBoundary>
    )

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
  })

  it('should not interfere with non-error rendering', () => {
    const ComplexChild = () => (
      <div>
        <h1>Title</h1>
        <p>Paragraph</p>
        <button>Button</button>
      </div>
    )

    render(
      <ErrorBoundary>
        <ComplexChild />
      </ErrorBoundary>
    )

    expect(screen.getByText('Title')).toBeInTheDocument()
    expect(screen.getByText('Paragraph')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /button/i })).toBeInTheDocument()
  })
})

describe('ErrorBoundary route integration', () => {
  it('should wrap route components properly', () => {
    const RouteComponent = () => <div>Route content</div>
    const WrappedRoute = () => (
      <ErrorBoundary>
        <RouteComponent />
      </ErrorBoundary>
    )

    render(<WrappedRoute />)

    expect(screen.getByText('Route content')).toBeInTheDocument()
  })

  it('should catch errors in route components', () => {
    const FailingRoute = () => {
      throw new Error('Route failed to render')
    }
    const WrappedRoute = () => (
      <ErrorBoundary>
        <FailingRoute />
      </ErrorBoundary>
    )

    render(<WrappedRoute />)

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByText('Route failed to render')).toBeInTheDocument()
  })

  it('should allow multiple independent error boundaries', () => {
    const ThrowInFirst = () => <ThrowError shouldThrow={true} />
    const SafeSecond = () => <div>Safe content</div>

    render(
      <div>
        <ErrorBoundary>
          <ThrowInFirst />
        </ErrorBoundary>
        <ErrorBoundary>
          <SafeSecond />
        </ErrorBoundary>
      </div>
    )

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByText('Safe content')).toBeInTheDocument()
  })
})
