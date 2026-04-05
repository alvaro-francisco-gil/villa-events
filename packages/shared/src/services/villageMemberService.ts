import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { VillageMemberData, VillageMemberRole } from '../models/village/VillageMemberDataModel';

function membersCol(villageId: string) {
  return collection(db, 'villages', villageId, 'members');
}

export async function getVillageMember(
  villageId: string,
  userId: string
): Promise<(VillageMemberData & { id: string }) | null> {
  const snap = await getDoc(doc(membersCol(villageId), userId));
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    id: snap.id,
    role: data['role'] as VillageMemberRole,
    joinedAt: (data['joinedAt'] as Timestamp).toDate(),
  };
}

export async function getVillageMembers(
  villageId: string
): Promise<(VillageMemberData & { id: string })[]> {
  const snap = await getDocs(membersCol(villageId));
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      role: data['role'] as VillageMemberRole,
      joinedAt: (data['joinedAt'] as Timestamp).toDate(),
    };
  });
}

export async function addVillageMember(
  villageId: string,
  userId: string,
  role: VillageMemberRole = 'user'
): Promise<void> {
  await setDoc(doc(membersCol(villageId), userId), {
    role,
    joinedAt: serverTimestamp(),
  });
}

export async function removeVillageMember(
  villageId: string,
  userId: string
): Promise<void> {
  await deleteDoc(doc(membersCol(villageId), userId));
}

export async function isVillageMember(
  villageId: string,
  userId: string
): Promise<boolean> {
  const snap = await getDoc(doc(membersCol(villageId), userId));
  return snap.exists();
}

export async function isVillageAdmin(
  villageId: string,
  userId: string
): Promise<boolean> {
  const snap = await getDoc(doc(membersCol(villageId), userId));
  if (!snap.exists()) return false;
  return snap.data()['role'] === 'admin';
}
