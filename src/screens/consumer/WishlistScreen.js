// ============================================================
// src/screens/consumer/WishlistScreen.js
// ✅ default export - ConsumerNavigator-க்கு தேவை!
// ✅ Full i18n support - language switching fixed
// ============================================================

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import FastImage from 'react-native-fast-image';
import {useTranslation} from 'react-i18next';
import {useWishlist} from '../../context/WishlistContext';
import {useCart} from '../../context/CartContext';
import {useTheme} from '../../context/ThemeContext';
import {
  COLORS,
  FONTS,
  SPACING,
  RADIUS,
  SHADOWS,
  getThemeColors,
} from '../../utils/theme';
import BackButton from '../../utils/BackButton';
import {getLocalProductName} from '../../utils/translationHelper';

const {width} = Dimensions.get('window');
const scale = width / 375;
const rs = size => Math.round(size * scale);

// ✅ Named function + default export at bottom
const WishlistScreen = ({navigation}) => {
  const {t, i18n} = useTranslation();
  const {wishlistItems, removeFromWishlist} = useWishlist();
  const {addToCart} = useCart();
  const {isDark} = useTheme();
  const themeColors = getThemeColors(isDark);

  const handleAddToCart = item => {
    addToCart(item);
    removeFromWishlist(item.id);
  };

  return (
    <View style={[styles.container, {backgroundColor: themeColors.bg}]}>
      {/* Header */}
      <LinearGradient colors={['#0D5C32', '#1B8A4E']} style={styles.headerRow}>
        <BackButton onPress={() => navigation.goBack()} />
        <Text style={styles.headerTitle}>
          ❤️ {t('profile.wishlist', {defaultValue: 'My Wishlist'})}
        </Text>
        <View style={{width: rs(40)}} />
      </LinearGradient>

      {wishlistItems.length === 0 ? (
        // Empty state
        <View style={styles.emptyBox}>
          <Text style={styles.emptyEmoji}>❤️</Text>
          <Text style={[styles.emptyTitle, {color: themeColors.text}]}>
            {t('wishlist.empty', {defaultValue: 'விருப்ப பட்டியல் காலி'})}
          </Text>

          <TouchableOpacity
            style={styles.shopBtn}
            onPress={() => navigation.goBack()}>
            <LinearGradient
              colors={COLORS.gradientButton}
              style={styles.shopBtnGrad}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 0}}>
              <Text style={styles.shopBtnTxt}>
                🛒{' '}
                {t('wishlist.shopNow', {defaultValue: 'ஷாப்பிங் பண்ணுங்கள்'})}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={wishlistItems}
          keyExtractor={item => item.id}
          contentContainerStyle={{padding: SPACING.lg, paddingBottom: rs(100)}}
          showsVerticalScrollIndicator={false}
          renderItem={({item}) => (
            <View
              style={[
                styles.wishCard,
                {
                  backgroundColor: themeColors.cardBg,
                  borderColor: themeColors.border,
                  borderWidth: isDark ? 1 : 0,
                },
              ]}>
              {/* Product Image */}
              <FastImage
                source={{uri: item.image, priority: FastImage.priority.normal}}
                style={styles.wishImg}
                resizeMode={FastImage.resizeMode.cover}
              />

              {/* Product Info */}
              <View style={styles.wishInfo}>
                <Text
                  style={[styles.wishName, {color: themeColors.text}]}
                  numberOfLines={2}>
                  {getLocalProductName(item.name, item.nameTa, i18n.language)}
                </Text>
                <Text
                  style={[styles.wishFarmer, {color: themeColors.subText}]}
                  numberOfLines={1}>
                  👨‍🌾{' '}
                  {i18n.language === 'ta'
                    ? item.farmerNameTa || item.farmerName
                    : item.farmerName || item.farmerNameTa || ''}
                </Text>
                <View style={styles.wishPriceRow}>
                  <Text
                    style={[
                      styles.wishPrice,
                      {color: isDark ? '#4CAF50' : COLORS.primaryGreen},
                    ]}>
                    ₹{item.price}/{item.unit}
                  </Text>
                  {item.originalPrice > item.price && (
                    <Text style={styles.wishOriginal}>
                      ₹{item.originalPrice}
                    </Text>
                  )}
                </View>

                {/* Action Buttons */}
                <View style={styles.actionRow}>
                  {/* Add to Cart */}
                  <TouchableOpacity
                    style={styles.cartBtn}
                    onPress={() => handleAddToCart(item)}>
                    <Text style={styles.cartBtnTxt}>
                      🛒 {t('cart.addToCart', {defaultValue: 'கார்ட்'})}
                    </Text>
                  </TouchableOpacity>

                  {/* Remove */}
                  <TouchableOpacity
                    style={[
                      styles.removeBtn,
                      {backgroundColor: isDark ? '#3D1B1E' : '#FFEBEE'},
                    ]}
                    onPress={() => removeFromWishlist(item.id)}>
                    <Text style={styles.removeBtnTxt}>🗑</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: COLORS.background},

  headerRow: {
    paddingTop: rs(50),
    paddingBottom: rs(16),
    paddingHorizontal: SPACING.xl,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {width: rs(40)},
  backTxt: {color: COLORS.white, fontSize: rs(22), fontWeight: 'bold'},
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: rs(FONTS.xl),
    fontWeight: 'bold',
    color: COLORS.white,
  },

  // Empty state
  emptyBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xxl,
  },
  emptyEmoji: {fontSize: rs(72), marginBottom: SPACING.lg},
  emptyTitle: {
    fontSize: rs(FONTS.xl),
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  emptySub: {
    fontSize: rs(FONTS.md),
    color: COLORS.textMuted,
    marginBottom: SPACING.xl,
  },
  shopBtn: {borderRadius: RADIUS.lg, overflow: 'hidden', width: '80%'},
  shopBtnGrad: {paddingVertical: rs(14), alignItems: 'center'},
  shopBtnTxt: {color: COLORS.white, fontSize: rs(FONTS.md), fontWeight: 'bold'},

  // Wishlist card
  wishCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    marginBottom: SPACING.md,
    overflow: 'hidden',
    ...SHADOWS.card,
  },
  wishImg: {width: rs(110), height: rs(110)},
  wishInfo: {
    flex: 1,
    padding: SPACING.md,
    justifyContent: 'space-between',
  },
  wishName: {
    fontSize: rs(FONTS.md),
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    lineHeight: rs(20),
  },
  wishFarmer: {fontSize: rs(FONTS.xs), color: COLORS.textMuted},
  wishPriceRow: {flexDirection: 'row', alignItems: 'center', gap: SPACING.sm},
  wishPrice: {
    fontSize: rs(FONTS.lg),
    fontWeight: '800',
    color: COLORS.primaryGreen,
  },
  wishOriginal: {
    fontSize: rs(FONTS.xs),
    color: COLORS.textGray,
    textDecorationLine: 'line-through',
  },
  actionRow: {flexDirection: 'row', gap: SPACING.sm, marginTop: 4},
  cartBtn: {
    flex: 1,
    backgroundColor: COLORS.primaryGreen,
    borderRadius: RADIUS.md,
    paddingVertical: 7,
    alignItems: 'center',
  },
  cartBtnTxt: {color: COLORS.white, fontSize: rs(FONTS.xs), fontWeight: 'bold'},
  removeBtn: {
    backgroundColor: '#FFEBEE',
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBtnTxt: {fontSize: rs(16)},
});

// ✅ IMPORTANT: default export - இல்லாதபோதுதான் error வருது!
export default WishlistScreen;
