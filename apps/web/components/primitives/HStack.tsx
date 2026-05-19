import type { HTMLAttributes, ReactNode } from 'react';
import type { SpacingKey } from '@cultuvilla/shared/design-system';

type Align = 'start' | 'center' | 'end' | 'stretch' | 'baseline';
type Justify = 'start' | 'center' | 'end' | 'between' | 'around';

interface HStackProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  gap?: SpacingKey;
  align?: Align;
  justify?: Justify;
}

const ALIGN: Record<Align, string> = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  stretch: 'items-stretch',
  baseline: 'items-baseline',
};

const JUSTIFY: Record<Justify, string> = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
  between: 'justify-between',
  around: 'justify-around',
};

// Horizontal stack. `gap` keys come from the spacing scale so callers
// never write `marginRight: 8` to space children.
export function HStack({
  children,
  gap = 2,
  align,
  justify,
  className = '',
  ...rest
}: HStackProps) {
  return (
    <div
      className={`flex flex-row gap-${gap} ${align ? ALIGN[align] : ''} ${
        justify ? JUSTIFY[justify] : ''
      } ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}
