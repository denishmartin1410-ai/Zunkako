/**
 * Dynamic Translation and Visual mapping for F2C agricultural products.
 * Automatically maps product names across English, Tamil, and Malayalam,
 * and assigns specific vibrant visual gradient styles and emojis to represent
 * crops premiumly in the app without fake images.
 */

const PRODUCT_TRANSLATIONS = {
  potato: {en: 'Potato', ta: 'உருளைக்கிழங்கு', ml: 'ഉരുളക്കിഴങ്ങ്'},
  onion: {en: 'Onion', ta: 'வெங்காயம்', ml: 'സവാള'},
  tomato: {en: 'Tomato', ta: 'தக்காளி', ml: 'തക്കാളി'},
  carrot: {en: 'Carrot', ta: 'கேரட்', ml: 'കാരറ്റ്'},
  brinjal: {en: 'Brinjal', ta: 'கத்தரிக்காய்', ml: 'വഴുതനങ്ങ'},
  eggplant: {en: 'Eggplant', ta: 'கத்தரிக்காய்', ml: 'വഴുതനങ്ങ'},
  ladyfinger: {en: "Lady's Finger", ta: 'வெண்டைக்காய்', ml: 'വെണ്ടയ്ക്ക'},
  "lady's finger": {en: "Lady's Finger", ta: 'வெண்டைக்காய்', ml: 'വെണ്ടയ്ക്ക'},
  okra: {en: 'Okra', ta: 'வெண்டைக்காய்', ml: 'വെണ്ടയ്ക്ക'},
  drumstick: {en: 'Drumstick', ta: 'முருங்கைக்காய்', ml: 'മുരിങ്ങക്കായ'},
  coconut: {en: 'Coconut', ta: 'தேங்காய்', ml: 'തേങ്ങ'},
  mango: {en: 'Mango', ta: 'மாம்பழம்', ml: 'മാമ്പഴം'},
  banana: {en: 'Banana', ta: 'வாழைப்பழம்', ml: 'പഴം'},
  beetroot: {en: 'Beetroot', ta: 'பீட்ரூட்', ml: 'ബീറ്റ്റൂട്ട്'},
  garlic: {en: 'Garlic', ta: 'பூண்டு', ml: 'വെളുത്തുള്ളി'},
  ginger: {en: 'Ginger', ta: 'இஞ்சி', ml: 'ഇഞ്ചി'},
  cabbage: {en: 'Cabbage', ta: 'முட்டைக்கோஸ்', ml: 'കാബേജ്'},
  cauliflower: {en: 'Cauliflower', ta: 'காளிபிளவர்', ml: 'കോളിഫ്ലവർ'},
  chilli: {en: 'Chilli', ta: 'மிளகாய்', ml: 'പച്ചമുളക്'},
  'green chilli': {en: 'Green Chilli', ta: 'பச்சை மிளகாய்', ml: 'പച്ചമുളക്'},
  coriander: {en: 'Coriander', ta: 'கொத்தமல்லி', ml: 'മല്ലിയില'},
  'curry leaves': {en: 'Curry Leaves', ta: 'கறிவேப்பிலை', ml: 'കറിവേപ്പില'},
  mint: {en: 'Mint', ta: 'புதினா', ml: 'പുതിന'},
  lemon: {en: 'Lemon', ta: 'எலுமிச்சை', ml: 'നാരങ്ങ'},
  spinach: {en: 'Spinach', ta: 'கீரை', ml: 'ചീര'},
  apple: {en: 'Apple', ta: 'ஆப்பிள்', ml: 'ആപ്പിൾ'},
  orange: {en: 'Orange', ta: 'ஆரஞ்சு', ml: 'ഓറഞ്ച്'},
  grape: {en: 'Grape', ta: 'திராட்சை', ml: 'മുന്തിരി'},
  grapes: {en: 'Grapes', ta: 'திராட்சை', ml: 'മുന്തിരി'},
  papaya: {en: 'Papaya', ta: 'பப்பாளி', ml: 'പപ്പായ'},
  watermelon: {en: 'Watermelon', ta: 'தர்பூசணி', ml: 'തണ്ണിമത്തൻ'},
  pineapple: {en: 'Pineapple', ta: 'அன்னாசிப்பழம்', ml: 'കൈതച്ചക്ക'},
  pomegranate: {en: 'Pomegranate', ta: 'மாதுளம்பழம்', ml: 'മാതളനാരങ്ങ'},
  guava: {en: 'Guava', ta: 'கொய்யாப்பழம்', ml: 'പേരയ്ക്ക'},
  radish: {en: 'Radish', ta: 'முள்ளங்கி', ml: 'മുള്ളങ്കി'},
  beans: {en: 'Beans', ta: 'பீன்ஸ்', ml: 'ബീൻസ്'},
  peas: {en: 'Peas', ta: 'பட்டாணி', ml: 'പട്ടാണി'},
  corn: {en: 'Corn', ta: 'சோளம்', ml: 'ചോളം'},
  'sweet corn': {en: 'Sweet Corn', ta: 'இனிப்பு சோளம்', ml: 'ചോളം'},
  groundnut: {en: 'Groundnut', ta: 'வேர்க்கடலை', ml: 'നിലക്കടല'},
  peanut: {en: 'Peanut', ta: 'வேர்க்கடலை', ml: 'നിലക്കടല'},
  'sweet potato': {
    en: 'Sweet Potato',
    ta: 'சர்க்கரைவள்ளி கிழங்கு',
    ml: 'മധുരക്കിഴങ്ങ്',
  },
  tapioca: {en: 'Tapioca', ta: 'மரவள்ளி கிழங்கு', ml: 'കപ്പ'},
  pumpkin: {en: 'Pumpkin', ta: 'பூசணிக்காய்', ml: 'മത്തങ്ങ'},
  cucumber: {en: 'Cucumber', ta: 'வெள்ளரிக்காய்', ml: 'വെള്ളരിക്ക'},
  'bitter gourd': {en: 'Bitter Gourd', ta: 'பாகற்காய்', ml: 'പാവയ്ക്ക'},
  'bottle gourd': {en: 'Bottle Gourd', ta: 'சுரைக்காய்', ml: 'ചുരയ്ക്ക'},
  'snake gourd': {en: 'Snake Gourd', ta: 'புடலங்காய்', ml: 'പടവലങ്ങ'},
  'ash gourd': {en: 'Ash Gourd', ta: 'சாம்பல் பூசணி', ml: 'കുമ്പളങ്ങ'},
  'ridge gourd': {en: 'Ridge Gourd', ta: 'பீர்க்கங்காய்', ml: 'പീച്ചങ്ങ'},
  rice: {en: 'Rice', ta: 'அரிசி', ml: 'അരി'},
  wheat: {en: 'Wheat', ta: 'கோதுமை', ml: 'ഗോതമ്പ്'},
};

