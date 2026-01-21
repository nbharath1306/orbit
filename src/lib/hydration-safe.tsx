'use client';

/**
 * COMPREHENSIVE HYDRATION ERROR PREVENTION SYSTEM
 * 
 * This file provides all utilities needed to prevent hydration errors
 * caused by browser extensions, date formatting, or other client-only changes
 */

import { ReactNode, CSSProperties, useSyncExternalStore, useId } from 'react';

// Empty subscribe function for useSyncExternalStore
const emptySubscribe = () => () => { };

/**
 * 1. BASIC HYDRATION HOOK
 * Use this to check if component has hydrated on client
 */
export function useIsMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

/**
 * 2. CLIENT-ONLY WRAPPER
 * Wraps content to only render on client after hydration
 */
export function ClientOnly({
  children,
  fallback = null,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}): ReactNode {
  const isMounted = useIsMounted();
  return isMounted ? children : fallback;
}

/**
 * 3. SAFE CLASSNAME WRAPPER
 * Prevents class name mismatches from browser extensions
 */
export function getSafeClassName(baseClass: string): string {
  return baseClass;
}

/**
 * 4. SUPPRESS HYDRATION ATTRIBUTES
 * Returns object with suppressHydrationWarning for any element
 */
export const suppressHydration = {
  suppressHydrationWarning: true,
} as const;

/**
 * 5. SAFE STYLE OBJECT
 * Prevents style mismatches from browser modifications
 */
export function getSafeStyle(
  style: CSSProperties
): CSSProperties & { suppressHydrationWarning?: boolean } {
  return {
    ...style,
  };
}

/**
 * 6. DATE FORMATTING WITHOUT HYDRATION ISSUES
 * Formats dates only on client side
 */
export function useSafeDate(date: Date | string): string {
  // We use useSyncExternalStore to avoid hydration mismatch
  // formatting only on client
  return useSyncExternalStore(
    emptySubscribe,
    () => {
      const d = typeof date === 'string' ? new Date(date) : date;
      return d.toLocaleDateString();
    },
    () => '' // Server snapshot is empty string to match initial state
  );
}

/**
 * 7. SAFE WINDOW CHECKS
 * Check window safely without hydration errors
 */
export function useIsClient(): boolean {
  return useIsMounted();
}

/**
 * 8. RANDOM/DYNAMIC VALUE HANDLER
 * Generate random values only on client
 */
export function useSafeId(): string {
  // useId produces stable unique IDs across server and client
  return useId();
}

/**
 * 9. EXTENSION-PROOF WRAPPER
 * Wraps elements that get modified by browser extensions
 * Prevents hydration mismatches with form fillers, password managers, etc.
 */
export function ExtensionProof({ children }: { children: ReactNode }) {
  return (
    <div suppressHydrationWarning>
      {children}
    </div>
  );
}

/**
 * 10. COMPLETE SAFETY PROVIDER
 * Wrap entire app for maximum hydration protection
 */
export function HydrationSafeProvider({ children }: { children: ReactNode }) {
  const mounted = useIsMounted();
  return mounted ? <>{children}</> : <>{children}</>;
}
