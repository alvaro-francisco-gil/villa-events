import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import {
  ensureValidFieldShape,
  validateTransition,
  type PrevField,
  type ProfileFormField,
  type UsedValuesByKey,
} from './helpers/profileFormValidation';

const db = admin.firestore();

interface UpdateCensoData {
  villageId?: string;
  fields?: ProfileFormField[];
}

interface UpdateCensoResult {
  ok: true;
  fieldCount: number;
}

async function collectUsedValues(villageId: string): Promise<UsedValuesByKey> {
  const out: UsedValuesByKey = {};
  const membersSnap = await db.collection(`villages/${villageId}/members`).get();
  for (const m of membersSnap.docs) {
    const answers = (m.data().profileAnswers ?? {}) as Record<string, unknown>;
    for (const [k, v] of Object.entries(answers)) {
      if (!out[k]) out[k] = new Set();
      if (Array.isArray(v)) {
        for (const item of v) {
          if (typeof item === 'string') out[k].add(item);
        }
      } else if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
        if (v !== '' && v !== null && v !== undefined) out[k].add(v);
      }
    }
  }
  return out;
}

export const updateCenso = onCall<UpdateCensoData, Promise<UpdateCensoResult>>(
  { region: 'us-central1', cors: true },
  async (request) => {
    const auth = request.auth;
    if (!auth) {
      throw new HttpsError('unauthenticated', 'Debes iniciar sesión.');
    }
    const { villageId, fields } = request.data ?? {};
    if (!villageId || !Array.isArray(fields)) {
      throw new HttpsError('invalid-argument', 'Faltan parámetros.');
    }

    fields.forEach(ensureValidFieldShape);

    // Verify the caller is a village admin (or app admin).
    const memberRef = db.doc(`villages/${villageId}/members/${auth.uid}`);
    const memberSnap = await memberRef.get();
    const isVillageAdmin = memberSnap.exists && memberSnap.data()?.role === 'admin';
    const adminDocRef = db.doc(`admins/${auth.uid}`);
    const isAppAdmin = (await adminDocRef.get()).exists;
    if (!isVillageAdmin && !isAppAdmin) {
      throw new HttpsError('permission-denied', 'Solo el coordinador puede modificar el censo.');
    }

    const villageRef = db.doc(`villages/${villageId}`);
    const villageSnap = await villageRef.get();
    if (!villageSnap.exists) {
      throw new HttpsError('not-found', 'El pueblo no existe.');
    }

    const prevForm = (villageSnap.data()?.profileForm ?? null) as
      | { fields: PrevField[] }
      | null;
    const prevFields: PrevField[] = prevForm?.fields ?? [];

    const used = await collectUsedValues(villageId);
    validateTransition(prevFields, fields, used);

    await villageRef.update({
      profileForm: {
        fields,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
    });

    return { ok: true, fieldCount: fields.length };
  },
);
