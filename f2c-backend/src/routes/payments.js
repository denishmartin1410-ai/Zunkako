const express = require('express');
const router = express.Router();
const { createPaymentOrder, verifyPaymentSignature } = require('../controllers/paymentController');

// Create Razorpay Order
router.post('/create-order', createPaymentOrder);

// Verify Payment Signature
router.post('/verify-signature', verifyPaymentSignature);

module.exports = router;
