// Helper: get category name based on current language
// Use this in HomeScreen and AllProductsScreen

// In HomeScreen, replace:
// <Text>{cat.nameTa}</Text>
// with:
// <Text>{getCatName(cat, i18n.language)}</Text>

export const getCatName = (cat, lang) => {
  if (lang === 'en') {
    return cat.nameEn || cat.nameTa;
  }
  if (lang === 'ml') {
    return cat.nameMl || cat.nameTa;
  }
  return cat.nameTa; // default Tamil
};
