const express = require('express');
const router = express.Router();
const { updateOrderStatus } = require('../controllers/orderController');

// PUT /api/orders/:orderId/status
router.put('/:orderId/status', updateOrderStatus);

module.exports = router;
