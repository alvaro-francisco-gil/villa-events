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
} from 'firebase/firestore';
import { db } from '../firebase';
import type { VillageData, VillageDataInput } from '../models/village/VillageDataModel';

export async function getVillage(
  villageId: string
): Promise<(VillageData & { id: string }) | null> {
  const snap = await getDoc(doc(db, 'villages', villageId));
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    id: snap.id,
    name: data['name'],
    description: data['description'],
    coordinates: data['coordinates'] as GeoPoint,
    comunidadAutonoma: data['comunidadAutonoma'],
    provincia: data['provincia'],
    images: data['images'] ?? [],
    adminUserId: data['adminUserId'],
    createdAt: (data['createdAt'] as Timestamp).toDate(),
  };
}

export async function getVillages(): Promise<(VillageData & { id: string })[]> {
  const q = query(collection(db, 'villages'), orderBy('name', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      name: data['name'],
      description: data['description'],
      coordinates: data['coordinates'] as GeoPoint,
      comunidadAutonoma: data['comunidadAutonoma'],
      provincia: data['provincia'],
      images: data['images'] ?? [],
      adminUserId: data['adminUserId'],
      createdAt: (data['createdAt'] as Timestamp).toDate(),
    };
  });
}

export async function createVillage(input: VillageDataInput): Promise<string> {
  const newRef = doc(collection(db, 'villages'));
  await setDoc(newRef, {
    name: input.name,
    description: input.description,
    coordinates: input.coordinates,
    comunidadAutonoma: input.comunidadAutonoma,
    provincia: input.provincia,
    images: input.images ?? [],
    adminUserId: input.adminUserId,
    createdAt: serverTimestamp(),
  });
  return newRef.id;
}

export async function updateVillage(
  villageId: string,
  data: Partial<Omit<VillageData, 'createdAt'>>
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await updateDoc(doc(db, 'villages', villageId), data as any);
}

export async function deleteVillage(villageId: string): Promise<void> {
  await deleteDoc(doc(db, 'villages', villageId));
}
