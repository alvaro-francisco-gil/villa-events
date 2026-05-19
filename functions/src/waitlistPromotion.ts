import { onDocumentDeleted } from 'firebase-functions/v2/firestore';
import * as admin from 'firebase-admin';

const db = admin.firestore();

/**
 * Promotes the next waitlisted registration when a confirmed one is deleted.
 * Watches top-level /events/{eventId}/registrations/{regId}.
 */
export const onRegistrationDeleted = onDocumentDeleted(
  'events/{eventId}/registrations/{regId}',
  async (event) => {
    const { eventId } = event.params;
    const deletedData = event.data?.data();

    if (!deletedData || deletedData.status !== 'confirmed') return;

    const eventSnap = await db.doc(`events/${eventId}`).get();
    const eventData = eventSnap.data();
    if (!eventData?.maxAttendees) return;

    const waitlisted = await db
      .collection(`events/${eventId}/registrations`)
      .where('status', '==', 'waitlisted')
      .orderBy('position', 'asc')
      .limit(1)
      .get();

    if (waitlisted.empty) return;

    const nextInLine = waitlisted.docs[0];
    const nextData = nextInLine.data();

    await nextInLine.ref.update({ status: 'confirmed' });

    await db.collection(`users/${nextData.userId}/notifications`).add({
      type: 'waitlist_promoted',
      title: '¡Plaza confirmada!',
      body: `Se ha liberado una plaza en "${eventData.title}" para ${nextData.name}`,
      eventId,
      municipalityId: (eventData.municipalityId as string | undefined) ?? null,
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  },
);
