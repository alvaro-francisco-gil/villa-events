import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Screen } from './Screen';

describe('<Screen>', () => {
  it('renders children', () => {
    render(<Screen>hello</Screen>);
    expect(screen.getByText('hello')).toBeInTheDocument();
  });

  it('applies the default surface background', () => {
    render(<Screen data-testid="root">x</Screen>);
    expect(screen.getByTestId('root').className).toMatch(/bg-surface/);
  });

  it('caps width to the mobile-first reading column', () => {
    render(<Screen data-testid="root">x</Screen>);
    expect(screen.getByTestId('root').className).toMatch(/max-w-lg/);
  });

  it('passes through className and merges, not replaces', () => {
    render(<Screen className="custom" data-testid="root">x</Screen>);
    const el = screen.getByTestId('root');
    expect(el.className).toMatch(/custom/);
    expect(el.className).toMatch(/bg-surface/);
  });
});
