// src/utils/priceHelper.js
// ✅ Consumer price = base price + ₹2 platform fee
// Farmers see base price, consumers see base + PLATFORM_FEE

export const PLATFORM_FEE = 2;

export const getConsumerPrice = basePrice => {
  const price = parseFloat(basePrice) || 0;
  return price + PLATFORM_FEE;
};

export const getFarmerItemPrice = item => {
  if (!item) return 0;
  if (item.basePrice !== undefined && item.basePrice !== null) {
    return parseFloat(item.basePrice) || 0;
  }
  const price = parseFloat(item.price) || 0;
  // If price is stored as consumer price, subtract platform fee
  return Math.max(0, price - PLATFORM_FEE);
};

export const getFarmerOrderTotal = order => {
  if (!order) return 0;
  if (order.farmerAmount !== undefined && order.farmerAmount !== null) {
    return parseFloat(order.farmerAmount) || 0;
  }
  if (order.items && Array.isArray(order.items) && order.items.length > 0) {
    return order.items.reduce((sum, item) => {
      const fPrice = getFarmerItemPrice(item);
      const qty = parseFloat(item.quantity) || 1;
      return sum + fPrice * qty;
    }, 0);
  }
  const total = parseFloat(order.total) || 0;
  return Math.max(0, total - PLATFORM_FEE);
};
