'use client';

import type { PersonaData } from '@villa-events/shared/models/user';
import { Pencil, Trash2, User } from 'lucide-react';

interface PersonaCardProps {
  persona: PersonaData & { id: string };
  onEdit: () => void;
  onDelete: () => void;
}

export function PersonaCard({ persona, onEdit, onDelete }: PersonaCardProps) {
  const birthdayStr = persona.birthday.toLocaleDateString('es-ES', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 flex gap-3">
      {persona.photoURL ? (
        <img src={persona.photoURL} alt={persona.name} className="w-12 h-12 rounded-full object-cover shrink-0" />
      ) : (
        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
          <User size={22} className="text-gray-400" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-gray-900">{persona.name}</h3>
        <p className="text-xs text-gray-500 mt-0.5">{birthdayStr}</p>
        {persona.biography && (
          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{persona.biography}</p>
        )}
      </div>
      <div className="flex flex-col gap-1 shrink-0">
        <button onClick={onEdit} className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition">
          <Pencil size={15} />
        </button>
        <button onClick={onDelete} className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition">
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );
}
