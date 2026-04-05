'use client';

import { useEffect, useState } from 'react';
import { getVillages } from '@villa-events/shared/services/villageService';
import type { VillageData } from '@villa-events/shared/models/village';
import { VillageCard } from '@/components/village/VillageCard';
import { SkeletonLoader } from '@/components/common/SkeletonLoader';

export default function HomePage() {
  const [villages, setVillages] = useState<(VillageData & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getVillages()
      .then(setVillages)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Villa Events</h1>
      <p className="text-sm text-gray-500 mb-6">Descubre eventos en tu pueblo</p>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <SkeletonLoader key={i} className="h-52 rounded-xl" />
          ))}
        </div>
      ) : villages.length === 0 ? (
        <p className="text-gray-500 text-center py-12">No hay pueblos disponibles todavía.</p>
      ) : (
        <div className="space-y-4">
          {villages.map((village) => (
            <VillageCard key={village.id} village={village} />
          ))}
        </div>
      )}
    </div>
  );
}
