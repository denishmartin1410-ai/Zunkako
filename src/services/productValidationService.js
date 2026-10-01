// src/services/productValidationService.js
/**
 * 🛡️ Zunkako Product Validation Service
 * 
 * Level 1: Form Validation (Field Completeness & Range Checks)
 * Level 2: Business Rules Validation (Product Name <-> Tamil Name, Category, Unit Compatibility)
 * Level 4: Duplicate Detection (Prevents uploading identical products by the same farmer)
 */

import firestore from '@react-native-firebase/firestore';

// 🌾 Comprehensive Agricultural Catalog Dictionary for Tamil Nadu
export const PRODUCT_CATALOG = [
  // Vegetables / காய்கறிகள்
  {en: 'potato', ta: 'உருளைக்கிழங்கு', category: 'vegetables', units: ['kg', 'g']},
  {en: 'tomato', ta: 'தக்காளி', category: 'vegetables', units: ['kg', 'g']},
  {en: 'onion', ta: 'வெங்காயம்', category: 'vegetables', units: ['kg', 'g']},
  {en: 'small onion', ta: 'சின்ன வெங்காயம்', category: 'vegetables', units: ['kg', 'g']},
  {en: 'shallot', ta: 'சின்ன வெங்காயம்', category: 'vegetables', units: ['kg', 'g']},
  {en: 'carrot', ta: 'கேரட்', category: 'vegetables', units: ['kg', 'g']},
  {en: 'brinjal', ta: 'கத்திரிக்காய்', category: 'vegetables', units: ['kg', 'g']},
  {en: 'eggplant', ta: 'கத்திரிக்காய்', category: 'vegetables', units: ['kg', 'g']},
  {en: 'ladies finger', ta: 'வெண்டைக்காய்', category: 'vegetables', units: ['kg', 'g']},
  {en: 'okra', ta: 'வெண்டைக்காய்', category: 'vegetables', units: ['kg', 'g']},
  {en: 'cabbage', ta: 'முட்டைக்கோஸ்', category: 'vegetables', units: ['kg', 'g']},
  {en: 'cauliflower', ta: 'காலிபிளவர்', category: 'vegetables', units: ['kg', 'g', 'piece']},
  {en: 'beetroot', ta: 'பீட்ரூட்', category: 'vegetables', units: ['kg', 'g']},
  {en: 'radish', ta: 'முள்ளங்கி', category: 'vegetables', units: ['kg', 'g']},
  {en: 'ginger', ta: 'இஞ்சி', category: 'vegetables', units: ['kg', 'g']},
  {en: 'garlic', ta: 'பூண்டு', category: 'vegetables', units: ['kg', 'g']},
  {en: 'green chili', ta: 'பச்சை மிளகாய்', category: 'vegetables', units: ['kg', 'g']},
  {en: 'chili', ta: 'மிளகாய்', category: 'vegetables', units: ['kg', 'g']},
  {en: 'bottle gourd', ta: 'சுரைக்காய்', category: 'vegetables', units: ['kg', 'piece']},
  {en: 'bitter gourd', ta: 'பாகற்காய்', category: 'vegetables', units: ['kg', 'g']},
  {en: 'snake gourd', ta: 'புடலங்காய்', category: 'vegetables', units: ['kg', 'g']},
  {en: 'ridge gourd', ta: 'பீர்க்கங்காய்', category: 'vegetables', units: ['kg', 'g']},
  {en: 'drumstick', ta: 'முருங்கைக்காய்', category: 'vegetables', units: ['kg', 'bunch', 'piece']},
  {en: 'beans', ta: 'பீன்ஸ்', category: 'vegetables', units: ['kg', 'g']},
  {en: 'cluster beans', ta: 'கொத்தவரை', category: 'vegetables', units: ['kg', 'g']},
  {en: 'capsicum', ta: 'குடைமிளகாய்', category: 'vegetables', units: ['kg', 'g']},
  {en: 'pumpkin', ta: 'பூசணிக்காய்', category: 'vegetables', units: ['kg', 'piece']},
  {en: 'ash gourd', ta: 'வெண்பூசணி', category: 'vegetables', units: ['kg', 'piece']},
  {en: 'sweet potato', ta: 'சர்க்கரைவள்ளி கிழங்கு', category: 'vegetables', units: ['kg', 'g']},

  // Fruits / பழங்கள்
  {en: 'banana', ta: 'வாழைப்பழம்', category: 'fruits', units: ['dozen', 'kg']},
  {en: 'apple', ta: 'ஆப்பிள்', category: 'fruits', units: ['kg', 'g']},
  {en: 'mango', ta: 'மாம்பழம்', category: 'fruits', units: ['kg']},
  {en: 'guava', ta: 'கொய்யா', category: 'fruits', units: ['kg', 'g']},
  {en: 'pomegranate', ta: 'மாதுளை', category: 'fruits', units: ['kg', 'g']},
  {en: 'grapes', ta: 'திராட்சை', category: 'fruits', units: ['kg', 'g']},
  {en: 'lemon', ta: 'எலுமிச்சை', category: 'fruits', units: ['piece', 'kg']},
  {en: 'papaya', ta: 'பப்பாளி', category: 'fruits', units: ['kg', 'piece']},
  {en: 'pineapple', ta: 'அன்னாசி', category: 'fruits', units: ['piece', 'kg']},
  {en: 'watermelon', ta: 'தர்பூசணி', category: 'fruits', units: ['kg', 'piece']},
  {en: 'muskmelon', ta: 'முலாம் பழம்', category: 'fruits', units: ['kg', 'piece']},
  {en: 'orange', ta: 'ஆரஞ்சு', category: 'fruits', units: ['kg', 'g']},
  {en: 'jackfruit', ta: 'பலாப்பழம்', category: 'fruits', units: ['kg', 'piece']},
  {en: 'sapota', ta: 'சப்போட்டா', category: 'fruits', units: ['kg', 'g']},
  {en: 'custard apple', ta: 'சீதாப்பழம்', category: 'fruits', units: ['kg', 'g']},

  // Grains & Millets / தானியங்கள் & சிறுதானியங்கள்
  {en: 'rice', ta: 'அரிசி', category: 'grains', units: ['kg']},
  {en: 'paddy', ta: 'நெல்லு', category: 'grains', units: ['kg']},
  {en: 'wheat', ta: 'கோதுமை', category: 'grains', units: ['kg']},
  {en: 'maize', ta: 'மக்காச்சோளம்', category: 'grains', units: ['kg']},
  {en: 'corn', ta: 'சோளம்', category: 'grains', units: ['kg']},
  {en: 'ragi', ta: 'கேழ்வரகு', category: 'millets', units: ['kg']},
  {en: 'finger millet', ta: 'கேழ்வரகு', category: 'millets', units: ['kg']},
  {en: 'foxtail millet', ta: 'தினை', category: 'millets', units: ['kg']},
  {en: 'kodo millet', ta: 'வரகு', category: 'millets', units: ['kg']},
  {en: 'little millet', ta: 'சாமை', category: 'millets', units: ['kg']},
  {en: 'barnyard millet', ta: 'குதிரைவாலி', category: 'millets', units: ['kg']},
  {en: 'pearl millet', ta: 'கம்பு', category: 'millets', units: ['kg']},
  {en: 'bajra', ta: 'கம்பு', category: 'millets', units: ['kg']},

  // Greens & Herbs / கீரைகள் & மூலிகைகள்
  {en: 'spinach', ta: 'கீரை', category: 'greens', units: ['bunch']},
  {en: 'palak', ta: 'பசலைக்கீரை', category: 'greens', units: ['bunch']},
  {en: 'coriander', ta: 'கொத்தமல்லி', category: 'greens', units: ['bunch']},
  {en: 'mint', ta: 'புதினா', category: 'greens', units: ['bunch']},
  {en: 'curry leaves', ta: 'கறிவேப்பிலை', category: 'greens', units: ['bunch']},
  {en: 'fenugreek leaves', ta: 'வெந்தயக்கீரை', category: 'greens', units: ['bunch']},
  {en: 'moringa leaves', ta: 'முருங்கைக்கீரை', category: 'greens', units: ['bunch']},
  {en: 'tulsi', ta: 'துளசி', category: 'herbs', units: ['bunch', 'g']},
  {en: 'neem', ta: 'வேப்பிலை', category: 'herbs', units: ['bunch', 'g']},

  // Dairy / பால் பொருட்கள்
  {en: 'milk', ta: 'பால்', category: 'dairy', units: ['litre']},
  {en: 'cow milk', ta: 'பசுவின் பால்', category: 'dairy', units: ['litre']},
  {en: 'buffalo milk', ta: 'எருமைப் பால்', category: 'dairy', units: ['litre']},
  {en: 'ghee', ta: 'நெய்', category: 'dairy', units: ['litre', 'kg', 'g']},
  {en: 'butter', ta: 'வெண்ணெய்', category: 'dairy', units: ['kg', 'g']},
  {en: 'curd', ta: 'தயிர்', category: 'dairy', units: ['litre', 'kg']},
  {en: 'buttermilk', ta: 'மோர்', category: 'dairy', units: ['litre']},
  {en: 'paneer', ta: 'பன்னீர்', category: 'dairy', units: ['kg', 'g']},
  {en: 'egg', ta: 'முட்டை', category: 'dairy', units: ['piece', 'dozen']},
  {en: 'country egg', ta: 'நாட்டு முட்டை', category: 'dairy', units: ['piece', 'dozen']},

  // Nuts & Organic / பருப்புகள் & இயற்கை பொருட்கள்
  {en: 'groundnut', ta: 'நிலக்கடலை', category: 'nuts', units: ['kg', 'g']},
  {en: 'peanut', ta: 'வேர்க்கடலை', category: 'nuts', units: ['kg', 'g']},
  {en: 'coconut', ta: 'தேங்காய்', category: 'organic', units: ['piece', 'kg']},
  {en: 'honey', ta: 'தேனை', category: 'organic', units: ['kg', 'g', 'litre']},
  {en: 'jaggery', ta: 'வெல்லம்', category: 'organic', units: ['kg', 'g']},
  {en: 'palm jaggery', ta: 'கருப்பட்டி', category: 'organic', units: ['kg', 'g']},
  {en: 'turmeric', ta: 'மஞ்சள்', category: 'organic', units: ['kg', 'g']},

  // Handicrafts / கைவினைப் பொருட்கள்
  {en: 'handicraft', ta: 'கைவினைப் பொருள்', category: 'handicrafts', units: ['piece']},
  {en: 'pot', ta: 'மண்பாண்டம்', category: 'handicrafts', units: ['piece']},
  {en: 'clay pot', ta: 'மண் பானை', category: 'handicrafts', units: ['piece']},
  {en: 'basket', ta: 'கூடை', category: 'handicrafts', units: ['piece']},
  {en: 'saree', ta: 'சேலை', category: 'handicrafts', units: ['piece']},
  {en: 'dhoti', ta: 'வேட்டி', category: 'handicrafts', units: ['piece']},
  {en: 'towel', ta: 'துண்டு', category: 'handicrafts', units: ['piece']},
];