const TAMIL_TO_ENGLISH_MAP = {
  உருளைக்கிழங்கு: 'potato',
  'உருளைக் கிழங்கு': 'potato',
  'உருளை கிழங்கு': 'potato',
  வெங்காயம்: 'onion',
  'சின்ன வெங்காயம்': 'onion',
  'பெரிய வெங்காயம்': 'onion',
  தக்காளி: 'tomato',
  கேரட்: 'carrot',
  கத்தரிக்காய்: 'brinjal',
  கத்தரி: 'brinjal',
  வெண்டைக்காய்: 'ladyfinger',
  வெண்டை: 'ladyfinger',
  முருங்கைக்காய்: 'drumstick',
  முருங்கை: 'drumstick',
  தேங்காய்: 'coconut',
  மாம்பழம்: 'mango',
  மாங்காய்: 'mango',
  வாழைப்பழம்: 'banana',
  வாழைக்காய்: 'banana',
  பீட்ரூட்: 'beetroot',
  பூண்டு: 'garlic',
  இஞ்சி: 'ginger',
  முட்டைக்கோஸ்: 'cabbage',
  காளிபிளவர்: 'cauliflower',
  மிளகாய்: 'chilli',
  'பச்சை மிளகாய்': 'chilli',
  கொத்தமல்லி: 'coriander',
  கறிவேப்பிலை: 'curry leaves',
  புதினா: 'mint',
  எலுமிச்சை: 'lemon',
  ஆப்பிள்: 'apple',
  ஆரஞ்சு: 'orange',
  திராட்சை: 'grape',
  பப்பாளி: 'papaya',
  தர்பூசணி: 'watermelon',
  அன்னாசிப்பழம்: 'pineapple',
  மாதுளம்பழம்: 'pomegranate',
  மாதுளை: 'pomegranate',
  கொய்யாப்பழம்: 'guava',
  கொய்யா: 'guava',
  முள்ளங்கி: 'radish',
  பீன்ஸ்: 'beans',
  பட்டாணி: 'peas',
  சோளம்: 'corn',
  வேர்க்கடலை: 'groundnut',
  மரவள்ளிக்கிழங்கு: 'tapioca',
  'மரவள்ளி கிழங்கு': 'tapioca',
  பூசணிக்காய்: 'pumpkin',
  வெள்ளரிக்காய்: 'cucumber',
  பாகற்காய்: 'bitter gourd',
  சுரைக்காய்: 'bottle gourd',
  புடலங்காய்: 'snake gourd',
  பீர்க்கங்காய்: 'ridge gourd',
  அரிசி: 'rice',
  கோதுமை: 'wheat',
};

