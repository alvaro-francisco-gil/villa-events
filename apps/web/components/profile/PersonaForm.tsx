'use client';

import { useRef, useState } from 'react';
import { Camera, User } from 'lucide-react';
import type { PersonaData } from '@villa-events/shared/models/user';

interface PersonaFormProps {
  initial?: Partial<Pick<PersonaData, 'name' | 'birthday' | 'biography' | 'photoURL'>>;
  onSubmit: (data: { name: string; birthday: Date; biography: string | null; photoFile: File | null }) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
}

export function PersonaForm({ initial, onSubmit, onCancel, submitLabel = 'Guardar' }: PersonaFormProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [birthday, setBirthday] = useState(
    initial?.birthday ? initial.birthday.toISOString().split('T')[0] : ''
  );
  const [biography, setBiography] = useState(initial?.biography ?? '');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(initial?.photoURL ?? null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('El archivo no es una imagen'); return; }
    if (file.size > 5 * 1024 * 1024) { setError('La imagen supera 5 MB'); return; }
    setError('');
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

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
        photoFile,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex justify-center mb-1">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="relative w-20 h-20 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center group focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {photoPreview ? (
            <img src={photoPreview} alt="Foto" className="w-full h-full object-cover" />
          ) : (
            <User size={32} className="text-gray-400" />
          )}
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
            <Camera size={20} className="text-white" />
          </div>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handlePhotoChange}
        />
      </div>

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
