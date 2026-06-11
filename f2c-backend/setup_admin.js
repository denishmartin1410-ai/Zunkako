const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccount.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const auth = admin.auth();
const db = admin.firestore();

async function setupAdmin() {
  console.log('--- Setting up Admin Account ---');
  const email = 'admin@f2c.com';
  const password = 'SuperSecretPassword';

  let uid;
  try {
    const userRecord = await auth.getUserByEmail(email);
    console.log(`Admin user already exists with UID: ${userRecord.uid}`);
    uid = userRecord.uid;

    // Update password just in case
    await auth.updateUser(uid, {password});
    console.log('Password updated successfully.');
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      console.log('Creating new Admin user...');
      const userRecord = await auth.createUser({
        email,
        password,
        displayName: 'F2C Admin',
        emailVerified: true,
      });
      uid = userRecord.uid;
      console.log(`Admin user created with UID: ${uid}`);
    } else {
      console.error('Error fetching admin user:', error);
      return;
    }
  }

  // Set user document in Firestore
  await db.collection('users').doc(uid).set(
    {
      uid: uid,
      email: email,
      name: 'F2C Super Admin',
      userType: 'admin',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      isVerified: true,
    },
    {merge: true},
  );

  console.log(
    '✅ Admin user document successfully saved in Firestore with userType: "admin"',
  );
  console.log('You can now log in using admin@f2c.com and SuperSecretPassword');
  process.exit(0);
}

setupAdmin();