const PRODUCT_VISUAL_MAP = {
  tomato: {emoji: '🍅', colors: ['#FFEBEE', '#FFCDD2']},
  onion: {emoji: '🧅', colors: ['#F3E5F5', '#E1BEE7']},
  potato: {emoji: '🥔', colors: ['#EFEBE9', '#D7CCC8']},
  carrot: {emoji: '🥕', colors: ['#FFF3E0', '#FFE0B2']},
  brinjal: {emoji: '🍆', colors: ['#EDE7F6', '#D1C4E9']},
  eggplant: {emoji: '🍆', colors: ['#EDE7F6', '#D1C4E9']},
  ladyfinger: {emoji: '🥦', colors: ['#E8F5E9', '#C8E6C9']},
  "lady's finger": {emoji: '🥦', colors: ['#E8F5E9', '#C8E6C9']},
  okra: {emoji: '🥦', colors: ['#E8F5E9', '#C8E6C9']},
  drumstick: {emoji: '🥬', colors: ['#E8F5E9', '#A5D6A7']},
  coconut: {emoji: '🥥', colors: ['#EFEBE9', '#D7CCC8']},
  mango: {emoji: '🥭', colors: ['#FFFDE7', '#FFF59D']},
  banana: {emoji: '🍌', colors: ['#FFFDE7', '#FFF59D']},
  beetroot: {emoji: '🍠', colors: ['#FCE4EC', '#F8BBD0']},
  garlic: {emoji: '🧄', colors: ['#ECEFF1', '#CFD8DC']},
  ginger: {emoji: '🫚', colors: ['#FFF3E0', '#FFE0B2']},
  cabbage: {emoji: '🥬', colors: ['#E8F5E9', '#C8E6C9']},
  cauliflower: {emoji: '🥦', colors: ['#F5F5F5', '#E0E0E0']},
  chilli: {emoji: '🌶️', colors: ['#FFEBEE', '#FFCDD2']},
  lemon: {emoji: '🍋', colors: ['#FFFDE7', '#FFF9C4']},
  spinach: {emoji: '🥬', colors: ['#E8F5E9', '#C8E6C9']},
  apple: {emoji: '🍎', colors: ['#FFEBEE', '#FFCDD2']},
  orange: {emoji: '🍊', colors: ['#FFF3E0', '#FFE0B2']},
  grape: {emoji: '🍇', colors: ['#F3E5F5', '#E1BEE7']},
  grapes: {emoji: '🍇', colors: ['#F3E5F5', '#E1BEE7']},
  watermelon: {emoji: '🍉', colors: ['#FFEBEE', '#C8E6C9']},
  rice: {emoji: '🌾', colors: ['#FFFDE7', '#FFF59D']},
  wheat: {emoji: '🌾', colors: ['#FFFDE7', '#FFF59D']},
};

/**
 * Resolves the dynamically translated product name.
 */
export const getLocalProductName = (nameEn, nameTa, lang) => {
  const cleanEn = (nameEn || '').toLowerCase().trim();
  const cleanTa = (nameTa || '').trim();

  let key = cleanEn;
  if (!key && cleanTa) {
    key = TAMIL_TO_ENGLISH_MAP[cleanTa] || '';
  }
  if (!key && nameTa) {
    key = TAMIL_TO_ENGLISH_MAP[nameTa] || '';
  }

  if (key && PRODUCT_TRANSLATIONS[key]) {
    return (
      PRODUCT_TRANSLATIONS[key][lang] ||
      PRODUCT_TRANSLATIONS[key].en ||
      nameTa ||
      nameEn
    );
  }

  // Fallback:
  if (lang === 'ta') {
    return nameTa || nameEn;
  }
  if (lang === 'en') {
    return nameEn || nameTa;
  }
  return nameTa || nameEn;
};

/**
 * Returns dynamic emoji and gradient colors for a premium product visual.
 */
export const getProductVisualDetails = (nameEn, nameTa) => {
  const cleanEn = (nameEn || '').toLowerCase().trim();
  const cleanTa = (nameTa || '').trim();

  let key = cleanEn;
  if (!key && cleanTa) {
    key = TAMIL_TO_ENGLISH_MAP[cleanTa] || '';
  }
  if (!key && nameTa) {
    key = TAMIL_TO_ENGLISH_MAP[nameTa] || '';
  }

  if (key && PRODUCT_VISUAL_MAP[key]) {
    return PRODUCT_VISUAL_MAP[key];
  }

  // Dynamic fallback based on common letters or standard
  return {emoji: '🌾', colors: ['#E8F5E9', '#C8E6C9']};
};