/**
 * 🎯 Level 1: Form Validation
 * Verifies all required fields, numbers, positive values, complete address.
 */
export const validateLevel1Form = (data) => {
  const {
    imageUri,
    name,
    nameTa,
    price,
    stock,
    freshHours,
    shelfLife,
    material,
    craftingTime,
    farmerAddress,
    unit,
    category,
  } = data;

  // 1. Image Check
  if (!imageUri) {
    return {
      valid: false,
      error: 'தயவுசெய்து தயாரிப்புப் படத்தைப் பதிவேற்றுங்கள். (Please select a product image)',
    };
  }

  // 2. English Name Check
  if (!name || !name.trim()) {
    return {
      valid: false,
      error: 'தயவுசெய்து Product Name (English) உள்ளிடவும். (Product Name in English is required)',
    };
  }
  if (name.trim().length < 2) {
    return {
      valid: false,
      error: 'Product Name (English) குறைந்தது 2 எழுத்துக்கள் இருக்க வேண்டும்.',
    };
  }

  // 3. Tamil Name Check
  if (!nameTa || !nameTa.trim()) {
    return {
      valid: false,
      error: 'தயவுசெய்து Product Name (Tamil) உள்ளிடவும். (Product Name in Tamil is required)',
    };
  }
  if (nameTa.trim().length < 2) {
    return {
      valid: false,
      error: 'Product Name (Tamil) குறைந்தது 2 எழுத்துக்கள் இருக்க வேண்டும்.',
    };
  }

  // 4. Price Validation
  if (price === undefined || price === null || String(price).trim() === '') {
    return {
      valid: false,
      error: 'தயவுசெய்து பொருளின் விலையை (Price) உள்ளிடவும்.',
    };
  }
  const parsedPrice = Number(price);
  if (isNaN(parsedPrice)) {
    return {
      valid: false,
      error: 'விலை (Price) எண்ணாக (Number) மட்டுமே இருக்க வேண்டும். (e.g. 50)',
    };
  }
  if (parsedPrice <= 0) {
    return {
      valid: false,
      error: 'விலை (Price) 0 அல்லது எதிர்மறை மதிப்பாக (Negative Value) இருக்கக்கூடாது. (Price must be > 0)',
    };
  }
  if (parsedPrice > 100000) {
    return {
      valid: false,
      error: 'விலை (Price) நியாயமான தொகையாக இருக்க வேண்டும் (அதிகபட்சம் ₹1,00,000).',
    };
  }

  // 5. Stock Validation
  if (stock === undefined || stock === null || String(stock).trim() === '') {
    return {
      valid: false,
      error: 'தயவுசெய்து கையிருப்பு அளவை (Stock Quantity) உள்ளிடவும்.',
    };
  }
  const parsedStock = Number(stock);
  if (isNaN(parsedStock) || !Number.isInteger(parsedStock)) {
    return {
      valid: false,
      error: 'கையிருப்பு (Stock Quantity) முழு எண்ணாக (Integer Number) மட்டுமே இருக்க வேண்டும்.',
    };
  }
  if (parsedStock <= 0) {
    return {
      valid: false,
      error: 'கையிருப்பு (Stock Quantity) 0 அல்லது எதிர்மறை மதிப்பாக இருக்கக்கூடாது. (Stock must be > 0)',
    };
  }

  // 6. Category Specific Field Validations
  const isPerishable = ['vegetables', 'fruits', 'greens', 'dairy', 'herbs', 'organic'].includes(category);
  const isNonPerishable = ['grains', 'millets', 'nuts'].includes(category);
  const isHandicraft = category === 'handicrafts';

  if (isPerishable) {
    if (!freshHours || isNaN(Number(freshHours)) || Number(freshHours) <= 0) {
      return {
        valid: false,
        error: 'தயவுசெய்து சரியான புத்துணர்வு நேரத்தை (Freshness Hours) உள்ளிடவும்.',
      };
    }
  } else if (isNonPerishable) {
    if (!shelfLife || isNaN(Number(shelfLife)) || Number(shelfLife) <= 0) {
      return {
        valid: false,
        error: 'தயவுசெய்து சரியான பாதுகாப்பு காலத்தை (Shelf Life Months) உள்ளிடவும்.',
      };
    }
  } else if (isHandicraft) {
    if (!material || !material.trim()) {
      return {
        valid: false,
        error: 'தயவுசெய்து பயன்படுத்தப்பட்ட பொருளின் பெயரை (Material) உள்ளிடவும்.',
      };
    }
    if (!craftingTime || isNaN(Number(craftingTime)) || Number(craftingTime) <= 0) {
      return {
        valid: false,
        error: 'தயவுசெய்து சரியான தயாரிப்பு காலத்தை (Crafting Time Days) உள்ளிடவும்.',
      };
    }
  }

  // 7. Complete Address Validation
  const addressStr = (farmerAddress || '').trim();
  if (!addressStr || addressStr.length < 15 || !/\d/.test(addressStr)) {
    return {
      valid: false,
      error: 'விவசாயி கதவு எண், தெரு பெயர், பகுதி, மாவட்டம் மற்றும் PIN Code கொண்ட முழு முகவரியை உள்ளிட வேண்டும்.',
    };
  }

  // 8. Unit Selection
  if (!unit || !unit.trim()) {
    return {
      valid: false,
      error: 'தயவுசெய்து சரியான அலகை (Unit) தேர்வு செய்யுங்கள்.',
    };
  }

  // 9. Category Selection
  if (!category || !category.trim()) {
    return {
      valid: false,
      error: 'தயவுசெய்து சரியான பிரிவை (Category) தேர்வு செய்யுங்கள்.',
    };
  }

  return {valid: true};
};

