import type { HTMLAttributes, ReactNode } from 'react';

type Variant = 'flat' | 'elevated';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  variant?: Variant;
}

const VARIANT: Record<Variant, string> = {
  flat: 'bg-surface shadow-none border border-border-subtle',
  elevated: 'bg-surfaceElevated shadow-sm',
};

// Container primitive. Two variants only: flat (bordered surface) and
// elevated (raised, no border). Padding and child layout are the
// caller's responsibility — wrap with <VStack gap={3}> inside if you
// want the typical card layout.
export function Card({
  children,
  variant = 'flat',
  className = '',
  ...rest
}: CardProps) {
  return (
    <div
      className={`${VARIANT[variant]} rounded-lg p-4 ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}
