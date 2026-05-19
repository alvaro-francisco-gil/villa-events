import type { HTMLAttributes, ReactNode } from 'react';

interface ScreenProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

// Page-level wrapper. Sets the surface background, the mobile-first reading
// column, and the bottom padding that keeps content clear of the floating
// BottomNav. Every route renders inside one of these.
export function Screen({ children, className = '', ...rest }: ScreenProps) {
  return (
    <div
      className={`bg-surface text-primary min-h-screen max-w-lg mx-auto pb-20 ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}
