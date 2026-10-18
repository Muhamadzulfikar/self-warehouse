import { json, type RequestHandler } from '@sveltejs/kit';
import { db } from '../../../lib/server/firebase.ts';
import type { Location, CreateLocationRequest } from '../../../interface/locationInterface.ts';

const COLLECTION = 'locations';

// READ
export const GET: RequestHandler = async () => {
  const snapshot = await db.collection(COLLECTION).get();
  const locations: Location[] = snapshot.docs.map(doc => ({
    id: doc.id,
    ...(doc.data() as Omit<Location, 'id'>)
  }));
  return json({ success: true, data: locations });
};

// CREATE
export const POST: RequestHandler = async ({ request }) => {
  const body = (await request.json()) as CreateLocationRequest;
  const docRef = await db.collection(COLLECTION).add({
    name: body.name,
    parent: body.parent ?? null,
    createdAt: new Date()
  });
  return json({ success: true, id: docRef.id }, { status: 201 });
};
