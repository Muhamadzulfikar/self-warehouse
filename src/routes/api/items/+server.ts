import { json, type RequestHandler } from '@sveltejs/kit';
import { db } from '../../../lib/server/firebase.ts';
import type { Item, CreateItemRequest } from '../../../interface/itemInterface.ts';

const COLLECTION = 'items';

// READ: GET /api/items
export const GET: RequestHandler = async () => {
  try {
    const snapshot = await db.collection(COLLECTION).get();
    const items: Item[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...(doc.data() as Omit<Item, 'id'>)
    }));
    return json({ success: true, data: items });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return json({ success: false, error: message }, { status: 500 });
  }
};

// CREATE: POST /api/items
export const POST: RequestHandler = async ({ request }) => {
  try {
    const body = (await request.json()) as CreateItemRequest;
    const { name, category, location, quantity } = body;
    if (!name) {
      return json({ success: false, error: 'Nama item wajib diisi' }, { status: 400 });
    }
    if (!category) {
      return json({ success: false, error: 'Kategori wajib dipilih' }, { status: 400 });
    }
    if (!location) {
      return json({ success: false, error: 'Lokasi wajib dipilih' }, { status: 400 });
    }
    if (quantity === undefined || quantity === null) {
      return json({ success: false, error: 'Jumlah wajib diisi' }, { status: 400 });
    }
    const docRef = await db.collection(COLLECTION).add({
      name,
      category,
      location,
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
