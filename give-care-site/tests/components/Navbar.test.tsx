import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Navbar from '../../app/components/layout/Navbar'

describe('Navbar', () => {
  it('renders the GiveCare logo', () => {
    render(<Navbar />)
    expect(screen.getByText('GiveCare')).toBeInTheDocument()
  })

  it('renders navigation links', () => {
    render(<Navbar />)
    expect(screen.getByText('About')).toBeInTheDocument()
    expect(screen.getByText('Words')).toBeInTheDocument()
  })

  it('renders the Get Started button', () => {
    render(<Navbar />)
    expect(screen.getByText('Get Started')).toBeInTheDocument()
  })
})