import { useSyncExternalStore } from 'react';

/**
 * Custom hook to handle hydration safely
 * Returns false on server/initial render, true after client hydration
 * Prevents hydration mismatches
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    () => () => { },
    () => true,
    () => false
  );
}

/**
 * Wrapper component for content that needs hydration protection
 */
export function HydrationGuard({ children }: { children: React.ReactNode }) {
  const hydrated = useHydrated();

  if (!hydrated) {
    return null;
  }

  return <>{children}</>;
}
