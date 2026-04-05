'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { getUserProfile, updateUserProfile } from '@villa-events/shared/services/userService';
import type { UserData } from '@villa-events/shared/models/user';
import { User, Pencil, Users, LogOut } from 'lucide-react';
import { SkeletonLoader } from '@/components/common/SkeletonLoader';

export default function ProfilePage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const router = useRouter();

  const [profile, setProfile] = useState<(UserData & { id: string }) | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [telephone, setTelephone] = useState('');
  const [biography, setBiography] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      getUserProfile(user.uid)
        .then((p) => {
          setProfile(p);
          if (p) {
            setTelephone(p.telephone ?? '');
            setBiography(p.biography ?? '');
          }
        })
        .finally(() => setProfileLoading(false));
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setError('');
    try {
      await updateUserProfile(user.uid, {
        telephone: telephone.trim() || null,
        biography: biography.trim() || null,
      });
      setProfile((prev) => prev ? { ...prev, telephone: telephone.trim() || null, biography: biography.trim() || null } : prev);
      setEditMode(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  if (authLoading || profileLoading) {
    return (
      <div className="px-4 py-6 space-y-4">
        <SkeletonLoader className="h-16 w-16 rounded-full" />
        <SkeletonLoader className="h-6 w-40" />
        <SkeletonLoader className="h-4 w-56" />
      </div>
    );
  }

  if (!user) return null;

  const displayName = profile?.displayName ?? user.displayName ?? 'Sin nombre';
  const photoURL = profile?.photoURL ?? user.photoURL;

  return (
    <div className="px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Mi perfil</h1>

      {/* Avatar + name */}
      <div className="flex items-center gap-4 mb-6">
        {photoURL ? (
          <img src={photoURL} alt={displayName} className="w-16 h-16 rounded-full object-cover" />
        ) : (
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
            <User size={28} className="text-gray-400" />
          </div>
        )}
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{displayName}</h2>
          <p className="text-sm text-gray-500">{user.email}</p>
        </div>
      </div>

      {/* Profile details */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
        {!editMode ? (
          <div className="space-y-3">
            <div className="flex justify-between items-start">
              <h3 className="text-sm font-semibold text-gray-700">Información</h3>
              <button onClick={() => setEditMode(true)} className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm">
                <Pencil size={13} /> Editar
              </button>
            </div>
            <div>
              <p className="text-xs text-gray-500">Teléfono</p>
              <p className="text-sm text-gray-900">{profile?.telephone ?? 'No añadido'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Biografía</p>
              <p className="text-sm text-gray-900 whitespace-pre-line">{profile?.biography ?? 'No añadida'}</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700">Editar información</h3>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Teléfono</label>
              <input
                type="tel"
                value={telephone}
                onChange={(e) => setTelephone(e.target.value)}
                placeholder="+34 600 000 000"
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Biografía</label>
              <textarea
                value={biography}
                onChange={(e) => setBiography(e.target.value)}
                rows={3}
                placeholder="Cuéntanos algo sobre ti..."
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-2">
              <button onClick={() => setEditMode(false)} className="flex-1 border border-gray-300 py-2.5 rounded-xl text-sm text-gray-700 hover:bg-gray-50 transition">
                Cancelar
              </button>
              <button onClick={handleSave} disabled={saving} className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50">
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Link to personas */}
      <Link href="/profile/personas" className="flex items-center justify-between bg-white border border-gray-200 rounded-xl p-4 mb-4 hover:bg-gray-50 transition">
        <div className="flex items-center gap-3">
          <Users size={20} className="text-gray-500" />
          <span className="text-sm font-medium text-gray-900">Familiares / Acompañantes</span>
        </div>
        <span className="text-gray-400 text-lg">›</span>
      </Link>

      {/* Sign out */}
      <button
        onClick={handleSignOut}
        className="w-full flex items-center justify-center gap-2 border border-red-200 text-red-600 py-3 rounded-xl text-sm font-medium hover:bg-red-50 transition"
      >
        <LogOut size={16} />
        Cerrar sesión
      </button>
    </div>
  );
}
