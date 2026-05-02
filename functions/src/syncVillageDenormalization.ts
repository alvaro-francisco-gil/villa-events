import { onDocumentUpdated } from 'firebase-functions/v2/firestore';
import * as admin from 'firebase-admin';

const db = admin.firestore();

/**
 * When a village's name, first image, or coordinates change, propagate to
 * all events with that villageId so the feed always renders fresh values.
 */
export const syncVillageDenormalization = onDocumentUpdated(
  { document: 'villages/{villageId}', region: 'us-central1' },
  async (event) => {
    const before = event.data?.before.data() ?? {};
    const after = event.data?.after.data() ?? {};
    const villageId = event.params.villageId;

    const nameChanged = before['name'] !== after['name'];
    const imagesChanged =
      JSON.stringify(before['images'] ?? []) !== JSON.stringify(after['images'] ?? []);
    const coordsChanged =
      JSON.stringify(before['coordinates'] ?? null) !==
      JSON.stringify(after['coordinates'] ?? null);

    if (!nameChanged && !imagesChanged && !coordsChanged) return;

    const eventsSnap = await db
      .collection('events')
      .where('villageId', '==', villageId)
      .get();

    if (eventsSnap.empty) return;

    const cover = Array.isArray(after['images']) && after['images'].length > 0
      ? (after['images'][0] as string)
      : null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const update: Record<string, any> = {};
    if (nameChanged) update['villageName'] = after['name'];
    if (imagesChanged) update['villageCoverImage'] = cover;
    if (coordsChanged) update['villageCoordinates'] = after['coordinates'];

    // Firestore batch limit is 500; chunk if needed.
    const docs = eventsSnap.docs;
    for (let i = 0; i < docs.length; i += 500) {
      const batch = db.batch();
      docs.slice(i, i + 500).forEach((d) => batch.update(d.ref, update));
      await batch.commit();
    }
  },
);
