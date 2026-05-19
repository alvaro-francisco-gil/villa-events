import type { HTMLAttributes, ReactNode } from 'react';
import type { SpacingKey } from '@cultuvilla/shared/design-system';

type Align = 'start' | 'center' | 'end' | 'stretch';

interface VStackProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  gap?: SpacingKey;
  align?: Align;
}

const ALIGN: Record<Align, string> = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  stretch: 'items-stretch',
};

// Vertical stack. Default `gap` is 3 (12px) — most form rows + card
// stacks land there.
export function VStack({
  children,
  gap = 3,
  align,
  className = '',
  ...rest
}: VStackProps) {
  return (
    <div
      className={`flex flex-col gap-${gap} ${align ? ALIGN[align] : ''} ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}
