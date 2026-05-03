import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

const db = admin.firestore();

interface InviteProfileInput {
  displayName: string;
  email: string;
  birthday: string; // ISO yyyy-mm-dd
  photoURL?: string | null;
}

interface AcceptInviteData {
  villageId?: string;
  tokenId?: string;
  profile?: InviteProfileInput;
}

interface AcceptInviteResult {
  villageId: string;
  alreadyMember: boolean;
  profileCreated: boolean;
}

export const acceptInvite = onCall<AcceptInviteData, Promise<AcceptInviteResult>>(
  { region: 'us-central1', cors: true },
  async (request) => {
    const auth = request.auth;
    if (!auth) throw new HttpsError('unauthenticated', 'Debes iniciar sesión.');

    const { villageId, tokenId, profile } = request.data ?? {};
    if (!villageId || !tokenId) {
      throw new HttpsError('invalid-argument', 'Faltan parámetros.');
    }

    const userId = auth.uid;

    const villageRef = db.doc(`villages/${villageId}`);
    const tokenRef = db.doc(`villages/${villageId}/inviteTokens/${tokenId}`);
    const memberRef = db.doc(`villages/${villageId}/members/${userId}`);
    const userRef = db.doc(`users/${userId}`);

    return db.runTransaction(async (tx) => {
      const [villageSnap, tokenSnap, memberSnap, userSnap] = await Promise.all([
        tx.get(villageRef),
        tx.get(tokenRef),
        tx.get(memberRef),
        tx.get(userRef),
      ]);

      if (!villageSnap.exists) {
        throw new HttpsError('not-found', 'El pueblo no existe.');
      }

      if (!tokenSnap.exists) {
        throw new HttpsError('failed-precondition', 'El enlace de invitación no es válido.');
      }
      const tokenData = tokenSnap.data() ?? {};
      const expiresAt = tokenData.expiresAt as admin.firestore.Timestamp | null | undefined;
      if (expiresAt && expiresAt.toDate() < new Date()) {
        throw new HttpsError('failed-precondition', 'El enlace de invitación ha expirado.');
      }

      // Profile handling: create if missing and profile data provided.
      let profileCreated = false;
      if (!userSnap.exists) {
        if (!profile) {
          // Profile is required to enroll a brand-new user.
          throw new HttpsError(
            'failed-precondition',
            'Falta el perfil del usuario.',
          );
        }
        if (!profile.displayName?.trim() || !profile.email || !profile.birthday) {
          throw new HttpsError('invalid-argument', 'Perfil incompleto.');
        }
        const birthday = new Date(profile.birthday);
        if (Number.isNaN(birthday.getTime())) {
          throw new HttpsError('invalid-argument', 'Fecha de nacimiento inválida.');
        }
        tx.set(userRef, {
          displayName: profile.displayName.trim(),
          email: profile.email,
          birthday: admin.firestore.Timestamp.fromDate(birthday),
          biography: null,
          telephone: null,
          photoURL: profile.photoURL ?? null,
          activeVillageId: villageId,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        const personRef = db.collection('persons').doc()
        await personRef.set({
          givenName: (profile.displayName as string).split(' ')[0],
          middleNames: [],
          firstSurname: null,
          secondSurname: null,
          nickname: null,
          sex: null,
          birthday: null,
          deathDate: null,
          birthPlace: null,
          burialPlace: null,
          municipalityLinks: [],
          occupationIds: [],
          pendingOccupations: [],
          biography: null,
          photoURL: profile.photoURL ?? null,
          userId: userId,
          createdBy: userId,
          createdAt: FieldValue.serverTimestamp(),
        })
        await db.collection('users').doc(userId).update({ personId: personRef.id })
        profileCreated = true;
      } else {
        // Existing user: just point them at this village.
        tx.set(userRef, { activeVillageId: villageId }, { merge: true });
      }

      if (memberSnap.exists) {
        return { villageId, alreadyMember: true, profileCreated };
      }

      tx.set(memberRef, {
        userId,
        role: 'user',
        joinedAt: admin.firestore.FieldValue.serverTimestamp(),
        profileAnswers: {},
        profileCompletedAt: null,
      });
      tx.update(tokenRef, {
        usageCount: admin.firestore.FieldValue.increment(1),
      });

      return { villageId, alreadyMember: false, profileCreated };
    });
  },
);
