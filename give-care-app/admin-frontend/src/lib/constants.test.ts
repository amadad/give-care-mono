import { describe, it, expect } from 'vitest'
import {
  WORKFLOW_STATUS_VARIANTS,
  US_STATES,
  SERVICE_TYPES,
  getWorkflowStatusVariant
} from './constants'

describe('constants', () => {
  describe('WORKFLOW_STATUS_VARIANTS', () => {
    it('should have variant for running status', () => {
      const variant = WORKFLOW_STATUS_VARIANTS.running
      expect(variant).toBeDefined()
      expect(variant.label).toBe('Running')
      expect(variant.className).toContain('blue-500')
      expect(variant.icon).toBeDefined()
    })

    it('should have variant for completed status', () => {
      const variant = WORKFLOW_STATUS_VARIANTS.completed
      expect(variant).toBeDefined()
      expect(variant.label).toBe('Completed')
      expect(variant.className).toContain('green-500')
      expect(variant.icon).toBeDefined()
    })

    it('should have variant for failed status', () => {
      const variant = WORKFLOW_STATUS_VARIANTS.failed
      expect(variant).toBeDefined()
      expect(variant.label).toBe('Failed')
      expect(variant.className).toContain('red-500')
      expect(variant.icon).toBeDefined()
    })

    it('should have variant for paused status', () => {
      const variant = WORKFLOW_STATUS_VARIANTS.paused
      expect(variant).toBeDefined()
      expect(variant.label).toBe('Paused')
      expect(variant.className).toContain('yellow-500')
      expect(variant.icon).toBeDefined()
    })

    it('should have all required properties for each status', () => {
      Object.values(WORKFLOW_STATUS_VARIANTS).forEach(variant => {
        expect(variant).toHaveProperty('label')
        expect(variant).toHaveProperty('className')
        expect(variant).toHaveProperty('icon')
        expect(typeof variant.label).toBe('string')
        expect(typeof variant.className).toBe('string')
        expect(variant.icon).toBeDefined()
      })
    })
  })

  describe('getWorkflowStatusVariant', () => {
    it('should return correct variant for valid status', () => {
      expect(getWorkflowStatusVariant('running')).toBe(WORKFLOW_STATUS_VARIANTS.running)
      expect(getWorkflowStatusVariant('completed')).toBe(WORKFLOW_STATUS_VARIANTS.completed)
      expect(getWorkflowStatusVariant('failed')).toBe(WORKFLOW_STATUS_VARIANTS.failed)
      expect(getWorkflowStatusVariant('paused')).toBe(WORKFLOW_STATUS_VARIANTS.paused)
    })

    it('should return paused variant for unknown status', () => {
      expect(getWorkflowStatusVariant('unknown')).toBe(WORKFLOW_STATUS_VARIANTS.paused)
      expect(getWorkflowStatusVariant('invalid')).toBe(WORKFLOW_STATUS_VARIANTS.paused)
      expect(getWorkflowStatusVariant('')).toBe(WORKFLOW_STATUS_VARIANTS.paused)
    })
  })

  describe('US_STATES', () => {
    it('should be an array', () => {
      expect(Array.isArray(US_STATES)).toBe(true)
    })

    it('should contain at least 50 states', () => {
      expect(US_STATES.length).toBeGreaterThanOrEqual(50)
    })

    it('should have state objects with code and name', () => {
      US_STATES.forEach(state => {
        expect(state).toHaveProperty('code')
        expect(state).toHaveProperty('name')
        expect(typeof state.code).toBe('string')
        expect(typeof state.name).toBe('string')
        expect(state.code.length).toBe(2)
      })
    })

    it('should include NY state', () => {
      const nyState = US_STATES.find(s => s.code === 'NY')
      expect(nyState).toBeDefined()
      expect(nyState?.name).toBe('New York')
    })

    it('should include CA state', () => {
      const caState = US_STATES.find(s => s.code === 'CA')
      expect(caState).toBeDefined()
      expect(caState?.name).toBe('California')
    })

    it('should have unique state codes', () => {
      const codes = US_STATES.map(s => s.code)
      const uniqueCodes = new Set(codes)
      expect(uniqueCodes.size).toBe(codes.length)
    })

    it('should have state codes in uppercase', () => {
      US_STATES.forEach(state => {
        expect(state.code).toBe(state.code.toUpperCase())
      })
    })
  })

  describe('SERVICE_TYPES', () => {
    it('should be an array', () => {
      expect(Array.isArray(SERVICE_TYPES)).toBe(true)
    })

    it('should not be empty', () => {
      expect(SERVICE_TYPES.length).toBeGreaterThan(0)
    })

    it('should have service type objects with value and label', () => {
      SERVICE_TYPES.forEach(service => {
        expect(service).toHaveProperty('value')
        expect(service).toHaveProperty('label')
        expect(typeof service.value).toBe('string')
        expect(typeof service.label).toBe('string')
      })
    })

    it('should use snake_case for values', () => {
      SERVICE_TYPES.forEach(service => {
        expect(service.value).toMatch(/^[a-z]+(_[a-z]+)*$/)
      })
    })

    it('should have readable labels', () => {
      SERVICE_TYPES.forEach(service => {
        expect(service.label.length).toBeGreaterThan(0)
        expect(service.label).not.toContain('_')
      })
    })
  })
})
