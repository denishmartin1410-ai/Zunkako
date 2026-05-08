// src/utils/priceHelper.js
// ✅ Consumer price = base price + ₹4 platform fee
// Farmers see base price, consumers see base + PLATFORM_FEE

export const PLATFORM_FEE = 4;

export const getConsumerPrice = (basePrice) => {
  const price = parseFloat(basePrice) || 0;
  return price + PLATFORM_FEE;
};
