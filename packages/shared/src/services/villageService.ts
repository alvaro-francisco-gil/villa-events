import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
  Timestamp,
  GeoPoint,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { VillageData, VillageDataInput } from '../models/village/VillageDataModel';
import type { VillageProfileForm, ProfileFormField } from '../models/village/CensoTypes';

function mapProfileForm(raw: unknown): VillageProfileForm | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const r = raw as { fields?: ProfileFormField[]; updatedAt?: Timestamp };
  if (!Array.isArray(r.fields)) return undefined;
  return {
    fields: r.fields,
    updatedAt: r.updatedAt instanceof Timestamp ? r.updatedAt.toDate() : new Date(),
  };
}

function mapVillageDoc(id: string, data: Record<string, unknown>): VillageData & { id: string } {
  return {
    id,
    name: data['name'] as string,
    description: data['description'] as string,
    country: (data['country'] as string) ?? 'España',
    comunidadAutonoma: data['comunidadAutonoma'] as string,
    provincia: data['provincia'] as string,
    coordinates: data['coordinates'] as GeoPoint,
    barrios: (data['barrios'] as string[]) ?? [],
    images: (data['images'] as string[]) ?? [],
    adminUserId: data['adminUserId'] as string,
    createdAt: (data['createdAt'] as Timestamp).toDate(),
    profileForm: mapProfileForm(data['profileForm']),
  };
}

export async function getVillage(
  villageId: string
): Promise<(VillageData & { id: string }) | null> {
  const snap = await getDoc(doc(db, 'villages', villageId));
  if (!snap.exists()) return null;
  return mapVillageDoc(snap.id, snap.data());
}

export async function getVillages(): Promise<(VillageData & { id: string })[]> {
  const q = query(collection(db, 'villages'), orderBy('name', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => mapVillageDoc(d.id, d.data()));
}

export function generateVillageId(): string {
  return doc(collection(db, 'villages')).id;
}

export async function createVillage(
  input: VillageDataInput,
  villageId?: string,
): Promise<string> {
  const villageRef = villageId
    ? doc(db, 'villages', villageId)
    : doc(collection(db, 'villages'));
  const memberRef = doc(db, 'villages', villageRef.id, 'members', input.adminUserId);

  const batch = writeBatch(db);
  batch.set(villageRef, {
    name: input.name,
    description: input.description,
    country: input.country,
    comunidadAutonoma: input.comunidadAutonoma,
    provincia: input.provincia,
    coordinates: input.coordinates,
    barrios: input.barrios ?? [],
    images: input.images ?? [],
    adminUserId: input.adminUserId,
    createdAt: serverTimestamp(),
  });
  batch.set(memberRef, {
    userId: input.adminUserId,
    role: 'admin',
    joinedAt: serverTimestamp(),
    profileAnswers: {},
    profileCompletedAt: null,
  });
  await batch.commit();
  return villageRef.id;
}

export async function updateVillage(
  villageId: string,
  data: Partial<Omit<VillageData, 'createdAt' | 'profileForm'>>
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await updateDoc(doc(db, 'villages', villageId), data as any);
}

export async function deleteVillage(villageId: string): Promise<void> {
  await deleteDoc(doc(db, 'villages', villageId));
}
