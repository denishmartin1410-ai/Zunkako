const { db } = require('../config/firebase');

// Get all products
const getProducts = async (req, res) => {
  try {
    if (!db) {
      return res.json({ success: true, products: [] });
    }
    const snapshot = await db.collection('products').get();
    const products = [];
    snapshot.forEach((doc) => {
      products.push({ id: doc.id, ...doc.data() });
    });
    res.json({ success: true, products });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get product by ID
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!db) {
      return res.status(404).json({ error: 'Product not found' });
    }
    const doc = await db.collection('products').doc(id).get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json({ success: true, product: { id: doc.id, ...doc.data() } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create new product (Farmer)
const createProduct = async (req, res) => {
  try {
    const { name, price, unit, category, description, imageUrl, stock } = req.body;
    const farmerId = req.user?.uid || 'farmer_test';

    const newProduct = {
      name,
      price: Number(price),
      unit: unit || 'kg',
      category: category || 'General',
      description: description || '',
      imageUrl: imageUrl || '',
      stock: Number(stock) || 0,
      farmerId,
      createdAt: new Date().toISOString(),
    };

    if (!db) {
      return res.status(201).json({ success: true, id: 'temp_id', product: newProduct });
    }

    const docRef = await db.collection('products').add(newProduct);
    res.status(201).json({ success: true, id: docRef.id, product: newProduct });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
};
