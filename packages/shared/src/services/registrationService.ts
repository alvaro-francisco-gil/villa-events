import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  writeBatch,
  serverTimestamp,
  Timestamp,
  collectionGroup,
  getCountFromServer,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { RegistrationData, RegistrationStatus } from '../models/event/RegistrationDataModel';

export interface RegisterInput {
  userId: string;
  personaId: string | null;
  name: string;
}

function regsCol(villageId: string, eventId: string) {
  return collection(db, 'villages', villageId, 'events', eventId, 'registrations');
}

function mapRegDoc(
  d: { id: string; data: () => Record<string, unknown> }
): RegistrationData & { id: string } {
  const data = d.data();
  return {
    id: d.id,
    userId: data['userId'] as string,
    personaId: (data['personaId'] as string | null) ?? null,
    name: data['name'] as string,
    status: data['status'] as RegistrationStatus,
    position: data['position'] as number,
    registeredAt: (data['registeredAt'] as Timestamp).toDate(),
  };
}

/**
 * Pure function for testability.
 * Returns 'confirmed' if under maxAttendees, 'waitlisted' if at or over.
 */
export function determineRegistrationStatus(
  maxAttendees: number | null,
  currentConfirmedCount: number
): RegistrationStatus {
  if (maxAttendees === null) return 'confirmed';
  return currentConfirmedCount < maxAttendees ? 'confirmed' : 'waitlisted';
}

export async function getEventRegistrations(
  villageId: string,
  eventId: string
): Promise<(RegistrationData & { id: string })[]> {
  const q = query(regsCol(villageId, eventId), orderBy('position', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => mapRegDoc(d as Parameters<typeof mapRegDoc>[0]));
}

export async function getConfirmedCount(
  villageId: string,
  eventId: string
): Promise<number> {
  const q = query(regsCol(villageId, eventId), where('status', '==', 'confirmed'));
  const snap = await getCountFromServer(q);
  return snap.data().count;
}

export async function getTotalCount(
  villageId: string,
  eventId: string
): Promise<number> {
  const snap = await getCountFromServer(regsCol(villageId, eventId));
  return snap.data().count;
}

export async function getUserRegistrations(
  villageId: string,
  eventId: string,
  userId: string
): Promise<(RegistrationData & { id: string })[]> {
  const q = query(regsCol(villageId, eventId), where('userId', '==', userId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => mapRegDoc(d as Parameters<typeof mapRegDoc>[0]));
}

export async function registerToEvent(
  villageId: string,
  eventId: string,
  inputs: RegisterInput[],
  maxAttendees: number | null
): Promise<void> {
  const confirmedCount = await getConfirmedCount(villageId, eventId);
  const totalCount = await getTotalCount(villageId, eventId);

  const batch = writeBatch(db);
  inputs.forEach((input, i) => {
    const newRef = doc(regsCol(villageId, eventId));
    const position = totalCount + i + 1;
    const status = determineRegistrationStatus(maxAttendees, confirmedCount + i);
    batch.set(newRef, {
      userId: input.userId,
      personaId: input.personaId ?? null,
      name: input.name,
      status,
      position,
      registeredAt: serverTimestamp(),
    });
  });
  await batch.commit();
}

export async function cancelRegistration(
  villageId: string,
  eventId: string,
  regId: string
): Promise<void> {
  await deleteDoc(doc(regsCol(villageId, eventId), regId));
}

export async function getUserRegistrationsAcrossVillages(
  userId: string
): Promise<(RegistrationData & { id: string; eventPath: string })[]> {
  const q = query(
    collectionGroup(db, 'registrations'),
    where('userId', '==', userId),
    orderBy('registeredAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    // ref path: villages/{villageId}/events/{eventId}/registrations/{regId}
    const pathSegments = d.ref.path.split('/');
    const eventPath = pathSegments.slice(0, 4).join('/');
    return {
      id: d.id,
      userId: data['userId'] as string,
      personaId: (data['personaId'] as string | null) ?? null,
      name: data['name'] as string,
      status: data['status'] as RegistrationStatus,
      position: data['position'] as number,
      registeredAt: (data['registeredAt'] as Timestamp).toDate(),
      eventPath,
    };
  });
}
