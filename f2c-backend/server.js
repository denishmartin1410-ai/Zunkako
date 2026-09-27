const app = require('./src/app');
const { db, messaging } = require('./src/config/firebase');
require('dotenv').config();

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`✅ ZUNKAKO Backend running on port ${PORT}`);

  // 🚀 Start Background Worker to listen for new Firestore notifications
  console.log('🎧 Listening for new notifications to send push alerts...');

  db.collectionGroup('items')
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
                  title: data.title || data.titleEn || 'ZUNKAKO Notification',
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
                    channelId: 'zunkako_default_channel',
                  },
                },
              });
              console.log(`✅ Push sent to ${data.userId} for: ${data.title}`);
            } else {
              console.log(`⚠️ No FCM token for user ${data.userId}`);
            }

            // 3. Mark as sent so we don't send again
            await change.doc.ref.update({ pushSent: true });
          } catch (error) {
            console.log('❌ Background Push Error:', error.message);
          }
        }
      });
    });
});

module.exports = server;
