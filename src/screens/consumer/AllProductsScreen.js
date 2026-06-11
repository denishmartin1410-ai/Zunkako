import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import FastImage from 'react-native-fast-image';
import {useTranslation} from 'react-i18next';
import {
  COLORS,
  FONTS,
  SPACING,
  RADIUS,
  SHADOWS,
  getThemeColors,
} from '../../utils/theme';
import {CATEGORIES} from '../../utils/dummyData';
import {useCart} from '../../context/CartContext';
import {useTheme} from '../../context/ThemeContext';
import {getAllProducts, getAllFarmers} from '../../services/firebase';
import BackButton from '../../utils/BackButton';
import {getLocalProductName} from '../../utils/translationHelper';
import {getCatName} from '../../utils/categoryHelper';

const {width} = Dimensions.get('window');
const scale = width / 375;
const rs = size => Math.round(size * scale);

const AvatarView = ({uri, name, size = 50, style}) => {
  const [err, setErr] = useState(false);
  const letter = (name || 'F').charAt(0).toUpperCase();
  const bgColors = ['#1B8A4E', '#1565C0', '#E65100', '#6A1B9A'];
  const bg = bgColors[letter.charCodeAt(0) % bgColors.length];
  if (!uri || err) {
    return (
      <View
        style={[
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: bg,
            alignItems: 'center',
            justifyContent: 'center',
          },
          style,
        ]}>
        <Text
          style={{
            color: COLORS.white,
            fontSize: size * 0.4,
            fontWeight: 'bold',
          }}>
          {letter}
        </Text>
      </View>
    );
  }
  return (
    <FastImage
      source={{uri, priority: FastImage.priority.normal}}
      style={[{width: size, height: size, borderRadius: size / 2}, style]}
      resizeMode={FastImage.resizeMode.cover}
      onError={() => setErr(true)}
    />
  );
};

