const admin = require('firebase-admin');
const path = require('path');
require('dotenv').config();

// Try loading serviceAccountKey.json or serviceAccount.json
let serviceAccount;
try {
  serviceAccount = require('../../serviceAccountKey.json');
} catch (e) {
  try {
    serviceAccount = require('../../serviceAccount.json');
  } catch (err) {
    console.error('❌ Service Account Key file not found!');
  }
}

if (!admin.apps.length && serviceAccount) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  console.log('🔥 Firebase Admin SDK initialized successfully!');
}

const db = admin.firestore();
const auth = admin.auth();
const messaging = admin.messaging();

module.exports = {
  admin,
  db,
  auth,
  messaging,
};
