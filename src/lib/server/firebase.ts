import { initializeApp, getApps, cert, type ServiceAccount } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { FIREBASE_PRIVATE_KEY } from '$app/env/private';

const serviceAccount = {
  type: 'service_account',
	project_id: 'warehouse-34393',
	private_key_id: 'a6ee6962e0c69bb6885899540fc9246365dc2d29',
	private_key: FIREBASE_PRIVATE_KEY,
	client_email: 'firebase-adminsdk-fbsvc@warehouse-34393.iam.gserviceaccount.com',
	client_id: '101787786009355304518',
	auth_uri: 'https://accounts.google.com/o/oauth2/auth',
	token_uri: 'https://oauth2.googleapis.com/token',
	auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
	client_x509_cert_url:
		'https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40warehouse-34393.iam.gserviceaccount.com',
	universe_domain: 'googleapis.com'
}

if (!getApps().length) {
    initializeApp({
        credential: cert(serviceAccount as ServiceAccount)
    });
}
export const db = getFirestore();