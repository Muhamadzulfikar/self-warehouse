import { json, type RequestHandler } from '@sveltejs/kit';
import { db } from '../../../lib/server/firebase.ts';
import type { Todo, CreateTodoRequest } from '../../../interface/todoInterface.ts';

const COLLECTION = 'todos';

// READ: Mengambil semua data (GET /api/todos)
export const GET: RequestHandler = async () => {
  try {
    const snapshot = await db.collection(COLLECTION).get();
    const todos: Todo[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...(doc.data() as Omit<Todo, 'id'>)
    }));
    
    return json({ success: true, data: todos });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return json({ success: false, error: message }, { status: 500 });
  }
};

// CREATE: Menambah data baru (POST /api/todos)
export const POST: RequestHandler = async ({ request }) => {
  try {
    const body = (await request.json()) as CreateTodoRequest;
    const { title } = body;

    if (!title) {
      return json({ success: false, error: 'Title wajib diisi' }, { status: 400 });
    }

    // Fixed: changed adminDb to db to match the import
    const docRef = await db.collection(COLLECTION).add({
      title,
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