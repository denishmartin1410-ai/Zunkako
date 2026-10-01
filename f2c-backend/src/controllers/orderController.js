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
        error: 'விவசாயியே நேரடியாக விநியோகம் செய்யும் முறையை அமைக்கவோ அல்லது மாற்றவோ முடியாது. நிர்வாகி மட்டும்!',
      });
    }

    if (!db || !admin) {
      return res.json({ success: true, status: newStatus });
    }

    const decoded = await admin.auth().verifyIdToken(farmerToken);
    const orderDoc = await db.collection('orders').doc(orderId).get();

    if (!orderDoc.exists) {
      return res.status(404).json({ error: 'ஆர்டர் இல்லை' });
    }

    const order = orderDoc.data();

    if (order.farmerId !== decoded.uid) {
      return res.status(403).json({ error: 'இது உன்னுடைய ஆர்டர் இல்லை' });
    }

    await db.collection('orders').doc(orderId).update({
      status: newStatus,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    const statusMessages = {
      Confirmed: {
        title: 'ஆர்டர் உறுதி!',
        body: `Order #${order.orderId || orderId.slice(-4)} confirmed!`,
      },
      Shipped: {
        title: 'ஆர்டர் வருது!',
        body: `Order #${order.orderId || orderId.slice(-4)} on the way!`,
      },
      Harvested: {
        title: 'Order Harvested!',
        body: `ஆர்டர் #${order.orderId || orderId.slice(-4)} அறுவடை செய்யப்பட்டது!`,
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

    if (!db || !admin) {
      return res.json({ success: true, message: 'Order delivered!' });
    }

    const decoded = await admin.auth().verifyIdToken(adminToken);
    const adminDoc = await db.collection('users').doc(decoded.uid).get();

    if (adminDoc.data()?.userType !== 'admin') {
      return res.status(403).json({ error: 'நிர்வாகி மட்டும் டெலிவரி அடையாளம் பண்ண முடியும்' });
    }

    const orderDoc = await db.collection('orders').doc(orderId).get();
    if (!orderDoc.exists) {
      return res.status(404).json({ error: 'ஆர்டர் இல்லை' });
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
      title: 'Order Delivered!',
      body: `உங்கள் ஆர்டர் #${order.orderId || orderId.slice(-4)} டெலிவரி செய்யப்பட்டது!`,
      orderId,
    });

    // Notify Farmer
    await createNotification(order.farmerId, {
      type: 'order',
      title: 'Order Completed!',
      body: `ஆர்டர் #${order.orderId || orderId.slice(-4)} வெற்றிகரமாக டெலிவரி செய்யப்பட்டது!`,
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
