'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getOrganization } from '@villa-events/shared/services/organizationService';
import { getOrgEvents } from '@villa-events/shared/services/eventService';
import { isOrgMember } from '@villa-events/shared/services/orgMemberService';
import type { OrganizationData } from '@villa-events/shared/models/organization';
import type { EventData } from '@villa-events/shared/models/event';
import { useAuth } from '@/hooks/useAuth';
import { useVillage } from '@/hooks/useVillage';
import { EventCard } from '@/components/event/EventCard';
import { SkeletonLoader } from '@/components/common/SkeletonLoader';
import { ArrowLeft, Plus } from 'lucide-react';

interface OrgPageProps {
  params: Promise<{ id: string; orgId: string }>;
}

const orgTypeLabel: Record<OrganizationData['type'], string> = {
  ayuntamiento: 'Ayuntamiento',
  peña: 'Peña',
  asociación: 'Asociación',
};

const orgStatusLabel: Record<OrganizationData['status'], string> = {
  pending: 'Pendiente',
  approved: 'Aprobada',
  rejected: 'Rechazada',
};

const orgStatusColor: Record<OrganizationData['status'], string> = {
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

export default function OrgPage({ params }: OrgPageProps) {
  const { id: villageId, orgId } = use(params);
  const { user } = useAuth();
  const { isAdmin } = useVillage();

  const [org, setOrg] = useState<(OrganizationData & { id: string }) | null>(null);
  const [events, setEvents] = useState<(EventData & { id: string })[]>([]);
  const [isMember, setIsMember] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [o, evts] = await Promise.all([
        getOrganization(villageId, orgId),
        getOrgEvents(villageId, orgId),
      ]);
      setOrg(o);
      setEvents(evts);

      if (user) {
        const member = await isOrgMember(villageId, orgId, user.uid);
        setIsMember(member);
      }
      setLoading(false);
    }
    load();
  }, [villageId, orgId, user]);

  if (loading) {
    return (
      <div className="px-4 py-6 space-y-4">
        <SkeletonLoader className="h-8 w-48" />
        <SkeletonLoader className="h-4 w-32" />
        {[1, 2].map((i) => <SkeletonLoader key={i} className="h-44 rounded-xl" />)}
      </div>
    );
  }

  if (!org) {
    return (
      <div className="px-4 py-6">
        <Link href={`/village/${villageId}`} className="flex items-center gap-1 text-blue-600 text-sm mb-4">
          <ArrowLeft size={16} /> Volver
        </Link>
        <p className="text-gray-500 text-center py-12">Organización no encontrada.</p>
      </div>
    );
  }

  const canCreateEvent = isMember || isAdmin;

  return (
    <div className="px-4 py-6">
      <Link href={`/village/${villageId}`} className="flex items-center gap-1 text-blue-600 text-sm mb-4">
        <ArrowLeft size={16} /> Volver al pueblo
      </Link>

      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6">
        <div className="flex items-start justify-between gap-2">
          <h1 className="text-2xl font-bold text-gray-900">{org.name}</h1>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${orgStatusColor[org.status]}`}>
            {orgStatusLabel[org.status]}
          </span>
        </div>
        <p className="text-sm text-gray-500 mt-0.5">{orgTypeLabel[org.type]}</p>
        {org.description && (
          <p className="text-sm text-gray-600 mt-3 whitespace-pre-line">{org.description}</p>
        )}
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Eventos</h2>
        {canCreateEvent && (
          <Link
            href={`/village/${villageId}/org/${orgId}/events/new`}
            className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition"
          >
            <Plus size={16} /> Nuevo evento
          </Link>
        )}
      </div>

      {events.length === 0 ? (
        <p className="text-gray-500 text-center py-8 text-sm">No hay eventos de esta organización.</p>
      ) : (
        <div className="space-y-4">
          {events.map((event) => (
            <EventCard key={event.id} event={event} villageId={villageId} />
          ))}
        </div>
      )}
    </div>
  );
}
