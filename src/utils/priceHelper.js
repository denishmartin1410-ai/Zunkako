// src/utils/priceHelper.js
// ✅ Consumer price = base price + ₹2 platform fee
// Farmers see base price, consumers see base + PLATFORM_FEE

export const PLATFORM_FEE = 2;

export const getConsumerPrice = basePrice => {
  const price = parseFloat(basePrice) || 0;
  return price + PLATFORM_FEE;
};
