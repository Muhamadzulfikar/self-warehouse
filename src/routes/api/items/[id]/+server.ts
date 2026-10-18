import { json, type RequestHandler } from '@sveltejs/kit';
import { db } from '../../../../lib/server/firebase.ts';
import type { CreateItemRequest } from '../../../../interface/itemInterface.ts';

const COLLECTION = 'items';

export const PUT: RequestHandler = async ({ request, params }) => {
  try {
    const { id } = params;
    const body = (await request.json()) as CreateItemRequest;
    const { name, category, location, quantity } = body;

    const docRef = db.collection(COLLECTION).doc(id!);
    const doc = await docRef.get();
    if (!doc.exists) {
      return json({ success: false, error: 'Data tidak ditemukan' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (category !== undefined) updateData.category = category;
    if (location !== undefined) updateData.location = location;
    if (quantity !== undefined) updateData.quantity = quantity;

    await docRef.update(updateData);
    return json({ success: true, message: 'Data berhasil diperbarui' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return json({ success: false, error: message }, { status: 500 });
  }
};

export const DELETE: RequestHandler = async ({ params }) => {
  try {
    const { id } = params;
    const docRef = db.collection(COLLECTION).doc(id!);
    const doc = await docRef.get();
    if (!doc.exists) {
      return json({ success: false, error: 'Data tidak ditemukan' }, { status: 404 });
    }
    await docRef.delete();
    return json({ success: true, message: 'Data berhasil dihapus' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return json({ success: false, error: message }, { status: 500 });
  }
};
