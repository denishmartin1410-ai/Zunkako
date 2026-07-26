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

export const formatUnitPrice = (price, unit) => {
  const p = parseFloat(price) || 0;
  const u = (unit || 'kg').trim();
  return `₹${p} / 1${u}`;
};

export const validateUnitAndCategory = (unit, category, nameEn = '', nameTa = '') => {
  const normUnit = (unit || 'kg').toLowerCase().trim();
  const normCategory = (category || '').toLowerCase().trim();
  const normNameEn = (nameEn || '').toLowerCase().trim();
  const normNameTa = (nameTa || '').toLowerCase().trim();
  const fullName = `${normNameEn} ${normNameTa}`;

  // 1. Check unit = 'kg'
  if (normUnit === 'kg') {
    const allowedKg = ['vegetables', 'fruits', 'grains', 'millets'];
    if (!allowedKg.includes(normCategory)) {
      return {
        valid: false,
        msg: `Unit 'kg' is only valid for Vegetables, Fruits, Grains, or Millets categories!\n\n'kg' அலகு காய்கறிகள், பழங்கள், தானியங்கள் அல்லது சிறுதானியங்கள் வகைகளுக்கு மட்டுமே செல்லும்!`,
      };
    }
  }

  // 2. Check unit = 'g'
  if (normUnit === 'g') {
    const allowedG = ['organic', 'nuts'];
    if (!allowedG.includes(normCategory)) {
      return {
        valid: false,
        msg: `Unit 'g' is only valid for Organic or Nuts & Seeds categories!\n\n'g' அலகு இயற்கை பொருட்கள் அல்லது பருப்பு/விதைகள் வகைகளுக்கு மட்டுமே செல்லும்!`,
      };
    }
  }

  // 3. Check unit = 'bunch'
  if (normUnit === 'bunch') {
    const allowedBunch = ['greens', 'herbs'];
    if (!allowedBunch.includes(normCategory)) {
      return {
        valid: false,
        msg: `Unit 'bunch' (கட்டு) is only valid for Greens or Herbs categories!\n\n'bunch' (கட்டு) அலகு கீரைகள் அல்லது மூலிகைகள் வகைகளுக்கு மட்டுமே செல்லும்!`,
      };
    }
  }

  // 4. Check unit = 'litre'
  if (normUnit === 'litre') {
    const allowedLitre = ['dairy'];
    if (!allowedLitre.includes(normCategory)) {
      return {
        valid: false,
        msg: `Unit 'litre' is only valid for Dairy products!\n\n'litre' அலகு பால்/பால் பொருட்கள் (Dairy) வகைக்கு மட்டுமே செல்லும்!`,
      };
    }
  }

  // 5. Check unit = 'piece'
  if (normUnit === 'piece') {
    const allowedPiece = ['handicrafts'];
    if (!allowedPiece.includes(normCategory)) {
      return {
        valid: false,
        msg: `Unit 'piece' (எண்ணிக்கை) is only valid for Handicrafts category!\n\n'piece' அலகு கைவினைப் பொருட்கள் (Handicrafts) வகைக்கு மட்டுமே செல்லும்!`,
      };
    }
  }

  // 6. Check unit = 'dozen'
  if (normUnit === 'dozen') {
    const isDozenValid =
      fullName.includes('egg') ||
      fullName.includes('मुட்டை') ||
      fullName.includes('முட்டை') ||
      fullName.includes('banana') ||
      fullName.includes('வாழை');

    if (
      !isDozenValid ||
      ['vegetables', 'grains', 'millets', 'greens', 'dairy', 'herbs', 'handicrafts'].includes(normCategory)
    ) {
      if (
        fullName.includes('potato') ||
        fullName.includes('உருளை') ||
        fullName.includes('tomato') ||
        fullName.includes('தக்காளி') ||
        normCategory === 'vegetables'
      ) {
        return {
          valid: false,
          msg: `Unit 'dozen' (12 items) is only valid for items sold by dozen (such as Eggs or Bananas). Vegetables like Potato or Tomato cannot be sold in dozen! Please select 'kg'!\n\n'dozen' (12 எண்ணிக்கை) அலகு முட்டை அல்லது வாழைப்பழம் போன்ற பொருட்களுக்கு மட்டுமே செல்லுபடியாகும். உருளைக்கிழங்கு, தக்காளி போன்ற காய்கறிகளுக்கு 'kg' அலகு தேர்வு செய்யவும்!`,
        };
      }
      return {
        valid: false,
        msg: `Unit 'dozen' (12 items) is only valid for items sold by dozen (such as Eggs or Bananas)!\n\n'dozen' (12 எண்ணிக்கை) அலகு முட்டை அல்லது வாழைப்பழம் போன்ற பொருட்களுக்கு மட்டுமே செல்லுபடியாகும்!`,
      };
    }
  }

  return {valid: true};
};
