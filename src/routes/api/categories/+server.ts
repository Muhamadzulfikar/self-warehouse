import { json, type RequestHandler } from '@sveltejs/kit';
import { db } from '../../../lib/server/firebase.ts';
import type { Category, CreateCategoryRequest } from '../../../interface/categoryInterface.ts';

const COLLECTION = 'categories';

// READ: Mengambil semua data (GET /api/categories)
export const GET: RequestHandler = async () => {
  try {
    const snapshot = await db.collection(COLLECTION).get();
    const categories: Category[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...(doc.data() as Omit<Category, 'id'>)
    }));

    return json({ success: true, data: categories });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return json({ success: false, error: message }, { status: 500 });
  }
};

// CREATE: Menambah data baru (POST /api/categories)
export const POST: RequestHandler = async ({ request }) => {
  try {
    const body = (await request.json()) as CreateCategoryRequest;
    const { name } = body;

    if (!name) {
      return json({ success: false, error: 'Name wajib diisi' }, { status: 400 });
    }

    const docRef = await db.collection(COLLECTION).add({
      name,
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
