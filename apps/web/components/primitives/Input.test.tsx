import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Input } from './Input';

describe('<Input>', () => {
  it('renders a controlled text input with the value', () => {
    render(<Input value="hi" onChangeText={() => {}} />);
    const el = screen.getByRole('textbox') as HTMLInputElement;
    expect(el.value).toBe('hi');
  });

  it('calls onChangeText with the new value', () => {
    const onChangeText = vi.fn();
    render(<Input value="" onChangeText={onChangeText} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'x' } });
    expect(onChangeText).toHaveBeenCalledWith('x');
  });

  it('shows the label when provided', () => {
    render(
      <Input value="" onChangeText={() => {}} label="Nombre" />,
    );
    expect(screen.getByText('Nombre')).toBeInTheDocument();
  });

  it('shows the error message and applies the error class', () => {
    render(
      <Input
        value=""
        onChangeText={() => {}}
        error="Required"
        data-testid="wrap"
      />,
    );
    expect(screen.getByText('Required')).toBeInTheDocument();
    const input = screen.getByRole('textbox');
    expect(input.className).toMatch(/border-danger/);
  });
});
