// @ts-nocheck - Mock type compatibility with Convex
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useConvexMutation } from './useConvexMutation'
import { useMutation } from 'convex/react'

// Mock convex/react
vi.mock('convex/react', () => ({
  useMutation: vi.fn()
}))

describe('useConvexMutation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return mutation function and loading state', () => {
    const mockMutation = vi.fn()
    const mockApi = { test: { action: 'test.action' } }

    vi.mocked(useMutation).mockReturnValue(mockMutation)

    const { result } = renderHook(() =>
      useConvexMutation(mockApi.test.action as any)
    )

    expect(result.current).toHaveProperty('mutate')
    expect(result.current).toHaveProperty('isLoading')
    expect(result.current).toHaveProperty('error')
    expect(typeof result.current.mutate).toBe('function')
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('should set loading state during mutation', async () => {
    const mockMutation = vi.fn().mockImplementation(() =>
      new Promise(resolve => setTimeout(() => resolve('success'), 100))
    )
    const mockApi = { test: { action: 'test.action' } }

    vi.mocked(useMutation).mockReturnValue(mockMutation)

    const { result } = renderHook(() =>
      useConvexMutation(mockApi.test.action as any)
    )

    const mutatePromise = result.current.mutate({ data: 'test' })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(true)
    })

    await mutatePromise

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })
  })

  it('should handle successful mutation', async () => {
    const mockResult = { id: '123', status: 'success' }
    const mockMutation = vi.fn().mockResolvedValue(mockResult)
    const mockApi = { test: { action: 'test.action' } }

    vi.mocked(useMutation).mockReturnValue(mockMutation)

    const { result } = renderHook(() =>
      useConvexMutation(mockApi.test.action as any)
    )

    const response = await result.current.mutate({ data: 'test' })

    expect(response).toEqual(mockResult)
    expect(result.current.error).toBeNull()
    expect(result.current.isLoading).toBe(false)
  })

  it('should handle mutation error', async () => {
    const mockError = new Error('Mutation failed')
    const mockMutation = vi.fn().mockRejectedValue(mockError)
    const mockApi = { test: { action: 'test.action' } }

    vi.mocked(useMutation).mockReturnValue(mockMutation)

    const { result } = renderHook(() =>
      useConvexMutation(mockApi.test.action as any)
    )

    await expect(result.current.mutate({ data: 'test' })).rejects.toThrow('Mutation failed')

    await waitFor(() => {
      expect(result.current.error).toBe(mockError)
      expect(result.current.isLoading).toBe(false)
    })
  })

  it('should accept optional onSuccess callback', async () => {
    const mockResult = { id: '123' }
    const mockMutation = vi.fn().mockResolvedValue(mockResult)
    const onSuccess = vi.fn()
    const mockApi = { test: { action: 'test.action' } }

    vi.mocked(useMutation).mockReturnValue(mockMutation)

    const { result } = renderHook(() =>
      useConvexMutation(mockApi.test.action as any, { onSuccess })
    )

    await result.current.mutate({ data: 'test' })

    expect(onSuccess).toHaveBeenCalledWith(mockResult)
    expect(onSuccess).toHaveBeenCalledTimes(1)
  })

  it('should accept optional onError callback', async () => {
    const mockError = new Error('Failed')
    const mockMutation = vi.fn().mockRejectedValue(mockError)
    const onError = vi.fn()
    const mockApi = { test: { action: 'test.action' } }

    vi.mocked(useMutation).mockReturnValue(mockMutation)

    const { result } = renderHook(() =>
      useConvexMutation(mockApi.test.action as any, { onError })
    )

    await expect(result.current.mutate({ data: 'test' })).rejects.toThrow()

    expect(onError).toHaveBeenCalledWith(mockError)
    expect(onError).toHaveBeenCalledTimes(1)
  })

  it('should reset error state on new mutation', async () => {
    const mockError = new Error('First error')
    const mockMutation = vi.fn()
      .mockRejectedValueOnce(mockError)
      .mockResolvedValueOnce({ success: true })
    const mockApi = { test: { action: 'test.action' } }

    vi.mocked(useMutation).mockReturnValue(mockMutation)

    const { result } = renderHook(() =>
      useConvexMutation(mockApi.test.action as any)
    )

    await expect(result.current.mutate({ data: 'test1' })).rejects.toThrow()

    await waitFor(() => {
      expect(result.current.error).toBe(mockError)
    })

    await result.current.mutate({ data: 'test2' })

    await waitFor(() => {
      expect(result.current.error).toBeNull()
    })
  })

  it('should pass arguments to underlying mutation', async () => {
    const mockMutation = vi.fn().mockResolvedValue({})
    const mockApi = { test: { action: 'test.action' } }
    const args = { userId: '123', action: 'update', data: { name: 'Test' } }

    vi.mocked(useMutation).mockReturnValue(mockMutation)

    const { result } = renderHook(() =>
      useConvexMutation(mockApi.test.action as any)
    )

    await result.current.mutate(args)

    expect(mockMutation).toHaveBeenCalledWith(args)
  })
})
