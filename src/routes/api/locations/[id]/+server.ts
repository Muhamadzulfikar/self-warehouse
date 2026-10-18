import { json, type RequestHandler } from '@sveltejs/kit';
import { db } from '../../../../lib/server/firebase.ts';
import type { CreateLocationRequest } from '../../../../interface/locationInterface.ts';

const COLLECTION = 'locations';

// UPDATE
export const PUT: RequestHandler = async ({ request, params }) => {
  const { id } = params;
  const body = (await request.json()) as CreateLocationRequest;

  if (!id) return json({ success: false, error: 'Missing ID' }, { status: 400 });

  const docRef = db.collection(COLLECTION).doc(id);
  const doc = await docRef.get();

  if (!doc.exists) return json({ success: false, error: 'Not found' }, { status: 404 });

  await docRef.update({
    name: body.name,
    parent: body.parent ?? null
  });

  return json({ success: true, message: 'Updated' });
};

// DELETE
export const DELETE: RequestHandler = async ({ params }) => {
  const { id } = params;

  if (!id) return json({ success: false, error: 'Missing ID' }, { status: 400 });

  const docRef = db.collection(COLLECTION).doc(id);
  const doc = await docRef.get();

  if (!doc.exists) return json({ success: false, error: 'Not found' }, { status: 404 });

  await docRef.delete();

  return json({ success: true, message: 'Deleted' });
};
