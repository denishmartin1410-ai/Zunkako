const { db, admin } = require('../config/firebase');
const { createNotification } = require('../routes/notifications');

// Update Order Status (Farmer)
const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { farmerToken, newStatus } = req.body;

    if (!farmerToken) {
      return res.status(401).json({ error: 'Farmer token required' });
    }

    if (newStatus === 'Delivered') {
      return res.status(403).json({
        error: 'Farmer Delivered set பண்ண முடியாது. Admin மட்டும்!',
      });
    }

    const decoded = await admin.auth().verifyIdToken(farmerToken);
    const orderDoc = await db.collection('orders').doc(orderId).get();

    if (!orderDoc.exists) {
      return res.status(404).json({ error: 'Order இல்லை' });
    }

    const order = orderDoc.data();

    if (order.farmerId !== decoded.uid) {
      return res.status(403).json({ error: 'இது உன்னுடைய order இல்லை' });
    }

    await db.collection('orders').doc(orderId).update({
      status: newStatus,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    const statusMessages = {
      Confirmed: {
        title: '✅ Order உறுதி!',
        body: `Order #${order.orderId || orderId.slice(-4)} confirm ஆச்சு!`,
      },
      Shipped: {
        title: '🚚 Order வருது!',
        body: `Order #${order.orderId || orderId.slice(-4)} on the way!`,
      },
      Harvested: {
        title: '🌾 Order Harvested!',
        body: `Order #${order.orderId || orderId.slice(-4)} அறுவடை செய்யப்பட்டது!`,
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

    res.json({ success: true, status: newStatus });
  } catch (e) {
    console.error('Order status update error:', e);
    res.status(500).json({ error: e.message });
  }
};

// Deliver Order (Admin)
const deliverOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { adminToken } = req.body;

    if (!adminToken) {
      return res.status(401).json({ error: 'Admin token required' });
    }

    const decoded = await admin.auth().verifyIdToken(adminToken);
    const adminDoc = await db.collection('users').doc(decoded.uid).get();

    if (adminDoc.data()?.userType !== 'admin') {
      return res.status(403).json({ error: 'Admin மட்டும் deliver mark பண்ண முடியும்' });
    }

    const orderDoc = await db.collection('orders').doc(orderId).get();
    if (!orderDoc.exists) {
      return res.status(404).json({ error: 'Order இல்லை' });
    }

    const order = orderDoc.data();

    await db.collection('orders').doc(orderId).update({
      status: 'Delivered',
      deliveredAt: admin.firestore.FieldValue.serverTimestamp(),
      deliveredBy: decoded.uid,
    });

    // Notify Consumer
    await createNotification(order.consumerId, {
      type: 'order',
      title: '🎉 Order Delivered!',
      body: `உங்கள் order #${order.orderId || orderId.slice(-4)} deliver ஆச்சு!`,
      orderId,
    });

    // Notify Farmer
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
};

module.exports = {
  updateOrderStatus,
  deliverOrder,
};
