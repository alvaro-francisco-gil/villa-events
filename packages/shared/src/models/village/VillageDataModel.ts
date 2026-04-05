import { GeoPoint } from 'firebase/firestore';

export interface VillageData {
  name: string;
  description: string;
  coordinates: GeoPoint;
  comunidadAutonoma: string;
  provincia: string;
  images: string[];
  adminUserId: string;
  createdAt: Date;
}

export interface VillageDataInput {
  name: string;
  description: string;
  coordinates: GeoPoint;
  comunidadAutonoma: string;
  provincia: string;
  images?: string[];
  adminUserId: string;
  createdAt?: Date;
}

export function buildVillageData(input: VillageDataInput): VillageData {
  return {
    name: input.name,
    description: input.description,
    coordinates: input.coordinates,
    comunidadAutonoma: input.comunidadAutonoma,
    provincia: input.provincia,
    images: input.images ?? [],
    adminUserId: input.adminUserId,
    createdAt: input.createdAt ?? new Date(),
  };
}
