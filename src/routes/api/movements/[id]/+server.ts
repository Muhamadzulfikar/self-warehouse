import { json, type RequestHandler } from '@sveltejs/kit';
import { db } from '../../../../lib/server/firebase.ts';

const COLLECTION = 'movements';

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
