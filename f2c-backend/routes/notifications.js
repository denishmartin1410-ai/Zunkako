const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');

// Ensure db and messaging are available
const db = admin.firestore();
const messaging = admin.messaging();

async function createNotification(userId, data) {
  // 1. Firestore-ல் notification save in nested collection
  await db
    .collection('notifications')
    .doc(userId)
    .collection('items')
    .add({
      type: data.type,
      title: data.title,
      body: data.body,
      orderId: data.orderId || null,
      isRead: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

  // 2. FCM Push notification send
  try {
    const userDoc = await db.collection('users').doc(userId).get();
    const fcmToken = userDoc.data()?.fcmToken;

    if (fcmToken) {
      await messaging.send({
        token: fcmToken,
        notification: {
          title: data.title,
          body: data.body,
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
    }
  } catch (e) {
    console.log('FCM send error:', e.message);
  }
}

// POST /api/notify - Manual notification
router.post('/notify', async (req, res) => {
  try {
    const {userId, title, body, type} = req.body;
    await createNotification(userId, {type, title, body});
    res.json({success: true});
  } catch (e) {
    res.status(500).json({error: e.message});
  }
});

module.exports = {router, createNotification};
