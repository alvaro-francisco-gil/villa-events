import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

const db = admin.firestore();

type FieldType = 'text' | 'textarea' | 'select' | 'multiselect' | 'boolean' | 'number' | 'date';

const PREDEFINED_KEYS = new Set([
  'barrio',
  'residencyType',
  'householdSize',
  'hasMinors',
  'arrivalYear',
  'originVillage',
]);

interface PredefinedField {
  source: 'predefined';
  key: string;
  label?: string;
  required: boolean;
}

interface CustomField {
  source: 'custom';
  key: string;
  label: string;
  type: FieldType;
  options?: string[];
  required: boolean;
}

type ProfileFormField = PredefinedField | CustomField;

interface UpdateCensoData {
  villageId?: string;
  fields?: ProfileFormField[];
}

interface UpdateCensoResult {
  ok: true;
  fieldCount: number;
}

const VALID_FIELD_TYPES = new Set<FieldType>([
  'text',
  'textarea',
  'select',
  'multiselect',
  'boolean',
  'number',
  'date',
]);

function ensureValidFieldShape(f: unknown): asserts f is ProfileFormField {
  if (!f || typeof f !== 'object') throw new HttpsError('invalid-argument', 'Campo inválido.');
  const r = f as Partial<ProfileFormField>;
  if (r.source !== 'predefined' && r.source !== 'custom') {
    throw new HttpsError('invalid-argument', 'source debe ser predefined o custom.');
  }
  if (typeof r.key !== 'string' || !r.key) {
    throw new HttpsError('invalid-argument', 'key requerida.');
  }
  if (typeof r.required !== 'boolean') {
    throw new HttpsError('invalid-argument', 'required debe ser boolean.');
  }
  if (r.source === 'predefined') {
    if (!PREDEFINED_KEYS.has(r.key)) {
      throw new HttpsError('invalid-argument', `Campo predefinido desconocido: ${r.key}`);
    }
  } else {
    const c = r as Partial<CustomField>;
    if (typeof c.label !== 'string' || !c.label.trim()) {
      throw new HttpsError('invalid-argument', 'label requerida en campos custom.');
    }
    if (!c.type || !VALID_FIELD_TYPES.has(c.type)) {
      throw new HttpsError('invalid-argument', `Tipo inválido: ${c.type}`);
    }
    if (!/^[a-z0-9_]{1,40}$/.test(c.key as string)) {
      throw new HttpsError('invalid-argument', `Clave personalizada inválida: ${c.key}`);
    }
    if ((c.type === 'select' || c.type === 'multiselect') && (!Array.isArray(c.options) || c.options.length === 0)) {
      throw new HttpsError('invalid-argument', `El campo ${c.key} requiere opciones.`);
    }
  }
}

interface UsedValuesByKey {
  [key: string]: Set<string | number | boolean>;
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

interface PrevField {
  source: 'predefined' | 'custom';
  key: string;
  type?: FieldType;
  options?: string[];
}

function validateTransition(
  prev: PrevField[],
  next: ProfileFormField[],
  used: UsedValuesByKey,
): void {
  const seen = new Set<string>();
  for (const f of next) {
    if (seen.has(f.key)) {
      throw new HttpsError('failed-precondition', `Clave duplicada: ${f.key}`);
    }
    seen.add(f.key);
  }

  const nextByKey = new Map(next.map((f) => [f.key, f]));
  for (const prevField of prev) {
    const nextField = nextByKey.get(prevField.key);
    if (!nextField) {
      const hasAnswers = (used[prevField.key]?.size ?? 0) > 0;
      if (hasAnswers) {
        throw new HttpsError(
          'failed-precondition',
          `No se puede eliminar el campo "${prevField.key}" porque ya hay miembros que han respondido.`,
        );
      }
      continue;
    }
    if (prevField.source !== nextField.source) {
      throw new HttpsError('failed-precondition', `No se puede cambiar el origen del campo "${prevField.key}".`);
    }
    if (prevField.source === 'custom' && nextField.source === 'custom') {
      if (prevField.type && prevField.type !== nextField.type) {
        throw new HttpsError(
          'failed-precondition',
          `No se puede cambiar el tipo del campo "${prevField.key}".`,
        );
      }
      const prevOpts = new Set(prevField.options ?? []);
      const nextOpts = new Set(nextField.options ?? []);
      const removed = [...prevOpts].filter((o) => !nextOpts.has(o));
      const usedValues = used[prevField.key] ?? new Set();
      for (const r of removed) {
        if (usedValues.has(r)) {
          throw new HttpsError(
            'failed-precondition',
            `No se puede eliminar la opción "${r}" del campo "${prevField.key}" porque ya está en uso.`,
          );
        }
      }
    }
  }
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
