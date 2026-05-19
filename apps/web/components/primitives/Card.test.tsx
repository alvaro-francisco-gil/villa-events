import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Card } from './Card';

describe('<Card>', () => {
  it('renders children', () => {
    render(<Card>hello</Card>);
    expect(screen.getByText('hello')).toBeInTheDocument();
  });

  it('applies the default flat variant (no shadow)', () => {
    render(<Card data-testid="c">x</Card>);
    expect(screen.getByTestId('c').className).toMatch(/shadow-none/);
  });

  it('applies the elevated variant shadow', () => {
    render(<Card variant="elevated" data-testid="c">x</Card>);
    expect(screen.getByTestId('c').className).toMatch(/shadow-sm/);
  });

  it('applies rounded-lg by default', () => {
    render(<Card data-testid="c">x</Card>);
    expect(screen.getByTestId('c').className).toMatch(/rounded-lg/);
  });
});
