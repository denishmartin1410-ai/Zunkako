const express = require('express');
const cors = require('cors');

const userRoutes = require('./routes/users');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const adminRoutes = require('./routes/admin');
const paymentRoutes = require('./routes/payments');
const { router: notificationRoutes } = require('./routes/notifications');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', notificationRoutes);

// Legacy backward compatibility route for order deliver
app.put('/api/orders/:orderId/deliver', async (req, res) => {
  req.url = `/orders/${req.params.orderId}/deliver`;
  adminRoutes(req, res, () => {});
});

app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ZUNKAKO Backend running! 🌿' });
});

module.exports = app;
