import '@testing-library/jest-dom'
import { vi } from 'vitest'
import { createElement } from 'react'

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: vi.fn(),
      replace: vi.fn(),
      prefetch: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return '/'
  },
}))

// Mock Next.js Image - render as img element instead of props object
vi.mock('next/image', () => ({
  default: (props: any) => {
    const { src, alt, ...rest } = props
    return createElement('img', { src, alt, ...rest })
  },
}))

// Mock environment variables
process.env.NEXT_PUBLIC_SITE_URL = 'https://test.givecareapp.com'