/**
 * 🎯 Level 2: Business Rules Validation
 * Cross-checks Name, Tamil Name, Category, and Unit against real-world domain rules.
 */
export const validateLevel2BusinessRules = (name, nameTa, category, unit) => {
  const normName = (name || '').toLowerCase().trim();
  const normNameTa = (nameTa || '').toLowerCase().trim();
  const normCategory = (category || '').toLowerCase().trim();
  const normUnit = (unit || '').toLowerCase().trim();

  // Find if product exists in catalog
  const catalogEntry = PRODUCT_CATALOG.find(
    item =>
      normName.includes(item.en) ||
      item.en.includes(normName) ||
      normNameTa.includes(item.ta) ||
      item.ta.includes(normNameTa)
  );

  if (catalogEntry) {
    // 1. Check Product Name vs Category Match
    if (catalogEntry.category !== normCategory) {
      const categoryNamesInTa = {
        vegetables: 'காய்கறிகள் (Vegetables)',
        fruits: 'பழங்கள் (Fruits)',
        grains: 'தானியங்கள் (Grains)',
        millets: 'சிறுதானியங்கள் (Millets)',
        greens: 'கீரைகள் (Greens)',
        dairy: 'பால் பொருட்கள் (Dairy)',
        herbs: 'மூலிகைகள் (Herbs)',
        organic: 'இயற்கை பொருட்கள் (Organic)',
        nuts: 'பருப்புகள் (Nuts)',
        handicrafts: 'கைவினைப் பொருட்கள் (Handicrafts)',
      };
      return {
        valid: false,
        error: `'${name}' என்ற பொருள் '${categoryNamesInTa[catalogEntry.category]}' பிரிவில் மட்டுமே வர வேண்டும். '${categoryNamesInTa[normCategory] || normCategory}' பிரிவில் சேர்க்கக்கூடாது!`,
      };
    }

    // 2. Check Product Name vs Unit Match
    if (!catalogEntry.units.includes(normUnit)) {
      return {
        valid: false,
        error: `'${name}' என்ற பொருளுக்கு '${normUnit}' அலகு பொருந்தாது. சரியான அலகு (${catalogEntry.units.join(', ')}) தேர்வு செய்யவும்!`,
      };
    }
  }

  // Generic Domain Rules
  // Potato specific check
  if (normName.includes('potato') || normNameTa.includes('உருளை')) {
    if (normCategory !== 'vegetables') {
      return {
        valid: false,
        error: 'உருளைக்கிழங்கு (Potato) காய்கறிகள் (Vegetables) பிரிவில் மட்டுமே சேர்க்கப்பட வேண்டும்!',
      };
    }
    if (!['kg', 'g'].includes(normUnit)) {
      return {
        valid: false,
        error: 'உருளைக்கிழங்கு (Potato) Kg அல்லது Grams அலகில் மட்டுமே விற்க முடியும்!',
      };
    }
  }

  // Rice specific check
  if (normName.includes('rice') || normNameTa.includes('அரிசி')) {
    if (normCategory !== 'grains') {
      return {
        valid: false,
        error: 'அரிசி (Rice) தானியங்கள் (Grains) பிரிவில் மட்டுமே இருக்க வேண்டும்!',
      };
    }
    if (normUnit !== 'kg') {
      return {
        valid: false,
        error: 'அரிசி (Rice) Kg அலகில் மட்டுமே இருக்க வேண்டும்!',
      };
    }
  }

  // Milk specific check
  if (normName.includes('milk') || normNameTa.includes('பால்')) {
    if (normCategory !== 'dairy') {
      return {
        valid: false,
        error: 'பால் (Milk) பால் பொருட்கள் (Dairy) பிரிவில் மட்டுமே இருக்க வேண்டும்!',
      };
    }
    if (normUnit !== 'litre') {
      return {
        valid: false,
        error: 'பால் (Milk) Litre அலகில் மட்டுமே இருக்க வேண்டும்!',
      };
    }
  }

  // Egg specific check
  if (normName.includes('egg') || normNameTa.includes('முட்டை')) {
    if (!['piece', 'dozen'].includes(normUnit)) {
      return {
        valid: false,
        error: 'முட்டை (Egg) Piece அல்லது Dozen அலகில் மட்டுமே இருக்க வேண்டும்!',
      };
    }
  }

  // Banana specific check
  if (normName.includes('banana') || normNameTa.includes('வாழை')) {
    if (normCategory !== 'fruits') {
      return {
        valid: false,
        error: 'வாழைப்பழம் (Banana) பழங்கள் (Fruits) பிரிவில் மட்டுமே இருக்க வேண்டும்!',
      };
    }
    if (!['dozen', 'kg'].includes(normUnit)) {
      return {
        valid: false,
        error: 'வாழைப்பழம் (Banana) Dozen அல்லது Kg அலகில் மட்டுமே இருக்க வேண்டும்!',
      };
    }
  }

  // Category vs Unit basic rules
  if (normUnit === 'litre' && normCategory !== 'dairy') {
    return {
      valid: false,
      error: "Litre அலகு பால் பொருட்கள் (Dairy) வகைக்கு மட்டுமே பொருந்தும்!",
    };
  }

  if (normUnit === 'bunch' && !['greens', 'herbs'].includes(normCategory)) {
    return {
      valid: false,
      error: "Bunch (கட்டு) அலகு கீரைகள் அல்லது மூலிகைகள் வகைக்கு மட்டுமே பொருந்தும்!",
    };
  }

  if (normUnit === 'piece' && !['handicrafts', 'dairy', 'fruits', 'vegetables', 'organic'].includes(normCategory)) {
    return {
      valid: false,
      error: "Piece அலகு காய்கறி/பழம்/முட்டை/கைவினை பொருட்களுக்கு மட்டுமே செல்லும்!",
    };
  }

  return {valid: true};
};

