'use client';

import { InputHTMLAttributes, forwardRef } from 'react';
import { useHydrated } from '@/hooks/useHydrated';

interface SafeInputProps extends InputHTMLAttributes<HTMLInputElement> {}

/**
 * SafeInput - Input component that never causes hydration errors
 * Renders safely with suppressHydrationWarning
 */
export const SafeInput = forwardRef<HTMLInputElement, SafeInputProps>(
  (props, ref) => {
    return (
      <input
        ref={ref}
        suppressHydrationWarning
        {...props}
      />
    );
  }
);

SafeInput.displayName = 'SafeInput';

/**
 * ClientOnlyInput - Only renders on client after hydration
 * Use for inputs with browser extensions or special handling
 */
export const ClientOnlyInput = forwardRef<HTMLInputElement, SafeInputProps>(
  (props, ref) => {
    const hydrated = useHydrated();

    if (!hydrated) {
      return <input disabled={true} />;
    }

    return (
      <input
        ref={ref}
        suppressHydrationWarning
        {...props}
      />
    );
  }
);

ClientOnlyInput.displayName = 'ClientOnlyInput';