const AllProductsScreen = ({navigation}) => {
  const {t, i18n} = useTranslation();
  const {isDark} = useTheme();
  const themeColors = getThemeColors(isDark);
  const {addToCart} = useCart();

  const [products, setProducts] = useState([]);
  const [farmers, setFarmers] = useState([]);
  const [selectedCat, setSelectedCat] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [prodRes, farmRes] = await Promise.all([
          getAllProducts(),
          getAllFarmers(),
        ]);
        setProducts(Array.isArray(prodRes?.data) ? prodRes.data : []);
        setFarmers(Array.isArray(farmRes?.data) ? farmRes.data : []);
      } catch (e) {
        console.log('Error loading products/farmers:', e);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // Filter products by selected category
  const filteredProducts =
    selectedCat === 'all'
      ? products
      : products.filter(p => p.category === selectedCat);

  // Group filtered products by farmerId
  const groupedData = [];
  const farmerMap = new Map(farmers.map(f => [f.id, f]));

  // Find unique farmers who have products in the filtered list
  const uniqueFarmerIds = [...new Set(filteredProducts.map(p => p.farmerId))];

  uniqueFarmerIds.forEach(fid => {
    const farmerInfo = farmerMap.get(fid) || {
      id: fid,
      name:
        filteredProducts.find(p => p.farmerId === fid)?.farmerName || 'Farmer',
      nameTa:
        filteredProducts.find(p => p.farmerId === fid)?.farmerNameTa ||
        'Farmer',
      avatar:
        filteredProducts.find(p => p.farmerId === fid)?.farmerAvatar || '',
      location:
        filteredProducts.find(p => p.farmerId === fid)?.farmerLocation || '',
      rating: 4.5,
      isVerified: true,
    };
    const farmerProds = filteredProducts.filter(p => p.farmerId === fid);
    groupedData.push({
      farmer: farmerInfo,
      products: farmerProds,
    });
  });

  const handleFarmerPress = farmer => {
    navigation.navigate('FarmerProfile', {farmer});
  };

  const handleProductPress = product => {
    navigation.navigate('ProductDetail', {product});
  };

  return (
    <View style={[styles.container, {backgroundColor: themeColors.bg}]}>
      {/* Header */}
      <LinearGradient colors={['#0D5C32', '#1B8A4E']} style={styles.headerRow}>
        <BackButton onPress={() => navigation.goBack()} />
        <Text style={styles.headerTitle}>
          🌿 {t('home.allProducts', {defaultValue: 'அனைத்து தயாரிப்புகள்'})}
        </Text>
        <View style={{width: 40}} />
      </LinearGradient>

      {/* Category Scroll */}
      <View
        style={[
          styles.catWrapper,
          {
            backgroundColor: themeColors.bg,
            borderBottomColor: themeColors.borderLight,
          },
        ]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.catScroll}>
          {CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.catChip,
                {
                  backgroundColor: themeColors.cardBg,
                  borderColor: themeColors.border,
                },
                selectedCat === cat.id && styles.catChipActive,
              ]}
              onPress={() => setSelectedCat(cat.id)}>
              <Text style={{fontSize: rs(14)}}>{cat.icon}</Text>
              <Text
                style={[
                  styles.catText,
                  {color: themeColors.subText},
                  selectedCat === cat.id && styles.catTextActive,
                ]}>
                {getCatName(cat, i18n.language)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Main Content */}
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={COLORS.primaryGreen} size="large" />
        </View>
      ) : groupedData.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyEmoji}>🌱</Text>
          <Text style={[styles.emptyText, {color: themeColors.textMuted}]}>
            {t('home.noProducts', {defaultValue: 'இன்னும் தயாரிப்புகள் இல்லை'})}
          </Text>
        </View>
      ) : (
        <FlatList
          data={groupedData}
          keyExtractor={item => item.farmer.id}
          contentContainerStyle={styles.verticalList}
          renderItem={({item}) => {
            const {farmer, products: farmerProds} = item;
            const localFarmerName =
              i18n.language === 'ta'
                ? farmer.nameTa || farmer.name
                : farmer.name || farmer.nameTa;

            return (
              <View
                style={[
                  styles.farmerSection,
                  {borderBottomColor: themeColors.borderLight},
                ]}>
                {/* Farmer Profile Header Row */}
                <TouchableOpacity
                  style={[
                    styles.farmerHeader,
                    {
                      backgroundColor: themeColors.cardBg,
                      borderColor: themeColors.border,
                    },
                  ]}
                  onPress={() => handleFarmerPress(farmer)}
                  activeOpacity={0.8}>
                  <AvatarView
                    uri={farmer.avatar || farmer.photoURL}
                    name={farmer.name || farmer.nameTa}
                    size={rs(44)}
                    style={styles.farmerAvatar}
                  />
                  <View style={styles.farmerMeta}>
                    <View style={styles.farmerNameRow}>
                      <Text
                        style={[styles.farmerName, {color: themeColors.text}]}>
                        {localFarmerName}
                      </Text>
                      {farmer.isVerified && (
                        <Text style={styles.verifiedBadge}>✅</Text>
                      )}
                    </View>
                    <Text
                      style={[styles.farmerLoc, {color: themeColors.subText}]}
                      numberOfLines={1}>
                      📍 {farmer.locationTa || farmer.location || ''}
                    </Text>
                  </View>
                  <View style={styles.ratingRow}>
                    <Text style={styles.starIcon}>⭐</Text>
                    <Text style={[styles.ratingVal, {color: themeColors.text}]}>
                      {farmer.rating || '4.5'}
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* Horizontal Product list under this farmer */}
                <FlatList
                  data={farmerProds}
                  keyExtractor={p => p.id}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.horizontalList}
                  renderItem={({item: p}) => {
                    const localProdName = getLocalProductName(
                      p.name,
                      p.nameTa,
                      i18n.language,
                    );
                    const originalPrice = p.originalPrice || p.price;
                    const discount =
                      originalPrice > p.price
                        ? Math.round(
                            ((originalPrice - p.price) / originalPrice) * 100,
                          )
                        : 0;

                    return (
                      <TouchableOpacity
                        style={[
                          styles.productCard,
                          {
                            backgroundColor: themeColors.cardBg,
                            borderColor: themeColors.border,
                          },
                        ]}
                        onPress={() => handleProductPress(p)}
                        activeOpacity={0.9}>
                        <View style={styles.imageWrapper}>
                          <FastImage
                            source={{
                              uri: p.image,
                              priority: FastImage.priority.normal,
                            }}
                            style={styles.productImg}
                            resizeMode={FastImage.resizeMode.cover}
                          />
                          {p.isOrganic && (
                            <View style={styles.organicBadge}>
                              <Text style={styles.organicTxt}>🌿</Text>
                            </View>
                          )}
                          {discount > 0 && (
                            <View style={styles.discountBadge}>
                              <Text style={styles.discountTxt}>
                                {discount}% OFF
                              </Text>
                            </View>
                          )}
                        </View>
                        <View style={styles.productInfo}>
                          <Text
                            style={[
                              styles.productName,
                              {color: themeColors.text},
                            ]}
                            numberOfLines={1}>
                            {localProdName}
                          </Text>
                          <Text
                            style={[
                              styles.productPrice,
                              {color: COLORS.primaryGreen},
                            ]}>
                            ₹{p.price}/{p.unit}
                          </Text>
                          <TouchableOpacity
                            style={styles.addBtn}
                            onPress={() => addToCart(p)}>
                            <Text style={styles.addBtnTxt}>
                              + {t('cart.addToCart', {defaultValue: 'கார்ட்'})}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </TouchableOpacity>
                    );
                  }}
                />
              </View>
            );
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1},
  headerRow: {
    paddingTop: rs(50),
    paddingBottom: rs(16),
    paddingHorizontal: SPACING.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: rs(FONTS.xl),
    fontWeight: 'bold',
    color: COLORS.white,
    textAlign: 'center',
    flex: 1,
  },
  catWrapper: {
    borderBottomWidth: 1,
  },
  catScroll: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    marginRight: SPACING.sm,
    borderWidth: 1,
  },
  catChipActive: {
    backgroundColor: COLORS.primaryGreen,
    borderColor: COLORS.primaryGreen,
  },
  catText: {
    fontSize: rs(12),
    marginLeft: 4,
    fontWeight: '500',
  },
  catTextActive: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: rs(80),
  },
  emptyEmoji: {
    fontSize: rs(56),
    marginBottom: SPACING.md,
  },
  emptyText: {
    fontSize: rs(FONTS.lg),
    fontWeight: 'bold',
  },
  verticalList: {
    paddingBottom: rs(100),
  },
  farmerSection: {
    marginBottom: SPACING.md,
    borderBottomWidth: 1,
    paddingBottom: SPACING.sm,
  },
  farmerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
    padding: SPACING.sm,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    ...SHADOWS.small,
  },
  farmerAvatar: {
    marginRight: SPACING.sm,
  },
  farmerMeta: {
    flex: 1,
  },
  farmerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  farmerName: {
    fontSize: rs(FONTS.md),
    fontWeight: 'bold',
  },
  verifiedBadge: {
    fontSize: rs(12),
    marginLeft: 4,
  },
  farmerLoc: {
    fontSize: rs(FONTS.xs),
    marginTop: 2,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(244, 166, 29, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.md,
  },
  starIcon: {
    fontSize: rs(12),
    marginRight: 2,
  },
  ratingVal: {
    fontSize: rs(FONTS.xs),
    fontWeight: 'bold',
  },
  horizontalList: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  productCard: {
    width: rs(140),
    marginRight: SPACING.md,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    borderWidth: 1,
    ...SHADOWS.card,
    marginBottom: SPACING.xs,
  },
  imageWrapper: {
    position: 'relative',
    height: rs(96),
    backgroundColor: '#eee',
  },
  productImg: {
    width: '100%',
    height: '100%',
  },
  organicBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: 'rgba(27,138,78,0.9)',
    borderRadius: RADIUS.full,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  organicTxt: {
    color: COLORS.white,
    fontSize: rs(8),
    fontWeight: 'bold',
  },
  discountBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: COLORS.accentRed,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  discountTxt: {
    color: COLORS.white,
    fontSize: rs(8),
    fontWeight: 'bold',
  },
  productInfo: {
    padding: SPACING.sm,
  },
  productName: {
    fontSize: rs(13),
    fontWeight: 'bold',
    marginBottom: 2,
  },
  productPrice: {
    fontSize: rs(FONTS.sm),
    fontWeight: '700',
    marginBottom: SPACING.xs,
  },
  addBtn: {
    backgroundColor: COLORS.primaryGreen,
    borderRadius: RADIUS.md,
    paddingVertical: 6,
    alignItems: 'center',
  },
  addBtnTxt: {
    color: COLORS.white,
    fontSize: rs(11),
    fontWeight: 'bold',
  },
});

export default AllProductsScreen;
