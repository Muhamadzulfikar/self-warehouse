import { json, type RequestHandler } from '@sveltejs/kit';
import { db } from '../../../../lib/server/firebase.ts';
import type { CreateTodoRequest } from '../../../../interface/todoInterface.ts';

const COLLECTION = 'todos';

// UPDATE: Mengubah data (PUT /api/todos/[id])
export const PUT: RequestHandler = async ({ request, params }) => {
  try {
    const { id } = params;
    // Menggunakan type assertion atau interface CreateTodoRequest
    const body: CreateTodoRequest = await request.json();
    const { title } = body;

    const docRef = db.collection(COLLECTION).doc(id!);
    const doc = await docRef.get();

    if (!doc.exists) {
      return json({ success: false, error: 'Data tidak ditemukan' }, { status: 404 });
    }

    await docRef.update({ title });
    return json({ success: true, message: 'Data berhasil diperbarui' });
  } catch (error: any) {
    return json({ success: false, error: error.message }, { status: 500 });
  }
};

// DELETE: Menghapus data (DELETE /api/todos/[id])
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
  } catch (error: any) {
    return json({ success: false, error: error.message }, { status: 500 });
  }
};