/**
 * 🎯 Level 4: Duplicate Detection
 * Queries Firestore to see if the farmer has already uploaded the exact same product.
 */
export const validateLevel4Duplicate = async (farmerId, name, category, price, unit) => {
  try {
    if (!farmerId) return {valid: true};

    const normName = (name || '').trim().toLowerCase();
    const normCategory = (category || '').trim().toLowerCase();
    const parsedPrice = Number(price);
    const normUnit = (unit || '').trim().toLowerCase();

    const snapshot = await firestore()
      .collection('products')
      .where('farmerId', '==', farmerId)
      .get();

    const isDuplicate = snapshot.docs.some(doc => {
      const data = doc.data();
      const existingName = (data.name || '').trim().toLowerCase();
      const existingCat = (data.category || '').trim().toLowerCase();
      const existingPrice = Number(data.price);
      const existingUnit = (data.unit || '').trim().toLowerCase();

      return (
        existingName === normName &&
        existingCat === normCategory &&
        existingPrice === parsedPrice &&
        existingUnit === normUnit
      );
    });

    if (isDuplicate) {
      return {
        valid: false,
        error: 'இந்த தயாரிப்பு ஏற்கனவே உங்களால் பதிவேற்றம் செய்யப்பட்டுள்ளது. (Duplicate Product detected)',
      };
    }

    return {valid: true};
  } catch (error) {
    console.log('Duplicate check error (continuing safely):', error);
    return {valid: true};
  }
};
