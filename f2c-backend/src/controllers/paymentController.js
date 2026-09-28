const Razorpay = require('razorpay');
const crypto = require('crypto');
const { db, admin } = require('../config/firebase');

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_test_ThVPdKOvM1gazI';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'TLBPMhT2252Eezr513w7dJN8';

const razorpay = new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_KEY_SECRET,
});

/**
 * Create a new Razorpay Order (Server-Side)
 */
const createPaymentOrder = async (req, res) => {
  try {
    const { amount, currency = 'INR', receipt } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, error: 'Valid amount in INR is required' });
    }

    const options = {
      amount: Math.round(amount * 100), // Amount in paise
      currency,
      receipt: receipt || `receipt_${Date.now()}`,
      payment_capture: 1,
    };

    const razorpayOrder = await razorpay.orders.create(options);

    res.json({
      success: true,
      keyId: RAZORPAY_KEY_ID,
      order: {
        id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        receipt: razorpayOrder.receipt,
      },
    });
  } catch (error) {
    console.error('Razorpay Create Order Error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Verify Razorpay Payment Signature (HMAC SHA256 Server Verification)
 */
const verifyPaymentSignature = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, error: 'Payment verification parameters missing' });
    }

    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    const isAuthentic = expectedSignature === razorpay_signature;

    if (!isAuthentic) {
      console.warn(`❌ Fraud alert: Payment signature mismatch for order ${razorpay_order_id}`);
      return res.status(400).json({ success: false, error: 'Payment verification failed: Invalid signature' });
    }

    // Update Firestore order status if orderId provided
    if (db && orderId) {
      await db.collection('orders').doc(orderId).set(
        {
          paymentStatus: 'Paid',
          razorpayPaymentId: razorpay_payment_id,
          razorpayOrderId: razorpay_order_id,
          status: 'Confirmed',
          updatedAt: admin?.firestore?.FieldValue?.serverTimestamp() || new Date().toISOString(),
        },
        { merge: true },
      );
    }

    res.json({
      success: true,
      message: 'Payment signature verified successfully',
      paymentId: razorpay_payment_id,
      orderId,
    });
  } catch (error) {
    console.error('Razorpay Verify Signature Error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  createPaymentOrder,
  verifyPaymentSignature,
  RAZORPAY_KEY_ID,
};
