const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
require('dotenv').config();

// Initialize Firebase Admin
const serviceAccount = require('./serviceAccount.json');
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const app = express();

app.use(cors());
app.use(express.json());

// Routes
const {router: notificationRoutes} = require('./routes/notifications');
const adminRoutes = require('./routes/admin');
const orderRoutes = require('./routes/orders');

app.use('/api', notificationRoutes);
// Note: legacy /api/orders/:orderId/deliver is now /api/admin/orders/:orderId/deliver
// To maintain compatibility, we can also mount it at /api to support the old route path if needed
app.put('/api/orders/:orderId/deliver', async (req, res) => {
  // Forward to the admin router logic
  req.url = `/orders/${req.params.orderId}/deliver`;
  adminRoutes(req, res, () => {});
});

app.use('/api/admin', adminRoutes);
app.use('/api/orders', orderRoutes);

app.get('/api/health', (req, res) => {
  res.json({status: 'F2C Backend running! 🌿'});
});

// Server start
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ F2C Backend running on port ${PORT}`);

  // 🚀 Start Background Worker to listen for new Firestore notifications
  console.log('🎧 Listening for new notifications to send push alerts...');
  const db = admin.firestore();
  const messaging = admin.messaging();

  db.collectionGroup('items')
    // Removed .where('pushSent', '==', false) to avoid needing a custom index
    .onSnapshot(snapshot => {
      snapshot.docChanges().forEach(async change => {
        if (change.type === 'added' || change.type === 'modified') {
          const notifId = change.doc.id;
          const data = change.doc.data();

          // Skip if already sent (Memory filter instead of Database query filter)
          if (data.pushSent !== false) {
            return;
          }

          try {
            // 1. Get user FCM token
            const userDoc = await db.collection('users').doc(data.userId).get();
            const fcmToken = userDoc.data()?.fcmToken;

            // 2. Send Push
            if (fcmToken) {
              await messaging.send({
                token: fcmToken,
                notification: {
                  title: data.title || data.titleEn || 'F2C Notification',
                  body:
                    data.message || data.messageEn || 'You have a new update.',
                },
                data: {
                  type: data.type || '',
                  orderId: data.orderId || '',
                },
                android: {
                  priority: 'high',
                  notification: {
                    sound: 'default',
                    channelId: 'f2c_default_channel',
                  },
                },
              });
              console.log(`✅ Push sent to ${data.userId} for: ${data.title}`);
            } else {
              console.log(`⚠️ No FCM token for user ${data.userId}`);
            }

            // 3. Mark as sent so we don't send again
            await change.doc.ref.update({pushSent: true});
          } catch (error) {
            console.log('❌ Background Push Error:', error.message);
          }
        }
      });
    });
});
