'use client';

import { useState } from 'react';
import type { EventData } from '@villa-events/shared/models/event';
import type { LocationData } from '@villa-events/shared/models/core';

export interface EventFormData {
  title: string;
  description: string;
  startDate: Date;
  endDate: Date | null;
  location: LocationData;
  price: number | null;
  maxAttendees: number | null;
  telephoneRequired: boolean;
}

interface EventFormProps {
  initial?: Partial<EventData>;
  onSubmit: (data: EventFormData) => Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
  extraActions?: React.ReactNode;
}

function toInputDateTime(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function EventForm({ initial, onSubmit, onCancel, submitLabel = 'Guardar', extraActions }: EventFormProps) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [startDate, setStartDate] = useState(initial?.startDate ? toInputDateTime(initial.startDate) : '');
  const [endDate, setEndDate] = useState(initial?.endDate ? toInputDateTime(initial.endDate) : '');
  const [locationText, setLocationText] = useState(initial?.location?.text ?? '');
  const [price, setPrice] = useState(initial?.price !== null && initial?.price !== undefined ? String(initial.price) : '');
  const [maxAttendees, setMaxAttendees] = useState(
    initial?.maxAttendees !== null && initial?.maxAttendees !== undefined ? String(initial.maxAttendees) : ''
  );
  const [telephoneRequired, setTelephoneRequired] = useState(initial?.telephoneRequired ?? false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { setError('El título es obligatorio'); return; }
    if (!startDate) { setError('La fecha de inicio es obligatoria'); return; }

    setError('');
    setSubmitting(true);

    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        location: {
          type: 'text',
          coordinates: null,
          text: locationText.trim() || null,
        },
        price: price !== '' ? Number(price) : null,
        maxAttendees: maxAttendees !== '' ? Number(maxAttendees) : null,
        telephoneRequired,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs text-gray-500 mb-1">Título *</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          placeholder="Nombre del evento"
          className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-xs text-gray-500 mb-1">Descripción</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          placeholder="Describe el evento..."
          className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Fecha inicio *</label>
          <input
            type="datetime-local"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Fecha fin</label>
          <input
            type="datetime-local"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full border border-gray-300 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs text-gray-500 mb-1">Ubicación</label>
        <input
          type="text"
          value={locationText}
          onChange={(e) => setLocationText(e.target.value)}
          placeholder="Plaza Mayor, Calle..."
          className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Precio (€)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="0 = gratis"
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Plazas máx.</label>
          <input
            type="number"
            min="1"
            value={maxAttendees}
            onChange={(e) => setMaxAttendees(e.target.value)}
            placeholder="Sin límite"
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50">
        <input
          type="checkbox"
          checked={telephoneRequired}
          onChange={(e) => setTelephoneRequired(e.target.checked)}
          className="accent-blue-600"
        />
        <div>
          <p className="text-sm font-medium text-gray-900">Requerir teléfono</p>
          <p className="text-xs text-gray-500">Los asistentes deben tener teléfono en su perfil</p>
        </div>
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 border border-gray-300 py-3 rounded-xl text-sm text-gray-700 hover:bg-gray-50 transition"
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 bg-blue-600 text-white py-3 rounded-xl text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50"
        >
          {submitting ? 'Guardando...' : submitLabel}
        </button>
      </div>

      {extraActions}
    </form>
  );
}
