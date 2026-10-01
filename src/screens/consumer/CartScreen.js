// src/screens/consumer/CartScreen.js
// ✅ i18n language support
// ✅ Header title translated

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import FastImage from 'react-native-fast-image';
import {useTranslation} from 'react-i18next';
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
import {getLocalProductName} from '../../utils/translationHelper';
import Feather from 'react-native-vector-icons/Feather';

const {width} = Dimensions.get('window');
const scale = width / 375;
const rs = size => Math.round(size * scale);

const CartScreen = ({navigation}) => {
  const {t, i18n} = useTranslation();
  const {cartItems, removeFromCart, updateQuantity, totalAmount, clearCart} =
    useCart();
  const {isDark} = useTheme();
  const themeColors = getThemeColors(isDark);

  const deliveryFee = 0; // Free for first 3 months
  const finalAmount = totalAmount + deliveryFee;

  if (cartItems.length === 0) {
    return (
      <View style={[styles.container, {backgroundColor: themeColors.bg}]}>
        <LinearGradient
          colors={['#0D5C32', '#1B8A4E']}
          style={[styles.header, {justifyContent: 'center'}]}>
          <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'center'}}>
            <Feather name="shopping-bag" size={22} color={COLORS.white} style={{marginRight: 8}} />
            <Text style={styles.headerTitle}>
              {t('nav.cart', {defaultValue: 'என் கார்ட்'})}
            </Text>
          </View>
        </LinearGradient>
        <View style={styles.emptyBox}>
          <View style={{marginBottom: 16}}>
            <Feather name="shopping-bag" size={64} color={COLORS.textMuted} />
          </View>
          <Text style={[styles.emptyTitle, {color: themeColors.text}]}>
            {t('cart.empty', {defaultValue: 'கார்ட் காலியாக உள்ளது'})}
          </Text>
          <TouchableOpacity
            style={styles.shopBtn}
            onPress={() => navigation.navigate('Home')}>
            <LinearGradient
              colors={COLORS.gradientButton}
              style={styles.shopBtnGrad}>
              <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'center'}}>
                <Text style={styles.shopBtnTxt}>
                  {t('cart.startShopping', {defaultValue: 'கொள்முதல் தொடங்கு'}).replace('→', '').trim()}
                </Text>
                <Feather name="arrow-right" size={18} color={COLORS.white} style={{marginLeft: 6}} />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, {backgroundColor: themeColors.bg}]}>
      <LinearGradient colors={['#0D5C32', '#1B8A4E']} style={styles.header}>
        <View style={{width: 40}} />
        <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'center'}}>
          <Feather name="shopping-bag" size={20} color={COLORS.white} style={{marginRight: 6}} />
          <Text style={[styles.headerTitle, {textAlign: 'center'}]}>
            {t('nav.cart', {defaultValue: 'என் கார்ட்'})}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.clearBtn}
          onPress={() =>
            Alert.alert(
              t('cart.clearTitle', {defaultValue: 'கார்ட் காலி பண்ணவா?'}),
              '',
              [
                {
                  text: t('common.cancel', {defaultValue: 'இல்லை'}),
                  style: 'cancel',
                },
                {
                  text: t('common.yes', {defaultValue: 'ஆமா'}),
                  onPress: clearCart,
                },
              ],
            )
          }>
          <Feather name="trash-2" size={20} color={COLORS.white} />
        </TouchableOpacity>
      </LinearGradient>

      <FlatList
        data={cartItems}
        keyExtractor={item => item.id}
        contentContainerStyle={{padding: SPACING.lg, paddingBottom: rs(220)}}
        renderItem={({item}) => (
          <View
            style={[
              styles.cartCard,
              {
                backgroundColor: themeColors.cardBg,
                borderColor: themeColors.border,
                borderWidth: isDark ? 1 : 0,
              },
            ]}>
            <FastImage
              source={{uri: item.image, priority: FastImage.priority.normal}}
              style={styles.cartImg}
              resizeMode={FastImage.resizeMode.cover}
            />
            <View style={styles.cartInfo}>
              <Text
                style={[styles.cartName, {color: themeColors.text}]}
                numberOfLines={2}>
                {getLocalProductName(item.name, item.nameTa, i18n.language)}
              </Text>
              <Text style={[styles.cartFarmer, {color: themeColors.subText}]}>
                {' '}
                {i18n.language === 'ta'
                  ? item.farmerNameTa || item.farmerName
                  : item.farmerName || item.farmerNameTa || ''}
              </Text>
              <Text
                style={[
                  styles.cartPrice,
                  {color: isDark ? '#4CAF50' : COLORS.primaryGreen},
                ]}>
                ₹{item.consumerPrice || item.price}/{item.unit}
              </Text>
              <View style={styles.qtyRow}>
                <TouchableOpacity
                  style={[
                    styles.qtyBtn,
                    {
                      backgroundColor: themeColors.bg,
                      borderColor: themeColors.border,
                    },
                  ]}
                  onPress={() => updateQuantity(item.id, item.quantity - 1)}>
                  <Text
                    style={[
                      styles.qtyBtnTxt,
                      {color: isDark ? '#4CAF50' : COLORS.primaryGreen},
                    ]}>
                    −
                  </Text>
                </TouchableOpacity>
                <Text style={[styles.qty, {color: themeColors.text}]}>
                  {item.quantity}
                </Text>
                <TouchableOpacity
                  style={[
                    styles.qtyBtn,
                    {
                      backgroundColor: themeColors.bg,
                      borderColor: themeColors.border,
                    },
                  ]}
                  onPress={() => updateQuantity(item.id, item.quantity + 1)}>
                  <Text
                    style={[
                      styles.qtyBtnTxt,
                      {color: isDark ? '#4CAF50' : COLORS.primaryGreen},
                    ]}>
                    +
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.cartRight}>
              <Text
                style={[
                  styles.cartTotal,
                  {color: isDark ? '#4CAF50' : COLORS.primaryGreen},
                ]}>
                ₹{(item.consumerPrice || item.price) * item.quantity}
              </Text>
              <TouchableOpacity onPress={() => removeFromCart(item.id)}>
                <Feather name="trash-2" size={18} color={COLORS.accentRed} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      {/* Summary + Checkout */}
      <View
        style={[
          styles.bottomBar,
          {
            backgroundColor: themeColors.cardBg,
            borderTopColor: themeColors.border,
          },
        ]}>
        <View style={styles.summaryBox}>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, {color: themeColors.subText}]}>
              {t('cart.subtotal', {defaultValue: 'தொகை'})}:
            </Text>
            <Text style={[styles.summaryVal, {color: themeColors.text}]}>
              ₹{totalAmount}
            </Text>
          </View>
          {deliveryFee > 0 && (
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, {color: themeColors.subText}]}>
                {t('cart.delivery', {defaultValue: 'டெலிவரி'})}:
              </Text>
              <Text style={[styles.summaryVal, {color: themeColors.text}]}>
                ₹{deliveryFee}
              </Text>
            </View>
          )}
          {deliveryFee === 0 && totalAmount > 0 && (
            <Text
              style={[
                styles.freeDelivery,
                {color: isDark ? '#4CAF50' : COLORS.primaryGreen},
              ]}>
              {' '}
              {t('cart.freeDelivery', {
                defaultValue: 'Free Delivery for first 3 months!',
              })}
            </Text>
          )}
        </View>
        <TouchableOpacity
          style={styles.checkoutBtn}
          onPress={() => navigation.navigate('Checkout')}>
          <LinearGradient
            colors={COLORS.gradientButton}
            style={styles.checkoutGrad}>
            <Text style={styles.checkoutTxt}>
              {t('cart.checkout', {defaultValue: 'ஆர்டர் செய்'})} ₹{finalAmount}{' '}
              →
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: COLORS.background},
  header: {
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
  },
  clearBtn: {padding: 8},
  clearBtnTxt: {fontSize: rs(22)},
  emptyBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xxl,
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
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  shopBtn: {borderRadius: RADIUS.lg, overflow: 'hidden', width: '80%'},
  shopBtnGrad: {paddingVertical: rs(14), alignItems: 'center'},
  shopBtnTxt: {color: COLORS.white, fontSize: rs(FONTS.md), fontWeight: 'bold'},
  cartCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    marginBottom: SPACING.md,
    overflow: 'hidden',
    ...SHADOWS.small,
  },
  cartImg: {width: rs(115), alignSelf: 'stretch'},
  cartInfo: {flex: 1, padding: SPACING.md},
  cartName: {
    fontSize: rs(FONTS.md),
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    lineHeight: rs(20),
  },
  cartFarmer: {fontSize: rs(FONTS.xs), color: COLORS.textMuted, marginTop: 2},
  cartPrice: {
    fontSize: rs(FONTS.sm),
    color: COLORS.primaryGreen,
    fontWeight: '600',
    marginTop: 4,
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.sm,
    gap: SPACING.md,
  },
  qtyBtn: {
    width: rs(30),
    height: rs(30),
    borderRadius: rs(15),
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  qtyBtnTxt: {fontSize: rs(18), fontWeight: 'bold', color: COLORS.primaryGreen},
  qty: {
    fontSize: rs(FONTS.lg),
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    minWidth: rs(24),
    textAlign: 'center',
  },
  cartRight: {
    padding: SPACING.md,
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  cartTotal: {
    fontSize: rs(FONTS.lg),
    fontWeight: 'bold',
    color: COLORS.primaryGreen,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: rs(90),
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    ...SHADOWS.large,
  },
  summaryBox: {marginBottom: SPACING.md},
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  summaryLabel: {fontSize: rs(FONTS.sm), color: COLORS.textSecondary},
  summaryVal: {
    fontSize: rs(FONTS.sm),
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  freeDelivery: {
    fontSize: rs(FONTS.xs),
    color: COLORS.primaryGreen,
    fontWeight: '600',
  },
  checkoutBtn: {borderRadius: RADIUS.lg, overflow: 'hidden'},
  checkoutGrad: {paddingVertical: rs(14), alignItems: 'center'},
  checkoutTxt: {
    color: COLORS.white,
    fontSize: rs(FONTS.lg),
    fontWeight: 'bold',
  },
});

export default CartScreen;
