// src/screens/consumer/HomeScreen.js - Full i18n ✅
import React, {useState, useCallback, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import FastImage from 'react-native-fast-image';
import i18n from '../../locales/i18n';
import {useTranslation} from 'react-i18next';
import {useAuth} from '../../context/AuthContext';
import {useCart} from '../../context/CartContext';
import {getCatName} from '../../utils/categoryHelper';
import {
  COLORS,
  FONTS,
  SPACING,
  RADIUS,
  SHADOWS,
  getThemeColors,
} from '../../utils/theme';
import {useTheme} from '../../context/ThemeContext';
import {CATEGORIES} from '../../utils/dummyData';
import {listenToProducts, getAllFarmers} from '../../services/firebase';
import {getConsumerPrice, PLATFORM_FEE} from '../../utils/priceHelper';
import {getLocalProductName} from '../../utils/translationHelper';

const {width} = Dimensions.get('window');
const CARD_WIDTH = width * 0.44;
const scale = width / 375;
const rs = size => Math.round(size * scale);

const AvatarView = ({uri, name, size = 64, style}) => {
  const [err, setErr] = useState(false);
  const letter = (name || 'F').charAt(0).toUpperCase();
  const bg = ['#1B8A4E', '#1565C0', '#E65100', '#6A1B9A'][
    letter.charCodeAt(0) % 4
  ];
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
        <Text style={{color: '#fff', fontSize: size * 0.4, fontWeight: 'bold'}}>
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

const getProductFallbackStats = product => {
  if (!product) {
    return {discountPercent: 10, rating: 4.5};
  }
  const id = product.id || '';
  const nameEn = (product.nameEn || product.name || '').toLowerCase();
  const category = (product.category || '').toLowerCase();

  // 1. Generate a stable hash from product ID/name for rating variation
  let hash = 0;
  const seedString = id + nameEn;
  for (let i = 0; i < seedString.length; i++) {
    hash = seedString.charCodeAt(i) + ((hash << 5) - hash);
  }
  const positiveHash = Math.abs(hash);

  // 2. Select realistic ratings based on hash
  const ratings = [4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9];
  const rating = ratings[positiveHash % ratings.length];

  // 3. Determine highly realistic discount based on product name/category
  let discountPercent = 10; // default fallback

  if (category === 'dairy') {
    const dairyDiscounts = [3, 5, 8];
    discountPercent = dairyDiscounts[positiveHash % dairyDiscounts.length];
  } else if (category === 'greens') {
    const greensDiscounts = [5, 8, 10];
    discountPercent = greensDiscounts[positiveHash % greensDiscounts.length];
  } else if (category === 'fruits') {
    const fruitsDiscounts = [10, 12, 15, 18, 20];
    discountPercent = fruitsDiscounts[positiveHash % fruitsDiscounts.length];
  } else if (category === 'nuts' || category === 'handicrafts') {
    const premiumDiscounts = [12, 15, 18, 20, 25];
    discountPercent = premiumDiscounts[positiveHash % premiumDiscounts.length];
  } else {
    if (
      nameEn.includes('onion') ||
      nameEn.includes('வெங்காயம்') ||
      nameEn.includes('ഉള്ളി')
    ) {
      discountPercent = 10;
    } else if (
      nameEn.includes('tomato') ||
      nameEn.includes('தக்காளி') ||
      nameEn.includes('തക്കാളി')
    ) {
      discountPercent = 12;
    } else if (
      nameEn.includes('potato') ||
      nameEn.includes('உருளை') ||
      nameEn.includes('ഉരുളക്കിഴങ്ങ്')
    ) {
      discountPercent = 15;
    } else if (
      nameEn.includes('carrot') ||
      nameEn.includes('கேரட்') ||
      nameEn.includes('കാരറ്റ്')
    ) {
      discountPercent = 8;
    } else if (
      nameEn.includes('garlic') ||
      nameEn.includes('பூண்டு') ||
      nameEn.includes('വെളുത്തുള്ളി')
    ) {
      discountPercent = 5;
    } else if (
      nameEn.includes('brinjal') ||
      nameEn.includes('கத்தரிக்காய்') ||
      nameEn.includes('വഴുതനങ്ങ')
    ) {
      discountPercent = 14;
    } else if (
      nameEn.includes('drumstick') ||
      nameEn.includes('முருங்கை') ||
      nameEn.includes('മുരിങ്ങക്കായ')
    ) {
      discountPercent = 18;
    } else {
      const vegDiscounts = [8, 10, 12, 15, 16, 18];
      discountPercent = vegDiscounts[positiveHash % vegDiscounts.length];
    }
  }

  return {discountPercent, rating};
};

const ProductCard = ({item, onAddToCart, onPress}) => {
  const cp = getConsumerPrice(item.price);
  const {t, i18n} = useTranslation();
  const {isDark} = useTheme();
  const themeColors = getThemeColors(isDark);
  const localName = getLocalProductName(item.name, item.nameTa, i18n.language);
  const localFarmerName =
    i18n.language === 'ta'
      ? item.farmerNameTa || item.farmerName
      : item.farmerName || item.farmerNameTa;

  const stats = getProductFallbackStats(item);
  const dbOriginalPrice = item.originalPrice || item.price;
  const dbHasDiscount = dbOriginalPrice > item.price;

  const discountPercent = dbHasDiscount
    ? Math.round(((dbOriginalPrice - item.price) / dbOriginalPrice) * 100)
    : stats.discountPercent;

  const hasDiscount = discountPercent > 0;

  const originalPrice = dbHasDiscount
    ? dbOriginalPrice
    : Math.round(item.price / (1 - discountPercent / 100));

  const rating =
    item.rating && parseFloat(item.rating) > 0
      ? parseFloat(item.rating).toFixed(1)
      : stats.rating.toFixed(1);

  const unit = item.unit || 'kg';
  const isSoldOut =
    item.stock !== undefined && item.stock !== null && item.stock <= 0;
  const isGram =
    unit.toLowerCase().includes('g') && !unit.toLowerCase().includes('k');

  return (
    <TouchableOpacity
      style={[
        styles.productCard,
        {backgroundColor: themeColors.cardBg, borderColor: themeColors.border},
        isSoldOut && {opacity: 0.75},
      ]}
      onPress={() => !isSoldOut && onPress(item)}
      activeOpacity={isSoldOut ? 1 : 0.9}
      disabled={isSoldOut}>
      <View style={styles.productImgWrap}>
        <FastImage
          source={{uri: item.image, priority: FastImage.priority.normal}}
          style={styles.productImg}
          resizeMode={FastImage.resizeMode.cover}
        />

        {/* Organic Badge */}
        {item.isOrganic && (
          <View style={styles.organicBadge}>
            <Text style={styles.organicText}>🌿</Text>
          </View>
        )}

        {/* Discount Badge */}
        {hasDiscount && !isSoldOut && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>{discountPercent}% OFF</Text>
          </View>
        )}

        {/* Floating Rating Badge */}
        {!isSoldOut && (
          <View
            style={[
              styles.ratingBadge,
              {
                backgroundColor: isDark
                  ? 'rgba(40,40,40,0.85)'
                  : 'rgba(255,255,255,0.85)',
              },
            ]}>
            <Text style={[styles.ratingText, {color: themeColors.text}]}>
              {rating} ★
            </Text>
          </View>
        )}

        {/* Sold Out Overlay */}
        {isSoldOut && (
          <View style={styles.soldOutOverlay}>
            <View style={styles.soldOutBadge}>
              <Text style={styles.soldOutText}>
                {t('product.soldOut', {defaultValue: 'SOLD OUT'})}
              </Text>
            </View>
          </View>
        )}

        {/* Floating Add to Cart Button */}
        {!isSoldOut && (
          <TouchableOpacity
            style={styles.floatingAddBtn}
            onPress={() => onAddToCart(item)}>
            <LinearGradient
              colors={COLORS.gradientButton}
              style={styles.floatingAddBtnGrad}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 0}}>
              <Text style={styles.floatingAddBtnText}>+</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.productInfo}>
        {/* Product Name */}
        <Text
          style={[styles.productName, {color: themeColors.text}]}
          numberOfLines={1}>
          {localName}
        </Text>

        {/* Quantity/Unit badge */}
        <View
          style={[
            styles.unitBadge,
            {backgroundColor: isDark ? '#1C3A27' : '#E8F5E9'},
          ]}>
          <Text
            style={[
              styles.unitText,
              {color: isDark ? '#81C784' : COLORS.primaryGreen},
            ]}>
            {unit}
          </Text>
        </View>

        {/* Farmer Name */}
        <Text
          style={[styles.farmerName, {color: themeColors.subText}]}
          numberOfLines={1}>
          👨‍🌾 {localFarmerName || ''}
        </Text>

        {/* Price Row */}
        <View style={styles.priceRow}>
          <View>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 4}}>
              <Text style={styles.price}>₹{cp}</Text>
              {hasDiscount && (
                <Text style={styles.originalPrice}>
                  ₹{originalPrice + PLATFORM_FEE}
                </Text>
              )}
            </View>
            {isGram && (
              <Text style={[styles.pricePerUnit, {color: themeColors.subText}]}>
                ₹{cp}/{unit}
              </Text>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const FarmerCard = ({item, onPress}) => {
  const {i18n} = useTranslation();
  const {isDark} = useTheme();
  const themeColors = getThemeColors(isDark);
  const localFarmerName =
    i18n.language === 'ta'
      ? item.nameTa || item.name
      : item.name || item.nameTa;
  return (
    <TouchableOpacity
      style={[
        styles.farmerCard,
        {backgroundColor: themeColors.cardBg, borderColor: themeColors.border},
      ]}
      onPress={() => onPress(item)}
      activeOpacity={0.9}>
      <AvatarView
        uri={item.avatar}
        name={item.name || item.nameTa}
        size={rs(64)}
        style={{marginBottom: SPACING.sm}}
      />
      {item.isVerified && (
        <View style={styles.verifiedBadge}>
          <Text style={{fontSize: rs(10)}}>✅</Text>
        </View>
      )}
      <Text
        style={[styles.farmerCardName, {color: themeColors.text}]}
        numberOfLines={1}>
        {localFarmerName}
      </Text>
      <Text
        style={[styles.farmerCardLoc, {color: themeColors.subText}]}
        numberOfLines={1}>
        📍 {(item.location || '').split(',')[0]}
      </Text>
      <View style={styles.farmerRatingRow}>
        <Text style={styles.farmerStar}>⭐</Text>
        <Text style={[styles.farmerRatingNum, {color: themeColors.subText}]}>
          {item.rating || '0'}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const HomeScreen = ({navigation}) => {
  const {t, i18n} = useTranslation();
  const {isDark} = useTheme();
  const themeColors = getThemeColors(isDark);
  const {user} = useAuth();
  const {addToCart, totalItems} = useCart();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [realProducts, setRealProducts] = useState([]);
  const [realFarmers, setRealFarmers] = useState([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);

  useEffect(() => {
    setIsLoadingProducts(true);
    const unsub = listenToProducts(result => {
      setRealProducts(Array.isArray(result?.data) ? result.data : []);
      setIsLoadingProducts(false);
    });
    return () => {
      if (typeof unsub === 'function') {
        unsub();
      }
    };
  }, []);

  useEffect(() => {
    getAllFarmers()
      .then(r => setRealFarmers(Array.isArray(r?.data) ? r.data : []))
      .catch(() => setRealFarmers([]));
  }, []);

  const filteredProducts = realProducts.filter(p => {
    const matchCat =
      selectedCategory === 'all' || p.category === selectedCategory;
    const localName =
      getLocalProductName(p.name, p.nameTa, i18n.language) || '';
    const matchSearch =
      localName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.nameTa || '').includes(searchQuery);
    return matchCat && matchSearch;
  });

  const featuredProducts = realProducts.filter(p => p.isFeatured);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    getAllFarmers()
      .then(r => setRealFarmers(Array.isArray(r?.data) ? r.data : []))
      .finally(() => setRefreshing(false));
  }, []);

  const handleProductPress = useCallback(
    p => navigation.navigate('ProductDetail', {product: p}),
    [navigation],
  );
  const handleFarmerPress = useCallback(
    f => navigation.navigate('FarmerProfile', {farmer: f}),
    [navigation],
  );
  const handleAddToCart = useCallback(
    item => {
      const consumerPrice = getConsumerPrice(item.price);
      addToCart({...item, consumerPrice});
    },
    [addToCart],
  );

  const uniqueFeatures = [
    {
      emoji: '🌾',
      label: t('home.harvestCalendar', {defaultValue: 'அறுவடை நாள்காட்டி'}),
      screen: 'HarvestCalendar',
    },
    {
      emoji: '⏱',
      label: t('home.freshnessTracker', {
        defaultValue: 'புத்துணர்ச்சி கண்காணிப்பு',
      }),
      screen: 'FreshnessTracker',
    },
    {
      emoji: '👨‍👩‍👧',
      label: t('home.groupBuy', {defaultValue: 'கூட்டு வாங்கல்'}),
      screen: 'VillageGroupBuy',
    },
    {
      emoji: '📅',
      label: t('home.preOrder', {defaultValue: 'முன் ஆர்டர்'}),
      screen: 'PreOrder',
    },
    {
      emoji: '🥗',
      label: t('home.nutritionReport', {defaultValue: 'ஊட்டச்சத்து அறிக்கை'}),
      screen: 'NutritionReport',
    },
    {
      emoji: '🗺️',
      label: t('home.farmVisit', {defaultValue: 'பண்ணை வருகை'}),
      screen: 'FarmVisit',
    },
  ];

  return (
    <View style={[styles.container, {backgroundColor: themeColors.bg}]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primaryGreen}
            colors={[COLORS.primaryGreen]}
          />
        }>
        <LinearGradient
          colors={['#0D5C32', '#1B8A4E', '#1565C0']}
          style={styles.header}>
          <View style={styles.headerTop}>
            <View style={{flex: 1}}>
              <Text style={styles.greeting}>
                {t('home.greeting', {defaultValue: 'வணக்கம்! 👋'})}
              </Text>
              <Text style={styles.userName} numberOfLines={1}>
                {user?.name || t('common.guest', {defaultValue: 'நண்பர்'})}
              </Text>
            </View>
            <View style={styles.headerIcons}>
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={() => navigation.navigate('Notifications')}>
                <Text style={styles.iconEmoji}>🔔</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={() => navigation.navigate('ChatList')}>
                <Text style={styles.iconEmoji}>💬</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cartBtn}
                onPress={() => navigation.navigate('Cart')}>
                <Text style={styles.cartEmoji}>🛒</Text>
                {totalItems > 0 && (
                  <View style={styles.cartBadge}>
                    <Text style={styles.cartBadgeText}>{totalItems}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
          <View
            style={[
              styles.searchBar,
              {
                backgroundColor: themeColors.cardBg,
                borderColor: themeColors.border,
              },
            ]}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={[styles.searchInput, {color: themeColors.text}]}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={t('home.searchPlaceholder', {
                defaultValue: 'காய்கறிகள், பழங்கள் ...',
              })}
              placeholderTextColor={
                isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'
              }
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Text style={{color: COLORS.textGray, fontSize: rs(16)}}>
                  ✕
                </Text>
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity
            style={styles.qrBtn}
            onPress={() => navigation.navigate('QRScan')}>
            <Text style={styles.qrBtnText}>
              📷 {t('home.qrScan', {defaultValue: 'விவசாயி QR ஸ்கேன் செய்க'})}
            </Text>
          </TouchableOpacity>
          <View style={styles.uniqueRow}>
            {uniqueFeatures.slice(0, 3).map(item => (
              <TouchableOpacity
                key={item.screen}
                style={styles.uniqueCard}
                onPress={() => navigation.navigate(item.screen)}>
                <Text style={styles.uniqueEmoji}>{item.emoji}</Text>
                <Text style={styles.uniqueLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={[styles.uniqueRow, {marginTop: SPACING.sm}]}>
            {uniqueFeatures.slice(3).map(item => (
              <TouchableOpacity
                key={item.screen}
                style={styles.uniqueCard}
                onPress={() => navigation.navigate(item.screen)}>
                <Text style={styles.uniqueEmoji}>{item.emoji}</Text>
                <Text style={styles.uniqueLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </LinearGradient>

        {/* Categories */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, {color: themeColors.text}]}>
            {t('home.categories', {defaultValue: 'வகைகள்'})}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.catChip,
                  {
                    backgroundColor: themeColors.cardBg,
                    borderColor: themeColors.border,
                  },
                  selectedCategory === cat.id && styles.catChipActive,
                ]}
                onPress={() => setSelectedCategory(cat.id)}>
                <Text style={styles.catEmoji}>{cat.icon}</Text>
                <Text
                  style={[
                    styles.catText,
                    {color: themeColors.subText},
                    selectedCategory === cat.id && styles.catTextActive,
                  ]}>
                  {getCatName(cat, i18n.language)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Featured */}
        {searchQuery === '' &&
          selectedCategory === 'all' &&
          featuredProducts.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, {color: themeColors.text}]}>
                  ⭐{' '}
                  {t('home.featuredProducts', {
                    defaultValue: 'சிறப்பு தயாரிப்புகள்',
                  })}
                </Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate('AllProducts')}>
                  <Text style={styles.seeAll}>
                    {t('home.viewAll', {defaultValue: 'அனைத்தும் →'})}
                  </Text>
                </TouchableOpacity>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {featuredProducts.map(item => (
                  <ProductCard
                    key={item.id}
                    item={item}
                    onAddToCart={handleAddToCart}
                    onPress={handleProductPress}
                  />
                ))}
              </ScrollView>
            </View>
          )}

        {/* Farmers */}
        {searchQuery === '' && realFarmers.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, {color: themeColors.text}]}>
                👨‍🌾 {t('home.topFarmers', {defaultValue: 'சிறந்த விவசாயிகள்'})}
              </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('AllFarmers')}>
                <Text style={styles.seeAll}>
                  {t('home.viewAll', {defaultValue: 'அனைத்தும் →'})}
                </Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {realFarmers.map(f => (
                <FarmerCard key={f.id} item={f} onPress={handleFarmerPress} />
              ))}
            </ScrollView>
          </View>
        )}

        {/* All Products — Grouped by Farmer */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, {color: themeColors.text}]}>
              {searchQuery
                ? `"${searchQuery}"`
                : `🌿 ${t('home.allProducts', {
                    defaultValue: 'All Products',
                  })}`}
            </Text>
            <Text
              style={{fontSize: rs(FONTS.sm), color: themeColors.textMuted}}>
              {filteredProducts.length} items
            </Text>
          </View>
          {isLoadingProducts ? (
            <ActivityIndicator
              color={COLORS.primaryGreen}
              size="large"
              style={{marginVertical: 20}}
            />
          ) : filteredProducts.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyEmoji}>🌱</Text>
              <Text style={[styles.emptyText, {color: themeColors.textMuted}]}>
                {t('home.noProducts', {
                  defaultValue: 'No products yet',
                })}
              </Text>
            </View>
          ) : (
            (() => {
              // Group products by farmerId
              const farmerGroups = {};
              filteredProducts.forEach(p => {
                const fid = p.farmerId || 'unknown';
                if (!farmerGroups[fid]) {
                  farmerGroups[fid] = {
                    farmerId: fid,
                    farmerName: p.farmerName || 'Farmer',
                    farmerNameTa: p.farmerNameTa || p.farmerName || 'Farmer',
                    products: [],
                  };
                }
                farmerGroups[fid].products.push(p);
              });
              const groups = Object.values(farmerGroups);

              return groups.map(group => {
                const displayName =
                  i18n.language === 'ta'
                    ? group.farmerNameTa
                    : group.farmerName;
                return (
                  <View key={group.farmerId} style={{marginBottom: SPACING.lg}}>
                    <Text
                      style={[
                        styles.farmerGroupTitle,
                        {color: themeColors.text},
                      ]}>
                      👨‍🌾 {displayName}{' '}
                      {t('home.farmProducts', {
                        defaultValue: 'Farm Products',
                      })}
                    </Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={{paddingRight: SPACING.lg}}>
                      {group.products.map(item => (
                        <ProductCard
                          key={item.id}
                          item={item}
                          onAddToCart={handleAddToCart}
                          onPress={handleProductPress}
                        />
                      ))}
                    </ScrollView>
                  </View>
                );
              });
            })()
          )}
        </View>
        <View style={{height: 90}} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: COLORS.background},
  header: {
    paddingTop: rs(50),
    paddingBottom: rs(24),
    paddingHorizontal: SPACING.xl,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  greeting: {fontSize: rs(FONTS.sm), color: 'rgba(255,255,255,0.75)'},
  userName: {fontSize: rs(FONTS.xl), fontWeight: 'bold', color: COLORS.white},
  headerIcons: {flexDirection: 'row', alignItems: 'center', gap: SPACING.sm},
  iconBtn: {padding: SPACING.sm},
  iconEmoji: {fontSize: rs(26)},
  cartBtn: {position: 'relative', padding: SPACING.sm},
  cartEmoji: {fontSize: rs(28)},
  cartBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: COLORS.accentRed,
    borderRadius: rs(10),
    minWidth: rs(18),
    height: rs(18),
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadgeText: {color: COLORS.white, fontSize: rs(10), fontWeight: 'bold'},
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xs,
    marginBottom: SPACING.md,
  },
  searchIcon: {fontSize: rs(18), marginRight: SPACING.sm},
  searchInput: {
    flex: 1,
    height: rs(44),
    fontSize: rs(FONTS.md),
    color: COLORS.textPrimary,
    paddingVertical: 0,
  },
  qrBtn: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: RADIUS.lg,
    paddingVertical: rs(12),
    alignItems: 'center',
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  qrBtnText: {color: COLORS.white, fontSize: rs(FONTS.sm), fontWeight: '600'},
  uniqueRow: {flexDirection: 'row', gap: SPACING.sm},
  uniqueCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: rs(72),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  uniqueEmoji: {fontSize: rs(24), marginBottom: SPACING.xs},
  uniqueLabel: {
    color: COLORS.white,
    fontSize: rs(11),
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: rs(16),
    flexShrink: 1,
  },
  section: {paddingHorizontal: SPACING.lg, marginTop: SPACING.xl},
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: rs(FONTS.lg),
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  seeAll: {
    fontSize: rs(FONTS.sm),
    color: COLORS.primaryBlue,
    fontWeight: '600',
  },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    marginRight: SPACING.sm,
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  catChipActive: {
    backgroundColor: COLORS.primaryGreen,
    borderColor: COLORS.primaryGreen,
  },
  catEmoji: {fontSize: rs(14), marginRight: 4},
  catText: {
    fontSize: rs(FONTS.sm),
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  catTextActive: {color: COLORS.white, fontWeight: 'bold'},
  productsGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md},
  farmerGroupTitle: {
    fontSize: rs(FONTS.md),
    fontWeight: 'bold',
    marginBottom: SPACING.sm,
    marginTop: SPACING.xs,
  },
  productCard: {
    width: CARD_WIDTH,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    ...SHADOWS.card,
    marginRight: SPACING.sm,
  },
  productImgWrap: {position: 'relative'},
  productImg: {width: '100%', height: rs(140)},
  organicBadge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    backgroundColor: 'rgba(27,138,78,0.9)',
    borderRadius: RADIUS.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  organicText: {color: COLORS.white, fontSize: rs(9), fontWeight: 'bold'},
  discountBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: COLORS.accentRed,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  discountText: {color: COLORS.white, fontSize: rs(9), fontWeight: 'bold'},
  productInfo: {padding: SPACING.md},
  productName: {
    fontSize: rs(FONTS.md),
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  farmerName: {
    fontSize: rs(FONTS.xs),
    color: COLORS.textMuted,
    marginBottom: SPACING.sm,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    fontSize: rs(FONTS.lg),
    fontWeight: '800',
    color: COLORS.primaryGreen,
  },
  originalPrice: {
    fontSize: rs(FONTS.xs),
    color: COLORS.textGray,
    textDecorationLine: 'line-through',
  },
  addBtn: {borderRadius: RADIUS.round, overflow: 'hidden'},
  addBtnGrad: {
    width: rs(32),
    height: rs(32),
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: {color: COLORS.white, fontSize: rs(20), fontWeight: 'bold'},
  farmerCard: {
    width: rs(110),
    alignItems: 'center',
    marginRight: SPACING.md,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    ...SHADOWS.small,
  },
  verifiedBadge: {position: 'absolute', top: rs(12), right: rs(12)},
  farmerCardName: {
    fontSize: rs(FONTS.xs),
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  farmerCardLoc: {
    fontSize: rs(9),
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 2,
  },
  farmerRatingRow: {flexDirection: 'row', alignItems: 'center', marginTop: 4},
  farmerStar: {fontSize: rs(10)},
  farmerRatingNum: {
    fontSize: rs(FONTS.xs),
    color: COLORS.textSecondary,
    marginLeft: 2,
    fontWeight: '600',
  },
  emptyBox: {alignItems: 'center', paddingVertical: rs(40)},
  emptyEmoji: {fontSize: rs(48), marginBottom: SPACING.md},
  emptyText: {
    fontSize: rs(FONTS.lg),
    color: COLORS.textMuted,
    fontWeight: 'bold',
  },
  emptySubText: {
    fontSize: rs(FONTS.sm),
    color: COLORS.textGray,
    marginTop: 6,
    textAlign: 'center',
    lineHeight: rs(20),
  },
  ratingBadge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  ratingText: {fontSize: rs(9), fontWeight: 'bold'},
  soldOutOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  soldOutBadge: {
    backgroundColor: 'rgba(211, 47, 47, 0.95)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    transform: [{rotate: '-12deg'}],
  },
  soldOutText: {color: COLORS.white, fontSize: rs(10), fontWeight: 'bold'},
  floatingAddBtn: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    borderRadius: RADIUS.round,
    overflow: 'hidden',
    shadowColor: COLORS.primaryGreen,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  floatingAddBtnGrad: {
    width: rs(28),
    height: rs(28),
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingAddBtnText: {
    color: COLORS.white,
    fontSize: rs(18),
    fontWeight: 'bold',
  },
  unitBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
    marginBottom: 4,
  },
  unitText: {fontSize: rs(12), fontWeight: 'bold'},
  pricePerUnit: {fontSize: rs(9), marginTop: 2},
});

export default HomeScreen;
