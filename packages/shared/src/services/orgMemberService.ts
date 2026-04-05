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
import type { OrgMemberData } from '../models/organization/OrgMemberDataModel';

function orgMembersCol(villageId: string, orgId: string) {
  return collection(db, 'villages', villageId, 'organizations', orgId, 'members');
}

export async function getOrgMembers(
  villageId: string,
  orgId: string
): Promise<(OrgMemberData & { id: string })[]> {
  const snap = await getDocs(orgMembersCol(villageId, orgId));
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      joinedAt: (data['joinedAt'] as Timestamp).toDate(),
    };
  });
}

export async function addOrgMember(
  villageId: string,
  orgId: string,
  userId: string
): Promise<void> {
  await setDoc(doc(orgMembersCol(villageId, orgId), userId), {
    joinedAt: serverTimestamp(),
  });
}

export async function removeOrgMember(
  villageId: string,
  orgId: string,
  userId: string
): Promise<void> {
  await deleteDoc(doc(orgMembersCol(villageId, orgId), userId));
}

export async function isOrgMember(
  villageId: string,
  orgId: string,
  userId: string
): Promise<boolean> {
  const snap = await getDoc(doc(orgMembersCol(villageId, orgId), userId));
  return snap.exists();
}
