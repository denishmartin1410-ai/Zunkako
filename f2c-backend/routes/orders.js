const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const {createNotification} = require('./notifications');

const db = admin.firestore();

// PUT /api/orders/:orderId/status
router.put('/:orderId/status', async (req, res) => {
  try {
    const {orderId} = req.params;
    const {farmerToken, newStatus} = req.body;

    if (!farmerToken) {
      return res.status(401).json({error: 'Farmer token required'});
    }

    if (newStatus === 'Delivered') {
      return res.status(403).json({
        error: 'Farmer Delivered set பண்ண முடியாது. Admin மட்டும்!',
      });
    }

    const decoded = await admin.auth().verifyIdToken(farmerToken);
    const orderDoc = await db.collection('orders').doc(orderId).get();

    if (!orderDoc.exists) {
      return res.status(404).json({error: 'Order இல்லை'});
    }

    const order = orderDoc.data();

    if (order.farmerId !== decoded.uid) {
      return res.status(403).json({error: 'இது உன்னுடைய order இல்லை'});
    }

    await db.collection('orders').doc(orderId).update({
      status: newStatus,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    const statusMessages = {
      Confirmed: {
        title: '✅ Order உறுதி!',
        body: `Order #${order.orderId} confirm ஆச்சு!`,
      },
      Shipped: {
        title: '🚚 Order வருது!',
        body: `Order #${order.orderId} on the way!`,
      },
    };

    const notif = statusMessages[newStatus];
    if (notif) {
      await createNotification(order.consumerId, {
        type: 'order',
        title: notif.title,
        body: notif.body,
        orderId,
      });
    }

    res.json({success: true, status: newStatus});
  } catch (e) {
    console.error('Order status update error:', e);
    res.status(500).json({error: e.message});
  }
});

module.exports = router;
