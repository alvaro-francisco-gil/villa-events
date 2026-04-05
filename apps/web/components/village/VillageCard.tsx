'use client';

import Link from 'next/link';
import type { VillageData } from '@villa-events/shared/models/village';
import { MapPin } from 'lucide-react';

interface VillageCardProps {
  village: VillageData & { id: string };
}

export function VillageCard({ village }: VillageCardProps) {
  const imageUrl = village.images[0] ?? null;

  return (
    <Link href={`/village/${village.id}`} className="block rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition overflow-hidden">
      {imageUrl ? (
        <img src={imageUrl} alt={village.name} className="w-full h-40 object-cover" />
      ) : (
        <div className="w-full h-40 bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
          <span className="text-blue-400 text-4xl font-bold">{village.name[0]}</span>
        </div>
      )}
      <div className="p-4">
        <h2 className="text-lg font-semibold text-gray-900">{village.name}</h2>
        <div className="flex items-center gap-1 mt-1 text-sm text-gray-500">
          <MapPin size={13} />
          <span>{village.provincia}, {village.comunidadAutonoma}</span>
        </div>
        {village.description && (
          <p className="mt-2 text-sm text-gray-600 line-clamp-2">{village.description}</p>
        )}
      </div>
    </Link>
  );
}
