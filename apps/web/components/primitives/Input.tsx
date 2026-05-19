import type { InputHTMLAttributes } from 'react';

interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: string;
  onChangeText: (next: string) => void;
  label?: string;
  error?: string;
}

// Controlled text input. `onChangeText` (vs `onChange`) keeps the API
// aligned with React Native, where event objects don't exist. Label and
// error are rendered inline so callers don't reinvent the wrapper
// markup on every form.
export function Input({
  value,
  onChangeText,
  label,
  error,
  className = '',
  ...rest
}: InputProps) {
  return (
    <label className="flex flex-col gap-1">
      {label && (
        <span className="text-bodySm text-muted">{label}</span>
      )}
      <input
        type="text"
        value={value}
        onChange={(e) => onChangeText(e.target.value)}
        className={`border rounded-md px-3 py-2 text-body bg-surface focus:outline-none focus:ring-2 focus:ring-accent ${
          error ? 'border-danger' : 'border-border-subtle'
        } ${className}`}
        {...rest}
      />
      {error && (
        <span className="text-caption text-danger">{error}</span>
      )}
    </label>
  );
}
