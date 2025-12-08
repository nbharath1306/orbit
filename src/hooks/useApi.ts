'use client';

import { useState, useEffect, useCallback } from 'react';

interface UseApiOptions<T> {
  url: string;
  initialData?: T | null;
  dependencies?: any[];
  skip?: boolean;
  retries?: number;
  retryDelay?: number;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

interface UseApiResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  retry: () => Promise<void>;
}

export function useApi<T = any>({
  url,
  initialData = null,
  dependencies = [],
  skip = false,
  retries = 3,
  retryDelay = 1000,
  onSuccess,
  onError,
}: UseApiOptions<T>): UseApiResult<T> {
  const [data, setData] = useState<T | null>(initialData ?? null);
  const [loading, setLoading] = useState<boolean>(!skip);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(
    async (attemptNumber = 0): Promise<void> => {
      if (skip) return;

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(url, {
          headers: {
            'Content-Type': 'application/json',
          },
          cache: 'no-store',
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        setData(result);
        setError(null);
        
        if (onSuccess) {
          onSuccess(result);
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error('An unknown error occurred');
        
        // Retry logic
        if (attemptNumber < retries) {
          console.warn(`API call failed (attempt ${attemptNumber + 1}/${retries + 1}), retrying...`, error);
          setTimeout(() => {
            fetchData(attemptNumber + 1);
          }, retryDelay * (attemptNumber + 1)); // Exponential backoff
        } else {
          console.error('API call failed after all retries:', error);
          setError(error);
          
          if (onError) {
            onError(error);
          }
        }
      } finally {
        if (attemptNumber === retries) {
          setLoading(false);
        }
      }
    },
    [url, skip, retries, retryDelay, onSuccess, onError]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData, ...dependencies]);

  const refetch = useCallback(() => fetchData(0), [fetchData]);
  const retry = useCallback(() => fetchData(0), [fetchData]);

  return { data, loading, error, refetch, retry };
}

interface UseMutationOptions<T, V> {
  url: string;
  method?: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

interface UseMutationResult<T, V> {
  mutate: (variables: V) => Promise<T | null>;
  data: T | null;
  loading: boolean;
  error: Error | null;
  reset: () => void;
}

export function useMutation<T = any, V = any>({
  url,
  method = 'POST',
  onSuccess,
  onError,
}: UseMutationOptions<T, V>): UseMutationResult<T, V> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(
    async (variables: V): Promise<T | null> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(variables),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        setData(result);
        setError(null);
        
        if (onSuccess) {
          onSuccess(result);
        }

        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('An unknown error occurred');
        setError(error);
        
        if (onError) {
          onError(error);
        }

        return null;
      } finally {
        setLoading(false);
      }
    },
    [url, method, onSuccess, onError]
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return { mutate, data, loading, error, reset };
}

export default useApi;
