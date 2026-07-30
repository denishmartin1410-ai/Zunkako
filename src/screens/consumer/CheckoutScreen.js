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
  Linking,
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
  const {cartItems, totalAmount, discount, clearCart} = useCart();
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
    const res = await getConsumerLocation();
    if (res.success) {
      setConsumerLocation({lat: res.lat, lng: res.lng});
    } else {
      setConsumerLocation({lat: res.lat, lng: res.lng});
      Alert.alert(
        t('location.turnOnGpsTitle', {defaultValue: 'GPS இயக்கவும்'}),
        t('location.turnOnGpsMsg', {
          defaultValue:
            'ஆர்டர் செய்ய ஜிபிஎஸ் இருப்பிடத்தை இயக்க வேண்டும். தயவுசெய்து அமைப்புகளில் அதனை இயக்கவும்.\nTo place orders, GPS location services must be enabled. Please turn it on in settings.',
        }),
        [
          {
            text: t('common.cancel', {defaultValue: 'No, thanks'}),
            style: 'cancel',
          },
          {
            text: t('location.turnOn', {defaultValue: 'Turn on'}),
            onPress: () => {
              if (Platform.OS === 'android') {
                Linking.sendIntent('android.settings.LOCATION_SOURCE_SETTINGS');
              } else {
                Linking.openURL('app-settings:');
              }
            },
          },
        ],
      );
    }
    setFetchingLocation(false);
  };

  useEffect(() => {
    fetchGPSLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const deliveryFee = 0; // Free for first 3 months
  const finalAmount = totalAmount - (discount || 0) + deliveryFee;

  // ✅ Ultra-fast multi-stage GPS location fetching for checkout & delivery navigation
  const getConsumerLocation = () => {
    return new Promise(async resolve => {
      try {
        if (Platform.OS === 'android') {
          try {
            const granted = await PermissionsAndroid.request(
              PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            );
            if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
              if (user?.latitude && user?.longitude) {
                return resolve({
                  success: false,
                  lat: user.latitude,
                  lng: user.longitude,
                });
              }
              return resolve({success: false, lat: 11.0168, lng: 76.9558});
            }
          } catch (permErr) {
            console.log('Permission request error:', permErr);
          }
        }

        let resolved = false;

        // Stage 1: Try fast cached location first (< 500ms)
        Geolocation.getCurrentPosition(
          pos => {
            if (!resolved && pos?.coords?.latitude && pos?.coords?.longitude) {
              resolved = true;
              resolve({
                success: true,
                lat: pos.coords.latitude,
                lng: pos.coords.longitude,
              });
            }
          },
          () => {},
          {enableHighAccuracy: false, timeout: 2500, maximumAge: 120000},
        );

        // Stage 2: High accuracy position (timeout 5000ms)
        Geolocation.getCurrentPosition(
          pos => {
            if (!resolved && pos?.coords?.latitude && pos?.coords?.longitude) {
              resolved = true;
              resolve({
                success: true,
                lat: pos.coords.latitude,
                lng: pos.coords.longitude,
              });
            }
          },
          err => {
            if (!resolved) {
              // Stage 3: Low accuracy network location fallback (timeout 4000ms)
              Geolocation.getCurrentPosition(
                pos2 => {
                  if (!resolved) {
                    resolved = true;
                    if (pos2?.coords?.latitude && pos2?.coords?.longitude) {
                      resolve({
                        success: true,
                        lat: pos2.coords.latitude,
                        lng: pos2.coords.longitude,
                      });
                    } else if (user?.latitude && user?.longitude) {
                      resolve({
                        success: false,
                        lat: user.latitude,
                        lng: user.longitude,
                      });
                    } else {
                      resolve({success: false, lat: 11.0168, lng: 76.9558});
                    }
                  }
                },
                err2 => {
                  if (!resolved) {
                    resolved = true;
                    if (user?.latitude && user?.longitude) {
                      resolve({
                        success: false,
                        lat: user.latitude,
                        lng: user.longitude,
                      });
                    } else {
                      resolve({success: false, lat: 11.0168, lng: 76.9558});
                    }
                  }
                },
                {enableHighAccuracy: false, timeout: 4000, maximumAge: 60000},
              );
            }
          },
          {enableHighAccuracy: true, timeout: 5000, maximumAge: 30000},
        );
      } catch (e) {
        if (user?.latitude && user?.longitude) {
          resolve({success: false, lat: user.latitude, lng: user.longitude});
        } else {
          resolve({success: false, lat: 11.0168, lng: 76.9558});
        }
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
      cleanAddress.length < 15 ||
      !/\d/.test(cleanAddress)
    ) {
      Alert.alert(
        t('common.error', {defaultValue: 'பிழை'}),
        'வாடிக்கையாளர் கண்டிப்பாக கதவு எண், தெரு பெயர், பகுதி மற்றும் மாவட்டத்துடன் கூடிய முழு முகவரியை உள்ளிட வேண்டும்!\n\nCustomer must enter a complete address including Door Number, Street Name, Area, and District!',
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
      const firestore = require('@react-native-firebase/firestore').default;

      // Heuristic double-check: Verify stock in Firestore before proceeding with order placement
      for (const item of cartItems) {
        if (item.id) {
          const prodRef = firestore().collection('products').doc(item.id);
          const prodDoc = await prodRef.get();
          if (prodDoc.exists) {
            const dbStock = parseFloat(
              prodDoc.data().stock || prodDoc.data().stockQuantity || 0,
            );
            const reqQty = parseFloat(item.quantity) || 1;
            if (dbStock < reqQty) {
              const displayName = getLocalProductName(
                item.name,
                item.nameTa,
                i18n.language,
              );
              Alert.alert(
                t('common.error', {defaultValue: 'பிழை'}),
                `மன்னிக்கவும், '${displayName}' தேவையான அளவு கையிருப்பு இல்லை! (இருப்பு: ${dbStock} ${
                  item.unit || 'kg'
                }).\n\nSorry, '${displayName}' does not have enough stock available! (Available: ${dbStock} ${
                  item.unit || 'kg'
                }).`,
              );
              setIsLoading(false);
              return;
            }
          }
        }
      }

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
          const farmerSubtotal = items.reduce(
            (s, i) => s + (i.price || 0) * i.quantity,
            0,
          );
          const subtotal = items.reduce(
            (s, i) => s + (i.consumerPrice || i.price) * i.quantity,
            0,
          );
          const orderDiscount = 0; // Forced to 0 to disable discount
          const orderTotal = subtotal + deliveryFee;

          return createOrder({
            consumerId: user?.id || user?.uid,
            consumerName: customerName.trim(),
            consumerPhone: phone.trim(),
            farmerId,
            farmerName: items[0]?.farmerName || farmerProfile.name || '',
            farmerPhone: farmerProfile.phone || '',
            farmerLocation:
              items[0]?.farmerAddress ||
              farmerProfile.address ||
              farmerProfile.location ||
              '',
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
              price: i.consumerPrice || i.price, // Store consumer price (e.g. 42)
              basePrice: i.price, // Store base price for farmer visibility (e.g. 40)
              quantity: i.quantity,
              unit: i.unit,
              image: i.image,
            })),
            subtotal,
            discount: orderDiscount,
            deliveryFee: deliveryFee,
            total: orderTotal,
            farmerAmount: farmerSubtotal, // Farmer fixed amount without platform fees
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
                  height: 'auto',
                  paddingVertical: 10,
                },
              ]}
              onPress={fetchGPSLocation}
              disabled={fetchingLocation}>
              <View style={{flex: 1, marginRight: 8}}>
                <Text
                  style={{
                    color: consumerLocation
                      ? isDark
                        ? '#4CAF50'
                        : COLORS.primaryGreen
                      : COLORS.accentRed,
                    fontWeight: 'bold',
                    fontSize: rs(FONTS.sm) - 1.5,
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
              </View>
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
              onChangeText={text => {
                if (text.includes('@') || /[a-zA-Z]/.test(text)) {
                  return;
                }
                setPhone(text.replace(/[^0-9]/g, ''));
              }}
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
                ? t('checkout.freeLabel', {defaultValue: 'இலவசம்!'})
                : `₹${deliveryFee}`}
            </Text>
          </View>
          {!!discount && (
            <View style={styles.priceRow}>
              <Text style={[styles.priceLabel, {color: '#FF5252'}]}>
                🎁{' '}
                {t('checkout.bulkDiscount', {
                  defaultValue: 'கூட்டு தள்ளுபடி (5%)',
                })}
              </Text>
              <Text
                style={[
                  styles.priceVal,
                  {color: '#FF5252', fontWeight: 'bold'},
                ]}>
                -₹{discount}
              </Text>
            </View>
          )}
          {deliveryFee === 0 && (
            <Text
              style={{
                fontSize: rs(11),
                color: isDark ? '#81C784' : COLORS.primaryGreen,
                textAlign: 'right',
                marginTop: -4,
                marginBottom: 6,
              }}>
              {t('checkout.free', {
                defaultValue: 'முதல் 3 மாதங்களுக்கு இலவச டெலிவரி!',
              })}
            </Text>
          )}
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
