import { useState, useCallback } from 'react'
import { useMutation } from 'convex/react'
import { FunctionReference } from 'convex/server'

interface UseConvexMutationOptions<TResult> {
  onSuccess?: (result: TResult) => void
  onError?: (error: Error) => void
}

interface UseConvexMutationResult<TArgs, TResult> {
  mutate: (args: TArgs) => Promise<TResult>
  isLoading: boolean
  error: Error | null
}

export function useConvexMutation<TArgs = any, TResult = any>(
  mutation: FunctionReference<'mutation', 'public', any, any>,
  options?: UseConvexMutationOptions<TResult>
): UseConvexMutationResult<TArgs, TResult> {
  const convexMutation = useMutation(mutation)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const mutate = useCallback(
    async (args: TArgs): Promise<TResult> => {
      setIsLoading(true)
      setError(null)

      try {
        const result = await convexMutation(args as any)
        options?.onSuccess?.(result)
        return result
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err))
        setError(error)
        options?.onError?.(error)
        throw error
      } finally {
        setIsLoading(false)
      }
    },
    [convexMutation, options]
  )

  return {
    mutate,
    isLoading,
    error
  }
}
