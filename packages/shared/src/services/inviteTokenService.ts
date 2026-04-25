import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp,
  increment,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../firebase';
import type { InviteTokenData } from '../models/village/InviteTokenDataModel';
import { isTokenExpired } from '../models/village/InviteTokenDataModel';

function tokensCol(villageId: string) {
  return collection(db, 'villages', villageId, 'inviteTokens');
}

function mapTokenDoc(d: { id: string; data: () => Record<string, unknown> }): InviteTokenData & { id: string } {
  const data = d.data();
  const expiresAtRaw = data['expiresAt'];
  return {
    id: d.id,
    createdAt: (data['createdAt'] as Timestamp).toDate(),
    expiresAt: expiresAtRaw ? (expiresAtRaw as Timestamp).toDate() : null,
    usageCount: (data['usageCount'] as number) ?? 0,
  };
}

export async function createInviteToken(
  villageId: string,
  expiresAt?: Date | null
): Promise<string> {
  const newRef = doc(tokensCol(villageId));
  await setDoc(newRef, {
    createdAt: serverTimestamp(),
    expiresAt: expiresAt ? Timestamp.fromDate(expiresAt) : null,
    usageCount: 0,
  });
  return newRef.id;
}

export async function validateInviteToken(
  villageId: string,
  tokenId: string
): Promise<boolean> {
  const snap = await getDoc(doc(tokensCol(villageId), tokenId));
  if (!snap.exists()) return false;
  const token = mapTokenDoc(snap as Parameters<typeof mapTokenDoc>[0]);
  return !isTokenExpired(token);
}

export async function consumeInviteToken(
  villageId: string,
  tokenId: string
): Promise<void> {
  await updateDoc(doc(tokensCol(villageId), tokenId), {
    usageCount: increment(1),
  });
}

export async function getInviteTokens(
  villageId: string
): Promise<(InviteTokenData & { id: string })[]> {
  const snap = await getDocs(tokensCol(villageId));
  return snap.docs.map((d) => mapTokenDoc(d as Parameters<typeof mapTokenDoc>[0]));
}

export async function deleteInviteToken(
  villageId: string,
  tokenId: string
): Promise<void> {
  await deleteDoc(doc(tokensCol(villageId), tokenId));
}

export interface AcceptInviteProfile {
  displayName: string;
  email: string;
  birthday: Date;
  photoURL?: string | null;
}

export interface AcceptInviteResult {
  villageId: string;
  alreadyMember: boolean;
  profileCreated: boolean;
}

export async function acceptInvite(
  villageId: string,
  tokenId: string,
  profile?: AcceptInviteProfile,
): Promise<AcceptInviteResult> {
  const callable = httpsCallable<
    {
      villageId: string;
      tokenId: string;
      profile?: {
        displayName: string;
        email: string;
        birthday: string;
        photoURL: string | null;
      };
    },
    AcceptInviteResult
  >(functions, 'acceptInvite');

  const payload = profile
    ? {
        villageId,
        tokenId,
        profile: {
          displayName: profile.displayName,
          email: profile.email,
          birthday: profile.birthday.toISOString().slice(0, 10),
          photoURL: profile.photoURL ?? null,
        },
      }
    : { villageId, tokenId };

  const result = await callable(payload);
  return result.data;
}
