import { json, type RequestHandler } from '@sveltejs/kit';
import { db } from '../../../lib/server/firebase.ts';
import type { Movement, CreateMovementRequest } from '../../../interface/itemInterface.ts';

const COLLECTION = 'movements';

// READ: GET /api/movements
export const GET: RequestHandler = async () => {
  try {
    const snapshot = await db.collection(COLLECTION).orderBy('createdAt', 'desc').get();
    const movements: Movement[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...(doc.data() as Omit<Movement, 'id'>)
    }));
    return json({ success: true, data: movements });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return json({ success: false, error: message }, { status: 500 });
  }
};

// CREATE: POST /api/movements
export const POST: RequestHandler = async ({ request }) => {
  try {
    const body = (await request.json()) as CreateMovementRequest;
    const { item_name, from_location, to_location, quantity } = body;
    if (!item_name) {
      return json({ success: false, error: 'Nama item wajib diisi' }, { status: 400 });
    }
    if (!to_location) {
      return json({ success: false, error: 'Lokasi tujuan wajib dipilih' }, { status: 400 });
    }
    if (quantity === undefined || quantity === null) {
      return json({ success: false, error: 'Jumlah wajib diisi' }, { status: 400 });
    }
    const docRef = await db.collection(COLLECTION).add({
      item_name,
      from_location: from_location || '',
      to_location,
      quantity,
      createdAt: new Date()
    });
    return json(
      { success: true, id: docRef.id, message: 'Data berhasil ditambahkan' },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return json({ success: false, error: message }, { status: 500 });
  }
};
