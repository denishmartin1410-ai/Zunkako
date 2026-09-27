const express = require('express');
const router = express.Router();
const { deliverOrder } = require('../controllers/orderController');

// PUT /api/admin/orders/:orderId/deliver
router.put('/orders/:orderId/deliver', deliverOrder);

module.exports = router;
