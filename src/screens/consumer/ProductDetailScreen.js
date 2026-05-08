// ProductDetailScreen.js
// ✅ Full i18n, +₹4 consumer pricing, interactive star rating, responsive scaling
import React, {useState, useEffect} from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Dimensions, TextInput, Alert, ActivityIndicator, Linking
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import FastImage from 'react-native-fast-image';
import MapView, { Marker } from 'react-native-maps';
import {useTranslation} from 'react-i18next';
import {useCart} from '../../context/CartContext';
import {useWishlist} from '../../context/WishlistContext';
import {useAuth} from '../../context/AuthContext';
import {COLORS, FONTS, SPACING, RADIUS, SHADOWS} from '../../utils/theme';
import {getConsumerPrice, PLATFORM_FEE} from '../../utils/priceHelper';

const {width} = Dimensions.get('window');
const scale = width / 375;
const rs = size => Math.round(size * scale);

// ── Interactive Star Rating Component ──
const StarRating = ({rating, onRate, size = 28, disabled = false}) => {
  const stars = [1, 2, 3, 4, 5];
  return (
    <View style={{flexDirection: 'row', gap: rs(4)}}>
      {stars.map(star => (
        <TouchableOpacity key={star} onPress={() => !disabled && onRate(star)} disabled={disabled} activeOpacity={0.7}>
          <Text style={{fontSize: rs(size), opacity: disabled ? 0.6 : 1}}>
            {star <= rating ? '⭐' : '☆'}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const ProductDetailScreen = ({route, navigation}) => {
  const {t} = useTranslation();
  const {product} = route.params;
  const {user} = useAuth();
  const {addToCart, isInCart, getItemQuantity, increaseQuantity, decreaseQuantity} = useCart();
  const {toggleWishlist, isInWishlist} = useWishlist();
  const inCart = isInCart(product.id);
  const qty = getItemQuantity(product.id);
  const wished = isInWishlist(product.id);

  // Consumer price (+₹4)
  const consumerPrice = getConsumerPrice(product.price);
  const consumerOriginalPrice = product.originalPrice > product.price ? product.originalPrice + PLATFORM_FEE : null;

  // Rating state
  const [userRating, setUserRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasRated, setHasRated] = useState(false);
  const [avgRating, setAvgRating] = useState(product.rating || 0);
  const [reviewCount, setReviewCount] = useState(product.reviews || 0);

  // Check if user already rated this product
  useEffect(() => {
    const userId = user?.id || user?.uid;
    if (!userId || !product.id) return;
    (async () => {
      try {
        const {getUserProductRating} = require('../../services/firebase');
        const r = await getUserProductRating(product.id, userId);
        if (r.success && r.data) {
          setUserRating(r.data.rating);
          setReviewText(r.data.review || '');
          setHasRated(true);
        }
      } catch (e) { console.log('rating check:', e); }
    })();
  }, [user, product.id]);

  const handleSubmitRating = async () => {
    const userId = user?.id || user?.uid;
    if (!userId) { Alert.alert(t('common.error', {defaultValue: 'பிழை'}), 'Login required'); return; }
    if (userRating === 0) { Alert.alert(t('common.error', {defaultValue: 'பிழை'}), t('product.selectRating', {defaultValue: 'நட்சத்திரம் தேர்வு செய்யவும்'})); return; }
    setIsSubmitting(true);
    try {
      const {submitProductRating} = require('../../services/firebase');
      const r = await submitProductRating(product.id, userId, userRating, reviewText.trim(), user?.name || '');
      setIsSubmitting(false);
      if (r.success) {
        setHasRated(true);
        setAvgRating(r.newAvgRating || avgRating);
        setReviewCount(r.newReviewCount || reviewCount + 1);
        Alert.alert('✅', t('product.ratingSubmitted', {defaultValue: 'மதிப்பீடு சமர்ப்பிக்கப்பட்டது!'}));
      } else {
        Alert.alert(t('common.error', {defaultValue: 'பிழை'}), r.error || 'Failed');
      }
    } catch (e) { setIsSubmitting(false); Alert.alert(t('common.error', {defaultValue: 'பிழை'}), e.message); }
  };

  const handleAddToCart = () => {
    addToCart({...product, consumerPrice});
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero image */}
        <View style={styles.imgWrap}>
          <FastImage source={{uri: product.image, priority: FastImage.priority.high}} style={styles.heroImg} resizeMode={FastImage.resizeMode.cover} />
          <LinearGradient colors={['transparent', 'rgba(0,0,0,0.6)']} style={styles.imgOverlay} />
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>‹</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.wishBtn} onPress={() => toggleWishlist(product)}>
            <Text style={styles.wishText}>{wished ? '❤️' : '🤍'}</Text>
          </TouchableOpacity>
          {product.isOrganic && (
            <View style={styles.organicTag}>
              <Text style={styles.organicText}>🌿 {t('product.organic', {defaultValue: 'இயற்கை'})}</Text>
            </View>
          )}
        </View>

        <View style={styles.content}>
          {/* Basic info */}
          <View style={styles.basicInfo}>
            <Text style={styles.productName}>{product.nameTa}</Text>
            <Text style={styles.productNameEn}>{product.name}</Text>
            <View style={styles.priceRatingRow}>
              <View>
                <Text style={styles.price}>
                  ₹{consumerPrice}
                  <Text style={styles.unit}> / {product.unit}</Text>
                </Text>
                {consumerOriginalPrice && (
                  <Text style={styles.originalPrice}>
                    ₹{consumerOriginalPrice} ({Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% {t('product.savings', {defaultValue: 'சேமிப்பு'})})
                  </Text>
                )}
              </View>
              <View style={styles.ratingBox}>
                <Text style={styles.ratingNum}>⭐ {avgRating}</Text>
                <Text style={styles.reviewCount}>{reviewCount} {t('product.reviews', {defaultValue: 'மதிப்புரைகள்'})}</Text>
              </View>
            </View>
          </View>

          {/* Farmer info */}
          <TouchableOpacity style={styles.farmerCard} onPress={() => navigation.navigate('FarmerProfile', {farmer: {id: product.farmerId}})}>
            <Text style={styles.farmerEmoji}>👨‍🌾</Text>
            <View style={styles.farmerInfo}>
              <Text style={styles.farmerNameTxt}>{product.farmerNameTa}</Text>
              <Text style={styles.farmerLoc}>📍 {product.location}</Text>
            </View>
            <Text style={styles.farmerArrow}>→</Text>
          </TouchableOpacity>

          {/* Farmer Location Map */}
          {product.coordinates && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📍 {t('product.farmerLocation', {defaultValue: 'விவசாயி இருக்கும் இடம்'})}</Text>
              <View style={{ height: rs(200), borderRadius: RADIUS.lg, overflow: 'hidden', marginBottom: SPACING.md }}>
                <MapView
                  style={{ flex: 1 }}
                  initialRegion={{
                    latitude: product.coordinates.lat,
                    longitude: product.coordinates.lng,
                    latitudeDelta: 0.05,
                    longitudeDelta: 0.05,
                  }}
                  scrollEnabled={false}
                >
                  <Marker coordinate={{ latitude: product.coordinates.lat, longitude: product.coordinates.lng }} title={product.farmerNameTa} description="பண்ணை இருப்பிடம்" />
                </MapView>
              </View>
              <TouchableOpacity style={styles.directionBtn} onPress={() => {
                const url = `google.navigation:q=${product.coordinates.lat},${product.coordinates.lng}`;
                Linking.openURL(url).catch(() => {
                  Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${product.coordinates.lat},${product.coordinates.lng}`);
                });
              }}>
                <Text style={styles.directionBtnTxt} numberOfLines={1} adjustsFontSizeToFit>🗺️ {t('product.getDirections', {defaultValue: 'நேரடியாக சென்று வாங்க வழிகாட்டு'})}</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📄 {t('product.description', {defaultValue: 'விளக்கம்'})}</Text>
            <Text style={styles.description}>{product.descriptionTa}</Text>
          </View>

          {/* Nutrition */}
          {product.nutritionInfo && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🥗 {t('product.nutrition', {defaultValue: 'ஊட்டச்சத்து'})} (100g)</Text>
              <View style={styles.nutritionGrid}>
                {Object.entries(product.nutritionInfo).map(([key, val]) => (
                  <View key={key} style={styles.nutritionItem}>
                    <Text style={styles.nutritionVal}>{val}g</Text>
                    <Text style={styles.nutritionKey}>{key}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Harvest info */}
          <View style={styles.infoRow}>
            <View style={styles.infoChip}>
              <Text style={styles.infoEmoji}>📅</Text>
              <Text style={styles.infoText}>{t('product.harvest', {defaultValue: 'அறுவடை'})}: {product.harvestDate}</Text>
            </View>
            <View style={styles.infoChip}>
              <Text style={styles.infoEmoji}>⏰</Text>
              <Text style={styles.infoText}>{t('product.freshness', {defaultValue: 'புத்துணர்ச்சி'})}: {product.expiryDays} {t('product.days', {defaultValue: 'நாட்கள்'})}</Text>
            </View>
          </View>

          {/* ── Rating & Review Section ── */}
          <View style={styles.ratingSection}>
            <Text style={styles.sectionTitle}>⭐ {t('product.rateProduct', {defaultValue: 'தயாரிப்பை மதிப்பிடுங்கள்'})}</Text>
            {hasRated ? (
              <View style={styles.ratedBox}>
                <StarRating rating={userRating} onRate={() => {}} size={32} disabled />
                <Text style={styles.ratedText}>✅ {t('product.alreadyRated', {defaultValue: 'நீங்கள் ஏற்கனவே மதிப்பிட்டுள்ளீர்கள்'})}</Text>
                {reviewText ? <Text style={styles.ratedReview}>"{reviewText}"</Text> : null}
              </View>
            ) : (
              <View style={styles.rateBox}>
                <StarRating rating={userRating} onRate={setUserRating} size={36} />
                <TextInput
                  style={styles.reviewInput}
                  value={reviewText}
                  onChangeText={setReviewText}
                  placeholder={t('product.reviewPlaceholder', {defaultValue: 'உங்கள் கருத்து எழுதுங்கள் (விருப்பம்)...'})}
                  placeholderTextColor={COLORS.textGray}
                  multiline
                  maxLength={200}
                />
                <TouchableOpacity style={styles.submitRatingBtn} onPress={handleSubmitRating} disabled={isSubmitting}>
                  <LinearGradient colors={isSubmitting ? ['#9E9E9E', '#757575'] : COLORS.gradientButton} style={styles.submitRatingGrad} start={{x: 0, y: 0}} end={{x: 1, y: 0}}>
                    {isSubmitting ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.submitRatingTxt}>⭐ {t('product.submitReview', {defaultValue: 'மதிப்பீடு சமர்ப்பி'})}</Text>}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={{height: rs(100)}} />
        </View>
      </ScrollView>

      {/* Bottom action bar */}
      <View style={styles.bottomBar}>
        {!inCart ? (
          <TouchableOpacity style={styles.addCartBtn} onPress={handleAddToCart}>
            <LinearGradient colors={COLORS.gradientButton} style={styles.addCartGrad} start={{x: 0, y: 0}} end={{x: 1, y: 0}}>
              <Text style={styles.addCartText}>🛒 {t('product.addToCart', {defaultValue: 'கார்ட்டில் சேர்'})}</Text>
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <View style={styles.qtyControl}>
            <TouchableOpacity style={styles.qtyBtn} onPress={() => decreaseQuantity(product.id)}>
              <Text style={styles.qtyBtnTxt}>−</Text>
            </TouchableOpacity>
            <Text style={styles.qtyNum}>{qty} {t('product.inCart', {defaultValue: 'கார்ட்டில்'})}</Text>
            <TouchableOpacity style={[styles.qtyBtn, styles.qtyBtnAdd]} onPress={() => increaseQuantity(product.id)}>
              <Text style={[styles.qtyBtnTxt, {color: COLORS.white}]}>+</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: COLORS.background},
  imgWrap: {height: rs(300), position: 'relative'},
  heroImg: {width: '100%', height: '100%'},
  imgOverlay: {position: 'absolute', bottom: 0, left: 0, right: 0, height: rs(100)},
  backBtn: { position: 'absolute', top: rs(44), left: rs(16), width: rs(40), height: rs(40), borderRadius: rs(20), backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
  backText: {color: COLORS.white, fontSize: rs(20), fontWeight: FONTS.bold},
  wishBtn: { position: 'absolute', top: rs(44), right: rs(16), width: rs(40), height: rs(40), borderRadius: rs(20), backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
  wishText: {fontSize: rs(20)},
  organicTag: { position: 'absolute', bottom: rs(16), left: rs(16), backgroundColor: COLORS.primaryGreen, borderRadius: RADIUS.full, paddingHorizontal: rs(12), paddingVertical: rs(4) },
  organicText: { color: COLORS.white, fontSize: rs(FONTS.xs), fontWeight: FONTS.bold },
  content: { backgroundColor: COLORS.white, borderTopLeftRadius: rs(24), borderTopRightRadius: rs(24), marginTop: rs(-20), padding: SPACING.xl },
  basicInfo: {marginBottom: SPACING.lg},
  productName: { fontSize: rs(FONTS.xxl), fontWeight: FONTS.bold, color: COLORS.textPrimary },
  productNameEn: { fontSize: rs(FONTS.sm), color: COLORS.textMuted, marginBottom: SPACING.md },
  priceRatingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  price: { fontSize: rs(FONTS.xxl), fontWeight: FONTS.extraBold, color: COLORS.primaryGreen },
  unit: { fontSize: rs(FONTS.sm), fontWeight: FONTS.regular, color: COLORS.textMuted },
  originalPrice: { fontSize: rs(FONTS.sm), color: COLORS.textGray, textDecorationLine: 'line-through' },
  ratingBox: { alignItems: 'center', backgroundColor: '#FFF9E6', padding: SPACING.md, borderRadius: RADIUS.md },
  ratingNum: { fontSize: rs(FONTS.lg), fontWeight: FONTS.bold, color: COLORS.textPrimary },
  reviewCount: {fontSize: rs(FONTS.xs), color: COLORS.textMuted},
  farmerCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.gradientSoft[0], borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.lg },
  farmerEmoji: {fontSize: rs(36), marginRight: SPACING.md},
  farmerInfo: {flex: 1},
  farmerNameTxt: { fontSize: rs(FONTS.md), fontWeight: FONTS.bold, color: COLORS.textPrimary },
  farmerLoc: {fontSize: rs(FONTS.sm), color: COLORS.textMuted},
  farmerArrow: {fontSize: rs(20), color: COLORS.primaryGreen},
  directionBtn: { backgroundColor: '#E3F2FD', padding: SPACING.md, borderRadius: RADIUS.md, alignItems: 'center', borderWidth: 1, borderColor: '#90CAF9' },
  directionBtnTxt: { color: '#1565C0', fontSize: rs(FONTS.sm), fontWeight: FONTS.bold },
  section: {marginBottom: SPACING.lg},
  sectionTitle: { fontSize: rs(FONTS.lg), fontWeight: FONTS.bold, color: COLORS.textPrimary, marginBottom: SPACING.sm },
  description: { fontSize: rs(FONTS.md), color: COLORS.textSecondary, lineHeight: rs(24) },
  nutritionGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm},
  nutritionItem: { backgroundColor: COLORS.background, borderRadius: RADIUS.md, padding: SPACING.md, alignItems: 'center', minWidth: rs(70) },
  nutritionVal: { fontSize: rs(FONTS.lg), fontWeight: FONTS.bold, color: COLORS.primaryGreen },
  nutritionKey: { fontSize: rs(FONTS.xs), color: COLORS.textMuted, textTransform: 'capitalize' },
  infoRow: { flexDirection: 'row', gap: SPACING.md, flexWrap: 'wrap', marginBottom: SPACING.lg },
  infoChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.background, borderRadius: RADIUS.md, padding: SPACING.sm, paddingHorizontal: SPACING.md },
  infoEmoji: {fontSize: rs(16), marginRight: rs(6)},
  infoText: {fontSize: rs(FONTS.sm), color: COLORS.textSecondary},
  // Rating section
  ratingSection: { marginBottom: SPACING.lg, backgroundColor: COLORS.background, borderRadius: RADIUS.xl, padding: SPACING.lg },
  rateBox: { alignItems: 'center', gap: SPACING.md },
  reviewInput: { width: '100%', backgroundColor: COLORS.white, borderRadius: RADIUS.md, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, fontSize: rs(FONTS.md), color: COLORS.textPrimary, borderWidth: 1.5, borderColor: COLORS.borderLight, height: rs(80), textAlignVertical: 'top' },
  submitRatingBtn: { width: '100%', borderRadius: RADIUS.lg, overflow: 'hidden' },
  submitRatingGrad: { paddingVertical: rs(12), alignItems: 'center' },
  submitRatingTxt: { color: COLORS.white, fontSize: rs(FONTS.md), fontWeight: FONTS.bold },
  ratedBox: { alignItems: 'center', paddingVertical: SPACING.md },
  ratedText: { fontSize: rs(FONTS.sm), color: COLORS.primaryGreen, fontWeight: '600', marginTop: SPACING.sm },
  ratedReview: { fontSize: rs(FONTS.sm), color: COLORS.textSecondary, fontStyle: 'italic', marginTop: SPACING.sm, textAlign: 'center' },
  // Bottom bar
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: COLORS.white, paddingHorizontal: SPACING.lg, paddingTop: SPACING.lg, paddingBottom: rs(28), borderTopLeftRadius: rs(20), borderTopRightRadius: rs(20), ...SHADOWS.large },
  addCartBtn: {borderRadius: RADIUS.lg, overflow: 'hidden'},
  addCartGrad: {paddingVertical: rs(16), alignItems: 'center'},
  addCartText: { color: COLORS.white, fontSize: rs(FONTS.lg), fontWeight: FONTS.bold },
  qtyControl: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.xl, backgroundColor: COLORS.background, borderRadius: RADIUS.lg, padding: SPACING.md },
  qtyBtn: { width: rs(44), height: rs(44), borderRadius: rs(22), alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.white, borderWidth: 2, borderColor: COLORS.border },
  qtyBtnAdd: { backgroundColor: COLORS.primaryGreen, borderColor: COLORS.primaryGreen },
  qtyBtnTxt: {fontSize: rs(22), fontWeight: FONTS.bold, color: COLORS.textPrimary},
  qtyNum: { fontSize: rs(FONTS.lg), fontWeight: FONTS.bold, color: COLORS.textPrimary },
});

export default ProductDetailScreen;
