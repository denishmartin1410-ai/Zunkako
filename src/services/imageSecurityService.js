// ============================================================
// 🛡️ F2C AI IMAGE SECURITY & CONTENT MODERATION SERVICE
// ✅ Google Cloud Vision API Integration
// ✅ Client-Side Instant AI Safety & Product Label Pre-Check
// ✅ Adult/NSFW/Violence Content Filtering
// ============================================================

import {Alert} from 'react-native';

// 🌾 Tamil - English Dictionary for Agricultural Product Verification
const PRODUCT_LABEL_DICTIONARY = {
  // Vegetables / காய்கறிகள்
  வெங்காயம்: [
    'onion',
    'shallot',
    'produce',
    'vegetable',
    'food',
    'plant',
    'root',
  ],
  தக்காளி: ['tomato', 'produce', 'vegetable', 'fruit', 'food', 'plant'],
  உருளைக்கிழங்கு: ['potato', 'root', 'produce', 'vegetable', 'food', 'tuber'],
  கேரட்: ['carrot', 'root', 'produce', 'vegetable', 'food'],
  கத்திரிக்காய்: [
    'eggplant',
    'aubergine',
    'produce',
    'vegetable',
    'food',
    'plant',
  ],
  வெண்டைக்காய்: ['okra', 'ladyfinger', 'produce', 'vegetable', 'food', 'pod'],
  முட்டைக்கோஸ்: ['cabbage', 'produce', 'vegetable', 'food', 'leaf'],
  காலிபிளவர்: ['cauliflower', 'produce', 'vegetable', 'food', 'floret'],
  பீட்ரூட்: ['beetroot', 'beet', 'root', 'produce', 'vegetable', 'food'],
  முள்ளங்கி: ['radish', 'root', 'produce', 'vegetable', 'food'],
  இஞ்சி: ['ginger', 'spice', 'root', 'produce', 'vegetable', 'food'],
  பூண்டு: ['garlic', 'bulb', 'spice', 'produce', 'vegetable', 'food'],
  பச்சைமிளகாய்: ['chili', 'pepper', 'produce', 'vegetable', 'food', 'spice'],
  சுரைக்காய்: ['gourd', 'squash', 'produce', 'vegetable', 'food'],
  பாகற்காய்: ['bitter gourd', 'gourd', 'produce', 'vegetable', 'food'],
  புடலங்காய்: ['snake gourd', 'gourd', 'produce', 'vegetable', 'food'],
  கொத்தவரை: ['cluster beans', 'bean', 'produce', 'vegetable', 'food'],
  பீன்ஸ்: ['beans', 'green beans', 'pod', 'produce', 'vegetable', 'food'],
  கீரைகள்: [
    'spinach',
    'greens',
    'leaf',
    'herbs',
    'produce',
    'vegetable',
    'food',
  ],

  // Fruits / பழங்கள்
  வாழைப்பழம்: ['banana', 'fruit', 'produce', 'food', 'plant'],
  ஆப்பிள்: ['apple', 'fruit', 'produce', 'food'],
  மாம்பழம்: ['mango', 'fruit', 'produce', 'food'],
  கொய்யா: ['guava', 'fruit', 'produce', 'food'],
  மாதுளை: ['pomegranate', 'fruit', 'produce', 'food'],
  திராட்சை: ['grapes', 'grape', 'fruit', 'produce', 'food', 'berry'],
  எலுமிச்சை: ['lemon', 'lime', 'citrus', 'fruit', 'produce', 'food'],
  பப்பாளி: ['papaya', 'fruit', 'produce', 'food'],
  அன்னாசி: ['pineapple', 'fruit', 'produce', 'food'],
  நாவல்: ['jamun', 'berry', 'fruit', 'produce', 'food'],

  // Dairy & Organic / பால் & இயற்கை பொருட்கள்
  பால்: ['milk', 'dairy', 'liquid', 'bottle', 'can', 'glass', 'beverage'],
  நெய்: ['ghee', 'butter', 'dairy', 'jar', 'oil', 'food'],
  மோர்: ['buttermilk', 'curd', 'dairy', 'beverage', 'liquid'],
  முட்டை: ['egg', 'eggs', 'poultry', 'food'],
  தேனை: ['honey', 'jar', 'sweet', 'food', 'nectar'],
};

/**
 * 🛡️ Client-Side AI Moderation via Google Cloud Vision API
 * @param {string} imageUri - Selected local image URI
 * @param {string} productName - Product Name (e.g. "Onion" / "வெங்காயம்")
 * @param {string} category - Product category
 * @param {string} base64Data - Optional base64 representation of the image
 * @returns {Promise<{safe: boolean, reason?: string}>}
 */
