import {
  collection,
  collectionGroup,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp,
  where,
  query,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { VillageMemberData, VillageMemberRole } from '../models/village/VillageMemberDataModel';
import type { ProfileAnswers } from '../models/village/CensoTypes';

function membersCol(villageId: string) {
  return collection(db, 'villages', villageId, 'members');
}

function mapMemberDoc(
  id: string,
  data: Record<string, unknown>,
): VillageMemberData & { id: string } {
  const completedAtRaw = data['profileCompletedAt'];
  return {
    id,
    role: data['role'] as VillageMemberRole,
    joinedAt: (data['joinedAt'] as Timestamp).toDate(),
    profileAnswers: ((data['profileAnswers'] as ProfileAnswers) ?? {}) as ProfileAnswers,
    profileCompletedAt: completedAtRaw ? (completedAtRaw as Timestamp).toDate() : null,
  };
}

export async function getVillageMember(
  villageId: string,
  userId: string
): Promise<(VillageMemberData & { id: string }) | null> {
  const snap = await getDoc(doc(membersCol(villageId), userId));
  if (!snap.exists()) return null;
  return mapMemberDoc(snap.id, snap.data());
}

export async function getVillageMembers(
  villageId: string
): Promise<(VillageMemberData & { id: string })[]> {
  const snap = await getDocs(membersCol(villageId));
  return snap.docs.map((d) => mapMemberDoc(d.id, d.data()));
}

export async function addVillageMember(
  villageId: string,
  userId: string,
  role: VillageMemberRole = 'user'
): Promise<void> {
  await setDoc(doc(membersCol(villageId), userId), {
    userId,
    role,
    joinedAt: serverTimestamp(),
    profileAnswers: {},
    profileCompletedAt: null,
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

export interface UserMembership {
  villageId: string;
  role: VillageMemberRole;
  joinedAt: Date;
}

export async function getUserMemberships(userId: string): Promise<UserMembership[]> {
  const q = query(collectionGroup(db, 'members'), where('userId', '==', userId));
  const snap = await getDocs(q);
  return snap.docs
    .filter((d) => d.ref.parent.parent?.parent.id === 'villages')
    .map((d) => {
      const data = d.data();
      return {
        villageId: d.ref.parent.parent!.id,
        role: data['role'] as VillageMemberRole,
        joinedAt: (data['joinedAt'] as Timestamp).toDate(),
      };
    });
}
