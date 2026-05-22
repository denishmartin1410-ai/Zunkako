// src/screens/consumer/HomeScreen.js - Full i18n ✅
import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, RefreshControl, Dimensions, ActivityIndicator } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import FastImage from 'react-native-fast-image';
import i18n from '../../locales/i18n';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { getCatName } from '../../utils/categoryHelper';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../utils/theme';
import { CATEGORIES } from '../../utils/dummyData';
import { listenToProducts, getAllFarmers } from '../../services/firebase';
import { getConsumerPrice, PLATFORM_FEE } from '../../utils/priceHelper';
import { getLocalProductName } from '../../utils/translationHelper';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.44;
const scale = width / 375;
const rs = size => Math.round(size * scale);

const AvatarView = ({ uri, name, size = 64, style }) => {
  const [err, setErr] = useState(false);
  const letter = (name || 'F').charAt(0).toUpperCase();
  const bg = ['#1B8A4E', '#1565C0', '#E65100', '#6A1B9A'][letter.charCodeAt(0) % 4];
  if (!uri || err) return <View style={[{ width: size, height: size, borderRadius: size / 2, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }, style]}><Text style={{ color: '#fff', fontSize: size * 0.4, fontWeight: 'bold' }}>{letter}</Text></View>;
  return <FastImage source={{ uri, priority: FastImage.priority.normal }} style={[{ width: size, height: size, borderRadius: size / 2 }, style]} resizeMode={FastImage.resizeMode.cover} onError={() => setErr(true)} />;
};

