const admin = require('firebase-admin');

// 1. Initialize Firebase Admin
const serviceAccount = require('./serviceAccount.json');
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();
const auth = admin.auth();

async function createSuperAdmin() {
  const adminEmail = 'admin@f2c.com'; // நீங்கள் விரும்பினால் இதை மாற்றிக்கொள்ளலாம்
  const adminPassword = 'SuperSecretPassword@123'; // இதை யாருக்கும் சொல்லாதீர்கள்!

  console.log(`🚀 Creating Super Admin account for ${adminEmail}...`);

  try {
    let userRecord;
    try {
      // Check if user already exists
      userRecord = await auth.getUserByEmail(adminEmail);
      console.log('✅ Admin account already exists in Authentication.');
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        // Create new user in Firebase Auth
        userRecord = await auth.createUser({
          email: adminEmail,
          password: adminPassword,
          displayName: 'F2C Super Admin',
          emailVerified: true,
        });
        console.log('✅ Admin account created in Authentication!');
      } else {
        throw error;
      }
    }

    // Create or Update user in Firestore
    await db.collection('users').doc(userRecord.uid).set(
      {
        uid: userRecord.uid,
        name: 'F2C Super Admin',
        email: adminEmail,
        userType: 'admin', // 👑 This makes them an Admin permanently!
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      {merge: true},
    );

    console.log('✅ Admin document securely saved in Firestore!');
    console.log('\n=============================================');
    console.log('🎉 ADMIN ACCOUNT READY!');
    console.log(`Email:    ${adminEmail}`);
    console.log(`Password: ${adminPassword}`);
    console.log('=============================================\n');
    console.log(
      'இனிமேல் ஆப்-ல் Admin Dashboard-க்குள் செல்ல இந்த Email & Password-ஐ மட்டும் பயன்படுத்தவும்!',
    );

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin:', error);
    process.exit(1);
  }
}

createSuperAdmin();
