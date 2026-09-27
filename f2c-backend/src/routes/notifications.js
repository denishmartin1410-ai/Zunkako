const express = require('express');
const router = express.Router();
const { db, messaging, admin } = require('../config/firebase');

async function createNotification(userId, data) {
  // 1. Save notification in Firestore nested collection
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

  // 2. Send FCM Push notification
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
            channelId: 'zunkako_default_channel',
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
    const { userId, title, body, type } = req.body;
    await createNotification(userId, { type, title, body });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = { router, createNotification };