const ProductCard = ({ item, onAddToCart, onPress }) => {
  const cp = getConsumerPrice(item.price);
  const { i18n } = useTranslation();
  const localName = getLocalProductName(item.name, item.nameTa, i18n.language);
  const localFarmerName = i18n.language === 'ta' ? (item.farmerNameTa || item.farmerName) : (item.farmerName || item.farmerNameTa);

  return (
    <TouchableOpacity style={styles.productCard} onPress={() => onPress(item)} activeOpacity={0.9}>
      <View style={styles.productImgWrap}>
        <FastImage source={{ uri: item.image, priority: FastImage.priority.normal }} style={styles.productImg} resizeMode={FastImage.resizeMode.cover} />
        {item.isOrganic && <View style={styles.organicBadge}><Text style={styles.organicText}>🌿</Text></View>}
        {item.originalPrice > item.price && <View style={styles.discountBadge}><Text style={styles.discountText}>{Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)}% OFF</Text></View>}
      </View>
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={1}>{localName}</Text>
        <Text style={styles.farmerName} numberOfLines={1}>👨‍🌾 {localFarmerName || ''}</Text>
        <View style={styles.priceRow}>
          <View><Text style={styles.price}>₹{cp}</Text>{item.originalPrice > item.price && <Text style={styles.originalPrice}>₹{item.originalPrice + PLATFORM_FEE}</Text>}</View>
          <TouchableOpacity style={styles.addBtn} onPress={() => onAddToCart(item)}>
            <LinearGradient colors={COLORS.gradientButton} style={styles.addBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}><Text style={styles.addBtnText}>+</Text></LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const FarmerCard = ({ item, onPress }) => {
  const { i18n } = useTranslation();
  const localFarmerName = i18n.language === 'ta' ? (item.nameTa || item.name) : (item.name || item.nameTa);
  return (
    <TouchableOpacity style={styles.farmerCard} onPress={() => onPress(item)} activeOpacity={0.9}>
      <AvatarView uri={item.avatar} name={item.name || item.nameTa} size={rs(64)} style={{ marginBottom: SPACING.sm }} />
      {item.isVerified && <View style={styles.verifiedBadge}><Text style={{ fontSize: rs(10) }}>✅</Text></View>}
      <Text style={styles.farmerCardName} numberOfLines={1}>{localFarmerName}</Text>
      <Text style={styles.farmerCardLoc} numberOfLines={1}>📍 {(item.location || '').split(',')[0]}</Text>
      <View style={styles.farmerRatingRow}><Text style={styles.farmerStar}>⭐</Text><Text style={styles.farmerRatingNum}>{item.rating || '0'}</Text></View>
    </TouchableOpacity>
  );
};

const HomeScreen = ({ navigation }) => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { addToCart, totalItems } = useCart();
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
    return () => { if (typeof unsub === 'function') unsub(); };
  }, []);

  useEffect(() => {
    getAllFarmers().then(r => setRealFarmers(Array.isArray(r?.data) ? r.data : [])).catch(() => setRealFarmers([]));
  }, []);

  const filteredProducts = realProducts.filter(p => {
    const matchCat = selectedCategory === 'all' || p.category === selectedCategory;
    const localName = getLocalProductName(p.name, p.nameTa, i18n.language) || '';
    const matchSearch = localName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (p.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (p.nameTa || '').includes(searchQuery);
    return matchCat && matchSearch;
  });

  const featuredProducts = realProducts.filter(p => p.isFeatured);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    getAllFarmers().then(r => setRealFarmers(Array.isArray(r?.data) ? r.data : [])).finally(() => setRefreshing(false));
  }, []);

  const handleProductPress = useCallback(p => navigation.navigate('ProductDetail', { product: p }), [navigation]);
  const handleFarmerPress = useCallback(f => navigation.navigate('FarmerProfile', { farmer: f }), [navigation]);
  const handleAddToCart = useCallback(item => {
    const consumerPrice = getConsumerPrice(item.price);
    addToCart({ ...item, consumerPrice });
  }, [addToCart]);

  const uniqueFeatures = [
    { emoji: '🌾', label: t('home.harvestCalendar', { defaultValue: 'அறுவடை நாள்காட்டி' }), screen: 'HarvestCalendar' },
    { emoji: '⏱', label: t('home.freshnessTracker', { defaultValue: 'புத்துணர்ச்சி கண்காணிப்பு' }), screen: 'FreshnessTracker' },
    { emoji: '👨‍👩‍👧', label: t('home.groupBuy', { defaultValue: 'கூட்டு வாங்கல்' }), screen: 'VillageGroupBuy' },
    { emoji: '📅', label: t('home.preOrder', { defaultValue: 'முன் ஆர்டர்' }), screen: 'PreOrder' },
    { emoji: '🥗', label: t('home.nutritionReport', { defaultValue: 'ஊட்டச்சத்து அறிக்கை' }), screen: 'NutritionReport' },
    { emoji: '🗺️', label: t('home.farmVisit', { defaultValue: 'பண்ணை வருகை' }), screen: 'FarmVisit' },
  ];

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primaryGreen} colors={[COLORS.primaryGreen]} />}>
        <LinearGradient colors={['#0D5C32', '#1B8A4E', '#1565C0']} style={styles.header}>
          <View style={styles.headerTop}>
            <View style={{ flex: 1 }}>
              <Text style={styles.greeting}>{t('home.greeting', { defaultValue: 'வணக்கம்! 👋' })}</Text>
              <Text style={styles.userName} numberOfLines={1}>{user?.name || t('common.guest', { defaultValue: 'நண்பர்' })}</Text>
            </View>
            <View style={styles.headerIcons}>
              <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('Notifications')}><Text style={styles.iconEmoji}>🔔</Text></TouchableOpacity>
              <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('ChatList')}><Text style={styles.iconEmoji}>💬</Text></TouchableOpacity>
              <TouchableOpacity style={styles.cartBtn} onPress={() => navigation.navigate('Cart')}>
                <Text style={styles.cartEmoji}>🛒</Text>
                {totalItems > 0 && <View style={styles.cartBadge}><Text style={styles.cartBadgeText}>{totalItems}</Text></View>}
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.searchBar}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput style={styles.searchInput} value={searchQuery} onChangeText={setSearchQuery} placeholder={t('home.searchPlaceholder', { defaultValue: 'காய்கறிகள், பழங்கள் ...' })} placeholderTextColor="rgba(0,0,0,0.4)" autoCorrect={false} />
            {searchQuery.length > 0 && <TouchableOpacity onPress={() => setSearchQuery('')}><Text style={{ color: COLORS.textGray, fontSize: rs(16) }}>✕</Text></TouchableOpacity>}
          </View>
          <TouchableOpacity style={styles.qrBtn} onPress={() => navigation.navigate('QRScan')}>
            <Text style={styles.qrBtnText}>📷 {t('home.qrScan', { defaultValue: 'விவசாயி QR ஸ்கேன் செய்க' })}</Text>
          </TouchableOpacity>
          <View style={styles.uniqueRow}>
            {uniqueFeatures.slice(0, 3).map(item => (
              <TouchableOpacity key={item.screen} style={styles.uniqueCard} onPress={() => navigation.navigate(item.screen)}>
                <Text style={styles.uniqueEmoji}>{item.emoji}</Text>
                <Text style={styles.uniqueLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={[styles.uniqueRow, { marginTop: SPACING.sm }]}>
            {uniqueFeatures.slice(3).map(item => (
              <TouchableOpacity key={item.screen} style={styles.uniqueCard} onPress={() => navigation.navigate(item.screen)}>
                <Text style={styles.uniqueEmoji}>{item.emoji}</Text>
                <Text style={styles.uniqueLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </LinearGradient>

        {/* Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('home.categories', { defaultValue: 'வகைகள்' })}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {CATEGORIES.map(cat => (
              <TouchableOpacity key={cat.id} style={[styles.catChip, selectedCategory === cat.id && styles.catChipActive]} onPress={() => setSelectedCategory(cat.id)}>
                <Text style={styles.catEmoji}>{cat.icon}</Text>
                <Text style={[styles.catText, selectedCategory === cat.id && styles.catTextActive]}>{getCatName(cat, i18n.language)}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Featured */}
        {searchQuery === '' && selectedCategory === 'all' && featuredProducts.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>⭐ {t('home.featuredProducts', { defaultValue: 'சிறப்பு தயாரிப்புகள்' })}</Text>
              <TouchableOpacity onPress={() => navigation.navigate('AllProducts')}><Text style={styles.seeAll}>{t('home.viewAll', { defaultValue: 'அனைத்தும் →' })}</Text></TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {featuredProducts.map(item => <ProductCard key={item.id} item={item} onAddToCart={handleAddToCart} onPress={handleProductPress} />)}
            </ScrollView>
          </View>
        )}

        {/* Farmers */}
        {searchQuery === '' && realFarmers.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>👨‍🌾 {t('home.topFarmers', { defaultValue: 'சிறந்த விவசாயிகள்' })}</Text>
              <TouchableOpacity onPress={() => navigation.navigate('AllFarmers')}><Text style={styles.seeAll}>{t('home.viewAll', { defaultValue: 'அனைத்தும் →' })}</Text></TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {realFarmers.map(f => <FarmerCard key={f.id} item={f} onPress={handleFarmerPress} />)}
            </ScrollView>
          </View>
        )}

        {/* All Products */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {searchQuery ? `"${searchQuery}"` : `🌿 ${t('home.allProducts', { defaultValue: 'அனைத்து தயாரிப்புகள்' })}`}
            </Text>
            <Text style={{ fontSize: rs(FONTS.sm), color: COLORS.textMuted }}>{filteredProducts.length} items</Text>
          </View>
          {isLoadingProducts ? (
            <ActivityIndicator color={COLORS.primaryGreen} size="large" style={{ marginVertical: 20 }} />
          ) : filteredProducts.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyEmoji}>🌱</Text>
              <Text style={styles.emptyText}>{t('home.noProducts', { defaultValue: 'இன்னும் தயாரிப்புகள் இல்லை' })}</Text>
            </View>
          ) : (
            <View style={styles.productsGrid}>
              {filteredProducts.map(item => <ProductCard key={item.id} item={item} onAddToCart={handleAddToCart} onPress={handleProductPress} />)}
            </View>
          )}
        </View>
        <View style={{ height: 90 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingTop: rs(50), paddingBottom: rs(24), paddingHorizontal: SPACING.xl },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.lg },
  greeting: { fontSize: rs(FONTS.sm), color: 'rgba(255,255,255,0.75)' },
  userName: { fontSize: rs(FONTS.xl), fontWeight: 'bold', color: COLORS.white },
  headerIcons: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  iconBtn: { padding: SPACING.sm },
  iconEmoji: { fontSize: rs(26) },
  cartBtn: { position: 'relative', padding: SPACING.sm },
  cartEmoji: { fontSize: rs(28) },
  cartBadge: { position: 'absolute', top: 0, right: 0, backgroundColor: COLORS.accentRed, borderRadius: rs(10), minWidth: rs(18), height: rs(18), alignItems: 'center', justifyContent: 'center' },
  cartBadgeText: { color: COLORS.white, fontSize: rs(10), fontWeight: 'bold' },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: RADIUS.lg, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.xs, marginBottom: SPACING.md },
  searchIcon: { fontSize: rs(18), marginRight: SPACING.sm },
  searchInput: { flex: 1, height: rs(44), fontSize: rs(FONTS.md), color: COLORS.textPrimary, paddingVertical: 0 },
  qrBtn: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: RADIUS.lg, paddingVertical: rs(12), alignItems: 'center', marginBottom: SPACING.md, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  qrBtnText: { color: COLORS.white, fontSize: rs(FONTS.sm), fontWeight: '600' },
  uniqueRow: { flexDirection: 'row', gap: SPACING.sm },
  uniqueCard: { flex: 1, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: RADIUS.lg, paddingVertical: SPACING.md, paddingHorizontal: SPACING.sm, alignItems: 'center', justifyContent: 'center', minHeight: rs(72), borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' },
  uniqueEmoji: { fontSize: rs(24), marginBottom: SPACING.xs },
  uniqueLabel: { color: COLORS.white, fontSize: rs(11), fontWeight: '600', textAlign: 'center', lineHeight: rs(16), flexShrink: 1 },
  section: { paddingHorizontal: SPACING.lg, marginTop: SPACING.xl },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  sectionTitle: { fontSize: rs(FONTS.lg), fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: SPACING.sm },
  seeAll: { fontSize: rs(FONTS.sm), color: COLORS.primaryBlue, fontWeight: '600' },
  catChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.lg, paddingVertical: 8, borderRadius: RADIUS.full, marginRight: SPACING.sm, backgroundColor: COLORS.white, borderWidth: 1.5, borderColor: COLORS.border },
  catChipActive: { backgroundColor: COLORS.primaryGreen, borderColor: COLORS.primaryGreen },
  catEmoji: { fontSize: rs(14), marginRight: 4 },
  catText: { fontSize: rs(FONTS.sm), color: COLORS.textSecondary, fontWeight: '500' },
  catTextActive: { color: COLORS.white, fontWeight: 'bold' },
  productsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md },
  productCard: { width: CARD_WIDTH, backgroundColor: COLORS.white, borderRadius: RADIUS.xl, overflow: 'hidden', ...SHADOWS.card, marginRight: SPACING.sm },
  productImgWrap: { position: 'relative' },
  productImg: { width: '100%', height: rs(140) },
  organicBadge: { position: 'absolute', bottom: 6, left: 6, backgroundColor: 'rgba(27,138,78,0.9)', borderRadius: RADIUS.full, paddingHorizontal: 8, paddingVertical: 2 },
  organicText: { color: COLORS.white, fontSize: rs(9), fontWeight: 'bold' },
  discountBadge: { position: 'absolute', top: 6, right: 6, backgroundColor: COLORS.accentRed, borderRadius: RADIUS.sm, paddingHorizontal: 6, paddingVertical: 2 },
  discountText: { color: COLORS.white, fontSize: rs(9), fontWeight: 'bold' },
  productInfo: { padding: SPACING.md },
  productName: { fontSize: rs(FONTS.md), fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: 2 },
  farmerName: { fontSize: rs(FONTS.xs), color: COLORS.textMuted, marginBottom: SPACING.sm },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  price: { fontSize: rs(FONTS.lg), fontWeight: '800', color: COLORS.primaryGreen },
  originalPrice: { fontSize: rs(FONTS.xs), color: COLORS.textGray, textDecorationLine: 'line-through' },
  addBtn: { borderRadius: RADIUS.round, overflow: 'hidden' },
  addBtnGrad: { width: rs(32), height: rs(32), alignItems: 'center', justifyContent: 'center' },
  addBtnText: { color: COLORS.white, fontSize: rs(20), fontWeight: 'bold' },
  farmerCard: { width: rs(110), alignItems: 'center', marginRight: SPACING.md, backgroundColor: COLORS.white, borderRadius: RADIUS.xl, padding: SPACING.md, ...SHADOWS.small },
  verifiedBadge: { position: 'absolute', top: rs(12), right: rs(12) },
  farmerCardName: { fontSize: rs(FONTS.xs), fontWeight: 'bold', color: COLORS.textPrimary, textAlign: 'center' },
  farmerCardLoc: { fontSize: rs(9), color: COLORS.textMuted, textAlign: 'center', marginTop: 2 },
  farmerRatingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  farmerStar: { fontSize: rs(10) },
  farmerRatingNum: { fontSize: rs(FONTS.xs), color: COLORS.textSecondary, marginLeft: 2, fontWeight: '600' },
  emptyBox: { alignItems: 'center', paddingVertical: rs(40) },
  emptyEmoji: { fontSize: rs(48), marginBottom: SPACING.md },
  emptyText: { fontSize: rs(FONTS.lg), color: COLORS.textMuted, fontWeight: 'bold' },
  emptySubText: { fontSize: rs(FONTS.sm), color: COLORS.textGray, marginTop: 6, textAlign: 'center', lineHeight: rs(20) },
});

export default HomeScreen;
