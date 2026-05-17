'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { isAppAdmin } from '@cultuvilla/shared/services/adminService';
import { getVillages } from '@cultuvilla/shared/services/villageService';
import type { VillageData } from '@cultuvilla/shared/models/village';
import { TopBar } from '@/components/common/TopBar';
import { VillageForm } from '@/components/admin/VillageForm';
import { Pencil, Settings, Plus } from 'lucide-react';

type Status = 'checking' | 'allowed';
type FormMode = { kind: 'closed' } | { kind: 'create' } | { kind: 'edit'; village: VillageData & { id: string } };

export default function AdminPage() {
  const { user, loading, refreshProfile } = useAuth();
  const router = useRouter();
  const [status, setStatus] = useState<Status>('checking');
  const [villages, setVillages] = useState<(VillageData & { id: string })[]>([]);
  const [form, setForm] = useState<FormMode>({ kind: 'closed' });

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    isAppAdmin(user.uid).then((ok) => {
      if (ok) setStatus('allowed');
      else router.replace('/');
    });
  }, [user, loading, router]);

  useEffect(() => {
    if (status !== 'allowed') return;
    getVillages().then(setVillages);
  }, [status]);

  const reloadVillages = async () => {
    setVillages(await getVillages());
  };

  if (loading || status === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Cargando...</p>
      </div>
    );
  }

  return (
    <>
      <TopBar title="Administración" />
      <div className="p-4 space-y-6">
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Pueblos</h2>
            {form.kind === 'closed' ? (
              <button
                onClick={() => setForm({ kind: 'create' })}
                className="text-sm text-blue-600 flex items-center gap-1"
              >
                <Plus size={14} /> Nuevo pueblo
              </button>
            ) : (
              <button onClick={() => setForm({ kind: 'closed' })} className="text-sm text-gray-500">
                Cerrar formulario
              </button>
            )}
          </div>

          {form.kind === 'create' && (
            <VillageForm
              mode="create"
              currentUserId={user!.uid}
              onSubmitted={async () => {
                setForm({ kind: 'closed' });
                await reloadVillages();
                await refreshProfile();
              }}
              onCancel={() => setForm({ kind: 'closed' })}
            />
          )}

          {form.kind === 'edit' && (
            <VillageForm
              mode="edit"
              currentUserId={user!.uid}
              initial={form.village}
              onSubmitted={async () => {
                setForm({ kind: 'closed' });
                await reloadVillages();
              }}
              onCancel={() => setForm({ kind: 'closed' })}
            />
          )}

          {villages.length === 0 ? (
            <p className="text-sm text-gray-500">Aún no hay pueblos.</p>
          ) : (
            <ul className="space-y-2">
              {villages.map((v) => (
                <li
                  key={v.id}
                  className="bg-white rounded-lg p-3 border border-gray-200 flex items-center gap-3"
                >
                  {v.images[0] ? (
                    <img src={v.images[0]} alt="" className="w-12 h-12 rounded-lg object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                      {v.name[0]}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <Link href={`/village/${v.id}`} className="block">
                      <p className="font-medium truncate">{v.name}</p>
                      <p className="text-xs text-gray-500 truncate">
                        {v.provincia}, {v.comunidadAutonoma}
                      </p>
                    </Link>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setForm({ kind: 'edit', village: v })}
                      className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                      title="Editar pueblo"
                    >
                      <Pencil size={15} />
                    </button>
                    <Link
                      href={`/village/${v.id}/admin`}
                      className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                      title="Gestionar (invitaciones, organizaciones)"
                    >
                      <Settings size={15} />
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
