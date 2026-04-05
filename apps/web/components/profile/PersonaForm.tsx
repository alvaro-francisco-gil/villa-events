'use client';

import { useState } from 'react';
import type { PersonaData } from '@villa-events/shared/models/user';

interface PersonaFormProps {
  initial?: Partial<Pick<PersonaData, 'name' | 'birthday' | 'biography'>>;
  onSubmit: (data: { name: string; birthday: Date; biography: string | null }) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
}

export function PersonaForm({ initial, onSubmit, onCancel, submitLabel = 'Guardar' }: PersonaFormProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [birthday, setBirthday] = useState(
    initial?.birthday ? initial.birthday.toISOString().split('T')[0] : ''
  );
  const [biography, setBiography] = useState(initial?.biography ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError('El nombre es obligatorio'); return; }
    if (!birthday) { setError('La fecha de nacimiento es obligatoria'); return; }
    setError('');
    setSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        birthday: new Date(birthday),
        biography: biography.trim() || null,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input
        type="text"
        placeholder="Nombre"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <div>
        <label className="block text-xs text-gray-500 mb-1 ml-1">Fecha de nacimiento</label>
        <input
          type="date"
          value={birthday}
          onChange={(e) => setBirthday(e.target.value)}
          required
          className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <textarea
        placeholder="Biografía (opcional)"
        value={biography}
        onChange={(e) => setBiography(e.target.value)}
        rows={3}
        className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 border border-gray-300 py-2.5 rounded-xl text-sm text-gray-700 hover:bg-gray-50 transition"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50"
        >
          {submitting ? 'Guardando...' : submitLabel}
        </button>
      </div>
    </form>
  );
}
