import { GeoPoint } from 'firebase/firestore';
import type { VillageProfileForm } from './CensoTypes';

export interface VillageData {
  name: string;
  description: string;
  country: string;
  comunidadAutonoma: string;
  provincia: string;
  coordinates: GeoPoint;
  barrios: string[];
  images: string[];
  adminUserId: string;
  createdAt: Date;
  profileForm?: VillageProfileForm;
}

export interface VillageDataInput {
  name: string;
  description: string;
  country: string;
  comunidadAutonoma: string;
  provincia: string;
  coordinates: GeoPoint;
  barrios?: string[];
  images?: string[];
  adminUserId: string;
  createdAt?: Date;
}

export function buildVillageData(input: VillageDataInput): VillageData {
  return {
    name: input.name,
    description: input.description,
    country: input.country,
    comunidadAutonoma: input.comunidadAutonoma,
    provincia: input.provincia,
    coordinates: input.coordinates,
    barrios: input.barrios ?? [],
    images: input.images ?? [],
    adminUserId: input.adminUserId,
    createdAt: input.createdAt ?? new Date(),
  };
}
