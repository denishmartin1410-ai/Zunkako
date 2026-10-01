const admin = require('firebase-admin');
require('dotenv').config();

let serviceAccount;

// 1. Check Environment Variable (for Cloud Hosting like Render)
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } catch (e) {
    console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT env var:', e.message);
  }
}

// 2. Fallback to local serviceAccountKey.json if env var is missing
if (!serviceAccount) {
  try {
    serviceAccount = require('../../serviceAccountKey.json');
  } catch (e) {
    try {
      serviceAccount = require('../../serviceAccount.json');
    } catch (err) {
      console.log('Service Account Key file not found locally.');
    }
  }
}

// 3. Initialize Firebase Admin
if (!admin.apps.length) {
  try {
    if (serviceAccount) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log('Firebase Admin SDK initialized successfully!');
    } else {
      console.log('Firebase Admin running without service account key.');
      admin.initializeApp();
    }
  } catch (err) {
    console.error('Firebase Admin init error:', err.message);
  }
}

const db = admin.apps.length ? admin.firestore() : null;
const auth = admin.apps.length ? admin.auth() : null;
const messaging = admin.apps.length ? admin.messaging() : null;

module.exports = {
  admin,
  db,
  auth,
  messaging,
};
