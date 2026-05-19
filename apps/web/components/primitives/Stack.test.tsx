import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HStack } from './HStack';
import { VStack } from './VStack';

describe('<HStack>', () => {
  it('renders children in a row', () => {
    render(<HStack data-testid="row">a</HStack>);
    expect(screen.getByTestId('row').className).toMatch(/flex-row/);
  });

  it('applies the spacing gap', () => {
    render(<HStack gap={2} data-testid="row">a</HStack>);
    expect(screen.getByTestId('row').className).toMatch(/gap-2/);
  });

  it('default gap is 2', () => {
    render(<HStack data-testid="row">a</HStack>);
    expect(screen.getByTestId('row').className).toMatch(/gap-2/);
  });

  it('aligns items via the align prop', () => {
    render(<HStack align="center" data-testid="row">a</HStack>);
    expect(screen.getByTestId('row').className).toMatch(/items-center/);
  });
});

describe('<VStack>', () => {
  it('renders children in a column', () => {
    render(<VStack data-testid="col">a</VStack>);
    expect(screen.getByTestId('col').className).toMatch(/flex-col/);
  });

  it('applies the spacing gap', () => {
    render(<VStack gap={4} data-testid="col">a</VStack>);
    expect(screen.getByTestId('col').className).toMatch(/gap-4/);
  });

  it('default gap is 3', () => {
    render(<VStack data-testid="col">a</VStack>);
    expect(screen.getByTestId('col').className).toMatch(/gap-3/);
  });
});
