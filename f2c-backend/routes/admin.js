const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const { createNotification } = require('./notifications');

const db = admin.firestore();

// PUT /api/admin/orders/:orderId/deliver
router.put('/orders/:orderId/deliver', async (req, res) => {
    try {
        const { orderId } = req.params;
        const { adminToken } = req.body;

        if (!adminToken) {
            return res.status(401).json({ error: 'Admin token required' });
        }

        // Admin verify
        const decoded = await admin.auth().verifyIdToken(adminToken);
        const adminDoc = await db.collection('users').doc(decoded.uid).get();

        if (adminDoc.data()?.userType !== 'admin') {
            return res.status(403).json({ error: 'Admin மட்டும் deliver mark பண்ண முடியும்' });
        }

        // Get Order
        const orderDoc = await db.collection('orders').doc(orderId).get();
        if (!orderDoc.exists) {
            return res.status(404).json({ error: 'Order இல்லை' });
        }

        const order = orderDoc.data();

        // Update Order
        await db.collection('orders').doc(orderId).update({
            status: 'Delivered',
            deliveredAt: admin.firestore.FieldValue.serverTimestamp(),
            deliveredBy: decoded.uid,
        });

        // Notifications
        await createNotification(order.consumerId, {
            type: 'order',
            title: '🎉 Order Delivered!',
            body: `உங்கள் order #${order.orderId || orderId.slice(-4)} deliver ஆச்சு!`,
            orderId,
        });

        await createNotification(order.farmerId, {
            type: 'order',
            title: '✅ Order Completed!',
            body: `Order #${order.orderId || orderId.slice(-4)} வெற்றிகரமாக deliver ஆச்சு!`,
            orderId,
        });

        res.json({ success: true, message: 'Order delivered!' });
    } catch (e) {
        console.error('Admin order update error:', e);
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;
