'use client';

import { use, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { validateInviteToken, consumeInviteToken } from '@villa-events/shared/services/inviteTokenService';
import { addVillageMember, isVillageMember } from '@villa-events/shared/services/villageMemberService';
import { getVillage } from '@villa-events/shared/services/villageService';
import type { VillageData } from '@villa-events/shared/models/village';
import { useAuth } from '@/hooks/useAuth';
import { CheckCircle, XCircle, Loader } from 'lucide-react';

interface InvitePageProps {
  params: Promise<{ token: string }>;
}

type State = 'loading' | 'invalid' | 'already-member' | 'joining' | 'joined' | 'unauthenticated' | 'error';

export default function InvitePage({ params }: InvitePageProps) {
  const { token } = use(params);
  const searchParams = useSearchParams();
  const villageId = searchParams.get('v') ?? '';
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [state, setState] = useState<State>('loading');
  const [village, setVillage] = useState<(VillageData & { id: string }) | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!villageId) {
      setState('invalid');
      return;
    }

    async function validate() {
      try {
        const [valid, v] = await Promise.all([
          validateInviteToken(villageId, token),
          getVillage(villageId),
        ]);
        setVillage(v);

        if (!valid) {
          setState('invalid');
          return;
        }

        if (!user) {
          setState('unauthenticated');
          return;
        }

        const alreadyMember = await isVillageMember(villageId, user.uid);
        if (alreadyMember) {
          setState('already-member');
          return;
        }

        // Auto-join
        setState('joining');
        await addVillageMember(villageId, user.uid, 'user');
        await consumeInviteToken(villageId, token);
        setState('joined');

        setTimeout(() => router.push(`/village/${villageId}`), 2000);
      } catch (e) {
        setErrorMsg(e instanceof Error ? e.message : 'Error desconocido');
        setState('error');
      }
    }

    validate();
  }, [authLoading, user, villageId, token, router]);

  if (state === 'loading' || authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 px-4">
        <Loader size={32} className="animate-spin text-blue-500" />
        <p className="text-gray-600">Validando enlace de invitación...</p>
      </div>
    );
  }

  if (state === 'unauthenticated') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 px-4 text-center">
        <div className="text-5xl">🏘️</div>
        <h1 className="text-xl font-bold text-gray-900">
          Invitación a {village?.name ?? 'un pueblo'}
        </h1>
        <p className="text-gray-600 text-sm">Para unirte, primero debes iniciar sesión.</p>
        <Link
          href={`/login?redirect=/invite/${token}?v=${villageId}`}
          className="bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition"
        >
          Iniciar sesión
        </Link>
      </div>
    );
  }

  if (state === 'invalid') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 px-4 text-center">
        <XCircle size={48} className="text-red-500" />
        <h1 className="text-xl font-bold text-gray-900">Enlace no válido</h1>
        <p className="text-gray-600 text-sm">Este enlace de invitación ha expirado o no es válido.</p>
        <Link href="/" className="text-blue-600 hover:underline text-sm">Volver al inicio</Link>
      </div>
    );
  }

  if (state === 'already-member') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 px-4 text-center">
        <CheckCircle size={48} className="text-green-500" />
        <h1 className="text-xl font-bold text-gray-900">Ya eres miembro</h1>
        <p className="text-gray-600 text-sm">Ya perteneces a {village?.name ?? 'este pueblo'}.</p>
        <Link href={`/village/${villageId}`} className="bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition">
          Ir al pueblo
        </Link>
      </div>
    );
  }

  if (state === 'joined') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 px-4 text-center">
        <CheckCircle size={48} className="text-green-500" />
        <h1 className="text-xl font-bold text-gray-900">¡Bienvenido!</h1>
        <p className="text-gray-600 text-sm">Te has unido a {village?.name ?? 'el pueblo'} correctamente.</p>
        <p className="text-xs text-gray-400">Redirigiendo...</p>
      </div>
    );
  }

  if (state === 'joining') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 px-4">
        <Loader size={32} className="animate-spin text-blue-500" />
        <p className="text-gray-600">Uniéndote al pueblo...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 px-4 text-center">
      <XCircle size={48} className="text-red-500" />
      <h1 className="text-xl font-bold text-gray-900">Error</h1>
      <p className="text-gray-600 text-sm">{errorMsg}</p>
      <Link href="/" className="text-blue-600 hover:underline text-sm">Volver al inicio</Link>
    </div>
  );
}
