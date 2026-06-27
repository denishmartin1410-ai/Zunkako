// ============================================================
// src/screens/consumer/CheckoutScreen.js
// ✅ default export - ConsumerNavigator crash fix!
// ✅ Form validation: name, address, pincode required
// ============================================================

import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
  TextInput,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useCart} from '../../context/CartContext';
import {useAuth} from '../../context/AuthContext';
import {useTranslation} from 'react-i18next';
import {useTheme} from '../../context/ThemeContext';
import {createOrder, getUserProfile} from '../../services/firebase';
import {
  COLORS,
  FONTS,
  SPACING,
  RADIUS,
  SHADOWS,
  getThemeColors,
} from '../../utils/theme';
import BackButton from '../../utils/BackButton';
import Geolocation from '@react-native-community/geolocation';
import {getLocalProductName} from '../../utils/translationHelper';

const {width} = Dimensions.get('window');
const scale = width / 375;
const rs = size => Math.round(size * scale);

const CheckoutScreen = ({navigation}) => {
  const {t, i18n} = useTranslation();
  const {user} = useAuth();
  const {cartItems, totalAmount, clearCart} = useCart();
  const {isDark} = useTheme();
  const themeColors = getThemeColors(isDark);
  const [customerName, setCustomerName] = useState(user?.name || '');
  const [address, setAddress] = useState(user?.address || user?.location || '');
  const [pincode, setPincode] = useState(user?.pincode || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [isLoading, setIsLoading] = useState(false);
  const [consumerLocation, setConsumerLocation] = useState(null);
  const [fetchingLocation, setFetchingLocation] = useState(false);

  const fetchGPSLocation = async () => {
    setFetchingLocation(true);
    const loc = await getConsumerLocation();
    setConsumerLocation(loc);
    setFetchingLocation(false);
  };

  useEffect(() => {
    fetchGPSLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const deliveryFee = 0; // Free for first 3 months
  const finalAmount = totalAmount + deliveryFee;

  // ✅ Get consumer's current location for delivery navigation
  const getConsumerLocation = () => {
    return new Promise(resolve => {
      try {
        if (Platform.OS === 'android') {
          PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          )
            .then(() => {
              Geolocation.getCurrentPosition(
                pos =>
                  resolve({
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude,
                  }),
                () => resolve(null),
                {enableHighAccuracy: true, timeout: 15000, maximumAge: 0},
              );
            })
            .catch(() => resolve(null));
        } else {
          Geolocation.getCurrentPosition(
            pos =>
              resolve({lat: pos.coords.latitude, lng: pos.coords.longitude}),
            () => resolve(null),
            {enableHighAccuracy: true, timeout: 15000, maximumAge: 0},
          );
        }
      } catch (e) {
        resolve(null);
      }
    });
  };

  const handlePlaceOrder = async () => {
    if (cartItems.length === 0) {
      Alert.alert(
        t('common.error', {defaultValue: 'பிழை'}),
        t('checkout.emptyCart', {
          defaultValue: 'கார்ட் காலி! தயாரிப்புகள் சேர்க்கவும்',
        }),
      );
      return;
    }

    // ✅ Validation: name, address, pincode must be filled
    if (!customerName.trim()) {
      Alert.alert(
        t('common.error', {defaultValue: 'பிழை'}),
        t('checkout.nameRequired', {defaultValue: 'பெயர் நிரப்பவும்'}),
      );
      return;
    }
    const cleanAddress = address.trim();
    const userLoc = (user?.location || '').trim();
    if (
      !cleanAddress ||
      cleanAddress.toLowerCase() === userLoc.toLowerCase() ||
      cleanAddress.length < 15
    ) {
      Alert.alert(
        t('common.error', {defaultValue: 'பிழை'}),
        t('checkout.fullAddressRequired', {
          defaultValue:
            'முழு முகவரியையும் உள்ளிடவும்! (தெரு பெயர், கதவு எண் போன்ற விவரங்களுடன்)',
        }),
      );
      return;
    }
    if (!pincode.trim() || pincode.trim().length < 6) {
      Alert.alert(
        t('common.error', {defaultValue: 'பிழை'}),
        t('checkout.pincodeRequired', {
          defaultValue: 'சரியான PIN கோடு நிரப்பவும் (6 இலக்கம்)',
        }),
      );
      return;
    }
    if (!phone.trim() || phone.trim().length < 10) {
      Alert.alert(
        t('common.error', {defaultValue: 'பிழை'}),
        t('checkout.phoneRequired', {
          defaultValue: 'Please enter a valid phone number (10 digits)',
        }),
      );
      return;
    }

    if (!consumerLocation) {
      Alert.alert(
        t('common.error', {defaultValue: 'பிழை'}),
        t('checkout.locationCoordsRequired', {
          defaultValue:
            'விநியோகஸ்தருக்கு உதவ, தயவுசெய்து உங்கள் ஜி.பி.எஸ் இருப்பிடத்தை இணைக்கவும்!',
        }),
      );
      return;
    }

    setIsLoading(true);
    try {
      // Group by farmer
      const farmerGroups = {};
      cartItems.forEach(item => {
        const fid = item.farmerId || 'unknown';
        if (!farmerGroups[fid]) {
          farmerGroups[fid] = [];
        }
        farmerGroups[fid].push(item);
      });

      const farmerIds = Object.keys(farmerGroups);
      const farmerProfiles = {};
      await Promise.all(
        farmerIds.map(async fid => {
          if (fid !== 'unknown') {
            const res = await getUserProfile(fid);
            if (res.success && res.data) {
              farmerProfiles[fid] = res.data;
            }
          }
        }),
      );

      const orderPromises = Object.entries(farmerGroups).map(
        ([farmerId, items]) => {
          const farmerProfile = farmerProfiles[farmerId] || {};
          const subtotal = items.reduce(
            (s, i) => s + (i.consumerPrice || i.price) * i.quantity,
            0,
          );
          return createOrder({
            consumerId: user?.id || user?.uid,
            consumerName: customerName.trim(),
            consumerPhone: phone.trim(),
            farmerId,
            farmerName: items[0]?.farmerName || farmerProfile.name || '',
            farmerPhone: farmerProfile.phone || '',
            farmerLocation:
              farmerProfile.address || farmerProfile.location || '',
            farmerCoords:
              items[0]?.coordinates ||
              items[0]?.locationCoords ||
              farmerProfile.coordinates ||
              farmerProfile.locationCoords ||
              null,
            items: items.map(i => ({
              id: i.id,
              name: i.name,
              nameTa: i.nameTa || i.name,
              price: i.consumerPrice || i.price, // Store consumer price
              basePrice: i.price, // Store base price for farmer visibility separately if needed
              quantity: i.quantity,
              unit: i.unit,
              image: i.image,
            })),
            subtotal,
            deliveryFee: deliveryFee,
            total: subtotal + deliveryFee,
            deliveryAddress: address.trim(),
            deliveryPincode: pincode.trim(),
            paymentMethod: 'COD',
            // Store consumer location for delivery navigation
            consumerCoords: consumerLocation,
          });
        },
      );

      await Promise.all(orderPromises);
      clearCart();
      setIsLoading(false);

      Alert.alert(
        `✅ ${t('checkout.success', {defaultValue: 'ஆர்டர் வெற்றி!'})}`,
        t('checkout.successMsg', {
          defaultValue:
            'உங்கள் ஆர்டர் வெற்றிகரமாக பதிவாகியது!\nYour order has been placed successfully!',
        }),
        [
          {
            text: t('common.ok', {defaultValue: 'சரி'}),
            onPress: () =>
              navigation.reset({index: 0, routes: [{name: 'ConsumerTabs'}]}),
          },
        ],
      );
    } catch (e) {
      setIsLoading(false);
      Alert.alert(
        t('common.error', {defaultValue: 'பிழை'}),
        e.message ||
          t('checkout.failed', {defaultValue: 'ஆர்டர் பதிவு ஆகவில்லை'}),
      );
    }
  };

  return (
    <View style={[styles.container, {backgroundColor: themeColors.bg}]}>
      <LinearGradient colors={['#0D5C32', '#1B8A4E']} style={styles.header}>
        <BackButton onPress={() => navigation.goBack()} />
        <Text style={styles.headerTitle}>
          🛍 {t('checkout.title', {defaultValue: 'Checkout'})}
        </Text>
        <View style={{width: rs(40)}} />
      </LinearGradient>

      <ScrollView
        contentContainerStyle={{padding: SPACING.lg, paddingBottom: rs(120)}}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        {/* ✅ Delivery Details - Name, Address, Pincode */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: themeColors.cardBg,
              borderColor: themeColors.border,
              borderWidth: isDark ? 1 : 0,
            },
          ]}>
          <Text style={[styles.cardTitle, {color: themeColors.text}]}>
            📋{' '}
            {t('checkout.deliveryDetails', {defaultValue: 'டெலிவரி விவரங்கள்'})}
          </Text>
          <View style={styles.formField}>
            <Text style={[styles.formLabel, {color: themeColors.subText}]}>
              {t('checkout.name', {defaultValue: 'பெயர்'})} *
            </Text>
            <TextInput
              style={[
                styles.formInput,
                {
                  backgroundColor: themeColors.inputBg,
                  borderColor: themeColors.border,
                  color: themeColors.text,
                },
              ]}
              value={customerName}
              onChangeText={setCustomerName}
              placeholder={t('checkout.namePlaceholder', {
                defaultValue: 'உங்கள் பெயர்',
              })}
              placeholderTextColor={
                isDark ? 'rgba(255,255,255,0.4)' : COLORS.textGray
              }
            />
          </View>
          <View style={styles.formField}>
            <Text style={[styles.formLabel, {color: themeColors.subText}]}>
              {t('checkout.address', {defaultValue: 'முகவரி'})} *
            </Text>
            <TextInput
              style={[
                styles.formInput,
                {
                  height: rs(80),
                  textAlignVertical: 'top',
                  paddingTop: SPACING.md,
                  backgroundColor: themeColors.inputBg,
                  borderColor: themeColors.border,
                  color: themeColors.text,
                },
              ]}
              value={address}
              onChangeText={setAddress}
              placeholder={t('checkout.addressPlaceholder', {
                defaultValue: 'முழு முகவரி நிரப்பவும்',
              })}
              placeholderTextColor={
                isDark ? 'rgba(255,255,255,0.4)' : COLORS.textGray
              }
              multiline
            />
          </View>
          <View style={styles.formField}>
            <Text style={[styles.formLabel, {color: themeColors.subText}]}>
              {t('checkout.pincode', {defaultValue: 'PIN கோடு'})} *
            </Text>
            <TextInput
              style={[
                styles.formInput,
                {
                  backgroundColor: themeColors.inputBg,
                  borderColor: themeColors.border,
                  color: themeColors.text,
                },
              ]}
              value={pincode}
              onChangeText={setPincode}
              placeholder={t('checkout.pincodePlaceholder', {
                defaultValue: '6 இலக்க PIN கோடு',
              })}
              placeholderTextColor={
                isDark ? 'rgba(255,255,255,0.4)' : COLORS.textGray
              }
              keyboardType="numeric"
              maxLength={6}
            />
          </View>
          {/* GPS Location details selector */}
          <View style={styles.formField}>
            <Text style={[styles.formLabel, {color: themeColors.subText}]}>
              {t('checkout.gpsLocation', {
                defaultValue: 'GPS Location',
              })}{' '}
              *
            </Text>
            <TouchableOpacity
              style={[
                styles.formInput,
                {
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: themeColors.inputBg,
                  borderColor: consumerLocation
                    ? isDark
                      ? '#4CAF50'
                      : COLORS.primaryGreen
                    : COLORS.accentRed,
                  borderWidth: 1.5,
                },
              ]}
              onPress={fetchGPSLocation}
              disabled={fetchingLocation}>
              <Text
                style={{
                  color: consumerLocation
                    ? isDark
                      ? '#4CAF50'
                      : COLORS.primaryGreen
                    : COLORS.accentRed,
                  fontWeight: 'bold',
                  fontSize: rs(FONTS.sm),
                }}>
                {consumerLocation
                  ? `${t('checkout.locationAdded', {
                      defaultValue: '✅ GPS இருப்பிடம் இணைக்கப்பட்டது',
                    })} (${consumerLocation.lat.toFixed(
                      4,
                    )}, ${consumerLocation.lng.toFixed(4)})`
                  : t('checkout.locationMissing', {
                      defaultValue:
                        '❌ GPS இருப்பிடம் இல்லை (பில்டிற்கு மிக முக்கியம்)',
                    })}
              </Text>
              {fetchingLocation ? (
                <ActivityIndicator color={COLORS.primaryGreen} size="small" />
              ) : (
                <Text style={{fontSize: rs(16)}}>📍</Text>
              )}
            </TouchableOpacity>
          </View>
          <View style={styles.formField}>
            <Text style={[styles.formLabel, {color: themeColors.subText}]}>
              {t('checkout.phone', {defaultValue: 'Phone Number'})} *
            </Text>
            <TextInput
              style={[
                styles.formInput,
                {
                  backgroundColor: themeColors.inputBg,
                  borderColor: themeColors.border,
                  color: themeColors.text,
                },
              ]}
              value={phone}
              onChangeText={setPhone}
              placeholder={t('checkout.phonePlaceholder', {
                defaultValue: 'Enter 10-digit Phone Number',
              })}
              placeholderTextColor={
                isDark ? 'rgba(255,255,255,0.4)' : COLORS.textGray
              }
              keyboardType="phone-pad"
              maxLength={10}
            />
          </View>
        </View>

        {/* Order Items */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: themeColors.cardBg,
              borderColor: themeColors.border,
              borderWidth: isDark ? 1 : 0,
            },
          ]}>
          <Text style={[styles.cardTitle, {color: themeColors.text}]}>
            🛒 {t('checkout.yourOrder', {defaultValue: 'உங்கள் ஆர்டர்'})}
          </Text>
          {cartItems.map((item, i) => (
            <View
              key={i}
              style={[
                styles.itemRow,
                i < cartItems.length - 1 && {
                  borderBottomWidth: 1,
                  borderBottomColor: themeColors.border,
                },
              ]}>
              <View style={{flex: 1}}>
                <Text style={[styles.itemName, {color: themeColors.text}]}>
                  {getLocalProductName(item.name, item.nameTa, i18n.language)}
                </Text>
                <Text style={[styles.itemQty, {color: themeColors.textMuted}]}>
                  x{item.quantity} × ₹{item.consumerPrice || item.price}
                </Text>
              </View>
              <Text
                style={[
                  styles.itemTotal,
                  {color: isDark ? '#4CAF50' : COLORS.primaryGreen},
                ]}>
                ₹{(item.consumerPrice || item.price) * item.quantity}
              </Text>
            </View>
          ))}
        </View>

        {/* Price */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: themeColors.cardBg,
              borderColor: themeColors.border,
              borderWidth: isDark ? 1 : 0,
            },
          ]}>
          <Text style={[styles.cardTitle, {color: themeColors.text}]}>
            💰 {t('checkout.priceDetails', {defaultValue: 'தொகை விவரம்'})}
          </Text>
          <View style={styles.priceRow}>
            <Text style={[styles.priceLabel, {color: themeColors.subText}]}>
              {t('checkout.subtotal', {defaultValue: 'தொகை'})}
            </Text>
            <Text style={[styles.priceVal, {color: themeColors.text}]}>
              ₹{totalAmount}
            </Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={[styles.priceLabel, {color: themeColors.subText}]}>
              {t('checkout.delivery', {defaultValue: 'டெலிவரி'})}
            </Text>
            <Text
              style={[
                styles.priceVal,
                deliveryFee === 0
                  ? {color: isDark ? '#4CAF50' : COLORS.primaryGreen}
                  : {color: themeColors.text},
              ]}>
              {deliveryFee === 0
                ? t('checkout.free', {defaultValue: 'இலவசம்!'})
                : `₹${deliveryFee}`}
            </Text>
          </View>
          <View
            style={[
              styles.priceRow,
              styles.totalRow,
              {borderTopColor: themeColors.border},
            ]}>
            <Text style={[styles.totalLabel, {color: themeColors.text}]}>
              {t('checkout.total', {defaultValue: 'மொத்தம்'})}
            </Text>
            <Text
              style={[
                styles.totalVal,
                {color: isDark ? '#4CAF50' : COLORS.primaryGreen},
              ]}>
              ₹{finalAmount}
            </Text>
          </View>
        </View>

        {/* COD Note */}
        <View
          style={[
            styles.codCard,
            {
              backgroundColor: isDark ? '#14251B' : '#E8F5E9',
              borderLeftColor: isDark ? '#4CAF50' : COLORS.primaryGreen,
            },
          ]}>
          <Text style={styles.codIcon}>💵</Text>
          <View style={{flex: 1}}>
            <Text
              style={[
                styles.codTitle,
                {color: isDark ? '#4CAF50' : COLORS.primaryGreen},
              ]}>
              {t('checkout.cod', {defaultValue: 'Cash on Delivery'})}
            </Text>
            <Text style={[styles.codSub, {color: themeColors.subText}]}>
              {t('checkout.codSub', {
                defaultValue: 'பொருள் வந்ததும் பணம் கொடுக்கலாம்',
              })}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Place Order Button */}
      <View
        style={[
          styles.bottomBar,
          {
            backgroundColor: themeColors.cardBg,
            borderTopColor: themeColors.border,
          },
        ]}>
        <View>
          <Text style={[styles.totalSmall, {color: themeColors.textMuted}]}>
            {t('checkout.total', {defaultValue: 'மொத்தம்'})}
          </Text>
          <Text
            style={[
              styles.totalBig,
              {color: isDark ? '#4CAF50' : COLORS.primaryGreen},
            ]}>
            ₹{finalAmount}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.orderBtn}
          onPress={handlePlaceOrder}
          disabled={isLoading}>
          <LinearGradient
            colors={COLORS.gradientButton}
            style={styles.orderBtnGrad}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 0}}>
            {isLoading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.orderBtnTxt}>
                {t('checkout.placeOrder', {defaultValue: 'ஆர்டர் செய்'})} →
              </Text>
            )}
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
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.small,
  },
  cardTitle: {
    fontSize: rs(FONTS.md),
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  // ✅ Form fields for delivery details
  formField: {marginBottom: SPACING.md},
  formLabel: {
    fontSize: rs(FONTS.sm),
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  formInput: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.lg,
    height: rs(48),
    fontSize: rs(FONTS.md),
    color: COLORS.textPrimary,
    borderWidth: 1.5,
    borderColor: COLORS.borderLight,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  itemBorder: {borderBottomWidth: 1, borderBottomColor: COLORS.borderLight},
  itemName: {
    fontSize: rs(FONTS.md),
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  itemQty: {fontSize: rs(FONTS.xs), color: COLORS.textMuted},
  itemTotal: {
    fontSize: rs(FONTS.md),
    fontWeight: 'bold',
    color: COLORS.primaryGreen,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.xs || 4,
  },
  priceLabel: {fontSize: rs(FONTS.sm), color: COLORS.textSecondary},
  priceVal: {
    fontSize: rs(FONTS.sm),
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
  },
  totalLabel: {
    fontSize: rs(FONTS.lg),
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  totalVal: {
    fontSize: rs(FONTS.xl),
    fontWeight: 'bold',
    color: COLORS.primaryGreen,
  },
  codCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primaryGreen,
  },
  codIcon: {fontSize: rs(32), marginRight: SPACING.md},
  codTitle: {
    fontSize: rs(FONTS.md),
    fontWeight: 'bold',
    color: COLORS.primaryGreen,
  },
  codSub: {fontSize: rs(FONTS.xs), color: COLORS.textSecondary, marginTop: 2},
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    ...SHADOWS.large,
  },
  totalSmall: {fontSize: rs(FONTS.xs), color: COLORS.textMuted},
  totalBig: {
    fontSize: rs(FONTS.xxl),
    fontWeight: 'bold',
    color: COLORS.primaryGreen,
  },
  orderBtn: {borderRadius: RADIUS.lg, overflow: 'hidden'},
  orderBtnGrad: {
    paddingVertical: rs(14),
    paddingHorizontal: rs(32),
    alignItems: 'center',
  },
  orderBtnTxt: {
    color: COLORS.white,
    fontSize: rs(FONTS.lg),
    fontWeight: 'bold',
  },
});

export default CheckoutScreen;