export const validateProductImageWithAI = async (
  imageUri,
  productName = '',
  category = '',
  base64Data = '',
) => {
  try {
    if (!imageUri) {
      return {safe: false, reason: 'படம் தேர்வு செய்யப்படவில்லை!'};
    }

    // If base64 is missing, fallback safely
    if (!base64Data) {
      console.log('🛡️ AI Moderation skipped: No base64 image data');
      return {safe: true};
    }

    // Google Cloud Vision API configuration using Firebase API key
    const apiKey = 'AIzaSyBVzoho4YbUpEvl8GO1xoj_i8rYEdkC7qg';
    const url = `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`;

    const body = {
      requests: [
        {
          image: {
            content: base64Data,
          },
          features: [
            {type: 'SAFE_SEARCH_DETECTION'},
            {type: 'LABEL_DETECTION', maxResults: 15},
          ],
        },
      ],
    };

    console.log('Sending image to Google Cloud Vision API...');
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const result = await response.json();
    const responseData = result.responses?.[0] || {};

    // 1. SafeSearch Moderation Check (Explicit, Racy, Violent content)
    const safeSearch = responseData.safeSearchAnnotation || {};
    const isUnsafe =
      safeSearch.adult === 'VERY_LIKELY' ||
      safeSearch.adult === 'LIKELY' ||
      safeSearch.violence === 'VERY_LIKELY' ||
      safeSearch.violence === 'LIKELY' ||
      safeSearch.racy === 'VERY_LIKELY' ||
      safeSearch.racy === 'LIKELY' ||
      safeSearch.medical === 'VERY_LIKELY'; // Blood / injury / inappropriate

    if (isUnsafe) {
      return {
        safe: false,
        reason:
          '⚠️ AI பாதுகாப்பு எச்சரிக்கை: நீங்கள் பதிவேற்றிய படம் சமூக விதிமுறைகளுக்கு முரணாக உள்ளது (Adult/Violence/Spam)! தயவுசெய்து சரியான வேளாண் தயாரிப்பு படத்தைப் பதிவேற்றவும்.',
      };
    }

    // 2. Product Label Verification Check
    const labels = (responseData.labelAnnotations || []).map(label =>
      (label.description || '').toLowerCase(),
    );

    console.log('Google Cloud Vision Detections:', labels);

    // Heuristics for inappropriate/non-agricultural content
    const blockedKeywords = [
      'dog',
      'cat',
      'car',
      'vehicle',
      'phone',
      'laptop',
      'meme',
      'screenshot',
    ];
    const detectedBlocked = blockedKeywords.find(
      bk => labels.includes(bk) || labels.some(l => l.includes(bk)),
    );
    if (detectedBlocked && category !== 'handicrafts') {
      return {
        safe: false,
        reason: `⚠️ AI கண்டறிதல் எச்சரிக்கை: இது ஒரு '${detectedBlocked}' போன்ற படம்! தயவுசெய்து தக்காளி, வெங்காயம் போன்ற சரியான வேளாண் தயாரிப்பு படத்தைப் பதிவேற்றவும்.`,
      };
    }

    // Exact name-based match
    const prodNameLower = (productName || '').toLowerCase().trim();
    const matchingKey = Object.keys(PRODUCT_LABEL_DICTIONARY).find(
      key => prodNameLower.includes(key) || key.includes(prodNameLower),
    );

    if (matchingKey) {
      const allowedLabels = PRODUCT_LABEL_DICTIONARY[matchingKey];
      // Check if at least one allowed label matches the vision detections
      const hasMatch = labels.some(
        l =>
          allowedLabels.includes(l) || allowedLabels.some(al => l.includes(al)),
      );
      if (!hasMatch) {
        return {
          safe: false,
          reason: `நீங்கள் '${productName}' என்று குறிப்பிட்டுள்ளீர்கள், ஆனால் வேறு படம் Upload செய்துள்ளீர்கள். தயவுசெய்து சரியான தயாரிப்பு படத்தையே பதிவேற்றவும்!`,
        };
      }
    }

    return {safe: true};
  } catch (error) {
    console.log('AI Image Validation Error:', error);
    return {safe: true}; // Fallback allow on network/fetch errors
  }
};

/**
 * 📢 Trigger Security Alert for Inappropriate Upload Attempt
 * @param {string} reason
 */
export const showAISecurityAlert = (reason = '') => {
  Alert.alert(
    '🛡️ AI பாதுகாப்பு எச்சரிக்கை',
    reason ||
      'நீங்கள் பதிவேற்றிய படம் தயாரிப்புடன் பொருந்தவில்லை அல்லது சமூக விதிமுறைகளுக்கு முரணாக உள்ளது!\n\nதயவுசெய்து சரியான வேளாண் தயாரிப்பின் படத்தையே பதிவேற்றவும்.',
    [{text: 'சரி (OK)', style: 'cancel'}],
  );
};
