'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';
import { useHydrated } from '@/hooks/useHydrated';

interface SafeButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * SafeButton - A button component that never causes hydration errors
 * Renders safely on server with suppressHydrationWarning
 * Works perfectly with browser extensions
 */
export const SafeButton = forwardRef<HTMLButtonElement, SafeButtonProps>(
  ({ children, fallback, ...props }, ref) => {
    return (
      <button
        ref={ref}
        suppressHydrationWarning
        {...props}
      >
        {children}
      </button>
    );
  }
);

SafeButton.displayName = 'SafeButton';

/**
 * ClientOnlyButton - Only renders on client after hydration
 * Use for buttons with extensions or dynamic content
 */
export const ClientOnlyButton = forwardRef<HTMLButtonElement, SafeButtonProps>(
  ({ children, fallback, ...props }, ref) => {
    const hydrated = useHydrated();

    if (!hydrated) {
      return <button disabled={true}>{fallback || children}</button>;
    }

    return (
      <button
        ref={ref}
        suppressHydrationWarning
        {...props}
      >
        {children}
      </button>
    );
  }
);

ClientOnlyButton.displayName = 'ClientOnlyButton';
