'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createEvent } from '@villa-events/shared/services/eventService';
import { getOrganization } from '@villa-events/shared/services/organizationService';
import { useAuth } from '@/hooks/useAuth';
import { EventForm, type EventFormData } from '@/components/event/EventForm';
import { ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { OrganizationData } from '@villa-events/shared/models/organization';

interface NewEventPageProps {
  params: Promise<{ id: string; orgId: string }>;
}

export default function NewEventPage({ params }: NewEventPageProps) {
  const { id: villageId, orgId } = use(params);
  const { user } = useAuth();
  const router = useRouter();
  const [org, setOrg] = useState<(OrganizationData & { id: string }) | null>(null);

  useEffect(() => {
    getOrganization(villageId, orgId).then(setOrg);
  }, [villageId, orgId]);

  const handleSubmit = async (data: EventFormData) => {
    if (!user || !org) return;
    await createEvent(villageId, {
      ...data,
      organizationId: orgId,
      organizationName: org.name,
      createdBy: user.uid,
      status: 'draft',
    });
    router.push(`/village/${villageId}/org/${orgId}`);
  };

  return (
    <div className="px-4 py-6">
      <Link href={`/village/${villageId}/org/${orgId}`} className="flex items-center gap-1 text-blue-600 text-sm mb-4">
        <ArrowLeft size={16} /> Volver
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Nuevo evento</h1>
      {org && (
        <p className="text-sm text-gray-500 mb-4">Organización: {org.name}</p>
      )}
      <EventForm
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
        submitLabel="Crear evento"
      />
    </div>
  );
}
