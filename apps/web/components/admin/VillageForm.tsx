'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { GeoPoint } from '@cultuvilla/shared/firebase';
import {
  createVillage,
  generateVillageId,
  updateVillage,
} from '@cultuvilla/shared/services/villageService';
import { setActiveVillage } from '@cultuvilla/shared/services/userService';
import {
  COUNTRIES,
  COMUNIDADES_AUTONOMAS,
  PROVINCIAS_BY_COMUNIDAD,
  VillageFormSchema,
  type ComunidadAutonoma,
  type VillageData,
  type VillageFormInput,
  type VillageFormValues,
} from '@cultuvilla/shared/models/village';
import { UserPicker } from './UserPicker';
import { LocationPicker } from './LocationPicker';
import { BarriosInput } from './BarriosInput';
import { VillageImagesInput } from './VillageImagesInput';

interface LocationValue {
  lat: number;
  lng: number;
  displayName: string;
}

interface VillageFormProps {
  mode: 'create' | 'edit';
  currentUserId: string;
  initial?: VillageData & { id: string };
  onSubmitted: () => void;
  onCancel?: () => void;
}

export function VillageForm({
  mode,
  currentUserId,
  initial,
  onSubmitted,
  onCancel,
}: VillageFormProps) {
  // Stable village id: existing one in edit mode, freshly generated in create mode.
  const [villageId] = useState(() => initial?.id ?? generateVillageId());

  const initialLocation: LocationValue | null = initial
    ? {
        lat: initial.coordinates.latitude,
        lng: initial.coordinates.longitude,
        displayName: `${initial.provincia}, ${initial.comunidadAutonoma}`,
      }
    : null;

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<VillageFormInput, unknown, VillageFormValues>({
    resolver: zodResolver(VillageFormSchema),
    defaultValues: {
      name: initial?.name ?? '',
      description: initial?.description ?? '',
      country: initial?.country ?? COUNTRIES[0].name,
      comunidadAutonoma: (initial?.comunidadAutonoma as ComunidadAutonoma | undefined) ?? undefined,
      provincia: initial?.provincia ?? '',
      location: initialLocation,
      barrios: initial?.barrios ?? [],
      images: initial?.images ?? [],
      adminUserId: initial?.adminUserId ?? currentUserId,
    },
  });

  const comunidadAutonoma = watch('comunidadAutonoma') as ComunidadAutonoma | undefined;
  const provincia = watch('provincia');
  const location = watch('location') as LocationValue | null;
  const barrios = watch('barrios') as string[];
  const images = watch('images') as string[];
  const adminUserId = watch('adminUserId');

  const provinciaOptions = comunidadAutonoma ? PROVINCIAS_BY_COMUNIDAD[comunidadAutonoma] : [];

  const submit = handleSubmit(async (data) => {
    // Validation guarantees data.location is non-null.
    const loc = data.location!;
    const payload = {
      name: data.name,
      description: data.description,
      country: data.country,
      comunidadAutonoma: data.comunidadAutonoma,
      provincia: data.provincia,
      coordinates: new GeoPoint(loc.lat, loc.lng),
      barrios: data.barrios,
      images: data.images,
      adminUserId: data.adminUserId,
    };

    try {
      if (mode === 'create') {
        await createVillage(payload, villageId);
        if (data.adminUserId === currentUserId) {
          await setActiveVillage(currentUserId, villageId);
        }
      } else {
        await updateVillage(villageId, payload);
      }
      onSubmitted();
    } catch (e) {
      setError('root', { message: e instanceof Error ? e.message : 'Error al guardar' });
    }
  });

  const inputClass =
    'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

  return (
    <form onSubmit={submit} className="bg-white border border-gray-200 rounded-lg p-4 space-y-4" noValidate>
      <div>
        <input className={inputClass} placeholder="Nombre del pueblo" {...register('name')} />
        {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name.message}</p>}
      </div>
      <div>
        <textarea className={inputClass} placeholder="Descripción" rows={2} {...register('description')} />
        {errors.description && <p className="text-xs text-red-600 mt-1">{errors.description.message}</p>}
      </div>

      <div>
        <label className="block text-xs text-gray-500 mb-1">País</label>
        <select className={inputClass} {...register('country')}>
          {COUNTRIES.map((c) => (
            <option key={c.code} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs text-gray-500 mb-1">Comunidad Autónoma</label>
        <select
          className={inputClass}
          value={comunidadAutonoma ?? ''}
          onChange={(e) => {
            setValue('comunidadAutonoma', e.target.value as ComunidadAutonoma, { shouldValidate: true });
            setValue('provincia', '', { shouldValidate: true });
          }}
        >
          <option value="">Selecciona...</option>
          {COMUNIDADES_AUTONOMAS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        {errors.comunidadAutonoma && (
          <p className="text-xs text-red-600 mt-1">{errors.comunidadAutonoma.message}</p>
        )}
      </div>

      <div>
        <label className="block text-xs text-gray-500 mb-1">Provincia</label>
        <select
          className={inputClass}
          value={provincia ?? ''}
          onChange={(e) => setValue('provincia', e.target.value, { shouldValidate: true })}
          disabled={!comunidadAutonoma}
        >
          <option value="">Selecciona...</option>
          {provinciaOptions.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        {errors.provincia && <p className="text-xs text-red-600 mt-1">{errors.provincia.message}</p>}
      </div>

      <LocationPicker
        value={location}
        onChange={(v) => setValue('location', v, { shouldValidate: true })}
      />
      {errors.location && <p className="text-xs text-red-600 mt-1">{errors.location.message}</p>}

      <BarriosInput
        value={barrios}
        onChange={(v) => setValue('barrios', v, { shouldValidate: true })}
      />

      <VillageImagesInput
        villageId={villageId}
        value={images}
        onChange={(v) => setValue('images', v, { shouldValidate: true })}
      />

      <UserPicker
        value={adminUserId}
        onChange={(v) => setValue('adminUserId', v, { shouldValidate: true })}
        label="Coordinador del pueblo"
      />
      {errors.adminUserId && <p className="text-xs text-red-600 mt-1">{errors.adminUserId.message}</p>}

      {errors.root && <p className="text-sm text-red-600">{errors.root.message}</p>}

      <div className="flex gap-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm font-medium"
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium disabled:opacity-50"
        >
          {isSubmitting ? 'Guardando...' : mode === 'create' ? 'Crear pueblo' : 'Guardar cambios'}
        </button>
      </div>
    </form>
  );
}
