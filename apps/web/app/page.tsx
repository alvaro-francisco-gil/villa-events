'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getVillages } from '@villa-events/shared/services/villageService';
import type { VillageData } from '@villa-events/shared/models/village';
import { VillageCard } from '@/components/village/VillageCard';
import { SkeletonLoader } from '@/components/common/SkeletonLoader';
import { useAuth } from '@/hooks/useAuth';

export default function HomePage() {
  const { user, profile, loading: authLoading, profileChecked } = useAuth();
  const router = useRouter();
  const [villages, setVillages] = useState<(VillageData & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);

  // Resume a pending invite if any, then route an authenticated user to their village.
  useEffect(() => {
    if (authLoading || !profileChecked) return;
    if (!user || !profile) return;

    if (typeof window !== 'undefined') {
      const pending = sessionStorage.getItem('villa-events:pendingInvite');
      if (pending) {
        sessionStorage.removeItem('villa-events:pendingInvite');
        router.replace(pending);
        return;
      }
    }

    if (profile.activeVillageId) {
      router.replace(`/village/${profile.activeVillageId}`);
    }
  }, [user, profile, authLoading, profileChecked, router]);

  // Anonymous (or authenticated but without an active village) → show picker.
  useEffect(() => {
    if (authLoading || !profileChecked) return;
    if (user && profile?.activeVillageId) return; // will be redirected away
    getVillages()
      .then(setVillages)
      .finally(() => setLoading(false));
  }, [user, profile, authLoading, profileChecked]);

  if (authLoading || !profileChecked || (user && profile?.activeVillageId)) {
    return (
      <div className="px-4 py-6">
        <SkeletonLoader className="h-52 rounded-xl" />
      </div>
    );
  }

  const isAuthedWithoutVillage = !!user && !!profile && !profile.activeVillageId;

  return (
    <div className="px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Villa Events</h1>
      <p className="text-sm text-gray-500 mb-6">
        {isAuthedWithoutVillage
          ? 'Aún no perteneces a ningún pueblo. Elige uno para visitarlo.'
          : 'Descubre eventos en tu pueblo'}
      </p>

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
